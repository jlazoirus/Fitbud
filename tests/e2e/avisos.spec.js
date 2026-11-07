// REQ-289: al terminar el onboarding se pide instalar la app y activar los
// avisos; después, Hoy lo recuerda cada día hasta que estén activos.
import { test, expect } from "@playwright/test";
import {
  installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges, profileFixture, completePrefs, daysFromToday, USER_ID,
} from "./helpers.js";

const IPHONE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const card = (page) => page.locator(".notify-card");
const notices = (page) => page.locator("#homeNotices > summary");
const prefsWrites = (calls) => calls.filter((c) => c.table === "notification_preferences" && c.method === "POST").map((c) => (Array.isArray(c.payload) ? c.payload[0] : c.payload));

async function openHoy(page, context, opts = {}) {
  const mocks = await installMocks(context, opts.mocks || {});
  if (opts.init) await page.addInitScript(opts.init);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const errors = collectConsoleErrors(page);
  await gotoApp(page);
  await page.waitForLoadState("networkidle");
  return { ...mocks, errors };
}

test.describe("Avisos — recordatorio diario en Hoy (REQ-289)", () => {
  test("Hoy agrupa la semana y el recordatorio; 'Ahora no' oculta solo el recordatorio hasta mañana", async ({ page, context }) => {
    // La prueba representa un permiso aún no solicitado. Chromium headless
    // puede arrancar con denied; no depender del valor del navegador anfitrión.
    const { errors } = await openHoy(page, context, {
      init: () => Object.defineProperty(Notification, "permission", { get: () => "default" }),
      mocks: { prefs: completePrefs({ planStartDate: daysFromToday(-8), planEndDate: daysFromToday(61) }) },
    });
    const week = page.locator("#homeNotices .plan-week-notice");
    await expect(notices(page)).toContainText("Plan y recordatorios");
    await expect(page.locator(".home-primary-action")).toBeInViewport();
    await expect(week).toBeHidden();
    await expect(card(page)).toBeHidden();
    await notices(page).press("Enter");
    await expect(week).toBeVisible();
    const calendar = week.getByRole("button", { name: "Ver calendario" });
    await calendar.click();
    await expect(page.getByRole("dialog", { name: "Tu plan de entrenamiento" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(calendar).toBeFocused();
    await expect(card(page)).toContainText("Activa tus recordatorios");
    await expect(card(page)).toContainText("Un aviso al día como máximo, a las 20:00");
    await expect(card(page).getByRole("button", { name: "Activar avisos" })).toBeVisible();

    await card(page).getByRole("button", { name: "Ahora no" }).click();
    await expect(card(page)).toHaveCount(0);
    await expect(week).toBeVisible();
    await expect(notices(page)).toBeFocused();
    await expect(notices(page)).toContainText("Semana del plan");
    await page.reload();
    await gotoApp(page);
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".agenda-card").first()).toBeVisible();
    await expect(card(page)).toHaveCount(0);

    // Al día siguiente vuelve a aparecer.
    await page.evaluate(() => { localStorage.setItem(NOTIFY_NUDGE_KEY + ":" + uid(), "2000-01-01"); render(); });
    await notices(page).click();
    await expect(card(page)).toBeVisible();
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  test("'Activar avisos' pide el permiso, suscribe el dispositivo y la tarjeta desaparece", async ({ page, context }) => {
    await context.grantPermissions(["notifications"]);
    const { calls, errors } = await openHoy(page, context);
    await notices(page).click();
    await expect(card(page)).toBeVisible();
    // La suscripción real necesita el service worker (bloqueado en E2E): se guarda la preferencia.
    await page.evaluate(() => { window.subscribePush = async () => { await _savePushOptInDb(true); }; });
    await card(page).getByRole("button", { name: "Activar avisos" }).click();
    await expect(card(page)).toHaveCount(0);
    expect(prefsWrites(calls).some((r) => r.push_opt_in === true)).toBe(true);
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  // REQ-339: un fallo al activar deja rastro con el paso y el motivo, y cada
  // evento dice qué tarjeta vio la persona, en qué teléfono y si está instalada.
  test("si activar falla, el evento dice en qué paso y qué tarjeta se vio", async ({ page, context }) => {
    await context.grantPermissions(["notifications"]);
    const events = [];
    page.on("request", (req) => {
      if (req.url().includes("/api/analytics") && req.method() === "POST") {
        try { const b = JSON.parse(req.postData() || "{}"); if (b.event_type === "notifications_prompt") events.push(b.properties); } catch (_) {}
      }
    });
    const { errors } = await openHoy(page, context);
    await expect(notices(page)).toBeVisible();
    expect(events.some((e) => e.action === "shown")).toBe(false);
    await notices(page).click();
    await expect(card(page)).toBeVisible();
    await expect.poll(() => events.filter((e) => e.action === "shown").length).toBe(1);
    await notices(page).click();
    await expect(card(page)).toBeHidden();
    await notices(page).click();
    await page.evaluate(() => { window.subscribePush = async () => { throw Object.assign(new Error("x"), { name: "AbortError" }); }; });
    await card(page).getByRole("button", { name: "Activar avisos" }).click();
    await expect.poll(() => events.find((e) => e.action === "error")).toBeTruthy();
    const shown = events.find((e) => e.action === "shown");
    expect(shown).toMatchObject({ source: "home", state: "off", platform: "desktop", standalone: false });
    expect(events.filter((e) => e.action === "shown")).toHaveLength(1);
    expect(events.find((e) => e.action === "error")).toMatchObject({ source: "home", error_code: "subscribe:AbortError", state: "off" });
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  test("con los avisos bloqueados explica cómo permitirlos y ofrece el correo", async ({ page, context }) => {
    const { calls, errors } = await openHoy(page, context, {
      init: () => Object.defineProperty(Notification, "permission", { get: () => "denied" }),
    });
    await notices(page).click();
    await expect(card(page)).toContainText("Tus avisos están bloqueados");
    await expect(card(page)).toContainText("Ajustes → Notificaciones → Evolv");
    await card(page).getByRole("button", { name: "Recibir por correo" }).click();
    await expect(card(page)).toHaveCount(0);
    expect(prefsWrites(calls).some((r) => r.email_opt_in === true)).toBe(true);
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  test("con avisos activos no hay tarjeta", async ({ page, context }) => {
    await context.grantPermissions(["notifications"]);
    const { errors } = await openHoy(page, context, {
      mocks: {
        prefs: completePrefs({ planStartDate: daysFromToday(0), planEndDate: daysFromToday(69) }),
        tables: { notification_preferences: { row: { user_id: "x", push_opt_in: true, email_opt_in: false, notify_hour: 20 } } },
      },
    });
    await expect(page.locator(".agenda-card").first()).toBeVisible();
    await expect(card(page)).toHaveCount(0);
    await expect(notices(page)).toHaveCount(0);
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
});

test.describe("Avisos — iPhone fuera de la app instalada (REQ-289)", () => {
  test.use({ userAgent: IPHONE_UA });
  test("pide instalar desde Compartir, sin el banner flotante duplicado", async ({ page, context }) => {
    const { errors } = await openHoy(page, context);
    await notices(page).click();
    await expect(card(page)).toContainText("Instala Evolv para recibir avisos");
    await expect(card(page)).toContainText("Añadir a pantalla de inicio");
    await expect(page.locator("#a2hs")).toHaveCount(0);
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  // REQ-340: instalar en iPhone toma pasos; el correo es un toque y quita la tarjeta.
  test("ofrece el correo con un toque y, activado, la tarjeta se va", async ({ page, context }) => {
    const { calls, errors } = await openHoy(page, context);
    await notices(page).click();
    await expect(card(page)).toContainText("O recibe el recordatorio por correo a las 20:00");
    await card(page).getByRole("button", { name: "Recibir por correo" }).click();
    await expect(card(page)).toHaveCount(0);
    expect(prefsWrites(calls).some((r) => r.email_opt_in === true)).toBe(true);
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
});

test.describe("Avisos — al terminar el onboarding (REQ-289)", () => {
  test("al guardar el plan, con la semana lista, pide activar los avisos antes de Hoy", async ({ page, context }) => {
    // Recorrido real por saveOnboarding() (ciclo nuevo). Sin autoDismissNudges para ver la pantalla.
    const prefs = completePrefs({ planStartDate: daysFromToday(-30), planEndDate: daysFromToday(-30 + 69), restartNudgeDismissedAt: new Date().toISOString() });
    await installMocks(context, { tables: { profiles: { row: profileFixture(prefs) } } });
    await page.addInitScript(() => Object.defineProperty(Notification, "permission", { get: () => "default" }));
    await seedLoggedInUser(page);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);
    await page.locator("#tabs").getByText("Perfil").click();
    await page.keyboard.press("Escape");
    const objetivo = page.locator("details#pfSecObjetivo");
    if (!(await objetivo.evaluate((d) => d.open))) await objetivo.locator("summary").click();
    await page.getByRole("button", { name: "Empezar de nuevo mi plan" }).click();
    await page.locator("#overlay").getByRole("button", { name: "Revisar mis datos y empezar" }).click();
    for (let i = 0; i < 6; i++) {
      if (await page.getByRole("button", { name: "Guardar mi plan" }).isVisible().catch(() => false)) break;
      await page.getByRole("button", { name: "Continuar" }).click();
    }
    for (const s of await page.locator('#app select[id^="ob_safety_"]').all()) await s.selectOption("no");
    const omni = page.locator("#ob_diet_omnivoro");
    if (await omni.count() && !(await omni.isChecked())) await omni.check();
    const consent = page.locator("#ob_consent_core");
    if (await consent.count() && !(await consent.isChecked())) await consent.check();
    await page.getByRole("button", { name: "Guardar mi plan" }).click();

    await expect(page.locator("#app")).toContainText("Tu semana está lista. Que no se te pase.", { timeout: 20_000 });
    await expect(page.locator(".notify-step")).toHaveCount(1); // escritorio: sin paso de instalar
    await expect(page.getByRole("button", { name: "Activar avisos" })).toBeVisible();
    await expect(page.locator("#tabs")).toBeEmpty();
    await page.getByRole("button", { name: "Ahora no, ir a mi plan" }).click();
    await expect(page.locator("#tabs")).toContainText("Hoy");
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
});

// REQ-341: al cerrar la celebración de un día de racha se piden los avisos.
test.describe("Avisos — pedido al sumar un día de racha (REQ-341)", () => {
  const meal = (done) => ({ done, ovr: { name: "Comida registrada", kcal: 500, p: 30, c: 50, f: 15 } });
  const dayState = (complete) => ({ meals: { desayuno: meal(true), almuerzo: meal(complete), cena: meal(false) }, extras: [], workoutDone: true });
  async function openWithStreak(page, context) {
    const rows = [{ user_id: USER_ID, log_date: daysFromToday(-1), state: dayState(true), plan_version_id: null, updated_at: new Date().toISOString() },
      { user_id: USER_ID, log_date: daysFromToday(0), state: dayState(false), plan_version_id: null, updated_at: new Date().toISOString() }];
    const mocks = await installMocks(context, { tables: { day_log: { rows } } });
    await seedLoggedInUser(page);
    const cardio = page.locator('#overlay [onclick="dismissCardioNudge()"]');
    await page.addLocatorHandler(cardio, async () => { await cardio.click(); });
    const errors = collectConsoleErrors(page);
    await gotoApp(page);
    await page.waitForLoadState("networkidle");
    // Sumar el día de hoy y cerrar la celebración.
    await page.evaluate(() => toggleMeal(todayStr(), "almuerzo"));
    await page.locator("#streakPop .sp-card").click();
    return { ...mocks, errors };
  }

  test("pide los avisos tras celebrar y 'Sí, avísame' los activa", async ({ page, context }) => {
    await context.grantPermissions(["notifications"]);
    const { calls, errors } = await openWithStreak(page, context);
    const ask = page.locator("#overlay .sheet");
    await expect(ask).toContainText("¡2 días seguidos!");
    await expect(ask).toContainText("¿Te aviso mañana a las 20:00 si te falta algo para sumar el día 3?");
    await page.evaluate(() => { window.subscribePush = async () => { await _savePushOptInDb(true); }; });
    await ask.getByRole("button", { name: "Sí, avísame" }).click();
    await expect.poll(() => prefsWrites(calls).some((r) => r.push_opt_in === true)).toBe(true);
    await expect(page.locator("#overlay")).toHaveCount(0);
    expect(await page.evaluate(() => notifyAskCount())).toBe(1);
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  // REQ-361: quien cerró la tarjeta de Hoy igual ve el pedido al sumar su día.
  test("tras 'Ahora no' en la tarjeta de Hoy, el pedido aparece al sumar el día", async ({ page, context }) => {
    await context.grantPermissions(["notifications"]);
    const rows = [{ user_id: USER_ID, log_date: daysFromToday(-1), state: dayState(true), plan_version_id: null, updated_at: new Date().toISOString() },
      { user_id: USER_ID, log_date: daysFromToday(0), state: dayState(false), plan_version_id: null, updated_at: new Date().toISOString() }];
    await installMocks(context, { tables: { day_log: { rows } } });
    await seedLoggedInUser(page);
    await gotoApp(page);
    await page.waitForLoadState("networkidle");
    await notices(page).click();
    await page.locator(".notify-card").getByRole("button", { name: "Ahora no" }).click();
    await expect(page.locator(".notify-card")).toHaveCount(0);
    await page.evaluate(() => toggleMeal(todayStr(), "almuerzo"));
    await page.locator("#streakPop .sp-card").click();
    await expect(page.locator("#overlay .sheet")).toContainText("¡2 días seguidos!");
  });

  test("como mucho dos veces: la segunda, desde 3 días; el 'Ahora no' de la tarjeta no lo calla", async ({ page, context }) => {
    await context.grantPermissions(["notifications"]);
    await openWithStreak(page, context);
    await page.locator("#overlay [data-notify-ask-dismiss]").click();
    await expect(page.locator("#overlay")).toHaveCount(0);
    expect(await page.evaluate(() => [notifyAskWanted(2), notifyAskWanted(3)])).toEqual([false, true]);
    expect(await page.evaluate(() => { localStorage.setItem(NOTIFY_ASK_KEY + ":" + uid(), "2"); return notifyAskWanted(9); })).toBe(false);
    expect(await page.evaluate(() => { localStorage.setItem(NOTIFY_ASK_KEY + ":" + uid(), "0"); localStorage.setItem(NOTIFY_NUDGE_KEY + ":" + uid(), todayStr()); return notifyAskWanted(1); })).toBe(true);
  });
});

test.describe("Avisos — pedido al sumar un día en iPhone sin instalar (REQ-341)", () => {
  test.use({ userAgent: IPHONE_UA });
  test("ofrece el correo y explica cómo instalar", async ({ page, context }) => {
    const meal = (done) => ({ done, ovr: { name: "Comida registrada", kcal: 500, p: 30, c: 50, f: 15 } });
    const st = (c) => ({ meals: { desayuno: meal(true), almuerzo: meal(c), cena: meal(false) }, extras: [], workoutDone: true });
    const rows = [{ user_id: USER_ID, log_date: daysFromToday(0), state: st(false), plan_version_id: null, updated_at: new Date().toISOString() }];
    const { calls } = await installMocks(context, { tables: { day_log: { rows } } });
    await seedLoggedInUser(page);
    await gotoApp(page);
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => toggleMeal(todayStr(), "almuerzo"));
    await page.locator("#streakPop .sp-card").click();
    const ask = page.locator("#overlay .sheet");
    await expect(ask).toContainText("¡Empezó tu racha!");
    await expect(ask).toContainText("Añadir a pantalla de inicio");
    await ask.getByRole("button", { name: "Sí, por correo" }).click();
    await expect.poll(() => prefsWrites(calls).some((r) => r.email_opt_in === true)).toBe(true);
  });
});
