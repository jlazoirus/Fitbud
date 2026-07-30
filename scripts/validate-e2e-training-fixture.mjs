#!/usr/bin/env node
// REQ-145 - el fixture E2E de Entreno debe dar fuerza en gimnasio cualquier dia.
import assert from "node:assert/strict";
import "../js/nutrition-pure.js";
import { completePrefs, trainingDaysIncludingToday } from "../tests/e2e/helpers.js";

const pure = globalThis.FITBUD_NUTRITION_PURE;
const strengthSessionIds = globalThis.STRENGTH_SESSION_IDS;
const sportIds = new Set(["calidad", "facil", "tecnica"]);
const sunday = new Date(2026, 6, 5, 12, 0, 0);

function referenceDateForDow(dow) {
  const date = new Date(sunday);
  date.setDate(sunday.getDate() + dow);
  assert.equal(date.getDay(), dow, `Fecha fixture invalida para dow=${dow}`);
  return date;
}

function roleForToday(dow, overrides = {}) {
  const prefs = completePrefs({
    trainingDays: trainingDaysIncludingToday(referenceDateForDow(dow)),
    ...overrides,
  });
  assert.equal(prefs.trainingPriority, "strength", "El perfil E2E debe usar prioridad de fuerza.");
  assert.equal(prefs.trainingDays.length, 4, "El fixture debe conservar 4 dias de entreno.");
  assert.equal(new Set(prefs.trainingDays).size, 4, "Los dias del fixture no deben duplicarse.");
  assert.ok(prefs.trainingDays.includes(dow), `El fixture debe incluir hoy (dow=${dow}).`);

  const selected = pure.normalizedTrainingDays(prefs.trainingDays, prefs.trainingDays.length);
  let sessions = pure.trainingTemplateForModes(
    selected.length,
    prefs.trainingPriority,
    prefs.trainingExperience,
    prefs.workoutSplit,
    prefs.strengthMode,
    prefs.primarySport,
  );

  if (prefs.primarySport === "other" || prefs.primarySport === "strength_only") {
    const realSportIds = prefs.primarySport === "strength_only" && prefs.lightCardioEnabled
      ? new Set(["facil"])
      : new Set();
    sessions = sessions.map((id) => (sportIds.has(id) && !realSportIds.has(id) ? "descanso" : id));
  }

  const locations = pure.defaultTrainingLocations(
    prefs.primarySport,
    prefs.strengthMode,
    selected,
    prefs.trainingPriority,
    prefs.trainingExperience,
    prefs.workoutSplit,
    "gym",
  );
  const remaining = sessions.slice();
  const assigned = {};
  for (const day of selected) {
    const location = locations && locations[day];
    const prefersSport =
      (prefs.primarySport === "swimming" && location === "pool") ||
      (prefs.primarySport !== "swimming" && location === "outdoor");
    const index = remaining.findIndex((id) => sportIds.has(id) === prefersSport);
    assigned[day] = remaining.splice(index >= 0 ? index : 0, 1)[0];
  }
  return { role: assigned[dow], selected, sessions };
}

const rows = [];
for (let dow = 0; dow <= 6; dow += 1) {
  const result = roleForToday(dow);
  rows.push({ dow, days: result.selected, role: result.role });
  assert.ok(
    strengthSessionIds.has(result.role),
    `Hoy debe caer en fuerza para dow=${dow}; role=${result.role}, days=${result.selected.join(",")}`,
  );
}

console.log(`validate-e2e-training-fixture: ${rows.map((row) => `${row.dow}:${row.role}`).join(" ")}`);
