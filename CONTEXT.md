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
| `vercel.json` | Deploy estático sin build (`framework:null`, `outputDirectory:"."`). |
| `service-worker.js` | Cache PWA. `index.html`/`config.js` network-first; `/api/*` network-only; assets cache-first; CDN stale-while-revalidate. Caché `fitbud-pwa-v23`. |
| `exercise-catalog.js` | Catálogo local propio de 40 ejercicios y mapeo de cada variante de rutina a IDs estables. También alimenta la generación reproducible del SQL. |
| `workout-player.js` | Dominio sin dependencias para prescribir fuerza/cardio, recuperar ejecuciones y calcular temporizadores, progreso y resultados. |
| `training-plan.js` | Contrato sin dependencias para normalizar semanas, rechazar días/ejercicios/dosis incompatibles y convertir sesiones activadas al reproductor. |
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
| `scripts/generate-exercise-sql.mjs`, `scripts/validate-exercises.mjs` | Regeneran el seed SQL desde el catálogo y validan completitud, media propia y referencias de todas las rutinas. |
| `scripts/validate-workout-player.mjs` | Valida prescripciones de fuerza/cardio, dosis, temporizadores y recuperación del estado del reproductor. |
| `scripts/validate-training-plan.mjs`, `scripts/test-training-plan-api.mjs` | Validan planes de 4/10 semanas, integración con el reproductor y rechazo server-side de respuestas incompatibles. |
| `scripts/validate-coach-quota.mjs`, `scripts/test-coach-quota.mjs` | Validan contratos de esquema/cliente y prueban con mocks idempotencia, reutilización, devolución y administración sin llamadas pagadas. |
| `PRIVACY.md` | Política operativa preliminar: edad, consentimiento, aptitud, retención, exportación y borrado. Requiere revisión legal antes del lanzamiento comercial. |
| `plan-10-semanas-recomposicion.md` | Plan original (fuente de verdad de menús, días, entrenos, metas). |
| `BUILD_PLAN.md`, `PROGRESS.md`, `REQUIREMENTS.md`, `README.md` | Docs del proyecto. |

## 4. Estructura interna de index.html (con líneas aprox.)
- **Config runtime** (~151): `CONFIG` (de `config.js`), `REMOTE` (de `/api/config`), `effectiveSettings()` (prioridad: override local en Ajustes → REMOTE/Vercel → config.js), `aiAvailable()`, `settingSource()`.
- **Capa de datos:** calendario dinámico por perfil (`planStartDate`/`planEndDate`/`planCycleNumber`/`planDurationWeeks`), menús, generadores de entrenamiento, `DAY_TARGET` (fallback sin perfil), `calculateMacroTargets()` y `effectiveDayTarget()` (metas personales exactas).
- **Onboarding:** `renderOnboarding()` guía datos corporales → macros → entrenamiento → logística de comidas → preferencias, permiso esencial, fotos opcionales y evaluación de seguridad. `migrateProfilePrefs()` normaliza el esquema v3 y guarda `timeZone`; `hasCompleteOnboarding()` no bloquea perfiles heredados y `profileReviewDue()` solicita revisión cada 28 días.
- **Cierre de sesión:** `signOutUser()` limpia la UI y el cache del usuario de inmediato, solicita a Supabase un cierre local y elimina la sesión persistida como fallback si la red no responde.
- **Entrenamiento:** cada perfil elige disciplina, fuerza, 3-6 días exactos, lugar por día, minutos, equipo, experiencia, prioridad y limitaciones. `openTrainingPlanGenerator()` prepara semanas validables y `activateTrainingPlanDraft()` inicia la nueva versión en la primera fecha sin entrenamiento registrado. `effectiveWorkout(ds)` resuelve la sesión del snapshot activo, conserva overrides y devuelve `safety_hold` ante una señal de alerta. `workoutPrescription()` convierte la dosis o intervalos activados en pasos recuperables.
- **Lógica de calendario:** `weekOf(ds)`, `dayType(ds)` → PESAS/BAJO/REFEED/DIETBREAK, `buildDay(ds)` arma el día (comidas+entreno); el almuerzo se resuelve desde la DB (`dietLunchDish`) con fallback al plan.
- **Estado/persistencia** (~335): `S` (objeto raíz, cacheado en localStorage), `dayState(ds)` (campos: `meals{id:{done,ovr}}`, `extras[]`, `workoutDone`, `workoutOverride`, `workoutExecution`), `mealState`, `mealValue` (resuelve macros: override manual → DB por `dishName` → fallback plan), `dayTotals(ds)` (suma solo comidas marcadas `done`). `workoutExecution` conserva pasos, series, timer, duración, sustituciones y resultado `completed|partial`.
- **Sincronización con la DB:** `commitDay(ds)`=`save()`+`pushDay(ds)` (upsert a `day_log` con `plan_version_id`); `pullDay(ds)`/`syncDay(ds)` bajan el día; `pushWeight`/`pullWeights`/`syncWeights` para `weight_log`; `pullPlanVersions()`/`ensurePlanVersion()` mantienen el snapshot prescrito. Se llama `commitDay` en cada mutación del día (toggles, reemplazo, editor, sugerencia IA, cambio de entreno) y `syncDay`/`syncWeights` al arrancar, navegar y conectar.
- **Navegación:** `current` (fecha YYYY-MM-DD), `view` (`day|week|foods|weight|settings`), `render()` (dispatcher), `renderTabs()`, `setView()`.
- **Vistas:** `renderDay()` (HOY: dashboard kcal/macros + comidas + extras + entreno + resumen), `renderWeek()`, `renderFoods()` (sub-tabs `platos|ingredientes|dietas`), `renderWeight()` (tabla + gráfico SVG), `renderSettings()`.
- **Comidas:** `mealCard`, `extraCard`, `toggleMeal/Extra/Workout`, `openReplace`/`applyReplace`, `openEditor`/`editorSheet`/`saveEditor` (comidas personalizadas / editar valores).
- **IA (Claude)**: `callClaude(userText,maxTokens,quota)` manda acción, `requestId`, parte, contexto compatible, fallback y reglas de validación. `aiGenerateWeek()` comparte un solo ID para sus siete partes; dobles clicks y reintentos reutilizan la misma solicitud. La vía directa con key local queda como herramienta de desarrollo.
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

### Pendiente / ideas
- **Porciones especiales de REFEED/DIETBREAK:** el almuerzo refeed usa el plato estándar de la DB, sin la doble porción de carbo que indica el plan.
- **¿El cambio de entreno ajusta el tipo de día/metas?** Hoy cambiar pesas↔correr no cambia el tipo de día (sigue por el día de semana). Decidir si debería.
- ~~**Auth de Supabase**~~ ✅ Hecho — multiusuario con login; RLS por usuario y escritura de catálogo solo admin (ver §11b).
- **Editor de dietas** (hoy `foodsDiets` es solo lectura): asignar/editar `diet_dishes` desde la app.
- **Buscar/filtrar** ingredientes y platos; sugerencias por macros restantes.
- **Conflictos de sync:** hoy last-write-wins, sin cola offline (cambios hechos sin red se pueden perder si otro dispositivo escribe).
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
- **Hoy** (`renderHoy`): saludo + racha (`streak()`) + hero (anillo kcal + macros) + tarjeta "dieta de hoy" (→Nutrición) + "entreno de hoy" (→Entreno). Siempre muestra el día actual.
- **Nutrición** (`renderNutrition`): nav de día + hero + comidas del plan + extras + IA.
- **Entreno** (`renderWorkout`): nav de día + prescripción + reproductor recuperable + ejercicio activo con demostración/instrucciones + series o intervalos + cierre completo/parcial + resumen.
- **Progreso** (`renderProgress`): stats (kg/entrenos/racha) + gráfico+tabla de peso + sección Semana (reusa `goDay`/`weekNav`).
- **Perfil** (`renderProfile`): edita macros, logística alimentaria, restricciones, disponibilidad, lugares y recursos → `profiles.prefs`; cuenta + cerrar sesión; Administración solo admin.
- **Coach personalizado:** `buildSysPrompt()` serializa el perfil v3 como JSON estructurado para separar restricciones obligatorias, gustos, recursos y zona horaria.

## 11. Convenciones / gotchas
- **Sin build, sin frameworks.** Todo en `index.html`; las funciones se llaman vía `onclick` inline. Mantener ese estilo (vanilla, español en UI/labels).
- **Fechas como `YYYY-MM-DD`** (helpers `ymd`/`parseYmd`/`addDays`; evitar problemas de timezone usando fecha local).
- **No subir secretos.** Las keys van en env de Vercel. `config.js` se deja vacío. Aunque la publishable de Supabase es pública, no la commitees.
- **Commits:** mensajes en español, con `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Trabajar en `main` y `git push` (dispara deploy).
- **Service worker:** al cambiar `index.html`, los usuarios con SW viejo pueden ver caché; navegaciones son network-first así que se actualiza, pero subir `CACHE_NAME` (vX) fuerza purga.
- **`.claude/` está en `.gitignore`** (config local de Claude Code).
