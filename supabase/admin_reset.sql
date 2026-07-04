-- ============================================================
-- Fitbud — REQ-126: auditoría de acciones administrativas de
-- reseteo/regeneración de plan futuro y reinicio de usuario.
-- Idempotente. Ejecuta después de supabase/plan_cycles.sql.
-- La API administrativa (api/admin.js) usa service role y por tanto
-- no depende de RLS; se habilita igual por consistencia con el resto
-- del esquema y para que ningún cliente autenticado pueda leer/escribir.
-- ============================================================

create table if not exists admin_actions_log (
  id             bigint generated always as identity primary key,
  admin_id       uuid,
  target_user_id uuid not null,
  action         text not null check (action in ('reset_plan_preview','reset_plan_apply','reset_user')),
  scope          text,
  from_date      date,
  result         jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

create index if not exists admin_actions_log_target_idx
  on admin_actions_log (target_user_id, created_at desc);

alter table admin_actions_log enable row level security;
-- Sin policies: solo el service role (API administrativa) puede leer/escribir.
