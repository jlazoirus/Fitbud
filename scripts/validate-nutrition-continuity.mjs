import assert from "node:assert/strict";
import "../js/nutrition-pure.js";
import "../js/nutrition-domain.js";

const nd=globalThis.FITBUD_NUTRITION_DOMAIN;
const ingredients=[{id:1,name:"Yogur griego",kcal:59,protein_g:10,carbs_g:4,fat_g:0},
  {id:2,name:"Plátano",kcal:89,protein_g:1,carbs_g:23,fat_g:0}];
const catalog={ingredients,dishes:[{id:1,name:"Bowl de fruta",slug:"bowl-fruta",compatible_slots:["desayuno"]}],
  dishIng:[{dish_id:1,ingredient_id:1,grams:200},{dish_id:1,ingredient_id:2,grams:100}]};
const noDairy={diet:["omnivoro","sin_lacteos"]};
assert.equal(nd.mealPreferenceConflict({nombre:"Yogur natural"},noDairy,catalog),"yogur");
assert.equal(nd.mealPreferenceConflict({nombre:"Bowl de fruta",dishSlug:"bowl-fruta"},noDairy,catalog),"yogur");
assert.equal(nd.mealPreferenceConflict({nombre:"Merienda",ingredientes:[{nombre:"Yogurt griego",gramos:200}]},noDairy,catalog),"yogur");
assert.equal(nd.mealPreferenceConflict({nombre:"Pollo con arroz"},noDairy,catalog),"");
assert.ok(nd.mealPreferenceConflict({nombre:"Merienda",ingredientes:[{nombre:"Almendras",gramos:30}]},{allergies:"almendras"},catalog));
assert.ok(nd.mealPreferenceConflict({nombre:"Ensalada de tofu"},{dislikedIngredients:"tofu"},catalog));
assert.ok(nd.mealPreferenceConflict({nombre:"Bowl de fruta",dishSlug:"bowl-fruta"},{blockedDishes:[{key:"bowl-fruta",name:"Bowl de fruta"}]},catalog));
assert.equal(nd.mealPreferenceConflict({nombre:"Plátano"},{diet:["vegano"]},catalog),"");
assert.ok(nd.mealPreferenceConflict({nombre:"Pollo con arroz"},{diet:["vegano"]},catalog));
assert.equal(nd.mealPreferenceConflict(null,noDairy,catalog),"");
console.log("validate-nutrition-continuity: 10 casos de exclusión, receta materializada y prioridades correctos.");
