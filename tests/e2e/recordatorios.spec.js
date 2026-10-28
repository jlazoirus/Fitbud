// REQ-265: el recordatorio de entreno (api/notify.js) no conoce el plan; la app
// guarda en cada día si es de descanso para que el servidor no avise de más.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges, daysFromToday, USER_ID } from "./helpers.js";

test("el día guarda restDay: falso con sesión prescrita, verdadero al convertirlo en descanso", async ({ page, context }) => {
  await installMocks(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const errors = collectConsoleErrors(page);
  await gotoApp(page);
  await page.locator("#tabs").getByText("Entreno").click();

  // El fixture garantiza que hoy toca entrenar.
  const before = await page.evaluate(() => { const ds = todayStr(); commitDay(ds); return S.days[ds].restDay; });
  expect(before).toBe(false);

  await page.getByRole("button", { name: "Me perdí la sesión" }).click();
  await page.locator("#overlay").getByRole("button", { name: /Convertir en descanso/ }).click();
  await expect(page.locator("#app")).toContainText("Descanso");
  const after = await page.evaluate(() => { const st = S.days[todayStr()]; return { restDay: st.restDay, override: st.workoutOverride }; });
  expect(after).toEqual({ restDay: true, override: "descanso" });
  expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
});

// REQ-285: el journey de recordatorios lee de prefs.engagement la racha, el
// rescate posible de ayer y el progreso, que la app guarda al cambiar.
const doneMeal = () => ({ done: true, ovr: { name: "Comida registrada", kcal: 500, p: 30, c: 50, f: 15 } });
const dayRow = (offset, state) => ({ user_id: USER_ID, log_date: daysFromToday(offset), state, plan_version_id: null, updated_at: new Date().toISOString() });
const doneDay = () => ({ meals: { desayuno: doneMeal(), almuerzo: doneMeal(), cena: doneMeal() }, extras: [], workoutDone: true });

test("la app guarda el resumen de racha que leen los recordatorios", async ({ page, context }) => {
  const rows = [dayRow(-4, doneDay()), dayRow(-3, doneDay()), dayRow(-2, doneDay()), dayRow(-1, { meals: {}, extras: [], workoutDone: false })];
  const { calls } = await installMocks(context, { tables: { day_log: { rows } } });
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const errors = collectConsoleErrors(page);
  await gotoApp(page);

  // Columna propia de notification_preferences: nunca reescribe profiles.prefs.
  const saved = () => calls.filter((c) => c.table === "notification_preferences" && c.method === "PATCH" && c.payload && c.payload.engagement).map((c) => c.payload.engagement);
  await expect.poll(() => saved().length, { timeout: 8000 }).toBeGreaterThan(0);
  const start = await page.evaluate(() => START);
  // Ayer quedó roto: racha 0, pero el rescate de 3 días sigue abierto hasta hoy.
  const { plan, ...summary } = saved().at(-1);
  expect(summary).toEqual({
    v: 1, cycleStart: start, streak: 0, streakThrough: null,
    rescueDate: daysFromTodayInPage(-1), rescueStreak: 3,
    bestStreak: 3, activeDays: 3, workouts: 3,
  });
  // REQ-298: el plan de hoy y de la semana siguiente para el resumen de la mañana.
  const today = await page.evaluate(() => {
    const ds = todayStr(), day = buildDay(ds);
    return { ds, name: day.workout.name, meals: day.meals.length, first: mealValue(day.meals[0], (S.days[ds] && S.days[ds].meals || {})[day.meals[0].id]).name || null };
  });
  expect(Object.keys(plan)).toHaveLength(8);
  expect(plan[today.ds]).toEqual({ w: today.name, rest: false, meals: today.meals, first: today.first });
  expect(calls.some((c) => c.table === "profiles" && c.payload && c.payload.prefs && c.payload.prefs.engagement)).toBe(false);
  expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);

  function daysFromTodayInPage(n) { return daysFromToday(n); }
});

test("el enlace del aviso abre su día y registra la etapa sin datos personales", async ({ page, context }) => {
  await installMocks(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const errors = collectConsoleErrors(page);
  const opened = page.waitForRequest((req) => req.url().includes("/api/analytics") && req.method() === "POST" && (req.postData() || "").includes("reminder_opened"));
  const yesterday = daysFromToday(-1);
  await page.goto(`/index.html?date=${yesterday}&r=rescue`);
  await page.waitForFunction(() => typeof profile !== "undefined" && profile && !_authBusy);
  const body = JSON.parse((await opened).postData());
  expect(body.event_type).toBe("reminder_opened");
  expect(body.properties).toEqual({ step: "rescue" });
  await expect.poll(() => page.evaluate(() => ({ view, current, search: location.search }))).toEqual({ view: "nutricion", current: yesterday, search: "" });
  expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
});

// REQ-298: horario del aviso del día de 06:00 a 23:00 y resumen de la mañana.
test("Recordatorios: elegir la hora del aviso y activar el resumen de la mañana", async ({ page, context }) => {
  const { calls } = await installMocks(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const errors = collectConsoleErrors(page);
  await gotoApp(page);
  await page.locator("#tabs").getByText("Perfil").click();
  await page.locator("#pfSecRecordatorios > summary").click();

  const hours = await page.locator("#notif_hour option").evaluateAll((os) => os.map((o) => o.value));
  expect(hours).toEqual(Array.from({ length: 18 }, (_, i) => String(i + 6)));
  await expect(page.locator("#notif_hour")).toHaveValue("20");
  await page.selectOption("#notif_hour", "7");

  await expect(page.locator("#notif_morning_hour")).toBeHidden();
  await page.check("#notif_morning");
  await expect(page.locator("#notif_morning_hour")).toBeVisible();
  await expect(page.locator("#notif_morning_hour")).toHaveValue("7");
  await page.selectOption("#notif_morning_hour", "6");
  await page.click("#notifSaveBtn");
  await expect(page.locator("#pfNotifDirtyHint")).toBeHidden();

  const row = calls.filter((c) => c.table === "notification_preferences" && c.method === "POST").map((c) => (Array.isArray(c.payload) ? c.payload[0] : c.payload)).at(-1);
  expect(row).toMatchObject({ email_opt_in: false, notify_hour: 7, morning_opt_in: true, morning_hour: 6 });
  expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
});
