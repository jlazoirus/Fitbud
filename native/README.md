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

Después de que Jonathan habilite las cuentas, registrar el proyecto con `npx eas-cli@latest init` y configurar el identificador público `EAS_PROJECT_ID` en el entorno local y en los tres entornos de EAS. La configuración dinámica lee ese valor. Los identificadores provisionales `club.evolvapp.app` se sustituyen con `IOS_BUNDLE_IDENTIFIER` y `ANDROID_PACKAGE_NAME` cuando NAT-H2 los confirme.

```sh
npx eas-cli@latest build --profile development --platform android
npx eas-cli@latest build --profile preview --platform all
```

Las credenciales de firma se gestionan en EAS. El repositorio solo guarda identificadores públicos. La configuración bloquea un build de EAS sin `EAS_PROJECT_ID`. Localmente las actualizaciones permanecen desactivadas hasta vincularlo.

`expo-updates` está instalado desde el primer hito, con compatibilidad basada en `fingerprint`. La publicación gradual y las aprobaciones están previstas en NAT-64. Sus reglas viven en `../docs/native-migration/PUBLICACION.md`.

## Alcance de esta base

Se reutilizan el icono y los colores existentes. NAT-22 desarrollará los componentes y la tipografía de la interfaz. El icono actual de 512 px sirve para desarrollo, y NAT-62 debe preparar los recursos de tienda con sus dimensiones finales. NAT-21 incorporará el puente a los módulos de dominio, evitando copias de la lógica web.

## Verificación inicial del 10 de noviembre de 2026

Instalación limpia, TypeScript, ESLint, cuatro pruebas Jest y diagnóstico Expo 20/20. Exportación de iOS y Android a Hermes y web completada. La vista web de desarrollo se revisó a 390 × 844 y 820 × 1180 sin errores de ejecución ni desbordamiento. Las pruebas en simuladores y dispositivos quedan pendientes de Xcode, Android SDK o acceso a EAS.

`npm audit` informa 31 incidencias transitivas (30 moderadas y una baja) en herramientas de Expo, Jest y ESLint, asociadas a glob, minimatch y deepmerge. `npm audit fix` conserva ese resultado. La remediación automática restante propone degradaciones incompatibles del SDK o de Jest. Revisar actualizaciones compatibles antes de distribuir builds. Esta base no procesa datos de usuarios.
