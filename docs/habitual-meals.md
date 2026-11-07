# Nutrición: comidas habituales de los días en meta — REQ-360

Solicitud de Jonathan del 7 de noviembre de 2026: «La generación de dieta después de una semana de dieta se debe hacer en base a lo que se comió antes en los días que llegaron a los macros. Si siempre desayunas lo mismo, sugieres lo mismo».

## Comportamiento

- Se miran los últimos 28 días anteriores a hoy en `day_log`. Solo cuentan las comidas marcadas como hechas, con el valor efectivo (plan, reemplazo o registro propio).
- **Una semana de dieta:** hacen falta al menos 7 días con alguna comida registrada.
- **Día en meta:** las kcal consumidas quedan a ±10 % de la meta y la proteína llega al 90 %. Se usa la meta actual del perfil. Es más amplio que `DIET_CONTRACT`, que mide el menú prescrito y no lo que se registra.
- **Hábito por franja:** se necesitan al menos 3 días en meta. Un plato es habitual en una franja (desayuno, almuerzo, cena...) cuando se repite allí 3 o más veces y en al menos la mitad de los días en meta con esa franja registrada. Ante un empate gana el más reciente. Los días fuera de meta no enseñan nada.
- Al preparar comidas para hoy o una fecha futura (Preparar mi semana, preparar el día, la renovación automática de REQ-349, las sustituciones y el cierre de días), la franja con hábito vuelve a llevar ese plato. Se ajusta la porción a la meta de esa franja y el resto del día se cierra con `globalClosePass()`. Las demás franjas mantienen la variedad.
- **Mandan las restricciones:** un hábito se descarta si su plato tiene una alergia, un ingrediente que no gusta, un plato bloqueado o descartado en la sesión, o no encaja con el patrón alimentario o el nivel de cocina. «Otra opción» y «No me gusta» siguen funcionando: descartar el plato habitual lo quita de esa generación.
- Las comidas registradas, saltadas o elegidas a mano (`lockedMeals`) nunca se reemplazan. El historial ejecutado no cambia.
- El mismo plato no se repite dos veces en un día. Si otra franja ya lo tiene, el hábito no se aplica ese día. Las franjas con hábito se resuelven primero.
- En el borrador, la comida habitual lleva la etiqueta «Lo que sueles comer». Repetirla no genera avisos de variedad ni aparece entre las comidas «a no repetir».

## Implementación

- `js/nutrition-domain.js`: `HABIT_RULES`, `dayMeetsMacroGoal()` y `learnHabitualMeals(history)` son funciones puras. `planDeterministicNutritionDay()` acepta `habitualBySlot`: el plato habitual siempre pasa por el solver, recibe `HABIT_BONUS` (1.0), no paga la penalización por repetirse entre días y queda reservado para su franja. `finalizeNutritionDay()` lo prefiere sobre una propuesta distinta (diagnóstico `habit_preferred`). `planNutritionWeek()` lo propaga y `scoreWeeklyVariety()` ignora la repetición del hábito.
- `app/index.html`: `habitualMealsForGeneration()` arma el historial desde `S.days` con `buildDay()`, `mealValue()` y `dayTotals()`. El resultado se cachea por cuenta, día, catálogo, meta y contenido del historial. `habitualBySlotForPrefs()` filtra con `mealPreferenceConflict()`. `finalizeDayWithGate()`, el gate de todas las rutas, pasa los hábitos solo para hoy y fechas futuras. El prompt del día pide las comidas habituales por franja y deja de listarlas como «a no repetir». Los hábitos entran en `coachCompatibilityContext()`. `COACH_PROMPT_VERSION=14`.
- **Privacidad:** se calcula en el dispositivo. No se guarda en el perfil ni se envía a analytics. Al coach solo llegan nombres de platos, igual que las comidas recientes que ya recibía.

No se añaden tablas, migraciones, dependencias ni llamadas automáticas. PWA: caché v219.

## Verificación

- `scripts/validate-habitual-meals.mjs` (release gate) cubre:
  - el criterio de meta y el umbral de una semana;
  - la mitad de los días y los días fuera de meta;
  - la semana con el desayuno de siempre y la variedad del resto;
  - los bloqueos y alergias, las comidas registradas y la ausencia de duplicados.
- `tests/e2e/comidas-habituales.spec.js` cubre:
  - 320, 390 y 1280 px, con el motor local y con el coach simulado, incluido el prompt;
  - la aplicación y la persistencia;
  - los días fuera de meta, menos de una semana y una restricción nueva.

## Reversión

Revertir el commit y subir otra vez el número de caché. No hay datos que borrar, porque los hábitos no se persisten.
