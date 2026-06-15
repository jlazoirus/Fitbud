import fs from "node:fs";
import assert from "node:assert/strict";

async function importHandler(){
  const source=fs.readFileSync(new URL("../api/claude.js",import.meta.url),"utf8");
  return (await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"))).default;
}
function response(status,data){
  return {ok:status>=200&&status<300,status,json:async()=>data};
}
function capture(){
  return {statusCode:0,body:null,status(code){this.statusCode=code;return this;},json(data){this.body=data;return this;}};
}

process.env.SUPABASE_URL="https://test.supabase.co";
process.env.SUPABASE_PUBLISHABLE_KEY="publishable";
process.env.SUPABASE_SERVICE_ROLE_KEY="service";
process.env.ANTHROPIC_API_KEY="provider-secret";

const user={id:"11111111-1111-4111-8111-111111111111"};
const validPlan={
  week:1,phase:"base",reason:"Carga prudente.",
  sessions:[{
    date:"2026-06-15",weekday:1,location:"gym",role:"fullA",type:"strength",
    name:"Fuerza base",objective:"Técnica estable",duration_minutes:60,intensity:"RPE 6",
    exercises:[
      {exercise_id:"back-squat",sets:3,reps:"8-10",rest_seconds:120,target_rpe:6,target_rir:3,tempo:"3-1-1"},
      {exercise_id:"bench-press",sets:3,reps:"8-10",rest_seconds:120,target_rpe:6,target_rir:3,tempo:"3-1-1"},
    ],
    blocks:[],
  }],
};
const body={
  userText:"Prepara una semana",
  system:"Contexto",
  quota:{
    action:"training_plan",
    requestId:"22222222-2222-4222-8222-222222222222",
    partKey:"week-1",
    contextKey:"ctx-training",
    fallbackText:JSON.stringify(validPlan),
    validation:{
      schema:"training_plan_week_v1",expectedWeek:1,expectedPhase:"base",sessionMinutes:60,
      expectedSessions:[{date:"2026-06-15",weekday:1,location:"gym",role:"fullA",type:"strength"}],
      allowedExerciseIds:["back-squat","bench-press"],hardRestrictions:["burpee"],
    },
  },
};

function authRoute(value){
  if(value.endsWith("/auth/v1/user"))return response(200,user);
  if(value.includes("/rest/v1/profiles"))return response(200,[{active:true,is_admin:false,prefs:{age:30,timeZone:"America/Lima"}}]);
  if(value.includes("/rest/v1/user_consents"))return response(200,[{consent_type:"body_progress"},{consent_type:"automated_coach"}]);
  if(value.includes("/rest/v1/safety_screenings"))return response(200,[{age_confirmed:true,has_red_flags:false,cleared_for_training:true}]);
  return null;
}

const handler=await importHandler();
let failed=0;
global.fetch=async url=>{
  const value=String(url);
  const auth=authRoute(value);if(auth)return auth;
  if(value.endsWith("/rest/v1/rpc/reserve_coach_action"))return response(200,[{usage_id:20,mode:"fresh",usage_status:"reserved"}]);
  if(value.endsWith("/rest/v1/rpc/claim_coach_generation_part"))return response(200,[{claimed:true,part_status:"processing"}]);
  if(value.endsWith("/rest/v1/rpc/complete_fresh_coach_part"))return response(200,[{stored_result_id:90}]);
  if(value.endsWith("/rest/v1/rpc/fail_coach_generation_part")){failed+=1;return response(200,false);}
  if(value.includes("api.anthropic.com"))return response(200,{content:[{text:JSON.stringify(validPlan)}],usage:{input_tokens:200,output_tokens:300}});
  throw new Error("Ruta no simulada: "+value);
};
let res=capture();
await handler({method:"POST",headers:{authorization:"Bearer token"},body},res);
assert.equal(res.statusCode,200,"Una semana válida debe pasar el proxy");
assert.equal(failed,0);

const invalid=structuredClone(validPlan);
invalid.sessions[0].exercises[0].exercise_id="inventado";
global.fetch=async url=>{
  const value=String(url);
  const auth=authRoute(value);if(auth)return auth;
  if(value.endsWith("/rest/v1/rpc/reserve_coach_action"))return response(200,[{usage_id:21,mode:"fresh",usage_status:"reserved"}]);
  if(value.endsWith("/rest/v1/rpc/claim_coach_generation_part"))return response(200,[{claimed:true,part_status:"processing"}]);
  if(value.endsWith("/rest/v1/rpc/fail_coach_generation_part")){failed+=1;return response(200,true);}
  if(value.includes("api.anthropic.com"))return response(200,{content:[{text:JSON.stringify(invalid)}],usage:{input_tokens:200,output_tokens:300}});
  throw new Error("Ruta no simulada: "+value);
};
res=capture();
await handler({
  method:"POST",headers:{authorization:"Bearer token"},
  body:{...body,quota:{...body.quota,requestId:"33333333-3333-4333-8333-333333333333"}},
},res);
assert.equal(res.statusCode,422,"El proxy debe rechazar ejercicios inventados");
assert.equal(failed,1,"El rechazo debe registrar y devolver la reserva");

console.log("Proxy de entrenamiento validado: esquema estricto y rechazo de ejercicios inventados.");
