// REQ-272: al registrar algo se elige «Además de lo previsto» o «En lugar de» una
// comida concreta. La sustitución modifica solo esa comida, el total cambia una
// sola vez y se puede deshacer sin pisar cambios posteriores.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges, USER_ID, todayYmd } from "./helpers.js";

const lunch = (extra = {}) => ({ done: false, ...extra, ovr: { name: "Arroz con pollo", dishName: "Arroz con pollo", gen: true, kcal: 600, p: 35, c: 70, f: 15 } });
async function setup(page, context, meals) {
  await installMocks(context, { tables: { day_log: { rows: [{
    user_id: USER_ID, log_date: todayYmd(), plan_version_id: null, updated_at: new Date().toISOString(),
    state: { meals, extras: [], workoutDone: false },
  }] } } });
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const errors = collectConsoleErrors(page);
  await gotoApp(page);
  await page.locator("#tabs").getByText("Nutrición").click();
  await page.getByRole("button", { name: /Agregar comida \/ snack/i }).first().click();
  return { overlay: page.locator("#overlay"), errors };
}
async function fillMeal(overlay, name, kcal) {
  await overlay.locator("#f_name").fill(name);
  for (const [id, v] of Object.entries({ f_kcal: kcal, f_p: "30", f_c: "40", f_f: "20" })) await overlay.locator("#" + id).fill(v);
}
const kcalDone = (page) => page.evaluate(() => dayTotals(todayStr()).t.kcal);

test("en lugar del almuerzo pendiente: reemplaza solo esa comida, cuenta una vez y se deshace", async ({ page, context }) => {
  const { overlay, errors } = await setup(page, context, { almuerzo: lunch() });
  const before = await kcalDone(page);
  await overlay.getByLabel("En lugar de una comida del día").check();
  await expect(overlay.locator("#f_impact")).toHaveText("Elige qué comida reemplaza.");
  await overlay.getByLabel("Comida que reemplaza").selectOption("almuerzo");
  await fillMeal(overlay, "Hamburguesa con papas", "950");
  await expect(overlay.locator("#f_impact")).toContainText("Reemplaza Almuerzo (Arroz con pollo, 600 kcal): +350 kcal en el día.");
  await expect(overlay.locator("#f_impact")).toContainText("Quedará registrada como comida hecha.");
  await overlay.getByRole("button", { name: "Guardar", exact: true }).click();

  const st = await page.evaluate(() => dayState(todayStr()));
  expect(st.extras).toHaveLength(0);
  expect(st.meals.almuerzo).toMatchObject({ done: true, ovr: { name: "Hamburguesa con papas", kcal: 950 } });
  expect(await kcalDone(page)).toBe(before + 950);
  expect(st.contingencyLog.at(-1)).toMatchObject({ type: "meal_replace", id: "almuerzo", reason: "logged_instead", chosen: { name: "Hamburguesa con papas", kcal: 950 } });

  const card = page.locator(".meal", { hasText: "Hamburguesa con papas" });
  await card.getByRole("button", { name: "Deshacer cambio" }).click();
  const back = await page.evaluate(() => mealState(todayStr(), "almuerzo"));
  expect(back.ovr.name).toBe("Arroz con pollo");
  expect(back.done).toBe(false);
  expect(back.subst).toBeUndefined();
  expect(await kcalDone(page)).toBe(before);
  expect(errors).toEqual([]);
});

test("una comida ya registrada se corrige (no se suma dos veces) y una saltada vuelve a contar", async ({ page, context }) => {
  const { overlay } = await setup(page, context, { almuerzo: lunch({ done: true }), cena: { done: false, skipped: true } });
  const before = await kcalDone(page);
  await overlay.getByLabel("En lugar de una comida del día").check();
  await overlay.getByLabel("Comida que reemplaza").selectOption("almuerzo");
  await fillMeal(overlay, "Ensalada César", "450");
  await expect(overlay.locator("#f_impact")).toContainText("Ya estaba registrada: la corriges con lo que comiste.");
  await overlay.getByRole("button", { name: "Guardar", exact: true }).click();
  expect(await kcalDone(page)).toBe(before - 600 + 450);

  await page.getByRole("button", { name: /Agregar comida \/ snack/i }).first().click();
  await overlay.getByLabel("En lugar de una comida del día").check();
  await overlay.getByLabel("Comida que reemplaza").selectOption("cena");
  await expect(overlay.locator("#f_impact")).toContainText("Estaba saltada: vuelve a contar.");
  await fillMeal(overlay, "Pizza", "800");
  await overlay.getByRole("button", { name: "Guardar", exact: true }).click();
  const cena = await page.evaluate(() => mealState(todayStr(), "cena"));
  expect(cena.skipped).toBeUndefined();
  expect(cena.done).toBe(true);
  expect(await kcalDone(page)).toBe(before - 600 + 450 + 800);
  // Deshacer la cena la deja saltada otra vez, sin tocar el almuerzo corregido.
  await page.evaluate(() => undoMealSubstitution(todayStr(), "cena"));
  expect(await page.evaluate(() => mealState(todayStr(), "cena").skipped)).toBe(true);
  expect(await kcalDone(page)).toBe(before - 600 + 450);
});

test("además de lo previsto mantiene el plan; cancelar no cambia nada", async ({ page, context }) => {
  const { overlay } = await setup(page, context, { almuerzo: lunch() });
  const before = await page.evaluate(() => JSON.stringify(dayState(todayStr())));
  await overlay.getByLabel("En lugar de una comida del día").check();
  await overlay.getByLabel("Comida que reemplaza").selectOption("almuerzo");
  await fillMeal(overlay, "Algo", "300");
  await page.evaluate(() => closeModal());
  expect(await page.evaluate(() => JSON.stringify(dayState(todayStr())))).toBe(before);

  await page.getByRole("button", { name: /Agregar comida \/ snack/i }).first().click();
  await expect(overlay.getByLabel("Además de lo previsto")).toBeChecked();
  await fillMeal(overlay, "Café con leche", "120");
  await expect(overlay.locator("#f_impact")).toHaveText("Se suma a lo previsto: +120 kcal hoy. El plan no cambia.");
  await overlay.getByRole("button", { name: "Guardar", exact: true }).click();
  const st = await page.evaluate(() => dayState(todayStr()));
  expect(st.extras.map((e) => e.name)).toEqual(["Café con leche"]);
  expect(st.meals.almuerzo.ovr.name).toBe("Arroz con pollo");
});

test("otro día: mañana queda planificada sin consumir; deshacer no pisa una edición posterior", async ({ page, context }) => {
  const { overlay } = await setup(page, context, { almuerzo: lunch() });
  const tomorrow = await page.evaluate(() => addDays(todayStr(), 1));
  test.skip(await page.evaluate((d) => d > END, tomorrow), "el ciclo termina hoy");
  await overlay.locator("#f_date").fill(tomorrow);
  await overlay.locator("#f_date").dispatchEvent("change");
  await overlay.getByLabel("En lugar de una comida del día").check();
  await expect(overlay.getByLabel("Ya me lo comí")).not.toBeChecked();
  await overlay.getByLabel("Comida que reemplaza").selectOption("almuerzo");
  await fillMeal(overlay, "Menú del día", "700");
  await overlay.getByRole("button", { name: "Guardar", exact: true }).click();
  const ms = await page.evaluate((d) => mealState(d, "almuerzo"), tomorrow);
  expect(ms.done).toBe(false);
  expect(ms.ovr.name).toBe("Menú del día");
  expect(await page.evaluate(() => dayState(todayStr()).meals.almuerzo.ovr.name)).toBe("Arroz con pollo");

  // Se edita después: el deshacer ya no aplica y lo avisa.
  await page.evaluate((d) => { mealState(d, "almuerzo").ovr.kcal = 650; commitDay(d); }, tomorrow);
  await page.evaluate((d) => undoMealSubstitution(d, "almuerzo"), tomorrow);
  await expect(page.locator("#toast")).toHaveText("Esta comida cambió después; edítala o vuelve al plan.");
  expect(await page.evaluate((d) => mealState(d, "almuerzo").ovr.kcal, tomorrow)).toBe(650);
});
