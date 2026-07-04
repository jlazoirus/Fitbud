# Fitbud - Contexto operativo compacto

Este es el handoff corto para agentes. La referencia larga quedo en `docs/architecture-reference.md`; abrirla solo si necesitas detalle de archivos, variables, migraciones o historia. La fuente de verdad es siempre el codigo en `HEAD`.

## Producto

Fitbud es una PWA/web app de nutricion y entrenamiento personalizada. El usuario completa perfil, metas, restricciones, disponibilidad y recursos; la app prepara planes de 4 o 10 semanas, permite registrar ejecucion diaria, adaptar comidas/entrenos y revisar progreso.

Promesa operativa: el usuario siempre debe tener una opcion viable para comer y entrenar hoy, entender como ejecutarla y conservar su historial.

## Arquitectura vigente

- Frontend vanilla sin framework ni build step. `index.html` es el shell principal; funciones publicas siguen expuestas para handlers inline.
- Modulos puros sin DOM: `js/nutrition-pure.js`, `js/nutrition-domain.js`, `domain-contracts.js`, `workout-player.js`, `training-plan.js`, `sync-conflicts.js`.
- Hosting en Vercel: estatico + funciones `api/*.js`. Produccion: `https://fitbud-green.vercel.app/`.
- Supabase es fuente de verdad. `localStorage` espeja/cachea para offline; no debe ser la unica ubicacion de datos personales.
- PWA: `manifest.webmanifest`, `service-worker.js`, iconos en `assets/`. `index.html`/`config.js` son network-first; `/api/*` network-only.

## Datos y seguridad

- Auth obligatorio con Supabase Auth. `profiles`, `day_log`, `weight_log` y `plan_versions` estan aislados por `user_id` y RLS.
- Auth/password UX (REQ-113): `passwordField()` en `index.html` es el helper unico para campos de contrasena de usuario/admin; conserva ids/autocomplete/minlength y `togglePasswordVisibility()` alterna ojo/ojo tachado sin submit. Las llaves tecnicas locales siguen enmascaradas sin toggle.
- `profiles.prefs` usa `profileSchemaVersion: 3`: zona horaria, 2-6 comidas, horarios/logistica, restricciones, disponibilidad, equipo, experiencia, prioridad y limitaciones.
- Copy de onboarding/perfil (REQ-114): los valores internos no cambian (`mantenimiento`, `omnivoro`, duracion 4/10), pero el UI muestra lenguaje cotidiano: "Mantener mi peso y mejorar mi cuerpo", "Como de todo", "Grasa corporal (opcional)" y "Ciclo de seguimiento"; 10 semanas sigue siendo el default recomendado.
- Perfil (REQ-105) usa acordeon nativo: `renderProfile()` monta secciones `<details class="pf-accordion">` y `profileAccordionToggle()` deja una sola abierta; los campos no se desmontan y `#pfEditableBody` conserva el guardado global solo para Objetivo/Comidas/Entreno. Orden (REQ-107): Objetivo, Comidas, Entreno, Privacidad, Suscripcion, Recordatorios, Avisos del dispositivo, [Administracion], Cuenta. REQ-108 agrego `profileAccordionGuard()` en el `onclick` de cada `<summary>`: si la seccion abierta tiene cambios sin guardar (`pfGroupDirty`, grupos "editable"/"privacy"/"notif") y se intenta abrir otra, hace `confirm()` antes de navegar; Privacidad y Recordatorios tienen su propio par mark/clearDirty (`pfPrivacyMarkDirty`/`pfNotifMarkDirty`) e indicador `#pfPrivacyDirtyHint`/`#pfNotifDirtyHint`, ademas del flotante global existente.
- Consentimientos y safety screenings gatean plan/coach. Edad minima 18. Fotos y datos de salud son privados; nada sensible va a analytics.
- Admin escribe catalogos y gestiona usuarios/cortesia; usuarios normales no ven diagnostico tecnico.

## Coach, cuotas y lenguaje

- `api/claude.js` es proxy serverless: la key nunca llega al navegador. Exige sesion, privacidad vigente, entitlement y reserva idempotente por accion.
- Las respuestas externas se validan antes de aplicar. Al agotar cuota se reutiliza pool privado compatible o fallback determinista.
- REQ-117: usuarios sin plan pago tienen `coach_trials` server-side por 7 dias desde onboarding o primer uso premium; usa politicas `trial` en `coach_quota_policies`. Al agotar cambios incluidos, `/api/claude` corta con paywall comercial sin llamar al proveedor; usuarios pagos no quedan limitados por trial. Entrenamiento usa coach premium solo para semana 1 del trial y valida el resto sin llamada externa.
- REQ-118: al terminar onboarding inicial o nuevo ciclo, `saveOnboarding()` dispara `prepareFirstCycleWeek()`: refresca entitlement/trial, prepara nutricion semanal y entrenamiento con progreso visible, completa faltantes por rutas deterministas, guarda un snapshot activo combinado `nutritionPlan + trainingPlan` en `plan_versions` y aplica comidas a `day_log` como compatibilidad local. Fallos parciales muestran reintento sin dejar Home vacio.
- REQ-31 es invariante: UI normal no menciona IA, Claude, modelos, prompts, tokens ni cuotas internas. Usar copy de coach/plan/opciones.

## Nutricion

- Catalogo Supabase: ingredientes, platos, recetas, dietas y vista `dish_macros`. `supabase/seed.sql` carga el catalogo base expandido: 121 ingredientes, 100 platos y 359 lineas de receta tras REQ-135.
- `js/nutrition-domain.js` valida macros, restricciones, slots y reemplazos. Usa kcal de ingredientes, no solo 4/4/9.
- REQ-79 agrego metadata semantica con `supabase/nutrition_catalog_semantics.sql`: slugs estables, slots compatibles, tags dietarios y limites de escalado. Es migracion manual/idempotente; el cliente degrada si aun no esta aplicada.
- REQ-80 agrego `planDeterministicNutritionDay()` en `js/nutrition-domain.js`: prepara un dia desde platos/ingredientes reales, respeta slots 2-6, restricciones y limites de porcion, y es el fallback principal cuando el coach no esta disponible.
- REQ-81 agrego `planNutritionWeek(ctx)`, `scoreWeeklyVariety(days)` y `buildShoppingListFromNutritionPlan(days)` en `js/nutrition-domain.js`. `planNutritionWeek` llama `planDeterministicNutritionDay` para 7 dias pasando `prevDayUsed` para penalizar (no bloquear) repeticion consecutiva. `aiGenerateWeek()` en `index.html` usa ruta determinista cuando el coach no esta disponible; `genWeekReviewHtml()` muestra resumen kcal/prot promedio, advertencias de variedad y lista de compras agregada por slug.
- REQ-82 agrego `validateNutritionPlanSnapshot()` en `domain-contracts.js` (valida schema, tolerancias, slugs sin duplicado). En `index.html`: `buildNutritionPlanSnapshot()` materializa daysData como snapshot; `saveNutritionPlanVersion()` persiste en `plan_versions` con `source:"nutrition"` y `snapshot.nutritionPlan`; `activeNutritionPlanDay(ds)` busca el dia prescrito en versiones activas; `buildDay()` renderiza comidas desde el snapshot cuando existe (`src:"nutritionPlan"`); `mealValue()` resuelve override > nutritionPlan > vacio; `applyWeekPlan()` es ahora async y guarda primero en `plan_versions`, con override de compatibilidad.
- REQ-83 agrego motor puro de reemplazos en `js/nutrition-domain.js`: `rankReplacementCandidates(meal, candidates, mealTarget, catalog)` ranquea candidatos por score solver + proximidad kcal; `solveReplacement(changedSlotId, deltaKcal, dayMeals, dayLog)` determina si |deltaKcal|>50 y reune comidas futuras no hechas; `rebalanceFutureMeals(futureMeals, deltaKcal, dayTarget, prefs, catalog)` distribuye -deltaKcal/n y re-solver porciones para meals con dishSlug. En `index.html`: `openChangeMeal` llama rankReplacementCandidates; `_buildChangeMealOpts` muestra los 4 deltas de macro y aviso de rebalanceo; `applyChangeMeal` aplica ajustes a comidas futuras y enriquece contingencyLog con prevOvr/applied; `revertMeal` deshace rebalanceos seguros. Tests: `scripts/validate-nutrition-replacements.mjs` (9 tests).
- REQ-84 agrego contrato de validacion del coach nutricional en `js/nutrition-domain.js`: `normalizeCoachIngredient(ingName, ingSlug, maps)` busca por slug luego por nombre normalizado (solverKey); `recalcCoachMealMacros(comida, catalog)` itera ingredientes, mapea al catálogo, calcula macros reales y marca desconocidos con `needs_catalog_review:true`. `validateGeneratedDay` en `index.html` ahora usa `recalcCoachMealMacros` cuando `DB.loaded` — los macros declarados por el coach son ignorados; si hay ingredientes desconocidos se emite warn (no se bloquea); si el catálogo no está cargado se hace fallback a macros declarados (backward compatible). Tests: `scripts/validate-nutrition-coach-contract.mjs` (8 tests).
- REQ-128 agrego `DIET_CONTRACT` en `js/nutrition-domain.js`: kcal ±3% o ±50 kcal, proteína ±5 g bilateral, carbohidratos ±8 g y grasa ±8 g, con kcal autoritativa de `ingredients.kcal`. `validateDietContractTotals()` y `dietContractTolerance()` son solo calibración (`runtimeActive:false`); no cambian `validateDayTotals`, cliente, servidor ni snapshots hasta la activación final (REQ-139). `scripts/validate-diet-contract.mjs` reconstruye el catálogo desde `supabase/seed.sql` + semántica REQ-79 y mide la matriz 2/4/6 comidas × patrón dietario × proteína normal/alta × disgustos × 7 días; baseline 2026-07-04: 0/378 días dentro de contrato, así que REQ-137 debe cerrar macros globalmente antes de activar runtime.
- REQ-129 etapa 1 agrego `finalizeNutritionDay(ctx)` en `js/nutrition-domain.js` como puerta pura dormida: normaliza propuestas por catálogo, descarta ingredientes desconocidos, rellena slots faltantes con `planDeterministicNutritionDay()`, conserva `lockedMeals`, calcula `totals`/`residual` y reporta `contract = validateDietContractTotals(...)` sin activar runtime (`DIET_CONTRACT.runtimeActive` sigue `false`). `scripts/validate-diet-contract.mjs` ahora mide con `engine:"finalizeNutritionDay"`; el canario sigue 0/378 dentro de contrato hasta el cierre global de REQ-137 y la cobertura de catálogo. Test dedicado: `scripts/validate-finalize-nutrition-day.mjs`.
- REQ-130 hizo coherentes las preferencias duras: `dislikedIngredients` bloquea por defecto en dominio/cliente/proxy; el system prompt ya no lo llama preferencia blanda; alta proteína usa fuentes dinámicas filtradas; `COACH_PROMPT_VERSION=7` invalida pool previo; y el patrón omnívoro exige como warning/reintento dirigido al menos una comida con proteína animal, relajado si el usuario excluye carnes/pescado. No genera 422 duro por omnívoro; sí sigue rechazando restricciones explícitas.
- REQ-131 agrego presupuesto y adecuacion por momento del dia sin migracion: `mealSlotTargets` alimenta el prompt con kcal/proteina por slot; la referencia se filtra por `compatibleDishesForSlot`; `validateGeneratedDay` rechaza platos catalogados fuera de `compatible_slots` y aplica `slotKcalCeiling` (presupuesto x1.15) en slots no principales.
- REQ-132 agrego metadata manual/idempotente de momento de comida: `dishes.meal_weight` (`light/medium/heavy`) y `meal_form`; `compatibleDishesForSlot` filtra heavy en desayuno no-principal y no-light en `media_manana`/`merienda`/`recena`. `COACH_PROMPT_VERSION=8` y el hash de catálogo incluyen `compatible_slots`, `meal_weight` y `meal_form`. Acción manual: aplicar/re-ejecutar `supabase/nutrition_catalog_semantics.sql` en Supabase para crear/backfillear columnas.
- REQ-133 endurecio `/api/claude`: `diet_day`, `diet_week` y `meal_option` usan `output_config.format` con JSON Schema y fallback automatico sin structured outputs si la API rechaza el parametro; `maxTokens` capea en 4096. Modelos permitidos: Haiku 4.5, Sonnet 4.6 y Sonnet 5, con modelo por accion via env (`ANTHROPIC_MODEL_DIET`, etc.) y default Haiku. `supabase/analytics.sql` agrega `v_coach_model_gate`; cambiar dieta a Sonnet 5 solo si `diet_*` muestra >10% degradacion sostenida durante 1-2 semanas. Acción manual: re-ejecutar `supabase/analytics.sql` en Supabase para crear/actualizar la vista.
- REQ-134 agrego pipeline offline `scripts/grow-catalog.mjs`: con `--fixture` valida sin red o con `--brief` usa `ANTHROPIC_API_KEY` local/CI para proponer recetas, recalcula candidatos contra `supabase/seed.sql`, exige slugs/fuentes/metadata semantica, prueba `solveDishPortion` por slot y emite SQL revisable + reporte de aceptados/rechazados sin tocar produccion. Test: `scripts/validate-grow-catalog.mjs`.
- REQ-135 agrego lote 1 de catalogo en `supabase/seed.sql`: 60 ingredientes nuevos con fuentes resumidas en `docs/catalog-lote-1-sources.md` y 50 platos nuevos (desayunos, snacks/batidos, almuerzos y cenas ligeras). Cobertura local: desayuno=20, media_manana=30, almuerzo=37, merienda=30, snack=30, cena=13, recena=30; `slot_without_candidates` desaparece del canario. El gate macro estricto queda en calibracion hasta REQ-137: baseline post-lote 27/378 dias (`7.1%`) dentro de contrato.
- REQ-136 agrego `dishes.cuisine_tags` (`criolla/mediterranea/mexicana/asiatica`) en schema + semantica idempotente; `preferenceScoreAdjustment()` prioriza suavemente `prefs.preferredCuisines` via `cuisineTagsForDish()`/`preferredCuisineTags()`, el editor admin preserva tags y `COACH_PROMPT_VERSION=9` invalida pools por hash de catalogo con cocina. Tests: `scripts/validate-cuisine-preferences.mjs` y cobertura por cocina en `validate-nutrition-catalog.mjs`. REQ-140/141 completan profundidad de catalogo hasta 180 platos / 200 ingredientes antes de REQ-137.
- La primera nutricion posterior al onboarding usa las preferencias guardadas antes de aplicar comidas: `validateGeneratedDay` bloquea patrón alimentario, alergias, sin lácteos y sin gluten con `foodTextConflictForProfile`; si la generación semanal no pasa, `prepareFirstWeekNutrition()` completa faltantes con `deterministicDaysForWeek()`.
- En `Cambiar comida`, el usuario puede tocar `Rehacer opciones` hasta 4 veces por día; usa `meal_option` con lista cerrada de platos candidatos y fallback determinista del catálogo. `regenerateGenMeal()` comparte ese límite para una comida individual. La acción no vive en `Más opciones`: ese menú queda solo para acciones globales de nutrición.

## Entrenamiento

- `exercise-catalog.js` y `supabase/exercises.sql` cubren biblioteca, media y roles de rutina.
- `training-plan.js` valida planes de 4/10 semanas; `workout-player.js` maneja ejecucion recuperable, series, cardio, temporizadores, RPE y sustituciones.
- Onboarding/Perfil de entrenamiento (REQ-115): la UI pregunta actividad fisica principal (`walking/running/cycling/swimming/other/strength_only`) y donde entrenar fuerza (`strengthPlace: gym/home/outdoor/none`). `strengthMode:"none"` soporta semanas solo de actividad; caminata tiene ejercicios/roles `walking`; casa/aire libre muestran recursos (`bodyweight`, bandas, mancuernas, barra/discos, dominadas) sin duplicar lugar como decision principal.
- Modo seguro de entrenamiento (REQ-116): `trainingSafetyMode` (`auto/gentle/full`) recomienda modo suave por edad 18-21, 50+, 55+ o limitaciones. En suave, el deporte efectivo puede pasar de running/otra actividad a `walking`, la dosis baja a RPE/series conservadoras y `allowedExercisesForSession()` filtra pike push-ups, dominadas, movimientos invertidos/unilaterales complejos antes de validar/generar semanas. Red flags del safety screening mantienen `trainingSafetyHold()`.
- Splits progresivos: beginner = Full Body, intermediate = Upper/Lower, advanced = Push/Pull/Legs por defecto con selector avanzado.

## Persistencia, sync y planes

- `plan_versions` guarda snapshots activos/previos. Entrenamiento ya usa borrador + activacion confirmada. Nutricion aun esta migrando hacia `snapshot.nutritionPlan` (REQ-82).
- `day_log` registra ejecucion diaria, overrides, extras, adaptaciones y estado offline. No debe convertirse en fuente principal de prescripcion futura.
- Cola offline `fitbud_syncq_v1`: mutaciones con base remota y estados pending/failed/conflict. `sync-conflicts.js` mergea cambios seguros y evita upsert ciego.

## Pagos, notificaciones y analytics

- Landing publica, catalogo de planes, paywall, Stripe Checkout, webhooks, entitlements, cupones y billing history estan implementados. Cobro real depende de variables y configuracion externa.
- REQ-104: `/api/config` expone `checkout.enabled` (`!!STRIPE_SECRET_KEY`); en el cliente, `checkoutAvailable()` lo lee de `REMOTE.checkout` y `showPaywall` oculta los botones "Activar plan" (muestra "Disponible pronto" + canje de codigo) cuando esta en false, para no ofrecer una compra que terminaria en 503. Tambien quito "Cancela cuando quieras" del copy (planes son pago unico sin renovacion); `supabase/entitlements.sql` actualizo la descripcion sembrada — pendiente re-ejecutar ese seed en produccion para que la tabla `subscription_plans` refleje el nuevo texto.
- `api/notify.js` corre cron diario en Vercel Hobby, envia correo via Resend y push via `web-push` si hay consentimiento. Granularidad horaria requiere plan Pro o scheduler externo.
- `api/analytics.js` registra eventos permitidos por allowlist; no enviar datos de salud, alergias, fotos, prompts ni contenido de conversaciones.

## Archivos calientes

| Archivo | Uso |
|---|---|
| `index.html` | Shell principal, render, estado, handlers inline y wiring de modulos. |
| `api/claude.js` | Proxy del coach, cuota, validacion y fallback. |
| `api/admin.js` | Admin de usuarios: listar, invitar por correo, reset, activacion, QA y politicas de consumo. |
| `api/entitlement.js` | Entitlement, cortesia admin, billing history y cupones. |
| `service-worker.js` | Cache PWA, push y notificationclick. Subir `CACHE_NAME` si cambia shell/assets. |
| `js/nutrition-domain.js` | Contratos nutricionales puros. |
| `supabase/schema.sql` | Esquema completo para instalacion nueva. |
| `supabase/*.sql` | Migraciones idempotentes; produccion requiere aplicacion manual. |
| `scripts/release-gate.mjs` | Gate local obligatorio antes de push. |

## Comandos

```bash
python3 -m http.server 8923
node scripts/release-gate.mjs
node scripts/agent-next-requirement.mjs --self-test
node scripts/agent-next-audit.mjs --self-test
```

Checks utiles por area:

```bash
node scripts/validate-nutrition-domain.mjs
node scripts/validate-nutrition-catalog.mjs
node scripts/validate-grow-catalog.mjs
node scripts/validate-training-plan.mjs
node scripts/test-sync-conflicts.mjs
node scripts/audit-html.mjs
node scripts/audit-secrets.mjs
```

## Variables y secretos

- No commitear secretos. `config.js` queda vacio; produccion usa variables de Vercel.
- Publicas: Supabase URL/publishable key, modelo permitido, VAPID public key.
- Servidor: `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `CRON_SECRET`, `VAPID_PRIVATE_KEY`.
- Modelo por accion: `ANTHROPIC_MODEL_DIET`, `ANTHROPIC_MODEL_DIET_DAY`, `ANTHROPIC_MODEL_DIET_WEEK`, `ANTHROPIC_MODEL_MEAL_OPTION`, `ANTHROPIC_MODEL_TRAINING`, `ANTHROPIC_MODEL_COACH_CONVERSATION`; si faltan, cae a `ANTHROPIC_MODEL` y luego Haiku 4.5.

## Gotchas

- Fechas como `YYYY-MM-DD` con helpers locales; evitar `Date` UTC accidental para dias de usuario.
- Mantener app sin build, sin framework y sin dependencias runtime nuevas salvo REQ explicito y patron aprobado.
- Migraciones SQL deben ser idempotentes, con RLS, y nunca se aplican automaticamente a produccion.
- Si cambia comportamiento visible, probar desktop y movil. Si cambia PWA, revisar safe areas y cache.
- Si un agente necesita detalle historico, abrir `docs/requirements-history.md` o `docs/architecture-reference.md` por seccion, no como lectura obligatoria completa.
