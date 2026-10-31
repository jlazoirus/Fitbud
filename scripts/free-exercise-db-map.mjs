// ============================================================
// Mapeo de slugs del catálogo Fitbros → ids de Free Exercise DB
// (yuhonas/free-exercise-db, dominio público / Unlicense).
//
// Flujo de trabajo:
//   1) node scripts/ingest-exercise-media.mjs --check
//      Valida cada `id` contra el dataset real e imprime sugerencias
//      (top candidatos por `q`) para los que falten o no existan.
//   2) Corrige aquí los `id` que el check marque como dudosos.
//   3) node scripts/ingest-exercise-media.mjs --upload
//      Descarga las 2 fotos (inicio/fin), las sube a Supabase Storage
//      y genera supabase/exercise-media.sql.
//
// `q`  = términos en inglés para sugerir candidatos si `id` falla.
// `id` = id exacto del dataset (carpeta de imágenes). null = no importar.
//        `curated_svg` conserva una demostración propia de la variante exacta.
//        No usar proxies de otro ejercicio aunque trabajen el mismo músculo.
//
// Los slugs que NO aparezcan aquí también se omiten (SVG). Running,
// cycling y natación no existen en Free Exercise DB: se dejan fuera.
// ============================================================

export default {
  "preacher-curl": { id: "Preacher_Curl" },
  // REQ-303: demos locales de la variante exacta; no inferir el músculo por el nombre del recurso.
  "quadruped-glute-kickback": { id: "Glute_Kickback" },
  "alternating-heel-touch": { id: "Alternate_Heel_Touchers" },
  "tuck-crunch": { id: "Tuck_Crunch" },
  "close-grip-incline-push-up": { id: "Incline_Push-Up_Close-Grip" },
  "chin-up": { id: "Chin-Up" },
  "body-up": { id: "Body-Up" },
  "band-standing-hip-extension": { id: "Hip_Extension_with_Bands" },
  "band-hip-adduction": { id: "Band_Hip_Adductions" },
  "dumbbell-flat-bench-press": { id: "Dumbbell_Bench_Press" },
  "chest-supported-dumbbell-row": { id: "Dumbbell_Incline_Row" },
  "dumbbell-step-up": { id: "Dumbbell_Step_Ups" },
  "dumbbell-forward-lunge": { id: "Dumbbell_Lunges" },
  "dumbbell-box-squat": { id: "Dumbbell_Squat_To_A_Bench" },
  "seated-dumbbell-lateral-raise": { id: "Seated_Side_Lateral_Raise" },
  "incline-dumbbell-curl": { id: "Incline_Dumbbell_Curl" },
  "dumbbell-overhead-triceps-extension": { id: "Standing_Dumbbell_Triceps_Extension" },
  "supported-dumbbell-triceps-kickback": { id: "Tricep_Dumbbell_Kickback" },
  "dumbbell-standing-calf-raise": { id: "Standing_Dumbbell_Calf_Raise" },
  "dumbbell-plie-squat": { id: "Plie_Dumbbell_Squat" },
  "arnold-press": { id: "Arnold_Dumbbell_Press" },
  "smith-squat": { id: "Smith_Machine_Squat" },
  "smith-incline-bench-press": { id: "Smith_Machine_Incline_Bench_Press" },
  "smith-stiff-leg-deadlift": { id: "Smith_Machine_Stiff-Legged_Deadlift" },
  "leg-press-calf-raise": { id: "Calf_Press_On_The_Leg_Press_Machine" },
  "underhand-lat-pulldown": { id: "Underhand_Cable_Pulldowns" },
  "single-arm-seated-cable-row": { id: "Seated_One-arm_Cable_Pulley_Rows" },
  "cable-overhead-triceps-extension": { id: "Cable_Rope_Overhead_Triceps_Extension" },
  "cable-biceps-curl": { id: "Standing_Biceps_Cable_Curl" },
  "cable-reverse-fly": { id: "Cable_Rear_Delt_Fly" },
  "kneeling-cable-crunch": { id: "Cable_Crunch" },
  "cable-glute-kickback": { id: "One-Legged_Cable_Kickback" },
  "machine-triceps-extension": { id: "Machine_Triceps_Extension" },
  "machine-hip-adduction": { id: "Thigh_Adductor" },
  "hack-squat": { id: "Hack_Squat" },
  "seated-cable-reverse-fly": { id: "Cable_Seated_Lateral_Raise" },
  "cable-hip-adduction": { id: "Cable_Hip_Adduction" },
  "smith-flat-bench-press": { id: "Smith_Machine_Bench_Press" },
  "chest-supported-t-bar-row": { id: "Lying_T-Bar_Row" },
  "cable-pull-through": { id: "Pull_Through" },
  "lying-cable-triceps-extension": { id: "Cable_Lying_Triceps_Extension" },

  // REQ-302: identidad exacta del recurso local, sin proxies.
  "band-pull-apart": { id: "Band_Pull_Apart" },
  "band-lateral-raise": { id: "Lateral_Raise_-_With_Bands" },
  "band-shoulder-press": { id: "Shoulder_Press_-_With_Bands" },
  "band-chest-fly": { id: "Cross_Over_-_With_Bands" },
  "band-seated-leg-curl": { id: "Seated_Band_Hamstring_Curl" },
  "dumbbell-floor-press": { id: "Dumbbell_Floor_Press" },
  "one-arm-dumbbell-row": { id: "One-Arm_Dumbbell_Row" },
  "dumbbell-squat": { id: "Dumbbell_Squat" },
  "dumbbell-reverse-lunge": { id: "Dumbbell_Rear_Lunge" },
  "dumbbell-stiff-leg-deadlift": { id: "Stiff-Legged_Dumbbell_Deadlift" },
  "seated-dumbbell-press": { id: "Seated_Dumbbell_Press" },
  "seated-dumbbell-reverse-fly": { id: "Seated_Bent-Over_Rear_Delt_Raise" },
  "concentration-curl": { id: "Concentration_Curls" },
  "lying-dumbbell-triceps-extension": { id: "Lying_Dumbbell_Tricep_Extension" },
  "seated-dumbbell-calf-raise": { id: "Dumbbell_Seated_One-Leg_Calf_Raise" },
  "dumbbell-chest-fly": { id: "Dumbbell_Flyes" },
  "dumbbell-alternating-curl": { id: "Dumbbell_Alternate_Bicep_Curl" },
  "machine-chest-press": { id: "Machine_Bench_Press" },
  "machine-shoulder-press": { id: "Machine_Shoulder_Military_Press" },
  "reverse-pec-deck": { id: "Reverse_Machine_Flyes" },
  "leg-extension": { id: "Leg_Extensions" },
  "seated-leg-curl": { id: "Seated_Leg_Curl" },
  "seated-calf-raise": { id: "Seated_Calf_Raise" },
  "machine-biceps-curl": { id: "Machine_Bicep_Curl" },
  "pec-deck": { id: "Butterfly" },
  "crunch": { id: "Crunches" },
  "reverse-crunch": { id: "Reverse_Crunch" },
  "oblique-crunch": { id: "Oblique_Crunches_-_On_The_Floor" },

  // --- Gimnasio / fuerza ---
  "back-squat":              { q: "barbell full squat", id: "Barbell_Full_Squat" },
  "bench-press":             { q: "barbell bench press medium grip", id: "Barbell_Bench_Press_-_Medium_Grip" },
  "seated-cable-row":        { q: "seated cable row", id: "Seated_Cable_Rows" },
  "romanian-deadlift":       { q: "romanian deadlift", id: "Romanian_Deadlift" },
  "barbell-hip-thrust":      { q: "barbell hip thrust glute bridge", id: "Barbell_Hip_Thrust" },
  "incline-dumbbell-press":  { q: "incline dumbbell press", id: "Incline_Dumbbell_Press" },
  "lat-pulldown":            { q: "wide grip lat pulldown", id: "Wide-Grip_Lat_Pulldown" },
  "bulgarian-split-squat":   { q: "bodyweight rear foot elevated split squat", id: null, curated_svg: "assets/exercise-media/bulgarian-split-squat.svg" }, // Pie posterior elevado, sin mancuernas.
  "overhead-press":          { q: "standing military press shoulder", id: "Standing_Military_Press" },
  "walking-lunge":           { q: "bodyweight walking lunge", id: "Bodyweight_Walking_Lunge" }, // REQ-294: zancada caminando sin mancuernas, variante exacta.
  "standing-calf-raise":     { q: "bodyweight standing calf raise", id: null, curated_svg: "assets/exercise-media/standing-calf-raise.svg" }, // Variante sin máquina ni carga.
  "assisted-dip":            { q: "bench dips triceps", id: "Bench_Dips" },
  "biceps-curl":             { q: "dumbbell bicep curl", id: "Dumbbell_Bicep_Curl" },
  "triceps-pushdown":        { q: "triceps pushdown rope cable", id: "Triceps_Pushdown" },
  "leg-press":               { q: "leg press", id: "Leg_Press" },
  "leg-curl":                { q: "lying leg curls hamstring", id: "Lying_Leg_Curls" },
  "lateral-raise":           { q: "side lateral raise dumbbell", id: "Side_Lateral_Raise" },
  "cable-fly":               { q: "cable crossover chest fly", id: "Cable_Crossover" },
  "face-pull":               { q: "face pull rope rear delt", id: "Face_Pull" },
  "hammer-curl":             { q: "hammer curls dumbbell", id: "Hammer_Curls" },
  "front-squat":             { q: "front barbell squat", id: "Front_Barbell_Squat" },
  "weighted-pull-up":        { q: "weighted pull ups belt", id: null }, // PENDIENTE: la unica entrada del dataset (Weighted_Pull_Ups) muestra asistencia con liga, no lastre; el equipo de la ficha exige cinturon de lastre.

  // --- Peso corporal ---
  "tempo-squat":             { q: "bodyweight squat", id: "Bodyweight_Squat" },
  "push-up":                 { q: "pushups push up", id: "Pushups" },
  "incline-push-up":         { q: "incline push up", id: "Incline_Push-Up" },
  "decline-push-up":         { q: "decline push up", id: "Decline_Push-Up" },
  "diamond-push-up":         { q: "close grip push up triceps", id: "Push-Ups_-_Close_Triceps_Position" },
  "pull-up":                 { q: "pullups pull up", id: "Pullups" },
  "assisted-pull-up":        { q: "assisted pull up machine band", id: "Band_Assisted_Pull-Up" },
  "band-row":                { q: "resistance band row standing", id: null, curated_svg: "assets/exercise-media/band-row.svg" }, // Banda; no sustituir por un remo invertido bajo barra.
  "inverted-row":            { q: "inverted row", id: null }, // REQ-293: fotos de Inverted_Row ya copiadas en assets/exercise-media/inverted-row-{0,1}.jpg.
  "glute-bridge":            { q: "butt lift bridge glute", id: "Butt_Lift_Bridge" },
  "single-leg-glute-bridge": { q: "single leg glute bridge", id: "Single_Leg_Glute_Bridge" },
  "front-plank":             { q: "plank core", id: "Plank" }, // El frame 0 del dataset muestra a la persona incorporandose; se publica el frame de plancha correcto en ambas posiciones (ejercicio estatico).
  "side-plank":              { q: "side bridge plank", id: "Side_Bridge" },
  "dead-bug":                { q: "dead bug core", id: "Dead_Bug" },
  "pike-push-up":            { q: "pike push up shoulders", id: null, curated_svg: "assets/exercise-media/pike-push-up.svg" }, // Pies al suelo; una flexión de pino no es un pike.
  "single-leg-rdl":          { q: "single leg romanian deadlift", id: null, curated_svg: "assets/exercise-media/single-leg-rdl.svg" }, // Variante sin carga; no usar kettlebell.
  "shoulder-tap-plank":      { q: "plank shoulder tap", id: null, curated_svg: "assets/exercise-media/shoulder-tap-plank.svg" }, // Toque de hombro; no sustituir por escaladores.
  "step-up":                 { q: "bodyweight step ups", id: null, curated_svg: "assets/exercise-media/step-up.svg" }, // Variante sin carga; no usar mancuernas.
  "slider-leg-curl":         { q: "sliding leg curl hamstring", id: null, curated_svg: "assets/exercise-media/slider-leg-curl.svg" }, // Deslizadores o toalla; no usar pelota.
  "archer-push-up":          { q: "archer push up", id: null, curated_svg: "assets/exercise-media/archer-push-up.svg" }, // Desplazamiento lateral; no sustituir por flexión pliométrica.
  "nordic-hamstring-curl":   { q: "natural glute ham raise nordic", id: "Natural_Glute_Ham_Raise" },

  // REQ-310: ejercicios de producción que hoy muestran un GIF ajeno con
  // marca de agua (fitnessprogramer.com); se reemplazan por fotos de
  // dominio público servidas desde assets/ (normalize corrige la media
  // sin tocar las filas de Supabase).
  "scaled-push-up":            { q: "push ups", id: "Pushups" }, // La ficha enseña la flexión estándar con opciones de escalado.
  "dumbbell-alternating-hammer-curl": { q: "hammer curls dumbbell", id: "Hammer_Curls" },
  "band-assisted-pull-up":     { q: "band assisted pull up", id: "Band_Assisted_Pull-Up" },
  "standing-heel-raise":       { q: "standing calf raise bodyweight", id: null }, // PENDIENTE: solo hay elevación en máquina; la ficha es de pie sin equipo.
  "dumbbell-lateral-raise":    { q: "side lateral raise dumbbell", id: "Side_Lateral_Raise" },
  "band-alternating-lat-pulldown": { q: "band lat pulldown", id: null }, // PENDIENTE: el dataset no tiene jalón con banda; no usar proxy de polea.
  "dumbbell-reverse-fly":      { q: "bent over rear delt raise dumbbell", id: "Seated_Bent-Over_Rear_Delt_Raise" },
  "dumbbell-romanian-deadlift": { q: "dumbbell romanian deadlift stiff leg", id: "Stiff-Legged_Dumbbell_Deadlift" },
  "dumbbell-standing-shoulder-press": { q: "standing dumbbell shoulder press", id: "Standing_Dumbbell_Press" },
  "dumbbell-glute-bridge":     { q: "glute bridge dumbbell", id: null }, // PENDIENTE: el dataset solo tiene el puente sin carga; la ficha lleva mancuerna.
  "dumbbell-bent-over-row":    { q: "bent over dumbbell row two arm", id: "Bent_Over_Two-Dumbbell_Row" },
  "dumbbell-reverse-lunge":      { q: "dumbbell rear lunge", id: "Dumbbell_Rear_Lunge" },
  "dumbbell-floor-press":        { q: "dumbbell floor press", id: "Dumbbell_Floor_Press" },
  "dumbbell-overhead-triceps-extension": { q: "standing dumbbell triceps extension", id: "Standing_Dumbbell_Triceps_Extension" },
  "dumbbell-alternating-curl":   { q: "dumbbell alternate bicep curl", id: "Dumbbell_Alternate_Bicep_Curl" },
  "goblet-squat":              { q: "goblet squat kettlebell dumbbell", id: "Goblet_Squat" },
};
