import {test,expect} from '@playwright/test';
import {installMocks,seedLoggedInUser,gotoApp,autoDismissNudges,completePrefs,daysFromToday,USER_ID,collectConsoleErrors} from './helpers.js';

const meal=done=>({done,ovr:{name:'Comida registrada',kcal:500,p:30,c:50,f:15}});
const state=done=>({meals:{desayuno:meal(true),almuerzo:meal(done),cena:meal(false)},extras:[],workoutDone:true});
const row=(offset,done)=>({user_id:USER_ID,log_date:daysFromToday(offset),state:state(done),plan_version_id:null,updated_at:new Date().toISOString()});
async function boot(page,context,rows=[]){
  await installMocks(context,{prefs:completePrefs({planStartDate:daysFromToday(-25)}),tables:{day_log:{rows}}});
  await seedLoggedInUser(page);await autoDismissNudges(page);await gotoApp(page);await page.waitForLoadState('networkidle');
}
for(const [width,gap] of [[390,1],[1280,2]])test(`recuperar tras ${gap} fallos conserva el historial (${width}px)`,async({page,context})=>{
  await page.setViewportSize({width,height:844});
  const rows=Array.from({length:7},(_,i)=>row(-gap-1-i,true));
  for(let i=1;i<=gap;i++)rows.push(row(-i,false));
  rows.push(row(0,false));
  const errors=collectConsoleErrors(page);
  await boot(page,context,rows);
  await expect(page.locator('.return-card')).toContainText('Tu racha todavía se puede recuperar');
  const before=await page.evaluate(gap=>Array.from({length:gap},(_,i)=>JSON.stringify(S.days[addDays(todayStr(),-1-i)])),gap);
  expect(await page.evaluate(()=>streak())).toBe(0);
  await page.locator('#tabs').getByText('Progreso').click();
  await expect(page.locator('#streakPanel')).toContainText('Puedes recuperar tu racha de 7 días');
  await page.screenshot({path:`/tmp/racha-recuperable-${width}.png`});
  await page.evaluate(()=>{toggleMeal(todayStr(),'almuerzo');render();});
  await expect(page.locator('#streakPop .sp-card')).toContainText('Racha recuperada');
  await expect(page.locator('#streakPanel .streak-n')).toHaveText('8');
  await expect(page.locator('#streakPanel .streak-unit')).toHaveText('días de racha');
  const values=await page.evaluate(gap=>({today:streak(),stats:streakStats().combCur,best:cycleSummary(todayStr()).bestStreak,social:streakSocialSnapshot().count,engagement:engagementSnapshot().streak,history:Array.from({length:gap},(_,i)=>JSON.stringify(S.days[addDays(todayStr(),-1-i)]))}),gap);
  expect(values).toEqual({today:8,stats:8,best:8,social:8,engagement:8,history:before});
  await page.screenshot({path:`/tmp/racha-recuperada-${width}.png`});
  // Deshacer quita la recuperación, sin completar los días que faltaron.
  await page.evaluate(()=>{toggleMeal(todayStr(),'almuerzo');render();});
  await expect(page.locator('#streakPanel .streak-n')).toHaveText('0');
  await expect(page.locator('#streakPanel')).toContainText('Puedes recuperar tu racha de 7 días');
  await page.evaluate(()=>toggleMeal(todayStr(),'almuerzo'));
  await page.waitForLoadState('networkidle');await page.reload();await page.waitForLoadState('networkidle');
  expect(await page.evaluate(()=>streak())).toBe(8);
  expect(errors).toEqual([]);
});

test('límites: exige 7 días, admite dos fallos y cuenta solo los días cumplidos',async({page,context})=>{
  await boot(page,context);
  const cases=[
    {run:6,gap:1,done:true,want:1},
    {run:6,gap:2,done:true,want:1},
    {run:7,gap:1,done:true,want:8},
    {run:7,gap:2,done:true,want:8},
    {run:7,gap:3,done:true,want:1},
    {run:8,gap:0,done:false,want:8},
    {run:7,gap:2,done:false,want:0},
    {run:0,gap:2,done:true,want:1},
  ];
  for(const c of cases){
    const result=await page.evaluate(({run,gap,done})=>{
      S.days={};
      const m=done=>({done,ovr:{name:'Registrada',kcal:500,p:30,c:50,f:15}});
      const day=done=>({meals:{desayuno:m(done),almuerzo:m(done),cena:m(done)},workoutDone:true});
      for(let i=0;i<run;i++)S.days[addDays(todayStr(),-gap-1-i)]=day(true);
      S.days[todayStr()]=day(done);
      S.days[addDays(todayStr(),1)]=day(true); // futuro nunca suma
      return {current:streak(),stats:streakStats().combCur};
    },c);
    expect(result,JSON.stringify(c)).toEqual({current:c.want,stats:c.want});
  }
});
