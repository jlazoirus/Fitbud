import {selectOnboardingDays,selectOnboardingKind} from "./onboarding-actions.js";
import {test,expect} from '@playwright/test';
import {installMocks,seedLoggedInUser,autoDismissNudges,gotoApp,profileFixture,completePrefs} from './helpers.js';
for(const width of [390,1280])test(`REQ-387: indoor 3 días y fuerza 2, en casa, sesiones y registro sin duplicar (${width})`,async({page,context})=>{
 await page.setViewportSize({width,height:844});await page.clock.install({time:new Date('2026-11-17T12:00:00-05:00')});
 const {calls,tables}=await installMocks(context,{tables:{profiles:{row:profileFixture({})}}});await seedLoggedInUser(page);await autoDismissNudges(page);await gotoApp(page);
 await page.fill('#ob_name','Ana');await page.selectOption('#ob_sex','female');await page.fill('#ob_age','30');await page.fill('#ob_height','165');await page.fill('#ob_weight','70');
 await page.getByRole('button',{name:'Continuar'}).click();
 await page.selectOption('#ob_sport','indoor_cycling');await page.selectOption('#ob_strength','home');
 await page.selectOption('#ob_indoor_place','home');
 await selectOnboardingDays(page,[1,2,3,5,6]);
 for(const day of [1,2,3,5,6])await selectOnboardingKind(page,day,[1,5].includes(day)?'strength':'sport');
 await page.locator('#obDayKinds').scrollIntoViewIfNeeded();await page.screenshot({path:`/Users/jonathan/.fitbros/qa-archive/req-387/onboarding-${width}.png`});
 await page.getByRole('button',{name:'Continuar'}).click();await page.selectOption('#ob_diet_pattern','omnivoro');await page.check('#ob_consent_core');for(const s of await page.locator('#app select[id^="ob_safety_"]').all())await s.selectOption('no');
 await page.getByRole('button',{name:'Guardar mi plan'}).click();await expect(page.locator('#tabs')).toContainText('Hoy');
 const result=await page.evaluate(()=>{
   const prefs=profile.prefs;const weeks=trainingExpectedWeeks(prefs);
   return {prefs,weeks:weeks.map(w=>deterministicTrainingWeekPayload(w,prefs)),validation:weeks.map(w=>{
     const raw=deterministicTrainingWeekPayload(w,prefs);return TRAINING_PLAN.normalizeWeek(raw,{...trainingPlanValidationConfig(w,prefs),durationWeeks:resolvedPlanDuration(prefs),sessions:w.sessions,blockedTerms:trainingBlockedTerms(prefs)});
   })};
 });
 expect(result.validation.every(v=>v.ok),JSON.stringify(result.validation.filter(v=>!v.ok))).toBeTruthy();
 for(const week of result.weeks){const indoor=week.sessions.filter(s=>s.type==='indoor_cycling');expect(indoor).toHaveLength(3);for(const session of indoor){expect(session.location).toBe('home');expect(session.duration_minutes).toBeGreaterThanOrEqual(30);expect(session.duration_minutes).toBeLessThanOrEqual(60);}}
 expect(result.prefs.trainingLocations[2]).toBe('home');
 await page.locator('[data-tab="entreno"]').click();await expect(page.locator('#app')).toContainText('Indoor cycling');await page.screenshot({path:`/Users/jonathan/.fitbros/qa-archive/req-387/entreno-${width}.png`});
 const ds=await page.evaluate(()=>todayStr());
 await page.evaluate(ds=>{
   startWorkoutExecution(ds);finishWorkoutCountdown();const ex=normalizedWorkoutExecution(ds);ex.steps.forEach(s=>{s.status='done';});ex.elapsedSeconds=2700;ex.resumedAt=null;persistWorkoutExecution(ds,ex,false);openFinishWorkout(ds,false);
 },ds);
 await page.selectOption('#finishPain','none');await page.selectOption('#finishDifficulty','expected');await page.getByRole('button',{name:'Guardar resultado'}).click();
 const saved=await page.evaluate(ds=>({ex:S.days[ds].workoutExecution,manual:manualActivities(S.days[ds]),expected:estimateActivityKcal('spinning',45,'moderate',activityWeightKg().kg)}),ds);
 expect(saved.ex.status).toBe('completed');expect(saved.ex.estimatedKcal).toBe(saved.expected);expect(saved.manual).toHaveLength(0);
 await expect(page.locator('#app')).toContainText(`${saved.expected} kcal`);
 const post=calls.filter(c=>c.table==='profiles'&&c.method==='POST').at(-1).payload;
 tables.profiles.row=Array.isArray(post)?post[0]:post;
 await expect.poll(()=>calls.filter(c=>c.table==='day_log'&&c.method==='POST'&&c.payload?.state?.workoutExecution?.status==='completed').length).toBeGreaterThan(0);
 await page.reload();await page.waitForFunction(()=>typeof profile!=='undefined'&&profile&&!_authBusy);await page.locator('[data-tab="entreno"]').click();await expect(page.locator('#app')).toContainText('Sesión completada');
 expect(calls.some(c=>c.table==='day_log'&&c.method==='POST')).toBeTruthy();
});
test('REQ-387: solo indoor usa gimnasio por defecto y Perfil permite casa',async({page,context})=>{
 await installMocks(context,{prefs:completePrefs({diet:['omnivoro'],primarySport:'indoor_cycling',strengthMode:'none',strengthPlace:'none',trainingLocations:{}})});await seedLoggedInUser(page);await autoDismissNudges(page);await gotoApp(page);
 expect(await page.evaluate(()=>Object.values(trainingPrefs().locations).every(v=>v==='gym'))).toBeTruthy();
 await page.locator('[data-tab="perfil"]').click();await page.locator('#pfSecEntreno > summary').click();await page.selectOption('#pf_indoor_place','home');
 await page.evaluate(()=>saveProfile());expect(await page.evaluate(()=>Object.values(profile.prefs.trainingLocations).every(v=>v==='home')),await page.evaluate(()=>JSON.stringify({prefs:profile.prefs,toast:document.querySelector('#toast')?.textContent})) ).toBeTruthy();
});
