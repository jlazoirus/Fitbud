// Catálogo realista parseado de supabase/seed.sql, compartido por los
// validadores de dieta (canario REQ-128 y cierre de propuestas REQ-171).
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const seed = readFileSync(join(ROOT, "supabase", "seed.sql"), "utf8");

function sqlString(value) {
  return String(value || "").replace(/''/g, "'");
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function inferMealForm(dish) {
  const name = String(dish && dish.name || "");
  if (dish.slot === "batido" || /shake|batido/i.test(name)) return "shake";
  if (dish.slot === "snack") return "snack";
  if (/bowl/i.test(name)) return "bowl";
  if (/sopa|crema|ramen/i.test(name)) return "soup";
  if (/pan|pita|taco|quesadilla|wrap|tostada|arepa/i.test(name)) return "sandwich";
  return "plated";
}

function inferMealWeight(dish) {
  const name = String(dish && dish.name || "");
  if (dish.slot === "snack" || dish.slot === "batido") return "light";
  if (dish.slot === "desayuno") return "medium";
  if (/yogur|case[ií]na/i.test(name)) return "light";
  if (dish.slot === "almuerzo") return "heavy";
  if (dish.slot === "cena" && /salm[oó]n|carne|arroz|quinua/i.test(name)) return "heavy";
  return "medium";
}

function section(start, end) {
  const i = seed.indexOf(start);
  if (i < 0) throw new Error(`No se encontro seccion: ${start}`);
  const j = seed.indexOf(end, i);
  if (j < 0) throw new Error(`No se encontro fin de seccion: ${end}`);
  return seed.slice(i, j);
}

export function parseCatalog() {
  const ingredients = [];
  const ingredientsByName = new Map();
  const ingSec = section("insert into ingredients", "-- ---------- PLATOS");
  const ingRe = /\('((?:[^']|'')*)','((?:[^']|'')*)',\s*([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\)/g;
  let m;
  while ((m = ingRe.exec(ingSec))) {
    const row = {
      id: ingredients.length + 1,
      name: sqlString(m[1]),
      category: sqlString(m[2]),
      kcal: Number(m[3]),
      protein_g: Number(m[4]),
      carbs_g: Number(m[5]),
      fat_g: Number(m[6]),
    };
    row.slug = slugify(row.name);
    ingredients.push(row);
    ingredientsByName.set(row.name, row);
  }

  const dishes = [];
  const dishesByName = new Map();
  const dishSec = section("insert into dishes", "-- ---------- RECETAS");
  const dishRe = /\('((?:[^']|'')*)',\s*'([^']*)'\s*,\s*(null|'((?:[^']|'')*)')\)/g;
  while ((m = dishRe.exec(dishSec))) {
    const slot = sqlString(m[2]);
    const row = {
      id: dishes.length + 1,
      name: sqlString(m[1]),
      slot,
      menu: m[3] === "null" ? null : sqlString(m[4]),
    };
    row.slug = slugify(row.name);
    row.compatible_slots = slot === "snack"
      ? ["media_manana", "merienda", "snack", "recena"]
      : slot === "batido"
        ? ["media_manana", "merienda", "snack", "recena", "batido"]
        : [slot];
    row.meal_form = inferMealForm(row);
    row.meal_weight = inferMealWeight(row);
    if (row.meal_weight === "light" && /yogur|case[ií]na|shake|batido/i.test(row.name)) {
      row.compatible_slots = row.slot === "batido"
        ? ["media_manana", "merienda", "snack", "recena", "batido"]
        : ["media_manana", "merienda", "snack", "recena"];
    }
    dishes.push(row);
    dishesByName.set(row.name, row);
  }

  const dishIng = [];
  const recSec = section("insert into dish_ingredients", "-- ---------- DIETAS");
  const recRe = /\('((?:[^']|'')*)','((?:[^']|'')*)',\s*([\d.]+)\)/g;
  while ((m = recRe.exec(recSec))) {
    const dish = dishesByName.get(sqlString(m[1]));
    const ingredient = ingredientsByName.get(sqlString(m[2]));
    if (!dish || !ingredient) continue;
    const grams = Number(m[3]);
    dishIng.push({
      dish_id: dish.id,
      ingredient_id: ingredient.id,
      grams,
      scalable: true,
      min_g: Math.max(5, Math.round(grams * 0.5)),
      max_g: Math.max(grams, Math.round(grams * 2)),
      step_g: 5,
    });
  }

  const animalProteins = new Set([
    "Pechuga de pollo", "Pavo molido magro", "Carne de res magra",
    "Atun en agua", "Atún en agua", "Salmon", "Salmón",
  ]);
  for (const dish of dishes) {
    const lines = dishIng.filter(line => line.dish_id === dish.id);
    const ings = lines.map(line => ingredients.find(ing => ing.id === line.ingredient_id)).filter(Boolean);
    const hasMeatOrFish = ings.some(ing => ing.category === "Proteína animal" || animalProteins.has(ing.name));
    const hasVeganBlocker = ings.some(ing => ing.category === "Lácteo" || ["Huevo entero", "Miel"].includes(ing.name));
    dish.diet_tags = [
      !hasMeatOrFish ? "vegetariano" : "",
      !hasMeatOrFish && !hasVeganBlocker ? "vegano" : "",
      "omnivoro",
    ].filter(Boolean);
  }

  return { ingredients, dishes, dishIng };
}
