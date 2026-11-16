// REQ-403: un guardado de prefs de fondo armado con una copia vieja no revierte
// el guardado más nuevo del usuario, y profile.prefs nunca se adelanta a la
// versión del plan (mañana coherente con lo guardado en cuanto se ve).
import {test,expect} from '@playwright/test';
import {installMocks,seedLoggedInUser,autoDismissNudges,gotoApp,completePrefs} from './helpers.js';
test('REQ-403: guardado de fondo con copia vieja no revierte el guardado del usuario',async({page,context})=>{
 const {calls}=await installMocks(context,{prefs:completePrefs({diet:['omnivoro'],activityLevel:'moderate'})});
 await seedLoggedInUser(page);await autoDismissNudges(page);await gotoApp(page);
 const r=await page.evaluate(async()=>{
  await ensurePlanVersion({prefs:profile.prefs,validFrom:START});
  const tomorrow=addDays(todayStr(),1),stale={...profile.prefs},seen=[];
  const probe=setInterval(()=>seen.push([profile.prefs.activityLevel,planPrefsForDate(tomorrow).activityLevel]),0);
  // Mismo patrón que profileQuestionBlockDay()/dismissRestartNudge(): la copia
  // de fondo se arma con las prefs viejas y se lanza sin esperar.
  const user=saveProfilePrefs({...profile.prefs,activityLevel:'high'},{validFrom:tomorrow});
  const background=saveProfilePrefs({...stale,restartNudgeDismissedAt:'2026-11-16T12:00:00.000Z'},{skipPlanVersion:true});
  const results=await Promise.all([user,background]);clearInterval(probe);
  return {errors:results.map(x=>x&&x.error),act:profile.prefs.activityLevel,nudge:profile.prefs.restartNudgeDismissedAt,tomorrow:planPrefsForDate(tomorrow).activityLevel,ahead:seen.filter(([p,t])=>p==='high'&&t!=='high').length,samples:seen.length};
 });
 expect(r.errors).toEqual([null,null]);
 expect(r.act).toBe('high');expect(r.nudge).toBe('2026-11-16T12:00:00.000Z');expect(r.tomorrow).toBe('high');
 expect(r.ahead).toBe(0);
 const upserts=calls.filter(c=>c.table==='profiles'&&c.method==='POST'&&c.payload&&c.payload.prefs);
 const last=upserts[upserts.length-1].payload.prefs;
 expect(last.activityLevel).toBe('high');expect(last.restartNudgeDismissedAt).toBe('2026-11-16T12:00:00.000Z');
});
