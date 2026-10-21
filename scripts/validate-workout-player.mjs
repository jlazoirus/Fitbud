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
assert.deepEqual(player.progress(execution),{completed:2,skipped:0,declined:0,total:5,remaining:3});
assert.deepEqual(player.strengthTotals(execution),{completedSets:1,totalSets:12});
// REQ-185: las series extra solo cuentan si se hicieron.
execution.steps[1].sets.push({done:false},{done:true});
assert.deepEqual(player.strengthTotals(execution),{completedSets:2,totalSets:13});
execution.steps[1].sets.splice(4,2);

const restored=player.normalizeExecution(JSON.parse(JSON.stringify(execution)),strength,started+180000);
assert.equal(restored.steps[1].sets[0].done,true);
assert.equal(restored.workoutId,strengthWorkout.id);

const customWorkout={
  id:"generated-2026-06-16-fullA",
  kind:"Gimnasio",
  name:"Fuerza personalizada",
  generatedPrescription:{
    objective:"Practicar técnica con carga controlada",
    durationMinutes:50,
    exercises:[
      {exerciseId:"back-squat",sets:2,reps:"6-8",restSeconds:150,targetRpe:5,targetRir:4,tempo:"3-1-1"},
      {exerciseId:"bench-press",sets:2,reps:"8",restSeconds:120,targetRpe:6,targetRir:3,tempo:"2-1-1"},
    ],
    blocks:[],
  },
};
const custom=player.buildPrescription({
  workout:customWorkout,
  exercises:["back-squat","bench-press"].map(slug=>catalog.find(item=>item.slug===slug)),
  context:{week:1,durationWeeks:10,sessionMinutes:60},
});
assert.deepEqual(custom.steps.filter(step=>step.type==="strength").map(step=>step.prescribedSets),[2,2]);
assert.equal(custom.steps[1].restSeconds,150);
assert.equal(custom.objective,"Practicar técnica con carga controlada");

console.log("Reproductor validado: fuerza, cardio, plan personalizado, temporizador y recuperación persistente.");

// REQ-212: calentamiento y vuelta a la calma con movimientos concretos según la zona.
{
  const build=slugs=>player.buildPrescription({
    workout:{id:"x",kind:"Gimnasio",name:"x"},
    exercises:slugs.map(slug=>catalog.find(item=>item.slug===slug)),
    context:{week:2,durationWeeks:10,sessionMinutes:60},
  });
  const legs=build(["back-squat","romanian-deadlift","walking-lunge"]);
  const upper=build(["bench-press","seated-cable-row","overhead-press"]);
  for(const session of [legs,upper]){
    const warm=session.steps[0],cool=session.steps.at(-1);
    assert.ok(warm.movements.length>=4&&warm.movements.length<=6,"El calentamiento trae de 4 a 6 movimientos");
    assert.ok(cool.movements.length>=4,"La vuelta a la calma trae movimientos concretos");
    assert.ok([...warm.movements,...cool.movements].every(m=>m.name&&m.dose),"Cada movimiento tiene nombre y dosis");
  }
  const names=step=>step.movements.map(m=>m.name).join("|");
  assert.notEqual(names(legs.steps[0]),names(upper.steps[0]),"Piernas y tren superior calientan distinto");
  assert.match(names(legs.steps[0]),/cadera|Sentadilla/,"Piernas calienta cadera y rodillas");
  assert.match(names(upper.steps[0]),/brazos|pared/,"Tren superior calienta hombros");
  const run=player.buildPrescription({workout:{id:"base",kind:"Correr",name:"r",sport:"running"},exercises:[],context:{sessionMinutes:45}});
  assert.ok(run.steps[0].movements.length>=3&&run.steps.at(-1).movements.length>=3,"El cardio también lista movimientos");
  console.log("REQ-212: calentamiento y vuelta a la calma con movimientos por zona.");
}

// REQ-232: la última vez que se hizo el ejercicio, para elegir la carga de hoy.
{
  const set=(reps,load,rpe,done=true)=>({done,reps,load,rpe,completedAt:null});
  const days={
    "2026-10-06":{workoutExecution:{steps:[{type:"strength",exerciseSlug:"back-squat",unit:"reps",sets:[set(8,"35",7),set(8,"35",7)]}]}},
    "2026-10-13":{workoutExecution:{steps:[
      {type:"timed",label:"Calentamiento"},
      {type:"strength",exerciseSlug:"back-squat",unit:"reps",variation:"progression",sets:[set(8,"40",8),set(7," 42.5 ",9),set(null,"",null,false)]},
    ]}},
    "2026-10-16":{workoutExecution:{steps:[{type:"strength",exerciseSlug:"back-squat",sets:[set(null,"",null,false)]}]}},
    "2026-10-20":{workoutExecution:{steps:[{type:"strength",exerciseSlug:"back-squat",sets:[set(10,"50",8)]}]}},
  };
  const last=player.lastPerformance(days,"back-squat","2026-10-20");
  assert.equal(last.date,"2026-10-13","Toma la sesión anterior más reciente con series hechas, no la de hoy ni una sin series");
  assert.equal(last.variation,"progression");
  assert.deepEqual(last.sets,[{reps:8,load:"40",rpe:8},{reps:7,load:"42.5",rpe:9}],"Solo las series hechas, con la carga tal como se anotó");
  assert.equal(player.lastPerformance(days,"bench-press","2026-10-20"),null,"Sin historial del ejercicio no hay dato");
  assert.equal(player.lastPerformance(days,"back-squat","2026-10-06"),null,"Nada anterior a la primera sesión");
  assert.equal(player.lastPerformance(null,"back-squat","2026-10-20"),null);
  console.log("REQ-232: última carga registrada por ejercicio.");
}

// REQ-236: calentamiento y vuelta a la calma son opcionales; "Ahora no" no cuenta como omitido.
{
  const prescription=player.buildPrescription({
    workout:{id:"fullA",kind:"Gimnasio",name:"Gimnasio · Full body A"},
    exercises:["back-squat","bench-press"].map(slug=>catalog.find(item=>item.slug===slug)),
    context:{week:1,durationWeeks:10,sessionMinutes:60},
  });
  const execution=player.createExecution(prescription,Date.now());
  const [warm,...rest]=execution.steps,cool=rest.at(-1);
  assert.equal(warm.optional,true,"El calentamiento es opcional");
  assert.equal(cool.optional,true,"La vuelta a la calma es opcional");
  assert.ok(execution.steps.filter(step=>step.type==="strength").every(step=>!step.optional),"Los ejercicios no son opcionales");
  assert.equal(warm.optIn,false,"Nadie lo eligió todavía");
  warm.status="declined";
  const again=player.normalizeExecution(execution,prescription,Date.now());
  assert.equal(again.steps[0].status,"declined","'declined' se conserva");
  assert.equal(again.currentStep,1,"Se pasa al primer ejercicio");
  const progress=player.progress(again);
  assert.equal(progress.total,execution.steps.length-1,"Un bloque rechazado no cuenta en el total");
  assert.equal(progress.skipped,0,"Ni como omitido");
  assert.equal(progress.declined,1);
  const forged=player.normalizeExecution({...execution,steps:execution.steps.map((step,i)=>i===1?{...step,status:"declined"}:step)},prescription,Date.now());
  assert.equal(forged.steps[1].status,"pending","Un ejercicio no puede quedar 'declined'");
  console.log("REQ-236: calentamiento y vuelta a la calma opcionales.");
}
