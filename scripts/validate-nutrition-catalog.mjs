#!/usr/bin/env node
// Validador semántico de catálogo nutricional (REQ-79).
// Verifica que la migración declare metadata estable y que el seed tenga
// cobertura para todos los slots renderizables por perfiles de 2-6 comidas.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const seed = readFileSync(join(ROOT, "supabase/seed.sql"), "utf8");
const migration = readFileSync(join(ROOT, "supabase/nutrition_catalog_semantics.sql"), "utf8").toLowerCase();

const FOOD_SLOTS = ["desayuno", "media_manana", "almuerzo", "merienda", "snack", "cena", "recena"];
const SLOT_VOCAB = new Set([...FOOD_SLOTS, "batido"]);
const CUISINE_TAGS = new Set(["criolla", "mediterranea", "mexicana", "asiatica"]);
const MIN_CANDIDATES_PER_SLOT = 2;
const REQ135_SLOT_MINIMUMS = { desayuno: 20, media_manana: 10, merienda: 10, snack: 15, recena: 8 };
const REQ135_MIN_DISHES = 100;
const REQ135_MIN_INGREDIENTS = 100;
const REQ141_MIN_DISHES = 180;
const REQ141_MIN_INGREDIENTS = 200;
const REQ141_MIN_NEEDS_KITCHEN_FALSE = 40;
const REQ141_MIN_EAT_OUT_OK = 25;
const REQ141_MIN_DAIRY_FREE = 100;
const REQ141_MIN_GLUTEN_FREE = 120;
// Ingredientes con trigo/cebada/centeno u otras fuentes conocidas de gluten.
// Lista explícita y conservadora: solo cuenta un plato como "sin gluten" si
// ninguno de sus ingredientes aparece aquí. No es una certificación de
// alérgenos ni reemplaza el filtrado real de restricciones del usuario
// (js/nutrition-domain.js); es una estimación de composición de catálogo
// para dimensionar REQ-137 y priorizar lotes futuros.
const GLUTEN_INGREDIENTS = new Set([
  "Fideos de trigo secos", "Tortilla integral de trigo", "Pan de molde", "Pan integral",
  "Wrap integral", "Pasta integral seca", "Cebada cocida", "Pan integral de centeno",
  "Cuscus cocido", "Bulgur cocido", "Cereal integral sin azucar",
  "Salsa de soya", "Salsa teriyaki", "Pasta de miso",
]);

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function section(start, end) {
  const i = seed.indexOf(start);
  const j = seed.indexOf(end, i);
  assert.ok(i >= 0, `No se encontró ${start}`);
  assert.ok(j > i, `No se encontró fin ${end}`);
  return seed.slice(i, j);
}

function parseIngredients() {
  const sec = section("insert into ingredients", "-- ---------- PLATOS");
  const re = /\('((?:[^'\\]|\\.)*)','([^']*)',\s*([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\)/g;
  const rows = [];
  let m;
  while ((m = re.exec(sec))) rows.push({ name: m[1], category: m[2] });
  return rows;
}

function parseDishes() {
  const sec = section("insert into dishes", "-- ---------- RECETAS");
  const re = /\('((?:[^'\\]|\\.)*)',\s*'([^']*)'\s*,\s*(null|'[^']*')\)/g;
  const rows = [];
  let m;
  while ((m = re.exec(sec))) rows.push({ name: m[1], slot: m[2], menu: m[3] });
  return rows;
}

function parseRecipes() {
  const sec = section("insert into dish_ingredients", "-- ---------- DIETAS");
  const re = /\('((?:[^'\\]|\\.)*)','((?:[^'\\]|\\.)*)',\s*([\d.]+)\)/g;
  const recipes = new Map();
  let m;
  while ((m = re.exec(sec))) {
    const list = recipes.get(m[1]) || [];
    list.push({ ingredient: m[2], grams: Number(m[3]) });
    recipes.set(m[1], list);
  }
  return recipes;
}

function assertUniqueSlugs(kind, rows) {
  const seen = new Map();
  for (const row of rows) {
    const slug = slugify(row.name);
    assert.ok(slug, `${kind} "${row.name}" debe producir slug no vacío`);
    assert.ok(!seen.has(slug), `${kind} slug duplicado "${slug}": "${seen.get(slug)}" y "${row.name}"`);
    seen.set(slug, row.name);
  }
}

function compatibleSlots(dish) {
  if (dish.slot === "snack") return ["media_manana", "merienda", "snack", "recena"];
  if (dish.slot === "batido") return ["media_manana", "merienda", "snack", "recena", "batido"];
  if (inferMealWeight(dish) === "light" && /yogur|case[ií]na|shake|batido/i.test(dish.name)) {
    return ["media_manana", "merienda", "snack", "recena"];
  }
  return [dish.slot].filter(Boolean);
}

function inferMealWeight(dish) {
  if (dish.slot === "snack" || dish.slot === "batido") return "light";
  if (dish.slot === "desayuno") return "medium";
  if (/yogur|case[ií]na/i.test(dish.name)) return "light";
  if (dish.slot === "almuerzo") return "heavy";
  if (dish.slot === "cena" && /salm[oó]n|carne|arroz|quinua/i.test(dish.name)) return "heavy";
  return "medium";
}

function inferMealForm(dish) {
  if (dish.slot === "batido" || /shake|batido/i.test(dish.name)) return "shake";
  if (dish.slot === "snack") return "snack";
  if (/bowl/i.test(dish.name)) return "bowl";
  if (/sopa|crema|ramen/i.test(dish.name)) return "soup";
  if (/pan|pita|taco|quesadilla|wrap|tostada|arepa/i.test(dish.name)) return "sandwich";
  return "plated";
}

function inferPrepMinutes(dish) {
  if (dish.slot === "snack" || dish.slot === "batido") return 5;
  if (dish.slot === "desayuno") return 15;
  if (dish.slot === "cena") return 20;
  return 30;
}

function inferNeedsKitchen(dish) {
  if (dish.slot === "snack" || dish.slot === "batido" || /yogur|shake/i.test(dish.name)) return false;
  return true;
}

function inferEatOutOk(dish) {
  return /bowl|tacos|pasta|pollo/i.test(dish.name);
}

function inferBudgetTier(dish) {
  if (/salm[oó]n|at[uú]n/i.test(dish.name)) return "flexible";
  if (/arroz|frijol|lentejas|avena|pan|arepa|garbanzo|camote|papa|yuca|cereal/i.test(dish.name)) return "low";
  return "medium";
}

function dishMenu(dish) {
  return String(dish.menu || "").replace(/'/g, "");
}

function inferCuisineTags(dish) {
  const name = String(dish.name || "");
  const menu = dishMenu(dish);
  if (menu === "A" || /tacu tacu|aj[ií]|locro|chaufa|criolla|criollo/i.test(name)) return ["criolla"];
  if (menu === "B" || /hummus|falafel|griega|pita|cuscus/i.test(name)) return ["mediterranea"];
  if (menu === "D" || /taco|fajita|quesadilla|enchilada|azteca|chili/i.test(name)) return ["mexicana"];
  if (menu === "C" || /teriyaki|pad thai|ramen|pak choi|edamame/i.test(name)) return ["asiatica"];
  return [];
}

function assertMigrationShape() {
  const required = [
    "alter table ingredients add column if not exists slug text",
    "alter table dishes add column if not exists slug text",
    "alter table dishes add column if not exists compatible_slots text[]",
    "alter table dishes add column if not exists diet_tags text[]",
    "alter table dishes add column if not exists cuisine_tags text[]",
    "alter table dishes add column if not exists prep_minutes integer",
    "alter table dishes add column if not exists budget_tier text",
    "alter table dishes add column if not exists needs_kitchen boolean",
    "alter table dishes add column if not exists eat_out_ok boolean",
    "alter table dishes add column if not exists protein_density text",
    "alter table dishes add column if not exists meal_weight text",
    "alter table dishes add column if not exists meal_form text",
    "alter table dish_ingredients add column if not exists scalable boolean",
    "alter table dish_ingredients add column if not exists min_g numeric",
    "alter table dish_ingredients add column if not exists max_g numeric",
    "alter table dish_ingredients add column if not exists step_g numeric",
    "ingredients_slug_unique_idx",
    "dishes_slug_unique_idx",
    "dishes_compatible_slots_vocab",
    "dishes_diet_tags_vocab",
    "dishes_cuisine_tags_vocab",
    "dishes_meal_weight_vocab",
    "dishes_meal_form_vocab",
  ];
  for (const fragment of required) {
    assert.ok(migration.includes(fragment), `La migración debe incluir: ${fragment}`);
  }
}

function assertMealMetadata(dishes) {
  const weights = new Set(["light", "medium", "heavy"]);
  const forms = new Set(["bowl", "sandwich", "shake", "plated", "soup", "snack"]);
  for (const dish of dishes) {
    const weight = inferMealWeight(dish);
    const form = inferMealForm(dish);
    assert.ok(weights.has(weight), `${dish.name} debe inferir meal_weight válido`);
    assert.ok(forms.has(form), `${dish.name} debe inferir meal_form válido`);
    const slots = compatibleSlots(dish);
    if (weight === "heavy") {
      assert.ok(!slots.includes("media_manana") && !slots.includes("merienda") && !slots.includes("recena"),
        `${dish.name} heavy no debe cubrir slots ligeros`);
    }
  }
}

function assertSlotCoverage(dishes) {
  const coverage = new Map(FOOD_SLOTS.map(slot => [slot, []]));
  for (const dish of dishes) {
    for (const slot of compatibleSlots(dish)) {
      assert.ok(SLOT_VOCAB.has(slot), `"${dish.name}" declara slot no permitido: ${slot}`);
      if (coverage.has(slot)) coverage.get(slot).push(dish.name);
    }
  }
  for (const slot of FOOD_SLOTS) {
    const count = coverage.get(slot).length;
    const minimum = REQ135_SLOT_MINIMUMS[slot] || MIN_CANDIDATES_PER_SLOT;
    assert.ok(count >= minimum, `${slot} necesita >=${minimum} candidatos; tiene ${count}`);
  }
}

function assertDietTagBackfill(dishes, ingredients, recipes) {
  const byName = new Map(ingredients.map(i => [i.name, i]));
  let vegan = 0, vegetarian = 0, omnivoreOnly = 0;
  const meatOrFish = new Set(["Pechuga de pollo", "Pavo molido magro", "Carne de res magra", "Atún en agua", "Salmón"]);
  for (const dish of dishes) {
    const lines = recipes.get(dish.name) || [];
    const hasMeatOrFish = lines.some(line => meatOrFish.has(line.ingredient));
    const hasVeganBlocker = lines.some(line => {
      const ing = byName.get(line.ingredient);
      return ing && (ing.category === "Lácteo" || ing.name === "Huevo entero" || ing.name === "Miel");
    });
    const hasAnimalCategory = lines.some(line => byName.get(line.ingredient)?.category === "Proteína animal");
    if (!hasMeatOrFish && !hasAnimalCategory) vegetarian += 1;
    if (!hasMeatOrFish && !hasAnimalCategory && !hasVeganBlocker) vegan += 1;
    if (hasMeatOrFish || hasAnimalCategory) omnivoreOnly += 1;
  }
  assert.ok(vegetarian > 0, "Debe haber platos vegetarianos etiquetables");
  assert.ok(vegan > 0, "Debe haber platos veganos etiquetables");
  assert.ok(omnivoreOnly > 0, "Debe haber platos omnívoros no vegetarianos");
  assert.ok(vegetarian / dishes.length >= 0.30, `REQ-135 exige >=30% vegetariano; tiene ${vegetarian}/${dishes.length}`);
  assert.ok(vegan / dishes.length >= 0.15, `REQ-135 exige >=15% vegano; tiene ${vegan}/${dishes.length}`);
}

function assertCuisineCoverage(dishes) {
  const coverage = new Map([...CUISINE_TAGS].map(tag => [tag, 0]));
  for (const dish of dishes) {
    const tags = inferCuisineTags(dish);
    for (const tag of tags) {
      assert.ok(CUISINE_TAGS.has(tag), `${dish.name} infiere cuisine_tag inválido: ${tag}`);
      coverage.set(tag, (coverage.get(tag) || 0) + 1);
    }
  }
  for (const tag of CUISINE_TAGS) {
    const count = coverage.get(tag) || 0;
    assert.ok(count >= 5, `REQ-136 exige cobertura inicial de cocina ${tag}; tiene ${count}`);
  }
}

function assertReq135Scale(ingredients, dishes) {
  assert.ok(ingredients.length >= REQ135_MIN_INGREDIENTS, `REQ-135 exige >=${REQ135_MIN_INGREDIENTS} ingredientes; tiene ${ingredients.length}`);
  assert.ok(dishes.length >= REQ135_MIN_DISHES, `REQ-135 exige >=${REQ135_MIN_DISHES} platos; tiene ${dishes.length}`);
  const quick = dishes.filter(dish => inferPrepMinutes(dish) <= 15).length;
  const lowBudget = dishes.filter(dish => inferBudgetTier(dish) === "low").length;
  assert.ok(quick / dishes.length >= 1 / 3, `REQ-135 exige >=1/3 platos prep<=15; tiene ${quick}/${dishes.length}`);
  assert.ok(lowBudget / dishes.length >= 1 / 3, `REQ-135 exige >=1/3 platos low budget; tiene ${lowBudget}/${dishes.length}`);
}

function assertReq141Scale(ingredients, dishes) {
  assert.ok(ingredients.length >= REQ141_MIN_INGREDIENTS, `REQ-141 exige >=${REQ141_MIN_INGREDIENTS} ingredientes; tiene ${ingredients.length}`);
  assert.ok(dishes.length >= REQ141_MIN_DISHES, `REQ-141 exige >=${REQ141_MIN_DISHES} platos; tiene ${dishes.length}`);
}

function assertScenarioCoverage(dishes) {
  const needsKitchenFalse = dishes.filter(dish => inferNeedsKitchen(dish) === false).length;
  const eatOutOk = dishes.filter(dish => inferEatOutOk(dish)).length;
  assert.ok(needsKitchenFalse >= REQ141_MIN_NEEDS_KITCHEN_FALSE,
    `REQ-141 exige >=${REQ141_MIN_NEEDS_KITCHEN_FALSE} platos needs_kitchen=false; tiene ${needsKitchenFalse}`);
  assert.ok(eatOutOk >= REQ141_MIN_EAT_OUT_OK,
    `REQ-141 exige >=${REQ141_MIN_EAT_OUT_OK} platos eat_out_ok; tiene ${eatOutOk}`);
}

function assertAllergenCoverage(dishes, ingredients, recipes) {
  const byName = new Map(ingredients.map(i => [i.name, i]));
  const isDairyFree = (dish) => {
    const lines = recipes.get(dish.name) || [];
    return !lines.some(line => byName.get(line.ingredient)?.category === "Lácteo");
  };
  const isGlutenFree = (dish) => {
    const lines = recipes.get(dish.name) || [];
    return !lines.some(line => GLUTEN_INGREDIENTS.has(line.ingredient));
  };
  const dairyFree = dishes.filter(isDairyFree).length;
  const glutenFree = dishes.filter(isGlutenFree).length;
  assert.ok(dairyFree >= REQ141_MIN_DAIRY_FREE,
    `REQ-141 exige >=${REQ141_MIN_DAIRY_FREE} platos sin lácteos (estimado por categoría); tiene ${dairyFree}`);
  assert.ok(glutenFree >= REQ141_MIN_GLUTEN_FREE,
    `REQ-141 exige >=${REQ141_MIN_GLUTEN_FREE} platos sin gluten (estimado por ingredientes conocidos); tiene ${glutenFree}`);
}

const ingredients = parseIngredients();
const dishes = parseDishes();
const recipes = parseRecipes();

assertReq135Scale(ingredients, dishes);
assertReq141Scale(ingredients, dishes);
assertMigrationShape();
assertUniqueSlugs("Ingrediente", ingredients);
assertUniqueSlugs("Plato", dishes);
assertSlotCoverage(dishes);
assertMealMetadata(dishes);
assertDietTagBackfill(dishes, ingredients, recipes);
assertCuisineCoverage(dishes);
assertScenarioCoverage(dishes);
assertAllergenCoverage(dishes, ingredients, recipes);

console.log(`Catálogo nutricional semántico OK: ${ingredients.length} ingredientes · ${dishes.length} platos · ${FOOD_SLOTS.length} slots cubiertos · metadata de momento validada.`);
