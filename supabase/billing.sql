-- REQ-26: Checkout y ciclo de facturación
-- Tabla de auditoría de eventos de Stripe (idempotencia de webhooks).
-- Ejecutar después de entitlements.sql.

create table if not exists billing_events (
  id               uuid primary key default gen_random_uuid(),
  stripe_event_id  text unique not null,
  event_type       text not null,
  user_id          uuid references auth.users on delete set null,
  plan_id          text,
  entitlement_id   uuid references user_entitlements on delete set null,
  status           text not null check (status in ('processed','failed','skipped')),
  payload          jsonb,
  error            text,
  created_at       timestamptz not null default now()
);

-- Sin políticas RLS = solo service_role puede operar esta tabla.
alter table billing_events enable row level security;

create index if not exists billing_events_user_id_idx    on billing_events(user_id);
create index if not exists billing_events_event_type_idx on billing_events(event_type, created_at desc);
