# Inventario de progresiones de ejercicios (REQ-241)

Generado desde `FITBUD_EXERCISE_VARIANTS` (`exercise-catalog.js`) y el catálogo (54 ejercicios: 42 de fuerza y 12 de resistencia). Lo valida `scripts/validate-exercises.mjs`.

Qué hace cada botón en el reproductor:

- **Otro ejercicio**: cambia a otro ejercicio del catálogo del mismo patrón de movimiento, con su nombre y su imagen; se conservan series y repeticiones objetivo. "Volver a …" deshace el cambio.
- **Variante**: mismo ejercicio y misma imagen, con otra ejecución (pausa, una pierna, menos asistencia…); el título pasa a ser el de la variante.
- **Solo carga**: no hay otro ejercicio; el botón se llama "Subir la carga" / "Bajar la carga" y explica cómo hacerlo, con la carga de la última vez.

## Fuerza

| Ejercicio | Nivel | Versión más fácil | Progresión | Texto anterior de progresión |
|---|---|---|---|---|
| Sentadilla con barra (`back-squat`) | Principiante | Variante → Sentadilla a caja | **Otro ejercicio** → Sentadilla frontal (`front-squat`) | Sentadilla frontal |
| Press de banca (`bench-press`) | Principiante | Variante → Press de banca con mancuernas ligeras | Variante → Press de banca con pausa en el pecho | Press con pausa |
| Remo sentado en polea (`seated-cable-row`) | Principiante | **Otro ejercicio** → Remo con banda (`band-row`) | Variante → Remo sentado con pausa | Remo con pausa |
| Peso muerto rumano (`romanian-deadlift`) | Principiante | Variante → Bisagra con palo | **Otro ejercicio** → Peso muerto a una pierna (`single-leg-rdl`) | Peso muerto rumano a una pierna |
| Hip thrust (`barbell-hip-thrust`) | Principiante | **Otro ejercicio** → Puente de glúteo (`glute-bridge`) | Variante → Hip thrust con pausa arriba | Hip thrust con pausa |
| Press inclinado con mancuernas (`incline-dumbbell-press`) | Principiante | **Solo carga** → Usa mancuernas más ligeras | Variante → Press inclinado alternado | Press alternado |
| Jalón al pecho (`lat-pulldown`) | Principiante | Variante → Jalón con banda | **Otro ejercicio** → Dominada asistida (`assisted-pull-up`) | Dominada asistida |
| Sentadilla búlgara (`bulgarian-split-squat`) | Principiante | **Otro ejercicio** → Zancada (`walking-lunge`) | **Solo carga** → Sentadilla búlgara con más carga | Búlgara con carga |
| Press militar (`overhead-press`) | Principiante | Variante → Press militar sentado | Variante → Press militar de pie con pausa | Press de pie con pausa |
| Zancada (`walking-lunge`) | Principiante | Variante → Zancada con apoyo | **Otro ejercicio** → Sentadilla búlgara (`bulgarian-split-squat`) | Zancada caminando con carga |
| Elevación de gemelos (`standing-calf-raise`) | Principiante | Variante → Elevación de gemelos con apoyo | Variante → Elevación de gemelos a una pierna | Elevación a una pierna |
| Fondos asistidos (`assisted-dip`) | Principiante | **Otro ejercicio** → Flexión inclinada (`incline-push-up`) | Variante → Fondos con menos asistencia | Fondos con menor asistencia |
| Curl de bíceps (`biceps-curl`) | Principiante | Variante → Curl con banda ligera | Variante → Curl alternado controlado | Curl alternado controlado |
| Extensión de tríceps en polea (`triceps-pushdown`) | Principiante | Variante → Extensión de tríceps con banda | Variante → Extensión de tríceps a un brazo | Extensión unilateral |
| Prensa de piernas (`leg-press`) | Principiante | Variante → Prensa con rango corto | Variante → Prensa a una pierna | Prensa unilateral |
| Curl femoral (`leg-curl`) | Principiante | Variante → Curl femoral con rango corto | Variante → Curl femoral a una pierna | Curl unilateral |
| Sentadilla tempo (`tempo-squat`) | Principiante | Variante → Sentarse y levantarse de una silla | Variante → Sentadilla con pausa abajo | Sentadilla con pausa |
| Flexión de brazos (`push-up`) | Principiante | **Otro ejercicio** → Flexión inclinada (`incline-push-up`) | **Otro ejercicio** → Flexión con pies elevados (`decline-push-up`) | Flexión con pausa |
| Flexión inclinada (`incline-push-up`) | Principiante | Variante → Flexión contra la pared | **Otro ejercicio** → Flexión de brazos (`push-up`) | Flexión en el suelo |
| Remo con banda (`band-row`) | Principiante | **Solo carga** → Usa una banda más suave | Variante → Remo invertido | Remo invertido |
| Puente de glúteo (`glute-bridge`) | Principiante | Variante → Puente de glúteo con rango corto | **Otro ejercicio** → Puente de glúteo a una pierna (`single-leg-glute-bridge`) | Puente a una pierna |
| Puente de glúteo a una pierna (`single-leg-glute-bridge`) | Principiante | **Otro ejercicio** → Puente de glúteo (`glute-bridge`) | Variante → Puente a una pierna con pausa arriba | Puente unilateral con pausa |
| Plancha frontal (`front-plank`) | Principiante | Variante → Plancha con rodillas apoyadas | **Otro ejercicio** → Plancha con toque de hombro (`shoulder-tap-plank`) | Plancha con mayor duración |
| Plancha lateral (`side-plank`) | Principiante | Variante → Plancha lateral con rodillas | Variante → Plancha lateral con pierna elevada | Plancha lateral con pierna elevada |
| Dead bug (`dead-bug`) | Principiante | Variante → Dead bug moviendo solo brazos o piernas | Variante → Dead bug con brazo y pierna opuestos | Extender brazo y pierna opuestos |
| Pike push-up (`pike-push-up`) | Principiante | Variante → Pike push-up con manos elevadas | Variante → Pike push-up con pies elevados | Pike con pies elevados |
| Peso muerto a una pierna (`single-leg-rdl`) | Principiante | Variante → Peso muerto a una pierna con apoyo | **Solo carga** → Peso muerto a una pierna con carga | Bisagra unilateral con carga |
| Dominada asistida (`assisted-pull-up`) | Principiante | Variante → Jalón con banda | Variante → Dominada con menos asistencia | Dominada con menos asistencia |
| Plancha con toque de hombro (`shoulder-tap-plank`) | Principiante | **Otro ejercicio** → Plancha frontal (`front-plank`) | Variante → Toques de hombro más lentos | Toques más lentos |
| Subida al banco (`step-up`) | Principiante | Variante → Subida a un escalón bajo con apoyo | **Solo carga** → Escalón más alto o con carga | Escalón más alto o con carga |
| Curl femoral deslizante (`slider-leg-curl`) | Principiante | Variante → Curl deslizante con una pierna por vez | Variante → Curl deslizante completo con cadera elevada | Curl completo con cadera elevada |
| Elevación lateral (`lateral-raise`) | Intermedio | Variante → Elevación lateral con poco rango | Variante → Elevación lateral con pausa arriba | Elevación con pausa arriba |
| Apertura en polea (`cable-fly`) | Intermedio | Variante → Apertura en polea con rango corto | Variante → Apertura en polea con pausa al centro | Apertura con pausa al centro |
| Face pull (`face-pull`) | Intermedio | **Solo carga** → Usa menos peso | Variante → Face pull con rotación externa | Face pull con rotación externa |
| Curl martillo (`hammer-curl`) | Intermedio | **Solo carga** → Usa mancuernas más ligeras | Variante → Curl inclinado | Curl inclinado |
| Flexión diamante (`diamond-push-up`) | Intermedio | Variante → Flexión diamante con rodillas | Variante → Flexión diamante con pausa | Flexión diamante con pausa |
| Dominada (`pull-up`) | Intermedio | **Otro ejercicio** → Dominada asistida (`assisted-pull-up`) | **Otro ejercicio** → Dominada con lastre (`weighted-pull-up`) | Dominada con lastre |
| Flexión con pies elevados (`decline-push-up`) | Intermedio | **Otro ejercicio** → Flexión de brazos (`push-up`) | **Otro ejercicio** → Flexión arquero (`archer-push-up`) | Flexión con lastre en espalda |
| Dominada con lastre (`weighted-pull-up`) | Avanzado | **Otro ejercicio** → Dominada (`pull-up`) | **Solo carga** → Dominada con más lastre | Dominada con lastre máximo |
| Sentadilla frontal (`front-squat`) | Avanzado | Variante → Sentadilla goblet | Variante → Sentadilla frontal con pausa | Sentadilla frontal con pausa |
| Flexión arquero (`archer-push-up`) | Avanzado | Variante → Flexión arquero con apoyo | Variante → Flexión a un brazo asistida | Flexión con un brazo asistida |
| Curl nórdico (`nordic-hamstring-curl`) | Avanzado | Variante → Curl nórdico parcial | Variante → Curl nórdico completo con pausa | Curl nórdico completo con pausa |

## Resumen

- Ningún ejercicio de fuerza se queda sin versión más fácil ni progresión.
- Progresión a **otro ejercicio** (cambian título e imagen): 10 — Sentadilla con barra, Peso muerto rumano, Jalón al pecho, Zancada, Flexión de brazos, Flexión inclinada, Puente de glúteo, Plancha frontal, Dominada, Flexión con pies elevados.
- Progresión que es **solo subir la carga** (no hay un ejercicio más difícil que tenga sentido en el catálogo): 4 — Sentadilla búlgara ("Sentadilla búlgara con más carga"), Peso muerto a una pierna ("Peso muerto a una pierna con carga"), Subida al banco ("Escalón más alto o con carga"), Dominada con lastre ("Dominada con más lastre").
- El resto (28) progresa con una **variante** del mismo ejercicio.

### Progresiones que eran solo carga o duración y ahora pasan a otro ejercicio

| Ejercicio | Antes | Ahora |
|---|---|---|
| Zancada | Zancada caminando con carga | Sentadilla búlgara |
| Flexión de brazos | Flexión con pausa | Flexión con pies elevados |
| Plancha frontal | Plancha con mayor duración | Plancha con toque de hombro |
| Flexión con pies elevados | Flexión con lastre en espalda | Flexión arquero |

## Resistencia (caminar, correr, bicicleta, natación)

Sus progresiones son de volumen (más tiempo, distancia o repeticiones de técnica), no de ejercicio; el reproductor no muestra los botones en los bloques de tiempo.

| Ejercicio | Progresión |
|---|---|
| Caminata a paso activo | Aumentar tiempo a paso vivo sin perder respiración controlada |
| Caminata aeróbica fácil | Aumentar duración manteniendo conversación |
| Caminata con movilidad | Sumar bloques de paso activo entre movilidad |
| Intervalos de running | Aumentar gradualmente la duración del bloque rápido |
| Running aeróbico fácil | Aumentar tiempo manteniendo ritmo conversacional |
| Técnica de carrera | Añadir repeticiones sin perder postura |
| Intervalos de cycling | Aumentar duración antes que resistencia |
| Cycling aeróbico fácil | Aumentar tiempo en zona cómoda |
| Técnica y cadencia en bicicleta | Bloques más largos sin balancear el tronco |
| Intervalos de natación | Aumentar distancia manteniendo técnica |
| Natación aeróbica fácil | Aumentar distancia sin perder alineación |
| Técnica de natación | Combinar ejercicios manteniendo respiración estable |
