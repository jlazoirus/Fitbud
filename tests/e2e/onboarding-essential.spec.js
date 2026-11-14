import fs from 'node:fs';
import {test,expect} from '@playwright/test';
import {installMocks,seedLoggedInUser,autoDismissNudges,gotoApp,profileFixture,completePrefs} from './helpers.js';
import {selectOnboardingDays,selectOnboardingKind} from './onboarding-actions.js';
for(const width of [390,1280])test(`REQ-389: tres pantallas compactas, ≤20 campos y semana segura (${width})`,async({page,context})=>{
 await page.setViewportSize({width,height:844});const {calls}=await installMocks(context,{tables:{profiles:{row:profileFixture({})}}});
 const events=[];page.on('request',r=>{if(r.url().endsWith('/api/analytics')&&r.method()==='POST')events.push(r.postDataJSON());});
 await seedLoggedInUser(page);await autoDismissNudges(page);await gotoApp(page);
 let fields=0;const measurements=[];
 async function inspect(step){
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax','3');
  fields+=await page.locator('.onboarding input,.onboarding select,.onboarding textarea').count();
  const size=await page.locator('.onboarding').evaluate(el=>({height:el.scrollHeight,overflow:el.scrollWidth>el.clientWidth}));
  measurements.push({step,fields:await page.locator('.onboarding input,.onboarding select,.onboarding textarea').count(),...size});
  expect(size.height).toBeLessThanOrEqual(844*1.5);expect(size.overflow).toBe(false);
  await page.screenshot({path:`/Users/jonathan/.fitbros/qa-archive/req-389/step-${step}-${width}.png`});
 }
 await inspect(1);await page.fill('#ob_name','Ana privada');await page.selectOption('#ob_sex','female');await page.fill('#ob_age','30');await page.fill('#ob_height','165');await page.fill('#ob_weight','65');
 await page.getByRole('button',{name:'Continuar',exact:true}).click();
 await page.selectOption('#ob_sport','indoor_cycling');await page.selectOption('#ob_strength','home');await selectOnboardingDays(page,[1,2,3,4,5,6]);
 for(const day of [1,2,3,4,5,6])await selectOnboardingKind(page,day,[1,3,5].includes(day)?'strength':'sport');
 await inspect(2);await page.getByRole('button',{name:'Continuar',exact:true}).click();
 await inspect(3);expect(fields).toBeLessThanOrEqual(20);
 fs.writeFileSync(`/Users/jonathan/.fitbros/qa-archive/req-389/layout-${width}.json`,JSON.stringify({fields,measurements},null,2));
 await page.check('#ob_diet_sin_lacteos');await page.getByRole('button',{name:'Guardar mi plan'}).click();await expect(page.locator('#toast')).toContainText('Elige cómo comes');
 await page.selectOption('#ob_diet_pattern','omnivoro');await page.fill('#ob_allergies','maní');await page.check('#ob_diet_sin_lacteos');
 await page.uncheck('#ob_consent_core');await page.getByRole('button',{name:'Guardar mi plan'}).click();await expect(page.locator('#toast')).toContainText('Acepta el uso esencial');
 await page.check('#ob_consent_core');await page.getByRole('button',{name:'Guardar mi plan'}).click();await expect(page.locator('#toast')).toContainText('cuatro preguntas de seguridad');
 expect(calls.filter(c=>c.table==='plan_versions'&&c.method==='POST')).toHaveLength(0);
 for(const el of await page.locator('#app select[id^="ob_safety_"]').all())await el.selectOption('no');
 const metas=await page.evaluate(()=>({kcal:onboardingDraft.calorieTarget,p:onboardingDraft.proteinTarget,c:onboardingDraft.carbTarget,f:onboardingDraft.fatTarget}));expect(metas.kcal).toBe(4*metas.p+4*metas.c+9*metas.f);
 await page.getByRole('button',{name:'Guardar mi plan'}).click();await expect(page.locator('#tabs')).toContainText('Hoy');
 const prefs=await page.evaluate(()=>profile.prefs);expect(prefs.onboardingEssentialOnly).toBe(true);expect(prefs.planDurationWeeks).toBe(10);expect(prefs.activityLevel).toBe('high');expect(prefs.allergies).toBe('maní');expect(prefs.diet).toContain('sin_lacteos');
 const meals=await page.evaluate(()=>buildDay(todayStr()).meals.map(m=>mealValue(m,mealState(todayStr(),m.id))));
 expect(JSON.stringify(meals).toLowerCase()).not.toMatch(/maní|yogur|leche/);
 const views=events.filter(e=>e.event_type==='onboarding_step_view'||e.type==='onboarding_step_view');expect(views.length).toBeGreaterThanOrEqual(3);
 expect(JSON.stringify(views)).not.toMatch(/Ana privada|maní|allerg|weight|sex/);
 const done=events.find(e=>e.event_type==='onboarding_complete'||e.type==='onboarding_complete');expect(done).toBeTruthy();expect(done.properties.duration_s).toBeGreaterThanOrEqual(0);
});
test('REQ-389: ajustes visibles de Perfil recalculan coherentemente desde mañana y conservan el pasado',async({page,context})=>{
 await installMocks(context,{prefs:completePrefs({diet:['omnivoro']})});await seedLoggedInUser(page);await autoDismissNudges(page);await gotoApp(page);
 const before=await page.evaluate(async()=>{await ensurePlanVersion({prefs:profile.prefs,validFrom:START});return {ds:addDays(todayStr(),-1),past:JSON.stringify(planPrefsForDate(addDays(todayStr(),-1))),today:JSON.stringify(planPrefsForDate(todayStr())),todayTarget:buildDay(todayStr()).target};});
 await page.locator('[data-tab="perfil"]').click();await page.locator('#pfSecObjetivo > summary').click();await expect(page.locator('#pf_activity')).toBeVisible();await expect(page.locator('#pf_kcal')).toBeVisible();
 await page.selectOption('#pf_activity','high');await page.getByRole('button',{name:'Recalcular con estos datos'}).click();await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>profile.prefs.activityLevel)).toBe('high');
 const after=await page.evaluate(ds=>({p:profile.prefs,past:JSON.stringify(planPrefsForDate(ds)),today:JSON.stringify(planPrefsForDate(todayStr())),tomorrow:planPrefsForDate(addDays(todayStr(),1)),todayTarget:buildDay(todayStr()).target,tomorrowTarget:buildDay(addDays(todayStr(),1)).target}),before.ds);
 expect(after.p.calorieTarget).toBe(after.p.proteinTarget*4+after.p.carbTarget*4+after.p.fatTarget*9);expect(after.p.activityLevel).toBe('high');expect(after.tomorrow.activityLevel).toBe('high');expect(after.past).toBe(before.past);expect(after.today).toBe(before.today);expect(after.todayTarget).toEqual(before.todayTarget);expect(after.tomorrowTarget.kcal).toBe(after.p.calorieTarget);
});
