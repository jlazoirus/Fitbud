#!/usr/bin/env node
// REQ-171 — El cierre del día converge también con comidas propuestas por el coach.
// Simula propuestas realistas: platos del seed con nombre inventado (no matchean
// el catálogo por nombre, como pasa con el coach) y gramos desajustados ±30%.
// Mide qué fracción de días queda dentro de la tolerancia de kcal de DIET_CONTRACT
// después de finalizeNutritionDay().
import assert from "node:assert/strict";
import "../js/nutrition-pure.js";
import "../js/nutrition-domain.js";
import { parseCatalog } from "./seed-catalog.mjs";

const d = globalThis.FITBUD_NUTRITION_DOMAIN;
const catalog = parseCatalog();
const MEASURE_ONLY = process.argv.includes("--measure");

function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

const TARGETS = [
  { kcal: 1500, p: 120, c: 150, f: 47 },
  { kcal: 1800, p: 128, c: 207, f: 51 },
  { kcal: 2200, p: 150, c: 250, f: 66 },
  { kcal: 2600, p: 170, c: 310, f: 75 },
];
const MEAL_COUNTS = [3, 4, 5];
const SEEDS = 12;

let days = 0, kcalOk = 0, proposalSlotsKept = 0, proposalSlots = 0;
const deltas = [];
for (const target of TARGETS) {
  for (const mealCount of MEAL_COUNTS) {
    const prefs = { mealCount, mainMealIndex: 2, diet: ["omnivoro"] };
    const slots = d.mealSlotTargets(target, prefs);
    for (let seed = 1; seed <= SEEDS; seed++) {
      const rand = rng(seed * 7919 + mealCount * 31 + target.kcal);
      const proposal = [];
      for (const slot of slots) {
        const pool = d.compatibleDishesForSlot(slot.id, prefs, catalog);
        if (!pool.length) continue;
        const dish = pool[Math.floor(rand() * pool.length)];
        const solved = d.solveDishPortion(dish, slot.target, { catalog });
        if (!solved.ok) continue;
        const factor = 0.7 + rand() * 0.6;
        proposal.push({
          slot_id: slot.id,
          nombre: `Propuesta del coach ${slot.id} ${seed}`,
          ingredientes: solved.ingredients.map(ing => ({ nombre: ing.nombre, gramos: Math.max(5, Math.round(ing.gramos * factor)) })),
        });
      }
      const out = d.finalizeNutritionDay({ prefs, dayTarget: target, catalog, slots, proposal });
      days++;
      proposalSlots += proposal.length;
      proposalSlotsKept += out.comidas.filter(m => String(m.nombre).startsWith("Propuesta del coach")).length;
      const delta = out.totals.kcal - target.kcal;
      deltas.push(Math.abs(delta));
      if (Math.abs(delta) <= d.dietContractTolerance("kcal", target.kcal)) kcalOk++;
    }
  }
}
deltas.sort((a, b) => a - b);
const rate = kcalOk / days;
const keptRate = proposalSlotsKept / Math.max(1, proposalSlots);
const median = deltas[Math.floor(deltas.length / 2)];
const p90 = deltas[Math.floor(deltas.length * 0.9)];
console.log(`Propuestas del coach: ${kcalOk}/${days} días en tolerancia de kcal (${(rate * 100).toFixed(1)}%) · |Δkcal| mediana ${median} · p90 ${p90} · propuestas conservadas ${(keptRate * 100).toFixed(1)}%.`);

if (!MEASURE_ONLY) {
  assert.ok(rate >= 0.9, `≥90% de días con propuestas del coach deben cerrar kcal dentro de contrato (actual ${(rate * 100).toFixed(1)}%)`);
  assert.ok(keptRate >= 0.95, "el cierre ajusta gramos; no debe reemplazar las comidas propuestas");
  console.log("validate-proposal-close: OK");
}
