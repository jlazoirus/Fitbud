// Contraste del backlog con main: navegador real, red simulada, sin datos reales.
import { chromium } from '../../../node_modules/playwright/index.mjs';
import { installMocks, seedLoggedInUser, gotoApp, autoDismissNudges } from '../../../tests/e2e/helpers.js';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const out=new URL('./evidence/2026-10-24/',import.meta.url);
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const report={at:new Date().toISOString(),base:'62c7860',mode:'fixtures; no producción',observations:[]};
async function run(name,task){
  const context=await browser.newContext({baseURL:'http://127.0.0.1:8923',viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:'es-PE',timezoneId:'America/Lima',serviceWorkers:'block'});
  await installMocks(context);const page=await context.newPage();
  await seedLoggedInUser(page);await autoDismissNudges(page);await gotoApp(page);
  await page.locator('#tabs').getByText('Nutrición',{exact:true}).click();
  await page.getByRole('button',{name:/Agregar comida \/ snack/i}).first().click();
  const details=await task(page);
  await page.screenshot({path:new URL(name+'.png',out).pathname});
  report.observations.push({name,...details});await context.close();
}
try{
  await run('negative-manual',async page=>{
    await page.locator('#f_name').fill('Entrada negativa de prueba');
    for(const [id,value] of [['kcal','-100'],['p','-10'],['c','0'],['f','0']])await page.locator('#f_'+id).fill(value);
    await page.locator('#overlay').getByRole('button',{name:'Guardar',exact:true}).click();
    const entry=await page.evaluate(()=>dayState(todayStr()).extras.at(-1));
    assert.equal(entry.kcal,-100);
    return {finding:'Se aceptan nutrientes negativos sin error',entry};
  });
  await run('ingredient-snapshot',async page=>{
    await page.locator('.qp-tab[data-tab="food"]').click();
    await page.locator('#qpSearch').fill('pollo');
    await page.locator('#qpGrams0').fill('33.5');
    await page.locator('#qpList').getByRole('button',{name:'Añadir',exact:true}).first().click();
    const draft=await page.locator('#f_name').inputValue();
    await page.locator('#overlay').getByRole('button',{name:'Guardar',exact:true}).click();
    const entry=await page.evaluate(()=>dayState(todayStr()).extras.at(-1));
    assert.ok(!entry.components&&!entry.ingredients&&!entry.origin);
    return {finding:'Gramos redondeados; ingredientes convertidos en texto y totales sin líneas editables ni procedencia',draft,entry};
  });
  await run('fallback-template',async page=>{
    await page.route('**/api/claude',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({text:JSON.stringify({kcal:500,proteina_g:25,carbohidratos_g:55,grasa_g:20,nota:'Estimación de referencia. Ajusta la porción si conoces la receta.'}),reused:true})}));
    await page.locator('#f_name').fill('Un vaso de agua');
    await page.getByRole('button',{name:/Estimar macros/}).click();
    await page.waitForFunction(()=>document.querySelector('#f_kcal')?.value==='500');
    return {finding:'La plantilla genérica del código se aplica como estimación; respuesta reuse simulada, no prueba de incidencia en producción',kcal:await page.locator('#f_kcal').inputValue(),text:await page.locator('#aiOut').innerText()};
  });
  writeFileSync(new URL('probes.json',out),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
