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
  "walking-lunge":           { q: "bodyweight walking lunge", id: null, curated_svg: "assets/exercise-media/walking-lunge.svg" }, // Zancada caminando sin mancuernas.
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
  "weighted-pull-up":        { q: "weighted pull ups", id: "Weighted_Pull_Ups" },

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
  "front-plank":             { q: "plank core", id: "Plank" },
  "side-plank":              { q: "side bridge plank", id: "Side_Bridge" },
  "dead-bug":                { q: "dead bug core", id: "Dead_Bug" },
  "pike-push-up":            { q: "pike push up shoulders", id: null, curated_svg: "assets/exercise-media/pike-push-up.svg" }, // Pies al suelo; una flexión de pino no es un pike.
  "single-leg-rdl":          { q: "single leg romanian deadlift", id: null, curated_svg: "assets/exercise-media/single-leg-rdl.svg" }, // Variante sin carga; no usar kettlebell.
  "shoulder-tap-plank":      { q: "plank shoulder tap", id: null, curated_svg: "assets/exercise-media/shoulder-tap-plank.svg" }, // Toque de hombro; no sustituir por escaladores.
  "step-up":                 { q: "bodyweight step ups", id: null, curated_svg: "assets/exercise-media/step-up.svg" }, // Variante sin carga; no usar mancuernas.
  "slider-leg-curl":         { q: "sliding leg curl hamstring", id: null, curated_svg: "assets/exercise-media/slider-leg-curl.svg" }, // Deslizadores o toalla; no usar pelota.
  "archer-push-up":          { q: "archer push up", id: null, curated_svg: "assets/exercise-media/archer-push-up.svg" }, // Desplazamiento lateral; no sustituir por flexión pliométrica.
  "nordic-hamstring-curl":   { q: "natural glute ham raise nordic", id: "Natural_Glute_Ham_Raise" },
};
