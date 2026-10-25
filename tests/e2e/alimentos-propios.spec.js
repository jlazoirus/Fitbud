// REQ-274: alimentos privados creados desde la etiqueta (por 100 g, 100 ml o por
// porción declarada), buscables en el mismo buscador, editables sin cambiar lo ya
// registrado y fusionados con lo creado en otro dispositivo.
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
  await page.getByRole("button", { name: /Agregar comida \/ snack/i }).first().click();
  const overlay = page.locator("#overlay");
  await overlay.locator('.qp-tab[data-tab="food"]').click();
  return { overlay, errors, calls: mocks.calls };
}
const savedFoods = (calls) => {
  const saved = calls.filter((c) => c.table === "profiles" && c.payload && c.payload.prefs);
  return saved.length ? saved.at(-1).payload.prefs.customFoods : undefined;
};
async function fillForm(overlay, v) {
  if (v.unit) await overlay.locator("#cf_unit").selectOption(v.unit);
  for (const k of ["name", "brand", "kcal", "p", "c", "f", "portionLabel", "portionAmount"]) {
    if (v[k] != null) await overlay.locator("#cf_" + k).fill(v[k]);
  }
}

test("yogur por 100 g con pote de 125 g: crear desde la búsqueda, registrar y guardar el snapshot", async ({ page, context }) => {
  const { overlay, errors, calls } = await setup(page, context);
  await overlay.locator("#qpSearch").fill("Yogur natural");
  await expect(overlay.locator("#qpList")).toContainText("No encontramos ese alimento. Puedes crearlo con los datos de la etiqueta.");
  await overlay.getByRole("button", { name: "＋ Crear alimento propio" }).click();
  await expect(overlay.locator("#cf_name")).toHaveValue("Yogur natural");
  await expect(overlay.locator(".cf-form")).toContainText("no confirma información de alérgenos");

  // Errores: no se guarda nada.
  await fillForm(overlay, { kcal: "-59", p: "", c: "60", f: "50" });
  await overlay.getByRole("button", { name: "Guardar alimento" }).click();
  await expect(overlay.locator("#cf_errors")).toContainText("kcal: No puede ser negativo.");
  await expect(overlay.locator("#cf_errors")).toContainText("Proteína: Indica proteína");
  expect(savedFoods(calls)).toBeUndefined();

  await fillForm(overlay, { brand: "Gloria", kcal: "59", p: "10", c: "3,6", f: "0,4", portionLabel: "1 pote", portionAmount: "125" });
  await overlay.getByRole("button", { name: "Guardar alimento" }).click();
  await expect(overlay.locator("#qpList")).toContainText("Tus alimentos");
  const row = overlay.locator(".qp-item", { hasText: "Yogur natural" });
  await expect(row).toContainText("Tuyo Gloria · 59 kcal · P 10 · C 3,6 · G 0,4 por 100 g · 1 pote = 125 g");
  await expect(row.getByLabel("Cantidad de Yogur natural (Gloria) (g)")).toHaveValue("125");
  const foods = savedFoods(calls);
  expect(foods).toHaveLength(1);
  expect(foods[0]).toMatchObject({ name: "Yogur natural", brand: "Gloria", unit: "100g", base: { kcal: 59, p: 10, c: 3.6, f: 0.4 }, portion: { label: "1 pote", amount: 125 }, version: 1 });

  await row.getByRole("button", { name: "Añadir" }).click();
  await expect(overlay.locator("#f_kcal")).toHaveValue(tenth(59 * 1.25));
  await overlay.getByRole("button", { name: "Guardar", exact: true }).click();
  const extra = await page.evaluate(() => dayState(todayStr()).extras[0]);
  expect(extra.components[0]).toMatchObject({ name: "Yogur natural (Gloria)", unit: "100g", amount: 125, ref: { kind: "food", id: foods[0].id, version: 1 } });
  expect(extra.nutritionMeta).toEqual({ v: 1, source: "food" });
  // Nada se envía a analytics con el alimento.
  expect(JSON.stringify(calls.filter((c) => /analytics/.test(c.table)))).not.toContain("Yogur");
  expect(errors).toEqual([]);
});

test("bebida por 100 ml y barra por porción sin peso (no se convierte a gramos)", async ({ page, context }) => {
  const { overlay } = await setup(page, context);
  await overlay.getByRole("button", { name: "＋ Crear alimento propio" }).click();
  await fillForm(overlay, { unit: "100ml", name: "Bebida de avena", kcal: "45", p: "1", c: "7", f: "1,5" });
  await overlay.getByRole("button", { name: "Guardar alimento" }).click();
  await overlay.getByLabel("Cantidad de Bebida de avena (ml)").fill("250");
  await overlay.locator(".qp-item", { hasText: "Bebida de avena" }).getByRole("button", { name: "Añadir" }).click();

  await overlay.locator("#qpSearch").fill("");
  await overlay.getByRole("button", { name: "＋ Crear alimento propio" }).click();
  await fillForm(overlay, { unit: "portion", name: "Barra de cereal", kcal: "120", p: "2", c: "20", f: "3,5" });
  await expect(overlay.locator("#cf_portionAmount")).toHaveCount(0);
  await overlay.getByRole("button", { name: "Guardar alimento" }).click();
  await expect(overlay.locator("#cf_errors")).toContainText("Describe la porción de la etiqueta");
  await fillForm(overlay, { portionLabel: "1 barra" });
  await overlay.getByRole("button", { name: "Guardar alimento" }).click();
  const bar = overlay.locator(".qp-item", { hasText: "Barra de cereal" });
  await expect(bar).toContainText("por 1 barra");
  await bar.getByLabel("Cantidad de Barra de cereal (porciones)").fill("2");
  await bar.getByRole("button", { name: "Añadir" }).click();
  await expect(overlay.locator("#f_kcal")).toHaveValue(tenth(45 * 2.5 + 240));
  await overlay.getByRole("button", { name: "Guardar", exact: true }).click();
  const comps = await page.evaluate(() => dayState(todayStr()).extras[0].components.map((c) => [c.name, c.unit, c.amount]));
  expect(comps).toEqual([["Bebida de avena", "100ml", 250], ["Barra de cereal", "portion", 2]]);
});

test("editar tras registrar no cambia el pasado; otro dispositivo y borrados se fusionan sin perder datos", async ({ page, context }) => {
  const other = { id: "fother01", name: "Pan integral", brand: "Bimbo", unit: "100g", base: { kcal: 250, p: 12, c: 41, f: 4 }, version: 1, updatedAt: "2026-10-20T10:00:00.000Z" };
  const mine = { id: "fmine001", name: "Queso fresco", unit: "100g", base: { kcal: 260, p: 18, c: 2, f: 20 }, version: 1, updatedAt: "2026-10-20T10:00:00.000Z" };
  const { overlay, calls } = await setup(page, context, completePrefs({ customFoods: [other, mine] }));
  await overlay.locator("#qpSearch").fill("queso");
  await overlay.getByLabel("Cantidad de Queso fresco (g)").fill("30");
  await overlay.locator(".qp-item", { hasText: "Queso fresco" }).getByRole("button", { name: "Añadir" }).click();
  await overlay.getByRole("button", { name: "Guardar", exact: true }).click();
  const before = await page.evaluate(() => dayState(todayStr()).extras[0]);

  // Este dispositivo tenía una copia vieja sin el pan (creado en otro): no se pierde al guardar.
  await page.evaluate(() => { profile.prefs.customFoods = profile.prefs.customFoods.filter((f) => f.id !== "fother01"); });
  await page.getByRole("button", { name: /Agregar comida \/ snack/i }).first().click();
  await overlay.locator('.qp-tab[data-tab="food"]').click();
  await overlay.locator("#qpSearch").fill("queso");
  await overlay.getByRole("button", { name: "Editar Queso fresco" }).click();
  await fillForm(overlay, { kcal: "280" });
  await overlay.getByRole("button", { name: "Guardar alimento" }).click();
  await expect(overlay.locator(".cf-form")).toHaveCount(0);
  let foods = savedFoods(calls);
  expect(foods.map((f) => [f.id, f.version, f.base.kcal]).sort()).toEqual([["fmine001", 2, 280], ["fother01", 1, 250]]);
  expect(await page.evaluate(() => dayState(todayStr()).extras[0])).toEqual(before);

  // Borrar deja una lápida: no reaparece al fusionar con el servidor que aún lo tiene.
  page.once("dialog", (d) => d.accept());
  await overlay.getByRole("button", { name: "Editar Queso fresco" }).click();
  await overlay.getByRole("button", { name: "Eliminar" }).click();
  await expect(page.locator("#toast")).toHaveText("Alimento eliminado");
  foods = savedFoods(calls);
  expect(foods.map((f) => f.id)).toEqual(["fother01"]);
  expect(calls.filter((c) => c.table === "profiles" && c.payload && c.payload.prefs).at(-1).payload.prefs.customFoodsDeleted).toEqual(["fmine001"]);
  expect(await page.evaluate(() => dayState(todayStr()).extras[0].components[0].base.kcal)).toBe(260);
});

test("sin conexión no se guarda y el formulario conserva lo escrito", async ({ page, context }) => {
  const { overlay, calls } = await setup(page, context);
  await page.route("**/rest/v1/profiles*", (route) => route.request().method() === "GET" ? route.abort("internetdisconnected") : route.fallback());
  await overlay.getByRole("button", { name: "＋ Crear alimento propio" }).click();
  await fillForm(overlay, { name: "Galleta", kcal: "480", p: "6", c: "70", f: "20" });
  await overlay.getByRole("button", { name: "Guardar alimento" }).click();
  await expect(overlay.locator("#cf_errors")).toContainText("No se pudo guardar. Revisa tu conexión");
  await expect(overlay.locator("#cf_name")).toHaveValue("Galleta");
  expect(savedFoods(calls)).toBeUndefined();
});
