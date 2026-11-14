# Onboarding esencial — REQ-389

Tres pantallas: **Tú**, **Tu semana**, **Antes de empezar**. La revisión periódica usa el mismo flujo. No se guardan datos hasta aceptar el consentimiento y responder las cuatro preguntas de seguridad. Dieta, exclusiones y alergias se fijan antes de preparar comidas.

Como máximo hay 19 campos de entrada (input/select): 6 personales; actividad, fuerza/lugar y ubicación de indoor cycling cuando corresponde; patrón de comida, 3 exclusiones, alergias, consentimiento y 4 respuestas de seguridad. Los días se eligen con siete botones de selección; en planes combinados, un botón por día alterna fuerza y actividad. Perfil conserva sus selectores y el ajuste de lugar por día. No se montan campos ocultos ni ajustes avanzados dentro del alta.

## Valores diferidos

- Un perfil nuevo usa actividad `light` con 3 días, `moderate` con 4–5 y `high` con 6. Es una aproximación, anunciada junto al resultado; se cambia en Perfil. Las preferencias de actividad ya declaradas de usuarios existentes se conservan.
- Las metas se calculan con `calculateMacroTargets`: kcal = 4P + 4C + 9G. Se muestran como resultado en la tercera pantalla y en Hoy. Perfil permite editar macros, actividad y grasa corporal; las metas nuevas comienzan mañana y las versiones previas se conservan.
- Ciclo nuevo de alta: 10 semanas. Una duración explícita seleccionada al reiniciar (p. ej. 4 semanas), o la duración de una revisión, se conserva.
- Intensidad `auto`, resuelta por `trainingSafetyRecommendation`; no sustituye el consentimiento ni el screening. Las elecciones explícitas previas se conservan.
- Se mantienen los defaults ya existentes: experiencia `beginner`, 60 minutos, estilo `mixed`; equipo según el lugar (`gym`: mancuernas/barra/máquinas; casa/aire libre: peso corporal; sin fuerza: ninguno). Los recursos ya declarados se conservan si no cambia el lugar.
- Cocina `basic`, 30 minutos, 4 comidas con horarios por defecto, presupuesto/repetición medios y gustos vacíos. Una preferencia existente prevalece. Grasa corporal vacía cuando no se conoce.
- El soporte por WhatsApp sigue en Perfil y en la web pública. Los ajustes opcionales de Perfil tienen filas de texto normal con aspecto de botón.

El alta marca `onboardingEssentialOnly` y deja el refinamiento progresivo para REQ-390. Analítica: `onboarding_step_view` solo lleva el número de paso; `onboarding_complete` agrega `duration_s`. Los valores del formulario no van al historial del navegador ni a estos eventos.

Verificación: recorrido en 390×844 y escritorio, 19 campos aun con seis días combinados e indoor cycling, altura de cada pantalla ≤1,5 viewports, seguridad obligatoria, dieta sin lácteos/alergias en las comidas, resultado igual al guardado, edición en Perfil sin cambiar ayer/hoy, navegación atrás y limpieza del historial. No requiere SQL ni acciones de producción manuales.

La vigencia se guarda en `prefs.macroTargetsValidFrom`; `previousMacroTargets` sirve de respaldo cuando todavía no hay versión para una fecha. `effectiveDayTarget(null, ds)` prioriza los valores actuales del perfil para usuarios existentes y consulta la versión anterior solo antes de una vigencia futura explícita. Los snapshots nutricionales resuelven la meta por fecha.
