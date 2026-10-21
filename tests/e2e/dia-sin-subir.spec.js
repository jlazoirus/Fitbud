// REQ-242 (feedback Sathya, beta): lo registrado ayer cuya subida falló no
// desaparece al abrir la app al día siguiente, ni se pisa al completar el día.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges, daysFromToday } from "./helpers.js";

async function openAppOn(context, when) {
  const page = await context.newPage();
  await page.clock.install({ time: when });
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const errors = collectConsoleErrors(page);
  await gotoApp(page);
  // Los 401 simulados de las subidas son esperados; cualquier otro error no.
  return { page, get errors() { return errors.filter((e) => !/status of 401/.test(e)); } };
}

async function editMeal(page, ds, id, name, kcal) {
  await page.evaluate(([d, m]) => openEditor("meal", d, m), [ds, id]);
  await page.locator("#f_name").fill(name);
  await page.locator("#f_kcal").fill(String(kcal));
  await page.locator("#overlay").getByRole("button", { name: "Guardar", exact: true }).click();
}

const mealNames = (state) =>
  Object.fromEntries(Object.entries((state && state.meals) || {}).map(([k, v]) => [k, { done: !!v.done, name: v.ovr ? v.ovr.name : null }]));

test("lo de ayer que no subió sigue visible al día siguiente y no se pisa al completar la cena", async ({ context }) => {
  const { calls } = await installMocks(context);
  // Subidas de day_log: fallan mientras failWrites o mientras queden failLeft (token vencido / red).
  let failWrites = false;
  let failLeft = 0;
  await context.route("**/rest/v1/day_log*", (route) => {
    if (route.request().method() !== "GET" && (failWrites || failLeft > 0)) {
      if (failLeft > 0) failLeft--;
      return route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ code: "PGRST301", message: "JWT expired" }) });
    }
    return route.fallback();
  });
  const ayer = daysFromToday(-1);

  // Ayer: prepara el día y luego registra lo que de verdad comió, sin que llegue al servidor.
  const d1 = await openAppOn(context, new Date(`${ayer}T10:00:00-05:00`));
  await d1.page.getByRole("button", { name: /Preparar mi día/i }).first().click();
  await d1.page.locator("#overlay").getByRole("button", { name: /Aplicar al día/i }).click();
  failWrites = true;
  await editMeal(d1.page, ayer, "desayuno", "6 huevos con pan con queso y café", 700);
  await d1.page.evaluate((d) => toggleMeal(d, "desayuno"), ayer);
  await editMeal(d1.page, ayer, "almuerzo", "Lomo saltado", 750);
  await d1.page.evaluate((d) => toggleMeal(d, "almuerzo"), ayer);
  await expect.poll(() => d1.page.evaluate(() => _getSyncQ().filter((x) => x.entity === "day_log").length)).toBe(1);
  expect(d1.errors, `Errores de consola:\n${d1.errors.join("\n")}`).toEqual([]);
  await d1.page.close();

  // Hoy: el primer reintento también falla; ayer debe seguir mostrando lo registrado.
  failWrites = false;
  failLeft = 1;
  const d2 = await openAppOn(context, new Date(`${daysFromToday(0)}T09:40:00-05:00`));
  await d2.page.evaluate((d) => goDay(d), ayer);
  const app = d2.page.locator("#app");
  await expect(app).toContainText("6 huevos con pan con queso y café");
  await expect(app).toContainText("Lomo saltado");
  await expect(d2.page.getByRole("button", { name: "Desayuno: hecha, tocar para desmarcar" })).toBeVisible();

  // Completa la cena que le quedó pendiente: lo que sube conserva desayuno y almuerzo.
  await editMeal(d2.page, ayer, "cena", "Sopa de pollo", 500);
  await expect
    .poll(() => {
      const last = calls.filter((c) => c.table === "day_log" && c.payload && c.payload.log_date === ayer).at(-1);
      return mealNames(last && last.payload.state);
    })
    .toMatchObject({
      desayuno: { done: true, name: "6 huevos con pan con queso y café" },
      almuerzo: { done: true, name: "Lomo saltado" },
      cena: { name: "Sopa de pollo" },
    });
  await expect.poll(() => d2.page.evaluate(() => _getSyncQ().length)).toBe(0);
  expect(d2.errors, `Errores de consola:\n${d2.errors.join("\n")}`).toEqual([]);
});

test("un cambio que agotó sus intentos se vuelve a subir al abrir la app", async ({ page, context }) => {
  const { calls } = await installMocks(context);
  const ayer = daysFromToday(-1);
  await page.addInitScript(([ds, uidValue]) => {
    if (sessionStorage.getItem("seeded")) return;
    sessionStorage.setItem("seeded", "1");
    const state = { meals: { desayuno: { done: true, ovr: { name: "Avena con plátano", kcal: 400, p: 15, c: 70, f: 8 } } }, extras: [], workoutDone: false };
    localStorage.setItem("fitbud_syncq_v1", JSON.stringify([{
      id: "q1", uid: uidValue, entity: "day_log", entityKey: ds,
      payload: { user_id: uidValue, log_date: ds, state, plan_version_id: null, updated_at: new Date().toISOString() },
      ts: new Date().toISOString(), retries: 3, status: "failed", clientId: "c_e2e", baseRemoteUpdatedAt: null, basePayload: null,
    }]));
  }, [ayer, "e2e00000-0000-4000-8000-000000000001"]);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const errors = collectConsoleErrors(page);
  await gotoApp(page);

  await expect
    .poll(() => calls.filter((c) => c.table === "day_log" && c.payload && c.payload.log_date === ayer).length)
    .toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => _getSyncQ().length)).toBe(0);
  await page.evaluate((d) => goDay(d), ayer);
  await expect(page.locator("#app")).toContainText("Avena con plátano");
  expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
});
