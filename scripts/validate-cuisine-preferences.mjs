#!/usr/bin/env node
// REQ-136: preferencias de cocina deben afectar el scoring suave del solver.
import assert from "node:assert/strict";
import "../js/nutrition-pure.js";
import "../js/nutrition-domain.js";

const d = globalThis.FITBUD_NUTRITION_DOMAIN;
assert.ok(d, "FITBUD_NUTRITION_DOMAIN debe existir");

const criolla = {
  id: 1,
  slug: "tacu-tacu-criollo",
  name: "Tacu tacu criollo",
  slot: "almuerzo",
  compatible_slots: ["almuerzo"],
  diet_tags: ["omnivoro"],
  cuisine_tags: ["criolla"],
};
const mediterranea = {
  id: 2,
  slug: "bowl-mediterraneo",
  name: "Bowl mediterraneo de hummus",
  slot: "almuerzo",
  compatible_slots: ["almuerzo"],
  diet_tags: ["omnivoro"],
  cuisine_tags: "{mediterranea}",
};
const mexicana = {
  id: 3,
  slug: "tacos-de-frijol",
  name: "Tacos de frijol",
  slot: "almuerzo",
  compatible_slots: ["almuerzo"],
  diet_tags: ["omnivoro"],
  cuisine_tags: ["mexicana"],
};
const catalog = { ingredients: [], dishes: [criolla, mediterranea, mexicana], dishIng: [] };

function rankFor(prefs) {
  return [...catalog.dishes]
    .map((dish) => ({ dish, adj: d.preferenceScoreAdjustment(dish, prefs, catalog, { byId: new Map(), bySlug: new Map(), byName: new Map() }) }))
    .sort((a, b) => a.adj - b.adj)
    .map((item) => item.dish.slug);
}

assert.deepEqual(d.preferredCuisineTags({ preferredCuisines: ["mediterránea", "criollo", "peruana"] }),
  ["mediterranea", "criolla"], "Debe normalizar acentos/sinónimos de cocina.");
assert.deepEqual(d.cuisineTagsForDish(mediterranea), ["mediterranea"], "Debe leer cuisine_tags estilo array Postgres.");

assert.equal(rankFor({ preferredCuisines: ["criolla"] })[0], "tacu-tacu-criollo",
  "Perfil criollo debe favorecer plato criollo con los mismos hard filters.");
assert.equal(rankFor({ preferredCuisines: ["mediterranea"] })[0], "bowl-mediterraneo",
  "Perfil mediterraneo debe favorecer plato mediterraneo con los mismos hard filters.");
assert.equal(rankFor({ preferredCuisines: ["mexicana"] })[0], "tacos-de-frijol",
  "Perfil mexicano debe favorecer plato mexicano con los mismos hard filters.");

console.log("Preferencias de cocina validadas: cuisine_tags normalizados y scoring suave aplicado.");
