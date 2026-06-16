-- REQ-25: Oferta, entitlement y paywall
-- Catálogo de planes server-side, entitlements por usuario y función de consulta.
-- Ejecutar después de coach_quota.sql.

-- Catálogo de planes (fuente de verdad server-side; precios no viven en index.html)
create table if not exists subscription_plans (
  id                text primary key,
  name              text not null,
  price_usd         numeric(10,2) not null,
  duration_days     int not null,
  auto_renew        boolean not null default false,
  active            boolean not null default true,
  badge             text,
  description       text,
  features          jsonb not null default '[]'::jsonb,
  catalog_version   text not null default '2026-06-16',
  created_at        timestamptz not null default now()
);

alter table subscription_plans enable row level security;
drop policy if exists "planes_select" on subscription_plans;
create policy "planes_select" on subscription_plans
  for select to authenticated using (true);

-- Entitlements por usuario
create table if not exists user_entitlements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  plan_id     text not null references subscription_plans(id),
  status      text not null check (status in ('active','expired','courtesy','revoked')),
  starts_at   timestamptz not null,
  expires_at  timestamptz not null,
  origin      text not null check (origin in ('checkout','admin_courtesy','admin_grant')),
  payment_ref text,
  notes       text,
  granted_by  uuid references auth.users,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table user_entitlements enable row level security;
drop policy if exists "entitlement_select_own" on user_entitlements;
create policy "entitlement_select_own" on user_entitlements
  for select to authenticated
  using (auth.uid() = user_id);

create index if not exists user_entitlements_user_id    on user_entitlements(user_id);
create index if not exists user_entitlements_active_idx on user_entitlements(user_id, expires_at)
  where status in ('active','courtesy');

-- Función: entitlement activo del usuario (llamada solo con service role)
create or replace function public.get_active_entitlement(p_user_id uuid)
returns table(
  id          uuid,
  plan_id     text,
  plan_name   text,
  status      text,
  starts_at   timestamptz,
  expires_at  timestamptz,
  origin      text,
  notes       text
)
language sql
security definer
set search_path = public
as $$
  select
    e.id,
    e.plan_id,
    p.name as plan_name,
    e.status,
    e.starts_at,
    e.expires_at,
    e.origin,
    e.notes
  from user_entitlements e
  join subscription_plans p on p.id = e.plan_id
  where e.user_id    = p_user_id
    and e.status     in ('active','courtesy')
    and e.expires_at > now()
  order by e.expires_at desc
  limit 1;
$$;

revoke execute on function public.get_active_entitlement from anon, authenticated;
grant  execute on function public.get_active_entitlement to   service_role;

-- Seed del catálogo (idempotente)
insert into subscription_plans
  (id, name, price_usd, duration_days, auto_renew, active, badge, description, features, catalog_version)
values
  ('monthly',
   'Plan mensual', 14.00, 30, false, true, null,
   'Acceso completo. Sin permanencia. Cancela cuando quieras.',
   '["Plan de nutrición personalizado","Rutinas de entrenamiento guiadas","Seguimiento de progreso","Adaptaciones y contingencias","Rachas e hitos de constancia","Recordatorios opcionales"]'::jsonb,
   '2026-06-16'),
  ('quarterly',
   'Paquete 3 meses', 36.00, 90, false, true, 'Mejor valor',
   'Ahorra un 15 % respecto al plan mensual. Ideal para un ciclo completo.',
   '["Todo lo del plan mensual","Ahorro del 15 %","Acceso a ciclos de 10 semanas","Recap detallado al cerrar ciclo","Fotos de progreso privadas","Prioridad en nuevas funciones"]'::jsonb,
   '2026-06-16')
on conflict (id) do update set
  name            = excluded.name,
  price_usd       = excluded.price_usd,
  duration_days   = excluded.duration_days,
  auto_renew      = excluded.auto_renew,
  active          = excluded.active,
  badge           = excluded.badge,
  description     = excluded.description,
  features        = excluded.features,
  catalog_version = excluded.catalog_version;
