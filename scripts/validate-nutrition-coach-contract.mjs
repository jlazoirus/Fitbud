#!/usr/bin/env node
// REQ-84 — Coach nutricional como generador auxiliar validado, no autoridad de macros.
import assert from "node:assert/strict";
import "../js/nutrition-pure.js";
import "../js/nutrition-domain.js";

const d = globalThis.FITBUD_NUTRITION_DOMAIN;
assert.ok(d, "FITBUD_NUTRITION_DOMAIN debe existir");
assert.ok(typeof d.recalcCoachMealMacros === "function", "recalcCoachMealMacros debe existir");

// ── Catálogo de prueba ────────────────────────────────────────────────────────
const ingredients = [
  { id: 1, slug: "avena-arrollada", name: "Avena arrollada", kcal: 389, protein_g: 13, carbs_g: 66, fat_g: 7 },
  { id: 2, slug: "pechuga-de-pollo", name: "Pechuga de pollo", kcal: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6 },
  { id: 3, slug: "arroz-cocido", name: "Arroz cocido", kcal: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3 },
  { id: 4, slug: "proteina-en-polvo", name: "Proteína en polvo", kcal: 375, protein_g: 80, carbs_g: 8, fat_g: 5 },
  { id: 5, slug: "aceite-de-oliva", name: "Aceite de oliva", kcal: 884, protein_g: 0, carbs_g: 0, fat_g: 100 },
  { id: 6, slug: "frutos-rojos", name: "Frutos rojos", kcal: 50, protein_g: 1, carbs_g: 12, fat_g: 0.3 },
];
const catalog = { ingredients, dishes: [], dishIng: [] };

// ── Test 1: macros declarados por coach son ignorados; se recalculan desde catálogo ──
// El coach declara kcal=9999 (inflado). El motor debe recalcular desde los ingredientes reales.
const comidasInflados = {
  nombre: "Avena con proteína",
  kcal: 9999,       // inflado por el coach
  proteina_g: 999,  // inflado
  ingredientes: [
    { nombre: "Avena arrollada", gramos: 60 },   // real: ~233 kcal, 7.8g prot
    { nombre: "Proteína en polvo", gramos: 35 }, // real: ~131 kcal, 28g prot
    { nombre: "Frutos rojos", gramos: 100 },     // real: ~50 kcal, 1g prot
  ],
};
const calc1 = d.recalcCoachMealMacros(comidasInflados, catalog);
assert.equal(calc1.unknownCount, 0, "todos los ingredientes deben estar en el catálogo");
assert.equal(calc1.knownCount, 3, "3 ingredientes conocidos");
// El motor recalcula: avena(60g)+proteina(35g)+frutos(100g) ≈ 414 kcal, no 9999
assert.ok(calc1.macros.kcal < 600, `kcal recalculado (${calc1.macros.kcal}) debe ser mucho menor que el declarado (9999)`);
assert.ok(calc1.macros.kcal > 300, `kcal recalculado (${calc1.macros.kcal}) debe ser realista (>300)`);
assert.ok(calc1.macros.p > 20, `proteína recalculada (${calc1.macros.p}) debe ser realista (>20g)`);
assert.ok(calc1.macros.p < 100, `proteína recalculada (${calc1.macros.p}) debe ser menor que la declarada (999)`);
console.log(`  Test 1 pasado: macros declarados ignorados; recalculado=${calc1.macros.kcal} kcal, P=${calc1.macros.p}g (declarado era 9999/999)`);

// ── Test 2: ingrediente desconocido → se marca needs_catalog_review ──────────
const comidaConDesconocido = {
  nombre: "Pollo especial del chef",
  ingredientes: [
    { nombre: "Pechuga de pollo", gramos: 180 },     // conocido
    { nombre: "Salsa secreta del chef", gramos: 50 }, // desconocido
  ],
};
const calc2 = d.recalcCoachMealMacros(comidaConDesconocido, catalog);
assert.equal(calc2.unknownCount, 1, "debe haber 1 ingrediente desconocido");
assert.ok(calc2.unknownNames.includes("Salsa secreta del chef"), "debe listar el ingrediente desconocido");
assert.equal(calc2.knownCount, 1, "1 ingrediente conocido (pollo)");
const desconocidoResuelto = calc2.ingredientesResolved.find(i => i.nombre === "Salsa secreta del chef");
assert.ok(desconocidoResuelto && desconocidoResuelto.needs_catalog_review === true, "ingrediente desconocido debe tener needs_catalog_review=true");
// Los macros recalculados deben venir solo de la pechuga (no de la salsa desconocida)
const expectedPollo = Math.round(165 * 1.8); // 165kcal/100g × 180g = 297
assert.ok(Math.abs(calc2.macros.kcal - expectedPollo) <= 2, `kcal (${calc2.macros.kcal}) debe venir solo del pollo (~${expectedPollo})`);
console.log(`  Test 2 pasado: ingrediente desconocido marcado needs_catalog_review; macros calculados desde ingredientes conocidos (${calc2.macros.kcal} kcal)`);

// ── Test 3: todos los ingredientes desconocidos → macros en cero ─────────────
const comidaTotalDesconocida = {
  nombre: "Plato exótico",
  ingredientes: [
    { nombre: "Ingrediente misterioso A", gramos: 100 },
    { nombre: "Extracto de algo raro", gramos: 50 },
  ],
};
const calc3 = d.recalcCoachMealMacros(comidaTotalDesconocida, catalog);
assert.equal(calc3.knownCount, 0, "ningún ingrediente conocido");
assert.equal(calc3.unknownCount, 2, "2 ingredientes desconocidos");
assert.equal(calc3.macros.kcal, 0, "macros en cero cuando no hay ingredientes conocidos");
assert.equal(calc3.unknownNames.length, 2, "debe listar ambos desconocidos");
console.log("  Test 3 pasado: todos desconocidos → macros en cero, needs_catalog_review en todos");

// ── Test 4: normalización por slug (no solo por nombre) ──────────────────────
const comidaConSlug = {
  nombre: "Arroz con aceite",
  ingredientes: [
    { nombre: "Arroz Cocido", gramos: 200, ingredientSlug: "arroz-cocido" },   // slug exacto
    { nombre: "ACEITE DE OLIVA", gramos: 10, ingredientSlug: "aceite-de-oliva" }, // slug exacto, nombre en caps
  ],
};
const calc4 = d.recalcCoachMealMacros(comidaConSlug, catalog);
assert.equal(calc4.knownCount, 2, "debe encontrar ambos ingredientes por slug");
assert.equal(calc4.unknownCount, 0, "no debe haber desconocidos cuando se usa slug exacto");
assert.ok(calc4.macros.kcal > 0, "macros deben ser positivos");
console.log(`  Test 4 pasado: normalización por slug correcta (${calc4.macros.kcal} kcal)`);

// ── Test 5: normalización por nombre con variantes (acentos, mayúsculas) ──────
const comidaNormalizacion = {
  nombre: "Desayuno normalizado",
  ingredientes: [
    { nombre: "avena arrollada", gramos: 50 },          // minúsculas
    { nombre: "Proteina en polvo", gramos: 30 },        // sin tilde
    { nombre: "FRUTOS ROJOS", gramos: 80 },             // mayúsculas
  ],
};
const calc5 = d.recalcCoachMealMacros(comidaNormalizacion, catalog);
assert.equal(calc5.knownCount, 3, "debe normalizar nombres con variantes de case y acentos");
assert.equal(calc5.unknownCount, 0, "no debe haber desconocidos tras normalización");
console.log(`  Test 5 pasado: normalización robusta (${calc5.macros.kcal} kcal, P=${calc5.macros.p}g)`);

// ── Test 6: comida sin ingredientes → macros en cero, no falla ───────────────
const comidaVacia = { nombre: "Sin ingredientes", ingredientes: [] };
const calc6 = d.recalcCoachMealMacros(comidaVacia, catalog);
assert.equal(calc6.knownCount, 0);
assert.equal(calc6.unknownCount, 0);
assert.equal(calc6.macros.kcal, 0);
assert.ok(Array.isArray(calc6.ingredientesResolved) && calc6.ingredientesResolved.length === 0);
console.log("  Test 6 pasado: comida sin ingredientes devuelve macros en cero sin error");

// ── Test 7: catálogo vacío → todos los ingredientes son desconocidos ──────────
const emptyCatalog = { ingredients: [], dishes: [], dishIng: [] };
const calc7 = d.recalcCoachMealMacros(comidasInflados, emptyCatalog);
assert.equal(calc7.knownCount, 0, "catálogo vacío → ningún ingrediente conocido");
assert.equal(calc7.unknownCount, 3, "todos marcan como desconocidos");
assert.equal(calc7.macros.kcal, 0, "macros en cero con catálogo vacío");
console.log("  Test 7 pasado: catálogo vacío → todos desconocidos, macros en cero");

// ── Test 8: gramos calculados correctamente contra catálogo real ──────────────
// Pechuga de pollo: 165 kcal / 100g, 31g prot / 100g, 3.6g fat / 100g
// 200g de pechuga de pollo → 330 kcal, 62g prot, 7.2g fat
const comidaPollo = {
  nombre: "Pechuga al horno",
  ingredientes: [{ nombre: "Pechuga de pollo", gramos: 200 }],
};
const calc8 = d.recalcCoachMealMacros(comidaPollo, catalog);
assert.equal(calc8.macros.kcal, Math.round(165 * 2), `kcal de 200g pollo debe ser ${Math.round(165*2)}`);
assert.equal(calc8.macros.p, Math.round(31 * 2), `proteína de 200g pollo debe ser ${Math.round(31*2)}`);
assert.ok(Math.abs(calc8.macros.f - Math.round(3.6 * 2)) <= 1, `grasa de 200g pollo debe ser ~${Math.round(3.6*2)}`);
console.log(`  Test 8 pasado: cálculo exacto de macros desde catálogo (${calc8.macros.kcal} kcal, P=${calc8.macros.p}g)`);

console.log("validate-nutrition-coach-contract: todos los checks pasaron.");
