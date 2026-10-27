// REQ-283: cada registro que acerca el día a la racha muestra la píldora de
// racha (lo que falta); al cumplir el día el número sube. Desmarcar no anima.
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
// Hoy: tres comidas listas sin marcar (la racha pide dos) y el entreno pendiente.
const todayPlanned = () => ({ meals: { desayuno: meal(false), almuerzo: meal(false), cena: meal(false) }, extras: [], workoutDone: false });

const pop = (page) => page.locator("#streakPop .sp-card");

test.describe("Racha — animación al registrar (REQ-283)", () => {
  test("registrar comidas muestra lo que falta y convertir en descanso suma el día", async ({ page, context }) => {
    const rows = [row(-3, doneDay()), row(-2, doneDay()), row(-1, doneDay()), row(0, todayPlanned())];
    await installMocks(context, { tables: { day_log: { rows } } });
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);

    await gotoApp(page);
    await page.waitForLoadState("networkidle");
    await expect(pop(page)).toHaveCount(0);

    const register = page.locator(".agenda-item").getByRole("button", { name: "Registrar" });
    await register.first().click();
    await expect(pop(page)).toBeVisible();
    await expect(pop(page)).toContainText("Faltan 1 comida y el entreno");
    await expect(pop(page)).toContainText("para sumar el día 4 de tu racha");
    await expect(page.locator("#streakPop")).toHaveAttribute("role", "status");

    await register.first().click();
    await expect(pop(page)).toContainText("Falta el entreno");

    await page.locator("#tabs").getByText("Entreno").click();
    await page.getByRole("button", { name: "Me perdí la sesión" }).click();
    await page.locator("#overlay").getByRole("button", { name: /Convertir en descanso/ }).click();
    await expect(pop(page)).toHaveClass(/sp-day/);
    await expect(pop(page)).toContainText("Día 4 sumado");
    await expect(pop(page).locator(".sp-from")).toHaveText("3");
    await expect(pop(page).locator(".sp-to")).toHaveText("4");

    // Tocar la píldora la cierra.
    await pop(page).click();
    await expect(pop(page)).toHaveCount(0);

    // Desmarcar una comida rompe el día de hoy pero no anima nada.
    await page.evaluate(() => toggleMeal(todayStr(), "desayuno"));
    await page.waitForTimeout(300);
    await expect(pop(page)).toHaveCount(0);

    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  test("el primer día tras una racha rota dice que empezó la racha", async ({ page, context }) => {
    const partial = { ...todayPlanned(), meals: { desayuno: meal(true), almuerzo: meal(false), cena: meal(false) } };
    const rows = [row(-1, { meals: {}, extras: [], workoutDone: false }), row(0, { ...partial, workoutDone: true })];
    await installMocks(context, { tables: { day_log: { rows } } });
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);

    await gotoApp(page);
    await page.waitForLoadState("networkidle");
    await page.locator(".agenda-item").getByRole("button", { name: "Registrar" }).first().click();
    await expect(pop(page)).toContainText("Día 1");
    await expect(pop(page)).toContainText("Empezó tu racha.");
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  test("completar ayer dentro de la ventana de corrección recupera la racha", async ({ page, context }) => {
    const yesterdayPartial = { meals: { desayuno: meal(true), almuerzo: meal(false), cena: meal(false) }, extras: [], workoutDone: true };
    const rows = [row(-4, doneDay()), row(-3, doneDay()), row(-2, doneDay()), row(-1, yesterdayPartial)];
    await installMocks(context, { tables: { day_log: { rows } } });
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);

    await gotoApp(page);
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => toggleMeal(addDays(todayStr(), -1), "almuerzo"));
    await expect(pop(page)).toHaveClass(/sp-recovered/);
    await expect(pop(page)).toContainText("Racha recuperada");
    await expect(pop(page)).toContainText("Vuelves a llevar 4 días seguidos.");
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
});
