-- REQ-331..334: tienda web con Culqi y Libro de Reclamaciones virtual.
-- Idempotente. Ejecutar después de billing.sql. No toca la beta ni el catálogo
-- de la app: los precios de la tienda viven en tienda/planes.js.

-- Cobros de Culqi en la misma auditoría que Stripe. La columna stripe_event_id
-- guarda el id del cargo de Culqi (chr_...) cuando provider = 'culqi'.
alter table billing_events add column if not exists provider text not null default 'stripe';
create index if not exists billing_events_provider_idx on billing_events(provider, created_at desc);

-- Libro de Reclamaciones virtual (Código de Protección y Defensa del Consumidor,
-- Ley 29571, y su reglamento). Numeración correlativa y código por hoja.
create sequence if not exists libro_reclamaciones_numero_seq;

create table if not exists libro_reclamaciones (
  id                uuid primary key default gen_random_uuid(),
  numero            bigint not null unique default nextval('libro_reclamaciones_numero_seq'),
  codigo            text generated always as ('EVOLV-LR-' || lpad(numero::text, 6, '0')) stored,
  created_at        timestamptz not null default now(),
  tipo              text not null check (tipo in ('reclamo','queja')),
  nombre            text not null,
  tipo_documento    text not null check (tipo_documento in ('DNI','CE','Pasaporte','RUC')),
  numero_documento  text not null,
  domicilio         text,
  telefono          text,
  email             text,
  menor_edad        boolean not null default false,
  apoderado         text,
  bien_tipo         text not null default 'servicio' check (bien_tipo in ('servicio','producto')),
  bien_descripcion  text not null,
  monto_reclamado   numeric(10,2),
  detalle           text not null,
  pedido            text not null,
  estado            text not null default 'pendiente' check (estado in ('pendiente','respondido')),
  respuesta         text,
  respondido_en     timestamptz,
  copia_enviada     text,
  -- Al menos un medio para responder: no se exige correo y domicilio a la vez.
  constraint libro_reclamaciones_contacto check (
    coalesce(nullif(email, ''), nullif(telefono, ''), nullif(domicilio, '')) is not null
  )
);

-- Sin políticas RLS = solo service_role (api/_tienda/reclamaciones.js) lee y escribe.
alter table libro_reclamaciones enable row level security;

create index if not exists libro_reclamaciones_estado_idx on libro_reclamaciones(estado, created_at desc);
