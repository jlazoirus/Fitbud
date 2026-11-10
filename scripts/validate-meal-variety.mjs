#!/usr/bin/env node
// Variedad de sugerencias de comida:
// 1) dos usuarios con las mismas metas no reciben el mismo plan (varietySeed),
//    y el mismo usuario recibe el mismo plan para la misma fecha;
// 2) una cocina no elegida no se repite dentro del mismo día si hay alternativa;
// 3) las claves de cocina del perfil (CUISINE_LABELS) llegan al solver.
import assert from "node:assert/strict";
import "../js/nutrition-pure.js";
import "../js/nutrition-domain.js";
import { parseCatalog } from "./seed-catalog.mjs";

const d = globalThis.FITBUD_NUTRITION_DOMAIN;
assert.ok(d, "FITBUD_NUTRITION_DOMAIN debe existir");

// ── 1. Planes distintos por usuario, estables por usuario ────────────────────
const seedCatalog = parseCatalog();
const target = { kcal: 2000, p: 150, c: 205, f: 64 };
const prefs = { mealCount: 4, diet: ["omnivoro"] };
function weekFor(varietySeed) {
  return d.planNutritionWeek({ prefs, dayTarget: target, catalog: seedCatalog, startDate: "2026-10-19", varietySeed })
    .days.flatMap(day => day.comidas.map(c => c.dishSlug));
}
const users = ["user-a", "user-b", "user-c", "user-d"].map(weekFor);
users.forEach(week => assert.equal(week.length, 28, "cada semana debe cubrir 7 días x 4 comidas"));
for (let a = 0; a < users.length; a++) {
  for (let b = a + 1; b < users.length; b++) {
    const same = users[a].filter((slug, i) => slug === users[b][i]).length;
    assert.ok(same < users[a].length * 0.6,
      `usuarios ${a} y ${b} no deben compartir la mayoría del plan (${same}/${users[a].length} iguales)`);
  }
}
assert.deepEqual(weekFor("user-a"), users[0], "el mismo usuario debe recibir el mismo plan para la misma semana");

// ── 2. Una cocina no elegida no domina el día ─────────────────────────────────
const ingredients = [
  { id: 1, slug: "pechuga-de-pollo", name: "Pechuga de pollo", kcal: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6 },
  { id: 2, slug: "arroz-cocido", name: "Arroz cocido", kcal: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3 },
  { id: 3, slug: "aceite-de-oliva", name: "Aceite de oliva", kcal: 884, protein_g: 0, carbs_g: 0, fat_g: 100 },
  { id: 4, slug: "papa", name: "Papa", kcal: 77, protein_g: 2, carbs_g: 17, fat_g: 0.1 },
];
const mainSlots = ["almuerzo", "cena"];
const dishes = [
  { id: 1, slug: "tacos-de-pollo", name: "Tacos de pollo", compatible_slots: mainSlots, diet_tags: ["omnivoro"], cuisine_tags: ["mexicana"] },
  { id: 2, slug: "burrito-bowl-de-pollo", name: "Burrito bowl de pollo", compatible_slots: mainSlots, diet_tags: ["omnivoro"], cuisine_tags: ["mexicana"] },
  { id: 3, slug: "pollo-con-papa", name: "Pollo con papa", compatible_slots: mainSlots, diet_tags: ["omnivoro"], cuisine_tags: [] },
];
const line = (dish_id, ingredient_id, grams) => ({ dish_id, ingredient_id, grams, scalable: true, min_g: Math.round(grams * 0.5), max_g: grams * 2, step_g: 5 });
const dishIng = [
  line(1, 1, 180), line(1, 2, 220), line(1, 3, 8),
  line(2, 1, 180), line(2, 2, 220), line(2, 3, 8),
  line(3, 1, 180), line(3, 4, 300), line(3, 3, 8),
];
const mini = { ingredients, dishes, dishIng };
const slots = [{ id: "almuerzo", slot: "Almuerzo" }, { id: "cena", slot: "Cena" }];
const dayTarget = { kcal: 1400, p: 110, c: 140, f: 35 };
const cuisinesOf = day => day.comidas.map(c => dishes.find(x => x.slug === c.dishSlug).cuisine_tags[0] || "otra");

const neutral = d.planDeterministicNutritionDay({ prefs: { mealCount: 2, diet: ["omnivoro"] }, dayTarget, catalog: mini, slots });
assert.equal(neutral.comidas.length, 2, "el día de prueba debe cubrir 2 slots");
assert.equal(cuisinesOf(neutral).filter(t => t === "mexicana").length, 1,
  `sin preferencia, no debe haber dos comidas mexicanas el mismo día (${neutral.comidas.map(c => c.nombre).join(", ")})`);

const fan = d.planDeterministicNutritionDay({ prefs: { mealCount: 2, diet: ["omnivoro"], preferredCuisines: ["mexican"] }, dayTarget, catalog: mini, slots });
assert.deepEqual(cuisinesOf(fan), ["mexicana", "mexicana"],
  "si el usuario eligió cocina mexicana, puede repetirla en el día");

// ── 3. Claves del perfil → tags del catálogo ──────────────────────────────────
assert.deepEqual(d.preferredCuisineTags({ preferredCuisines: Object.keys(globalThis.CUISINE_LABELS || {}) }).sort(),
  ["asiatica", "criolla", "mediterranea", "mexicana"],
  "todas las cocinas que ofrece el perfil deben mapear a un tag del catálogo");

console.log("Variedad de comidas validada: planes por usuario, balance de cocina y claves de perfil.");

// Regression: a high-carb vegetarian week previously converged on the same
// lunch, snack and dinner, and changing grams hid identical dish selections.
for(const diet of ["omnivoro","vegetariano","vegano"]){
  const week=d.planNutritionWeek({prefs:{mealCount:4,diet:[diet]},dayTarget:{kcal:2800,p:160,c:400,f:62},catalog:seedCatalog,startDate:"2026-11-10",varietySeed:"repeated-week-regression"});
  const signatures=week.days.map(day=>day.comidas.map(c=>c.dishSlug).join("|"));
  assert.equal(new Set(signatures).size,7,`${diet}: no two complete days should be identical`);
  for(const slot of ["almuerzo","cena"]){
    const meals=week.days.map(day=>day.comidas.find(c=>c.slot_id===slot).dishSlug);
    assert.ok(new Set(meals).size>=4,`${diet}: ${slot} should rotate through at least four dishes`);
    assert.ok(meals.every((slug,i)=>!i||slug!==meals[i-1]),`${diet}: avoid consecutive identical ${slot}`);
  }
}

// A limited pool must stay usable and distribute repeats rather than always
// falling back to the same winner. All portions are nutritionally identical.
const rotating={ingredients,dishes:Array.from({length:3},(_,i)=>({id:i+11,slug:`rotation-${i}`,name:`Pollo con arroz ${i}`,compatible_slots:["almuerzo"],diet_tags:["omnivoro"]})),dishIng:Array.from({length:3},(_,i)=>[line(i+11,1,180),line(i+11,2,220),line(i+11,3,8)]).flat()};
const history=new Map();let previous=new Set();const picked=[];
for(let i=0;i<9;i++){
  const day=d.planDeterministicNutritionDay({prefs:{mealCount:2,diet:["omnivoro"]},dayTarget,catalog:rotating,slots:[{id:"almuerzo",slot:"Almuerzo"}],recentUsed:history,prevDayUsed:previous,date:`day-${i}`});
  const slug=day.comidas[0]?.dishSlug;assert.ok(slug,"a small pool must still offer a meal");
  picked.push(slug);history.set(slug,(history.get(slug)||0)+1);previous=new Set([slug]);
}
assert.equal(history.size,3,"use all compatible alternatives");
assert.ok(Math.max(...history.values())-Math.min(...history.values())<=1,"balance repeats after exhausting new dishes");
assert.ok(picked.every((slug,i)=>!i||slug!==picked[i-1]),"no consecutive repetition with equivalent alternatives");
console.log("Weekly repetition regressions validated, including a limited catalog.");
// Two names for the same ingredients are less varied than a genuinely different
// composition, even when all three portions have identical nutritional values.
const similarCatalog={...rotating,ingredients:[...ingredients,{...ingredients[1],id:5,slug:"otro-cereal",name:"Otro cereal"}],dishIng:rotating.dishIng.map(l=>l.dish_id===13&&l.ingredient_id===2?{...l,ingredient_id:5}:l)};
const differentIngredients=d.planDeterministicNutritionDay({prefs:{mealCount:2,diet:["omnivoro"]},dayTarget,catalog:similarCatalog,slots:[{id:"almuerzo",slot:"Almuerzo"}],prevDayUsed:new Set(["rotation-0"])});
assert.equal(differentIngredients.comidas[0].dishSlug,"rotation-2","prefer a different composition over renamed identical ingredients");
