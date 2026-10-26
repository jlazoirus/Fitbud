// REQ-284: al volver, Hoy reconoce la ausencia. Rescate de ayer (ventana de
// corrección de REQ-23) o bienvenida con progreso, objetivo y semana del plan.
import { test, expect } from "@playwright/test";
import {
  installMocks,
  seedLoggedInUser,
  collectConsoleErrors,
  gotoApp,
  autoDismissNudges,
  daysFromToday,
  USER_ID,
} from "./helpers.js";

const meal = (done) => ({ done, ovr: { name: "Comida del plan", kcal: 500, p: 30, c: 50, f: 15 } });
const row = (offset, state) => ({
  user_id: USER_ID,
  log_date: daysFromToday(offset),
  state,
  plan_version_id: null,
  updated_at: new Date().toISOString(),
});
const doneDay = () => ({ meals: { desayuno: meal(true), almuerzo: meal(true), cena: meal(true) }, extras: [], workoutDone: true });
const plannedDay = () => ({ meals: { desayuno: meal(false), almuerzo: meal(false), cena: meal(false) }, extras: [], workoutDone: false });
const card = (page) => page.locator(".return-card");

async function open(page, context, rows) {
  await installMocks(context, { tables: { day_log: { rows } } });
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const errors = collectConsoleErrors(page);
  await gotoApp(page);
  await page.waitForLoadState("networkidle");
  return errors;
}

test.describe("Hoy — tarjeta de regreso (REQ-284)", () => {
  test("ayer sin registrar con racha previa: rescatarlo recupera la racha", async ({ page, context }) => {
    const rows = [row(-4, doneDay()), row(-3, doneDay()), row(-2, doneDay()), row(-1, plannedDay()), row(0, plannedDay())];
    const errors = await open(page, context, rows);

    await expect(card(page)).toHaveCount(1);
    await expect(card(page)).toContainText("Ayer quedó sin registrar");
    await expect(card(page)).toContainText("tu racha de 3 días sigue en pie");

    await card(page).getByRole("button", { name: "Registrar ayer" }).click();
    const yesterday = await page.evaluate(() => addDays(todayStr(), -1));
    expect(await page.evaluate(() => ({ view, current }))).toEqual({ view: "nutricion", current: yesterday });

    await page.evaluate((ds) => toggleMeal(ds, "desayuno"), yesterday);
    await expect(page.locator("#streakPop .sp-card")).toContainText("para recuperar tu racha de 3 días");
    await page.evaluate((ds) => { toggleMeal(ds, "almuerzo"); const st = dayState(ds); st.workoutDone = true; commitDay(ds); render(); }, yesterday);
    await expect(page.locator("#streakPop .sp-card")).toContainText("Racha recuperada");
    await expect(page.locator("#streakPop .sp-card")).toContainText("Vuelves a llevar 4 días seguidos.");

    await page.locator("#tabs").getByText("Hoy").click();
    await expect(card(page)).toHaveCount(0);
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  test("'Empezar hoy' descarta el rescate en este dispositivo", async ({ page, context }) => {
    const rows = [row(-3, doneDay()), row(-2, doneDay()), row(-1, plannedDay())];
    const errors = await open(page, context, rows);
    await card(page).getByRole("button", { name: "Empezar hoy" }).click();
    await expect(card(page)).toHaveCount(0);
    await page.reload();
    await gotoApp(page);
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".agenda-card").first()).toBeVisible();
    await expect(card(page)).toHaveCount(0);
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  test("tras varios días fuera da la bienvenida con progreso y objetivo; registrar hoy la oculta", async ({ page, context }) => {
    const rows = [row(-8, doneDay()), row(-7, doneDay()), row(-6, doneDay()), row(-5, doneDay()), row(0, plannedDay())];
    const errors = await open(page, context, rows);

    await expect(card(page)).toContainText("Qué bueno verte de vuelta");
    await expect(card(page)).toContainText("Tu racha se reinició, tu progreso no: en este plan llevas 4 días registrados y 4 entrenos, con una mejor racha de 4 días.");
    await expect(card(page).locator(".return-goal")).toHaveText(/^Tu objetivo: Bajar grasa · semana \d+ de 10$/);

    await page.locator(".agenda-item").getByRole("button", { name: "Registrar" }).first().click();
    await expect(card(page)).toHaveCount(0);
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  test("sin ningún registro desde que empezó el plan invita a empezar", async ({ page, context }) => {
    const errors = await open(page, context, []);
    await expect(card(page)).toContainText("Tu plan te espera");
    await expect(card(page)).toContainText("Aún no registras tu primer día.");
    await card(page).getByRole("button", { name: "Empezar hoy" }).click();
    await expect(card(page)).toHaveCount(0);
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  test("con racha viva no hay tarjeta", async ({ page, context }) => {
    const rows = [row(-2, doneDay()), row(-1, doneDay()), row(0, plannedDay())];
    const errors = await open(page, context, rows);
    await expect(page.locator(".agenda-card").first()).toBeVisible();
    await expect(card(page)).toHaveCount(0);
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
});
