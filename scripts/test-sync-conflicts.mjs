#!/usr/bin/env node
import assert from "node:assert/strict";
import "../sync-conflicts.js";

const {
  mergeDayLogStates,
  mergeWeightPayload,
  normalizeDayStateForSync,
  remoteChangedSince,
} = globalThis.FITBUD_SYNC_CONFLICTS;

assert.equal(remoteChangedSince("2026-06-16T10:00:00.000Z","2026-06-16T10:01:00.000Z"),true,"remote newer debe detectarse");
assert.equal(remoteChangedSince("2026-06-16T10:00:00.000Z","2026-06-16T10:00:00.000Z"),false,"timestamps iguales no son conflicto");

const baseDay=normalizeDayStateForSync({
  workoutDone:false,
  meals:{
    desayuno:{done:false},
    almuerzo:{done:false},
  },
  extras:[],
},i=>"base-"+i);

const localDay=JSON.parse(JSON.stringify(baseDay));
localDay.meals.desayuno.done=true;

const remoteDay=JSON.parse(JSON.stringify(baseDay));
remoteDay.meals.almuerzo.done=true;

let merged=mergeDayLogStates(baseDay,localDay,remoteDay);
assert.equal(merged.ok,true,"comidas distintas deben combinarse");
assert.equal(merged.merged.meals.desayuno.done,true,"conserva comida local");
assert.equal(merged.merged.meals.almuerzo.done,true,"conserva comida remota");

const localWorkout=JSON.parse(JSON.stringify(baseDay));
localWorkout.workoutExecution={status:"partial",steps:[{id:"a",sets:[{reps:8}]}]};
const remoteWorkout=JSON.parse(JSON.stringify(baseDay));
remoteWorkout.workoutExecution={status:"completed",steps:[{id:"a",sets:[{reps:10}]}]};
merged=mergeDayLogStates(baseDay,localWorkout,remoteWorkout);
assert.equal(merged.ok,false,"workoutExecution distinto en dos dispositivos debe conflictuar");
assert.ok(merged.conflicts.includes("workoutExecution"),"conflicto identifica workoutExecution");

const baseWeight={user_id:"u1",cycle_start:"2026-06-13",week:2,kg:80,bf_pct:20,updated_at:"2026-06-16T10:00:00.000Z"};
const localWeight={...baseWeight,kg:79.7,updated_at:"2026-06-16T10:05:00.000Z"};
const remoteWeight={...baseWeight,kg:80.4,updated_at:"2026-06-16T10:06:00.000Z"};
let weight=mergeWeightPayload(baseWeight,localWeight,remoteWeight);
assert.equal(weight.ok,false,"peso distinto en ambos lados debe conflictuar");
assert.ok(weight.conflicts.includes("kg"),"conflicto identifica kg");

const remoteBf={...baseWeight,bf_pct:19.5,updated_at:"2026-06-16T10:06:00.000Z"};
weight=mergeWeightPayload(baseWeight,localWeight,remoteBf);
assert.equal(weight.ok,true,"peso local y grasa remota pueden combinarse");
assert.equal(weight.merged.kg,79.7,"conserva peso local");
assert.equal(weight.merged.bf_pct,19.5,"conserva grasa remota");

console.log("Sync conflicts: merges seguros y conflictos explícitos verificados.");
