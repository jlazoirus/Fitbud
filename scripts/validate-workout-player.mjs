import assert from "node:assert/strict";
import "../exercise-catalog.js";
import "../workout-player.js";

const player=globalThis.FITBUD_WORKOUT_PLAYER;
const catalog=globalThis.FITBUD_EXERCISES;

assert.ok(player,"El dominio del reproductor debe estar disponible");
assert.ok(Array.isArray(catalog)&&catalog.length>=40,"El catálogo debe cargar los ejercicios publicados");

const strengthWorkout={
  id:"fullA",
  kind:"Gimnasio",
  name:"Gimnasio · Full body A",
};
const strengthExercises=["back-squat","bench-press","seated-cable-row"].map(slug=>catalog.find(item=>item.slug===slug));
const strength=player.buildPrescription({
  workout:strengthWorkout,
  exercises:strengthExercises,
  context:{week:3,durationWeeks:10,sessionMinutes:60},
});

assert.equal(strength.sessionType,"strength");
assert.equal(strength.steps[0].phase,"warmup");
assert.equal(strength.steps.at(-1).phase,"cooldown");
assert.equal(strength.steps.filter(step=>step.type==="strength").length,3);
assert.ok(strength.steps.filter(step=>step.type==="strength").every(step=>
  step.prescribedSets===4&&step.reps&&step.restSeconds&&step.tempo&&step.targetRpe&&step.targetRir
),"Cada ejercicio de fuerza debe tener dosis completa");

const cardio=player.buildPrescription({
  workout:{id:"calidad",kind:"Running",name:"Running · calidad",sport:"running",phaseIndex:0},
  exercises:[catalog.find(item=>item.slug==="run-intervals")],
  context:{week:1,durationWeeks:10,sessionMinutes:55},
});
assert.equal(cardio.sessionType,"cardio");
assert.equal(cardio.steps[0].phase,"warmup");
assert.equal(cardio.steps.at(-1).phase,"cooldown");
assert.equal(cardio.steps.filter(step=>step.phase==="main").length,6);
assert.ok(cardio.steps.some(step=>step.phase==="recovery"));
assert.ok(cardio.steps.every(step=>step.durationSeconds>0&&step.target&&step.intensity));

const started=Date.parse("2026-06-15T10:00:00.000Z");
const execution=player.createExecution(strength,started);
assert.equal(execution.status,"in_progress");
assert.equal(execution.steps[1].sets.length,4);
assert.equal(player.elapsedSeconds(execution,started+125000),125);

execution.timer={
  running:true,
  endsAt:new Date(started+90000).toISOString(),
  remainingSeconds:90,
};
assert.equal(player.timerRemaining(execution.timer,started+30000),60);

execution.steps[0].status="done";
execution.steps[1].sets[0].done=true;
execution.steps[1].status="done";
assert.deepEqual(player.progress(execution),{completed:2,skipped:0,total:5,remaining:3});
assert.deepEqual(player.strengthTotals(execution),{completedSets:1,totalSets:12});

const restored=player.normalizeExecution(JSON.parse(JSON.stringify(execution)),strength,started+180000);
assert.equal(restored.steps[1].sets[0].done,true);
assert.equal(restored.workoutId,strengthWorkout.id);

console.log("Reproductor validado: fuerza, cardio, temporizador y recuperación persistente.");
