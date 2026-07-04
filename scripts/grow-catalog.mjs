#!/usr/bin/env node
// REQ-134: pipeline offline para crecer el catalogo nutricional.
// No toca produccion. Genera un SQL revisable + reporte desde un fixture o desde Anthropic local/CI.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import "../js/nutrition-pure.js";
import "../js/nutrition-domain.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const VALID_SLOTS = new Set(["desayuno", "media_manana", "almuerzo", "merienda", "snack", "cena", "recena", "batido"]);
const VALID_DIET_TAGS = new Set(["vegetariano", "vegano", "omnivoro"]);
const VALID_CUISINE_TAGS = new Set(["criolla", "mediterranea", "mexicana", "asiatica"]);
const VALID_WEIGHT = new Set(["light", "medium", "heavy"]);
const VALID_FORM = new Set(["bowl", "sandwich", "shake", "plated", "soup", "snack"]);
const VALID_BUDGET = new Set(["low", "medium", "flexible"]);
const SLOT_TARGETS = {
  desayuno: { kcal: 430, p: 30, c: 50, f: 14 },
  media_manana: { kcal: 220, p: 18, c: 24, f: 7 },
  almuerzo: { kcal: 680, p: 45, c: 78, f: 21 },
  merienda: { kcal: 220, p: 18, c: 24, f: 7 },
  snack: { kcal: 240, p: 20, c: 26, f: 8 },
  cena: { kcal: 540, p: 38, c: 48, f: 20 },
  recena: { kcal: 180, p: 18, c: 12, f: 6 },
  batido: { kcal: 260, p: 30, c: 24, f: 5 },
};

const domain = globalThis.FITBUD_NUTRITION_DOMAIN;
if (!domain || typeof domain.solveDishPortion !== "function") {
  throw new Error("FITBUD_NUTRITION_DOMAIN.solveDishPortion no esta disponible.");
}

function parseArgs(argv) {
  const out = { brief: "", fixture: "", outDir: "", limit: 20 };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--brief") out.brief = argv[++i] || "";
    else if (arg === "--fixture") out.fixture = argv[++i] || "";
    else if (arg === "--out-dir") out.outDir = argv[++i] || "";
    else if (arg === "--limit") out.limit = Math.max(1, Number.parseInt(argv[++i], 10) || out.limit);
    else if (arg === "--help" || arg === "-h") out.help = true;
  }
  return out;
}

function usage() {
  return `Uso:
  node scripts/grow-catalog.mjs --brief "10 desayunos ligeros omnivoros" --out-dir /tmp/catalog-growth
  node scripts/grow-catalog.mjs --fixture fixture.json --out-dir /tmp/catalog-growth

Variables:
  ANTHROPIC_API_KEY              Requerida solo sin --fixture
  ANTHROPIC_MODEL_CATALOG        Opcional, default ${DEFAULT_MODEL}
`;
}

function sqlString(value) {
  return String(value == null ? "" : value).replace(/'/g, "''");
}

function sqlComment(value) {
  return sqlString(value || "(fixture)").replace(/\s+/g, " ").slice(0, 500);
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function arr(value) {
  return Array.isArray(value) ? value.map((item) => String(item || "").trim()).filter(Boolean) : [];
}

function parseBool(value) {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return null;
}

function num(value, fallback = NaN) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function section(seed, start, end) {
  const i = seed.indexOf(start);
  if (i < 0) throw new Error("No se encontro seccion " + start);
  const j = seed.indexOf(end, i);
  if (j < 0) throw new Error("No se encontro fin " + end);
  return seed.slice(i, j);
}

function parseCatalog() {
  const seed = readFileSync(join(ROOT, "supabase", "seed.sql"), "utf8");
  const ingredients = [];
  const ingredientsByName = new Map();
  const ingSec = section(seed, "insert into ingredients", "-- ---------- PLATOS");
  const ingRe = /\('((?:[^']|'')*)','((?:[^']|'')*)',\s*([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\)/g;
  let m;
  while ((m = ingRe.exec(ingSec))) {
    const row = {
      id: ingredients.length + 1,
      name: m[1].replace(/''/g, "'"),
      category: m[2].replace(/''/g, "'"),
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
    const row = {
      id: dishes.length + 1,
      name: m[1].replace(/''/g, "'"),
      slot: m[2],
      menu: m[3] === "null" ? null : m[4].replace(/''/g, "'"),
    };
    row.slug = slugify(row.name);
    row.compatible_slots = [row.slot];
    row.diet_tags = ["omnivoro"];
    row.cuisine_tags = [];
    row.meal_weight = row.slot === "almuerzo" ? "heavy" : row.slot === "snack" ? "light" : "medium";
    row.meal_form = row.slot === "snack" ? "snack" : "plated";
    dishes.push(row);
    dishesByName.set(row.name, row);
  }

  const dishIng = [];
  const recSec = section(seed, "insert into dish_ingredients", "-- ---------- DIETAS");
  const recRe = /\('((?:[^']|'')*)','((?:[^']|'')*)',\s*([\d.]+)\)/g;
  while ((m = recRe.exec(recSec))) {
    const dish = dishesByName.get(m[1].replace(/''/g, "'"));
    const ingredient = ingredientsByName.get(m[2].replace(/''/g, "'"));
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

  return {
    ingredients,
    dishes,
    dishIng,
    ingredientSlugs: new Set(ingredients.map((item) => item.slug)),
    dishSlugs: new Set(dishes.map((item) => item.slug)),
  };
}

function normalizePayload(raw) {
  const payload = raw && raw.candidates ? raw.candidates : raw || {};
  return {
    ingredients: Array.isArray(payload.ingredients) ? payload.ingredients : [],
    dishes: Array.isArray(payload.dishes) ? payload.dishes : Array.isArray(payload.recipes) ? payload.recipes : [],
  };
}

function ingredientReason(candidate, catalog) {
  const expectedSlug = slugify(candidate.name);
  const rawSlug = String(candidate.slug || expectedSlug).trim();
  const slug = slugify(rawSlug);
  if (!expectedSlug || !slug || rawSlug !== expectedSlug || slug !== expectedSlug) return "ingredient_slug_not_stable";
  if (!String(candidate.name || "").trim()) return "ingredient_name_required";
  if (!String(candidate.category || "").trim()) return "ingredient_category_required";
  const kcal = num(candidate.kcal);
  const p = num(candidate.protein_g);
  const c = num(candidate.carbs_g);
  const f = num(candidate.fat_g);
  if (![kcal, p, c, f].every(Number.isFinite)) return "ingredient_macros_required";
  if (kcal < 0 || kcal > 950 || p < 0 || p > 95 || c < 0 || c > 100 || f < 0 || f > 100) return "ingredient_macro_out_of_range";
  const macroKcal = p * 4 + c * 4 + f * 9;
  if (Math.abs(kcal - macroKcal) > Math.max(35, kcal * 0.25)) return "ingredient_macro_inconsistent";
  if (!catalog.ingredientSlugs.has(slug) && !String(candidate.source || "").trim()) return "ingredient_source_required";
  return "";
}

function normalizeIngredient(candidate) {
  return {
    slug: slugify(candidate.slug || candidate.name),
    name: String(candidate.name || "").trim(),
    category: String(candidate.category || "").trim(),
    kcal: num(candidate.kcal),
    protein_g: num(candidate.protein_g),
    carbs_g: num(candidate.carbs_g),
    fat_g: num(candidate.fat_g),
    source: String(candidate.source || "").trim(),
  };
}

function normalizeDish(candidate) {
  const ingredients = Array.isArray(candidate.ingredients) ? candidate.ingredients : Array.isArray(candidate.lines) ? candidate.lines : [];
  return {
    slug: slugify(candidate.slug || candidate.name),
    name: String(candidate.name || "").trim(),
    slot: String(candidate.slot || arr(candidate.compatible_slots)[0] || "snack").trim(),
    compatible_slots: arr(candidate.compatible_slots),
    diet_tags: arr(candidate.diet_tags),
    cuisine_tags: arr(candidate.cuisine_tags),
    meal_weight: String(candidate.meal_weight || "").trim(),
    meal_form: String(candidate.meal_form || "").trim(),
    prep_minutes: num(candidate.prep_minutes),
    budget_tier: String(candidate.budget_tier || "").trim(),
    needs_kitchen: parseBool(candidate.needs_kitchen),
    eat_out_ok: parseBool(candidate.eat_out_ok),
    ingredients: ingredients.map((line) => ({
      ingredient_slug: slugify(line.ingredient_slug || line.ingredientSlug || line.slug || line.name),
      grams: num(line.grams != null ? line.grams : line.gramos),
      scalable: line.scalable !== false && line.scalable !== "false",
      min_g: num(line.min_g != null ? line.min_g : line.minG),
      max_g: num(line.max_g != null ? line.max_g : line.maxG),
      step_g: num(line.step_g != null ? line.step_g : line.stepG, 5),
    })),
  };
}

function dishMetadataReasons(dish, ingredientSlugs, catalog) {
  const reasons = [];
  if (!dish.slug || dish.slug !== slugify(dish.name)) reasons.push("dish_slug_not_stable");
  if (!dish.name) reasons.push("dish_name_required");
  if (catalog.dishSlugs.has(dish.slug)) reasons.push("dish_duplicate_slug");
  if (!VALID_SLOTS.has(dish.slot)) reasons.push("dish_slot_invalid");
  if (!dish.compatible_slots.length || dish.compatible_slots.some((slot) => !VALID_SLOTS.has(slot))) reasons.push("compatible_slots_invalid");
  if (!dish.diet_tags.length || dish.diet_tags.some((tag) => !VALID_DIET_TAGS.has(tag))) reasons.push("diet_tags_invalid");
  if (!dish.cuisine_tags.length || dish.cuisine_tags.some((tag) => !VALID_CUISINE_TAGS.has(tag))) reasons.push("cuisine_tags_invalid");
  if (!VALID_WEIGHT.has(dish.meal_weight)) reasons.push("meal_weight_invalid");
  if (!VALID_FORM.has(dish.meal_form)) reasons.push("meal_form_invalid");
  if (!Number.isInteger(dish.prep_minutes) || dish.prep_minutes < 1 || dish.prep_minutes > 180) reasons.push("prep_minutes_invalid");
  if (!VALID_BUDGET.has(dish.budget_tier)) reasons.push("budget_tier_invalid");
  if (typeof dish.needs_kitchen !== "boolean" || typeof dish.eat_out_ok !== "boolean") reasons.push("boolean_metadata_invalid");
  if (!dish.ingredients.length) reasons.push("dish_ingredients_required");
  for (const line of dish.ingredients) {
    if (!ingredientSlugs.has(line.ingredient_slug)) reasons.push("ingredient_slug_unknown:" + line.ingredient_slug);
    if (!(line.grams > 0)) reasons.push("ingredient_grams_invalid:" + line.ingredient_slug);
    if (!(line.min_g > 0) || !(line.max_g >= line.min_g) || !(line.step_g > 0)) reasons.push("scaling_limits_invalid:" + line.ingredient_slug);
    if (line.grams < line.min_g || line.grams > line.max_g) reasons.push("grams_outside_scaling_limits:" + line.ingredient_slug);
  }
  return [...new Set(reasons)];
}

function candidateCatalog(catalog, ingredients, dish) {
  const allIngredients = catalog.ingredients.concat(ingredients.map((ing, i) => ({ ...ing, id: 100000 + i })));
  const allDishes = catalog.dishes.concat([{ ...dish, id: 200000 }]);
  const bySlug = new Map(allIngredients.map((ing) => [ing.slug, ing]));
  const dishIng = catalog.dishIng.concat(dish.ingredients.map((line) => ({
    dish_id: 200000,
    ingredient_id: bySlug.get(line.ingredient_slug)?.id,
    grams: line.grams,
    scalable: line.scalable,
    min_g: line.min_g,
    max_g: line.max_g,
    step_g: line.step_g,
  })));
  return { ingredients: allIngredients, dishes: allDishes, dishIng };
}

function fitReasons(catalog, acceptedIngredients, dish) {
  const testCatalog = candidateCatalog(catalog, acceptedIngredients, dish);
  const testDish = testCatalog.dishes.find((item) => item.slug === dish.slug);
  const failures = [];
  for (const slot of dish.compatible_slots) {
    const target = SLOT_TARGETS[slot] || SLOT_TARGETS.snack;
    const solved = domain.solveDishPortion(testDish, target, { catalog: testCatalog });
    if (!solved.ok) {
      failures.push(slot + ":" + solved.no_solution);
      continue;
    }
    const kcalMiss = Math.abs(solved.residual.kcal) / Math.max(1, target.kcal);
    const proteinMiss = Math.abs(solved.residual.p) / Math.max(1, target.p);
    if (kcalMiss > 0.45 || proteinMiss > 0.65) failures.push(slot + ":portion_fit_out_of_range");
  }
  return failures.length ? ["dish_does_not_scale_for_slot:" + failures.join(",")] : [];
}

function validateCandidates(payload, catalog) {
  const acceptedIngredients = [];
  const rejected = [];
  for (const raw of payload.ingredients) {
    const reason = ingredientReason(raw, catalog);
    const ing = normalizeIngredient(raw);
    if (reason) rejected.push({ type: "ingredient", slug: ing.slug || slugify(raw.name), name: raw.name || "", reasons: [reason] });
    else if (!catalog.ingredientSlugs.has(ing.slug) && !acceptedIngredients.some((item) => item.slug === ing.slug)) acceptedIngredients.push(ing);
  }

  const ingredientSlugs = new Set([...catalog.ingredientSlugs, ...acceptedIngredients.map((item) => item.slug)]);
  const acceptedDishes = [];
  for (const raw of payload.dishes) {
    const dish = normalizeDish(raw);
    const reasons = dishMetadataReasons(dish, ingredientSlugs, catalog);
    if (!reasons.length) reasons.push(...fitReasons(catalog, acceptedIngredients, dish));
    if (reasons.length) rejected.push({ type: "dish", slug: dish.slug, name: dish.name, reasons });
    else acceptedDishes.push(dish);
  }
  return { acceptedIngredients, acceptedDishes, rejected };
}

function sqlArray(values) {
  return "array[" + values.map((value) => "'" + sqlString(value) + "'").join(",") + "]::text[]";
}

function generateSql(result, brief) {
  const lines = [
    "-- Fitbud catalog growth patch (REQ-134)",
    "-- Generated offline. Review before applying manually in Supabase.",
    "-- Brief: " + sqlComment(brief),
    "begin;",
    "",
  ];
  if (result.acceptedIngredients.length) {
    lines.push("insert into ingredients (name, category, kcal, protein_g, carbs_g, fat_g, slug) values");
    lines.push(result.acceptedIngredients.map((ing) =>
      `('${sqlString(ing.name)}','${sqlString(ing.category)}',${ing.kcal},${ing.protein_g},${ing.carbs_g},${ing.fat_g},'${sqlString(ing.slug)}')`
    ).join(",\n") + "\n" +
      "on conflict (slug) do update set\n" +
      "  name = excluded.name,\n  category = excluded.category,\n  kcal = excluded.kcal,\n  protein_g = excluded.protein_g,\n  carbs_g = excluded.carbs_g,\n  fat_g = excluded.fat_g;");
    lines.push("");
  }
  if (result.acceptedDishes.length) {
    lines.push("insert into dishes (name, slot, menu, slug, compatible_slots, diet_tags, cuisine_tags, prep_minutes, budget_tier, needs_kitchen, eat_out_ok, meal_weight, meal_form) values");
    lines.push(result.acceptedDishes.map((dish) =>
      `('${sqlString(dish.name)}','${sqlString(dish.slot)}',null,'${sqlString(dish.slug)}',${sqlArray(dish.compatible_slots)},${sqlArray(dish.diet_tags)},${sqlArray(dish.cuisine_tags)},${dish.prep_minutes},'${sqlString(dish.budget_tier)}',${dish.needs_kitchen},${dish.eat_out_ok},'${sqlString(dish.meal_weight)}','${sqlString(dish.meal_form)}')`
    ).join(",\n") + "\n" +
      "on conflict (slug) do update set\n" +
      "  name = excluded.name,\n  slot = excluded.slot,\n  compatible_slots = excluded.compatible_slots,\n  diet_tags = excluded.diet_tags,\n  cuisine_tags = excluded.cuisine_tags,\n  prep_minutes = excluded.prep_minutes,\n  budget_tier = excluded.budget_tier,\n  needs_kitchen = excluded.needs_kitchen,\n  eat_out_ok = excluded.eat_out_ok,\n  meal_weight = excluded.meal_weight,\n  meal_form = excluded.meal_form;");
    lines.push("");
    lines.push("delete from dish_ingredients di");
    lines.push("using dishes d");
    lines.push("where di.dish_id = d.id");
    lines.push("  and d.slug in (" + result.acceptedDishes.map((dish) => "'" + sqlString(dish.slug) + "'").join(",") + ");");
    lines.push("");
    lines.push("insert into dish_ingredients (dish_id, ingredient_id, grams, scalable, min_g, max_g, step_g)");
    const selects = [];
    for (const dish of result.acceptedDishes) {
      for (const line of dish.ingredients) {
        selects.push(`select d.id, i.id, ${line.grams}, ${line.scalable}, ${line.min_g}, ${line.max_g}, ${line.step_g} from dishes d join ingredients i on i.slug = '${sqlString(line.ingredient_slug)}' where d.slug = '${sqlString(dish.slug)}'`);
      }
    }
    lines.push(selects.join("\nunion all\n") + ";");
    lines.push("");
  }
  lines.push("commit;");
  return lines.join("\n") + "\n";
}

function outputPaths(outDir) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return {
    sql: join(outDir, `catalog-growth-${stamp}.sql`),
    report: join(outDir, `catalog-growth-${stamp}.report.json`),
  };
}

async function callAnthropic(brief, limit) {
  const key = process.env.ANTHROPIC_API_KEY || "";
  if (!key) throw new Error("ANTHROPIC_API_KEY requerido cuando no usas --fixture.");
  const model = process.env.ANTHROPIC_MODEL_CATALOG || process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  const prompt = `Propón hasta ${limit} recetas para crecer el catálogo Fitbud. Brief: ${brief}.
Responde SOLO JSON con:
{"ingredients":[{"slug":"","name":"","category":"","kcal":0,"protein_g":0,"carbs_g":0,"fat_g":0,"source":""}],"dishes":[{"slug":"","name":"","slot":"","compatible_slots":[],"diet_tags":[],"cuisine_tags":[],"meal_weight":"","meal_form":"","prep_minutes":0,"budget_tier":"","needs_kitchen":false,"eat_out_ok":false,"ingredients":[{"ingredient_slug":"","grams":0,"scalable":true,"min_g":0,"max_g":0,"step_g":5}]}]}
Usa slugs estables en español sin tildes, fuentes nutricionales anotadas para ingredientes nuevos y metadata completa.`;
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
      output_config: { format: { type: "json_schema", schema: catalogOutputSchema() } },
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((data.error && data.error.message) || data.message || `Anthropic ${response.status}`);
  return JSON.parse((data.content && data.content[0] && data.content[0].text) || "{}");
}

function catalogOutputSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      ingredients: { type: "array", items: { type: "object", additionalProperties: true } },
      dishes: { type: "array", items: { type: "object", additionalProperties: true } },
    },
    required: ["ingredients", "dishes"],
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }
  if (!args.fixture && !args.brief) throw new Error("Debes pasar --brief o --fixture.\n" + usage());
  const outDir = resolve(args.outDir || join(process.env.TMPDIR || "/tmp", "fitbud-catalog-growth"));
  mkdirSync(outDir, { recursive: true });
  const raw = args.fixture
    ? JSON.parse(readFileSync(resolve(args.fixture), "utf8"))
    : await callAnthropic(args.brief, args.limit);
  const catalog = parseCatalog();
  const result = validateCandidates(normalizePayload(raw), catalog);
  const paths = outputPaths(outDir);
  const report = {
    brief: args.brief || raw.brief || "(fixture)",
    generatedAt: new Date().toISOString(),
    accepted: {
      ingredients: result.acceptedIngredients,
      dishes: result.acceptedDishes.map((dish) => ({ ...dish, ingredients: dish.ingredients })),
    },
    rejected: result.rejected,
    output: paths,
  };
  writeFileSync(paths.sql, generateSql(result, report.brief));
  writeFileSync(paths.report, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({
    acceptedIngredients: result.acceptedIngredients.length,
    acceptedDishes: result.acceptedDishes.length,
    rejected: result.rejected.length,
    sql: paths.sql,
    report: paths.report,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
