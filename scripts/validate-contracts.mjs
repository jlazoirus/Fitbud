import assert from "node:assert/strict";
import "../domain-contracts.js";

const contracts=globalThis.FITBUD_DOMAIN_CONTRACTS;
assert.ok(contracts,"El módulo de contratos debe estar disponible");
const{validateProfilePrefs,validateMacroTargets,validateDayLogState,validateEntitlement,validateSyncEntry,validateCoachRequest}=contracts;

// ── validateMacroTargets ──────────────────────────────────────────────────────
let r=validateMacroTargets({kcal:2000,p:180,c:170,f:62});
assert.ok(r.ok,"Macros válidos deben pasar: "+r.errors.join(", "));

r=validateMacroTargets({kcal:100,p:5,c:5,f:2});
assert.ok(!r.ok,"kcal demasiado bajo debe fallar");

r=validateMacroTargets({kcal:2000,p:180,c:500,f:200});
assert.ok(!r.ok,"Macros que suman demasiado deben fallar");

r=validateMacroTargets(null);
assert.ok(!r.ok,"null debe fallar");

// ── validateProfilePrefs ──────────────────────────────────────────────────────
const basePrefs={
  primarySport:"running",
  strengthMode:"gym",
  trainingDays:[1,3,5],
  sessionMinutes:60,
  mealCount:4,
  mealTimes:["08:00","13:00","17:00","20:00"],
  eatingWindowStart:"08:00",
  eatingWindowEnd:"20:00",
  trainingExperience:"beginner",
  trainingPriority:"health",
  equipment:["dumbbells","barbell"],
  age:28,
};
r=validateProfilePrefs(basePrefs);
assert.ok(r.ok,"Perfil válido debe pasar: "+r.errors.join(", "));

r=validateProfilePrefs({...basePrefs,primarySport:"tennis"});
assert.ok(!r.ok,"primarySport inválido debe fallar");

r=validateProfilePrefs({...basePrefs,trainingDays:[1,2,3,4,5,6,0]});
assert.ok(!r.ok,"Más de 6 días de entrenamiento debe fallar");

r=validateProfilePrefs({...basePrefs,mealCount:3,mealTimes:["08:00","13:00","20:00","extra"]});
assert.ok(!r.ok,"mealTimes con más entradas que mealCount debe fallar");

r=validateProfilePrefs({...basePrefs,age:16});
assert.ok(!r.ok,"Edad menor de 18 debe fallar");

r=validateProfilePrefs({...basePrefs,sessionMinutes:200});
assert.ok(!r.ok,"sessionMinutes >180 debe fallar");

r=validateProfilePrefs({...basePrefs,trainingExperience:"elite"});
assert.ok(!r.ok,"trainingExperience inválido debe fallar");

// ── validateDayLogState ───────────────────────────────────────────────────────
r=validateDayLogState({meals:{},extras:[],workoutDone:false});
assert.ok(r.ok,"Estado de día vacío válido debe pasar: "+r.errors.join(", "));

r=validateDayLogState({meals:{"desayuno":{done:true}},extras:[{kcal:200}],workoutDone:true,contingencyLog:[]});
assert.ok(r.ok,"Estado de día con datos debe pasar: "+r.errors.join(", "));

r=validateDayLogState({meals:null,extras:[],workoutDone:false});
assert.ok(!r.ok,"meals null debe fallar");

r=validateDayLogState({meals:{},extras:"no-array",workoutDone:false});
assert.ok(!r.ok,"extras no-array debe fallar");

r=validateDayLogState({meals:{},extras:[],workoutDone:"si"});
assert.ok(!r.ok,"workoutDone no-boolean debe fallar");

r=validateDayLogState({meals:{},extras:[],workoutDone:false,contingencyLog:"no-array"});
assert.ok(!r.ok,"contingencyLog no-array debe fallar");

// ── validateEntitlement ───────────────────────────────────────────────────────
const validEnt={
  plan_id:"monthly_v1",
  status:"active",
  starts_at:"2026-06-01T00:00:00Z",
  expires_at:"2026-07-01T00:00:00Z",
  origin:"checkout",
};
r=validateEntitlement(validEnt);
assert.ok(r.ok,"Entitlement válido debe pasar: "+r.errors.join(", "));

r=validateEntitlement({...validEnt,status:"pending"});
assert.ok(!r.ok,"Status no reconocido debe fallar");

r=validateEntitlement({...validEnt,starts_at:"no-es-iso"});
assert.ok(!r.ok,"starts_at no-ISO debe fallar");

r=validateEntitlement({...validEnt,starts_at:"2026-07-01T00:00:00Z",expires_at:"2026-06-01T00:00:00Z"});
assert.ok(!r.ok,"starts_at posterior a expires_at debe fallar");

r=validateEntitlement({...validEnt,plan_id:""});
assert.ok(!r.ok,"plan_id vacío debe fallar");

// ── validateSyncEntry ─────────────────────────────────────────────────────────
const validEntry={
  id:"abc123",
  uid:"user-uuid-001",
  entity:"day_log",
  entityKey:"2026-06-16",
  payload:{user_id:"user-uuid-001",log_date:"2026-06-16",state:"{}"},
  ts:"2026-06-16T10:00:00.000Z",
  retries:0,
  status:"pending",
};
r=validateSyncEntry(validEntry);
assert.ok(r.ok,"Entrada de cola válida debe pasar: "+r.errors.join(", "));

r=validateSyncEntry({...validEntry,entity:"exercises"});
assert.ok(!r.ok,"Entity no permitido debe fallar");

r=validateSyncEntry({...validEntry,retries:-1});
assert.ok(!r.ok,"Retries negativo debe fallar");

r=validateSyncEntry({...validEntry,ts:"not-iso"});
assert.ok(!r.ok,"ts no-ISO debe fallar");

r=validateSyncEntry({...validEntry,payload:null});
assert.ok(!r.ok,"Payload null debe fallar");

r=validateSyncEntry({...validEntry,status:"done"});
assert.ok(!r.ok,"Status no reconocido debe fallar");

// ── validateCoachRequest ──────────────────────────────────────────────────────
r=validateCoachRequest({action:"suggest_meal",requestId:"req-abc-001",maxTokens:1024,context:{user_id:"uid"}});
assert.ok(r.ok,"Solicitud de coach válida debe pasar: "+r.errors.join(", "));

r=validateCoachRequest({action:"",requestId:"req-001",maxTokens:1024});
assert.ok(!r.ok,"action vacía debe fallar");

r=validateCoachRequest({action:"generate_week",requestId:"req-001",maxTokens:0});
assert.ok(!r.ok,"maxTokens=0 debe fallar");

r=validateCoachRequest({action:"generate_week",requestId:"req-001",maxTokens:20000});
assert.ok(!r.ok,"maxTokens>16000 debe fallar");

r=validateCoachRequest({action:"suggest",requestId:"r1",maxTokens:500,context:"texto"});
assert.ok(!r.ok,"context no-objeto debe fallar");

console.log("Contratos de dominio validados: macros, perfil, día, entitlement, cola offline y coach.");
