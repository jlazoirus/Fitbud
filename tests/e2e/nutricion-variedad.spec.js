import { test, expect } from '@playwright/test';
import { parseCatalog } from '../../scripts/seed-catalog.mjs';
import { installMocks, seedLoggedInUser, gotoApp, autoDismissNudges, completePrefs, collectConsoleErrors } from './helpers.js';
const catalog=parseCatalog();

for(const width of [390,1280])test(`semanas y regeneración consideran el borrador sin guardar (${width}px)`,async({page,context})=>{
  await page.setViewportSize({width,height:900});
  await installMocks(context,{prefs:completePrefs({mealCount:4,diet:['vegetariano']})});
  await seedLoggedInUser(page);await autoDismissNudges(page);const errors=collectConsoleErrors(page);
  await gotoApp(page);await page.locator('[data-tab="nutricion"]').click();
  await page.evaluate(catalog=>{Object.assign(DB,catalog,{loaded:true});aiAvailable=()=>false;},catalog);
  await page.getByRole('button',{name:'Preparar mi semana',exact:true}).click();
  const overlay=page.locator('#overlay');await expect(overlay).toContainText('días preparados.');
  const before=await page.evaluate(()=>window._genWeek.daysData.map(d=>d.comidas.map(c=>c.dishSlug).join('|')));
  expect(new Set(before).size).toBe(before.length);
  // Explicitly requesting another day must also override learned habits.
  await page.evaluate(()=>{
    const habits=Object.fromEntries(window._genWeek.daysData[0].comidas.map(c=>[c.slot_id,{dishSlug:c.dishSlug,nombre:c.nombre}]));
    habitualBySlotForPrefs=()=>habits;
  });
  await overlay.getByRole('button',{name:'Cambiar comidas de este día'}).first().click();
  await expect.poll(()=>page.evaluate(()=>window._genWeek.daysData[0].comidas.map(c=>c.dishSlug).join('|'))).not.toBe(before[0]);
  // Force a reused response for every date: unsaved history must still produce
  // different days, and the explanation must stay in the review after rendering.
  await page.evaluate(async()=>{
    habitualBySlotForPrefs=()=>null;
    const repeated=structuredClone(window._genWeek.daysData[0].comidas);
    aiAvailable=()=>true;hasEntitlement=()=>true;
    generateOneDay=async()=>({res:{ok:true,comidas:structuredClone(repeated)},reused:true});
    await aiGenerateWeek();
  });
  await expect(overlay.getByRole('status')).toContainText('Por qué algunas opciones se parecen');
  const after=await page.evaluate(()=>window._genWeek.daysData.map(d=>d.comidas.map(c=>c.dishSlug).join('|')));
  expect(new Set(after).size).toBe(after.length);
  await page.evaluate(()=>document.querySelector('#genwOut').innerHTML=genWeekReviewHtml());
  await expect(overlay.getByRole('status')).toContainText('revisar tus preferencias');
  await expect(page.locator('#toast')).not.toContainText('Ya usaste tus opciones nuevas');
  expect(await overlay.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
  await page.screenshot({path:`/tmp/diet-review-${width}.png`});
  expect(errors).toEqual([]);
});
