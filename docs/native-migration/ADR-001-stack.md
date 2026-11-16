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

La base se instala en NAT-20 y el allowlist de pantallas en NAT-73 antes del siguiente cliente de desarrollo. Cualquier otra exige editar esta tabla en la misma tarea con justificación.

| Necesidad | Paquete |
|---|---|
| Runtime/navegación | `expo`, `expo-router`, `react`, `react-native`, `react-native-safe-area-context`, `react-native-screens`, `expo-linking`, `expo-constants`, `expo-status-bar`, `expo-splash-screen`, `expo-font` |
| Actualizaciones por aire | `expo-updates` (va desde el primer binario; sin él no hay OTA, ver `PUBLICACION.md` §5) |
| Backend | `@supabase/supabase-js`, `react-native-url-polyfill` |
| Almacenamiento | `expo-secure-store` (claves), `expo-sqlite` con SQLCipher (sesión y caché offline cifradas; aprobado por Jonathan en NAT-73) |
| Aleatoriedad segura | `expo-crypto`: bytes y claves; NAT-23 debe conectar `getRandomValues` antes de crear Supabase/PKCE, sin fallback a `Math.random`. |
| Red/estado del dispositivo | `@react-native-community/netinfo`, `expo-application`, `expo-device` |
| UI | `react-native-svg` (anillos, gráficos, demostraciones SVG), `expo-haptics`, `expo-image` |
| Funciones nativas | `expo-notifications`, `expo-image-picker`, `expo-image-manipulator`, `expo-keep-awake`, `expo-sharing`, `expo-file-system`, `expo-web-browser`, `expo-localization`, reconocimiento de voz (`expo-speech-recognition` u equivalente, se decide en NAT-36) |
| Compra integrada | Solo si NAT-H12 activa la contingencia (`react-native-purchases` si se elige RevenueCat; `expo-iap`/`react-native-iap` si se va directo). |
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

## NAT-73 — Almacenamiento aprobado y contrato para consumidores

Consulta documental: 2026-11-16. Base instalada: Expo 58.0.23 y React Native 0.88.1. **Aprobado por Jonathan en este chat el 2026-11-16:** expo-sqlite + SQLCipher y claves en SecureStore, después de revisar ambas opciones. No cierra ninguna NAT-Hx.

| Criterio | expo-sqlite + SQLCipher | react-native-mmkv V4 |
|---|---|---|
| Cifrado de datos de salud | Habilitar `useSQLCipher: true` y configurar la clave al abrir. Comprobar `cipher_version` y fallar si falta: `PRAGMA key` por sí solo puede ignorarse y dejar datos sin cifrar. | Configurar `encryptionKey`; sin ella guarda valores en texto plano. Ofrece AES-128 y opción AES-256. |
| Sesión y claves | Clave aleatoria protegida con SecureStore; nunca en código ni junto a la base. | Clave aleatoria protegida con SecureStore; nunca hardcodeada ni guardada en MMKV. |
| Arquitectura / SDK | Módulo de Expo documentado para SDK 58; SQLCipher requiere prebuild y binario propio, no Expo Go. | V4 usa JSI/Nitro y requiere RN ≥0.76; RN 0.88.1 cumple el mínimo, pero falta comprobar integración. Añade `react-native-nitro-modules`, fuera del allowlist actual. |
| Separación por usuario (diseño propuesto) | Una base y clave por `user_id`; adaptar el puerto asíncrono de NAT-06 en NAT-24. | Una instancia con id y clave por `user_id`; envolver la API síncrona en el puerto de NAT-06. |
| Mantenimiento / datos | Mismo proveedor que Expo; SQL y transacciones útiles para repositorios y cola. | Proyecto de Margelo sobre Tencent MMKV; API clave/valor sencilla y síncrona, con otra dependencia nativa que mantener. |

**Elección:** expo-sqlite con SQLCipher y claves en SecureStore. Encaja con el SDK y evita introducir Nitro. La sesión también debe quedar cifrada; NAT-23 implementará el adaptador y NAT-24 los repositorios, aislamiento y purga. Ninguna opción cifra automáticamente por el mero hecho de instalarla. Ambas requieren verificar cierre/cambio de usuario y tratamiento de backups; SecureStore tiene diferencias de persistencia entre plataformas.

**Fuentes primarias:** [SQLite SDK 58 / SQLCipher](https://docs.expo.dev/versions/v58.0.0/sdk/sqlite/#sqlcipher), [SecureStore SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/securestore/), [MMKV V4: instalación, cifrado, instancias y requisitos](https://github.com/margelo/react-native-mmkv).

**Contrato de implementación (NAT-23/24):** base y clave aleatoria independientes por `user_id`. Antes de persistir sesión o salud, comprobar `PRAGMA cipher_version` y fallar si el binario no incluye SQLCipher; aplicar la clave antes de cualquier tabla/consulta de datos. Nunca recurrir a almacenamiento en claro si falta una clave. No usar Expo Go para esta prueba. Al cerrar/cambiar sesión, cerrar la conexión y purgar datos, cola y claves según REQ-156. No confiar en desinstalar: Keychain puede sobrevivir en iOS. Conservar las exclusiones de backup de SecureStore y definir también las de la base en NAT-24. Este PR configura el binario; los adaptadores se implementan en sus tareas.

**Aleatoriedad:** la inspección del código instalado de React Native 0.88.1 (`Libraries/Core/InitializeCore.js` y `setUpGlobals.js`) y Expo no encuentra una instalación de `crypto.getRandomValues`. `@supabase/auth-js` (`generatePKCEVerifier`) cae en `Math.random` si `crypto` está ausente. Se añade `expo-crypto`; NAT-23 debe conectar su `getRandomValues` antes de crear Supabase y probarlo bajo Hermes. Instalarlo no instala un polyfill global. No usar `getRandomBytes` síncrono para ese adaptador: tiene un fallback débil con depuración remota. Las claves de base deben generarse con API nativa segura.

**Permisos:** `android.blockedPermissions` elimina cámara, micrófono, almacenamiento/medios, notificaciones, arranque, vibración, biometría y los permisos transitivos de FCM, badges y atribución identificados en los AAR descargados hasta su tarea de uso. El plugin de ImagePicker deshabilita sus tres textos de uso; SecureStore no solicita Face ID. NetInfo necesita estado de red y el runtime/OTA necesita internet. NAT-35/41 habilitan captura, NAT-44 notificaciones y NAT-22 hápticos solo cuando implementen su uso. Generar siempre el proyecto fuera del checkout y revisar el manifiesto combinado tras cada cambio de permisos.

**Huella de runtime:** las dependencias y SQLCipher cambian el binario: los clientes de desarrollo previos quedan obsoletos; generar uno nuevo. Sin builds firmados ni credenciales en esta tarea.

### Versiones añadidas/fijadas por NAT-73

Resueltas con `expo install` usando el mapa de SDK 58 incluido en Expo 58.0.23 (`EXPO_OFFLINE=1` por bloqueo del API de Expo); versiones exactas y transitivas en `native/package-lock.json`. `expo-constants` sube a 58.0.16 para evitar duplicación con Notifications.

| Paquete | Versión |
|---|---|
| `@react-native-community/netinfo` | 12.0.1 |
| `@supabase/supabase-js` | 2.119.0 |
| `expo-application` | 58.1.2 |
| `expo-constants` | 58.0.16 |
| `expo-crypto` | 58.0.8 |
| `expo-device` | 58.0.5 |
| `expo-file-system` | 58.0.13 |
| `expo-haptics` | 58.0.8 |
| `expo-image` | 58.0.18 |
| `expo-image-manipulator` | 58.0.16 |
| `expo-image-picker` | 58.0.10 |
| `expo-keep-awake` | 58.0.4 |
| `expo-localization` | 58.0.5 |
| `expo-notifications` | 58.1.9 |
| `expo-secure-store` | 58.0.3 |
| `expo-sharing` | 58.0.23 |
| `expo-sqlite` | 58.0.17 |
| `expo-web-browser` | 58.0.8 |
| `react-native-svg` | 15.16.0 |
| `react-native-url-polyfill` | 4.0.0 |

### Evidencia y límites de NAT-73

- CI del PR: [Native CI, corrida 40](https://github.com/jlazoirus/Fitbud/actions/runs/43943438151), verde en el commit de instalación. No incluye Doctor ni compilación nativa.
- Instalación limpia y versiones locales SDK compatibles; TypeScript/lint/Jest (29 pruebas locales tras ampliar permisos), formato, exportaciones Hermes iOS/Android y config público verdes.
- Prebuild temporal de iOS y Android confirma SQLCipher; iOS no añade textos de captura ni Face ID. Se inspeccionaron los manifiestos fuente y AAR disponibles (FCM, biometría, ShortcutBadger e Install Referrer); sus permisos sin uso están bloqueados.
- **No hay manifiesto combinado verificado:** Gradle llegó a `:app:processReleaseMainManifest`, pero el artefacto oficial `react-android-0.88.1-release.aar` redirige a `repo.reactnative.dev` y devuelve HTTP 403. La primera ejecución perdió el daemon; la repetición con un trabajador y heap de 768 MB llegó al bloqueo de descarga. No se cambió React Native ni se sustituyó el artefacto.
- Doctor: 18/20, dos controles sin datos por HTTP 403 de la red (`exp.host`, `api.expo.dev`, `reactnative.directory`). No se deshabilitaron controles. Falta repetirlo en una red habilitada.
- NAT-73 permanece bloqueada en `main` y en el PR. No habilita NAT-22 ni autoriza reclamar la siguiente tarea. La operación de sesión/base cifrada y PKCE real se probará en NAT-23/24; aquí no se presenta como ejecutada.
