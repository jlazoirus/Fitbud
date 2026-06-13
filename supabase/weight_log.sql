-- ============================================================
-- Fitbud — migración incremental: registro de peso semanal.
-- Ejecuta este archivo en el SQL Editor de Supabase (no re-corras
-- schema.sql). Mueve el peso del navegador a la base de datos.
-- ============================================================
create table if not exists weight_log (
  week        int primary key,        -- 1..10 (semana del plan)
  kg          numeric not null,
  updated_at  timestamptz not null default now()
);

alter table weight_log enable row level security;
drop policy if exists "anon all weight_log" on weight_log;
create policy "anon all weight_log" on weight_log for all using (true) with check (true);
