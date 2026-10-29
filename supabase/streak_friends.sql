-- REQ-300: rachas entre amigos. Ejecutar DESPUÉS de auth.sql.
-- Idempotente. No altera las políticas de profiles/day_log ni los avisos.
-- Rollback: revocar EXECUTE de streak_social y ocultar los controles del cliente;
-- conservar estas tablas permite recuperar amistades al restaurar la función.
begin;

create table if not exists public.streak_social_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  alias text not null check (char_length(alias) between 2 and 24),
  enabled boolean not null default false,
  streak_count integer not null default 0 check (streak_count between 0 and 36600),
  streak_through date,
  timezone text not null default 'UTC',
  updated_at timestamptz not null default now()
);
create table if not exists public.streak_friendships (
  user_low uuid not null references public.streak_social_profiles(user_id) on delete cascade,
  user_high uuid not null references public.streak_social_profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_low,user_high),
  check (user_low < user_high)
);
create index if not exists streak_friendships_high on public.streak_friendships(user_high);
create table if not exists public.streak_friend_invites (
  token text primary key,
  owner_id uuid not null references public.streak_social_profiles(user_id) on delete cascade,
  expires_at timestamptz not null default now()+interval '7 days',
  accepted_by uuid references auth.users(id) on delete cascade,
  unique (owner_id)
);
alter table public.streak_social_profiles enable row level security;
alter table public.streak_friendships enable row level security;
alter table public.streak_friend_invites enable row level security;
-- Sin acceso directo, incluso para su dueño: todas las acciones pasan por
-- una RPC que autoriza con auth.uid() y proyecta solamente alias/racha.
revoke all on public.streak_social_profiles, public.streak_friendships, public.streak_friend_invites from public, anon, authenticated;

create or replace function public.streak_social(p_action text default 'state', p_data jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  me uuid := auth.uid();
  mine public.streak_social_profiles%rowtype;
  inv public.streak_friend_invites%rowtype;
  friend uuid;
  alias_value text;
  tz text;
  local_today date;
  count_value integer;
  through_value date;
  result_rows jsonb;
begin
  if me is null or not exists (select 1 from public.profiles where id=me and active=true) then
    raise exception 'Sesión no disponible' using errcode='42501';
  end if;
  -- Serializa acciones de cada cuenta (desactivar/actualizar/crear enlace).
  perform pg_advisory_xact_lock(hashtextextended(me::text,300));
  select * into mine from public.streak_social_profiles where user_id=me;

  if p_action='enable' then
    alias_value := btrim(p_data->>'alias');
    if alias_value is null or char_length(alias_value) not between 2 and 24 or alias_value ~ '[[:cntrl:]]' then
      raise exception 'Elige un alias de 2 a 24 caracteres';
    end if;
    insert into public.streak_social_profiles(user_id,alias,enabled) values(me,alias_value,true)
      on conflict (user_id) do update set alias=excluded.alias,enabled=true;
    return jsonb_build_object('ok',true);
  elsif p_action='disable' then
    update public.streak_social_profiles set enabled=false,streak_count=0,streak_through=null where user_id=me;
    delete from public.streak_friendships where user_low=me or user_high=me;
    delete from public.streak_friend_invites where owner_id=me or accepted_by=me;
    return jsonb_build_object('ok',true);
  elsif p_action='preview' then
    select * into inv from public.streak_friend_invites where token=p_data->>'token' and expires_at>now();
    if inv.owner_id is null or inv.owner_id=me or (inv.accepted_by is not null and inv.accepted_by<>me)
      or not exists(select 1 from public.streak_social_profiles where user_id=inv.owner_id and enabled) then
      raise exception 'Invitación no disponible';
    end if;
    -- El enlace autoriza ver el alias de quien invita, nunca su racha/datos.
    return (select jsonb_build_object('alias',alias,'expiresAt',inv.expires_at) from public.streak_social_profiles where user_id=inv.owner_id);
  elsif p_action='state' then
    if mine.user_id is null or not mine.enabled then
      return jsonb_build_object('enabled',false,'alias',coalesce(mine.alias,''),'rows','[]'::jsonb);
    end if;
  else
    if mine.user_id is null or not mine.enabled then raise exception 'Activa la comparación primero'; end if;
    if p_action='sync' then
      tz := p_data->>'timezone';
      if tz is null or not exists(select 1 from pg_timezone_names where name=tz) then raise exception 'Zona horaria no válida'; end if;
      local_today := (now() at time zone tz)::date;
      count_value := (p_data->>'count')::integer;
      through_value := (p_data->>'through')::date;
      if count_value is null or count_value not between 0 and 36600
        or (count_value>0 and (through_value is null or through_value not between local_today-1 and local_today))
        or (count_value=0 and through_value is not null) then raise exception 'Racha no válida'; end if;
      update public.streak_social_profiles set streak_count=count_value,streak_through=through_value,timezone=tz,updated_at=now() where user_id=me;
      return jsonb_build_object('ok',true);
    elsif p_action='invite' then
      -- Un solo enlace vigente por persona. Nueva invitación revoca la anterior.
      delete from public.streak_friend_invites where owner_id=me;
      insert into public.streak_friend_invites(token,owner_id)
        values(replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-',''),me) returning * into inv;
      return jsonb_build_object('token',inv.token,'expiresAt',inv.expires_at);
    elsif p_action='revoke' then
      delete from public.streak_friend_invites where owner_id=me;
      return jsonb_build_object('ok',true);
    elsif p_action='accept' then
      select * into inv from public.streak_friend_invites where token=p_data->>'token' for update;
      if inv.owner_id is null or inv.owner_id=me or inv.expires_at<=now()
        or (inv.accepted_by is not null and inv.accepted_by<>me) then raise exception 'Invitación no disponible'; end if;
      -- Bloquear el perfil del emisor impide aceptar simultáneamente a su baja.
      perform 1 from public.streak_social_profiles where user_id=inv.owner_id and enabled for update;
      if not found then raise exception 'Invitación no disponible'; end if;
      insert into public.streak_friendships(user_low,user_high) values(least(me,inv.owner_id),greatest(me,inv.owner_id)) on conflict do nothing;
      update public.streak_friend_invites set accepted_by=me where token=inv.token;
      return jsonb_build_object('ok',true);
    elsif p_action='remove' then
      friend := (p_data->>'friend')::uuid;
      delete from public.streak_friendships where user_low=least(me,friend) and user_high=greatest(me,friend);
      -- Un enlace usado no puede resucitar una amistad eliminada.
      delete from public.streak_friend_invites where (owner_id=me and accepted_by=friend) or (owner_id=friend and accepted_by=me);
      return jsonb_build_object('ok',true);
    else raise exception 'Acción no válida';
    end if;
  end if;

  -- Solo yo + amistades aceptadas. Nunca se leen registros de salud aquí.
  with visible as (
    select s.user_id,s.alias,s.updated_at,
      case when s.streak_through between (now() at time zone s.timezone)::date-1 and (now() at time zone s.timezone)::date
        then s.streak_count else 0 end as days
    from public.streak_social_profiles s
    join public.profiles p on p.id=s.user_id and p.active=true
    where s.enabled and (s.user_id=me or exists(select 1 from public.streak_friendships f
      where f.user_low=least(me,s.user_id) and f.user_high=greatest(me,s.user_id)))
  ), ranked as (select *,rank() over(order by days desc) as position from visible)
  select coalesce(jsonb_agg(jsonb_build_object('id',user_id,'alias',alias,'days',days,'position',position,'self',user_id=me,'updatedAt',updated_at)
    order by days desc,lower(alias),user_id),'[]'::jsonb) into result_rows from ranked;
  return jsonb_build_object('enabled',true,'alias',mine.alias,'rows',result_rows);
end;
$$;
revoke all on function public.streak_social(text,jsonb) from public,anon;
grant execute on function public.streak_social(text,jsonb) to authenticated;
commit;
