import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {installMocks,seedLoggedInUser,gotoApp,autoDismissNudges,daysFromToday,USER_ID} from './helpers.js';
const meal=()=>({done:true,ovr:{name:'Comida privada',kcal:500,p:30,c:50,f:15}});
async function boot(page,context,recovered=false){
  const rows=Array.from({length:7},(_,i)=>({user_id:USER_ID,log_date:daysFromToday(-1-i-(recovered?1:0)),state:{meals:{desayuno:meal(),almuerzo:meal(),cena:meal()},workoutDone:true,extras:[]},updated_at:new Date().toISOString()}));
  if(recovered)rows.push({...rows[0],log_date:daysFromToday(0)});
  await installMocks(context,{tables:{day_log:{rows}}});await seedLoggedInUser(page);await autoDismissNudges(page);await gotoApp(page);await page.waitForLoadState('networkidle');
  await page.locator('#tabs').getByText('Progreso').click();
  await page.locator('#streakPanel').getByRole('button',{name:'Compartir imagen'}).click();
  await expect(page.locator('#streakSharePreview')).toBeVisible();
}
for(const width of [390,1280])test(`descarga una imagen PNG real de la racha (${width}px)`,async({page,context})=>{
  await page.setViewportSize({width,height:844});
  await page.addInitScript(()=>Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false}));
  await boot(page,context);
  await expect(page.getByRole('dialog')).toContainText('Solo se comparte tu número de racha');
  await expect(page.locator('#streakSharePreview')).toHaveAttribute('alt','Mi racha en Evolv: 7 días. Un día a la vez.');
  await page.screenshot({path:`/tmp/racha-compartir-${width}.png`});
  const promise=page.waitForEvent('download');
  await page.getByRole('button',{name:'Descargar imagen',exact:true}).click();
  const download=await promise;expect(download.suggestedFilename()).toBe('evolv-racha-7-dias.png');
  await download.saveAs(`/tmp/evolv-racha-${width}.png`);
  const bytes=await readFile(`/tmp/evolv-racha-${width}.png`);
  expect(bytes.subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(bytes.readUInt32BE(16)).toBe(1080);expect(bytes.readUInt32BE(20)).toBe(1350);
  await page.getByRole('button',{name:'Cerrar',exact:true}).click();
  expect(await page.evaluate(()=>streakImage)).toBeNull();
});

test('comparte el archivo, cancelar conserva la vista previa y salir la limpia',async({page,context})=>{
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,'canShare',{configurable:true,value:({files})=>files[0].type==='image/png'});
    Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{
      if(window.cancelStreakShare)throw new DOMException('Cancelado','AbortError');
      const file=data.files[0];window.sharedStreak={name:file.name,type:file.type,size:file.size,keys:Object.keys(data)};
    }});
  });
  await boot(page,context);
  await page.getByRole('dialog').getByRole('button',{name:'Compartir imagen',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>window.sharedStreak?.name)).toBe('evolv-racha-7-dias.png');
  const data=await page.evaluate(()=>window.sharedStreak);
  expect(data.type).toBe('image/png');expect(data.size).toBeGreaterThan(1000);expect(data.keys.sort()).toEqual(['files','title']);
  await page.evaluate(()=>{window.cancelStreakShare=true;});
  await page.getByRole('dialog').getByRole('button',{name:'Compartir imagen',exact:true}).click();
  await expect(page.locator('#streakSharePreview')).toBeVisible();
  await expect(page.locator('#streakShareStatus')).not.toContainText('No se pudo');
  await page.evaluate(()=>clearSignedOutState());
  await expect(page.locator('#streakSharePreview')).toHaveCount(0);
  expect(await page.evaluate(()=>streakImage)).toBeNull();
});

 test('la imagen usa la racha recuperada y no suma el día fallado',async({page,context})=>{
  await page.addInitScript(()=>Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false}));
  await boot(page,context,true);
  await expect(page.locator('#streakSharePreview')).toHaveAttribute('alt','Mi racha en Evolv: 8 días. Un día a la vez.');
  expect(await page.evaluate(()=>streakImage.file.name)).toBe('evolv-racha-8-dias.png');
});
