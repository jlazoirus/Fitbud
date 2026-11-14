import {test,expect} from '@playwright/test';
import {installMocks,seedLoggedInUser,autoDismissNudges,gotoApp,profileFixture,completePrefs} from './helpers.js';
async function boot(page,context,prefs={},dismiss=true){
 const mocks=await installMocks(context,{tables:{profiles:{row:profileFixture(prefs)}}});
 await seedLoggedInUser(page);if(dismiss)await autoDismissNudges(page);await gotoApp(page);return mocks;
}
async function next(page){await page.getByRole('button',{name:'Continuar',exact:true}).click();}
async function first(page){await page.fill('#ob_name','Ana');await page.selectOption('#ob_sex','female');await page.fill('#ob_age','30');await page.fill('#ob_height','165');await page.fill('#ob_weight','65');await next(page);}
async function visibleBack(page){
 const back=page.locator('[data-onboarding-back]');await expect(back).toBeVisible();
 const box=await back.boundingBox();expect(box.y).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThan(844);
}
for(const width of [390,1280])test(`REQ-388: atrás arriba y del navegador conserva valores de cada paso (${width})`,async({page,context})=>{
 await page.setViewportSize({width,height:844});await boot(page,context);await first(page);
 await visibleBack(page);await next(page);await visibleBack(page);
 await page.selectOption('#ob_sport','cycling');await page.selectOption('#ob_strength','none');await next(page);await visibleBack(page);
 await page.fill('#ob_allergies','maní');await page.fill('#ob_preferred_ingredients','avena');await page.check('#ob_diet_omnivoro');await page.check('#ob_consent_core');await page.selectOption('#ob_safety_chest_pain','no');
 await page.evaluate(()=>{document.querySelector('#app').scrollTop=800;});await visibleBack(page);
 await page.screenshot({path:`/Users/jonathan/.fitbros/qa-archive/req-388/sticky-${width}.png`});
 await page.goBack();await expect(page.locator('#ob_sport')).toHaveValue('cycling');await expect(page.locator('#ob_strength')).toHaveValue('none');
 await next(page);await expect(page.locator('#ob_allergies')).toHaveValue('maní');await expect(page.locator('#ob_preferred_ingredients')).toHaveValue('avena');await expect(page.locator('#ob_consent_core')).toBeChecked();
 await page.locator('[data-onboarding-back]').click();await expect(page.locator('#ob_sport')).toBeVisible();
 await page.locator('[data-onboarding-back]').click();await expect(page.locator('#ob_goal')).toBeVisible();
 await page.locator('[data-onboarding-back]').click();await expect(page.locator('#ob_name')).toHaveValue('Ana');
 expect(await page.evaluate(()=>JSON.stringify(history.state))).not.toContain('maní');
 expect(await page.evaluate(()=>JSON.stringify(history.state))).not.toContain('Ana');
});
test('REQ-388: revisión sale sin cambios y no reactiva onboarding al volver atrás desde Hoy',async({page,context})=>{
 const {calls}=await boot(page,context,completePrefs({diet:['omnivoro']}));
 await page.evaluate(()=>startOnboarding());const original=await page.evaluate(()=>JSON.stringify(profile.prefs));const writes=calls.length;
 await page.fill('#ob_weight','81');await next(page);await page.goBack();await expect(page.locator('#ob_weight')).toHaveValue('81');await page.getByRole('button',{name:'Salir sin cambios'}).click();
 await expect(page.locator('#tabs')).toContainText('Hoy');expect(await page.evaluate(()=>JSON.stringify(profile.prefs))).toBe(original);
 expect(calls.slice(writes).filter(c=>c.table==='profiles'&&c.method==='POST')).toHaveLength(0);
 await page.goForward();await expect(page.locator('#ob_goal')).toHaveCount(0);await expect(page.locator('#tabs')).toContainText('Hoy');
 await page.locator('[data-tab="perfil"]').click();await page.locator('[data-tab="hoy"]').click();
 expect(await page.evaluate(()=>({active:onboardingActive,id:onboardingHistoryId}))).toEqual({active:false,id:null});
});
test('REQ-388: atrás cierra primero aviso de actividad ligera y luego vuelve al entrenamiento',async({page,context})=>{
 await boot(page,context,{},false);await first(page);await next(page);
 await page.selectOption('#ob_sport','strength_only');await page.selectOption('#ob_strength','gym');
 await page.evaluate(()=>{UI.cardioNudgeDismissed=false;});await next(page);await expect(page.locator('#nudge_light_cardio')).toBeVisible();
 await page.goBack();await expect(page.locator('#overlay')).toHaveCount(0);await expect(page.locator('#ob_allergies')).toBeVisible();
 await page.goBack();await expect(page.locator('#ob_sport')).toHaveValue('strength_only');
});

test('REQ-388: guardar retira la navegación del onboarding y atrás mantiene Hoy',async({page,context})=>{
 await boot(page,context);await first(page);await next(page);await page.selectOption('#ob_sport','walking');await page.selectOption('#ob_strength','none');await next(page);
 await page.check('#ob_diet_omnivoro');await page.check('#ob_consent_core');for(const el of await page.locator('#app select[id^="ob_safety_"]').all())await el.selectOption('no');
 await page.getByRole('button',{name:'Guardar mi plan'}).click();await expect(page.locator('#tabs')).toContainText('Hoy');
 await page.goBack();await expect(page.locator('#ob_sport')).toHaveCount(0);await expect(page.locator('#tabs')).toContainText('Hoy');
 expect(await page.evaluate(()=>onboardingHistoryId)).toBeNull();
});
