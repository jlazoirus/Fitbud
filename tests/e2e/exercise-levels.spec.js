import { test, expect } from "@playwright/test";
import "../../exercise-catalog.js";
import { installMocks, seedLoggedInUser, gotoApp, completePrefs, collectConsoleErrors } from "./helpers.js";

const catalog = globalThis.FITBUD_EXERCISES;

test("REQ-264: corrige niveles y demo antiguos de Supabase sin modificar las filas", async ({ page, context }) => {
  const stale = catalog.map(exercise => ({ ...exercise, level: "beginner" }));
  stale.push({ ...catalog.find(exercise => exercise.slug === "assisted-pull-up"), slug: "band-assisted-pull-up", level: "beginner" });
  Object.assign(stale.find(exercise => exercise.slug === "pike-push-up"), {
    media_type: "image_sequence", media_url: null,
    poster_url: "https://e2emock.supabase.co/storage/v1/object/public/exercise-media/handstand/0.jpg",
    frames: ["handstand/0.jpg", "handstand/1.jpg"],
  });
  await installMocks(context, { tables: { exercises: { rows: stale } } });
  await seedLoggedInUser(page);
  const errors = collectConsoleErrors(page);
  await gotoApp(page);

  const content = await page.evaluate(() => {
    const pike = exerciseBySlug("pike-push-up");
    openExerciseGuide(pike.slug);
    return {
      raw: DB.exercises.find(exercise => exercise.slug === pike.slug).level,
      displayed: pike.level,
      planned: activeTrainingCatalog().find(exercise => exercise.slug === pike.slug).level,
      remoteOnly: exerciseBySlug("band-assisted-pull-up").level,
      unknown: exerciseLevelLabel(undefined),
    };
  });
  expect(content).toEqual({ raw: "beginner", displayed: "intermediate", planned: "intermediate", remoteOnly: "intermediate", unknown: "Nivel por revisar" });
  const guide = page.locator("#overlay");
  await expect(guide).toContainText("Intermedio");
  await expect(guide).toContainText("pies en el suelo");
  await expect(guide.locator("img")).toHaveAttribute("src", "assets/exercise-media/pike-push-up.svg");
  expect(errors).toEqual([]);
});

test("REQ-264: sesiones automáticas de principiantes respetan el nivel en fuerza y cardio", async ({ page, context }) => {
  await installMocks(context, { prefs: completePrefs({ trainingExperience: "beginner", trainingSafetyMode: "full" }) });
  await seedLoggedInUser(page);
  await gotoApp(page);
  const result = await page.evaluate(() => {
    const date = todayStr();
    const summaries = [];
    for (const mode of ["gym", "bodyweight"]) {
      const prefs = { ...profile.prefs, strengthMode: mode, strengthPlace: mode === "gym" ? "gym" : "home", equipment: ["barbell", "dumbbells", "machines", "pullup", "bands", "bodyweight"] };
      for (const session of Object.values(strengthSessions(mode, date, prefs))) {
        summaries.push({ mode, role: session.id, ids: session.exerciseIds, levels: session.exerciseIds.map(id => exerciseBySlug(id).level) });
      }
    }
    const weeks = trainingExpectedWeeks(profile.prefs);
    const generated = weeks.map(expected => deterministicTrainingWeekPayload({ ...expected, sessions: expected.sessions.filter(session => session.type === "strength") }, profile.prefs));
    const cardio = ["running", "cycling", "swimming"].map(primarySport => {
      const prefs = { ...profile.prefs, primarySport, trainingExperience: "beginner" };
      const workout = sportSessions(primarySport, date, prefs).quality;
      const spec = { date, role: "calidad", type: primarySport, location: primarySport === "swimming" ? "pool" : "outdoor" };
      const allowed = allowedExercisesForSession(spec, prefs, activeTrainingCatalog());
      const prescription = buildWorkoutPrescription(workout, workout.exerciseIds.map(id => exerciseBySlug(id)), { sessionMinutes: 60 });
      return { ids: workout.exerciseIds, allowed: allowed.map(exercise => exercise.slug), levels: allowed.map(exercise => exercise.level), intensities: prescription.steps.map(step => step.intensity) };
    });
    return { summaries, generated: generated.flatMap(week => week.sessions.flatMap(session => session.exercises.map(exercise => exerciseBySlug(exercise.exercise_id).level))), cardio };
  });
  for (const session of result.summaries) {
    expect(session.levels, `${session.mode}.${session.role}`).not.toContain("intermediate");
    expect(session.levels).not.toContain("advanced");
    expect(new Set(session.ids).size).toBe(session.ids.length);
    if (["fullA", "fullB"].includes(session.role)) expect(session.ids.length).toBeGreaterThanOrEqual(3);
  }
  expect(result.generated.length).toBeGreaterThan(0);
  expect(result.generated.every(level => level === "beginner")).toBe(true);
  for (const cardio of result.cardio) {
    expect(cardio.ids.length).toBeGreaterThan(0);
    expect(cardio.allowed).toEqual(cardio.ids);
    expect(cardio.levels).toEqual(["beginner"]);
    expect(cardio.intensities.join(" ")).not.toMatch(/RPE [78]/);
  }
});

test("REQ-264: ajusta planes pendientes sin tocar snapshots ni sesiones iniciadas o pasadas", async ({ page, context }) => {
  await installMocks(context);
  await seedLoggedInUser(page);
  await gotoApp(page);
  const result = await page.evaluate(() => {
    const today = todayStr(), past = addDays(today, -1), future = addDays(today, 1);
    const prefs = { ...profile.prefs, trainingExperience: "beginner", trainingSafetyMode: "full", strengthMode: "bodyweight", strengthPlace: "home" };
    const ids = ["bulgarian-split-squat", "pike-push-up", "band-row", "single-leg-rdl", "side-plank"];
    const makeSession = date => ({ id: `saved-${date}`, date, role: "fullB", type: "strength", name: "Sesión guardada", objective: "Entrenar fuerza", durationMinutes: 45, intensity: "RPE 6", exercises: ids.map(exerciseId => ({ exerciseId, sets: 3, reps: exerciseId === "bulgarian-split-squat" ? "8-12 por lado" : "8-12", targetRpe: 6, targetRir: 3, restSeconds: exerciseId === "bulgarian-split-squat" ? 120 : 90 })), blocks: [] });
    PLAN_VERSIONS = [{ id: "reviewed-test", status: "active", valid_from: past, valid_to: future, snapshot: { prefs, trainingPlan: { weeks: [{ sessions: [past, today, future].map(makeSession) }] } } }];
    for (const date of [past, today, future]) delete S.days[date];
    const before = JSON.stringify(PLAN_VERSIONS);
    const adapted = generatedWorkoutForDate(future);
    const pending = adapted.exerciseIds;
    const todayIds = generatedWorkoutForDate(today).exerciseIds;
    const pastIds = generatedWorkoutForDate(past).exerciseIds;
    S.days[future] = { workoutExecution: { status: "in_progress", steps: [] } };
    const started = generatedWorkoutForDate(future).exerciseIds;
    S.days[future] = { manualActivities: [{ sport: "strength", minutes: 20 }] };
    const recorded = generatedWorkoutForDate(future).exerciseIds;
    return { ids, pending, todayIds, pastIds, started, recorded, replacementDose: adapted.generatedPrescription.exercises[0], snapshotUnchanged: before === JSON.stringify(PLAN_VERSIONS), levels: pending.map(id => exerciseBySlug(id).level) };
  });
  expect(result.pending.length).toBeGreaterThanOrEqual(2);
  expect(result.levels.every(level => level === "beginner")).toBe(true);
  expect(result.todayIds).toEqual(result.pending);
  expect(result.pastIds).toEqual(result.ids);
  expect(result.started).toEqual(result.ids);
  expect(result.recorded).toEqual(result.ids);
  expect(result.replacementDose).toMatchObject({ exerciseId: "tempo-squat", reps: "8-12", restSeconds: 90, sets: 3, targetRpe: 6, targetRir: 3 });
  expect(result.snapshotUnchanged).toBe(true);
});

test("REQ-264: nivel sin revisar no entra en planes; búsqueda manual muestra el nivel", async ({ page, context }) => {
  await installMocks(context);
  await seedLoggedInUser(page);
  await gotoApp(page);
  const result = await page.evaluate(() => {
    const date = todayStr();
    const custom = { ...exerciseBySlug("pike-push-up"), slug: "custom-pike", level: "unreviewed" };
    const prefs = { ...profile.prefs, trainingExperience: "advanced" };
    const spec = { date, role: "fullA", type: "strength", location: "home" };
    const invalid = allowedExercisesForSession(spec, prefs, [custom, { ...custom, slug: "missing-level", level: null }]);
    const baseline = coachCompatibilityContext("training_plan").catalog.exercises;
    DB.exerciseReady = true;
    DB.exercises = LOCAL_EXERCISES.concat([{ ...custom, level: "beginner" }]);
    const firstHash = coachCompatibilityContext("training_plan").catalog.exercises;
    DB.exercises[DB.exercises.length - 1].level = "intermediate";
    const secondHash = coachCompatibilityContext("training_plan").catalog.exercises;
    S.days[date] = { workoutOverride: "fullA" };
    S.days[date].workoutExecution = WORKOUT_PLAYER.createExecution(workoutPrescription(date), Date.now());
    return { invalid: invalid.length, label: exerciseLevelLabel(custom.level), changed: firstHash !== secondHash, baseline, results: exerciseSearchResultsHtml(date, "add", "pike") };
  });
  expect(result.invalid).toBe(0);
  expect(result.label).toBe("Nivel por revisar");
  expect(result.changed).toBe(true);
  expect(result.results).toContain("Intermedio");
  expect(result.results).toContain("Pike push-up");
});

for (const type of ["strength", "running"]) test(`REQ-264: conserva la sesión adaptada de ${type} al iniciarla y recargar`, async ({ page, context }) => {
  const { calls } = await installMocks(context);
  await seedLoggedInUser(page);
  await gotoApp(page);
  const pending = await page.evaluate(type => {
    const date=todayStr();
    const prefs={...profile.prefs,trainingExperience:"beginner",trainingSafetyMode:"full",strengthMode:"bodyweight",strengthPlace:"home",primarySport:type==="running"?"running":"strength_only"};
    const ids=type==="strength"?["bulgarian-split-squat","pike-push-up","band-row","single-leg-rdl","side-plank"]:["run-intervals"];
    const session={id:`adapted-${type}`,date,role:type==="strength"?"fullB":"calidad",type,name:"Sesión guardada",objective:"Entrenar con control",durationMinutes:45,intensity:"RPE 7",exercises:ids.map(exerciseId=>({exerciseId,sets:3,reps:"8-12",targetRpe:6,targetRir:3,restSeconds:90})),blocks:type==="strength"?[]:[{phase:"main",label:"Intervalos originales",target:"400 m rápidos",intensity:"RPE 7",durationSeconds:1200}]};
    PLAN_VERSIONS=[{id:"stable-adapted",status:"active",valid_from:date,valid_to:date,snapshot:{prefs,trainingPlan:{weeks:[{sessions:[session]}]}}}];
    delete S.days[date];
    view="entreno";current=clampDate(date);render();
    const prescription=workoutPrescription(date);
    startWorkoutExecution(date);
    return {prescription,versions:PLAN_VERSIONS,date};
  }, type);
  await page.locator("#workoutCountdown").getByRole("button", { name:"Empezar ya" }).click();
  const started=await page.evaluate(date=>{
    const prescription=workoutPrescription(date);
    const snapshot=S.days[date].workoutExecution.contentPrescription;
    const execution=normalizedWorkoutExecution(date);
    // Cada lectura entrega una copia para que un consumidor no modifique el original.
    prescription.steps[0].label="Mutación temporal de lectura";
    return {prescription:workoutPrescription(date),snapshotUnchanged:snapshot.steps[0].label!==prescription.steps[0].label,steps:execution.steps};
  },pending.date);
  expect(started.prescription).toEqual(pending.prescription);
  expect(started.snapshotUnchanged).toBe(true);
  expect(started.steps.filter(step=>step.phase==="cooldown")).toHaveLength(1);
  if(type==="strength"){
    expect(started.steps.filter(step=>step.type==="strength")).toHaveLength(4);
    expect(started.steps.filter(step=>step.type==="strength").map(step=>step.exerciseSlug)).not.toContain("side-plank");
  }else expect(started.steps.map(step=>step.intensity).join(" ")).not.toContain("RPE 7");
  await expect.poll(()=>calls.filter(call=>call.table==="day_log"&&call.method==="POST").length).toBeGreaterThan(0);
  const writes=calls.filter(call=>call.table==="day_log"&&call.method==="POST");
  const persisted=writes[writes.length-1].payload;
  const rows=Array.isArray(persisted)?persisted:[persisted];
  await context.route("**/rest/v1/day_log**",route=>{
    if(route.request().method()!=="GET")return route.fallback();
    return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(rows)});
  });
  await context.route("**/rest/v1/plan_versions**",route=>{
    if(route.request().method()!=="GET")return route.fallback();
    return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(pending.versions)});
  });
  await gotoApp(page);
  const reloaded=await page.evaluate(date=>({prescription:workoutPrescription(date),steps:normalizedWorkoutExecution(date).steps}),pending.date);
  expect(reloaded.prescription).toEqual(pending.prescription);
  expect(reloaded.steps.map(step=>({id:step.id,type:step.type,slug:step.exerciseSlug}))).toEqual(started.steps.map(step=>({id:step.id,type:step.type,slug:step.exerciseSlug})));
});
