// REQ-335 (Diego, beta): al terminar el onboarding con "Otra actividad" (pádel)
// la primera semana fallaba con "Faltan ejercicios compatibles con tus lugares
// o recursos": los días del deporte no tienen ejercicios del catálogo. Tampoco
// cuadraba correr o caminar en un día marcado "gimnasio" o "casa".
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges } from "./helpers.js";

const prepare = (page, overrides) => page.evaluate(async (o) => {
  const prefs = migrateProfilePrefs({ ...profile.prefs, ...o });
  profile.prefs = prefs;
  const weeks = trainingExpectedWeeks(prefs);
  const result = await prepareFirstWeekTraining(null);
  const sessions = result.ok ? result.plan.weeks.flatMap((w) => w.sessions) : [];
  return {
    ok: result.ok, problems: result.problems || [],
    empty: weeks.flatMap((w) => w.sessions.filter((s) => !s.allowedExerciseIds.length)).length,
    types: [...new Set(sessions.map((s) => s.type))].sort(),
    withoutExercises: sessions.filter((s) => !s.exercises.length).length,
  };
}, overrides);

test("con 'Otra actividad' y con deporte en días de gimnasio la primera semana de entreno se prepara", async ({ page, context }) => {
  await installMocks(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const errors = collectConsoleErrors(page);
  await gotoApp(page);

  const gymDays = { trainingDays: [1, 2, 3, 4, 5], trainingLocations: { 1: "gym", 2: "gym", 3: "gym", 4: "gym", 5: "gym" }, strengthMode: "gym", strengthPlace: "gym", equipment: ["dumbbells", "barbell", "machines"], trainingExperience: "beginner" };

  // Diego: pádel ("Otra actividad") + gimnasio. Los días de pádel quedan fuera del plan generado.
  const diego = await prepare(page, { ...gymDays, primarySport: "other" });
  expect(diego.problems).toEqual([]);
  expect(diego.ok).toBe(true);
  expect(diego.empty).toBe(0);
  expect(diego.types).toEqual(["strength"]);
  expect(diego.withoutExercises).toBe(0);

  // Correr con todos los días marcados "gimnasio": las carreras se generan igual.
  const runner = await prepare(page, { ...gymDays, primarySport: "running" });
  expect(runner.problems).toEqual([]);
  expect(runner.ok).toBe(true);
  expect(runner.types).toEqual(["running", "strength"]);

  // Solo fuerza en casa, cinco días: un día de descanso no bloquea el plan.
  const home = await prepare(page, { ...gymDays, primarySport: "strength_only", strengthMode: "bodyweight", strengthPlace: "home", equipment: ["bodyweight"], trainingLocations: { 1: "home", 2: "home", 3: "home", 4: "home", 5: "home" } });
  expect(home.problems).toEqual([]);
  expect(home.ok).toBe(true);

  expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
});
