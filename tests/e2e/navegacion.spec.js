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
});
