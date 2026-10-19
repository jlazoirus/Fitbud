// REQ-198: portada "Escalera de días".
import { test, expect } from "@playwright/test";
import { installMocks, collectConsoleErrors, gotoApp } from "./helpers.js";

test.describe("Portada", () => {
  test("la demo del día cambia el plan con cada imprevisto y vuelve al tocarlo otra vez", async ({ page, context }) => {
    await installMocks(context);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);

    const demo = page.locator(".l-demo");
    await expect(demo).toContainText("Ejemplo");
    const train = demo.locator('[data-row="train"] .l-demo-name');
    await expect(train).toHaveText("Fuerza · Tren superior");

    const corto = demo.getByRole("button", { name: "Solo tengo 20 min" });
    await corto.click();
    await expect(corto).toHaveAttribute("aria-pressed", "true");
    await expect(train).toHaveText("Circuito exprés");

    await demo.getByRole("button", { name: "Como fuera" }).click();
    await expect(corto).toHaveAttribute("aria-pressed", "false");
    await expect(demo.locator('[data-row="lunch"] .l-demo-name')).toContainText("Pollo a la brasa");
    await expect(train).toHaveText("Fuerza · Tren superior");

    await demo.getByRole("button", { name: "Como fuera" }).click();
    await expect(demo.locator('[data-row="lunch"] .l-demo-name')).toHaveText("Arroz con lentejas y huevo");
    expect(errors).toEqual([]);
  });

  test("sin emoji ni vocabulario interno; los CTA llevan a postular a la beta (REQ-202)", async ({ page, context }) => {
    await installMocks(context);
    await gotoApp(page);
    const text = await page.locator(".landing").innerText();
    expect(text).not.toMatch(/\p{Emoji_Presentation}/u);
    expect(text).not.toMatch(/\b(IA|Claude|Anthropic|prompt|tokens?|modelo de lenguaje)\b/i);
    expect(text).not.toMatch(/Perú|Chile|México/); // REQ-223
    await expect(page.locator(".l-step")).toHaveCount(5);
    const apply = page.getByRole("link", { name: "Postular a la beta" });
    // hero + CTA final + un botón por plan (REQ-205: beta cerrada)
    expect(await apply.count()).toBeGreaterThanOrEqual(3);
    await expect(page.locator(".l-plan a.l-btn").first()).toHaveAttribute("href", "beta-reclutamiento.html?source=portada-planes");
    await expect(apply.first()).toHaveAttribute("href", "beta-reclutamiento.html?source=portada");
    await apply.first().click();
    await expect(page.locator("h1")).toContainText("Úsalo gratis tres meses");
    await gotoApp(page);
    await page.getByRole("button", { name: "Ya tengo cuenta" }).click();
    await expect(page.locator("#au_email")).toBeVisible();
  });

  // REQ-219: con el registro abierto, toda la portada ofrece crear cuenta (no postular),
  // también cuando el modo llega después del pintado optimista.
  test("con SIGNUP_MODE=open, hero, navegación, planes y cierre llevan al registro", async ({ page, context }) => {
    await installMocks(context);
    let release;
    const gate = new Promise((r) => { release = r; });
    await page.route("**/api/config", async (route) => {
      await gate; // la portada se pinta antes de conocer el modo (REQ-197)
      route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ supabase: { url: "https://e2emock.supabase.co", publishableKey: "e2e-publishable-key" }, anthropic: { model: "", proxy: true }, signup: { mode: "open" } }) });
    });
    await gotoApp(page);
    await expect(page.getByRole("link", { name: "Postular a la beta" }).first()).toBeVisible();
    await page.locator(".l-faq-item summary").first().click();
    release();
    await expect(page.locator('.landing a[href*="beta-reclutamiento.html"]')).toHaveCount(0);
    await expect(page.locator(".landing")).not.toContainText(/beta/i);
    await expect(page.locator(".l-hero-ctas").getByRole("button", { name: "Empezar ahora" })).toBeVisible();
    await expect(page.locator(".landing-nav").getByRole("button", { name: "Empezar" })).toBeVisible();
    await expect(page.locator(".l-faq-item").first()).toHaveAttribute("open", "");
    await page.locator(".l-cta-final").getByRole("button", { name: "Empezar ahora" }).click();
    await expect(page.locator("#au_email")).toBeVisible();
  });

  test.describe("escritorio", () => {
    test.use({ viewport: { width: 1440, height: 900 } });
    test("la escalera se enciende peldaño a peldaño al bajar", async ({ page, context }) => {
      await installMocks(context);
      await gotoApp(page);
      const rail = page.locator(".l-stair-rail");
      await expect(rail).toBeVisible();
      await expect(rail).toHaveAttribute("data-lit", "1");

      await rail.getByRole("button", { name: "Cada semana" }).click();
      await expect(rail).toHaveAttribute("data-lit", "4");
      await expect(rail.locator(".tr.lit")).toHaveCount(4);
      await expect(rail.getByRole("button", { name: "Cada semana" })).toHaveAttribute("aria-current", "step");
      // Sigue a la vista (sticky) mientras se recorren los escalones
      expect(await rail.evaluate((el) => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; })).toBe(true);
    });
  });
});
