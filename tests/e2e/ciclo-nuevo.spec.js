// REQ-214: empezar de nuevo el plan (4 o 10 semanas) en cualquier momento, y
// sugerirlo tras dos semanas sin entrenar. El historial se conserva.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, gotoApp, autoDismissNudges, collectConsoleErrors, completePrefs, profileFixture, daysFromToday, todayYmd } from "./helpers.js";

const lastPayload = (calls, table) => {
  const c = calls.filter((x) => x.table === table && x.method === "POST").at(-1);
  return c && (Array.isArray(c.payload) ? c.payload[0] : c.payload);
};

test("en la semana 5, 'Empezar de nuevo' con 4 semanas arranca hoy el ciclo 2 y archiva el anterior", async ({ page, context }) => {
  const prefs = completePrefs({ planStartDate: daysFromToday(-30), planEndDate: daysFromToday(-30 + 69), restartNudgeDismissedAt: new Date().toISOString() });
  const { calls } = await installMocks(context, { tables: { profiles: { row: profileFixture(prefs) } } });
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const errors = collectConsoleErrors(page);
  await gotoApp(page);
  await page.locator("#tabs").getByText("Perfil").click();
  await page.keyboard.press("Escape");
  const objetivo = page.locator("details#pfSecObjetivo");
  if (!(await objetivo.evaluate((d) => d.open))) await objetivo.locator("summary").click();
  await page.getByRole("button", { name: "Empezar de nuevo mi plan" }).click();
  const sheet = page.locator("#overlay");
  await expect(sheet).toContainText("Tu historial y tu progreso se conservan");
  await sheet.locator("#restartDuration").selectOption("4");
  await sheet.getByRole("button", { name: "Revisar mis datos y empezar" }).click();

  // Onboarding con los datos actuales precargados
  await expect(page.locator("#ob_name")).toHaveValue("Bro de Pruebas");
  const archived = lastPayload(calls, "plan_cycles");
  expect(archived.status).toBe("completed");
  expect(archived.summary.interrupted).toBe(true);
  expect(archived.end_date).toBe(daysFromToday(-1));

  for (let i = 0; i < 6; i++) {
    const guardar = page.getByRole("button", { name: "Guardar mi plan" });
    if (await guardar.isVisible().catch(() => false)) break;
    await page.getByRole("button", { name: "Continuar" }).click();
  }
  await expect(page.locator("#ob_duration")).toHaveCount(0); // ya pasó el paso de entrenamiento
  for (const s of await page.locator('#app select[id^="ob_safety_"]').all()) await s.selectOption("no");
  const omni = page.locator("#ob_diet_omnivoro");
  if (await omni.count() && !(await omni.isChecked())) await omni.check();
  const consent = page.locator("#ob_consent_core");
  if (await consent.count() && !(await consent.isChecked())) await consent.check();
  await page.getByRole("button", { name: "Guardar mi plan" }).click();
  await expect(page.locator("#tabs")).toContainText("Hoy");

  const saved = lastPayload(calls, "profiles").prefs;
  expect(saved.planStartDate).toBe(todayYmd());
  expect(Number(saved.planCycleNumber)).toBe(2);
  expect(Number(saved.planDurationWeeks)).toBe(4);
  expect(saved.restartCycle).toBe(false);
  expect(saved.onboardingPending).toBe(false);
  expect(errors).toEqual([]);
});

test("tras dos semanas sin entrenar, Hoy sugiere retomar o empezar de nuevo", async ({ page, context }) => {
  const prefs = completePrefs({ planStartDate: daysFromToday(-20), planEndDate: daysFromToday(-20 + 69) });
  const { calls } = await installMocks(context, { tables: { profiles: { row: profileFixture(prefs) } } });
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  await gotoApp(page);
  const app = page.locator("#app");
  await expect(app).toContainText("Hace 2 semanas que no entrenas");
  await app.getByRole("button", { name: "Retomar" }).click();
  await expect(app).not.toContainText("que no entrenas");
  await expect.poll(() => lastPayload(calls, "profiles")?.prefs?.restartNudgeDismissedAt).toBeTruthy();
});
