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

  test("sin emoji ni vocabulario interno, y los CTA llevan al registro", async ({ page, context }) => {
    await installMocks(context);
    await gotoApp(page);
    const text = await page.locator(".landing").innerText();
    expect(text).not.toMatch(/\p{Emoji_Presentation}/u);
    expect(text).not.toMatch(/\b(IA|Claude|Anthropic|prompt|tokens?|modelo de lenguaje)\b/i);
    await expect(page.locator(".l-step")).toHaveCount(5);
    await page.getByRole("button", { name: "Crear mi cuenta gratis" }).first().click();
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
