-- REQ-50: Cupones de acceso gratuito sin Stripe
-- Ejecutar después de entitlements.sql.

create table if not exists redemption_codes (
  code           text primary key,
  plan_id        text not null default 'monthly' references subscription_plans(id),
  duration_days  int not null default 28 check (duration_days between 1 and 365),
  created_by     uuid references auth.users,
  created_at     timestamptz not null default now(),
  valid_until    timestamptz,
  redeemed_by    uuid references auth.users,
  redeemed_at    timestamptz,
  entitlement_id uuid references user_entitlements(id) on delete set null
);

alter table redemption_codes enable row level security;

create index if not exists redemption_codes_created_at_idx on redemption_codes(created_at desc);
create index if not exists redemption_codes_redeemed_by_idx on redemption_codes(redeemed_by);

alter table user_entitlements drop constraint if exists user_entitlements_origin_check;
alter table user_entitlements add constraint user_entitlements_origin_check
  check (origin in ('checkout','admin_courtesy','admin_grant','coupon'));

create or replace function public.redeem_redemption_code(p_code text, p_user_id uuid)
returns table(
  id uuid,
  plan_id text,
  status text,
  starts_at timestamptz,
  expires_at timestamptz,
  origin text,
  duration_days int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '\s+', '', 'g'));
  v_code_row redemption_codes%rowtype;
  v_entitlement user_entitlements%rowtype;
  v_now timestamptz := now();
begin
  if p_user_id is null then
    raise exception 'Sesión requerida.';
  end if;

  select *
    into v_code_row
    from redemption_codes
   where code = v_code
   for update;

  if not found then
    raise exception 'Código no válido.';
  end if;

  if v_code_row.redeemed_by is not null then
    raise exception 'Este código ya fue utilizado.';
  end if;

  if v_code_row.valid_until is not null and v_code_row.valid_until < v_now then
    raise exception 'El código ha expirado.';
  end if;

  if exists (
    select 1
      from user_entitlements
     where user_id = p_user_id
       and status in ('active','courtesy')
       and expires_at > v_now
  ) then
    raise exception 'Ya tienes un plan activo.';
  end if;

  insert into user_entitlements (
    user_id,
    plan_id,
    status,
    starts_at,
    expires_at,
    origin,
    payment_ref,
    notes,
    granted_by
  )
  values (
    p_user_id,
    v_code_row.plan_id,
    'active',
    v_now,
    v_now + (v_code_row.duration_days * interval '1 day'),
    'coupon',
    null,
    'Cupón ' || v_code_row.code,
    null
  )
  returning * into v_entitlement;

  update redemption_codes
     set redeemed_by = p_user_id,
         redeemed_at = v_now,
         entitlement_id = v_entitlement.id
   where code = v_code_row.code;

  return query
    select
      v_entitlement.id,
      v_entitlement.plan_id,
      v_entitlement.status,
      v_entitlement.starts_at,
      v_entitlement.expires_at,
      v_entitlement.origin,
      v_code_row.duration_days;
end;
$$;

revoke execute on function public.redeem_redemption_code(text, uuid) from anon, authenticated;
grant execute on function public.redeem_redemption_code(text, uuid) to service_role;
