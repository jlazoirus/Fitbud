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
const MIN_CANDIDATES_PER_SLOT = 2;

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
  return [dish.slot].filter(Boolean);
}

function assertMigrationShape() {
  const required = [
    "alter table ingredients add column if not exists slug text",
    "alter table dishes add column if not exists slug text",
    "alter table dishes add column if not exists compatible_slots text[]",
    "alter table dishes add column if not exists diet_tags text[]",
    "alter table dishes add column if not exists prep_minutes integer",
    "alter table dishes add column if not exists budget_tier text",
    "alter table dishes add column if not exists needs_kitchen boolean",
    "alter table dishes add column if not exists eat_out_ok boolean",
    "alter table dishes add column if not exists protein_density text",
    "alter table dish_ingredients add column if not exists scalable boolean",
    "alter table dish_ingredients add column if not exists min_g numeric",
    "alter table dish_ingredients add column if not exists max_g numeric",
    "alter table dish_ingredients add column if not exists step_g numeric",
    "ingredients_slug_unique_idx",
    "dishes_slug_unique_idx",
    "dishes_compatible_slots_vocab",
    "dishes_diet_tags_vocab",
  ];
  for (const fragment of required) {
    assert.ok(migration.includes(fragment), `La migración debe incluir: ${fragment}`);
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
    assert.ok(count >= MIN_CANDIDATES_PER_SLOT, `${slot} necesita >=${MIN_CANDIDATES_PER_SLOT} candidatos; tiene ${count}`);
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
    if (!hasMeatOrFish) vegetarian += 1;
    if (!hasMeatOrFish && !hasVeganBlocker) vegan += 1;
    if (hasMeatOrFish) omnivoreOnly += 1;
  }
  assert.ok(vegetarian > 0, "Debe haber platos vegetarianos etiquetables");
  assert.ok(vegan > 0, "Debe haber platos veganos etiquetables");
  assert.ok(omnivoreOnly > 0, "Debe haber platos omnívoros no vegetarianos");
}

const ingredients = parseIngredients();
const dishes = parseDishes();
const recipes = parseRecipes();

assert.ok(ingredients.length >= 50, "El seed debe incluir ingredientes suficientes");
assert.ok(dishes.length >= 45, "El seed debe incluir platos suficientes");
assertMigrationShape();
assertUniqueSlugs("Ingrediente", ingredients);
assertUniqueSlugs("Plato", dishes);
assertSlotCoverage(dishes);
assertDietTagBackfill(dishes, ingredients, recipes);

console.log(`Catálogo nutricional semántico OK: ${ingredients.length} ingredientes · ${dishes.length} platos · ${FOOD_SLOTS.length} slots cubiertos.`);
