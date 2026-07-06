#!/usr/bin/env node
// REQ-144 - compara dos seed.sql contra el canario del DIET_CONTRACT.
// No modifica el solver, el contrato ni el catalogo; solo mide impacto offline.
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import "../js/nutrition-pure.js";
import "../js/nutrition-domain.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const d = globalThis.FITBUD_NUTRITION_DOMAIN;

assert.ok(d, "FITBUD_NUTRITION_DOMAIN debe existir");
assert.ok(d.DIET_CONTRACT, "DIET_CONTRACT debe estar exportado");
assert.equal(d.DIET_CONTRACT.authoritativeKcal, "catalog_ingredient_kcal");
assert.equal(typeof d.finalizeNutritionDay, "function", "REQ-129 debe exportar finalizeNutritionDay");

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
const CONTRACT_CAUSE_KEYS = new Set(["kcal_contract", "protein_contract", "carbs_contract", "fat_contract"]);

function parseArgs(argv) {
  const opts = { positional: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--before" || arg === "-b") opts.before = argv[++i];
    else if (arg === "--after" || arg === "-a") opts.after = argv[++i];
    else if (arg === "--json") opts.json = true;
    else if (arg === "--fail-on-regression") opts.failOnRegression = true;
    else if (arg === "--help" || arg === "-h") opts.help = true;
    else if (arg.startsWith("-")) throw new Error(`Opcion desconocida: ${arg}`);
    else opts.positional.push(arg);
  }
  if (!opts.before && opts.positional.length >= 1) opts.before = opts.positional[0];
  if (!opts.after && opts.positional.length >= 2) opts.after = opts.positional[1];
  return opts;
}

function usage() {
  return [
    "Uso:",
    "  node scripts/diff-diet-contract.mjs --before /tmp/seed-before.sql --after /tmp/seed-after.sql",
    "  node scripts/diff-diet-contract.mjs /tmp/seed-before.sql /tmp/seed-after.sql --json",
    "",
    "Opciones:",
    "  --json                 Emite JSON completo.",
    "  --fail-on-regression   Sale con codigo 1 si baja el total de dias OK.",
  ].join("\n");
}

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

function section(seed, start, end) {
  const i = seed.indexOf(start);
  if (i < 0) throw new Error(`No se encontro seccion: ${start}`);
  const j = seed.indexOf(end, i);
  if (j < 0) throw new Error(`No se encontro fin de seccion: ${end}`);
  return seed.slice(i, j);
}

function parseCatalog(seed) {
  const ingredients = [];
  const ingredientsByName = new Map();
  const ingSec = section(seed, "insert into ingredients", "-- ---------- PLATOS");
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
  const dishSec = section(seed, "insert into dishes", "-- ---------- RECETAS");
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
  const recSec = section(seed, "insert into dish_ingredients", "-- ---------- DIETAS");
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

function pct(n, total) {
  return total > 0 ? (n / total * 100) : 0;
}

function addCause(map, key) {
  map.set(key, (map.get(key) || 0) + 1);
}

function slotCoverage(catalog) {
  const prefs = { mealCount: 6, mainMealIndex: 3, diet: ["omnivoro"] };
  return Object.fromEntries(FOOD_SLOTS.map(slot => [
    slot,
    d.compatibleDishesForSlot(slot, prefs, catalog).length,
  ]));
}

function causesObject(map) {
  return Object.fromEntries([...map.entries()].sort((a, b) => b[1] - a[1]));
}

function measureSeed(seedPath) {
  const absolutePath = resolve(ROOT, seedPath);
  const seed = readFileSync(absolutePath, "utf8");
  const catalog = parseCatalog(seed);
  assert.ok(catalog.ingredients.length > 0, `${seedPath}: catalogo con ingredientes`);
  assert.ok(catalog.dishes.length > 0, `${seedPath}: catalogo con platos`);
  assert.ok(catalog.dishIng.length > 0, `${seedPath}: catalogo con recetas`);

  const rows = [];
  const globalCauses = new Map();
  const startDate = "2026-07-06";
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
          for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
            const day = d.finalizeNutritionDay({
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
          for (const day of days) {
            const contract = day.contract || d.validateDietContractTotals(day.totals || {}, day.target || dayTarget);
            const dayOk = day.ok && contract.ok;
            if (dayOk) {
              okDays += 1;
              continue;
            }
            const dayReasons = day.no_solution && day.no_solution.length
              ? day.no_solution.map(item => item.reason || "solver_no_solution")
              : ["solver_no_solution"];
            dayReasons.forEach(reason => {
              addCause(causes, reason);
              addCause(globalCauses, reason);
            });
            const onlyCatalogGap = dayReasons.length > 0 && dayReasons.every(reason => CONTRACT_CAUSE_KEYS.has(reason));
            if (onlyCatalogGap) catalogGapDays += 1;
            else otherIssueDays += 1;
          }
          rows.push({
            mealCount,
            diet: diet.id,
            target: targetId,
            dislike: dislike.id,
            okDays,
            totalDays: days.length,
            pct: Number(pct(okDays, days.length).toFixed(1)),
            causes: causesObject(causes),
          });
        }
      }
    }
  }

  const totalOk = rows.reduce((sum, row) => sum + row.okDays, 0);
  const totalDays = rows.reduce((sum, row) => sum + row.totalDays, 0);
  const sorted = [...rows].sort((a, b) => a.pct - b.pct);
  const min = sorted[0];
  return {
    seedPath: absolutePath,
    engine: "finalizeNutritionDay",
    catalog: {
      ingredients: catalog.ingredients.length,
      dishes: catalog.dishes.length,
      dishIngredients: catalog.dishIng.length,
      slotCoverage: slotCoverage(catalog),
    },
    total: { okDays: totalOk, totalDays, pct: Number(pct(totalOk, totalDays).toFixed(1)) },
    failureBreakdown: {
      catalogGapDays,
      otherIssueDays,
    },
    minDimension: {
      mealCount: min.mealCount,
      diet: min.diet,
      target: min.target,
      dislike: min.dislike,
      okDays: min.okDays,
      totalDays: min.totalDays,
      pct: min.pct,
    },
    causes: causesObject(globalCauses),
    rows,
  };
}

function rowKey(row) {
  return `${row.mealCount}|${row.diet}|${row.target}|${row.dislike}`;
}

function rowLabel(row) {
  return `${row.mealCount} comidas | ${row.diet} | ${row.target} | ${row.dislike}`;
}

function diffReports(before, after) {
  const beforeRows = new Map(before.rows.map(row => [rowKey(row), row]));
  const afterRows = new Map(after.rows.map(row => [rowKey(row), row]));
  const keys = [...new Set([...beforeRows.keys(), ...afterRows.keys()])];
  const dimensionDeltas = keys.map(key => {
    const b = beforeRows.get(key);
    const a = afterRows.get(key);
    const template = a || b;
    return {
      key,
      label: rowLabel(template),
      mealCount: template.mealCount,
      diet: template.diet,
      target: template.target,
      dislike: template.dislike,
      before: b ? { okDays: b.okDays, totalDays: b.totalDays, pct: b.pct, causes: b.causes } : null,
      after: a ? { okDays: a.okDays, totalDays: a.totalDays, pct: a.pct, causes: a.causes } : null,
      deltaOkDays: (a?.okDays || 0) - (b?.okDays || 0),
      deltaPct: Number(((a?.pct || 0) - (b?.pct || 0)).toFixed(1)),
    };
  }).sort((a, b) => a.mealCount - b.mealCount
    || a.diet.localeCompare(b.diet)
    || a.target.localeCompare(b.target)
    || a.dislike.localeCompare(b.dislike));
  const improved = dimensionDeltas.filter(row => row.deltaOkDays > 0);
  const regressed = dimensionDeltas.filter(row => row.deltaOkDays < 0);
  return {
    before: {
      seedPath: before.seedPath,
      total: before.total,
      catalog: before.catalog,
      failureBreakdown: before.failureBreakdown,
      minDimension: before.minDimension,
      causes: before.causes,
    },
    after: {
      seedPath: after.seedPath,
      total: after.total,
      catalog: after.catalog,
      failureBreakdown: after.failureBreakdown,
      minDimension: after.minDimension,
      causes: after.causes,
    },
    total: {
      beforeOkDays: before.total.okDays,
      afterOkDays: after.total.okDays,
      totalDays: after.total.totalDays,
      deltaOkDays: after.total.okDays - before.total.okDays,
      beforePct: before.total.pct,
      afterPct: after.total.pct,
      deltaPct: Number((after.total.pct - before.total.pct).toFixed(1)),
    },
    catalogDelta: {
      ingredients: after.catalog.ingredients - before.catalog.ingredients,
      dishes: after.catalog.dishes - before.catalog.dishes,
      dishIngredients: after.catalog.dishIngredients - before.catalog.dishIngredients,
      slotCoverage: Object.fromEntries(FOOD_SLOTS.map(slot => [
        slot,
        (after.catalog.slotCoverage[slot] || 0) - (before.catalog.slotCoverage[slot] || 0),
      ])),
    },
    failureBreakdownDelta: {
      catalogGapDays: after.failureBreakdown.catalogGapDays - before.failureBreakdown.catalogGapDays,
      otherIssueDays: after.failureBreakdown.otherIssueDays - before.failureBreakdown.otherIssueDays,
    },
    improvedDimensions: improved.length,
    regressedDimensions: regressed.length,
    unchangedDimensions: dimensionDeltas.length - improved.length - regressed.length,
    bestImprovement: improved.sort((a, b) => b.deltaOkDays - a.deltaOkDays || b.deltaPct - a.deltaPct)[0] || null,
    worstRegression: regressed.sort((a, b) => a.deltaOkDays - b.deltaOkDays || a.deltaPct - b.deltaPct)[0] || null,
    dimensionDeltas,
  };
}

function signed(value) {
  return value > 0 ? `+${value}` : String(value);
}

function formatHuman(diff) {
  const lines = [];
  lines.push("=== Diff DIET_CONTRACT por catalogo (REQ-144) ===");
  lines.push(`Antes: ${diff.before.seedPath}`);
  lines.push(`Despues: ${diff.after.seedPath}`);
  lines.push(`Motor: finalizeNutritionDay. Matriz: ${diff.total.totalDays} dias.`);
  lines.push(`Total OK: ${diff.total.beforeOkDays}/${diff.total.totalDays} (${diff.total.beforePct}%) -> ${diff.total.afterOkDays}/${diff.total.totalDays} (${diff.total.afterPct}%) | delta ${signed(diff.total.deltaOkDays)} dias (${signed(diff.total.deltaPct)} pp).`);
  lines.push(`Catalogo: ingredientes ${signed(diff.catalogDelta.ingredients)}, platos ${signed(diff.catalogDelta.dishes)}, recetas ${signed(diff.catalogDelta.dishIngredients)}.`);
  lines.push(`Causas: catalog_gap ${signed(diff.failureBreakdownDelta.catalogGapDays)}, otras ${signed(diff.failureBreakdownDelta.otherIssueDays)}.`);
  lines.push(`Dimensiones: ${diff.improvedDimensions} mejoran, ${diff.regressedDimensions} empeoran, ${diff.unchangedDimensions} sin cambio.`);
  if (diff.bestImprovement) lines.push(`Mayor mejora: ${diff.bestImprovement.label} (${signed(diff.bestImprovement.deltaOkDays)} dias).`);
  if (diff.worstRegression) lines.push(`Mayor regresion: ${diff.worstRegression.label} (${signed(diff.worstRegression.deltaOkDays)} dias).`);
  lines.push("");
  lines.push("Delta por dimension:");
  for (const row of diff.dimensionDeltas) {
    const before = row.before ? `${row.before.okDays}/${row.before.totalDays} (${row.before.pct}%)` : "sin baseline";
    const after = row.after ? `${row.after.okDays}/${row.after.totalDays} (${row.after.pct}%)` : "sin after";
    lines.push(`  ${row.label.padEnd(58)} ${before} -> ${after} | ${signed(row.deltaOkDays)} dias (${signed(row.deltaPct)} pp)`);
  }
  lines.push("diff-diet-contract: comparacion ejecutada.");
  return lines.join("\n");
}

let opts;
try {
  opts = parseArgs(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  console.error(usage());
  process.exit(1);
}

if (opts.help) {
  console.log(usage());
  process.exit(0);
}
if (!opts.before || !opts.after) {
  console.error(usage());
  process.exit(1);
}

const before = measureSeed(opts.before);
const after = measureSeed(opts.after);
const diff = diffReports(before, after);

if (opts.json) console.log(JSON.stringify(diff, null, 2));
else console.log(formatHuman(diff));

if (opts.failOnRegression && diff.total.deltaOkDays < 0) process.exit(1);
