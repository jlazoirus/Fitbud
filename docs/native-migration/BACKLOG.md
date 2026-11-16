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

- **Decide:** titular de las cuentas (persona o empresa), bundle id / package name (sugerido `club.evolvapp.app`), nombre comercial en tiendas. El titular importa en Google Play: una cuenta personal nueva exige 12 testers durante 14 días antes de producción (`PUBLICACION.md` §5); confirmar qué pide una de organización al crearla.
- **Entrega para agentes:** Team ID de Apple y huella SHA-256 del certificado de firma de Android anotados en `docs/native-migration/decisions.md` (son públicos; nunca credenciales ni llaves privadas).

## NAT-H3 — Modelo de cobro dentro de las apps (compra integrada vs. sin compra in-app)

- **Decide:** cómo se compra el acceso desde iOS/Android. Opciones: (a) compra integrada de cada tienda con intermediario (RevenueCat u otro), (b) compra integrada directa (StoreKit 2 / Play Billing + verificación en servidor), (c) app sin compra integrada: se paga en la web y la app lee el acceso del servidor.
- **Decisión de Jonathan (2026-11-05): (c), cobro solo en la web con Culqi.** Plan completo, reglas de tienda verificadas y contingencia en `docs/native-migration/COBRO-WEB.md`.
- **Riesgo:** en Perú, App Store (3.1.1, 3.1.3(b)) y Google Play (Pagos) no permiten de forma explícita una app de suscripción que solo honra compras de la web. Si una tienda la rechaza en la validación de beta, se activa (a) o (b) solo para esa plataforma (Fase 3 de `COBRO-WEB.md`).
- **Cupones:** se canjean solo en la web; dentro de la app iOS un código propio cuenta como "mecanismo propio de desbloqueo" (3.1.1).
- **Entrega:** decisión registrada en `docs/native-migration/decisions.md`. Una persona la cierra (`--done NAT-H3 --human`) después de la validación con las tiendas, con el resultado y, si aplica, los ids de productos por plataforma.

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

- **Hace:** ejecutar `eas build`/`eas submit` con la checklist de NAT-63, invitar testers, decidir paso a público y la política de convivencia de la PWA (recomendado: mantenerla). Decidir también qué cliente recibe los cambios de producto (`PUBLICACION.md` §7).

---

## Fase 1 — Núcleo compartido

## NAT-01 — Inventario del dominio que vive en app/index.html y plan de extracción

- **Objetivo:** mapa verificable de toda la lógica no visual de `app/index.html` que una pantalla nativa necesitaría, para que NAT-03..09 extraigan sin adivinar.
- **Alcance:** crear `docs/native-migration/core-inventory.md` con, por función: nombre, línea, módulo destino (`day-model`, `plan-calendar`, `progress-metrics`, `sync-queue`, `api-client`, `profile-model`, `plan-orchestrator` o "se queda en UI"), globals que lee/escribe (`S`, `DB`, `REMOTE`, `profile`, `supa`, `current`, `view`, `UI`), efectos (DOM, `localStorage`, red, `Date.now`) y llamadores. Punto de partida: `buildDay` (`app/index.html:1784`), `dayState` (`:2206`), `mealValue` (`:2310`), `dayTotals` (`:2344`), `effectiveDayTarget` (`:1525`), `effectiveWorkout` (`:1498`), `weekOf` (`:1774`), `migrateProfilePrefs` (`:997`), `hasCompleteOnboarding` (`:2638`), `profileReviewDue` (`:2649`), `streakStats`/`streak` (`:10099`/`:10167`), `prepareFirstCycleWeek` (`:3468`), `finalizeDayWithGate` (`:8471`), `callClaude` (`:8389`), `pushDay`/`pullDay`/`commitDay`/`syncDay` (`:10717`-`:10806`), `workoutPrescription` (`:4540`), `activateTrainingPlanDraft` (`:10644`).
- **Fuera de alcance:** mover código.
- **Aceptación:** cada módulo destino tiene lista de funciones, orden de extracción sin ciclos y riesgos; las líneas citadas existen en `HEAD`.
- **Verificación:** muestreo de 10 referencias contra `HEAD`; `node scripts/native-next-task.mjs --validate`.

## NAT-02 — Validador de portabilidad de módulos puros (Node/Hermes, sin DOM)

- **Objetivo:** garantizar que los módulos compartidos cargan fuera del navegador y no usan APIs web.
- **Alcance:** `scripts/validate-shared-modules.mjs` que, para cada módulo compartido (los 7 actuales + los nuevos de `js/` que declaren el comentario `// shared-module`): (1) falla si el código usa `window.`, `document`, `localStorage`, `sessionStorage`, `location`, `navigator`, `fetch(` o `XMLHttpRequest` fuera de la detección `typeof window!=="undefined"?window:globalThis`; (2) los carga con `node:vm` en un contexto con solo `globalThis`/`console`/`Intl`/`Date`/`Math`/`JSON` y verifica que publican su namespace (`FITBUD_*`). Agregarlo a `scripts/release-gate.mjs`.
- **Aceptación:** pasa con los módulos actuales; falla con un fixture que use `document`.
- **Herramienta de análisis:** Acorn como dependencia exclusiva de desarrollo de la raíz, con versión fijada. Analizar el AST evita confundir comentarios, strings o campos de datos (`location`) con accesos al navegador. No añade una dependencia runtime a la web ni a la app.
- **Verificación:** verde web; el script incluye un auto-test del caso negativo.

## NAT-03 — Extraer modelo de día a js/day-model.js

- **Objetivo:** `dayState`, `mealValue`, `dayTotals` y el núcleo de `buildDay` como funciones puras que reciben `state`, `catalog`, `planVersions` y `prefs` explícitos.
- **Alcance:** nuevo `js/day-model.js` (IIFE, `FITBUD_DAY_MODEL`, comentario `// shared-module`), `app/index.html` delega en él manteniendo nombres públicos, `<script src>` y `APP_SHELL`/`CACHE_NAME` en `service-worker.js`, validador `scripts/validate-day-model.mjs` (casos: override > nutritionPlan > vacío, totales solo `done`, comidas saltadas, porciones escaladas REQ-154/162) en el release gate.
- **Adaptación de pruebas:** `test-meal-value-replacement.mjs`, `test-nutritionplan-priority.mjs` y `validate-meal-reorder-skip.mjs` cargan el módulo real junto a los adaptadores web; mantienen las comprobaciones funcionales de REQ-125/154/162. El calendario sigue en el adaptador hasta NAT-04: `buildDay` recibe sus datos ya resueltos (franjas, snapshot, semana, fecha, meta actual y entrenamiento). La normalización pura no muta el estado; el adaptador conserva la identidad de los objetos que usa la UI.
- **Fuera de alcance:** render, sync, cambios de comportamiento.
- **Aceptación:** E2E sin cambios; NAT-02 pasa con el módulo nuevo.
- **Verificación:** verde web.

## NAT-04 — Extraer calendario de ciclo y metas a js/plan-calendar.js

- **Objetivo:** fechas de ciclo (`planStartDate`/`planEndDate`/`planCycleNumber`/`planDurationWeeks`), `weekOf`, tipo de día, `effectiveDayTarget` y la resolución pura de `effectiveWorkout` desde snapshot, con la fecha "hoy" inyectada (sin `Date` UTC accidental).
- **Alcance:** `js/plan-calendar.js`, delegación en `app/index.html`, `service-worker.js`, `scripts/validate-plan-calendar.mjs` (zonas horarias, ciclos 4/10, día fuera de ciclo, `safety_hold`).
- **Aceptación/verificación:** como NAT-03.

## NAT-05 — Extraer racha, adherencia y recap a js/progress-metrics.js

- **Objetivo:** `streakStats`/`streak`, adherencia, recap de cierre de ciclo y mapeo de check-in (`test-checkin-goal-mapping.mjs`) puros.
- **Alcance:** `js/progress-metrics.js`, delegación, `service-worker.js`, `scripts/validate-progress-metrics.mjs` (REQ-161: comidas de 0 kcal no inflan; REQ-163: sesión abandonada no cuenta; REQ-165: escalas sin responder).
- **Aceptación/verificación:** como NAT-03.

## NAT-06 — Extraer cola offline y sync de day_log/weight_log a js/sync-queue.js con storage inyectado

- **Objetivo:** cola `fitbud_syncq_v1`, metadatos y `pushDay`/`pullDay`/`pushWeight`/`pullWeights` como lógica pura sobre dos puertos: `storage` (get/set/remove asíncronos) y `remote` (upsert/select). Usa `sync-conflicts.js`.
- **Alcance:** `js/sync-queue.js`, adaptadores web (`localStorage`, supabase-js) dentro de `app/index.html`, `service-worker.js`, `scripts/validate-sync-queue.mjs` (pending/failed/conflict, reintentos, purga al cambiar de usuario — REQ-156, aislamiento por `user_id`).
- **Aceptación:** `test-sync-conflicts.mjs` y `sync-isolation.spec.js` siguen verdes; el módulo no conoce `localStorage` ni `supa`.
- **Verificación:** verde web.

## NAT-07 — Extraer cliente de /api/* a js/api-client.js con baseUrl y token inyectados

- **Objetivo:** un cliente único para `/api/config`, `/api/claude`, `/api/entitlement`, `/api/privacy`, `/api/push-subscribe`, `/api/analytics`, `/api/catalog`, `/api/checkout` con `baseUrl` (web: `""`, nativo: `https://evolvapp.club`), `getAccessToken()` y cabeceras de cliente (`X-Evolv-Client`, `X-Evolv-App-Version`) inyectados. Incluye `requestId` idempotente y manejo de paywall/cuota que hoy hace `callClaude` (sin la parte de UI).
- **Alcance:** `js/api-client.js`, delegación en `app/index.html`, `service-worker.js` (sin cachear `/api/*`), `scripts/validate-api-client.mjs` con `fetch` simulado (401, 402/paywall, timeout, JSON inválido).
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
- **Alcance:** `api/config.js` agrega `native: { minVersion, latestVersion, adminUrl }` (desde env, con defaults seguros); `api/analytics.js` acepta `platform` (`web|ios|android`), `app_version` y `update_id` en la allowlist sin otros campos nuevos; documentar en `supabase/analytics.sql` si se necesita columna (idempotente). Revisar que ningún endpoint de usuario dependa de `Origin`/cookies (hoy `api/admin.js:710` lee `origin`; admin queda web). `scripts/test-native-api-headers.mjs` en el release gate.
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

## NAT-13 — Contingencia: entitlements de compras de tienda (solo si NAT-H3 activa la compra integrada)

- **Estado del plan:** con el cobro solo en la web (NAT-H3, 2026-11-05) esta tarea **no se hace**. `GET /api/entitlement` ya devuelve plan, estado, vencimiento y origen, y basta para NAT-45. Se ejecuta solo si App Store o Google Play exigen su compra integrada (Fase 3 de `COBRO-WEB.md`).
- **Objetivo (contingencia):** que una compra en App Store/Google Play active el mismo `user_entitlements` que una compra con Culqi.
- **Alcance (contingencia):** `supabase/native_entitlements.sql` (permitir `origin in ('apple','google')`, ids de transacción únicos, idempotencia de eventos), `api/store-webhook.js` (RevenueCat webhook o App Store Server Notifications v2 + Google RTDN, con verificación de firma); `scripts/test-store-webhook.mjs` con eventos simulados (compra, reembolso, expiración, evento duplicado). Vigilar el límite de 12 funciones de Vercel Hobby (`scripts/test-tienda-culqi.mjs`): el webhook puede servirse por `/api/checkout?op=` como Culqi.
- **Aceptación:** reembolso revoca; evento repetido no duplica; compras con Culqi sin cambios (`scripts/test-tienda-culqi.mjs` verde).
- **Verificación:** verde web.

## NAT-14 — Compatibilidad del servidor y los datos con versiones anteriores de la app

- **Objetivo:** que un cambio en `api/*` o en los datos compartidos no rompa una versión de la app que sigue instalada (`PUBLICACION.md` §6).
- **Alcance:** `scripts/validate-client-compat.mjs` en el release gate. Compara las respuestas de los endpoints de usuario con contratos guardados en `tests/fixtures/client-compat/`: quitar un campo o cambiarle el tipo falla; agregar uno opcional pasa. Prueba de ida y vuelta de `day_log.state`, `plan_versions.snapshot` y `profiles.prefs` con la capa que los escribe: los campos desconocidos se conservan al reescribir.
- **Fuera de alcance:** corregir lo que la prueba encuentre en la web; cada hallazgo va en su propia tarea o REQ.
- **Aceptación:** falla con un fixture que quita un campo y con otro que pierde un campo desconocido; pasa con uno que agrega un campo opcional.
- **Verificación:** verde web.

---

## NAT-15 — Fechas de fixtures de recordatorios independientes de la hora del gate

- **Origen:** el gate de NAT-20 falla en `scripts/validate-reminder-journey.mjs:338` con código de aplicación intacto. La zona elegida para simular las 20:00 convierte el `created_at` fijo a las 15:00 UTC al día siguiente cuando su offset es ≥9; el fixture de dos días pasa a tener uno.
- **Alcance:** corregir únicamente los timestamps de alta de esos fixtures en `scripts/validate-reminder-journey.mjs`, conservando las aserciones del handler y comprobando el día local para las 24 horas UTC.
- **Fuera de alcance:** cambiar recordatorios, envíos, preferencias o lógica de producción.
- **Aceptación:** el validador pasa a cualquier hora UTC; el resto del gate conserva su cobertura.
- **Verificación:** ejecutar el validador con reloj simulado en las 24 horas UTC y el gate completo.

## Fase 3 — Fundación nativa

## NAT-20 — Scaffold de la app Expo en native/ con TS, expo-router, lint, tests y perfiles EAS

- **Objetivo:** proyecto base compilable que cualquier agente pueda levantar.
- **Alcance:** `native/` con Expo SDK estable, TypeScript estricto, expo-router (grupos `(auth)`, `(onboarding)`, `(tabs)`), ESLint + Prettier, `jest-expo`, scripts `typecheck`, `lint`, `test`, `start`; `app.config.ts` con nombre Evolv, esquema `evolv`, bundle id desde env con default `club.evolvapp.app`, colores `#101010`, iconos desde `assets/`; `eas.json` con perfiles `development`, `preview`, `production` sin secretos; `native/README.md` con cómo correrlo; `.gitignore` para `native/node_modules`, `.expo`, builds. Completar "Versiones fijadas" en ADR-001.
- **Aceptación:** `npm ci && npm run typecheck && npm run lint && npm test` en verde en limpio; `native/` no aparece en el deploy de Vercel (`validate-deploy-allowlist.mjs` verde).
- **Verificación:** verde nativo y verde web.

## NAT-21 — Puente tipado hacia los módulos de dominio de la raíz

- **Objetivo:** importar el dominio compartido desde nativo sin copiarlo.
- **Alcance:** `native/metro.config.js` con `watchFolders` a la raíz del repo; `native/src/core/index.ts` importa por efecto lateral `../../../js/nutrition-pure.js` (y los demás, en el orden que exige cada módulo) y exporta fachadas tipadas desde `globalThis.FITBUD_*`; `native/src/core/types/*.d.ts` para las funciones usadas; tests Jest colocados en `native/src/core/` con casos reales (macros de un plato, validación de plan de entreno, creación/restauración del reproductor, merge de sync). Cargar el puente desde `native/app/_layout.tsx` y documentar su uso y verificación en `native/README.md`. El reproductor actual expone funciones de ejecución y normalización; no existe un reducer exportado.
- **Fuera de alcance:** módulos aún no extraídos (se agregan en la tarea feature que los necesite, una línea).
- **Aceptación:** tests verdes en jest y la app arranca en Hermes con los módulos cargados.
- **Verificación:** verde nativo.

## NAT-22 — Design system Evolv nativo: tokens, tipografías y componentes base

- **Objetivo:** misma identidad que la web (REQ-180): acento lima `--accent`, `--on-accent`, fondo `#101010`, Unbounded (títulos) y Manrope (texto), marca `brandMark()`.
- **Alcance:** `native/src/ui/tokens.ts` derivado de las variables CSS de `app/index.html`; fuentes con `expo-font`; componentes `Screen`, `Text`, `Button`, `Card`, `Sheet` (bottom sheet), `ListRow`, `Field`, `PasswordField` (equivalente a `passwordField()`/REQ-113), `MacroRing`, `ProgressBar`, `Toast`, `Chip`, `EmptyState`; página de catálogo de componentes en una ruta de desarrollo.
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
- **Alcance:** cliente de `/api/analytics` (vía `js/api-client.js`) con los mismos eventos que la web + `platform`/`app_version`/`update_id` (permite observar cada tren OTA, `PUBLICACION.md` §3); captura de errores JS no controlados enviada como evento técnico sin stack con datos de usuario; cola de eventos offline con límite.
- **Fuera de alcance:** SDKs de analytics/crash de terceros (prohibidos por ADR-001 salvo decisión explícita).
- **Aceptación:** test que verifica que ningún evento lleva campos fuera de la allowlist.
- **Verificación:** verde nativo.

## NAT-27 — CI nativo en GitHub Actions (typecheck, lint, tests, validadores compartidos)

- **Objetivo:** que cada PR que toque `native/`, `js/` o los módulos compartidos corra los checks.
- **Alcance:** `.github/workflows/native-ci.yml`: Node LTS, caché npm, `npm ci` en `native/`, typecheck/lint/test, `node scripts/validate-shared-modules.mjs`, `node scripts/native-next-task.mjs --validate`, `node scripts/validate-native-copy.mjs` (si existe). Sin secretos ni builds EAS.
- **Instalación limpia:** `native/jest.config.js` declara la ruta de dependencias de la app para transformar módulos compartidos fuera de `native/`. La primera corrida Linux del PR #113 detectó que Babel buscaba su runtime en la raíz; en este Mac se resolvía accidentalmente desde `/Users/jonathan/node_modules`. Corregir la configuración, sin añadir dependencias runtime a la web ni omitir las pruebas del puente.
- **Aceptación:** el workflow corre en un PR de prueba y falla si se rompe un test.
- **Verificación:** run verde enlazado en el PR.

## NAT-28 — Validador REQ-31 y de cobro fuera de la app para textos de la app nativa

- **Objetivo:** que la UI nativa no mencione IA, Claude, Anthropic, modelo, prompt, token, cuota ni proveedor, y que no empuje a pagar fuera de la app (`COBRO-WEB.md` §4): sin precios (`S/`, `USD`), sin "comprar", "planes", "suscríbete" ni "renueva" en textos visibles, y sin URLs a `/planes`, `/pago` ni al WhatsApp de ventas.
- **Alcance:** `scripts/validate-native-copy.mjs` que recorre `native/app/**` y `native/src/**` (excluye tests y `src/core/types`) buscando literales visibles con ese vocabulario (insensible a mayúsculas/acentos, con lista de excepciones explícita y comentada para identificadores internos); se agrega al release gate y a NAT-27.
- **Análisis:** usar el AST de TypeScript/TSX para leer texto JSX, props, strings y plantillas (incluidas concatenaciones literales), sin confundir comentarios, identificadores, tipos ni imports con copy. TypeScript 6.0.3 se fija también como dependencia **solo de desarrollo de la raíz** (`package.json`/lock), para que el gate web funcione sin instalar `native/node_modules`. No añade dependencias runtime a la web. Incluir auto-tests positivos/negativos y rutas excluidas; la revisión visual y del contenido remoto sigue en la QA de cada pantalla.
- **Aceptación:** falla con un fixture que muestre "IA" en un `<Text>` y con otro que enlace a `evolvapp.club/planes`; pasa con el scaffold.
- **Verificación:** verde web.

---

## NAT-29 — Vincular el proyecto Expo/EAS real de Evolv

- **Objetivo:** que la configuración del repositorio corresponda a `@jlazo/evolv`, creado por instrucción de Jonathan y confirmado en el panel de Expo.
- **Alcance:** `native/app.config.ts` fija el owner y el projectId públicos como valores predeterminados, conserva overrides explícitos para entornos aislados y rechaza IDs inválidos; `native/.env.example`, `native/README.md`, pruebas de configuración y `docs/native-migration/decisions.md` registran la vinculación real.
- **Aceptación:** `expo config` publica el owner, `extra.eas.projectId` y `updates.url` del mismo proyecto; tests positivos/negativos, typecheck, lint, formato y export iOS/Android/web verdes. Comprobar la identidad en el panel autenticado de Expo y conservar evidencia.
- **Fuera de alcance:** cerrar NAT-H2/H5, crear credenciales de firma/push, contratar un plan, publicar un build o una actualización OTA. La autenticación de EAS CLI se comprueba por separado; una sesión web no implica sesión de terminal.

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

## NAT-45 — Mi plan sin compra dentro de la app: estado del acceso y actualizar

- **Objetivo:** implementar el modelo de NAT-H3 (cobro solo en la web): la app muestra el acceso que el servidor tiene registrado y nunca vende ni empuja a pagar fuera.
- **Alcance:**
  - "Mi plan": plan, estado y fecha de vencimiento (o días de prueba) desde `GET /api/entitlement`.
  - Sin acceso activo: pantalla neutral, sin precios ni enlaces, con **Actualizar**, **Cerrar sesión** y **Ayuda** (soporte, no compra). Funciones que piden permiso en el servidor (coach, generar planes): mismo mensaje neutral.
  - Refresco del acceso al abrir la app, al volver a primer plano (`AppState`) y al tocar Actualizar. Último estado en caché con su fecha para usar la app sin conexión.
  - Sin canje de cupones. Textos que respetan REQ-31 y `COBRO-WEB.md` §4 (los revisa NAT-28).
  - Si NAT-H3 activa la contingencia, esta tarea agrega la compra integrada y "Restaurar compras" sobre NAT-13.
- **Verificación:** verde nativo; prueba con una cuenta con plan, una vencida y una que paga en la web mientras la app está abierta (al volver a primer plano el acceso aparece sin reiniciar).

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
- **Alcance:** leer `native.minVersion`/`latestVersion` de `/api/config` (NAT-10); bloqueo con enlace a la tienda si la versión es menor que la mínima; aviso suave si hay una más reciente; compatible con actualizaciones OTA. Buscar actualizaciones al abrir y al volver a primer plano. `minVersion` es el último recurso (`PUBLICACION.md` §6).
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
- **Cobro (NAT-H3):** la ficha no menciona precios, planes ni que se compra en la web. Las notas para el revisor explican que la app es el acceso al servicio de Evolv, que no vende nada dentro de la app, e incluyen una cuenta demo con plan de cortesía.
- **Verificación:** revisión humana.

## NAT-63 — Preparar release beta: perfiles EAS, versionado, canal OTA y checklist

- **Objetivo:** que el envío de NAT-H8 sea mecánico.
- **Alcance:** `eas.json` y `app.config.ts` finales (versión y build number, `runtimeVersion` por política de fingerprint, canales `preview`/`production` de EAS Update, permisos y textos), `docs/native-migration/release-checklist.md` (pasos de build/submit, verificación post-instalación, rollback de OTA, quién aprueba, notas de revisión y etiqueta Git por binario según `PUBLICACION.md` §5). Confirmar que el primer binario incluye `expo-updates`.
- **Fuera de alcance:** ejecutar builds o envíos con credenciales (NAT-H8).
- **Verificación:** `npx expo config --type public` sin errores; verde nativo.

## NAT-64 — Publicación OTA escalonada con controles previos

- **Objetivo:** que publicar por aire sea rápido y que nada llegue a todos los usuarios sin pasar los controles de `PUBLICACION.md` §3 y §4.
- **Alcance:** `scripts/native-ota-check.mjs` (release gate, checks de `native/`, `validate-native-copy` y `validate-client-compat`; falla si la huella de runtime cambió respecto del binario vigente o si hay un despliegue activo, salvo `--urgente`), con `--self-test` en el release gate. `.github/workflows/native-ota.yml`, de ejecución manual y programada, publica en `preview` y luego en `production` al 10 %, nunca directo al 100 %. `release-checklist.md` agrega trenes, umbrales, ampliación, reversión y quién aprueba. `AUTONOMOUS_AGENT.md` agrega la regla: el loop puede iniciar un tren, no ampliarlo al 100 %.
- **Fuera de alcance:** publicar con credenciales reales y decidir el cliente principal (ambas en NAT-H8).
- **Aceptación:** el check falla con un fixture que cambia la huella, con otro que agrega "comprar" en un `<Text>` y con otro que quita un campo de la API; una corrida en seco del workflow muestra `preview` → 10 % sin llegar al 100 %.
- **Verificación:** verde web y nativo.

---

## Revisión 2026-11-16 — correcciones al plan

Origen, evidencia y detalle de implementación de todas las tareas de esta sección: `docs/native-migration/REVISION-2026-11-16.md` (el hallazgo en §4, la especificación en §5 bajo el mismo id). Las líneas citadas allí son de `4b9341e`: buscar por nombre de función y confirmar contra `HEAD`.

Varias tareas anteriores esperan a estas (lista y motivo en la revisión, §6.1). Orden recomendado: revisión §7.

## NAT-H9 — Decisiones de producto para la app sin venta

- **Decide:** qué ve en la app quien no tiene cuenta; si la suscripción se puede cancelar desde la app; a dónde lleva "Ayuda"; si Android lleva textos más informativos que iOS (decisiones D-1 a D-4 de la revisión, §3, con opciones y recomendación).
- **Mientras no se decida:** los agentes usan el valor conservador: solo iniciar sesión con un texto neutral sin enlaces, sin cancelación dentro de la app, ayuda por correo y las mismas reglas de texto en ambas plataformas.
- **Entrega:** decisión anotada en `docs/native-migration/decisions.md`.

## NAT-H10 — Cliente principal y alcance de la beta

- **Decide:** qué cliente recibe los cambios de producto (`PUBLICACION.md` §7) y qué capacidades de la web entran en la beta, cuáles van después y cuáles se quedan solo en la web (D-5 y D-6). Adelanta esa parte de NAT-H8.
- **Material:** la matriz rebasada y la propuesta de clasificación que deja NAT-71.
- **Entrega:** decisión en `decisions.md`. Al decidir, `AUTONOMOUS_AGENT.md` y `AUDIT_AGENT.md` pasan a declarar a qué cliente aplica cada REQ.

## NAT-H11 — Entorno de pruebas y URLs de redirección de Auth para la app

- **Hace:** crear un entorno de pruebas (recomendado: un segundo proyecto de Supabase), aplicar ahí todas las migraciones de `supabase/`, apuntar a él las variables de Preview de Vercel y agregar `evolv://**` a las URLs de redirección de Auth, primero ahí y luego en producción cuando corresponda (D-7).
- **Entrega para agentes:** la URL de la API de pruebas en `decisions.md` (dato público; nunca llaves de servicio).

## NAT-H12 — Validación temprana con las tiendas

- **Hace:** enviar el build mínimo de NAT-80 a TestFlight externo y a la prueba cerrada de Google Play (que inicia los 14 días exigidos a las cuentas personales), con la lista de `docs/native-migration/store-validation.md` (D-8).
- **Entrega:** fecha, resultado por tienda y motivo literal de cualquier rechazo en `decisions.md`. Si una tienda rechaza por el cobro, se activa NAT-13 solo para esa plataforma.

## NAT-70 — Aplicar la revisión 2026-11-16 al plan: grafo, alcances y documentos de cobro

- **Objetivo:** que el backlog y los documentos del plan digan lo que ya está decidido y dejen de contradecirse (hallazgos H-03, H-04, H-09, H-12, H-14, H-15).
- **Alcance:** tarea documental, sin código. Aplicar la tabla de la revisión §6.2 a `native-migration.json`; agregar las cuatro reglas de alcance a `NATIVE_AGENT.md` §2; reescribir en este archivo NAT-21, NAT-22, NAT-23 (sin registro en la app), NAT-45 (estados de la suscripción), NAT-46 (sin "copy comercial"), NAT-60, NAT-61, NAT-62, NAT-H3, NAT-H6 y la cabecera de la Fase 4; alinear `COBRO-WEB.md`, `PLAN.md`, `PUBLICACION.md` §7 y las filas de Acceso, Coach y Facturación de `PARITY.md`. Lista exacta en la revisión §5, NAT-70, apartados A a G.
- **Fuera de alcance:** cambiar el estado de cualquier tarea, cerrar decisiones humanas, rebasar el resto de `PARITY.md` (NAT-71).
- **Aceptación:** ningún documento de `docs/native-migration/` presenta el pago único como único modelo ni pide registro en la app; ninguna tarea disponible contradice a otra.
- **Verificación:** `node scripts/native-next-task.mjs --validate` y `git diff --check`.

## NAT-71 — Rebasar la matriz de paridad contra la web actual

- **Objetivo:** que `PARITY.md` describa la web de `HEAD` y que cada capacidad tenga destino: beta, después de la beta o solo web (H-08).
- **Alcance:** anotar el commit base; recorrer los REQ implementados desde REQ-189 (lista de partida por journey en la revisión §5, NAT-71) y la app real; proponer la clasificación; reescribir el alcance de NAT-30, NAT-32, NAT-33, NAT-37 y NAT-40 en este archivo; registrar una tarea por cada capacidad de beta que ninguna tarea cubra; anotar las que pidan una dependencia fuera del allowlist; regla de mantenimiento en la cabecera de `PARITY.md`; actualizar `PLAN.md` §6.
- **Fuera de alcance:** decidir el cliente principal (NAT-H10); construir pantallas.
- **Aceptación:** cada REQ visible para el usuario normal implementado desde REQ-189 está en una fila o en una lista de exclusiones con motivo.
- **Verificación:** `--validate`.

## NAT-72 — Verificación en dispositivo sin cuentas de tienda: perfiles EAS y prueba de arranque en CI

- **Objetivo:** poder ejecutar la app en Android e iOS sin esperar a NAT-H2/H5 y desbloquear NAT-21 (H-01, H-11).
- **Alcance:** `native/eas.json` con un perfil de simulador de iOS y APK de Android; `docs/native-migration/device-smoke.md` con los tres caminos (APK en teléfono o emulador, simulador en un Mac, CI) y la lista de comprobación de NAT-21; `native/e2e/smoke.yaml` (Maestro: abrir y ver la bienvenida); `.github/workflows/native-smoke.yml` con un job de Android en emulador y uno de iOS solo manual, sin credenciales, con la captura como artefacto; actualizar `native/README.md`. Detalle y disparadores en la revisión §5, NAT-72.
- **Fuera de alcance:** cerrar NAT-21 (la cierra su dueño o una persona con la evidencia); builds firmados.
- **Aceptación:** corrida verde del job de Android enlazada en el PR; el job falla si se rompe el import de un módulo compartido.
- **Verificación:** verde nativo.

## NAT-73 — Instalar de una vez los módulos nativos del allowlist y elegir el almacenamiento

- **Objetivo:** que las tareas siguientes no necesiten `native/package.json` y que el cliente de desarrollo no se recompile en cada una (H-09).
- **Alcance:** instalar con `npx expo install` los paquetes del allowlist de ADR-001 listados en la revisión §5, NAT-73; elegir `expo-sqlite` o `react-native-mmkv` con los criterios indicados y registrarlo en ADR-001; comprobar si hace falta `expo-crypto`; no declarar permisos todavía y bloquear con `android.blockedPermissions` los que una librería agregue sola; actualizar el allowlist y "Versiones fijadas".
- **Fuera de alcance:** voz (NAT-36), salud (NAT-50), compra integrada, lector de códigos de barras.
- **Aceptación:** `npm ci` limpio, `npx expo install --check` y `npx expo-doctor` sin pendientes, exportación iOS y Android verde.
- **Verificación:** verde nativo y verde web. Avisar en el PR que cambia la huella de runtime.

## NAT-74 — Simulación de dos clientes sobre el motor de sync

- **Objetivo:** reproducir de forma determinista qué se pierde hoy cuando la web y la app escriben el mismo día (H-05), antes de construir la capa de datos nativa.
- **Alcance:** `scripts/validate-cross-client-sync.mjs` con dos instancias de `js/sync-queue.js`, un remoto en memoria y relojes inyectados; escenarios S1 a S7 de la revisión §5, NAT-74. Prueba de caracterización: afirma el comportamiento actual, lista las pérdidas conocidas en `KNOWN_LOSS` y falla si cambia. Se agrega al release gate.
- **Fuera de alcance:** corregir el motor (NAT-75).
- **Aceptación:** el escenario S1 (escritura en línea con estado viejo) queda demostrado con una aserción.
- **Verificación:** verde web.

## NAT-75 — Sync sin pérdida entre clientes: escritura condicional por revisión y relectura al volver

- **Objetivo:** que ninguna escritura reemplace cambios remotos que el cliente no ha visto, sin depender del reloj del dispositivo (H-05).
- **Alcance:** `supabase/sync_revision.sql` idempotente (columna `rev` y disparador en `day_log` y `weight_log`, RLS sin cambios) con espejo en `schema.sql`; en `js/sync-queue.js`, escritura condicionada a `rev`, merge y reintento al chocar, y respaldo al `upsert` actual si la columna no existe; relectura del día al volver a primer plano en la web; los escenarios de NAT-74 pasan a exigir que nada se pierda. Diseño completo en la revisión §5, NAT-75.
- **Excepción a la convención `core`:** esta tarea sí cambia el comportamiento del sync en producción; exige release gate y E2E completos.
- **Fuera de alcance:** aplicar la migración en producción (NAT-H6).
- **Aceptación:** con la columna presente, S1 y S4 conservan los cambios de ambos clientes; sin ella, el comportamiento es el actual; un cliente viejo y uno nuevo pueden alternar.
- **Verificación:** verde web; verde nativo si se tocó `native/src/data/**`; `validate-migrations.mjs` acepta la migración.

## NAT-76 — Acceso sin venta de punta a punta: servidor, cliente compartido, validador y páginas legales

- **Objetivo:** que ningún texto ni enlace que llegue a la app empuje a comprar, venga del código nativo, del servidor o de una página enlazada (H-06, H-13).
- **Alcance:** `api/claude.js` agrega `code` a sus respuestas 402 y devuelve un texto neutral cuando `X-Evolv-Client` es `ios` o `android`; `js/api-client.js` gana la opción `paywallCopy` (`"server"` por omisión, `"local"` para nativo) sin cambiar el comportamiento de la web; `scripts/validate-native-copy.mjs` cubre "activa tu plan" y exporta sus reglas; `scripts/test-native-access-copy.mjs` pasa las respuestas del servidor para clientes nativos por esas reglas; `tienda/layout.js` no dibuja navegación ni pie de tienda con `?app=1`. Textos y detalle en la revisión §5, NAT-76.
- **Fuera de alcance:** cambiar los textos de la web; la pantalla "Mi plan" (NAT-45); excepciones del validador que dependan de NAT-H9.
- **Aceptación:** la prueba falla si un cliente nativo vuelve a recibir "Activa tu plan"; `/terminos?app=1` no tiene enlaces a `/planes`, `/pago` ni `/registro`, y sin el parámetro la página no cambia.
- **Verificación:** verde web.

## NAT-77 — Clasificar los módulos de js/ y hacer que el dominio nuevo nazca compartido

- **Objetivo:** que cada archivo de `js/` declare si es compartido o solo web, y que las reglas de negocio nuevas se escriban fuera de `app/index.html` (H-07).
- **Alcance:** marca `// shared-module` en `js/meal-log.js` y `js/training-routine.js`; marca nueva `// web-only` con motivo en `js/streak-friends.js` y `js/streak-share.js`; `scripts/validate-shared-modules.mjs` falla si un archivo de `js/` no lleva ninguna; regla para el loop desarrollador en `AUTONOMOUS_AGENT.md`; informe no bloqueante del tamaño de `app/index.html` en el release gate; subir `CACHE_NAME`.
- **Fuera de alcance:** extraer lógica; agregar módulos al puente nativo.
- **Aceptación:** el gate falla con un archivo nuevo sin marca en `js/` y pasa con el repo actual.
- **Verificación:** verde web.

## NAT-78 — Configuración por entorno en la app: URL de la API por perfil y configuración remota

- **Objetivo:** que cada perfil de build apunte a su servidor y que ningún build de desarrollo use producción por descuido (H-10).
- **Alcance:** `extra.apiBaseUrl` validado en `native/app.config.ts` (el perfil `production` exige `https://evolvapp.club`; sin valor, falla); `env` por perfil en `native/eas.json`; `native/src/config/env.ts` como única fuente de la URL, el cliente, la versión y el id de actualización; `native/src/config/remote-config.ts`, que lee `/api/config` y conserva la última respuesta válida con dependencias inyectadas; pruebas Jest. Detalle en la revisión §5, NAT-78.
- **Fuera de alcance:** crear el entorno de pruebas (NAT-H11); el cliente de Supabase (NAT-23).
- **Aceptación:** `npx expo config` falla sin la variable y publica la URL de producción con el perfil `production`.
- **Verificación:** verde nativo.

## NAT-79 — Arnés E2E temprano: API simulada y flujo de inicio de sesión con Maestro

- **Objetivo:** que desde la primera pantalla real haya una prueba automática de extremo a extremo y que cada tarea de la Fase 4 solo agregue su flujo (H-02, H-11).
- **Alcance:** `native/scripts/mock-api.mjs` con las respuestas de `tests/e2e/fixtures` para configuración, acceso e inicio de sesión, sin llamadas externas; `native/e2e/login.yaml` y un `README.md` con la convención de un archivo por journey; el job de Android de `native-smoke.yml` levanta la API simulada y corre los flujos.
- **Fuera de alcance:** los flujos de cada journey (los agrega su tarea; NAT-60 los completa y estabiliza).
- **Aceptación:** `login.yaml` verde en CI con captura.
- **Verificación:** verde nativo.

## NAT-80 — Build mínimo para validar con las tiendas: contenido, configuración y lista de envío

- **Objetivo:** dejar listo, sin credenciales, lo que NAT-H12 necesita para enviar un primer build a TestFlight externo y a la prueba cerrada de Play (H-02, H-14).
- **Alcance:** `docs/native-migration/store-validation.md` (contenido del build, advertencia sobre funcionalidad mínima, lista de envío con cuenta demo y notas para el revisor, qué registrar); `supportsTablet: false` y numeración de versión en `native/app.config.ts`; configuración de `submit` sin secretos en `native/eas.json`; confirmar `expo-updates` y `runtimeVersion` por huella. Detalle en la revisión §5, NAT-80.
- **Fuera de alcance:** ejecutar builds o envíos (NAT-H12); la ficha completa (NAT-62).
- **Aceptación:** `npx expo config --type public` sin errores; la lista se puede seguir sin conocer el repo.
- **Verificación:** verde nativo.
