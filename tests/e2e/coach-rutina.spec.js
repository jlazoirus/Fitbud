import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, gotoApp, autoDismissNudges, collectConsoleErrors, startGuidedSession, completePrefs } from "./helpers.js";

const exercises=[{exerciseId:"leg-press",sets:3,reps:"10-12",restSeconds:90},{exerciseId:"seated-leg-curl",sets:3,reps:"12",restSeconds:75}];
async function boot(page,context,options={}){
  const mock=await installMocks(context,options);
  // Este journey exige recargar el perfil: el fixture general solo da estado a day_log/planes.
  await context.route('**/rest/v1/profiles**',route=>{
    if(route.request().method()==='POST'){
      const payload=route.request().postDataJSON();
      mock.tables.profiles.row={...mock.tables.profiles.row,...payload};
    }
    return route.fallback();
  });
  await seedLoggedInUser(page);await autoDismissNudges(page);await gotoApp(page);
  return mock;
}
async function proposal(page,context,mutate=x=>x){
  const weekday=await page.evaluate(()=>parseYmd(todayStr()).getDay());
  const action=mutate({tipo:"actualizar_rutina",style:"machines",sessions:[{weekday,name:"Mi pierna en máquinas",exercises:structuredClone(exercises)}]});
  const requests=[];
  await context.route("**/api/claude",route=>{
    requests.push(route.request().postDataJSON());
    return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({text:JSON.stringify({type:"propuesta",respuesta:"**Tu rutina**\\nConservamos tus ejercicios.\\nRevísala antes de guardar.",accion:action})})});
  });
  return {action,requests};
}
async function ask(page){
  await page.locator('#coachInput').fill('Quiero cambiar mi rutina: prensa y curl femoral, solo máquinas.');
  await page.locator('#coachInput').press('Enter');
  await expect(page.locator('.coach-msg.coach:not(#coachTyping)').last()).toContainText('Revísala antes de guardar');
}
for(const width of [320,390,1280])test(`conversar, revisar y guardar una rutina persistente (${width}px)`,async({page,context},testInfo)=>{
  await page.setViewportSize({width,height:844});
  const {calls,tables}=await boot(page,context),errors=collectConsoleErrors(page);
  const {action,requests}=await proposal(page,context);
  const before=await page.evaluate(()=>({prefs:JSON.stringify(profile.prefs),past:JSON.stringify(S.days)}));
  await page.getByRole('button',{name:'Cuéntame cómo entrenas',exact:true}).click();
  await expect(page.locator('#overlay')).toContainText('¿Cómo es tu rutina actual?');
  await page.locator('#rc_training_style').selectOption('machines');
  await page.locator('#rc_routine').fill('Smart Fit: prensa 3x10-12 y curl femoral sentado 3x12.');
  await page.locator('#rc_keep').fill('Quiero conservar los dos ejercicios y evitar el peso libre.');
  await page.locator('#overlay details summary').click();
  await page.locator('[name="rc_preserve"][value="leg-press"]').check();
  await page.screenshot({path:testInfo.outputPath('conversacion.png')});
  await page.getByRole('button',{name:'Preparar propuesta',exact:true}).click();
  const review=page.getByRole('button',{name:'Revisar rutina semanal',exact:true});
  await expect(review).toBeVisible();
  expect(requests).toHaveLength(1);
  expect(requests[0].quota.validation.routine.requiredStyle).toBe('machines');
  expect(requests[0].userText).toContain('current_sessions');
  expect(await page.evaluate(()=>JSON.stringify(profile.prefs))).toBe(before.prefs);
  expect(calls.filter(c=>c.table==='profiles'&&c.payload?.prefs?.weeklyRoutine)).toHaveLength(0);
  const bubble=page.locator('.coach-msg.coach:not(#coachTyping) .chat-bubble').last();
  await expect(bubble).toHaveText('Tu rutina\nConservamos tus ejercicios.\nRevísala antes de guardar.');
  await expect(bubble).not.toContainText('**');
  await review.click();
  await expect(page.locator('#overlay')).toContainText('Prensa de piernas');
  await expect(page.locator('#overlay')).toContainText('3 × 10-12');
  await expect(page.locator('#overlay')).toContainText('se repite',{ignoreCase:true});
  expect(await page.evaluate(()=>JSON.stringify(profile.prefs))).toBe(before.prefs);
  await page.screenshot({path:testInfo.outputPath('revision.png')});
  await page.getByRole('button',{name:'Aplicar a mis próximos entrenamientos',exact:true}).evaluate(el=>{el.click();el.click();});
  await expect(page.locator('#overlay')).toHaveCount(0);
  await expect.poll(()=>tables.profiles.row.prefs.weeklyRoutine?.sessions).toEqual(action.sessions);
  expect(calls.filter(c=>c.table==='profiles'&&c.payload?.prefs?.weeklyRoutine)).toHaveLength(1);
  const assertWorkout=async()=>{
    await page.locator('[data-tab="entreno"]').click();
    await expect(page.locator('.workout .name')).toContainText('Mi pierna en máquinas');
    expect(await page.locator('.exercise-card').evaluateAll(cards=>cards.map(card=>card.dataset.exercise))).toEqual(exercises.map(item=>item.exerciseId));
    expect(await page.evaluate(()=>workoutPrescription(current).steps.filter(s=>s.type==='strength').map(s=>({id:s.exerciseSlug,sets:s.prescribedSets,reps:s.reps,rest:s.restSeconds})))).toEqual(exercises.map(e=>({id:e.exerciseId,sets:e.sets,reps:e.reps,rest:e.restSeconds})));
  };
  await assertWorkout();
  await page.screenshot({path:testInfo.outputPath('entreno.png')});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await page.evaluate(()=>effectiveWorkout(addDays(todayStr(),7)).workout.name)).toBe('Mi pierna en máquinas');
  await gotoApp(page);
  await expect(page.locator('.agenda-item.kind-workout .agenda-name')).toHaveText('Mi pierna en máquinas');
  await assertWorkout();
  await startGuidedSession(page);
  const frozen=await page.evaluate(()=>JSON.stringify(dayState(current).workoutExecution.contentPrescription));
  await page.evaluate(()=>{profile.prefs.weeklyRoutine=null;profile.prefs.trainingStyle='free_weights';render();});
  expect(await page.evaluate(()=>JSON.stringify(workoutPrescription(current)))).toBe(frozen);
  await expect(page.locator('.wk-context')).toContainText('Mi pierna en máquinas');
  expect(errors).toEqual([]);
});

test('una propuesta inválida no ofrece aplicar ni cambia la rutina',async({page,context})=>{
  await boot(page,context);
  await proposal(page,context,action=>{action.sessions[0].exercises[0].exerciseId='back-squat';return action;});
  const before=await page.evaluate(()=>JSON.stringify(profile.prefs));
  await ask(page);
  await expect(page.getByRole('button',{name:'Revisar rutina semanal',exact:true})).toHaveCount(0);
  await expect(page.locator('.coach-action-note')).toContainText(/preferencia|recursos/);
  expect(await page.evaluate(()=>JSON.stringify(profile.prefs))).toBe(before);
});

test('revalidar al guardar: perfil cambiado, desconexión y error remoto',async({page,context})=>{
  const {tables}=await boot(page,context);await proposal(page,context);await ask(page);
  await page.getByRole('button',{name:'Revisar rutina semanal',exact:true}).click();
  await context.setOffline(true);
  await page.locator('#routine_apply').click();
  await expect(page.locator('#routine_save_error')).toContainText('Conéctate');
  expect(tables.profiles.row.prefs.weeklyRoutine).toBeUndefined();
  await context.setOffline(false);
  await context.route('**/rest/v1/profiles**',route=>route.request().method()==='POST'?route.fulfill({status:500,contentType:'application/json',body:'{"message":"No disponible"}'}):route.fallback());
  await page.locator('#routine_apply').click();
  await expect(page.locator('#routine_save_error')).toContainText('No se pudo guardar');
  expect(await page.evaluate(()=>profile.prefs.weeklyRoutine)).toBeUndefined();
  await page.evaluate(()=>{profile.prefs.sessionMinutes=20;});
  await page.locator('#routine_apply').click();
  await expect(page.locator('#overlay')).toHaveCount(0);
  expect(tables.profiles.row.prefs.weeklyRoutine).toBeUndefined();
});

test('conservar ejercicios es obligatorio y los días ya registrados permanecen intactos',async({page,context})=>{
  await boot(page,context);await proposal(page,context);
  const seed=await page.evaluate(()=>{
    const today=todayStr(),past=addDays(today,-7),future=addDays(today,7);
    dayState(today).workoutDone=true;dayState(today).workoutOverride='fullB';
    dayState(past).workoutDone=true;dayState(past).customExercises=['back-squat'];
    dayState(future).customExercises=['back-squat'];
    return {today,past,future,old:JSON.stringify(dayState(today)),history:JSON.stringify(dayState(past))};
  });
  await ask(page);
  await page.getByRole('button',{name:'Revisar rutina semanal',exact:true}).click();
  await page.locator('#routine_apply').click();
  await expect(page.locator('#overlay')).toHaveCount(0);
  expect(await page.evaluate(d=>JSON.stringify(dayState(d)),seed.today)).toBe(seed.old);
  expect(await page.evaluate(d=>JSON.stringify(dayState(d)),seed.past)).toBe(seed.history);
  expect(await page.evaluate(d=>dayState(d).customExercises,seed.future)).toBeUndefined();
  expect(await page.evaluate(d=>effectiveWorkout(d).workout.name,seed.future)).toBe('Mi pierna en máquinas');
  await page.evaluate(()=>{
    const action={tipo:'actualizar_rutina',style:'machines',sessions:[{weekday:parseYmd(todayStr()).getDay(),name:'Incompleta',exercises:[{exerciseId:'leg-press',sets:3,reps:'12',restSeconds:90},{exerciseId:'leg-extension',sets:3,reps:'12',restSeconds:90}]}]};
    saveCoachChat([{id:'keep',role:'coach',type:'propuesta',text:'Revisa',accion:action,routineBrief:{preserve:['seated-leg-curl']}}]);render();
  });
  await expect(page.locator('.coach-action-note')).toContainText('no conserva');
});

test('preferencia de máquinas en Perfil y planes pendientes; el chat mantiene HTML como texto',async({page,context})=>{
  const {tables}=await boot(page,context,{prefs:completePrefs({diet:['omnivoro']})});await page.locator('[data-tab="perfil"]').click();
  await page.locator('#pf_training_style').evaluate(el=>el.closest('details').open=true);
  await page.locator('#pf_training_style').selectOption('machines');
  await page.waitForFunction(()=>!nutritionUpdating);
  await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();
  await expect.poll(()=>tables.profiles.row.prefs.trainingStyle).toBe('machines');
  await page.waitForFunction(()=>profile.prefs.trainingStyle==='machines');
  const resources=await page.evaluate(()=>({prefs:trainingPrefsForDate(todayStr()).trainingStyle,
    ids:effectiveWorkout(todayStr()).workout.exerciseIds.map(id=>({id,equipment:exerciseBySlug(id).equipment}))}));
  expect(resources.prefs).toBe('machines');expect(resources.ids.length).toBeGreaterThan(1);
  for(const item of resources.ids)expect(item.equipment).not.toEqual(expect.arrayContaining(['barbell']));
  await page.evaluate(()=>{saveCoachChat([{id:'xss',role:'coach',text:'**Hola**\\n<img src=x onerror="window.injected=true">',type:'educativo'}]);setView('hoy');});
  await expect(page.locator('.coach-msg.coach:not(#coachTyping) .chat-bubble').last()).toContainText('<img');
  await expect(page.locator('.coach-msg.coach:not(#coachTyping) .chat-bubble img')).toHaveCount(0);
  expect(await page.evaluate(()=>window.injected)).toBeUndefined();
});

test('ajustar un día conserva el resto de la rutina y volver al plan no borra sesiones iniciadas',async({page,context})=>{
  const {tables}=await boot(page,context);
  const other=await page.evaluate(items=>{
    const weekday=routineContext().days.find(day=>day.weekday!==parseYmd(todayStr()).getDay()).weekday;
    const session={weekday,name:'Otro día que quiero conservar',exercises:items};
    profile.prefs.weeklyRoutine={version:1,cycle:cycleNumber(),start:todayStr(),end:END,sessions:[session]};
    let date=todayStr();while(parseYmd(date).getDay()!==weekday)date=addDays(date,1);
    dayState(date).customExercises=['machine-chest-press','machine-shoulder-press'];
    profile.prefs.trainingStyle='machines';render();return session;
  },exercises);
  await proposal(page,context);await ask(page);
  await page.getByRole('button',{name:'Revisar rutina semanal',exact:true}).click();
  await expect(page.locator('#overlay')).toContainText(other.name);
  await page.locator('#routine_apply').click();
  await expect(page.locator('#overlay')).toHaveCount(0);
  expect(tables.profiles.row.prefs.weeklyRoutine.sessions).toContainEqual(other);
  expect(await page.evaluate(weekday=>{
    let date=todayStr();while(parseYmd(date).getDay()!==weekday)date=addDays(date,1);
    return dayState(date).customExercises;
  },other.weekday)).toEqual(['machine-chest-press','machine-shoulder-press']);
  await page.locator('[data-tab="entreno"]').click();
  await startGuidedSession(page);
  const before=await page.evaluate(()=>JSON.stringify(workoutPrescription(current)));
  await page.locator('[data-tab="hoy"]').click();
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Volver al plan sugerido',exact:true}).click();
  await expect.poll(()=>tables.profiles.row.prefs.weeklyRoutine).toBeNull();
  await page.waitForFunction(()=>profile.prefs.weeklyRoutine===null);
  expect(await page.evaluate(()=>JSON.stringify(workoutPrescription(current)))).toBe(before);
});

test('fallo del servicio o respuesta incompleta no guardan una rutina',async({page,context})=>{
  const {calls}=await boot(page,context);
  await context.route('**/api/claude',route=>route.fulfill({status:422,contentType:'application/json',body:JSON.stringify({error:'No disponible'})}));
  await page.locator('#coachInput').fill('Prepara mi rutina');await page.locator('#coachInput').press('Enter');
  await expect(page.locator('.chat-type').last()).toHaveText('No disponible');
  expect(calls.filter(c=>c.table==='profiles'&&c.payload?.prefs?.weeklyRoutine)).toHaveLength(0);
  await context.route('**/api/claude',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({text:'{"type":"propuesta","respuesta":"Mi rutina"'})}));
  await page.locator('#coachInput').fill('Inténtalo otra vez');await page.locator('#coachInput').press('Enter');
  await expect(page.locator('.coach-msg.coach:not(#coachTyping) .chat-bubble').last()).toContainText('No pude preparar');
  await expect(page.getByRole('button',{name:'Revisar rutina semanal',exact:true})).toHaveCount(0);
});

test('respuesta tardía no se entrega a otra cuenta; la evaluación de seguridad sigue bloqueando',async({page,context})=>{
  await boot(page,context);
  let release;const ready=new Promise(resolve=>{release=resolve;});let requested=false;
  await context.route('**/api/claude',async route=>{requested=true;await ready;await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({text:JSON.stringify({type:'educativo',respuesta:'Rutina privada de la cuenta anterior'})})});});
  await page.locator('#coachInput').fill('Quiero ajustar mi rutina');await page.locator('#coachInput').press('Enter');
  await expect.poll(()=>requested).toBe(true);
  await page.evaluate(()=>{session.user.id='another-user';profile.prefs={...profile.prefs,weeklyRoutine:null};});
  release();
  await expect(page.locator('#coach-busy')).toBeHidden();
  expect(await page.evaluate(()=>loadCoachChat())).toEqual([]);
  await page.evaluate(()=>{safetyScreening={...safetyScreening,has_red_flags:true,cleared_for_training:false,responses:{chest_pain:true}};render();});
  await expect(page.getByRole('button',{name:'Cuéntame cómo entrenas',exact:true})).toHaveCount(0);
});
