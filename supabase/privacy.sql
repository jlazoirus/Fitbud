-- ============================================================
-- Fitbud - consentimiento, aptitud y privacidad (REQ-14)
-- Idempotente. Ejecuta despues de supabase/plan_cycles.sql.
-- ============================================================

create table if not exists user_consents (
  id              bigint generated always as identity primary key,
  user_id         uuid not null references auth.users(id) on delete cascade,
  consent_type    text not null check (consent_type in (
    'body_progress',
    'automated_coach',
    'progress_photos',
    'email_followup',
    'email_marketing'
  )),
  policy_version  text not null,
  status          text not null check (status in ('accepted','withdrawn')),
  accepted_at     timestamptz,
  withdrawn_at    timestamptz,
  source          text not null default 'app' check (source in ('onboarding','privacy_center','photo_prompt','app')),
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, consent_type, policy_version)
);

create index if not exists user_consents_user_type_idx
  on user_consents (user_id, consent_type, updated_at desc);

create table if not exists safety_screenings (
  id                    bigint generated always as identity primary key,
  user_id               uuid not null references auth.users(id) on delete cascade,
  screening_version     text not null,
  age_confirmed         boolean not null default false,
  responses             jsonb not null default '{}'::jsonb,
  has_red_flags         boolean not null default false,
  cleared_for_training  boolean not null default false,
  completed_at          timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (user_id, screening_version)
);

create index if not exists safety_screenings_user_idx
  on safety_screenings (user_id, completed_at desc);

alter table user_consents enable row level security;
alter table safety_screenings enable row level security;

drop policy if exists "read own consents" on user_consents;
drop policy if exists "write own consents" on user_consents;
create policy "read own consents" on user_consents
  for select using (user_id = auth.uid());
create policy "write own consents" on user_consents
  for all
  using (user_id = auth.uid() and is_active())
  with check (user_id = auth.uid() and is_active());

drop policy if exists "read own safety screenings" on safety_screenings;
drop policy if exists "write own safety screenings" on safety_screenings;
create policy "read own safety screenings" on safety_screenings
  for select using (user_id = auth.uid());
create policy "write own safety screenings" on safety_screenings
  for all
  using (user_id = auth.uid() and is_active())
  with check (user_id = auth.uid() and is_active());

comment on table user_consents is
  'Historial versionado de consentimientos de privacidad del usuario.';
comment on table safety_screenings is
  'Cuestionario versionado de aptitud; una senal de alerta bloquea rutinas hasta revision profesional.';
