-- REQ-355: suscripción mensual con 7 días gratis, cobrada por Culqi
-- (suscripciones recurrentes). Diseño: docs/web-publica-y-suscripcion.md §3.
-- Dependencias: entitlements.sql, billing.sql y tienda_culqi.sql.
-- Idempotente; aplicar a mano en Supabase → SQL Editor:
--   psql $DATABASE_URL -f supabase/suscripciones.sql
--
-- Mientras no se aplique, /api/suscripcion responde 503 y el webhook no
-- registra nada (Culqi reintenta).
--
-- ROLLBACK:
--   DROP TABLE IF EXISTS subscription_charges;
--   DROP TABLE IF EXISTS subscriptions;

-- ── subscriptions ─────────────────────────────────────────────────────────────
-- Una fila por suscripción de Culqi. La escribe solo el servidor (service role):
-- la inscripción (api/_tienda/suscripcion.js), el webhook y la cancelación.
-- Cada persona lee la suya (REQ-357 la muestra en Perfil).
create table if not exists subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  -- set null, no cascade: el historial de cobros se conserva aunque se borre la
  -- cuenta (borrar la cuenta cancela antes la suscripción en Culqi: api/privacy.js).
  user_id                uuid references auth.users(id) on delete set null,
  email                  text not null,
  plan_id                text not null default 'monthly',
  status                 text not null default 'pending'
                         check (status in ('pending','trialing','active','past_due','canceled','ended')),
  con_prueba             boolean not null default false,
  culqi_customer_id      text not null,
  culqi_card_id          text not null,
  culqi_subscription_id  text not null unique,
  culqi_plan_id          text not null,
  card_brand             text,
  card_last4             text check (card_last4 is null or card_last4 ~ '^[0-9]{4}$'),
  card_bin               text check (card_bin is null or card_bin ~ '^[0-9]{6,8}$'),
  trial_ends_at          timestamptz,
  current_period_end     timestamptz,
  next_billing_at        timestamptz,
  cancel_requested_at    timestamptz,
  canceled_at            timestamptz,
  last_event_at          timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

alter table subscriptions enable row level security;
drop policy if exists "subscriptions_select_own" on subscriptions;
create policy "subscriptions_select_own" on subscriptions
  for select to authenticated
  using (auth.uid() = user_id);

create index if not exists subscriptions_user_idx  on subscriptions(user_id, created_at desc);
create index if not exists subscriptions_email_idx on subscriptions(lower(email));
-- Una sola suscripción viva por cuenta y por correo.
create unique index if not exists subscriptions_one_live_per_user_idx
  on subscriptions(user_id) where user_id is not null and status in ('pending','trialing','active','past_due');
create unique index if not exists subscriptions_one_live_per_email_idx
  on subscriptions(lower(email)) where status in ('pending','trialing','active','past_due');

-- ── subscription_charges ────────────────────────────────────────────────────────
-- Un cobro mensual = una fila. La clave primaria hace idempotente el webhook:
-- si Culqi reenvía el mismo cobro, el insert no entra y no se suman días dos veces.
create table if not exists subscription_charges (
  charge_ref       text primary key,          -- id del cargo (chr_…) o, sin él, del evento (evt_…)
  subscription_id  uuid not null references subscriptions(id) on delete cascade,
  event_id         text not null,
  entitlement_id   uuid references user_entitlements(id) on delete set null,
  amount           integer,
  currency         text,
  created_at       timestamptz not null default now()
);

-- Sin políticas RLS = solo service_role.
alter table subscription_charges enable row level security;
create index if not exists subscription_charges_sub_idx on subscription_charges(subscription_id, created_at desc);
