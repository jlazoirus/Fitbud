import {test,expect} from '@playwright/test';
import {installMocks,seedLoggedInUser,autoDismissNudges,gotoApp,completePrefs,todayYmd,collectConsoleErrors} from './helpers.js';
const archive='/Users/jonathan/.fitbros/qa-archive/req-390';
async function boot(page,context,overrides={},mockOptions={}){
 await page.clock.install({time:new Date(todayYmd()+'T12:00:00-05:00')});
 const mock=await installMocks(context,{...mockOptions,prefs:completePrefs({diet:['omnivoro'],mealCount:4,mealTimes:['08:00','12:00','16:00','20:00'],onboardingEssentialOnly:true,profileRefinedAt:null,...overrides})});
 await context.route('**/rest/v1/profiles**',route=>{if(route.request().method()==='POST'){const payload=route.request().postDataJSON();mock.tables.profiles.row={...mock.tables.profiles.row,...payload};}return route.fallback();});
 const events=[];page.on('request',r=>{if(r.url().endsWith('/api/analytics')&&r.method()==='POST')events.push(r.postDataJSON());});
 const errors=collectConsoleErrors(page);await seedLoggedInUser(page);await autoDismissNudges(page);await gotoApp(page);return {...mock,events,errors};
}
async function register(page){
 await page.getByRole('button',{name:'Registrar comida',exact:true}).click();await page.fill('#f_name','Mi comida privada');
 for(const [key,value] of Object.entries({f_kcal:'400',f_p:'25',f_c:'45',f_f:'13'}))await page.fill('#'+key,value);
 await page.locator('#overlay').getByRole('button',{name:'Guardar',exact:true}).click();await expect(page.locator('#overlay')).toHaveCount(0);
}
async function advance(page,n){
 const ds=await page.evaluate(n=>addDays(todayStr(),n),n);await page.clock.setFixedTime(new Date(ds+'T12:00:00-05:00'));await page.evaluate(()=>{current=todayStr();render();});
}
async function valueMoment(page){await page.evaluate(()=>{dayState(todayStr()).extras.push({id:'test'+Date.now(),name:'Comida privada',kcal:400,p:25,c:45,f:13,done:true});commitDay(todayStr());render();});}
for(const width of [390,1280])test(`REQ-390: primera comida, una pregunta, respuesta privada y metas futuras (${width})`,async({page,context})=>{
 await page.setViewportSize({width,height:844});const {events,errors}=await boot(page,context);
 await expect(page.locator('#profileQuestion')).toHaveCount(0);await expect(page.locator('.home-technique')).toHaveCount(0);
 const before=await page.evaluate(async()=>{await ensurePlanVersion({prefs:profile.prefs,validFrom:START});return {today:buildDay(todayStr()).target,past:JSON.stringify(planPrefsForDate(addDays(todayStr(),-1))),days:JSON.stringify(S.days)};});
 await register(page);await expect(page.locator('#profileQuestion')).toBeVisible();await expect(page.locator('#profileQuestionTitle')).toContainText('cuánto te mueves');
 expect(await page.locator('#profileQuestion button').evaluateAll(els=>els.every(el=>el.getBoundingClientRect().height>=44))).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('#profileQuestion').scrollIntoViewIfNeeded();await page.screenshot({path:archive+`/activity-${width}.png`});
 const logs=await page.evaluate(()=>JSON.stringify(S.days));await page.getByRole('button',{name:'Tengo trabajo físico o mucha actividad diaria',exact:true}).click();
 await expect(page.locator('#profileQuestion')).toHaveCount(0);
 const after=await page.evaluate(()=>({p:profile.prefs,today:buildDay(todayStr()).target,past:JSON.stringify(planPrefsForDate(addDays(todayStr(),-1))),future:planPrefsForDate(addDays(todayStr(),1)),days:JSON.stringify(S.days),notify:notifyAskWanted(1)}));
 expect(after.p.activityLevel).toBe('high');expect(after.p.macroTargetsValidFrom).toBe(await page.evaluate(()=>addDays(todayStr(),1)));expect(after.today).toEqual(before.today);expect(after.past).toBe(before.past);expect(after.days).toBe(logs);expect(after.future.activityLevel).toBe('high');expect(after.notify).toBe(false);expect(after.p.profileRefinedAt).toBeFalsy();
 await valueMoment(page);await expect(page.locator('#profileQuestion')).toHaveCount(0);await gotoApp(page);await expect(page.locator('#profileQuestion')).toHaveCount(0);
 await expect.poll(()=>events.filter(e=>e.event_type==='profile_question_answered').length).toBe(1);
 expect(events.filter(e=>e.event_type.startsWith('profile_question_')).map(e=>e.properties)).toEqual([{question:'activityLevel'},{question:'activityLevel'}]);expect(errors).toEqual([]);
});
test('REQ-390: posponer persiste tres días, dos veces avanza a la siguiente',async({page,context})=>{
 await boot(page,context);await register(page);await page.locator('#profileQuestion').getByRole('button',{name:'Ahora no',exact:true}).click();await expect(page.locator('#profileQuestion')).toHaveCount(0);
 await gotoApp(page);await advance(page,1);await valueMoment(page);await expect(page.locator('#profileQuestion')).toHaveCount(0);
 await advance(page,2);await valueMoment(page);await expect(page.locator('#profileQuestionTitle')).toContainText('cuánto te mueves');
 await page.locator('#profileQuestion').getByRole('button',{name:'Ahora no',exact:true}).click();await expect(page.locator('#profileQuestion')).toHaveCount(0);
 await advance(page,3);await valueMoment(page);await expect(page.locator('#profileQuestionTitle')).toContainText('ingredientes prefieres evitar');expect(await page.evaluate(()=>profile.prefs.profileRefinedAt)).toBeFalsy();
});
test('REQ-390: terminar entreno dispara la pregunta; abrir con un entreno ya terminado no',async({page,context})=>{
 await boot(page,context);await expect(page.locator('#profileQuestion')).toHaveCount(0);
 await page.evaluate(()=>{dayState(todayStr()).workoutDone=true;commitDay(todayStr());render();});await expect(page.locator('#profileQuestion')).toBeVisible();
});
test('REQ-390: no comparte día con el pedido de avisos',async({page,context})=>{
 await boot(page,context);await page.evaluate(()=>trackNotifyPrompt('streak','shown'));await expect.poll(()=>page.evaluate(()=>profile.prefs.profileQuestions?.blockedOn)).toBe(await page.evaluate(()=>todayStr()));
 await register(page);await expect(page.locator('#profileQuestion')).toHaveCount(0);await gotoApp(page);await valueMoment(page);await expect(page.locator('#profileQuestion')).toHaveCount(0);
});
test('REQ-390: una sugerencia de técnica vista en día de posposición bloquea la pregunta manual',async({page,context})=>{
 const next=new Date(todayYmd()+'T12:00:00-05:00');next.setDate(next.getDate()+3);
 await boot(page,context,{profileQuestions:{nextEligibleOn:next.toISOString().slice(0,10)}});
 await page.locator('.menu-suggestion').getByRole('button',{name:'Ahora no',exact:true}).click();await expect(page.locator('.home-technique')).toBeVisible();await page.locator('[data-tab="perfil"]').click();await page.getByRole('button',{name:'Continuar en Hoy',exact:true}).click();await expect(page.locator('#profileQuestion')).toHaveCount(0);
 expect(await page.evaluate(()=>profileQuestionDayKind())).toBe('technique');
});
test('REQ-390: completar respuestas diarias cierra el aviso; errores permiten reintentar',async({page,context})=>{
 const {events}=await boot(page,context);await page.locator('[data-tab="perfil"]').click();await page.getByRole('button',{name:'Continuar en Hoy',exact:true}).click();await expect(page.locator('#profileQuestion')).toBeVisible();
 const answers=[['activityLevel','Me muevo bastante durante el día'],['dislikedIngredients','aceitunas privadas'],['preferredIngredients','avena privada'],['preferredDishes','plato privado'],['cookingLevel','Lo básico'],['mealCount','4 comidas'],['mealTimes','08:00, 12:00, 16:00, 20:00'],['trainingExperience','Estoy empezando'],['sessionMinutes','45'],['limitations','molestia privada'],['bodyFatPct','No lo sé']];
 for(let i=0;i<answers.length;i++){
  const [key,value]=answers[i];if(i){await advance(page,1);await expect(page.locator('#profileQuestion')).toHaveCount(0);await valueMoment(page);}
  await expect(page.locator('#profileQuestion')).toBeVisible();expect(await page.evaluate(()=>profile.prefs.profileQuestions.lastQuestion)).toBe(key);
  if(['activityLevel','cookingLevel','mealCount','trainingExperience','bodyFatPct'].includes(key))await page.locator('#profileQuestion').getByRole('button',{name:value,exact:true}).click();
  else{
   if(key==='mealTimes'){await page.fill('#profileQuestionValue','25:00');await page.getByRole('button',{name:'Guardar respuesta',exact:true}).click();await expect(page.locator('#profileQuestionStatus')).toContainText('HH:MM');}
   await page.fill('#profileQuestionValue',value);await page.getByRole('button',{name:'Guardar respuesta',exact:true}).click();
  }
  await expect(page.locator('#profileQuestion')).toHaveCount(0);await expect.poll(()=>page.evaluate(()=>profileQuestionBusy)).toBe(false);
 }
 const prefs=await page.evaluate(()=>profile.prefs);expect(prefs.profileQuestions.answered).toHaveLength(11);expect(prefs.profileRefinedAt).toBeTruthy();expect(prefs.bodyFatPct).toBeNull();expect(prefs.limitations).toBe('molestia privada');
 await page.locator('[data-tab="perfil"]').click();await expect(page.getByRole('button',{name:'Continuar en Hoy',exact:true})).toHaveCount(0);
 expect(events.filter(e=>e.event_type==='profile_question_answered')).toHaveLength(11);expect(JSON.stringify(events.filter(e=>e.event_type.startsWith('profile_question_')))).not.toMatch(/privad|molestia|25:00/);
});
test('REQ-390: un fallo de guardado conserva la pregunta y permite reintentar sin duplicar',async({page,context})=>{
 await boot(page,context);await register(page);await expect(page.locator('#profileQuestion')).toBeVisible();
 let fail=true;await context.route('**/rest/v1/profiles**',route=>{const r=route.request();if(fail&&r.method()==='POST'&&r.postDataJSON()?.prefs?.profileQuestions?.status==='answered'){fail=false;return route.fulfill({status:500,contentType:'application/json',body:JSON.stringify({message:'fixture failure'})});}return route.fallback();});
 const choice=page.locator('#profileQuestion').getByRole('button',{name:'Me muevo bastante durante el día',exact:true});await choice.click();await expect(page.locator('#profileQuestionStatus')).toContainText('Puedes reintentar');await expect(choice).toBeEnabled();
 expect(await page.evaluate(()=>profile.prefs.profileQuestions.answered)).toEqual([]);await choice.click();await expect(page.locator('#profileQuestion')).toHaveCount(0);expect(await page.evaluate(()=>profile.prefs.profileQuestions.answered)).toEqual(['activityLevel']);
});
test('REQ-390: la invitación semanal conserva su marca y excluye preguntas ese día, también tras recargar',async({page,context})=>{
 await boot(page,context,{}, {reminderInvite:true});await page.evaluate(()=>showReminderInvite());
 const dialog=page.getByRole('dialog',{name:'¿Te recordamos tu día?'});await expect(dialog).toBeVisible();await dialog.getByRole('button',{name:'Ahora no',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>profile.prefs.profileQuestions?.blockedOn)).toBe(await page.evaluate(()=>todayStr()));expect(await page.evaluate(()=>profile.prefs.reminderInviteLastShownAt)).toBeTruthy();
 await register(page);await expect(page.locator('#profileQuestion')).toHaveCount(0);await gotoApp(page);await valueMoment(page);await expect(page.locator('#profileQuestion')).toHaveCount(0);
 await advance(page,1);await valueMoment(page);await expect(page.locator('#profileQuestion')).toBeVisible();expect(await page.evaluate(()=>reminderInviteDue())).toBe(false);
});
test('REQ-390: empezar otro ciclo conserva el perfil ya completado',async({page,context})=>{
 const keys=['activityLevel','dislikedIngredients','preferredIngredients','preferredDishes','cookingLevel','mealCount','mealTimes','trainingExperience','sessionMinutes','limitations','bodyFatPct'];
 const refined=todayYmd()+'T10:00:00Z';await boot(page,context,{profileRefinedAt:refined,profileQuestions:{answered:keys}});
 await page.locator('[data-tab="perfil"]').click();await page.locator('#pfSecObjetivo > summary').click();await page.getByRole('button',{name:'Empezar de nuevo mi plan',exact:true}).click();await page.getByRole('button',{name:'Revisar mis datos y empezar',exact:true}).click();
 await expect(page.locator('#ob_name')).toBeVisible();await page.getByRole('button',{name:'Continuar',exact:true}).click();await page.getByRole('button',{name:'Continuar',exact:true}).click();
 await page.selectOption('#ob_diet_pattern','omnivoro');for(const el of await page.locator('#app select[id^="ob_safety_"]').all())await el.selectOption('no');await page.check('#ob_consent_core');
 await page.getByRole('button',{name:'Guardar mi plan',exact:true}).click();await expect(page.locator('#tabs')).toContainText('Hoy');expect(await page.evaluate(()=>profile.prefs.profileRefinedAt)).toBe(refined);expect(await page.evaluate(()=>needsProfileTuning(profile.prefs))).toBe(false);
});
