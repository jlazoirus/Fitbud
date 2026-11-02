#!/usr/bin/env node
// REQ-319 — "Las dietas no incluyen frutas". El plan sin modelo prioriza un
// plato con fruta en desayuno/snacks hasta 2 comidas con fruta (1 con menos de
// 4 comidas), y el pedido al modelo exige fruta en el día.
import assert from "node:assert/strict";
import fs from "node:fs";
import "../js/nutrition-pure.js";
import "../js/nutrition-domain.js";

const d = globalThis.FITBUD_NUTRITION_DOMAIN;
const ing = (id, name, category, kcal, p, c, f) => ({ id, slug: name.toLowerCase().replace(/\s+/g, "-"), name, category, kcal, protein_g: p, carbs_g: c, fat_g: f });
const ingredients = [
  ing(1, "Yogur griego", "Lácteo", 60, 10, 3.6, 0.4),
  ing(2, "Proteína en polvo", "Proteína", 375, 80, 8, 5),
  ing(3, "Plátano", "Fruta", 89, 1.1, 23, 0.3),
  ing(4, "Avena", "Cereal", 389, 13, 66, 7),
  ing(5, "Huevo entero", "Proteína animal", 143, 13, 1, 9.5),
  ing(6, "Pechuga de pollo", "Proteína animal", 165, 31, 0, 3.6),
  ing(7, "Arroz cocido", "Cereal", 130, 2.7, 28, 0.3),
  ing(8, "Aceite de oliva", "Grasa", 884, 0, 0, 100),
  ing(9, "Pan integral", "Cereal", 250, 12, 41, 3.5),
  ing(10, "Mantequilla de maní", "Grasa", 588, 25, 20, 50),
];
const snack = ["media_manana", "merienda", "snack", "recena"];
const dish = (id, name, slots) => ({ id, slug: "d" + id, name, slot: slots[0], compatible_slots: slots, diet_tags: ["omnivoro", "vegetariano"] });
const dishes = [
  dish(1, "Huevos con pan", ["desayuno"]),
  dish(2, "Avena con plátano y yogur", ["desayuno"]),
  dish(3, "Yogur proteico", snack),
  dish(4, "Yogur con plátano", snack),
  dish(5, "Pollo con arroz", ["almuerzo", "cena"]),
];
const line = (dish_id, ingredient_id, grams) => ({ dish_id, ingredient_id, grams, scalable: true, min_g: Math.round(grams * 0.5), max_g: grams * 2, step_g: 5 });
const dishIng = [
  line(1, 5, 150), line(1, 9, 60),
  line(2, 4, 35), line(2, 3, 100), line(2, 1, 150), line(2, 2, 20), line(2, 10, 15),
  line(3, 1, 250), line(3, 2, 25),
  line(4, 1, 200), line(4, 3, 100), line(4, 2, 20),
  line(5, 6, 180), line(5, 7, 200), line(5, 8, 8),
];
const catalog = { ingredients, dishes, dishIng };
const fruitMeals = (res) => res.comidas.filter((m) => m.ingredientes.some((i) => i.nombre === "Plátano")).length;

for (const [mealCount, target, expected] of [[4, { kcal: 2000, p: 150, c: 200, f: 60 }, 2], [5, { kcal: 2400, p: 160, c: 260, f: 70 }, 2], [3, { kcal: 1900, p: 130, c: 200, f: 60 }, 1]]) {
  for (const seed of ["a", "b", "c", "d"]) {
    const res = d.planDeterministicNutritionDay({ prefs: { mealCount, diet: ["omnivoro"] }, dayTarget: target, catalog, date: "2026-11-02", varietySeed: seed });
    assert.equal(res.comidas.length, mealCount, `${mealCount} comidas`);
    assert.ok(fruitMeals(res) >= expected, `${mealCount} comidas (semilla ${seed}): al menos ${expected} con fruta, hubo ${fruitMeals(res)}`);
    assert.ok(Math.abs(res.residual.kcal) <= target.kcal * 0.15, "sigue dentro de la meta de kcal");
  }
}
console.log("  plan sin modelo: 2 comidas con fruta desde 4 comidas, 1 con 3, sin salirse de la meta");

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const fnSrc = html.slice(html.indexOf("function dietFruitPromptLine("), html.indexOf("function slotArchetypePromptLine("));
const dietFruitPromptLine = new Function(fnSrc + "; return dietFruitPromptLine;")();
assert.match(dietFruitPromptLine(4), /al menos dos comidas/);
assert.match(dietFruitPromptLine(5), /al menos dos comidas/);
assert.match(dietFruitPromptLine(3), /al menos una comida/);
assert.match(dietFruitPromptLine(4), /Respeta las exclusiones/);
const gen = html.slice(html.indexOf("async function generateOneDay("), html.indexOf("const maxTok=", html.indexOf("async function generateOneDay(")));
assert.ok(/const fruitLine=dietFruitPromptLine\(/.test(gen) && /\$\{fruitLine\}/.test(gen), "el pedido del día incluye la regla de fruta");
console.log("  pedido al modelo: exige fruta en el día y respeta exclusiones");
console.log("validate-diet-fruit: OK");
