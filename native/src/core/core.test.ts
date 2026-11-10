import {
  contracts,
  exercises,
  nutrition,
  nutritionPure,
  sync,
  trainingPlan,
  workoutPlayer,
  type SessionSpec,
  type TrainingPhase,
  type TrainingWeek,
} from './index';

test('exporta los siete módulos originales sin copiar la implementación', () => {
  const root = globalThis as typeof globalThis & Record<string, unknown>;
  expect(nutritionPure).toBe(root.FITBUD_NUTRITION_PURE);
  expect(nutrition).toBe(root.FITBUD_NUTRITION_DOMAIN);
  expect(contracts).toBe(root.FITBUD_DOMAIN_CONTRACTS);
  expect(exercises).toBe(root.FITBUD_EXERCISES);
  expect(trainingPlan).toBe(root.FITBUD_TRAINING_PLAN);
  expect(workoutPlayer).toBe(root.FITBUD_WORKOUT_PLAYER);
  expect(sync).toBe(root.FITBUD_SYNC_CONFLICTS);
});

test('calcula un plato con gramos reales y conserva las metas consistentes', () => {
  expect(
    nutrition.macrosFromIngredientMap(
      [
        { ingredient_id: 1, grams: 150 },
        { ingredient_id: 2, grams: 200 },
      ],
      {
        1: { kcal: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6 },
        2: { kcal: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3 },
      },
    ),
  ).toEqual({ kcal: 508, p: 52, c: 56, f: 6 });
  const targets = nutritionPure.calculateMacroTargets({
    weightKg: 80,
    heightCm: 180,
    age: 30,
    sex: 'male',
    activityLevel: 'moderate',
    goal: 'deficit',
  });
  expect(targets).toMatchObject({ kcal: 2352, p: 160, c: 284, f: 64 });
  expect(nutrition.kcalFromMacros(targets.p, targets.c, targets.f)).toBe(targets.kcal);
  expect(contracts.validateMacroTargets(targets)).toEqual({ ok: true, errors: [] });
  expect(contracts.validateMacroTargets({ ...targets, kcal: 100 })).toMatchObject({ ok: false });
});

function normalizedWeek(week: number, phase: TrainingPhase, invalidExercise = false) {
  const spec: SessionSpec = {
    date: `2026-11-${String(2 + (week - 1) * 7).padStart(2, '0')}`,
    weekday: 1,
    location: 'gym',
    role: 'fullA',
    type: 'strength',
  };
  const exerciseIds = ['back-squat', 'bench-press'];
  return trainingPlan.normalizeWeek(
    {
      week,
      phase,
      reason: 'Progresión de cuatro semanas.',
      sessions: [
        {
          ...spec,
          name: 'Fuerza',
          objective: 'Completar la sesión',
          duration_minutes: 60,
          intensity: 'RPE 6',
          exercises: exerciseIds.map((slug) => ({
            exercise_id: invalidExercise ? 'no-existe' : slug,
            sets: phase === 'progression' ? 4 : 3,
            reps: '8-10',
            rest_seconds: 90,
            target_rpe: 6,
            target_rir: 3,
            tempo: 'Controlado',
          })),
          blocks: [],
        },
      ],
    },
    {
      week,
      durationWeeks: 4,
      sessions: [spec],
      sessionMinutes: 60,
      allowedExerciseIds: exerciseIds,
    },
  );
}

test('normaliza y valida un plan de cuatro semanas; rechaza ejercicios y fechas inválidas', () => {
  const phases: TrainingPhase[] = ['base', 'progression', 'progression', 'consolidation'];
  const weeks: TrainingWeek[] = phases.map((phase, index) => {
    const result = normalizedWeek(index + 1, phase);
    expect(result.issues).toEqual([]);
    expect(result.ok).toBe(true);
    return result.week;
  });
  const plan = { version: trainingPlan.VERSION, durationWeeks: 4, weeks };
  expect(trainingPlan.validatePlan(plan, { durationWeeks: 4 })).toEqual({ ok: true, issues: [] });
  const session = trainingPlan.sessionForDate(plan, '2026-11-02');
  expect(trainingPlan.workoutFromSession(session, 'gym')).toMatchObject({
    kind: 'Gimnasio',
    name: 'Fuerza',
    exerciseIds: ['back-squat', 'bench-press'],
  });
  expect(normalizedWeek(1, 'base', true).ok).toBe(false);
  const duplicate = sync.clone(plan);
  duplicate.weeks[1].sessions[0].date = duplicate.weeks[0].sessions[0].date;
  expect(trainingPlan.validatePlan(duplicate, { durationWeeks: 4 }).ok).toBe(false);
});

test('restaura series y temporizador, y pausa una sesión olvidada sin perder lo registrado', () => {
  const prescription = workoutPlayer.buildPrescription({
    workout: { id: 'fullA', kind: 'Gimnasio', name: 'Fuerza' },
    exercises: exercises.filter((exercise) =>
      ['back-squat', 'bench-press'].includes(exercise.slug),
    ),
    context: { week: 3, durationWeeks: 10, sessionMinutes: 60 },
  });
  const startedAt = Date.parse('2026-11-10T15:00:00Z');
  const execution = workoutPlayer.createExecution(prescription, startedAt);
  const step = execution.steps.find((item) => item.type === 'strength');
  if (!step || step.type !== 'strength') throw new Error('Falta el ejercicio de fuerza');
  step.sets[0] = { done: true, reps: 8, load: '40', rpe: 6, completedAt: '2026-11-10T15:01:00Z' };
  execution.timer = { running: true, endsAt: '2026-11-10T15:03:00Z', remainingSeconds: 90 };
  const serialized = JSON.stringify(execution);
  const restored = workoutPlayer.normalizeExecution(
    JSON.parse(serialized),
    prescription,
    startedAt + 120_000,
  );
  if (!restored) throw new Error('La sesión válida no se restauró');
  expect(workoutPlayer.strengthTotals(restored)).toEqual({ completedSets: 1, totalSets: 8 });
  expect(workoutPlayer.elapsedSeconds(restored, startedAt + 120_000)).toBe(120);
  expect(workoutPlayer.timerRemaining(restored.timer, startedAt + 120_000)).toBe(60);
  restored.awayAt = '2026-11-10T15:02:00Z';
  expect(workoutPlayer.returnFromAway(restored, startedAt + 4_320_000)).toBe('paused');
  expect(restored.status).toBe('paused');
  expect(workoutPlayer.strengthTotals(restored).completedSets).toBe(1);
  expect(JSON.stringify(execution)).toBe(serialized);
  expect(workoutPlayer.normalizeExecution({ workoutId: 'otro' }, prescription)).toBeNull();
});

test('combina comidas distintas y conserva campos nuevos sin mutar los snapshots', () => {
  const base = sync.normalizeDayStateForSync({
    meals: { desayuno: { done: false }, almuerzo: { done: false } },
    workoutDone: false,
    extras: [],
    futureField: { version: 2 },
  });
  const local = sync.clone(base);
  const remote = sync.clone(base);
  local.meals.desayuno = { done: true };
  remote.meals.almuerzo = { done: true };
  const before = JSON.stringify([base, local, remote]);
  const result = sync.mergeDayLogStates(base, local, remote);
  expect(result.ok).toBe(true);
  expect(result.merged.meals).toEqual({ desayuno: { done: true }, almuerzo: { done: true } });
  expect(result.merged.futureField).toEqual({ version: 2 });
  expect(contracts.validateDayLogState(result.merged).ok).toBe(true);
  expect(JSON.stringify([base, local, remote])).toBe(before);
});

test('expone el conflicto cuando dos dispositivos cambian la misma sesión', () => {
  const base = sync.normalizeDayStateForSync({});
  const local = { ...base, workoutExecution: { status: 'partial', notes: 'local' } };
  const remote = { ...base, workoutExecution: { status: 'completed', notes: 'remoto' } };
  const result = sync.mergeDayLogStates(base, local, remote);
  expect(result.ok).toBe(false);
  expect(result.conflicts).toContain('workoutExecution');
});
