-- ============================================================
-- Evolv - inscripciones al club desde /unete (REQ-371)
-- Idempotente. Ejecutar despues de auth.sql.
-- No se aplica automaticamente en produccion.
-- ============================================================

create table if not exists community_signups (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  source       text not null default 'unete',
  name         text not null,
  email        text not null,
  whatsapp     text,
  pain         text check (pain is null or pain in ('comer_fuera','horarios','anotar','no_saber','ganas')),
  consent_at   timestamptz not null,
  status       text not null default 'new' check (status in ('new','contacted','invited','unsubscribed')),
  notes        text,
  constraint community_signups_email_key unique (email)
);

create index if not exists community_signups_source_idx
  on community_signups (source, created_at desc);

alter table community_signups enable row level security;

drop policy if exists community_signups_admin_read on community_signups;
drop policy if exists community_signups_admin_write on community_signups;

create policy community_signups_admin_read on community_signups
  for select using (is_admin() and is_active());

create policy community_signups_admin_write on community_signups
  for all
  using (is_admin() and is_active())
  with check (is_admin() and is_active());

comment on table community_signups is
  'Inscripciones publicas al club desde /unete (REQ-371). Escritura publica solo via API server-side con service role.';
