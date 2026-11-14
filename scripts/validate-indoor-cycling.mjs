import assert from 'node:assert/strict';
import '../js/nutrition-pure.js';import '../exercise-catalog.js';import '../workout-player.js';import '../training-plan.js';import '../domain-contracts.js';
const pure=globalThis.FITBUD_NUTRITION_PURE,player=globalThis.FITBUD_WORKOUT_PLAYER;
assert(pure.SPORT_LABELS.indoor_cycling);
for(const place of ['gym','home'])for(const strength of ['gym','bodyweight','none']){
 const locations=pure.defaultTrainingLocations('indoor_cycling',strength,[1,2,3,5,6],'composition','beginner',undefined,place);
 for(const v of Object.values(locations))assert(['gym','home'].includes(v));
}
for(const role of ['facil','calidad','tecnica'])for(const phase of [0,1,2,3,4])for(const minutes of [20,30,45,60,90,180]){
 const result=player.buildPrescription({workout:{id:role,kind:'Indoor cycling',sport:'indoor_cycling',name:'Indoor',phaseIndex:phase},exercises:[],context:{sessionMinutes:minutes}});
 assert.equal(result.sessionType,'cardio');assert(result.estimatedMinutes>=30&&result.estimatedMinutes<=60);
 assert.equal(result.steps[0].phase,'warmup');assert.equal(result.steps.at(-1).phase,'cooldown');
 assert(result.steps.every(s=>s.durationSeconds>0));assert(result.steps.some(s=>s.target.includes('rpm')));
 assert(result.steps.every(s=>s.intensity.includes('RPE')));
}
const rows=globalThis.FITBUD_EXERCISES.filter(ex=>ex.discipline==='indoor_cycling');assert.equal(rows.length,3);
assert(rows.every(ex=>JSON.stringify(ex.places)==='["gym","home"]'));
for(const ex of rows)assert(ex.equipment.includes('stationary_bike'));
const outdoor=player.buildPrescription({workout:{id:'facil',kind:'Bicicleta',sport:'cycling',name:'Bici',phaseIndex:3},exercises:[],context:{sessionMinutes:120}});
assert(outdoor.estimatedMinutes>60,'Road cycling still supports its long rides');
console.log('REQ-387: lugares, 90 prescripciones de interior 30–60 min, catálogo y bicicleta de ruta verificados.');

const domain=globalThis.FITBUD_TRAINING_PLAN;
const raw={week:1,phase:'base',reason:'Prueba',sessions:[{date:'2026-11-17',weekday:2,location:'gym',role:'facil',type:'indoor_cycling',name:'Indoor',objective:'Cadencia cómoda',duration_minutes:45,intensity:'RPE 4',exercises:[{exercise_id:'indoor-cycle-endurance',sets:3,reps:'Sesión completa',rest_seconds:60,target_rpe:6,target_rir:3}],blocks:[{phase:'warmup',label:'Calentar',target:'70 rpm',intensity:'RPE 2',duration_seconds:300},{phase:'main',label:'Pedalear',target:'80 rpm',intensity:'RPE 4',duration_seconds:2100},{phase:'cooldown',label:'Enfriar',target:'60 rpm',intensity:'RPE 1',duration_seconds:300}]}]};
const cfg={week:1,durationWeeks:10,sessionMinutes:120,sessions:[{...raw.sessions[0],allowedExerciseIds:['indoor-cycle-endurance']}],allowedExerciseIds:['indoor-cycle-endurance']};
assert(domain.normalizeWeek(raw,cfg).ok);
for(const change of [{location:'outdoor'},{duration_minutes:61},{duration_minutes:29}]){
 const invalid=JSON.parse(JSON.stringify(raw));Object.assign(invalid.sessions[0],change);
 assert(!domain.normalizeWeek(invalid,cfg).ok,'Indoor rejects outdoor and durations outside 30–60 min');
}
