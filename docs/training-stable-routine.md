# Entreno: rutina estable y progresión sugerida — REQ-408..410

Solicitud de Jonathan del 16 de noviembre de 2026: «Los entrenamientos se deberían mantener constantes y deberían sugerirte ir incrementando el peso, sobre todo en el gimnasio. No deberían cambiar semana a semana: se sigue la misma rutina y se aumenta peso o una que otra repetición. El sistema lo debería sugerir por defecto. Hoy no lo hace».

Estado: requerimientos pendientes. Cada REQ es una implementación y un commit. Orden: REQ-408 → 409 → 410.

## Qué pasa hoy

**Los ejercicios pueden cambiar de una semana a otra.**

- El plan se prepara semana por semana. `openTrainingPlanGenerator()` y `prepareFirstWeekTraining()` (`app/index.html:4373`) llaman a `generateTrainingWeek()` una vez por semana.
- `trainingWeekPrompt()` (`app/index.html:13812`) pide «Prepara SOLO la semana N» y entrega todo el catálogo permitido. No recibe lo elegido en las semanas anteriores.
- `TRAINING_PLAN.validatePlan()` (`training-plan.js:209`) no comprueba que una misma sesión conserve sus ejercicios.
- «Preparar otra semana N» y «Otra sesión» en la revisión rehacen una sola semana, así que la separan de las demás.
- La alternativa del catálogo (`deterministicTrainingWeekPayload()`) sí repite la plantilla, pero solo se usa cuando falla o no hay coach.

**No hay una carga sugerida.**

- «Carga sugerida» es un texto fijo: «Carga controlable que deje N repeticiones en reserva» (`workout-player.js:54` y `:276`).
- `prefillStepFromLastTime()` (`app/index.html:6513`, REQ-337) copia en las series las repeticiones y la carga de la última vez, sin cambios. El usuario ve lo mismo que hizo, no lo que le toca.
- La regla de cuándo subir solo aparece si abre «Usar progresión» (`explainLoadVariation()`, `app/index.html:6975`).

**La rutina se pierde al empezar otro plan.**

- La rutina acordada con el coach (REQ-359) vale solo para su ciclo: `weeklyRoutineSession()` (`app/index.html:7515`) la descarta si `routine.cycle` no coincide.
- El plan nuevo se prepara desde cero.

## 1. La misma rutina todas las semanas — REQ-408

Dentro de un plan, cada sesión de fuerza (`fullA`, `torsoA`, `pushA`...) tiene una sola lista ordenada de ejercicios para todas sus semanas.

- La semana 1 define los ejercicios. Las semanas 2 a N copian los mismos `exercise_id` en el mismo orden.
- Entre semanas solo cambia la dosis de la fase: series, repeticiones, descanso y esfuerzo (`trainingPhaseDose()`, `WORKOUT_PLAYER.exerciseDose()`). La semana de descarga usa los mismos ejercicios con menos series.
- Las semanas 2 a N se construyen en la app a partir de la semana 1. Solo la semana 1 consulta al coach: un plan de 4 semanas pasa de 4 consultas a 1, y uno de 10 semanas, de 10 a 1.
- `validatePlan()` rechaza un plan en el que una sesión de fuerza cambie de ejercicios entre semanas.
- En la revisión del plan: «Otra sesión» sobre una sesión de fuerza la cambia en todas las semanas y lo dice. «Preparar otra semana N» deja de ofrecerse para fuerza en las semanas 2 a N.
- Texto de la revisión: «Tu rutina se mantiene las N semanas. Cambian las series, las repeticiones y la carga».
- Las sesiones de deporte (correr, bici, nadar, caminar) siguen progresando por fase como hoy.

Se conserva todo lo que el usuario decide por su cuenta: editar ejercicios de un día, sustituir uno en el reproductor, cambiar el lugar de un día (REQ-291) y la rutina acordada con el coach (REQ-359). Las sustituciones por compatibilidad (`compatibleStrengthExerciseSelection()`) deben dar el mismo resultado todas las semanas.

Los planes activos no se reescriben. La regla vale para los planes preparados desde este cambio.

## 2. Carga y repeticiones sugeridas para hoy — REQ-409

Función pura `WORKOUT_PLAYER.progressionSuggestion(last, step, context)`. Usa lo registrado la última vez en ese ejercicio (`lastPerformance()`, REQ-232) y la dosis de hoy.

### Regla: primero repeticiones, luego carga

Para un ejercicio con rango, por ejemplo 8-12:

| Última vez | Hoy se sugiere | Mensaje |
|---|---|---|
| Todas las series llegaron al tope del rango y el esfuerzo no superó el objetivo en más de 1 punto | Subir la carga y volver al inicio del rango | «Completaste todas las series: sube a 42,5 kg» |
| Todas las series dentro del rango, alguna por debajo del tope | Misma carga, una repetición más en las series que no llegaron al tope | «Misma carga, busca una repetición más» |
| Alguna serie por debajo del mínimo, o esfuerzo máximo | Repetir carga y repeticiones | «Repite la carga de la última vez y completa el rango» |
| Dos sesiones seguidas por debajo del mínimo | Bajar la carga un 5 % | «Baja un poco y vuelve a completar el rango» |

### Cuánto subir

- 2,5 kg por defecto.
- 5 kg en sentadilla, peso muerto, prensa y hip thrust.
- 2 kg en mancuernas.
- Nunca más del 10 % de la carga anterior. Se redondea a 0,5 kg.

### Casos

- **Sin historial:** se conserva el texto actual. No se inventa una carga.
- **Carga no numérica** («lastre 5», «banda verde»): se sugieren solo repeticiones.
- **Peso corporal:** una repetición más; al completar el tope del rango, se ofrece «Usar progresión» (REQ-241).
- **Semana de descarga:** misma carga, sin subir.
- **Modo suave (REQ-116):** la carga sube solo si el esfuerzo quedó en el objetivo o por debajo, y nunca más de 2,5 kg.
- **Pausa larga:** con más de 21 días desde la última vez se repite la carga; con más de 42, se sugiere un 10 % menos.
- **Ejercicio o variante distintos:** no se usa el historial de otro ejercicio.
- **Repetir un entreno concreto (REQ-346):** manda lo de ese día, como hoy.

### Dónde se ve

- En el reproductor, en lugar de «Carga sugerida»: «**Hoy: 42,5 kg × 8** · la última vez 40 kg × 10», con el motivo en una línea.
- Las series pendientes llegan con la sugerencia ya escrita y editable, con el mecanismo de REQ-337. Lo que el usuario escribe manda.
- En la lista del plan de Entreno: «Hoy 42,5 kg» junto a «Última vez 40 kg».
- Los textos no usan RPE ni RIR (REQ-400).

La sugerencia no se guarda ni cambia el plan. Solo queda registrado lo que el usuario marca como hecho.

## 3. El plan nuevo conserva tu rutina — REQ-410

Al terminar un plan y empezar otro:

- Por defecto se conservan los ejercicios de cada sesión de fuerza del plan anterior, y también la rutina acordada con el coach.
- La revisión lo dice y ofrece la alternativa: «Mantienes tu rutina. [Cambiar ejercicios]».
- Si cambiaron los días, el lugar, el equipo, el nivel o una limitación, se conserva lo compatible y se sustituye el resto por el mismo músculo, avisando qué cambió.
- Las cargas sugeridas siguen desde el historial (REQ-409): el plan nuevo no empieza de cero.

## Privacidad y operación

Sin tablas, migraciones, dependencias ni llamadas pagadas nuevas. Las cargas ya viven en `day_log.state.workoutExecution`. Al tocar el shell, subir `CACHE_NAME`.

## Verificación

- `scripts/validate-training-plan.mjs`: un plan con ejercicios distintos entre semanas no pasa; uno estable sí.
- `scripts/validate-workout-player.mjs`: cada fila de la tabla de progresión y cada caso.
- `tests/e2e/entreno.spec.js` y `rutina-consistente.spec.js` a 320, 390 y 1280 px: mismas sesiones en las semanas 1 a 4, sugerencia visible y precargada, edición manual, descarga, sin historial.
- `tests/e2e/plan-weeks.spec.js` y `coach-rutina.spec.js`: ciclo nuevo con y sin cambios de perfil.

## Fuera de alcance

Progresión de sesiones de deporte, reescribir planes activos, cambiar la periodización de las fases, calcular 1RM o porcentajes y sugerencias sobre el calentamiento.
