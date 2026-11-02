# REQ-303 — Más ejercicios, con prioridad gimnasio

El catálogo local pasa de 83 a **123 fichas: 111 de fuerza y 12 de resistencia**. El lote incorpora **40 fichas: 32 de gimnasio y 8 compartidas con casa**. Las 32 de gimnasio incluyen 12 con mancuernas y 20 con poleas, máquinas o barra guiada. La selección conservadora de lugar evita ofrecer en casa bancos regulables o máquinas no declarados.

## Criterios aplicados a cada alta

- Nombre, posición inicial y tres pasos describen la ejecución de sus dos fotos locales, sin cambiar una variante por otra que comparta músculo.
- Nivel técnico explícito. Las sentadillas o bisagras en Smith conservan nivel intermedio por montaje, seguros y control de la postura; los aislamientos guiados con apoyo estable son principiantes. El body-up es avanzado por la extensión bilateral de codos con el cuerpo en plancha.
- Músculo principal explícito, distinto de los músculos secundarios. Todo sustituto tiene un ID existente, el mismo músculo principal y su propia ficha. Nivel, lugar, material y limitaciones se comprueban por separado en el entrenamiento.
- Regresión y progresión tipadas: si cambia el ejercicio, se carga su imagen; si solo cambia la dosis, se conserva la ejecución. Para pesos se pide completar las series con técnica estable y dos repeticiones en reserva en dos sesiones antes del incremento mínimo disponible. Las pautas no reescriben dosis ni registros automáticamente.
- El modo suave excluye las nuevas suspensiones, body-up, zancada/subida unilateral cargada y press Arnold.
- Equipo, errores, señales de alerta y contraindicaciones declarados. Se comprueban topes y seguros en Smith/prensa/hack, anclajes de bandas y tobillera en trabajo de cadera.
- Fotos de inicio y final servidas desde el propio deploy, con atribución y licencia pública. Ninguna de las 40 demostraciones reutiliza el `source_id` de otra alta empaquetada.

## Correcciones de la fuente

La fuente es Free Exercise DB (yuhonas, Unlicense). Las fotos se revisaron junto a sus instrucciones; no se importó automáticamente su clasificación muscular.

- `Cable_Seated_Lateral_Raise` muestra el tronco inclinado sobre los muslos y una apertura posterior. Se publica como **Apertura posterior sentado en poleas**, con **deltoides posterior**, no como elevación lateral.
- `Cable_Hip_Adduction` etiqueta cuádriceps, pero muestra acercar la pierna a la línea media. La ficha identifica **aductores**. En `Band_Hip_Adductions` las instrucciones de origen describen abrir la pierna; nuestras instrucciones siguen las fotos y la aducción hacia la línea media.
- `Tricep_Dumbbell_Kickback` muestra una mano y una rodilla apoyadas en banco. La ficha declara banco y ejecución unilateral; no copia la descripción de dos mancuernas sin apoyo.
- La dominada supina tiene identidad propia (`chin-up`); se elimina ese alias del ejercicio de dominada prona para evitar confundir sus demostraciones.

## Inventario y procedencia

| Slug | Lugar curado | Músculo principal | Nivel | Recurso de origen exacto |
|---|---|---|---|---|
| `quadruped-glute-kickback` | Casa / gimnasio | Glúteos | beginner | [Glute_Kickback](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Glute_Kickback) |
| `alternating-heel-touch` | Casa / gimnasio | Core | beginner | [Alternate_Heel_Touchers](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Alternate_Heel_Touchers) |
| `tuck-crunch` | Casa / gimnasio | Core | intermediate | [Tuck_Crunch](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Tuck_Crunch) |
| `close-grip-incline-push-up` | Casa / gimnasio | Tríceps | beginner | [Incline_Push-Up_Close-Grip](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Incline_Push-Up_Close-Grip) |
| `chin-up` | Casa / gimnasio | Dorsal ancho | intermediate | [Chin-Up](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Chin-Up) |
| `body-up` | Casa / gimnasio | Tríceps | advanced | [Body-Up](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Body-Up) |
| `band-standing-hip-extension` | Casa / gimnasio | Glúteos | beginner | [Hip_Extension_with_Bands](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Hip_Extension_with_Bands) |
| `band-hip-adduction` | Casa / gimnasio | Aductores | beginner | [Band_Hip_Adductions](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Band_Hip_Adductions) |
| `dumbbell-flat-bench-press` | Gimnasio | Pecho | beginner | [Dumbbell_Bench_Press](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Dumbbell_Bench_Press) |
| `chest-supported-dumbbell-row` | Gimnasio | Espalda media | beginner | [Dumbbell_Incline_Row](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Dumbbell_Incline_Row) |
| `dumbbell-step-up` | Gimnasio | Cuádriceps | intermediate | [Dumbbell_Step_Ups](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Dumbbell_Step_Ups) |
| `dumbbell-forward-lunge` | Gimnasio | Cuádriceps | intermediate | [Dumbbell_Lunges](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Dumbbell_Lunges) |
| `dumbbell-box-squat` | Gimnasio | Cuádriceps | beginner | [Dumbbell_Squat_To_A_Bench](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Dumbbell_Squat_To_A_Bench) |
| `seated-dumbbell-lateral-raise` | Gimnasio | Deltoides lateral | beginner | [Seated_Side_Lateral_Raise](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Seated_Side_Lateral_Raise) |
| `incline-dumbbell-curl` | Gimnasio | Bíceps | intermediate | [Incline_Dumbbell_Curl](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Incline_Dumbbell_Curl) |
| `dumbbell-overhead-triceps-extension` | Gimnasio | Tríceps | intermediate | [Standing_Dumbbell_Triceps_Extension](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Standing_Dumbbell_Triceps_Extension) |
| `supported-dumbbell-triceps-kickback` | Gimnasio | Tríceps | beginner | [Tricep_Dumbbell_Kickback](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Tricep_Dumbbell_Kickback) |
| `dumbbell-standing-calf-raise` | Gimnasio | Pantorrillas | beginner | [Standing_Dumbbell_Calf_Raise](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Standing_Dumbbell_Calf_Raise) |
| `dumbbell-plie-squat` | Gimnasio | Cuádriceps | beginner | [Plie_Dumbbell_Squat](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Plie_Dumbbell_Squat) |
| `arnold-press` | Gimnasio | Hombros | intermediate | [Arnold_Dumbbell_Press](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Arnold_Dumbbell_Press) |
| `smith-squat` | Gimnasio | Cuádriceps | intermediate | [Smith_Machine_Squat](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Smith_Machine_Squat) |
| `smith-incline-bench-press` | Gimnasio | Pecho | intermediate | [Smith_Machine_Incline_Bench_Press](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Smith_Machine_Incline_Bench_Press) |
| `smith-stiff-leg-deadlift` | Gimnasio | Isquiotibiales | intermediate | [Smith_Machine_Stiff-Legged_Deadlift](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Smith_Machine_Stiff-Legged_Deadlift) |
| `leg-press-calf-raise` | Gimnasio | Pantorrillas | intermediate | [Calf_Press_On_The_Leg_Press_Machine](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Calf_Press_On_The_Leg_Press_Machine) |
| `underhand-lat-pulldown` | Gimnasio | Dorsal ancho | beginner | [Underhand_Cable_Pulldowns](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Underhand_Cable_Pulldowns) |
| `single-arm-seated-cable-row` | Gimnasio | Espalda media | intermediate | [Seated_One-arm_Cable_Pulley_Rows](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Seated_One-arm_Cable_Pulley_Rows) |
| `cable-overhead-triceps-extension` | Gimnasio | Tríceps | intermediate | [Cable_Rope_Overhead_Triceps_Extension](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Cable_Rope_Overhead_Triceps_Extension) |
| `cable-biceps-curl` | Gimnasio | Bíceps | beginner | [Standing_Biceps_Cable_Curl](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Standing_Biceps_Cable_Curl) |
| `cable-reverse-fly` | Gimnasio | Deltoides posterior | intermediate | [Cable_Rear_Delt_Fly](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Cable_Rear_Delt_Fly) |
| `kneeling-cable-crunch` | Gimnasio | Core | intermediate | [Cable_Crunch](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Cable_Crunch) |
| `cable-glute-kickback` | Gimnasio | Glúteos | beginner | [One-Legged_Cable_Kickback](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/One-Legged_Cable_Kickback) |
| `machine-triceps-extension` | Gimnasio | Tríceps | beginner | [Machine_Triceps_Extension](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Machine_Triceps_Extension) |
| `machine-hip-adduction` | Gimnasio | Aductores | beginner | [Thigh_Adductor](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Thigh_Adductor) |
| `hack-squat` | Gimnasio | Cuádriceps | beginner | [Hack_Squat](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Hack_Squat) |
| `seated-cable-reverse-fly` | Gimnasio | Deltoides posterior | intermediate | [Cable_Seated_Lateral_Raise](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Cable_Seated_Lateral_Raise) |
| `cable-hip-adduction` | Gimnasio | Aductores | beginner | [Cable_Hip_Adduction](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Cable_Hip_Adduction) |
| `smith-flat-bench-press` | Gimnasio | Pecho | intermediate | [Smith_Machine_Bench_Press](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Smith_Machine_Bench_Press) |
| `chest-supported-t-bar-row` | Gimnasio | Espalda media | beginner | [Lying_T-Bar_Row](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Lying_T-Bar_Row) |
| `cable-pull-through` | Gimnasio | Glúteos | intermediate | [Pull_Through](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Pull_Through) |
| `lying-cable-triceps-extension` | Gimnasio | Tríceps | intermediate | [Cable_Lying_Triceps_Extension](https://github.com/yuhonas/free-exercise-db/tree/main/exercises/Cable_Lying_Triceps_Extension) |

## Verificación y operación

`validate-exercises.mjs` valida integridad de las 123 fichas, músculo de todos los enlaces de sustitución, sentido de nivel y patrón de los cambios de ejercicio, unicidad de demos de altas, archivos JPEG, revisión de filas remotas antiguas y coherencia con SQL/niveles. `exercise-gym-expansion.spec.js` recorre móvil y escritorio, guía con imágenes cargadas, normalización remota, sustitución de aductores y cambios de ejercicio. Las pruebas de sustitución de entrenamiento comprueban identidad muscular y presencia de nuevas opciones, sin congelar un inventario antiguo de nombres.

Persistencia opcional/manual: `node scripts/generate-exercise-sql.mjs` genera `supabase/exercises.sql`, idempotente y con RLS; aplicar tras `supabase/auth.sql`. `supabase/exercise-levels.sql` actualiza solo niveles. El cliente incorpora las nuevas fichas y corrige su contenido remoto antiguo incluso sin ejecutar SQL; conserva el estado administrativo y los snapshots de sesiones. No se ejecutan migraciones de producción. Para retirar una ficha, desactivarla con `active=false` conservando su ID si figura en historiales.
