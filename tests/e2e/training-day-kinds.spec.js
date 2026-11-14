import {selectOnboardingDays,selectOnboardingKind} from "./onboarding-actions.js";
import {test,expect} from '@playwright/test';
import {installMocks,seedLoggedInUser,autoDismissNudges,gotoApp,profileFixture,completePrefs} from './helpers.js';
async function boot(page,context,prefs={}){
 const result=await installMocks(context,{tables:{profiles:{row:profileFixture(prefs)}}});
 await seedLoggedInUser(page);await autoDismissNudges(page);await gotoApp(page);return result;
}
for(const width of [390,1280])test(`REQ-386: asigna fuerza y bici por día desde onboarding (${width})`,async({page,context})=>{
 await page.setViewportSize({width,height:844});const {calls}=await boot(page,context);
 await page.fill('#ob_name','Ana');await page.selectOption('#ob_sex','female');await page.fill('#ob_age','30');await page.fill('#ob_height','165');await page.fill('#ob_weight','62');
 await page.getByRole('button',{name:'Continuar'}).click();
 await page.selectOption('#ob_sport','cycling');await page.selectOption('#ob_strength','outdoor');
 await selectOnboardingDays(page,[1,2,3,5,6]);
 for(const d of [1,2,3,5,6])await selectOnboardingKind(page,d,[1,3,5].includes(d)?'strength':'sport');
 expect(await page.locator('#obDayKinds button').count()).toBe(5);
 await page.locator('#obDayKinds').scrollIntoViewIfNeeded();
 await page.screenshot({path:`/Users/jonathan/.fitbros/qa-archive/req-386/onboarding-${width}.png`});
 await page.getByRole('button',{name:'Continuar'}).click();await expect(page.locator('#ob_allergies')).toBeVisible();
 await page.check('#ob_consent_core');await page.selectOption('#ob_diet_pattern','omnivoro');
 for(const s of await page.locator('#app select[id^="ob_safety_"]').all())await s.selectOption('no');
 await page.getByRole('button',{name:'Guardar mi plan'}).click();await expect(page.locator('#tabs')).toContainText('Hoy');
 const prefs=await page.evaluate(()=>profile.prefs);
 expect(prefs.trainingDayKinds).toEqual({'1':'strength','2':'sport','3':'strength','5':'strength','6':'sport'});
 const weeks=await page.evaluate(()=>trainingExpectedWeeks(profile.prefs));
 for(const week of weeks)for(const session of week.sessions)expect(session.type).toBe([1,3,5].includes(session.weekday)?'strength':'cycling');
 const versions=calls.filter(c=>c.table==='plan_versions'&&c.method==='POST').map(c=>Array.isArray(c.payload)?c.payload[0]:c.payload);
 expect(versions.some(v=>v.snapshot?.prefs?.trainingDayKinds?.[2]==='sport')).toBeTruthy();
 await page.locator('[data-tab="entreno"]').click();await expect(page.locator('#app')).toContainText('Semana');
 await page.screenshot({path:`/Users/jonathan/.fitbros/qa-archive/req-386/entreno-${width}.png`,fullPage:true});
});
test('REQ-386: Perfil conserva asignación y pasado; exige ambos tipos y oculta selector si solo fuerza',async({page,context})=>{
 await boot(page,context,completePrefs({primarySport:'cycling',strengthMode:'gym',strengthPlace:'gym',trainingDays:[1,2,3,5,6],trainingDayKinds:{1:'strength',2:'sport',3:'strength',5:'strength',6:'sport'}}));
 await page.locator('[data-tab="perfil"]').click();await page.locator('#pfSecEntreno > summary').click();
 await expect(page.locator('#pf_kind_2')).toHaveValue('sport');
 await page.locator('#pfDayKinds').scrollIntoViewIfNeeded();
 await page.screenshot({path:'/Users/jonathan/.fitbros/qa-archive/req-386/perfil-390.png'});
 const past=await page.evaluate(async()=>{
   const ds=addDays(todayStr(),-1);
   await ensurePlanVersion({prefs:profile.prefs,validFrom:START});
   return {ds,kinds:JSON.stringify(planPrefsForDate(ds).trainingDayKinds),snapshots:PLAN_VERSIONS.map(v=>({id:v.id,snapshot:JSON.stringify(v.snapshot)}))};
 });
 const before=await page.evaluate(()=>JSON.stringify(PLAN_VERSIONS));
 for(const d of [1,2,3,5,6])await page.selectOption(`#pf_kind_${d}`,'strength');
 await page.evaluate(()=>saveProfile());await expect(page.getByText('Elige al menos un día de fuerza y uno de tu actividad',{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>JSON.stringify(PLAN_VERSIONS))).toBe(before);
 await page.selectOption('#pf_kind_3','sport');
 const draft=await page.evaluate(()=>{const d={};readTrainingFields('pf',d);return d;});
 expect(draft.trainingDayKinds[3]).toBe('sport');expect(draft.trainingLocations[3]).toBe('outdoor');
 await page.evaluate(()=>saveProfile());
 expect(await page.evaluate(ds=>JSON.stringify(planPrefsForDate(ds).trainingDayKinds),past.ds)).toBe(past.kinds);
 for(const row of past.snapshots)expect(await page.evaluate(id=>JSON.stringify(PLAN_VERSIONS.find(v=>v.id===id)?.snapshot),row.id)).toBe(row.snapshot);
 if(!await page.locator('#pfSecEntreno').evaluate(el=>el.open))await page.locator('#pfSecEntreno > summary').click();
 await expect(page.locator('#pf_kind_3')).toHaveValue('sport');
 await page.selectOption('#pf_sport','strength_only');await expect(page.locator('#pfDayKinds select')).toHaveCount(0);
});
