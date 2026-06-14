# Fitbud — Contexto para continuar el desarrollo

Documento de handoff para retomar el proyecto en otra sesión sin perder contexto.

## 1. Qué es
PWA/app web de un solo `index.html` (vanilla JS, sin frameworks ni build step) que es un tracker del **plan nutricional y de entrenamiento de 10 semanas** (sáb 13 jun 2026 → dom 23 ago 2026). Calcula calorías y macros, tiene funciones de IA (Claude) y una base de datos de alimentos (Supabase).

- **Repo:** https://github.com/jlazoirus/Fitbud (público)
- **En vivo (producción):** https://fitbud-green.vercel.app/
- **Usuario/objetivo:** vegetariano sin huevo, ~180 g proteína/día, déficit agresivo. Plan en `plan-10-semanas-recomposicion.md` (fuente de verdad de menús/entrenos).

## 2. Stack y arquitectura
- **Frontend:** un único `index.html` (HTML+CSS+JS inline). Mobile-first. Sin dependencias salvo `supabase-js` por CDN (jsDelivr).
- **Persistencia:** la **fuente de verdad es Supabase**; `localStorage` (clave `fitbud_v1`) es solo **caché offline** que la espeja. Ningún dato del usuario vive solo en el navegador (el progreso diario va a `day_log` y el peso a `weight_log`). Lo único local-de-dispositivo son los overrides de credenciales en Ajustes (en producción vienen de Vercel).
- **Base de datos:** Supabase (PostgreSQL) — catálogo de alimentos (ingredientes/platos/dietas), consumo diario (`day_log`) y peso (`weight_log`).
- **IA:** Claude vía **proxy serverless** en Vercel (`/api/claude`). La API key nunca llega al navegador.
- **Hosting:** Vercel (estático + funciones en `api/`). No hay build.
- **PWA:** `manifest.webmanifest` + `service-worker.js` + íconos en `assets/`.

> **Macros del día (resuelto):** la vista HOY ya toma los macros de cada comida desde la **base de datos** (calculados por ingredientes), no de valores fijos. `buildDay` asigna a cada comida un `dishName` (nombre canónico del plato en la DB; ver `BREAKFAST_DISHES`, `DINNER_DISHES`, `LUNCH_DISHES`, `DISH_NAMES`), y `mealValue()` resuelve con esta prioridad: **1)** override manual (editar/personalizar) → **2)** macros de la DB por `dishName` → **3)** fallback a `SLOTS` (valores del plan) si la DB no está conectada. `DAY_TARGET` (metas diarias) sí sigue siendo constante del plan, a propósito. La DB se carga al arrancar (`ensureDB()`), no solo en la pestaña Alimentos.

## 3. Mapa de archivos
| Archivo | Qué es |
|---|---|
| `index.html` | **Toda la app** (~1160 líneas): datos, estado, render, vistas, IA, voz, DB, sync. |
| `config.js` | Fallback de config en runtime (`window.FITBUD_CONFIG`). **Vacío en el repo**; producción usa Vercel. |
| `api/claude.js` | Función serverless: proxy a Anthropic. Usa `ANTHROPIC_API_KEY` (env). Whitelist de modelo, clamp de tokens. |
| `api/config.js` | Función serverless: devuelve config pública (URL+publishable key de Supabase, modelo, `proxy:bool`). NO devuelve la key de Claude. |
| `vercel.json` | Deploy estático sin build (`framework:null`, `outputDirectory:"."`). |
| `service-worker.js` | Cache PWA. `index.html`/`config.js` network-first; `/api/*` network-only; assets cache-first; CDN stale-while-revalidate. Caché `fitbud-pwa-v6`. |
| `manifest.webmanifest`, `assets/icon-192.png`, `assets/icon-512.png` | PWA instalable. |
| `supabase/schema.sql` | Esquema completo de la DB (todas las tablas, vista `dish_macros`, RLS). Para instalación nueva. |
| `supabase/seed.sql` | Datos precargados: 55 ingredientes, 43 platos con receta, 4 dietas, 28 almuerzos asignados. Correr después de schema. |
| `supabase/day_log.sql` | Migración incremental: tabla `day_log` (consumo diario). *(Superado por auth.sql, que la recrea por usuario.)* |
| `supabase/weight_log.sql` | Migración incremental: tabla `weight_log` (peso). *(Superado por auth.sql.)* |
| `supabase/auth.sql` | **Multiusuario:** `profiles` (rol admin + prefs), `day_log`/`weight_log` por `user_id`, RLS por usuario y escritura de catálogo solo admin. Correr después de schema/seed. |
| `plan-10-semanas-recomposicion.md` | Plan original (fuente de verdad de menús, días, entrenos, metas). |
| `BUILD_PLAN.md`, `PROGRESS.md`, `REQUIREMENTS.md`, `README.md` | Docs del proyecto. |

## 4. Estructura interna de index.html (con líneas aprox.)
- **Config runtime** (~151): `CONFIG` (de `config.js`), `REMOTE` (de `/api/config`), `effectiveSettings()` (prioridad: override local en Ajustes → REMOTE/Vercel → config.js), `aiAvailable()`, `settingSource()`.
- **Capa de datos** (~198): `START`/`END`, `WEEKS` (11 semanas incl. "Arranque"), `REFEED_DATES`, `BREAKFASTS`/`DINNERS`/`MENUS` (A/B/C/D por día de semana), generadores de entrenamiento, `DAY_TARGET` (metas por tipo de día), `SLOTS` (kcal+macros por slot y tipo de día).
- **Entrenamiento:** cada perfil elige `primarySport` (`running|cycling|swimming`), `strengthMode` (`gym|bodyweight`) y `trainDays` (3-6). `workoutSchedule(days)` define el reparto semanal, `workoutOptions(ds)` genera las sesiones progresivas y `effectiveWorkout(ds)` resuelve overrides diarios. UI: Perfil + `openWorkoutPicker(ds)` + `setWorkout(ds,id)`.
- **Lógica de calendario:** `weekOf(ds)`, `dayType(ds)` → PESAS/BAJO/REFEED/DIETBREAK, `buildDay(ds)` arma el día (comidas+entreno); el almuerzo se resuelve desde la DB (`dietLunchDish`) con fallback al plan.
- **Estado/persistencia** (~335): `S` (objeto raíz, cacheado en localStorage), `dayState(ds)` (campos: `meals{id:{done,ovr}}`, `extras[]`, `workoutDone`, `workoutOverride`), `mealState`, `mealValue` (resuelve macros: override manual → DB por `dishName` → fallback plan), `dayTotals(ds)` (suma solo comidas marcadas `done`).
- **Sincronización con la DB:** `commitDay(ds)`=`save()`+`pushDay(ds)` (upsert a `day_log`); `pullDay(ds)`/`syncDay(ds)` bajan el día; `pushWeight`/`pullWeights`/`syncWeights` para `weight_log`. Se llama `commitDay` en cada mutación del día (toggles, reemplazo, editor, sugerencia IA, cambio de entreno) y `syncDay`/`syncWeights` al arrancar, navegar y conectar.
- **Navegación:** `current` (fecha YYYY-MM-DD), `view` (`day|week|foods|weight|settings`), `render()` (dispatcher), `renderTabs()`, `setView()`.
- **Vistas:** `renderDay()` (HOY: dashboard kcal/macros + comidas + extras + entreno + resumen), `renderWeek()`, `renderFoods()` (sub-tabs `platos|ingredientes|dietas`), `renderWeight()` (tabla + gráfico SVG), `renderSettings()`.
- **Comidas:** `mealCard`, `extraCard`, `toggleMeal/Extra/Workout`, `openReplace`/`applyReplace`, `openEditor`/`editorSheet`/`saveEditor` (comidas personalizadas / editar valores).
- **IA (Claude)** (~619): `callClaude(userText,maxTokens)` → si hay key local llama directo a Anthropic; si no, usa `/api/claude`. `parseJSON()` (limpia ```json). `aiEstimate()` (IA1 estimar comida), `aiSuggest()` (IA2 sugerir), `aiReview()` (IA3 revisar macros). System prompt vegetariano sin huevo.
- **Voz** (~695): `toggleMic()`/`stopMic()` con Web Speech API (`es-PE`, fallback `es-ES`), alimenta el campo del editor.
- **Supabase / Alimentos** (~808): `supa` (cliente), `DB` (cache: ingredients/dishes/dishIng/diets/dietDishes), `supaUrlFrom()` (acepta ID, URL o link dashboard), `supaInit()`, `dbLoad()`, `macrosFromLines()`/`dishMacros()` (cálculo de macros), `foodsDishes/foodsIngredients/foodsDiets`, editores CRUD `editIngredient/saveIngredient/deleteIngredient`, `editDish/dishModal/dishLineSet/saveDish/deleteDish`.
- **Init** (final): `supaInit(); registerServiceWorker(); render(); ensureDB(); syncDay(current); syncWeights();` y de nuevo tras `loadRemoteConfig().then(...)` (por si las credenciales llegan de Vercel).

## 5. Modelo de datos del plan (reglas)
- **Tipos de día:** PESAS (Lun/Mar/Jue/Vie), BAJO (Mié/Sáb/Dom), REFEED (sáb 27 jun, 11 jul, 8 ago, 22 ago), DIETBREAK (toda la semana 6, 20–26 jul).
- **Metas (`DAY_TARGET`):** PESAS 2000/180P/195C/55G · BAJO 1800/180/150/50 · REFEED 2700/160/350/55 · DIETBREAK 2750/170/300/70.
- **Menús (`MENUS`):** A Criollo, B Mediterráneo, C Asiático, D Mexicano — asignados por semana en `WEEKS`. Desayunos/cenas rotan; almuerzo según menú+día (autoritativo desde `diet_dishes` en la DB).
- **Entrenamiento:** plan combinado por perfil: Running/Cycling/Natación + Gimnasio/Peso corporal, entre 3 y 6 días/semana. El reparto aumenta desde 1 full-body + 2 sesiones aeróbicas hasta 4 sesiones de fuerza + calidad + fondo; progresa por bloques durante 10 semanas. Sigue siendo **intercambiable por día** vía `workoutOverride`.

## 6. Base de datos Supabase
Proyecto ref: `wtqnvtixvfapdbzcegdw` (URL en env de Vercel). Tablas:
- `ingredients(id, name, category, kcal, protein_g, carbs_g, fat_g)` — **valores por 100 g**.
- `dishes(id, name, slot, menu, notes)` — platos.
- `dish_ingredients(id, dish_id, ingredient_id, grams)` — receta (líneas).
- `diets(id, code, name, description)` — A/B/C/D.
- `diet_dishes(id, diet_id, dish_id, weekday, slot)` — qué plato cada día.
- `day_log(log_date pk, state jsonb, updated_at)` — consumo del día (comidas/extras/entreno/override) como documento JSON.
- `weight_log(week pk, kg, updated_at)` — peso semanal.
- Vista `dish_macros` — macros calculados por plato (suma de ingredientes), `security_invoker`.
- **RLS:** políticas permiten todo al rol anónimo (publishable key). Para blindar escritura: Supabase Auth + cambiar a `to authenticated`.
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
- **Consumo diario en la DB** — `day_log` + `commitDay`/`pullDay`/`syncDay`. Sincroniza entre dispositivos; localStorage es caché.
- **Peso en la DB** — `weight_log` + `pushWeight`/`pullWeights`/`syncWeights`. Nada del usuario vive solo en el navegador.
- **Plan deportivo configurable** — `primarySport` + `strengthMode` + `trainDays` en `profiles.prefs`; reparto con `workoutSchedule(days)` y sesiones progresivas con `workoutOptions(ds)`.
- **Cambiar el entrenamiento del día** — `effectiveWorkout` + `workoutOverride` (sincroniza vía `day_log`).

### Pendiente / ideas
- **Porciones especiales de REFEED/DIETBREAK:** el almuerzo refeed usa el plato estándar de la DB, sin la doble porción de carbo que indica el plan.
- **¿El cambio de entreno ajusta el tipo de día/metas?** Hoy cambiar pesas↔correr no cambia `DAY_TARGET` (sigue por el día de semana). Decidir si debería.
- ~~**Auth de Supabase**~~ ✅ Hecho — multiusuario con login; RLS por usuario y escritura de catálogo solo admin (ver §11b).
- **Editor de dietas** (hoy `foodsDiets` es solo lectura): asignar/editar `diet_dishes` desde la app.
- **Buscar/filtrar** ingredientes y platos; sugerencias por macros restantes.
- **Conflictos de sync:** hoy last-write-wins, sin cola offline (cambios hechos sin red se pueden perder si otro dispositivo escribe).
- **Mejorar la IA:** que sugiera usando platos reales de la DB; cachear respuestas.

## 11b. Multiusuario, auth y roles (nuevo)
La app ahora es **multiusuario con Supabase Auth** (email + contraseña). Migración: `supabase/auth.sql`.

- **Login obligatorio.** Sin sesión se ve `renderAuth()` (login/registro). En dev local sin credenciales, esa pantalla pide conectar Supabase (URL + publishable key → `S.settings`). En producción las da `/api/config`.
- **Estado:** `session` (Supabase Auth) y `profile` (fila de `profiles`: `is_admin` + `prefs`). `authReady` gatea el render (splash mientras resuelve). `onAuth()` carga perfil + datos al entrar; `setupAuthListener()` reacciona a login/logout/refresh.
- **Datos por usuario:** `day_log`/`weight_log` llevan `user_id`; `pushDay/pullDay/pushWeight/pullWeights` lo incluyen y RLS lo fuerza. `pullAllDays()` baja todo el historial al entrar (racha/stats). Al login se limpia la caché local (`S.days`/`S.weights`) y manda la DB.
- **Roles:** `isAdmin()` = `profile.is_admin`. Para hacer admin a alguien: regístralo y en el SQL Editor `update profiles set is_admin=true where email='...'` (esa es la "consola de administración de usuarios": el dashboard de Supabase).
- **Catálogo compartido:** ingredientes/platos/dietas se leen para cualquier autenticado; escritura solo admin (RLS con `is_admin()`).

### Navegación (nueva IA por rol)
- Tabs de usuario: **Hoy · Nutrición · Entreno · Progreso · Perfil** (`renderTabs`, 5 fijos).
- **Hoy** (`renderHoy`): saludo + racha (`streak()`) + hero (anillo kcal + macros) + tarjeta "dieta de hoy" (→Nutrición) + "entreno de hoy" (→Entreno). Siempre muestra el día actual.
- **Nutrición** (`renderNutrition`): nav de día + hero + comidas del plan + extras + IA.
- **Entreno** (`renderWorkout`): nav de día + tarjeta de entreno + cambiar/volver al plan + resumen.
- **Progreso** (`renderProgress`): stats (kg/entrenos/racha) + gráfico+tabla de peso + sección Semana (reusa `goDay`/`weekNav`).
- **Perfil** (`renderProfile`): preferencias **mixtas** (dieta/objetivo/proteína/alergias + disciplina principal + tipo de fuerza + días/semana + notas libres) → `profiles.prefs` vía `saveProfilePrefs`; cuenta + cerrar sesión; **sección Administración solo admin** con accesos a Alimentos (`renderFoods`) y Ajustes técnicos (`renderSettings`).
- **IA personalizada:** `buildSysPrompt()` arma el system prompt de Claude desde `profile.prefs` (fallback al texto vegetariano por defecto si no hay prefs).

## 11. Convenciones / gotchas
- **Sin build, sin frameworks.** Todo en `index.html`; las funciones se llaman vía `onclick` inline. Mantener ese estilo (vanilla, español en UI/labels).
- **Fechas como `YYYY-MM-DD`** (helpers `ymd`/`parseYmd`/`addDays`; evitar problemas de timezone usando fecha local).
- **No subir secretos.** Las keys van en env de Vercel. `config.js` se deja vacío. Aunque la publishable de Supabase es pública, no la commitees.
- **Commits:** mensajes en español, con `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Trabajar en `main` y `git push` (dispara deploy).
- **Service worker:** al cambiar `index.html`, los usuarios con SW viejo pueden ver caché; navegaciones son network-first así que se actualiza, pero subir `CACHE_NAME` (vX) fuerza purga.
- **`.claude/` está en `.gitignore`** (config local de Claude Code).
