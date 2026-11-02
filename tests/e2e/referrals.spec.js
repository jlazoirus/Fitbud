import { test, expect } from '@playwright/test';
import { installMocks, seedLoggedInUser, autoDismissNudges, collectConsoleErrors } from './helpers.js';
for (const width of [390,1280]) {
  test(`invitaciones: generar, compartir y consultar éxito (${width}px)`,async({page,context})=>{
    await page.setViewportSize({width,height:844});
    await installMocks(context);await seedLoggedInUser(page);await autoDismissNudges(page);
    const errors=collectConsoleErrors(page);
    const invitations=[];
    await page.route('**/api/entitlement*',route=>{
      const req=route.request(),url=new URL(req.url());
      if(url.searchParams.get('action')!=='referrals'&&req.method()!=='POST')return route.fallback();
      if(req.method()==='POST'){
        const body=req.postDataJSON();
        if(body.action!=='referral-generate')return route.fallback();
        invitations.push({code:`FIT-AB12-CD3${invitations.length}`,successful:false});
      }
      return route.fulfill({json:{eligible:true,invitations,limit:3}});
    });
    await page.goto('/index.html?ver=invitaciones');
    await expect(page.getByRole('heading',{name:'Invita a tus amigos'})).toBeVisible();
    await page.getByRole('button',{name:'Generar mi enlace'}).click();
    await expect(page.locator('#refLink0')).toHaveValue(/codigo=FIT-AB12-CD30/);
    await expect(page.getByRole('link',{name:'WhatsApp',exact:true})).toHaveAttribute('href',/^https:\/\/wa.me\/\?text=/);
    await expect(page.getByRole('link',{name:'Enviar por correo'})).toHaveAttribute('href',/^mailto:\?subject=/);
    await page.getByRole('button',{name:'Generar mi enlace'}).click();
    await page.getByRole('button',{name:'Generar mi enlace'}).click();
    await expect(page.getByRole('button',{name:'Generar mi enlace'})).toHaveCount(0);
    invitations[0].successful=true;
    await page.getByRole('button',{name:'Actualizar estado'}).click();
    await expect(page.locator('#referralPanel')).toContainText('2 de 3 · 0 por generar, 2 pendientes');
    await expect(page.locator('#referralPanel')).toContainText('Registro exitoso');
    await expect(page.locator('#refLink0')).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.evaluate(()=>document.querySelector("#app").scrollTop=0);
    await page.screenshot({path:`work/referrals-${width}.png`,fullPage:true});
    expect(errors).toEqual([]);
  });
}
test('invitaciones: un fallo permite reintentar sin mostrar datos de otra cuenta',async({page,context})=>{
  await installMocks(context);await seedLoggedInUser(page);await autoDismissNudges(page);
  let fail=true;
  await page.route('**/api/entitlement?action=referrals',route=>route.fulfill(fail?{status:503,json:{error:'No pudimos cargar tus invitaciones.'}}:{json:{eligible:false}}));
  await page.goto('/index.html?ver=invitaciones');
  await expect(page.getByRole('button',{name:'Reintentar',exact:true})).toBeVisible();
  fail=false;await page.getByRole('button',{name:'Reintentar',exact:true}).click();
  await expect(page.locator('#referralPanel')).toContainText('aún no está disponible');
  await expect(page.getByRole('button',{name:'Generar mi enlace'})).toHaveCount(0);
});

test('el enlace del correo pide iniciar sesión cuando no hay sesión',async({page,context})=>{
  await installMocks(context);
  await page.goto('/index.html?ver=invitaciones');
  await expect(page.locator('#au_email')).toBeVisible();
  await expect(page.locator('#au_pwd')).toBeVisible();
  expect(new URL(page.url()).searchParams.get('ver')).toBe('invitaciones');
});

test('dos usos: retomar la app cuenta como otra sesión, un cambio breve no',async({page,context})=>{
  await installMocks(context);await seedLoggedInUser(page);await autoDismissNudges(page);
  const uses=[];
  await page.route('**/api/analytics',route=>{
    const body=route.request().postDataJSON();
    if(body.event_type==='session_start')uses.push(body.session_id);
    return route.fulfill({json:{ok:true}});
  });
  await page.goto('/index.html');
  await expect.poll(()=>uses.length).toBeGreaterThan(0);
  const initial=uses.length;
  await page.evaluate(()=>{
    let hidden=true;
    Object.defineProperty(document,'hidden',{configurable:true,get:()=>hidden});
    document.dispatchEvent(new Event('visibilitychange'));
    hidden=false;document.dispatchEvent(new Event('visibilitychange'));
    delete document.hidden;
  });
  expect(uses.length).toBe(initial);
  await page.evaluate(()=>{
    let hidden=true;
    Object.defineProperty(document,'hidden',{configurable:true,get:()=>hidden});
    document.dispatchEvent(new Event('visibilitychange'));
    const realNow=Date.now;
    try{
      Date.now=()=>realNow()+31*60*1000;
      hidden=false;document.dispatchEvent(new Event('visibilitychange'));
    }finally{Date.now=realNow;delete document.hidden;}
  });
  await expect.poll(()=>new Set(uses).size).toBe(2);
});
