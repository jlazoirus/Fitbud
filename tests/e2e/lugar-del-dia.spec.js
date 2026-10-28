// REQ-291: entrenar un día en otro lugar (casa, gimnasio o aire libre) sin
// cambiar el perfil. La sesión del plan se adapta al lugar: mismos días y
// mismos grupos musculares; el resto de la semana sigue igual.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges, completePrefs, daysFromToday, trainingDaysIncludingToday } from "./helpers.js";

// Todos los ejercicios de la sesión se pueden hacer en ese lugar.
const allDoableAt = (page, ds, place) =>
  page.evaluate(([d, p]) => {
    const ids = effectiveWorkout(d).workout.exerciseIds;
    return ids.length > 0 && ids.every((id) => {
      const ex = exerciseBySlug(id, true);
      return ex && exerciseArray(ex.places).includes(p);
    });
  }, [ds, place]);

test.describe("Entreno: lugar de un día", () => {
  test("mañana en casa: la sesión de gimnasio se adapta solo ese día y se puede volver", async ({ page, context }) => {
    const { calls } = await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);

    await page.locator("#tabs").getByText("Entreno").click();
    const app = page.locator("#app");
    await app.locator(".daynav button").last().click();
    const manana = daysFromToday(1);
    const nombre = app.locator(".workout .name").first();
    await expect(nombre).toContainText("Gimnasio ·");
    const sesion = (await nombre.innerText()).replace(/^Gimnasio · /, "").trim();
    await expect(app).toContainText("Adaptar mañana:");
    await expect(app.locator(".wk-location")).toHaveText("Lugar: Gimnasio");

    await page.getByRole("button", { name: "En casa", exact: true }).click();
    const overlay = page.locator("#overlay");
    await expect(overlay).toContainText("¿Dónde entrenas mañana?");
    await expect(overlay.getByRole("button", { name: /Gimnasio · tu plan ✓/ })).toBeVisible();
    await overlay.getByRole("button", { name: /^Casa/ }).click();

    await expect(nombre).toContainText(`Peso corporal · ${sesion}`);
    await expect(app.locator(".wk-location")).toHaveText("Lugar: Casa · solo este día");
    expect(await allDoableAt(page, manana, "home")).toBe(true);
    // Solo ese día: pasado mañana y el perfil siguen en gimnasio.
    expect(await page.evaluate((d) => effectiveWorkout(d).workout.kind, daysFromToday(2))).toBe("Gimnasio");
    expect(await page.evaluate(() => profile.prefs.strengthPlace || profile.prefs.strengthMode)).toBe("gym");
    // Se sincroniza con el día.
    await expect
      .poll(() => calls.filter((c) => c.table === "day_log" && c.payload && c.payload.log_date === manana).map((c) => c.payload.state.trainingPlace).at(-1))
      .toBe("home");

    await page.getByRole("button", { name: "Volver al gimnasio" }).click();
    await expect(nombre).toContainText(`Gimnasio · ${sesion}`);
    await expect(app.locator(".wk-location")).toHaveText("Lugar: Gimnasio");
    expect(await page.evaluate((d) => dayState(d).trainingPlace, manana)).toBeUndefined();
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  test("hoy en casa: la sesión guiada usa ejercicios de casa y el cambio sobrevive a recargar", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);

    await page.locator("#tabs").getByText("Entreno").click();
    const app = page.locator("#app");
    await expect(app).toContainText("Adaptar hoy:");
    // El coach (adaptar_entreno con "equipo") abre la misma hoja.
    await page.evaluate(() => openWorkoutContingency(todayStr(), "equipo"));
    const overlay = page.locator("#overlay");
    await expect(overlay).toContainText("¿Dónde entrenas hoy?");
    await overlay.getByRole("button", { name: /^Aire libre/ }).click();
    await expect(app.locator(".wk-location")).toHaveText("Lugar: Exterior · solo este día");
    // Aire libre usa las mismas sesiones de peso corporal que un perfil de aire libre.
    await expect(app.locator(".workout .name").first()).toContainText("Peso corporal ·");

    await page.getByRole("button", { name: "Cambiar lugar" }).click();
    await overlay.getByRole("button", { name: /^Casa/ }).click();
    await expect(app.locator(".workout .name").first()).toContainText("Peso corporal ·");
    const today = await page.evaluate(() => todayStr());
    expect(await allDoableAt(page, today, "home")).toBe(true);
    // La prescripción que arranca la sesión guiada es la de casa.
    const prescritos = await page.evaluate((d) => [...new Set(workoutPrescription(d).steps.filter((s) => s.type === "strength").map((s) => s.exerciseSlug))], today);
    const enCasa = await page.evaluate((d) => effectiveWorkout(d).workout.exerciseIds, today);
    expect(prescritos.length).toBeGreaterThan(0);
    expect(enCasa).toEqual(expect.arrayContaining(prescritos));

    await gotoApp(page);
    await page.locator("#tabs").getByText("Entreno").click();
    await expect(app.locator(".workout .name").first()).toContainText("Peso corporal ·");
    await expect(app.locator(".wk-location")).toHaveText("Lugar: Casa · solo este día");
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  test("en un día de carrera: se elige una sesión de gimnasio y se hace en casa", async ({ page, context }) => {
    // Prioridad rendimiento: hoy (exterior) toca correr.
    const today = new Date().getDay();
    const days = trainingDaysIncludingToday();
    const prefs = completePrefs({
      primarySport: "running", trainingPriority: "performance",
      trainingDays: days, trainingLocations: Object.fromEntries(days.map((d) => [d, d === today ? "outdoor" : "gym"])),
    });
    await installMocks(context, { prefs });
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);

    await page.locator("#tabs").getByText("Entreno").click();
    const app = page.locator("#app");
    const nombre = app.locator(".workout .name").first();
    await expect(nombre).toContainText("Correr ·");

    await page.getByRole("button", { name: "Cambiar entrenamiento" }).click();
    const overlay = page.locator("#overlay");
    await overlay.getByRole("button", { name: /^Gimnasio · Full body A/ }).click();
    await expect(nombre).toContainText("Gimnasio · Full body A");
    await expect(app.locator(".wk-location")).toHaveText("Lugar: Gimnasio");

    await page.getByRole("button", { name: "En casa", exact: true }).click();
    await expect(overlay.getByRole("button", { name: /Gimnasio · tu plan ✓/ })).toBeVisible();
    await overlay.getByRole("button", { name: /^Casa/ }).click();
    await expect(nombre).toContainText("Peso corporal · Full body A");
    await expect(app.locator(".wk-location")).toHaveText("Lugar: Casa · solo este día");
    expect(await allDoableAt(page, await page.evaluate(() => todayStr()), "home")).toBe(true);

    // Con el día en casa, "Cambiar entrenamiento" ofrece las sesiones de casa.
    await page.getByRole("button", { name: "Cambiar entrenamiento" }).click();
    await expect(overlay.getByRole("button", { name: /^Peso corporal · Full body B/ })).toBeVisible();
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  test("en un día de carrera, \"En casa\" cambia la carrera por la próxima sesión de fuerza en casa", async ({ page, context }) => {
    const today = new Date().getDay();
    const days = trainingDaysIncludingToday();
    const prefs = completePrefs({
      primarySport: "running", trainingPriority: "performance",
      trainingDays: days, trainingLocations: Object.fromEntries(days.map((d) => [d, d === today ? "outdoor" : "gym"])),
    });
    const { calls } = await installMocks(context, { prefs });
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);

    await page.locator("#tabs").getByText("Entreno").click();
    const app = page.locator("#app");
    const nombre = app.locator(".workout .name").first();
    await expect(nombre).toContainText("Correr ·");
    const proxima = await page.evaluate(() => strengthSessionForSportDay(todayStr()));
    expect(proxima).toBeTruthy();

    // Un toque: "En casa" está a la vista en el día de carrera.
    await page.getByRole("button", { name: "En casa", exact: true }).click();
    const overlay = page.locator("#overlay");
    await expect(overlay).toContainText("¿Dónde entrenas hoy?");
    await expect(overlay).toContainText("Correr ·");
    await overlay.getByRole("button", { name: /^Casa/ }).click();

    await expect(nombre).toContainText("Peso corporal ·");
    await expect(app.locator(".wk-location")).toHaveText("Lugar: Casa · solo este día");
    const today_ = await page.evaluate(() => todayStr());
    expect(await page.evaluate((d) => effectiveWorkout(d).id, today_)).toBe(proxima);
    expect(await allDoableAt(page, today_, "home")).toBe(true);
    await expect
      .poll(() => calls.filter((c) => c.table === "day_log" && c.payload && c.payload.log_date === today_).map((c) => c.payload.state.trainingPlace).at(-1))
      .toBe("home");

    // "Volver al plan" recupera la carrera y quita el lugar del día.
    await page.getByRole("button", { name: "Volver al plan" }).click();
    await expect(nombre).toContainText("Correr ·");
    expect(await page.evaluate((d) => dayState(d).trainingPlace, today_)).toBeUndefined();
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
});
