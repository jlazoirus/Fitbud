import assert from "node:assert/strict";
import "../js/nutrition-domain.js";

const { analyzeIntakeDays } = globalThis.FITBUD_NUTRITION_DOMAIN;
const target = { kcal: 2000, p: 125, c: 235, f: 65 };
const slots = [{ id: "desayuno", slot: "Desayuno" }, { id: "merienda", slot: "Merienda" }];
const breakfast = { slot_id: "desayuno", nombre: "Avena", kcal: 350, p: 12,
  ingredientes: [{ ingredient_id: 1, grams: 80 }] };
const snack = { slot_id: "merienda", nombre: "Lentejas", kcal: 200, p: 14 };
const catalog = { ingredients: [
  { id: 1, name: "Avena", kcal: 375, protein_g: 12 },
  { id: 2, name: "Pollo", kcal: 165, protein_g: 31 },
  { id: 3, name: "Lentejas", kcal: 135, protein_g: 33 },
] };
const rows = Array.from({ length: 3 }, (_, i) => ({
  totals: { kcal: 1200 + i * 100, p: 60, c: 150, f: 40 },
  meals: i === 0 ? [breakfast, snack] : [breakfast],
}));
const result = analyzeIntakeDays(rows, target, slots, { prefs: { diet: ["vegano"] }, catalog });
assert.deepEqual(result.average, { kcal: 1300, p: 60, c: 150, f: 40 });
assert.equal(result.bySlot[0].repeated, "Avena");
assert.equal(result.bySlot[1].missed, 2);
assert.equal(result.highlight.label, "Desayuno");
assert.equal(result.changes.length, 3);
assert.equal(result.changes.find(change => change.type === "add").ingredient, "Lentejas");
assert.equal(result.changes.find(change => change.type === "portion").grams, 20);
assert.equal(result.changes.find(change => change.type === "fill").dish, "Lentejas");
assert.deepEqual(analyzeIntakeDays(rows.map(row => ({ ...row, totals: target })), target, slots).changes, []);
assert.deepEqual(analyzeIntakeDays([], target, slots).changes, []);
const manual = rows.map(row => ({ ...row, totals: { ...target, kcal: 2500 },
  meals: [{ ...breakfast, ingredientes: [] }] }));
assert.equal(analyzeIntakeDays(manual, target, slots).changes[0].factor, 0.75);
const swapRows = [
  ...manual.slice(0, 2),
  { totals: manual[0].totals, meals: [{ slot_id: "desayuno", nombre: "Fruta", dishSlug: "fruta", kcal: 120, p: 2 }] },
];
assert.equal(analyzeIntakeDays(swapRows, { ...target, p: 0 }, slots).changes.find(change => change.type === "swap").replacement, "Fruta");
console.log("Análisis de registros, restricciones y sugerencias: OK");
