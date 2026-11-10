import { test, expect } from '@playwright/test';
import { installMocks, seedLoggedInUser, gotoApp, autoDismissNudges } from './helpers.js';

for (const width of [390, 1280]) test(`chat espera dentro del hilo y respeta el contexto (${width}px)`, async ({ page, context }) => {
  await page.setViewportSize({ width, height: 844 });
  await installMocks(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  await gotoApp(page);
  if(width===1280)await page.evaluate(() => { profile.prefs.labs={conversational:true}; profile.prefs.uiMode="chat"; renderCoach(); });
  let release;
  const ready = new Promise(resolve => { release = resolve; });
  let requestBody;
  await page.route('**/api/claude', async route => {
    requestBody = route.request().postDataJSON();
    await ready;
    await route.fulfill({ json: { text: JSON.stringify({ type: 'educativo', respuesta: 'Puedes comer 100 g de pollo cocido sin salsa. Los valores son aproximados.' }) } });
  });
  await page.evaluate(() => {
    saveCoachChat([{id:'previous',role:'user',text:'No quiero carbohidratos en el desayuno',ts:Date.now()}]);
    window.pendingReply = sendCoachMessage('Te dije 0 carbs, dame algo simple');
  });
  await expect(page.locator('#coachTyping')).toBeVisible();
  await expect(page.locator('#coachTyping')).toContainText('Pensando');
  await expect(page.locator('#coach-busy')).toBeHidden();
  await expect.poll(() => requestBody).toBeTruthy();
  expect(requestBody.userText).toContain('No quiero carbohidratos en el desayuno');
  expect(requestBody.userText).toContain('fuera del catálogo');
  expect(requestBody.userText).toContain('los huevos pueden tener trazas');
  const dot = page.locator('.coach-typing span').first();
  expect(await dot.evaluate(el => getComputedStyle(el).animationName)).toBe('bounce');
  // A rerender keeps the pending state; a second send adds no orphan bubble.
  await page.evaluate(() => { renderCoach(); sendCoachMessage('duplicado'); });
  await expect(page.locator('#coachTyping')).toBeVisible();
  expect(await page.evaluate(() => loadCoachChat().some(m => m.text === 'duplicado'))).toBe(false);
  await page.locator('#coachTyping').scrollIntoViewIfNeeded();
  await page.screenshot({path:`/tmp/coach-thinking-${width}.png`});
  await page.emulateMedia({reducedMotion:'reduce'});
  expect(await dot.evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  release();
  await page.evaluate(() => window.pendingReply);
  await expect(page.locator('#coachTyping')).toBeHidden();
  await expect(page.locator('#coachMsgs')).toContainText('100 g de pollo');
  expect(await page.evaluate(() => coachActionsInFlight.size)).toBe(0);
});

test('un error se muestra en el hilo y permite volver a enviar', async ({page,context}) => {
  await installMocks(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  await gotoApp(page);
  await page.route('**/api/claude', route => route.fulfill({status:503,json:{error:'Servicio temporalmente no disponible'}}));
  await page.evaluate(() => sendCoachMessage('Quiero una comida simple'));
  await expect(page.locator('#coachTyping')).toBeHidden();
  await expect(page.locator('#coach-busy')).toBeHidden();
  expect(await page.evaluate(() => coachActionsInFlight.size)).toBe(0);
  expect(await page.evaluate(() => loadCoachChat().at(-1).type)).toBe('fallback');
});

test('el límite de espera incluye la lectura del cuerpo de la respuesta', async ({page,context}) => {
  await installMocks(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  await gotoApp(page);
  await page.clock.install();
  await page.evaluate(() => {
    const original = window.fetch;
    window.fetch = async (url,opts) => {
      if (!String(url).includes('/api/claude')) return original(url,opts);
      return { json: () => new Promise((resolve,reject) => opts.signal.addEventListener('abort', () => reject(new DOMException('aborted','AbortError')))) };
    };
    window.pendingReply = sendCoachMessage('Dame una opción para cenar');
  });
  await expect(page.locator('#coachTyping')).toBeVisible();
  await page.clock.fastForward(90001);
  await page.evaluate(() => window.pendingReply);
  await expect(page.locator('#coachTyping')).toBeHidden();
  expect(await page.evaluate(() => coachActionsInFlight.size)).toBe(0);
  expect(await page.evaluate(() => loadCoachChat().at(-1).type)).toBe('fallback');
});
