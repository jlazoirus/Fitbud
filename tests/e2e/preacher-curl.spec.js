import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, gotoApp, collectConsoleErrors } from "./helpers.js";

for (const width of [390, 1280]) test(`Curl Scott: ficha completa y animación (${width}px)`, async ({ page, context }) => {
  await page.setViewportSize({ width, height: 844 });
  await installMocks(context);
  await seedLoggedInUser(page);
  const errors = collectConsoleErrors(page);
  await gotoApp(page);
  const result = await page.evaluate(() => {
    const catalog = activeTrainingCatalog();
    const ex = catalog.find(item => item.slug === "preacher-curl");
    return {
      ex,
      search: ["Scott", "predicador", "Preacher Curl"].map(query => EXERCISE_SUBSTITUTION.search(query, catalog).map(item => item.slug)),
      variants: window.FITBUD_EXERCISE_VARIANTS[ex.slug],
      substitutes: EXERCISE_SUBSTITUTION.candidates(ex, catalog).map(item => EXERCISE_SUBSTITUTION.primaryMuscle(item)),
      fitsHome: exerciseFitsHomeSetup(ex, { strengthPlace: "home", equipment: ["barbell", "bench"] }),
    };
  });
  expect(result.ex.level).toBe("beginner");
  expect(result.ex.places).toEqual(["gym"]);
  expect(result.fitsHome).toBe(false);
  for (const matches of result.search) expect(matches).toContain("preacher-curl");
  expect(result.variants.regression.kind).toBe("load");
  expect(result.variants.progression.kind).toBe("load");
  expect(result.substitutes.length).toBeGreaterThan(0);
  expect(result.substitutes.every(muscle => muscle === "Bíceps")).toBe(true);
  await page.evaluate(() => openExerciseGuide("preacher-curl"));
  const overlay = page.locator("#overlay");
  await expect(overlay).toContainText("barra EZ");
  await expect(overlay).toContainText("dos sesiones");
  await expect(overlay).toContainText("Respiración:");
  await expect(overlay).toContainText("Detente si:");
  for (const i of [0, 1]) {
    const frame = overlay.locator(`.demo-frame-${i}`);
    await expect(frame).toHaveAttribute("src", `assets/exercise-media/preacher-curl-${i}.jpg`);
    await expect.poll(() => frame.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  }
  const frame = overlay.locator(".demo-frame-1");
  expect(await frame.evaluate(el => getComputedStyle(el).animationName)).toBe("demoFrame");
  await expect.poll(() => frame.evaluate(el => getComputedStyle(el).opacity)).toBe("1");
  await expect.poll(() => frame.evaluate(el => getComputedStyle(el).opacity)).toBe("0");
  expect(errors).toEqual([]);
});
