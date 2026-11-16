# ADR-001 — Stack de las apps nativas de Evolv

- Estado: **aceptado por Jonathan el 2026-11-10** (NAT-H1, instrucción de iniciar la migración tras revisar Expo / React Native).
- Fecha: 2026-10-16.
- Contexto completo: `docs/native-migration/PLAN.md`.

## Contexto

Evolv es una PWA vanilla sin build step. La UI vive en un `app/index.html` de ~12.4k líneas con render por template strings y handlers inline; no es portable a ningún framework nativo. En cambio, el dominio crítico ya está en módulos puros sin DOM (`js/nutrition-pure.js`, `js/nutrition-domain.js`, `domain-contracts.js`, `training-plan.js`, `workout-player.js`, `sync-conflicts.js`, `exercise-catalog.js`) cubiertos por ~100 validadores Node. El backend (Supabase + funciones Vercel con auth Bearer) es independiente del cliente.

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
| Actualizaciones por aire | `expo-updates` (va desde el primer binario; sin él no hay OTA, ver `PUBLICACION.md` §5) |
| Backend | `@supabase/supabase-js`, `react-native-url-polyfill` |
| Almacenamiento | `expo-secure-store` (llaves/sesión), `react-native-mmkv` o `expo-sqlite` (caché offline; la elección se registra en NAT-24) |
| Red/estado del dispositivo | `@react-native-community/netinfo`, `expo-application`, `expo-device` |
| UI | `react-native-svg` (anillos, gráficos, demostraciones SVG), `expo-haptics`, `expo-image` |
| Funciones nativas | `expo-notifications`, `expo-image-picker`, `expo-image-manipulator`, `expo-keep-awake`, `expo-sharing`, `expo-file-system`, `expo-web-browser`, `expo-localization`, reconocimiento de voz (`expo-speech-recognition` u equivalente, se decide en NAT-36) |
| Compra integrada | Según NAT-H3 (`react-native-purchases` si se elige RevenueCat; `expo-iap`/`react-native-iap` si se va directo). |
| Salud (Fase 5) | `react-native-health` (iOS), `react-native-health-connect` (Android) — solo tras NAT-H4. |
| Dev/test | `typescript`, `jest-expo`, `@testing-library/react-native`, `eslint` + config de Expo, `prettier`. E2E: Maestro (CLI externo, no dependencia npm). |
| Arranque y verificación NAT-20 | `expo-dev-client` para instalar un cliente de desarrollo, `react-dom`, `react-native-web` y `@expo/metro-runtime` para comprobar localmente la interfaz compartida. `jest`, `@types/jest` y `@types/react` para ejecutar las pruebas tipadas. |

Prohibido en `native/`: SDKs de analytics/ads de terceros, SDKs que reciban datos de salud, fotos o conversaciones, y cualquier SDK del proveedor del coach (la llamada sigue por `/api/claude`).

## Consecuencias

- Positivas: una sola fuente de reglas de negocio; los validadores existentes protegen ambos clientes; tareas por journey paralelizables entre agentes.
- Negativas: la UI se escribe dos veces (web y nativo) mientras convivan; hay que extraer dominio de `app/index.html` (Fase 1) antes de varias pantallas; aparece un toolchain con build (solo en `native/`).
- Neutras: la app nativa depende de que `https://evolvapp.club/api/*` siga siendo estable → se versiona por cabecera de cliente (NAT-10).

## Versiones fijadas

NAT-20, 2026-11-10. Expo 58.0.23, Expo Router 58.0.30, React Native 0.88.1, React 19.3.0, TypeScript 6.0.3, Jest 30.5.2 y jest-expo 58.0.14. Verificación local con Node 22.22.0 y npm 10.9.4. Las versiones de instalación quedan fijadas en `native/package-lock.json`. Node mínimo 22.14.0. El job de CI se implementa en NAT-27.

## NAT-73 — Comparación de almacenamiento (pendiente de Jonathan)

Consulta documental: 2026-11-16. Base instalada: Expo 58.0.23 y React Native 0.88.1. **Propuesta, no elección fijada:** Jonathan pidió revisar ambas opciones antes de seleccionar. No se instalaron paquetes ni se cambió la configuración en esta etapa.

| Criterio | expo-sqlite + SQLCipher | react-native-mmkv V4 |
|---|---|---|
| Cifrado de datos de salud | Habilitar `useSQLCipher: true` y configurar la clave al abrir. Comprobar `cipher_version` y fallar si falta: `PRAGMA key` por sí solo puede ignorarse y dejar datos sin cifrar. | Configurar `encryptionKey`; sin ella guarda valores en texto plano. Ofrece AES-128 y opción AES-256. |
| Sesión y claves | Clave aleatoria protegida con SecureStore; nunca en código ni junto a la base. | Clave aleatoria protegida con SecureStore; nunca hardcodeada ni guardada en MMKV. |
| Arquitectura / SDK | Módulo de Expo documentado para SDK 58; SQLCipher requiere prebuild y binario propio, no Expo Go. | V4 usa JSI/Nitro y requiere RN ≥0.76; RN 0.88.1 cumple el mínimo, pero falta comprobar integración. Añade `react-native-nitro-modules`, fuera del allowlist actual. |
| Separación por usuario (diseño propuesto) | Una base y clave por `user_id`; adaptar el puerto asíncrono de NAT-06 en NAT-24. | Una instancia con id y clave por `user_id`; envolver la API síncrona en el puerto de NAT-06. |
| Mantenimiento / datos | Mismo proveedor que Expo; SQL y transacciones útiles para repositorios y cola. | Proyecto de Margelo sobre Tencent MMKV; API clave/valor sencilla y síncrona, con otra dependencia nativa que mantener. |

**Recomendación provisional:** expo-sqlite con SQLCipher y claves en SecureStore. Encaja con el SDK y evita introducir Nitro. La sesión también debe quedar cifrada; NAT-23 implementará el adaptador y NAT-24 los repositorios, aislamiento y purga. Ninguna opción cifra automáticamente por el mero hecho de instalarla. Ambas requieren verificar cierre/cambio de usuario y tratamiento de backups; SecureStore tiene diferencias de persistencia entre plataformas.

**Fuentes primarias:** [SQLite SDK 58 / SQLCipher](https://docs.expo.dev/versions/v58.0.0/sdk/sqlite/#sqlcipher), [SecureStore SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/securestore/), [MMKV V4: instalación, cifrado, instancias y requisitos](https://github.com/margelo/react-native-mmkv).

**Verificación pendiente:** decisión de Jonathan, instalación compatible mediante `expo install`, aleatoriedad PKCE en Hermes, manifiesto Android combinado y permisos bloqueados, instalación limpia/doctor, checks nativos y web, exportaciones iOS/Android. No hay evidencia de compilación o cifrado ejecutado; NAT-73 no está terminada y no habilita NAT-22.
