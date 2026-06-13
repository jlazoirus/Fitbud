-- ============================================================
-- Fitbud — esquema de base de datos (Supabase / PostgreSQL)
-- Modelo: ingredientes (nutrición por 100 g) -> platos (recetas)
--         -> dietas (menús que asignan platos por día/slot)
-- Ejecuta este archivo PRIMERO en el SQL Editor de Supabase.
-- ============================================================

-- Limpieza idempotente (puedes re-ejecutar este archivo sin error)
drop table if exists diet_dishes cascade;
drop table if exists diet_days cascade;
drop table if exists diets cascade;
drop table if exists dish_ingredients cascade;
drop table if exists dishes cascade;
drop table if exists ingredients cascade;

-- ---------- INGREDIENTES (valores por 100 g) ----------
create table ingredients (
  id          bigint generated always as identity primary key,
  name        text not null unique,
  category    text,
  kcal        numeric not null default 0,   -- por 100 g
  protein_g   numeric not null default 0,   -- por 100 g
  carbs_g     numeric not null default 0,   -- por 100 g
  fat_g       numeric not null default 0,   -- por 100 g
  created_at  timestamptz default now()
);

-- ---------- PLATOS ----------
create table dishes (
  id          bigint generated always as identity primary key,
  name        text not null unique,
  slot        text,            -- desayuno | almuerzo | batido | cena | snack
  menu        text,            -- A | B | C | D | NULL (compartido)
  notes       text,
  created_at  timestamptz default now()
);

-- ---------- RECETA: ingredientes de cada plato (con gramos) ----------
create table dish_ingredients (
  id            bigint generated always as identity primary key,
  dish_id       bigint not null references dishes(id) on delete cascade,
  ingredient_id bigint not null references ingredients(id) on delete restrict,
  grams         numeric not null default 0,
  unique (dish_id, ingredient_id)
);

-- ---------- DIETAS (menús) ----------
create table diets (
  id          bigint generated always as identity primary key,
  code        text unique,     -- A | B | C | D | REFEED | DIETBREAK
  name        text not null,
  description text
);

-- ---------- ASIGNACIÓN de platos a cada dieta (por día y slot) ----------
create table diet_dishes (
  id        bigint generated always as identity primary key,
  diet_id   bigint not null references diets(id) on delete cascade,
  dish_id   bigint not null references dishes(id) on delete cascade,
  weekday   int,               -- 0=Dom .. 6=Sáb (NULL = cualquier día)
  slot      text
);

create index on dish_ingredients (dish_id);
create index on dish_ingredients (ingredient_id);
create index on diet_dishes (diet_id);

-- ============================================================
-- Vista de macros calculados por plato (suma de ingredientes)
-- security_invoker => respeta el RLS del que consulta.
-- ============================================================
create or replace view dish_macros
with (security_invoker = true) as
select
  d.id   as dish_id,
  d.name,
  d.slot,
  d.menu,
  round(coalesce(sum(i.kcal      * di.grams / 100.0), 0))   as kcal,
  round(coalesce(sum(i.protein_g * di.grams / 100.0), 0))   as protein_g,
  round(coalesce(sum(i.carbs_g   * di.grams / 100.0), 0))   as carbs_g,
  round(coalesce(sum(i.fat_g     * di.grams / 100.0), 0))   as fat_g
from dishes d
left join dish_ingredients di on di.dish_id = d.id
left join ingredients i       on i.id = di.ingredient_id
group by d.id, d.name, d.slot, d.menu;

-- ============================================================
-- RLS (Row Level Security)
-- App personal: se permite acceso completo al rol anónimo para
-- que la app (con anon key) pueda leer y editar.
-- ⚠️ Cualquiera con tu URL+anon key podría escribir. Si quieres
--    proteger la escritura, activa Supabase Auth y reemplaza las
--    políticas de abajo por "to authenticated".
-- ============================================================
alter table ingredients      enable row level security;
alter table dishes           enable row level security;
alter table dish_ingredients enable row level security;
alter table diets            enable row level security;
alter table diet_dishes      enable row level security;

create policy "anon all ingredients"      on ingredients      for all using (true) with check (true);
create policy "anon all dishes"           on dishes           for all using (true) with check (true);
create policy "anon all dish_ingredients" on dish_ingredients for all using (true) with check (true);
create policy "anon all diets"            on diets            for all using (true) with check (true);
create policy "anon all diet_dishes"      on diet_dishes      for all using (true) with check (true);
