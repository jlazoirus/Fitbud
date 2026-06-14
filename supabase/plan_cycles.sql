-- ============================================================
-- Fitbud — ciclos sucesivos de 10 semanas + fotos de progreso
-- Idempotente. Ejecuta después de supabase/auth.sql.
-- ============================================================

-- Separa la semana 1..10 de cada ciclo sin perder los registros existentes.
alter table weight_log add column if not exists cycle_start date;
update weight_log set cycle_start = '2026-06-13' where cycle_start is null;
alter table weight_log alter column cycle_start set not null;
alter table weight_log alter column cycle_start set default '2026-06-13';
alter table weight_log drop constraint if exists weight_log_pkey;
alter table weight_log add primary key (user_id, cycle_start, week);

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

alter table plan_cycles enable row level security;

drop policy if exists "read own plan_cycles" on plan_cycles;
drop policy if exists "write own plan_cycles" on plan_cycles;
create policy "read own plan_cycles" on plan_cycles
  for select using (user_id = auth.uid());
create policy "write own plan_cycles" on plan_cycles
  for all using (user_id = auth.uid() and is_active())
  with check (user_id = auth.uid() and is_active());

-- Bucket privado: cada objeto vive bajo <user_id>/cycle-N/.
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
