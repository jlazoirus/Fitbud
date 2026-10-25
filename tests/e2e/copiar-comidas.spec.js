// REQ-270: copiar una comida o las entradas de un día a otra fecha del ciclo con
// vista previa. El origen no cambia, las copias tienen identidad nueva y
// procedencia, el futuro queda planificado y hoy/pasado exige decidir si se comió.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges, USER_ID, todayYmd } from "./helpers.js";

const lunch = { done: true, ovr: { name: "Bowl de avena", kcal: 340, p: 12, c: 55, f: 8, userSet: true,
  components: [{ name: "Avena", unit: "100g", amount: 60, base: { kcal: 389, p: 16.9, c: 66, f: 6.9 }, ref: { kind: "ingredient", id: "7" } }],
  nutritionMeta: { v: 1, source: "catalog" } } };
const row = (date, state) => ({ user_id: USER_ID, log_date: date, plan_version_id: null, updated_at: new Date().toISOString(), state });
async function setup(page, context, rows) {
  await installMocks(context, { tables: { day_log: { rows } } });
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const errors = collectConsoleErrors(page);
  await gotoApp(page);
  await page.locator("#tabs").getByText("Nutrición").click();
  return { overlay: page.locator("#overlay"), errors };
}
async function setDate(overlay, ds) { await overlay.locator("#copyTo").fill(ds); await overlay.locator("#copyTo").dispatchEvent("change"); }

test("copiar el día a mañana: vista previa, copias planificadas con identidad nueva y origen intacto", async ({ page, context }) => {
  const today = todayYmd();
  const { overlay, errors } = await setup(page, context, [row(today, {
    meals: { almuerzo: lunch, cena: { done: false, skipped: true } },
    extras: [{ name: "Café con leche", kcal: 120, p: 6, c: 10, f: 6, done: true, oid: 1, _syncId: "sync-cafe" }], extraSeq: 1, workoutDone: false,
  })]);
  const tomorrow = await page.evaluate(() => addDays(todayStr(), 1));
  test.skip(await page.evaluate((d) => d > END, tomorrow), "el ciclo termina hoy");
  const sourceBefore = await page.evaluate(() => JSON.stringify(dayState(todayStr())));

  await page.evaluate(() => openCopyMeals(todayStr()));
  await expect(overlay.locator('input[data-key]')).toHaveCount(2); // la cena saltada no se ofrece
  await expect(overlay.locator("#copyPreview")).toContainText("Bowl de avena → como extra");
  await expect(overlay.locator("#copyPreview")).toContainText("Café con leche → como extra");
  await expect(overlay.locator("#copyPreview")).toContainText("460 kcal en total · planificado, no cuenta hasta que lo marques");
  await expect(overlay.locator("#copyEaten")).toContainText("Es un día futuro");
  await overlay.getByRole("button", { name: "Copiar", exact: true }).click();
  await expect(page.locator("#toast")).toContainText("2 comidas copiadas");

  const dest = await page.evaluate((d) => dayState(d).extras, tomorrow);
  expect(dest.map((e) => [e.name, e.kcal, e.done])).toEqual([["Bowl de avena", 340, false], ["Café con leche", 120, false]]);
  expect(dest[0].components[0]).toMatchObject({ name: "Avena", amount: 60 });
  expect(dest[0].nutritionMeta).toEqual({ v: 1, source: "catalog" });
  expect(dest[0].copiedFrom).toEqual({ date: today, key: "meal:almuerzo" });
  expect(dest[1]._syncId).not.toBe("sync-cafe"); // identidad de sync nueva
  expect(dest.map((e) => e.oid)).toEqual([1, 2]);
  // No cuenta en el día destino hasta consumirse.
  expect(await page.evaluate((d) => dayTotals(d).t.kcal, tomorrow)).toBe(0);
  // El origen queda igual y editar la copia no lo toca.
  await page.evaluate((d) => { dayState(d).extras[0].components[0].amount = 100; dayState(d).extras[0].kcal = 389; commitDay(d); }, tomorrow);
  expect(await page.evaluate(() => JSON.stringify(dayState(todayStr())))).toBe(sourceBefore);
  expect(errors).toEqual([]);
});

test("a hoy desde ayer: exige decidir si se comió; en lugar de reemplaza la misma comida", async ({ page, context }) => {
  const today = todayYmd();
  const yesterday = await (async () => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toLocaleDateString("sv-SE", { timeZone: "America/Lima" }); })();
  const { overlay } = await setup(page, context, [
    row(yesterday, { meals: { almuerzo: lunch }, extras: [], workoutDone: false }),
    row(today, { meals: { almuerzo: { done: false, ovr: { name: "Arroz con pollo", dishName: "Arroz con pollo", gen: true, kcal: 600, p: 35, c: 70, f: 15 } } }, extras: [], workoutDone: false }),
  ]);
  test.skip(await page.evaluate((d) => d < START, yesterday), "ayer está fuera del ciclo");
  await page.evaluate((d) => openCopyMeals(d, "meal:almuerzo"), yesterday);
  await setDate(overlay, today);
  await expect(overlay.getByRole("button", { name: "Copiar", exact: true })).toBeDisabled();
  await expect(overlay.locator("#copyPreview")).toContainText("Indica si ya lo comiste ese día.");
  await overlay.getByLabel("En lugar de la misma comida de ese día").check();
  await expect(overlay.locator("#copyPreview")).toContainText("Bowl de avena → reemplaza Almuerzo (Arroz con pollo)");
  await overlay.getByLabel("Sí, ya me lo comí").check();
  await overlay.getByRole("button", { name: "Copiar", exact: true }).click();

  const ms = await page.evaluate(() => mealState(todayStr(), "almuerzo"));
  expect(ms).toMatchObject({ done: true, ovr: { name: "Bowl de avena", kcal: 340, copiedFrom: { date: yesterday, key: "meal:almuerzo" } } });
  expect(await page.evaluate(() => dayState(todayStr()).extras.length)).toBe(0);
  // Se puede deshacer como cualquier sustitución.
  await page.evaluate(() => undoMealSubstitution(todayStr(), "almuerzo"));
  expect(await page.evaluate(() => mealState(todayStr(), "almuerzo").ovr.name)).toBe("Arroz con pollo");
});

test("día vacío, misma fecha y cancelar", async ({ page, context }) => {
  const { overlay } = await setup(page, context, [row(todayYmd(), { meals: { almuerzo: lunch }, extras: [], workoutDone: false })]);
  await page.evaluate(() => openCopyMeals(todayStr()));
  await setDate(overlay, await page.evaluate(() => todayStr()));
  await expect(overlay.locator("#copyPreview")).toContainText("Elige otro día");
  await expect(overlay.getByRole("button", { name: "Copiar", exact: true })).toBeDisabled();
  const before = await page.evaluate(() => JSON.stringify(S.days));
  await page.evaluate(() => closeModal());
  expect(await page.evaluate(() => JSON.stringify(S.days))).toBe(before);

  // Desde «Más opciones» de una comida y desde un día sin comidas.
  await page.evaluate(() => openMealMore(todayStr(), "almuerzo"));
  await expect(overlay.getByRole("button", { name: "⧉ Copiar a otro día" })).toBeVisible();
  await page.evaluate(() => { closeModal(); openCopyMeals(addDays(todayStr(), 2)); });
  await expect(page.locator("#toast")).toHaveText("Este día no tiene comidas para copiar");
});
