// REQ-293 (Jonathan): en casa salió "Remo con banda" sin tener banda y
// "Sustituir" no ofrecía nada para espalda media. En casa solo entra lo que se
// puede hacer con lo declarado; el remo invertido (mesa firme, foto real) cubre
// la espalda y lo que pide material se ofrece avisando qué hace falta.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges, startGuidedSession } from "./helpers.js";

test("en casa sin bandas: remo invertido, sustitutos con el material que piden y equipo en español", async ({ page, context }) => {
  await installMocks(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const errors = collectConsoleErrors(page);
  await gotoApp(page);

  await page.locator("#tabs").getByText("Entreno").click();
  const app = page.locator("#app");
  await page.evaluate(() => openWorkoutContingency(todayStr(), "equipo"));
  const overlay = page.locator("#overlay");
  await overlay.getByRole("button", { name: /^Casa/ }).click();
  await expect(app.locator(".wk-location")).toHaveText("Lugar: Casa · solo este día");

  // Ninguna sesión de casa pide material que no se declaró ni ejercicios de otro lugar.
  const sessions = await page.evaluate(() => {
    const ds = todayStr();
    const out = {};
    Object.entries(strengthSessions("bodyweight", ds, trainingPrefsForDate(ds))).forEach(([id, s]) => {
      out[id] = s.exerciseIds.map((slug) => {
        const ex = exerciseBySlug(slug, true);
        return { slug, missing: exerciseMissingEquipment(ex, ds), home: exerciseArray(ex.places).includes("home") };
      });
    });
    return out;
  });
  for (const [id, list] of Object.entries(sessions)) {
    expect(list.length, id).toBeGreaterThan(0);
    for (const ex of list) {
      expect(ex.missing, `${id}: ${ex.slug}`).toEqual([]);
      expect(ex.home, `${id}: ${ex.slug}`).toBe(true);
    }
  }
  for (const id of ["fullA", "torsoA", "pullA"]) expect(sessions[id].map((e) => e.slug)).toContain("inverted-row");
  expect(Object.values(sessions).flat().map((e) => e.slug)).not.toContain("band-row");

  // La ficha del remo invertido: foto real y material en español.
  await page.evaluate(() => openExerciseGuide("inverted-row"));
  await expect(overlay.locator(".guide-demo img").first()).toHaveAttribute("src", /inverted-row-0\.jpg$/);
  await expect(overlay.locator(".exercise-meta")).toContainText("mesa firme o barra baja");
  await expect(overlay.locator(".exercise-meta")).not.toContainText("_");
  await page.evaluate(() => closeModal());

  // Sustituir el remo invertido ofrece el remo con banda avisando que necesita banda.
  await startGuidedSession(page);
  const notNow = page.getByRole("button", { name: "Ahora no" });
  if (await notNow.isVisible().catch(() => false)) await notNow.click();
  await page.evaluate(() => {
    const ex = normalizedWorkoutExecution(current);
    const step = ex.steps.find((s) => s.type === "strength");
    ex.currentStep = ex.steps.indexOf(step);
    Object.assign(step, { exerciseSlug: "inverted-row", originalExerciseSlug: "inverted-row", variation: "standard" });
    persistWorkoutExecution(current, ex, true);
  });
  await app.getByRole("button", { name: "Sustituir", exact: true }).click();
  await expect(overlay).toContainText("mismo músculo principal (espalda media)");
  const band = overlay.locator("button.opt", { hasText: "Remo con banda" });
  await expect(band).toContainText("Necesita: banda elástica");
  await expect(overlay.locator(".alert")).toHaveCount(0);

  expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
});
