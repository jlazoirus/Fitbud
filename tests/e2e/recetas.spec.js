// REQ-275: recetas privadas con rendimiento por porciones y/o peso final.
// Guardar la receta es independiente de registrarla; registrar una parte guarda
// la base de esa versión y editar la receta después no reescribe el pasado.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges, completePrefs } from "./helpers.js";

const tenth = (n) => String(Math.round(n * 10) / 10).replace(".", ",");
async function setup(page, context, prefs) {
  const mocks = await installMocks(context, prefs ? { prefs } : {});
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const errors = collectConsoleErrors(page);
  await gotoApp(page);
  await page.locator("#tabs").getByText("Nutrición").click();
  return { overlay: page.locator("#overlay"), errors, calls: mocks.calls };
}
const savedRecipes = (calls) => {
  const saved = calls.filter((c) => c.table === "profiles" && c.payload && c.payload.prefs && c.payload.prefs.customRecipes);
  return saved.length ? saved.at(-1).payload.prefs.customRecipes : undefined;
};
async function addLine(overlay, query, amount) {
  await overlay.locator("#rcSearch").fill(query);
  await overlay.locator("#rcAmt0").fill(amount);
  await overlay.locator("#rcResults").getByRole("button", { name: "Añadir" }).first().click();
}
// Arroz 400 g cocido + pollo 600 g = 520 + 990 = 1510 kcal.
const TOTAL = 130 * 4 + 165 * 6;

test("crear receta de 4 porciones y 1000 g, registrar 1/4 y 150 g", async ({ page, context }) => {
  const { overlay, errors, calls } = await setup(page, context);
  await page.evaluate(() => openNutritionMoreMenu());
  await overlay.getByRole("button", { name: "Mis recetas" }).click();
  await expect(overlay).toContainText("Aún no tienes recetas.");
  await overlay.getByRole("button", { name: "＋ Nueva receta" }).click();

  await overlay.getByRole("button", { name: "Guardar receta" }).click();
  await expect(overlay.locator("#rc_errors")).toContainText("Nombre: Pon el nombre de la receta.");
  await expect(overlay.locator("#rc_errors")).toContainText("Ingredientes: Añade al menos un ingrediente.");
  await expect(overlay.locator("#rc_errors")).toContainText("Rendimiento: Indica cuántas porciones rinde o cuánto pesa ya cocinada.");
  expect(savedRecipes(calls)).toBeUndefined();

  await overlay.locator("#rc_name").fill("Arroz con pollo de casa");
  await addLine(overlay, "arroz", "400");
  await addLine(overlay, "pechuga", "600");
  await overlay.locator("#rc_servings").fill("4");
  await overlay.locator("#rc_weight").fill("1000");
  await expect(overlay.locator("#rcPreview")).toContainText(`Receta completa: ${TOTAL} kcal`);
  await expect(overlay.locator("#rcPreview")).toContainText(`Por porción: ${Math.round(TOTAL / 4)} kcal`);
  await overlay.locator("#rc_steps").fill("Sofreír, añadir arroz y cocer 20 min.");
  await overlay.getByRole("button", { name: "Guardar receta" }).click();
  await expect(overlay).toContainText("Mis recetas");
  await expect(overlay).toContainText("2 ingredientes · 1510 kcal en total · rinde 4 porciones · 1000 g cocinada");
  const recipes = savedRecipes(calls);
  expect(recipes).toHaveLength(1);
  expect(recipes[0]).toMatchObject({ name: "Arroz con pollo de casa", yield: { servings: 4, weight: 1000 }, steps: "Sofreír, añadir arroz y cocer 20 min.", version: 1 });
  // Guardar la receta no registra nada.
  expect(await page.evaluate(() => dayState(todayStr()).extras.length)).toBe(0);

  await page.evaluate(() => closeModal());
  await page.getByRole("button", { name: /Agregar comida \/ snack/i }).first().click();
  await overlay.locator('.qp-tab[data-tab="food"]').click();
  await overlay.locator("#qpSearch").fill("arroz con pollo");
  const row = overlay.locator("#qpList .qp-item", { hasText: "Arroz con pollo de casa" });
  await expect(row).toContainText("Receta");
  await row.getByLabel("Cantidad de Arroz con pollo de casa").fill("1");
  await row.getByRole("button", { name: "Añadir" }).click();
  await expect(overlay.locator("#f_kcal")).toHaveValue(tenth(TOTAL / 4));
  await overlay.locator("#qpSearch").fill("arroz con pollo");
  await row.getByLabel("Unidad de Arroz con pollo de casa").selectOption("100g");
  await row.getByLabel("Cantidad de Arroz con pollo de casa").fill("150");
  await row.getByRole("button", { name: "Añadir" }).click();
  await expect(overlay.locator("#f_kcal")).toHaveValue(tenth(TOTAL / 4 + TOTAL * 150 / 1000));
  await overlay.getByRole("button", { name: "Guardar", exact: true }).click();
  const extra = await page.evaluate(() => dayState(todayStr()).extras[0]);
  expect(extra.components.map((c) => [c.unit, c.amount, Math.round(c.base.kcal * 10) / 10])).toEqual([["portion", 1, Math.round(TOTAL / 4 * 10) / 10], ["100g", 150, Math.round(TOTAL / 10 * 10) / 10]]);
  expect(extra.components[0].ref).toEqual({ kind: "recipe", id: recipes[0].id, version: 1 });
  expect(extra.nutritionMeta).toEqual({ v: 1, source: "recipe" });
  expect(errors).toEqual([]);
});

test("cambiar el rendimiento y luego eliminar la receta no reescribe lo registrado", async ({ page, context }) => {
  const recipe = { id: "rcasa001", name: "Lentejas", version: 1, yield: { servings: 4 },
    lines: [{ name: "Papa cocida", unit: "100g", amount: 500, base: { kcal: 87, p: 1.9, c: 20, f: 0.1 }, ref: { kind: "ingredient", id: "8" } }] };
  const { overlay, calls } = await setup(page, context, completePrefs({ customRecipes: [recipe] }));
  await page.getByRole("button", { name: /Agregar comida \/ snack/i }).first().click();
  await overlay.locator('.qp-tab[data-tab="food"]').click();
  await overlay.locator(".qp-item", { hasText: "Lentejas" }).getByRole("button", { name: "Añadir" }).click();
  await overlay.getByRole("button", { name: "Guardar", exact: true }).click();
  const before = await page.evaluate(() => dayState(todayStr()).extras[0]);
  expect(before.kcal).toBe(Math.round(87 * 5 / 4 * 10) / 10);

  await page.evaluate(() => openRecipes());
  await overlay.getByRole("button", { name: "Editar Lentejas" }).click();
  await overlay.locator("#rc_servings").fill("2");
  await overlay.getByRole("button", { name: "Guardar receta" }).click();
  await expect(overlay).toContainText("rinde 2 porciones");
  expect(savedRecipes(calls)[0]).toMatchObject({ id: "rcasa001", version: 2, yield: { servings: 2 } });
  expect(await page.evaluate(() => dayState(todayStr()).extras[0])).toEqual(before);

  page.once("dialog", (d) => d.accept());
  await overlay.getByRole("button", { name: "Editar Lentejas" }).click();
  await overlay.getByRole("button", { name: "Eliminar" }).click();
  await expect(overlay).toContainText("Aún no tienes recetas.");
  const last = calls.filter((c) => c.table === "profiles" && c.payload && c.payload.prefs).at(-1).payload.prefs;
  expect(last.customRecipes).toEqual([]);
  expect(last.customRecipesDeleted).toEqual(["rcasa001"]);
  expect(await page.evaluate(() => dayState(todayStr()).extras[0])).toEqual(before);
});
