# Backlog de la migración nativa (NAT)

Especificación de cada tarea. Estado, dependencias, alcance de escritura (`paths`) y dueño viven en `native-migration.json`; este archivo dice **qué** hay que hacer y **cómo se verifica**. Cómo se trabaja en paralelo: `NATIVE_AGENT.md`. Contexto y decisiones: `PLAN.md` y `ADR-001-stack.md`.

Convenciones para todas las tareas:

- "Verde web" = `node scripts/release-gate.mjs` en verde (incluye E2E Playwright) y `CACHE_NAME` subido si cambió el shell PWA.
- "Verde nativo" = en `native/`: `npm run typecheck && npm run lint && npm test` en verde, más `node scripts/validate-native-copy.mjs` cuando exista (NAT-28).
- Una tarea de extracción (`core`) **no cambia comportamiento visible**: mueve código, lo hace puro e inyecta efectos. Si encuentra un bug, lo registra como candidato y no lo arregla en la misma tarea.
- Una tarea de pantalla (`feature`) no reimplementa reglas de negocio: consume `native/src/core` y `native/src/data`. Si falta algo del dominio, se crea una tarea `core` nueva en vez de copiar lógica.
- Textos visibles en español, con el mismo copy que la web salvo razón explícita; REQ-31 aplica.

---

## Fase 0 — Decisiones humanas

## NAT-H1 — Aprobar ADR-001: Expo / React Native en native/

- **Decide:** aceptar `docs/native-migration/ADR-001-stack.md` o pedir cambios.
- **Material:** `PLAN.md` §3 y ADR-001.
- **Al cerrar:** cambiar el estado del ADR a "aceptado" y ejecutar `node scripts/native-next-task.mjs --done NAT-H1 --human`.

## NAT-H2 — Cuentas Apple Developer y Google Play; bundle id y Team ID

- **Decide:** titular de las cuentas (persona o empresa), bundle id / package name (sugerido `club.evolvapp.app`), nombre comercial en tiendas.
- **Entrega para agentes:** Team ID de Apple y huella SHA-256 del certificado de firma de Android anotados en `docs/native-migration/decisions.md` (son públicos; nunca credenciales ni llaves privadas).

## NAT-H3 — Modelo de cobro dentro de las apps (compra integrada vs. sin compra in-app)

- **Decide:** cómo se compra el acceso desde iOS/Android. Opciones: (a) compra integrada de cada tienda con intermediario (RevenueCat u otro), (b) compra integrada directa (StoreKit 2 / Play Billing + verificación en servidor), (c) app sin compra integrada en una primera beta, usando solo entitlements existentes.
- **Insumos:** precios y duración de los planes actuales (`supabase/entitlements.sql`), políticas vigentes de App Store (3.1.1, 3.1.3) y Google Play (Payments) por país objetivo, comisiones.
- **Recomendación del plan:** (a) o (b) para lanzamiento público; (c) aceptable solo para beta cerrada. Validar si los cupones propios pueden canjearse dentro de la app bajo la política vigente.
- **Entrega:** decisión registrada en `docs/native-migration/decisions.md` con productos (ids) por plataforma.

## NAT-H4 — Revisión legal de privacidad para tiendas y excepción acotada a REQ-31

- **Decide:** texto de consentimiento y política de privacidad para tiendas; si se aprueba una excepción a REQ-31 limitada al texto legal (divulgación de procesamiento por proveedores de IA de terceros exigida por App Store 5.1.2(i)); disclaimer médico; edad mínima (18) y clasificación.
- **Insumos:** `PRIVACY.md`, flujo de consentimientos actual, `NAT-62` (borrador de formularios).
- **Entrega:** textos aprobados en `docs/native-migration/decisions.md` y, si cambia la web, un REQ en `REQUIREMENTS.md`.

## NAT-H5 — Credenciales Expo/EAS, Firebase (FCM) y llave APNs

- **Decide/crea:** cuenta Expo y proyecto EAS, proyecto Firebase para FCM, llave APNs (.p8). Se cargan como credenciales/secretos de EAS. Nada de esto entra al repo.
- **Entrega:** `projectId` de EAS (público) en `docs/native-migration/decisions.md`.

## NAT-H6 — Aplicar en producción las migraciones SQL de la migración nativa

- **Hace:** revisar y ejecutar en Supabase producción `supabase/native_push_tokens.sql` (NAT-11) y, cuando exista, `supabase/native_entitlements.sql` (NAT-13); agregar las URLs de redirección nativas (NAT-12) a la allowlist de Auth.
- **Verifica:** `supabase/validate.sql` y una lectura del propio usuario con RLS.

## NAT-H7 — Aprobar fichas de tienda, capturas, clasificación y formularios de privacidad

- **Hace:** revisar `docs/native-migration/store-listing.md` (NAT-62), completar etiquetas de privacidad de App Store, Data safety y declaración de apps de salud de Google Play, clasificación de edad.

## NAT-H8 — Go/no-go: envío a beta y a público; convivencia con la PWA

- **Hace:** ejecutar `eas build`/`eas submit` con la checklist de NAT-63, invitar testers, decidir paso a público y la política de convivencia de la PWA (recomendado: mantenerla).

---

## Fase 1 — Núcleo compartido

## NAT-01 — Inventario del dominio que vive en index.html y plan de extracción

- **Objetivo:** mapa verificable de toda la lógica no visual de `index.html` que una pantalla nativa necesitaría, para que NAT-03..09 extraigan sin adivinar.
- **Alcance:** crear `docs/native-migration/core-inventory.md` con, por función: nombre, línea, módulo destino (`day-model`, `plan-calendar`, `progress-metrics`, `sync-queue`, `api-client`, `profile-model`, `plan-orchestrator` o "se queda en UI"), globals que lee/escribe (`S`, `DB`, `REMOTE`, `profile`, `supa`, `current`, `view`, `UI`), efectos (DOM, `localStorage`, red, `Date.now`) y llamadores. Punto de partida: `buildDay` (`index.html:1784`), `dayState` (`:2206`), `mealValue` (`:2310`), `dayTotals` (`:2344`), `effectiveDayTarget` (`:1525`), `effectiveWorkout` (`:1498`), `weekOf` (`:1774`), `migrateProfilePrefs` (`:997`), `hasCompleteOnboarding` (`:2638`), `profileReviewDue` (`:2649`), `streakStats`/`streak` (`:10099`/`:10167`), `prepareFirstCycleWeek` (`:3468`), `finalizeDayWithGate` (`:8471`), `callClaude` (`:8389`), `pushDay`/`pullDay`/`commitDay`/`syncDay` (`:10717`-`:10806`), `workoutPrescription` (`:4540`), `activateTrainingPlanDraft` (`:10644`).
- **Fuera de alcance:** mover código.
- **Aceptación:** cada módulo destino tiene lista de funciones, orden de extracción sin ciclos y riesgos; las líneas citadas existen en `HEAD`.
- **Verificación:** muestreo de 10 referencias contra `HEAD`; `node scripts/native-next-task.mjs --validate`.

## NAT-02 — Validador de portabilidad de módulos puros (Node/Hermes, sin DOM)

- **Objetivo:** garantizar que los módulos compartidos cargan fuera del navegador y no usan APIs web.
- **Alcance:** `scripts/validate-shared-modules.mjs` que, para cada módulo compartido (los 7 actuales + los nuevos de `js/` que declaren el comentario `// shared-module`): (1) falla si el código usa `window.`, `document`, `localStorage`, `sessionStorage`, `location`, `navigator`, `fetch(` o `XMLHttpRequest` fuera de la detección `typeof window!=="undefined"?window:globalThis`; (2) los carga con `node:vm` en un contexto con solo `globalThis`/`console`/`Intl`/`Date`/`Math`/`JSON` y verifica que publican su namespace (`FITBUD_*`). Agregarlo a `scripts/release-gate.mjs`.
- **Aceptación:** pasa con los módulos actuales; falla con un fixture que use `document`.
- **Verificación:** verde web; el script incluye un auto-test del caso negativo.

## NAT-03 — Extraer modelo de día a js/day-model.js

- **Objetivo:** `dayState`, `mealValue`, `dayTotals` y el núcleo de `buildDay` como funciones puras que reciben `state`, `catalog`, `planVersions` y `prefs` explícitos.
- **Alcance:** nuevo `js/day-model.js` (IIFE, `FITBUD_DAY_MODEL`, comentario `// shared-module`), `index.html` delega en él manteniendo nombres públicos, `<script src>` y `APP_SHELL`/`CACHE_NAME` en `service-worker.js`, validador `scripts/validate-day-model.mjs` (casos: override > nutritionPlan > vacío, totales solo `done`, comidas saltadas, porciones escaladas REQ-154/162) en el release gate.
- **Fuera de alcance:** render, sync, cambios de comportamiento.
- **Aceptación:** E2E sin cambios; NAT-02 pasa con el módulo nuevo.
- **Verificación:** verde web.

## NAT-04 — Extraer calendario de ciclo y metas a js/plan-calendar.js

- **Objetivo:** fechas de ciclo (`planStartDate`/`planEndDate`/`planCycleNumber`/`planDurationWeeks`), `weekOf`, tipo de día, `effectiveDayTarget` y la resolución pura de `effectiveWorkout` desde snapshot, con la fecha "hoy" inyectada (sin `Date` UTC accidental).
- **Alcance:** `js/plan-calendar.js`, delegación en `index.html`, `service-worker.js`, `scripts/validate-plan-calendar.mjs` (zonas horarias, ciclos 4/10, día fuera de ciclo, `safety_hold`).
- **Aceptación/verificación:** como NAT-03.

## NAT-05 — Extraer racha, adherencia y recap a js/progress-metrics.js

- **Objetivo:** `streakStats`/`streak`, adherencia, recap de cierre de ciclo y mapeo de check-in (`test-checkin-goal-mapping.mjs`) puros.
- **Alcance:** `js/progress-metrics.js`, delegación, `service-worker.js`, `scripts/validate-progress-metrics.mjs` (REQ-161: comidas de 0 kcal no inflan; REQ-163: sesión abandonada no cuenta; REQ-165: escalas sin responder).
- **Aceptación/verificación:** como NAT-03.

## NAT-06 — Extraer cola offline y sync de day_log/weight_log a js/sync-queue.js con storage inyectado

- **Objetivo:** cola `fitbud_syncq_v1`, metadatos y `pushDay`/`pullDay`/`pushWeight`/`pullWeights` como lógica pura sobre dos puertos: `storage` (get/set/remove asíncronos) y `remote` (upsert/select). Usa `sync-conflicts.js`.
- **Alcance:** `js/sync-queue.js`, adaptadores web (`localStorage`, supabase-js) dentro de `index.html`, `service-worker.js`, `scripts/validate-sync-queue.mjs` (pending/failed/conflict, reintentos, purga al cambiar de usuario — REQ-156, aislamiento por `user_id`).
- **Aceptación:** `test-sync-conflicts.mjs` y `sync-isolation.spec.js` siguen verdes; el módulo no conoce `localStorage` ni `supa`.
- **Verificación:** verde web.

## NAT-07 — Extraer cliente de /api/* a js/api-client.js con baseUrl y token inyectados

- **Objetivo:** un cliente único para `/api/config`, `/api/claude`, `/api/entitlement`, `/api/privacy`, `/api/push-subscribe`, `/api/analytics`, `/api/catalog`, `/api/checkout` con `baseUrl` (web: `""`, nativo: `https://evolvapp.club`), `getAccessToken()` y cabeceras de cliente (`X-Evolv-Client`, `X-Evolv-App-Version`) inyectados. Incluye `requestId` idempotente y manejo de paywall/cuota que hoy hace `callClaude` (sin la parte de UI).
- **Alcance:** `js/api-client.js`, delegación en `index.html`, `service-worker.js` (sin cachear `/api/*`), `scripts/validate-api-client.mjs` con `fetch` simulado (401, 402/paywall, timeout, JSON inválido).
- **Fuera de alcance:** `/api/admin` (admin queda web).
- **Aceptación/verificación:** como NAT-03; ninguna clave secreta en el módulo.

## NAT-08 — Extraer modelo de perfil y onboarding a js/profile-model.js

- **Objetivo:** `migrateProfilePrefs` (schema v3), `hasCompleteOnboarding`, `profileReviewDue`, `needsProfileTuning`, defaults y la normalización de lo que leen `readOnboardingStep`/`readTrainingFields` (a partir de un objeto plano, no del DOM), más el armado de `prefs` que hoy hace `saveOnboarding`.
- **Alcance:** `js/profile-model.js`, delegación, `service-worker.js`, `scripts/validate-profile-model.mjs` (perfiles heredados, `strength_only`, `trainingSafetyMode`, 2–6 comidas, zona horaria).
- **Aceptación/verificación:** como NAT-03; `validate-onboarding-*.mjs` siguen verdes.

## NAT-09 — Extraer orquestación de preparación de planes a js/plan-orchestrator.js

- **Objetivo:** que nativo pueda preparar el primer ciclo, una semana o un día con la misma lógica que la web: `prepareFirstCycleWeek`, generación día/semana con `finalizeDayWithGate`, `deterministicDaysForWeek`, guardado de snapshot en `plan_versions` y aplicación a `day_log`, con progreso por callbacks y dependencias inyectadas (`api`, `repo`, `catalog`, `now`).
- **Alcance:** `js/plan-orchestrator.js`, delegación, `service-worker.js`, `scripts/validate-plan-orchestrator.mjs` (coach OK, coach inválido → determinista, cuota agotada → pool/determinista, fallo parcial → reintento sin Home vacío — REQ-118).
- **Aceptación:** `validate-onboarding-first-week.mjs`, `validate-nutrition-finalize-wiring.mjs` y E2E de onboarding siguen verdes.
- **Verificación:** verde web.

---

## Fase 2 — Backend para clientes nativos

## NAT-10 — API lista para clientes nativos: cabeceras de cliente/versión, config nativa y analytics

- **Objetivo:** que el backend distinga web/iOS/Android, pueda exigir una versión mínima y mida por plataforma.
- **Alcance:** `api/config.js` agrega `native: { minVersion, latestVersion, adminUrl }` (desde env, con defaults seguros); `api/analytics.js` acepta `platform` (`web|ios|android`) y `app_version` en la allowlist sin otros campos nuevos; documentar en `supabase/analytics.sql` si se necesita columna (idempotente). Revisar que ningún endpoint de usuario dependa de `Origin`/cookies (hoy `api/admin.js:710` lee `origin`; admin queda web). `scripts/test-native-api-headers.mjs` en el release gate.
- **Aceptación:** peticiones sin `Origin` con Bearer válido funcionan en todos los endpoints de usuario; analytics rechaza campos fuera de allowlist.
- **Verificación:** verde web.

## NAT-11 — Push nativo: tokens de dispositivo, suscripción y envío vía Expo Push

- **Objetivo:** recordatorios y push de racha en iOS/Android reutilizando el cron actual.
- **Alcance:** `supabase/native_push_tokens.sql` idempotente con RLS (`device_push_tokens(user_id, platform, token unique, provider default 'expo', app_version, created_at, last_seen_at)`), espejo en `supabase/schema.sql`; `api/push-subscribe.js` acepta `{ kind: "expo", token, platform }` además de Web Push; `api/notify.js` envía a tokens Expo con `fetch` a la API de Expo Push (sin SDK nuevo), mismo texto REQ-31, misma idempotencia de `notification_log`, borra tokens con `DeviceNotRegistered`. `scripts/test-native-push.mjs` con `fetch` simulado.
- **Fuera de alcance:** aplicar la migración en producción (NAT-H6).
- **Aceptación:** Web Push sigue igual; un usuario con ambos canales recibe uno por tipo y día según preferencias.
- **Verificación:** verde web; `validate-migrations.mjs` acepta la migración.

## NAT-12 — Deep links y Universal/App Links para correos de auth

- **Objetivo:** que confirmar correo, recuperar contraseña e invitación abran la app si está instalada y la web si no.
- **Alcance:** `.well-known/apple-app-site-association` (sin extensión, `application/json`) con `appIDs` del Team ID de NAT-H2 y componentes para `/?auth=*`; `.well-known/assetlinks.json` con la huella de NAT-H2; `vercel.json` (headers de content-type); `.vercelignore` reincluye `/.well-known`; `scripts/validate-deploy-allowlist.mjs` los reconoce; `scripts/validate-native-links.mjs` valida JSON y que no haya comodines peligrosos. Documentar URLs a agregar en Supabase Auth (acción manual NAT-H6).
- **Aceptación:** la web sigue manejando `?auth=` igual cuando la app no está.
- **Verificación:** verde web; validador del AASA.

## NAT-13 — Entitlements multi-origen y webhook de compras de tienda

- **Objetivo:** que una compra en App Store/Google Play active el mismo `entitlements` que Stripe.
- **Alcance (según NAT-H3):** `supabase/native_entitlements.sql` (permitir `origin in ('apple','google')`, ids de transacción únicos, idempotencia de eventos), `api/store-webhook.js` (RevenueCat webhook o App Store Server Notifications v2 + Google RTDN, con verificación de firma), `api/entitlement.js` expone el origen en el estado; `scripts/test-store-webhook.mjs` con eventos simulados (compra, reembolso, expiración, evento duplicado).
- **Aceptación:** reembolso revoca; evento repetido no duplica; Stripe sin cambios (`test-webhook-*.mjs` verdes).
- **Verificación:** verde web.

---

## Fase 3 — Fundación nativa

## NAT-20 — Scaffold de la app Expo en native/ con TS, expo-router, lint, tests y perfiles EAS

- **Objetivo:** proyecto base compilable que cualquier agente pueda levantar.
- **Alcance:** `native/` con Expo SDK estable, TypeScript estricto, expo-router (grupos `(auth)`, `(onboarding)`, `(tabs)`), ESLint + Prettier, `jest-expo`, scripts `typecheck`, `lint`, `test`, `start`; `app.config.ts` con nombre Evolv, esquema `evolv`, bundle id desde env con default `club.evolvapp.app`, colores `#101010`, iconos desde `assets/`; `eas.json` con perfiles `development`, `preview`, `production` sin secretos; `native/README.md` con cómo correrlo; `.gitignore` para `native/node_modules`, `.expo`, builds. Completar "Versiones fijadas" en ADR-001.
- **Aceptación:** `npm ci && npm run typecheck && npm run lint && npm test` en verde en limpio; `native/` no aparece en el deploy de Vercel (`validate-deploy-allowlist.mjs` verde).
- **Verificación:** verde nativo y verde web.

## NAT-21 — Puente tipado hacia los módulos de dominio de la raíz

- **Objetivo:** importar el dominio compartido desde nativo sin copiarlo.
- **Alcance:** `native/metro.config.js` con `watchFolders` a la raíz del repo; `native/src/core/index.ts` importa por efecto lateral `../../../js/nutrition-pure.js` (y los demás, en el orden que exige cada módulo) y exporta fachadas tipadas desde `globalThis.FITBUD_*`; `native/src/core/types/*.d.ts` para las funciones usadas; tests jest que ejecutan casos reales (macros de un plato, validación de plan de entreno, reducer del reproductor, merge de sync).
- **Fuera de alcance:** módulos aún no extraídos (se agregan en la tarea feature que los necesite, una línea).
- **Aceptación:** tests verdes en jest y la app arranca en Hermes con los módulos cargados.
- **Verificación:** verde nativo.

## NAT-22 — Design system Evolv nativo: tokens, tipografías y componentes base

- **Objetivo:** misma identidad que la web (REQ-180): acento lima `--accent`, `--on-accent`, fondo `#101010`, Unbounded (títulos) y Manrope (texto), marca `brandMark()`.
- **Alcance:** `native/src/ui/tokens.ts` derivado de las variables CSS de `index.html`; fuentes con `expo-font`; componentes `Screen`, `Text`, `Button`, `Card`, `Sheet` (bottom sheet), `ListRow`, `Field`, `PasswordField` (equivalente a `passwordField()`/REQ-113), `MacroRing`, `ProgressBar`, `Toast`, `Chip`, `EmptyState`; página de catálogo de componentes en una ruta de desarrollo.
- **Aceptación:** contraste AA, objetivos táctiles ≥44 pt, respeta safe areas; snapshots de componentes.
- **Verificación:** verde nativo + capturas iOS/Android adjuntas al PR.

## NAT-23 — Auth y sesión: login, registro, recuperación, invitación y cierre de sesión

- **Objetivo:** paridad con el acceso web.
- **Alcance:** cliente Supabase con `react-native-url-polyfill`, almacenamiento de sesión cifrado (llave en `expo-secure-store`), `autoRefreshToken` ligado a `AppState`; pantallas login/registro/olvidé contraseña/crear contraseña desde invitación (REQ-167: sin errores crudos como "Auth session missing!"); manejo de enlaces `evolv://` y, cuando exista NAT-12, Universal Links; cierre de sesión que purga caché y cola del usuario (REQ-156) incluso sin red; cuenta desactivada → mensaje claro.
- **Aceptación:** sesión persiste entre reinicios; cerrar sesión deja el almacenamiento sin datos del usuario anterior.
- **Verificación:** verde nativo; prueba manual con cuenta QA documentada en el PR.

## NAT-24 — Capa de datos offline: repositorios, cola de sync y aislamiento por usuario

- **Objetivo:** que las pantallas lean/escriban días, peso, perfil y versiones de plan con soporte offline usando `js/sync-queue.js`.
- **Alcance:** adaptador de almacenamiento (MMKV o SQLite; registrar la elección en ADR-001) con espacio por `user_id`; repositorios `profile`, `dayLog`, `weightLog`, `planVersions`, `catalog` (caché de `ingredients`/`dishes`/`exercises` con versión); reconexión con NetInfo y al volver a primer plano; hooks de lectura (`useDay(ds)`, `useProfile()`…).
- **Aceptación:** offline → registrar comida → reconectar → `day_log` actualizado sin pisar cambios remotos (casos de `sync-conflicts.js`); dos usuarios en el mismo dispositivo no ven datos del otro.
- **Verificación:** verde nativo con tests de repositorio sobre almacenamiento y remoto simulados.

## NAT-25 — Shell de navegación, tabs y gating auth → consentimiento → onboarding → app

- **Objetivo:** esqueleto navegable igual a la web: tabs Hoy, Nutrición, Entreno, Progreso, Perfil.
- **Alcance:** `app/_layout.tsx` con proveedores (sesión, datos, tema), splash hasta tener sesión y perfil, redirecciones según `hasCompleteOnboarding`, consentimientos vigentes y `trainingSafetyHold`; `(tabs)/_layout.tsx` con iconos equivalentes a `tabIcon()`; error boundary con reintento; pantalla "sin conexión" no bloqueante.
- **Aceptación:** un usuario sin onboarding nunca ve tabs; uno con onboarding nunca vuelve a onboarding salvo nuevo ciclo.
- **Verificación:** verde nativo.

## NAT-26 — Telemetría y reporte de errores sin datos sensibles

- **Objetivo:** medir activación/retención y detectar errores por plataforma sin violar privacidad.
- **Alcance:** cliente de `/api/analytics` (vía `js/api-client.js`) con los mismos eventos que la web + `platform`/`app_version`; captura de errores JS no controlados enviada como evento técnico sin stack con datos de usuario; cola de eventos offline con límite.
- **Fuera de alcance:** SDKs de analytics/crash de terceros (prohibidos por ADR-001 salvo decisión explícita).
- **Aceptación:** test que verifica que ningún evento lleva campos fuera de la allowlist.
- **Verificación:** verde nativo.

## NAT-27 — CI nativo en GitHub Actions (typecheck, lint, tests, validadores compartidos)

- **Objetivo:** que cada PR que toque `native/`, `js/` o los módulos compartidos corra los checks.
- **Alcance:** `.github/workflows/native-ci.yml`: Node LTS, caché npm, `npm ci` en `native/`, typecheck/lint/test, `node scripts/validate-shared-modules.mjs`, `node scripts/native-next-task.mjs --validate`, `node scripts/validate-native-copy.mjs` (si existe). Sin secretos ni builds EAS.
- **Aceptación:** el workflow corre en un PR de prueba y falla si se rompe un test.
- **Verificación:** run verde enlazado en el PR.

## NAT-28 — Validador REQ-31 para textos de la app nativa

- **Objetivo:** que la UI nativa no mencione IA, Claude, Anthropic, modelo, prompt, token, cuota ni proveedor.
- **Alcance:** `scripts/validate-native-copy.mjs` que recorre `native/app/**` y `native/src/**` (excluye tests y `src/core/types`) buscando literales visibles con ese vocabulario (insensible a mayúsculas/acentos, con lista de excepciones explícita y comentada para identificadores internos); se agrega al release gate y a NAT-27.
- **Aceptación:** falla con un fixture que muestre "IA" en un `<Text>`; pasa con el scaffold.
- **Verificación:** verde web.

---

## Fase 4 — Paridad por journey

Cada tarea de esta fase entrega pantallas completas con estados de carga, vacío, error y offline, y adjunta capturas iOS y Android al PR. Marca su fila en `PARITY.md`.

## NAT-30 — Onboarding, consentimientos y evaluación de seguridad

- **Objetivo:** el onboarding de 4 pasos de la web (REQ-35/55/114/115/116) en nativo.
- **Alcance:** pasos datos corporales, objetivo y macros (Katch-McArdle/Mifflin vía `calculateMacroTargets`), entrenamiento esencial (selector de cardio REQ-45, lugar de fuerza, días/lugar, avanzado colapsado), alimentación + alergias + privacidad; consentimiento esencial + fotos opcional versionados (`user_consents`); evaluación de seguridad (`safety_screenings`) con red flags → pausa de rutinas; edad mínima 18; guardado con `js/profile-model.js`. Copy idéntico al de la web salvo lo que cambie NAT-H4.
- **Aceptación:** un perfil creado en nativo es válido en la web y viceversa; aviso cardiovascular (`showCardioNudge`) una sola vez.
- **Verificación:** verde nativo; test de perfil producido vs. `validate-profile-model.mjs`.

## NAT-31 — Preparación del primer ciclo (nutrición + entreno) con progreso y reintento

- **Objetivo:** paridad con REQ-118: tras el onboarding se prepara semana de nutrición y plan de entreno con progreso visible y fallback determinista.
- **Alcance:** pantalla de preparación que usa `js/plan-orchestrator.js` vía `native/src/core`; estados parcial/fallo con reintento; nunca deja Hoy vacío; capa de espera bloqueante equivalente a REQ-175.
- **Aceptación:** con API simulada en fallo, el usuario termina con un plan determinista.
- **Verificación:** verde nativo con tests del flujo y API simulada.

## NAT-32 — Hoy: anillo de macros, comidas, entreno del día, racha y avisos

- **Objetivo:** la vista Hoy de la web (anillo de macros primero — REQ-124).
- **Alcance:** anillo kcal + barras de macros (proteína destacada por ritmo), lista de comidas del día (marcar hecha, saltar), entreno del día con acceso al reproductor, racha, banner "Afina tu plan", aviso de revisión de 4 semanas, navegación día anterior/siguiente; datos desde `day-model`, `plan-calendar`, `progress-metrics`.
- **Aceptación:** mismos totales que la web para el mismo día y cuenta (comparar con `dayTotals`).
- **Verificación:** verde nativo.

## NAT-33 — Nutrición del día: marcar, cambiar comida, rehacer opciones, extras, recientes/favoritas, alimento por gramos

- **Objetivo:** paridad con la pestaña Nutrición diaria.
- **Alcance:** tarjetas de comida con macros materializados (REQ-154/162), "Cambiar comida" con 4 deltas de macro y aviso, "Rehacer opciones" hasta 4 por día (`meal_option`, fallback de catálogo), revertir, extras, editor manual de valores y porciones (REQ-90), selector rápido Recientes/Favoritas/Alimento por gramos (REQ-188), reordenar/saltar (REQ-125) y cierre del día con `finalizeDayWithGate` vía core.
- **Aceptación:** cambiar una comida en nativo se ve igual en la web tras sync.
- **Verificación:** verde nativo.

## NAT-34 — Nutrición semanal: preparar semana, revisión, lista de compras y aplicar

- **Objetivo:** paridad con `aiGenerateWeek`/`genWeekReviewHtml`/`applyWeekPlan`.
- **Alcance:** preparar semana (orquestador), revisión con resumen kcal/proteína promedio, avisos de variedad y aviso suave de contrato (REQ-139), regenerar un día, lista de compras agregada (compartible con `expo-sharing`), aplicar con confirmación (no reescribe días pasados).
- **Verificación:** verde nativo.

## NAT-35 — Estimar comida con foto y preguntas de aclaración

- **Objetivo:** paridad con REQ-172 con cámara nativa.
- **Alcance:** cámara/galería con `expo-image-picker`, compresión con `expo-image-manipulator` al tamaño que usa la web, envío a `meal_estimate`, hasta 2 preguntas de aclaración, la foto no se guarda en disco ni en servidor tras la estimación; permisos con textos sin vocabulario REQ-31 en `app.config.ts`.
- **Verificación:** verde nativo; prueba de que el archivo temporal se borra.

## NAT-36 — Dictado por voz para registrar comidas

- **Objetivo:** reemplazar Web Speech API (`toggleMic()`, `es-PE` con fallback `es-ES`).
- **Alcance:** elegir y registrar en ADR-001 la librería de reconocimiento; permisos de micrófono/voz; transcripción al campo del editor; degradación si el dispositivo no soporta.
- **Verificación:** verde nativo; prueba manual en iOS y Android.

## NAT-37 — Entreno: plan semanal, detalle de sesión (series × reps) y demostraciones

- **Objetivo:** paridad con la vista Entreno y REQ-174.
- **Alcance:** semana con sesiones, detalle con calentamiento/bloque principal/vuelta a la calma, series × repeticiones y descansos antes de empezar, ficha de ejercicio (instrucciones, respiración, errores, seguridad), demostraciones SVG con `react-native-svg` que respetan movimiento reducido, cambiar sesión antes de iniciarla (`workoutOverride`), modo seguro (REQ-116) y `safety_hold`.
- **Verificación:** verde nativo.

## NAT-38 — Reproductor de entreno nativo: descansos, recuperación, segundo plano, keep-awake

- **Objetivo:** el reproductor de `workout-player.js` con mejor comportamiento nativo.
- **Alcance:** estado desde `workout-player.js` (sin reimplementar), series con reps/carga/RPE explicado (REQ-168), añadir series, "serie hecha" explícita, corregir serie sin marcar (REQ-185), descansos por timestamp (REQ-155/186), descanso entre ejercicios configurable (REQ-187), cardio por bloques, sustituciones, `expo-keep-awake` durante la sesión, hápticos al terminar descanso, notificación local programada si la app pasa a segundo plano, recuperación tras cerrar la app, cierre completo/parcial con dificultad y señales anormales; una sesión abandonada no cuenta como hecha (REQ-163).
- **Aceptación:** matar la app a mitad de un descanso y reabrir conserva serie y tiempo restante correcto.
- **Verificación:** verde nativo + prueba manual documentada.

## NAT-39 — Preparar, revisar y activar plan de entrenamiento; cambiar semana o sesión

- **Objetivo:** paridad con `openTrainingPlanGenerator`/`activateTrainingPlanDraft`.
- **Alcance:** preparar 4/10 semanas vía orquestador, revisión del borrador, activación en la primera fecha sin entreno registrado, rehacer una semana o sesión sin tocar el resto; historial inmutable.
- **Verificación:** verde nativo.

## NAT-40 — Progreso: peso, grasa, gráfico, racha, adherencia y check-in semanal

- **Objetivo:** paridad con Progreso.
- **Alcance:** registro semanal de peso y % grasa (`weight_log` por ciclo), gráfico con `react-native-svg`, indicador de semana, racha/adherencia (`progress-metrics`), colores on-target por meta (REQ-164), check-in semanal con escalas opcionales (REQ-160/165).
- **Verificación:** verde nativo.

## NAT-41 — Cierre de ciclo con foto de progreso privada y siguiente desafío

- **Objetivo:** paridad con el cierre de ciclo.
- **Alcance:** recap (entrenos, adherencia, peso, grasa, mejor racha), foto de cuerpo entero opcional solo con consentimiento de fotos → `progress-photos/<user_id>/cycle-N/` con URL firmada, nunca en caché pública ni galería sin acción del usuario; elección de desafío → onboarding de nuevo ciclo.
- **Verificación:** verde nativo; RLS: otro usuario no puede leer la foto.

## NAT-42 — Perfil: secciones, guardado con aviso de cambios, recalcular objetivos, cerrar sesión

- **Objetivo:** paridad con Perfil (REQ-105/107/108).
- **Alcance:** secciones Objetivo, Comidas, Entreno, Privacidad, Suscripción, Recordatorios, Avisos del dispositivo, Cuenta (Administración = enlace a la web solo para admins); aviso de cambios sin guardar al salir de una sección; recalcular objetivos y preferencias; cerrar sesión (NAT-23).
- **Verificación:** verde nativo.

## NAT-43 — Privacidad y cuenta: exportar datos, borrar cuenta, retirar consentimientos

- **Objetivo:** cumplir paridad y el requisito de tiendas de borrar la cuenta desde la app.
- **Alcance:** exportar vía `/api/privacy` y compartir el archivo con `expo-sharing`; borrar cuenta con la confirmación estricta de la web; retirar consentimiento de fotos/esencial con sus efectos.
- **Verificación:** verde nativo; prueba con cuenta QA en entorno de prueba (nunca producción real de usuarios).

## NAT-44 — Notificaciones: permiso, registro de token, preferencias y apertura por deep link

- **Objetivo:** recordatorios nativos usando NAT-11.
- **Alcance:** pedir permiso en contexto (no al abrir la app), registrar/actualizar token en `/api/push-subscribe`, preferencias en Perfil → Recordatorios (`notification_preferences`), tocar la notificación abre Hoy/Entreno, baja al cerrar sesión. Pruebas de push real dependen de NAT-H5.
- **Verificación:** verde nativo; prueba con Expo Go/dev build documentada.

## NAT-45 — Suscripción: estado del plan, compra integrada y restaurar compras

- **Objetivo:** implementar lo que decida NAT-H3.
- **Alcance:** estado del plan/trial desde `/api/entitlement`, paywall nativo sin vocabulario REQ-31, compra integrada y "Restaurar compras", sincronización con NAT-13; si NAT-H3 decide "sin compra in-app", mostrar solo estado y nada que dirija a pagar fuera si la política lo prohíbe.
- **Verificación:** verde nativo; sandbox de tienda.

## NAT-46 — Coach conversacional

- **Objetivo:** paridad con la conversación del coach (`coach_conversation`, historial local `fitbud_chat_v1_*`).
- **Alcance:** pantalla de conversación vía `js/api-client.js`, historial privado por usuario en el almacenamiento nativo, paywall/cuota con copy comercial, nada de esto a analytics.
- **Verificación:** verde nativo.

## NAT-47 — Tour inicial y estados vacíos

- **Objetivo:** equivalente a `fitbros_tour_v1` y a los estados vacíos de cada tab.
- **Verificación:** verde nativo; se muestra una vez por usuario.

## NAT-48 — Accesibilidad: tamaños dinámicos, lectores de pantalla, movimiento reducido

- **Objetivo:** auditoría y arreglos transversales tras completar las pantallas.
- **Alcance:** etiquetas VoiceOver/TalkBack, orden de foco, texto escalable sin cortes en pantallas clave, movimiento reducido en demostraciones y animaciones, contraste. Solo cambios de accesibilidad.
- **Verificación:** verde nativo + checklist en el PR.

## NAT-49 — Aviso de versión mínima y actualización

- **Objetivo:** poder exigir actualización si el backend cambia.
- **Alcance:** leer `native.minVersion`/`latestVersion` de `/api/config` (NAT-10); bloqueo con enlace a la tienda si la versión es menor que la mínima; aviso suave si hay una más reciente; compatible con actualizaciones OTA.
- **Verificación:** verde nativo.

---

## Fase 5 — Valor nativo (post-beta)

## NAT-50 — Apple Health / Health Connect: peso y entrenos

- **Objetivo:** leer peso (opcional, con permiso) y escribir entrenos completados.
- **Requiere:** NAT-H4 (consentimiento y declaración de salud) y beta publicada.
- **Alcance:** permisos granulares, sincronización unidireccional definida, nada de estos datos a analytics.
- **Verificación:** verde nativo; prueba en dispositivo.

## NAT-51 — Widgets de racha y macros

- **Objetivo:** widget de pantalla de inicio con racha y kcal restantes sin datos sensibles en la pantalla bloqueada.
- **Verificación:** verde nativo; prueba en dispositivo.

## NAT-52 — Entreno en curso visible fuera de la app (Live Activity / notificación persistente)

- **Objetivo:** descanso y serie actuales visibles en la pantalla bloqueada (iOS Live Activity, Android notificación en curso).
- **Verificación:** verde nativo; prueba en dispositivo.

---

## Fase 6 — QA, beta y lanzamiento

## NAT-60 — E2E nativo con Maestro y API simulada

- **Objetivo:** flujos críticos automatizados como en `tests/e2e`.
- **Alcance:** `native/scripts/mock-api.mjs` que sirve las respuestas de `tests/e2e/fixtures` (0 llamadas externas, 0 producción); flujos Maestro en `native/e2e/`: login, onboarding completo, marcar comida, cambiar comida, sesión de entreno con descanso, registrar peso, cerrar sesión; job opcional en `native-ci.yml`.
- **Verificación:** flujos verdes en simulador iOS y emulador Android (evidencia en el PR).

## NAT-61 — Convivencia web ↔ nativo con la misma cuenta

- **Objetivo:** demostrar que alternar clientes no pierde ni duplica datos.
- **Alcance:** `scripts/validate-cross-client-sync.mjs` que simula ediciones concurrentes web/nativo sobre `js/sync-queue.js` con el mismo remoto simulado (comida marcada offline en ambos, peso, plan activado); informe `docs/native-migration/cross-client-report.md` con prueba manual en una cuenta QA.
- **Verificación:** verde web.

## NAT-62 — Borrador de fichas de tienda y formularios de privacidad/salud

- **Objetivo:** dejar listo para aprobación humana (NAT-H7) todo lo que piden las tiendas.
- **Alcance:** `docs/native-migration/store-listing.md`: nombre, subtítulo, descripción corta y larga (es), palabras clave, categoría, URL de soporte y de política de privacidad, lista de capturas a producir por pantalla, borrador de etiquetas de privacidad (App Store), Data safety y declaración de apps de salud (Google Play), clasificación de edad, notas para el revisor (cuenta demo QA, cómo probar). Copy respetando REQ-31 salvo lo que NAT-H4 exija divulgar.
- **Verificación:** revisión humana.

## NAT-63 — Preparar release beta: perfiles EAS, versionado, canal OTA y checklist

- **Objetivo:** que el envío de NAT-H8 sea mecánico.
- **Alcance:** `eas.json` y `app.config.ts` finales (versión y build number, `runtimeVersion` por política de fingerprint, canales `preview`/`production` de EAS Update, permisos y textos), `docs/native-migration/release-checklist.md` (pasos de build/submit, verificación post-instalación, rollback de OTA, quién aprueba).
- **Fuera de alcance:** ejecutar builds o envíos con credenciales (NAT-H8).
- **Verificación:** `npx expo config --type public` sin errores; verde nativo.
