-- ============================================================
-- Fitbud — administración de usuarios (REQ-07)
-- Idempotente. Ejecuta en el SQL Editor de Supabase sobre una DB con auth.sql.
-- Agrega el flag profiles.active y hace que un usuario inactivo quede en
-- SOLO LECTURA (no escribe day_log/weight_log ni catálogo).
-- ============================================================

-- 1) Flag de activación (true por defecto).
alter table profiles add column if not exists active boolean not null default true;

-- 2) Helper: ¿el usuario actual está activo?
create or replace function is_active()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select active from public.profiles where id = auth.uid()), false);
$$;

-- 3) day_log / weight_log: lectura propia; escritura solo si está activo.
drop policy if exists "own day_log" on day_log;
drop policy if exists "read own day_log" on day_log;
drop policy if exists "write own day_log" on day_log;
create policy "read own day_log"  on day_log for select using (user_id = auth.uid());
create policy "write own day_log" on day_log for all
  using (user_id = auth.uid() and is_active())
  with check (user_id = auth.uid() and is_active());

drop policy if exists "own weight_log" on weight_log;
drop policy if exists "read own weight_log" on weight_log;
drop policy if exists "write own weight_log" on weight_log;
create policy "read own weight_log"  on weight_log for select using (user_id = auth.uid());
create policy "write own weight_log" on weight_log for all
  using (user_id = auth.uid() and is_active())
  with check (user_id = auth.uid() and is_active());

-- 4) Catálogo: escritura solo admin Y activo.
do $$
declare t text;
begin
  foreach t in array array['ingredients','dishes','dish_ingredients','diets','diet_dishes']
  loop
    execute format('drop policy if exists "admin write %s" on %I', t, t);
    execute format($p$create policy "admin write %s" on %I for all to authenticated
      using (is_admin() and is_active()) with check (is_admin() and is_active())$p$, t, t);
  end loop;
end $$;

-- 5) Admins pueden leer todas las filas de profiles (para la vista admin).
--    (La lectura ya estaba: "own profile select" incluye is_admin().)
