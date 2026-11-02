import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { referralCampaignDue, REFERRAL_MESSAGE, runReferralCampaign } from '../api/notify.js';
const db = new PGlite();
await db.exec(`create schema auth;
create role anon; create role authenticated; create role service_role;
create table auth.users(id uuid primary key,created_at timestamptz default now(), raw_app_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql as $$ select null::uuid $$;
create table profiles(id uuid primary key, active boolean default true,created_at timestamptz default '1990-01-01');
create table product_events(user_id uuid,event_type text,session_id text,created_at timestamptz default '2026-11-08 14:00:00+00');
create table subscription_plans(id text primary key);
insert into subscription_plans values('quarterly'),('monthly');
create table user_entitlements(id uuid primary key default gen_random_uuid(),user_id uuid references auth.users,plan_id text references subscription_plans,
status text,starts_at timestamptz,expires_at timestamptz,origin text,payment_ref text,notes text,granted_by uuid,updated_at timestamptz default now());`);
await db.exec(fs.readFileSync('supabase/coupon_codes.sql','utf8'));
const migration=fs.readFileSync('supabase/referrals.sql','utf8');
await db.exec(migration.replaceAll('2026-11-09 14:00:00+00','2099-11-09 14:00:00+00'));
const owner='10000000-0000-4000-8000-000000000001';
await db.query('insert into auth.users(id) values($1)',[owner]);
await db.query('insert into profiles(id) values($1)',[owner]);
const dashboard=async(generate=false,id=owner)=>(await db.query('select referral_dashboard($1,$2) as d',[id,generate])).rows[0].d;
assert.equal((await dashboard()).eligible,false,'no beneficio antes de lanzamiento');
await db.exec(migration.replaceAll('2026-11-09 14:00:00+00','2000-11-09 14:00:00+00').replaceAll('2026-11-16 14:00:00+00','2099-11-16 14:00:00+00').replace("ev.created_at <= '2000-11-09 14:00:00+00'","ev.created_at <= '2026-11-09 14:00:00+00'"));
await db.exec(migration.replaceAll('2026-11-09 14:00:00+00','2000-11-09 14:00:00+00').replaceAll('2026-11-16 14:00:00+00','2099-11-16 14:00:00+00').replace("ev.created_at <= '2000-11-09 14:00:00+00'","ev.created_at <= '2026-11-09 14:00:00+00'")); // idempotencia
assert.equal((await dashboard()).eligible,false,'cero usos no recibe beneficio');
await db.query("insert into product_events(user_id,event_type,session_id) values($1,'meal_done','comida')",[owner]);
assert.equal((await dashboard()).eligible,false,'registrar comida no sustituye usar la app dos veces');
await db.query("insert into product_events(user_id,event_type,session_id) values($1,'session_start','sesion1')",[owner]);
assert.equal((await dashboard()).eligible,false,'un uso no recibe beneficio');
await db.query("insert into product_events(user_id,event_type,session_id) values($1,'session_start','sesion1')",[owner]);
assert.equal((await dashboard()).eligible,false,'eventos repetidos de la misma sesión no cuentan dos veces');
await db.query("insert into product_events values($1,'session_start','vieja','2026-11-01'),($1,'session_start','futura','2026-11-10')",[owner]);
assert.equal((await dashboard()).eligible,false,'sesiones fuera de siete días no cuentan');
await db.query("insert into product_events(user_id,event_type,session_id) values($1,'session_start','sesion2')",[owner]);
assert.equal((await dashboard()).eligible,true,'dos usos distintos califican sin comidas ni entrenos');
for(let i=0;i<3;i++)await dashboard(true);
await db.query('delete from product_events where user_id=$1',[owner]);
assert.equal((await dashboard()).eligible,true,'elegibilidad persiste tras lanzamiento');
const invites=(await dashboard()).invitations;
assert.equal(invites.length,3);
await assert.rejects(()=>dashboard(true),/3 invitaciones/);
const existing='10000000-0000-4000-8000-000000000002';
await db.query("insert into auth.users(id,created_at) values($1,'1990-01-01')",[existing]);
await assert.rejects(()=>db.query('select * from redeem_redemption_code($1,$2)',[invites[0].code,existing]),/cuenta nueva/);
assert.equal((await db.query('select count(*)::int as n from user_entitlements')).rows[0].n,0,'rollback acceso amigo si alta inválida');
await db.query("insert into user_entitlements(user_id,plan_id,status,starts_at,expires_at,origin) values($1,'quarterly','active',now(),now()+interval '1 year','checkout')",[owner]);
const initial=(await db.query('select expires_at from user_entitlements where user_id=$1',[owner])).rows[0].expires_at;
for(let i=0;i<3;i++){
  const friend=`20000000-0000-4000-8000-00000000000${i+1}`;
  await db.query("insert into auth.users(id,created_at,raw_app_meta_data) values($1,now()+interval '1 second',jsonb_build_object('referral_code',$2::text))",[friend,invites[i].code]);
  await db.query('select * from redeem_redemption_code($1,$2)',[invites[i].code,friend]);
  assert.equal((await db.query("select expires_at=starts_at+interval '3 months' as ok from user_entitlements where user_id=$1",[friend])).rows[0].ok,true);
  await assert.rejects(()=>db.query('select * from redeem_redemption_code($1,$2)',[invites[i].code,friend]),/utilizado/);
}
assert.equal((await db.query("select expires_at=$2::timestamptz+interval '9 months' as ok from user_entitlements where user_id=$1",[owner,initial])).rows[0].ok,true,'9 meses sumados al acceso existente');
assert.equal((await dashboard()).invitations.filter(i=>i.successful).length,3);
await db.query('update profiles set active=false where id=$1',[owner]);
assert.equal((await dashboard()).eligible,false);
assert.equal((await dashboard(false,existing)).eligible,false,'aislamiento entre cuentas');
for(const role of ['anon','authenticated']){
  assert.equal((await db.query("select has_function_privilege($1,'referral_dashboard(uuid,boolean)','execute') as ok",[role])).rows[0].ok,false);
}
assert.equal(referralCampaignDue(new Date('2026-11-09T13:59:59Z')),false);
assert.equal(referralCampaignDue(new Date('2026-11-09T14:00:00Z')),true);
assert.equal(referralCampaignDue(new Date('2026-11-16T14:00:00Z')),false);
assert.ok(!JSON.stringify(REFERRAL_MESSAGE).includes('una semana'));
// El envío se prueba con reloj y red simulados, incluida baja e idempotencia.
const RealDate=globalThis.Date;
globalThis.Date=class extends RealDate { constructor(...args){super(...(args.length?args:['2026-11-09T14:01:00Z']));} };
let sent=0,success=false,campaignHtml='';const calls=[];
globalThis.fetch=async(url,opts={})=>{
  calls.push(url);
  let data=[];
  if(url.includes('/profiles?'))data=[{id:owner,email:'uno@example.test'},{id:existing,email:'baja@example.test'}];
  else if(url.includes('referral_dashboard'))data={eligible:true};
  else if(url.includes('notification_preferences'))data=url.includes(existing)?[{email_opt_in:false}]:[];
  else if(url.includes('notification_log')&&opts.method==='POST')data=[{id:'log1'}];
  else if(url.includes('notification_log')&&opts.method==='PATCH')success=true;
  else if(url.includes('notification_log'))data=success?[{status:'sent'}]:[];
  else if(url.includes('api.resend.com')){sent++;assert.ok(opts.headers['Idempotency-Key']);campaignHtml=JSON.parse(opts.body).html;data={id:'mail1'};}
  else throw new Error('Unexpected '+url);
  return {ok:true,json:async()=>data};
};
const e={url:'https://mock',service:'service',resendKey:'key',cronSecret:'secret',appUrl:'https://evolvapp.club',fromEmail:'test@example.test'};
const results=()=>({sent:0,skipped:0,errors:0,log:[]});
await runReferralCampaign(e,true,results());assert.equal(sent,0);
await runReferralCampaign(e,false,results());await runReferralCampaign(e,false,results());assert.equal(sent,1,'sin duplicado y respeta baja');
assert.match(campaignHtml,/No recibir más estos correos/,'baja de la campaña con texto propio');
assert.ok(!campaignHtml.includes('Desactivar recordatorios')&&!campaignHtml.includes('una semana'));
globalThis.Date=RealDate;
// API: el cliente no puede generar enlaces para otra cuenta ni omitir sesión.
const { default: entitlementHandler } = await import('../api/entitlement.js');
process.env.SUPABASE_URL='https://mock';
process.env.SUPABASE_ANON_KEY='anon';
process.env.SUPABASE_SERVICE_ROLE_KEY='service';
const response=()=>({statusCode:0,payload:null,status(n){this.statusCode=n;return this;},json(v){this.payload=v;return this;}});
let rpcBody,createdBody;
globalThis.fetch=async(url,opts={})=>{
  let data=[];
  if(url.endsWith('/auth/v1/user'))data={id:owner};
  else if(url.includes('/profiles?'))data=[{active:true,is_admin:false}];
  else if(url.includes('/rpc/referral_dashboard')){rpcBody=JSON.parse(opts.body);data={eligible:true,invitations:[]};}
  else if(url.includes('/redemption_codes?'))data=[{code:'FIT-AB12-CD34',referral_owner:owner,redeemed_by:null}];
  else if(url.endsWith('/auth/v1/admin/users')){createdBody=JSON.parse(opts.body);data={id:existing};}
  else if(url.includes('/rpc/redeem_redemption_code'))data=[{id:'ent',plan_id:'quarterly',expires_at:'2027-02-09',duration_days:90}];
  else if(url.includes('/beta_recruitment_submissions?'))data=[];
  else throw new Error('Unexpected API '+url);
  return {ok:true,json:async()=>data};
};
let responseValue=response();
await entitlementHandler({method:'GET',headers:{},query:{action:'referrals'}},responseValue);
assert.equal(responseValue.statusCode,401);
responseValue=response();
await entitlementHandler({method:'POST',headers:{authorization:'Bearer session'},body:{action:'referral-generate',user_id:existing}},responseValue);
assert.equal(responseValue.statusCode,200);
assert.deepEqual(rpcBody,{p_user_id:owner,p_generate:true});
responseValue=response();
await entitlementHandler({method:'GET',headers:{authorization:'Bearer session'},query:{action:'referrals'}},responseValue);
assert.deepEqual(rpcBody,{p_user_id:owner,p_generate:false});
responseValue=response();
await entitlementHandler({method:'POST',headers:{},body:{action:'invite-signup',code:'FIT-AB12-CD34',email:'friend@example.test',password:'Segura2026!'}},responseValue);
assert.equal(responseValue.statusCode,201);
assert.equal(responseValue.payload.referral,true);
assert.deepEqual(createdBody.app_metadata,{referral_code:'FIT-AB12-CD34'});
await db.close();
console.log('PASS referrals: SQL transaccional, límites, rollback, 3+3 meses, RLS, calendario, bajas y envío idempotente.');
