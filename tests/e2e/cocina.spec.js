// REQ-254: "¿Cuánto cocinas?" filtra lo que propone el plan; "Cambiar comida"
// ofrece "Más fácil de preparar" y "Sin cocina" que filtran de verdad.
// REQ-143: quien elige 2 comidas ve un aviso de que el plan cuadra peor.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges, completePrefs, USER_ID, todayYmd } from "./helpers.js";
import { INGREDIENTS } from "./fixtures/catalog.js";

const ing = (name) => INGREDIENTS.find((i) => i.name === name).id;
let nextId = 900;
function dish(name, slot, level, lines) {
  const id = nextId++;
  return {
    row: { id, name, slot, menu: null, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), compatible_slots: [slot], diet_tags: ["omnivoro"], cuisine_tags: [], cooking_level: level },
    lines: lines.map(([n, g]) => ({ dish_id: id, ingredient_id: ing(n), grams: g })),
  };
}
const CATALOG = [
  dish("Avena lista con yogur", "desayuno", "none", [["Avena", 60], ["Yogur griego 0%", 250], ["Plátano", 100]]),
  dish("Guiso de pollo con papa", "almuerzo", "cook", [["Pechuga de pollo", 180], ["Papa cocida", 250], ["Aceite de oliva", 8]]),
  dish("Pollo a la plancha con arroz", "almuerzo", "basic", [["Pechuga de pollo", 180], ["Arroz blanco cocido", 200], ["Aceite de oliva", 8]]),
  dish("Bowl de atún con arroz listo", "almuerzo", "none", [["Atún en agua", 160], ["Arroz blanco cocido", 200], ["Palta", 50]]),
  dish("Yogur con almendras", "snack", "none", [["Yogur griego 0%", 200], ["Almendras", 20]]),
  dish("Pescado al horno con verduras", "cena", "cook", [["Atún en agua", 150], ["Papa cocida", 200], ["Brócoli", 150], ["Aceite de oliva", 10]]),
];
const catalogTables = () => ({ dishes: { rows: CATALOG.map((x) => x.row) }, dish_ingredients: { rows: CATALOG.flatMap((x) => x.lines) } });

async function boot(page, context, { prefs = {}, tables = {} } = {}) {
  const mocks = await installMocks(context, { prefs: completePrefs(prefs), tables: { ...catalogTables(), ...tables } });
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const errors = collectConsoleErrors(page);
  await gotoApp(page);
  return { mocks, errors, overlay: page.locator("#overlay") };
}

test("Perfil: «¿Cuánto cocinas?» parte de «Lo básico», se guarda y el aviso de 2 comidas aparece", async ({ page, context }) => {
  // diet:["omnivoro"]: saveProfile() exige al menos una opción de alimentación.
  const { mocks, errors } = await boot(page, context, { prefs: { diet: ["omnivoro"] } });
  page.on("dialog", (dialog) => dialog.accept());
  await page.locator("#tabs").getByText("Perfil").click();
  await page.locator("#pfSecComidas > summary").click();
  const select = page.getByLabel("¿Cuánto cocinas?");
  await expect(select).toHaveValue("basic");
  await expect(page.locator("#pfMealCountNote")).toBeEmpty();
  await page.locator("#pf_meal_count").selectOption("2");
  await expect(page.locator("#pfMealCountNote")).toContainText("Con 2 comidas al día es difícil cuadrar exacto tus metas.");
  await page.locator("#pf_meal_count").selectOption("4");
  await expect(page.locator("#pfMealCountNote")).toBeEmpty();
  await select.selectOption("none");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect.poll(() => {
    const saved = mocks.calls.filter((c) => c.table === "profiles" && c.payload && c.payload.prefs).at(-1);
    return saved && saved.payload.prefs.cookingLevel;
  }).toBe("none");
  expect(errors).toEqual([]);
});

test("el registro inicial muestra el aviso de 2 comidas y la pregunta de cocina", async ({ page, context }) => {
  await boot(page, context);
  const html = await page.evaluate(() => ({ two: twoMealNoticeHtml(2), four: twoMealNoticeHtml(4), field: cookingLevelFieldHtml("ob", undefined) }));
  expect(html.two).toContain("con 3 o más comidas el plan cuadra mejor");
  expect(html.four).toBe("");
  expect(html.field).toContain('id="ob_cooking_level"');
  expect(html.field).toContain('value="basic" selected');
});

test("«No cocino»: el día preparado no trae platos que piden cocinar y avisa si la cena no tenía opción simple", async ({ page, context }) => {
  const { overlay } = await boot(page, context, { prefs: { cookingLevel: "none", mealCount: 4 } });
  await page.evaluate(async () => { if (!DB.loaded) await dbLoad(); await applyDeterministicDay(todayStr()); });
  const names = await page.evaluate(() => buildDay(todayStr()).meals.map((m) => mealValue(m, mealState(todayStr(), m.id)).name));
  expect(names).toContain("Bowl de atún con arroz listo");
  expect(names).not.toContain("Guiso de pollo con papa");
  expect(names).not.toContain("Pollo a la plancha con arroz");
  // La única cena del catálogo pide cocinar: se usa y se avisa.
  expect(names).toContain("Pescado al horno con verduras");
  await expect(page.locator("#toast")).toContainText("Hoy no encontramos algo más simple para la cena");
});

test("Cambiar comida: «Más fácil de preparar» y «Sin cocina» filtran por nivel", async ({ page, context }) => {
  const planned = { done: false, ovr: { name: "Guiso de pollo con papa", dishName: "Guiso de pollo con papa", gen: true, userSet: true } };
  const { overlay, errors } = await boot(page, context, {
    prefs: { cookingLevel: "cook", mealCount: 4 },
    tables: { day_log: { rows: [{ user_id: USER_ID, log_date: todayYmd(), plan_version_id: null, updated_at: new Date().toISOString(), state: { meals: { almuerzo: planned }, extras: [], workoutDone: false } }] } },
  });
  await page.evaluate(async () => { if (!DB.loaded) await dbLoad(); openChangeMeal(todayStr(), "almuerzo"); });
  const opts = overlay.locator("#chg-opts .opt");
  await expect(opts).toHaveCount(3);
  await overlay.getByRole("button", { name: "⏱ Más fácil de preparar" }).click();
  await expect(overlay.getByRole("button", { name: "⏱ Más fácil de preparar" })).toHaveAttribute("aria-pressed", "true");
  await expect(overlay.locator("#chg-hint")).toContainText("Opciones con menos preparación que la actual.");
  await expect(opts).toHaveCount(2);
  await expect(overlay.locator("#chg-opts")).not.toContainText("Guiso de pollo con papa");
  await overlay.getByRole("button", { name: "🍱 Sin cocina" }).click();
  await expect(opts).toHaveCount(1);
  await expect(opts.first()).toContainText("Bowl de atún con arroz listo");
  // Quitar el filtro vuelve a mostrar todo.
  await overlay.getByRole("button", { name: "🍱 Sin cocina" }).click();
  await expect(opts).toHaveCount(3);
  expect(errors).toEqual([]);
});
