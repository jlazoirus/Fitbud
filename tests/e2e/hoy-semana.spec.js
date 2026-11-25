// REQ-416: «Esta semana» en Hoy. Cuenta lo hecho (comidas no saltadas y
// entreno en días de entreno) sobre lo que ya tocaba hasta ahora: los días
// pasados completos y, de hoy, lo hecho más lo pendiente cuya hora pasó.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, gotoApp, autoDismissNudges, collectConsoleErrors, completePrefs, daysFromToday } from "./helpers.js";

async function boot(page, context, prefs) {
  const errors = collectConsoleErrors(page);
  const paid = [];
  page.on("request", (req) => { if (req.url().includes("/api/claude")) paid.push(req.url()); });
  await installMocks(context, { prefs: completePrefs(prefs) });
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  await gotoApp(page);
  return { errors, paid };
}

test.describe("Hoy — Esta semana (REQ-416)", () => {
  test("barras por día, porcentaje sobre lo que ya tocaba y semana pasada", async ({ page, context }) => {
    // Inicio hace 9 días: la semana del plan va de anteayer a dentro de 4 días.
    const { errors, paid } = await boot(page, context, { planStartDate: daysFromToday(-9), planEndDate: daysFromToday(60) });
    const keys = await page.evaluate(() => {
      const today = todayStr();
      const own = (m) => ({ name: "Mi " + m.slot, kcal: 500, p: 30, c: 50, f: 15 });
      // Anteayer y ayer, descanso: solo cuentan sus tres comidas.
      for (const [offset, registered] of [[-2, 3], [-1, 1]]) {
        const ds = addDays(today, offset);
        dayState(ds).workoutOverride = "descanso";
        buildDay(ds).meals.forEach((m, i) => { if (i < registered) dayState(ds).meals[m.id] = { done: true, ovr: own(m) }; });
      }
      const breakfast = buildDay(today).meals[0];
      mealState(today, breakfast.id).ovr = own(breakfast);
      toggleMeal(today, breakfast.id);
      window.homeNowHM = () => "21:00";
      renderHoy();
      return Object.keys(S.days).sort();
    });

    const week = page.locator(".home-week");
    await expect(week.locator("h2")).toHaveText("Esta semana");
    // 3 + 1 + 1 hechas sobre 3 + 3 + 4 (a las 21:00 ya tocaba todo lo de hoy).
    await expect(week.locator(".home-week-head")).toContainText("50 % cumplido");
    await expect(week.locator(".home-week-rule")).toHaveText("Lo hecho sobre lo que ya tocaba hasta ahora: 5 de 10.");
    await expect(week.locator(".hw-day")).toHaveCount(7);
    const fills = await week.locator(".hw-day").evaluateAll((days) => days.map((d) => d.querySelector("i")?.style.height || ""));
    expect(fills).toEqual(["100%", "33%", "25%", "", "", "", ""]);
    await expect(week.locator(".hw-day").nth(2)).toHaveClass(/is-today/);
    await expect(week.locator(".hw-day.is-future")).toHaveCount(4);
    const label = await week.locator(".home-week-bars").getAttribute("aria-label");
    expect(label).toContain(": 3 de 3.");
    expect(label).toContain(": 1 de 4.");
    expect(label).toContain(": por venir");
    // La semana anterior entra completa, sin registros.
    await expect(week.locator(".home-week-last")).toHaveText(/^Semana pasada: 0 % · 0 de \d+$/);
    // El plan de hoy y la barra de hoy usan el mismo conteo.
    await expect(page.locator(".day-plan-count")).toHaveText("1/4");

    // A las 07:30 solo tocaba el entreno; el desayuno registrado cuenta igual.
    await page.evaluate(() => { window.homeNowHM = () => "07:30"; renderHoy(); });
    await expect(week.locator(".home-week-head")).toContainText("63 % cumplido");
    await expect(week.locator(".home-week-rule")).toHaveText("Lo hecho sobre lo que ya tocaba hasta ahora: 5 de 8.");

    // Calcular la semana no crea días nuevos en el historial.
    expect(await page.evaluate(() => Object.keys(S.days).sort())).toEqual(keys);
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 800 });
      await week.scrollIntoViewIfNeeded();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    expect(paid).toEqual([]);
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  test("el primer día aparece cuando algo ya tocaba y sube al registrar", async ({ page, context }) => {
    const { errors, paid } = await boot(page, context, { planStartDate: daysFromToday(0), planEndDate: daysFromToday(69) });
    const week = page.locator(".home-week");
    // Antes de la primera hora del día no hay nada que medir ni semana anterior.
    await page.evaluate(() => { window.homeNowHM = () => "06:00"; renderHoy(); });
    await expect(week).toHaveCount(0);

    // A las 10:00 ya tocaban el entreno de la mañana y el desayuno.
    await page.evaluate(() => { window.homeNowHM = () => "10:00"; renderHoy(); });
    await expect(week.locator(".home-week-head")).toContainText("0 % cumplido");
    await expect(week.locator(".home-week-rule")).toHaveText("Lo hecho sobre lo que ya tocaba hasta ahora: 0 de 2.");
    await expect(week.locator(".home-week-last")).toHaveCount(0);
    await expect(week.locator(".hw-day").first()).toHaveClass(/is-today/);

    await page.evaluate(() => {
      const ds = todayStr(), breakfast = buildDay(ds).meals[0];
      mealState(ds, breakfast.id).ovr = { name: "Mi desayuno", kcal: 400, p: 25, c: 45, f: 13 };
      toggleMeal(ds, breakfast.id);
    });
    await expect(week.locator(".home-week-head")).toContainText("50 % cumplido");
    await expect(week.locator(".home-week-rule")).toHaveText("Lo hecho sobre lo que ya tocaba hasta ahora: 1 de 2.");
    await expect(week.locator(".hw-day.is-today i")).toHaveAttribute("style", "height:25%");
    expect(paid).toEqual([]);
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
});
