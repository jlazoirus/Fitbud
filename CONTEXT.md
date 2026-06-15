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
- **IA:** Claude vía **proxy serverless** en Vercel (`/api/claude`). La API key nunca llega al navegador. El proxy exige sesión: el cliente manda el token de Supabase en `Authorization: Bearer` y el server lo valida (401 si falta/!válido). Funciones: estimar comida, sugerir, revisar macros y **generar un día completo** (`aiGenerateDay` → `validateGeneratedDay` valida huevo/restricciones/macros/repetición antes de dejar aplicar; se guarda como override por día en `day_log`).
- **Lenguaje de producto:** usuarios normales ven "tu coach", "preparar" y "otra opción"; no ven proveedor, modelo, prompts, tokens ni detalles de configuración. Los errores se neutralizan y el texto dinámico se filtra antes de mostrarlo. Los administradores conservan el diagnóstico técnico en Ajustes.
- **Perfil flexible:** `profiles.prefs` usa `profileSchemaVersion: 2`. Incluye 2-6 comidas, horarios, ventana alimentaria, logística, alergias/gustos separados, días y lugar por sesión, equipo, experiencia, prioridad y limitaciones. Los perfiles antiguos reciben defaults y se persisten al iniciar sesión sin repetir onboarding.
- **Hosting:** Vercel (estático + funciones en `api/`). No hay build.
- **PWA:** `manifest.webmanifest` + `service-worker.js` + íconos en `assets/`.

> **Macros del día (resuelto):** la vista HOY toma los macros de cada comida desde la **base de datos** (calculados por ingredientes), no de valores fijos. `mealValue()` resuelve con esta prioridad: **1)** override manual → **2)** macros de la DB por `dishName` → **3)** fallback a `SLOTS`. Las metas guardadas por el usuario son la fuente directa para Home, Nutrición y generación con IA; `DAY_TARGET` solo se usa como fallback para perfiles que todavía no tienen metas calculadas.

## 3. Mapa de archivos
| Archivo | Qué es |
|---|---|
| `index.html` | **Toda la app** (~1160 líneas): datos, estado, render, vistas, IA, voz, DB, sync. |
| `config.js` | Fallback de config en runtime (`window.FITBUD_CONFIG`). **Vacío en el repo**; producción usa Vercel. |
| `api/claude.js` | Función serverless: proxy a Anthropic. Usa `ANTHROPIC_API_KEY` (env). Whitelist de modelo, clamp de tokens. **Exige sesión:** valida el JWT de Supabase (Bearer → `/auth/v1/user`) antes de llamar a Anthropic; sin token válido responde 401 (falla cerrado). |
| `api/config.js` | Función serverless: devuelve config pública (URL+publishable key de Supabase, modelo, `proxy:bool`). NO devuelve la key de Claude. |
| `api/admin.js` | Función serverless **admin** (REQ-07): listar usuarios paginados, bloquear/desbloquear en Auth + `profiles.active`, cambiar contraseña y enviar reset. Usa `SUPABASE_SERVICE_ROLE_KEY` (solo servidor); valida admin activo, impide auto-desactivación y conserva al último admin. |
| `vercel.json` | Deploy estático sin build (`framework:null`, `outputDirectory:"."`). |
| `service-worker.js` | Cache PWA. `index.html`/`config.js` network-first; `/api/*` network-only; assets cache-first; CDN stale-while-revalidate. Caché `fitbud-pwa-v16`. |
| `manifest.webmanifest`, `assets/icon-192.png`, `assets/icon-512.png` | PWA instalable. El layout respeta `safe-area-inset-*` para no quedar bajo la barra de estado ni el indicador de inicio de iOS. |
| `supabase/schema.sql` | Esquema completo de la DB (todas las tablas, vista `dish_macros`, RLS). Para instalación nueva. |
| `supabase/seed.sql` | Datos precargados: 55 ingredientes, 43 platos con receta, 4 dietas, 28 almuerzos asignados. Correr después de schema. |
| `supabase/day_log.sql` | Migración incremental: tabla `day_log` (consumo diario). *(Superado por auth.sql, que la recrea por usuario.)* |
| `supabase/weight_log.sql` | Migración incremental: tabla `weight_log` (peso). *(Superado por auth.sql.)* |
| `supabase/auth.sql` | **Multiusuario:** `profiles` (rol admin + prefs), `day_log`/`weight_log` por `user_id`, RLS por usuario y escritura de catálogo solo admin. Correr después de schema/seed. |
| `supabase/plan_cycles.sql` | Migración idempotente para ciclos sucesivos: `plan_versions`, `plan_cycles`, `day_log.plan_version_id`, pesos separados por `cycle_start` y bucket privado `progress-photos` con RLS. La duración se infiere de las fechas y se configura en `profiles.prefs.planDurationWeeks`. |
| `plan-10-semanas-recomposicion.md` | Plan original (fuente de verdad de menús, días, entrenos, metas). |
| `BUILD_PLAN.md`, `PROGRESS.md`, `REQUIREMENTS.md`, `README.md` | Docs del proyecto. |

## 4. Estructura interna de index.html (con líneas aprox.)
- **Config runtime** (~151): `CONFIG` (de `config.js`), `REMOTE` (de `/api/config`), `effectiveSettings()` (prioridad: override local en Ajustes → REMOTE/Vercel → config.js), `aiAvailable()`, `settingSource()`.
- **Capa de datos:** calendario dinámico por perfil (`planStartDate`/`planEndDate`/`planCycleNumber`/`planDurationWeeks`), menús, generadores de entrenamiento, `DAY_TARGET` (fallback sin perfil), `calculateMacroTargets()` y `effectiveDayTarget()` (metas personales exactas).
- **Onboarding:** `renderOnboarding()` guía datos corporales → macros → disponibilidad/recursos de entrenamiento → horarios/logística de comidas → preferencias y restricciones. `migrateProfilePrefs()` normaliza el esquema v2; `hasCompleteOnboarding()` no bloquea perfiles heredados y `profileReviewDue()` solicita revisión cada 28 días.
- **Cierre de sesión:** `signOutUser()` limpia la UI y el cache del usuario de inmediato, solicita a Supabase un cierre local y elimina la sesión persistida como fallback si la red no responde.
- **Entrenamiento:** cada perfil elige disciplina, fuerza, 3-6 días exactos, lugar por día, minutos, equipo, experiencia, prioridad y limitaciones. `workoutSchedule()` asigna fuerza/deporte a esos días y prioriza piscina/exterior cuando corresponde; `effectiveWorkout(ds)` conserva overrides diarios.
- **Lógica de calendario:** `weekOf(ds)`, `dayType(ds)` → PESAS/BAJO/REFEED/DIETBREAK, `buildDay(ds)` arma el día (comidas+entreno); el almuerzo se resuelve desde la DB (`dietLunchDish`) con fallback al plan.
- **Estado/persistencia** (~335): `S` (objeto raíz, cacheado en localStorage), `dayState(ds)` (campos: `meals{id:{done,ovr}}`, `extras[]`, `workoutDone`, `workoutOverride`), `mealState`, `mealValue` (resuelve macros: override manual → DB por `dishName` → fallback plan), `dayTotals(ds)` (suma solo comidas marcadas `done`).
- **Sincronización con la DB:** `commitDay(ds)`=`save()`+`pushDay(ds)` (upsert a `day_log` con `plan_version_id`); `pullDay(ds)`/`syncDay(ds)` bajan el día; `pushWeight`/`pullWeights`/`syncWeights` para `weight_log`; `pullPlanVersions()`/`ensurePlanVersion()` mantienen el snapshot prescrito. Se llama `commitDay` en cada mutación del día (toggles, reemplazo, editor, sugerencia IA, cambio de entreno) y `syncDay`/`syncWeights` al arrancar, navegar y conectar.
- **Navegación:** `current` (fecha YYYY-MM-DD), `view` (`day|week|foods|weight|settings`), `render()` (dispatcher), `renderTabs()`, `setView()`.
- **Vistas:** `renderDay()` (HOY: dashboard kcal/macros + comidas + extras + entreno + resumen), `renderWeek()`, `renderFoods()` (sub-tabs `platos|ingredientes|dietas`), `renderWeight()` (tabla + gráfico SVG), `renderSettings()`.
- **Comidas:** `mealCard`, `extraCard`, `toggleMeal/Extra/Workout`, `openReplace`/`applyReplace`, `openEditor`/`editorSheet`/`saveEditor` (comidas personalizadas / editar valores).
- **IA (Claude)** (~619): `callClaude(userText,maxTokens)` → si hay key local llama directo a Anthropic; si no, usa `/api/claude`. `parseJSON()` (limpia ```json). `aiEstimate()` (IA1 estimar comida), `aiSuggest()` (IA2 sugerir), `aiReview()` (IA3 revisar macros). System prompt vegetariano sin huevo.
- **Voz** (~695): `toggleMic()`/`stopMic()` con Web Speech API (`es-PE`, fallback `es-ES`), alimenta el campo del editor.
- **Supabase / Alimentos** (~808): `supa` (cliente), `DB` (cache: ingredients/dishes/dishIng/diets/dietDishes), `supaUrlFrom()` (acepta ID, URL o link dashboard), `supaInit()`, `dbLoad()`, `macrosFromLines()`/`dishMacros()` (cálculo de macros), `foodsDishes/foodsIngredients/foodsDiets`, editores CRUD `editIngredient/saveIngredient/deleteIngredient`, `editDish/dishModal/dishLineSet/saveDish/deleteDish`.
- **Init** (final): `supaInit(); registerServiceWorker(); render(); ensureDB(); syncDay(current); syncWeights();` y de nuevo tras `loadRemoteConfig().then(...)` (por si las credenciales llegan de Vercel).

## 5. Modelo de datos del plan (reglas)
- **Tipos de día:** PESAS (Lun/Mar/Jue/Vie), BAJO (Mié/Sáb/Dom), REFEED (sáb 27 jun, 11 jul, 8 ago, 22 ago), DIETBREAK (toda la semana 6, 20–26 jul).
- **Metas:** el onboarding calcula la meta diaria personal con Katch-McArdle (si hay % de grasa) o Mifflin-St Jeor. `effectiveDayTarget()` devuelve exactamente esas kcal/proteína/carbohidratos/grasas en Home, Nutrición y prompts de IA. `DAY_TARGET` conserva los valores históricos por tipo de día únicamente como fallback.
- **Menús (`MENUS`):** A Criollo, B Mediterráneo, C Asiático, D Mexicano — asignados por semana en `WEEKS`. Desayunos/cenas rotan; almuerzo según menú+día (autoritativo desde `diet_dishes` en la DB).
- **Entrenamiento:** plan combinado por perfil: 4 o 10 semanas, Running/Cycling/Natación + Gimnasio/Peso corporal, entre 3 y 6 días exactos/semana. La prioridad del perfil reparte fuerza y sesiones aeróbicas; natación exige suficientes días con piscina. Sigue siendo **intercambiable por día** vía `workoutOverride`.

## 6. Base de datos Supabase
Proyecto ref: `wtqnvtixvfapdbzcegdw` (URL en env de Vercel). Tablas:
- `ingredients(id, name, category, kcal, protein_g, carbs_g, fat_g)` — **valores por 100 g**.
- `dishes(id, name, slot, menu, notes)` — platos.
- `dish_ingredients(id, dish_id, ingredient_id, grams)` — receta (líneas).
- `diets(id, code, name, description)` — A/B/C/D.
- `diet_dishes(id, diet_id, dish_id, weekday, slot)` — qué plato cada día.
- `day_log(log_date pk, state jsonb, plan_version_id, updated_at)` — consumo del día (comidas/extras/entreno/override) como documento JSON.
- `weight_log(user_id, cycle_start, week, kg, bf_pct)` — peso y grasa semanal separados por ciclo.
- `plan_versions(user_id, cycle_number, version_number, version_key, source, status, valid_from, valid_to, snapshot_hash, snapshot, reason, prompt, model)` — snapshots del plan prescrito por usuario y ciclo.
- `plan_cycles(user_id, cycle_number, start_date, end_date, challenge, summary, photo_path)` — recap e historial.
- Storage privado `progress-photos/<user_id>/cycle-N/...` — fotos de progreso con URLs firmadas.
- Vista `dish_macros` — macros calculados por plato (suma de ingredientes), `security_invoker`.
- **RLS (con `auth.sql` + `admin.sql`):** escritura anónima eliminada. `day_log`/`weight_log`/`plan_versions` solo permiten escritura propia a usuarios activos; catálogo solo a admins activos. El trigger `protect_profile_system_fields` impide que un usuario cambie sus propios campos `is_admin` o `active`; la API admin usa service role.
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
| `SUPABASE_SERVICE_ROLE_KEY` | funciones admin (`/api/admin`) — listar/activar/desactivar/contraseñas | **Sí** (solo servidor) |
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
- **Cambiar el entrenamiento del día** — `effectiveWorkout` + `workoutOverride` (sincroniza vía `day_log`).
- **Onboarding y revisión periódica** — calcula macros, reúne objetivo y preferencias, se activa al primer login y vuelve a preguntar cada 28 días.
- **Perfil flexible v2** — estructura logística de comidas, restricciones duras/blandas y disponibilidad deportiva; migra perfiles existentes y alimenta al coach como JSON.

### Pendiente / ideas
- **Porciones especiales de REFEED/DIETBREAK:** el almuerzo refeed usa el plato estándar de la DB, sin la doble porción de carbo que indica el plan.
- **¿El cambio de entreno ajusta el tipo de día/metas?** Hoy cambiar pesas↔correr no cambia el tipo de día (sigue por el día de semana). Decidir si debería.
- ~~**Auth de Supabase**~~ ✅ Hecho — multiusuario con login; RLS por usuario y escritura de catálogo solo admin (ver §11b).
- **Editor de dietas** (hoy `foodsDiets` es solo lectura): asignar/editar `diet_dishes` desde la app.
- **Buscar/filtrar** ingredientes y platos; sugerencias por macros restantes.
- **Conflictos de sync:** hoy last-write-wins, sin cola offline (cambios hechos sin red se pueden perder si otro dispositivo escribe).
- **Mejorar la IA:** que sugiera usando platos reales de la DB; cachear respuestas.

## 11b. Multiusuario, auth y roles (nuevo)
La app ahora es **multiusuario con Supabase Auth** (email + contraseña). Migración: `supabase/auth.sql`.

- **Login obligatorio.** Sin sesión se ve `renderAuth()` (login/registro). En dev local sin credenciales, esa pantalla pide conectar Supabase (URL + publishable key → `S.settings`). En producción las da `/api/config`.
- **Estado:** `session` (Supabase Auth) y `profile` (fila de `profiles`: `is_admin` + `prefs`). `authReady` gatea el render (splash mientras resuelve). `onAuth()` carga perfil + datos al entrar; `setupAuthListener()` reacciona a login/logout/refresh.
- **Datos por usuario:** `day_log`/`weight_log`/`plan_versions` llevan `user_id`; `pushDay/pullDay/pushWeight/pullWeights` lo incluyen y RLS lo fuerza. `pullAllDays()` baja todo el historial al entrar (racha/stats). Al login se limpia la caché local (`S.days`/`S.weights`) y manda la DB.
- **Roles:** `isAdmin()` = `profile.is_admin`; `isActive()` controla acceso a la app. El primer admin se promueve por SQL (`update profiles set is_admin=true where email='...'`). Después, Perfil → Usuarios permite activar/desactivar y gestionar contraseñas.
- **Catálogo compartido:** ingredientes/platos/dietas se leen para cualquier autenticado; escritura solo admin (RLS con `is_admin()`).

### Navegación (nueva IA por rol)
- Tabs de usuario: **Hoy · Nutrición · Entreno · Progreso · Perfil** (`renderTabs`, 5 fijos).
- **Hoy** (`renderHoy`): saludo + racha (`streak()`) + hero (anillo kcal + macros) + tarjeta "dieta de hoy" (→Nutrición) + "entreno de hoy" (→Entreno). Siempre muestra el día actual.
- **Nutrición** (`renderNutrition`): nav de día + hero + comidas del plan + extras + IA.
- **Entreno** (`renderWorkout`): nav de día + tarjeta de entreno + cambiar/volver al plan + resumen.
- **Progreso** (`renderProgress`): stats (kg/entrenos/racha) + gráfico+tabla de peso + sección Semana (reusa `goDay`/`weekNav`).
- **Perfil** (`renderProfile`): edita macros, logística alimentaria, restricciones, disponibilidad, lugares y recursos → `profiles.prefs`; cuenta + cerrar sesión; Administración solo admin.
- **Coach personalizado:** `buildSysPrompt()` serializa el perfil v2 como JSON estructurado para separar restricciones obligatorias, gustos y recursos.

## 11. Convenciones / gotchas
- **Sin build, sin frameworks.** Todo en `index.html`; las funciones se llaman vía `onclick` inline. Mantener ese estilo (vanilla, español en UI/labels).
- **Fechas como `YYYY-MM-DD`** (helpers `ymd`/`parseYmd`/`addDays`; evitar problemas de timezone usando fecha local).
- **No subir secretos.** Las keys van en env de Vercel. `config.js` se deja vacío. Aunque la publishable de Supabase es pública, no la commitees.
- **Commits:** mensajes en español, con `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Trabajar en `main` y `git push` (dispara deploy).
- **Service worker:** al cambiar `index.html`, los usuarios con SW viejo pueden ver caché; navegaciones son network-first así que se actualiza, pero subir `CACHE_NAME` (vX) fuerza purga.
- **`.claude/` está en `.gitignore`** (config local de Claude Code).
