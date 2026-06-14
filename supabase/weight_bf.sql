-- ============================================================
-- Fitbud — migración incremental: % grasa corporal en weight_log (REQ-03)
-- Idempotente. Ejecuta en el SQL Editor de Supabase sobre una DB ya creada
-- con auth.sql. Si recreas con auth.sql, la columna ya viene incluida.
-- ============================================================
alter table weight_log add column if not exists bf_pct numeric;
