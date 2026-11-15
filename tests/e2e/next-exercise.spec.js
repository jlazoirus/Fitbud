import fs from 'node:fs';
import {test,expect} from '@playwright/test';
import {installMocks,seedLoggedInUser,autoDismissNudges,gotoApp,startGuidedSession,collectConsoleErrors} from './helpers.js';
const archive='/Users/jonathan/.fitbros/qa-archive/req-328';
async function boot(page,context){const mocks=await installMocks(context);const errors=collectConsoleErrors(page);await seedLoggedInUser(page);await autoDismissNudges(page);await gotoApp(page);await page.locator('[data-tab="entreno"]').click();await startGuidedSession(page);await page.getByRole('button',{name:'Ahora no',exact:true}).click();return {...mocks,errors};}
async function advance(page){const pending=page.locator('.set-done:not(.on)');while(await pending.count())await pending.first().click();await page.getByRole('button',{name:'Siguiente ejercicio',exact:true}).click();}
async function preview(page){
 const next=await page.evaluate(()=>{const ex=normalizedWorkoutExecution(current),i=nextWorkoutStepIndex(ex,ex.currentStep);if(i<0)return null;const step=ex.steps[i];return {i,name:step.type==='strength'?workoutStepName(step):step.label,sets:step.prescribedSets,reps:step.reps,rest:step.restLabel||`${step.restSeconds}s`};});
 if(next){await expect(page.locator('.player-next')).toContainText(next.name);if(next.sets)await expect(page.locator('.player-next-dose')).toHaveText(`${next.sets} × ${next.reps} · ${next.rest}`);}else await expect(page.locator('.player-next')).toHaveCount(0);
 return next;
}
for(const width of [320,360,390,1280])test(`REQ-328: siguiente real, una línea visible y avance de la sesión (${width})`,async({page,context})=>{
 await page.setViewportSize({width,height:844});const {errors}=await boot(page,context);
 const first=await preview(page);expect(first).toBeTruthy();
 const geometry=await page.evaluate(()=>{const el=document.querySelector('.player-next'),r=el.getBoundingClientRect(),title=document.querySelector('.player-title').getBoundingClientRect(),dose=document.querySelector('.player-dose').getBoundingClientRect(),sets=document.querySelector('.set-list').getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height,lineHeight:el.querySelector('.player-next-detail').getBoundingClientRect().height,titleBottom:title.bottom,doseTop:dose.top,setsTop:sets.top,overflow:document.documentElement.scrollWidth>innerWidth,buttons:el.querySelectorAll('button,a,input').length};});
 expect(geometry.top).toBeGreaterThanOrEqual(0);expect(geometry.bottom).toBeLessThan(844);expect(geometry.top).toBeGreaterThanOrEqual(geometry.titleBottom);expect(geometry.bottom).toBeLessThanOrEqual(geometry.doseTop);expect(geometry.height).toBeLessThanOrEqual(geometry.lineHeight+12.1);expect(geometry.setsTop).toBeLessThan(720);expect(geometry.overflow).toBe(false);expect(geometry.buttons).toBe(0);expect(await page.locator('.player-next-dose').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
 fs.writeFileSync(archive+`/layout-${width}.json`,JSON.stringify(geometry,null,2));await page.screenshot({path:archive+`/next-${width}.png`});
 let count=0;
 while(await page.getByRole('button',{name:'Siguiente ejercicio',exact:true}).count()){
  const next=await preview(page);await advance(page);count++;
  if(next&&await page.getByRole('button',{name:'Siguiente ejercicio',exact:true}).count())await expect(page.locator('.player-title h3')).toHaveText(next.name);
  else if(next){await expect(page.locator('.optional-offer')).toContainText(next.name);await page.locator('.optional-offer').getByRole('button',{name:'Ahora no',exact:true}).click();}
 }
 expect(count).toBeGreaterThanOrEqual(3);await expect(page.locator('.player-next')).toHaveCount(0);await page.getByRole('button',{name:'Finalizar y guardar sesión',exact:true}).click();
 await page.locator('#finishPain').selectOption('none');await page.locator('#finishDifficulty').selectOption('expected');await page.getByRole('button',{name:'Guardar resultado',exact:true}).click();await expect(page.locator('#app')).toContainText('Sesión completada');expect(errors).toEqual([]);
});
test('REQ-328: el picker aplaza el actual y la tarjeta coincide con el regreso real, conservando series y descanso',async({page,context})=>{
 const {errors}=await boot(page,context);const first=await page.locator('.player-title h3').innerText();
 await page.locator('.set-done').first().click();const saved=await page.evaluate(()=>{const ex=normalizedWorkoutExecution(current);return JSON.stringify(ex.steps[ex.currentStep].sets[0]);});
 await page.getByRole('button',{name:'Hacer otro ejercicio primero',exact:true}).click();await page.locator('#overlay button.opt').nth(1).click();await expect(page.locator('.player-next')).toContainText(first);await expect(page.locator('.player-next')).not.toContainText('opcional');
 const before=await page.evaluate(()=>JSON.stringify(normalizedWorkoutExecution(current)));await page.evaluate(()=>nextWorkoutStepHtml(normalizedWorkoutExecution(current)));expect(await page.evaluate(()=>JSON.stringify(normalizedWorkoutExecution(current)))).toBe(before);
 await advance(page);await expect(page.locator('.player-title h3')).toHaveText(first);expect(await page.evaluate(()=>{const ex=normalizedWorkoutExecution(current);return JSON.stringify(ex.steps[ex.currentStep].sets[0]);})).toBe(saved);await expect(page.locator('.workout-timer-value')).toBeVisible();await preview(page);expect(errors).toEqual([]);
});
for(const variation of [false,true])test(`REQ-328: nombre y dosis vigentes tras sustitución o variación (${variation})`,async({page,context})=>{
 await boot(page,context);
 const next=await page.evaluate(variation=>{const ex=normalizedWorkoutExecution(current),s=ex.steps[nextWorkoutStepIndex(ex,ex.currentStep)];Object.assign(s,{exerciseSlug:'hammer-curl',restLabel:'75 s entre series',prescribedSets:3,reps:'12-15',...(variation?{variationKind:'variant',variationName:'Curl con pausa larga y una variante de nombre muy extenso <segura>'}: {})});persistWorkoutExecution(current,ex,true);return workoutStepName(s);},variation);
 await preview(page);await expect(page.locator('.player-next')).toContainText(next);await expect(page.locator('.player-next')).toContainText('75 s entre series');expect(await page.locator('.player-next-name').evaluate(el=>getComputedStyle(el).textOverflow)).toBe('ellipsis');await advance(page);await expect(page.locator('.player-title h3')).toHaveText(next);
});
test('REQ-328: opcional por tiempo, sin siguiente pendiente y objetivo sin series',async({page,context})=>{
 await boot(page,context);
 await page.evaluate(()=>{const ex=normalizedWorkoutExecution(current);ex.steps.forEach((s,i)=>{if(i!==ex.currentStep&&i!==ex.steps.length-1)s.status='done';});persistWorkoutExecution(current,ex,true);});
 await expect(page.locator('.player-next')).toContainText('opcional');await expect(page.locator('.player-next')).toContainText('min');await expect(page.locator('.player-next')).not.toContainText('×');
 const label=await page.evaluate(()=>normalizedWorkoutExecution(current).steps.at(-1).label);await advance(page);await expect(page.locator('.optional-offer')).toContainText(label);await expect(page.locator('.player-next')).toHaveCount(0);await page.locator('.optional-offer').getByRole('button',{name:'Ahora no',exact:true}).click();await expect(page.locator('.player-next')).toHaveCount(0);
});
test('REQ-328: último ejercicio pendiente no muestra tarjeta; los omitidos no se anuncian',async({page,context})=>{
 await boot(page,context);await page.evaluate(()=>{const ex=normalizedWorkoutExecution(current);ex.steps.forEach((s,i)=>{if(i!==ex.currentStep)s.status=s.optional?'declined':'skipped';});persistWorkoutExecution(current,ex,true);});await expect(page.locator('.player-next')).toHaveCount(0);await advance(page);await expect(page.getByRole('button',{name:'Finalizar y guardar sesión',exact:true})).toBeVisible();
});
