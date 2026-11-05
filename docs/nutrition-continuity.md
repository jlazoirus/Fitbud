# Nutrición: preferencias y continuidad del menú — REQ-349

Solicitud de Jonathan del 5 de noviembre de 2026, a partir del feedback de Sathya.

## Comportamiento

- Nutrición muestra el rango de fechas, el estado del menú y «Preparar mi semana» fuera de Más opciones. Los rangos usan las semanas del ciclo, no semanas de lunes a domingo.
- El menú sigue siendo opcional. La opción «Preparar automáticamente mis próximas semanas» está desactivada hasta que el usuario la elige. Se guarda como `profiles.prefs.autoNutritionWeeks` y puede desactivarse en Nutrición.
- Con esa opción activa, al entrar, volver del segundo plano o recuperar conexión se completan las franjas vacías de la semana actual. Se usa el catálogo y el motor local, sin llamadas automáticas al proveedor ni generación con la app cerrada.
- No se rehace lo ya asignado. Se conservan comidas registradas, saltadas y elecciones manuales compatibles. El menú manual también permite completar hoy después de haber desayunado.
- Guardar restricciones revisa hoy y todas las fechas futuras con prescripción, incluidas versiones sin overrides locales. También se revisa el menú al iniciar sesión: las preferencias guardadas antes de esta versión se aplican al menú pendiente existente.
- El veto se comprueba por nombre, ingredientes materializados y receta del catálogo. «Como de todo» puede combinarse con «Sin lácteos». La exclusión tiene prioridad.
- Una nueva restricción explícita también sustituye una elección manual incompatible que aún no se ha consumido. No altera consumo, fechas pasadas ni comidas saltadas. Las elecciones compatibles conservan valores y cantidades.
- Rechazar un plato lo excluye del perfil, sustituye las apariciones pendientes y ofrece «Deshacer». El mismo comportamiento se aplica al rechazo en un borrador diario.
- Deshacer restaura únicamente las franjas que siguen como las dejó esa acción; conserva consumo, saltos y cambios posteriores, y respeta otras restricciones vigentes. La acción está disponible durante la sesión; en Perfil sigue disponible «Volver a sugerir» para quitar vetos persistidos.
- Sin alternativa compatible, la franja muestra el motivo, reintento, registro libre y acceso a preferencias. No se relajan restricciones ni se presenta un plato prohibido como sugerencia válida. El usuario puede registrar lo que realmente comió aunque no forme parte de las recomendaciones.
- Los borradores incompatibles con restricciones posteriores se descartan al intentar aplicarlos y piden preparar otro menú.

## Datos y operación

`mealPreferenceConflict()` en `js/nutrition-domain.js` comparte los vetos del motor para prescripciones anteriores. `reconcilePendingNutrition()` en `index.html` conserva las otras comidas como bloqueadas al buscar sustitutos, para no reajustarlas silenciosamente.

Las sustituciones se materializan en `day_log.state.meals[].ovr`, siguiendo el patrón de reemplazos existente. El estado `menuUnavailable` conserva privadamente la propuesta anterior para reintentar y oculta sus valores mientras está pendiente. La prescripción efectiva se versiona en `plan_versions` y la compatibilidad por día conserva los cambios si falla el versionado. Los errores de guardado del perfil o de un rechazo no confirman éxito ni modifican las preferencias locales.

El intento automático se limita por cuenta, ciclo y semana en la sesión. Antes de preparar, refresca días/versiones y respeta la cola offline. Los resultados de lecturas y guardados comprueban la cuenta antes de aplicarse. Las versiones nutricionales usan contenido estable para su clave; el instante de preparación no debe crear una receta distinta.

No se añaden tablas, dependencias runtime, cron, analytics de alimentos ni migraciones. PWA: caché v213.

## Verificación

`tests/e2e/nutricion-continuidad.spec.js` recorre guardado de restricciones, persistencia, rechazo repetido, deshacer, falta de alternativas, registro libre, renovación elegida, recarga, nueva semana, reconexión, cambio de cuenta, fallos de guardado y borradores anteriores. Incluye capturas y posiciones en 320, 390 y 1280 px. La red está simulada; cero llamadas pagadas.

Regresiones: Hoy/menú opcional, Perfil, Nutrición, estados/snapshots, motor y release gate completo.

## Reversión

Desactivar la casilla detiene nuevas preparaciones automáticas. Las comidas y el consumo existente permanecen. Revertir el commit y subir otra vez el número de caché revierte la funcionalidad; los campos adicionales de preferencias/estado son compatibles con el modelo JSON existente. No borrar versiones ni registros para revertir la UI.
