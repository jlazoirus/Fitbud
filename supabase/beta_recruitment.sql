-- ============================================================
-- Fitbros - reclutamiento beta REQ-70
-- Idempotente. Ejecutar despues de auth.sql.
-- No se aplica automaticamente en produccion.
-- ============================================================

create table if not exists beta_recruitment_submissions (
  id                    bigint generated always as identity primary key,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  source                text not null default 'beta-reclutamiento',
  name                  text not null,
  whatsapp              text not null,
  whatsapp_normalized   text not null,
  age_band              text not null,
  country_city          text not null,
  stage                 text not null check (stage in ('beginner','returning','consistent','advanced')),
  goal                  text not null,
  recent_attempt        boolean not null default false,
  tools                 jsonb not null default '[]'::jsonb,
  pains                 jsonb not null default '[]'::jsonb,
  story                 text not null,
  investment            text not null check (investment in ('none','time','app','coach')),
  availability          text not null check (availability in ('interview_beta','interview','later')),
  health                text not null check (health in ('clear','caution')),
  segment               text not null check (segment in ('A - Comprometido autonomo','B - Principiante guiado','Exploratorio')),
  priority              text not null check (priority in ('Alta','Media','Baja')),
  priority_score        integer not null default 0,
  segment_scores        jsonb not null default '{}'::jsonb,
  beta_eligible         boolean not null default false,
  status                text not null default 'new' check (status in (
    'new',
    'shortlisted',
    'contacted',
    'interview_scheduled',
    'interviewed',
    'beta_invited',
    'rejected',
    'archived'
  )),
  review_notes          text,
  contacted_at          timestamptz,
  raw_payload           jsonb not null default '{}'::jsonb,
  constraint beta_recruitment_submissions_whatsapp_normalized_key unique (whatsapp_normalized)
);

create index if not exists beta_recruitment_priority_idx
  on beta_recruitment_submissions (status, priority_score desc, created_at asc);

create index if not exists beta_recruitment_segment_idx
  on beta_recruitment_submissions (segment, priority, created_at desc);

alter table beta_recruitment_submissions enable row level security;

drop policy if exists beta_recruitment_admin_read on beta_recruitment_submissions;
drop policy if exists beta_recruitment_admin_write on beta_recruitment_submissions;

create policy beta_recruitment_admin_read on beta_recruitment_submissions
  for select using (is_admin() and is_active());

create policy beta_recruitment_admin_write on beta_recruitment_submissions
  for all
  using (is_admin() and is_active())
  with check (is_admin() and is_active());

comment on table beta_recruitment_submissions is
  'Postulaciones publicas para entrevistas y beta controlada de REQ-70. Escritura publica solo via API server-side con service role; lectura/edicion solo admin.';
