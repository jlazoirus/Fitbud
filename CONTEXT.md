# Fitbud — Contexto para continuar el desarrollo

Documento de handoff para retomar el proyecto en otra sesión sin perder contexto.

## 1. Qué es
PWA/app web de un solo `index.html` (vanilla JS, sin frameworks ni build step) que es un tracker del **plan nutricional y de entrenamiento de 10 semanas** (sáb 13 jun 2026 → dom 23 ago 2026). Calcula calorías y macros, tiene funciones de IA (Claude) y una base de datos de alimentos (Supabase).

- **Repo:** https://github.com/jlazoirus/Fitbud (público)
- **En vivo (producción):** https://fitbud-green.vercel.app/
- **Usuario/objetivo:** vegetariano sin huevo, ~180 g proteína/día, déficit agresivo. Plan en `plan-10-semanas-recomposicion.md` (fuente de verdad de menús/entrenos).

## 2. Stack y arquitectura
- **Frontend:** un único `index.html` (HTML+CSS+JS inline). Mobile-first. Sin dependencias salvo `supabase-js` por CDN (jsDelivr).
- **Persistencia local:** `localStorage` (clave `fitbud_v1`) para el progreso diario (comidas marcadas, extras, peso, overrides locales de credenciales).
- **Base de datos:** Supabase (PostgreSQL) para el catálogo de alimentos (ingredientes/platos/dietas).
- **IA:** Claude vía **proxy serverless** en Vercel (`/api/claude`). La API key nunca llega al navegador.
- **Hosting:** Vercel (estático + funciones en `api/`). No hay build.
- **PWA:** `manifest.webmanifest` + `service-worker.js` + íconos en `assets/`.

> **Macros del día (resuelto):** la vista HOY ya toma los macros de cada comida desde la **base de datos** (calculados por ingredientes), no de valores fijos. `buildDay` asigna a cada comida un `dishName` (nombre canónico del plato en la DB; ver `BREAKFAST_DISHES`, `DINNER_DISHES`, `LUNCH_DISHES`, `DISH_NAMES`), y `mealValue()` resuelve con esta prioridad: **1)** override manual (editar/personalizar) → **2)** macros de la DB por `dishName` → **3)** fallback a `SLOTS` (valores del plan) si la DB no está conectada. `DAY_TARGET` (metas diarias) sí sigue siendo constante del plan, a propósito. La DB se carga al arrancar (`ensureDB()`), no solo en la pestaña Alimentos.

## 3. Mapa de archivos
| Archivo | Qué es |
|---|---|
| `index.html` | **Toda la app** (~1012 líneas): datos, estado, render, vistas, IA, voz, DB. |
| `config.js` | Fallback de config en runtime (`window.FITBUD_CONFIG`). **Vacío en el repo**; producción usa Vercel. |
| `api/claude.js` | Función serverless: proxy a Anthropic. Usa `ANTHROPIC_API_KEY` (env). Whitelist de modelo, clamp de tokens. |
| `api/config.js` | Función serverless: devuelve config pública (URL+publishable key de Supabase, modelo, `proxy:bool`). NO devuelve la key de Claude. |
| `vercel.json` | Deploy estático sin build (`framework:null`, `outputDirectory:"."`). |
| `service-worker.js` | Cache PWA. `index.html`/`config.js` network-first; `/api/*` network-only; assets cache-first; CDN stale-while-revalidate. Caché `fitbud-pwa-v2`. |
| `manifest.webmanifest`, `assets/icon-192.png`, `assets/icon-512.png` | PWA instalable. |
| `supabase/schema.sql` | Esquema de la DB (tablas, vista `dish_macros`, RLS). Correr primero. |
| `supabase/seed.sql` | Datos precargados: 55 ingredientes, 43 platos con receta, 4 dietas, 28 almuerzos asignados. Correr después. |
| `plan-10-semanas-recomposicion.md` | Plan original (fuente de verdad de menús, días, entrenos, metas). |
| `BUILD_PLAN.md`, `PROGRESS.md`, `REQUIREMENTS.md`, `README.md` | Docs del proyecto. |

## 4. Estructura interna de index.html (con líneas aprox.)
- **Config runtime** (~151): `CONFIG` (de `config.js`), `REMOTE` (de `/api/config`), `effectiveSettings()` (prioridad: override local en Ajustes → REMOTE/Vercel → config.js), `aiAvailable()`, `settingSource()`.
- **Capa de datos** (~198): `START`/`END`, `WEEKS` (11 semanas incl. "Arranque"), `REFEED_DATES`, `BREAKFASTS`/`DINNERS`/`MENUS` (A/B/C/D por día de semana), `WORKOUTS`, `DAY_TARGET` (metas por tipo de día), `SLOTS` (kcal+macros por slot y tipo de día).
- **Lógica de calendario:** `weekOf(ds)`, `dayType(ds)` → PESAS/BAJO/REFEED/DIETBREAK, `buildDay(ds)` arma el día (comidas+entreno) generándolo desde las reglas.
- **Estado/persistencia** (~335): `S` (objeto raíz en localStorage), `dayState(ds)`, `mealState`, `mealValue` (aplica overrides `ovr`), `dayTotals(ds)` (suma solo comidas marcadas `done`).
- **Navegación:** `current` (fecha YYYY-MM-DD), `view` (`day|week|foods|weight|settings`), `render()` (dispatcher), `renderTabs()`, `setView()`.
- **Vistas:** `renderDay()` (HOY: dashboard kcal/macros + comidas + extras + entreno + resumen), `renderWeek()`, `renderFoods()` (sub-tabs `platos|ingredientes|dietas`), `renderWeight()` (tabla + gráfico SVG), `renderSettings()`.
- **Comidas:** `mealCard`, `extraCard`, `toggleMeal/Extra/Workout`, `openReplace`/`applyReplace`, `openEditor`/`editorSheet`/`saveEditor` (comidas personalizadas / editar valores).
- **IA (Claude)** (~619): `callClaude(userText,maxTokens)` → si hay key local llama directo a Anthropic; si no, usa `/api/claude`. `parseJSON()` (limpia ```json). `aiEstimate()` (IA1 estimar comida), `aiSuggest()` (IA2 sugerir), `aiReview()` (IA3 revisar macros). System prompt vegetariano sin huevo.
- **Voz** (~695): `toggleMic()`/`stopMic()` con Web Speech API (`es-PE`, fallback `es-ES`), alimenta el campo del editor.
- **Supabase / Alimentos** (~808): `supa` (cliente), `DB` (cache: ingredients/dishes/dishIng/diets/dietDishes), `supaUrlFrom()` (acepta ID, URL o link dashboard), `supaInit()`, `dbLoad()`, `macrosFromLines()`/`dishMacros()` (cálculo de macros), `foodsDishes/foodsIngredients/foodsDiets`, editores CRUD `editIngredient/saveIngredient/deleteIngredient`, `editDish/dishModal/dishLineSet/saveDish/deleteDish`.
- **Init** (final): `supaInit(); registerServiceWorker(); render();` y luego `loadRemoteConfig().then(()=>{supaInit();render();})`.

## 5. Modelo de datos del plan (reglas)
- **Tipos de día:** PESAS (Lun/Mar/Jue/Vie), BAJO (Mié/Sáb/Dom), REFEED (sáb 27 jun, 11 jul, 8 ago, 22 ago), DIETBREAK (toda la semana 6, 20–26 jul).
- **Metas (`DAY_TARGET`):** PESAS 2000/180P/195C/55G · BAJO 1800/180/150/50 · REFEED 2700/160/350/55 · DIETBREAK 2750/170/300/70.
- **Menús (`MENUS`):** A Criollo, B Mediterráneo, C Asiático, D Mexicano — asignados por semana en `WEEKS`. Desayunos/cenas rotan; almuerzo según menú+día.

## 6. Base de datos Supabase
Proyecto ref: `wtqnvtixvfapdbzcegdw` (URL en env de Vercel). Tablas:
- `ingredients(id, name, category, kcal, protein_g, carbs_g, fat_g)` — **valores por 100 g**.
- `dishes(id, name, slot, menu, notes)` — platos.
- `dish_ingredients(id, dish_id, ingredient_id, grams)` — receta (líneas).
- `diets(id, code, name, description)` — A/B/C/D.
- `diet_dishes(id, diet_id, dish_id, weekday, slot)` — qué plato cada día.
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

## 10. Buenos puntos de extensión (ideas para nuevas funcionalidades)
1. ~~Conectar HOY con Supabase~~ ✅ **Hecho** — macros del día desde la DB vía `dishName` + `mealValue()`; el **almuerzo** se lee de `diet_dishes` (`dietLunchDish()`), así reasignar/renombrar el plato en Supabase se refleja. Fallback al plan en código. Pendiente menor: porciones especiales de REFEED/DIETBREAK (el almuerzo refeed usa el plato estándar sin la doble porción).
2b. ~~Historial de consumo en Supabase~~ ✅ **Hecho** — tabla `day_log(log_date pk, state jsonb)`. `commitDay(ds)` sube el estado del día (comidas/extras/entreno) en cada cambio; `syncDay(ds)`/`pullDay(ds)` lo baja al abrir/navegar un día. localStorage queda como caché offline. Migración: `supabase/day_log.sql`. **Pendiente:** el peso (`S.weights`) sigue solo en localStorage; resolución de conflictos es last-write-wins (sin cola offline).
2. **Historial de consumo en Supabase:** hoy el progreso diario vive solo en localStorage. Tabla `log(date, dish_id/custom, grams, done...)` para sync entre dispositivos.
3. **Auth de Supabase** para proteger escritura (multiusuario o solo dueño).
4. **Editor de dietas** (hoy `foodsDiets` es solo lectura): asignar/editar `diet_dishes`.
5. **Buscar/filtrar** ingredientes y platos; búsqueda por macros restantes.
6. **Registro de peso en Supabase** + objetivos; hoy `S.weights` es local.
7. **Mejorar la IA:** que sugiera usando platos reales de la DB; cachear respuestas.

## 11. Convenciones / gotchas
- **Sin build, sin frameworks.** Todo en `index.html`; las funciones se llaman vía `onclick` inline. Mantener ese estilo (vanilla, español en UI/labels).
- **Fechas como `YYYY-MM-DD`** (helpers `ymd`/`parseYmd`/`addDays`; evitar problemas de timezone usando fecha local).
- **No subir secretos.** Las keys van en env de Vercel. `config.js` se deja vacío. Aunque la publishable de Supabase es pública, no la commitees.
- **Commits:** mensajes en español, con `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Trabajar en `main` y `git push` (dispara deploy).
- **Service worker:** al cambiar `index.html`, los usuarios con SW viejo pueden ver caché; navegaciones son network-first así que se actualiza, pero subir `CACHE_NAME` (vX) fuerza purga.
- **`.claude/` está en `.gitignore`** (config local de Claude Code).
