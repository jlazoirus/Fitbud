#!/usr/bin/env node
// NAT-03 — contratos del modelo compartido y adaptadores reales de la web.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { parse } from "acorn";
import "../js/day-model.js";

const model=globalThis.FITBUD_DAY_MODEL;
const plain=value=>JSON.parse(JSON.stringify(value));
function freeze(value){
  if(value&&typeof value==="object"){
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
const offline=freeze({loaded:false});
const noLookup=freeze({loaded:true,dishByName(){throw new Error("No debe recalcular una porción materializada");}});
const catalog=freeze({
  loaded:true,
  dishByName:name=>name==="Pollo"?{id:1}:null,
  dishMacros:id=>{assert.equal(id,1);return{kcal:165,p:31,c:0,f:4};},
});
const empty=freeze({id:"cena",name:"",dishName:null,kcal:0,p:0,c:0,f:0});
const snapshot=freeze({id:"almuerzo",name:"Pollo",dishName:"Pollo",kcal:495,p:93,c:0,f:12,src:"nutritionPlan"});

// La normalización es pura y conserva campos históricos desconocidos.
assert.deepEqual(model.dayState(null),{meals:{},extras:[],workoutDone:false});
const legacy=freeze({note:"historial",workoutDone:true,meals:null});
assert.deepEqual(model.dayState(legacy),{note:"historial",workoutDone:true,meals:{},extras:[]});
assert.equal(legacy.meals,null);
assert.ok(!("extras" in legacy));
assert.notEqual(model.dayState(null).meals,model.dayState(null).meals);
assert.ok(!("workoutDone" in model.dayState({})),"No inventar campos en días existentes.");

// Precedencia: registro manual, reemplazo escalado, snapshot, catálogo, vacío.
assert.equal(model.mealValue(snapshot,{},noLookup).kcal,495);
const manual=freeze({ovr:{name:"Registrada",kcal:"700.4",p:"30",c:"50",f:"20",macrosUnknown:true}});
assert.deepEqual(model.mealValue(snapshot,manual,noLookup),{
  name:"Registrada",kcal:700.4,p:30,c:50,f:20,src:"custom",macrosUnknown:true,
});
assert.equal(model.mealValue(snapshot,{ovr:{kcal:0}},noLookup).kcal,0,"Cero es un override válido.");
const replacement=freeze({ovr:{name:"Pollo",dishName:"Pollo",gen:true,kcal:900,p:100,c:50,f:25}});
assert.equal(model.mealValue(snapshot,replacement,noLookup).kcal,900);
assert.equal(model.mealValue(snapshot,replacement,noLookup).src,"replacement");
assert.equal(model.mealValue(snapshot,{ovr:{dishName:"Pollo"}},catalog).kcal,165);
assert.equal(model.mealValue({...snapshot,src:"plan"},{},catalog).src,"db");
assert.equal(model.mealValue({...snapshot,src:"plan"},{},offline).kcal,495);
assert.equal(model.mealValue(snapshot,{ovr:{dishName:"Ausente"}},catalog).src,"plan");
assert.equal(model.mealValue(snapshot,{menuUnavailable:true},noLookup).src,"unavailable");
assert.equal(model.mealValue(snapshot,{menuUnavailable:true,done:true},noLookup).kcal,495,
  "La indisponibilidad del menú no borra un consumo histórico.");
assert.equal(model.mealHasContent(model.mealValue(empty,{},offline)),false);
assert.equal(model.mealHasContent({name:"Solo descripción"}),true);
assert.equal(model.mealHasContent(null),false);

const slots=freeze([
  {id:"desayuno",slot:"desayuno",time:"08:00"},
  {id:"almuerzo",slot:"almuerzo",time:"13:00"},
  {id:"cena",slot:"cena",time:"20:00"},
]);
const nutritionDay=freeze({meals:[{
  slot:"almuerzo",dishName:"Pollo",dishSlug:"pollo",macros:{kcal:495,p:93,c:0,f:12},
  ingredients:[{name:"Pollo",grams:300,ingredientSlug:"pollo",kcal:495,protein_g:93,carbs_g:0,fat_g:12}],
}]});
const input=freeze({
  ds:"2026-11-11",weekday:3,week:{id:1},slots,nutritionDay,
  target:{kcal:2400,p:160,c:300,f:60},workout:{id:"fuerza"},planVersionId:"v1",
});
const built=model.buildDay(input);
assert.deepEqual(built.meals.map(m=>m.id),["almuerzo","desayuno","cena"]);
assert.equal(built.meals[0].time,"13:00");
assert.equal(built.meals[0].ingredientes[0].gramos,300);
assert.equal(built.meals[0].ingredientes[0].proteina_g,93);
assert.equal(built.meals[0].kcal,495);
assert.equal(built.wd,3);
assert.equal(built.planVersionId,"v1");
assert.equal(built.target,input.target);
assert.equal(built.workout,input.workout);
assert.equal(built.meals[1].kcal,0);
for(const missing of [null,{}, {meals:[]}, {meals:"invalid"}]){
  const day=model.buildDay({...input,nutritionDay:missing});
  assert.deepEqual(day.meals.map(m=>m.id),slots.map(s=>s.id));
  assert.ok(day.meals.every(m=>!model.mealHasContent(m)));
}
const custom=model.buildDay({...input,nutritionDay:{meals:[{id:"extra-slot"}]},planVersionId:null});
assert.equal(custom.meals[0].id,"extra-slot");
assert.equal(custom.meals[0].time,null);
assert.equal(custom.planVersionId,null);

// Solo consumo hecho, excluir saltadas del denominador, no contar slots vacíos.
const day=freeze({target:input.target,meals:[snapshot,empty,
  {...empty,id:"pending",name:"Pendiente",kcal:1000},
  {...empty,id:"skipped",name:"Saltada",kcal:500},
  {...empty,id:"calories"},
]});
const state=freeze({meals:{
  almuerzo:{done:true},cena:{done:true},skipped:{skipped:true},
  calories:{done:true,ovr:{kcal:100.4,macrosUnknown:true}},
},extras:[
  {done:true,kcal:"50.4",p:"1.4",c:"2.4",f:"3.4",macrosUnknown:true},
  {done:true,kcal:0.4,p:0.4,c:0.4,f:0.4},
  {done:false,kcal:900,p:90,c:90,f:90},
]});
const before=JSON.stringify({day,state,input});
assert.deepEqual(model.dayTotals(day,state,noLookup),{
  t:{kcal:646,p:95,c:3,f:16},doneMeals:4,totMeals:7,target:input.target,partial:2,
});
assert.equal(model.dayTotals(day,{},offline).doneMeals,0);
assert.equal(JSON.stringify({day,state,input}),before,"Leer/calcular no cambia el historial.");

// Los adaptadores ejecutados son los del HTML vigente, con el módulo real.
const html=readFileSync(new URL("../app/index.html",import.meta.url),"utf8");
const script=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
  .map(match=>match[1]).find(source=>source.includes("function buildDay("));
assert.ok(script);
const names=new Set(["dayState","mealState","buildDay","mealValue","mealHasContent","dayTotals"]);
const adapters=parse(script,{ecmaVersion:"latest"}).body
  .filter(node=>node.type==="FunctionDeclaration"&&names.has(node.id.name))
  .map(node=>script.slice(node.start,node.end)).join("\n");
let nutritionReads=0;
let workoutPrefs;
const prefs=freeze({mealsPerDay:3});
const S={days:{legacy:{note:"conservar"}}};
const ctx=vm.createContext({
  S,DB:{loaded:false},dishByName:catalog.dishByName,dishMacros:catalog.dishMacros,
  planContextForDate:()=>({prefs,week:input.week,version:{id:"v1"}}),
  activeNutritionPlanDay:()=>{nutritionReads++;return nutritionDay;},
  mealSlotsForPrefs:actual=>{assert.equal(actual,prefs);return slots;},
  parseYmd:ds=>{assert.equal(ds,input.ds);return{getDay:()=>3};},
  effectiveDayTarget:(...args)=>{assert.equal(args.length,0,"Usar meta actual, no snapshot");return input.target;},
  effectiveWorkout:(ds,override)=>{workoutPrefs=override;return{workout:input.workout};},
});
vm.runInContext(readFileSync(new URL("../js/day-model.js",import.meta.url),"utf8"),ctx);
vm.runInContext(adapters,ctx);
const webDay=ctx.buildDay(input.ds);
assert.deepEqual(plain(webDay),plain(built));
assert.equal(nutritionReads,1);
assert.equal(workoutPrefs,null);
assert.ok(ctx.buildDay(input.ds,prefs).meals.every(m=>!model.mealHasContent(m)));
assert.equal(nutritionReads,1,"prefsOverride no debe leer el snapshot activo");
assert.equal(workoutPrefs,prefs);
const original=S.days.legacy;
assert.equal(ctx.dayState("legacy"),original,"Preservar la referencia del día en la UI");
assert.equal(ctx.mealState("legacy","almuerzo"),ctx.mealState("legacy","almuerzo"));
const stored=ctx.dayState(input.ds);
stored.meals.almuerzo={done:true};
assert.equal(ctx.dayState(input.ds),stored);
assert.equal(ctx.dayState(input.ds).meals,stored.meals);
assert.equal(ctx.dayTotals(input.ds).t.kcal,495);
assert.equal(ctx.mealValue(snapshot,manual).kcal,700.4);
assert.equal(ctx.mealHasContent(empty),false);

assert.match(html,/<script src="js\/day-model\.js"><\/script>/);
assert.ok(readFileSync(new URL("../service-worker.js",import.meta.url),"utf8").includes('"./js/day-model.js"'));
console.log("Modelo de día OK: precedencia, porciones, consumo, precisión, pureza y adaptadores web con identidad estable.");
