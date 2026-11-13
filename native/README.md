# Evolv para iOS y Android

Base de la migración NAT-20, con Expo SDK 58 y TypeScript estricto. El plan operativo está en `../docs/native-migration/PLAN.md` y el estado en `../native-migration.json`.

Este primer hito arranca con una pantalla de bienvenida. Los grupos de rutas de acceso, onboarding y aplicación están preparados para NAT-23, NAT-30 y NAT-25. Autenticación, planes y sincronización se implementan en esas tareas.

## Desarrollo local

Requiere Node 22.14 o posterior y npm. Desde este directorio ejecutar

```sh
npm ci
npm start
```

`npm run web` abre una vista local del mismo código React Native. `npm run ios` y `npm run android` abren un cliente de desarrollo instalado en un simulador o dispositivo. Para compilar ese cliente localmente se necesitan Xcode o Android SDK y `npx expo run:ios` / `npx expo run:android`. También puede generarse en EAS tras NAT-H2 y NAT-H5. Expo Go puede ir una versión de SDK por detrás durante la transición a SDK 58.

## Comprobaciones

```sh
npm run typecheck
npm run lint
npm test
npm run format:check
npx expo install --check
npx expo-doctor
npm run export
```

La exportación genera JavaScript, recursos y bytecode Hermes para iOS y Android, más la vista web, en `dist/`. Las pruebas en teléfonos y los binarios firmados se verifican por separado. El despliegue de Vercel excluye todo `native/` mediante la allowlist de la raíz.

## Vinculación y builds

Los perfiles `development`, `preview` y `production` tienen canales separados. `development` usa un cliente de desarrollo. `preview` distribuye internamente y `production` incrementa la numeración de builds gestionada por EAS.

NAT-29 vincula el código con [@jlazo/evolv](https://expo.dev/accounts/jlazo/projects/evolv), creado y verificado en Expo el 2026-11-13. `app.config.ts` fija el owner `jlazo` y el projectId público `8ca822d7-81ed-4428-969d-bbcd1f586b0b`. El mismo ID determina `extra.eas.projectId` y `updates.url`. No hace falta un `.env` para esta vinculación.

La sesión del navegador y la del terminal son independientes. Para autenticar EAS CLI y comprobar la asociación desde este directorio:

```sh
npx eas-cli@27.9.0 login --device
npx eas-cli@27.9.0 project:info
```

`native/.env.example` documenta los overrides públicos `EAS_PROJECT_ID` y `EXPO_OWNER` para un proyecto aislado de QA; configurar ambos al cambiar de cuenta. Un UUID inválido o un owner vacío detiene la configuración. No guardar credenciales en esos archivos.

Los identificadores provisionales `club.evolvapp.app` se sustituyen con `IOS_BUNDLE_IDENTIFIER` y `ANDROID_PACKAGE_NAME` cuando NAT-H2 los confirme. Crear el proyecto no cierra NAT-H2/H5: aún faltan cuentas de tiendas, firma y credenciales push. Después de esos gates:

```sh
npx eas-cli@27.9.0 build --profile development --platform android
npx eas-cli@27.9.0 build --profile preview --platform all
```

Las credenciales de firma se gestionan en EAS. El repositorio solo guarda identificadores públicos. Las actualizaciones quedan asociadas al proyecto de Evolv y conservan la política de compatibilidad `fingerprint`; la vinculación no publica un build ni una actualización OTA.

`expo-updates` está instalado desde el primer hito, con compatibilidad basada en `fingerprint`. La publicación gradual y las aprobaciones están previstas en NAT-64. Sus reglas viven en `../docs/native-migration/PUBLICACION.md`.

## Alcance de esta base

Se reutilizan el icono y los colores existentes. NAT-22 desarrollará los componentes y la tipografía de la interfaz. El icono actual de 512 px sirve para desarrollo, y NAT-62 debe preparar los recursos de tienda con sus dimensiones finales.

## Dominio compartido (NAT-21)

`src/core/index.ts` importa los siete módulos originales del repositorio. Se carga desde el layout raíz y exporta `nutritionPure`, `nutrition`, `contracts`, `exercises`, `trainingPlan`, `workoutPlayer` y `sync`. Los tipos de `src/core/types/domain.d.ts` cubren las funciones verificadas; cada feature amplía esa superficie desde el código real, sin reimplementar las reglas.

```ts
import { nutrition, sync } from './src/core';

const kcal = nutrition.kcalFromMacros(160, 284, 64);
const result = sync.mergeDayLogStates(base, local, remote);
// Si result.ok es false, conservar el conflicto para resolverlo en la UI.
```

Las instalaciones npm de la raíz y de `native/` son independientes. `metro.config.js` extiende la configuración de Expo y agrega la raíz a `watchFolders` para resolver los módulos compartidos. La base web mantiene su despliegue y sus dependencias runtime.

Verificación del puente: TypeScript y ESLint verdes, 10 pruebas Jest en total (6 del puente), exportación de iOS/Android a bytecode Hermes y web completada. La vista web arranca a 390 × 844 sin errores ni desbordamiento, con los siete namespaces presentes y un cálculo de macros comprobado. Los casos de dominio cubren recetas, metas, plan de cuatro semanas, restauración de series/temporizador, pausa por ausencia y merge/conflicto entre dispositivos, conservando los snapshots de entrada.

**NAT-21 conserva pendiente la aceptación en un dispositivo o simulador con Hermes.** Este Mac tiene Command Line Tools, pero no Xcode completo ni Android SDK. La cuenta y el proyecto Expo/EAS ya existen (NAT-29); la autenticación del terminal se comprueba por separado. El compilador `hermesc` incluido permite generar bytecode; no ejecuta la app. Tras NAT-H2/H5, generar un cliente de desarrollo, iniciar la app y comprobar el arranque sin errores en iOS y Android antes de cerrar la tarea. La migración aún no tiene autenticación ni pantallas de producto.

La regresión web que precede al puente pasó 333/333 E2E y todos los checks funcionales del gate (120/121; el único fallo es la rama de trabajo, excepción documentada en `NATIVE_AGENT.md`). El fixture de recordatorios se verificó en las 24 horas UTC. Las evidencias locales están en `/Users/jonathan/.fitbros/qa-archive/native-kickoff/`.

## Verificación inicial del 10 de noviembre de 2026

Instalación limpia, TypeScript, ESLint, cuatro pruebas Jest y diagnóstico Expo 20/20. Exportación de iOS y Android a Hermes y web completada. La vista web de desarrollo se revisó a 390 × 844 y 820 × 1180 sin errores de ejecución ni desbordamiento. Las pruebas en simuladores y dispositivos quedan pendientes de Xcode, Android SDK o acceso a EAS.

`npm audit` informa 31 incidencias transitivas (30 moderadas y una baja) en herramientas de Expo, Jest y ESLint, asociadas a glob, minimatch y deepmerge. `npm audit fix` conserva ese resultado. La remediación automática restante propone degradaciones incompatibles del SDK o de Jest. Revisar actualizaciones compatibles antes de distribuir builds. Esta base no procesa datos de usuarios.
