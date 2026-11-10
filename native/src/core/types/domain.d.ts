// Superficie usada por el primer cliente nativo. Ampliar desde el código real
// y sus pruebas cuando una feature necesite más funciones; no duplicar reglas.
export interface Macros {
  kcal: number;
  p: number;
  c: number;
  f: number;
}

export interface NutritionPure {
  calculateMacroTargets(input: {
    weightKg: number;
    heightCm: number;
    age: number;
    sex: 'female' | 'male';
    bodyFatPct?: number | null;
    activityLevel: string;
    goal: 'deficit' | 'mantenimiento' | 'volumen';
  }): Macros & { maintenance: number; bmr: number; method: string };
}

export interface NutritionDomain {
  kcalFromMacros(protein: number, carbs: number, fat: number): number;
  macrosFromIngredientMap(
    lines: readonly { ingredient_id: number; grams: number }[],
    ingredients: Record<
      number,
      { kcal: number; protein_g: number; carbs_g: number; fat_g: number }
    >,
  ): Macros;
}

export interface ContractResult {
  ok: boolean;
  errors: string[];
}

export interface Contracts {
  validateMacroTargets(value: unknown): ContractResult;
  validateProfilePrefs(value: unknown): ContractResult;
  validateDayLogState(value: unknown): ContractResult;
  validateEntitlement(value: unknown): ContractResult;
}

export interface Exercise {
  slug: string;
  name: string;
  discipline: string;
  movement_pattern: string;
  muscles: string[];
  [field: string]: unknown;
}

export type TrainingPhase = 'base' | 'progression' | 'deload' | 'build' | 'consolidation';
export type SessionType = 'strength' | 'walking' | 'running' | 'cycling' | 'swimming';

export interface SessionSpec {
  date: string;
  weekday: number;
  location: string;
  role: string;
  type: SessionType;
  allowedExerciseIds?: string[];
}

export interface TrainingSession extends Omit<SessionSpec, 'allowedExerciseIds'> {
  id: string;
  name: string;
  objective: string;
  durationMinutes: number;
  intensity: string;
  exercises: {
    exerciseId: string;
    sets: number;
    reps: string;
    restSeconds: number;
    targetRpe: number;
    targetRir: number;
    tempo: string;
  }[];
  blocks: {
    phase: string;
    label: string;
    target: string;
    intensity: string;
    durationSeconds: number;
  }[];
}

export interface TrainingWeek {
  week: number;
  phase: TrainingPhase;
  reason: string;
  sessions: TrainingSession[];
}

export interface TrainingPlanDomain {
  readonly VERSION: number;
  phaseForWeek(week: number, durationWeeks: 4 | 10): TrainingPhase;
  normalizeWeek(
    raw: unknown,
    config: {
      week: number;
      durationWeeks: 4 | 10;
      sessions: readonly SessionSpec[];
      sessionMinutes: number;
      allowedExerciseIds: readonly string[];
      blockedTerms?: readonly string[];
      gentleMode?: boolean;
    },
  ): { ok: boolean; issues: string[]; week: TrainingWeek };
  validatePlan(plan: unknown, config: { durationWeeks: 4 | 10 }): { ok: boolean; issues: string[] };
  workoutFromSession(session: TrainingSession | null, strengthMode?: string): Workout | null;
  sessionForDate(plan: { weeks: readonly TrainingWeek[] }, date: string): TrainingSession | null;
}

export interface Workout {
  id: string;
  name: string;
  kind: string;
  sport?: string | null;
  phaseIndex?: number;
  generatedPrescription?: Record<string, unknown>;
}

interface StepBase {
  id: string;
  label: string;
  phase: string;
}

export interface StrengthStep extends StepBase {
  type: 'strength';
  exerciseSlug: string;
  prescribedSets: number;
  reps: string;
  restSeconds: number;
}

export interface TimedStep extends StepBase {
  type: 'timed';
  durationSeconds: number;
}

export interface Prescription {
  version: number;
  workoutId: string;
  name: string;
  kind: string;
  sessionType: 'strength' | 'cardio' | 'rest';
  objective: string;
  estimatedMinutes: number;
  steps: (StrengthStep | TimedStep)[];
}

export interface ExecutionSet {
  done: boolean;
  reps: number | null;
  load: string;
  rpe: number | null;
  completedAt: string | null;
}

export type ExecutionStep = ((StrengthStep & { sets: ExecutionSet[] }) | TimedStep) & {
  status: 'pending' | 'done' | 'skipped' | 'declined';
  optional: boolean;
  optIn: boolean;
};

export interface Execution {
  workoutId: string;
  status: 'in_progress' | 'paused' | 'completed' | 'partial';
  steps: ExecutionStep[];
  elapsedSeconds: number;
  resumedAt: string | null;
  awayAt: string | null;
  startedAt: string;
  timer: { running: boolean; endsAt: string | null; remainingSeconds: number } | null;
  currentStep: number;
}

export interface WorkoutPlayer {
  readonly VERSION: number;
  readonly AWAY_LIMIT_SECONDS: number;
  buildPrescription(input: {
    workout: Workout;
    exercises: readonly Exercise[];
    context: { week: number; durationWeeks: 4 | 10; sessionMinutes: number };
  }): Prescription;
  createExecution(prescription: Prescription, now?: number): Execution;
  normalizeExecution(saved: unknown, prescription: Prescription, now?: number): Execution | null;
  elapsedSeconds(execution: Execution | null, now?: number): number;
  timerRemaining(timer: Execution['timer'], now?: number): number;
  returnFromAway(execution: Execution, now?: number): 'none' | 'counted' | 'paused';
  progress(execution: Execution): {
    completed: number;
    skipped: number;
    declined: number;
    total: number;
    remaining: number;
  };
  strengthTotals(execution: Execution): { completedSets: number; totalSets: number };
}

export interface DayState {
  workoutDone: boolean;
  meals: Record<string, { done?: boolean; [field: string]: unknown } | undefined>;
  extras: Record<string, unknown>[];
  [field: string]: unknown;
}

export interface SyncDomain {
  clone<T>(value: T): T;
  normalizeDayStateForSync(
    value: unknown,
    makeId?: (index: number, item: Record<string, unknown>) => string,
  ): DayState;
  mergeDayLogStates(
    base: unknown,
    local: unknown,
    remote: unknown,
  ): { ok: boolean; merged: DayState; conflicts: string[] };
  remoteChangedSince(baseUpdatedAt: string | null, remoteUpdatedAt: string | null): boolean;
}
