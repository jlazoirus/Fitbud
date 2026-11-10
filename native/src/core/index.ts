// El orden conserva las dependencias del dominio web; no copiar estos archivos.
import '../../../js/nutrition-pure.js';
import '../../../js/nutrition-domain.js';
import '../../../domain-contracts.js';
import '../../../exercise-catalog.js';
import '../../../workout-player.js';
import '../../../training-plan.js';
import '../../../sync-conflicts.js';

import type {
  Contracts,
  Exercise,
  NutritionDomain,
  NutritionPure,
  SyncDomain,
  TrainingPlanDomain,
  WorkoutPlayer,
} from './types/domain';

const shared = globalThis as typeof globalThis & Record<string, unknown>;

function namespace<T>(name: string, functions: readonly (keyof T)[]): T {
  const value = shared[name];
  if (!value || typeof value !== 'object') throw new Error(`Dominio compartido ausente: ${name}`);
  for (const key of functions) {
    if (typeof (value as Record<keyof T, unknown>)[key] !== 'function') {
      throw new Error(`Contrato compartido ausente: ${name}.${String(key)}`);
    }
  }
  // Única frontera JS/TS: contratos declarados y verificados con el dominio real.
  return value as T;
}

export const nutritionPure = namespace<NutritionPure>('FITBUD_NUTRITION_PURE', [
  'calculateMacroTargets',
]);
export const nutrition = namespace<NutritionDomain>('FITBUD_NUTRITION_DOMAIN', [
  'macrosFromIngredientMap',
  'kcalFromMacros',
]);
export const contracts = namespace<Contracts>('FITBUD_DOMAIN_CONTRACTS', [
  'validateMacroTargets',
  'validateProfilePrefs',
  'validateDayLogState',
  'validateEntitlement',
]);
export const trainingPlan = namespace<TrainingPlanDomain>('FITBUD_TRAINING_PLAN', [
  'phaseForWeek',
  'normalizeWeek',
  'validatePlan',
  'workoutFromSession',
  'sessionForDate',
]);
export const workoutPlayer = namespace<WorkoutPlayer>('FITBUD_WORKOUT_PLAYER', [
  'buildPrescription',
  'createExecution',
  'normalizeExecution',
  'elapsedSeconds',
  'timerRemaining',
  'returnFromAway',
  'progress',
  'strengthTotals',
]);
export const sync = namespace<SyncDomain>('FITBUD_SYNC_CONFLICTS', [
  'clone',
  'normalizeDayStateForSync',
  'mergeDayLogStates',
  'remoteChangedSince',
]);

if (!Array.isArray(shared.FITBUD_EXERCISES)) throw new Error('Catálogo compartido ausente');
export const exercises: readonly Exercise[] = shared.FITBUD_EXERCISES;

export type * from './types/domain';
