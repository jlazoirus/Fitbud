import { test, expect } from '@playwright/test';
import { installMocks, seedLoggedInUser, gotoApp, autoDismissNudges, completePrefs, collectConsoleErrors } from './helpers.js';

async function boot(page,context,{date='2026-11-02',prefs={}}={}){
  await page.clock.install({time:new Date(date+'T12:00:00-05:00')});
  const state=completePrefs({planStartDate:'2026-10-27',planEndDate:'2026-11-23',planDurationWeeks:4,...prefs});
  const {calls}=await installMocks(context,{prefs:state});
  const paid=[];page.on('request',r=>{if(r.url().includes('/api/claude'))paid.push(r.url());});
  await seedLoggedInUser(page);await autoDismissNudges(page);
  const errors=collectConsoleErrors(page);await gotoApp(page);
  return {calls,paid,errors};
}

for(const width of [320,390,1280])test(`fechas de Rocío: semana 1 termina hoy y calendario completo (${width}px)`,async({page,context})=>{
  await page.setViewportSize({width,height:900});
  const {calls,paid,errors}=await boot(page,context);
  await expect(page.locator('.plan-week-notice')).toContainText('Hoy termina tu semana 1. Mañana comienza la semana 2.');
  await page.locator('[data-tab="entreno"]').click();
  const app=page.locator('#app');
  await expect(app.locator('.wk-planline-meta')).toContainText('Semana 1 de 4 · 27 oct–2 nov');
  await expect(app.locator('.plan-week-help')).toHaveText('Tus semanas cuentan desde el día que empezaste tu plan.');
  await expect(app).toContainText('Semana 1 de 4 · 27 oct–2 nov · faltan 21 días para el final');
  const before=await page.evaluate(()=>({prefs:JSON.stringify(profile.prefs),versions:JSON.stringify(PLAN_VERSIONS),days:JSON.stringify(S.days)}));
  const initialWrites=calls.length;
  await page.evaluate(()=>document.querySelector('#app').scrollTop=0);
  if(width!==320)await page.screenshot({path:`work/plan-weeks-${width}.png`});
  await app.locator('.plan-week-notice').getByRole('button',{name:'Ver calendario'}).click();
  const overlay=page.locator('#overlay');
  await overlay.locator('.plan-weeks-details summary').click();
  await expect(overlay.locator('.plan-weeks-list li')).toHaveCount(4);
  await expect(overlay.locator('.plan-weeks-list li').nth(0)).toContainText('27 oct–2 nov');
  await expect(overlay.locator('.plan-weeks-list li').nth(1)).toContainText('3 nov–9 nov');
  await expect(overlay.locator('.plan-weeks-list li').nth(3)).toContainText('17 nov–23 nov');
  await expect(overlay.locator('[aria-current="step"]')).toContainText('Semana 1');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await overlay.evaluate(el=>el.querySelector('.sheet').scrollWidth<=el.querySelector('.sheet').clientWidth)).toBe(true);
  if(width!==320)await page.screenshot({path:`work/plan-calendar-${width}.png`});
  expect(await page.evaluate(()=>({prefs:JSON.stringify(profile.prefs),versions:JSON.stringify(PLAN_VERSIONS),days:JSON.stringify(S.days)}))).toEqual(before);
  expect(calls.slice(initialWrites).filter(c=>['profiles','day_log','plan_versions'].includes(c.table)&&c.method!=='GET')).toEqual([]);
  expect(paid).toEqual([]);expect(errors).toEqual([]);
});

test('semana 2 comienza sin registros, ocultar persiste y navegar no anuncia semanas futuras',async({page,context})=>{
  await boot(page,context,{date:'2026-11-03'});
  await expect(page.locator('.plan-week-notice')).toContainText('¡Comienza tu semana 2!');
  await expect(page.locator('.plan-week-notice')).toContainText('3 nov–9 nov');
  await page.locator('.plan-week-notice').getByRole('button',{name:'Ocultar aviso de semana'}).click();
  await expect(page.locator('.plan-week-notice')).toHaveCount(0);
  await page.locator('[data-tab="entreno"]').click();
  await expect(page.locator('.wk-planline-meta')).toContainText('Semana 2 de 4 · 3 nov–9 nov');
  await expect(page.locator('.plan-week-notice')).toHaveCount(0);
  await gotoApp(page);
  await expect(page.locator('.plan-week-notice')).toHaveCount(0);
  await page.evaluate(()=>{current='2026-11-10';setView('entreno');});
  await expect(page.locator('.wk-planline-meta')).toContainText('Semana 3 de 4 · 10 nov–16 nov');
  await expect(page.locator('.plan-week-notice')).toHaveCount(0);
});

test('avisos aislados por cuenta, ciclo y semana; regreso a mitad de semana no dice que empieza hoy',async({page,context})=>{
  await boot(page,context,{date:'2026-11-04'});
  await expect(page.locator('.plan-week-notice')).toContainText('Ya estás en tu semana 2');
  await page.locator('.plan-week-notice').getByRole('button',{name:'Ocultar aviso de semana'}).click();
  expect(await page.evaluate(()=>{
    const oldKey=planWeekNoticeKey(todayStr());
    session={...session,user:{...session.user,id:'00000000-0000-4000-8000-000000000099'}};
    const newKey=planWeekNoticeKey(todayStr());
    return oldKey!==newKey&&planWeekNoticeHtml(todayStr()).includes('Ya estás en tu semana 2');
  })).toBe(true);
  expect(await page.evaluate(()=>{
    const oldKey=planWeekNoticeKey(todayStr());
    profile.prefs={...profile.prefs,planCycleNumber:9};PLAN_VERSIONS=[];
    return oldKey!==planWeekNoticeKey(todayStr())&&planWeekNoticeHtml(todayStr()).includes('Ya estás en tu semana 2');
  })).toBe(true);
  await page.clock.setSystemTime(new Date('2026-11-10T12:00:00-05:00'));
  await page.evaluate(()=>{current=todayStr();render();});
  await expect(page.locator('.plan-week-notice')).toContainText('¡Comienza tu semana 3!');
});

test('final del ciclo no promete semana 5; antes del inicio no anuncia una semana',async({page,context})=>{
  await boot(page,context,{date:'2026-11-23'});
  const text=await page.evaluate(()=>planWeekNoticeHtml(todayStr()));
  expect(text).toContain('Hoy termina tu semana 4 y tu plan actual.');
  expect(text).not.toContain('semana 5');
  await page.clock.setSystemTime(new Date('2026-10-26T12:00:00-05:00'));
  expect(await page.evaluate(()=>planWeekNoticeHtml(todayStr()))).toBe('');
});

test('calendario de 10 semanas y cruce de año con fechas inequívocas',async({page,context})=>{
  await boot(page,context,{prefs:{planStartDate:'2026-10-27',planDurationWeeks:10,planEndDate:'2027-01-04'}});
  await page.locator('[data-tab="entreno"]').click();
  await page.locator('.wk-planline').click();
  await page.locator('.plan-weeks-details summary').click();
  await expect(page.locator('.plan-weeks-list li')).toHaveCount(10);
  await expect(page.locator('.plan-weeks-list li').nth(9)).toContainText('29 dic 2026–4 ene 2027');
});
