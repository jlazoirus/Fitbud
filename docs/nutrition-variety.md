# Variedad del menú — REQ-377

Feedback de Jonathan, 10 de noviembre de 2026: días idénticos, alternativas demasiado parecidas, aviso fugaz y generación diaria/semanal redundante. Implementación autorizada en `work`.

## Selección

El motor cuenta apariciones en la semana y prioriza los platos menos usados entre porciones con puntuaciones comparables (ventana de 0,20). Penaliza especialmente repetir el día anterior o dentro del mismo día. La similitud se calcula por ingredientes principales de receta (al menos 30 g), ignorando cantidades ajustadas: cambiar solo los gramos o el nombre ya no representa variedad. La lista de candidatos incluye opciones nuevas y las porciones base más cercanas para no perder la única receta viable.

Se mantienen restricciones, límites de porción y cierre nutricional. Un catálogo pequeño puede necesitar repeticiones; se distribuyen en lugar de favorecer siempre el mismo plato. Los hábitos aprendidos se mantienen en la propuesta inicial. Pedir cambiar un día permite salir de esos hábitos; las comidas consumidas, saltadas y editadas a mano siguen bloqueadas.

La generación semanal lleva nombres y frecuencias del borrador no guardado. Las respuestas reutilizadas se revisan contra ese borrador y los platos repetidos se sustituyen mediante el motor local. La primera semana también pasa por esta comprobación. La regeneración de un día incluye su versión anterior y las demás fechas del borrador.

## Interfaz

Nutrición conserva una entrada semanal; las alternativas diarias están dentro de su revisión. Hoy mantiene su sugerencia opcional para el día. Se retiran los generadores duplicados de Más opciones. El aviso de reutilización queda integrado en la revisión, con explicación sobre compatibilidad y preferencias, sin temporizador ni superposición sobre las comidas. Promedios, advertencias de variedad y compra se recalculan al editar el borrador. La lista de compra apunta a la entrada semanal visible.

No se reescriben planes existentes sin confirmar un borrador. Sin migraciones ni dependencias nuevas. `COACH_PROMPT_VERSION=15`, caché PWA v232.

## Verificación y límites

- `validate-meal-variety.mjs`: semanas de cuatro comidas, 2800 kcal y tres patrones dietarios; siete días distintos, rotación de almuerzos/cenas, equilibrio con catálogo limitado y preferencia por composiciones diferentes.
- `nutricion-variedad.spec.js`: móvil y escritorio, regeneración con hábitos aprendidos, respuestas idénticas para toda la semana, borrador sin guardar y aviso que permanece al renderizar de nuevo. Capturas en 390 y 1280 px.
- Regresiones de nutrición, continuidad, menú opcional y lista de compra conservan registro libre, consumo y ediciones manuales.
- Canario estricto de macros: 286/378 días exactos (75,7 %), frente a 306/378 (81 %) en el mismo catálogo y código anterior. La mayor diversidad sacrifica parte del ajuste exacto; se mantiene el aviso por día y no se relajan restricciones. Este canario es informativo, como antes del cambio. La ventana de selección se limitó a 0,20 para contener ese efecto.
- Dos fallos ajenos reproducidos también en `b484be8`, en un checkout separado: `ciclo-nuevo` espera volver a Hoy antes de terminar el guardado inicial; `coach-rutina` compara el estado histórico completo y encuentra franjas inicializadas. No se modifican esos flujos en este REQ.

Revertir el commit y subir de nuevo la versión de caché revierte el comportamiento; no requiere borrar registros ni versiones de planes.

La pasada general recorrió 336 pruebas: 331 pasaron inicialmente. Dos pruebas de compra todavía usaban el botón diario retirado; se adaptaron a la entrada semanal y ambas pasaron. La prueba de rapidez inicial superó 4 s con cuatro navegadores compitiendo y pasó al ejecutarla sola sin cambiar su límite. Quedan los dos fallos preexistentes descritos arriba. Los validadores de dominio, snapshots, restricciones, avisos y caché pasan; el gate de publicación exige `main`, fuera de la autorización de esta rama.

Preparación para producción: cambio reaplicado sobre `eea6c47` (main actualizado), conservando la medición pública ya incorporada. Se renumeró como REQ-377 porque main ya asignó REQ-376, y se subió la caché a v232 porque main ya publicó v231. La lógica de nutrición coincide con la versión probada en `a6d3e67`.
