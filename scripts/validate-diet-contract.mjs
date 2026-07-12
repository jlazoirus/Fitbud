#!/usr/bin/env node
// REQ-128 — Canary offline del DIET_CONTRACT.
// Reconstruye el catalogo local desde seed.sql + semantica REQ-79 y mide
// factibilidad estricta. REQ-139 activo el contrato en runtime solo como aviso
// suave no bloqueante; este canario sigue midiendo el % que cierra exacto,
// como referencia de calidad para crecer el catalogo (REQ-143/147).
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import "../js/nutrition-pure.js";
import "../js/nutrition-domain.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const seed = readFileSync(join(ROOT, "supabase", "seed.sql"), "utf8");
const d = globalThis.FITBUD_NUTRITION_DOMAIN;

assert.ok(d, "FITBUD_NUTRITION_DOMAIN debe existir");
assert.ok(d.DIET_CONTRACT, "DIET_CONTRACT debe estar exportado");
assert.equal(d.DIET_CONTRACT.runtimeActive, true, "REQ-139 activa el aviso suave en runtime");
assert.equal(d.DIET_CONTRACT.authoritativeKcal, "catalog_ingredient_kcal");
assert.equal(typeof d.finalizeNutritionDay, "function", "REQ-129 debe exportar finalizeNutritionDay");

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

function parseCatalog() {
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

const catalog = parseCatalog();
assert.ok(catalog.ingredients.length > 0, "catalogo con ingredientes");
assert.ok(catalog.dishes.length > 0, "catalogo con platos");
assert.ok(catalog.dishIng.length > 0, "catalogo con recetas");

const TARGETS = {
  normal: { kcal: 2000, p: 150, c: 205, f: 64 },
  alta_proteina: { kcal: 2250, p: 190, c: 215, f: 70 },
};
const mealCounts = [2, 4, 6];
const diets = [
  { id: "omnivoro", value: ["omnivoro"] },
  { id: "vegetariano", value: ["vegetariano"] },
  { id: "vegano", value: ["vegano"] },
];
const dislikes = [
  { id: "sin_disgustos", value: "" },
  { id: "sin_tofu", value: "tofu" },
  { id: "sin_yogur", value: "yogur" },
];
const FOOD_SLOTS = ["desayuno", "media_manana", "almuerzo", "merienda", "snack", "cena", "recena"];

function slotCoverage(catalog) {
  const prefs = { mealCount: 6, mainMealIndex: 3, diet: ["omnivoro"] };
  return Object.fromEntries(FOOD_SLOTS.map(slot => [
    slot,
    d.compatibleDishesForSlot(slot, prefs, catalog).length,
  ]));
}

function pct(n, d0) {
  return d0 > 0 ? (n / d0 * 100) : 0;
}

function causeKey(error) {
  const text = String(error || "").toLowerCase();
  if (text.includes("kcal")) return "kcal_contract";
  if (text.includes("proteina")) return "protein_contract";
  if (text.includes("carbohidratos")) return "carbs_contract";
  if (text.includes("grasa")) return "fat_contract";
  return text || "unknown";
}

function addCause(map, key) {
  map.set(key, (map.get(key) || 0) + 1);
}

const rows = [];
const globalCauses = new Map();
const startDate = "2026-07-06";
const useFinalizer = typeof d.finalizeNutritionDay === "function";
// REQ-137 #4: distinguir dias que fallan solo por residuo de macros (el
// solver/pasada global hizo todo lo posible pero el catalogo no alcanza) de
// dias que fallan por un problema estructural distinto (slot sin candidatos,
// ingrediente desconocido, comida bloqueada, etc.), que sí es un bug a revisar.
const CONTRACT_CAUSE_KEYS = new Set(["kcal_contract", "protein_contract", "carbs_contract", "fat_contract"]);
let catalogGapDays = 0;
let otherIssueDays = 0;

for (const mealCount of mealCounts) {
  for (const diet of diets) {
    for (const [targetId, dayTarget] of Object.entries(TARGETS)) {
      for (const dislike of dislikes) {
        const prefs = {
          mealCount,
          mainMealIndex: Math.min(2, mealCount),
          diet: diet.value,
          dislikedIngredients: dislike.value,
        };
        const causes = new Map();
        let okDays = 0;
        let prevDayUsed = new Set();
        const recentUsed = new Set();
        const days = [];
        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
          const day = useFinalizer
            ? d.finalizeNutritionDay({
                prefs,
                dayTarget,
                catalog,
                date: `${startDate}+${dayIndex}`,
                prevDayUsed,
                recentUsed,
              })
            : d.planDeterministicNutritionDay({
                prefs,
                dayTarget,
                catalog,
                date: `${startDate}+${dayIndex}`,
                prevDayUsed,
                recentUsed,
              });
          prevDayUsed = new Set((day.comidas || []).map(c => c.dishSlug || "").filter(Boolean));
          prevDayUsed.forEach(slug => recentUsed.add(slug));
          days.push(day);
        }
        days.forEach(day => {
          const contract = day.contract || d.validateDietContractTotals(day.totals || {}, day.target || dayTarget);
          const dayOk = day.ok && contract.ok;
          if (dayOk) {
            okDays++;
          } else {
            const dayReasons = day.no_solution && day.no_solution.length
              ? day.no_solution.map(item => item.reason || "solver_no_solution")
              : ["solver_no_solution"];
            dayReasons.forEach(reason => {
              addCause(causes, reason);
              addCause(globalCauses, reason);
            });
            const onlyCatalogGap = dayReasons.length > 0 && dayReasons.every(reason => CONTRACT_CAUSE_KEYS.has(reason));
            if (onlyCatalogGap) catalogGapDays++;
            else otherIssueDays++;
          }
          if (!contract.ok && !day.contract) {
            contract.errors.forEach(error => {
              const key = causeKey(error);
              addCause(causes, key);
              addCause(globalCauses, key);
            });
          }
        });
        rows.push({
          mealCount,
          diet: diet.id,
          target: targetId,
          dislike: dislike.id,
          okDays,
          totalDays: days.length,
          pct: pct(okDays, days.length),
          causes,
        });
      }
    }
  }
}

const totalOk = rows.reduce((sum, row) => sum + row.okDays, 0);
const totalDays = rows.reduce((sum, row) => sum + row.totalDays, 0);
const sorted = [...rows].sort((a, b) => a.pct - b.pct);
const min = sorted[0];
const belowGate = rows.filter(row => row.pct < 98);
const jsonMode = process.argv.includes("--json");

const report = {
  contract: d.DIET_CONTRACT,
  engine: useFinalizer ? "finalizeNutritionDay" : "planDeterministicNutritionDay",
  catalog: {
    ingredients: catalog.ingredients.length,
    dishes: catalog.dishes.length,
    dishIngredients: catalog.dishIng.length,
    slotCoverage: slotCoverage(catalog),
  },
  gateTargetPct: 98,
  total: { okDays: totalOk, totalDays, pct: Number(pct(totalOk, totalDays).toFixed(1)) },
  // REQ-137 #4: de los dias que no cierran, cuantos son un catalog_gap legitimo
  // (el solver + la pasada global + el complemento hicieron todo lo posible,
  // pero el catalogo no tiene margen/ingredientes para llegar al target) frente
  // a otros con una causa distinta que sí amerita revisión (slot sin
  // candidatos, ingrediente desconocido, comida bloqueada, etc.).
  failureBreakdown: {
    catalogGapDays,
    otherIssueDays,
    note: "catalogGapDays = solo causas *_contract (residuo de macro); otherIssueDays = causa estructural distinta.",
  },
  minDimension: {
    mealCount: min.mealCount,
    diet: min.diet,
    target: min.target,
    dislike: min.dislike,
    okDays: min.okDays,
    totalDays: min.totalDays,
    pct: Number(min.pct.toFixed(1)),
  },
  dimensionsBelowGate: belowGate.length,
  causes: Object.fromEntries([...globalCauses.entries()].sort((a, b) => b[1] - a[1])),
  rows: rows.map(row => ({
    mealCount: row.mealCount,
    diet: row.diet,
    target: row.target,
    dislike: row.dislike,
    okDays: row.okDays,
    totalDays: row.totalDays,
    pct: Number(row.pct.toFixed(1)),
    causes: Object.fromEntries([...row.causes.entries()].sort((a, b) => b[1] - a[1])),
  })),
};

if (jsonMode) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log("=== Canary DIET_CONTRACT (REQ-128) ===");
  console.log(`Motor: ${report.engine}.`);
  console.log(`Contrato: kcal ±3% o ±50 kcal; proteina ±5 g; carbohidratos ±8 g; grasa ±8 g.`);
  console.log(`Catalogo: ${report.catalog.ingredients} ingredientes · ${report.catalog.dishes} platos · ${report.catalog.dishIngredients} lineas de receta.`);
  console.log(`Cobertura por slot: ${FOOD_SLOTS.map(slot => `${slot}=${report.catalog.slotCoverage[slot]}`).join(" · ")}.`);
  console.log(`Matriz: ${rows.length} dimensiones × 7 dias = ${totalDays} dias.`);
  console.log(`Factibilidad total: ${totalOk}/${totalDays} (${report.total.pct}%). Gate futuro: >=98% por dimension.`);
  console.log(`De los ${totalDays - totalOk} dias que no cierran: ${catalogGapDays} son catalog_gap (solo residuo de macro) y ${otherIssueDays} tienen otra causa a revisar.`);
  console.log(`Minimo dimension: ${min.mealCount} comidas / ${min.diet} / ${min.target} / ${min.dislike} = ${min.okDays}/${min.totalDays} (${report.minDimension.pct}%).`);
  console.log("\nDimensiones:");
  rows.forEach(row => {
    const label = `${row.mealCount} comidas | ${row.diet.padEnd(12)} | ${row.target.padEnd(13)} | ${row.dislike.padEnd(13)}`;
    const causeText = [...row.causes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k}:${v}`).join(", ") || "ok";
    console.log(`  ${label} -> ${row.okDays}/${row.totalDays} (${row.pct.toFixed(1)}%) · ${causeText}`);
  });
  console.log("\nCausas principales:");
  [...globalCauses.entries()].sort((a, b) => b[1] - a[1]).forEach(([key, count]) => {
    console.log(`  - ${key}: ${count}`);
  });
  if (belowGate.length) {
    console.log(`\nCalibracion: ${belowGate.length} dimension(es) quedan bajo 98%; el aviso suave de REQ-139 ya esta activo, esto solo mide cuanto del catalogo cierra exacto (ver REQ-143/147).`);
  } else {
    console.log("\nCalibracion: todas las dimensiones cumplen el gate futuro.");
  }
  console.log("validate-diet-contract: canario ejecutado.");
}
