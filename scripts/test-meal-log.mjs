#!/usr/bin/env node
// Pruebas puras de js/meal-log.js — REQ-266..273.
import assert from "node:assert/strict";
import "../js/meal-log.js";
import "../sync-conflicts.js";

const g = globalThis;
assert.ok(g.FITBUD_MEAL_LOG, "Namespace FITBUD_MEAL_LOG debe existir");

// ── REQ-266: parseo numérico ──────────────────────────────────────────────────
const p = g.parseNutrientInput;
assert.deepEqual(p("12,5"), { ok: true, empty: false, value: 12.5 }, "coma decimal");
assert.deepEqual(p("12.5"), { ok: true, empty: false, value: 12.5 }, "punto decimal");
assert.equal(p(" 33,5 ").value, 33.5, "espacios");
assert.equal(p("0").value, 0, "cero explícito es válido");
assert.equal(p("0").ok, true);
assert.equal(p("").empty, true, "vacío no es cero");
assert.equal(p("   ").empty, true);
assert.equal(p(null).empty, true);
assert.equal(p("-100").error, "negative", "negativo");
assert.equal(p(-1).error, "negative", "negativo programático");
assert.equal(p("abc").ok, false, "texto");
assert.equal(p("1e999").ok, false, "exponente/infinito escrito");
assert.equal(p(Infinity).ok, false, "infinito programático");
assert.equal(p(NaN).ok, false, "NaN programático");
assert.equal(p("1.234,5").ok, false, "dos separadores es ambiguo");
assert.equal(p(",5").value, 0.5, "decimal sin entero");
assert.equal(p(42).value, 42, "número programático");
console.log("  REQ-266: parseo con coma/punto, vacío ≠ 0, sin negativos ni infinitos");

// ── REQ-266: validación de una comida ────────────────────────────────────────
const v = g.validateMealValues;
let r = v({ name: "Yogur", kcal: "-100", p: "-10", c: "5", f: "1" });
assert.equal(r.ok, false);
assert.ok(r.errors.kcal && r.errors.p, "kcal y proteína negativas se rechazan");
assert.equal(r.value, null, "un error no devuelve valores para guardar");
r = v({ name: "Yogur", kcal: "120", p: "", c: "", f: "" });
assert.equal(r.ok, false, "modo completo exige los cuatro campos");
assert.ok(r.errors.p && r.errors.c && r.errors.f && !r.errors.kcal);
r = v({ name: "Yogur", kcal: "120", p: "", c: "", f: "" }, { mode: "kcal_only" });
assert.equal(r.ok, true, "solo calorías");
assert.deepEqual(r.value, { name: "Yogur", kcal: 120, p: 0, c: 0, f: 0, macrosUnknown: true });
r = v({ name: "Yogur", kcal: "", p: "1", c: "1", f: "1" }, { mode: "kcal_only" });
assert.ok(r.errors.kcal, "solo calorías exige kcal");
r = v({ name: "Un vaso de agua", kcal: "0", p: "0", c: "0", f: "0" });
assert.equal(r.ok, true, "ceros explícitos válidos");
assert.deepEqual(r.value, { name: "Un vaso de agua", kcal: 0, p: 0, c: 0, f: 0 });
r = v({ name: "Pan", kcal: "250,5", p: "8,25", c: "45", f: "3" });
assert.equal(r.value.kcal, 250.5);
assert.equal(r.value.p, 8.3, "se guarda con una décima, sin truncar a entero");
r = v({ name: "", kcal: "1", p: "1", c: "1", f: "1" });
assert.ok(r.errors.name, "la descripción es obligatoria");
r = v({ name: "x".repeat(161), kcal: "1", p: "1", c: "1", f: "1" });
assert.ok(r.errors.name, "descripción demasiado larga");
r = v({ name: "Torta", kcal: "6000", p: "1", c: "1", f: "1" });
assert.ok(r.errors.kcal, "por encima del límite por comida");
r = v({ name: "Torta", kcal: "abc", p: "1", c: "1", f: "1" });
assert.ok(/número/.test(r.errors.kcal));
// No exige 4/4/9: 100 kcal con 0/0/0 se acepta (bebidas con alcohol, fibra, etc.).
assert.equal(v({ name: "Vino", kcal: "100", p: "0", c: "0", f: "0" }).ok, true);
console.log("  REQ-266: validación completa / solo calorías, ceros explícitos y límites");

// ── REQ-267: origen y snapshot ────────────────────────────────────────────────
const n = g.normalizeNutritionMeta;
assert.equal(n(null), null);
assert.equal(n({ source: "magia" }), null, "origen desconocido se descarta");
const est = n({ source: "estimate", estimate: { kind: "photo", note: "Supuse 1 taza.", prompt: "NO" }, base: { kcal: 300, p: 10, c: 40, f: 9 }, qty: 1, image: "AAAA" });
assert.deepEqual(est, { v: 1, source: "estimate", base: { kcal: 300, p: 10, c: 40, f: 9, unit: "portion" }, qty: 1, estimate: { kind: "photo", note: "Supuse 1 taza." } }, "sin imagen ni prompt");
assert.equal(n({ source: "manual", base: { kcal: -1, p: 0, c: 0, f: 0 } }).base, undefined, "base negativa se descarta");
assert.equal(n({ source: "estimate", estimate: { kind: "text", note: "x".repeat(500) } }).estimate.note.length, 200, "nota acotada");
assert.deepEqual(g.nutritionMetaFor({ name: "Antiguo", kcal: 10 }), { v: 1, source: "legacy" }, "registro antiguo se lee como legacy sin reescribirse");
// Corregir a mano conserva la base que explica el cálculo.
const fav = { source: "manual", ref: { kind: "saved", name: "Avena" }, base: { kcal: 200, p: 8, c: 30, f: 5 }, qty: 2 };
assert.equal(g.finalizeNutritionMeta(fav, { kcal: 400, p: 16, c: 60, f: 10 }).corrected, undefined, "×2 exacto no es corrección");
const fixed = g.finalizeNutritionMeta(fav, { kcal: 380, p: 16, c: 60, f: 10 });
assert.equal(fixed.corrected, true, "cambiar los totales queda como corrección");
assert.deepEqual(fixed.base, { kcal: 200, p: 8, c: 30, f: 5, unit: "portion" }, "la base se conserva");
assert.equal(fixed.qty, 2);
assert.deepEqual(g.metaComputedValues({ base: { kcal: 389, p: 16.9, c: 66, f: 6.9, unit: "100g" }, qty: 33.5 }).kcal, 389 * 0.335);
assert.equal(g.nutritionMetaLabel(fixed), "Ingresado a mano · favorita «Avena» · porción ×2 · corregido a mano");
assert.equal(g.nutritionMetaLabel(null), "Registro anterior: su origen no se guardó");
assert.equal(g.nutritionMetaLabel(est), "Estimado por tu coach a partir de una foto");
assert.ok(!/IA|modelo|prompt|token/i.test(["manual", "catalog", "estimate", "recipe", "food", "legacy"].map((source) => g.nutritionMetaLabel({ source })).join(" ")), "REQ-31: sin vocabulario técnico");
// La fusión offline conserva el snapshot y su origen.
const sc = g.FITBUD_SYNC_CONFLICTS;
const entry = { _syncId: "x1", name: "Avena", kcal: 400, p: 16, c: 60, f: 10, done: true, nutritionMeta: n(fav) };
const merged = sc.mergeDayLogStates({ meals: {}, extras: [] }, { meals: {}, extras: [entry] }, { meals: {}, extras: [], workoutDone: true });
assert.deepEqual(merged.merged.extras[0].nutritionMeta, n(fav), "merge offline conserva nutritionMeta");
console.log("  REQ-267: contrato nutritionMeta, legacy en lectura, corrección con base y merge offline");

// ── REQ-268: composición ─────────────────────────────────────────────────────
const avena = { kcal: 389, p: 16.9, c: 66, f: 6.9 };
const lines = g.normalizeComponents([
  { name: "Avena", unit: "100g", amount: 33.5, base: avena, ref: { kind: "ingredient", id: "7" } },
  { name: "Avena", unit: "100g", amount: 0.5, base: avena, ref: { kind: "ingredient", id: "7" } },
  { name: "Roto", unit: "100g", amount: -1, base: avena },
  { name: "", unit: "100g", amount: 10, base: avena },
  { name: "Sin base", unit: "100g", amount: 10 },
]);
assert.equal(lines.length, 2, "líneas inválidas se descartan");
const tot = g.componentsTotals(lines);
assert.ok(Math.abs(tot.kcal - 389 * 0.34) < 1e-9, "33,5 g + 0,5 g = 34 g exactos, sin redondear cada línea");
assert.equal(g.componentsName(lines), "Avena 33,5 g + Avena 0,5 g");
assert.equal(g.componentsSource(lines), "catalog");
assert.equal(g.componentsSource([...lines, { name: "Yogur", unit: "portion", amount: 2, base: { kcal: 90, p: 5, c: 10, f: 2 } }]), "manual");
const portion = g.normalizeComponent({ name: "Yogur", unit: "portion", amount: 2, base: { kcal: 90, p: 5, c: 10, f: 2 } });
assert.deepEqual(g.componentValues(portion), { kcal: 180, p: 10, c: 20, f: 4 });
assert.equal(g.componentAmountLabel(portion), "2 porciones");
assert.equal(g.normalizeComponent({ name: "X", unit: "100g", amount: 2500, base: avena }), null, "más de 2000 g se rechaza");
assert.equal(g.normalizeComponents(Array.from({ length: 40 }, () => lines[0])).length, 30, "máximo 30 líneas");
console.log("  REQ-268: líneas con base propia, precisión completa y límites");

// ── REQ-270: copia ────────────────────────────────────────────────────────────
const src = { name: "Café", kcal: 120, p: 6, c: 10, f: 6, done: true, skipped: false, oid: 3, _syncId: "s1", subst: { prev: {} }, portion: 2,
  components: [{ name: "Leche", unit: "100ml", amount: 200, base: { kcal: 60, p: 3, c: 5, f: 3 } }], nutritionMeta: { source: "manual" } };
const copy = g.copyEntrySnapshot(src, { date: "2026-10-24", key: "extra:0" });
assert.deepEqual(Object.keys(copy).sort(), ["c", "components", "copiedFrom", "f", "kcal", "name", "nutritionMeta", "p"], "solo snapshot + procedencia");
copy.components[0].amount = 999;
assert.equal(src.components[0].amount, 200, "editar la copia no toca el origen");
assert.equal(g.copyEntrySnapshot({ name: "", kcal: 1 }), null);
assert.equal(g.copyEntrySnapshot({ name: "X", kcal: -1, p: 0, c: 0, f: 0 }), null);
console.log("  REQ-270: copia con identidad nueva, procedencia y sin estado del origen");

// ── REQ-271: alimentos propios ────────────────────────────────────────────────
const vf = g.validateCustomFoodInput;
let fr = vf({ name: "Yogur", brand: "Gloria", unit: "100g", kcal: "59", p: "10", c: "3,6", f: "0,4", portionLabel: "1 pote", portionAmount: "125" });
assert.deepEqual(fr.value, { name: "Yogur", unit: "100g", base: { kcal: 59, p: 10, c: 3.6, f: 0.4 }, brand: "Gloria", portion: { label: "1 pote", amount: 125 } });
fr = vf({ name: "Barra", unit: "portion", kcal: "120", p: "2", c: "20", f: "3", portionLabel: "1 barra", portionAmount: "40" });
assert.deepEqual(fr.value.portion, { label: "1 barra" }, "por porción no guarda gramos aunque se escriban");
assert.ok(vf({ name: "Barra", unit: "portion", kcal: "1", p: "1", c: "1", f: "1" }).errors.portionLabel, "por porción exige describirla");
assert.ok(vf({ name: "X", unit: "100g", kcal: "950", p: "1", c: "1", f: "1" }).errors.kcal, "más de 900 kcal/100 g no es plausible");
assert.ok(vf({ name: "X", unit: "100g", kcal: "500", p: "50", c: "40", f: "20" }).errors.f, "macros que suman más de 100 g/100 g");
assert.ok(vf({ name: "X", unit: "100g", kcal: "5", p: "", c: "1", f: "1" }).errors.p, "vacío no es cero");
assert.ok(vf({ name: "X", unit: "100g", kcal: "5", p: "1", c: "1", f: "1", portionLabel: "1 vaso" }).errors.portionAmount, "equivalencia a medias");
assert.ok(vf({ name: "", unit: "kg", kcal: "5", p: "1", c: "1", f: "1" }).errors.unit);
const fA = { id: "faaaa1", name: "A", unit: "100g", base: { kcal: 1, p: 0, c: 0, f: 0 }, version: 1, updatedAt: "2026-10-01T00:00:00Z" };
const fA2 = { ...fA, version: 2, base: { kcal: 2, p: 0, c: 0, f: 0 } };
const fB = { ...fA, id: "fbbbb1", name: "B" };
let merged2 = g.mergeCustomFoods([fA2, fB], [fA], []);
assert.deepEqual(merged2.map((f) => [f.id, f.version]), [["faaaa1", 2], ["fbbbb1", 1]], "gana la versión más alta y no se pierde lo del otro dispositivo");
merged2 = g.mergeCustomFoods([fA, fB], [fB], ["faaaa1"]);
assert.deepEqual(merged2.map((f) => f.id), ["fbbbb1"], "un borrado no resucita");
assert.equal(g.normalizedCustomFoods(Array.from({ length: 120 }, (_, i) => ({ ...fA, id: "f" + String(i).padStart(5, "0") }))).length, 100, "máximo 100 alimentos");
assert.equal(g.normalizeCustomFood({ ...fA, id: "a b" }), null, "id inválido");
console.log("  REQ-271: validación de etiqueta, porción sin peso, límites y fusión entre dispositivos");

// ── REQ-272: recetas ──────────────────────────────────────────────────────────
const arroz = { name: "Arroz", unit: "100g", amount: 400, base: { kcal: 130, p: 2.7, c: 28, f: 0.3 }, ref: { kind: "ingredient", id: "6" } };
const pollo = { name: "Pollo", unit: "100g", amount: 600, base: { kcal: 165, p: 31, c: 0, f: 3.6 }, ref: { kind: "ingredient", id: "1" } };
let rv = g.validateRecipeInput({ name: "Arroz con pollo", lines: [arroz, pollo], servings: "4", weight: "1200", steps: "Cocer." });
assert.equal(rv.ok, true);
assert.deepEqual(rv.value.yield, { servings: 4, weight: 1200 });
assert.ok(g.validateRecipeInput({ name: "X", lines: [arroz] }).errors.servings, "exige rendimiento");
assert.ok(g.validateRecipeInput({ name: "X", lines: [], servings: "2" }).errors.lines, "exige ingredientes");
assert.ok(g.validateRecipeInput({ name: "X", lines: [{ ...arroz, ref: undefined }], servings: "2" }).errors.lines, "solo catálogo o alimentos propios");
assert.ok(g.validateRecipeInput({ name: "X", lines: Array.from({ length: 31 }, () => arroz), servings: "2" }).errors.lines, "máximo 30 líneas");
assert.ok(g.validateRecipeInput({ name: "X", lines: [arroz], servings: "0" }).errors.servings);
const recipe = { id: "rtest01", version: 1, ...rv.value };
const perServing = g.recipeBase(recipe, "portion");
assert.ok(Math.abs(perServing.kcal - (520 + 990) / 4) < 1e-6, "por porción = total / porciones");
assert.ok(Math.abs(g.recipeBase(recipe, "100g").kcal - 1510 / 12) < 1e-6, "por 100 g del peso final cocinado, no del crudo");
assert.equal(g.recipeBase({ ...recipe, yield: { servings: 4 } }, "100g"), null, "sin peso final no se registra por gramos");
const r2 = { ...recipe, version: 2, yield: { servings: 2 } };
assert.deepEqual(g.mergeCustomRecipes([recipe], [r2], []).map((r) => r.version), [2]);
assert.deepEqual(g.mergeCustomRecipes([recipe], [], ["rtest01"]), []);
console.log("  REQ-272: validación, rendimiento por porción/peso final y fusión");

// ── REQ-273: GTIN ─────────────────────────────────────────────────────────────
assert.deepEqual(g.parseGtin("4006381333931"), { ok: true, value: "4006381333931" }, "EAN-13 válido");
assert.equal(g.parseGtin("036000291452").ok, true, "UPC-A (GTIN-12)");
assert.equal(g.parseGtin("96385074").ok, true, "EAN-8");
assert.equal(g.parseGtin("00012345600012").ok, true, "GTIN-14");
assert.equal(g.parseGtin("4006381333932").error, "check", "dígito de control");
assert.equal(g.parseGtin("12345").error, "length");
assert.equal(g.parseGtin("40063813339a1").error, "format");
assert.equal(g.parseGtin("").empty, true);
assert.equal(g.normalizeGtin(" 0036000-291452 "), "0036000291452", "conserva ceros, quita espacios y guiones");
assert.ok(g.sameGtin("036000291452", "0036000291452"), "UPC-A leído como EAN-13 es la misma presentación");
assert.ok(!g.sameGtin("4006381333931", "96385074"));
assert.ok(!g.sameGtin("", ""), "vacío nunca coincide");
assert.equal(vf({ name: "Y", unit: "100g", kcal: "1", p: "1", c: "1", f: "1", gtin: "4006381333931" }).value.gtin, "4006381333931");
assert.ok(vf({ name: "Y", unit: "100g", kcal: "1", p: "1", c: "1", f: "1", gtin: "4006381333932" }).errors.gtin);
assert.equal(g.normalizeCustomFood({ ...fA, gtin: "bad" }).gtin, undefined, "un código inválido no se guarda");
console.log("  REQ-273: GTIN-8/12/13/14, dígito de control, ceros y presentaciones");

console.log("test-meal-log: OK");
