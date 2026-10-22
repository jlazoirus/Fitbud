-- ============================================================
-- Fitbros — foto real para caminata, running, bici y natación (REQ-259)
-- Las imágenes viven en assets/exercise-media/ del propio deploy.
-- Opcional: sin este UPDATE la app ya usa la foto del catálogo local
-- (exerciseMediaSources). Sirve para que la tabla y la admin queden al día.
-- Idempotente. Ejecutar después de supabase/exercise-media.sql.
-- ============================================================

update exercises set
  media_type   = 'image',
  media_url    = 'assets/exercise-media/' || discipline || '.jpg',
  poster_url   = 'assets/exercise-media/' || discipline || '.jpg',
  frames       = '[]'::jsonb,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where discipline in ('walking','running','cycling');

update exercises set
  media_type   = 'image',
  media_url    = 'assets/exercise-media/swimming.jpg',
  poster_url   = 'assets/exercise-media/swimming.jpg',
  frames       = '[]'::jsonb,
  source_name  = 'DoD Warrior Games 2016 (U.S. Army)',
  source_url   = 'https://commons.wikimedia.org/wiki/File:DoD_Warrior_Games_2016_160611-A-OF234-296.jpg',
  license_name = 'Public Domain (obra del Gobierno de EE. UU.)',
  attribution  = 'U.S. Army vía Wikimedia Commons — dominio público',
  updated_at   = now()
where discipline = 'swimming';
