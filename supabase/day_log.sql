-- ============================================================
-- Fitbud — migración incremental: registro de consumo diario.
-- Ejecuta este archivo en el SQL Editor de Supabase (no re-corras
-- schema.sql, que borraría el catálogo de alimentos).
-- Guarda el estado de cada día (comidas marcadas, extras, entreno)
-- como un documento JSON por fecha, para sincronizar entre dispositivos.
-- ============================================================
create table if not exists day_log (
  log_date    date primary key,
  state       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table day_log enable row level security;
drop policy if exists "anon all day_log" on day_log;
create policy "anon all day_log" on day_log for all using (true) with check (true);
