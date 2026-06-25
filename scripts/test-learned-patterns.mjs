#!/usr/bin/env node
// REQ-63: Tests unitarios para recentNutritionAdherence y extractLearnedPatterns.
// Las funciones se re-implementan aquí en forma pura para poder testearlas sin browser globals.
import assert from "node:assert/strict";

// ── Re-implementaciones puras (misma lógica que en index.html) ────────────────

const START = "2026-01-01";

function addDays(ds, n) {
  const d = new Date(ds + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// nutritionDayDone: ≥50 % de slots marcados done:true en el día.
function nutritionDayDone(ds, daySlots, days) {
  const st = days[ds];
  if (!st || !st.meals) return false;
  const ids = daySlots[ds] || [];
  if (!ids.length) return false;
  const done = ids.filter(id => st.meals[id] && st.meals[id].done).length;
  return done >= Math.ceil(ids.length / 2);
}

function recentNutritionAdherence(ds, daySlots, days) {
  let count = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(ds, -i);
    if (d < START) break;
    if (nutritionDayDone(d, daySlots, days)) count++;
  }
  return count >= 5;
}

function extractLearnedPatterns(ds, days, daySlots, windowDays = 14) {
  const ingFreq = {}, mealFreq = {};
  for (let i = 0; i < windowDays; i++) {
    const d = addDays(ds, -i);
    if (d < START) break;
    const st = days[d];
    if (!st || !st.meals) continue;
    const ids = daySlots[d] || [];
    ids.forEach(id => {
      const ms = st.meals[id];
      if (!ms || !ms.done) return;
      const o = ms.ovr;
      if (!o) return;
      if (o.name) { const k = o.name.trim(); if (k) mealFreq[k] = (mealFreq[k] || 0) + 1; }
      if (Array.isArray(o.ingredientes)) {
        o.ingredientes.forEach(x => {
          const k = (x.nombre || x.name || "").trim();
          if (k) ingFreq[k] = (ingFreq[k] || 0) + 1;
        });
      }
    });
  }
  const topIngredients = Object.entries(ingFreq).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k]) => k);
  const topMealNames = Object.entries(mealFreq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);
  return { topIngredients, topMealNames, detectedAt: ds, windowDays };
}

// ── Helpers de fixtures ───────────────────────────────────────────────────────

function makeDays(ds, count, done) {
  const days = {};
  const daySlots = {};
  for (let i = 0; i < count; i++) {
    const d = addDays(ds, -i);
    daySlots[d] = ["desayuno", "almuerzo", "cena"];
    days[d] = {
      meals: {
        desayuno: { done: done[i] !== false },
        almuerzo: { done: done[i] !== false },
        cena:     { done: done[i] !== false },
      },
    };
  }
  return { days, daySlots };
}

// ── Tests: recentNutritionAdherence ─────────────────────────────────────────

const today = "2026-06-25";

// 7 días todos cumplidos → true
{
  const { days, daySlots } = makeDays(today, 7, [true, true, true, true, true, true, true]);
  assert.equal(recentNutritionAdherence(today, daySlots, days), true, "7/7 debe ser true");
}

// Exactamente 5 de 7 cumplidos → true
{
  const { days, daySlots } = makeDays(today, 7, [true, true, true, true, true, false, false]);
  assert.equal(recentNutritionAdherence(today, daySlots, days), true, "5/7 debe ser true");
}

// Solo 4 de 7 cumplidos → false
{
  const { days, daySlots } = makeDays(today, 7, [true, true, true, true, false, false, false]);
  assert.equal(recentNutritionAdherence(today, daySlots, days), false, "4/7 debe ser false");
}

// 0 de 7 cumplidos → false
{
  const { days, daySlots } = makeDays(today, 7, [false, false, false, false, false, false, false]);
  assert.equal(recentNutritionAdherence(today, daySlots, days), false, "0/7 debe ser false");
}

// Días sin datos (no hay entrada en days) cuentan como no cumplidos
{
  const { days, daySlots } = makeDays(today, 3, [true, true, true]);
  // Sólo 3 días tienen datos → cuenta 3 cumplidos, 4 vacíos → false
  assert.equal(recentNutritionAdherence(today, daySlots, days), false, "3 días con datos y 4 vacíos debe ser false");
}

// 6 de 7 cumplidos (uno falla) → true
{
  const { days, daySlots } = makeDays(today, 7, [true, true, true, true, true, true, false]);
  assert.equal(recentNutritionAdherence(today, daySlots, days), true, "6/7 debe ser true");
}

// Solo 50% de slots marcados cuentan como día cumplido (≥ceil(3/2)=2 de 3)
{
  const ds = today;
  const daySlots = { [ds]: ["desayuno", "almuerzo", "cena"] };
  const days = {
    [ds]: { meals: { desayuno: { done: true }, almuerzo: { done: true }, cena: { done: false } } },
  };
  // Fabricar los 6 días anteriores como todos cumplidos
  for (let i = 1; i < 7; i++) {
    const d = addDays(ds, -i);
    daySlots[d] = ["desayuno", "almuerzo", "cena"];
    days[d] = { meals: { desayuno: { done: true }, almuerzo: { done: true }, cena: { done: true } } };
  }
  assert.equal(recentNutritionAdherence(ds, daySlots, days), true, "2/3 slots done en un día = día cumplido");
}

// ── Tests: extractLearnedPatterns ────────────────────────────────────────────

// Ingredientes y platos aparecen con ovr en comidas done:true
{
  const ds = today;
  const daySlots = {};
  const days = {};
  const names = ["Bowl de avena", "Pollo con arroz", "Ensalada mediterránea"];
  const ingsets = [
    [{ nombre: "Avena" }, { nombre: "Plátano" }],
    [{ nombre: "Pollo" }, { nombre: "Arroz" }],
    [{ nombre: "Tomate" }, { nombre: "Avena" }],
  ];
  for (let i = 0; i < 3; i++) {
    const d = addDays(ds, -i);
    daySlots[d] = ["almuerzo"];
    days[d] = {
      meals: {
        almuerzo: {
          done: true,
          ovr: { name: names[i], ingredientes: ingsets[i].map(x => ({ nombre: x.nombre, gramos: 100 })) },
        },
      },
    };
  }
  const result = extractLearnedPatterns(ds, days, daySlots, 14);
  assert.ok(result.topIngredients.includes("Avena"), "Avena aparece 2 veces, debe estar en top");
  assert.ok(result.topMealNames.length === 3, "3 platos distintos");
  assert.equal(result.detectedAt, ds, "detectedAt debe ser ds");
  assert.equal(result.windowDays, 14, "windowDays debe ser 14");
}

// Sin comidas done:true → listas vacías
{
  const ds = today;
  const daySlots = { [ds]: ["almuerzo"] };
  const days = {
    [ds]: {
      meals: {
        almuerzo: { done: false, ovr: { name: "Algo", ingredientes: [{ nombre: "Pollo", gramos: 100 }] } },
      },
    },
  };
  const result = extractLearnedPatterns(ds, days, daySlots, 14);
  assert.equal(result.topIngredients.length, 0, "Sin done:true no debe haber ingredientes");
  assert.equal(result.topMealNames.length, 0, "Sin done:true no debe haber platos");
}

// Comidas done:true pero sin ovr no aportan ingredientes
{
  const ds = today;
  const daySlots = { [ds]: ["almuerzo"] };
  const days = {
    [ds]: { meals: { almuerzo: { done: true } } },
  };
  const result = extractLearnedPatterns(ds, days, daySlots, 14);
  assert.equal(result.topIngredients.length, 0, "Sin ovr no debe haber ingredientes");
}

// Top 8 ingredientes: si hay más de 8, se devuelven los 8 más frecuentes
{
  const ds = today;
  const daySlots = {};
  const days = {};
  const ings = ["A","B","C","D","E","F","G","H","I","J"];
  // Día 0: todos los ingredientes (A..J)
  daySlots[ds] = ["almuerzo"];
  days[ds] = {
    meals: {
      almuerzo: {
        done: true,
        ovr: {
          name: "Mix",
          ingredientes: ings.map((n, i) => ({ nombre: n, gramos: 100 - i })),
        },
      },
    },
  };
  const result = extractLearnedPatterns(ds, days, daySlots, 14);
  assert.equal(result.topIngredients.length, 8, "Solo devuelve top 8 ingredientes");
}

// Top 5 platos: si hay más de 5 distintos, solo los 5 más frecuentes
{
  const ds = today;
  const daySlots = {};
  const days = {};
  const dishes = ["P1","P2","P3","P4","P5","P6"];
  for (let i = 0; i < dishes.length; i++) {
    const d = addDays(ds, -i);
    daySlots[d] = ["almuerzo"];
    days[d] = {
      meals: {
        almuerzo: { done: true, ovr: { name: dishes[i], ingredientes: [] } },
      },
    };
  }
  const result = extractLearnedPatterns(ds, days, daySlots, 14);
  assert.equal(result.topMealNames.length, 5, "Solo devuelve top 5 platos");
}

// Ingredientes con campo name en lugar de nombre (contingencia)
{
  const ds = today;
  const daySlots = { [ds]: ["almuerzo"] };
  const days = {
    [ds]: {
      meals: {
        almuerzo: {
          done: true,
          ovr: { name: "Plato A", ingredientes: [{ name: "Quinua", gramos: 80 }] },
        },
      },
    },
  };
  const result = extractLearnedPatterns(ds, days, daySlots, 14);
  assert.ok(result.topIngredients.includes("Quinua"), "Ingrediente con campo name debe ser reconocido");
}

console.log("✓ test-learned-patterns: todos los tests pasaron.");
