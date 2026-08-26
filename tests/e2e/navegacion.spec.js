// Journey (e): navegación entre tabs y estados vacíos sin errores de consola.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges } from "./helpers.js";

test.describe("Navegación", () => {
  test("usuario logueado recorre las 5 tabs sin errores de consola", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);

    await gotoApp(page);

    // Arranca en Hoy con la barra de tabs anclada
    const tabs = page.locator("#tabs");
    await expect(tabs).toBeVisible();
    await expect(tabs.getByText("Hoy")).toBeVisible();

    // Recorrido completo: cada tab renderiza contenido propio
    const app = page.locator("#app");
    await tabs.getByText("Nutrición").click();
    await expect(app).toContainText(/Nutrición|kcal/i);

    await tabs.getByText("Entreno").click();
    await expect(app).toContainText(/Entreno|Sesión|Descanso/i);

    await tabs.getByText("Progreso").click();
    await expect(app).toContainText(/Progreso|Peso/i);

    await tabs.getByText("Perfil").click();
    await expect(app).toContainText(/Perfil|Cerrar sesión/i);

    await tabs.getByText("Hoy").click();
    await expect(app).not.toBeEmpty();

    expect(errors, `Errores de consola durante la navegación:\n${errors.join("\n")}`).toEqual([]);
  });

  test("sin sesión se muestra la landing, no las tabs", async ({ page, context }) => {
    await installMocks(context);
    const errors = collectConsoleErrors(page);

    await gotoApp(page);

    await expect(page.locator("#tabs")).toBeEmpty();
    await expect(page.locator("#app")).toContainText(/Fitbros/i);
    // La landing nunca menciona vocabulario interno de IA (REQ-31)
    const bodyText = await page.locator("#app").innerText();
    expect(bodyText).not.toMatch(/\b(Claude|Anthropic|prompt|tokens?)\b/i);

    expect(errors, `Errores de consola en la landing:\n${errors.join("\n")}`).toEqual([]);
  });

  test("REQ-151: la landing pinta los planes aunque el catálogo cargue después del primer render", async ({ page, context }) => {
    await installMocks(context);
    // Retrasa /api/catalog para forzar que refreshAuth() (sin sesión) gane la
    // carrera y boot() pinte la landing ANTES de que catalogPlans esté poblado.
    await context.route("**/api/catalog", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ plans: [] }) });
    });
    const errors = collectConsoleErrors(page);

    await gotoApp(page);

    // Justo tras el primer render (antes de que resuelva /api/catalog) no hay tarjetas todavía.
    await expect(page.locator(".l-plan")).toHaveCount(0);
    // Sin ninguna interacción del usuario, deben aparecer solas cuando el catálogo carga.
    await expect(page.locator(".l-plan")).toHaveCount(2, { timeout: 5_000 });

    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  test("REQ-113: el campo de contraseña permite mostrar y ocultar sin enviar", async ({ page, context }) => {
    await installMocks(context);
    const errors = collectConsoleErrors(page);

    await gotoApp(page);
    await page.evaluate(() => {
      window._showAuth = true;
      window._authMode = "in";
      render();
    });

    const password = page.locator("#au_pwd");
    const toggle = page.locator('button[aria-controls="au_pwd"]');
    await expect(password).toHaveAttribute("type", "password");
    await expect(toggle).toHaveAttribute("aria-label", "Mostrar contraseña");

    await password.fill("ClaveVisible123");
    await toggle.click();
    await expect(password).toHaveAttribute("type", "text");
    await expect(password).toHaveValue("ClaveVisible123");
    await expect(toggle).toHaveAttribute("aria-label", "Ocultar contraseña");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#auOut")).toBeEmpty();

    await toggle.click();
    await expect(password).toHaveAttribute("type", "password");
    await expect(password).toHaveValue("ClaveVisible123");
    await expect(toggle).toHaveAttribute("aria-label", "Mostrar contraseña");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");

    expect(errors, `Errores de consola en toggle de contraseña:\n${errors.join("\n")}`).toEqual([]);
  });
});
