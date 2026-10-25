// REQ-268: una comida se compone de líneas reales (alimento + gramos decimales)
// que se pueden editar o quitar; los totales salen de las líneas y la lista de
// compra usa esas cantidades. Registrar no toca el catálogo global.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges, completePrefs, USER_ID, todayYmd } from "./helpers.js";

const tenth = (n) => String(Math.round(n * 10) / 10).replace(".", ",");
async function setup(page, context, opts = {}) {
  const mocks = await installMocks(context, opts);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const errors = collectConsoleErrors(page);
  await gotoApp(page);
  await page.locator("#tabs").getByText("Nutrición").click();
  return { overlay: page.locator("#overlay"), errors, calls: mocks.calls };
}
async function addFood(overlay, query, grams) {
  await overlay.locator('.qp-tab[data-tab="food"]').click();
  await overlay.locator("#qpSearch").fill(query);
  await overlay.locator("#qpGrams0").fill(grams);
  await overlay.getByRole("button", { name: "Añadir" }).first().click();
}

test("gramos decimales sin redondear, editar y quitar líneas, y reabrir con su snapshot", async ({ page, context }) => {
  const { overlay, errors, calls } = await setup(page, context);
  const catalogBefore = await page.evaluate(() => JSON.stringify(DB.ingredients));
  await page.getByRole("button", { name: /Agregar comida \/ snack/i }).first().click();
  await addFood(overlay, "avena", "33,5");
  await addFood(overlay, "avena", "0,5");
  await expect(overlay.locator(".comp-row")).toHaveCount(2);
  // 34 g reales (antes: 34 g + 1 g por redondear cada línea).
  await expect(overlay.locator("#f_kcal")).toHaveValue(tenth(389 * 0.34));
  await expect(overlay.locator("#f_name")).toHaveValue("Avena 33,5 g + Avena 0,5 g");
  await addFood(overlay, "platano", "120");
  await expect(overlay.locator("#f_kcal")).toHaveValue(tenth(389 * 0.34 + 89 * 1.2));

  // Corregir una línea y quitar otra recalcula sin rehacer cuentas.
  await overlay.getByLabel("Cantidad de Avena (g)").first().fill("40");
  await overlay.getByLabel("Cantidad de Avena (g)").first().blur();
  await overlay.getByRole("button", { name: "Quitar Avena" }).nth(1).click();
  await expect(overlay.locator(".comp-row")).toHaveCount(2);
  await expect(overlay.locator("#f_kcal")).toHaveValue(tenth(389 * 0.4 + 89 * 1.2));
  await expect(overlay.locator("#f_name")).toHaveValue("Avena 40 g + Plátano 120 g");
  await overlay.getByRole("button", { name: "Guardar", exact: true }).click();

  const saved = await page.evaluate(() => dayState(todayStr()).extras[0]);
  expect(saved).toMatchObject({ name: "Avena 40 g + Plátano 120 g", kcal: Math.round((389 * 0.4 + 89 * 1.2) * 10) / 10 });
  expect(saved.components.map((c) => [c.name, c.unit, c.amount, c.base.kcal])).toEqual([["Avena", "100g", 40, 389], ["Plátano", "100g", 120, 89]]);
  expect(saved.nutritionMeta).toEqual({ v: 1, source: "catalog" });

  // Reabrir no depende del catálogo: las líneas traen su base.
  await page.evaluate(() => { DB.ingredients = []; editExtra(todayStr(), 0); });
  await expect(overlay.locator(".comp-row")).toHaveCount(2);
  await expect(overlay.getByLabel("Cantidad de Plátano (g)")).toHaveValue("120");
  await overlay.getByLabel("Cantidad de Plátano (g)").fill("60,5");
  await overlay.getByLabel("Cantidad de Plátano (g)").blur();
  await overlay.getByRole("button", { name: "Guardar", exact: true }).click();
  expect((await page.evaluate(() => dayState(todayStr()).extras[0])).kcal).toBe(Math.round((389 * 0.4 + 89 * 0.605) * 10) / 10);

  // El catálogo global no se tocó.
  expect(calls.some((c) => c.table === "ingredients" && c.method !== "GET")).toBe(false);
  await page.evaluate((json) => { DB.ingredients = JSON.parse(json); }, catalogBefore);
  expect(errors).toEqual([]);
});

test("una favorita elegida antes se conserva como primera línea al sumar un alimento", async ({ page, context }) => {
  const prefs = completePrefs({ savedMeals: [{ name: "Yogur con miel", kcal: 180, p: 10, c: 25, f: 4 }] });
  const { overlay } = await setup(page, context, { prefs });
  await page.getByRole("button", { name: /Agregar comida \/ snack/i }).first().click();
  await overlay.locator(".qp-pick", { hasText: "Yogur con miel" }).click();
  await overlay.getByRole("button", { name: "×2" }).click();
  await addFood(overlay, "almendras", "15");
  await expect(overlay.locator(".comp-row")).toHaveCount(2);
  await expect(overlay.getByLabel("Cantidad de Yogur con miel (porciones)")).toHaveValue("2");
  await expect(overlay.locator("#f_kcal")).toHaveValue(tenth(360 + 579 * 0.15));
  await overlay.getByRole("button", { name: "Guardar", exact: true }).click();
  const saved = await page.evaluate(() => dayState(todayStr()).extras[0]);
  expect(saved.portion).toBeUndefined();
  expect(saved.components[0]).toMatchObject({ name: "Yogur con miel", unit: "portion", amount: 2, base: { kcal: 180 } });
  expect(saved.nutritionMeta.source).toBe("manual");
});

test("receta del plan: ajustar gramos de sus ingredientes y que la lista de compra lo refleje", async ({ page, context }) => {
  const planned = { done: false, ovr: {
    name: "Bowl de pollo", dishName: "Bowl de pollo", gen: true, kcal: 495, p: 49, c: 56, f: 8,
    ingredientes: [{ nombre: "Pechuga de pollo", gramos: 150 }, { nombre: "Arroz blanco cocido", gramos: 200 }],
  } };
  const { overlay } = await setup(page, context, { tables: { day_log: { rows: [{
    user_id: USER_ID, log_date: todayYmd(), plan_version_id: null, updated_at: new Date().toISOString(),
    state: { meals: { almuerzo: planned }, extras: [], workoutDone: false },
  }] } } });
  const before = await page.evaluate(() => shoppingList("rest").items.filter((i) => /arroz|pollo/i.test(i.name)).map((i) => [i.name, i.grams]));
  expect(before).toContainEqual(["Arroz blanco cocido", 200]);

  await page.evaluate(() => openEditor("meal", todayStr(), "almuerzo"));
  await overlay.getByRole("button", { name: "Ajustar ingredientes de la receta" }).click();
  await expect(overlay.locator(".comp-row")).toHaveCount(2);
  await overlay.getByLabel("Cantidad de Arroz blanco cocido (g)").fill("120");
  await overlay.getByLabel("Cantidad de Arroz blanco cocido (g)").blur();
  await expect(overlay.locator("#f_kcal")).toHaveValue(tenth(165 * 1.5 + 130 * 1.2));
  await expect(overlay.locator("#f_name")).toHaveValue("Bowl de pollo");
  await overlay.getByRole("button", { name: "Guardar", exact: true }).click();

  const ovr = await page.evaluate(() => mealState(todayStr(), "almuerzo").ovr);
  expect(ovr.nutritionMeta).toEqual({ v: 1, source: "recipe", ref: { kind: "recipe", name: "Bowl de pollo" } });
  expect(ovr.components.map((c) => c.amount)).toEqual([150, 120]);
  const after = await page.evaluate(() => shoppingList("rest").items.filter((i) => /arroz|pollo/i.test(i.name)).map((i) => [i.name, i.grams]));
  expect(after).toContainEqual(["Arroz blanco cocido", 120]);
  await expect(page.locator(".meal", { hasText: "Bowl de pollo" }).locator(".recipe")).toContainText("cantidades que registraste");
});

test("una entrada antigua sin líneas sigue editándose a mano", async ({ page, context }) => {
  const { overlay } = await setup(page, context);
  await page.evaluate(() => {
    const d = dayState(todayStr());
    d.extras.push({ name: "Avena 34 g + Plátano 120 g", kcal: 239, p: 7, c: 50, f: 3, done: true, oid: nextExtraOid(d) });
    commitDay(todayStr()); render(); editExtra(todayStr(), 0);
  });
  await expect(overlay.locator(".comp-row")).toHaveCount(0);
  await expect(overlay.locator("#f_components")).toBeHidden();
  await overlay.locator("#f_kcal").fill("250");
  await overlay.getByRole("button", { name: "Guardar", exact: true }).click();
  const saved = await page.evaluate(() => dayState(todayStr()).extras[0]);
  expect(saved.components).toBeUndefined();
  expect(saved.kcal).toBe(250);
});
