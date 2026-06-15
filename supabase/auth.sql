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
  active      boolean not null default true,        -- REQ-07: activar/desactivar
  prefs       jsonb not null default '{}'::jsonb,   -- preferencias (dieta, entreno, notas)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
-- Por si la tabla ya existía sin la columna (install previo a REQ-07):
alter table profiles add column if not exists active boolean not null default true;

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
  plan_version_id bigint,
  updated_at  timestamptz not null default now(),
  primary key (user_id, log_date)
);

-- ---------- REGISTRO DE PESO POR USUARIO ----------
drop table if exists weight_log cascade;
create table weight_log (
  user_id     uuid not null references auth.users(id) on delete cascade,
  cycle_start date not null default '2026-06-13',
  week        int not null,            -- 1..10 (semana del plan)
  kg          numeric not null,
  bf_pct      numeric,                 -- % grasa corporal (opcional)
  updated_at  timestamptz not null default now(),
  primary key (user_id, cycle_start, week)
);

-- ---------- CICLOS DE 4 O 10 SEMANAS + RECAP ----------
create table if not exists plan_cycles (
  id             bigint generated always as identity primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  cycle_number   int not null check (cycle_number > 0),
  start_date     date not null,
  end_date       date not null,
  challenge      text,
  next_challenge text,
  status         text not null default 'active' check (status in ('active','completed')),
  summary        jsonb not null default '{}'::jsonb,
  photo_path     text,
  completed_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, cycle_number)
);

-- ============================================================
-- RLS
-- ============================================================
alter table profiles   enable row level security;
alter table day_log    enable row level security;
alter table weight_log enable row level security;
alter table plan_cycles enable row level security;

-- Helper: ¿el usuario actual es admin?
create or replace function is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Helper: ¿el usuario actual está activo? (REQ-07)
create or replace function is_active()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select coalesce((select active from public.profiles where id = auth.uid()), false);
$$;

-- Los usuarios pueden editar sus preferencias, pero NUNCA elevarse a admin ni
-- cambiar su propio estado. La service role (API admin) sí puede hacerlo.
create or replace function protect_profile_system_fields()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    if tg_op = 'INSERT' then
      new.is_admin := false;
      new.active := true;
    else
      new.id := old.id;
      new.is_admin := old.is_admin;
      new.active := old.active;
      new.created_at := old.created_at;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_system_fields_trigger on profiles;
create trigger protect_profile_system_fields_trigger
  before insert or update on profiles
  for each row execute function protect_profile_system_fields();

-- profiles: cada quien ve su fila y la actualiza solo mientras esté activo.
-- Los admins activos pueden leer todas para la consola de usuarios.
drop policy if exists "own profile select" on profiles;
drop policy if exists "own profile upsert" on profiles;
drop policy if exists "own profile update" on profiles;
create policy "own profile select" on profiles
  for select using (id = auth.uid() or (is_admin() and is_active()));
create policy "own profile upsert" on profiles
  for insert with check (id = auth.uid());
create policy "own profile update" on profiles
  for update
  using (id = auth.uid() and is_active())
  with check (id = auth.uid() and is_active());

-- day_log / weight_log: lectura propia; escritura solo si el usuario está activo.
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

drop policy if exists "read own plan_cycles" on plan_cycles;
drop policy if exists "write own plan_cycles" on plan_cycles;
create policy "read own plan_cycles" on plan_cycles
  for select using (user_id = auth.uid());
create policy "write own plan_cycles" on plan_cycles
  for all using (user_id = auth.uid() and is_active())
  with check (user_id = auth.uid() and is_active());

-- Fotos privadas. La primera carpeta del objeto debe ser el UUID del usuario.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('progress-photos','progress-photos',false,20971520,array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict (id) do update set
  public=false,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "read own progress photos" on storage.objects;
drop policy if exists "insert own progress photos" on storage.objects;
drop policy if exists "update own progress photos" on storage.objects;
drop policy if exists "delete own progress photos" on storage.objects;
create policy "read own progress photos" on storage.objects for select to authenticated
  using (bucket_id='progress-photos' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "insert own progress photos" on storage.objects for insert to authenticated
  with check (bucket_id='progress-photos' and (storage.foldername(name))[1]=auth.uid()::text and public.is_active());
create policy "update own progress photos" on storage.objects for update to authenticated
  using (bucket_id='progress-photos' and (storage.foldername(name))[1]=auth.uid()::text and public.is_active())
  with check (bucket_id='progress-photos' and (storage.foldername(name))[1]=auth.uid()::text and public.is_active());
create policy "delete own progress photos" on storage.objects for delete to authenticated
  using (bucket_id='progress-photos' and (storage.foldername(name))[1]=auth.uid()::text and public.is_active());

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
    -- escritura (insert/update/delete): solo admin Y activo
    execute format($p$create policy "admin write %s" on %I for all to authenticated using (is_admin() and is_active()) with check (is_admin() and is_active())$p$, t, t);
  end loop;
end $$;
