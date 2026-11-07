#!/usr/bin/env node
// REQ-360: tras una semana con registros, el menú nuevo repite lo que el usuario
// come en cada franja los días que llega a su meta ("si siempre desayunas lo
// mismo, se sugiere lo mismo"), sin saltarse restricciones ni comidas registradas.
import assert from "node:assert/strict";
import "../js/nutrition-pure.js";
import "../js/nutrition-domain.js";
import { parseCatalog } from "./seed-catalog.mjs";

const d = globalThis.FITBUD_NUTRITION_DOMAIN;
assert.ok(d && d.learnHabitualMeals && d.dayMeetsMacroGoal, "el dominio expone learnHabitualMeals y dayMeetsMacroGoal");

const target = { kcal: 2000, p: 150, c: 205, f: 64 };
const hit = { kcal: 1980, p: 146, c: 200, f: 66 };
const miss = { kcal: 1500, p: 90, c: 150, f: 50 };

// ── 1. Criterio de "día en meta" ─────────────────────────────────────────────
assert.equal(d.dayMeetsMacroGoal(hit, target), true, "kcal ±10 % y proteína ≥90 % cuenta como día en meta");
assert.equal(d.dayMeetsMacroGoal({ kcal: 2250, p: 150 }, target), false, "kcal +12.5 % no está en meta");
assert.equal(d.dayMeetsMacroGoal({ kcal: 2000, p: 130 }, target), false, "proteína <90 % no está en meta");
assert.equal(d.dayMeetsMacroGoal({ kcal: 0, p: 0 }, target), false, "un día vacío no está en meta");

function day(date, totals, breakfast, lunch) {
  return {
    date, totals, target,
    meals: [
      { slot_id: "desayuno", nombre: breakfast.nombre, dishSlug: breakfast.slug || null },
      { slot_id: "almuerzo", nombre: lunch, dishSlug: null },
    ],
  };
}
const avena = { nombre: "Avena, maní y coco", slug: "avena-mani-y-coco" };
const huevos = { nombre: "Huevos revueltos", slug: "huevos-revueltos" };
const lunches = ["Pollo con arroz", "Lomo saltado", "Ensalada de atún", "Pasta con pavo", "Quinoa con pollo", "Tacos", "Ceviche"];

// ── 2. Antes de una semana no se aprende nada ────────────────────────────────
const sixDays = Array.from({ length: 6 }, (_, i) => day(`2026-10-0${i + 1}`, hit, avena, lunches[i]));
assert.equal(d.learnHabitualMeals(sixDays).ready, false, "con 6 días registrados aún no hay hábitos");

// ── 3. Una semana: desayuno repetido en días en meta → hábito; almuerzo variado → no ──
const week = [
  ...Array.from({ length: 5 }, (_, i) => day(`2026-10-0${i + 1}`, hit, avena, lunches[i])),
  day("2026-10-06", hit, huevos, lunches[5]),
  day("2026-10-07", miss, huevos, lunches[6]),
];
const learned = d.learnHabitualMeals(week);
assert.equal(learned.ready, true, "7 días con registros y ≥3 en meta habilitan el aprendizaje");
assert.equal(learned.loggedDays, 7);
assert.equal(learned.qualifiedDays, 6, "el día fuera de meta no cuenta");
assert.equal(learned.bySlot.desayuno && learned.bySlot.desayuno.dishSlug, "avena-mani-y-coco", "el desayuno de siempre es el hábito");
assert.equal(learned.bySlot.desayuno.count, 5);
assert.ok(!learned.bySlot.almuerzo, "un almuerzo distinto cada día no es un hábito");

// Solo cuentan los días en meta: si los días con avena no llegaron a la meta, no hay hábito.
const avenaMisses = week.map((row, i) => i < 5 ? { ...row, totals: miss } : row);
assert.ok(!d.learnHabitualMeals(avenaMisses).bySlot.desayuno, "lo comido en días fuera de meta no se aprende");

// Menos de la mitad de los días en meta → no hay hábito.
const mixed = Array.from({ length: 8 }, (_, i) => day(`2026-10-${String(i + 1).padStart(2, "0")}`, hit,
  i < 3 ? avena : { nombre: `Desayuno ${i}`, slug: null }, lunches[i % 7]));
assert.ok(!d.learnHabitualMeals(mixed).bySlot.desayuno, "3 de 8 días no alcanza la mitad");

// ── 4. El motor determinista repite el desayuno habitual toda la semana ──────
const catalog = parseCatalog();
const prefs = { mealCount: 4, diet: ["omnivoro"] };
const slots = d.mealSlotTargets(target, prefs).map(s => ({ id: s.id, slot: s.slot }));
const habitualBySlot = { desayuno: { dishSlug: "avena-mani-y-coco", nombre: "Avena, maní y coco" } };
const base = d.planNutritionWeek({ prefs, dayTarget: target, catalog, startDate: "2026-11-09", varietySeed: "user-a" });
const baseBreakfasts = base.days.map(x => x.comidas.find(c => c.slot_id === "desayuno").dishSlug);
assert.ok(baseBreakfasts.filter(s => s === "avena-mani-y-coco").length < 7, "sin hábitos, el desayuno rota");

const withHabit = d.planNutritionWeek({ prefs, dayTarget: target, catalog, startDate: "2026-11-09", varietySeed: "user-a", habitualBySlot });
withHabit.days.forEach((x, i) => {
  const breakfast = x.comidas.find(c => c.slot_id === "desayuno");
  assert.equal(breakfast.dishSlug, "avena-mani-y-coco", `día ${i + 1}: se sugiere el desayuno de siempre`);
  assert.equal(breakfast.habit, true, "la comida queda marcada como habitual");
});
const otherSlots = withHabit.days.map(x => x.comidas.filter(c => c.slot_id !== "desayuno").map(c => c.dishSlug).join(","));
assert.ok(new Set(otherSlots).size > 1, "las franjas sin hábito mantienen variedad");
assert.ok(!withHabit.variety.warnings.some(w => w.slot === "desayuno"), "repetir el hábito no se reporta como falta de variedad");

// El plato habitual de una franja queda reservado: otra franja no lo repite el mismo día.
{
  const ingredients = [
    { id: 1, slug: "pechuga-de-pollo", name: "Pechuga de pollo", kcal: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6 },
    { id: 2, slug: "arroz-cocido", name: "Arroz cocido", kcal: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3 },
    { id: 3, slug: "aceite-de-oliva", name: "Aceite de oliva", kcal: 884, protein_g: 0, carbs_g: 0, fat_g: 100 },
    { id: 4, slug: "papa", name: "Papa", kcal: 77, protein_g: 2, carbs_g: 17, fat_g: 0.1 },
  ];
  const both = ["almuerzo", "cena"];
  const dishes = [
    { id: 1, slug: "pollo-con-arroz", name: "Pollo con arroz", compatible_slots: both, diet_tags: ["omnivoro"] },
    { id: 2, slug: "pollo-con-papa", name: "Pollo con papa", compatible_slots: both, diet_tags: ["omnivoro"] },
    { id: 3, slug: "arroz-con-pollo", name: "Arroz con pollo", compatible_slots: both, diet_tags: ["omnivoro"] },
  ];
  const line = (dish_id, ingredient_id, grams) => ({ dish_id, ingredient_id, grams, scalable: true, min_g: Math.round(grams * 0.5), max_g: grams * 2, step_g: 5 });
  const mini = { ingredients, dishes, dishIng: [
    line(1, 1, 180), line(1, 2, 220), line(1, 3, 8),
    line(2, 1, 180), line(2, 4, 300), line(2, 3, 8),
    line(3, 1, 150), line(3, 2, 260), line(3, 3, 10),
  ] };
  const miniSlots = [{ id: "almuerzo", slot: "Almuerzo" }, { id: "cena", slot: "Cena" }];
  const miniTarget = { kcal: 1400, p: 110, c: 140, f: 35 };
  const miniPrefs = { mealCount: 2, diet: ["omnivoro"] };
  const plain = d.planDeterministicNutritionDay({ prefs: miniPrefs, dayTarget: miniTarget, catalog: mini, slots: miniSlots, date: "2026-11-09" });
  const lunchPick = plain.comidas.find(c => c.slot_id === "almuerzo").dishSlug;
  // El plato que el motor elegiría para el almuerzo es el habitual de la cena.
  const habitDinner = { cena: { dishSlug: lunchPick, nombre: "Cena de siempre" } };
  const planned = d.planDeterministicNutritionDay({ prefs: miniPrefs, dayTarget: miniTarget, catalog: mini, slots: miniSlots, date: "2026-11-09", habitualBySlot: habitDinner });
  assert.equal(planned.comidas.find(c => c.slot_id === "cena").dishSlug, lunchPick, "la cena habitual se mantiene");
  assert.notEqual(planned.comidas.find(c => c.slot_id === "almuerzo").dishSlug, lunchPick, "el almuerzo no toma el plato reservado de la cena");
  const dup = d.finalizeNutritionDay({ prefs: miniPrefs, dayTarget: miniTarget, catalog: mini, slots: miniSlots, date: "2026-11-09",
    proposal: [{ slot_id: "almuerzo", nombre: "x", dishSlug: lunchPick }], habitualBySlot: habitDinner });
  const dupSlugs = dup.comidas.map(c => c.dishSlug);
  assert.equal(new Set(dupSlugs).size, dupSlugs.length, "finalize no duplica el hábito si otra franja ya tiene ese plato");
}

// ── 5. Las restricciones vigentes mandan sobre el hábito ─────────────────────
const blocked = { ...prefs, blockedDishes: [{ key: "avena-mani-y-coco", name: "Avena, maní y coco" }] };
const blockedWeek = d.planNutritionWeek({ prefs: blocked, dayTarget: target, catalog, startDate: "2026-11-09", varietySeed: "user-a", habitualBySlot });
assert.ok(blockedWeek.days.every(x => x.comidas.find(c => c.slot_id === "desayuno").dishSlug !== "avena-mani-y-coco"),
  "un plato bloqueado no vuelve aunque sea habitual");
const allergy = { ...prefs, allergies: "maní" };
const allergyDay = d.planDeterministicNutritionDay({ prefs: allergy, dayTarget: target, catalog, date: "2026-11-09", habitualBySlot });
assert.notEqual(allergyDay.comidas.find(c => c.slot_id === "desayuno").dishSlug, "avena-mani-y-coco", "una alergia excluye el hábito");

// ── 6. finalizeNutritionDay: el hábito gana a una propuesta distinta, nunca a lo registrado ──
const proposal = [{ slot_id: "desayuno", nombre: "Arepa con queso fresco", dishSlug: "arepa-con-queso-fresco" }];
const finalized = d.finalizeNutritionDay({ prefs, dayTarget: target, catalog, slots, proposal, date: "2026-11-09", habitualBySlot });
const fBreakfast = finalized.comidas.find(c => c.slot_id === "desayuno");
assert.equal(fBreakfast.dishSlug, "avena-mani-y-coco", "la propuesta distinta cede ante el desayuno habitual");
assert.equal(fBreakfast.habit, true);
assert.ok(finalized.diagnostics.some(x => x.reason === "habit_preferred"));

const locked = [{ slot_id: "desayuno", nombre: "Arepa con queso fresco", dishSlug: "arepa-con-queso-fresco", kcal: 450, proteina_g: 20, carbohidratos_g: 50, grasa_g: 18, ingredientes: [] }];
const lockedDay = d.finalizeNutritionDay({ prefs, dayTarget: target, catalog, slots, lockedMeals: locked, date: "2026-11-09", habitualBySlot });
assert.equal(lockedDay.comidas.find(c => c.slot_id === "desayuno").dishSlug, "arepa-con-queso-fresco", "lo ya registrado no se reemplaza");

const same = d.finalizeNutritionDay({ prefs, dayTarget: target, catalog, slots, date: "2026-11-09",
  proposal: [{ slot_id: "desayuno", nombre: "Avena, maní y coco", dishSlug: "avena-mani-y-coco" }], habitualBySlot });
assert.equal(same.comidas.find(c => c.slot_id === "desayuno").habit, true, "si la propuesta ya es el hábito, se marca como tal");

// Sin hábitos, finalize conserva la propuesta.
const noHabit = d.finalizeNutritionDay({ prefs, dayTarget: target, catalog, slots, proposal, date: "2026-11-09" });
assert.equal(noHabit.comidas.find(c => c.slot_id === "desayuno").dishSlug, "arepa-con-queso-fresco", "sin hábitos no cambia nada");

console.log("REQ-360 comidas habituales de días en meta — OK");
