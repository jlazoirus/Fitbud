# Política de publicación de las apps nativas

Fecha: 2026-11-07. Pedido de Jonathan: **pasar a apps nativas no debe quitarnos la capacidad de hacer cambios y mejoras rápidas.** Este documento dice por qué vía sale cada cambio, qué controles pasa y qué hacer si algo se rompe.

Relación con el resto del plan: complementa `PLAN.md` y define el trabajo de NAT-14 y NAT-64 (`BACKLOG.md`). La migración sigue en pausa (`native-migration.json`); esta política se aplica al reanudarla. Los plazos y umbrales marcados como "inicial" se ajustan con datos de la beta.

## 1. Qué permiten hoy Expo y las tiendas (verificado el 2026-11-07)

| Fuente | Regla | Qué significa para Evolv |
|---|---|---|
| Expo, EAS Update | Por aire (OTA) se actualiza lo no nativo: JavaScript, estilos e imágenes. No se puede con código o dependencias nativas, permisos ni versión del SDK. El usuario ve el cambio en la siguiente apertura o recarga. | Casi toda la interfaz y la lógica podrían salir sin versión nueva en tienda. |
| App Store 2.5.2 | La app no puede descargar ni ejecutar código que introduzca o cambie funciones. | Es la regla más estricta. Meter un módulo nuevo por aire es un riesgo real. |
| Licencia de Apple 3.3.1(B) | Permite descargar código interpretado si no cambia el propósito principal de la app, no evade la seguridad del sistema y no crea una tienda de otras apps. | Es la base que permite los OTA. |
| App Store 2.3.1(a) | Toda función nueva o cambio de producto debe describirse con detalle en las notas de revisión. | Cada versión en tienda declara también lo que salió por aire desde la anterior. |
| App Store 2.5.19 | Prohíbe funciones ocultas, latentes o no documentadas. | Un interruptor remoto no sirve para esconderle funciones a la revisión. |
| Google Play, abuso de dispositivos y redes | Prohíbe actualizarse fuera de Google Play, con una excepción para código que corre en un intérprete. El código interpretado cargado en ejecución no debe permitir violaciones de sus políticas. | Un OTA también debe cumplir las demás reglas, por ejemplo las de pagos. |

**Conclusión:** las reglas no trazan una línea exacta. Expo advierte que los cambios de comportamiento normalmente deben revisarse, y Apple aplica estas cláusulas: en marzo de 2026 retiró una app para crear apps citándolas. Por eso esta política es conservadora: **por aire se corrige y se pule; lo nuevo pasa por revisión.**

## 2. Por qué vía sale cada cambio

| Vía | Qué incluye | Cuándo llega al usuario | ¿Revisión? |
|---|---|---|---|
| **Servidor** | `api/*`, Supabase, cuotas, acceso, catálogo, validación del coach. | En minutos, como hoy. | No |
| **Por aire (OTA)** | Bugs, textos, estilos, imágenes, mejoras de pantallas y flujos existentes, ajustes de reglas en los módulos de dominio. | Siguiente apertura o recarga. | No |
| **Tienda, por criterio** | Funciones o journeys nuevos, cambios a lo que promete la ficha, pantallas de acceso y cobro (`COBRO-WEB.md` §4), textos de privacidad y consentimiento (NAT-H4), datos de salud (NAT-50). | Apple revisa el 90 % en menos de 48 h; después cada usuario actualiza. | Sí |
| **Tienda, obligatorio** | Código o dependencias nativas, permisos, configuración nativa de `app.config.ts`, versión de Expo. | Igual que la anterior. | Sí |

**Prueba rápida:** si el cambio obligaría a actualizar la ficha de la tienda, o si sorprendería a un revisor que ya vio la app, va por tienda. Ante la duda, también.

## 3. Cómo se publica por aire

Hacer push a `main` no publica en la app. La web sigue como hoy; la app publica en **trenes** que agrupan lo acumulado. EAS admite un solo despliegue gradual activo por rama, plataforma y versión de runtime, así que no se puede publicar commit por commit. Ritmo inicial: un tren al día como máximo.

1. **Controles.** `node scripts/release-gate.mjs`, CI nativo (NAT-27), validador de textos y cobro (NAT-28) y compatibilidad (NAT-14). Si la huella de runtime cambió, el cambio exige versión en tienda y no se publica por aire.
2. **Canal `preview`.** Se prueban los flujos críticos con cuentas QA (Maestro, NAT-60).
3. **`production` al 10 %.** `eas update --rollout-percentage=10`.
4. **Observar.** Mínimo 2 horas y 20 aperturas con esa actualización; si en 24 horas no se alcanzan, se decide con lo observado (inicial). Se miran los errores no controlados y de sync por `update_id` en `/api/analytics` (NAT-26). Con pocos usuarios, el 10 % da poca señal; por eso cuentan las aperturas y el paso 2.
5. **Ampliar al 100 %** con `eas update:edit`, o revertir (§4).

**Se detiene** si aparece un error nuevo en un flujo crítico (iniciar sesión, Hoy, marcar comida, reproductor de entreno, sync) o si la tasa de errores duplica la de la actualización anterior (inicial).

**Quién hace qué:**

- Un agente puede ejecutar los pasos 1 a 3, pero nunca publica directo al 100 %.
- Las primeras 20 ampliaciones al 100 % las aprueba una persona (inicial). Después se pueden automatizar si los criterios de detención ya se miden solos.
- Revertir no necesita aprobación.

## 4. Cuando algo se rompe

| Situación | Qué hacer |
|---|---|
| Error con el tren al 10 % | `eas update:revert-update-rollout`. |
| Error con el tren al 100 % | `eas update:rollback`. Llega en la siguiente apertura o recarga. Si no hay una versión segura a la cual volver, publicar el arreglo hacia adelante. |
| Arreglo urgente con un despliegue activo | Publicar con `--force-end-active-rollout`, manteniendo los controles del paso 1. |
| Bug del binario que un OTA no puede arreglar | Detener el despliegue (§5), enviar la versión corregida y pedir a Apple revisión acelerada, que admite bugs críticos si se incluyen los pasos para reproducirlos. |
| Bug de servidor | Revertir el deploy en Vercel. |

Límites a tener presentes:

- **Volver atrás no siempre es seguro.** Expo lo advierte para actualizaciones que cambiaron datos locales de forma no compatible. Por eso aplica la regla 4 de §6.
- **La recuperación automática de Expo ayuda, pero no se confía en ella.** Solo actúa con errores fatales en los primeros 10 segundos, y Expo avisa que ese comportamiento puede cambiar.

## 5. Versiones en tienda

- **Ritmo inicial:** cada dos semanas, solo si hay algo que lo justifique. Con los tiempos de Apple, lo nuevo espera días, no semanas. Las páginas de Google consultadas no publican un plazo para revisar actualizaciones.
- **Notas de revisión:** describen con detalle las novedades, incluidas las que salieron por aire desde la versión anterior (2.3.1(a)).
- **Despliegue gradual en Apple:** 7 días (1, 2, 5, 10, 20, 50 y 100 %), con pausas de hasta 30 días en total. Aun así, cualquiera puede descargar la versión a mano.
- **Despliegue gradual en Google:** solo para actualizaciones. El porcentaje se sube a mano y se puede detener.
- **Etiqueta Git por binario** (`native-vX.Y.Z`): permite publicar un arreglo por aire a esa versión desde su código.
- **Primer binario:** debe incluir `expo-updates`; sin ese módulo no hay OTA posible. También conviene incluir los módulos nativos del allowlist que se usarán pronto, para evitar versiones extra, sin pedir permisos que la app todavía no usa.
- **Interruptores remotos** desde `/api/config`: sirven para apagar algo roto o encender por etapas una función ya revisada. Nunca para esconderla de la revisión (2.5.19).
- **Primera vez en Google Play:** una cuenta personal creada después del 13 de noviembre de 2023 debe hacer una prueba cerrada con al menos 12 testers durante 14 días seguidos, más una revisión de acceso a producción que suele tardar hasta 7 días. La página oficial no menciona las cuentas de organización; confirmarlo al crear la cuenta (NAT-H2).

## 6. Compatibilidad con versiones anteriores

Hoy casi todos usan la última versión de la web. Con la app conviven varias: quien no actualiza se queda en su binario, y un binario no recibe los OTA de otra versión de runtime. En los últimos 30 días, 46 commits cambiaron cliente y servidor a la vez; con la app eso ya no se podrá hacer sin estas reglas:

1. **La API solo crece.** Los campos nuevos son opcionales. No se quita ni cambia de tipo un campo mientras una versión soportada lo use.
2. **Primero el servidor, después la app.** El servidor nuevo debe funcionar con la app vieja antes de publicar la app nueva.
3. **Los datos compartidos no se pierden.** Al reescribir `day_log.state`, `plan_versions.snapshot` o `profiles.prefs`, una versión vieja conserva los campos que no conoce.
4. **Los datos locales cambian de forma reversible.** Un OTA no cambia el formato de la cola offline ni de la caché si la versión anterior no puede leerlo.
5. **`minVersion` es el último recurso** (NAT-49), porque bloquea al usuario. Se soportan las versiones de los últimos 90 días (inicial), y antes de subir el mínimo se revisa cuántos usuarios quedarían bloqueados.

## 7. Decisión pendiente: cuántos clientes reciben cada cambio

La revisión cuesta días en algunos cambios; mantener dos interfaces cuesta trabajo en casi todos. En los últimos 30 días hubo 268 commits sin contar merges: 211 tocaron el cliente (unos 7 al día) y 16 fueron solo de servidor. La clasificación es por rutas de archivo, no commit por commit.

| Opción | Cómo funciona | Efecto |
|---|---|---|
| **A. La app es el cliente principal (recomendada)** | Con la paridad lograda, los cambios de producto para usuarios con cuenta van solo a la app. La web queda para portada, tienda, administración y arreglos críticos. | Un solo esfuerzo por cambio. Quien use solo la web deja de recibir novedades. |
| **B. Dos clientes a la par** | Cada cambio se hace y se prueba en web y en app. | La web sigue completa, con el doble de trabajo de interfaz. |

La opción A no apaga la PWA: sigue activa, pero en mantenimiento. **Decide Jonathan en NAT-H8**, con los datos de la validación (plataforma y uso reales), de preferencia al reanudar la migración, porque cambia lo que vale la pena construir. Hasta entonces sigue vigente la recomendación de `PLAN.md` §7.

Al decidir, cada REQ pasa a declarar a qué cliente aplica y se actualizan `AUTONOMOUS_AGENT.md` y `AUDIT_AGENT.md`, porque hoy el loop desarrollador no toma trabajo nativo.

## 8. Tareas que aplican esta política

| Tarea | Qué aporta |
|---|---|
| NAT-14 (nueva) | Validador de compatibilidad de API y de datos compartidos (§6). |
| NAT-64 (nueva) | Trenes OTA con controles, 10 %, ampliación y reversión (§3 y §4). |
| NAT-10, NAT-26 | `update_id` en la telemetría, para observar cada tren. |
| NAT-49 | `minVersion` como último recurso; buscar actualizaciones también al volver a primer plano. |
| NAT-63 | `expo-updates` en el primer binario, etiqueta por binario y checklist con §5. |
| NAT-H2 | Tipo de cuenta de Google Play (§5). |
| NAT-H8 | Cliente principal (§7) y go/no-go con NAT-64 lista. |

## 9. Fuentes

Las reglas cambian seguido: volver a verificarlas al reanudar la migración y antes de cada envío a revisión.

- Expo: [preguntas frecuentes de EAS Update](https://docs.expo.dev/eas-update/faq/), [rollouts](https://docs.expo.dev/eas-update/rollouts/), [rollbacks](https://docs.expo.dev/eas-update/rollbacks/), [recuperación de errores](https://docs.expo.dev/eas-update/error-recovery/) y [versiones de runtime](https://docs.expo.dev/eas-update/runtime-versions/).
- Apple: [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), [licencia del Developer Program](https://developer.apple.com/support/terms/apple-developer-program-license-agreement/), [tiempos de App Review](https://developer.apple.com/distribute/app-review/) y [despliegue por fases](https://developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases/).
- Google Play: [abuso de dispositivos y redes](https://support.google.com/googleplay/android-developer/answer/16559646?hl=en), [requisitos de prueba para cuentas personales](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en) y [despliegues graduales](https://support.google.com/googleplay/android-developer/answer/6346149?hl=en).
- Caso de aplicación: [9to5Mac, marzo de 2026](https://9to5mac.com/2026/03/30/apple-steps-up-crackdown-on-vibe-coding-apps/).
