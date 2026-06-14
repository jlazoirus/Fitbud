#!/usr/bin/env node
// ============================================================
// Fitbud — validación reproducible de recetas y macros (REQ-01)
// Sin dependencias. Lee supabase/seed.sql (fuente de las recetas)
// y verifica contra las metas por slot del plan (index.html).
//
//   node supabase/validate.mjs
//
// Sale con código 0 si todo pasa, 1 si hay errores.
// Detecta:
//   1) platos sin ingredientes
//   2) ingredientes con gramos inválidos (<=0 o no numéricos)
//   3) platos usados por el plan que no existen o no tienen receta
//   4) macros fuera de tolerancia para el slot esperado
//
// Tolerancia documentada (sobre la meta del slot del plan):
//   kcal      ±30 %
//   proteína  ±35 %
//   carbos    ±45 %  (varía mucho por tipo de día)
//   grasa     ±60 %  (la grasa es el macro más elástico)
// Se evalúa cada plato contra la meta del tipo de día para el que
// fue diseñado (ver PLAN_SLOTS abajo).
// ============================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const seed = readFileSync(join(HERE, "seed.sql"), "utf8");

const TOL = { kcal: 0.30, p: 0.35, c: 0.45, f: 0.60 };

// Metas por slot/tipo de día (espejo de SLOTS en index.html).
const SLOTS = {
  PESAS:     { desayuno:{kcal:450,p:45,c:50,f:10}, almuerzo:{kcal:650,p:45,c:75,f:22}, batido:{kcal:350,p:50,c:45,f:8},  cena:{kcal:500,p:40,c:25,f:15} },
  BAJO:      { desayuno:{kcal:420,p:45,c:40,f:10}, almuerzo:{kcal:580,p:45,c:55,f:18}, batido:{kcal:280,p:50,c:30,f:6},  cena:{kcal:420,p:40,c:25,f:16} },
  REFEED:    { desayuno:{kcal:650,p:40,c:110,f:12}, almuerzo:{kcal:900,p:55,c:140,f:22}, snack:{kcal:450,p:25,c:70,f:6}, cena:{kcal:700,p:40,c:30,f:15} },
  DIETBREAK: { desayuno:{kcal:550,p:40,c:65,f:15}, almuerzo:{kcal:750,p:50,c:95,f:22}, snack:{kcal:450,p:30,c:65,f:12}, cena:{kcal:700,p:40,c:45,f:18}, snack_extra:{kcal:300,p:10,c:30,f:3} },
};

// Plato canónico -> {dayType, slot} para el que está diseñado.
// (Los desayunos/almuerzos/cenas rotan por PESAS/BAJO; se evalúan
//  contra PESAS, que es la meta más alta; la tolerancia cubre BAJO.)
const PLAN_SLOTS = {
  // Desayunos (rotan): meta PESAS desayuno
  "Avena proteica":["PESAS","desayuno"],
  "Bowl griego":["PESAS","desayuno"],
  "Panqueques sin huevo":["PESAS","desayuno"],
  "Smoothie bowl":["PESAS","desayuno"],
  "Desayuno refeed (avena + plátano + miel)":["REFEED","desayuno"],
  // Batidos
  "Batido peri-entreno (día pesas)":["PESAS","batido"],
  "Batido peri-entreno (día bajo)":["BAJO","batido"],
  // Cenas (rotan en días PESAS/BAJO independientes del tipo de día): se
  // evalúan contra la meta de cena BAJO, que es la coherente para una cena
  // ligera (sus macros suman ~el kcal objetivo; la de PESAS no).
  "Cena: yogur griego + cottage + fruta":["BAJO","cena"],
  "Cena: queso fresco a la plancha + palta":["BAJO","cena"],
  "Cena: crema de verduras + tofu sellado":["BAJO","cena"],
  "Cena exprés: caseína + mantequilla de maní":["BAJO","cena"],
  "Cena refeed: arroz + tofu + verduras":["REFEED","cena"],
  // Snacks
  "Snack refeed: pan + mermelada + proteína":["REFEED","snack"],
  "Snack diet break: pan con palta":["DIETBREAK","snack"],
  "Snack extra: fruta + yogur":["DIETBREAK","snack_extra"],
};
// Almuerzos (todos los menús A/B/C/D): meta PESAS almuerzo
const LUNCHES = [
  "Saltado de tofu firme + arroz","Lentejas guisadas + quinua + ensalada","Tacu tacu de pallares + seitán","Ají de garbanzos + arroz","Quinua atamalada + queso fresco + tofu","Frijoles canarios + arroz + queso fresco","Locro de zapallo con quinua + tofu",
  "Pasta integral + boloñesa de lentejas + parmesano","Bowl de hummus + tofu horneado + pita","Falafel al horno + tabule de quinua + yogur","Berenjenas al horno con lentejas + queso fresco","Risotto de champiñones + tofu","Ensalada griega + garbanzos + queso fresco","Pisto de verduras + soya texturizada + papa",
  "Tofu teriyaki + arroz + brócoli","Curry de garbanzos + arroz","Salteado de tempeh con pak choi y pimientos","Pad thai de tofu","Bowl de edamame + tofu + arroz + palta","Ramen miso con tofu y fideos","Chaufa de quinua con tofu",
  "Burrito bowl de frijol negro","Chili vegetariano + arroz","Tacos de frijol negro y queso fresco","Fajitas de tofu + tortillas","Quesadillas de frijol, queso y champiñones","Enchiladas de frijol + cottage","Sopa azteca + tofu + palta",
];
for (const n of LUNCHES) PLAN_SLOTS[n] = ["PESAS","almuerzo"];

// ---------- parse seed.sql ----------
function block(startMarker, endChar) {
  const i = seed.indexOf(startMarker);
  if (i < 0) throw new Error("No se encontró marcador: " + startMarker);
  const j = seed.indexOf(endChar, i);
  return seed.slice(i, j);
}

// Ingredientes: ('Nombre','Cat',kcal,p,c,f)
const ingredients = {};
{
  const sec = seed.slice(seed.indexOf("insert into ingredients"), seed.indexOf("-- ---------- PLATOS"));
  const re = /\('((?:[^'\\]|\\.)*)','[^']*',\s*([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\)/g;
  let m;
  while ((m = re.exec(sec))) {
    ingredients[m[1]] = { kcal:+m[2], p:+m[3], c:+m[4], f:+m[5] };
  }
}

// Platos declarados: ('Nombre','slot',menu)
const dishes = new Set();
{
  const sec = seed.slice(seed.indexOf("insert into dishes"), seed.indexOf("-- ---------- RECETAS"));
  const re = /\('((?:[^'\\]|\\.)*)',\s*'[^']*'\s*,\s*(?:null|'[^']*')\)/g;
  let m;
  while ((m = re.exec(sec))) dishes.add(m[1]);
}

// Recetas: ('Plato','Ingrediente',gramos)
const recipes = {}; // dishName -> [{ing, grams}]
{
  const sec = seed.slice(seed.indexOf("insert into dish_ingredients"), seed.indexOf("-- ---------- DIETAS"));
  const re = /\('((?:[^'\\]|\\.)*)','((?:[^'\\]|\\.)*)',\s*([\d.]+)\)/g;
  let m;
  while ((m = re.exec(sec))) {
    (recipes[m[1]] ||= []).push({ ing: m[2], grams: +m[3] });
  }
}

function macros(lines) {
  const t = { kcal:0, p:0, c:0, f:0 };
  for (const l of lines) {
    const i = ingredients[l.ing];
    if (!i) return null; // ingrediente desconocido
    const g = l.grams / 100;
    t.kcal += i.kcal*g; t.p += i.p*g; t.c += i.c*g; t.f += i.f*g;
  }
  return { kcal:Math.round(t.kcal), p:Math.round(t.p), c:Math.round(t.c), f:Math.round(t.f) };
}

// ---------- checks ----------
const errors = [];
const warnings = [];

// 1) platos sin ingredientes  +  2) gramos inválidos  +  ingrediente inexistente
for (const d of dishes) {
  const lines = recipes[d];
  if (!lines || !lines.length) { errors.push(`Plato sin ingredientes: "${d}"`); continue; }
  for (const l of lines) {
    if (!(l.grams > 0)) errors.push(`Gramos inválidos (${l.grams}) en "${d}" → "${l.ing}"`);
    if (!ingredients[l.ing]) errors.push(`Ingrediente inexistente "${l.ing}" en "${d}"`);
  }
}

// 3) platos usados por el plan que no existen / sin receta
for (const name of Object.keys(PLAN_SLOTS)) {
  if (!dishes.has(name)) errors.push(`Plato del plan no existe en dishes: "${name}"`);
  else if (!recipes[name]) errors.push(`Plato del plan sin receta: "${name}"`);
}

// 4) macros fuera de tolerancia para el slot esperado
const off = (val, target, tol) => Math.abs(val - target) > target * tol;
for (const [name, [type, slot]] of Object.entries(PLAN_SLOTS)) {
  const lines = recipes[name];
  if (!lines) continue;
  const got = macros(lines);
  if (!got) continue;
  const tgt = SLOTS[type][slot];
  const bad = [];
  if (off(got.kcal, tgt.kcal, TOL.kcal)) bad.push(`kcal ${got.kcal} vs ${tgt.kcal}`);
  if (off(got.p, tgt.p, TOL.p)) bad.push(`P ${got.p} vs ${tgt.p}`);
  if (off(got.c, tgt.c, TOL.c)) bad.push(`C ${got.c} vs ${tgt.c}`);
  if (off(got.f, tgt.f, TOL.f)) bad.push(`G ${got.f} vs ${tgt.f}`);
  if (bad.length) errors.push(`Macros fuera de tolerancia [${type}/${slot}] "${name}": ${bad.join(", ")}`);
}

// ---------- report ----------
const nDishes = dishes.size, nIng = Object.keys(ingredients).length, nRec = Object.keys(recipes).length;
console.log(`Fitbud — validación de recetas`);
console.log(`  ingredientes: ${nIng} · platos: ${nDishes} · recetas: ${nRec} · platos del plan verificados: ${Object.keys(PLAN_SLOTS).length}`);
if (warnings.length) { console.log(`\nAvisos:`); warnings.forEach(w => console.log("  ⚠ " + w)); }
if (errors.length) {
  console.log(`\n✗ ${errors.length} problema(s):`);
  errors.forEach(e => console.log("  ✗ " + e));
  process.exit(1);
}
console.log(`\n✓ Todo correcto: recetas completas, gramos válidos y macros dentro de tolerancia.`);
process.exit(0);
