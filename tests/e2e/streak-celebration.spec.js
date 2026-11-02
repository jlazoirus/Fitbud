import {test,expect} from '@playwright/test';
import {installMocks,seedLoggedInUser,gotoApp,autoDismissNudges,daysFromToday,USER_ID,collectConsoleErrors} from './helpers.js';
const meal=done=>({done,ovr:{name:'Comida registrada',kcal:500,p:30,c:50,f:15}});
const state=complete=>({meals:{desayuno:meal(true),almuerzo:meal(complete),cena:meal(false)},extras:[],workoutDone:true});
const row=(offset,complete)=>({user_id:USER_ID,log_date:daysFromToday(offset),state:state(complete),plan_version_id:null,updated_at:new Date().toISOString()});
const card=page=>page.locator('#streakPop .sp-card');
async function setup(page,context,n=4,recover=false){
 const rows=Array.from({length:n-1},(_,i)=>row(-i-1,true));rows.push(row(0,false));
 if(recover)rows.find(r=>r.log_date===daysFromToday(-1)).state=state(false);
 await installMocks(context,{tables:{day_log:{rows}}});await seedLoggedInUser(page);await autoDismissNudges(page);
 const errors=collectConsoleErrors(page);await gotoApp(page);await page.waitForLoadState('networkidle');return errors;
}
const completeToday=page=>page.evaluate(()=>toggleMeal(todayStr(),'almuerzo'));
for(const n of [2,4,8])test(`REQ-304: celebra también el día ${n}, aunque no sea un hito`,async({page,context})=>{
 await page.setViewportSize({width:n===4?1280:390,height:844});
 const errors=await setup(page,context,n);await completeToday(page);
 await expect(card(page)).toHaveClass(/sp-earned/);await expect(card(page).locator('.sp-from')).toHaveText(String(n-1));await expect(card(page).locator('.sp-to')).toHaveText(String(n));
 await expect(card(page)).toContainText(`Día ${n} sumado`);await expect(card(page)).toContainText('Este día lo sumaste tú');
 await expect(page.locator('#streakPop')).toHaveAttribute('aria-live','polite');expect(errors).toEqual([]);
});
test('REQ-304: no repite al renderizar, recargar o desmarcar y volver a marcar el mismo día',async({page,context})=>{
 await setup(page,context);await completeToday(page);await expect(card(page)).toHaveClass(/sp-earned/);
 await page.evaluate(()=>toggleMeal(todayStr(),'almuerzo'));await expect(card(page)).toHaveCount(0);
 await page.evaluate(()=>{toggleMeal(todayStr(),'almuerzo');render();});await expect(card(page)).toHaveCount(0);
 await page.reload();await gotoApp(page);await page.waitForLoadState('networkidle');await expect(card(page)).toHaveCount(0);
});
test('REQ-304: espera al primer plano y cancela una celebración que se deshizo antes de verse',async({page,context})=>{
 await setup(page,context);
 await page.evaluate(()=>{window.streakHidden=true;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.streakHidden});document.dispatchEvent(new Event('visibilitychange'));toggleMeal(todayStr(),'almuerzo');});
 await expect(card(page)).toHaveCount(0);
 await page.evaluate(()=>{toggleMeal(todayStr(),'almuerzo');window.streakHidden=false;document.dispatchEvent(new Event('visibilitychange'));});await expect(card(page)).toHaveCount(0);
 await completeToday(page);await expect(card(page)).toHaveClass(/sp-earned/);await expect(card(page).locator('.sp-to')).toHaveText('4');
});
test('REQ-304: un incremento en segundo plano se celebra al volver',async({page,context})=>{
 await setup(page,context);
 await page.evaluate(()=>{window.streakHidden=true;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.streakHidden});toggleMeal(todayStr(),'almuerzo');});await expect(card(page)).toHaveCount(0);
 await page.evaluate(()=>{window.streakHidden=false;document.dispatchEvent(new Event('visibilitychange'));});await expect(card(page)).toHaveClass(/sp-earned/);await expect(card(page).locator('.sp-from')).toHaveText('3');await expect(card(page).locator('.sp-to')).toHaveText('4');
});
test('REQ-304: completar ayer y hoy rápido conserva ambas celebraciones en orden',async({page,context})=>{
 await setup(page,context,5,true);
 await page.evaluate(()=>{toggleMeal(addDays(todayStr(),-1),'almuerzo');toggleMeal(todayStr(),'almuerzo');});
 await expect(card(page)).toHaveClass(/sp-recovered/);await expect(card(page).locator('.sp-to')).toHaveText('4');
 await card(page).click();await expect(card(page)).toHaveClass(/sp-day/);await expect(card(page).locator('.sp-from')).toHaveText('4');await expect(card(page).locator('.sp-to')).toHaveText('5');
});
test('REQ-304: movimiento reducido conserva el resultado sin destellos ni desplazamiento',async({page,context})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await setup(page,context);await completeToday(page);await expect(card(page)).toHaveClass(/sp-earned/);
 const animations=await card(page).evaluate(el=>({spark:getComputedStyle(el.querySelector('.sp-sparks')).animationName,flame:getComputedStyle(el.querySelector('.sp-flame svg')).animationName,to:getComputedStyle(el.querySelector('.sp-to')).animationName}));
 expect(animations).toEqual({spark:'none',flame:'none',to:'spFade'});
});
test('REQ-304: se puede leer con foco de teclado y cerrar con Enter',async({page,context})=>{
 await setup(page,context);await page.clock.install();await completeToday(page);await card(page).focus();await page.clock.fastForward(9000);await expect(card(page)).toBeVisible();await page.keyboard.press('Enter');await page.clock.runFor(250);await expect(card(page)).toHaveCount(0);
});
test('REQ-304: salir limpia también celebraciones pendientes de la cuenta',async({page,context})=>{
 await setup(page,context);await page.evaluate(()=>{window.streakHidden=true;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.streakHidden});toggleMeal(todayStr(),'almuerzo');clearSignedOutState();window.streakHidden=false;document.dispatchEvent(new Event('visibilitychange'));});await expect(card(page)).toHaveCount(0);
});

test('REQ-304: permanece legible ocho segundos y después se retira sola',async({page,context})=>{
 await setup(page,context);await page.clock.install();await completeToday(page);await page.clock.runFor(32);await page.clock.fastForward(7900);await expect(card(page)).toBeVisible();await page.clock.runFor(400);await expect(card(page)).toHaveCount(0);
});

test('REQ-304: el primer registro desde conversación también celebra el día',async({page,context})=>{
 await setup(page,context);await page.evaluate(()=>{profile.prefs.labs={...(profile.prefs.labs||{}),conversational:true};profile.prefs.uiMode='chat';resetStreakFeedback();render();});
 expect(await page.evaluate(()=>chatModeActive())).toBe(true);await completeToday(page);await expect(card(page)).toHaveClass(/sp-earned/);await expect(card(page).locator('.sp-to')).toHaveText('4');
});
