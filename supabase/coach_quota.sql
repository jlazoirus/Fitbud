-- ============================================================
-- Fitbud - cuotas y reutilizacion del coach (REQ-32)
-- Idempotente. Ejecuta despues de supabase/privacy.sql.
-- No se aplica automaticamente en produccion.
-- ============================================================

create table if not exists coach_quota_policies (
  id                bigint generated always as identity primary key,
  action            text not null check (action in (
    'diet_day',
    'diet_week',
    'meal_option',
    'meal_estimate',
    'macro_review',
    'training_plan',
    'training_replacement'
  )),
  entitlement_code  text not null default 'default',
  daily_limit       int not null check (daily_limit >= 0),
  enabled           boolean not null default true,
  updated_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (action, entitlement_code)
);

insert into coach_quota_policies (action, entitlement_code, daily_limit)
values
  ('diet_day', 'default', 3),
  ('diet_week', 'default', 1),
  ('meal_option', 'default', 4),
  ('meal_estimate', 'default', 8),
  ('macro_review', 'default', 4),
  ('training_plan', 'default', 1),
  ('training_replacement', 'default', 3)
on conflict (action, entitlement_code) do nothing;

create table if not exists coach_quota_overrides (
  user_id            uuid not null references auth.users(id) on delete cascade,
  action             text not null check (action in (
    'diet_day',
    'diet_week',
    'meal_option',
    'meal_estimate',
    'macro_review',
    'training_plan',
    'training_replacement'
  )),
  entitlement_code   text,
  daily_limit        int check (daily_limit is null or daily_limit >= 0),
  bonus_units        int not null default 0 check (bonus_units >= 0),
  enabled            boolean,
  expires_at         timestamptz,
  updated_by         uuid references auth.users(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  primary key (user_id, action)
);

create table if not exists coach_usage (
  id                 bigint generated always as identity primary key,
  user_id            uuid not null references auth.users(id) on delete cascade,
  action             text not null,
  request_id         uuid not null,
  entitlement_code   text not null default 'default',
  quota_date         date not null,
  timezone           text not null default 'UTC',
  status             text not null check (status in ('reserved','completed','refunded','reused')),
  origin             text not null check (origin in ('fresh','user_pool','template')),
  result_id          bigint,
  provider_calls     int not null default 0 check (provider_calls >= 0),
  input_tokens       int not null default 0 check (input_tokens >= 0),
  output_tokens      int not null default 0 check (output_tokens >= 0),
  error_code         text,
  metadata           jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  completed_at       timestamptz,
  refunded_at        timestamptz,
  unique (user_id, action, request_id)
);

create index if not exists coach_usage_quota_idx
  on coach_usage (user_id, action, quota_date, status, origin);
create index if not exists coach_usage_admin_idx
  on coach_usage (created_at desc, action, status);

create table if not exists coach_option_pool (
  id                 bigint generated always as identity primary key,
  user_id            uuid not null references auth.users(id) on delete cascade,
  action             text not null,
  context_key        text not null,
  content_hash       text not null,
  response_text      text not null,
  status             text not null default 'active' check (status in ('active','invalid')),
  metadata           jsonb not null default '{}'::jsonb,
  generated_usage_id bigint references coach_usage(id) on delete set null,
  shown_count        int not null default 0 check (shown_count >= 0),
  first_shown_at     timestamptz,
  last_shown_at      timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (user_id, action, context_key, content_hash)
);

alter table coach_usage drop constraint if exists coach_usage_result_id_fkey;
alter table coach_usage add constraint coach_usage_result_id_fkey
  foreign key (result_id) references coach_option_pool(id) on delete set null;

create index if not exists coach_option_pool_pick_idx
  on coach_option_pool (user_id, action, context_key, status, shown_count, last_shown_at);

create table if not exists coach_generation_parts (
  id             bigint generated always as identity primary key,
  usage_id       bigint not null references coach_usage(id) on delete cascade,
  part_key       text not null,
  status         text not null default 'processing' check (status in ('processing','completed','failed')),
  response_text  text,
  result_id      bigint references coach_option_pool(id) on delete set null,
  error_code     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  completed_at   timestamptz,
  unique (usage_id, part_key)
);

create table if not exists coach_option_impressions (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  usage_id    bigint not null references coach_usage(id) on delete cascade,
  result_id   bigint references coach_option_pool(id) on delete cascade,
  action      text not null,
  context_key text not null,
  origin      text not null check (origin in ('fresh','user_pool','template')),
  shown_at    timestamptz not null default now()
);

create index if not exists coach_option_impressions_pick_idx
  on coach_option_impressions (user_id, action, context_key, shown_at desc);

alter table coach_quota_policies enable row level security;
alter table coach_quota_overrides enable row level security;
alter table coach_usage enable row level security;
alter table coach_option_pool enable row level security;
alter table coach_generation_parts enable row level security;
alter table coach_option_impressions enable row level security;

-- Estas tablas son exclusivamente server-side. La service role omite RLS.
revoke all on coach_quota_policies from anon, authenticated;
revoke all on coach_quota_overrides from anon, authenticated;
revoke all on coach_usage from anon, authenticated;
revoke all on coach_option_pool from anon, authenticated;
revoke all on coach_generation_parts from anon, authenticated;
revoke all on coach_option_impressions from anon, authenticated;
grant all on coach_quota_policies to service_role;
grant all on coach_quota_overrides to service_role;
grant all on coach_usage to service_role;
grant all on coach_option_pool to service_role;
grant all on coach_generation_parts to service_role;
grant all on coach_option_impressions to service_role;
grant usage, select on sequence coach_quota_policies_id_seq to service_role;
grant usage, select on sequence coach_usage_id_seq to service_role;
grant usage, select on sequence coach_option_pool_id_seq to service_role;
grant usage, select on sequence coach_generation_parts_id_seq to service_role;
grant usage, select on sequence coach_option_impressions_id_seq to service_role;

create or replace function reserve_coach_action(
  p_user_id uuid,
  p_action text,
  p_request_id uuid
)
returns table (
  usage_id bigint,
  mode text,
  usage_status text,
  effective_limit int,
  quota_day date,
  policy_enabled boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing coach_usage%rowtype;
  v_profile record;
  v_override coach_quota_overrides%rowtype;
  v_policy coach_quota_policies%rowtype;
  v_timezone text := 'UTC';
  v_entitlement text := 'default';
  v_limit int := 0;
  v_enabled boolean := false;
  v_quota_day date;
  v_consumed int := 0;
  v_usage_id bigint;
begin
  select active, prefs into v_profile
  from profiles
  where id = p_user_id;

  if not found or v_profile.active is false then
    raise exception 'inactive_user';
  end if;

  v_timezone := coalesce(nullif(v_profile.prefs->>'timeZone',''), 'UTC');
  if not exists (select 1 from pg_timezone_names where name = v_timezone) then
    v_timezone := 'UTC';
  end if;
  v_quota_day := (now() at time zone v_timezone)::date;

  select * into v_override
  from coach_quota_overrides
  where user_id = p_user_id
    and action = p_action
    and (expires_at is null or expires_at > now());

  if found and nullif(v_override.entitlement_code,'') is not null then
    v_entitlement := v_override.entitlement_code;
  end if;

  select * into v_policy
  from coach_quota_policies
  where action = p_action
    and entitlement_code in (v_entitlement, 'default')
  order by (entitlement_code = v_entitlement) desc
  limit 1;

  if not found then
    raise exception 'unknown_quota_action';
  end if;

  if v_override.user_id is not null then
    v_limit := coalesce(v_override.daily_limit, v_policy.daily_limit) + v_override.bonus_units;
    v_enabled := coalesce(v_override.enabled, v_policy.enabled);
  else
    v_limit := v_policy.daily_limit;
    v_enabled := v_policy.enabled;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(
    p_user_id::text || ':' || p_action || ':' || v_quota_day::text,
    0
  ));

  select * into v_existing
  from coach_usage
  where user_id = p_user_id
    and action = p_action
    and request_id = p_request_id;

  if found then
    return query select
      v_existing.id,
      case
        when v_existing.status = 'refunded' then 'refunded'
        when v_existing.origin = 'fresh' then 'fresh'
        else 'reuse'
      end,
      v_existing.status,
      v_limit,
      v_existing.quota_date,
      v_enabled;
    return;
  end if;

  select count(*)::int into v_consumed
  from coach_usage
  where user_id = p_user_id
    and action = p_action
    and quota_date = v_quota_day
    and origin = 'fresh'
    and status in ('reserved','completed');

  insert into coach_usage (
    user_id, action, request_id, entitlement_code, quota_date, timezone,
    status, origin
  )
  values (
    p_user_id, p_action, p_request_id, v_entitlement, v_quota_day, v_timezone,
    case when v_enabled and v_consumed < v_limit then 'reserved' else 'reused' end,
    case when v_enabled and v_consumed < v_limit then 'fresh' else 'user_pool' end
  )
  returning id into v_usage_id;

  return query select
    v_usage_id,
    case when v_enabled and v_consumed < v_limit then 'fresh' else 'reuse' end,
    case when v_enabled and v_consumed < v_limit then 'reserved' else 'reused' end,
    v_limit,
    v_quota_day,
    v_enabled;
end;
$$;

create or replace function claim_coach_generation_part(
  p_usage_id bigint,
  p_part_key text
)
returns table (
  claimed boolean,
  part_status text,
  response_text text,
  result_id bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted bigint;
  v_part coach_generation_parts%rowtype;
begin
  insert into coach_generation_parts (usage_id, part_key)
  values (p_usage_id, p_part_key)
  on conflict (usage_id, part_key) do nothing
  returning id into v_inserted;

  select * into v_part
  from coach_generation_parts
  where usage_id = p_usage_id and part_key = p_part_key;

  return query select
    v_inserted is not null,
    v_part.status,
    v_part.response_text,
    v_part.result_id;
end;
$$;

create or replace function complete_fresh_coach_part(
  p_usage_id bigint,
  p_part_key text,
  p_context_key text,
  p_response_text text,
  p_metadata jsonb default '{}'::jsonb,
  p_input_tokens int default 0,
  p_output_tokens int default 0
)
returns table (stored_result_id bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usage coach_usage%rowtype;
  v_result_id bigint;
begin
  select * into v_usage from coach_usage where id = p_usage_id for update;
  if not found or v_usage.origin <> 'fresh' or v_usage.status = 'refunded' then
    raise exception 'fresh_usage_required';
  end if;

  insert into coach_option_pool (
    user_id, action, context_key, content_hash, response_text, metadata,
    generated_usage_id, shown_count, first_shown_at, last_shown_at
  )
  values (
    v_usage.user_id, v_usage.action, p_context_key, md5(p_response_text),
    p_response_text, coalesce(p_metadata,'{}'::jsonb), p_usage_id, 1, now(), now()
  )
  on conflict (user_id, action, context_key, content_hash)
  do update set
    response_text = excluded.response_text,
    metadata = excluded.metadata,
    status = 'active',
    shown_count = coach_option_pool.shown_count + 1,
    first_shown_at = coalesce(coach_option_pool.first_shown_at, now()),
    last_shown_at = now(),
    updated_at = now()
  returning id into v_result_id;

  update coach_generation_parts
  set status = 'completed',
      response_text = p_response_text,
      result_id = v_result_id,
      error_code = null,
      completed_at = now(),
      updated_at = now()
  where usage_id = p_usage_id and part_key = p_part_key;

  update coach_usage
  set status = 'completed',
      result_id = v_result_id,
      provider_calls = provider_calls + 1,
      input_tokens = input_tokens + greatest(coalesce(p_input_tokens,0),0),
      output_tokens = output_tokens + greatest(coalesce(p_output_tokens,0),0),
      completed_at = coalesce(completed_at, now()),
      updated_at = now()
  where id = p_usage_id;

  insert into coach_option_impressions (
    user_id, usage_id, result_id, action, context_key, origin
  )
  values (
    v_usage.user_id, p_usage_id, v_result_id, v_usage.action, p_context_key, 'fresh'
  );

  return query select v_result_id;
end;
$$;

drop function if exists fail_coach_generation_part(bigint,text,text);
create or replace function fail_coach_generation_part(
  p_usage_id bigint,
  p_part_key text,
  p_error_code text,
  p_provider_called boolean default false,
  p_input_tokens int default 0,
  p_output_tokens int default 0
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_completed int;
begin
  update coach_generation_parts
  set status = 'failed',
      error_code = left(coalesce(p_error_code,'generation_failed'),120),
      updated_at = now()
  where usage_id = p_usage_id and part_key = p_part_key;

  select count(*)::int into v_completed
  from coach_generation_parts
  where usage_id = p_usage_id and status = 'completed';

  if v_completed = 0 then
    update coach_usage
    set status = 'refunded',
        error_code = left(coalesce(p_error_code,'generation_failed'),120),
        provider_calls = provider_calls + case when p_provider_called then 1 else 0 end,
        input_tokens = input_tokens + greatest(coalesce(p_input_tokens,0),0),
        output_tokens = output_tokens + greatest(coalesce(p_output_tokens,0),0),
        refunded_at = now(),
        updated_at = now()
    where id = p_usage_id and origin = 'fresh';
    return true;
  end if;

  update coach_usage
  set error_code = left(coalesce(p_error_code,'partial_generation_failed'),120),
      provider_calls = provider_calls + case when p_provider_called then 1 else 0 end,
      input_tokens = input_tokens + greatest(coalesce(p_input_tokens,0),0),
      output_tokens = output_tokens + greatest(coalesce(p_output_tokens,0),0),
      updated_at = now()
  where id = p_usage_id;
  return false;
end;
$$;

create or replace function select_reusable_coach_part(
  p_usage_id bigint,
  p_part_key text,
  p_context_key text,
  p_fallback_text text,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  selected_text text,
  selected_result_id bigint,
  selected_origin text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usage coach_usage%rowtype;
  v_existing coach_generation_parts%rowtype;
  v_candidate coach_option_pool%rowtype;
  v_last_result bigint;
  v_pool_count int := 0;
begin
  select * into v_usage from coach_usage where id = p_usage_id for update;
  if not found or v_usage.origin = 'fresh' then
    raise exception 'reused_usage_required';
  end if;

  select * into v_existing
  from coach_generation_parts
  where usage_id = p_usage_id and part_key = p_part_key;
  if found and v_existing.status = 'completed' and v_existing.response_text is not null then
    return query select
      v_existing.response_text,
      v_existing.result_id,
      case when v_existing.result_id is null then 'template' else 'user_pool' end;
    return;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(
    v_usage.user_id::text || ':' || v_usage.action || ':' || p_context_key,
    0
  ));

  select result_id into v_last_result
  from coach_option_impressions
  where user_id = v_usage.user_id
    and action = v_usage.action
    and context_key = p_context_key
    and result_id is not null
  order by shown_at desc
  limit 1;

  select count(*)::int into v_pool_count
  from coach_option_pool
  where user_id = v_usage.user_id
    and action = v_usage.action
    and context_key = p_context_key
    and status = 'active';

  select * into v_candidate
  from coach_option_pool
  where user_id = v_usage.user_id
    and action = v_usage.action
    and context_key = p_context_key
    and status = 'active'
    and (v_pool_count <= 1 or id is distinct from v_last_result)
  order by (shown_count = 0) desc, last_shown_at asc nulls first, shown_count asc, created_at asc
  limit 1
  for update;

  if found then
    update coach_option_pool
    set shown_count = shown_count + 1,
        first_shown_at = coalesce(first_shown_at, now()),
        last_shown_at = now(),
        updated_at = now()
    where id = v_candidate.id;

    update coach_generation_parts
    set status = 'completed',
        response_text = v_candidate.response_text,
        result_id = v_candidate.id,
        completed_at = now(),
        updated_at = now()
    where usage_id = p_usage_id and part_key = p_part_key;

    update coach_usage
    set status = 'reused',
        origin = 'user_pool',
        result_id = v_candidate.id,
        completed_at = coalesce(completed_at, now()),
        metadata = metadata || coalesce(p_metadata,'{}'::jsonb),
        updated_at = now()
    where id = p_usage_id;

    insert into coach_option_impressions (
      user_id, usage_id, result_id, action, context_key, origin
    )
    values (
      v_usage.user_id, p_usage_id, v_candidate.id, v_usage.action, p_context_key, 'user_pool'
    );

    return query select v_candidate.response_text, v_candidate.id, 'user_pool'::text;
    return;
  end if;

  if nullif(p_fallback_text,'') is null then
    raise exception 'compatible_fallback_required';
  end if;

  update coach_generation_parts
  set status = 'completed',
      response_text = p_fallback_text,
      result_id = null,
      completed_at = now(),
      updated_at = now()
  where usage_id = p_usage_id and part_key = p_part_key;

  update coach_usage
  set status = 'reused',
      origin = 'template',
      result_id = null,
      completed_at = coalesce(completed_at, now()),
      metadata = metadata || coalesce(p_metadata,'{}'::jsonb),
      updated_at = now()
  where id = p_usage_id;

  insert into coach_option_impressions (
    user_id, usage_id, result_id, action, context_key, origin
  )
  values (
    v_usage.user_id, p_usage_id, null, v_usage.action, p_context_key, 'template'
  );

  return query select p_fallback_text, null::bigint, 'template'::text;
end;
$$;

create or replace function admin_reset_coach_quota(
  p_user_id uuid,
  p_action text
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_timezone text := 'UTC';
  v_quota_day date;
  v_count int := 0;
begin
  select coalesce(nullif(prefs->>'timeZone',''),'UTC') into v_timezone
  from profiles where id = p_user_id;
  if not exists (select 1 from pg_timezone_names where name = v_timezone) then
    v_timezone := 'UTC';
  end if;
  v_quota_day := (now() at time zone v_timezone)::date;

  update coach_usage
  set status = 'refunded',
      error_code = 'admin_reset',
      refunded_at = now(),
      updated_at = now()
  where user_id = p_user_id
    and action = p_action
    and quota_date = v_quota_day
    and origin = 'fresh'
    and status in ('reserved','completed');
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function reserve_coach_action(uuid,text,uuid) from public, anon, authenticated;
revoke all on function claim_coach_generation_part(bigint,text) from public, anon, authenticated;
revoke all on function complete_fresh_coach_part(bigint,text,text,text,jsonb,int,int) from public, anon, authenticated;
revoke all on function fail_coach_generation_part(bigint,text,text,boolean,int,int) from public, anon, authenticated;
revoke all on function select_reusable_coach_part(bigint,text,text,text,jsonb) from public, anon, authenticated;
revoke all on function admin_reset_coach_quota(uuid,text) from public, anon, authenticated;

grant execute on function reserve_coach_action(uuid,text,uuid) to service_role;
grant execute on function claim_coach_generation_part(bigint,text) to service_role;
grant execute on function complete_fresh_coach_part(bigint,text,text,text,jsonb,int,int) to service_role;
grant execute on function fail_coach_generation_part(bigint,text,text,boolean,int,int) to service_role;
grant execute on function select_reusable_coach_part(bigint,text,text,text,jsonb) to service_role;
grant execute on function admin_reset_coach_quota(uuid,text) to service_role;

comment on table coach_quota_policies is
  'Politicas configurables por accion y entitlement; nunca se exponen al usuario normal.';
comment on table coach_usage is
  'Reserva idempotente por click intencional, con consumo fresco o reutilizado y ventana por zona horaria.';
comment on table coach_option_pool is
  'Pool privado por usuario y contexto compatible; no comparte resultados personales.';

-- Recuperacion: para desactivar el control sin borrar auditoria, poner
-- enabled=false en coach_quota_policies. Para rollback completo, detener
-- primero /api/claude y luego eliminar funciones y tablas en orden inverso.
