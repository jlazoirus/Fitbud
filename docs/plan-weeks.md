# Semanas del plan: fechas y avisos — REQ-324

Solicitud directa de Jonathan (02/11/2026), tras la captura de Rocío: un lunes seguía viendo «Semana 1», sin explicación de cuándo comenzaba la siguiente. La captura encaja con un inicio el martes 27 de octubre; no se comprobó su perfil de producción.

## Comportamiento

El calendario conserva bloques de siete días desde `planStartDate`. Las semanas no cambian por ser lunes ni por completar registros. No se cambian fechas, duración, progreso o entrenamientos existentes.

- La línea del plan de Entreno muestra semana, duración y rango: «Semana 1 de 4 · 27 oct–2 nov · 4 días/semana».
- El resumen y la navegación semanal también muestran las fechas. El calendario de la fecha consultada se resuelve con `planContextForDate`, conservando los snapshots históricos.
- En Entreno se explica: «Tus semanas cuentan desde el día que empezaste tu plan».
- Hoy y Entreno muestran el último día: «Hoy termina tu semana 1. Mañana comienza la semana 2». Solo se usa «hoy/mañana» al ver la fecha real de hoy.
- Desde la segunda semana se muestra «¡Comienza tu semana 2!» el primer día, o «Ya estás en tu semana 2» si se regresa después. Incluye fechas y acceso al calendario.
- «Entendido» oculta el aviso de inicio en este dispositivo. Se conserva al recargar, compartido entre Hoy y Entreno, separado por cuenta, ciclo, fecha inicial, duración y semana. El aviso de cierre sigue apareciendo el último día aunque se haya ocultado la bienvenida.
- El último día de la última semana informa que termina el plan; no promete una semana adicional.
- La hoja existente del plan ofrece «Calendario de tus 4/10 semanas», con todas las fechas y la semana actual indicada. El rango incluye los años cuando cruza de diciembre a enero.
- Durante una sesión guiada, el reproductor conserva su prioridad y el plan permanece en su desplegable existente; no se abren ventanas ni se interrumpe el entrenamiento.

## Alcance y operación

Cambio de presentación en `index.html`, sin nuevas dependencias, correos, push ni migraciones. El aviso es dentro de la app. Caché PWA v200 para distribuir el shell actualizado. Los descartes se almacenan localmente; no se modifica el perfil ni se genera un nuevo plan al ver el calendario.

## Criterios y verificación

`tests/e2e/plan-weeks.spec.js` cubre el caso 27 oct–2 nov, el comienzo de la semana 2 el 3 de noviembre sin registros completados, rangos en móvil 320/390 y escritorio, calendario de cuatro y diez semanas, cruce de año, descarte persistente y aislado, navegación por otras fechas, regreso a mitad de semana, final del ciclo y conservación de preferencias, versiones y días. Red simulada, sin llamadas pagadas.

Regresión: Entreno (hoja del plan y reproductor), Hoy y calendario/ciclos; controles de HTML/JS, CSS, caché y release gate completo antes de publicar.
