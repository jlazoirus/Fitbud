-- REQ-317. Aplicación MANUAL tras coupon_codes.sql y notifications.sql.
-- Activación: 9 noviembre 2026, 09:00 America/Lima. No envía correos al migrar.
alter table public.redemption_codes add column if not exists referral_owner uuid references auth.users on delete cascade;
alter table public.redemption_codes add column if not exists referral_slot smallint;
create unique index if not exists referral_owner_slot on public.redemption_codes(referral_owner, referral_slot);
create table if not exists public.referral_members (
  user_id uuid primary key references auth.users on delete cascade,
  enrolled_at timestamptz not null default now()
);
alter table public.referral_members enable row level security;
revoke all on public.referral_members from anon,authenticated;
-- Las tablas existentes ya tienen RLS; no se conceden permisos nuevos al cliente.

create or replace function public.referral_dashboard(p_user_id uuid, p_generate boolean default false)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_code text;
  v_slot int;
  v_rows jsonb;
begin
  -- También serializa la generación concurrente desde dos dispositivos.
  perform 1 from public.profiles p where p.id=p_user_id and p.active is true
    and p.created_at <= '2026-11-09 14:00:00+00'::timestamptz for update;
  if not found or now() < '2026-11-09 14:00:00+00'::timestamptz then
    return jsonb_build_object('eligible',false);
  end if;
  if not exists(select 1 from public.referral_members m where m.user_id=p_user_id) then
    -- Ventana fija de lanzamiento, no se pierde el beneficio al pasar una semana.
    if now() >= '2026-11-16 14:00:00+00'::timestamptz or not exists (
      select 1 from public.product_events ev where ev.user_id=p_user_id
      and ev.event_type='session_start' and nullif(ev.session_id,'') is not null
      and ev.created_at >= '2026-11-02 14:00:00+00'::timestamptz
      and ev.created_at <= '2026-11-09 14:00:00+00'::timestamptz
      group by ev.user_id having count(distinct ev.session_id) >= 2
    ) then return jsonb_build_object('eligible',false); end if;
    insert into public.referral_members(user_id) values(p_user_id) on conflict do nothing;
  end if;
  if p_generate then
    select count(*)+1 into v_slot from public.redemption_codes c where c.referral_owner=p_user_id;
    if v_slot > 3 then raise exception 'Ya generaste tus 3 invitaciones.'; end if;
    loop
      v_code := upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
      v_code := 'FIT-' || substr(v_code,1,4) || '-' || substr(v_code,5,4);
      begin
        insert into public.redemption_codes(code,plan_id,duration_days,created_by,referral_owner,referral_slot)
          values(v_code,'quarterly',90,p_user_id,p_user_id,v_slot);
        exit;
      exception when unique_violation then null;
      end;
    end loop;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('code',c.code,'successful',c.redeemed_by is not null,
    'redeemed_at',c.redeemed_at) order by c.referral_slot),'[]'::jsonb)
    into v_rows from public.redemption_codes c where c.referral_owner=p_user_id;
  return jsonb_build_object('eligible',true,'invitations',v_rows,'limit',3);
end;
$$;
revoke all on function public.referral_dashboard(uuid,boolean) from public,anon,authenticated;
grant execute on function public.referral_dashboard(uuid,boolean) to service_role;

create or replace function public.reward_referral()
returns trigger language plpgsql security definer set search_path=public as $$
declare
  v_ent public.user_entitlements%rowtype;
  v_friend public.user_entitlements%rowtype;
  v_created timestamptz;
  v_marker text;
begin
  if new.referral_owner is null or old.redeemed_by is not null or new.redeemed_by is null then return new; end if;
  if now() < '2026-11-09 14:00:00+00'::timestamptz or new.redeemed_by=new.referral_owner then
    raise exception 'Invitación no disponible.';
  end if;
  -- Solo altas NUEVAS creadas por invite-signup. app_metadata no es editable por el cliente.
  select u.created_at,u.raw_app_meta_data->>'referral_code' into v_created,v_marker
    from auth.users u where u.id=new.redeemed_by;
  if v_created < new.created_at or v_marker is distinct from new.code then
    raise exception 'Esta invitación es para una cuenta nueva. Compártela con un amigo.';
  end if;
  perform 1 from public.profiles p where p.id=new.referral_owner and p.active is true for update;
  if not found then raise exception 'Invitación no disponible.'; end if;
  -- El canje, los dos accesos y el registro de éxito son una sola transacción.
  select * into strict v_friend from public.user_entitlements e where e.id=new.entitlement_id for update;
  update public.user_entitlements set expires_at=v_friend.starts_at+interval '3 months',updated_at=now()
    where id=v_friend.id;
  select * into v_ent from public.user_entitlements e where e.user_id=new.referral_owner
    and e.status in ('active','courtesy') and e.expires_at>now() order by e.expires_at desc limit 1 for update;
  if found then
    update public.user_entitlements set expires_at=v_ent.expires_at+interval '3 months',updated_at=now() where id=v_ent.id;
  else
    insert into public.user_entitlements(user_id,plan_id,status,starts_at,expires_at,origin,notes)
      values(new.referral_owner,'quarterly','courtesy',now(),now()+interval '3 months','coupon','Beneficio por invitación exitosa');
  end if;
  return new;
end;
$$;
revoke all on function public.reward_referral() from public,anon,authenticated;
drop trigger if exists reward_referral on public.redemption_codes;
create trigger reward_referral after update of redeemed_by on public.redemption_codes
  for each row execute function public.reward_referral();
-- Recuperación: retirar el envío de campaña y el acceso al panel antes de
-- retirar el trigger. Conservar códigos canjeados y accesos otorgados.
