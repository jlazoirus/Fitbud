# Menú y rutina desde tu historial — REQ-411..414

Solicitud de Jonathan del 16 de noviembre de 2026, al cerrar las decisiones de REQ-404: «Las cuentas existentes no pasan por el periodo, pero necesitamos que las dietas y rutinas también se generen en base al histórico de lo que come y que puede cumplir, con sugerencias de mejoras».

Estado: requerimientos pendientes. Orden: REQ-411 → 412 → 413 en nutrición (después de REQ-407) y REQ-414 en entreno (después de REQ-410).

## Idea

El periodo de primeros días (REQ-404..407, `docs/nutrition-first-days.md`) resuelve el arranque. Esto resuelve todo lo demás: una cuenta que ya tiene historial no necesita un periodo, porque la app ya sabe qué come y qué entrena. Y no vale solo una vez: cada semana nueva y cada plan nuevo deben partir de lo que la persona **cumple**, y proponer mejoras pequeñas sobre eso.

Tres reglas para todo el documento:

1. **Lo cumplido manda sobre lo declarado.** Si el plan dice una cosa y la persona hace otra, el plan siguiente se parece a lo que hace.
2. **Las mejoras se proponen, no se aplican.** Cada sugerencia se acepta o se descarta. Una descartada no vuelve en 28 días.
3. **El historial no se toca.** Solo cambia lo pendiente.

## Qué guarda la app hoy y no usa

| Dato | Dónde | Uso actual |
|---|---|---|
| Comida hecha (`ms.done`) | `day_log.state.meals` | Hábitos, solo si el día quedó en meta (`js/nutrition-domain.js:783`) |
| Comida saltada (`ms.skipped`) | `skipMeal()`, `app/index.html:3048` | Ninguno para el menú siguiente |
| Comida reemplazada por el usuario (`ms.ovr.userSet`) | `app/index.html:9223`, `:11472` | Ninguno para el menú siguiente |
| Sesiones planificadas y hechas | `weeklyCheckinStats()`, `app/index.html:17879` | Solo se muestran en el check-in |
| Ejercicio sustituido (`exerciseSlug` ≠ `originalExerciseSlug`) | `workout-player.js:445` | Solo una nota en la sesión |
| Ejercicio omitido (`status:"skipped"`) | `workout-player.js:554` | Solo el resumen de la sesión |

`habitualMealsHistory()` (`app/index.html:13444`) recoge únicamente las comidas hechas. `trainingExpectedWeeks()` (`app/index.html:13701`) arma el plan solo con las preferencias declaradas.

## 1. Cuentas con historial: «Así comes» sin periodo — REQ-411

- **Quién:** cuenta sin periodo de primeros días (existente, o que usó «Prefiero recibir un menú ya») con al menos 3 días completos en los últimos 28. Día completo: 2 comidas registradas y 40 % de las kcal, igual que en REQ-404.
- **Qué ve:** una tarjeta en Nutrición, una sola vez: «Ya sabemos cómo comes. Mira tu resumen y arma tu menú con lo que ya haces». Abre la pantalla «Así comes» de REQ-405, alimentada con esos 28 días.
- **Qué pasa al aceptar:** el menú siguiente se prepara en modo `intake` (REQ-406 y 407) sobre la ventana de 28 días, con los cambios aceptados.
- **Qué no pasa:** no hay periodo, no se bloquea nada y el menú vigente sigue hasta que el usuario prepara otro. «Ahora no» oculta la tarjeta 28 días.
- **Sin historial suficiente:** la cuenta sigue como hoy.

## 2. El menú aprende de lo que cumples — REQ-412

Vale para todas las cuentas, cada vez que se prepara una semana o un día. Ventana de 28 días.

- **Lo que sí comes, vuelve.** Un plato hecho 2 o más veces en su franja, y en al menos la mitad de los días con esa franja registrada, es habitual aunque el día no haya quedado en meta. La porción se ajusta hacia la meta.
- **Lo que no cumples, deja de sugerirse.** Un plato sugerido que se saltó o se reemplazó 2 o más veces en su franja, y se cumplió menos de la mitad de las veces, queda en pausa 28 días para esa franja. No es un veto: si el usuario lo elige a mano, vuelve.
- **Lo que comes en su lugar, toma la franja.** Si el reemplazo se repite 2 o más veces, pasa a ser el plato habitual.
- Mandan las restricciones y la regla de no repetir plato en el día. «No me gusta» sigue siendo el veto explícito.
- La pausa se calcula en el dispositivo desde `day_log`; no se guarda en el perfil.

Con esto, REQ-360 deja de exigir días en meta para aprender. El criterio de meta se conserva solo para decidir si hace falta ajustar la porción.

## 3. Mejoras de nutrición en el check-in — REQ-413

El check-in semanal ya existe (`openWeeklyCheckin()`). Se le agrega un bloque «Tu comida esta semana»:

- `analyzeIntakeDays()` sobre los últimos 14 días, con al menos 3 días completos.
- Hasta 2 sugerencias, con los mismos tipos de REQ-405 (`add`, `portion`, `swap`, `fill`) y una más:
  - `drop`: una franja saltada la mitad de los días o más. «Casi nunca cenas: ¿repartimos esa comida en las otras?». Al aceptar cambia el número de comidas del perfil desde mañana.
- Siempre una línea de lo que va bien.
- Aceptar aplica el cambio a las comidas pendientes; «Ahora no» lo guarda 28 días.
- Con los días en meta no se inventan sugerencias.

## 4. La rutina se ajusta a lo que cumples — REQ-414

Función pura `analyzeTrainingHistory(days, plan)` sobre las últimas 4 semanas, con al menos 2 semanas con una sesión registrada.

| Señal | Sugerencia | Al aceptar |
|---|---|---|
| El mismo ejercicio se sustituye por otro 2 o más veces y en la mitad de sus sesiones | «Siempre cambias la sentadilla por la prensa: la dejamos en tu rutina» | El cambio queda fijo en esa sesión |
| Un ejercicio se omite 2 o más veces y en la mitad de sus sesiones | «Sueles saltarte las búlgaras: ¿las cambiamos por otro de pierna o las quitamos?» | Se sustituye por el mismo músculo o se quita |
| Menos del 70 % de las sesiones hechas dos semanas seguidas | «Entrenas 3 de 5 días: armemos tu rutina en 3 para trabajar todo el cuerpo» | Cambian los días del perfil y el reparto de sesiones |
| La mitad de las sesiones quedan parciales, o duran un 20 % más de lo previsto | «Tus sesiones se alargan: quitamos un ejercicio accesorio» | Baja la duración prevista |
| 90 % de las sesiones hechas y todas las series completas durante 3 semanas | «Vas completo: ¿sumamos un ejercicio o un día?» | Se agrega lo elegido |

- Máximo 3 sugerencias, ordenadas por impacto. Una señal de mejora (la última fila) nunca aparece junto a una de recorte.
- **Dónde:** en el check-in semanal y en la revisión del plan nuevo (REQ-410), bajo «Lo que vimos en tus entrenos».
- **Cómo se aplica:** sobre las sesiones pendientes, con el mecanismo de la rutina semanal (REQ-359, `prefs.weeklyRoutine`), o sobre los días del perfil. REQ-410 lo lleva al plan siguiente.
- Respeta el modo suave (REQ-116), las limitaciones y el equipo. En modo suave no se ofrece sumar.
- Las cargas no entran aquí: son de REQ-409.

## Privacidad y operación

Todo se calcula en el dispositivo con datos que ya existen. Sin tablas, migraciones, dependencias ni llamadas pagadas. Los nombres de platos y ejercicios no van a analytics. Al tocar el shell, subir `CACHE_NAME`.

## Verificación

- `scripts/validate-habitual-meals.mjs`: plato cumplido fuera de meta, plato en pausa, reemplazo repetido, elección manual que levanta la pausa, restricciones.
- Script nuevo para `analyzeTrainingHistory`: cada fila de la tabla, mínimos, modo suave y mejora frente a recorte.
- `tests/e2e/comidas-habituales.spec.js` y `nutricion-continuidad.spec.js`: cuenta con historial, tarjeta única, menú tras aceptar.
- E2E del check-in a 320, 390 y 1280 px: sugerencias de comida y de entreno, aceptar, descartar y que no vuelvan.
- `tests/e2e/coach-rutina.spec.js` y `plan-weeks.spec.js`: sustitución fija, cambio de días y plan nuevo.

## Fuera de alcance

Pasar a las cuentas existentes por el periodo de primeros días, cambiar las metas de macros (eso sigue en el check-in actual), progresión de cargas (REQ-409), sugerencias redactadas por el coach y avisos push sobre estas sugerencias.
