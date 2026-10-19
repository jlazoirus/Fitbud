# Plan de migración de Evolv (web/PWA) a apps nativas iOS y Android

Fecha de creación: 2026-10-16. Estado: **aplazado desde 2026-10-19** — plan aprobado como referencia, ejecución en pausa.

> **Ejecución aplazada.** Por decisión de Jonathan (2026-10-19), la migración no se ejecuta hasta validar el producto con usuarios en la web/PWA. El foco actual es la validación descrita en `estrategia/01-Plan-de-Validacion.md`. Se reanuda solo con una decisión **GO** de esa validación (§5 de ese documento): entonces una persona ejecuta `node scripts/native-next-task.mjs --resume --human`, revisa que el plan siga vigente frente al código (`PLAN.md` §2 cita líneas de `index.html` que habrán cambiado) y arranca por las decisiones NAT-H1..H5. Mientras dure la pausa, `native-next-task.mjs` no ofrece ni deja reclamar tareas (`reason: "plan_paused"`), y lo que aprenda la validación (journeys que importan, disposición a pagar, plataforma de los usuarios) debe usarse para re-priorizar el backlog antes de reanudar.

Este documento es el plan maestro. Las piezas operativas están en:

| Archivo | Para qué sirve |
|---|---|
| `docs/native-migration/PLAN.md` | Este documento: objetivo, decisión, arquitectura, fases, riesgos y criterios de salida. |
| `docs/native-migration/ADR-001-stack.md` | Decisión técnica (Expo / React Native) y alternativas descartadas. |
| `docs/native-migration/BACKLOG.md` | Especificación de cada tarea `NAT-xx` (objetivo, alcance, aceptación, verificación). |
| `docs/native-migration/PARITY.md` | Matriz de paridad web → nativo por journey; checklist para declarar la beta. |
| `native-migration.json` | Backlog machine-readable: estado, dependencias, alcance de escritura y dueño de cada tarea. |
| `NATIVE_AGENT.md` | Runbook para agentes que trabajan en paralelo en la migración. |
| `scripts/native-next-task.mjs` | Selector/validador: lista tareas disponibles, reclama, libera y marca hechas. |

La fuente de verdad del estado de cada tarea es `native-migration.json` en `origin/main`. La fuente de verdad del comportamiento del producto sigue siendo el código web en `HEAD`.

## 1. Objetivo

Publicar Evolv como app nativa en App Store y Google Play con **paridad funcional con la PWA** para el usuario normal, mejor experiencia en lo que la web hace mal en móvil (reproductor de entreno en segundo plano, notificaciones, cámara, sesión persistente) y **sin duplicar la lógica de dominio**.

No es objetivo de esta migración:

- Reescribir el backend: Supabase + funciones `api/*.js` en Vercel se mantienen y se extienden.
- Apagar la PWA: la web sigue siendo canal de adquisición, administración y respaldo. Su eventual retiro es una decisión humana posterior (NAT-H8).
- Llevar el panel de administración a nativo: admin queda **solo web** (ver §6).

## 2. Punto de partida (evidencia en el código)

| Aspecto | Hoy | Implicación para nativo |
|---|---|---|
| UI | `index.html` monolítico (~12.4k líneas, ~780 funciones, handlers inline, render por template strings). | La UI **no** se puede reutilizar en React Native; se reescribe por pantalla. |
| Dominio | Módulos puros sin DOM en IIFE que publican en `globalThis`: `js/nutrition-pure.js`, `js/nutrition-domain.js`, `domain-contracts.js`, `training-plan.js`, `workout-player.js`, `sync-conflicts.js`, `exercise-catalog.js` (~170 KB). | **Reutilizables tal cual** en Hermes. Se cargan como módulos compartidos (NAT-02, NAT-21). |
| Lógica de dominio aún dentro de `index.html` | `buildDay()` (`index.html:1784`), `dayState()` (`:2206`), `mealValue()` (`:2310`), `dayTotals()` (`:2344`), `effectiveDayTarget()` (`:1525`), `weekOf()` (`:1774`), `migrateProfilePrefs()` (`:997`), `hasCompleteOnboarding()` (`:2638`), `streakStats()` (`:10099`), `prepareFirstCycleWeek()` (`:3468`), `finalizeDayWithGate()` (`:8471`), `pushDay/pullDay/commitDay` (`:10717-10806`), `callClaude()` (`:8389`). | Hay que **extraerla** a módulos puros antes de construir las pantallas nativas que la usan (Fase 1). La extracción también mejora la web. |
| Backend | `api/*.js` autentican con `Authorization: Bearer <supabase access token>` (p. ej. `api/claude.js:110`). | Funciona desde nativo sin cambios de auth. Falta base URL absoluta, identificación de cliente/versión y push nativo. |
| Auth | Supabase email/contraseña (`signInWithPassword`, `signUp`, `resetPasswordForEmail`); enlaces de correo vuelven a `location.origin` (`authRedirectUrl()`, `index.html:7364`). | Necesita deep links / Universal Links (NAT-12). Sin login social → "Sign in with Apple" no es obligatorio hoy. |
| Persistencia local | `localStorage`: `fitbud_v1` (estado `S`), `fitbud_syncq_v1` (cola offline), `fitbud_sync_meta_v1`, `fitbud_ui`, `fitbud_chat_v1_*`, `fitbud_meal_option_rerolls_v1`, `fitbros_tour_v1`. | Se reemplaza por un adaptador de almacenamiento inyectable (NAT-06, NAT-24). Mismo formato lógico para que web y nativo compartan reglas de sync. |
| Push | Web Push VAPID con `web-push` (`api/notify.js`, tabla `push_subscriptions(endpoint, keys_p256dh, keys_auth)`). | Necesita tokens nativos (APNs/FCM vía Expo Push) y una tabla nueva (NAT-11). |
| Cobro | Stripe Checkout de pago único (`api/checkout.js`, `success_url` web), webhooks, cupones, entitlements. | En iOS/Android vender acceso digital dentro de la app exige, por regla general, la compra integrada de la tienda. **Decisión humana NAT-H3.** |
| Cámara/voz | `<input type="file" capture="environment">` (foto de comida/progreso), Web Speech API (`toggleMic()`, `index.html:9803`). | `expo-image-picker`/cámara y reconocimiento de voz nativo (NAT-35, NAT-36). |
| Fotos privadas | Storage `progress-photos/<user_id>/...` con URLs firmadas. | Igual en nativo con supabase-js. |
| Analytics | `/api/analytics` con allowlist, sin datos de salud. | Reutilizar el mismo endpoint y allowlist; nada de SDKs de terceros con datos de salud. |
| Pruebas | ~100 validadores Node + Playwright E2E con fixtures (`tests/e2e`), `scripts/release-gate.mjs`. | Los validadores de dominio cubren también nativo porque es el mismo código. Se añade CI nativo (NAT-27) y E2E con Maestro (NAT-60). |

## 3. Decisión técnica (resumen; detalle en ADR-001)

**Expo (React Native) + TypeScript + expo-router**, en un directorio `native/` dentro de este mismo repositorio, consumiendo los módulos de dominio de la raíz sin copiarlos.

Por qué:

1. Reutiliza ~170 KB de dominio puro ya validado (nutrición, contratos, plan de entreno, reproductor, sync) y los ~100 validadores existentes.
2. Un solo código para iOS y Android, mantenible por agentes que ya conocen JS.
3. Integraciones nativas maduras: notificaciones, cámara, keep-awake, hápticos, voz, HealthKit/Health Connect, builds y envíos a tiendas (EAS), actualizaciones OTA para JS.
4. El backend (Supabase + Vercel) se usa igual: supabase-js funciona en React Native.

Descartadas: envolver la PWA con Capacitor (no es nativo, hereda el monolito y arriesga rechazo por "funcionalidad mínima"), Swift + Kotlin (dos reescrituras, cero reutilización) y Flutter (reescribir el dominio en Dart y perder los validadores).

## 4. Arquitectura objetivo

```
Fitbud/ (este repo)
├── index.html, js/, *.js           ← web/PWA (sin build step; no cambia de stack)
├── js/<módulos puros nuevos>.js    ← Fase 1: dominio extraído de index.html (IIFE, sin DOM)
├── api/*.js                        ← backend compartido (Vercel), extendido en Fase 2
├── supabase/*.sql                  ← migraciones idempotentes (aplicación manual)
└── native/                         ← app Expo (NO se publica en Vercel; .vercelignore ya lo excluye)
    ├── app/                        ← rutas expo-router: (auth), (onboarding), (tabs)/hoy|nutricion|entreno|progreso|perfil
    ├── src/core/                   ← puente tipado hacia los módulos puros de la raíz (+ .d.ts)
    ├── src/data/                   ← supabase client, repositorios, cola offline, api-client
    ├── src/ui/                     ← design system Evolv (tokens, componentes)
    ├── src/features/<journey>/     ← pantallas y hooks por journey (dueño único por tarea)
    └── e2e/                        ← flujos Maestro
```

Reglas de arquitectura:

- **Un solo dominio.** Ninguna regla de negocio (macros, contratos, progresión, sync, metas) se reimplementa en `native/`. Si hace falta y vive en `index.html`, primero se extrae a un módulo puro de la raíz (tarea `core`) y ambos clientes lo consumen.
- **Los módulos puros siguen el patrón actual**: IIFE que publica en `globalThis`, sin `window`/`document`/`localStorage`/`location`/`navigator`, cargables en Node y en Hermes. Los efectos (storage, red, reloj) se inyectan como parámetros.
- **Mismo contrato de datos.** `day_log.state`, `plan_versions.snapshot`, `profiles.prefs` (schema v3) y la cola offline se escriben con el mismo formato desde web y nativo. Un usuario puede alternar entre ambos sin perder ni duplicar datos (NAT-61).
- **El backend no confía en el cliente.** Cuotas, entitlements, validación del coach y privacidad siguen en servidor; nativo no recibe secretos nuevos.
- **Dependencias en `native/`**: se permiten las del allowlist de ADR-001. Cualquier otra requiere actualizar el ADR en la misma tarea y justificarla. El invariante "sin dependencias runtime nuevas" de la web **no cambia**.

## 5. Fases e hitos

| Fase | Contenido | Hito de salida | Paraleliza |
|---|---|---|---|
| 0 — Decisiones | NAT-H1..H5: aprobar stack, cuentas de tienda, modelo de cobro, revisión legal de privacidad, credenciales push/EAS. | ADR aprobado y cuentas creadas. | Humano; en paralelo con Fases 1–3. |
| 1 — Núcleo compartido | NAT-01..09: inventario y extracción del dominio de `index.html` a módulos puros, con validadores. | Las pantallas nativas pueden construirse sin tocar `index.html`. | Media: las extracciones que tocan `index.html` van de una en una (`exclusiveGroup: index-html`). |
| 2 — Backend para clientes nativos | NAT-10..13: identificación de cliente/versión, push nativo, deep links, entitlements multi-origen. | API lista para iOS/Android. | Alta. |
| 3 — Fundación nativa | NAT-20..28: scaffold, puente de dominio, design system, auth, datos offline, navegación, telemetría, CI, lint REQ-31. | App que inicia sesión, sincroniza y navega entre tabs vacías. | Media. |
| 4 — Paridad por journey | NAT-30..49: onboarding, primer ciclo, Hoy, nutrición, entreno, reproductor, progreso, cierre de ciclo, perfil, privacidad, notificaciones, suscripción, coach. | `PARITY.md` 100 % en verde para usuario normal. | **Alta**: una tarea = un journey con carpeta propia. |
| 5 — Valor nativo | NAT-50..52: Apple Health / Health Connect, widgets, Live Activity. | Opcional, post-beta. | Alta. |
| 6 — QA, beta y lanzamiento | NAT-60..63 + NAT-H6..H8: E2E Maestro, prueba web↔nativo, fichas de tienda, builds de beta, go/no-go. | App publicada. | Media. |

Ruta crítica estimada (con 3–4 agentes en paralelo y decisiones humanas a tiempo): Fase 1+2+3 ≈ 3–4 semanas; Fase 4 ≈ 4–6 semanas; Fase 6 ≈ 2 semanas incluyendo revisión de tiendas. La ruta crítica real la marcan NAT-H3 (cobro) y NAT-H4 (legal), no el desarrollo.

## 6. Alcance funcional

Dentro (paridad para usuario normal): login/registro/recuperación, onboarding 4 pasos con consentimientos y evaluación de seguridad, preparación del primer ciclo, Hoy, Nutrición (marcar, cambiar comida, rehacer opciones, extras, recientes/favoritas/alimento por gramos, editor manual, semana y lista de compras), estimar con foto, dictado, coach conversacional, Entreno (plan, detalle, demostraciones, reproductor con descansos y recuperación, generar/activar plan), Progreso (peso, grasa, gráfico, racha, check-in), cierre de ciclo con foto privada, Perfil completo, privacidad (exportar, borrar cuenta, consentimientos), recordatorios y push, suscripción/estado del plan, tour inicial.

Fuera (se queda en web): administración de usuarios, catálogos, ejercicios, cupones, consumo y QA; landing pública y reclutamiento beta; herramientas de desarrollo (key local en Ajustes). Un administrador en nativo ve un enlace "Abrir administración" que abre la web.

## 7. Decisiones humanas (gates)

Las tareas `NAT-Hx` no las puede cerrar un agente. Un agente puede preparar el material de decisión, pero el estado `hecho` lo pone una persona.

| ID | Decisión | Bloquea | Recomendación del plan |
|---|---|---|---|
| NAT-H1 | Aprobar ADR-001 (Expo/React Native en `native/`). | NAT-20 en adelante. | Aprobar. |
| NAT-H2 | Cuentas Apple Developer y Google Play Console; bundle id / package name; Team ID. | NAT-12 (Universal Links reales), NAT-63. | `club.evolvapp.app` en ambas plataformas. |
| NAT-H3 | Modelo de cobro dentro de las apps. | NAT-13, NAT-45. | Compra integrada de la tienda (pago único → "non-renewing subscription" en iOS / producto equivalente en Play) gestionada con un intermediario tipo RevenueCat o directamente con StoreKit 2 / Play Billing, sincronizada a `entitlements` con `origin` `apple`/`google`. Stripe sigue para web. Confirmar las reglas vigentes de App Store (3.1.1, 3.1.3) y Google Play (Payments) por país antes de decidir; no ofrecer cupones propios ni enlaces de pago externos dentro de la app sin validar la política vigente. |
| NAT-H4 | Revisión legal de privacidad para tiendas. | NAT-30 (texto de consentimiento), NAT-50, NAT-62. | Las guías de App Store (5.1.2(i), actualizada a fines de 2025) exigen informar y pedir permiso explícito cuando datos personales se comparten con IA de terceros. Eso **choca con REQ-31** si se aplica a la UI normal. Propuesta: excepción acotada a REQ-31 solo para el texto legal de consentimiento y la política de privacidad, nunca en la UI de uso diario. También: URL de política de privacidad pública, etiquetas de privacidad (App Store) y Data safety + declaración de apps de salud (Google Play), disclaimer médico. |
| NAT-H5 | Cuenta Expo/EAS, proyecto Firebase (FCM), llave APNs. | NAT-44, NAT-63. | Crear y guardar como secretos de EAS, nunca en el repo. |
| NAT-H6 | Aplicar en producción las migraciones SQL de la migración nativa. | Beta (NAT-63). | Aplicar tras revisar `supabase/native_*.sql`. |
| NAT-H7 | Aprobar fichas de tienda, capturas, clasificación de edad y formularios de privacidad. | NAT-63 público. | Revisar el borrador de NAT-62. |
| NAT-H8 | Go/no-go: beta cerrada → público; política de convivencia o retiro de la PWA. | Lanzamiento. | Mantener la PWA indefinidamente como canal web; reevaluar con métricas a 90 días del lanzamiento. |

## 8. Invariantes que aplican también a nativo

- **REQ-31:** la UI nativa de usuario normal no menciona IA, Claude, modelos, prompts, tokens ni cuotas internas. Se valida automáticamente (NAT-28). La única excepción posible es la que apruebe NAT-H4 para texto legal.
- **Privacidad por defecto:** fotos, salud, progreso y conversaciones son privados; nada de eso va a analytics ni a SDKs de terceros. Las fotos de comida para estimar no se guardan (REQ-172).
- **Historial inmutable** y **el coach propone, el sistema valida**: los mismos módulos puros deciden en ambos clientes.
- **Sin secretos en el cliente**: la key del proveedor del coach, Stripe, service role y VAPID privada siguen solo en servidor.
- **Migraciones SQL** idempotentes, con RLS, nunca aplicadas automáticamente a producción.
- **La web no se rompe:** toda tarea que toque la raíz (`index.html`, `js/`, `api/`, `supabase/`) debe dejar `node scripts/release-gate.mjs` en verde y subir `CACHE_NAME` si cambia el shell PWA.

## 9. Riesgos y mitigaciones

| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| Rechazo de App Store por modelo de cobro. | Alta si se usa Stripe dentro de la app. | Bloquea lanzamiento. | NAT-H3 antes de NAT-45; la beta (TestFlight) puede salir sin compra integrada con entitlements existentes. |
| Choque REQ-31 vs. divulgación obligatoria de IA de terceros. | Alta. | Rechazo / riesgo legal. | NAT-H4 con excepción acotada al texto legal. |
| Extraer dominio de `index.html` rompe la web. | Media. | Regresión en producción. | Extracciones pequeñas, una a la vez, release gate + E2E en verde, sin cambios de comportamiento. |
| Divergencia de reglas entre web y nativo. | Media. | Datos inconsistentes. | Regla "un solo dominio"; prohibido duplicar lógica en `native/` (revisión en PR + NAT-02). |
| Conflictos entre agentes en archivos calientes. | Alta sin coordinación. | Trabajo perdido. | `paths` por tarea, `exclusiveGroup`, reclamo atómico vía `origin/main` (ver `NATIVE_AGENT.md`). |
| Timers del reproductor en segundo plano (la app se suspende). | Media. | Descansos/duración incorrectos. | Tiempos por timestamp (lección de REQ-155/186) + notificaciones locales programadas al fin del descanso. |
| Sesión/tokens en el dispositivo. | Baja. | Fuga de sesión. | Sesión cifrada (SecureStore + almacenamiento cifrado), purga al cerrar sesión (lección REQ-156). |
| Universal Links sin Team ID. | Media. | Enlaces de correo abren la web. | Esquema propio `evolv://` provisional; Universal Links cuando exista NAT-H2. |
| Costos del coach por nuevos clientes. | Baja. | Gasto. | Mismo proxy, cuotas y trial server-side; nada cambia en la política de costos. |

## 10. Criterios de salida

Beta cerrada (TestFlight + Play Internal) cuando:

1. Todas las tareas de Fases 1–4 marcadas `hecho` salvo las que dependan de una decisión humana aún abierta, con su bloqueo documentado.
2. `PARITY.md` sin filas en rojo para usuario normal.
3. Flujos Maestro de NAT-60 en verde en iOS y Android.
4. NAT-61 (misma cuenta web ↔ nativo) sin pérdida ni duplicación de datos.
5. `node scripts/release-gate.mjs` en verde en `main` y CI nativo en verde.
6. NAT-H4 y NAT-H6 cerradas.

Lanzamiento público cuando además: NAT-H3 implementada (NAT-45), fichas aprobadas (NAT-H7), sin crash bloqueante en beta durante 2 semanas, y go de NAT-H8.

## 11. Métricas a observar (vía `/api/analytics`, sin datos sensibles)

Activación (onboarding completo / registros), D1/D7 retención por plataforma, sesiones de entreno completadas, comidas registradas por día activo, tasa de opt-in de push, errores de sync (`conflict`/`failed`) por plataforma, versión de app activa. Se agregan valores de `platform` y `app_version` al allowlist en NAT-10/NAT-26.
