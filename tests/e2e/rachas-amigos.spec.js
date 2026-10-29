// REQ-300: UI real + RPC real en PostgreSQL/WASM. Solo el transporte es mock.
import {test as base,expect} from '@playwright/test';
import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {installMocks,seedLoggedInUser,gotoApp,autoDismissNudges,USER_ID,SUPA_URL,daysFromToday,collectConsoleErrors} from './helpers.js';

const FRIEND='e2e00000-0000-4000-8000-000000000002';
const doneMeal=()=>({done:true,ovr:{name:'Comida registrada',kcal:500,p:30,c:50,f:15}});
const doneDay=()=>({meals:{desayuno:doneMeal(),almuerzo:doneMeal(),cena:doneMeal()},extras:[],workoutDone:true});
const row=(offset,state=doneDay())=>({user_id:USER_ID,log_date:daysFromToday(offset),state,updated_at:new Date().toISOString()});
const test=base.extend({
  social:async({},use)=>{
    const db=new PGlite();
    await db.exec(`create role anon;create role authenticated;create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      create table public.profiles(id uuid primary key,active boolean default true);
      insert into auth.users values('${USER_ID}'),('${FRIEND}');insert into profiles select id,true from auth.users;`);
    await db.exec(readFileSync(new URL('../../supabase/streak_friends.sql',import.meta.url),'utf8'));
    let pending=Promise.resolve();const calls=[];
    function rpc(id,action='state',data={}){
      const next=pending.then(async()=>{
        await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);
        return (await db.query('select streak_social($1,$2::jsonb) as result',[action,JSON.stringify(data)])).rows[0].result;
      });pending=next.catch(()=>{});return next;
    }
    async function route(context){
      await context.route(`${SUPA_URL}/rest/v1/rpc/streak_social`,async route=>{
        const p=route.request().postDataJSON();calls.push(p);
        try{await route.fulfill({contentType:'application/json',body:JSON.stringify(await rpc(USER_ID,p.p_action,p.p_data))});}
        catch(e){await route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({code:e.code||'P0001',message:e.message})});}
      });
    }
    await use({db,rpc,route,calls});await pending;await db.close();
  }
});
async function setup(page,context,social,rows=[]){
  await installMocks(context,{tables:{day_log:{rows}}});await social.route(context);
  await seedLoggedInUser(page);await autoDismissNudges(page);await gotoApp(page);
  await page.getByRole('button',{name:'Ver mi racha y amigos'}).click();
  await expect(page.getByRole('button',{name:'Activar comparación'})).toBeVisible();
}
async function enable(page,alias='Mi alias'){
  await page.getByLabel('Tu alias para amigos').fill(alias);
  await page.getByRole('button',{name:'Activar comparación'}).click();
  await expect(page.getByRole('button',{name:'Crear invitación'})).toBeVisible();
}

test('activar, crear enlace, aceptar desde otra cuenta y revocar',async({page,context,social})=>{
  const errors=collectConsoleErrors(page);
  await setup(page,context,social,[row(-3),row(-2),row(-1)]);
  // REQ-302: la pantalla explica cómo se suma a un amigo y propone el primer nombre como alias.
  await expect(page.locator('.streak-steps')).toContainText('Elige tu alias');
  await expect(page.locator('.streak-steps')).toContainText('envía el enlace a un amigo');
  await expect(page.getByText('Nadie puede buscarte')).toBeVisible();
  await expect(page.getByLabel('Tu alias para amigos')).toHaveValue('Bro');
  await enable(page,'Ana');
  await expect(page.locator('.streak-you')).toContainText('Tus amigos te ven como Ana');
  await expect(page.locator('.streak-steps')).toHaveCount(0);
  const list=page.getByRole('list',{name:'Clasificación por racha actual'});
  await expect(list).toContainText('Ana (tú)');await expect(list.locator('.streak-days')).toHaveText('3días');
  await page.getByRole('button',{name:'Crear invitación'}).click();
  const link=await page.getByLabel(/Invitación para un amigo/).inputValue();
  const token=new URLSearchParams(new URL(link).hash.slice(1)).get('friend');
  await social.rpc(FRIEND,'enable',{alias:'Bruno'});
  await social.rpc(FRIEND,'sync',{count:5,through:daysFromToday(0),timezone:'America/Lima'});
  expect((await social.rpc(FRIEND)).rows).toHaveLength(1);
  await social.rpc(FRIEND,'accept',{token});
  await page.getByRole('button',{name:'Actualizar rachas'}).click();
  await expect(list.locator('li').first()).toContainText('Bruno');
  await expect(list.locator('.streak-place')).toHaveText(['1','2']);
  page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Eliminar amistad con Bruno'}).click();
  await expect(list.locator('li')).toHaveCount(1);expect((await social.rpc(FRIEND)).rows).toHaveLength(1);
  // Cancelar también funciona después de que el primer enlace se haya usado.
  await page.getByRole('button',{name:'Crear invitación'}).click();
  await page.getByRole('button',{name:'Cancelar enlace'}).click();
  await expect(page.getByLabel(/Invitación para un amigo/)).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('invitación persiste durante login y exige activar y aceptar antes de mostrar la racha',async({page,context,social})=>{
  await social.rpc(FRIEND,'enable',{alias:'Amigo invitante'});
  await social.rpc(FRIEND,'sync',{count:8,through:daysFromToday(0),timezone:'America/Lima'});
  const {token}=await social.rpc(FRIEND,'invite');
  await installMocks(context);await social.route(context);await autoDismissNudges(page);
  await page.goto('/index.html#friend='+token);
  await expect(page.getByText('Te invitaron a comparar rachas.')).toBeVisible();
  expect(await page.evaluate(()=>authRedirectUrl())).toContain('friend='+token);
  // Sesión posterior en la misma pestaña, como tras autenticar/confirmar correo.
  await seedLoggedInUser(page);await gotoApp(page);
  await expect(page.getByRole('heading',{name:'Amigo invitante te invita a comparar rachas'})).toBeVisible();
  await expect(page.getByRole('list',{name:'Clasificación por racha actual'})).toHaveCount(0);
  await enable(page,'Alias elegido');
  await expect(page.getByRole('button',{name:'Aceptar amistad'})).toBeVisible();
  expect((await social.rpc(FRIEND)).rows).toHaveLength(1);
  await page.getByRole('button',{name:'Aceptar amistad'}).click();
  await expect(page.getByRole('listitem').filter({hasText:'Amigo invitante'})).toBeVisible();
  expect(await page.evaluate(()=>sessionStorage.getItem(STREAK_INVITE_KEY))).toBeNull();
  await page.getByText('Alias y privacidad',{exact:true}).click();
  page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Dejar de comparar mi racha'}).click();
  await expect(page.getByRole('button',{name:'Activar comparación'})).toBeVisible();
  expect((await social.rpc(FRIEND)).rows).toHaveLength(1);
});

test('compartir usa la racha real, copiar es fallback y cancelar no anuncia éxito',async({page,context,social})=>{
  await setup(page,context,social,[row(-2),row(-1)]);
  await page.evaluate(()=>{
    window.shared=[];
    Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.shared.push(data);}});
  });
  await page.locator('#streakFriends').getByRole('button',{name:'Compartir mi racha'}).click();
  expect(await page.evaluate(()=>window.shared[0].text)).toBe('Llevo 2 días de racha en Evolv. ¿Te sumas? https://evolvapp.club/');
  await page.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new DOMException('Cancelado','AbortError');}}));
  await page.locator('#streakFriends').getByRole('button',{name:'Compartir mi racha'}).click();
  await expect(page.locator('#streakShareText')).toHaveCount(0);
  await page.evaluate(()=>{
    Object.defineProperty(navigator,'share',{configurable:true,value:undefined});
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copied=text;}}});
  });
  await page.locator('#streakFriends').getByRole('button',{name:'Compartir mi racha'}).click();
  expect(await page.evaluate(()=>window.copied)).toContain('Llevo 2 días');
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('denied');}}}));
  await page.locator('#streakFriends').getByRole('button',{name:'Compartir mi racha'}).click();
  await expect(page.getByLabel('Copia este texto para compartir')).toHaveValue(/Llevo 2 días/);
});

test('al registrar hoy sincroniza, empata y avisa cuando hay datos pendientes',async({page,context,social})=>{
  const partial={...doneDay(),meals:{desayuno:doneMeal()},workoutDone:false};
  await setup(page,context,social,[row(-2),row(-1),row(0,partial)]);await enable(page,'Ana');
  await social.rpc(FRIEND,'enable',{alias:'Bruno'});await social.rpc(FRIEND,'sync',{count:3,through:daysFromToday(0),timezone:'America/Lima'});
  const {token}=await social.rpc(FRIEND,'invite');await social.rpc(USER_ID,'accept',{token});
  await page.evaluate(()=>{
    const d=dayState(todayStr());d.workoutDone=true;
    for(const m of buildDay(todayStr()).meals){const s=mealState(todayStr(),m.id);s.ovr={name:'Comida real',kcal:500,p:30,c:50,f:15};s.done=true;}
    commitDay(todayStr());
  });
  await expect.poll(()=>social.calls.filter(c=>c.p_action==='sync').at(-1)?.p_data.count,{timeout:15000}).toBe(3);
  await page.getByRole('button',{name:'Actualizar rachas'}).click();
  await expect(page.locator('.streak-place')).toHaveText(['1','1']);
  await page.evaluate(()=>Object.defineProperty(navigator,'onLine',{configurable:true,value:false}));
  await page.getByRole('button',{name:'Actualizar rachas'}).click();
  await expect(page.locator('#streakFriends')).toContainText('Actualización pendiente');
});

test('logout limpia datos incluso con respuesta tardía',async({page,context,social})=>{
  await setup(page,context,social);await enable(page,'Alias privado');
  // Guardamos el callback para simular una respuesta posterior a cerrar sesión.
  let release;const barrier=new Promise(resolve=>{release=resolve;});
  await context.route(`${SUPA_URL}/rest/v1/rpc/streak_social`,async route=>{
    await barrier;await route.fulfill({contentType:'application/json',body:JSON.stringify({enabled:true,alias:'Alias privado',rows:[{alias:'Dato privado',days:7}]})});
  });
  await page.evaluate(()=>{refreshStreakSocial();clearSignedOutState();});
  release();
  await expect(page.locator('.landing')).toBeVisible();
  expect(await page.evaluate(()=>({rows:streakSocial.rows,alias:streakSocial.alias,invite:streakSocialInvite}))).toEqual({rows:[],alias:'',invite:null});
  await expect(page.locator('body')).not.toContainText('Dato privado');
});

test('un fallo de red muestra reintento y recuperarse borra el error',async({page,context,social})=>{
  await setup(page,context,social);await enable(page,'Mi alias');
  const fail=route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'Unavailable'})});
  await context.route(`${SUPA_URL}/rest/v1/rpc/streak_social`,fail);
  await page.getByRole('button',{name:'Actualizar rachas'}).click();
  await expect(page.locator('#streakFriends')).toContainText('No pudimos actualizar las rachas');
  await context.unroute(`${SUPA_URL}/rest/v1/rpc/streak_social`,fail);
  await page.getByRole('button',{name:'Actualizar rachas'}).click();
  await expect(page.locator('#streakFriends')).not.toContainText('No pudimos actualizar');
  await expect(page.locator('.streak-person')).toContainText('Mi alias');
});

test('migración ausente ofrece compartir y explica disponibilidad sin vocabulario técnico',async({page,context,social})=>{
  await installMocks(context);await social.route(context);await seedLoggedInUser(page);await autoDismissNudges(page);
  await context.route(`${SUPA_URL}/rest/v1/rpc/streak_social`,route=>route.fulfill({status:404,contentType:'application/json',body:JSON.stringify({code:'PGRST202',message:'Could not find function'})}));
  await gotoApp(page);await page.getByRole('button',{name:'Ver mi racha y amigos'}).click();
  await expect(page.locator('#streakFriends')).toContainText('La comparación con amigos estará disponible pronto');
  await expect(page.locator('#streakFriends').getByRole('button',{name:'Compartir mi racha'})).toBeVisible();
  await expect(page.locator('#streakFriends')).not.toContainText('PGRST');
});
