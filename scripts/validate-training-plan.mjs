import assert from "node:assert/strict";
import "../exercise-catalog.js";
import "../training-plan.js";
import "../workout-player.js";

const catalog=globalThis.FITBUD_EXERCISES;
const domain=globalThis.FITBUD_TRAINING_PLAN;
const player=globalThis.FITBUD_WORKOUT_PLAYER;

function phaseDose(phase){
  return {
    base:{sets:3,rpe:6,rir:3},
    progression:{sets:4,rpe:7,rir:2},
    deload:{sets:2,rpe:5,rir:4},
    build:{sets:4,rpe:8,rir:1},
    consolidation:{sets:3,rpe:6,rir:3},
  }[phase];
}

function expectedWeek(week,duration,type="strength"){
  const phase=domain.phaseForWeek(week,duration);
  const date=`2026-07-${String(week).padStart(2,"0")}`;
  const exerciseIds=type==="strength"
    ?["back-squat","bench-press","seated-cable-row"]
    :[type==="running"?"run-intervals":type==="cycling"?"cycle-intervals":"swim-intervals"];
  return {
    week,
    phase,
    sessions:[{
      date,weekday:1,location:type==="swimming"?"pool":type==="strength"?"gym":"outdoor",
      role:type==="strength"?"fullA":"calidad",type,allowedExerciseIds:exerciseIds,
    }],
  };
}

function validRaw(expected,duration){
  const spec=expected.sessions[0];
  const dose=phaseDose(expected.phase);
  const strength=spec.type==="strength";
  return {
    week:expected.week,
    phase:expected.phase,
    reason:"Carga progresiva compatible con el perfil.",
    sessions:[{
      date:spec.date,weekday:spec.weekday,location:spec.location,role:spec.role,type:spec.type,
      name:strength?"Fuerza de cuerpo completo":"Intervalos controlados",
      objective:strength?"Completar la dosis con técnica estable":"Sostener la intensidad sin perder técnica",
      duration_minutes:60,intensity:`RPE ${dose.rpe}`,
      exercises:(strength?spec.allowedExerciseIds:[spec.allowedExerciseIds[0]]).map(exerciseId=>({
        exercise_id:exerciseId,sets:dose.sets,reps:strength?"8-10":"Sesión completa",
        rest_seconds:strength?90:60,target_rpe:dose.rpe,target_rir:dose.rir,tempo:"Controlado",
      })),
      blocks:strength?[]:[
        {phase:"warmup",label:"Calentamiento",target:"10 min suaves",intensity:"RPE 2-3",duration_seconds:600},
        {phase:"main",label:"Intervalos",target:"6 bloques",intensity:`RPE ${dose.rpe}`,duration_seconds:900},
        {phase:"cooldown",label:"Vuelta a la calma",target:"10 min suaves",intensity:"RPE 1-2",duration_seconds:600},
      ],
    }],
  };
}

for(const duration of [4,10]){
  const weeks=[];
  for(let week=1;week<=duration;week++){
    const type=week%3===0?"running":"strength";
    const expected=expectedWeek(week,duration,type);
    const result=domain.normalizeWeek(validRaw(expected,duration),{
      week,expectedPhase:expected.phase,durationWeeks:duration,sessions:expected.sessions,
      sessionMinutes:60,allowedExerciseIds:expected.sessions[0].allowedExerciseIds,
      blockedTerms:[],
    });
    assert.equal(result.ok,true,`La semana ${week}/${duration} debe ser válida: ${result.issues.join(", ")}`);
    weeks.push(result.week);
  }
  const plan={version:domain.VERSION,durationWeeks:duration,weeks};
  assert.equal(domain.validatePlan(plan,{durationWeeks:duration}).ok,true,`El plan de ${duration} semanas debe cerrar completo`);
}

const expected=expectedWeek(1,4,"strength");
const invalidExercise=validRaw(expected,4);
invalidExercise.sessions[0].exercises[0].exercise_id="inventado";
assert.equal(domain.normalizeWeek(invalidExercise,{
  week:1,durationWeeks:4,sessions:expected.sessions,sessionMinutes:60,
  allowedExerciseIds:expected.sessions[0].allowedExerciseIds,blockedTerms:[],
}).ok,false,"Un ejercicio fuera del catálogo debe rechazarse");

const invalidDay=validRaw(expected,4);
invalidDay.sessions[0].date="2026-08-01";
assert.equal(domain.normalizeWeek(invalidDay,{
  week:1,durationWeeks:4,sessions:expected.sessions,sessionMinutes:60,
  allowedExerciseIds:expected.sessions[0].allowedExerciseIds,blockedTerms:[],
}).ok,false,"Una fecha fuera de la disponibilidad debe rechazarse");

const invalidDose=validRaw(expected,4);
invalidDose.sessions[0].exercises[0].sets=8;
assert.equal(domain.normalizeWeek(invalidDose,{
  week:1,durationWeeks:4,sessions:expected.sessions,sessionMinutes:60,
  allowedExerciseIds:expected.sessions[0].allowedExerciseIds,blockedTerms:[],
}).ok,false,"Una dosis fuera de la fase debe rechazarse");

const normalized=domain.normalizeWeek(validRaw(expected,4),{
  week:1,durationWeeks:4,sessions:expected.sessions,sessionMinutes:60,
  allowedExerciseIds:expected.sessions[0].allowedExerciseIds,blockedTerms:[],
});
const workout=domain.workoutFromSession(normalized.week.sessions[0],"gym");
const exercises=workout.exerciseIds.map(slug=>catalog.find(exercise=>exercise.slug===slug));
const prescription=player.buildPrescription({workout,exercises,context:{week:1,durationWeeks:4,sessionMinutes:60}});
assert.equal(prescription.sessionType,"strength");
assert.deepEqual(
  prescription.steps.filter(step=>step.type==="strength").map(step=>step.prescribedSets),
  [3,3,3],
  "El reproductor debe respetar la dosis del plan activado"
);

console.log("Planes de entrenamiento validados: 4/10 semanas, catálogo, disponibilidad, dosis y reproductor.");
