import assert from "node:assert/strict";
import "../js/training-routine.js";
const routine=globalThis.FITBUD_TRAINING_ROUTINE;
const context={sessionMinutes:60,days:[{weekday:1,allowedExerciseIds:["leg-press","seated-leg-curl","back-squat"]}],preserve:["leg-press"],
  catalog:[{slug:"leg-press",equipment:["leg_press"]},{slug:"seated-leg-curl",equipment:["leg_curl"]},{slug:"back-squat",equipment:["barbell","rack"]}]};
const action={tipo:"actualizar_rutina",style:"machines",sessions:[{weekday:1,name:"Pierna en máquinas",exercises:[
  {exerciseId:"leg-press",sets:3,reps:"10-12",restSeconds:90},{exerciseId:"seated-leg-curl",sets:3,reps:"12",restSeconds:75}]}]};
assert.equal(routine.validate(action,context).ok,true);
for(const mutate of [
  x=>{x.sessions[0].exercises[0].exerciseId="inventado";},
  x=>{x.sessions[0].exercises[0].exerciseId="back-squat";},
  x=>{x.sessions[0].exercises[0].exerciseId="seated-leg-curl";},
  x=>{x.sessions[0].weekday=2;},
  x=>{x.sessions.push(structuredClone(x.sessions[0]));},
  x=>{x.sessions[0].exercises[0].sets=99;},
  x=>{x.sessions[0].exercises[0].reps="-5";},
  x=>{x.sessions[0].exercises[0].reps="12-2";},
  x=>{x.sessions[0].exercises[0].restSeconds=0;},
  x=>{x.sessions[0].exercises=[];},
  x=>{x.style="desconocido";},
]){
  const invalid=structuredClone(action);mutate(invalid);assert.equal(routine.validate(invalid,context).ok,false,JSON.stringify(invalid));
}
assert.equal(routine.validate(action,{...context,preserve:["missing"]}).ok,false);
assert.equal(routine.validate(action,{...context,requiredStyle:"free_weights"}).ok,false);
assert.equal(routine.validate(action,{...context,sessionMinutes:10}).ok,false);
const high=structuredClone(action);high.sessions[0].exercises[0].sets=4;
assert.equal(routine.validate(high,{...context,gentle:true}).ok,false);
for(const equipment of [["barbell"],["dumbbells"],["resistance_band"],["pullup_bar"],["dumbbells_or_cable"]])assert.equal(routine.matchesStyle({equipment},"machines"),false);
assert.equal(routine.matchesStyle({equipment:["cable"]},"machines"),true);
assert.equal(routine.matchesStyle({equipment:["leg_press"]},"free_weights"),false);
assert.equal(routine.plainText("**Rutina**\\n1. Prensa\n2. Curl"),"Rutina\n1. Prensa\n2. Curl");

// Contrato real de /api/claude: no basta con que el navegador rechace la propuesta.
process.env.SUPABASE_URL="https://routine.test.supabase.co";
process.env.SUPABASE_PUBLISHABLE_KEY="test-publishable";
process.env.SUPABASE_SERVICE_ROLE_KEY="test-service";
process.env.ANTHROPIC_API_KEY="test-provider";
const {default:handler}=await import("../api/claude.js");
const response=(status,data)=>({ok:status>=200&&status<300,status,json:async()=>data});
const originalFetch=globalThis.fetch;
let output=action,completed=0,failed=0;
globalThis.fetch=async url=>{
  const value=String(url);
  if(value.endsWith('/auth/v1/user'))return response(200,{id:"11111111-1111-4111-8111-111111111111"});
  if(value.includes('/rest/v1/profiles'))return response(200,[{active:true,prefs:{age:30}}]);
  if(value.includes('/rest/v1/user_consents'))return response(200,[{consent_type:"body_progress"},{consent_type:"automated_coach"}]);
  if(value.includes('/rest/v1/safety_screenings'))return response(200,[{age_confirmed:true,has_red_flags:false,cleared_for_training:true}]);
  if(value.includes('/rest/v1/user_entitlements'))return response(200,[{status:"active"}]);
  if(value.endsWith('/reserve_coach_action'))return response(200,[{usage_id:12,mode:"fresh",usage_status:"reserved",policy_enabled:true}]);
  if(value.endsWith('/claim_coach_generation_part'))return response(200,[{claimed:true,part_status:"processing"}]);
  if(value.endsWith('/complete_fresh_coach_part')){completed++;return response(200,[{stored_result_id:13}]);}
  if(value.endsWith('/fail_coach_generation_part')){failed++;return response(200,true);}
  if(value.includes('api.anthropic.com'))return response(200,{content:[{text:JSON.stringify({type:"propuesta",respuesta:"Revisa antes de aplicar.",accion:output})}],usage:{input_tokens:100,output_tokens:100}});
  throw new Error(`Ruta no simulada: ${value}`);
};
try{
  for(const valid of [true,false]){
    output=structuredClone(action);if(!valid)output.sessions[0].exercises[0].exerciseId="back-squat";
    const res={statusCode:0,status(code){this.statusCode=code;return this;},json(body){this.body=body;return this;}};
    await handler({method:"POST",headers:{authorization:"Bearer test"},body:{userText:"Mi rutina",system:"Contexto",quota:{action:"coach_conversation",requestId:"22222222-2222-4222-8222-222222222222",partKey:valid?"valid":"invalid",contextKey:"routine",validation:{allowedActionTypes:["actualizar_rutina"],routine:context}}}},res);
    assert.equal(res.statusCode,valid?200:422,JSON.stringify(res.body));
  }
  assert.equal(completed,1);assert.equal(failed,1);
}finally{globalThis.fetch=originalFetch;}
console.log("REQ-359: propuestas, recursos, dosis, conservación y validación real del proxy correctos; cero llamadas externas.");
