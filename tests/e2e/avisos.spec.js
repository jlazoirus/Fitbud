// REQ-289: al terminar el onboarding se pide instalar la app y activar los
// avisos; después, Hoy lo recuerda cada día hasta que estén activos.
import { test, expect } from "@playwright/test";
import {
  installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges, profileFixture, completePrefs, daysFromToday,
} from "./helpers.js";

const IPHONE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const card = (page) => page.locator(".notify-card");
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
  test("sin avisos activos, Hoy lo recuerda; 'Ahora no' lo oculta hasta mañana", async ({ page, context }) => {
    const { errors } = await openHoy(page, context);
    await expect(card(page)).toContainText("Activa los avisos para no perder tu racha");
    await expect(card(page)).toContainText("Un aviso al día como máximo, a las 20:00");
    await expect(card(page).getByRole("button", { name: "Activar avisos" })).toBeVisible();

    await card(page).getByRole("button", { name: "Ahora no" }).click();
    await expect(card(page)).toHaveCount(0);
    await page.reload();
    await gotoApp(page);
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".agenda-card").first()).toBeVisible();
    await expect(card(page)).toHaveCount(0);

    // Al día siguiente vuelve a aparecer.
    await page.evaluate(() => { localStorage.setItem(NOTIFY_NUDGE_KEY + ":" + uid(), "2000-01-01"); render(); });
    await expect(card(page)).toBeVisible();
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  test("'Activar avisos' pide el permiso, suscribe el dispositivo y la tarjeta desaparece", async ({ page, context }) => {
    await context.grantPermissions(["notifications"]);
    const { calls, errors } = await openHoy(page, context);
    await expect(card(page)).toBeVisible();
    // La suscripción real necesita el service worker (bloqueado en E2E): se guarda la preferencia.
    await page.evaluate(() => { window.subscribePush = async () => { await _savePushOptInDb(true); }; });
    await card(page).getByRole("button", { name: "Activar avisos" }).click();
    await expect(card(page)).toHaveCount(0);
    expect(prefsWrites(calls).some((r) => r.push_opt_in === true)).toBe(true);
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  test("con los avisos bloqueados explica cómo permitirlos y ofrece el correo", async ({ page, context }) => {
    const { calls, errors } = await openHoy(page, context, {
      init: () => Object.defineProperty(Notification, "permission", { get: () => "denied" }),
    });
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
      mocks: { tables: { notification_preferences: { row: { user_id: "x", push_opt_in: true, email_opt_in: false, notify_hour: 20 } } } },
    });
    await expect(page.locator(".agenda-card").first()).toBeVisible();
    await expect(card(page)).toHaveCount(0);
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
});

test.describe("Avisos — iPhone fuera de la app instalada (REQ-289)", () => {
  test.use({ userAgent: IPHONE_UA });
  test("pide instalar desde Compartir, sin el banner flotante duplicado", async ({ page, context }) => {
    const { errors } = await openHoy(page, context);
    await expect(card(page)).toContainText("Instala Evolv para recibir avisos");
    await expect(card(page)).toContainText("Añadir a pantalla de inicio");
    await expect(page.locator("#a2hs")).toHaveCount(0);
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
});

test.describe("Avisos — al terminar el onboarding (REQ-289)", () => {
  test("al guardar el plan, con la semana lista, pide activar los avisos antes de Hoy", async ({ page, context }) => {
    // Recorrido real por saveOnboarding() (ciclo nuevo). Sin autoDismissNudges para ver la pantalla.
    const prefs = completePrefs({ planStartDate: daysFromToday(-30), planEndDate: daysFromToday(-30 + 69), restartNudgeDismissedAt: new Date().toISOString() });
    await installMocks(context, { tables: { profiles: { row: profileFixture(prefs) } } });
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
