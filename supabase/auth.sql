-- ============================================================
-- Fitbud — migración: AUTENTICACIÓN Y MULTIUSUARIO
-- ------------------------------------------------------------
-- Convierte Fitbud en multiusuario con Supabase Auth:
--   • profiles: perfil por usuario (rol admin + preferencias)
--   • day_log / weight_log: pasan a ser POR USUARIO (user_id)
--   • RLS: cada quien ve solo lo suyo; el catálogo de alimentos
--     es compartido (lectura para autenticados, escritura solo admin).
--
-- Ejecuta este archivo en el SQL Editor de Supabase DESPUÉS de
-- schema.sql/seed.sql. NO re-corras schema.sql (borraría el catálogo).
--
-- ⚠️ Recrea day_log y weight_log: se pierden los registros de prueba
--    previos (que no tenían dueño). El catálogo (ingredientes/platos/
--    dietas) NO se toca.
--
-- Para hacer ADMIN a un usuario (la "consola de administración de
-- usuarios" es el propio dashboard de Supabase):
--   1) El usuario se registra desde la app (o en Authentication → Users).
--   2) En SQL Editor:  update profiles set is_admin = true
--                      where email = 'tu-correo@ejemplo.com';
-- ============================================================

-- ---------- PERFILES (1:1 con auth.users) ----------
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  is_admin    boolean not null default false,
  prefs       jsonb not null default '{}'::jsonb,   -- preferencias (dieta, entreno, notas)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Crea la fila de profile automáticamente cuando se registra un usuario.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Backfill: perfiles para usuarios que ya existieran.
insert into profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- ---------- REGISTRO DIARIO POR USUARIO ----------
drop table if exists day_log cascade;
create table day_log (
  user_id     uuid not null references auth.users(id) on delete cascade,
  log_date    date not null,
  state       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  primary key (user_id, log_date)
);

-- ---------- REGISTRO DE PESO POR USUARIO ----------
drop table if exists weight_log cascade;
create table weight_log (
  user_id     uuid not null references auth.users(id) on delete cascade,
  week        int not null,            -- 1..10 (semana del plan)
  kg          numeric not null,
  bf_pct      numeric,                 -- % grasa corporal (opcional)
  updated_at  timestamptz not null default now(),
  primary key (user_id, week)
);

-- ============================================================
-- RLS
-- ============================================================
alter table profiles   enable row level security;
alter table day_log    enable row level security;
alter table weight_log enable row level security;

-- Helper: ¿el usuario actual es admin?
create or replace function is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- profiles: cada quien ve/edita su propia fila (los admins pueden ver todas).
drop policy if exists "own profile select" on profiles;
drop policy if exists "own profile upsert" on profiles;
drop policy if exists "own profile update" on profiles;
create policy "own profile select" on profiles
  for select using (id = auth.uid() or is_admin());
create policy "own profile upsert" on profiles
  for insert with check (id = auth.uid());
create policy "own profile update" on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- day_log / weight_log: solo lo del usuario autenticado.
drop policy if exists "own day_log" on day_log;
create policy "own day_log" on day_log
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own weight_log" on weight_log;
create policy "own weight_log" on weight_log
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================
-- CATÁLOGO compartido: lectura para autenticados, escritura solo admin.
-- Reemplaza las políticas "anon all *" de schema.sql.
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array['ingredients','dishes','dish_ingredients','diets','diet_dishes']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "anon all %s" on %I', t, t);
    execute format('drop policy if exists "read catalog %s" on %I', t, t);
    execute format('drop policy if exists "admin write %s" on %I', t, t);
    -- lectura: cualquier usuario autenticado
    execute format($p$create policy "read catalog %s" on %I for select to authenticated using (true)$p$, t, t);
    -- escritura (insert/update/delete): solo admin
    execute format($p$create policy "admin write %s" on %I for all to authenticated using (is_admin()) with check (is_admin())$p$, t, t);
  end loop;
end $$;
