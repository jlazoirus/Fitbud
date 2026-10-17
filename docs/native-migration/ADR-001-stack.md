# ADR-001 — Stack de las apps nativas de Evolv

- Estado: **propuesto** (se acepta al cerrar NAT-H1).
- Fecha: 2026-10-16.
- Contexto completo: `docs/native-migration/PLAN.md`.

## Contexto

Evolv es una PWA vanilla sin build step. La UI vive en un `index.html` de ~12.4k líneas con render por template strings y handlers inline; no es portable a ningún framework nativo. En cambio, el dominio crítico ya está en módulos puros sin DOM (`js/nutrition-pure.js`, `js/nutrition-domain.js`, `domain-contracts.js`, `training-plan.js`, `workout-player.js`, `sync-conflicts.js`, `exercise-catalog.js`) cubiertos por ~100 validadores Node. El backend (Supabase + funciones Vercel con auth Bearer) es independiente del cliente.

Restricciones: equipo pequeño apoyado por agentes autónomos, mismo idioma (JS) que el resto del repo, iOS y Android a la vez, sin reescribir reglas de negocio, backend sin cambios de proveedor.

## Opciones evaluadas

| Opción | Reutiliza dominio | Reutiliza UI | Experiencia nativa | Costo de mantener | Riesgo tienda | Veredicto |
|---|---|---|---|---|---|---|
| **A. Expo / React Native (TS)** | Sí, los módulos puros corren en Hermes. | No (se reescribe por pantalla). | Alta. | 1 código, JS. | Bajo. | **Elegida.** |
| B. Capacitor envolviendo la PWA | Sí. | Sí. | Baja (WebView del monolito). | Bajo al inicio, alto después (el monolito sigue creciendo). | Medio: "funcionalidad mínima" (App Store 4.2). | Descartada como destino. Solo sería un puente si apareciera una urgencia de estar en tienda antes que la paridad nativa; no se planifica. |
| C. Swift (iOS) + Kotlin (Android) | No. | No. | Máxima. | 2 códigos, 2 lenguajes nuevos. | Bajo. | Descartada: duplica todo y descarta los validadores. |
| D. Flutter | No (reescribir en Dart). | No. | Alta. | 1 código, lenguaje nuevo. | Bajo. | Descartada: pierde el dominio y los validadores. |

## Decisión

1. App en `native/` dentro de este repositorio (monorepo ligero, sin workspaces obligatorios), con Expo SDK estable vigente al ejecutar NAT-20, TypeScript estricto, expo-router y builds con EAS. La versión exacta de SDK y de cada dependencia se fija en `native/package.json` en NAT-20 y se registra en la sección "Versiones fijadas" de este ADR.
2. Los módulos de dominio de la raíz se consumen **sin copiarlos**: Metro observa la raíz del repo (`watchFolders`) y `native/src/core/` los importa por efecto lateral y expone fachadas tipadas desde `globalThis.FITBUD_*`. Los `.d.ts` viven en `native/src/core/types/`.
3. La web no cambia de stack: sigue sin build step ni dependencias runtime nuevas.
4. Backend compartido: mismas funciones `api/*.js` y mismo proyecto Supabase.

## Allowlist inicial de dependencias en `native/`

Se instalan en NAT-20 (las de feature, en la tarea de fundación que las use primero). Cualquier otra exige editar esta tabla en la misma tarea con justificación.

| Necesidad | Paquete |
|---|---|
| Runtime/navegación | `expo`, `expo-router`, `react`, `react-native`, `react-native-safe-area-context`, `react-native-screens`, `expo-linking`, `expo-constants`, `expo-status-bar`, `expo-splash-screen`, `expo-font` |
| Backend | `@supabase/supabase-js`, `react-native-url-polyfill` |
| Almacenamiento | `expo-secure-store` (llaves/sesión), `react-native-mmkv` o `expo-sqlite` (caché offline; la elección se registra en NAT-24) |
| Red/estado del dispositivo | `@react-native-community/netinfo`, `expo-application`, `expo-device` |
| UI | `react-native-svg` (anillos, gráficos, demostraciones SVG), `expo-haptics`, `expo-image` |
| Funciones nativas | `expo-notifications`, `expo-image-picker`, `expo-image-manipulator`, `expo-keep-awake`, `expo-sharing`, `expo-file-system`, `expo-web-browser`, `expo-localization`, reconocimiento de voz (`expo-speech-recognition` u equivalente, se decide en NAT-36) |
| Compra integrada | Según NAT-H3 (`react-native-purchases` si se elige RevenueCat; `expo-iap`/`react-native-iap` si se va directo). |
| Salud (Fase 5) | `react-native-health` (iOS), `react-native-health-connect` (Android) — solo tras NAT-H4. |
| Dev/test | `typescript`, `jest-expo`, `@testing-library/react-native`, `eslint` + config de Expo, `prettier`. E2E: Maestro (CLI externo, no dependencia npm). |

Prohibido en `native/`: SDKs de analytics/ads de terceros, SDKs que reciban datos de salud, fotos o conversaciones, y cualquier SDK del proveedor del coach (la llamada sigue por `/api/claude`).

## Consecuencias

- Positivas: una sola fuente de reglas de negocio; los validadores existentes protegen ambos clientes; tareas por journey paralelizables entre agentes.
- Negativas: la UI se escribe dos veces (web y nativo) mientras convivan; hay que extraer dominio de `index.html` (Fase 1) antes de varias pantallas; aparece un toolchain con build (solo en `native/`).
- Neutras: la app nativa depende de que `https://evolvapp.club/api/*` siga siendo estable → se versiona por cabecera de cliente (NAT-10).

## Versiones fijadas

Completar en NAT-20: versión de Expo SDK, React Native, TypeScript y Node usada en CI.
