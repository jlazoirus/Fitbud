# Inventario del dominio para la migración nativa — NAT-01

Revisión: 2026-11-11, base `1e82820` (18 074 líneas en `app/index.html`). Las líneas son un snapshot de esa revisión, no de la portada pública `index.html`. El índice de abajo cubre las 1 262 funciones declaradas en el script principal. No se movió código en esta tarea.

El código actual incluye variedad semanal (REQ-377), espera conversacional (REQ-378), recuperación de racha (REQ-379) e imagen para compartir (REQ-380). Las referencias del backlog original de octubre ya no ubican las funciones. Antes de cada extracción, buscar por nombre y contrastar contra HEAD.

## Fronteras verificadas

| Destino | Funciones de entrada actuales | Dependencias y salida propuesta | Riesgo que debe cubrir la prueba |
|---|---|---|---|
| `day-model` (NAT-03) | `buildDay:2435`, `dayState:2893`, `mealState:2894`, `mealValue:3001`, `mealHasContent:3033`, `dayTotals:3036` | Día/estado, slots, snapshot nutricional, catálogo y contexto de calendario explícitos. El adaptador web conserva la identidad de los objetos de `S.days`; el núcleo devuelve datos sin escribir en `S`. | Override manual > reemplazo escalado > snapshot materializado > catálogo > vacío; un snapshot ya escalado no vuelve a la receta base. Extras, saltadas, macros parciales y redondeo solo al final. |
| `plan-calendar` (NAT-04) | `effectiveWorkout:2126`, `effectiveDayTarget:2165`, `planCalendarForPrefs:2188`, `planVersionForDate:2283`, `planPrefsForDate:2303`, `activeNutritionPlanDay:2309`, `planContextForDate:2400`, `weekOf:2425` | Perfil actual, versiones, fechas de ciclo y hoy local como parámetros. Devuelve contexto/calendario/objetivo/entreno; no consulta `DB`/`profile`/`S` de forma implícita. | REQ-69: la meta usa el perfil actual aunque la prescripción provenga de un snapshot. Fechas locales, límites de ciclo, descanso, rutina propia, cambio de lugar y `safety_hold`. |
| `progress-metrics` (NAT-05) | `cycleSummary:3092`, `recentNutritionAdherence:14866`, `trainingDayResult:14919`, `combinedDayDone:14937`, `combinedStreakState:14947`, `streakStats:14976`, `streak:15043`, `analyzeCheckinAnswers:17459` | Días, pesos, metas, ciclo, respuestas y fecha de evaluación. Usa resultados del modelo de día; devuelve métricas, sin guardar hitos ni mostrar celebraciones. | Comida vacía/0 kcal, sesión abandonada, entrenamiento libre, escalas sin responder y recuperación de 1–2 días (REQ-379). `streak()` ya delega en `combinedStreakState()`: no extraer solo el algoritmo antiguo. |
| `sync-queue` (NAT-06) | `enqueueMutation:2527`, `restorePendingFromQueue:2575`, `drainSyncQueue:2684`, `resolveSyncConflict:2785`, `pushDay:16038`, `pullDay:16062`, `commitDay:16117`, `pushWeight:16142`, `pullWeights:16158` | Factory con `storage`, `remote`, identidad de usuario, reloj e IDs inyectados. `sync-conflicts.js` es autoridad de merges. Proyecta estado para badge/reintento; no llama `render`. | Borrador no subido conservado al reabrir, segregación por usuario, purga al salir, conflicto explícito, idempotencia, cambio de usuario mientras espera la red, snapshots y campos desconocidos intactos. |
| `api-client` (NAT-07) | `loadRemoteConfig:1296`, `loadEntitlement:2826`, `loadPrivacyState:3446`, `savePrivacyChoices:3473`, `privacyRequest:9758`, `coachRequestId:12771`, `coachProxyFetch:12860`, `callClaude:12957` | `baseUrl`, transporte, sesión, versión/plataforma, generador de requestId y reloj. Devuelve resultados y errores estructurados. La web decide toast/paywall; nativo respeta cobro web sin enlaces de compra. | 401, 402, cuota, timeout, respuestas no JSON, requestId estable por acción y cero secretos. No trasladar UI de compra, `/api/admin`, SDK de proveedor ni vocabulario técnico a pantallas normales. |
| `profile-model` (NAT-08) | `migrateProfilePrefs:1480`, `onboardingDefaults:3277`, `hasCompleteOnboarding:3335`, `profileReviewDue:3346`, `readTrainingFields:3692`, `needsProfileTuning:3770`, `readOnboardingStep:3932`, `saveOnboarding:4354` | Normalización/validación de objetos planos, defaults y armado de prefs. `read*` conserva solo lectura DOM en la web; `saveOnboarding` conserva consentimiento remoto, persistencia y navegación. Inyectar zona horaria, ahora, peso previo y respuestas de seguridad. | Schema v3 y campos desconocidos, 2–6 comidas, `strength_only`, fuerza en casa/exterior, biblioteca privada y estilo de rutina. Revisión y ciclos no borran historial. |
| `plan-orchestrator` (NAT-09) | `prepareFirstWeekNutrition:4156`, `prepareFirstWeekTraining:4209`, `persistFirstWeekPlan:4275`, `prepareFirstCycleWeek:4318`, `finalizeDayWithGate:13101`, `generateOneDay:13936`, `aiGenerateWeek:14149`, `applyWeekPlan:14425`, `activateTrainingPlanDraft:15965` | `api`, repositorios, catálogo, reloj y callbacks de progreso. Consume perfil, calendario y día. Separa preparación, validación y aplicación explícita; conserva snapshots ejecutados. | Coach inválido/cuota → ruta determinista; fallo parcial y reintento; bloqueo de lo ya consumido; variedad semanal vigente; propuestas de entrenamiento nunca sustituyen la rutina antes de confirmarse. |

## Orden sin ciclos entre módulos

1. Mantener `nutrition-pure`, `nutrition-domain`, `domain-contracts`, `exercise-catalog`, `workout-player`, `training-plan` y `sync-conflicts` como autoridades existentes. NAT-02 ya los carga sin navegador.
2. Extraer `profile-model` con sus dependencias explícitas; extraer `api-client` con transporte y auth inyectados. Ninguno debe importar UI ni orquestación.
3. Extraer `plan-calendar` usando perfil y funciones puras existentes. La resolución de rutina/día recibe el estado mínimo, sin importar `day-model` para evitar el ciclo calendario ↔ día.
4. Extraer `day-model` con el contexto ya resuelto. NAT-03 puede empezar antes de NAT-04 inyectando desde el adaptador web el contexto, slots, metas y workout que hoy resuelve la página.
5. Extraer `progress-metrics` sobre días/calendario. `sync-queue` usa sus puertos y `sync-conflicts`; no debe depender del cliente HTTP concreto ni llamar al modelo de progreso para renderizar.
6. `plan-orchestrator` es el consumidor final de perfil/calendario/día, API y puertos de persistencia. Recibe progreso/notificaciones por callbacks; nunca importa una pantalla.

Los helpers de rutina, biblioteca de comidas, conversación y check-in que aparecen en el anexo son dependencias de los journeys. La agrupación indica dónde separar sus reglas; no autoriza a meterlos todos en NAT-03 ni a ampliar silenciosamente sus paths. Si un journey necesita una extracción fuera de NAT-03..09, registrar una tarea core acotada antes de implementarla.

## Puertos y código que permanece en cada interfaz

- DOM, HTML, navegación, modales, campos, animaciones, audio, cámara, compartir, instalación/PWA y administración permanecen en adaptadores de la web o se reimplementan como interfaz nativa. Administración y compras no se portan al usuario nativo.
- `dayState` materializa estado de forma perezosa y muchos llamadores conservan referencias a sus objetos. Hacerlo puro exige separar normalización de la escritura y preservar esas referencias en el adaptador web; reemplazar indiscriminadamente `S.days[ds]` perdería ediciones.
- `readTrainingFields`, `readOnboardingStep`, `saveOnboarding`, `commitDay`, `callClaude` y `activateTrainingPlanDraft` son funciones mixtas. Extraer decisiones y dejar los efectos en puertos; no copiar el cuerpo completo al cliente nativo.
- `Date.now`, `new Date()` sin argumento y `todayStr()` deben quedar en la frontera y pasarse como datos. Las funciones de fecha existentes siguen operando con días locales; no sustituir por UTC durante la extracción.
- `migrateProfilePrefs` ahora usa `js/meal-log.js` (biblioteca, unidades y recetas) y `js/training-routine.js`. No basta importar únicamente `nutrition-pure`. Verificar y declarar esas dependencias antes de portar perfiles; evitar defaults que borren los campos nuevos.
- Racha social y compartir también usan `js/streak-friends.js` y `js/streak-share.js`. Mantener validación de privacidad y separar cálculo/serialización del render de imagen/compartir.

## Pruebas de frontera que deben conservarse

| Área | Pruebas existentes relevantes |
|---|---|
| Día/macros | `test-meal-value-replacement.mjs`, `test-nutritionplan-priority.mjs`, `validate-macro-target-wiring.mjs`, `validate-meal-reorder-skip.mjs`; E2E de nutrición, porciones, registro propio y cierre de día. |
| Calendario | `validate-plan-version-for-date.mjs`, `validate-macro-targets-invariant.mjs`, `validate-training-plan.mjs`; E2E de semanas, descanso/cambio de lugar y nuevo ciclo. |
| Perfil | `validate-onboarding-*.mjs`, `validate-training-onboarding-decisions.mjs`, `validate-training-safety-mode.mjs`; E2E de onboarding, preferencias y rutina. |
| Progreso | `test-checkin-goal-mapping.mjs`; E2E `racha-recuperacion.spec.js`, `racha.spec.js`, `peso-inicial.spec.js`. Añadir casos de comida vacía y sesión abandonada al validador puro. |
| Sync | `test-sync-conflicts.mjs`, `validate-sync-safe-merge.mjs`, `tests/e2e/sync-isolation.spec.js`; no sustituir aislamiento real por solo comparar strings del código. |
| Orquestación | `validate-onboarding-first-week.mjs`, `validate-nutrition-finalize-wiring.mjs`, `validate-meal-variety.mjs`; E2E de semana rápida, variedad y restricciones. |

Algunos validadores extraen cuerpos de funciones del HTML para ejecutarlos en `vm`. Al delegar en un módulo, ese fixture debe cargar el módulo real y conservar las aserciones de comportamiento. Cambiar un regex para aceptar cualquier wrapper no prueba paridad. Ampliar el alcance documental de la tarea antes de actualizar fixtures fuera de sus paths.

## Verificación del inventario

El índice se obtuvo del AST del script principal (Acorn y eslint-scope de NAT-02), con referencias directas a globals y llamadas entre funciones; se contrastaron manualmente las fronteras de la tabla inicial y todos los puntos de partida exigidos por NAT-01. Un chequeo automático verifica las 1 262 combinaciones nombre/línea contra la base citada. Las líneas cambian al extraer: la referencia estable es el nombre y este commit base.

La columna de efectos es directa. Una fila sin `DOM` puede llamar otra función con DOM; revisar el grafo de llamadores/calls antes de moverla. Las referencias dentro de handlers de texto son conservadoras y no sustituyen una prueba funcional. El anexo sirve para descubrir dependencias, no como certificación de pureza: la certificación la hace NAT-02 más los tests de la extracción.

## Anexo: índice de funciones y dependencias directas

Líneas de `app/index.html` en `1e82820`. Incluye las 1262 declaraciones de función de primer nivel; las funciones anónimas/callbacks se contabilizan dentro de su función propietaria. Las referencias en cadenas de handlers llevan `[texto]`; las llamadas dinámicas no resolubles necesitan revisión al portar la pantalla. `R`/`W` indican acceso directo a los globals indicados abajo, no el efecto transitivo de los llamadores. `mixto` exige dividir núcleo y adaptador: no mover la función entera. El destino agrupa responsabilidad, no amplía por sí mismo los paths de NAT-03..09.

Globals rastreados: `S`, `DB`, `REMOTE`, `profile`, `supa`, `current`, `view`, `UI`, `PLAN_VERSIONS`, `CYCLE_HISTORY`, `START`, `END`, `onboardingDraft`, `onboardingStep`, `safetyScreening`, `privacyConsents`, `ENTITLEMENT`, `GEN_DRAFT`, `GEN_WEEK_DRAFT`. Otros nombres/constantes se revisan con las dependencias del módulo antes de extraer. HTML/DOM se obtienen del AST y del markup literal; red/storage/reloj son efectos directos.

### profile-model

| Función (línea) | Globals R / W | Efectos directos | Llamadores |
|---|---|---|---|
| `normalizedBlockedDishes` (1441) | — | — | `migrateProfilePrefs`, `blockDishFromProfile` |
| `mealMacrosEntry` (1455) | — | — | `normalizedSavedMeals`, `recentCustomMeals`, `toggleSavedMeal`, `applyQuickPick` |
| `normalizedSavedMeals` (1465) | — | — | `migrateProfilePrefs`, `savedMeals`, `persistSavedMeals` |
| `normalizedBetweenExerciseRest` (1476) | — | — | `migrateProfilePrefs`, `betweenExerciseRestSeconds`, `saveProfile` |
| `migrateProfilePrefs` (1480) | — | — | `trainingPrefsFromPrefs`, `strengthProgression`, `sportSessions`, `profileMacroTargetsFromPrefs`, `mealSlotsForPrefs`, `planCalendarForPrefs`, `planSnapshotFields`, `planSnapshotDigest`, `planPrefsForDate`, `saveNutritionPlanVersion`, `planContextForDate`, `onboardingDefaults`, `hasCompleteOnboarding`, `renderPrivacyGate`, `prepareFirstWeekTraining`, `persistFirstWeekPlan`, `prepareFirstCycleWeek`, `saveOnboarding`, `reconcilePendingNutrition`, `maybePrepareNutritionWeek`, `routineContext`, `routineBaseKey`, `saveRoutineDraft`, `saveWorkoutCopy`, `removeSavedWorkout`, `coachFoodBlockTerms`, `dishBlockedBySavedList`, `renderProfile`, `updateTrainingSummary`, `updatePfStrengthChoice`, `saveProfile`, `changeMealCandidatePool`, `applyChangeMeal`, `buildSysPrompt`, `coachHardRestrictions`, `coachCompatibilityContext`, `deterministicDayPayload`, `dietQuotaValidation`, `trainingExpectedWeeks`, `openTrainingPlanGenerator`, `validateGeneratedDay`, `generateOneDay`, `variedWeekDraftDay`, `generateDeterministicWeek`, `blockGenDraftMeal`, `regenerateDayInWeekDraft`, `regenerateGenMeal`, `startWeightReference`, `loadProfile`, `saveProfilePrefs`, `ensurePlanVersion`, `createTrainingPlanDraft`, `weeklyCheckinDue`, `submitWeeklyCheckin`, `nextCheckinEffectiveDate`, `applyWeeklyCheckinProposal`, `declineWeeklyCheckinProposal`, `skipWeeklyCheckin` |
| `trainingPrefsFromPrefs` (1560) | — | — | `trainingPrefs`, `plannedTrainingLocation`, `plannedWorkoutId`, `workoutOptions`, `planSnapshotDigest`, `workoutPlayerContext`, `exerciseSafeForLimits`, `routineContext`, `openTrainingPlanSheet`, `openWorkoutPicker`, `trainingExpectedWeeks` |
| `normalizedTrainingSafetyMode` (1673) | — | — | `migrateProfilePrefs`, `isGentleTrainingPlan`, `effectiveTrainingPrimarySport`, `updateSafetyModeHelp`, `trainingSafetyModeHtml`, `readTrainingFields`, `readOnboardingStep` |
| `trainingHasDeclaredLimits` (1676) | — | — | `trainingSafetyRecommendation` |
| `trainingSafetyRecommendation` (1680) | — | — | `isGentleTrainingPlan`, `effectiveTrainingPrimarySport`, `trainingSafetyModeHtml` |
| `isGentleTrainingPlan` (1717) | — | — | `trainingPrefsFromPrefs`, `effectiveTrainingPrimarySport`, `compatibleStrengthExerciseSelection`, `routineContext`, `buildSysPrompt`, `coachCompatibilityContext`, `allowedExercisesForSession`, `trainingPlanValidationConfig`, `trainingPhaseDose`, `deterministicTrainingWeekPayload`, `trainingWeekPrompt`, `trainingPlanPromptMetadata` |
| `effectiveTrainingPrimarySport` (1723) | — | — | `trainingPrefsFromPrefs`, `buildSysPrompt`, `coachCompatibilityContext`, `deterministicTrainingWeekPayload`, `trainingWeekPrompt`, `trainingPlanPromptMetadata` |
| `exerciseBlockedByGentleMode` (1731) | — | — | `compatibleStrengthExerciseSelection`, `allowedExercisesForSession` |
| `normalizeStrengthPlace` (1738) | — | — | `migrateProfilePrefs`, `strengthChoiceFromPrefs`, `readTrainingFields`, `readOnboardingStep`, `updateOnboardingTrainingSummary`, `updateTrainingSummary`, `updateTrainingLocationDefaults`, `updatePfStrengthChoice` |
| `strengthModeFromChoice` (1746) | — | — | `migrateProfilePrefs`, `trainingPrefsForDate`, `readTrainingFields`, `readOnboardingStep`, `updateOnboardingTrainingSummary`, `updateTrainingSummary`, `updateTrainingLocationDefaults`, `strengthSessionAt` |
| `strengthChoiceFromPrefs` (1750) | — | — | `renderOnboarding`, `renderProfile` |
| `defaultEquipmentForStrengthChoice` (1754) | — | — | `migrateProfilePrefs`, `trainingPrefsForDate`, `strengthResourceHtml`, `readTrainingFields`, `readOnboardingStep`, `strengthSessionAt` |
| `onboardingDefaults` (3277) | R: profile, safetyScreening | — | `startNextChallenge`, `startOnboarding`, `renderOnboarding`, `onAuth`, `confirmRestartPlan` |
| `hasCompleteOnboarding` (3335) | — | — | `planNeedsRecap`, `profileReviewDue`, `privacyGateRequired`, `saveOnboarding`, `homePrepareDay`, `coachWelcomeEligible`, `canApplyCoachAction`, `notifyNudgeDue`, `backfillStartWeightOnce`, `saveEngagementSnapshot`, `onAuth`, `restartNudgeDue`, `returnCardData`, `maybeStartFitbrosTour` |
| `profileReviewDue` (3346) | — | reloj | `maybePromptProfileReview` |
| `consentRecord` (3356) | — | — | `hasCurrentConsent`, `saveOptionalConsents` |
| `hasCurrentConsent` (3359) | — | — | `recapPhotoSection`, `previewRecapPhoto`, `onboardingDefaults`, `renderPrivacyGate`, `renderProfile`, `uploadProgressPhoto`, `pullCycleHistory` |
| `hasRequiredConsents` (3363) | — | — | `onboardingDefaults`, `privacyGateRequired`, `renderPrivacyGate`, `prepareFirstWeekTraining`, `maybePrepareNutritionWeek`, `coachWelcomeHtml`, `renderHoy`, `routineEntryHtml`, `openRoutineConversation`, `canApplyCoachAction`, `sendCoachMessage`, `renderChatMode`, `callClaude`, `openTrainingPlanGenerator`, `onAuth` |
| `hasCurrentScreening` (3364) | R: profile, safetyScreening | — | `privacyGateRequired`, `trainingSafetyHold`, `prepareFirstWeekTraining`, `maybePrepareNutritionWeek`, `coachWelcomeHtml`, `renderHoy`, `routineEntryHtml`, `openRoutineConversation`, `canApplyCoachAction`, `sendCoachMessage`, `renderChatMode`, `callClaude`, `openTrainingPlanGenerator`, `onAuth` |
| `privacyGateRequired` (3368) | R: profile | — | `render`, `updateInstallPrompt` |
| `hasHardSafetyFlags` (3380) | R: safetyScreening | — | `hasSoftSafetyFlags`, `trainingSafetyHold` |
| `hasSoftSafetyFlags` (3386) | R: safetyScreening | — | `trainingSafetySoftHold`, `trainingInjuryNoticeActive` |
| `injuryTrainingAcked` (3392) | R: profile, safetyScreening | — | `trainingSafetySoftHold` |
| `trainingSafetyHold` (3397) | — | — | `effectiveWorkout`, `trainingSafetySoftHold`, `trainingInjuryNoticeActive`, `savePrivacyGate`, `prepareFirstWeekTraining`, `nextDailyAction`, `homeAgendaData`, `homeAgendaHtml`, `coachWelcomeHtml`, `coachWelcomeAnswer`, `buildContextualChips`, `renderHoy`, `canLogManualActivity`, `startWorkoutExecution`, `routineEntryHtml`, `openRoutineConversation`, `routineProposalDecision`, `workoutChangeBlocked`, `personalizeHintHtml`, `openTrainingPlanSheet`, `renderWorkout`, `toggleWorkout`, `coachActionContext`, `canApplyCoachAction`, `chatWorkoutCard`, `renderProfile`, `openWorkoutContingency`, `applyWorkoutContingency`, `openDayTrainingPlace`, `setDayTrainingPlace`, `buildSysPrompt`, `openTrainingPlanGenerator` |
| `trainingSafetySoftHold` (3401) | — | — | `acknowledgeInjuryTraining`, `openManualActivity`, `startWorkoutExecution`, `openWorkoutPicker` |
| `trainingInjuryNoticeActive` (3405) | — | — | `homeWorkoutTechniqueHtml`, `renderWorkout`, `buildSysPrompt` |
| `onboardingDefaultLocation` (3612) | — | — | `onboardingToggleDay`, `renderOnboarding` |
| `readTrainingFields` (3692) · mixto | — | DOM | `saveProfile` |
| `readFoodScheduleFields` (3722) · mixto | — | DOM | `saveProfile` |
| `timeMinutes` (3733) | — | — | `validateFoodSchedule` |
| `validateTrainingProfile` (3738) | — | — | `saveProfile` |
| `validateTrainingProfileCore` (3754) | — | — | `validateOnboardingStep` |
| `needsProfileTuning` (3770) | — | — | `renderProfile` |
| `validateFoodSchedule` (3774) | — | — | `saveProfile` |
| `validateFoodPreferences` (3787) | — | — | `validateOnboardingStep`, `saveProfile` |
| `readOnboardingStep` (3932) · mixto | R: onboardingDraft, onboardingStep | DOM | `onboardingNext`, `onboardingBack`, `recalculateOnboarding`, `updateOnboardingTrainingChoice`, `saveOnboarding` |
| `validateOnboardingStep` (3979) | R: onboardingDraft, onboardingStep | — | `onboardingNext`, `saveOnboarding` |
| `applyCalculatedMacros` (4000) · mixto | R: onboardingDraft / W: onboardingDraft | — | `onboardingNext`, `onboardingGoalChanged`, `recalculateOnboarding` |
| `reconcileOnboardingMacros` (4012) | — | — | `readOnboardingStep` |
| `saveOnboarding` (4354) · mixto | R: END, S, START, current, onboardingDraft, profile / W: S, current, onboardingDraft, view | reloj | `onboardingButtons [texto]` |

### plan-calendar

| Función (línea) | Globals R / W | Efectos directos | Llamadores |
|---|---|---|---|
| `trainingPrefs` (1590) | R: profile | — | `betweenExerciseRestSeconds`, `renderWorkout` |
| `dayTrainingPlace` (1597) | R: S | — | `dayTrainingLocation`, `trainingPrefsForDate`, `weeklyRoutineWorkout`, `weeklyRoutineNoticeHtml`, `routineProposalDecision`, `renderWorkout`, `openDayTrainingPlace`, `setDayTrainingPlace` |
| `plannedTrainingLocation` (1601) | — | — | `dayTrainingLocation`, `plannedStrengthPlace`, `renderWorkout` |
| `dayTrainingLocation` (1605) | — | — | `exerciseCompatibleForWorkout` |
| `plannedStrengthPlace` (1610) | — | — | `renderWorkout`, `openDayTrainingPlace`, `setDayTrainingPlace` |
| `trainingPrefsForDate` (1617) | R: profile | — | `generatedWorkoutForDate`, `strengthSessions`, `workoutOptions`, `effectiveWorkout`, `workoutPrescription`, `weeklyRoutineNoticeHtml`, `openWorkoutPicker`, `exerciseMissingEquipment` |
| `workoutSchedule` (1765) | — | — | `plannedWorkoutId`, `routineContext`, `trainingExpectedWeeks` |
| `generatedTrainingPlanForDate` (1790) | — | — | `generatedWorkoutForDate` |
| `generatedWorkoutForDate` (1795) | — | — | `plannedWorkoutId`, `workoutById`, `effectiveWorkout` |
| `workoutContentCanUpdate` (1821) | R: S | reloj | `trainingPrefsForDate`, `generatedWorkoutForDate`, `sportSessions`, `strengthSessions`, `homeAgendaHtml`, `weeklyRoutineWorkout`, `weeklyRoutineNoticeHtml`, `routineProposalDecision`, `saveCoachRoutine`, `workoutChangeBlocked` |
| `compatibleStrengthExerciseSelection` (1825) | — | — | `generatedWorkoutForDate`, `strengthSessions` |
| `compatibleCardioExerciseIds` (1857) | — | — | `generatedWorkoutForDate`, `sportSessions`, `allowedExercisesForSession` |
| `plannedWorkoutId` (1865) | — | — | `plannedStrengthPlace`, `effectiveWorkout`, `weeklyRoutineWorkout`, `applyWorkoutCopy`, `setWorkout`, `buildCoachContextText`, `applyCoachAction`, `applyWorkoutContingency`, `strengthSessionForSportDay`, `deterministicDayPayload`, `validateGeneratedDay`, `generateOneDay`, `weeklyCheckinStats` |
| `trainingWeek` (1901) | — | — | `generatedWorkoutForDate`, `strengthProgression`, `sportSessions`, `workoutPlayerContext` |
| `strengthProgression` (1905) | — | — | `strengthSessions` |
| `sportSessions` (1920) | — | — | `generatedWorkoutForDate`, `workoutOptions`, `deterministicTrainingWeekPayload` |
| `strengthSessions` (2062) | — | — | `workoutOptions` |
| `workoutOptions` (2106) | — | — | `workoutById`, `applyWorkoutCopy`, `openWorkoutPicker`, `openWorkoutContingency`, `strengthSessionForSportDay` |
| `workoutById` (2119) | — | — | `effectiveWorkout`, `workoutPrescription`, `applyWorkoutCopy`, `strengthSessionAt`, `deterministicTrainingWeekPayload` |
| `effectiveWorkout` (2126) | R: S | reloj | `buildDay`, `nextDailyAction`, `homeAgendaData`, `homeTomorrowData`, `coachWelcomeHtml`, `coachWelcomeAnswer`, `buildContextualChips`, `workoutPrescription`, `workoutContentIssues`, `activityContextNote`, `openManualActivity`, `openRoutineConversation`, `useSavedRoutine`, `openRoutineEditor`, `applyWorkoutCopy`, `leaveRepeatWorkout`, `renderWorkout`, `openWorkoutPicker`, `setWorkout`, `buildCoachContextText`, `coachActionContext`, `canApplyCoachAction`, `chatGreeting`, `chatWorkoutCard`, `openWorkoutContingency`, `openDayTrainingPlace`, `setDayTrainingPlace`, `openMissedSession`, `applyMissedSession`, `trainingDayResult`, `commitDay` |
| `dayRoutineWorkout` (2143) | R: S | — | `effectiveWorkout` |
| `profileMacroTargets` (2154) | R: profile | — | `renderProfile` |
| `profileMacroTargetsFromPrefs` (2158) | — | — | `profileMacroTargets`, `effectiveDayTarget` |
| `effectiveDayTarget` (2165) | R: profile | — | `planSnapshotDigest`, `buildNutritionPlanSnapshot`, `buildDay`, `dismissNutritionUpdate`, `undoNutritionRejection`, `chatGreeting`, `changeMealCandidatePool`, `applyChangeMeal`, `coachCompatibilityContext`, `habitualMealsForGeneration`, `deterministicDayPayload`, `dietQuotaValidation`, `generateOneDay`, `variedWeekDraftDay`, `generateDeterministicWeek`, `addGapSnackToDay`, `blockGenDraftMeal`, `updateGenMealGrams`, `applyGeneratedDay`, `genWeekReviewHtml`, `applyWeekPlan`, `regenerateDayInWeekDraft`, `regenerateGenMeal`, `regenerateGenMealRestore` |
| `mealSlotsForPrefs` (2169) | — | — | `planSnapshotDigest`, `buildDay` |
| `cycleNumber` (2175) | R: profile | — | `saveNutritionPlanVersion`, `_fetchRemoteSyncPayload`, `drainSyncQueue`, `planNeedsRecap`, `renderPlanRecap`, `startNextChallenge`, `persistFirstWeekPlan`, `maybePrepareNutritionWeek`, `shoppingChecksForWeek`, `activeGeneratedTrainingVersion`, `routineBaseKey`, `weeklyRoutineSession`, `routineProposalDecision`, `saveCoachRoutine`, `renderProgress`, `progressJourney`, `renderStreakSection`, `coachChatKey`, `buildCoachContextText`, `backfillStartWeightOnce`, `saveStreakMilestone`, `checkAndSaveMilestones`, `archiveCompletedCycle`, `upsertActiveCycle`, `ensurePlanVersion`, `createTrainingPlanDraft`, `pushWeight`, `pullWeights`, `weeklyCheckinDue` |
| `buildWeightRanges` (2176) | — | — | `refreshPlanCalendar` |
| `planCalendarForPrefs` (2188) | R: START | — | `planSnapshotDigest`, `planContextForDate`, `weekOf`, `weekNav`, `trainingExpectedWeeks`, `weeklyCheckinDue`, `nextCheckinEffectiveDate` |
| `planSnapshotFields` (2196) | — | — | `planSnapshotDigest`, `saveNutritionPlanVersion`, `ensurePlanVersion` |
| `planSnapshotDigest` (2256) | — | — | `ensurePlanVersion`, `createTrainingPlanDraft` |
| `planVersionForDate` (2283) | R: PLAN_VERSIONS, S | — | `generatedTrainingPlanForDate`, `planPrefsForDate`, `planContextForDate`, `resolvePlanVersionIdForDate`, `ensurePlanVersion` |
| `planPrefsForDate` (2303) | R: profile | — | `plannedTrainingLocation`, `plannedStrengthPlace`, `trainingPrefsForDate`, `plannedWorkoutId`, `strengthProgression`, `sportSessions`, `planContextForDate`, `firstWeekForDate`, `nutritionWeekStatus`, `shoppingWeek`, `workoutPlayerContext`, `exerciseSafeForLimits`, `openTrainingPlanSheet`, `weekSection`, `weekNav`, `buildCoachContextText`, `coachActionCurrentWeek`, `propagateMealOverride`, `strengthSessionForSportDay`, `strengthSessionAt`, `aiGenerateWeek`, `streakStats`, `returnGoalLine` |
| `activeNutritionPlanDay` (2309) | R: PLAN_VERSIONS | — | `buildDay` |
| `planContextForDate` (2400) | — | — | `buildDay`, `planWeekLabel`, `planWeeksCalendarHtml`, `planWeekNoticeKey`, `planWeekNoticeHtml`, `daySummary` |
| `refreshPlanCalendar` (2407) · mixto | R: START, profile / W: END, START | — | `loadProfile`, `saveProfilePrefs`, `clearSignedOutState` |
| `weekOf` (2425) | — | — | `trainingWeek`, `firstWeekForDate`, `nutritionWeekStatus`, `shoppingWeek`, `currentWeightWeek`, `weekSection`, `weekNav`, `buildCoachContextText`, `coachActionCurrentWeek`, `propagateMealOverride`, `aiGenerateWeek`, `streakStats`, `returnGoalLine` |
| `clampDate` (3052) | R: END, START | — | `saveOnboarding`, `setView`, `coachWelcomeHtml`, `coachWelcomeAnswer`, `coachWelcomeNavigate`, `renderHoy`, `saveProfile`, `onAuth` |
| `inRange` (3053) | R: END, START | — | `nav`, `canApplyCoachAction`, `openReminderLink` |
| `safetyHoldWorkout` (3432) | — | — | `effectiveWorkout` |
| `activeGeneratedTrainingVersion` (7279) | — | — | `openTrainingPlanSheet`, `renderWorkout` |
| `planWeekRangeLabel` (7797) | — | — | `nutritionWeekHtml`, `planWeekLabel`, `planWeeksCalendarHtml`, `planWeekNoticeHtml`, `weekSection` |
| `planWeekLabel` (7803) | — | — | `trainingPlanMeta`, `daySummary` |
| `trainingPlanMeta` (7807) | — | — | `openTrainingPlanSheet`, `renderWorkout` |
| `planVersionActiveForCycle` (15834) | R: PLAN_VERSIONS | — | `activeGeneratedTrainingVersion`, `buildCoachContextText`, `ensurePlanVersion`, `activateTrainingPlanDraft` |
| `planVersionSnapshotMatches` (15838) | — | — | `ensurePlanVersion` |
| `trainingPlanActivationDate` (15915) | R: END, S, START | reloj | `createTrainingPlanDraft` |

### day-model

| Función (línea) | Globals R / W | Efectos directos | Llamadores |
|---|---|---|---|
| `buildDay` (2435) | — | — | `dayDefaultItems`, `dayTotals`, `cycleSummary`, `dayHeaderNav`, `nextDailyAction`, `homeRegisterMeal`, `homeMenuSuggestionHtml`, `dismissNutritionUpdate`, `persistNutritionEdits`, `reconcilePendingNutrition`, `undoNutritionRejection`, `nutritionWeekStatus`, `maybePrepareNutritionWeek`, `homeTomorrowData`, `buildContextualChips`, `renderNutrition`, `shoppingList`, `daySummary`, `toggleMeal`, `coachActionContext`, `coachFindMeal`, `canApplyCoachAction`, `chatMealsCard`, `openReplace`, `propagateMealOverride`, `openMealContingency`, `changeMealCookingCap`, `changeMealCandidatePool`, `openChangeMeal`, `_buildChangeMealOpts`, `rerollChangeMealOptions`, `toggleMotivoChip`, `applyChangeMeal`, `openMealMore`, `blockCurrentMealDish`, `openEditor`, `recipeComponentsFor`, `replaceTargetHtml`, `renderEditorImpact`, `applyMealSubstitution`, `copyableEntries`, `copyPlan`, `renderCopyPreview`, `habitualMealsHistory`, `deterministicDayPayload`, `dietQuotaValidation`, `recentMealNames`, `generateOneDay`, `aiGenerateDay`, `variedWeekDraftDay`, `generateDeterministicWeek`, `weekPendingDays`, `addGapSnackToDay`, `blockGenDraftMeal`, `updateGenMealGrams`, `applyGeneratedDay`, `applyWeekPlan`, `regenerateDayInWeekDraft`, `regenerateGenMeal`, `regenerateGenMealRestore`, `aiReview`, `nutritionDayDone`, `extractLearnedPatterns`, `streakDayProgress`, `engagementPlanDays` |
| `dayState` (2893) · mixto | R: S / W: S | — | `mealState`, `dayDefaultItems`, `dayEffectiveOrder`, `moveDayItem`, `dayTotals`, `nextDailyAction`, `undoNutritionRejection`, `homeAgendaData`, `coachWelcomeHtml`, `coachWelcomeAnswer`, `buildContextualChips`, `renderNutrition`, `normalizedWorkoutExecution`, `saveManualActivity`, `removeManualActivity`, `persistWorkoutExecution`, `startWorkoutExecution`, `beginWorkoutExecution`, `discardWorkoutExecution`, `routineSuggestionHtml`, `useSavedRoutine`, `dismissSavedRoutine`, `resetDayRoutine`, `saveRoutineDraft`, `workoutChangeBlocked`, `applyWorkoutCopy`, `renderWorkout`, `daySummary`, `toggleExtra`, `setWorkout`, `delExtra`, `buildCoachContextText`, `coachActionContext`, `canApplyCoachAction`, `applyCoachAction`, `chatWorkoutCard`, `addContingencyEntry`, `revertMeal`, `changeMealCandidatePool`, `_buildChangeMealOpts`, `openWorkoutContingency`, `applyWorkoutContingency`, `openDayTrainingPlace`, `setDayTrainingPlace`, `openMissedSession`, `applyMissedSession`, `editExtra`, `copyableEntries`, `renderCopyPreview`, `confirmCopyMeals`, `saveEditor`, `lockedMealsForDay`, `applyGeneratedDay`, `activateTrainingPlanDraft`, `commitDay` |
| `mealState` (2894) | — | — | `skipMeal`, `unskipMeal`, `nextDailyAction`, `homeDayHasPreparedMeals`, `homeRegisterMeal`, `openFoodRegistration`, `nutritionMealEntry`, `persistNutritionEdits`, `reconcilePendingNutrition`, `undoNutritionRejection`, `nutritionDraftConflict`, `maybePrepareNutritionWeek`, `homeAgendaData`, `homeTomorrowData`, `buildContextualChips`, `mealCard`, `toggleMeal`, `coachActionContext`, `canApplyCoachAction`, `applyCoachAction`, `openReplace`, `applyReplace`, `revertMeal`, `propagateMealOverride`, `changeMealCookingCap`, `changeMealCandidatePool`, `openChangeMeal`, `_buildChangeMealOpts`, `rerollChangeMealOptions`, `toggleMotivoChip`, `applyChangeMeal`, `openMealMore`, `blockCurrentMealDish`, `openEditor`, `recipeComponentsFor`, `replaceTargetHtml`, `renderEditorImpact`, `applyMealSubstitution`, `undoMealSubstitution`, `renderCopyPreview`, `confirmCopyMeals`, `saveEditor`, `weekPendingDays`, `applyDayComidas`, `applyWeekPlan`, `nutritionDayDone`, `streakDayProgress` |
| `nextExtraOid` (2896) | — | — | `confirmCopyMeals`, `saveEditor`, `applyGeneratedDay` |
| `dayItemKey` (2897) | — | — | `dayEffectiveOrder`, `renderNutrition` |
| `dayDefaultItems` (2898) | — | — | `dayEffectiveOrder` |
| `dayEffectiveOrder` (2906) | — | — | `moveDayItem`, `openFoodRegistration`, `homeAgendaData`, `renderNutrition` |
| `canReorderDay` (2918) | — | reloj | `moveDayItem`, `reorderControlsHtml` |
| `moveDayItem` (2919) | — | — | `reorderControlsHtml [texto]` |
| `skipMeal` (2938) | — | — | `openMealMore [texto]` |
| `unskipMeal` (2944) | — | — | `mealCard [texto]` |
| `dishByName` (2950) | R: DB | — | `mealValue`, `nutritionMealEntry`, `mealRecipe`, `rememberRejectedMeal`, `openReplace`, `changeMealCookingCap`, `changeMealCurrentSlugs`, `dishByCandidateName`, `_buildChangeMealOpts`, `rerollChangeMealOptions`, `blockCurrentMealDish`, `recentDishSlugs`, `habitualMealSlug`, `validateGeneratedDay`, `weekDraftVariety`, `variedWeekDraftDay`, `blockGenDraftMeal` |
| `dishById` (2951) | R: DB | — | sin llamada estática; revisar callback/handler |
| `catalogArray` (2954) | — | — | `dishCompatibleSlots`, `coachCompatibilityContext`, `editDish` |
| `catalogSemanticsReady` (2959) | — | — | sin llamada estática; revisar callback/handler |
| `ingredientSemanticsReady` (2962) | R: DB | — | `catalogSemanticsReady`, `saveIngredient` |
| `dishSemanticsReady` (2965) | R: DB | — | `catalogSemanticsReady`, `foodsDishes`, `dishSync`, `dishModal`, `saveDish` |
| `mealMomentSemanticsReady` (2969) | R: DB | — | `dishModal`, `saveDish` |
| `cuisineSemanticsReady` (2972) | R: DB | — | `dishModal`, `saveDish` |
| `cookingLevelSemanticsReady` (2976) | R: DB | — | `dishModal`, `saveDish` |
| `catalogSlug` (2979) | — | — | `normalizedSavedMeals`, `recentCustomMeals`, `isSavedMeal`, `toggleSavedMeal`, `renderQuickPicks`, `catalogUnitGrams`, `recipeComponentsFor`, `renderRecipeResults`, `editorPortion`, `saveIngredient`, `saveDish` |
| `dishCompatibleSlots` (2983) | — | — | `dishSupportsSlot`, `dishSlotMeta`, `validateGeneratedDay`, `findGapSnack`, `editDish` |
| `dishSupportsSlot` (2988) | — | — | `promptCompatibleDishesForSlot`, `coachActionContext`, `canApplyCoachAction`, `openReplace`, `changeMealCandidatePool`, `saveDietDish` |
| `dishSlotMeta` (2993) | — | — | `slotDishReferenceLines`, `regenerateGenMeal`, `foodsDishes`, `editDietDish` |
| `mealValue` (3001) | R: DB | — | `dayTotals`, `nextDailyAction`, `homeDayHasPreparedMeals`, `homeRegisterMeal`, `nutritionWeekStatus`, `homeAgendaData`, `homeTomorrowData`, `mealCard`, `toggleMeal`, `coachActionContext`, `canApplyCoachAction`, `openReplace`, `changeMealCookingCap`, `changeMealCandidatePool`, `openChangeMeal`, `_buildChangeMealOpts`, `rerollChangeMealOptions`, `toggleMotivoChip`, `applyChangeMeal`, `openMealMore`, `blockCurrentMealDish`, `openEditor`, `replaceTargetHtml`, `renderEditorImpact`, `applyMealSubstitution`, `copyableEntries`, `renderCopyPreview`, `habitualMealsHistory`, `mealEntryForFinalize`, `recentMealNames`, `nutritionDayDone`, `streakDayProgress`, `engagementPlanDays`, `mealRecipe [texto]` |
| `mealHasContent` (3033) | — | — | `dayTotals`, `homeRegisterMeal`, `persistNutritionEdits`, `nutritionWeekStatus`, `homeAgendaData`, `homeTomorrowData`, `mealCard`, `toggleMeal`, `openMealMore`, `editorMetaDraft`, `renderEditorImpact`, `applyMealSubstitution`, `copyableEntries`, `habitualMealsHistory`, `nutritionDayDone`, `streakDayProgress` |
| `dayTotals` (3036) | — | — | `miniMacroDash`, `heroDash`, `nextDailyAction`, `homeAgendaData`, `buildContextualChips`, `daySummary`, `weekSection`, `buildCoachContextText`, `chatGreeting`, `habitualMealsHistory`, `aiReview`, `mealValue [texto]` |
| `nextDailyAction` (4867) · mixto | — | HTML | sin llamada estática; revisar callback/handler |
| `homeDayHasPreparedMeals` (4965) | — | — | `homeMenuSuggestionHtml`, `renderNutrition`, `canApplyCoachAction`, `chatMealsCard` |
| `nutritionMealEntry` (5040) | R: DB | — | `persistNutritionEdits`, `reconcilePendingNutrition`, `maybePrepareNutritionWeek`, `applyWeekPlan` |
| `nutritionOverride` (5050) | — | — | `reconcilePendingNutrition`, `undoNutritionRejection`, `maybePrepareNutritionWeek` |
| `nutritionFutureDates` (5054) | R: END, PLAN_VERSIONS, S, START | reloj | `persistNutritionEdits`, `reconcilePendingNutrition` |
| `nutritionDraftConflict` (5154) | R: DB, profile | — | `applyGeneratedDay`, `applyWeekPlan` |
| `homeAgendaData` (5292) | — | — | `renderHoy`, `coachActionDayClosed`, `buildContextualChips [texto]` |
| `homeTomorrowData` (5386) | R: END | — | `homeAgendaHtml` |
| `shoppingWeek` (5779) | — | reloj | `renderNutrition`, `shoppingList`, `toggleShoppingHave` |
| `shoppingKey` (5783) | — | — | `shoppingList` |
| `shoppingPendingCount` (5793) | — | — | `renderNutrition`, `refreshShoppingTool` |
| `shoppingList` (5801) | R: DB, END, S, START | reloj | `shoppingPendingCount`, `shoppingSheetHtml`, `shareShoppingList` |
| `shoppingQty` (5825) | — | — | `shoppingSheetHtml`, `shareShoppingList` |
| `shoppingChecksForWeek` (5832) | R: profile | — | `shoppingPendingCount`, `shoppingSheetHtml`, `toggleShoppingHave`, `shareShoppingList` |
| `exerciseArray` (5897) | — | — | `exerciseBlockedByGentleMode`, `exerciseEquipmentText`, `exerciseMediaSources`, `openExerciseGuide`, `exerciseCard`, `workoutExercisesHtml`, `workoutPrescription`, `workoutContentIssues`, `exerciseCompatibleForWorkout`, `exerciseSafeForLimits`, `exerciseSearchResultsHtml`, `routineContext`, `openRoutineConversation`, `routineSearchResultsHtml`, `renderWorkout`, `exerciseFitsHomeSetup`, `exerciseMissingEquipment`, `exerciseConflictsWithProfile`, `allowedExercisesForSession`, `deterministicTrainingWeekPayload`, `trainingWeekPrompt`, `validateExerciseRecord`, `renderExerciseAdmin`, `filterExerciseCards`, `exerciseFieldValue` |
| `exerciseCatalog` (5904) | R: DB | — | `compatibleStrengthExerciseSelection`, `compatibleCardioExerciseIds`, `exerciseBySlug`, `openExerciseSubstitution`, `exerciseSearchResultsHtml`, `routineSearchResultsHtml`, `activeTrainingCatalog`, `renderExerciseAdmin` |
| `exerciseBySlug` (5912) | — | — | `generatedWorkoutForDate`, `homeWorkoutTechniqueHtml`, `openExerciseGuide`, `workoutExercisesHtml`, `workoutPrescription`, `workoutContentIssues`, `workoutVariationLabel`, `renderReviewedWorkoutStep`, `startWorkoutExecution`, `pendingPrescribedSets`, `workoutStepName`, `addWorkoutExercise`, `setWorkoutVariation`, `openExerciseSubstitution`, `applyExerciseSubstitution`, `workoutVariationButtons`, `renderCurrentWorkoutStep`, `openRoutineConversation`, `submitRoutineConversation`, `reviewCoachRoutine`, `savedRoutineFor`, `dayCustomExercises`, `routineNamesLine`, `renderRoutineEditor`, `routineSearchResultsHtml`, `routinePick`, `cleanWorkoutCopyExercises`, `openSaveWorkoutCopy`, `workoutPlanSummaryHtml`, `deterministicTrainingWeekPayload`, `trainingDraftReviewHtml`, `filterExerciseCards`, `editExercise` |
| `exerciseLevelLabel` (5915) | — | — | `openExerciseGuide`, `exerciseCard`, `openExerciseSubstitution`, `exerciseSearchResultsHtml` |
| `exerciseEquipmentText` (5927) | — | — | `openExerciseGuide`, `exerciseCard`, `openExerciseSubstitution` |
| `exerciseMediaSources` (5935) | — | — | `homeWorkoutTechniqueHtml`, `exerciseHasDemo`, `exerciseMediaHtml` |
| `exerciseHasDemo` (5950) | — | — | `compatibleStrengthExerciseSelection`, `homeWorkoutTechniqueHtml`, `exerciseMediaHtml` |
| `workoutPrescription` (6047) | R: S | — | `homeWorkoutTechniqueHtml`, `normalizedWorkoutExecution`, `startWorkoutExecution`, `beginWorkoutExecution`, `routineSuggestionHtml`, `openRoutineEditor`, `renderWorkout`, `buildCoachContextText`, `chatGreeting`, `chatWorkoutCard` |
| `buildWorkoutPrescription` (6073) | — | — | `workoutPrescription`, `deterministicTrainingWeekPayload` |
| `workoutPlayerContext` (6079) | — | — | `workoutPrescription`, `addWorkoutExercise`, `applyExerciseSubstitution` |
| `workoutContentIssues` (6086) | — | — | `homeWorkoutTechniqueHtml`, `startWorkoutExecution`, `renderWorkout`, `chatWorkoutCard` |
| `normalizedWorkoutExecution` (6090) | — | reloj | `nextDailyAction`, `homeAgendaData`, `coachWelcomeHtml`, `coachWelcomeAnswer`, `reviewPreviousWorkoutStep`, `reviewNextWorkoutStep`, `exitWorkoutReview`, `reopenWorkoutStep`, `pauseResumeWorkoutExecution`, `startWorkoutTimer`, `startCurrentWorkoutStep`, `toggleWorkoutTimer`, `addWorkoutTimer`, `finishTimedWorkoutStep`, `skipWorkoutTimer`, `completeWorkoutStep`, `skipWorkoutStep`, `openWorkoutStepPicker`, `jumpToWorkoutStep`, `openAddWorkoutExercise`, `addWorkoutExercise`, `saveWorkoutSetField`, `toggleWorkoutSet`, `setWorkoutVariation`, `clearWorkoutVariation`, `explainLoadVariation`, `openExerciseSubstitution`, `exerciseSearchResultsHtml`, `applyExerciseSubstitution`, `openFinishWorkout`, `fillPendingWorkoutSets`, `finishWorkoutExecution`, `reviewPendingWorkoutSets`, `markWorkoutCompleted`, `resumePartialWorkout`, `workoutTimerTick`, `chooseOptionalWorkoutStep`, `startMovementGuide`, `moveMovementGuide`, `addWorkoutSet`, `removeWorkoutSet`, `explainWorkoutTempo`, `openRoutineEditor`, `workoutChangeBlocked`, `renderWorkout`, `canApplyCoachAction`, `chatWorkoutCard`, `openWorkoutContingency`, `openDayTrainingPlace`, `setDayTrainingPlace`, `openMissedSession`, `appBusyForUpdate` |
| `workoutOutcomeForState` (6099) | — | — | `cycleSummary`, `nextDailyAction`, `homeAgendaData`, `coachWelcomeHtml`, `coachWelcomeAnswer`, `buildContextualChips`, `workoutOutcomeForDay`, `workoutHasRecordedActivity`, `daySummary`, `progressIsEmpty`, `progressStats`, `trainingDayResult`, `lastTrainingDate` |
| `manualActivities` (6131) | — | — | `workoutContentCanUpdate`, `nextDailyAction`, `homeAgendaData`, `workoutOutcomeForState`, `lastManualActivitySport`, `manualActivityBlock`, `openManualActivity`, `saveManualActivity`, `removeManualActivity`, `workoutStatusHtml`, `renderWorkout`, `trainingDayResult` |
| `activitySport` (6134) | — | — | `nextDailyAction`, `homeAgendaData`, `estimateActivityKcal`, `manualActivityBlock`, `removeManualActivity` |
| `activityIntensityLabel` (6135) | — | — | `manualActivitySummary` |
| `activityWeightKg` (6136) | R: profile | — | `openManualActivity`, `updateManualActivityEstimate`, `saveManualActivity` |
| `estimateActivityKcal` (6140) | — | — | `updateManualActivityEstimate`, `saveManualActivity` |
| `manualActivitySummary` (6146) | — | — | `nextDailyAction`, `homeAgendaData`, `manualActivityBlock` |
| `workoutOutcomeForDay` (6149) | R: S | — | `workoutStatusHtml`, `returnCardData` |
| `workoutHasRecordedActivity` (6150) | — | — | `cycleSummary`, `buildCoachContextText`, `canApplyCoachAction`, `dayActive`, `trainingPlanActivationDate`, `activateTrainingPlanDraft`, `weeklyCheckinStats`, `trainingDayResult [texto]` |
| `workoutStatusLabel` (6157) | — | — | `homeAgendaHtml`, `workoutStatusHtml` |
| `canLogManualActivity` (6166) | — | reloj | `homeAgendaData`, `manualActivityBlock`, `openManualActivity`, `saveManualActivity`, `renderWorkout` |
| `isFreeActivityWorkout` (6168) | — | — | `nextDailyAction`, `homeAgendaData`, `coachWelcomeAnswer`, `buildContextualChips`, `activityContextNote`, `openManualActivity`, `renderWorkout`, `trainingDayResult` |
| `activityContextNote` (6169) | — | — | `openManualActivity` |
| `lastManualActivitySport` (6175) | R: S | — | `openManualActivity` |
| `saveManualActivity` (6234) | — | reloj | `openManualActivity [texto]` |
| `removeManualActivity` (6248) | — | — | `manualActivityBlock [texto]` |
| `formatWorkoutTime` (6261) | — | — | `workoutTimerTick`, `renderWorkoutTimer`, `renderWorkoutExecution` |
| `workoutPhaseLabel` (6266) | — | — | `renderMovementStep`, `renderOptionalStepOffer`, `renderCurrentWorkoutStep` |
| `exerciseVariant` (6271) | — | — | `openExerciseGuide`, `setWorkoutVariation`, `workoutVariationButtons` |
| `workoutStepTitle` (6278) | — | — | `renderReviewedWorkoutStep`, `workoutStepName`, `renderCurrentWorkoutStep` |
| `workoutVariationLabel` (6282) | — | — | `renderCurrentWorkoutStep` |
| `workoutLoadLabel` (6296) | — | — | `lastPerformanceSummary`, `lastLoadLabel`, `renderReviewedWorkoutStep`, `workoutCopySetsLine` |
| `lastWorkoutPerformance` (6300) | R: S | — | `lastPerformanceHtml`, `prefillStepFromLastTime`, `lastLoadLabel` |
| `lastPerformanceSummary` (6303) | — | — | `lastPerformanceHtml` |
| `lastPerformanceRpe` (6311) | — | — | `lastPerformanceHtml` |
| `prefillStepFromLastTime` (6335) | — | — | `renderCurrentWorkoutStep` |
| `lastLoadLabel` (6358) | — | — | `explainLoadVariation`, `workoutPlanSummaryHtml` |
| `currentWorkoutStep` (6363) | — | — | `startWorkoutTimer`, `startCurrentWorkoutStep`, `finishTimedWorkoutStep`, `completeWorkoutStep`, `skipWorkoutStep`, `openWorkoutStepPicker`, `addWorkoutExercise`, `setWorkoutVariation`, `clearWorkoutVariation`, `explainLoadVariation`, `openExerciseSubstitution`, `exerciseSearchResultsHtml`, `applyExerciseSubstitution`, `chooseOptionalWorkoutStep`, `startMovementGuide`, `moveMovementGuide`, `explainWorkoutTempo`, `renderCurrentWorkoutStep` |
| `nextWorkoutStepIndex` (6369) | — | — | `finishTimedWorkoutStep`, `completeWorkoutStep`, `skipWorkoutStep`, `toggleWorkoutSet`, `resumePartialWorkout`, `chooseOptionalWorkoutStep` |
| `reviewableWorkoutStep` (6374) | — | — | `reviewedWorkoutStepIndex`, `previousReviewableStepIndex`, `nextReviewableStepIndex` |
| `reviewedWorkoutStepIndex` (6375) | — | — | `reviewPreviousWorkoutStep`, `reviewNextWorkoutStep`, `renderActiveWorkoutStep`, `renderWorkoutExecution` |
| `previousReviewableStepIndex` (6379) | — | — | `reviewPreviousWorkoutStep`, `renderReviewedWorkoutStep`, `workoutBackButton` |
| `nextReviewableStepIndex` (6387) | — | — | `reviewNextWorkoutStep`, `renderReviewedWorkoutStep` |
| `reviewPreviousWorkoutStep` (6393) | — | — | `renderReviewedWorkoutStep [texto]`, `workoutBackButton [texto]` |
| `reviewNextWorkoutStep` (6401) | — | — | `renderReviewedWorkoutStep [texto]` |
| `exitWorkoutReview` (6408) | — | — | `renderReviewedWorkoutStep [texto]` |
| `reopenWorkoutStep` (6414) | — | — | `renderReviewedWorkoutStep [texto]` |
| `captureWorkoutElapsed` (6451) | — | reloj | `pauseResumeWorkoutExecution`, `openFinishWorkout`, `finishWorkoutExecution` |
| `persistWorkoutExecution` (6455) | — | reloj | `reviewPreviousWorkoutStep`, `reviewNextWorkoutStep`, `exitWorkoutReview`, `reopenWorkoutStep`, `pauseResumeWorkoutExecution`, `startWorkoutTimer`, `toggleWorkoutTimer`, `addWorkoutTimer`, `finishTimedWorkoutStep`, `skipWorkoutTimer`, `completeWorkoutStep`, `skipWorkoutStep`, `jumpToWorkoutStep`, `addWorkoutExercise`, `saveWorkoutSetField`, `toggleWorkoutSet`, `setWorkoutVariation`, `clearWorkoutVariation`, `applyExerciseSubstitution`, `openFinishWorkout`, `fillPendingWorkoutSets`, `finishWorkoutExecution`, `markWorkoutCompleted`, `resumePartialWorkout`, `workoutTimerTick`, `chooseOptionalWorkoutStep`, `startMovementGuide`, `moveMovementGuide`, `addWorkoutSet`, `removeWorkoutSet`, `renderCurrentWorkoutStep` |
| `startWorkoutExecution` (6463) | — | — | `acknowledgeInjuryTraining`, `renderWorkout [texto]`, `chatWorkoutCard [texto]` |
| `beginWorkoutExecution` (6477) | — | reloj | `finishWorkoutCountdown` |
| `countdownBeep` (6489) | — | — | `workoutCountdownTick`, `finishWorkoutCountdown` |
| `workoutCountdownKey` (6529) | — | — | sin llamada estática; revisar callback/handler |
| `finishWorkoutCountdown` (6537) | — | — | `workoutCountdownTick`, `openWorkoutCountdown [texto]` |
| `pauseResumeWorkoutExecution` (6543) | — | reloj | `renderWorkoutExecution [texto]` |
| `startWorkoutTimer` (6561) | — | reloj | `startCurrentWorkoutStep`, `toggleWorkoutSet`, `startMovementTimer` |
| `startCurrentWorkoutStep` (6576) | — | — | `renderWorkoutTimer [texto]` |
| `addWorkoutTimer` (6590) | — | reloj | `renderWorkoutTimer [texto]` |
| `finishTimedWorkoutStep` (6597) | — | reloj | `skipWorkoutTimer`, `workoutTimerTick` |
| `skipWorkoutTimer` (6608) | — | — | `renderWorkoutTimer [texto]` |
| `pendingPrescribedSets` (6615) | — | — | `completeWorkoutStep`, `workoutFullyCompleted`, `openFinishWorkout`, `fillPendingWorkoutSets`, `reviewPendingWorkoutSets`, `markWorkoutCompleted`, `renderWorkoutExecution` |
| `markWorkoutSetDone` (6627) | — | reloj | `completeWorkoutStep`, `toggleWorkoutSet`, `fillPendingWorkoutSets` |
| `seriesCount` (6633) | — | — | `lastPerformanceSummary`, `renderReviewedWorkoutStep`, `openPendingSetsPrompt`, `openWorkoutStepPicker`, `openFinishWorkout`, `renderWorkoutExecution`, `workoutCopySetsLine` |
| `completeWorkoutStep` (6636) | — | reloj | `openPendingSetsPrompt [texto]`, `renderMovementStep [texto]`, `renderCurrentWorkoutStep [texto]` |
| `betweenExerciseRestSeconds` (6657) | — | — | `betweenExerciseTimer`, `toggleWorkoutSet`, `workoutPlanSummaryHtml` |
| `betweenExerciseTimer` (6658) | — | reloj | `completeWorkoutStep` |
| `skipWorkoutStep` (6671) | — | reloj | `renderMovementStep [texto]`, `renderCurrentWorkoutStep [texto]` |
| `pendingStrengthStepIndexes` (6691) | — | — | `openWorkoutStepPicker`, `renderCurrentWorkoutStep` |
| `workoutStepName` (6694) | — | — | `openWorkoutStepPicker`, `renderCurrentWorkoutStep` |
| `jumpToWorkoutStep` (6711) | — | — | `openWorkoutStepPicker [texto]` |
| `removableAddedStep` (6722) | — | — | `skipWorkoutStep`, `renderCurrentWorkoutStep` |
| `addWorkoutExercise` (6729) | — | reloj | sin llamada estática; revisar callback/handler |
| `saveWorkoutSetField` (6746) | — | — | `renderStrengthSet [texto]` |
| `setWorkoutVariation` (6767) | — | — | `workoutVariationButtons [texto]` |
| `clearWorkoutVariation` (6783) | — | — | `workoutVariationButtons [texto]` |
| `exerciseCompatibleForWorkout` (6808) | — | — | `setWorkoutVariation`, `openExerciseSubstitution` |
| `exerciseSafeForLimits` (6817) | — | — | `addWorkoutExercise`, `exerciseCompatibleForWorkout`, `exerciseSearchResultsHtml`, `applyExerciseSubstitution`, `routineSearchResultsHtml` |
| `applyExerciseSubstitution` (6881) | — | — | `openExerciseSubstitution [texto]` |
| `workoutFullyCompleted` (6892) | — | — | `openFinishWorkout`, `finishWorkoutExecution` |
| `reviewPendingWorkoutSets` (6956) | — | — | `renderWorkoutExecution [texto]` |
| `markWorkoutCompleted` (6965) | — | — | `renderWorkoutExecution [texto]` |
| `resumePartialWorkout` (6972) | — | reloj | `reviewPendingWorkoutSets`, `renderWorkoutExecution [texto]` |
| `discardWorkoutExecution` (6980) | — | — | `renderWorkoutExecution [texto]` |
| `chooseOptionalWorkoutStep` (7068) | — | — | `renderOptionalStepOffer [texto]` |
| `startMovementGuide` (7079) | — | — | `renderMovementStep [texto]` |
| `moveMovementGuide` (7085) | — | — | `renderMovementStep [texto]` |
| `startMovementTimer` (7092) | — | — | `renderMovementStep [texto]` |
| `addWorkoutSet` (7123) | — | — | `renderCurrentWorkoutStep [texto]` |
| `removeWorkoutSet` (7131) | — | — | `renderStrengthSet [texto]` |
| `tempoPhases` (7147) | — | — | `explainWorkoutTempo`, `renderCurrentWorkoutStep` |
| `formatRestShort` (7285) | — | — | `reviewCoachRoutine`, `workoutPlanSummaryHtml`, `renderProfile` |
| `readOnboardingTrainingStyle` (7297) · mixto | R: onboardingDraft / W: onboardingDraft | — | `trainingStyleField [texto]` |
| `routineContext` (7298) | R: profile | — | `weeklyRoutineWorkout`, `openRoutineConversation`, `routineProposalDecision`, `buildCoachContextText`, `sendCoachMessage` |
| `routineBaseKey` (7312) | R: END, START, profile | — | `openRoutineConversation`, `submitRoutineConversation`, `routineProposalDecision`, `reviewCoachRoutine`, `saveCoachRoutine`, `sendCoachMessage` |
| `weeklyRoutineSession` (7318) | R: END, profile | — | `weeklyRoutineWorkout`, `weeklyRoutineNoticeHtml` |
| `weeklyRoutineWorkout` (7323) | R: S | — | `effectiveWorkout`, `weeklyRoutineNoticeHtml` |
| `removeWeeklyRoutine` (7345) | R: profile | — | `routineEntryHtml [texto]` |
| `routineProposalDecision` (7392) | R: END, START, profile | reloj | `reviewCoachRoutine`, `saveCoachRoutine`, `canApplyCoachAction`, `renderCoachMessage` |
| `routineFamily` (7457) | — | — | `routineSuggestionHtml`, `useSavedRoutine`, `openRoutineEditor` |
| `routineFamilyKey` (7461) | — | — | `savedRoutineFor`, `saveRoutineDraft` |
| `savedRoutineFor` (7462) | R: profile | — | `routineSuggestionHtml`, `useSavedRoutine` |
| `dayCustomExercises` (7468) | R: S | — | `dayRoutineWorkout`, `workoutPrescription`, `repeatWorkoutLineHtml`, `renderWorkout` |
| `routineNamesLine` (7472) | — | — | `dayRoutineWorkout`, `routineSuggestionHtml`, `workoutCopyNames` |
| `useSavedRoutine` (7490) | — | — | `routineSuggestionHtml [texto]` |
| `resetDayRoutine` (7501) | — | — | `leaveRepeatWorkout`, `renderWorkout [texto]` |
| `routineStartReplace` (7563) | — | — | `renderRoutineEditor [texto]` |
| `routineCancelReplace` (7564) | — | — | `renderRoutineEditor [texto]` |
| `routineRemove` (7565) | — | — | `renderRoutineEditor [texto]` |
| `routineClear` (7569) | — | — | `renderRoutineEditor [texto]` |
| `saveRoutineDraft` (7570) · mixto | R: profile / W: profile | reloj | `renderRoutineEditor [texto]` |
| `cleanWorkoutCopyExercises` (7592) | — | — | `workoutCopyFromDay`, `savedWorkouts`, `dayRepeatWorkout` |
| `workoutCopyFromDay` (7604) | R: S | — | `repeatRecentWorkout`, `workoutSaveCopyHtml`, `openSaveWorkoutCopy` |
| `recentWorkoutCopies` (7613) | R: S | — | `workoutCopyPickerHtml` |
| `savedWorkouts` (7618) | R: profile | — | `useSavedWorkout`, `workoutSaveCopyHtml`, `removeSavedWorkout`, `workoutCopyPickerHtml` |
| `dayRepeatWorkout` (7622) | R: S | — | `dayRoutineWorkout`, `prefillStepFromLastTime`, `applyRepeatDoses`, `repeatWorkoutLineHtml`, `workoutCopyPickerHtml`, `renderWorkout`, `openWorkoutPicker` |
| `workoutCopyDayLabel` (7628) | — | — | `applyWorkoutCopy`, `repeatWorkoutLineHtml`, `workoutCopyPickerHtml` |
| `workoutCopyNames` (7632) | — | — | `workoutCopyPickerHtml` |
| `workoutCopySetsLine` (7633) | — | — | `openSaveWorkoutCopy` |
| `applyRepeatDoses` (7641) | — | — | `workoutPrescription` |
| `workoutChangeBlocked` (7655) | R: view | reloj | `applyWorkoutCopy`, `openWorkoutPicker`, `setWorkout` |
| `applyWorkoutCopy` (7667) | — | — | `repeatRecentWorkout`, `useSavedWorkout` |
| `repeatRecentWorkout` (7682) | — | — | `workoutCopyPickerHtml [texto]` |
| `useSavedWorkout` (7683) | — | — | `workoutCopyPickerHtml [texto]` |
| `clearRepeatWorkout` (7687) | — | — | `setWorkout` |
| `leaveRepeatWorkout` (7689) | — | — | `renderWorkout [texto]` |
| `removeSavedWorkout` (7731) · mixto | R: profile / W: profile | — | `workoutCopyPickerHtml [texto]` |
| `trainingPlanTitle` (7791) | — | — | `openTrainingPlanSheet`, `renderWorkout` |
| `planWeekNoticeKey` (7821) | — | — | `dismissPlanWeekNotice`, `planWeekNoticeHtml` |
| `mealRecipe` (7994) | R: DB | — | `nutritionMealEntry`, `shoppingList`, `mealCard`, `openMealMore`, `recipeComponentsFor` |
| `mealCardTap` (8079) | — | — | `mealCard [texto]` |
| `setWorkout` (8184) | — | — | `leaveRepeatWorkout`, `renderWorkout [texto]`, `openWorkoutPicker [texto]` |
| `delExtra` (8192) | — | — | `extraCard [texto]` |
| `addContingencyEntry` (11052) | — | reloj | `applyCoachAction`, `applyReplace`, `revertMeal`, `applyChangeMeal`, `applyWorkoutContingency`, `setDayTrainingPlace`, `applyMissedSession`, `applyMealSubstitution`, `undoMealSubstitution` |
| `revertMeal` (11056) | — | — | `mealCard [texto]` |
| `propagateMealOverride` (11079) | — | — | `applyReplace`, `applyChangeMeal` |
| `mealOptionRerollStore` (11098) · mixto | — | storage | `mealOptionRerollUsed`, `consumeMealOptionReroll` |
| `saveMealOptionRerollStore` (11101) · mixto | — | storage | `consumeMealOptionReroll` |
| `mealOptionRerollBucket` (11104) | — | reloj | `mealOptionRerollUsed`, `consumeMealOptionReroll` |
| `mealOptionRerollUsed` (11107) | — | — | `mealOptionRerollRemaining`, `consumeMealOptionReroll` |
| `mealOptionRerollRemaining` (11111) | — | — | `consumeMealOptionReroll`, `changeMealRerollMeta`, `changeMealRerollControlsHtml`, `updateChangeMealRerollControls`, `rerollChangeMealOptions` |
| `consumeMealOptionReroll` (11114) | — | — | `rerollChangeMealOptions`, `regenerateGenMeal` |
| `changeMealRerollMeta` (11123) | — | — | `changeMealRerollControlsHtml`, `updateChangeMealRerollControls` |
| `changeMealCookingCap` (11139) | — | — | `toggleMotivoChip` |
| `cappedCookingLevel` (11148) | — | — | `changeMealCandidatePool` |
| `changeMealCandidatePool` (11154) | R: DB, profile | — | `openChangeMeal`, `rerollChangeMealOptions`, `toggleMotivoChip` |
| `changeMealCurrentSlugs` (11194) | — | — | `rerollChangeMealOptions` |
| `dishByCandidateName` (11200) | — | — | `rerollChangeMealOptions` |
| `blockCurrentMealDish` (11455) | R: DB, profile | — | `openMealMore [texto]` |
| `applyWorkoutContingency` (11500) | — | — | `openWorkoutContingency [texto]` |
| `adaptDayLabel` (11508) | — | reloj | `renderWorkout`, `openDayTrainingPlace`, `openSportDayPlace` |
| `isStrengthWorkout` (11512) | — | — | `dayRoutineWorkout`, `workoutPrescription`, `openRoutineEditor`, `applyWorkoutCopy`, `renderWorkout`, `setWorkout`, `openDayTrainingPlace`, `setDayTrainingPlace` |
| `dayPlaceBackLabel` (11515) | — | — | `renderWorkout` |
| `strengthSessionForSportDay` (11542) | — | — | `openSportDayPlace`, `setDayTrainingPlace` |
| `strengthSessionAt` (11551) | — | — | `openSportDayPlace` |
| `setDayTrainingPlace` (11568) | — | — | `renderWorkout [texto]`, `openDayTrainingPlace [texto]`, `openSportDayPlace [texto]` |
| `applyMissedSession` (11602) | — | — | `openMissedSession [texto]` |
| `editorMetaDraft` (11623) | — | — | `openEditor`, `editExtra` |
| `editorMetaForSave` (11643) | — | — | `saveEditor` |
| `perPortion` (11653) | — | — | `recentCustomMeals`, `saveEditor` |
| `recentCustomMeals` (11661) | R: S | — | `renderQuickPicks`, `quickPicksHtml` |
| `savedMeals` (11675) | R: profile | — | `isSavedMeal`, `toggleSavedMeal`, `renderQuickPicks`, `quickPicksHtml` |
| `isSavedMeal` (11676) | — | — | `renderQuickPicks`, `editorSheet`, `saveEditor` |
| `persistSavedMeals` (11677) | R: profile | — | `toggleSavedMeal` |
| `quickPickSearch` (11698) | — | — | `quickPicksHtml [texto]` |
| `formatEditorNumber` (11764) | — | — | `setEditorValues`, `setComponentAmount`, `applyEditorComponents`, `renderEditorComponents`, `customFoodRowHtml`, `openCustomFoodForm`, `recipeYieldLabel`, `openRecipeForm`, `renderRecipeResults`, `renderRecipeLines`, `renderRecipePreview`, `customRecipeRowHtml`, `recipeUnitChanged`, `editorSheet` |
| `clearEditorErrors` (11794) | — | — | `setEditorValues`, `applyEditorComponents`, `applyEstimatedMacros` |
| `applyQuickPick` (11795) | — | — | `renderQuickPicks [texto]` |
| `setQuickPickPortion` (11820) | — | — | `renderPortionChips [texto]` |
| `catalogUnitGrams` (11832) | R: profile | — | `catalogFoodRowHtml`, `openCatalogUnitForm` |
| `unitWeightText` (11835) | — | — | `foodQuantityHtml`, `foodWeightHint`, `updateFoodWeightHint`, `changeFoodMeasure`, `openCatalogUnitForm`, `closeCatalogUnitForm`, `openCustomFoodForm` |
| `setFoodMeasure` (11865) | — | — | `changeFoodMeasure`, `closeCatalogUnitForm` |
| `maxFoodUnits` (11873) | — | — | `changeFoodMeasure`, `closeCatalogUnitForm`, `readFoodQuantity`, `setComponentAmount` |
| `changeFoodMeasure` (11874) | — | — | `foodQuantityHtml [texto]` |
| `persistCatalogUnitWeight` (11942) · mixto | R: profile, supa / W: profile | red, reloj | `saveCatalogUnitForm` |
| `addFoodToEditor` (11973) | — | — | `catalogFoodRowHtml [texto]` |
| `addEditorComponent` (11985) | — | — | `applyQuickPick`, `addFoodToEditor`, `addCustomFoodToEditor`, `addRecipeToEditor` |
| `componentUsesWholeUnits` (12025) | — | — | `setComponentAmount`, `renderEditorComponents` |
| `removeComponent` (12028) | — | — | `renderEditorComponents [texto]` |
| `recipeComponentsFor` (12076) | R: DB | — | `loadRecipeComponents`, `editorSheet` |
| `customFoods` (12099) | R: profile | — | `renderQuickPicks`, `openCustomFoodForm`, `saveCustomFoodForm`, `renderRecipeResults` |
| `addCustomFoodToEditor` (12114) | — | — | `customFoodRowHtml [texto]` |
| `customFoodFormChange` (12168) | — | — | `customFoodFormHtml [texto]` |
| `closeCustomFoodForm` (12169) | — | — | `deleteCustomFood`, `customFoodFormHtml [texto]` |
| `customFoodId` (12170) | — | reloj | `saveCustomFoodForm` |
| `deleteCustomFood` (12189) | — | — | `customFoodFormHtml [texto]` |
| `persistLibraryOp` (12201) · mixto | R: profile, supa | red | `persistCustomFoodOp`, `saveRecipeForm`, `deleteRecipe` |
| `persistCustomFoodOp` (12222) | — | — | `saveCustomFoodForm`, `deleteCustomFood` |
| `customRecipes` (12225) | R: profile | — | `renderQuickPicks`, `openRecipes`, `openRecipeForm`, `saveRecipeForm` |
| `recipeYieldLabel` (12226) | — | — | `openRecipes`, `customRecipeRowHtml` |
| `recipeSearch` (12268) | — | — | `openRecipeForm [texto]` |
| `setRecipeLineAmount` (12297) | — | — | `renderRecipeLines [texto]` |
| `removeRecipeLine` (12303) | — | — | `renderRecipeLines [texto]` |
| `deleteRecipe` (12342) | — | — | `openRecipeForm [texto]` |
| `barcodeScanSupported` (12378) | — | — | `renderScanRow`, `startBarcodeScan` |
| `setReplaceTarget` (12489) | — | — | `replaceTargetHtml [texto]` |
| `applyMealSubstitution` (12512) | — | reloj | `confirmCopyMeals`, `saveEditor` |
| `substSignature` (12523) | — | — | `applyMealSubstitution`, `canUndoSubst`, `undoMealSubstitution`, `confirmCopyMeals` |
| `canUndoSubst` (12524) | — | — | `mealCard`, `openMealMore` |
| `undoMealSubstitution` (12526) | — | — | `mealCard [texto]`, `openMealMore [texto]` |
| `copyableEntries` (12540) | — | — | `openCopyMeals` |
| `setCopyMode` (12574) | — | — | `openCopyMeals [texto]` |
| `setCopyEaten` (12575) | — | — | `renderCopyPreview [texto]` |
| `copyPlan` (12577) | — | — | `renderCopyPreview`, `confirmCopyMeals` |
| `confirmCopyMeals` (12612) | — | reloj | `openCopyMeals [texto]` |
| `editorPortion` (12668) | — | — | `saveEditor` |
| `ingById` (16180) | R: DB | — | `mealRecipe`, `coachDishText`, `findGapSnack`, `macrosFromLines`, `editIngredient`, `saveIngredient` |
| `macrosFromLines` (16181) | — | — | `dishMacros`, `dishModal` |
| `dishMacros` (16182) | R: DB | — | `mealValue`, `slotDishReferenceLines`, `coachActionContext`, `canApplyCoachAction`, `openReplace`, `_buildChangeMealOpts`, `rerollChangeMealOptions`, `findGapSnack`, `regenerateGenMeal`, `foodsDishes`, `foodsDiets` |
| `markWorkoutsAway` (18031) | R: S | reloj | sin llamada estática; revisar callback/handler |
| `reconcileAwayWorkouts` (18040) | R: S | reloj | `onAuth` |

### progress-metrics

| Función (línea) | Globals R / W | Efectos directos | Llamadores |
|---|---|---|---|
| `planNeedsRecap` (3085) | R: END, profile | reloj | `render`, `updateInstallPrompt` |
| `cycleSummary` (3092) | R: END, S, START, profile | — | `renderPlanRecap`, `startNextChallenge`, `progressStats`, `engagementSnapshot`, `confirmRestartPlan`, `returnCardHtml` |
| `recapDelta` (3125) | — | — | `renderPlanRecap`, `progressJourney` |
| `challengeGoal` (3223) | — | — | `applyChallengeDefaults` |
| `applyChallengeDefaults` (3228) | — | — | `startNextChallenge`, `onAuth` |
| `latestLoggedWeight` (3271) | R: S | — | `onboardingDefaults`, `activityWeightKg` |
| `progressIsEmpty` (8196) | R: S | — | `renderProgress` |
| `progressJourney` (8239) · mixto | R: END, START, profile | HTML | `renderProgress` |
| `progressStats` (8264) · mixto | R: S | HTML, reloj | `renderProgress` |
| `streakTrackPct` (8286) | — | — | `renderStreakSection` |
| `currentWeightWeek` (8347) | R: END, START | reloj | `startWeightNoteCard`, `weightTableHtml`, `weightRows`, `chatWeightCard`, `chatSaveWeight`, `scrollToWeightInput` |
| `weightRows` (8362) · mixto | — | HTML | `weightTableHtml` |
| `goalAwareDeltaColor` (8376) | — | — | `bodyComposition` |
| `bodyComposition` (8382) · mixto | R: profile | HTML | `renderProgress` |
| `wEntry` (14636) | R: S | — | `wkg`, `wbf`, `setWeightEntry`, `seedStartWeight` |
| `wkg` (14637) | — | — | `cycleSummary`, `startWeightNoteCard`, `progressStats`, `weightTableHtml`, `weightRows`, `bodyComposition`, `chatWeightCard`, `composition`, `lastWeighedWeek`, `startWeightReference`, `weightChart`, `weeklyCheckinStats` |
| `wbf` (14638) | — | — | `cycleSummary`, `startWeightNoteCard`, `weightTableHtml`, `weightRows`, `bodyComposition`, `chatSaveWeight`, `composition`, `weightChart` |
| `setWeightEntry` (14639) · mixto | R: S / W: S | — | `applyCoachAction`, `setWeight`, `setBodyFat` |
| `setWeight` (14648) | — | — | `weightRows [texto]` |
| `setBodyFat` (14649) | — | — | `weightRows [texto]` |
| `composition` (14652) | — | — | `bodyComposition` |
| `lastWeighedWeek` (14654) | — | — | `progressIsEmpty`, `startWeightNoteCard`, `weightSetupCard`, `progressStats`, `bodyComposition` |
| `positiveWeight` (14655) | — | — | `chatSaveWeight`, `seedStartWeight`, `startWeightReference` |
| `seedStartWeight` (14658) · mixto | R: S, profile / W: S | — | `saveOnboarding`, `backfillStartWeightOnce` |
| `backfillStartWeightOnce` (14669) | R: START, profile | reloj | `onAuth` |
| `startWeightReference` (14677) | R: profile | — | `weightChart` |
| `weightAxisDomain` (14683) | — | — | `weightChart` |
| `dayActive` (14845) | R: S | — | `lastActiveDayBefore`, `returnCardData` |
| `nutritionDayDone` (14856) | — | — | `recentNutritionAdherence`, `combinedDayDone`, `streakStats` |
| `recentNutritionAdherence` (14866) | R: START | — | `maybeUpdateLearnedPatterns` |
| `extractLearnedPatterns` (14874) | R: S, START | — | `maybeUpdateLearnedPatterns` |
| `maybeUpdateLearnedPatterns` (14903) · mixto | R: profile, supa / W: profile | red, reloj | `onAuth` |
| `trainingDayResult` (14919) | R: S | — | `combinedDayDone`, `streakStats`, `streakDayProgress` |
| `combinedDayDone` (14937) | R: START | reloj | `combinedStreakState`, `streakEndingAt`, `streakFeedbackAfterCommit`, `flushStreakCelebrations`, `engagementSnapshot`, `returnCardData` |
| `combinedStreakState` (14947) · mixto | R: END, START / W: current | reloj | `cycleSummary`, `streakStats`, `streak`, `streakEndingAt`, `streakFeedbackAfterCommit`, `engagementSnapshot`, `returnCardData` |
| `streakStats` (14976) | R: END, START | reloj | `progressStats`, `renderStreakSection` |
| `getStreakMilestones` (15008) | R: profile | — | `renderStreakSection`, `saveStreakMilestone`, `checkAndSaveMilestones` |
| `saveStreakMilestone` (15014) · mixto | R: profile / W: profile | reloj | `checkAndSaveMilestones` |
| `checkAndSaveMilestones` (15027) | R: profile | — | `renderHoy` |
| `streak` (15043) | — | — | `renderHoy`, `progressIsEmpty`, `checkAndSaveMilestones`, `primeStreakSeen`, `streakFeedbackAfterCommit`, `flushStreakCelebrations` |
| `streakEndingAt` (15045) | — | — | `streakFeedbackAfterCommit`, `engagementSnapshot`, `returnCardData` |
| `streakDayProgress` (15058) | R: END, START | reloj | `streakSeenState` |
| `streakSeenState` (15070) | R: START | reloj | `primeStreakSeen`, `streakFeedbackAfterCommit` |
| `primeStreakSeen` (15076) | — | — | `render` |
| `streakFeedbackAfterCommit` (15084) | R: profile | reloj | `commitDay` |
| `streakMissingText` (15112) | — | — | `streakPopCopy` |
| `streakPopCopy` (15119) | — | — | `renderStreakPop` |
| `pauseStreakPop` (15155) · mixto | — | timer | `renderStreakPop [texto]` |
| `engagementSnapshot` (15216) | R: START | reloj | `saveEngagementSnapshot` |
| `engagementPlanDays` (15234) | R: S, START | — | `engagementSnapshot` |
| `scheduleEngagementSave` (15251) · mixto | — | timer | `saveNotifPrefs`, `_savePushOptInDb`, `enableEmailReminders`, `onAuth`, `commitDay` |
| `saveEngagementSnapshot` (15255) · mixto | R: START, profile, supa | red, reloj | sin llamada estática; revisar callback/handler |
| `checkAutoLevelProgression` (15353) | R: S, profile | reloj | `openTrainingPlanGenerator` |
| `lastTrainingDate` (15636) | R: S | — | `restartNudgeDue`, `restartNudgeCard` |
| `daysBetween` (15642) | — | — | `restartNudgeDue`, `restartNudgeCard`, `returnCardData` |
| `restartNudgeDue` (15643) | R: END, START, profile | reloj | `restartNudgeCard`, `returnCardData` |
| `lastActiveDayBefore` (15679) | R: S, START | — | `returnCardData` |
| `returnCardData` (15685) | R: END, START, profile | reloj | `returnCardHtml` |
| `returnGoalLine` (15710) | R: profile | reloj | `returnCardHtml` |
| `getWeeklyCheckins` (17331) | R: profile | — | `cycleSummary`, `buildCoachContextText`, `weeklyCheckinDue`, `weeklyCheckinHistory` |
| `weeklyCheckinDue` (17337) | R: profile | reloj | `weeklyCheckinBanner`, `weeklyCheckinChip`, `openWeeklyCheckin`, `skipWeeklyCheckin` |
| `weeklyCheckinRangeLabel` (17354) | — | — | `weeklyCheckinBanner`, `weeklyCheckinChip`, `weeklyCheckinHistory` |
| `weeklyCheckinStats` (17382) | R: S | reloj | `openWeeklyCheckin`, `submitWeeklyCheckin` |
| `readCiScale` (17451) · mixto | — | DOM | `submitWeeklyCheckin` |
| `analyzeCheckinAnswers` (17459) | — | — | `submitWeeklyCheckin` |
| `nextCheckinEffectiveDate` (17592) | R: profile | reloj | `applyWeeklyCheckinProposal` |
| `applyWeeklyCheckinProposal` (17600) | R: profile | reloj | `submitWeeklyCheckin [texto]` |
| `applyDueCheckinAdjustment` (17623) · mixto | R: profile / W: profile | reloj | `renderHoy`, `applyWeeklyCheckinProposal [texto]` |
| `declineWeeklyCheckinProposal` (17633) | R: profile | reloj | `submitWeeklyCheckin [texto]` |
| `skipWeeklyCheckin` (17646) | R: profile | reloj | `weeklyCheckinBanner [texto]`, `openWeeklyCheckin [texto]` |

### sync-queue

| Función (línea) | Globals R / W | Efectos directos | Llamadores |
|---|---|---|---|
| `load` (2470) · mixto | — | storage | sin llamada estática; revisar callback/handler |
| `save` (2471) · mixto | R: S | storage | `drainSyncQueue`, `_applyRemoteSyncPayload`, `resolveSyncConflict`, `saveOnboarding`, `chatSaveWeight`, `connectFromAuth`, `setWeightEntry`, `seedStartWeight`, `saveSettings`, `saveSupabase`, `clearSupabase`, `clearKey`, `resetData`, `clearSignedOutState`, `onAuth`, `activateTrainingPlanDraft`, `pushDay`, `pullDay`, `pullAllDays`, `commitDay`, `pullWeights` |
| `_getSyncQ` (2484) · mixto | — | storage | `enqueueMutation`, `_dequeueMutation`, `clearSyncQueueForUser`, `_hasPendingDay`, `_hasPendingWeight`, `restorePendingFromQueue`, `_markSyncConflict`, `_resetConflictAsPending`, `_updateSyncBadge`, `drainSyncQueue`, `openSyncConflicts`, `resolveSyncConflict`, `appBusyForUpdate` |
| `_setSyncQ` (2485) · mixto | — | storage | `enqueueMutation`, `_dequeueMutation`, `clearSyncQueueForUser`, `_markSyncConflict`, `_resetConflictAsPending`, `drainSyncQueue` |
| `_getSyncMeta` (2486) · mixto | — | storage | `_syncBaseFor`, `_rememberRemoteVersion` |
| `_setSyncMeta` (2487) · mixto | — | storage | `_rememberRemoteVersion` |
| `syncClientId` (2488) · mixto | — | reloj, storage | `appendSyncResolutionLogToPayload`, `enqueueMutation` |
| `_syncMetaKey` (2495) | — | — | `_syncBaseFor`, `_rememberRemoteVersion` |
| `_syncBaseFor` (2496) | — | — | `enqueueMutation` |
| `_rememberRemoteVersion` (2500) | — | reloj | `drainSyncQueue`, `_applyRemoteSyncPayload`, `pushDay`, `pullDay`, `pullAllDays`, `pushWeight`, `pullWeights` |
| `_syncExtraId` (2506) | — | — | `prepareDayStateForSync` |
| `prepareDayStateForSync` (2511) | — | — | `_applyRemoteSyncPayload`, `pushDay`, `pullDay`, `pullAllDays`, `commitDay` |
| `appendSyncResolutionLogToPayload` (2518) | — | reloj | `_resolveQueuedConflictPayload`, `resolveSyncConflict` |
| `enqueueMutation` (2527) | — | reloj | `pushDay`, `pushWeight` |
| `_dequeueMutation` (2554) | — | — | `drainSyncQueue`, `resolveSyncConflict`, `pushDay`, `pushWeight` |
| `clearSyncQueueForUser` (2560) | — | — | `clearSignedOutState` |
| `_hasPendingDay` (2565) | — | — | `pullDay`, `pullAllDays` |
| `_hasPendingWeight` (2568) | — | — | `pullWeights` |
| `restorePendingFromQueue` (2575) · mixto | R: S / W: S | — | `onAuth` |
| `_markSyncConflict` (2581) | — | reloj | `drainSyncQueue` |
| `_resetConflictAsPending` (2595) | — | reloj | `resolveSyncConflict` |
| `_fetchRemoteSyncPayload` (2627) · mixto | R: START, supa | red | `drainSyncQueue` |
| `_payloadSameEnough` (2645) | — | — | `_resolveQueuedConflictPayload` |
| `_resolveQueuedConflictPayload` (2651) | — | reloj | `drainSyncQueue` |
| `drainSyncQueue` (2684) · mixto | R: S, supa / W: S | red, reloj | `resolveSyncConflict`, `signOutUser`, `onAuth` |
| `_applyRemoteSyncPayload` (2767) · mixto | R: S / W: S | — | `resolveSyncConflict` |
| `resolveSyncConflict` (2785) · mixto | R: S / W: S | reloj | `openSyncConflicts [texto]` |
| `persistNutritionEdits` (5062) | — | — | `reconcilePendingNutrition`, `undoNutritionRejection`, `maybePrepareNutritionWeek` |
| `loadProfile` (15295) · mixto | R: profile, supa / W: profile | red, reloj | `refreshAuth`, `onAuth` |
| `saveProfilePrefs` (15317) · mixto | R: profile, supa / W: profile | red, reloj | `startNextChallenge`, `prepareFirstCycleWeek`, `saveOnboarding`, `keepCurrentProfile`, `saveCardioLightEnabled`, `setAutomaticNutritionWeeks`, `toggleShoppingHave`, `removeWeeklyRoutine`, `saveCoachRoutine`, `saveRoutineDraft`, `saveWorkoutCopy`, `removeSavedWorkout`, `blockDishFromProfile`, `unblockDishFromProfile`, `applyLabsParam`, `setUiMode`, `saveProfile`, `persistSavedMeals`, `persistLibraryOp`, `backfillStartWeightOnce`, `saveStreakMilestone`, `checkAutoLevelProgression`, `confirmRestartPlan`, `dismissRestartNudge`, `applyWeeklyCheckinProposal`, `applyDueCheckinAdjustment`, `declineWeeklyCheckinProposal`, `skipWeeklyCheckin` |
| `dbLoad` (15540) · mixto | R: DB, supa / W: DB | red | `prepareFirstWeekNutrition`, `setView`, `retryNutritionPreferences`, `applyDeterministicDay`, `saveSupabase`, `onAuth`, `renderExerciseAdmin`, `saveExercise`, `archiveExercise`, `renderFoods`, `saveDiet`, `deleteDiet`, `saveDietDish`, `deleteDietDish`, `saveIngredient`, `deleteIngredient`, `saveDish`, `deleteDish`, `ensureDB` |
| `archiveCompletedCycle` (15771) · mixto | R: END, START, profile, supa | red, reloj | `startNextChallenge`, `confirmRestartPlan` |
| `upsertActiveCycle` (15782) · mixto | R: END, START, profile, supa | red | `saveOnboarding`, `saveProfile`, `onAuth` |
| `pullCycleHistory` (15791) · mixto | R: supa | red | `saveOnboarding`, `saveProfile`, `saveOptionalConsents`, `onAuth` |
| `pullPlanVersions` (15807) · mixto | R: supa / W: PLAN_VERSIONS | red | `saveNutritionPlanVersion`, `persistFirstWeekPlan`, `maybePrepareNutritionWeek`, `onAuth`, `ensurePlanVersion`, `createTrainingPlanDraft`, `activateTrainingPlanDraft` |
| `planVersionVersionNumber` (15827) | R: PLAN_VERSIONS | — | `saveNutritionPlanVersion`, `ensurePlanVersion`, `createTrainingPlanDraft` |
| `resolvePlanVersionIdForDate` (15842) | — | — | `backfillDayVersions`, `pushDay`, `pullDay`, `pullAllDays`, `commitDay` |
| `ensurePlanVersion` (15847) · mixto | R: profile, supa | red, reloj | `persistFirstWeekPlan`, `saveProfilePrefs`, `onAuth` |
| `createTrainingPlanDraft` (15921) · mixto | R: END, PLAN_VERSIONS, profile, supa | red, reloj | `persistTrainingDraft` |
| `backfillDayVersions` (16017) · mixto | R: END, START, supa | red, reloj | `saveProfilePrefs`, `onAuth`, `pullDay`, `pullAllDays` |
| `pushDay` (16038) · mixto | R: S, supa / W: S | red, reloj | `activateTrainingPlanDraft`, `commitDay` |
| `pullDay` (16062) · mixto | R: S, supa / W: S | red | `syncDay` |
| `pullAllDays` (16085) · mixto | R: END, S, START, supa / W: S | red | `maybePrepareNutritionWeek`, `onAuth` |
| `commitDay` (16117) | — | — | `moveDayItem`, `skipMeal`, `unskipMeal`, `reconcilePendingNutrition`, `maybePrepareNutritionWeek`, `saveManualActivity`, `removeManualActivity`, `persistWorkoutExecution`, `beginWorkoutExecution`, `discardWorkoutExecution`, `saveCoachRoutine`, `useSavedRoutine`, `dismissSavedRoutine`, `resetDayRoutine`, `saveRoutineDraft`, `applyWorkoutCopy`, `toggleMeal`, `toggleExtra`, `setWorkout`, `delExtra`, `applyCoachAction`, `applyReplace`, `revertMeal`, `propagateMealOverride`, `applyChangeMeal`, `applyWorkoutContingency`, `setDayTrainingPlace`, `applyMissedSession`, `undoMealSubstitution`, `confirmCopyMeals`, `saveEditor`, `applyDayComidas`, `applyGeneratedDay`, `markWorkoutsAway`, `reconcileAwayWorkouts`, `pushDay [texto]` |
| `syncDay` (16137) | R: current, supa, view | — | `setView`, `nav`, `goDay`, `saveSupabase` |
| `pushWeight` (16142) · mixto | R: START, supa | red, reloj | `chatSaveWeight`, `setWeightEntry`, `seedStartWeight` |
| `pullWeights` (16158) · mixto | R: S, START, supa / W: S | red | `onAuth`, `syncWeights` |
| `syncWeights` (16178) | R: supa, view | — | `setView`, `saveSupabase` |

### api-client

| Función (línea) | Globals R / W | Efectos directos | Llamadores |
|---|---|---|---|
| `loadCatalog` (1246) · mixto | — | red | `boot` |
| `loadRemoteConfig` (1296) · mixto |  / W: REMOTE | red | `retryConnect`, `boot` |
| `effectiveSettings` (1339) | R: REMOTE, S | — | `aiAvailable`, `hasEntitlement`, `persistFirstWeekPlan`, `coachApplicationEntitlement`, `canApplyCoachAction`, `renderAuth`, `callClaude`, `renderSettings`, `supaInit`, `clearStoredAuthSession`, `createTrainingPlanDraft` |
| `aiAvailable` (1349) | R: REMOTE | — | `coachUnavailable`, `prepareFirstWeekNutrition`, `prepareFirstWeekTraining`, `homePrepareDay`, `coachWelcomeHtml`, `renderHoy`, `sendCoachMessage`, `renderChatMode`, `rerollChangeMealOptions`, `editorSheet`, `openTrainingPlanGenerator`, `regenerateTrainingDraftWeek`, `regenerateTrainingDraftSession`, `aiGenerateWeek`, `regenerateDayInWeekDraft`, `renderSettings` |
| `coachErrorMessage` (1363) | — | — | `prepareFirstWeekNutrition`, `prepareFirstCycleWeek`, `sendCoachMessage`, `openTrainingPlanGenerator`, `regenerateTrainingDraftWeek`, `regenerateTrainingDraftSession`, `applyTrainingPlanDraft`, `estimateErrorMessage`, `aiGenerateDay`, `aiGenerateWeek`, `regenerateDayInWeekDraft`, `regenerateGenMeal`, `aiReview`, `renderAnalytics` |
| `loadEntitlement` (2826) · mixto | — | red | `refreshAfterStoreCheckout`, `prepareFirstCycleWeek`, `checkCheckoutReturn`, `restorePurchase`, `redeemCoupon`, `redeemPendingInvite`, `onAuth` |
| `loadBillingHistory` (2848) · mixto | — | red | `ensureBillingHistory`, `refreshBillingHistory` |
| `hasEntitlement` (2869) | R: profile | — | `coachUnavailable`, `prepareFirstWeekNutrition`, `homePrepareDay`, `sendCoachMessage`, `rerollChangeMealOptions`, `openTrainingPlanGenerator`, `aiGenerateWeek`, `regenerateDayInWeekDraft` |
| `freeAccessActive` (2877) | — | reloj | `noPricesMode`, `subscriptionStatusHtml` |
| `noPricesMode` (2882) | — | — | `coachErrorMessage`, `showPaywall` |
| `hasActivePremiumTrial` (2883) | — | reloj | `hasEntitlement`, `premiumTrialDaysLeft`, `prepareFirstWeekTraining`, `coachApplicationEntitlement`, `subscriptionStatusHtml`, `openTrainingPlanGenerator` |
| `premiumTrialDaysLeft` (2888) | — | reloj | `subscriptionStatusHtml` |
| `privacyApiMessage` (3441) | — | — | `acceptPhotoConsent`, `loadPrivacyState`, `saveOptionalConsents` |
| `loadPrivacyState` (3446) · mixto | R: supa / W: safetyScreening | red | `acceptPhotoConsent`, `savePrivacyChoices`, `saveOptionalConsents`, `onAuth`, `renderPrivacyUnavailable [texto]` |
| `privacyChoicesFrom` (3464) | — | — | `savePrivacyChoices` |
| `savePrivacyChoices` (3473) · mixto | R: profile, supa | red, reloj | `savePrivacyGate`, `saveOnboarding` |
| `privacyRequest` (9758) · mixto | — | red | `exportPersonalData`, `deleteMyAccount` |
| `loadNotifPrefs` (9795) · mixto | R: supa | red | `saveOnboarding`, `renderProfile`, `refreshPushSubscriptionKey`, `onAuth` |
| `_savePushOptInDb` (9994) · mixto | R: profile, supa | red, reloj | `subscribePush`, `savePushOptIn` |
| `notifyErrorCode` (10055) | — | — | `requestPushPermission`, `enableDevicePush` |
| `referralRequest` (10403) · mixto | — | red | `loadReferralBenefit`, `refreshReferrals` |
| `loadReferralBenefit` (10414) · mixto | R: view / W: view | red | `onAuth` |
| `coachRequestId` (12771) | — | — | `coachWelcomeAsk`, `sendCoachMessage`, `rerollChangeMealOptions`, `beginCoachAction` |
| `coachProxyFetch` (12860) · mixto | — | red, timer | `callClaude` |
| `callClaude` (12957) · mixto | — | red | `sendCoachMessage`, `rerollChangeMealOptions`, `generateTrainingWeek`, `aiEstimate`, `photoEstimateRound`, `generateOneDay`, `regenerateGenMeal`, `aiReview` |
| `parseJSON` (12992) | — | — | `rerollChangeMealOptions`, `generateTrainingWeek`, `aiEstimate`, `photoEstimateRound`, `generateOneDay`, `regenerateGenMeal`, `aiReview` |

### plan-orchestrator

| Función (línea) | Globals R / W | Efectos directos | Llamadores |
|---|---|---|---|
| `buildNutritionPlanSnapshot` (2327) | R: DB | reloj | `saveNutritionPlanVersion`, `prepareFirstWeekNutrition` |
| `saveNutritionPlanVersion` (2358) · mixto | R: PLAN_VERSIONS, profile, supa | red, reloj | `persistNutritionEdits`, `applyWeekPlan` |
| `firstWeekForDate` (4125) | — | — | `prepareFirstWeekNutrition` |
| `deterministicDaysForWeek` (4128) | — | — | `prepareFirstWeekNutrition` |
| `runFirstWeekCoachParts` (4142) | — | reloj | `prepareFirstWeekNutrition`, `prepareFirstWeekTraining` |
| `prepareFirstWeekNutrition` (4156) | R: DB, supa | — | `prepareFirstCycleWeek` |
| `prepareFirstWeekTraining` (4209) | R: END, START, profile | reloj | `prepareFirstCycleWeek` |
| `persistFirstWeekPlan` (4275) | R: END, START, profile, supa | — | `prepareFirstCycleWeek` |
| `prepareFirstCycleWeek` (4318) · mixto | R: profile / W: profile | reloj | `retryInitialWeekSetup`, `saveOnboarding` |
| `reconcilePendingNutrition` (5071) | R: DB, profile | — | `retryNutritionPreferences`, `saveProfile`, `blockCurrentMealDish`, `blockGenDraftMeal`, `onAuth` |
| `setNutritionUpdate` (5105) | — | — | `retryNutritionPreferences`, `maybePrepareNutritionWeek`, `saveProfile`, `blockCurrentMealDish`, `blockGenDraftMeal`, `onAuth` |
| `retryNutritionPreferences` (5117) | R: DB, profile | — | `nutritionUpdateHtml [texto]`, `mealCard [texto]` |
| `nutritionWeekStatus` (5160) | R: PLAN_VERSIONS, S | reloj | `nutritionWeekHtml`, `maybePrepareNutritionWeek` |
| `scheduleNutritionWeek` (5196) · mixto | R: profile | timer | `render` |
| `maybePrepareNutritionWeek` (5200) | R: DB, profile | reloj | `retryNutritionPreferences`, `setAutomaticNutritionWeeks`, `scheduleNutritionWeek` |
| `homePrepareDay` (5252) · mixto | R: profile / W: current | reloj | `homeMenuSuggestionHtml [texto]`, `chatMealsCard [texto]` |
| `applyDeterministicDay` (5267) | R: DB, supa | — | `homePrepareDay`, `deterministicFromModal`, `aiGenerateDay` |
| `deterministicFromModal` (5287) | R: current | — | `aiGenerateDay [texto]`, `genReviewHtml [texto]` |
| `coachWelcomeEligible` (5549) | R: profile | reloj | `coachWelcomeHtml`, `maybeStartFitbrosTour` |
| `coachWelcomeTopic` (5593) | — | — | `sendCoachMessage` |
| `coachWelcomeAnswer` (5600) | — | reloj | `coachWelcomeAsk`, `coachWelcomeNavigate`, `renderCoachMessage` |
| `buildContextualChips` (5632) | — | — | `renderHoy` |
| `coachChatKey` (8474) | — | — | `loadCoachChat`, `saveCoachChat`, `clearCoachChat` |
| `loadCoachChat` (8477) | — | — | `coachWelcomeAsk`, `renderHoy`, `reviewCoachRoutine`, `saveCoachRoutine`, `sendCoachMessage`, `applyCoachAction`, `renderChatMode`, `dismissCoachAction` |
| `saveCoachChat` (8480) | — | — | `coachWelcomeAsk`, `saveCoachRoutine`, `sendCoachMessage`, `applyCoachAction`, `dismissCoachAction` |
| `clearCoachChat` (8483) | — | — | `renderHoy [texto]` |
| `buildCoachContextText` (8489) | R: END, S, profile | reloj | `sendCoachMessage` |
| `coachHistoryText` (8530) | — | — | `sendCoachMessage` |
| `coachLikesLine` (8537) | — | — | `generateOneDay`, `regenerateGenMeal` |
| `coachCuisineVarietyLine` (8545) | — | — | `coachLikesLine` |
| `coachBlockedDishesLine` (8551) | — | — | `generateOneDay`, `regenerateGenMeal` |
| `rememberRejectedMeal` (8560) | R: DB | — | `blockCurrentMealDish`, `blockGenDraftMeal`, `regenerateGenMeal` |
| `sessionRejectedMeals` (8569) | — | — | `prefsWithSessionRejections`, `coachRejectedMealsLine`, `rejectionScope`, `validateGeneratedDay` |
| `prefsWithSessionRejections` (8575) | — | — | `deterministicDayPayload`, `validateGeneratedDay`, `generateOneDay`, `variedWeekDraftDay`, `blockGenDraftMeal`, `regenerateGenMeal` |
| `coachRejectedMealsLine` (8580) | — | — | `generateOneDay`, `regenerateGenMeal` |
| `rejectionScope` (8586) | — | — | `generateOneDay`, `regenerateGenMeal` |
| `coachFoodBlockTerms` (8590) | R: profile | — | `proteinPromptSources`, `coachDishBlockedByProfile`, `sendCoachMessage`, `dietQuotaValidation`, `mealOptionValidation`, `validMealSuggestions`, `validateGeneratedDay`, `generateOneDay`, `regenerateGenMeal` |
| `proteinPromptSources` (8598) | — | — | `omnivoreAnimalProteinPromptLine`, `generateOneDay` |
| `omnivoreAnimalProteinPromptLine` (8607) | — | — | `generateOneDay`, `regenerateGenMeal` |
| `nutritionSlotTargetsForDay` (8621) | — | — | `validateGeneratedDay`, `generateOneDay` |
| `slotArchetypeText` (8636) | — | — | `slotArchetypePromptLine` |
| `dietFruitPromptLine` (8648) | — | — | `generateOneDay` |
| `slotArchetypePromptLine` (8652) | — | — | `slotArchetypePromptLines`, `regenerateGenMeal` |
| `slotArchetypePromptLines` (8655) | — | — | `generateOneDay` |
| `slotBudgetPromptLine` (8658) | — | — | `generateOneDay` |
| `promptCompatibleDishesForSlot` (8664) | R: DB | — | `slotDishReferenceLines`, `regenerateGenMeal` |
| `slotDishReferenceLines` (8676) | R: DB | — | `generateOneDay` |
| `coachDishText` (8704) | R: DB | — | `coachDishBlockedByProfile` |
| `dishBlockKey` (8712) | — | — | `nutritionMealEntry`, `rememberRejectedMeal`, `dishBlockedBySavedList`, `blockDishFromProfile`, `blockCurrentMealDish`, `habitualMealSlug`, `validateGeneratedDay`, `blockGenDraftMeal` |
| `dishBlockedBySavedList` (8715) | R: profile | — | `coachDishBlockedByProfile`, `validateGeneratedDay` |
| `coachDishBlockedByProfile` (8722) | — | — | `promptCompatibleDishesForSlot`, `coachActionContext`, `canApplyCoachAction`, `changeMealCandidatePool`, `findGapSnack` |
| `blockDishFromProfile` (8728) · mixto | R: profile / W: profile | — | `blockCurrentMealDish`, `blockGenDraftMeal` |
| `unblockDishFromProfile` (8743) | R: profile | — | `undoNutritionRejection`, `unblockDishFromProfileUi` |
| `coachActionCurrentWeek` (8752) | — | — | `coachActionContext`, `canApplyCoachAction` |
| `coachActionDayClosed` (8756) | — | — | `coachActionContext`, `canApplyCoachAction` |
| `coachActionContext` (8759) | R: DB | — | `buildCoachContextText`, `sendCoachMessage` |
| `normalizeCoachAction` (8786) | — | — | `canApplyCoachAction`, `parseCoachReply` |
| `coachFindMeal` (8822) | — | — | `canApplyCoachAction` |
| `coachFindDish` (8827) | R: DB | — | `canApplyCoachAction` |
| `coachApplicationEntitlement` (8833) | R: profile | — | `canApplyCoachAction` |
| `canApplyCoachAction` (8839) | R: DB, profile | reloj | `reviewCoachRoutine`, `saveCoachRoutine`, `applyCoachAction`, `renderCoachMessage` |
| `coachActionButtonText` (8901) | — | — | `renderCoachMessage` |
| `coachDisplayText` (8908) | — | — | `normalizeCoachAction`, `parseCoachReply`, `renderCoachMessage` |
| `parseCoachReply` (8911) | — | — | `sendCoachMessage` |
| `sendCoachMessage` (8933) | — | reloj | `submitRoutineConversation`, `coachSendFromInput`, `renderHoy [texto]` |
| `applyCoachAction` (8996) | — | reloj | `renderCoachMessage [texto]` |
| `labsConversationalEnabled` (9067) | R: profile | — | `chatModeActive`, `setUiMode`, `renderProfile` |
| `chatModeActive` (9068) | R: profile | — | `render`, `renderCoach`, `scrollCoachToBottom`, `renderProfile` |
| `applyLabsParam` (9069) · mixto | R: profile / W: profile | — | `onAuth` |
| `setUiMode` (9081) · mixto | R: profile / W: profile, view | — | `renderChatMode [texto]`, `renderProfile [texto]` |
| `chatTurns` (9090) · mixto | — | reloj, storage | `chatAsk`, `chatSaveWeight`, `renderChatMode` |
| `saveChatTurns` (9095) · mixto | — | reloj, storage | `chatAsk`, `chatSaveWeight` |
| `chatAsk` (9102) | — | reloj | `renderChatMode [texto]` |
| `chatGreeting` (9110) | — | — | `renderChatMode` |
| `cookingLevelPromptLine` (9641) | — | — | `generateOneDay`, `regenerateGenMeal` |
| `buildSysPrompt` (12716) | R: profile | — | `callClaude` |
| `beginCoachAction` (12784) | — | — | `prepareFirstWeekNutrition`, `prepareFirstWeekTraining`, `sendCoachMessage`, `openTrainingPlanGenerator`, `regenerateTrainingDraftWeek`, `regenerateTrainingDraftSession`, `aiEstimate`, `photoEstimateRound`, `aiGenerateDay`, `aiGenerateWeek`, `regenerateDayInWeekDraft`, `regenerateGenMeal`, `aiReview` |
| `endCoachAction` (12788) | — | — | `prepareFirstWeekNutrition`, `prepareFirstWeekTraining`, `sendCoachMessage`, `openTrainingPlanGenerator`, `regenerateTrainingDraftWeek`, `regenerateTrainingDraftSession`, `aiEstimate`, `photoEstimateRound`, `aiGenerateDay`, `aiGenerateWeek`, `regenerateDayInWeekDraft`, `regenerateGenMeal`, `aiReview` |
| `coachHardRestrictions` (12789) | R: profile | — | `coachFoodBlockTerms` |
| `coachCompatibilityContext` (12815) | R: DB, profile | — | `prepareFirstWeekTraining`, `coachQuota`, `trainingPlanPromptMetadata`, `openTrainingPlanGenerator` |
| `coachQuota` (12849) | — | — | `sendCoachMessage`, `rerollChangeMealOptions`, `generateTrainingWeek`, `aiEstimate`, `photoEstimateRound`, `generateOneDay`, `regenerateGenMeal`, `aiReview` |
| `coachBusyLabel` (12914) | — | — | `showCoachBusy` |
| `coachBusy` (12931) | — | — | `_modalKeyHandler` |
| `recentDishSlugs` (12999) | R: S | — | `finalizeDayWithGate`, `weekDraftVariety` |
| `habitualMealSlug` (13018) | R: DB | — | `habitualMealsHistory` |
| `habitualMealsHistory` (13026) | R: S | reloj | `habitualMealsForGeneration` |
| `habitualMealsForGeneration` (13043) | R: DB, S | reloj | `coachCompatibilityContext`, `habitualBySlotForPrefs` |
| `habitualBySlotForPrefs` (13059) | R: DB | — | `habitualMealNames`, `finalizeDayWithGate`, `generateOneDay`, `generateDeterministicWeek` |
| `habitualMealNames` (13069) | — | — | `validateGeneratedDay` |
| `mealEntryForFinalize` (13075) | — | — | `nutritionMealEntry`, `applyChangeMeal`, `lockedMealsForDay` |
| `lockedMealsForDay` (13087) | — | — | `finalizeDayWithGate` |
| `finalizeDayWithGate` (13101) | R: DB | reloj | `reconcilePendingNutrition`, `maybePrepareNutritionWeek`, `applyChangeMeal`, `deterministicDayPayload`, `generateOneDay`, `variedWeekDraftDay`, `generateDeterministicWeek`, `blockGenDraftMeal`, `regenerateDayInWeekDraft`, `regenerateGenMeal` |
| `finalizedDayIsComplete` (13123) | — | — | `deterministicDayPayload` |
| `comidasMacroTotals` (13129) | — | — | `applyGeneratedDay`, `genWeekReviewHtml`, `applyWeekPlan` |
| `dietContractNoticeText` (13137) | — | — | `applyDeterministicDay`, `genReviewHtml`, `applyGeneratedDay`, `genWeekReviewHtml`, `applyWeekPlan` |
| `cookingWarnText` (13144) | — | — | `applyDeterministicDay`, `generateOneDay` |
| `deterministicDayPayload` (13147) | R: DB, profile | — | `applyDeterministicDay`, `generateOneDay` |
| `buildShoppingList` (13168) | — | — | `saveNutritionPlanVersion`, `prepareFirstWeekNutrition`, `deterministicWeekFromModal`, `genWeekReviewHtml` |
| `dietQuotaValidation` (13182) | R: profile | — | `generateOneDay` |
| `mealOptionValidation` (13195) | — | — | `rerollChangeMealOptions` |
| `validMealSuggestions` (13198) | — | — | sin llamada estática; revisar callback/handler |
| `activeTrainingCatalog` (13207) | — | — | `routineContext`, `coachCompatibilityContext`, `trainingExpectedWeeks`, `trainingWeekPrompt` |
| `trainingEquipmentSupports` (13210) | — | — | `exerciseFitsHomeSetup`, `exerciseMissingEquipment`, `allowedExercisesForSession` |
| `exerciseFitsHomeSetup` (13224) | — | — | `compatibleStrengthExerciseSelection` |
| `exerciseMissingEquipment` (13232) | — | — | `openExerciseSubstitution` |
| `exerciseConflictsWithProfile` (13237) | — | — | `compatibleStrengthExerciseSelection`, `allowedExercisesForSession` |
| `allowedLevelsForExperience` (13249) | — | — | `exerciseLevelAllowed` |
| `exerciseLevelAllowed` (13254) | — | — | `compatibleStrengthExerciseSelection`, `compatibleCardioExerciseIds`, `allowedExercisesForSession` |
| `allowedExercisesForSession` (13259) | — | — | `routineContext`, `trainingExpectedWeeks` |
| `trainingExpectedWeeks` (13283) | R: profile | — | `prepareFirstWeekTraining`, `openTrainingPlanGenerator` |
| `trainingBlockedTerms` (13310) | — | — | `trainingPlanValidationConfig`, `generateTrainingWeek` |
| `trainingPlanValidationConfig` (13313) | — | — | `generateTrainingWeek` |
| `trainingPhaseDose` (13330) | — | — | `weeklyRoutineWorkout`, `deterministicTrainingWeekPayload` |
| `deterministicTrainingWeekPayload` (13347) | — | — | `generateTrainingWeek` |
| `trainingWeekPrompt` (13394) | — | — | `generateTrainingWeek` |
| `generateTrainingWeek` (13426) | — | — | `prepareFirstWeekTraining`, `openTrainingPlanGenerator`, `regenerateTrainingDraftWeek`, `regenerateTrainingDraftSession` |
| `trainingPlanPromptMetadata` (13441) | — | — | `prepareFirstWeekTraining`, `persistTrainingDraft` |
| `persistTrainingDraft` (13453) | — | — | `openTrainingPlanGenerator`, `regenerateTrainingDraftWeek`, `regenerateTrainingDraftSession` |
| `trainingPhaseLabel` (13462) | — | — | `trainingDraftReviewHtml` |
| `validEstimate` (13710) | — | — | `aiEstimate`, `photoEstimateRound` |
| `estimateUnavailableError` (13715) | — | — | `aiEstimate`, `photoEstimateRound` |
| `estimateErrorMessage` (13716) | — | — | `aiEstimate`, `renderPhotoEstimateError` |
| `recentMealNames` (13792) | R: S | — | `validateGeneratedDay`, `generateOneDay`, `weekDraftVariety` |
| `validateGeneratedDay` (13803) | R: DB, profile | — | `dismissNutritionUpdate`, `undoNutritionRejection`, `generateOneDay`, `addGapSnackToDay`, `blockGenDraftMeal`, `updateGenMealGrams`, `regenerateGenMeal`, `regenerateGenMealRestore` |
| `findGapSnack` (13901) | R: DB | — | `genReviewHtml` |
| `generateOneDay` (13936) | R: profile | — | `prepareFirstWeekNutrition`, `aiGenerateDay`, `aiGenerateWeek`, `regenerateDayInWeekDraft` |
| `weekDays` (14082) | R: END, START | — | `prepareFirstWeekNutrition`, `nutritionWeekStatus`, `propagateMealOverride`, `weekHasGeneratedPlan`, `aiGenerateWeek`, `deterministicWeekFromModal`, `weeklyCheckinDue` |
| `weekHasGeneratedPlan` (14083) | R: S | — | sin llamada estática; revisar callback/handler |
| `weekDraftVariety` (14085) | R: DB | — | `variedWeekDraftDay`, `generateDeterministicWeek`, `regenerateDayInWeekDraft` |
| `variedWeekDraftDay` (14101) | R: DB, profile | — | `prepareFirstWeekNutrition`, `aiGenerateWeek`, `regenerateDayInWeekDraft` |
| `generateDeterministicWeek` (14117) | R: DB, profile | — | `deterministicDaysForWeek`, `aiGenerateWeek`, `deterministicWeekFromModal` |
| `weekPendingDays` (14142) | — | reloj | `prepareFirstWeekNutrition`, `aiGenerateWeek`, `deterministicWeekFromModal` |
| `applyDayComidas` (14268) | — | reloj | `persistFirstWeekPlan`, `applyDeterministicDay`, `applyGeneratedDay`, `applyWeekPlan` |
| `applyGeneratedDay` (14336) | — | reloj | `genReviewHtml [texto]` |
| `applyWeekPlan` (14425) | R: supa | reloj | `genWeekReviewHtml [texto]` |
| `activateTrainingPlanDraft` (15965) · mixto | R: END, PLAN_VERSIONS, S, profile, supa | red, reloj | `applyTrainingPlanDraft` |

### se queda en UI

| Función (línea) | Globals R / W | Efectos directos | Llamadores |
|---|---|---|---|
| `scrollAppTop` (1236) | — | DOM | `scrollAppTop`, `startNextChallenge`, `savePrivacyGate`, `startOnboarding`, `onboardingNext`, `onboardingBack`, `retryInitialWeekSetup`, `saveOnboarding`, `setView`, `applyDeterministicDay`, `nav`, `goDay`, `weekNav`, `setUiMode`, `finishNotifySetup`, `confirmRestartPlan`, `setFoodTab`, `renderProfile [texto]` |
| `scrollAppBottom` (1237) | — | DOM | `scrollAppBottom`, `scrollCoachToBottom` |
| `activeCatalogPlans` (1261) | — | — | `showPaywall`, `openAdminCourtesy` |
| `loadStorePlans` (1266) | — | — | `showPaywall`, `boot` |
| `planPriceText` (1272) | — | — | `showPaywall` |
| `planPeriodText` (1273) | — | — | `showPaywall` |
| `checkoutAvailable` (1303) | R: REMOTE | — | `showPaywall` |
| `storeCheckoutAvailable` (1305) | R: REMOTE | — | `showPaywall` |
| `storeCheckoutStart` (1309) | — | reloj, storage | `showStorePaywall [texto]` |
| `storeCheckoutPending` (1313) | — | reloj, storage | `storeCheckoutResult`, `refreshAfterStoreCheckout` |
| `storeCheckoutResult` (1322) | — | storage | `refreshAfterStoreCheckout`, `onAuth` |
| `refreshAfterStoreCheckout` (1330) | — | — | sin llamada estática; revisar callback/handler |
| `inviteOnlySignup` (1338) | R: REMOTE | — | `renderAuth`, `doAuth` |
| `coachUnavailable` (1350) | — | — | `aiGenerateDay`, `aiReview`, `toggleMic` |
| `settingSource` (1373) | R: REMOTE, S | — | `renderSettings` |
| `maskedSecret` (1380) | — | — | `renderSettings` |
| `primarySportHelp` (1640) | — | — | `updateSportHelp`, `renderOnboarding`, `renderProfile` |
| `updateSportHelp` (1646) | — | DOM | `updatePfSportSelector` |
| `strengthResourceHtml` (1759) | R: onboardingDraft, profile | HTML | `renderOnboarding`, `renderProfile`, `updatePfStrengthChoice` |
| `trainingPlanSummary` (1874) | R: profile | — | `renderOnboarding`, `updateOnboardingTrainingSummary`, `renderProfile`, `updateTrainingSummary` |
| `_updateSyncBadge` (2605) | — | DOM, timer | `enqueueMutation`, `_dequeueMutation`, `clearSyncQueueForUser`, `_markSyncConflict`, `_resetConflictAsPending`, `drainSyncQueue`, `openSyncConflicts` |
| `_syncConflictLabel` (2731) | — | — | `openSyncConflicts` |
| `_syncConflictDetail` (2736) | — | — | `openSyncConflicts` |
| `openSyncConflicts` (2747) | — | HTML | `_updateSyncBadge`, `resolveSyncConflict` |
| `_refreshAfterSyncResolution` (2781) | R: current, view | — | `resolveSyncConflict` |
| `reorderControlsHtml` (2929) | — | HTML | `mealCard`, `extraCard` |
| `paceClass` (3056) | — | reloj | `miniMacroDash`, `heroDash` |
| `pctW` (3066) | — | — | `macroMeter`, `miniMacroMeter`, `miniMacroDash`, `heroDash` |
| `dbStatusNote` (3067) | R: DB, supa | — | `renderNutrition` |
| `toast` (3078) | — | DOM, timer | `storeCheckoutResult`, `coachUnavailable`, `_updateSyncBadge`, `openSyncConflicts`, `resolveSyncConflict`, `skipMeal`, `unskipMeal`, `acceptPhotoConsent`, `previewRecapPhoto`, `startNextChallenge`, `acknowledgeInjuryTraining`, `savePrivacyGate`, `readOnboardingStep`, `onboardingNext`, `recalculateOnboarding`, `retryInitialWeekSetup`, `saveOnboarding`, `keepCurrentProfile`, `undoNutritionRejection`, `setAutomaticNutritionWeeks`, `homePrepareDay`, `applyDeterministicDay`, `deterministicFromModal`, `shareShoppingList`, `openExerciseGuide`, `openManualActivity`, `saveManualActivity`, `removeManualActivity`, `reviewPreviousWorkoutStep`, `startWorkoutExecution`, `beginWorkoutExecution`, `finishTimedWorkoutStep`, `skipWorkoutTimer`, `completeWorkoutStep`, `skipWorkoutStep`, `openWorkoutStepPicker`, `addWorkoutExercise`, `setWorkoutVariation`, `openExerciseSubstitution`, `applyExerciseSubstitution`, `finishWorkoutExecution`, `markWorkoutCompleted`, `discardWorkoutExecution`, `workoutTimerTick`, `addWorkoutSet`, `removeWeeklyRoutine`, `openRoutineConversation`, `submitRoutineConversation`, `reviewCoachRoutine`, `saveCoachRoutine`, `useSavedRoutine`, `resetDayRoutine`, `saveRoutineDraft`, `workoutChangeBlocked`, `applyWorkoutCopy`, `saveWorkoutCopy`, `toggleMeal`, `toggleWorkout`, `setWorkout`, `sendCoachMessage`, `applyCoachAction`, `applyLabsParam`, `chatSaveWeight`, `unblockDishFromProfileUi`, `saveProfile`, `saveOptionalConsents`, `exportPersonalData`, `saveNotifPrefs`, `requestPushPermission`, `_savePushOptInDb`, `enableDevicePush`, `enableEmailReminders`, `deleteMyAccount`, `activatePlanFromPaywall`, `checkCheckoutReturn`, `restorePurchase`, `redeemCoupon`, `copyReferralLink`, `redeemPendingInvite`, `connectFromAuth`, `inviteSignUp`, `finishPasswordRecovery`, `applyReplace`, `revertMeal`, `rerollChangeMealOptions`, `applyChangeMeal`, `blockCurrentMealDish`, `openWorkoutContingency`, `applyWorkoutContingency`, `openDayTrainingPlace`, `openSportDayPlace`, `setDayTrainingPlace`, `openMissedSession`, `applyMissedSession`, `persistSavedMeals`, `toggleSavedMeal`, `applyQuickPick`, `readFoodQuantity`, `addFoodToEditor`, `addEditorComponent`, `setComponentAmount`, `loadRecipeComponents`, `addCustomFoodToEditor`, `saveCustomFoodForm`, `deleteCustomFood`, `addRecipeLine`, `setRecipeLineAmount`, `saveRecipeForm`, `deleteRecipe`, `addRecipeToEditor`, `applyScannedCode`, `undoMealSubstitution`, `openCopyMeals`, `confirmCopyMeals`, `saveEditor`, `beginCoachAction`, `showCoachBusy`, `openTrainingPlanGenerator`, `applyTrainingPlanDraft`, `aiEstimate`, `answerPhotoQuestions`, `aiGenerateDay`, `aiGenerateWeek`, `deterministicWeekFromModal`, `blockGenDraftMeal`, `applyGeneratedDay`, `applyWeekPlan`, `regenerateGenMeal`, `toggleMic`, `saveSettings`, `saveSupabase`, `clearSupabase`, `clearKey`, `resetData`, `checkAndSaveMilestones`, `checkAutoLevelProgression`, `confirmRestartPlan`, `dismissRestartNudge`, `grantCourtesy`, `adminApplyResetPlan`, `adminConfirmResetUser`, `saveAdminQuotaPolicy`, `openAdminUserQuota`, `adminBetaAccept`, `copyBetaInvite`, `adminBetaSetStatus`, `copyAdminWelcome`, `sendAdminInvite`, `prepareAdminTestUser`, `adminToggleActive`, `saveAdminPassword`, `adminResetLink`, `editExercise`, `saveExercise`, `archiveExercise`, `saveDiet`, `deleteDiet`, `editDietDish`, `saveDietDish`, `deleteDietDish`, `saveIngredient`, `deleteIngredient`, `dishLineAdd`, `saveDish`, `deleteDish`, `applyWeeklyCheckinProposal`, `declineWeeklyCheckinProposal`, `skipWeeklyCheckin`, `announceAppUpdated`, `startFitbrosTour`, `reconcileAwayWorkouts` |
| `recapPhotoSection` (3130) | — | HTML | `renderPlanRecap` |
| `renderPlanRecap` (3148) | R: END, START | DOM, HTML | `previewRecapPhoto`, `render` |
| `openPhotoConsent` (3182) | — | HTML | `recapPhotoSection [texto]` |
| `acceptPhotoConsent` (3188) | R: supa | DOM, red, reloj | `openPhotoConsent [texto]` |
| `selectNextChallenge` (3205) | — | DOM | `renderPlanRecap [texto]` |
| `previewRecapPhoto` (3212) | — | — | `recapPhotoSection [texto]` |
| `startNextChallenge` (3238) | R: onboardingDraft, profile / W: onboardingDraft, onboardingStep | DOM | `renderPlanRecap [texto]` |
| `acknowledgeInjuryTraining` (3408) | R: profile, supa / W: profile | red, reloj | `openInjuryTrainingNotice [texto]` |
| `openInjuryTrainingNotice` (3423) | — | HTML | `openManualActivity`, `startWorkoutExecution`, `openWorkoutPicker` |
| `renderPrivacyUnavailable` (3512) | — | DOM, HTML | `render` |
| `renderPrivacyGate` (3522) | R: profile, safetyScreening | DOM, HTML | `render`, `renderProfile [texto]` |
| `savePrivacyGate` (3542) | R: profile | DOM | `renderPrivacyGate [texto]` |
| `openPrivacyNotice` (3559) | — | HTML | `renderPrivacyGate [texto]`, `renderOnboarding [texto]`, `renderProfile [texto]`, `renderAuth [texto]` |
| `openTermsNotice` (3567) | — | HTML | `renderAuth [texto]` |
| `startOnboarding` (3575) |  / W: onboardingDraft, onboardingStep | — | `homePrepareDay`, `maybePromptProfileReview [texto]`, `renderProfile [texto]` |
| `onboardingSteps` (3583) | R: onboardingStep | HTML | `renderOnboarding` |
| `onboardingButtons` (3586) | R: onboardingStep | HTML | `renderOnboarding` |
| `checkChips` (3592) | — | HTML | `strengthResourceHtml`, `renderProfile` |
| `trainingAvailabilityHtml` (3596) | — | HTML | `renderProfile` |
| `onboardingSelectedDays` (3618) | — | DOM | `onboardingToggleDay`, `onboardingApplyDefaultLocation`, `readOnboardingStep` |
| `onboardingLocationRowsHtml` (3621) | — | HTML | `onboardingToggleDay`, `onboardingApplyDefaultLocation`, `renderOnboarding` |
| `onboardingToggleDay` (3634) | R: onboardingDraft | DOM | `renderOnboarding [texto]` |
| `onboardingApplyDefaultLocation` (3646) | — | DOM | sin llamada estática; revisar callback/handler |
| `openMacroFormulaInfo` (3651) | R: onboardingDraft | HTML | `renderOnboarding [texto]` |
| `mealTimesHtml` (3658) | — | HTML | `renderProfile`, `updateProfileMealCount` |
| `checkedValues` (3663) | — | DOM | `readTrainingFields`, `readOnboardingStep`, `saveProfile` |
| `safetySelect` (3666) | — | — | `renderPrivacyGate`, `renderOnboarding` |
| `updateSafetyModeHelp` (3673) | — | DOM | `trainingSafetyModeHtml [texto]` |
| `explainTrainingIntensity` (3677) | — | HTML | `trainingSafetyModeHtml [texto]` |
| `trainingSafetyModeHtml` (3683) | — | HTML | `renderOnboarding`, `renderProfile` |
| `renderOnboarding` (3792) | R: onboardingDraft, onboardingStep / W: onboardingDraft | DOM, HTML | `onboardingNext`, `onboardingBack`, `onboardingGoalChanged`, `recalculateOnboarding`, `updateOnboardingTrainingChoice`, `updateOnboardingMealCount`, `render` |
| `onboardingNext` (4034) | R: onboardingDraft, onboardingStep / W: onboardingStep | — | `onboardingButtons [texto]` |
| `onboardingBack` (4046) | R: onboardingStep / W: onboardingStep | — | `onboardingButtons [texto]` |
| `onboardingGoalChanged` (4047) | R: onboardingDraft / W: onboardingDraft | — | `renderOnboarding [texto]` |
| `recalculateOnboarding` (4048) | — | — | `renderOnboarding [texto]` |
| `updateOnboardingTrainingSummary` (4049) | R: onboardingDraft | DOM | `onboardingToggleDay`, `updateObSportSelector`, `toggleTrainingDay`, `renderOnboarding [texto]` |
| `updateOnboardingTrainingChoice` (4062) | R: onboardingDraft | — | `updateOnboardingStrengthChoice`, `trainingSafetyModeHtml [texto]`, `renderOnboarding [texto]` |
| `updateOnboardingStrengthChoice` (4066) | — | — | `renderOnboarding [texto]` |
| `updateObSportSelector` (4067) | — | — | sin llamada estática; revisar callback/handler |
| `toggleTrainingDay` (4070) | — | DOM | `trainingAvailabilityHtml [texto]` |
| `updateOnboardingMealCount` (4076) | R: onboardingDraft / W: onboardingDraft | DOM | `renderOnboarding [texto]` |
| `updateOnboardingActivity` (4095) | — | DOM | `renderOnboarding [texto]` |
| `firstWeekSetupStatusHtml` (4099) | — | HTML | `renderFirstWeekSetup` |
| `renderFirstWeekSetup` (4114) | — | DOM, HTML | `prepareFirstWeekNutrition`, `prepareFirstWeekTraining`, `prepareFirstCycleWeek` |
| `firstWeekLabel` (4132) | — | — | `prepareFirstWeekNutrition` |
| `firstWeekIssueModal` (4300) | — | HTML | `retryInitialWeekSetup`, `saveOnboarding` |
| `retryInitialWeekSetup` (4309) | R: current | — | `firstWeekIssueModal [texto]` |
| `maybePromptProfileReview` (4444) | R: profile | HTML | sin llamada estática; revisar callback/handler |
| `keepCurrentProfile` (4454) | R: profile | reloj | `maybePromptProfileReview [texto]` |
| `ring` (4473) | — | HTML | `heroDash` |
| `macroMeter` (4488) | — | HTML | `heroDash` |
| `showMacroInfo` (4502) | — | HTML | `macroMeter [texto]`, `miniMacroMeter [texto]`, `heroDash [texto]` |
| `screenHeader` (4508) | — | HTML | `renderProgress`, `renderProfile`, `renderReferrals`, `renderSettings`, `renderAdminUsers`, `renderAdminBeta`, `renderExerciseAdmin`, `renderFoods`, `renderAnalytics` |
| `renderAdminTabs` (4523) | R: view | DOM, HTML | `renderAdminConsole` |
| `renderAdminConsole` (4539) | R: view / W: view | DOM, HTML | `render` |
| `render` (4563) | R: profile, view | DOM | `refreshAfterStoreCheckout`, `_refreshAfterSyncResolution`, `moveDayItem`, `skipMeal`, `unskipMeal`, `acceptPhotoConsent`, `startNextChallenge`, `acknowledgeInjuryTraining`, `savePrivacyGate`, `startOnboarding`, `retryInitialWeekSetup`, `saveOnboarding`, `saveCardioLightEnabled`, `setView`, `dismissNutritionUpdate`, `retryNutritionPreferences`, `undoNutritionRejection`, `setAutomaticNutritionWeeks`, `maybePrepareNutritionWeek`, `applyDeterministicDay`, `renderAfterHomeNotice`, `toggleNutSetup`, `saveManualActivity`, `removeManualActivity`, `persistWorkoutExecution`, `beginWorkoutExecution`, `applyExerciseSubstitution`, `finishWorkoutExecution`, `markWorkoutCompleted`, `discardWorkoutExecution`, `workoutTimerTick`, `removeWeeklyRoutine`, `saveCoachRoutine`, `useSavedRoutine`, `dismissSavedRoutine`, `resetDayRoutine`, `saveRoutineDraft`, `saveWorkoutCopy`, `nav`, `toggleMeal`, `toggleExtra`, `showSelectedWorkout`, `delExtra`, `goDay`, `weekNav`, `clearCoachChat`, `applyLabsParam`, `setUiMode`, `unblockDishFromProfileUi`, `saveProfile`, `saveOptionalConsents`, `enableDevicePush`, `enableEmailReminders`, `installFromNudge`, `finishNotifySetup`, `checkCheckoutReturn`, `restorePurchase`, `redeemCoupon`, `loadReferralBenefit`, `redeemPendingInvite`, `retryConnect`, `connectFromAuth`, `finishPasswordRecovery`, `applyReplace`, `revertMeal`, `applyChangeMeal`, `blockCurrentMealDish`, `applyWorkoutContingency`, `setDayTrainingPlace`, `applyMissedSession`, `undoMealSubstitution`, `confirmCopyMeals`, `saveEditor`, `applyTrainingPlanDraft`, `applyGeneratedDay`, `applyWeekPlan`, `resetData`, `clearSignedOutState`, `onAuth`, `confirmRestartPlan`, `dismissRestartNudge`, `dismissReturnCard`, `syncDay`, `refreshAdminBetaPending`, `saveExercise`, `archiveExercise`, `setFoodTab`, `saveDiet`, `deleteDiet`, `saveDietDish`, `deleteDietDish`, `saveIngredient`, `deleteIngredient`, `saveDish`, `deleteDish`, `applyWeeklyCheckinProposal`, `declineWeeklyCheckinProposal`, `skipWeeklyCheckin`, `setupAuthListener`, `boot`, `resyncWorkoutView`, `personalizeHintHtml [texto]`, `renderAuth [texto]`, `renderPasswordRecovery [texto]`, `renderFoods [texto]` |
| `renderSplash` (4597) | — | DOM, HTML | `render`, `doAuth` |
| `renderInactive` (4598) | — | DOM, HTML | `render` |
| `brandMark` (4612) | — | HTML | `renderInactive`, `renderAuth`, `renderConfirmEmail`, `renderPasswordRecovery` |
| `brandWordmark` (4617) | — | HTML | `renderInactive`, `renderAuth`, `renderConfirmEmail`, `renderPasswordRecovery` |
| `tabIcon` (4641) | — | HTML | `screenHeader`, `renderAdminTabs`, `renderTabs`, `homeAgendaItemHtml` |
| `chevron` (4642) | — | HTML | `section`, `homeConsumptionHtml`, `homeRemainingAgendaHtml`, `homeNoticesHtml` |
| `miniIcon` (4644) | — | HTML | `passwordField`, `togglePasswordVisibility`, `homeWorkoutTechniqueHtml`, `renderNutrition`, `shoppingToolInner`, `openNutritionMoreMenu`, `renderConfirmEmail` |
| `passwordField` (4645) | — | HTML | `renderAuth`, `renderPasswordRecovery`, `openAdminTestUser`, `adminSetPassword` |
| `togglePasswordVisibility` (4655) | — | DOM | `passwordField [texto]` |
| `uiSave` (4672) | R: UI | storage | `dismissInstall`, `installApp`, `showCardioNudge`, `dismissCardioNudge`, `toggleSection`, `dismissHomeWorkoutTechnique`, `toggleNutSetup` |
| `isStandaloneMode` (4676) | — | — | `updateInstallPrompt`, `devicePushState`, `installPending`, `trackNotifyPrompt`, `notifyInstallCopy` |
| `isIOSDevice` (4677) | — | — | `updateInstallPrompt`, `devicePushState`, `notifyPlatform`, `notifyInstallCopy` |
| `isMobileDevice` (4678) | — | — | `updateInstallPrompt`, `installPending`, `notifyPlatform`, `renderNotifySetup` |
| `installDismissed` (4679) | R: UI | — | `updateInstallPrompt` |
| `removeInstallPrompt` (4680) | — | DOM | `dismissInstall`, `updateInstallPrompt`, `installApp` |
| `dismissInstall` (4681) | R: UI / W: UI | — | `installApp`, `updateInstallPrompt [texto]` |
| `updateInstallPrompt` (4682) | R: profile, view | DOM, HTML | `render` |
| `installApp` (4707) | R: UI / W: UI | — | `installFromNudge`, `updateInstallPrompt [texto]` |
| `showCardioNudge` (4715) | R: UI / W: UI | HTML | `onboardingNext`, `renderProfile` |
| `dismissCardioNudge` (4728) | R: UI, onboardingDraft / W: UI, onboardingDraft | DOM | `showCardioNudge [texto]` |
| `saveCardioLightEnabled` (4738) | R: profile | — | `dismissCardioNudge` |
| `isCollapsed` (4744) | R: UI | — | `section`, `toggleNutSetup` |
| `toggleSection` (4745) | R: UI / W: UI | — | `section [texto]` |
| `section` (4753) | — | HTML | `renderNutrition`, `manualActivityBlock`, `renderWorkout`, `daySummary`, `renderProgress`, `foodsDishes`, `foodsIngredients` |
| `renderTabs` (4762) | R: view | DOM, HTML | `render` |
| `setView` (4775) | R: DB, current, supa / W: current, view | reloj | `coachUnavailable`, `homeOpenWorkout`, `focusCoachQuestion`, `coachWelcomeAsk`, `coachWelcomeNavigate`, `submitRoutineConversation`, `openTrainingSettings`, `toggleWorkout`, `openAdminBetaFromLink`, `renderAnalytics`, `startFitbrosTour`, `renderAdminTabs [texto]`, `renderTabs [texto]`, `nextDailyAction [texto]`, `homeAgendaData [texto]`, `homeConsumptionHtml [texto]`, `homeAgendaHtml [texto]`, `mealCard [texto]`, `referralNoticeHtml [texto]`, `renderReferrals [texto]`, `renderAdminUsers [texto]`, `renderAdminBeta [texto]`, `renderExerciseAdmin [texto]`, `renderFoods [texto]` |
| `dayHeaderNav` (4788) | R: END, START | HTML, reloj | `renderNutrition`, `renderWorkout` |
| `dayAlert` (4802) | — | — | `dayHeaderNav` |
| `miniMacroMeter` (4806) | — | HTML | `miniMacroDash` |
| `miniMacroDash` (4813) | — | HTML, reloj | `heroDash` |
| `heroDash` (4835) | — | HTML, reloj | `renderNutrition` |
| `homeCacheNoticeHtml` (4972) | R: DB, supa | HTML | `homeAgendaHtml` |
| `homeTrackAction` (4984) | — | — | `homeRegisterMeal`, `homeLogFood`, `homeOpenWorkout`, `homeAdaptWorkout`, `homePrepareDay`, `applyDeterministicDay`, `homeOpenTomorrow`, `dismissReturnCard`, `returnRescueYesterday` |
| `homeRegisterMeal` (4988) | — | — | `homeAgendaData [texto]` |
| `homeLogFood` (4996) | — | — | `homeAgendaHtml [texto]` |
| `openFoodRegistration` (5000) |  / W: current | — | `homeLogFood`, `mealCard [texto]` |
| `menuSuggestionKey` (5007) | — | — | `menuSuggestionDismissed`, `dismissMenuSuggestion` |
| `menuSuggestionDismissed` (5008) | — | storage | `homeMenuSuggestionHtml` |
| `dismissMenuSuggestion` (5013) | — | DOM, storage | `homeMenuSuggestionHtml [texto]` |
| `homeMenuSuggestionHtml` (5020) | — | HTML, reloj | `renderHoy` |
| `finishNutritionUpdate` (5031) | — | DOM | `retryNutritionPreferences`, `undoNutritionRejection`, `setAutomaticNutritionWeeks`, `maybePrepareNutritionWeek`, `saveProfile`, `blockCurrentMealDish`, `blockGenDraftMeal` |
| `dismissNutritionUpdate` (5035) | — | DOM | `nutritionUpdateHtml [texto]` |
| `nutritionUpdateHtml` (5110) | — | HTML | `renderHoy`, `renderNutrition`, `renderProfile`, `genReviewHtml` |
| `undoNutritionRejection` (5130) | R: DB, profile | DOM, reloj | `nutritionUpdateHtml [texto]` |
| `nutritionWeekHtml` (5173) | R: profile | HTML | `renderNutrition` |
| `setAutomaticNutritionWeeks` (5184) | R: profile | DOM | `nutritionWeekHtml [texto]` |
| `homeOpenWorkout` (5243) |  / W: current | — | `showSelectedWorkout`, `homeAgendaData [texto]`, `homeAgendaHtml [texto]` |
| `homeAdaptWorkout` (5248) | — | — | `homeAgendaData [texto]` |
| `homeActionHtml` (5367) | — | HTML | `homeAgendaItemHtml`, `homeAgendaHtml` |
| `homeAgendaItemHtml` (5373) | — | HTML | sin llamada estática; revisar callback/handler |
| `homeOpenTomorrow` (5400) | — | — | `homeAgendaHtml [texto]` |
| `homeConsumptionHtml` (5404) | — | HTML | `renderHoy` |
| `homeRemainingAgendaHtml` (5410) | — | DOM, HTML | `homeAgendaHtml` |
| `homeNoticesHtml` (5421) | — | DOM, HTML | `renderHoy` |
| `homeNoticesToggled` (5432) | — | — | `homeNoticesHtml [texto]` |
| `renderAfterHomeNotice` (5439) | R: view | DOM | `dismissPlanWeekNotice`, `enableDevicePush`, `enableEmailReminders`, `installFromNudge`, `snoozeNotifyNudge` |
| `homeWorkoutTechniqueHtml` (5445) | R: UI | HTML, reloj | `renderHoy` |
| `dismissHomeWorkoutTechnique` (5469) | R: UI / W: UI | DOM | `homeWorkoutTechniqueHtml [texto]` |
| `homeAgendaHtml` (5477) | — | HTML, reloj | `renderHoy` |
| `coachWelcomeKey` (5538) | — | — | `coachWelcomeState`, `saveCoachWelcomeState` |
| `coachWelcomeState` (5539) | — | storage | `coachWelcomeHtml`, `dismissCoachWelcome`, `maybeStartFitbrosTour` |
| `saveCoachWelcomeState` (5544) | — | storage | `coachWelcomeHtml`, `dismissCoachWelcome` |
| `coachWelcomeHtml` (5555) | — | HTML, reloj | `renderHoy` |
| `dismissCoachWelcome` (5583) | — | reloj | `coachWelcomeHtml [texto]` |
| `focusCoachQuestion` (5587) | — | DOM | `coachWelcomeHtml [texto]` |
| `coachWelcomeAsk` (5612) | — | DOM, reloj, timer | `sendCoachMessage`, `coachWelcomeHtml [texto]` |
| `coachWelcomeNavigate` (5621) | R: current / W: current | reloj | `renderCoachMessage [texto]` |
| `renderHoy` (5665) | R: END, START, current / W: current | DOM, HTML, reloj | `render`, `dismissMenuSuggestion`, `dismissHomeWorkoutTechnique`, `dismissCoachWelcome`, `renderCoach` |
| `renderCoach` (5729) | — | — | `sendCoachMessage`, `applyCoachAction`, `dismissCoachAction` |
| `renderNutrition` (5732) | R: current | DOM, HTML | `render` |
| `toggleNutSetup` (5766) | R: UI / W: UI | DOM | sin llamada estática; revisar callback/handler |
| `shoppingToolInner` (5785) | — | HTML | `renderNutrition`, `refreshShoppingTool` |
| `refreshShoppingTool` (5788) | — | DOM | `toggleShoppingHave` |
| `openShoppingList` (5837) | — | DOM, HTML | `toggleShoppingHave`, `renderNutrition [texto]`, `shoppingSheetHtml [texto]` |
| `shoppingSheetHtml` (5845) | — | HTML | `openShoppingList` |
| `toggleShoppingHave` (5863) | R: profile / W: profile | DOM | `shoppingSheetHtml [texto]` |
| `shareShoppingList` (5876) | — | — | `shoppingSheetHtml [texto]` |
| `openNutritionMoreMenu` (5886) | — | HTML | `renderNutrition [texto]` |
| `exerciseMediaHtml` (5957) | — | HTML | `openExerciseGuide`, `exerciseCard`, `previewExerciseMedia` |
| `openExerciseGuide` (5977) | — | HTML | `homeWorkoutTechniqueHtml [texto]`, `exerciseCard [texto]`, `renderCurrentWorkoutStep [texto]` |
| `toggleExerciseMotion` (5997) | — | — | `exerciseCard [texto]` |
| `exerciseCard` (6005) | R: DB | HTML | `workoutExercisesHtml`, `renderExerciseAdmin` |
| `workoutExercisesHtml` (6037) | — | HTML | `renderWorkout` |
| `manualActivityBlock` (6183) | R: S | HTML | `renderWorkout` |
| `openManualActivity` (6194) | R: S, profile | HTML | `acknowledgeInjuryTraining`, `nextDailyAction [texto]`, `homeAgendaData [texto]`, `manualActivityBlock [texto]`, `renderWorkout [texto]` |
| `readManualActivityForm` (6225) | — | DOM | `updateManualActivityEstimate`, `saveManualActivity` |
| `updateManualActivityEstimate` (6228) | — | DOM, HTML | `openManualActivity` |
| `workoutStatusHtml` (6254) | R: S | HTML | `renderWorkoutExecution`, `renderWorkout` |
| `lastPerformanceHtml` (6317) | — | HTML | `renderCurrentWorkoutStep` |
| `renderReviewedWorkoutStep` (6422) | — | HTML | `renderActiveWorkoutStep` |
| `workoutBackButton` (6447) | — | HTML | `renderActiveWorkoutStep`, `renderWorkoutExecution` |
| `openWorkoutCountdown` (6499) | — | DOM, HTML, timer | `startWorkoutExecution` |
| `workoutCountdownTick` (6520) | — | DOM, timer | `openWorkoutCountdown` |
| `closeWorkoutCountdown` (6530) | — | DOM, timer | `openWorkoutCountdown`, `workoutCountdownKey`, `finishWorkoutCountdown` |
| `toggleWorkoutTimer` (6582) | — | reloj | `renderWorkoutTimer [texto]` |
| `openPendingSetsPrompt` (6663) | — | HTML | `completeWorkoutStep` |
| `openWorkoutStepPicker` (6695) | — | HTML | `renderCurrentWorkoutStep [texto]` |
| `openAddWorkoutExercise` (6723) | — | HTML | `renderWorkoutExecution [texto]` |
| `toggleWorkoutSet` (6753) | — | — | `renderStrengthSet [texto]` |
| `explainLoadVariation` (6793) | — | HTML | `setWorkoutVariation` |
| `openExerciseSubstitution` (6826) | — | HTML | `renderCurrentWorkoutStep [texto]` |
| `exerciseSearchBox` (6852) | — | HTML | `openAddWorkoutExercise`, `openExerciseSubstitution` |
| `exerciseSearchResultsHtml` (6856) | — | HTML | `exerciseSearchBox`, `renderExerciseSearchResults` |
| `renderExerciseSearchResults` (6874) | — | DOM | `exerciseSearchBox [texto]` |
| `openFinishWorkout` (6895) | — | DOM, HTML, reloj | `fillPendingWorkoutSets`, `renderWorkoutExecution [texto]` |
| `fillPendingWorkoutSets` (6928) | — | DOM | `openFinishWorkout [texto]` |
| `finishWorkoutExecution` (6937) | — | DOM, reloj | `openFinishWorkout [texto]` |
| `workoutRerenderSafe` (6987) | — | DOM | `workoutTimerTick`, `resyncWorkoutView` |
| `workoutTimerTick` (6991) | R: current, view | DOM, reloj, timer | `resyncWorkoutView` |
| `renderMovementStep` (7015) | — | HTML | `renderCurrentWorkoutStep` |
| `renderOptionalStepOffer` (7054) | — | HTML | `renderCurrentWorkoutStep` |
| `renderWorkoutTimer` (7093) | — | HTML, reloj | `renderMovementStep`, `renderCurrentWorkoutStep` |
| `renderStrengthSet` (7107) | — | HTML | `renderCurrentWorkoutStep` |
| `explainWorkoutEffort` (7138) | — | HTML | `renderCurrentWorkoutStep [texto]`, `workoutPlanSummaryHtml [texto]` |
| `explainWorkoutTempo` (7151) | — | HTML | `renderCurrentWorkoutStep [texto]` |
| `workoutVariationButtons` (7168) | — | HTML | `renderCurrentWorkoutStep` |
| `renderActiveWorkoutStep` (7177) | — | — | `renderWorkoutExecution` |
| `renderCurrentWorkoutStep` (7182) | — | HTML | `renderActiveWorkoutStep` |
| `renderWorkoutExecution` (7234) | — | HTML, reloj | `renderWorkout`, `chatWorkoutCard` |
| `trainingStyleField` (7293) | — | HTML | `strengthResourceHtml`, `openRoutineConversation` |
| `routineEntryHtml` (7341) | R: END, profile | HTML, reloj | `renderHoy`, `renderWorkout` |
| `weeklyRoutineNoticeHtml` (7358) | — | HTML | `renderWorkout` |
| `openRoutineConversation` (7364) | R: END, profile | HTML, reloj | `routineEntryHtml [texto]`, `weeklyRoutineNoticeHtml [texto]` |
| `submitRoutineConversation` (7381) | — | DOM | `openRoutineConversation [texto]` |
| `reviewCoachRoutine` (7411) | R: END | HTML | `applyCoachAction` |
| `saveCoachRoutine` (7424) | R: END, S, profile | DOM | `reviewCoachRoutine [texto]` |
| `routineSuggestionHtml` (7477) | — | HTML | `renderWorkout` |
| `dismissSavedRoutine` (7496) | — | — | `routineSuggestionHtml [texto]` |
| `openRoutineEditor` (7507) | — | — | `renderWorkout [texto]` |
| `renderRoutineEditor` (7514) | — | HTML | `openRoutineEditor`, `routinePick`, `routineStartReplace`, `routineCancelReplace`, `routineRemove`, `routineClear` |
| `routineSearchResultsHtml` (7537) | — | HTML | `renderRoutineEditor`, `renderRoutineSearch` |
| `renderRoutineSearch` (7552) | — | DOM | `renderRoutineEditor [texto]` |
| `routinePick` (7556) | — | DOM | `routineSearchResultsHtml [texto]` |
| `repeatWorkoutLineHtml` (7693) | — | HTML | `renderWorkout` |
| `workoutSaveCopyHtml` (7698) | — | HTML | `renderWorkoutExecution` |
| `openSaveWorkoutCopy` (7704) | — | HTML | `workoutSaveCopyHtml [texto]`, `workoutCopyPickerHtml [texto]` |
| `saveWorkoutCopy` (7716) | R: profile / W: profile | DOM, reloj | `openSaveWorkoutCopy [texto]` |
| `workoutCopyPickerHtml` (7740) | — | HTML | `openWorkoutPicker` |
| `workoutPlanSummaryHtml` (7762) | — | HTML | `renderWorkout`, `chatWorkoutCard` |
| `planWeeksCalendarHtml` (7810) | — | HTML, reloj | `openTrainingPlanSheet` |
| `dismissPlanWeekNotice` (7825) | — | storage | `planWeekNoticeHtml [texto]` |
| `planWeekNoticeHtml` (7832) | — | HTML, reloj, storage | `homeNoticesHtml`, `renderWorkout` |
| `personalizeHintHtml` (7854) | — | HTML, storage | `renderWorkout` |
| `dismissPersonalizeHint` (7863) | — | storage | `personalizeHintHtml [texto]`, `openTrainingPlanSheet [texto]` |
| `openTrainingPlanSheet` (7866) | R: current | HTML | `planWeekNoticeHtml [texto]`, `renderWorkout [texto]` |
| `openTrainingSettings` (7885) | — | DOM | `openTrainingPlanSheet [texto]` |
| `renderWorkout` (7893) | R: current | DOM, HTML | `render` |
| `mealCard` (8023) | — | HTML | `renderNutrition`, `chatMealsCard` |
| `toggleRecipe` (8083) | — | — | sin llamada estática; revisar callback/handler |
| `mealNumsHtml` (8090) | — | HTML | `mealCard`, `extraCard` |
| `partialMacrosNote` (8096) | — | HTML | `miniMacroDash`, `heroDash` |
| `extraCard` (8099) | — | HTML | `renderNutrition` |
| `daySummary` (8120) | — | HTML | `renderWorkout` |
| `nav` (8138) | R: current / W: current | — | `dayHeaderNav [texto]` |
| `toggleMeal` (8139) | — | — | `homeRegisterMeal`, `nextDailyAction [texto]`, `mealCard [texto]` |
| `toggleExtra` (8147) | — | — | `extraCard [texto]` |
| `toggleWorkout` (8148) | — | — | sin llamada estática; revisar callback/handler |
| `openWorkoutPicker` (8152) | R: view | HTML | `acknowledgeInjuryTraining`, `saveWorkoutCopy`, `removeSavedWorkout`, `homeAgendaHtml [texto]`, `openSaveWorkoutCopy [texto]`, `renderWorkout [texto]` |
| `showSelectedWorkout` (8177) | R: view | DOM | `applyWorkoutCopy`, `setWorkout` |
| `startWeightNoteCard` (8202) | R: START | HTML | `renderProgress` |
| `weightSetupCard` (8213) | — | HTML | `renderProgress` |
| `renderProgress` (8224) | — | DOM, HTML | `_refreshAfterSyncResolution`, `render`, `setWeightEntry`, `syncWeights` |
| `renderStreakSection` (8295) | — | HTML | `renderProgress` |
| `weightTableHtml` (8354) | — | — | `renderProgress` |
| `weekSection` (8404) | R: current | HTML, reloj | `renderProgress` |
| `goDay` (8425) | R: current / W: current, view | — | `homeOpenTomorrow`, `openReminderLink`, `returnRescueYesterday`, `weekSection [texto]` |
| `weekNav` (8426) | R: current / W: current | — | `weekSection [texto]` |
| `coachTypingHtml` (8927) | — | HTML | `renderHoy`, `renderChatMode` |
| `scrollCoachToBottom` (9051) | — | DOM, timer | `coachWelcomeAsk`, `sendCoachMessage`, `setUiMode`, `chatAsk`, `chatSaveWeight` |
| `chatWorkoutCard` (9116) | — | HTML | `chatCardHtml` |
| `chatMealsCard` (9127) | — | HTML | `chatCardHtml` |
| `chatWeightCard` (9132) | — | HTML | `chatCardHtml` |
| `chatSaveWeight` (9138) | R: S / W: S | DOM, reloj | `chatWeightCard [texto]` |
| `chatCardHtml` (9147) | — | HTML | `renderChatMode` |
| `renderChatMode` (9152) |  / W: current | DOM, HTML, reloj | `render`, `renderCoach`, `chatAsk`, `chatSaveWeight` |
| `renderCoachMessage` (9180) | — | HTML | `renderChatMode` |
| `dismissCoachAction` (9220) | — | — | `renderCoachMessage [texto]` |
| `coachSendFromInput` (9226) | — | DOM | `renderHoy [texto]`, `renderChatMode [texto]` |
| `profileMarkDirty` (9238) | R: view | DOM | `renderProfile [texto]` |
| `profileClearDirty` (9243) | — | DOM | `saveProfile` |
| `pfPrivacyMarkDirty` (9251) | — | DOM | `renderProfile [texto]` |
| `pfPrivacyClearDirty` (9256) | — | DOM | `saveOptionalConsents` |
| `pfNotifMarkDirty` (9261) | — | DOM | `renderProfile [texto]` |
| `pfNotifClearDirty` (9266) | — | DOM | `saveNotifPrefs` |
| `pfSectionGroup` (9271) | — | — | `profileAccordionGuard` |
| `pfGroupDirty` (9277) | — | DOM | `profileAccordionGuard`, `appBusyForUpdate` |
| `profileAccordionGuard` (9286) | — | DOM | `renderProfile [texto]` |
| `profileAccordionToggle` (9303) | — | DOM, timer | `renderProfile [texto]` |
| `blockedDishesHtml` (9315) | — | HTML | `renderProfile` |
| `unblockDishFromProfileUi` (9320) | — | — | `blockedDishesHtml [texto]` |
| `renderProfile` (9325) | R: profile, supa | DOM, HTML | `render` |
| `updateTrainingSummary` (9578) | R: profile | DOM | `toggleTrainingDay`, `updatePfStrengthChoice`, `updatePfSportSelector`, `trainingSafetyModeHtml [texto]`, `trainingStyleField [texto]`, `renderProfile [texto]` |
| `updateTrainingLocationDefaults` (9591) | — | DOM | `toggleTrainingDay`, `updatePfStrengthChoice`, `updatePfSportSelector` |
| `updatePfStrengthChoice` (9605) | R: profile | DOM | `renderProfile [texto]` |
| `updatePfSportSelector` (9618) | — | — | `renderProfile [texto]` |
| `updatePfSplitVisibility` (9623) | — | DOM | `renderProfile [texto]` |
| `twoMealNoticeHtml` (9630) | — | HTML | `renderOnboarding`, `renderProfile`, `updateProfileMealCount` |
| `cookingLevelFieldHtml` (9635) | — | HTML | `renderOnboarding`, `renderProfile` |
| `updateProfileMealCount` (9646) | — | DOM | `renderProfile [texto]` |
| `saveProfile` (9655) | R: START, current, profile / W: current | DOM, reloj | `renderProfile [texto]` |
| `saveOptionalConsents` (9732) | R: supa | DOM, red, reloj | `renderProfile [texto]` |
| `exportPersonalData` (9770) | — | DOM, red, reloj, timer | `renderProfile [texto]` |
| `populateNotifPrefsForm` (9803) | — | DOM | `renderProfile` |
| `toggleNotifOptions` (9825) | — | DOM | `renderProfile [texto]` |
| `toggleNotifMorning` (9831) | — | DOM | `populateNotifPrefsForm`, `renderProfile [texto]` |
| `saveNotifPrefs` (9837) | R: profile, supa | DOM, red, reloj | `renderProfile [texto]` |
| `urlBase64ToUint8Array` (9882) | — | — | `subscribePush` |
| `renderPushSection` (9889) | — | DOM, HTML | `renderProfile`, `requestPushPermission` |
| `requestPushPermission` (9911) | — | — | `renderPushSection [texto]` |
| `subscribePush` (9934) | — | red | `requestPushPermission`, `refreshPushSubscriptionKey`, `enableDevicePush` |
| `pushKeyOf` (9957) | — | — | `refreshPushSubscriptionKey` |
| `refreshPushSubscriptionKey` (9962) | R: supa | — | `onAuth` |
| `savePushOptIn` (9976) | — | red | `renderPushSection [texto]` |
| `notifyIcon` (10022) | — | HTML | `homeNoticesHtml`, `notifyInstallCopy`, `notifyStepHtml` |
| `pushSupported` (10023) | — | — | `devicePushState` |
| `devicePushState` (10026) | — | — | `remindersCovered`, `trackNotifyPrompt`, `notifyPushCopy`, `renderNotifySetup`, `showQueuedNotifyAsk`, `notifyNudgeHtml` |
| `installPending` (10033) | — | — | `notifySetupWanted`, `renderNotifySetup` |
| `remindersCovered` (10036) | — | — | `notifySetupWanted`, `renderNotifySetup`, `notifyAskWanted`, `notifyNudgeDue` |
| `notifyHourLabel` (10042) | — | — | `notifyPushCopy`, `showQueuedNotifyAsk`, `notifyNudgeHtml` |
| `notifyPlatform` (10049) | — | — | `trackNotifyPrompt` |
| `trackNotifyPrompt` (10050) | — | — | `homeNoticesToggled`, `requestPushPermission`, `enableDevicePush`, `enableEmailReminders`, `installFromNudge`, `snoozeNotifyNudge`, `renderNotifySetup`, `finishNotifySetup`, `showQueuedNotifyAsk` |
| `notifySnoozed` (10059) | — | reloj, storage | `notifyNudgeDue` |
| `enableDevicePush` (10060) | — | DOM, timer | `notifyPushCopy [texto]`, `showQueuedNotifyAsk [texto]` |
| `enableEmailReminders` (10082) | R: profile, supa | red, reloj | `notifyPushCopy [texto]`, `showQueuedNotifyAsk [texto]`, `notifyNudgeHtml [texto]` |
| `installFromNudge` (10094) | — | — | `notifyInstallCopy [texto]` |
| `snoozeNotifyNudge` (10099) | — | reloj, storage | `notifyNudgeHtml [texto]` |
| `notifyInstallCopy` (10105) | — | HTML | `renderNotifySetup`, `notifyNudgeHtml` |
| `notifyPushCopy` (10114) | — | HTML | `renderNotifySetup`, `notifyNudgeHtml` |
| `notifyStepHtml` (10123) | — | HTML | `renderNotifySetup` |
| `notifySetupWanted` (10126) | — | — | `saveOnboarding` |
| `renderNotifySetup` (10127) | — | DOM, HTML, reloj | `render` |
| `finishNotifySetup` (10138) | — | — | `renderNotifySetup [texto]` |
| `notifyAskCount` (10152) | — | storage | `notifyAskWanted`, `showQueuedNotifyAsk` |
| `notifyAskWanted` (10153) | R: profile | — | `queueNotifyAsk`, `showQueuedNotifyAsk` |
| `queueNotifyAsk` (10158) | — | — | `renderStreakPop` |
| `showQueuedNotifyAsk` (10159) | — | DOM, HTML, storage | `loadNotifPrefs`, `hideStreakPop` |
| `notifyNudgeDue` (10177) | R: profile | — | `updateInstallPrompt`, `notifyNudgeHtml` |
| `notifyNudgeHtml` (10181) | — | HTML | `homeNoticesHtml` |
| `openDeleteAccount` (10198) | — | HTML | `renderProfile [texto]` |
| `deleteMyAccount` (10206) | — | DOM, red | `openDeleteAccount [texto]` |
| `accessNoticeText` (10229) | — | — | `coachErrorMessage`, `showAccessNotice` |
| `showAccessNotice` (10234) | — | HTML | `showPaywall` |
| `showPaywall` (10241) | — | HTML | `coachUnavailable`, `sendCoachMessage`, `showPaywall`, `openTrainingPlanGenerator`, `regenerateTrainingDraftWeek`, `regenerateTrainingDraftSession`, `subscriptionStatusHtml [texto]`, `trainingDraftReviewHtml [texto]` |
| `paywallMessage` (10277) | — | — | `showPaywall`, `showStorePaywall` |
| `showStorePaywall` (10288) | — | HTML | `showPaywall` |
| `activatePlanFromPaywall` (10311) | — | red | `showPaywall [texto]` |
| `checkCheckoutReturn` (10334) | — | DOM, HTML | `onAuth` |
| `restorePurchase` (10349) | — | — | `subscriptionStatusHtml [texto]` |
| `couponRedeemSectionHtml` (10360) | — | HTML | `showPaywall`, `showStorePaywall`, `subscriptionStatusHtml` |
| `couponDurationText` (10367) | — | — | `redeemCoupon`, `redeemPendingInvite`, `inviteSignUp` |
| `redeemCoupon` (10377) | — | DOM, red | `couponRedeemSectionHtml [texto]` |
| `referralNoticeHtml` (10432) | — | HTML | `renderHoy`, `renderProfile` |
| `renderReferrals` (10440) | — | DOM, HTML | `render` |
| `refreshReferrals` (10446) | — | DOM, HTML, red | `renderReferrals` |
| `copyReferralLink` (10475) | — | DOM | `refreshReferrals [texto]` |
| `captureInviteCode` (10486) | — | storage | `boot` |
| `pendingInviteCode` (10500) | — | storage | `noPricesMode`, `accessNoticeText`, `showAccessNotice`, `redeemPendingInvite`, `subscriptionStatusHtml`, `renderAuth` |
| `clearInviteCode` (10501) | — | storage | `redeemPendingInvite`, `inviteSignUp` |
| `redeemPendingInvite` (10505) | — | red | `onAuth`, `showAccessNotice [texto]`, `subscriptionStatusHtml [texto]` |
| `planDisplayName` (10526) | — | — | `billingHistoryHtml`, `subscriptionStatusHtml` |
| `billingEventLabel` (10534) | — | — | `billingHistoryHtml` |
| `billingStatusLabel` (10543) | — | — | `billingHistoryHtml` |
| `billingAmountText` (10548) | — | — | `billingHistoryHtml` |
| `billingHistoryHtml` (10558) | — | HTML | `billingHistorySectionHtml`, `renderBillingHistoryBox` |
| `billingHistorySectionHtml` (10584) | — | HTML | `subscriptionStatusHtml` |
| `renderBillingHistoryBox` (10593) | — | DOM | `loadBillingHistory`, `ensureBillingHistory` |
| `ensureBillingHistory` (10597) | — | — | `renderProfile` |
| `refreshBillingHistory` (10601) | — | — | `billingHistoryHtml [texto]`, `billingHistorySectionHtml [texto]` |
| `subscriptionStatusHtml` (10607) | — | HTML, reloj | `renderProfile` |
| `waSvg` (10684) | — | HTML | `waFabHtml`, `waSupportButtonHtml` |
| `waFabHtml` (10685) | — | — | sin llamada estática; revisar callback/handler |
| `waSupportButtonHtml` (10686) | — | — | `renderOnboarding`, `renderProfile` |
| `renderAuth` (10689) | R: supa | DOM, HTML | `render`, `confirmEmailGoToLogin`, `toggleAuthMode`, `doAuth`, `inviteSignUp`, `renderConfirmEmail [texto]` |
| `renderConfirmEmail` (10750) | — | DOM, HTML | `renderAuth` |
| `confirmEmailGoToLogin` (10772) | — | DOM | `renderConfirmEmail [texto]` |
| `resendConfirmEmail` (10778) | R: supa | DOM, red, reloj | `renderConfirmEmail [texto]` |
| `toggleAuthMode` (10793) | — | — | `renderAuth [texto]` |
| `authRedirectUrl` (10794) | — | — | `resendConfirmEmail`, `requestOwnPasswordReset`, `signUp`, `adminBetaAccept`, `sendAdminInvite`, `adminResetLink` |
| `authRedirectParams` (10800) | — | — | `passwordRedirectMode`, `passwordRecoveryRedirectError` |
| `isPasswordRecoveryRedirect` (10809) | — | — | sin llamada estática; revisar callback/handler |
| `passwordRedirectMode` (10812) | — | — | `isPasswordRecoveryRedirect`, `setupAuthListener`, `legacyHostMigration`, `boot` |
| `passwordRecoveryRedirectError` (10817) | — | — | `boot` |
| `retryConnect` (10821) | — | — | `renderAuth [texto]` |
| `connectFromAuth` (10824) | R: S, supa / W: S | DOM | `renderAuth [texto]` |
| `setAuthSubmitting` (10833) | — | DOM | `doAuth` |
| `doAuth` (10842) | R: supa | DOM, red | `renderAuth [texto]` |
| `inviteSignUp` (10870) | R: supa | DOM, red | `doAuth` |
| `requestOwnPasswordReset` (10885) | R: supa | DOM, red | `renderAuth [texto]` |
| `renderPasswordRecovery` (10894) | — | DOM, HTML | `render` |
| `finishPasswordRecovery` (10921) | R: supa | DOM, red | `renderPasswordRecovery [texto]` |
| `_modalKeyHandler` (10977) | — | DOM | sin llamada estática; revisar callback/handler |
| `modal` (10991) | — | DOM, HTML, timer | `openSyncConflicts`, `openPhotoConsent`, `openInjuryTrainingNotice`, `openPrivacyNotice`, `openTermsNotice`, `openMacroFormulaInfo`, `explainTrainingIntensity`, `firstWeekIssueModal`, `maybePromptProfileReview`, `showMacroInfo`, `showCardioNudge`, `openShoppingList`, `openNutritionMoreMenu`, `openExerciseGuide`, `openManualActivity`, `openPendingSetsPrompt`, `openWorkoutStepPicker`, `openAddWorkoutExercise`, `explainLoadVariation`, `openExerciseSubstitution`, `openFinishWorkout`, `explainWorkoutEffort`, `explainWorkoutTempo`, `openRoutineConversation`, `reviewCoachRoutine`, `renderRoutineEditor`, `openSaveWorkoutCopy`, `openTrainingPlanSheet`, `openWorkoutPicker`, `showQueuedNotifyAsk`, `openDeleteAccount`, `showAccessNotice`, `showPaywall`, `showStorePaywall`, `checkCheckoutReturn`, `openReplace`, `openMealContingency`, `openChangeMeal`, `openMealMore`, `openWorkoutContingency`, `openDayTrainingPlace`, `openSportDayPlace`, `openMissedSession`, `openRecipes`, `openRecipeForm`, `openCopyMeals`, `editorSheet`, `openTrainingPlanGenerator`, `aiGenerateDay`, `aiGenerateWeek`, `aiReview`, `openRestartPlan`, `openAdminCourtesy`, `openAdminResetPlan`, `openAdminResetUser`, `openAdminUserQuota`, `openAdminCreateUser`, `adminBetaAccept`, `openAdminInviteUser`, `openAdminTestUser`, `adminSetPassword`, `editExercise`, `editDiet`, `editDietDish`, `editIngredient`, `dishModal`, `openWeeklyCheckin` |
| `closeModal` (11005) | — | DOM | `refreshAfterStoreCheckout`, `resolveSyncConflict`, `skipMeal`, `acceptPhotoConsent`, `acknowledgeInjuryTraining`, `startOnboarding`, `retryInitialWeekSetup`, `keepCurrentProfile`, `dismissCardioNudge`, `deterministicFromModal`, `saveManualActivity`, `addWorkoutExercise`, `applyExerciseSubstitution`, `finishWorkoutExecution`, `submitRoutineConversation`, `saveCoachRoutine`, `saveRoutineDraft`, `saveWorkoutCopy`, `showSelectedWorkout`, `deleteMyAccount`, `_modalKeyHandler`, `modal`, `applyReplace`, `applyChangeMeal`, `blockCurrentMealDish`, `applyWorkoutContingency`, `setDayTrainingPlace`, `applyMissedSession`, `undoMealSubstitution`, `confirmCopyMeals`, `saveEditor`, `applyTrainingPlanDraft`, `aiGenerateDay`, `deterministicWeekFromModal`, `applyGeneratedDay`, `applyWeekPlan`, `clearSignedOutState`, `confirmRestartPlan`, `grantCourtesy`, `adminApplyResetPlan`, `adminConfirmResetUser`, `sendAdminInvite`, `prepareAdminTestUser`, `saveAdminPassword`, `saveExercise`, `archiveExercise`, `saveDiet`, `deleteDiet`, `saveDietDish`, `deleteDietDish`, `saveIngredient`, `deleteIngredient`, `saveDish`, `deleteDish`, `applyWeeklyCheckinProposal`, `declineWeeklyCheckinProposal`, `skipWeeklyCheckin`, `openSyncConflicts [texto]`, `openInjuryTrainingNotice [texto]`, `openPrivacyNotice [texto]`, `openTermsNotice [texto]`, `openMacroFormulaInfo [texto]`, `explainTrainingIntensity [texto]`, `firstWeekIssueModal [texto]`, `openNutritionMoreMenu [texto]`, `openPendingSetsPrompt [texto]`, `openWorkoutStepPicker [texto]`, `explainLoadVariation [texto]`, `explainWorkoutEffort [texto]`, `explainWorkoutTempo [texto]`, `openRoutineConversation [texto]`, `reviewCoachRoutine [texto]`, `openTrainingPlanSheet [texto]`, `showQueuedNotifyAsk [texto]`, `showAccessNotice [texto]`, `checkCheckoutReturn [texto]`, `openMealContingency [texto]`, `openMealMore [texto]`, `openDayTrainingPlace [texto]`, `openSportDayPlace [texto]`, `openMissedSession [texto]`, `trainingDraftReviewHtml [texto]`, `genReviewHtml [texto]`, `genWeekReviewHtml [texto]`, `openRestartPlan [texto]`, `openAdminCourtesy [texto]`, `openAdminResetPlan [texto]`, `openAdminResetUser [texto]`, `adminBetaAccept [texto]`, `submitWeeklyCheckin [texto]` |
| `openReplace` (11014) | R: DB | HTML | `openMealContingency [texto]` |
| `applyReplace` (11039) | — | DOM | `openReplace [texto]` |
| `openMealContingency` (11086) | — | HTML | sin llamada estática; revisar callback/handler |
| `changeMealRerollControlsHtml` (11126) | — | HTML | `openChangeMeal` |
| `updateChangeMealRerollControls` (11133) | — | DOM | `rerollChangeMealOptions` |
| `openChangeMeal` (11205) | — | HTML | `mealCard [texto]` |
| `_buildChangeMealOpts` (11230) | — | HTML | `openChangeMeal`, `rerollChangeMealOptions`, `toggleMotivoChip` |
| `rerollChangeMealOptions` (11255) | — | DOM, HTML | `changeMealRerollControlsHtml [texto]` |
| `toggleMotivoChip` (11325) | — | DOM, HTML | `openChangeMeal [texto]` |
| `applyChangeMeal` (11352) | R: DB, profile | DOM | `_buildChangeMealOpts [texto]` |
| `openMealMore` (11436) | — | HTML | `mealCardTap`, `mealCard [texto]` |
| `openWorkoutContingency` (11482) | — | HTML | `homeAdaptWorkout`, `coachWelcomeNavigate`, `applyCoachAction`, `nextDailyAction [texto]`, `renderWorkout [texto]` |
| `openDayTrainingPlace` (11523) | — | HTML | `openWorkoutContingency`, `renderWorkout [texto]` |
| `openSportDayPlace` (11555) | — | HTML | `openDayTrainingPlace` |
| `openMissedSession` (11591) | — | HTML | `applyCoachAction`, `renderWorkout [texto]` |
| `openEditor` (11610) | R: current | — | `openFoodRegistration`, `renderNutrition [texto]`, `openReplace [texto]`, `openChangeMeal [texto]`, `openMealMore [texto]` |
| `editExtra` (11619) | — | — | `extraCard [texto]` |
| `editorOriginHtml` (11636) | — | HTML | `editorSheet`, `applyEstimatedMacros` |
| `toggleSavedMeal` (11683) | — | — | `toggleQuickPickFavorite`, `saveEditor` |
| `quickPickTab` (11691) | — | DOM | `quickPicksHtml [texto]` |
| `renderQuickPicks` (11699) | R: DB | DOM, HTML | `quickPickTab`, `quickPickSearch`, `toggleQuickPickFavorite`, `openCatalogUnitForm`, `closeCatalogUnitForm`, `saveCatalogUnitForm`, `openCustomFoodForm`, `customFoodFormChange`, `closeCustomFoodForm`, `saveCustomFoodForm`, `applyScannedCode`, `editorSheet` |
| `toggleQuickPickFavorite` (11752) | — | — | `renderQuickPicks [texto]` |
| `setEditorValues` (11756) | — | DOM | `applyQuickPick`, `setQuickPickPortion` |
| `setKcalOnlyMode` (11769) | — | DOM | `setEditorValues`, `applyEditorComponents`, `editorSheet`, `applyEstimatedMacros` |
| `editorMode` (11779) | — | DOM | `addFoodToEditor`, `addCustomFoodToEditor`, `addRecipeToEditor`, `saveEditor` |
| `renderEditorErrors` (11781) | — | DOM | `setKcalOnlyMode`, `clearEditorErrors`, `saveEditor` |
| `renderPortionChips` (11815) | — | DOM, HTML | `quickPickTab`, `applyQuickPick`, `setQuickPickPortion`, `addEditorComponent` |
| `foodQuantityHtml` (11836) | — | HTML | `catalogFoodRowHtml`, `customFoodRowHtml` |
| `foodWeightHint` (11845) | — | HTML | `catalogFoodRowHtml`, `customFoodRowHtml` |
| `catalogFoodRowHtml` (11848) | — | HTML | sin llamada estática; revisar callback/handler |
| `updateFoodWeightHint` (11858) | — | DOM | `setFoodMeasure`, `foodQuantityHtml [texto]` |
| `openCatalogUnitForm` (11888) | — | DOM | `changeFoodMeasure` |
| `catalogUnitFormHtml` (11894) | — | HTML | `renderQuickPicks` |
| `closeCatalogUnitForm` (11909) | — | DOM | `saveCatalogUnitForm`, `catalogUnitFormHtml [texto]` |
| `saveCatalogUnitForm` (11924) | — | DOM | `catalogUnitFormHtml [texto]` |
| `readFoodQuantity` (11960) | — | DOM | `addFoodToEditor`, `addCustomFoodToEditor` |
| `setComponentAmount` (12009) | — | DOM | `renderEditorComponents [texto]` |
| `applyEditorComponents` (12034) | — | DOM | `addEditorComponent`, `setComponentAmount`, `removeComponent`, `loadRecipeComponents` |
| `renderEditorComponents` (12054) | — | DOM, HTML | `applyEditorComponents`, `editorSheet` |
| `loadRecipeComponents` (12089) | — | DOM | `editorSheet [texto]` |
| `customFoodRowHtml` (12100) | — | HTML | sin llamada estática; revisar callback/handler |
| `openCustomFoodForm` (12122) | — | DOM | `renderQuickPicks [texto]`, `customFoodRowHtml [texto]` |
| `customFoodFormHtml` (12131) | — | HTML | `renderQuickPicks` |
| `readCustomFoodForm` (12162) | — | DOM | `customFoodFormChange`, `saveCustomFoodForm` |
| `saveCustomFoodForm` (12171) | — | DOM, reloj | `customFoodFormHtml [texto]` |
| `openRecipes` (12232) | — | HTML | `saveRecipeForm`, `deleteRecipe`, `openNutritionMoreMenu [texto]`, `openRecipeForm [texto]` |
| `openRecipeForm` (12244) | — | HTML | `openRecipes [texto]` |
| `renderRecipeResults` (12269) | R: DB | DOM, HTML | `openRecipeForm`, `recipeSearch`, `addRecipeLine` |
| `addRecipeLine` (12285) | — | DOM | `renderRecipeResults [texto]` |
| `renderRecipeLines` (12304) | — | DOM, HTML | `openRecipeForm`, `addRecipeLine`, `setRecipeLineAmount`, `removeRecipeLine` |
| `renderRecipePreview` (12315) | — | DOM | `renderRecipeLines`, `openRecipeForm [texto]` |
| `saveRecipeForm` (12325) | — | DOM, reloj | `openRecipeForm [texto]` |
| `customRecipeRowHtml` (12348) | — | HTML | sin llamada estática; revisar callback/handler |
| `recipeUnitChanged` (12359) | — | DOM | `customRecipeRowHtml [texto]` |
| `addRecipeToEditor` (12364) | — | DOM | `customRecipeRowHtml [texto]` |
| `renderScanRow` (12382) | — | DOM, HTML | `renderQuickPicks` |
| `scanMessage` (12388) | — | DOM, HTML | `startBarcodeScan` |
| `startBarcodeScan` (12389) | — | DOM, HTML | `renderScanRow [texto]` |
| `scanLoop` (12408) | — | DOM, HTML, timer | `startBarcodeScan` |
| `stopBarcodeScan` (12425) | — | DOM, timer | `closeModal`, `renderQuickPicks`, `scanLoop`, `startBarcodeScan [texto]` |
| `applyScannedCode` (12430) | — | DOM | `scanLoop` |
| `quickPicksHtml` (12436) | — | HTML | `editorSheet` |
| `logIntentHtml` (12453) | R: END, START | HTML | `editorSheet` |
| `replaceTargetHtml` (12465) | — | HTML, reloj | `logIntentHtml`, `setEditorDate` |
| `setEditorIntent` (12477) | — | DOM | `logIntentHtml [texto]` |
| `setEditorDate` (12483) | R: END, START | DOM | `logIntentHtml [texto]` |
| `renderEditorImpact` (12490) | — | DOM, reloj | `setEditorValues`, `applyEditorComponents`, `setEditorIntent`, `setEditorDate`, `setReplaceTarget`, `editorSheet`, `replaceTargetHtml [texto]` |
| `openCopyMeals` (12552) | R: END, START | HTML | `openNutritionMoreMenu [texto]`, `openMealMore [texto]` |
| `toggleCopyItem` (12572) | — | — | `openCopyMeals [texto]` |
| `setCopyDate` (12573) | R: END, START | DOM | `openCopyMeals [texto]` |
| `renderCopyPreview` (12584) | — | DOM, HTML, reloj | `openCopyMeals`, `toggleCopyItem`, `setCopyDate`, `setCopyMode`, `setCopyEaten`, `confirmCopyMeals` |
| `editorSheet` (12629) | — | HTML | `openEditor`, `editExtra` |
| `readEditor` (12666) | — | DOM | `addEditorComponent`, `saveEditor` |
| `saveEditor` (12673) | — | DOM, reloj | `editorSheet [texto]` |
| `setCoachBusyDetail` (12924) | — | DOM | `renderFirstWeekSetup` |
| `showCoachBusy` (12932) | — | DOM, HTML, timer | `beginCoachAction`, `callClaude` |
| `hideCoachBusy` (12949) | — | DOM, timer | `endCoachAction`, `callClaude` |
| `trainingDraftReviewHtml` (13465) | R: START | HTML | `openTrainingPlanGenerator`, `regenerateTrainingDraftWeek`, `regenerateTrainingDraftSession` |
| `openTrainingPlanGenerator` (13492) | R: END, START, profile | DOM, HTML, reloj | `personalizeHintHtml [texto]`, `openTrainingPlanSheet [texto]` |
| `regenerateTrainingDraftWeek` (13546) | — | DOM, HTML, reloj | `trainingDraftReviewHtml [texto]` |
| `regenerateTrainingDraftSession` (13567) | — | DOM, HTML, reloj | `trainingDraftReviewHtml [texto]` |
| `applyTrainingPlanDraft` (13595) | — | DOM, HTML | `trainingDraftReviewHtml [texto]` |
| `aiEstimate` (13613) | — | DOM, HTML | `editorSheet [texto]` |
| `pickMealPhoto` (13646) | — | DOM | `editorSheet [texto]` |
| `mealPhotoToJpeg` (13647) | — | DOM | `onMealPhotoSelected` |
| `onMealPhotoSelected` (13664) | — | DOM, HTML | `editorSheet [texto]` |
| `photoEstimateRound` (13675) | — | DOM, HTML | `onMealPhotoSelected`, `answerPhotoQuestions`, `renderPhotoEstimateError [texto]` |
| `renderPhotoEstimateError` (13729) | — | DOM, HTML | `photoEstimateRound` |
| `applyEstimatedMacros` (13736) | — | DOM, HTML | `aiEstimate`, `renderPhotoEstimate` |
| `renderPhotoEstimate` (13751) | — | DOM, HTML | `photoEstimateRound` |
| `answerPhotoQuestions` (13773) | — | DOM | `renderPhotoEstimate [texto]` |
| `skipPhotoQuestions` (13780) | — | DOM | `renderPhotoEstimate [texto]` |
| `aiGenerateDay` (14048) | R: current | DOM, HTML | `homePrepareDay`, `genReviewHtml [texto]` |
| `mealAlternativeNoticeHtml` (14113) | — | HTML | `_buildChangeMealOpts`, `genReviewHtml`, `genWeekReviewHtml` |
| `aiGenerateWeek` (14149) | R: current | DOM, HTML | `nutritionWeekHtml [texto]`, `genWeekReviewHtml [texto]` |
| `deterministicWeekFromModal` (14198) | — | DOM | `aiGenerateWeek [texto]`, `genWeekReviewHtml [texto]` |
| `habitMealTag` (14218) | — | HTML | `genReviewHtml`, `genWeekReviewHtml` |
| `genReviewHtml` (14219) | — | HTML | `dismissNutritionUpdate`, `undoNutritionRejection`, `aiGenerateDay`, `addGapSnackToDay`, `blockGenDraftMeal`, `updateGenMealGrams`, `regenerateGenMeal`, `regenerateGenMealRestore` |
| `addGapSnackToDay` (14280) | — | DOM | `genReviewHtml [texto]` |
| `blockGenDraftMeal` (14290) | R: DB, profile | DOM | `genReviewHtml [texto]` |
| `updateGenMealGrams` (14322) | R: DB | DOM | `genReviewHtml [texto]` |
| `genWeekReviewHtml` (14357) | — | HTML | `aiGenerateWeek`, `deterministicWeekFromModal`, `updateGenWeekMealGrams`, `regenerateDayInWeekDraft` |
| `updateGenWeekMealGrams` (14411) | R: DB | DOM | `genWeekReviewHtml [texto]` |
| `regenerateDayInWeekDraft` (14451) | R: DB, profile | DOM, HTML | `genWeekReviewHtml [texto]` |
| `regenerateGenMeal` (14495) | R: DB, profile | DOM, HTML | `genReviewHtml [texto]` |
| `regenerateGenMealRestore` (14584) | — | DOM | `regenerateGenMeal [texto]` |
| `aiReview` (14592) | R: current | DOM, HTML, reloj | `openNutritionMoreMenu [texto]` |
| `toggleMic` (14617) | — | DOM | `editorSheet [texto]` |
| `stopMic` (14630) | — | DOM | `closeModal`, `toggleMic` |
| `scrollToWeightInput` (14650) | — | DOM | `weightSetupCard [texto]` |
| `weightChart` (14691) | — | HTML | `renderProgress` |
| `renderSettings` (14720) | R: DB, REMOTE, S, supa | DOM, HTML | `renderAdminConsole`, `render`, `saveSettings`, `saveSupabase`, `clearSupabase`, `clearKey` |
| `saveSettings` (14772) | R: S / W: S | DOM | `renderSettings [texto]` |
| `saveSupabase` (14773) | R: DB, S, current, supa / W: DB, S | DOM | `renderSettings [texto]` |
| `clearSupabase` (14782) | R: DB, S, supa / W: DB, supa | — | `renderSettings [texto]` |
| `clearKey` (14783) | R: S | — | `renderSettings [texto]` |
| `resetData` (14784) | R: S / W: S | — | `renderSettings [texto]` |
| `supaUrlFrom` (14802) | — | — | `connectFromAuth`, `saveSupabase`, `supaInit`, `clearStoredAuthSession` |
| `supabaseLibReady` (14811) | — | DOM, timer | `boot` |
| `supaInit` (14821) | R: supa / W: supa | — | `retryConnect`, `connectFromAuth`, `saveSupabase`, `clearSupabase`, `boot` |
| `uid` (14834) | — | — | `saveNutritionPlanVersion`, `_syncMetaKey`, `_rememberRemoteVersion`, `enqueueMutation`, `_dequeueMutation`, `_hasPendingDay`, `_hasPendingWeight`, `restorePendingFromQueue`, `_resetConflictAsPending`, `_updateSyncBadge`, `_fetchRemoteSyncPayload`, `drainSyncQueue`, `openSyncConflicts`, `resolveSyncConflict`, `acceptPhotoConsent`, `acknowledgeInjuryTraining`, `loadPrivacyState`, `savePrivacyChoices`, `persistFirstWeekPlan`, `menuSuggestionKey`, `reconcilePendingNutrition`, `setNutritionUpdate`, `nutritionUpdateHtml`, `retryNutritionPreferences`, `undoNutritionRejection`, `setAutomaticNutritionWeeks`, `scheduleNutritionWeek`, `maybePrepareNutritionWeek`, `homeNoticesToggled`, `homeWorkoutTechniqueHtml`, `dismissHomeWorkoutTechnique`, `coachWelcomeKey`, `coachWelcomeEligible`, `routineBaseKey`, `removeWeeklyRoutine`, `openRoutineConversation`, `submitRoutineConversation`, `reviewCoachRoutine`, `saveCoachRoutine`, `planWeekNoticeKey`, `personalizeHintHtml`, `dismissPersonalizeHint`, `slotDishReferenceLines`, `blockDishFromProfile`, `sendCoachMessage`, `chatTurns`, `saveChatTurns`, `renderProfile`, `saveProfile`, `saveOptionalConsents`, `loadNotifPrefs`, `saveNotifPrefs`, `refreshPushSubscriptionKey`, `_savePushOptInDb`, `notifySnoozed`, `enableEmailReminders`, `snoozeNotifyNudge`, `notifyAskCount`, `showQueuedNotifyAsk`, `loadReferralBenefit`, `refreshReferrals`, `mealOptionRerollBucket`, `blockCurrentMealDish`, `persistCatalogUnitWeight`, `persistLibraryOp`, `habitualMealsForGeneration`, `finalizeDayWithGate`, `generateDeterministicWeek`, `blockGenDraftMeal`, `applyWeekPlan`, `maybeUpdateLearnedPatterns`, `streakSeenState`, `showStreakPop`, `flushStreakCelebrations`, `saveEngagementSnapshot`, `loadProfile`, `saveProfilePrefs`, `clearSignedOutState`, `onAuth`, `uploadProgressPhoto`, `returnCardDismissed`, `dismissReturnCard`, `archiveCompletedCycle`, `upsertActiveCycle`, `pullCycleHistory`, `pullPlanVersions`, `ensurePlanVersion`, `createTrainingPlanDraft`, `activateTrainingPlanDraft`, `backfillDayVersions`, `pushDay`, `pullDay`, `pullAllDays`, `pushWeight`, `pullWeights`, `adminUsersHtml`, `setupAuthListener` |
| `isAdmin` (14835) | R: profile | — | `coachUnavailable`, `coachErrorMessage`, `renderPrivacyUnavailable`, `renderAdminConsole`, `render`, `setView`, `renderProfile`, `exportPersonalData`, `deleteMyAccount`, `refreshAdminBetaPending`, `openAdminBetaFromLink`, `adminBetaPendingCardHtml`, `foodsDiets`, `renderAnalytics` |
| `isActive` (14836) | R: profile | — | `render`, `updateInstallPrompt`, `maybePrepareNutritionWeek`, `coachWelcomeEligible`, `coachWelcomeAsk`, `coachWelcomeNavigate`, `renderHoy`, `routineEntryHtml`, `openRoutineConversation`, `canApplyCoachAction`, `sendCoachMessage`, `renderChatMode`, `persistCatalogUnitWeight`, `callClaude`, `maybeUpdateLearnedPatterns`, `checkAndSaveMilestones`, `saveEngagementSnapshot`, `saveProfilePrefs`, `onAuth`, `weeklyCheckinDue` |
| `profileName` (14837) | R: profile | — | `renderHoy`, `renderChatMode` |
| `streakPopShowing` (15130) | — | DOM | `checkAndSaveMilestones` |
| `showStreakPop` (15133) | R: START | DOM, reloj | `streakFeedbackAfterCommit` |
| `flushStreakCelebrations` (15145) | R: START | DOM | `showStreakPop`, `hideStreakPop` |
| `resumeStreakPop` (15156) | — | DOM, timer | `renderStreakPop` |
| `renderStreakPop` (15162) | — | DOM, HTML, timer | `showStreakPop`, `flushStreakCelebrations` |
| `hideStreakPop` (15186) | — | DOM, timer | `streakFeedbackAfterCommit`, `renderStreakPop [texto]` |
| `resetStreakFeedback` (15197) | — | DOM, timer | `render`, `primeStreakSeen`, `clearSignedOutState` |
| `openReminderLink` (15271) | — | reloj | `onAuth` |
| `refreshAuth` (15286) | R: supa / W: profile | red | `drainSyncQueue`, `retryConnect`, `connectFromAuth`, `boot` |
| `signIn` (15389) | R: supa | red | `doAuth`, `inviteSignUp`, `prepareAdminTestUser` |
| `signUp` (15394) | R: supa | red | `doAuth` |
| `clearSignedOutState` (15407) | R: S / W: PLAN_VERSIONS, S, onboardingDraft, profile, safetyScreening, view | storage | `deleteMyAccount`, `signOutUser`, `setupAuthListener` |
| `clearStoredAuthSession` (15431) | — | storage | `signOutUser` |
| `signOutUser` (15441) | R: supa | timer | `finishPasswordRecovery`, `prepareAdminTestUser`, `renderInactive [texto]`, `renderProfile [texto]` |
| `mustChangePassword` (15465) | — | — | `maybePrepareNutritionWeek`, `onAuth` |
| `onAuth` (15469) | R: DB, END, S, START, onboardingDraft, profile, supa, view / W: PLAN_VERSIONS, S, current, onboardingDraft, onboardingStep, view | reloj, timer | `retryConnect`, `connectFromAuth`, `doAuth`, `inviteSignUp`, `finishPasswordRecovery`, `prepareAdminTestUser`, `setupAuthListener`, `boot` |
| `compressProgressPhoto` (15572) | — | DOM | `uploadProgressPhoto` |
| `uploadProgressPhoto` (15584) | R: supa | red, reloj | `startNextChallenge` |
| `openRestartPlan` (15599) | R: profile | HTML | `renderProfile [texto]`, `restartNudgeCard [texto]` |
| `confirmRestartPlan` (15611) | R: END, onboardingDraft, profile / W: onboardingDraft, onboardingStep | DOM, reloj | `openRestartPlan [texto]` |
| `restartNudgeCard` (15653) | R: START | HTML, reloj | `renderHoy` |
| `dismissRestartNudge` (15669) | R: profile / W: profile | reloj | `restartNudgeCard [texto]` |
| `returnCardDismissed` (15682) | — | storage | `returnCardData` |
| `returnCardHtml` (15718) | — | HTML, reloj | `renderHoy` |
| `dismissReturnCard` (15756) | — | reloj, storage | `returnStartToday`, `returnCardHtml [texto]` |
| `returnRescueYesterday` (15761) | — | reloj | `returnCardHtml [texto]` |
| `returnStartToday` (15765) | — | DOM | `returnCardHtml [texto]` |
| `prettyDateTime` (16196) | — | — | `storeCheckoutResult`, `showPaywall`, `showStorePaywall`, `billingHistoryHtml`, `subscriptionStatusHtml`, `adminUsersHtml`, `loadAdminQuotaOverview`, `adminBetaResultHtml`, `adminBetaCardHtml`, `adminBetaAccept` |
| `adminApi` (16197) | — | red | `renderAdminUsers`, `adminPreviewResetPlan`, `adminApplyResetPlan`, `adminConfirmResetUser`, `loadAdminQuotaOverview`, `saveAdminQuotaPolicy`, `saveAdminUserQuota`, `resetAdminUserQuota`, `createAdminUser`, `refreshAdminBetaPending`, `loadAdminBeta`, `adminBetaAccept`, `adminBetaSetStatus`, `sendAdminInvite`, `prepareAdminTestUser`, `adminToggleActive`, `saveAdminPassword`, `adminResetLink` |
| `renderAdminUsers` (16206) | — | DOM, HTML, red | `renderAdminConsole`, `render`, `createAdminUser`, `sendAdminInvite`, `adminToggleActive` |
| `filterAdminUsers` (16259) | — | DOM | `renderAdminUsers` |
| `adminUsersHtml` (16265) | — | HTML | `filterAdminUsers` |
| `openAdminCourtesy` (16286) | — | HTML | `adminUsersHtml [texto]` |
| `grantCourtesy` (16299) | — | DOM, red | `openAdminCourtesy [texto]` |
| `openAdminResetPlan` (16322) | — | HTML | `adminUsersHtml [texto]` |
| `adminPreviewResetPlan` (16339) | — | DOM, HTML, red | `openAdminResetPlan [texto]` |
| `adminApplyResetPlan` (16357) | — | red | `adminPreviewResetPlan [texto]` |
| `openAdminResetUser` (16369) | — | HTML | `adminUsersHtml [texto]` |
| `adminConfirmResetUser` (16378) | — | red | `openAdminResetUser [texto]` |
| `loadAdminQuotaOverview` (16385) | — | DOM, HTML, red, reloj | `renderAdminUsers`, `saveAdminQuotaPolicy`, `saveAdminUserQuota`, `resetAdminUserQuota` |
| `saveAdminQuotaPolicy` (16439) | — | DOM, red | `loadAdminQuotaOverview [texto]` |
| `findAdminQuotaOverride` (16447) | — | — | `fillAdminQuotaFields` |
| `fillAdminQuotaFields` (16450) | — | DOM | `openAdminUserQuota` |
| `openAdminUserQuota` (16457) | — | HTML | `adminUsersHtml [texto]` |
| `saveAdminUserQuota` (16477) | — | DOM, red | `openAdminUserQuota [texto]` |
| `resetAdminUserQuota` (16496) | — | DOM, red | `openAdminUserQuota [texto]` |
| `openAdminCreateUser` (16507) | — | HTML | `renderAdminUsers [texto]` |
| `adminBetaCheckboxHtml` (16516) | — | HTML | `openAdminCreateUser`, `openAdminInviteUser` |
| `adminBetaResultHtml` (16519) | — | HTML | `createAdminUser` |
| `adminWelcomeMessage` (16524) | — | — | `createAdminUser` |
| `createAdminUser` (16527) | — | DOM, HTML, red | `openAdminCreateUser [texto]` |
| `refreshAdminBetaPending` (16555) | R: view | red | `onAuth` |
| `openAdminBetaFromLink` (16563) | — | — | `onAuth` |
| `adminBetaPendingCardHtml` (16576) | — | HTML | `renderHoy` |
| `renderAdminBeta` (16590) | — | DOM, HTML | `renderAdminConsole`, `render` |
| `loadAdminBeta` (16601) | — | DOM, HTML, red | `renderAdminBeta`, `adminBetaAccept`, `adminBetaSetStatus` |
| `adminBetaCardHtml` (16619) | — | HTML | sin llamada estática; revisar callback/handler |
| `adminBetaAccept` (16649) | — | HTML, red | `adminBetaCardHtml [texto]` |
| `copyBetaInvite` (16690) | — | — | `adminBetaAccept [texto]` |
| `adminBetaSetStatus` (16694) | — | red | `adminBetaCardHtml [texto]` |
| `copyAdminWelcome` (16705) | — | — | `createAdminUser [texto]` |
| `openAdminInviteUser` (16709) | — | HTML | `renderAdminUsers [texto]` |
| `sendAdminInvite` (16717) | — | DOM, red | `openAdminInviteUser [texto]` |
| `openAdminTestUser` (16733) | — | HTML | `renderAdminUsers [texto]` |
| `prepareAdminTestUser` (16745) | R: supa | DOM, red | `openAdminTestUser [texto]` |
| `adminToggleActive` (16779) | — | red | `adminUsersHtml [texto]` |
| `adminSetPassword` (16785) | — | HTML | `adminUsersHtml [texto]` |
| `saveAdminPassword` (16794) | — | DOM, red | `adminSetPassword [texto]` |
| `adminResetLink` (16802) | — | red | `adminUsersHtml [texto]` |
| `exerciseTextList` (16815) | — | — | `readExerciseEditor`, `previewExerciseMedia` |
| `validateExerciseRecord` (16818) | — | — | `exerciseCard`, `saveExercise` |
| `renderExerciseAdmin` (16828) | R: DB, supa | DOM, HTML | `renderAdminConsole`, `render` |
| `filterExerciseCards` (16857) | — | DOM | `renderExerciseAdmin [texto]` |
| `exerciseFieldValue` (16879) | — | — | `editExercise` |
| `editExercise` (16882) | R: DB | HTML | `exerciseCard [texto]`, `renderExerciseAdmin [texto]` |
| `readExerciseEditor` (16932) | — | DOM, reloj | `saveExercise` |
| `previewExerciseMedia` (16967) | — | DOM, HTML | `editExercise [texto]` |
| `saveExercise` (16978) | R: supa | red | `editExercise [texto]` |
| `archiveExercise` (16990) | R: supa | red, reloj | `editExercise [texto]` |
| `renderFoods` (16997) | R: DB, supa | DOM, HTML | `renderAdminConsole`, `render` |
| `setFoodTab` (17009) | — | — | `renderFoods [texto]` |
| `foodsDishes` (17011) | R: DB | HTML | `renderFoods` |
| `foodsIngredients` (17027) | R: DB | HTML | `renderFoods` |
| `foodsDiets` (17039) | R: DB | HTML | `renderFoods` |
| `editDiet` (17085) | R: DB | HTML | `foodsDiets [texto]` |
| `saveDiet` (17095) | R: supa | DOM, red | `editDiet [texto]` |
| `deleteDiet` (17107) | R: supa | red | `editDiet [texto]` |
| `editDietDish` (17114) | R: DB | HTML | `foodsDiets [texto]` |
| `saveDietDish` (17132) | R: DB, supa | DOM, red | `editDietDish [texto]` |
| `deleteDietDish` (17154) | R: supa | red | `foodsDiets [texto]`, `editDietDish [texto]` |
| `editIngredient` (17163) | — | HTML | `foodsIngredients [texto]` |
| `saveIngredient` (17178) | R: supa | DOM, red | `editIngredient [texto]` |
| `deleteIngredient` (17188) | R: supa | red | `editIngredient [texto]` |
| `editDish` (17196) | R: DB | — | `foodsDishes [texto]` |
| `dishSync` (17220) | — | DOM | `dishLineSet`, `dishLineDel`, `dishLineAdd`, `saveDish` |
| `dishModal` (17240) | R: DB | HTML | `editDish`, `dishLineSet`, `dishLineDel`, `dishLineAdd` |
| `dishLineSet` (17286) | — | — | `dishModal [texto]` |
| `dishLineDel` (17287) | — | — | `dishModal [texto]` |
| `dishLineAdd` (17288) | R: DB | — | `dishModal [texto]` |
| `saveDish` (17289) | R: DB, supa | red | `dishModal [texto]` |
| `deleteDish` (17318) | R: supa | red | `dishModal [texto]` |
| `weeklyCheckinBanner` (17360) | — | HTML | `renderHoy` |
| `weeklyCheckinChip` (17376) | — | HTML | `renderProgress` |
| `openWeeklyCheckin` (17401) | — | HTML | `weeklyCheckinBanner [texto]`, `weeklyCheckinChip [texto]` |
| `ciSel` (17446) | — | DOM | `openWeeklyCheckin [texto]` |
| `submitWeeklyCheckin` (17528) | R: profile | DOM, HTML | `openWeeklyCheckin [texto]` |
| `weeklyCheckinHistory` (17659) | — | HTML | `renderProgress` |
| `esc` (17680) | — | — | `openSyncConflicts`, `renderPrivacyUnavailable`, `openMacroFormulaInfo`, `explainTrainingIntensity`, `trainingSafetyModeHtml`, `renderOnboarding`, `renderFirstWeekSetup`, `showMacroInfo`, `screenHeader`, `renderAdminConsole`, `renderInactive`, `passwordField`, `nextDailyAction`, `nutritionUpdateHtml`, `nutritionWeekHtml`, `homeActionHtml`, `homeAgendaItemHtml`, `homeWorkoutTechniqueHtml`, `homeAgendaHtml`, `buildContextualChips`, `renderHoy`, `shoppingSheetHtml`, `exerciseMediaHtml`, `openExerciseGuide`, `exerciseCard`, `activityContextNote`, `manualActivityBlock`, `openManualActivity`, `lastPerformanceHtml`, `renderReviewedWorkoutStep`, `openWorkoutCountdown`, `openWorkoutStepPicker`, `explainLoadVariation`, `openExerciseSubstitution`, `exerciseSearchResultsHtml`, `openFinishWorkout`, `renderMovementStep`, `renderOptionalStepOffer`, `renderStrengthSet`, `explainWorkoutTempo`, `workoutVariationButtons`, `renderCurrentWorkoutStep`, `renderWorkoutExecution`, `openRoutineConversation`, `reviewCoachRoutine`, `routineSuggestionHtml`, `renderRoutineEditor`, `routineSearchResultsHtml`, `repeatWorkoutLineHtml`, `openSaveWorkoutCopy`, `workoutCopyPickerHtml`, `workoutPlanSummaryHtml`, `planWeeksCalendarHtml`, `planWeekNoticeHtml`, `openTrainingPlanSheet`, `renderWorkout`, `mealCard`, `extraCard`, `daySummary`, `openWorkoutPicker`, `startWeightNoteCard`, `weekSection`, `chatWorkoutCard`, `renderChatMode`, `renderCoachMessage`, `blockedDishesHtml`, `renderProfile`, `openDeleteAccount`, `showAccessNotice`, `showPaywall`, `showStorePaywall`, `refreshReferrals`, `billingHistoryHtml`, `subscriptionStatusHtml`, `renderAuth`, `renderConfirmEmail`, `renderPasswordRecovery`, `openReplace`, `openMealContingency`, `openChangeMeal`, `_buildChangeMealOpts`, `openMealMore`, `openWorkoutContingency`, `openDayTrainingPlace`, `openSportDayPlace`, `openMissedSession`, `editorOriginHtml`, `renderQuickPicks`, `renderEditorErrors`, `foodQuantityHtml`, `catalogFoodRowHtml`, `catalogUnitFormHtml`, `renderEditorComponents`, `customFoodRowHtml`, `customFoodFormHtml`, `openRecipes`, `openRecipeForm`, `renderRecipeResults`, `renderRecipeLines`, `saveRecipeForm`, `customRecipeRowHtml`, `scanMessage`, `replaceTargetHtml`, `openCopyMeals`, `renderCopyPreview`, `editorSheet`, `showCoachBusy`, `trainingDraftReviewHtml`, `openTrainingPlanGenerator`, `regenerateTrainingDraftWeek`, `regenerateTrainingDraftSession`, `applyTrainingPlanDraft`, `aiEstimate`, `onMealPhotoSelected`, `renderPhotoEstimateError`, `renderPhotoEstimate`, `aiGenerateDay`, `aiGenerateWeek`, `genReviewHtml`, `genWeekReviewHtml`, `regenerateDayInWeekDraft`, `regenerateGenMeal`, `aiReview`, `renderSettings`, `renderStreakPop`, `returnCardHtml`, `renderAdminUsers`, `adminUsersHtml`, `openAdminCourtesy`, `openAdminResetPlan`, `adminPreviewResetPlan`, `openAdminResetUser`, `loadAdminQuotaOverview`, `openAdminUserQuota`, `adminBetaResultHtml`, `createAdminUser`, `loadAdminBeta`, `adminBetaCardHtml`, `adminBetaAccept`, `adminSetPassword`, `renderExerciseAdmin`, `exerciseFieldValue`, `editExercise`, `renderFoods`, `foodsDishes`, `foodsIngredients`, `foodsDiets`, `editDiet`, `editDietDish`, `editIngredient`, `dishModal`, `submitWeeklyCheckin`, `renderAnalytics`, `tourRender` |
| `registerServiceWorker` (17688) | — | — | sin llamada estática; revisar callback/handler |
| `notifyAppUpdateAvailable` (17716) | — | reloj, storage | `registerServiceWorker` |
| `appBusyForUpdate` (17721) | R: current | DOM, reloj | sin llamada estática; revisar callback/handler |
| `appUpdateOfferedInProfile` (17729) | — | reloj, storage | `renderProfile` |
| `applyPendingAppUpdate` (17733) | — | storage | `renderProfile [texto]` |
| `announceAppUpdated` (17743) | — | storage, timer | `registerServiceWorker` |
| `ensureDB` (17752) | R: DB, supa | — | sin llamada estática; revisar callback/handler |
| `setupAuthListener` (17754) | R: profile, supa | red | `retryConnect`, `connectFromAuth`, `boot` |
| `legacyHostMigration` (17778) | — | DOM, HTML | `boot` |
| `hasStoredAuthSession` (17792) | — | storage | `boot` |
| `boot` (17801) | R: S | — | sin llamada estática; revisar callback/handler |
| `analyticsSessionId` (17846) | — | reloj | `trackEvent` |
| `filterEventProps` (17847) | — | — | `trackEvent` |
| `trackEvent` (17854) | — | red | `storeCheckoutStart`, `persistFirstWeekPlan`, `saveOnboarding`, `homeTrackAction`, `openShoppingList`, `sendCoachMessage`, `trackNotifyPrompt`, `showPaywall`, `showStorePaywall`, `activatePlanFromPaywall`, `checkCheckoutReturn`, `applyWeekPlan`, `openReminderLink`, `onAuth`, `confirmRestartPlan`, `activateTrainingPlanDraft`, `startFitbrosTour`, `tourFinish` |
| `renderAnalytics` (17865) | — | DOM, HTML, red | `renderAdminConsole`, `render` |
| `tourSeen` (17912) | — | storage | `maybeStartFitbrosTour` |
| `tourMarkSeen` (17913) | — | storage | `tourFinish` |
| `tourSteps` (17914) | — | — | `startFitbrosTour` |
| `tourEnsureStyle` (17924) | — | DOM | `startFitbrosTour` |
| `maybeStartFitbrosTour` (17941) | R: profile, view | timer | `renderHoy` |
| `startFitbrosTour` (17947) | R: view | DOM | `maybeStartFitbrosTour`, `renderHoy [texto]` |
| `tourKey` (17964) | — | — | sin llamada estática; revisar callback/handler |
| `tourNext` (17970) | — | — | `tourKey`, `tourRender` |
| `tourPrev` (17971) | — | — | `tourKey`, `tourRender [texto]` |
| `tourRender` (17972) | — | DOM, HTML | `startFitbrosTour`, `tourNext`, `tourPrev` |
| `tourCleanup` (18004) | — | — | `startFitbrosTour`, `tourFinish` |
| `tourFinish` (18013) | — | — | `tourKey`, `tourNext`, `tourRender [texto]` |
| `resyncWorkoutView` (18055) | R: view | — | sin llamada estática; revisar callback/handler |

