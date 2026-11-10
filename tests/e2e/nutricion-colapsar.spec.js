// A single weekly entry replaces the redundant day/week generators in Nutrition.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges } from "./helpers.js";

for(const width of [390,1280])test(`Nutrición ofrece un solo generador y conserva el registro libre (${width}px)`,async({page,context})=>{
  await page.setViewportSize({width,height:900});
  await installMocks(context);await seedLoggedInUser(page);await autoDismissNudges(page);
  const errors=collectConsoleErrors(page);
  await gotoApp(page);await page.locator('[data-tab="nutricion"]').click();
  const app=page.locator('#app');
  await expect(app.getByRole('button',{name:'Preparar mi semana',exact:true})).toHaveCount(1);
  await expect(app.getByRole('button',{name:'Sugerirme un menú',exact:true})).toHaveCount(0);
  await expect(app).toContainText('Puedes registrar lo que comiste sin preparar un menú.');
  await app.getByRole('button',{name:'Más opciones de nutrición'}).click();
  await expect(page.locator('#overlay')).not.toContainText('Volver a preparar este día');
  await page.locator('#overlay').getByRole('button',{name:'Cerrar',exact:true}).last().click();
  await expect(app.getByRole('button',{name:'Registrar Almuerzo',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
