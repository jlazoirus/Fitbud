-- ============================================================
-- Fitbud — semántica de catálogo nutricional (REQ-79)
-- ------------------------------------------------------------
-- Ejecutar después de supabase/seed.sql y antes de generar planes
-- nutricionales versionados. No re-seedea ni borra datos.
-- ============================================================

alter table ingredients add column if not exists slug text;

alter table dishes add column if not exists slug text;
alter table dishes add column if not exists compatible_slots text[] not null default '{}';
alter table dishes add column if not exists diet_tags text[] not null default '{}';
alter table dishes add column if not exists prep_minutes integer;
alter table dishes add column if not exists budget_tier text;
alter table dishes add column if not exists needs_kitchen boolean;
alter table dishes add column if not exists eat_out_ok boolean;
alter table dishes add column if not exists protein_density text;
alter table dishes add column if not exists meal_weight text;
alter table dishes add column if not exists meal_form text;

alter table dish_ingredients add column if not exists scalable boolean not null default true;
alter table dish_ingredients add column if not exists min_g numeric;
alter table dish_ingredients add column if not exists max_g numeric;
alter table dish_ingredients add column if not exists step_g numeric;

create or replace function fitbud_catalog_slugify(value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(
    regexp_replace(
      translate(lower(coalesce(value,'')),
        'áàäâéèëêíìïîóòöôúùüûñç',
        'aaaaeeeeiiiioooouuuunc'),
      '[^a-z0-9]+','-','g'),
    '-+','-','g'));
$$;

update ingredients
set slug = fitbud_catalog_slugify(name)
where slug is null or slug = '';

update dishes
set slug = fitbud_catalog_slugify(name)
where slug is null or slug = '';

drop function if exists fitbud_catalog_slugify(text);

create unique index if not exists ingredients_slug_unique_idx
  on ingredients(slug)
  where slug is not null;

create unique index if not exists dishes_slug_unique_idx
  on dishes(slug)
  where slug is not null;

update dishes
set compatible_slots = array[slot]
where coalesce(array_length(compatible_slots, 1), 0) = 0
  and slot is not null;

update dishes
set compatible_slots = array['media_manana','merienda','snack','recena']
where slot = 'snack';

update dishes
set compatible_slots = array['media_manana','merienda','snack','recena','batido']
where slot = 'batido';

with dish_flags as (
  select
    d.id,
    bool_or(i.category = 'Proteína animal' or i.name in (
      'Pechuga de pollo','Pavo molido magro','Carne de res magra',
      'Atún en agua','Salmón'
    )) as has_meat_or_fish,
    bool_or(i.category = 'Lácteo' or i.name in ('Huevo entero','Miel')) as has_vegan_blocker
  from dishes d
  left join dish_ingredients di on di.dish_id = d.id
  left join ingredients i on i.id = di.ingredient_id
  group by d.id
)
update dishes d
set diet_tags = array_remove(array[
  case when not coalesce(f.has_meat_or_fish, false) then 'vegetariano' end,
  case when not coalesce(f.has_meat_or_fish, false) and not coalesce(f.has_vegan_blocker, false) then 'vegano' end,
  'omnivoro'
], null)
from dish_flags f
where f.id = d.id
  and coalesce(array_length(d.diet_tags, 1), 0) = 0;

update dishes
set
  prep_minutes = case
    when slot in ('snack','batido') then 5
    when slot = 'desayuno' then 15
    when slot = 'cena' then 20
    else 30
  end,
  budget_tier = case
    when name ilike '%salmón%' or name ilike '%atún%' then 'flexible'
    when name ilike '%arroz%' or name ilike '%frijol%' or name ilike '%lentejas%' or
         name ilike '%avena%' or name ilike '%pan%' or name ilike '%arepa%' or
         name ilike '%garbanzo%' or name ilike '%camote%' or name ilike '%papa%' or
         name ilike '%yuca%' or name ilike '%cereal%' then 'low'
    else 'medium'
  end,
  needs_kitchen = case
    when slot in ('snack','batido') or name ilike '%yogur%' or name ilike '%shake%' then false
    else true
  end,
  eat_out_ok = case
    when name ilike '%bowl%' or name ilike '%tacos%' or name ilike '%pasta%' or name ilike '%pollo%' then true
    else false
  end
where prep_minutes is null
   or budget_tier is null
   or needs_kitchen is null
   or eat_out_ok is null;

update dish_ingredients
set
  min_g = coalesce(min_g, greatest(5, round(grams * 0.5))),
  max_g = coalesce(max_g, greatest(grams, round(grams * 2))),
  step_g = coalesce(step_g, 5)
where grams > 0;

with macros as (
  select
    d.id,
    coalesce(sum(i.kcal * di.grams / 100.0), 0) as kcal,
    coalesce(sum(i.protein_g * di.grams / 100.0), 0) as protein_g
  from dishes d
  left join dish_ingredients di on di.dish_id = d.id
  left join ingredients i on i.id = di.ingredient_id
  group by d.id
)
update dishes d
set protein_density = case
  when m.kcal <= 0 then 'unknown'
  when (m.protein_g * 4.0 / m.kcal) >= 0.35 then 'high'
  when (m.protein_g * 4.0 / m.kcal) >= 0.20 then 'medium'
  else 'low'
end
from macros m
where m.id = d.id
  and (d.protein_density is null or d.protein_density = '');

update dishes
set meal_form = case
  when slot = 'batido' or name ilike '%shake%' or name ilike '%batido%' then 'shake'
  when slot = 'snack' then 'snack'
  when name ilike '%bowl%' then 'bowl'
  when name ilike '%sopa%' or name ilike '%crema%' or name ilike '%ramen%' then 'soup'
  when name ilike '%pan%' or name ilike '%pita%' or name ilike '%taco%' or name ilike '%quesadilla%' or name ilike '%wrap%' or name ilike '%tostada%' or name ilike '%arepa%' then 'sandwich'
  else 'plated'
end
where meal_form is null or meal_form = '';

update dishes
set meal_weight = case
  when slot in ('snack','batido') then 'light'
  when slot = 'desayuno' then 'medium'
  when name ilike '%yogur%' or name ilike '%caseína%' or name ilike '%caseina%' then 'light'
  when slot = 'almuerzo' then 'heavy'
  when slot = 'cena' and (
    name ilike '%salmón%' or name ilike '%salmon%' or name ilike '%carne%' or
    name ilike '%arroz%' or name ilike '%quinua%'
  ) then 'heavy'
  else 'medium'
end
where meal_weight is null or meal_weight = '';

update dishes
set compatible_slots = case
  when slot = 'batido' then array['media_manana','merienda','snack','recena','batido']
  else array['media_manana','merienda','snack','recena']
end
where meal_weight = 'light'
  and (
    slot in ('snack','batido') or
    name ilike '%shake%' or name ilike '%batido%' or
    name ilike '%yogur%' or name ilike '%caseína%' or name ilike '%caseina%'
  );

do $$
begin
  alter table dishes add constraint dishes_compatible_slots_vocab
    check (compatible_slots <@ array['desayuno','media_manana','almuerzo','merienda','snack','cena','recena','batido']::text[]);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table dishes add constraint dishes_diet_tags_vocab
    check (diet_tags <@ array['vegetariano','vegano','omnivoro']::text[]);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table dishes add constraint dishes_budget_tier_vocab
    check (budget_tier is null or budget_tier in ('low','medium','flexible'));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table dishes add constraint dishes_protein_density_vocab
    check (protein_density is null or protein_density in ('low','medium','high','unknown'));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table dishes add constraint dishes_meal_weight_vocab
    check (meal_weight is null or meal_weight in ('light','medium','heavy'));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table dishes add constraint dishes_meal_form_vocab
    check (meal_form is null or meal_form in ('bowl','sandwich','shake','plated','soup','snack'));
exception
  when duplicate_object then null;
end $$;
