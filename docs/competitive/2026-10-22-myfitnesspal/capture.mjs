// Evidencia local, con fixtures. Sin llamadas pagadas ni cambios de producción.
// Requiere servidor estático en 127.0.0.1:8923 y Chromium del entorno.
import { chromium } from '../../../node_modules/playwright/index.mjs';
import { installMocks, seedLoggedInUser, gotoApp, autoDismissNudges } from '../../../tests/e2e/helpers.js';
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const output=new URL('./evidence/',import.meta.url);
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const report={date:new Date().toISOString(),environment:'local con fixtures, no producción',screens:[],journeys:[]};
async function capture(page,name){
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:new URL(name+'.png',output).pathname});
  const details=await page.evaluate(()=>({
    text:document.querySelector('#overlay')?.innerText||document.querySelector('#app').innerText,
    headings:[...document.querySelectorAll('#app h1,#app h2,#overlay h3')].map(e=>e.textContent),
    viewport:{width:innerWidth,height:innerHeight},
    overflow:document.documentElement.scrollWidth>innerWidth,
    buttons:[...document.querySelectorAll('#app button,#overlay button')].filter(e=>e.checkVisibility()).map(e=>e.innerText||e.getAttribute('aria-label'))
  }));
  report.screens.push({name,...details});
}
try{
  for(const device of [{name:'mobile',width:390,height:844},{name:'desktop',width:1440,height:900}]){
    const context=await browser.newContext({baseURL:'http://127.0.0.1:8923',viewport:{width:device.width,height:device.height},hasTouch:device.name==='mobile',isMobile:device.name==='mobile',locale:'es-PE',timezoneId:'America/Lima',serviceWorkers:'block'});
    const {calls}=await installMocks(context);
    const page=await context.newPage();
    await seedLoggedInUser(page);await autoDismissNudges(page);await gotoApp(page);
    await capture(page,device.name+'-hoy');
    await page.locator('#tabs').getByText('Nutrición',{exact:true}).click();
    await capture(page,device.name+'-nutricion');
    if(device.name==='mobile'){
      await page.getByRole('button',{name:/Agregar comida \/ snack/}).click();
      await capture(page,'mobile-registro-comida');
      await page.locator('#f_name').fill('Yogur de prueba');
      for(const [key,value] of [['kcal','150'],['p','12'],['c','15'],['f','5']])await page.locator('#f_'+key).fill(value);
      await page.locator('#overlay').getByRole('button',{name:'Guardar',exact:true}).click();
      assert.match(await page.locator('#app').innerText(),/Yogur de prueba/);
      report.journeys.push({id:'J01',task:'Registrar snack manual',result:'ok',navigationClicks:2,fields:5,notes:'Desde Nutrición: abrir editor y guardar. Requiere conocer los macros; el extra queda consumido.'});
      await page.locator('#tabs').getByText('Hoy',{exact:true}).click();
      await page.getByRole('button',{name:'Preparar mi día',exact:true}).first().click();
      await page.locator('#overlay').getByRole('button',{name:'Aplicar al día',exact:true}).waitFor();
      await capture(page,'mobile-revision-plan');
      await page.locator('#overlay').getByRole('button',{name:'Aplicar al día',exact:true}).click();
      await page.locator('#tabs').getByText('Nutrición',{exact:true}).click();
      await capture(page,'mobile-nutricion-preparada');
      const first=page.locator('.meal:not(.done) button.chk:not([disabled])').first();
      await first.click();
      await capture(page,'mobile-comida-registrada');
      report.journeys.push({id:'J02',task:'Preparar y consumir comida planificada',result:'ok',navigationClicks:3,notes:'Desde Hoy: preparar, aplicar y marcar; cambio de pestaña excluido. Datos de plan y consumo separados.'});
      await page.getByRole('button',{name:'Más opciones de nutrición',exact:true}).click();
      await capture(page,'mobile-opciones-nutricion');
      const menu=await page.locator('#overlay').innerText();
      report.journeys.push({id:'J03',task:'Recuperar lista de compras del plan activo',result:'sin acceso dedicado identificado',menu,notes:'El código la conserva en snapshot y la presenta en revisión semanal; no hay entrada en este menú.'});
      await page.evaluate(()=>closeModal());
    }
    await page.locator('#tabs').getByText('Entreno',{exact:true}).click();
    await capture(page,device.name+'-entreno');
    if(device.name==='mobile'){
      await page.getByRole('button',{name:'Iniciar sesión guiada',exact:true}).click();
      await capture(page,'mobile-entreno-guiado');
      report.journeys.push({id:'J04',task:'Iniciar sesión guiada',result:'ok',navigationClicks:1,notes:'Desde Entreno, muestra bloque actual y control de sesión.'});
    }
    await page.locator('#tabs').getByText('Progreso',{exact:true}).click();
    await capture(page,device.name+'-progreso');
    report.journeys.push({id:'J05-'+device.name,task:'Navegar por Hoy/Nutrición/Entreno/Progreso',result:'ok',dayWrites:calls.filter(c=>c.table==='day_log'&&c.method==='POST').length});
    await context.close();
  }
  writeFileSync(new URL('journeys.json',output),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({screens:report.screens.length,journeys:report.journeys.length,overflow:report.screens.filter(x=>x.overflow).map(x=>x.name)}));
}finally{await browser.close();}
