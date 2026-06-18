# Fitbud — Contexto para continuar el desarrollo

Documento de handoff para retomar el proyecto en otra sesión sin perder contexto.

## 1. Qué es
PWA/app web de un solo `index.html` (vanilla JS, sin frameworks ni build step) que gestiona **ciclos sucesivos de 4 o 10 semanas** de nutrición y entrenamiento. El ciclo original fue sáb 13 jun 2026 → dom 23 ago 2026; los siguientes se generan por usuario. Calcula calorías y macros, tiene funciones de IA (Claude) y una base de datos de alimentos (Supabase).

- **Repo:** https://github.com/jlazoirus/Fitbud (público)
- **En vivo (producción):** https://fitbud-green.vercel.app/
- **Usuario/objetivo:** vegetariano sin huevo, ~180 g proteína/día, déficit agresivo. Plan en `plan-10-semanas-recomposicion.md` (fuente de verdad de menús/entrenos).

## 2. Stack y arquitectura
- **Frontend:** un único `index.html` (HTML+CSS+JS inline). Mobile-first. Sin dependencias salvo `supabase-js` por CDN (jsDelivr).
- **Persistencia:** la **fuente de verdad es Supabase**; `localStorage` (clave `fitbud_v1`) es solo **caché offline** que la espeja. Ningún dato del usuario vive solo en el navegador (el progreso diario va a `day_log`, el peso a `weight_log` y el plan prescrito a `plan_versions`). Lo único local-de-dispositivo son los overrides de credenciales en Ajustes (en producción vienen de Vercel).
- **Base de datos:** Supabase (PostgreSQL) — catálogo de alimentos (ingredientes/platos/dietas), consumo diario (`day_log`), plan versionado (`plan_versions`) y peso (`weight_log`).
- **IA:** Claude vía **proxy serverless** en Vercel (`/api/claude`). La API key nunca llega al navegador. El proxy exige sesión, privacidad vigente y una reserva idempotente por acción; valida la salida antes de guardarla. Dieta diaria/semanal, opciones, estimación y revisión tienen políticas separadas. Al alcanzar el límite reutiliza el pool privado compatible o una alternativa determinista sin llamar al proveedor.
- **Lenguaje de producto:** usuarios normales ven "tu coach", "preparar" y "otra opción"; no ven proveedor, modelo, prompts, tokens ni detalles de configuración. Los errores se neutralizan y el texto dinámico se filtra antes de mostrarlo. Los administradores conservan el diagnóstico técnico en Ajustes.
- **Perfil flexible:** `profiles.prefs` usa `profileSchemaVersion: 3`. Incluye zona horaria, 2-6 comidas, horarios, ventana alimentaria, logística, alergias/gustos separados, días y lugar por sesión, equipo, experiencia, prioridad y limitaciones. Los perfiles antiguos reciben defaults y se persisten al iniciar sesión sin repetir onboarding.
- **Privacidad y seguridad:** `user_consents` y `safety_screenings` guardan aceptación y aptitud por versión. Edad mínima 18 años. La interfaz presenta un solo permiso esencial para personalizar el plan y un segundo permiso opcional para fotos; no solicita correo o marketing. Sin el permiso vigente no se crea/adapta el plan ni se llama al coach; una señal de alerta reemplaza la rutina por una pausa segura.
- **Hosting:** Vercel (estático + funciones en `api/`). No hay build.
- **PWA:** `manifest.webmanifest` + `service-worker.js` + íconos en `assets/`.
- **Biblioteca de ejercicios:** `exercise-catalog.js` aporta 40 ejercicios propios y el mapeo por ID de todas las rutinas actuales. Supabase (`exercises`) pasa a ser la fuente compartida después de aplicar la migración; el catálogo empaquetado es el fallback.
- **Reproductor de entrenamiento:** `workout-player.js` construye prescripciones deterministas para fuerza y cardio, normaliza el estado recuperable y calcula progreso, duración y temporizadores. La UI guarda series, cargas, RPE, sustituciones, bloques y cierre en `day_log.state.workoutExecution`.
- **Planes de entrenamiento personalizados:** `training-plan.js` valida semanas completas contra disponibilidad, fase, tiempo, catálogo y limitaciones. El cliente prepara 4 o 10 semanas por partes, guarda un borrador en `plan_versions` y solo lo activa después de confirmación; si el servicio falla usa la plantilla determinista validada.
- **Contingencias y reemplazos (REQ-36):** cada comida tiene un único botón primario "Cambiar" que abre una hoja con motivo opcional (Sin cocina / Comer fuera / Sin ingrediente), la lista de platos con delta de kcal y selector de alcance (Solo hoy / Esta semana). El botón "···" abre un modal secundario con receta completa y "Editar valores". "Volver al plan" aparece ante cualquier override activo. El entrenamiento conserva "Adaptar hoy" con acciones rápidas: "Solo 20 min", "En casa", "Sin equipo" y "Me perdí la sesión". Cada cambio queda registrado en `day_log.state.contingencyLog` con tipo, motivo, prescripción original y timestamp. El resumen del día lista las adaptaciones; ninguna contingencia reescribe días completados.
- **Accesibilidad de modales (REQ-37):** `modal()` añade `role="dialog"`, `aria-modal="true"` y `aria-labelledby="sheet-title"` al sheet; conecta el id al primer `<h3>`; registra `_modalKeyHandler` en el documento para cerrar con Esc y atrapar el foco (Tab/Shift-Tab) dentro del dialog; guarda el elemento disparador en `_modalTrigger` y lo restaura al cerrar con `closeModal()`. El botón ✕ lleva `aria-label="Cerrar"`. `delExtra()` pide `confirm()` antes de eliminar una comida extra.
- **Check-in semanal adaptativo (REQ-20):** al inicio de cada nueva semana del ciclo aparece un banner en Progreso. El formulario recoge peso, escalas 1-5 para siete señales subjetivas y sesiones realizadas. Un motor determinista (`analyzeCheckinAnswers`) propone ajuste de calorías (±0-200 kcal/día, proteína fija) o recomendaciones de intensidad, con señal de alerta que bloquea cambios de entrenamiento. El usuario confirma antes de aplicar; los check-ins se persisten en `profiles.prefs.weeklyCheckins`. El recap del ciclo acumula el conteo de ajustes aceptados.
- **Contratos de dominio (REQ-29):** `domain-contracts.js` exporta seis validadores puramente funcionales (sin DOM): `validateProfilePrefs`, `validateMacroTargets`, `validateDayLogState`, `validateEntitlement`, `validateSyncEntry`, `validateCoachRequest`. Cada uno devuelve `{ok, errors[]}`. Se usan como `console.warn` no bloqueante en `commitDay`, `enqueueMutation` y `loadEntitlement`. Testeable con `node scripts/validate-contracts.mjs`. Accesible como `window.FITBUD_DOMAIN_CONTRACTS` y `DOMAIN_CONTRACTS` en el script principal.
- **Cola offline y sincronización (REQ-28):** `fitbud_syncq_v1` en localStorage almacena mutaciones de `day_log` y `weight_log` por usuario (`{id, uid, entity, entityKey, payload, ts, retries, status}`). `pushDay`/`pushWeight` encolan si `!navigator.onLine` o ante error de red. `drainSyncQueue()` procesa la cola al reconectar, al iniciar sesión y al cerrar sesión (timeout 5 s). `pullDay`/`pullAllDays` saltan días con pendientes para no sobreescribir cambios offline. `clearSyncQueueForUser(uid)` aísla la cola al cambiar de usuario. Badge `#sync-badge` muestra estado: offline / pendientes / sincronizado / atención (tras 3 reintentos fallidos). La cola sobrevive actualizaciones del service worker (está en localStorage, no en cache). Sin SQL nuevo.

> **Macros del día (resuelto):** la vista HOY toma los macros de cada comida desde la **base de datos** (calculados por ingredientes), no de valores fijos. `mealValue()` resuelve con esta prioridad: **1)** override manual → **2)** macros de la DB por `dishName` → **3)** fallback a `SLOTS`. Las metas guardadas por el usuario son la fuente directa para Home, Nutrición y generación con IA; `DAY_TARGET` solo se usa como fallback para perfiles que todavía no tienen metas calculadas.

## 3. Mapa de archivos
| Archivo | Qué es |
|---|---|
| `index.html` | **Toda la app** (~1160 líneas): datos, estado, render, vistas, IA, voz, DB, sync. |
| `config.js` | Fallback de config en runtime (`window.FITBUD_CONFIG`). **Vacío en el repo**; producción usa Vercel. |
| `api/claude.js` | Proxy serverless: valida sesión/privacidad, reserva cuota mediante RPC con service role, agrupa partes idempotentes, valida JSON, guarda resultados válidos y selecciona pool/plantilla al agotar el límite antes de decidir si llama a Anthropic. |
| `api/config.js` | Función serverless: devuelve config pública (URL+publishable key de Supabase, modelo, `proxy:bool`). NO devuelve la key de Claude. |
| `api/admin.js` | Función serverless **admin**: usuarios, cuenta QA y políticas de consumo. Permite límites por acción, activación, diagnóstico nuevo/reutilizado, cortesía y reinicio diario. Usa `SUPABASE_SERVICE_ROLE_KEY` solo en servidor. |
| `api/privacy.js` | Exporta perfil, progreso, planes, consentimientos, consumo/opciones del coach y fotos descritas; o elimina fotos + cuenta Auth tras confirmar `BORRAR <email>`. |
| `api/checkout.js` | Crea sesión de pago en Stripe (POST, sesión requerida). Retorna `{url}` para redirigir al checkout alojado. Vars: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_MONTHLY/QUARTERLY`, `NOTIFY_APP_URL`. |
| `api/webhook.js` | Procesa webhooks de Stripe (POST, firma HMAC-SHA256 verificada con `STRIPE_WEBHOOK_SECRET`). Activa entitlement al pagar, revoca al reembolsar. Registra en `billing_events` (idempotente). |
| `api/notify.js` | Cron job de recordatorios (REQ-24 + REQ-38). `GET /api/notify` = job del cron (requiere `Authorization: Bearer CRON_SECRET` o header `x-vercel-cron: 1`; soporta `?dry_run=true`). `GET /api/notify?unsubscribe=TOKEN` = baja de un solo clic sin login. Correo vía Resend (fetch nativo). Push vía `web-push` (npm, excepción documentada para REQ-38). Deduplicación push: `notification_log` tipo `push_streak`. Variables correo: `RESEND_API_KEY`, `NOTIFY_FROM_EMAIL`, `NOTIFY_APP_URL`, `CRON_SECRET`. Variables push: `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (y opcionalmente `VAPID_PUBLIC_KEY`). |
| `api/push-subscribe.js` | Registra (POST) o elimina (DELETE) suscripciones Web Push del usuario autenticado (REQ-38). Escribe en `push_subscriptions` con service role. |
| `package.json` | Declaración de dependencia runtime: `web-push ^3.6.7` (única excepción a la política sin deps runtime; autorizada para REQ-38). `"type":"module"` para ESM. |
| `vercel.json` | Deploy estático sin build (`framework:null`, `outputDirectory:"."`). Cron: `GET /api/notify` cada hora (`0 * * * *`). |
| `service-worker.js` | Cache PWA. `index.html`/`config.js` network-first; `/api/*` network-only; assets cache-first; CDN stale-while-revalidate. Caché `fitbud-pwa-v37`. Handlers `push` (muestra notificación) y `notificationclick` (abre el día correcto en la PWA) añadidos en REQ-38. |
| `exercise-catalog.js` | Catálogo local propio de 40 ejercicios y mapeo de cada variante de rutina a IDs estables. También alimenta la generación reproducible del SQL. |
| `workout-player.js` | Dominio sin dependencias para prescribir fuerza/cardio, recuperar ejecuciones y calcular temporizadores, progreso y resultados. |
| `training-plan.js` | Contrato sin dependencias para normalizar semanas, rechazar días/ejercicios/dosis incompatibles y convertir sesiones activadas al reproductor. |
| `domain-contracts.js` | Contratos de dominio sin dependencias de DOM: validadores para perfil (prefs v3), macros diarios, estado de día (day_log), entitlement, entrada de cola offline y solicitud al coach. Cada validador devuelve `{ok, errors[]}`. Usado en frontera de persistencia (`commitDay`, `enqueueMutation`, `loadEntitlement`) como advertencia; testeable en Node con `scripts/validate-contracts.mjs`. |
| `manifest.webmanifest`, `assets/icon-192.png`, `assets/icon-512.png` | PWA instalable. El layout respeta `safe-area-inset-*` para no quedar bajo la barra de estado ni el indicador de inicio de iOS. |
| `supabase/schema.sql` | Esquema completo de la DB (todas las tablas, vista `dish_macros`, RLS). Para instalación nueva. |
| `supabase/seed.sql` | Datos precargados: 55 ingredientes, 43 platos con receta, 4 dietas, 28 almuerzos asignados. Correr después de schema. |
| `supabase/day_log.sql` | Migración incremental: tabla `day_log` (consumo diario). *(Superado por auth.sql, que la recrea por usuario.)* |
| `supabase/weight_log.sql` | Migración incremental: tabla `weight_log` (peso). *(Superado por auth.sql.)* |
| `supabase/auth.sql` | **Multiusuario:** `profiles` (rol admin + prefs), `day_log`/`weight_log` por `user_id`, RLS por usuario y escritura de catálogo solo admin. Correr después de schema/seed. |
| `supabase/plan_cycles.sql` | Migración idempotente para ciclos sucesivos: `plan_versions`, `plan_cycles`, `day_log.plan_version_id`, pesos separados por `cycle_start` y bucket privado `progress-photos` con RLS. La duración se infiere de las fechas y se configura en `profiles.prefs.planDurationWeeks`. |
| `supabase/privacy.sql` | Migración idempotente de `user_consents` y `safety_screenings`, ambas aisladas por usuario con RLS. Ejecutar después de `plan_cycles.sql`. |
| `supabase/exercises.sql` | Migración idempotente de la biblioteca de ejercicios, fuente/licencia, media procedimental, RLS y seed de las rutinas actuales. Ejecutar después de `auth.sql`; no se aplica automáticamente. |
| `supabase/coach_quota.sql` | Migración idempotente de políticas, overrides, reservas, partes, pool privado e impresiones. Las tablas no tienen acceso para usuarios normales; las RPC se conceden solo a service role. Ejecutar después de `privacy.sql`; no se aplica automáticamente. |
| `supabase/billing.sql` | Migración idempotente de `billing_events` (auditoría de webhooks de Stripe). Solo service_role; RLS habilitado sin políticas. Ejecutar después de `entitlements.sql`. |
| `supabase/analytics.sql` | Migración idempotente de `product_events` (eventos de embudo anonimizados), `feature_flags` (versionado de prompts y flags), extensión de `coach_usage` con `latency_ms`/`estimated_cost_usd`/`prompt_version`/`outcome`, y vistas admin `v_activation_funnel`/`v_ai_cost_summary`. Reemplaza `complete_fresh_coach_part` y `fail_coach_generation_part` con versiones que aceptan los nuevos campos (parámetros opcionales con DEFAULT, backward compatible). Ejecutar después de `coach_quota.sql`. |
| `api/analytics.js` | POST registra un evento de producto (usuario autenticado, propiedades filtradas por allowlist). GET devuelve métricas agregadas de embudo y costos IA (solo admin). |
| `scripts/generate-exercise-sql.mjs`, `scripts/validate-exercises.mjs` | Regeneran el seed SQL desde el catálogo y validan completitud, media propia y referencias de todas las rutinas. |
| `scripts/validate-workout-player.mjs` | Valida prescripciones de fuerza/cardio, dosis, temporizadores y recuperación del estado del reproductor. |
| `scripts/validate-training-plan.mjs`, `scripts/test-training-plan-api.mjs` | Validan planes de 4/10 semanas, integración con el reproductor y rechazo server-side de respuestas incompatibles. |
| `scripts/validate-coach-quota.mjs`, `scripts/test-coach-quota.mjs` | Validan contratos de esquema/cliente y prueban con mocks idempotencia, reutilización, devolución y administración sin llamadas pagadas. |
| `scripts/release-gate.mjs` | **Release gate (REQ-30):** orquesta 18 checks locales (sintaxis JS, dominio, SQL, secrets, HTML/a11y) en ~1 s. Sale con código 1 si alguno falla. Correr antes de cada push. `--warn-only` para no bloquear. |
| `scripts/audit-secrets.mjs` | Escanea todos los archivos rastreados por git contra patrones de credenciales reales (Claude, Stripe, Supabase JWT, Resend). Allowlist para nombres de variables de entorno y comentarios de ejemplo. |
| `scripts/audit-html.mjs` | Verifica sintaxis del JS embebido (`node --check` sobre tmp file), tags PWA, `env(safe-area-inset-*)`, `prefers-reduced-motion`, `alt` en imágenes, `aria-label` en selects de entrenamiento y lenguaje prohibido (REQ-31) en atributos de UI. Presupuesto de tamaño: warn >600 KB, fail >1 000 KB. |
| `scripts/validate-migrations.mjs` | Verifica idempotencia, RLS en tablas de usuario, `ADD COLUMN IF NOT EXISTS`, `DROP IF EXISTS` y secrets hardcodeados en todos los archivos `supabase/*.sql`. |
| `scripts/smoke-test.mjs` | Prueba 8 endpoints de producción con fetch nativo (sin deps). Uso: `node scripts/smoke-test.mjs [--url URL] [--dry]`. |
| `ROLLBACK.md` | Procedimiento de rollback para Vercel, Supabase, service worker y Git. |
| `PRIVACY.md` | Política operativa preliminar: edad, consentimiento, aptitud, retención, exportación y borrado. Requiere revisión legal antes del lanzamiento comercial. |
| `plan-10-semanas-recomposicion.md` | Plan original (fuente de verdad de menús, días, entrenos, metas). |
| `BUILD_PLAN.md`, `PROGRESS.md`, `REQUIREMENTS.md`, `README.md` | Docs del proyecto. |

## 4. Estructura interna de index.html (con líneas aprox.)
- **Config runtime** (~151): `CONFIG` (de `config.js`), `REMOTE` (de `/api/config`), `effectiveSettings()` (prioridad: override local en Ajustes → REMOTE/Vercel → config.js), `aiAvailable()`, `settingSource()`.
- **Capa de datos:** calendario dinámico por perfil (`planStartDate`/`planEndDate`/`planCycleNumber`/`planDurationWeeks`), menús, generadores de entrenamiento, `DAY_TARGET` (fallback sin perfil), `calculateMacroTargets()` y `effectiveDayTarget()` (metas personales exactas).
- **Onboarding (REQ-35):** `renderOnboarding()` guía 4 pasos simplificados: (1) datos corporales, (2) objetivo y macros, (3) entrenamiento esencial (disciplina, fuerza, duración, experiencia, minutos, días/lugar — difiere prioridad, horario, equipo, lesiones), (4) comidas+restricciones+privacidad (número de comidas, patrón alimentario, alergias, consentimiento core y screening de seguridad — difiere ventana, horarios exactos, cocinas, presupuesto, fotos). Campos diferidos tienen defaults válidos de `migrateProfilePrefs` y se envían al coach como JSON. `saveOnboarding()` marca `onboardingEssentialOnly:true` y `profileRefinedAt:null` en ciclos nuevos. `saveProfile()` setea `profileRefinedAt` al guardar desde Perfil. `needsProfileTuning(prefs)` muestra banner "Afina tu plan" en Home y Perfil. `migrateProfilePrefs()` normaliza el esquema v3 y guarda `timeZone`; `hasCompleteOnboarding()` no bloquea perfiles heredados y `profileReviewDue()` solicita revisión cada 28 días. Al terminar el onboarding por primera vez o al iniciar un ciclo nuevo, `saveOnboarding()` llama a `prepareFirstCycleDay(ds)`: muestra pantalla de transición, intenta generación (o cae a plantilla determinista) y aplica comidas vía `applyDayComidas`; marca `profiles.prefs.cycleFirstDayPreparedAt` para no re-dispararse. El campo se resetea a `null` en los prefs de cada ciclo nuevo.
- **Cierre de sesión:** `signOutUser()` limpia la UI y el cache del usuario de inmediato, solicita a Supabase un cierre local y elimina la sesión persistida como fallback si la red no responde.
- **Entrenamiento:** cada perfil elige disciplina, fuerza, 3-6 días exactos, lugar por día, minutos, equipo, experiencia, prioridad y limitaciones. `openTrainingPlanGenerator()` prepara semanas validables y `activateTrainingPlanDraft()` inicia la nueva versión en la primera fecha sin entrenamiento registrado. `effectiveWorkout(ds)` resuelve la sesión del snapshot activo, conserva overrides y devuelve `safety_hold` ante una señal de alerta. `workoutPrescription()` convierte la dosis o intervalos activados en pasos recuperables.
- **Lógica de calendario:** `weekOf(ds)`, `dayType(ds)` → PESAS/BAJO/REFEED/DIETBREAK, `buildDay(ds)` arma el día (comidas+entreno); el almuerzo se resuelve desde la DB (`dietLunchDish`) con fallback al plan.
- **Estado/persistencia** (~335): `S` (objeto raíz, cacheado en localStorage), `dayState(ds)` (campos: `meals{id:{done,ovr}}`, `extras[]`, `workoutDone`, `workoutOverride`, `workoutExecution`), `mealState`, `mealValue` (resuelve macros: override manual → DB por `dishName` → fallback plan), `dayTotals(ds)` (suma solo comidas marcadas `done`). `workoutExecution` conserva pasos, series, timer, duración, sustituciones y resultado `completed|partial`.
- **Sincronización con la DB:** `commitDay(ds)`=`save()`+`pushDay(ds)` (upsert a `day_log` con `plan_version_id`); `pullDay(ds)`/`syncDay(ds)` bajan el día; `pushWeight`/`pullWeights`/`syncWeights` para `weight_log`; `pullPlanVersions()`/`ensurePlanVersion()` mantienen el snapshot prescrito. Se llama `commitDay` en cada mutación del día (toggles, reemplazo, editor, sugerencia IA, cambio de entreno) y `syncDay`/`syncWeights` al arrancar, navegar y conectar.
- **Navegación:** `current` (fecha YYYY-MM-DD), `view` (`day|week|foods|weight|settings`), `render()` (dispatcher), `renderTabs()`, `setView()`.
- **Vistas:** `renderDay()` (HOY: dashboard kcal/macros + comidas + extras + entreno + resumen), `renderWeek()`, `renderFoods()` (sub-tabs `platos|ingredientes|dietas`), `renderWeight()` (tabla + gráfico SVG), `renderSettings()`.
- **Comidas:** `mealCard`, `extraCard`, `toggleMeal/Extra/Workout`, `openReplace`/`applyReplace`, `openEditor`/`editorSheet`/`saveEditor` (comidas personalizadas / editar valores).
- **IA (Claude)**: `callClaude(userText,maxTokens,quota)` manda acción, `requestId`, parte, contexto compatible, fallback y reglas de validación. `aiGenerateWeek()` genera los días en memoria, muestra borrador con `genWeekReviewHtml()` (incluye lista de compras) y aplica solo tras confirmar con `applyWeekPlan()`. `aiGenerateDay()` permite regenerar cualquier comida individual con `regenerateGenMeal(slotId)` sin tocar las demás. La distribución de macros pondera la comida principal con `weightedMealSplit`. La vía directa con key local queda como herramienta de desarrollo.
- **Voz** (~695): `toggleMic()`/`stopMic()` con Web Speech API (`es-PE`, fallback `es-ES`), alimenta el campo del editor.
- **Supabase / Catálogos**: `DB` cachea alimentos y ejercicios; `dbLoad()` usa `exercises` cuando existe y degrada al catálogo local si la migración está pendiente. Alimentos conserva sus editores y `renderExerciseAdmin()` añade filtros, validación, CRUD y archivado solo para admin.
- **Init** (final): `supaInit(); registerServiceWorker(); render(); ensureDB(); syncDay(current); syncWeights();` y de nuevo tras `loadRemoteConfig().then(...)` (por si las credenciales llegan de Vercel).

## 5. Modelo de datos del plan (reglas)
- **Tipos de día:** PESAS (Lun/Mar/Jue/Vie), BAJO (Mié/Sáb/Dom), REFEED (sáb 27 jun, 11 jul, 8 ago, 22 ago), DIETBREAK (toda la semana 6, 20–26 jul).
- **Metas:** el onboarding calcula la meta diaria personal con Katch-McArdle (si hay % de grasa) o Mifflin-St Jeor. `effectiveDayTarget()` devuelve exactamente esas kcal/proteína/carbohidratos/grasas en Home, Nutrición y prompts de IA. `DAY_TARGET` conserva los valores históricos por tipo de día únicamente como fallback.
- **Menús (`MENUS`):** A Criollo, B Mediterráneo, C Asiático, D Mexicano — asignados por semana en `WEEKS`. Desayunos/cenas rotan; almuerzo según menú+día (autoritativo desde `diet_dishes` en la DB).
- **Entrenamiento:** plan combinado por perfil: 4 o 10 semanas, Running/Cycling/Natación + Gimnasio/Peso corporal, entre 3 y 6 días exactos/semana. La prioridad reparte fuerza y sesiones aeróbicas; natación exige piscina. Antes de iniciar se puede cambiar la sesión vía `workoutOverride`; una vez registrada, la prescripción queda fija para no reescribir lo ejecutado. Fuerza usa dosis por fase y cardio bloques estructurados con temporizador.

## 6. Base de datos Supabase
Proyecto ref: `wtqnvtixvfapdbzcegdw` (URL en env de Vercel). Tablas:
- `ingredients(id, name, category, kcal, protein_g, carbs_g, fat_g)` — **valores por 100 g**.
- `dishes(id, name, slot, menu, notes)` — platos.
- `dish_ingredients(id, dish_id, ingredient_id, grams)` — receta (líneas).
- `diets(id, code, name, description)` — A/B/C/D.
- `diet_dishes(id, diet_id, dish_id, weekday, slot)` — qué plato cada día.
- `day_log(log_date pk, state jsonb, plan_version_id, updated_at)` — consumo del día (comidas/extras/entreno/override) como documento JSON.
- `weight_log(user_id, cycle_start, week, kg, bf_pct)` — peso y grasa semanal separados por ciclo.
- `plan_versions(user_id, cycle_number, version_number, version_key, source, status, valid_from, valid_to, snapshot_hash, snapshot, reason, prompt, model)` — snapshots del plan prescrito por usuario y ciclo; `snapshot.trainingPlan` guarda semanas, sesiones, dosis, validación y versión del contrato.
- `plan_cycles(user_id, cycle_number, start_date, end_date, challenge, summary, photo_path)` — recap e historial.
- `user_consents(user_id, consent_type, policy_version, status, timestamps)` — aceptación/retiro por propósito y versión.
- `safety_screenings(user_id, screening_version, responses, has_red_flags, cleared_for_training)` — aptitud versionada.
- `exercises(slug, aliases, discipline, level, equipment, places, muscles, movement_pattern, instructions, safety, media, source, license, active)` — biblioteca compartida de movimientos y sesiones deportivas.
- `coach_quota_policies(action, entitlement_code, daily_limit, enabled)` y `coach_quota_overrides(user_id, action, ...)` — política general/producto y cortesía.
- `coach_usage(user_id, action, request_id, quota_date, timezone, status, origin, provider_calls, tokens, result_id)` — auditoría y reserva idempotente.
- `coach_generation_parts`, `coach_option_pool`, `coach_option_impressions` — partes de una acción, opciones privadas compatibles e historial para selección menos reciente.
- `notification_preferences(user_id PK, email_opt_in, push_opt_in, timezone, notify_hour, enabled_days[], notify_nutrition, notify_training, unsubscribe_token, ...)` — preferencias de recordatorio por usuario. `push_opt_in` agregado en REQ-38. Migración base: `supabase/notifications.sql`; columna push: `supabase/push_subscriptions.sql`.
- `push_subscriptions(id, user_id, endpoint, keys_p256dh, keys_auth, user_agent, created_at)` — suscripciones Web Push VAPID por usuario. RLS por `user_id`; el cron usa service role. `UNIQUE(user_id, endpoint)`. Migración: `supabase/push_subscriptions.sql`.
- `notification_log(id, user_id, notification_type, reference_date, idempotency_key UNIQUE, status, attempted_at, delivered_at, error_message, ...)` — auditoría e idempotencia del cron. Tipos válidos: `nutrition`, `training`, `push_streak` (REQ-38 extiende el CHECK). Escrito por service role; el usuario puede leer el propio.
- `billing_events(id, stripe_event_id UNIQUE, event_type, user_id, plan_id, entitlement_id, status, payload, error, created_at)` — auditoría de webhooks de Stripe; idempotencia por `stripe_event_id`; sin acceso para usuarios (solo service_role). Migración: `supabase/billing.sql`.
- `product_events(id, user_id, session_id, event_type, properties JSONB, created_at)` — eventos de embudo anonimizados sin datos de salud, alergias ni prompts. RLS: el usuario inserta/lee los propios; service_role accede a todo para vistas admin. Migración: `supabase/analytics.sql`.
- `feature_flags(flag_name PK, enabled, params JSONB, updated_at)` — versionado de prompts y flags de experimentos. Lectura pública; escritura solo admin. Migración: `supabase/analytics.sql`.
- `coach_usage` extiende con: `latency_ms INTEGER`, `estimated_cost_usd NUMERIC(10,6)`, `prompt_version TEXT`, `outcome TEXT`. Vistas admin: `v_activation_funnel`, `v_ai_cost_summary`. Migración: `supabase/analytics.sql`.
- Storage privado `progress-photos/<user_id>/cycle-N/...` — fotos de progreso con URLs firmadas.
- Vista `dish_macros` — macros calculados por plato (suma de ingredientes), `security_invoker`.
- **RLS:** escritura anónima eliminada. Datos, planes, consentimientos y evaluaciones solo permiten acceso propio; catálogos solo permiten escritura a admins activos. Cuotas, pool e impresiones revocan acceso a `anon`/`authenticated` y solo se operan con RPC/service role tras verificar sesión.
- **Cálculo de macros:** `macros = Σ ingrediente(por_100g) × gramos/100`. En la app se hace en cliente (`macrosFromLines`).
- **Re-seed:** `seed.sql` hace `truncate ... restart identity cascade` (es re-ejecutable).

## 7. Config y credenciales (cómo fluyen)
Prioridad en `effectiveSettings()`: **override local (Ajustes, localStorage)** → **`/api/config` (Vercel)** → **`config.js`**.
- **Claude:** en producción se usa el proxy `/api/claude` (la key vive solo en el servidor). En local sin funciones, se puede pegar una API key en Ajustes para llamada directa.
- **Supabase:** URL + publishable key vienen de `/api/config` (Vercel) o de Ajustes. La publishable key es pública por diseño (la protege el RLS).

## 8. Variables de entorno en Vercel
| Variable | Para qué | Secreta |
|---|---|---|
| `ANTHROPIC_API_KEY` | proxy `/api/claude` | **Sí** (solo servidor) |
| `SUPABASE_URL` | `https://<ref>.supabase.co` | No |
| `SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` | No |
| `SUPABASE_SERVICE_ROLE_KEY` | cuotas del coach, administración y privacidad | **Sí** (solo servidor) |
| `ANTHROPIC_MODEL` (opcional) | modelo por defecto | No |
| `VAPID_PRIVATE_KEY` | firma de notificaciones push VAPID (`api/notify.js`) | **Sí** (solo servidor) |
| `VAPID_SUBJECT` | identidad del remitente VAPID, ej: `mailto:j.lazo.ir@gmail.com` | No |
| `VAPID_PUBLIC_KEY` (opcional) | clave pública VAPID en el servidor; el frontend usa el literal embebido | No |

Modelos válidos (whitelist en `api/claude.js`): `claude-haiku-4-5-20251001` (default), `claude-sonnet-4-6`.

## 9. Despliegue, ejecución y verificación
- **Producción:** Vercel auto-deploy en cada `git push` a `main`. Usar el dominio limpio `fitbud-green.vercel.app` (NO las URLs con hash, que están protegidas).
- **Deployment Protection:** debe estar **desactivada** (Settings → Deployment Protection → Vercel Authentication) o `/api/*` da 401.
- **GitHub Pages:** puede servir el estático pero NO corre `api/`; ahí la IA queda off salvo key local.
- **Local:** `python3 -m http.server 8923` y abrir `http://localhost:8923` (hay `.claude/launch.json` con server "fitbud" en :8923). En local `/api/*` no existe → IA solo con key local en Ajustes.
- **Verificación rápida:** `curl https://fitbud-green.vercel.app/api/config` (debe dar JSON con proxy:true y supabase lleno). Conteo de datos vía Supabase REST con la publishable key (`/rest/v1/dishes?select=id` + header `apikey`).
- **Syntax check del JS embebido:** extraer el último `<script>` de index.html y `node --check`.

## 10. Extensiones

### Ya hecho ✅
- **Macros del día desde la DB** — vía `dishName` + `mealValue()`; el almuerzo se lee de `diet_dishes` (`dietLunchDish()`), así reasignar/renombrar el plato en Supabase se refleja. Fallback al plan.
- **Versionado del plan** — `plan_versions` guarda snapshots activos y previos; `day_log.plan_version_id` preserva qué plan vio cada día y `pullPlanVersions()`/`ensurePlanVersion()` migran el historial.
- **Consumo diario en la DB** — `day_log` + `commitDay`/`pullDay`/`syncDay`. Sincroniza entre dispositivos; localStorage es caché.
- **Peso en la DB** — `weight_log` + `pushWeight`/`pullWeights`/`syncWeights`. Nada del usuario vive solo en el navegador.
- **Plan deportivo configurable** — `primarySport` + `strengthMode` + `trainDays` en `profiles.prefs`; reparto con `workoutSchedule(days)` y sesiones progresivas con `workoutOptions(ds)`.
- **Generador de entrenamiento** — crea y valida 4/10 semanas con ejercicios del catálogo, progresión/descarga, revisión por semana o sesión, fallback determinista y activación confirmada sin reescribir entrenamientos registrados.
- **Cambiar el entrenamiento del día** — `effectiveWorkout` + `workoutOverride` (sincroniza vía `day_log`).
- **Biblioteca guiada de ejercicios** — 40 registros propios cubren gimnasio, peso corporal, running, cycling y natación; todas las rutinas usan IDs, la UI permite pausar animaciones y el admin valida fuente/licencia antes de publicar.
- **Reproductor guiado** — sesiones ordenadas con calentamiento, series o intervalos, descansos, carga/repeticiones/RPE, sustituciones y cierre de seguridad. Pausar o cerrar la PWA conserva el avance en `day_log`.
- **Onboarding y revisión periódica** — calcula macros, reúne objetivo y preferencias, se activa al primer login y vuelve a preguntar cada 28 días.
- **Perfil flexible v3** — estructura logística de comidas, restricciones duras/blandas, zona horaria y disponibilidad deportiva; migra perfiles existentes y alimenta al coach como JSON.
- **Privacidad y seguridad** — consentimientos versionados, gate para cuentas existentes, pausa de entrenamiento por alertas, guardrails server-side, exportación y borrado.
- **Cuotas y reutilización** — políticas por acción, ventana diaria por zona horaria, reserva atómica, semana agrupada, pool privado, fallback determinista y panel administrativo sin contadores en la experiencia normal.
- **Contingencias (REQ-19)** — reemplazos con motivo, delta de macros, alcance (hoy/semana) y log; acciones rápidas de entrenamiento (tiempo/lugar/equipo/sesión perdida); reversión al plan original; resumen de adaptaciones en el día.
- **Coach conversacional (REQ-21)** — tab "Coach" con historial por ciclo/usuario, sugerencias predefinidas (5 preguntas del plan), contexto enriquecido, clasificación de respuesta (educativo/propuesta/aplicado/fallback), confirmación antes de aplicar acciones, resumen automático al superar 30 mensajes y lenguaje 100% invisible (sin IA/proveedor). Estado en `localStorage` por `fitbud_chat_v1_<uid>_c<cycle>`.

### Pendiente / ideas
- **Porciones especiales de REFEED/DIETBREAK:** el almuerzo refeed usa el plato estándar de la DB, sin la doble porción de carbo que indica el plan.
- **¿El cambio de entreno ajusta el tipo de día/metas?** Hoy cambiar pesas↔correr no cambia el tipo de día (sigue por el día de semana). Decidir si debería.
- ~~**Auth de Supabase**~~ ✅ Hecho — multiusuario con login; RLS por usuario y escritura de catálogo solo admin (ver §11b).
- ~~**Editor de dietas**~~ ✅ Hecho (REQ-39): `foodsDiets()` muestra controles admin para crear/editar dietas y agregar, editar o quitar asignaciones `diet_dishes` por día/slot; detecta duplicados y advierte incompatibilidades de slot antes de guardar.
- **Buscar/filtrar** ingredientes y platos; sugerencias por macros restantes.
- **Conflictos de sync:** cola offline implementada (REQ-28). Los cambios hechos sin red se encolan y se reenvían al reconectar con upsert idempotente. El estado local tiene prioridad sobre el servidor mientras haya pendientes en la cola. Dos dispositivos editando el mismo día: el que drena último gana (last-write-wins a nivel de upsert), pero ninguno pierde sus cambios offline silenciosamente.
- **Mejorar la IA:** que sugiera usando platos reales de la DB con recálculo estricto por ingredientes.

## 11b. Multiusuario, auth y roles (nuevo)
La app ahora es **multiusuario con Supabase Auth** (email + contraseña). Migración: `supabase/auth.sql`.

- **Login obligatorio.** Sin sesión se ve `renderAuth()` (login/registro). En dev local sin credenciales, esa pantalla pide conectar Supabase (URL + publishable key → `S.settings`). En producción las da `/api/config`.
- **Estado:** `session` (Supabase Auth) y `profile` (fila de `profiles`: `is_admin` + `prefs`). `authReady` gatea el render (splash mientras resuelve). `onAuth()` carga perfil + datos al entrar; `setupAuthListener()` reacciona a login/logout/refresh.
- **Datos por usuario:** `day_log`/`weight_log`/`plan_versions` llevan `user_id`; `pushDay/pullDay/pushWeight/pullWeights` lo incluyen y RLS lo fuerza. `pullAllDays()` baja todo el historial al entrar (racha/stats). Al login se limpia la caché local (`S.days`/`S.weights`) y manda la DB.
- **Roles:** `isAdmin()` = `profile.is_admin`; `isActive()` controla acceso a la app. El primer admin se promueve por SQL (`update profiles set is_admin=true where email='...'`). Después, Perfil → Usuarios permite activar/desactivar, gestionar contraseñas y crear/reiniciar una cuenta QA marcada con `user_metadata.fitbros_test_user`.
- **Catálogo compartido:** ingredientes/platos/dietas se leen para cualquier autenticado; escritura solo admin (RLS con `is_admin()`).

### Navegación (nueva IA por rol)
- Tabs de usuario: **Hoy · Nutrición · Entreno · Progreso · Perfil** (`renderTabs`, 5 fijos).
- **Hoy** (`renderHoy`): agenda diaria del coach (REQ-22). Saludo + racha + banner de check-in si hay uno pendiente + tarjeta de acción prioritaria (`nextDailyAction`) + hero de kcal/macros (`heroDash`) + grid de accesos rápidos (Nutrición/Entreno/Coach). `nextDailyAction(ds)` calcula la prioridad de forma determinista (sin IA): sesión en curso → evaluación de seguridad → comida pendiente → entrenamiento pendiente → descanso → día completo. La tarjeta primaria tiene un botón de CTA en un toque; completar la acción llama `render()` y actualiza la prioridad sin recargar. Siempre muestra el día actual (`clampDate(todayStr())`).
- **Nutrición** (`renderNutrition`): nav de día + hero + comidas del plan + extras + IA.
- **Entreno** (`renderWorkout`): nav de día + prescripción + reproductor recuperable + ejercicio activo con demostración/instrucciones + series o intervalos + cierre completo/parcial + resumen.
- **Progreso** (`renderProgress`): stats (kg/entrenos/racha combinada) + sección "Rachas e hitos" (`renderStreakSection`: tres rachas + consistencia semanal + hitos del ciclo + mensaje de recuperación) + gráfico+tabla de peso + sección Semana.
- **Sistema de rachas (REQ-23):** `nutritionDayDone(ds)` = ≥50 % de comidas planificadas marcadas. `trainingDayResult(ds)` = "done"/"rest"/"missed" (descanso planificado es neutral). `combinedDayDone(ds)` = nutrición AND (entrenamiento done OR rest). `streak()` = racha combinada hacia atrás con ventana de 1 día. `streakStats()` = pase completo desde START devolviendo racha actual y mejor para nutrición, entrenamiento y combinada, más consistencia semanal. Hitos 3/7/14/30 días guardados idempotentemente en `profiles.prefs.streakMilestones[{key,type,level,cycle,date}]`. `checkAndSaveMilestones()` se llama desde `renderHoy()` de forma no bloqueante.
- **Recordatorios por correo (REQ-24):** tabla `notification_preferences` + `notification_log` en Supabase (migración `supabase/notifications.sql`). Cron `GET /api/notify` cada hora (Vercel); verifica hora local del usuario por zona horaria, actividad pendiente en `day_log`, idempotencia por clave única `user_id:type:date`. Proveedor: Resend vía fetch nativo. Baja de un clic: `GET /api/notify?unsubscribe=TOKEN`. UI: `notifPrefsCache`, `loadNotifPrefs()`, `populateNotifPrefsForm()`, `saveNotifPrefs()`. Vars: `RESEND_API_KEY`, `NOTIFY_FROM_EMAIL`, `NOTIFY_APP_URL`, `CRON_SECRET`.
- **Notificaciones push de racha (REQ-38):** tabla `push_subscriptions` (migración `supabase/push_subscriptions.sql`). El mismo cron horario añade un loop de push: filtra usuarios con `push_opt_in=true`, verifica hora/día/actividad pendiente, deduplica con tipo `push_streak` en `notification_log`, envía vía `web-push` (VAPID). El SW v37 añade `push` y `notificationclick`. UI en Perfil → "Avisos del dispositivo": `renderPushSection()`, `requestPushPermission()`, `subscribePush()`, `savePushOptIn()`, `_savePushOptInDb()`; el literal `VAPID_PUBLIC_KEY` está embebido en el frontend. Vars servidoras: `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.
- **Landing pública (REQ-33):** `renderLanding()` se muestra a visitantes no autenticados (cuando `authReady=true`, `!session` y `!window._showAuth`). `showAuthFromLanding(mode)` activa `_showAuth=true` y llama `render()` para ir al auth form. El auth form tiene "← Conoce Fitbros" que resetea `_showAuth=false`. Open Graph y Twitter Card en `<head>`. Ningún texto menciona IA, proveedor ni tecnología (REQ-31). `toggleFaq(el)` abre/cierra preguntas frecuentes.
- **Oferta, entitlement y paywall (REQ-25):** Catálogo de planes en `subscription_plans` (Supabase); entitlements en `user_entitlements` (status active/expired/courtesy/revoked, origin, granted_by, auditable). `api/catalog.js` sirve planes públicamente (cache 5 min, fallback inline). `api/entitlement.js` GET devuelve entitlement activo; POST admin otorga/revoca cortesía. `api/claude.js` llama `verifyEntitlement()` con service role y retorna 402+`paywall:true` si no hay plan; admin y dev-mode (API key local) pasan siempre. Cliente: `loadCatalog()` en `boot()` (no-await), `loadEntitlement()` en `onAuth()` (no-await). `hasEntitlement()` es permisivo si el endpoint aún no existe. `catalogPlans` reemplaza el stub; `landingPricingHtml()` y `showPaywall()` usan `activeCatalogPlans()`. `subscriptionStatusHtml()` en Perfil muestra vigencia y días restantes. Admin tiene "Cortesía" por usuario via `openAdminCourtesy()`/`grantCourtesy()`. Migración: `supabase/entitlements.sql`.
- **Checkout y ciclo de facturación (REQ-26):** Stripe como proveedor de pagos (checkout alojado, modo `payment` por ser paquetes sin auto-renovación). `api/checkout.js` POST crea sesión vía Stripe API con `fetch` nativo; requiere sesión autenticada; retorna `{url}` para redirigir. `api/webhook.js` POST verifica firma HMAC-SHA256 (Node `crypto`; bodyParser desactivado), rutas `checkout.session.completed` → crea entitlement, `charge.refunded` → revoca entitlement, otros eventos → solo loguear; idempotente por `billing_events.stripe_event_id UNIQUE`. `billing_events` guarda auditoría completa (solo service_role). Cliente: `activatePlanFromPaywall(planId)` llama `/api/checkout` y redirige a Stripe; `checkCheckoutReturn()` detecta `?checkout=success|cancel` al volver y muestra feedback; se llama en `onAuth()` tras el primer render. `subscriptionStatusHtml()` agrega botón "Renovar plan" cuando quedan ≤14 días (solo planes checkout) y botón "Restaurar compra" cuando no hay plan activo. `restorePurchase(btn)` recarga `loadEntitlement()` (útil si el webhook llegó tarde). Vars nuevas en Vercel: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_QUARTERLY`. Migración: `supabase/billing.sql` (después de `entitlements.sql`). Service worker v31.
- **Analítica de producto, IA y costos (REQ-27):** `trackEvent(type, props)` registra eventos del embudo con filtro de allowlist (15 claves seguras; sin datos de salud, alergias, identidad ni prompts). 8 eventos instrumentados: `session_start`, `onboarding_complete`/`onboarding_review`, `paywall_shown`, `checkout_start`, `checkout_complete`, `diet_week_applied`, `training_plan_applied`, `coach_message_sent`. Vista admin "📊 Analítica" en Perfil → `renderAnalytics()` consulta `GET /api/analytics` y muestra embudo (90d) y costo IA por acción (30d). `api/claude.js` registra `latency_ms`, `estimated_cost_usd` (Haiku $0.80/$4 MTok, Sonnet $3/$15 MTok) y `prompt_version: "v1"` en cada llamada al proveedor. Migración: `supabase/analytics.sql` (después de `coach_quota.sql`). Service worker v32.
- **Perfil** (`renderProfile`): edita macros, logística alimentaria, restricciones, disponibilidad, lugares y recursos → `profiles.prefs`; cuenta + cerrar sesión; Administración solo admin.
- **Coach personalizado:** `buildSysPrompt()` serializa el perfil v3 como JSON estructurado para separar restricciones obligatorias, gustos, recursos y zona horaria.

## 11. Convenciones / gotchas
- **Sin build, sin frameworks.** Todo en `index.html`; las funciones se llaman vía `onclick` inline. Mantener ese estilo (vanilla, español en UI/labels).
- **Fechas como `YYYY-MM-DD`** (helpers `ymd`/`parseYmd`/`addDays`; evitar problemas de timezone usando fecha local).
- **No subir secretos.** Las keys van en env de Vercel. `config.js` se deja vacío. Aunque la publishable de Supabase es pública, no la commitees.
- **Commits:** mensajes en español, con `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Trabajar en `main` y `git push` (dispara deploy).
- **Service worker:** al cambiar `index.html`, los usuarios con SW viejo pueden ver caché; navegaciones son network-first así que se actualiza, pero subir `CACHE_NAME` (vX) fuerza purga.
- **`.claude/` está en `.gitignore`** (config local de Claude Code).
