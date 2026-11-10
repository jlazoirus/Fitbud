// Journey (e): navegación entre tabs y estados vacíos sin errores de consola.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges, SUPA_URL, USER_EMAIL } from "./helpers.js";

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

  test("sin sesión la app muestra su inicio de sesión, no las tabs ni la portada (REQ-352)", async ({ page, context }) => {
    await installMocks(context);
    const errors = collectConsoleErrors(page);

    await gotoApp(page);

    await expect(page.locator("#tabs")).toBeEmpty();
    await expect(page.locator("#au_email")).toBeVisible();
    await expect(page.locator(".landing")).toHaveCount(0);
    // Nunca menciona vocabulario interno de IA (REQ-31)
    const bodyText = await page.locator("#app").innerText();
    expect(bodyText).not.toMatch(/\b(Claude|Anthropic|prompt|tokens?)\b/i);

    expect(errors, `Errores de consola en la landing:\n${errors.join("\n")}`).toEqual([]);
  });

  test("REQ-375: Entrar muestra progreso, evita duplicados y permite reintentar", async ({ page, context }) => {
    await installMocks(context);
    let attempts = 0;
    let releaseFirstAttempt;
    const firstAttemptReleased = new Promise(resolve => { releaseFirstAttempt = resolve; });
    await context.route(url => url.href === SUPA_URL + "/auth/v1/token?grant_type=password", async route => {
      attempts += 1;
      if (attempts > 1) return route.fallback();
      await firstAttemptReleased;
      await route.fulfill({
        status: 400,
        json: { code: "invalid_credentials", message: "Invalid login credentials" },
      });
    });

    await gotoApp(page);
    const button = page.locator("#auSubmit");
    const email = page.getByLabel("Correo", { exact: true });
    const password = page.getByLabel("Contraseña", { exact: true });
    try {
      await button.click();
      await expect(page.locator("#auOut")).toHaveText("Pon correo y contraseña");
      await expect(button).toBeEnabled();
      expect(attempts).toBe(0);

      await email.fill(USER_EMAIL);
      await password.fill("ClaveDePrueba");
      await button.click();
      await expect(button).toHaveAccessibleName("Iniciando sesión…");
      await expect(button).toHaveAttribute("aria-busy", "true");
      await expect(button).toBeDisabled();
      await expect(button.locator(".spinner")).toBeVisible();
      await expect(page.locator("#auStatus")).toHaveText("Iniciando sesión…");
      await expect(page.getByRole("button", { name: "Olvidé mi contraseña" })).toBeDisabled();
      await expect.poll(() => attempts).toBe(1);

      await page.evaluate(() => {
        document.getElementById("auSubmit").click();
        return doAuth();
      });
      expect(attempts).toBe(1);
    } finally {
      releaseFirstAttempt();
    }

    await expect(page.locator("#auOut")).toContainText("Invalid login credentials");
    await expect(button).toHaveAccessibleName("Entrar");
    await expect(button).toBeEnabled();
    await expect(button.locator(".spinner")).toBeHidden();
    await expect(page.locator("#auStatus")).toBeEmpty();
    await expect(page.getByRole("button", { name: "Olvidé mi contraseña" })).toBeEnabled();
    await expect(email).toHaveValue(USER_EMAIL);
    await expect(password).toHaveValue("ClaveDePrueba");

    await button.click();
    await expect(page.locator("#tabs").getByText("Hoy")).toBeVisible();
    await expect(button).toHaveCount(0);
    expect(attempts).toBe(2);
  });

  test("REQ-151/352: la portada pinta los planes de la tienda aunque su catálogo llegue tarde", async ({ page, context }) => {
    await installMocks(context);
    // REQ-352: la portada lee tienda/planes.js (no /api/catalog). Se retrasa para ver que
    // el resto de la página ya está y las tarjetas aparecen solas al llegar el catálogo.
    let releaseCatalog;
    const catalogReleased = new Promise(resolve => { releaseCatalog = resolve; });
    await context.route("**/tienda/planes.js", async (route) => {
      await catalogReleased;
      await route.continue();
    });
    const errors = collectConsoleErrors(page);

    // El módulo de la portada espera el catálogo, así que el "load" de la página también: no esperarlo.
    await page.goto("/", { waitUntil: "commit" });
    await expect(page.locator(".landing h1")).toBeVisible();

    // Justo tras el primer render (antes de que resuelva /api/catalog) no hay tarjetas todavía.
    await expect(page.locator(".l-plan")).toHaveCount(0);
    releaseCatalog();
    // Sin ninguna interacción del usuario, deben aparecer solas cuando el catálogo carga.
    await expect(page.locator(".l-plan")).toHaveCount(3, { timeout: 5_000 });

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

  test("REQ-197/352: la portada se pinta sin esperar a /api/config ni a Supabase", async ({ page, context }) => {
    await installMocks(context);
    let configAt = 0;
    await context.route("**/api/config", async () => { configAt = Date.now(); }); // colgada a propósito
    const errors = collectConsoleErrors(page);
    await page.goto("/");
    await expect(page.locator(".landing h1")).toBeVisible({ timeout: 3_000 });
    const item = page.locator(".l-faq-item").first();
    await item.locator("summary").click();
    await expect(item).toHaveAttribute("open", "");
    // REQ-376: la medición pide /api/config recién después de `load` y la portada no la espera.
    await expect.poll(() => configAt).toBeGreaterThan(0);
    const loadAt = await page.evaluate(() => performance.timeOrigin + performance.getEntriesByType("navigation")[0].loadEventEnd);
    expect(configAt).toBeGreaterThanOrEqual(Math.floor(loadAt) - 50);
    expect(errors).toEqual([]);
  });

  test("REQ-197: con sesión guardada no se muestra la portada mientras se resuelve", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await page.goto("/app/");
    await expect(page.locator(".landing")).toHaveCount(0);
    await gotoApp(page);
    await expect(page.locator("#tabs")).toContainText("Hoy");
  });
});
