// Pruebas directas para js/nutrition-pure.js — REQ-72
import assert from "node:assert/strict";
import "../js/nutrition-pure.js";

const g = globalThis;
assert.ok(g.FITBUD_NUTRITION_PURE, "Namespace FITBUD_NUTRITION_PURE debe existir");

// ── coachCopy (REQ-31) ────────────────────────────────────────────────────────
assert.equal(g.coachCopy("Claude te ayuda"), "Tu coach te ayuda");
assert.equal(g.coachCopy("IA generó esto"), "Tu coach generó esto");
assert.equal(g.coachCopy("usa prompts para tokens"), "usa pedido para recursos");
assert.equal(g.coachCopy(""), "");

// ── coachKey ─────────────────────────────────────────────────────────────────
assert.equal(g.coachKey("salmón"), "salmon");
assert.equal(g.coachKey("Pollo Asado"), "pollo_asado");
assert.equal(g.coachKey("  "), "");

// ── coachTermInTokens (REQ-66: sin falsos positivos) ─────────────────────────
function tokens(text) { return g.coachKey(text).split("_").filter(Boolean); }
assert.equal(g.coachTermInTokens(tokens("repollo fresco"), "pollo"), false, "pollo no debe coincidir en repollo");
assert.equal(g.coachTermInTokens(tokens("pollo asado"), "pollo"), true, "pollo debe coincidir en pollo asado");
assert.equal(g.coachTermInTokens(tokens("algo fresco"), "res"), false, "res no debe coincidir como substring de fresco");
assert.equal(g.coachTermInTokens(tokens("carne de res"), "res"), true, "res debe coincidir en carne de res");
assert.equal(g.coachTermInTokens(tokens("pollos a la brasa"), "pollo"), true, "prefijo plural funciona");

// ── coachTextHasTerms ─────────────────────────────────────────────────────────
assert.ok(g.coachTextHasTerms("plato con pollo asado", ["pollo"]), "debe detectar pollo");
assert.equal(g.coachTextHasTerms("repollo y tomate", ["pollo"]), "", "no debe detectar pollo en repollo");

// ── Helpers de fecha ──────────────────────────────────────────────────────────
assert.equal(g.addDays("2026-01-01", 7), "2026-01-08");
assert.equal(g.addDays("2026-12-25", 7), "2027-01-01");
assert.ok(g.validYmd("2026-06-29"), "fecha válida");
assert.ok(!g.validYmd("no-es-fecha"), "texto inválido");
assert.ok(!g.validYmd("2026-6-1"), "formato corto inválido");
assert.equal(g.ymd(new Date(2026, 5, 29)), "2026-06-29");

// ── hashText ──────────────────────────────────────────────────────────────────
const h1 = g.hashText("hola");
const h2 = g.hashText("hola");
const h3 = g.hashText("mundo");
assert.equal(h1, h2, "mismo input mismo hash");
assert.notEqual(h1, h3, "distinto input distinto hash");
assert.equal(h1.length, 8, "hash de 8 caracteres hex");

// ── stableJson ────────────────────────────────────────────────────────────────
assert.equal(g.stableJson({b:2,a:1}), g.stableJson({a:1,b:2}), "orden de claves estable");
assert.equal(g.stableJson([1,2,3]), "[1,2,3]");

// ── calculateMacroTargets ─────────────────────────────────────────────────────
const m = g.calculateMacroTargets({weightKg:80,heightCm:180,age:30,sex:"male",goal:"deficit",activityLevel:"moderate"});
assert.ok(m.kcal>1000 && m.kcal<4000, "kcal en rango razonable: "+m.kcal);
assert.ok(m.p>50, "proteína razonable: "+m.p);
assert.ok(m.method, "método calculado: "+m.method);

const mBf = g.calculateMacroTargets({weightKg:80,heightCm:180,age:30,sex:"male",goal:"deficit",activityLevel:"moderate",bodyFatPct:15});
assert.equal(mBf.method, "Katch-McArdle", "con BF% usa Katch-McArdle");

// ── validTrainingDays ─────────────────────────────────────────────────────────
assert.ok(g.validTrainingDays(3));
assert.ok(g.validTrainingDays(6));
assert.ok(!g.validTrainingDays(2));
assert.ok(!g.validTrainingDays(7));

// ── validPlanDuration ─────────────────────────────────────────────────────────
assert.ok(g.validPlanDuration(4));
assert.ok(g.validPlanDuration(10));
assert.ok(!g.validPlanDuration(5));
assert.ok(!g.validPlanDuration(0));

// ── normalizedTrainingDays ───────────────────────────────────────────────────
const days = g.normalizedTrainingDays([1,3,5], 3);
assert.equal(days.length, 3);
assert.ok(days.includes(1) && days.includes(3) && days.includes(5));

// ── validTime / normalizedMealTimes ──────────────────────────────────────────
assert.ok(g.validTime("08:30"));
assert.ok(!g.validTime("25:00"));
assert.ok(!g.validTime("8:30"));
const times = g.normalizedMealTimes(["08:00","13:00","INVALIDA","20:30"], 4);
assert.equal(times[0], "08:00");
assert.equal(times[2], "17:00", "invalido reemplazado con default");

// ── buildCycleWeeks ───────────────────────────────────────────────────────────
const weeks = g.buildCycleWeeks("2026-06-13", 4);
assert.equal(weeks.length, 4);
assert.equal(weeks[0].start, "2026-06-13");
assert.equal(weeks[0].num, 1);
assert.equal(weeks[3].menu, g.CYCLE_MENUS[3]);

// ── weekdayInWeek ─────────────────────────────────────────────────────────────
const week0 = weeks[0];
const saturday = g.weekdayInWeek(week0, 6);
assert.ok(g.validYmd(saturday), "resultado es fecha válida");

// ── baseWorkoutTemplate ───────────────────────────────────────────────────────
const tmpl = g.baseWorkoutTemplate(3, "composition", "beginner", undefined);
assert.ok(Array.isArray(tmpl) && tmpl.length === 3, "template 3 días");

// ── Constantes expuestas como globals ────────────────────────────────────────
assert.ok(Array.isArray(g.WEEKDAY_OPTIONS) && g.WEEKDAY_OPTIONS.length === 7);
assert.ok(typeof g.SPORT_LABELS === "object");
assert.equal(g.PROFILE_SCHEMA_VERSION, 3);
assert.ok(g.MEAL_SLOT_TEMPLATES[4].length === 4);
assert.ok(Array.isArray(g.BASE_SLOTS) && g.BASE_SLOTS.length === 4);
assert.ok(g.STRENGTH_SESSION_IDS instanceof Set);
assert.ok(g.STRENGTH_SESSION_IDS.has("fullA"));

console.log("test-nutrition-pure: todos los checks pasaron.");
