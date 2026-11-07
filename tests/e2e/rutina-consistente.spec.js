// REQ-358: la rutina elegida es la misma en Hoy, el resumen, las demos y el reproductor.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, gotoApp, autoDismissNudges, collectConsoleErrors, startGuidedSession } from "./helpers.js";

for (const width of [320, 390, 1280]) {
  test(`reemplazar una rutina de un plan personalizado actualiza todas las vistas (${width}px)`, async ({ page, context }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    const { calls, tables } = await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);
    await page.locator("#tabs").getByText("Entreno").click();
    const app = page.locator("#app"), overlay = page.locator("#overlay");

    const seed = await page.evaluate(() => {
      const ew = effectiveWorkout(current);
      const originalIds = ew.workout.exerciseIds;
      const ids = exerciseCatalog(false).filter(ex => ex.discipline === "strength" || ex.discipline === "bodyweight")
        .filter(ex => !originalIds.includes(ex.slug) && exerciseSafeForLimits(ex, current) && exerciseHasDemo(ex)).slice(0, 2).map(ex => ex.slug);
      // Una sesión personalizada tiene una segunda lista de dosis: también debe reemplazarse.
      const session = { id: "generated-today", date: current, type: "strength", role: "fullA", name: "Plan original",
        objective: "Rutina original del plan", durationMinutes: 60, intensity: "RPE 7",
        exercises: originalIds.map(exerciseId => ({ exerciseId, sets: 3, reps: "10", restSeconds: 90, targetRpe: 7, targetRir: 3 })) };
      const version = { id: "routine-plan", version_number: 1, valid_from: current, valid_to: END, status: "active",
        snapshot: { prefs: { ...profile.prefs }, trainingPlan: { weeks: [{ sessions: [session] }] } } };
      PLAN_VERSIONS = [version];
      dayState(current).planVersionId = version.id;
      const saved = { id: "saved-pull", name: "Pull del viernes", from: addDays(current, -2),
        exercises: ids.map(slug => ({ slug, unit: "reps", sets: [{ reps: 12, load: "10" }, { reps: 8, load: "12" }] })) };
      profile.prefs.savedWorkouts = [saved];
      const past = addDays(current, -2);
      dayState(past).workoutExecution = { workoutId: "historical-session", sessionType: "strength", prescriptionName: "Pull histórico", status: "completed",
        steps: ids.map((slug, i) => ({ id: `exercise-${i + 1}`, type: "strength", exerciseSlug: slug, unit: "reps", status: "done", sets: [{ reps: 9, load: "7", done: true }] })) };
      dayState(past).workoutDone = true;
      const history = JSON.stringify(dayState(past));
      render();
      return { ids, names: ids.map(slug => exerciseBySlug(slug).name), originalIds, version, saved, past, history };
    });
    expect(seed.ids).toHaveLength(2);
    tables.plan_versions.rows = [seed.version];
    tables.profiles.row.prefs.savedWorkouts = [seed.saved];
    tables.day_log.rows = [{ log_date: seed.past, state: JSON.parse(seed.history) }];
    const cards = app.locator(".exercise-card");
    const title = app.locator(".workout .name");
    const previewIds = () => cards.evaluateAll(els => els.map(el => el.dataset.exercise));
    const prescriptionIds = () => page.evaluate(() => workoutPrescription(current).steps.filter(s => s.type === "strength").map(s => s.exerciseSlug));
    const assertRoutine = async name => {
      await expect(title).toContainText(name);
      expect(await previewIds()).toEqual(seed.ids);
      expect(await prescriptionIds()).toEqual(seed.ids);
      await expect(app.locator(".plan-summary .plan-row:not(.plan-timed) .plan-main > b")).toHaveText(seed.names);
      await expect(cards.locator(".exercise-title h2")).toHaveText(seed.names);
      await expect(cards.locator(".exercise-demo")).toHaveCount(2);
    };
    const assertHome = async name => {
      await page.locator("#tabs").getByText("Hoy", { exact: true }).click();
      const row = app.locator(".agenda-item.kind-workout");
      await expect(row.locator(".agenda-name")).toHaveText(name);
      await expect(row.locator(".agenda-meta")).toContainText("2 ejercicios");
      for (const name of seed.names) await expect(row).toContainText(name);
      await page.locator("#tabs").getByText("Entreno").click();
    };

    // Reciente: nombre histórico, ejercicios y visuales coinciden aunque hoy toque otra rutina.
    await app.getByRole("button", { name: "Cambiar entrenamiento" }).click();
    await overlay.locator(".wk-copy-row").filter({ hasText: "Pull histórico" }).locator("button.opt").click();
    await assertRoutine("Pull histórico");
    await assertHome("Pull histórico");

    // Guardada: conserva el nombre elegido por la persona y sus dosis.
    await app.getByRole("button", { name: "Cambiar entrenamiento" }).click();
    await overlay.locator(".wk-copy-row").filter({ hasText: "Pull del viernes" }).locator("button.opt").click();
    await assertRoutine("Pull del viernes");
    await expect(app.locator(".plan-summary")).toContainText("4 series");
    await assertHome("Pull del viernes");
    await expect.poll(() => calls.filter(c => c.table === "day_log" && c.payload?.state?.repeatWorkout?.savedId === "saved-pull").length).toBeGreaterThan(0);
    await gotoApp(page);
    await expect(app.locator(".agenda-item.kind-workout .agenda-name")).toHaveText("Pull del viernes");
    await page.locator("#tabs").getByText("Entreno").click();
    await assertRoutine("Pull del viernes");
    await title.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath("rutina.png") });
    await cards.first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath("visuales.png") });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    // Iniciar fija el nombre y los ejercicios en el historial, sin tocar el entreno fuente.
    await startGuidedSession(page);
    const recorded = await page.evaluate(() => ({ name: dayState(current).workoutExecution.prescriptionName,
      ids: dayState(current).workoutExecution.steps.filter(s => s.type === "strength").map(s => s.exerciseSlug) }));
    expect(recorded).toEqual({ name: "Pull del viernes", ids: seed.ids });
    await page.locator("#tabs").getByText("Hoy", { exact: true }).click();
    await expect(app.locator(".agenda-item.kind-resume .agenda-name")).toHaveText("Pull del viernes");
    await page.locator("#tabs").getByText("Entreno").click();
    page.once("dialog", dialog => dialog.accept());
    await app.getByRole("button", { name: "Descartar", exact: true }).click();

    // Editar una copia crea una rutina propia: no deja el nombre ni las dosis de la copia anterior.
    await app.getByRole("button", { name: "Editar ejercicios" }).click();
    await overlay.locator("#routine_remember").uncheck();
    await overlay.getByRole("button", { name: "Guardar rutina", exact: true }).click();
    await assertRoutine("Tu rutina");
    expect(await page.evaluate(() => dayState(current).repeatWorkout)).toBeUndefined();
    await assertHome("Tu rutina");

    // Volver al plan restaura también las demos y el nombre, sin modificar el snapshot.
    await app.getByRole("button", { name: "Volver a la rutina del plan" }).click();
    await expect(title).toContainText("Plan original");
    expect(await previewIds()).toEqual(seed.originalIds);
    expect(await prescriptionIds()).toEqual(seed.originalIds);
    expect(await page.evaluate(() => PLAN_VERSIONS[0])).toEqual(seed.version);
    expect(await page.evaluate(d => dayState(d).workoutExecution, seed.past)).toEqual(JSON.parse(seed.history).workoutExecution);
    expect(await page.evaluate(d => dayState(d).workoutDone, seed.past)).toBe(true);
    expect(errors).toEqual([]);
  });
}
