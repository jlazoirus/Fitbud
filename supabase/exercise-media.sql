-- ============================================================
-- Fitbros — media real de ejercicios (REQ-15)
-- Generado por scripts/ingest-exercise-media.mjs. Idempotente.
-- Fuente: Free Exercise DB (yuhonas) — dominio público / Unlicense.
-- Ejecutar después de supabase/exercises.sql.
-- ============================================================

alter table exercises add column if not exists media_url  text;
alter table exercises add column if not exists poster_url text;
alter table exercises add column if not exists frames     jsonb not null default '[]'::jsonb;

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/back-squat/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/back-squat/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/back-squat/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'back-squat';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/bench-press/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/bench-press/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/bench-press/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'bench-press';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/seated-cable-row/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/seated-cable-row/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/seated-cable-row/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'seated-cable-row';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/romanian-deadlift/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/romanian-deadlift/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/romanian-deadlift/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'romanian-deadlift';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/barbell-hip-thrust/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/barbell-hip-thrust/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/barbell-hip-thrust/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'barbell-hip-thrust';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/incline-dumbbell-press/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/incline-dumbbell-press/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/incline-dumbbell-press/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'incline-dumbbell-press';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/lat-pulldown/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/lat-pulldown/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/lat-pulldown/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'lat-pulldown';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/bulgarian-split-squat/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/bulgarian-split-squat/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/bulgarian-split-squat/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'bulgarian-split-squat';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/overhead-press/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/overhead-press/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/overhead-press/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'overhead-press';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/walking-lunge/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/walking-lunge/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/walking-lunge/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'walking-lunge';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/standing-calf-raise/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/standing-calf-raise/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/standing-calf-raise/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'standing-calf-raise';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/assisted-dip/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/assisted-dip/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/assisted-dip/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'assisted-dip';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/biceps-curl/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/biceps-curl/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/biceps-curl/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'biceps-curl';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/triceps-pushdown/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/triceps-pushdown/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/triceps-pushdown/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'triceps-pushdown';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/leg-press/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/leg-press/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/leg-press/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'leg-press';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/leg-curl/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/leg-curl/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/leg-curl/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'leg-curl';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/tempo-squat/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/tempo-squat/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/tempo-squat/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'tempo-squat';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/push-up/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/push-up/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/push-up/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'push-up';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/incline-push-up/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/incline-push-up/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/incline-push-up/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'incline-push-up';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/band-row/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/band-row/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/band-row/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'band-row';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/glute-bridge/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/glute-bridge/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/glute-bridge/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'glute-bridge';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/single-leg-glute-bridge/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/single-leg-glute-bridge/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/single-leg-glute-bridge/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'single-leg-glute-bridge';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/front-plank/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/front-plank/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/front-plank/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'front-plank';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/side-plank/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/side-plank/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/side-plank/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'side-plank';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/dead-bug/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/dead-bug/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/dead-bug/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'dead-bug';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/pike-push-up/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/pike-push-up/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/pike-push-up/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'pike-push-up';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/single-leg-rdl/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/single-leg-rdl/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/single-leg-rdl/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'single-leg-rdl';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/assisted-pull-up/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/assisted-pull-up/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/assisted-pull-up/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'assisted-pull-up';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/shoulder-tap-plank/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/shoulder-tap-plank/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/shoulder-tap-plank/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'shoulder-tap-plank';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/step-up/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/step-up/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/step-up/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'step-up';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/slider-leg-curl/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/slider-leg-curl/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/slider-leg-curl/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'slider-leg-curl';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/lateral-raise/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/lateral-raise/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/lateral-raise/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'lateral-raise';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/cable-fly/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/cable-fly/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/cable-fly/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'cable-fly';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/face-pull/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/face-pull/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/face-pull/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'face-pull';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/hammer-curl/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/hammer-curl/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/hammer-curl/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'hammer-curl';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/diamond-push-up/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/diamond-push-up/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/diamond-push-up/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'diamond-push-up';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/pull-up/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/pull-up/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/pull-up/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'pull-up';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/decline-push-up/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/decline-push-up/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/decline-push-up/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'decline-push-up';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/weighted-pull-up/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/weighted-pull-up/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/weighted-pull-up/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'weighted-pull-up';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/front-squat/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/front-squat/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/front-squat/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'front-squat';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/archer-push-up/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/archer-push-up/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/archer-push-up/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'archer-push-up';

update exercises set
  media_type   = 'image_sequence',
  frames       = '["https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/nordic-hamstring-curl/0.jpg","https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/nordic-hamstring-curl/1.jpg"]'::jsonb,
  poster_url   = 'https://wtqnvtixvfapdbzcegdw.supabase.co/storage/v1/object/public/exercise-media/nordic-hamstring-curl/0.jpg',
  media_url    = null,
  source_name  = 'Free Exercise DB',
  source_url   = 'https://github.com/yuhonas/free-exercise-db',
  license_name = 'Public Domain (Unlicense)',
  attribution  = 'Free Exercise DB (yuhonas) — dominio público',
  updated_at   = now()
where slug = 'nordic-hamstring-curl';

