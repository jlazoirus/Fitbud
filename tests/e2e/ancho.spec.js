// REQ-221 (mitigación de REQ-209): ningún nombre largo desborda la columna y la
// página no se puede arrastrar de lado.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, gotoApp, autoDismissNudges } from "./helpers.js";

test.use({ viewport: { width: 360, height: 780 }, hasTouch: true, isMobile: true });

test("un nombre de plato larguísimo no desborda Hoy ni Nutrición", async ({ page, context }) => {
  await installMocks(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  await gotoApp(page);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflowX)).toBe("clip");
  await page.evaluate(() => {
    const ds = todayStr(), meal = buildDay(ds).meals[0];
    mealState(ds, meal.id).ovr = { name: "Bowlsupercalifragilisticoexpialidosodequinuaypolloalaplancha".repeat(2), kcal: 500, p: 30, c: 50, f: 15 };
    save(); render();
  });
  for (const tab of ["Hoy", "Nutrición"]) {
    await page.locator("#tabs").getByText(tab).click();
    const overflow = await page.evaluate(() => {
      const app = document.getElementById("app"), right = app.getBoundingClientRect().right;
      return { scroll: app.scrollWidth - app.clientWidth, doc: document.documentElement.scrollWidth - innerWidth,
        outside: [...app.querySelectorAll("*")].filter((el) => el.getBoundingClientRect().right > right + 0.5).length };
    });
    expect(overflow, tab).toEqual({ scroll: 0, doc: 0, outside: 0 });
  }
});
