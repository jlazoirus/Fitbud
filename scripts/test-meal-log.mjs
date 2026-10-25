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

console.log("test-meal-log: OK");
