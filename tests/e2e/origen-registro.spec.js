// REQ-270: cada consumo guarda su origen (manual, estimación, favorita/reciente,
// receta del plan) y un snapshot de los valores. Editar la fuente no cambia el
// pasado; una corrección manual conserva la base; lo antiguo se lee como legacy.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges, completePrefs, USER_ID, todayYmd } from "./helpers.js";

async function setup(page, context, opts = {}) {
  const mocks = await installMocks(context, opts);
  if (opts.estimate) {
    await context.route("**/api/claude", (route) => route.fulfill({
      status: 200, contentType: "application/json",
      body: JSON.stringify({ text: JSON.stringify(opts.estimate) }),
    }));
  }
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const errors = collectConsoleErrors(page);
  await gotoApp(page);
  await page.locator("#tabs").getByText("Nutrición").click();
  return { overlay: page.locator("#overlay"), errors, calls: mocks.calls };
}
const openAdd = (page) => page.getByRole("button", { name: /Agregar comida \/ snack/i }).first().click();
const extra = (page, i) => page.evaluate((i) => dayState(todayStr()).extras[i], i);

test("estimación guardada conserva su supuesto; corregirla a mano mantiene la base", async ({ page, context }) => {
  const { overlay, errors } = await setup(page, context, {
    estimate: { nombre: "Ceviche", kcal: 380, proteina_g: 40, carbohidratos_g: 30, grasa_g: 8, nota: "Supuse un plato mediano sin camote.", preguntas: [] },
  });
  await openAdd(page);
  await overlay.locator("#f_name").fill("Ceviche de pescado");
  await overlay.getByRole("button", { name: /Estimar macros/ }).click();
  await expect(overlay.locator("#f_kcal")).toHaveValue("380");
  await overlay.getByRole("button", { name: "Guardar", exact: true }).click();
  expect((await extra(page, 0)).nutritionMeta).toEqual({
    v: 1, source: "estimate", base: { kcal: 380, p: 40, c: 30, f: 8, unit: "portion" }, qty: 1,
    estimate: { kind: "text", note: "Supuse un plato mediano sin camote." },
  });

  await page.evaluate(() => editExtra(todayStr(), 0));
  await expect(overlay.locator("#f_origin")).toHaveText("Origen: Estimado por tu coach a partir de la descripción — Supuse un plato mediano sin camote.");
  await overlay.locator("#f_kcal").fill("450");
  await overlay.getByRole("button", { name: "Guardar", exact: true }).click();
  const fixed = await extra(page, 0);
  expect(fixed.kcal).toBe(450);
  expect(fixed.nutritionMeta).toMatchObject({ source: "estimate", corrected: true, base: { kcal: 380 } });
  await page.evaluate(() => editExtra(todayStr(), 0));
  await expect(overlay.locator("#f_origin")).toContainText("corregido a mano");
  expect(errors).toEqual([]);
});

test("favorita ×2: snapshot con base y cantidad; editar la favorita no cambia lo ya registrado", async ({ page, context }) => {
  const fav = { name: "Tostadas con palta", kcal: 350, p: 9, c: 38, f: 18, nutritionMeta: { v: 1, source: "manual" } };
  const { overlay } = await setup(page, context, { prefs: completePrefs({ savedMeals: [fav] }) });
  await openAdd(page);
  await overlay.locator(".qp-pick", { hasText: "Tostadas con palta" }).click();
  await overlay.getByRole("button", { name: "×2" }).click();
  await overlay.getByRole("button", { name: "Guardar", exact: true }).click();
  const saved = await extra(page, 0);
  expect(saved).toMatchObject({ name: "Tostadas con palta", kcal: 700, portion: 2 });
  expect(saved.nutritionMeta).toEqual({ v: 1, source: "manual", ref: { kind: "saved", name: "Tostadas con palta" }, base: { kcal: 350, p: 9, c: 38, f: 18, unit: "portion" }, qty: 2 });

  // Otro dispositivo cambia la favorita: el consumo de hoy mantiene sus valores.
  await page.evaluate(() => { profile.prefs.savedMeals = [{ name: "Tostadas con palta", kcal: 500, p: 12, c: 50, f: 25 }]; render(); });
  expect((await extra(page, 0)).kcal).toBe(700);
  await expect(page.locator(".meal", { hasText: "Tostadas con palta" })).toContainText("700 kcal");
  await page.evaluate(() => editExtra(todayStr(), 0));
  await expect(overlay.locator("#f_origin")).toHaveText("Origen: Ingresado a mano · favorita «Tostadas con palta» · porción ×2");
});

test("lo nuevo escrito a mano es manual; un registro antiguo se lee como tal y no se reescribe", async ({ page, context }) => {
  const { overlay } = await setup(page, context);
  await openAdd(page);
  for (const [id, v] of Object.entries({ f_name: "Manzana", f_kcal: "80", f_p: "0,3", f_c: "21", f_f: "0,2" })) await overlay.locator("#" + id).fill(v);
  await overlay.getByRole("button", { name: "Guardar", exact: true }).click();
  expect((await extra(page, 0)).nutritionMeta).toEqual({ v: 1, source: "manual" });

  await page.evaluate(() => {
    const d = dayState(todayStr());
    d.extras.push({ name: "Café antiguo", kcal: 5, p: 0, c: 0, f: 0, done: true, oid: nextExtraOid(d) });
    commitDay(todayStr()); render(); editExtra(todayStr(), 1);
  });
  await expect(overlay.locator("#f_origin")).toHaveText("Origen: Registro anterior: su origen no se guardó");
  await overlay.getByRole("button", { name: "Guardar", exact: true }).click();
  expect((await extra(page, 1)).nutritionMeta).toBeUndefined();
  await page.evaluate(() => editExtra(todayStr(), 1));
  await overlay.locator("#f_kcal").fill("15");
  await overlay.getByRole("button", { name: "Guardar", exact: true }).click();
  expect((await extra(page, 1)).nutritionMeta).toEqual({ v: 1, source: "manual" });
});

test("comida del plan editada: el detalle muestra que parte de la receta y la corrección", async ({ page, context }) => {
  const planned = { done: false, ovr: { name: "Arroz con pollo", dishName: "Arroz con pollo", gen: true, kcal: 600, p: 35, c: 70, f: 15 } };
  const { overlay } = await setup(page, context, { tables: { day_log: { rows: [{
    user_id: USER_ID, log_date: todayYmd(), plan_version_id: null, updated_at: new Date().toISOString(),
    state: { meals: { almuerzo: planned }, extras: [], workoutDone: false },
  }] } } });
  await page.evaluate(() => openEditor("meal", todayStr(), "almuerzo"));
  await expect(overlay.locator("#f_kcal")).toHaveValue("600");
  await overlay.locator("#f_kcal").fill("700");
  await overlay.getByRole("button", { name: "Guardar", exact: true }).click();
  const ovr = await page.evaluate(() => mealState(todayStr(), "almuerzo").ovr);
  expect(ovr.nutritionMeta).toEqual({ v: 1, source: "recipe", ref: { kind: "recipe", name: "Arroz con pollo" }, base: { kcal: 600, p: 35, c: 70, f: 15, unit: "portion" }, qty: 1, corrected: true });
  await page.evaluate(() => openMealMore(todayStr(), "almuerzo"));
  await expect(overlay.locator(".meal-origin")).toHaveText("Origen: Calculado desde una receta · «Arroz con pollo» · corregido a mano");
});

// REQ-299: reestimar un registro existente cambia el origen visible al instante.
test("reestimar un registro de una favorita ×2 actualiza su origen", async ({ page, context }) => {
  const { overlay, errors } = await setup(page, context, {
    estimate: { nombre: "Shake proteína", kcal: 210, proteina_g: 25, carbohidratos_g: 14, grasa_g: 5, nota: "Estimé un batido listo para tomar de 320 ml.", preguntas: [] },
  });
  await page.evaluate(() => {
    const d = dayState(todayStr());
    d.extras.push({ name: "Shake proteina gloria pro", kcal: 440, p: 50, c: 16, f: 10, done: true, portion: 2, oid: nextExtraOid(d),
      nutritionMeta: { v: 1, source: "manual", ref: { kind: "saved", name: "Shake proteina gloria pro" }, base: { kcal: 220, p: 25, c: 8, f: 5, unit: "portion" }, qty: 2 } });
    commitDay(todayStr()); render(); editExtra(todayStr(), 0);
  });
  await expect(overlay.locator("#f_origin")).toHaveText("Origen: Ingresado a mano · favorita «Shake proteina gloria pro» · porción ×2");
  await overlay.getByRole("button", { name: /Estimar macros/ }).click();
  await expect(overlay.locator("#f_kcal")).toHaveValue("210");
  await expect(overlay.locator("#f_origin")).toHaveText("Origen: Estimado por tu coach a partir de la descripción — Estimé un batido listo para tomar de 320 ml.");
  expect(errors).toEqual([]);
});
