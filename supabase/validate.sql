-- ============================================================
-- Fitbud — validación de recetas en la base de datos viva (REQ-01)
-- Pégalo en el SQL Editor de Supabase. Cada consulta debe devolver
-- 0 filas. Si devuelve filas, ahí están los problemas.
--
-- La validación de tolerancia de macros por slot vive en el script
-- Node (supabase/validate.mjs), porque necesita el mapeo plato->slot
-- del plan, que está en index.html y no en la DB.
-- ============================================================

-- 1) Platos sin ningún ingrediente (receta vacía).
select d.id, d.name
from dishes d
left join dish_ingredients di on di.dish_id = d.id
where di.id is null;

-- 2) Líneas de receta con gramos inválidos (<= 0 o nulos).
select di.id, d.name as dish, i.name as ingredient, di.grams
from dish_ingredients di
join dishes d on d.id = di.dish_id
join ingredients i on i.id = di.ingredient_id
where di.grams is null or di.grams <= 0;

-- 3) Platos asignados a una dieta (diet_dishes) que no tienen receta.
select distinct dd.dish_id, d.name
from diet_dishes dd
join dishes d on d.id = dd.dish_id
left join dish_ingredients di on di.dish_id = dd.dish_id
where di.id is null;

-- 4) Ingredientes con valores nutricionales imposibles (negativos).
select id, name, kcal, protein_g, carbs_g, fat_g
from ingredients
where kcal < 0 or protein_g < 0 or carbs_g < 0 or fat_g < 0;

-- 5) Referencia: macros calculados por plato (para revisión manual).
--    (No falla; solo lista lo que ve la app vía la vista dish_macros.)
select * from dish_macros order by name;
