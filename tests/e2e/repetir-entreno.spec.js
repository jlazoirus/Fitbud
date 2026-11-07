// REQ-346 (Jonathan): repetir un entreno pasado (p. ej. el del martes) con sus
// ejercicios, series y repeticiones, y guardarlo para elegirlo otro día desde
// "Cambiar entrenamiento".
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges, startGuidedSession, completeTimedBlock } from "./helpers.js";

const strengthSlugs = (page) => page.evaluate(() => workoutPrescription(current).steps.filter((s) => s.type === "strength").map((s) => s.exerciseSlug));

test("repetir el entreno de otro día, guardarlo, usarlo otro día y quitarlo", async ({ page, context }) => {
  const { calls } = await installMocks(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const errors = collectConsoleErrors(page);
  await gotoApp(page);
  await page.locator("#tabs").getByText("Entreno").click();
  const app = page.locator("#app");
  const overlay = page.locator("#overlay");
  await expect(app).toContainText(/Qué vas a hacer hoy/);

  // Hace dos días: un entreno de fuerza con dos ejercicios distintos a los de hoy.
  // Ayer se repitió el primero con otros números: repetir debe traer los de hace dos días.
  const seed = await page.evaluate(() => {
    const today = workoutPrescription(current).steps.filter((s) => s.type === "strength").map((s) => s.exerciseSlug);
    const pick = (q) => EXERCISE_SUBSTITUTION.search(q, exerciseCatalog(false)).map((e) => e.slug).find((slug) => !today.includes(slug));
    const a = pick("remo"), b = pick("sentadilla");
    const seedDay = (ds, steps) => {
      const d = dayState(ds);
      if (!isStrengthWorkout(effectiveWorkout(ds).workout)) d.workoutOverride = workoutOptions(ds).find(isStrengthWorkout).id;
      const ew = effectiveWorkout(ds);
      d.workoutDone = true;
      d.workoutExecution = { workoutId: ew.id, prescriptionName: ew.workout.name, sessionType: "strength", status: "completed", startedAt: new Date().toISOString(), steps };
      return ew.workout.name;
    };
    const past = addDays(current, -2), yesterday = addDays(current, -1);
    const name = seedDay(past, [
      { id: "exercise-1", type: "strength", exerciseSlug: a, unit: "reps", status: "done", extraSets: 1,
        sets: [{ done: true, reps: 10, load: "40" }, { done: true, reps: 8, load: "45" }, { done: true, reps: 8, load: "45" }, { done: true, reps: 6, load: "50" }] },
      { id: "exercise-2", type: "strength", exerciseSlug: b, unit: "reps", status: "done",
        sets: [{ done: true, reps: 12, load: "" }, { done: true, reps: 12, load: "" }, { done: false, reps: null, load: "" }] },
    ]);
    seedDay(yesterday, [{ id: "exercise-1", type: "strength", exerciseSlug: a, unit: "reps", status: "done", sets: [{ done: true, reps: 5, load: "30" }] }]);
    render();
    // En la lista y al guardar, el nombre va sin el tipo ("Gimnasio · Full body A" → "Full body A").
    return { past, a, b, name: name.replace(/^(Gimnasio|Peso corporal)\s*·\s*/, ""), weekday: DOW[parseYmd(past).getDay()] };
  });
  expect(seed.a && seed.b && seed.a !== seed.b).toBeTruthy();

  // 1) Repetir uno reciente desde "Cambiar entrenamiento".
  await app.getByRole("button", { name: "Cambiar entrenamiento" }).click();
  await expect(overlay).toContainText("Repetir uno reciente");
  const recentRow = overlay.locator(".wk-copy-row").filter({ hasText: `${seed.weekday} ` }).filter({ hasText: seed.name });
  // Ayer también aparece: los recientes van del más nuevo al más antiguo.
  await expect(overlay.locator(".wk-copy-row")).toHaveCount(2);
  await expect(recentRow).toContainText("2 ejercicios");
  await expect(recentRow.locator("button.opt b")).toHaveText(new RegExp(`^${seed.weekday} \\d+ \\w+ · ${seed.name}$`));
  await recentRow.locator("button.opt").click();
  await expect(app.locator(".routine-pill")).toHaveText("repetido");
  await expect(app.locator(".workout .name")).toContainText(seed.name);
  expect(await app.locator(".exercise-card").evaluateAll(cards => cards.map(card => card.dataset.exercise))).toEqual([seed.a, seed.b]);
  await expect(app.locator(".wk-repeat-line")).toContainText(`Repites tu entreno del ${seed.weekday.toLowerCase()}`);
  expect(await strengthSlugs(page)).toEqual([seed.a, seed.b]);
  // Mismas series y repeticiones que ese día (4 series de 6-10; 2 de 12).
  const doses = await page.evaluate(() => workoutPrescription(current).steps.filter((s) => s.type === "strength").map((s) => [s.prescribedSets, s.reps]));
  expect(doses).toEqual([[4, "6-10"], [2, "12"]]);
  await expect(app.locator(".plan-summary")).toContainText("4 × 6-10");
  await expect.poll(() => calls.filter((c) => c.table === "day_log" && c.payload && c.payload.state && c.payload.state.repeatWorkout).length).toBeGreaterThan(0);

  // 2) Guardarlo con nombre: aparece en "Tus entrenamientos guardados" y se sincroniza en el perfil.
  await app.getByRole("button", { name: "Cambiar entrenamiento" }).click();
  await recentRow.getByRole("button", { name: /^Guardar el entreno del/ }).click();
  await expect(overlay).toContainText("Guardar entrenamiento");
  await expect(overlay.locator("#saved_workout_name")).toHaveValue(`${seed.name} del ${seed.weekday.toLowerCase()}`.slice(0, 40));
  await expect(overlay.locator(".saved-wk-list li")).toHaveCount(2);
  await expect(overlay.locator(".saved-wk-list li").first()).toContainText("4 × 6-10 · 50 kg");
  await overlay.locator("#saved_workout_name").fill("Push pesado");
  await overlay.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(overlay).toContainText("Tus entrenamientos guardados");
  await expect(overlay.locator(".wk-copy-row").filter({ hasText: "Push pesado" })).toContainText("2 ejercicios");
  await expect(recentRow.locator(".wk-copy-saved")).toHaveText("Guardado");
  await expect.poll(() => {
    const posts = calls.filter((c) => c.table === "profiles" && c.method === "POST");
    const last = posts.at(-1); const prefs = last && (Array.isArray(last.payload) ? last.payload[0] : last.payload).prefs;
    const saved = prefs && prefs.savedWorkouts && prefs.savedWorkouts[0];
    return saved && [saved.name, saved.exercises.map((e) => e.slug), saved.exercises[0].sets.length];
  }).toEqual(["Push pesado", [seed.a, seed.b], 4]);
  await page.evaluate(() => closeModal());

  // 3) Otro día, aunque sea de descanso: elegir el guardado lo convierte en ese entreno.
  const restDay = await page.evaluate(() => {
    for (let i = 1; i <= 7; i++) { const d = addDays(current, i); if (!isStrengthWorkout(effectiveWorkout(d).workout)) return d; }
    return null;
  });
  expect(restDay).toBeTruthy();
  await page.evaluate((d) => { current = d; render(); }, restDay);
  await app.getByRole("button", { name: "Cambiar entrenamiento" }).click();
  await overlay.locator(".wk-copy-row").filter({ hasText: "Push pesado" }).locator("button.opt").click();
  await expect(app.locator(".wk-repeat-line")).toContainText("Tu entreno guardado: Push pesado");
  await expect(app.locator(".workout .name")).toContainText("Push pesado");
  expect(await app.locator(".exercise-card").evaluateAll(cards => cards.map(card => card.dataset.exercise))).toEqual([seed.a, seed.b]);
  expect(await strengthSlugs(page)).toEqual([seed.a, seed.b]);
  // Elegir una sesión del plan deja de repetirlo.
  await app.getByRole("button", { name: "Volver al plan" }).click();
  expect(await page.evaluate(() => [dayState(current).repeatWorkout, dayState(current).customExercises, isStrengthWorkout(effectiveWorkout(current).workout)])).toEqual([undefined, undefined, false]);

  // 4) Quitar un guardado.
  await app.getByRole("button", { name: "Cambiar entrenamiento" }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await overlay.getByRole("button", { name: "Quitar Push pesado" }).click();
  await expect(overlay).not.toContainText("Tus entrenamientos guardados");
  await page.evaluate(() => closeModal());

  // 5) Al terminar (o después), el entreno hecho se guarda desde su resultado.
  await page.evaluate((d) => { current = d; render(); }, seed.past);
  await app.getByRole("button", { name: "Guardar para repetirlo" }).click();
  await overlay.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(app.locator(".wk-copy-done")).toContainText("Guardado en tus entrenamientos");

  // 6) Hoy, al empezar, las series llegan con lo de ese día (no con lo de ayer).
  await page.evaluate(() => { current = todayStr(); render(); });
  await expect(app.locator(".routine-pill")).toHaveText("repetido");
  await startGuidedSession(page);
  await completeTimedBlock(page);
  const reps = (n) => app.locator(`input[aria-label^="Repeticiones, serie ${n}"]`);
  const load = (n) => app.locator(`input[aria-label^="Carga o asistencia, serie ${n}"]`);
  await expect(reps(1)).toHaveValue("10");
  await expect(load(1)).toHaveValue("40");
  await expect(reps(4)).toHaveValue("6");
  await expect(load(4)).toHaveValue("50");
  expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
});
