// REQ-347: en "Registrar comida", el día y la comida del día quedan alineados
// dentro del recuadro "¿Dónde lo registras?" (antes la fecha se salía por la derecha).
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, gotoApp, autoDismissNudges } from "./helpers.js";

for (const width of [320, 390]) {
  test(`campos alineados dentro del recuadro a ${width} px`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 844 });
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    await gotoApp(page);
    await page.evaluate(() => openFoodRegistration(todayStr()));
    await expect(page.locator("#overlay .log-intent")).toBeVisible();
    await page.locator('#overlay input[name="f_intent"][value="replace"]').check();
    const box = await page.evaluate(() => {
      const r = (sel) => { const b = document.querySelector(sel).getBoundingClientRect(); return [Math.round(b.left), Math.round(b.right)]; };
      return { set: r("#overlay .log-intent"), date: r("#f_date"), target: r("#f_target"), page: document.documentElement.scrollWidth };
    });
    expect(box.date[1]).toBeLessThanOrEqual(box.set[1]);
    expect(box.date).toEqual(box.target);
    expect(box.page).toBeLessThanOrEqual(width);
    await expect(page.locator("#f_date")).toHaveCSS("text-align", "left");
  });
}
