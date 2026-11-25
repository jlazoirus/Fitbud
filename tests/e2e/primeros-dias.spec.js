// REQ-404: los primeros días se registra lo que se come, sin menú sugerido.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, gotoApp, autoDismissNudges, collectConsoleErrors, completePrefs, profileFixture, daysFromToday, todayYmd, USER_ID } from "./helpers.js";

// 2 comidas y 1100 kcal: completo con meta de 2200 (≥ 2 comidas y ≥ 40 %).
function loggedDay(date, kcal = 550) {
  const extra = (oid, name) => ({ oid, name, kcal, p: 30, c: 60, f: 15, done: true });
  return { user_id: USER_ID, log_date: date, plan_version_id: null, updated_at: new Date().toISOString(),
    state: { meals: {}, extras: [extra(1, "Pan con huevo"), extra(2, "Arroz con pollo")], workoutDone: false } };
}
function intake(startOffset, extra = {}) {
  return { version: 1, status: "observing", startedAt: daysFromToday(startOffset), endedAt: null, cycle: 1, ...extra };
}
async function boot(page, context, { prefs, days = [], dismiss = true } = {}) {
  const errors = collectConsoleErrors(page);
  const paid = [];
  page.on("request", (req) => { if (req.url().includes("/api/claude")) { try { paid.push(JSON.parse(req.postData() || "{}").action || ""); } catch (_) { paid.push("?"); } } });
  const mocks = await installMocks(context, { tables: { profiles: { row: profileFixture(prefs) }, day_log: { rows: days } } });
  await seedLoggedInUser(page);
  if (dismiss) await autoDismissNudges(page);
  await gotoApp(page);
  return { ...mocks, errors, paid };
}
const lastPrefs = (calls) => {
  const row = calls.filter((c) => c.table === "profiles" && c.method === "POST").at(-1).payload;
  return (Array.isArray(row) ? row[0] : row).prefs;
};
async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
}

for (const width of [320, 390, 1280]) test(`REQ-404: el primer onboarding avisa y no prepara menú (${width}px)`, async ({ page, context }) => {
  await page.setViewportSize({ width, height: 900 });
  const { calls, errors, paid } = await boot(page, context, { prefs: {}, dismiss: false });
  await page.fill("#ob_name", "Ana"); await page.selectOption("#ob_sex", "female"); await page.fill("#ob_age", "30");
  await page.fill("#ob_height", "165"); await page.fill("#ob_weight", "65");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.selectOption("#ob_sport", "walking"); await page.selectOption("#ob_strength", "none");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.selectOption("#ob_diet_pattern", "omnivoro"); await page.check("#ob_consent_core");
  for (const el of await page.locator('#app select[id^="ob_safety_"]').all()) await el.selectOption("no");
  await page.getByRole("button", { name: "Guardar mi plan" }).click();
  // El paso de avisos (REQ-289) puede ir antes; el aviso de los primeros días aparece antes de Hoy.
  const notify = page.getByRole("button", { name: "Ahora no, ir a mi plan" });
  const notice = page.locator("#overlay");
  await expect(notify.or(notice.getByRole("heading", { name: "Primero queremos conocerte" }))).toBeVisible({ timeout: 20_000 });
  if (await notify.isVisible()) {
    await expect(page.locator("#app h1")).toContainText("Tu plan está listo");
    await notify.click();
  }
  await expect(notice.getByRole("heading", { name: "Primero queremos conocerte" })).toBeVisible();
  await expect(notice).toContainText("Durante los próximos 3 a 5 días registra cada una de tus comidas");
  await expect(notice).not.toContainText(/IA|inteligencia|modelo/);
  await noOverflow(page);
  await notice.getByRole("button", { name: "Empezar a registrar" }).click();
  await expect(notice).toHaveCount(0);
  await expect(page.locator("#tabs")).toContainText("Hoy");

  const prefs = lastPrefs(calls);
  expect(prefs.nutritionIntake).toMatchObject({ version: 1, status: "observing", startedAt: todayYmd(), endedAt: null });
  // Cero comidas sugeridas; el entreno sí quedó listo.
  const state = await page.evaluate(() => {
    const ds = todayStr();
    return { prepared: homeDayHasPreparedMeals(ds, buildDay(ds)), workout: effectiveWorkout(ds).workout?.id || null };
  });
  expect(state.prepared).toBe(false);
  expect(state.workout).toBeTruthy();
  const versions = calls.filter((c) => c.table === "plan_versions" && c.method === "POST").map((c) => (Array.isArray(c.payload) ? c.payload[0] : c.payload));
  expect(versions.some((v) => v.snapshot?.nutritionPlan?.days?.length)).toBe(false);
  // Ninguna llamada pide comidas: solo el entreno puede prepararse.
  expect(paid.filter((a) => /diet|meal|menu|day/i.test(a))).toEqual([]);

  // Hoy: registrar es la acción principal, con el avance y sin la meta.
  const app = page.locator("#app");
  // REQ-415: la acción lima del «Plan de hoy» es registrar la siguiente comida, no el entreno.
  await expect(app.locator(".home-primary .btn-accent")).toHaveCount(1);
  await expect(app.locator(".home-primary .dp-row.kind-meal .btn-accent")).toHaveText("Registrar");
  await expect(app.locator(".home-primary").getByRole("button", { name: "Registrar comida", exact: true })).toBeVisible();
  await expect(app.locator(".home-consumption")).toContainText("Día 1 de 3");
  await expect(app.locator(".menu-suggestion")).toHaveCount(0);
  await expect(app).not.toContainText("restantes");
  await page.locator('[data-tab="nutricion"]').click();
  await expect(app.locator(".nutrition-intake")).toContainText("Primero queremos conocerte");
  await expect(app.locator(".nutrition-intake")).toContainText("Día 1 de 3");
  await expect(app).not.toContainText("Preparar mi semana");
  await expect(app).not.toContainText("restantes");
  await expect(app).not.toContainText("meta alcanzada");
  await expect(app.getByRole("button", { name: "Registrar algo que comí" }).first()).toHaveClass(/btn-accent/);
  await noOverflow(page);

  // El aviso sale una sola vez (la recarga con el estado guardado se prueba abajo).
  await page.locator('[data-tab="hoy"]').click();
  await expect(app.locator(".home-consumption")).toContainText("Día 1 de 3");
  await expect(page.locator("#overlay")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("REQ-404: un día completo exige 2 comidas y el 40 % de la meta", async ({ page, context }) => {
  const { errors } = await boot(page, context, { prefs: completePrefs({ nutritionIntake: intake(-2) }),
    days: [loggedDay(daysFromToday(-2)), loggedDay(daysFromToday(-1), 300)] });
  await expect(page.locator("#app .home-consumption")).toContainText("Día 2 de 3");
  await page.reload();
  await expect(page.locator("#app .home-consumption")).toContainText("Día 2 de 3");
  await expect(page.locator("#overlay")).toHaveCount(0);
  const pr = await page.evaluate(() => nutritionIntakeProgress());
  expect(pr.complete).toBe(1); // 600 kcal < 880: el segundo día no cuenta
  expect(pr.label).toBe("Día 2 de 3");
  expect(await page.evaluate(() => { const d = todayStr(); dayState(d).extras.push({ oid: 9, name: "Café", kcal: 900, p: 0, c: 0, f: 0, done: true }); return intakeDayComplete(d); })).toBe(false);
  expect(errors).toEqual([]);
});

test("REQ-404: con 3 días se ofrece el resumen o 2 días más; con 5 queda listo", async ({ page, context }) => {
  const days = [-3, -2, -1].map((n) => loggedDay(daysFromToday(n)));
  const { calls, errors } = await boot(page, context, { prefs: completePrefs({ nutritionIntake: intake(-3) }), days });
  await page.locator('[data-tab="nutricion"]').click();
  const card = page.locator("#app .nutrition-intake");
  await expect(card).toContainText("Ya tenemos 3 días");
  await expect(card).toContainText("¿Vemos tu resumen o registras 2 días más para afinar?");
  await card.getByRole("button", { name: "Registrar 2 días más" }).click();
  await expect(card).toContainText("Día 4 de 5");
  expect(lastPrefs(calls).nutritionIntake.extended).toBe(true);
  // Dos días más completos: el resumen queda listo sin preguntar.
  await page.evaluate(() => {
    for (const d of [addDays(todayStr(), -5), addDays(todayStr(), -4)]) {
      dayState(d).extras.push({ oid: 1, name: "A", kcal: 550, p: 30, c: 60, f: 15, done: true }, { oid: 2, name: "B", kcal: 550, p: 30, c: 60, f: 15, done: true });
    }
    profile.prefs.nutritionIntake.startedAt = addDays(todayStr(), -5);
    render();
  });
  await expect(card).toContainText("Tu resumen está listo");
  await expect(card.getByRole("button", { name: "Registrar 2 días más" })).toHaveCount(0);
  await card.getByRole("button", { name: "Ver mi resumen" }).click();
  await expect(page.locator("#overlay")).toContainText("Así comes");
  expect(lastPrefs(calls).nutritionIntake.status).toBe("review");
  expect(errors).toEqual([]);
});

test("REQ-404: al tope de 7 días sin un día completo se ofrece el menú de siempre", async ({ page, context }) => {
  const { calls, errors } = await boot(page, context, { prefs: completePrefs({ nutritionIntake: intake(-6) }) });
  await page.locator('[data-tab="nutricion"]').click();
  const card = page.locator("#app .nutrition-intake");
  await expect(card).toContainText("Preparemos tu menú");
  await card.getByRole("button", { name: "Preparar mi menú" }).click();
  await expect(page.locator("#overlay")).toContainText("Preparar mi semana");
  expect(lastPrefs(calls).nutritionIntake).toMatchObject({ status: "skipped", endedAt: todayYmd() });
  expect(errors).toEqual([]);
});

test("REQ-404: «Prefiero recibir un menú ya» confirma, marca skipped y prepara la semana", async ({ page, context }) => {
  const { calls, errors } = await boot(page, context, { prefs: completePrefs({ nutritionIntake: intake(-1) }) });
  await page.locator('[data-tab="nutricion"]').click();
  const app = page.locator("#app");
  await app.getByRole("button", { name: "Prefiero recibir un menú ya" }).click();
  const overlay = page.locator("#overlay");
  await expect(overlay).toContainText("¿Prefieres recibir un menú ya?");
  await overlay.getByRole("button", { name: "Seguir registrando" }).click();
  await expect(overlay).toHaveCount(0);
  expect(await page.evaluate(() => profile.prefs.nutritionIntake.status)).toBe("observing");
  await app.getByRole("button", { name: "Prefiero recibir un menú ya" }).click();
  await overlay.getByRole("button", { name: "Sí, prepararlo" }).click();
  await expect(overlay).toContainText("Preparar mi semana");
  expect(lastPrefs(calls).nutritionIntake.status).toBe("skipped");
  await page.evaluate(() => closeModal());
  await expect(app.locator(".nutrition-intake")).toHaveCount(0);
  await expect(app).toContainText("Preparar mi semana");
  expect(errors).toEqual([]);
});

test("REQ-404: una cuenta existente no entra al periodo", async ({ page, context }) => {
  const { errors } = await boot(page, context, { prefs: completePrefs() });
  await page.locator('[data-tab="nutricion"]').click();
  const app = page.locator("#app");
  await expect(app.locator(".nutrition-intake")).toHaveCount(0);
  await expect(app).toContainText("Preparar mi semana");
  expect(await page.evaluate(() => nutritionIntakeActive())).toBe(false);
  expect(errors).toEqual([]);
});
