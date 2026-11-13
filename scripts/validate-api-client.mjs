#!/usr/bin/env node
// NAT-07 — solo transportes simulados, sin red ni llamadas pagadas.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { parse } from "acorn";
import "../js/api-client.js";

const {createApiClient}=globalThis.FITBUD_API_CLIENT;
const response=(status,data)=>({status,ok:status>=200&&status<300,json:async()=>data});
const payload=Object.freeze({userText:"Comidas",quota:Object.freeze({action:"diet_day",requestId:"same-request",partKey:"day-1"})});
function fixture(handler,extra){
  const calls=[],timers=new Map();let seq=0;
  const options={
    baseUrl:"https://evolvapp.club/",client:"android",appVersion:"0.1.0",getAccessToken:()=>"session-1",AbortController,
    fetch:async function(url,init){assert.equal(this,undefined,"No asignar un receptor ajeno al transporte");calls.push({url,init});return handler(url,init,calls.length);},
    setTimeout:function(fn,ms){assert.equal(this,undefined,"No asignar un receptor ajeno al temporizador");const id=++seq;if(ms<1000)fn();else timers.set(id,fn);return id;},
    clearTimeout:function(id){assert.equal(this,undefined);timers.delete(id);},...extra,
  };
  return{client:createApiClient(options),calls,timers};
}
{
  let tokenReads=0;
  const f=fixture(()=>response(200,{ok:true}),{getAccessToken:()=>"session-"+(++tokenReads)});
  for(const route of ["config","catalog"])await f.client.request("/api/"+route);
  assert.equal(tokenReads,0,"Configuración/catálogo públicos no leen la sesión.");
  const headers=Object.freeze({"Content-Type":"application/json"});
  const init=Object.freeze({method:"POST",headers,body:'{"event_type":"session_start"}'});
  await f.client.request("/api/analytics",init);
  await f.client.request("/api/privacy");
  assert.equal(f.calls[2].url,"https://evolvapp.club/api/analytics");
  assert.equal(f.calls[2].init.headers.Authorization,"Bearer session-1");
  assert.equal(f.calls[3].init.headers.Authorization,"Bearer session-2","Leer el token vigente en cada petición.");
  assert.equal(f.calls[2].init.headers["X-Evolv-Client"],"android");
  assert.equal(f.calls[2].init.headers["X-Evolv-App-Version"],"0.1.0");
  assert.equal(f.calls[2].init.body,init.body);
  assert.deepEqual(headers,{"Content-Type":"application/json"});
  await f.client.fetch("/api/entitlement",{headers:[["authorization","Bearer explicit"]]});
  assert.equal(f.calls.at(-1).init.headers.authorization,"Bearer explicit");
  assert.equal(tokenReads,2);
  await f.client.request("/api/entitlement",{}, {auth:false});
  assert.equal(f.calls.at(-1).init.headers.Authorization,undefined,"Invitación anónima no agrega sesión.");
  for(const route of ["/api/checkout","/api/push-subscribe","/api/claude","/api/entitlement?action=billing-history"]){
    await f.client.fetch(route);
  }
  const before=f.calls.length,reads=tokenReads;
  for(const route of ["https://other.test/api/privacy","//other.test/api/privacy","/api/admin","/api/privacy/../admin","/api/config#fragment"]){
    await assert.rejects(f.client.request(route),/Unsupported API route/);
  }
  assert.equal(f.calls.length,before);
  assert.equal(tokenReads,reads,"Nunca leer/enviar credenciales a rutas ajenas al cliente.");
  assert.throws(()=>createApiClient({baseUrl:"https://evolvapp.club?redirect=bad",fetch:()=>{}}),/baseUrl/);
}
{
  const f=fixture(()=>response(200,{ok:true}),{baseUrl:"",client:"web"});
  const raw=await f.client.fetch("/api/config",{cache:"no-store"});
  assert.equal(f.calls[0].url,"/api/config");
  assert.equal(f.calls[0].init.cache,"no-store");
  assert.equal(await raw.json().then(data=>data.ok),true,"El transporte conserva Response para adaptadores existentes.");
}
for(const status of [401,403,429,500]){
  const f=fixture(()=>response(status,{error:"No disponible",code:"quota_exceeded"}));
  await assert.rejects(f.client.request("/api/privacy"),error=>error.status===status&&error.code==="quota_exceeded");
  assert.equal(f.calls.length,1,"Una escritura genérica no se reintenta automáticamente.");
}
{
  const trial={days_left:0};
  const f=fixture(()=>response(402,{error:"Acceso vencido",expired:true,trialLimit:true,trial}));
  await assert.rejects(f.client.coach(payload),error=>error.paywall&&error.expired&&error.trialLimit&&error.trial===trial);
  assert.equal(f.calls.length,1);
  assert.equal(f.timers.size,0);
  const fallback=fixture(()=>response(402,{}));
  await assert.rejects(fallback.client.coach(payload),error=>error.message==="Tu acceso no está activo.");
}
for(const first of ["409","network"]){
  const f=fixture((url,init,count)=>{
    if(count===1){if(first==="network")throw new TypeError("Failed to fetch");return response(409,{error:"En proceso"});}
    return response(200,{text:"Opciones",reused:true,origin:"reused"});
  });
  const data=await f.client.coach(payload);
  assert.equal(data.reused,true);
  assert.equal(data.origin,"reused");
  assert.equal(f.calls.length,2);
  assert.equal(f.calls[0].init.body,f.calls[1].init.body);
  assert.deepEqual(JSON.parse(f.calls[1].init.body),payload,"Reintentar conserva requestId/partKey y el resto del payload.");
  assert.equal(f.timers.size,0);
}
{
  const f=fixture(()=>response(409,{error:"En proceso"}));
  await assert.rejects(f.client.coach(payload),error=>error.status===409);
  assert.equal(f.calls.length,2,"Máximo dos intentos.");
  await assert.rejects(f.client.coach({userText:"sin reserva"}),/reserva válida/);
  assert.equal(f.calls.length,2);
}
{
  const invalid=()=>({status:200,ok:true,json:async()=>{throw new SyntaxError("Invalid JSON");}});
  const f=fixture(invalid);
  await assert.rejects(f.client.request("/api/privacy"),error=>error.code==="invalid_json");
  assert.deepEqual(await f.client.coach(payload),{},"Conservar el fallback JSON histórico del coach.");
}
for(const delayedBody of [false,true]){
  const f=fixture((url,init)=>{
    const pending=new Promise((resolve,reject)=>init.signal.addEventListener("abort",()=>reject(Object.assign(new Error("aborted"),{name:"AbortError"})),{once:true}));
    return delayedBody?{status:200,ok:true,json:()=>pending}:pending;
  });
  const result=f.client.coach(payload);
  await new Promise(setImmediate);
  assert.equal(f.timers.size,1);
  [...f.timers.values()][0]();
  await assert.rejects(result,error=>error.code==="timeout"&&/tardó demasiado/.test(error.message));
  assert.equal(f.calls.length,1);
  assert.equal(f.timers.size,0,"Limpiar temporizadores tanto en red como al leer el cuerpo.");
}
{
  const f=fixture((url,init)=>new Promise((resolve,reject)=>init.signal.addEventListener("abort",()=>reject(Object.assign(new Error("Cancelada"),{name:"AbortError"})))));
  const controller=new AbortController();
  const result=f.client.request("/api/privacy",{signal:controller.signal},{timeoutMs:90000});
  await new Promise(setImmediate);
  controller.abort();
  await assert.rejects(result,error=>error.name==="AbortError"&&error.code!=="timeout");
  assert.equal(f.timers.size,0);
}

// Ejecutar los adaptadores reales del HTML sin DOM ni sesión Supabase real.
const html=readFileSync(new URL("../app/index.html",import.meta.url),"utf8");
const source=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(match=>match[1]).find(code=>code.includes("function webApiClient("));
const ast=parse(source,{ecmaVersion:"latest"});
const names=new Set(["webApiClient","apiFetch","coachProxyFetch"]);
const adapters=ast.body.filter(node=>node.type==="FunctionDeclaration"&&names.has(node.id.name)).map(node=>source.slice(node.start,node.end)).join("\n");
const calls=[];
const context=vm.createContext({
  session:{access_token:"web-session"},AbortController,setTimeout,clearTimeout,
  fetch:async(url,init)=>{calls.push({url,init});return response(200,{text:"Respuesta",reused:true});},
});
vm.runInContext(readFileSync(new URL("../js/api-client.js",import.meta.url),"utf8"),context);
vm.runInContext("let _webApiClient=null;const COACH_FETCH_TIMEOUT_MS=90000;\n"+adapters,context);
await context.apiFetch("/api/config",{cache:"no-store"});
assert.equal(calls[0].url,"/api/config");
assert.equal(calls[0].init.headers.Authorization,undefined);
await context.apiFetch("/api/privacy",{headers:{authorization:"Bearer original"}});
assert.equal(calls[1].init.headers.authorization,"Bearer original");
assert.equal((await context.coachProxyFetch(payload)).reused,true);
assert.equal(calls[2].init.headers.Authorization,"Bearer web-session");
assert.deepEqual(JSON.parse(calls[2].init.body),payload);
const direct=[];
function walk(node){
  if(!node||typeof node!=="object")return;
  if(node.type==="CallExpression"&&node.callee.name==="fetch"&&node.arguments[0]?.type==="Literal"
    &&String(node.arguments[0].value).startsWith("/api/"))direct.push(node.arguments[0].value);
  for(const value of Object.values(node)){if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==="object")walk(value);}
}
walk(ast);
assert.deepEqual(direct,["/api/admin"],"Los ocho endpoints delegan; admin queda fuera del cliente compartido.");
assert.ok(html.includes('<script src="js/api-client.js"></script>'));
assert.ok(readFileSync(new URL("../service-worker.js",import.meta.url),"utf8").includes('"./js/api-client.js"'));
console.log("API client OK: web/nativo, sesión vigente, rutas, cabeceras, errores, JSON, timeout de cuerpo y reintentos idempotentes.");
