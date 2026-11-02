// REQ-316 (Jonathan): "el dibujito con palitos jamás debería pasar". Sin foto
// exacta con licencia libre no se muestra ninguna demostración: la ficha queda
// con los pasos y la sesión prefiere otro ejercicio del mismo músculo con foto.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges } from "./helpers.js";

const SIN_FOTO = ["bulgarian-split-squat", "single-leg-rdl", "step-up", "slider-leg-curl", "archer-push-up"];

test("sin dibujos: las sesiones usan ejercicios con foto y una ficha sin foto muestra solo los pasos", async ({ page, context }) => {
  await installMocks(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const errors = collectConsoleErrors(page);
  await gotoApp(page);
  await page.locator("#tabs").getByText("Entreno").click();

  // Ninguna sesión (gimnasio, casa y aire libre, todos los niveles) elige un ejercicio sin foto
  // si quedaba libre otro del mismo músculo con foto.
  const report = await page.evaluate(() => {
    const ds = todayStr();
    const base = trainingPrefsForDate(ds);
    const out = [];
    for (const [mode, place] of [["gym", "gym"], ["bodyweight", "home"], ["bodyweight", "outdoor"]]) {
      for (const level of ["beginner", "intermediate", "advanced"]) {
        const prefs = { ...base, strengthMode: mode, strengthPlace: place, equipment: defaultEquipmentForStrengthChoice(place), trainingExperience: level };
        const pool = exerciseCatalog(false).filter((e) => exerciseHasDemo(e) && exerciseLevelAllowed(e, level)
          && (mode === "gym" ? ["gym", "strength", "bodyweight"] : ["bodyweight", "strength"]).includes(e.discipline)
          && (mode !== "bodyweight" || exerciseFitsHomeSetup(e, prefs)));
        Object.values(strengthSessions(mode, ds, prefs)).forEach((s) => s.exerciseIds.forEach((slug) => {
          const ex = exerciseBySlug(slug, true);
          if (exerciseHasDemo(ex)) return;
          const muscle = EXERCISE_SUBSTITUTION.primaryMuscle(ex);
          const free = pool.filter((e) => !s.exerciseIds.includes(e.slug) && EXERCISE_SUBSTITUTION.primaryMuscle(e) === muscle);
          if (free.length) out.push(`${mode}/${place}/${level}/${s.id}: ${slug} (había ${free.map((e) => e.slug).join(", ")})`);
        }));
      }
    }
    return out;
  });
  expect(report).toEqual([]);

  // Ningún ejercicio del catálogo pinta un dibujo SVG.
  const drawn = await page.evaluate(() => exerciseCatalog(true).filter((ex) => /<svg/.test(exerciseMediaHtml(ex))).map((ex) => ex.slug));
  expect(drawn).toEqual([]);
  expect(await page.evaluate((slugs) => slugs.filter((s) => exerciseHasDemo(exerciseBySlug(s, true))), SIN_FOTO)).toEqual([]);

  // La ficha de un ejercicio sin foto: sin recuadro de demostración, con los pasos.
  await page.evaluate(() => openExerciseGuide("bulgarian-split-squat"));
  const overlay = page.locator("#overlay");
  await expect(overlay.locator("h3")).toHaveText("Sentadilla búlgara");
  await expect(overlay.locator(".guide-demo")).toHaveCount(0);
  await expect(overlay.locator("svg")).toHaveCount(0);
  await expect(overlay.locator(".exercise-steps li").first()).toBeVisible();
  await page.evaluate(() => closeModal());
  // Sin imagen, el texto es la guía: describe la variante exacta (antes el step-up describía una zancada).
  await page.evaluate(() => openExerciseGuide("step-up"));
  await expect(overlay.locator(".exercise-steps")).toContainText("Empuja con el pie de arriba");
  await page.evaluate(() => closeModal());

  // Una con foto sigue igual.
  await page.evaluate(() => openExerciseGuide("walking-lunge"));
  await expect(overlay.locator(".guide-demo img").first()).toBeVisible();

  expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
});
