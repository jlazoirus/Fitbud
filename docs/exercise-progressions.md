# Inventario de progresiones de ejercicios (REQ-241)

Generado desde `FITBUD_EXERCISE_VARIANTS` (`exercise-catalog.js`) y el catálogo (54 ejercicios: 42 de fuerza y 12 de resistencia). Lo valida `scripts/validate-exercises.mjs`.

Qué hace cada botón en el reproductor:

- **Otro ejercicio**: cambia a otro ejercicio del catálogo del mismo patrón de movimiento, con su nombre y su imagen; se conservan series y repeticiones objetivo. "Volver a …" deshace el cambio.
- **Variante**: mismo ejercicio y misma imagen, con otra ejecución (pausa, una pierna, menos asistencia…); el título pasa a ser el de la variante.
- **Solo carga**: no hay otro ejercicio; el botón se llama "Subir la carga" / "Bajar la carga" y explica cómo hacerlo, con la carga de la última vez.

Niveles revisados en REQ-264: criterio e inventario completo en [exercise-levels.md](exercise-levels.md).

## Fuerza

| Ejercicio | Nivel | Versión más fácil | Progresión | Texto anterior de progresión |
|---|---|---|---|---|
| Sentadilla con barra (`back-squat`) | Intermedio | Variante → Sentadilla a caja | **Otro ejercicio** → Sentadilla frontal (`front-squat`) | Sentadilla frontal |
| Press de banca (`bench-press`) | Intermedio | Variante → Press de banca con mancuernas ligeras | Variante → Press de banca con pausa en el pecho | Press con pausa |
| Remo sentado en polea (`seated-cable-row`) | Principiante | **Otro ejercicio** → Remo con banda (`band-row`) | Variante → Remo sentado con pausa | Remo con pausa |
| Peso muerto rumano (`romanian-deadlift`) | Intermedio | Variante → Bisagra con palo | **Otro ejercicio** → Peso muerto a una pierna (`single-leg-rdl`) | Peso muerto rumano a una pierna |
| Hip thrust (`barbell-hip-thrust`) | Intermedio | **Otro ejercicio** → Puente de glúteo (`glute-bridge`) | Variante → Hip thrust con pausa arriba | Hip thrust con pausa |
| Press inclinado con mancuernas (`incline-dumbbell-press`) | Principiante | **Solo carga** → Usa mancuernas más ligeras | Variante → Press inclinado alternado | Press alternado |
| Jalón al pecho (`lat-pulldown`) | Principiante | Variante → Jalón con banda | **Otro ejercicio** → Dominada asistida (`assisted-pull-up`) | Dominada asistida |
| Sentadilla búlgara (`bulgarian-split-squat`) | Intermedio | **Otro ejercicio** → Zancada (`walking-lunge`) | **Solo carga** → Sentadilla búlgara con más carga | Búlgara con carga |
| Press militar (`overhead-press`) | Intermedio | Variante → Press militar sentado | Variante → Press militar de pie con pausa | Press de pie con pausa |
| Zancada (`walking-lunge`) | Intermedio | Variante → Zancada con apoyo | **Otro ejercicio** → Sentadilla búlgara (`bulgarian-split-squat`) | Zancada caminando con carga |
| Elevación de gemelos (`standing-calf-raise`) | Principiante | Variante → Elevación de gemelos con apoyo | Variante → Elevación de gemelos a una pierna | Elevación a una pierna |
| Fondos asistidos (`assisted-dip`) | Intermedio | **Otro ejercicio** → Flexión inclinada (`incline-push-up`) | Variante → Fondos con menos asistencia | Fondos con menor asistencia |
| Curl de bíceps (`biceps-curl`) | Principiante | Variante → Curl con banda ligera | Variante → Curl alternado controlado | Curl alternado controlado |
| Extensión de tríceps en polea (`triceps-pushdown`) | Principiante | Variante → Extensión de tríceps con banda | Variante → Extensión de tríceps a un brazo | Extensión unilateral |
| Prensa de piernas (`leg-press`) | Principiante | Variante → Prensa con rango corto | Variante → Prensa a una pierna | Prensa unilateral |
| Curl femoral (`leg-curl`) | Principiante | Variante → Curl femoral con rango corto | Variante → Curl femoral a una pierna | Curl unilateral |
| Sentadilla tempo (`tempo-squat`) | Principiante | Variante → Sentarse y levantarse de una silla | Variante → Sentadilla con pausa abajo | Sentadilla con pausa |
| Flexión de brazos (`push-up`) | Intermedio | **Otro ejercicio** → Flexión inclinada (`incline-push-up`) | **Otro ejercicio** → Flexión con pies elevados (`decline-push-up`) | Flexión con pausa |
| Flexión inclinada (`incline-push-up`) | Principiante | Variante → Flexión contra la pared | **Otro ejercicio** → Flexión de brazos (`push-up`) | Flexión en el suelo |
| Remo con banda (`band-row`) | Principiante | **Solo carga** → Usa una banda más suave | Variante → Remo invertido | Remo invertido |
| Puente de glúteo (`glute-bridge`) | Principiante | Variante → Puente de glúteo con rango corto | **Otro ejercicio** → Puente de glúteo a una pierna (`single-leg-glute-bridge`) | Puente a una pierna |
| Puente de glúteo a una pierna (`single-leg-glute-bridge`) | Intermedio | **Otro ejercicio** → Puente de glúteo (`glute-bridge`) | Variante → Puente a una pierna con pausa arriba | Puente unilateral con pausa |
| Plancha frontal (`front-plank`) | Principiante | Variante → Plancha con rodillas apoyadas | **Otro ejercicio** → Plancha con toque de hombro (`shoulder-tap-plank`) | Plancha con mayor duración |
| Plancha lateral (`side-plank`) | Intermedio | Variante → Plancha lateral con rodillas | Variante → Plancha lateral con pierna elevada | Plancha lateral con pierna elevada |
| Dead bug (`dead-bug`) | Principiante | Variante → Dead bug moviendo solo brazos o piernas | Variante → Dead bug con brazo y pierna opuestos | Extender brazo y pierna opuestos |
| Pike push-up (`pike-push-up`) | Intermedio | Variante → Pike push-up con manos elevadas | Variante → Pike push-up con pies elevados | Pike con pies elevados |
| Peso muerto a una pierna (`single-leg-rdl`) | Intermedio | Variante → Peso muerto a una pierna con apoyo | **Solo carga** → Peso muerto a una pierna con carga | Bisagra unilateral con carga |
| Dominada asistida (`assisted-pull-up`) | Intermedio | Variante → Jalón con banda | Variante → Dominada con menos asistencia | Dominada con menos asistencia |
| Plancha con toque de hombro (`shoulder-tap-plank`) | Intermedio | **Otro ejercicio** → Plancha frontal (`front-plank`) | Variante → Toques de hombro más lentos | Toques más lentos |
| Subida al banco (`step-up`) | Principiante | Variante → Subida a un escalón bajo con apoyo | **Solo carga** → Escalón más alto o con carga | Escalón más alto o con carga |
| Curl femoral deslizante (`slider-leg-curl`) | Intermedio | Variante → Curl deslizante con una pierna por vez | Variante → Curl deslizante completo con cadera elevada | Curl completo con cadera elevada |
| Elevación lateral (`lateral-raise`) | Principiante | Variante → Elevación lateral con poco rango | Variante → Elevación lateral con pausa arriba | Elevación con pausa arriba |
| Apertura en polea (`cable-fly`) | Intermedio | Variante → Apertura en polea con rango corto | Variante → Apertura en polea con pausa al centro | Apertura con pausa al centro |
| Face pull (`face-pull`) | Intermedio | **Solo carga** → Usa menos peso | Variante → Face pull con rotación externa | Face pull con rotación externa |
| Curl martillo (`hammer-curl`) | Principiante | **Solo carga** → Usa mancuernas más ligeras | Variante → Curl inclinado | Curl inclinado |
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

## Ampliación REQ-302

El catálogo pasa de 55 a 83 fichas (71 de fuerza y 12 de resistencia). Las 28 altas tienen foto inicial y final locales; 20 admiten casa según el material declarado y 8 son de máquinas en gimnasio.

Las fichas con resistencia graduable bajan la carga o tensión para la regresión. Para progresar se añaden 1–2 repeticiones controladas y luego un incremento pequeño de resistencia, sin cambiar de movimiento. En abdominales sin material se reduce o aumenta el número de repeticiones manteniendo postura y recorrido. Estas pautas son ajustes voluntarios: no alteran los registros ni añaden peso automáticamente.

Se añaden alternativas de deltoides lateral y posterior, pantorrillas, brazos, pecho, cuádriceps, isquiotibiales, espalda media y core. Todos los enlaces de sustitución, incluidos los exportados a SQL, tienen destino real y el mismo músculo principal. El material y el nivel se comprueban por separado al preparar la sesión.

El press militar puede regresar al press sentado con mancuernas; la banca al press en el suelo; la sentadilla frontal a la sentadilla con mancuernas. Cada cambio usa la ficha y la imagen de destino. El curl martillo progresa su carga conservando el agarre neutro, y la regresión del curl deslizante es bilateral de recorrido corto.

Las fotos son de Free Exercise DB (dominio público / Unlicense), servidas desde `assets/exercise-media/`. La identidad de origen exacta queda en `source_id` de cada ficha y en `scripts/free-exercise-db-map.mjs`.

Persistencia opcional y manual: regenerar con `node scripts/generate-exercise-sql.mjs` y aplicar `supabase/exercises.sql` después de `supabase/auth.sql`. Incluye columnas de media idempotentes y conserva RLS. Los recursos son locales: no hace falta subir a Storage. El cliente combina las nuevas fichas con Supabase incluso antes de aplicar SQL y corrige sus metadatos antiguos conservando el estado administrativo. Recuperación: desactivar las filas nuevas con `active=false`; no borrar ejercicios presentes en historiales.

### Identidad de las demostraciones añadidas

| Ejercicio | Fuente exacta en Free Exercise DB |
|---|---|
| Apertura de banda al frente (`band-pull-apart`) | [Band_Pull_Apart](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Band_Pull_Apart) |
| Elevación lateral con banda (`band-lateral-raise`) | [Lateral_Raise_-_With_Bands](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Lateral_Raise_-_With_Bands) |
| Press de hombros con banda (`band-shoulder-press`) | [Shoulder_Press_-_With_Bands](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Shoulder_Press_-_With_Bands) |
| Apertura de pecho con banda (`band-chest-fly`) | [Cross_Over_-_With_Bands](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Cross_Over_-_With_Bands) |
| Curl femoral sentado con banda (`band-seated-leg-curl`) | [Seated_Band_Hamstring_Curl](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Seated_Band_Hamstring_Curl) |
| Press de pecho en el suelo (`dumbbell-floor-press`) | [Dumbbell_Floor_Press](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Dumbbell_Floor_Press) |
| Remo con mancuerna a una mano con apoyo (`one-arm-dumbbell-row`) | [One-Arm_Dumbbell_Row](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/One-Arm_Dumbbell_Row) |
| Sentadilla con mancuernas a los lados (`dumbbell-squat`) | [Dumbbell_Squat](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Dumbbell_Squat) |
| Zancada hacia atrás con mancuernas (`dumbbell-reverse-lunge`) | [Dumbbell_Rear_Lunge](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Dumbbell_Rear_Lunge) |
| Peso muerto de piernas semirrígidas con mancuernas (`dumbbell-stiff-leg-deadlift`) | [Stiff-Legged_Dumbbell_Deadlift](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Stiff-Legged_Dumbbell_Deadlift) |
| Press de hombros sentado con mancuernas (`seated-dumbbell-press`) | [Seated_Dumbbell_Press](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Seated_Dumbbell_Press) |
| Pájaros sentado con mancuernas (`seated-dumbbell-reverse-fly`) | [Seated_Bent-Over_Rear_Delt_Raise](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Seated_Bent-Over_Rear_Delt_Raise) |
| Curl concentrado (`concentration-curl`) | [Concentration_Curls](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Concentration_Curls) |
| Extensión de tríceps tumbado con mancuernas (`lying-dumbbell-triceps-extension`) | [Lying_Dumbbell_Tricep_Extension](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Lying_Dumbbell_Tricep_Extension) |
| Elevación de talón sentado con mancuerna (`seated-dumbbell-calf-raise`) | [Dumbbell_Seated_One-Leg_Calf_Raise](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Dumbbell_Seated_One-Leg_Calf_Raise) |
| Apertura de pecho con mancuernas (`dumbbell-chest-fly`) | [Dumbbell_Flyes](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Dumbbell_Flyes) |
| Curl alternado de bíceps (`dumbbell-alternating-curl`) | [Dumbbell_Alternate_Bicep_Curl](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Dumbbell_Alternate_Bicep_Curl) |
| Press de pecho en máquina (`machine-chest-press`) | [Machine_Bench_Press](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Machine_Bench_Press) |
| Press de hombros en máquina (`machine-shoulder-press`) | [Machine_Shoulder_Military_Press](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Machine_Shoulder_Military_Press) |
| Apertura inversa en máquina (`reverse-pec-deck`) | [Reverse_Machine_Flyes](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Reverse_Machine_Flyes) |
| Extensión de cuádriceps en máquina (`leg-extension`) | [Leg_Extensions](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Leg_Extensions) |
| Curl femoral sentado en máquina (`seated-leg-curl`) | [Seated_Leg_Curl](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Seated_Leg_Curl) |
| Elevación de gemelos sentado en máquina (`seated-calf-raise`) | [Seated_Calf_Raise](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Seated_Calf_Raise) |
| Curl de bíceps en máquina (`machine-biceps-curl`) | [Machine_Bicep_Curl](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Machine_Bicep_Curl) |
| Apertura de pecho en máquina (`pec-deck`) | [Butterfly](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Butterfly) |
| Crunch abdominal (`crunch`) | [Crunches](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Crunches) |
| Crunch inverso (`reverse-crunch`) | [Reverse_Crunch](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Reverse_Crunch) |
| Crunch oblicuo en el suelo (`oblique-crunch`) | [Oblique_Crunches_-_On_The_Floor](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Oblique_Crunches_-_On_The_Floor) |
