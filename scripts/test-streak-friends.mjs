// REQ-300: ejecuta la migración REAL en PostgreSQL/WASM, sin red/producción.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
const A='00000000-0000-4000-8000-000000000001',B='00000000-0000-4000-8000-000000000002',C='00000000-0000-4000-8000-000000000003';
await db.exec(`create role anon; create role authenticated; create schema auth;
  grant usage on schema auth to anon,authenticated;
  create table auth.users(id uuid primary key);
  create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  create table public.profiles(id uuid primary key, active boolean default true);
  insert into auth.users values('${A}'),('${B}'),('${C}');
  insert into public.profiles select id,true from auth.users;`);
const sql=readFileSync(new URL('../supabase/streak_friends.sql',import.meta.url),'utf8');
await db.exec(sql);await db.exec(sql); // reejecutable, sin borrar datos
let tests=0;
async function call(id,action='state',data={}) {
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id||'']);
  await db.exec('set role authenticated');
  try {return (await db.query('select public.streak_social($1,$2::jsonb) as result',[action,JSON.stringify(data)])).rows[0].result;}
  finally {await db.exec('reset role');}
}
async function check(name,fn){await fn();tests++;console.log('✓ '+name);}
async function rejected(fn){await assert.rejects(fn);}
const today=(await db.query("select (now() at time zone 'America/Lima')::date::text as ds")).rows[0].ds;
const sync=(n,through=today,timezone='America/Lima')=>({count:n,through:n?through:null,timezone});
let token;
try {
  await check('sin sesión y rol anónimo no pueden leer',async()=>{
    await rejected(()=>call(null));await db.exec('set role anon');
    try {await rejected(()=>db.query('select public.streak_social()'));}finally{await db.exec('reset role');}
  });
  await check('privado por defecto y sin escrituras/lecturas directas',async()=>{
    assert.deepEqual(await call(A),{enabled:false,alias:'',rows:[]});
    await db.exec('set role authenticated');
    try {for(const table of ['streak_social_profiles','streak_friendships','streak_friend_invites']){
      await rejected(()=>db.query(`select * from public.${table}`));
      await rejected(()=>db.query(`delete from public.${table}`));
    }}finally{await db.exec('reset role');}
    assert.equal((await db.query("select count(*)::int as n from pg_class where relname in ('streak_social_profiles','streak_friendships','streak_friend_invites') and relrowsecurity")).rows[0].n,3);
  });
  await check('alias explícito y datos validados',async()=>{
    await rejected(()=>call(A,'enable',{alias:'x'}));
    await call(A,'enable',{alias:'Alicia'});await call(B,'enable',{alias:'Bruno'});await call(C,'enable',{alias:'Carla'});
    await rejected(()=>call(A,'sync',sync(10,'2099-01-01')));
    await rejected(()=>call(A,'sync',sync(2,today,'inventada')));
    await rejected(()=>call(A,'sync',sync(-3)));
    await call(A,'sync',sync(4));await call(B,'sync',sync(4));await call(C,'sync',sync(90));
  });
  await check('enlace impredecible, caduca y no da acceso antes de aceptar',async()=>{
    const invitation=await call(A,'invite');token=invitation.token;
    assert.match(token,/^[a-f0-9]{64}$/);assert.ok(Date.parse(invitation.expiresAt)>Date.now());
    assert.deepEqual((await call(B)).rows.map(r=>r.id),[B]);
    assert.equal((await call(B,'preview',{token})).alias,'Alicia');
    await rejected(()=>call(A,'accept',{token}));
  });
  await check('aceptación mutua, empates y mínimo de datos',async()=>{
    await call(B,'accept',{token});await call(B,'accept',{token});
    assert.equal((await db.query('select count(*)::int as n from streak_friendships')).rows[0].n,1);
    const rows=(await call(A)).rows;
    assert.equal(rows.length,2);assert.deepEqual(rows.map(r=>r.position),[1,1]);
    assert.deepEqual(Object.keys(rows[0]).sort(),['alias','days','id','position','self','updatedAt'].sort());
    assert.deepEqual((await call(B)).rows.map(r=>r.id).sort(),[A,B]);
    assert.deepEqual((await call(C)).rows.map(r=>r.id),[C]);
    await rejected(()=>call(C,'accept',{token}));
    await call(C,'remove',{friend:A});assert.equal((await call(A)).rows.length,2);
    // Defensa adicional: ni un GRANT accidental basta para saltarse RLS.
    await db.exec('grant select on streak_social_profiles,streak_friendships,streak_friend_invites to authenticated;set role authenticated');
    try {for(const table of ['streak_social_profiles','streak_friendships','streak_friend_invites'])assert.equal((await db.query(`select * from ${table}`)).rows.length,0);}
    finally {await db.exec('reset role;revoke select on streak_social_profiles,streak_friendships,streak_friend_invites from authenticated');}
  });
  await check('racha actual: avanzar, perder, rescatar y caducar sin abrir app',async()=>{
    await call(B,'sync',sync(5));assert.equal((await call(A)).rows[0].id,B);
    await call(B,'sync',sync(0));assert.equal((await call(A)).rows.find(r=>r.id===B).days,0);
    await call(B,'sync',sync(6));assert.equal((await call(A)).rows[0].days,6);
    await db.exec(`update streak_social_profiles set streak_through=date '${today}'-2 where user_id='${B}'`);
    assert.equal((await call(A)).rows.find(r=>r.id===B).days,0);
  });
  await check('cada racha se evalúa con la zona de su dueño, incluido el cruce de medianoche',async()=>{
    // UTC-12 y UTC+14 siempre caen en fechas distintas. Ambas son válidas en su zona.
    for(const tz of ['Etc/GMT+12','Pacific/Kiritimati']){
      const ds=(await db.query('select (now() at time zone $1)::date::text as ds',[tz])).rows[0].ds;
      await call(B,'sync',sync(7,ds,tz));assert.equal((await call(A)).rows.find(r=>r.id===B).days,7);
      await db.query("update streak_social_profiles set streak_through=($1::date-1) where user_id=$2",[ds,B]);
      assert.equal((await call(A)).rows.find(r=>r.id===B).days,7); // hoy pendiente no rompe
      await db.query("update streak_social_profiles set streak_through=($1::date-2) where user_id=$2",[ds,B]);
      assert.equal((await call(A)).rows.find(r=>r.id===B).days,0);
    }
  });
  await check('eliminar revoca ambas direcciones y no permite reusar el enlace',async()=>{
    await call(B,'remove',{friend:A});assert.equal((await call(A)).rows.length,1);assert.equal((await call(B)).rows.length,1);
    await rejected(()=>call(B,'accept',{token}));
  });
  await check('nueva invitación revoca la anterior; cancelar y caducar impiden aceptar',async()=>{
    const old=(await call(A,'invite')).token;token=(await call(A,'invite')).token;assert.notEqual(old,token);
    await rejected(()=>call(B,'accept',{token:old}));await call(A,'revoke');await rejected(()=>call(B,'accept',{token}));
    token=(await call(A,'invite')).token;
    await db.exec(`update streak_friend_invites set expires_at=now()-interval '1 second'`);
    await rejected(()=>call(B,'preview',{token}));await rejected(()=>call(B,'accept',{token}));
  });
  await check('desactivar borra amistades y enlaces, reactivar no los resucita',async()=>{
    token=(await call(A,'invite')).token;await call(B,'accept',{token});
    await call(A,'disable');assert.equal((await call(B)).rows.length,1);
    await rejected(()=>call(B,'accept',{token}));
    await call(A,'enable',{alias:'Nuevo alias'});assert.equal((await call(A)).rows.length,1);
  });
  await check('cuenta inactiva no opera ni aparece en la clasificación',async()=>{
    token=(await call(A,'invite')).token;await call(B,'accept',{token});
    await db.exec(`update profiles set active=false where id='${A}'`);
    await rejected(()=>call(A));assert.equal((await call(B)).rows.length,1);
  });
  console.log(`${tests}/${tests} pruebas PostgreSQL reales OK`);
} finally {await db.close();}
