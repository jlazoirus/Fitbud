// REQ-169: lo que el usuario descarta en el borrador del día no vuelve al regenerar.
// REQ-170: un plato de almuerzo propuesto para el desayuno no llega al borrador.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges } from "./helpers.js";
import { buildMealsForTargets } from "./fixtures/catalog.js";

const mealTitles = (overlay) => overlay.locator(".opt > b").allInnerTexts();

test.describe("Descartes y momento del día en el borrador", () => {
  test("No me gusta saca el plato del borrador y no vuelve al preparar de nuevo", async ({ page, context }) => {
    const { calls } = await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);

    await page.getByRole("button", { name: /Preparar mi día/i }).first().click();
    const overlay = page.locator("#overlay");
    await expect(overlay).toContainText(/Total del día/i, { timeout: 15_000 });
    const before = await mealTitles(overlay);
    const rejected = before.find((name) => name !== "Bowl proteico de la mañana");
    expect(rejected, "el borrador trae una comida que descartar").toBeTruthy();

    const card = overlay.locator(".opt", { has: page.locator("b", { hasText: rejected }) });
    await card.getByRole("button", { name: /No me gusta/i }).click();
    await expect.poll(() => mealTitles(overlay)).not.toContain(rejected);

    await overlay.getByRole("button", { name: "Descartar" }).click();
    await page.getByRole("button", { name: /Preparar mi día/i }).first().click();
    await expect(overlay).toContainText(/Total del día/i, { timeout: 15_000 });

    const prompts = calls.filter((c) => c.table === "/api/claude").map((c) => String(c.payload.userText || ""));
    const last = prompts.at(-1);
    expect(last).toContain(`Hoy el usuario ya descartó: ${rejected}`);
    expect(last).toContain("±50 kcal de");
    // El mock vuelve a proponer exactamente lo mismo; el cierre del día lo filtra.
    expect(await mealTitles(overlay)).not.toContain(rejected);
    expect(errors).toEqual([]);
  });

  test("un plato de almuerzo propuesto para el desayuno no llega al borrador", async ({ page, context }) => {
    await installMocks(context);
    await context.route("**/api/claude", (route) => {
      const payload = JSON.parse(route.request().postData() || "{}");
      const text = String(payload.userText || "");
      const m = text.match(/Metas del día:\s*(\d+)\s*kcal,\s*(\d+)\s*g proteína,\s*(\d+)\s*g carbohidratos,\s*(\d+)\s*g grasa/);
      const target = { kcal: +m[1], p: +m[2], c: +m[3], f: +m[4] };
      const slotIds = [...text.match(/"slot_id"\):\s*([^\n]+)/)[1].matchAll(/(?:^|,\s*)([a-z0-9_]+)\s*\(/g)].map((x) => x[1]);
      const comidas = buildMealsForTargets(target, slotIds).map((c) => c.slot_id === "desayuno" ? { ...c, nombre: "Arroz con pollo casero" } : c);
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ text: JSON.stringify({ explicacion: "Día armado.", comidas }) }) });
    });
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    await gotoApp(page);

    await page.getByRole("button", { name: /Preparar mi día/i }).first().click();
    const overlay = page.locator("#overlay");
    await expect(overlay).toContainText(/Total del día/i, { timeout: 15_000 });
    await expect(overlay).toContainText("no es una opción típica para desayuno");
    expect(await mealTitles(overlay)).not.toContain("Arroz con pollo casero");
  });
});
