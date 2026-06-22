-- ============================================================
-- Parche: añadir coach_conversation a las tablas de cuota
-- Ejecutar en Supabase SQL Editor si coach_quota.sql ya
-- fue aplicado antes de este fix.
-- Idempotente: se puede re-ejecutar sin efectos secundarios.
-- ============================================================

-- 1. Actualizar CHECK constraint en coach_quota_policies
do $$ declare v text; begin
  select conname into v from pg_constraint
  where conrelid = 'coach_quota_policies'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%diet_day%';
  if v is not null then
    execute 'alter table coach_quota_policies drop constraint ' || quote_ident(v);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'coach_quota_policies'::regclass
      and conname = 'coach_quota_policies_action_check'
  ) then
    alter table coach_quota_policies
      add constraint coach_quota_policies_action_check
      check (action in (
        'diet_day','diet_week','meal_option','meal_estimate',
        'macro_review','training_plan','training_replacement',
        'coach_conversation'
      ));
  end if;
end $$;

-- 2. Actualizar CHECK constraint en coach_quota_overrides
do $$ declare v text; begin
  select conname into v from pg_constraint
  where conrelid = 'coach_quota_overrides'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%diet_day%';
  if v is not null then
    execute 'alter table coach_quota_overrides drop constraint ' || quote_ident(v);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'coach_quota_overrides'::regclass
      and conname = 'coach_quota_overrides_action_check'
  ) then
    alter table coach_quota_overrides
      add constraint coach_quota_overrides_action_check
      check (action in (
        'diet_day','diet_week','meal_option','meal_estimate',
        'macro_review','training_plan','training_replacement',
        'coach_conversation'
      ));
  end if;
end $$;

-- 3. Insertar política de cuota para coach_conversation
insert into coach_quota_policies (action, entitlement_code, daily_limit)
values ('coach_conversation', 'default', 20)
on conflict (action, entitlement_code) do nothing;
