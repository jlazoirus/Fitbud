// REQ-338 (Jonathan): cambiar todos los ejercicios de una sesión de una vez y
// que la rutina se recuerde: la próxima sesión de esos músculos la sugiere.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges } from "./helpers.js";

test("editar la rutina de una vez, guardarla y que la próxima sesión del mismo tipo la sugiera", async ({ page, context }) => {
  const { calls } = await installMocks(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const errors = collectConsoleErrors(page);
  await gotoApp(page);
  await page.locator("#tabs").getByText("Entreno").click();
  const app = page.locator("#app");
  const overlay = page.locator("#overlay");
  await expect(app).toContainText(/Qué vas a hacer hoy/);

  const today = await page.evaluate(() => ({ family: routineFamily(effectiveWorkout(current).workout), ids: workoutPrescription(current).steps.filter((s) => s.type === "strength").map((s) => s.exerciseSlug) }));
  expect(today.family).toBeTruthy();

  // Empezar de cero y armar la rutina con tres ejercicios del buscador.
  await app.getByRole("button", { name: "Editar ejercicios" }).click();
  await expect(overlay).toContainText("Tu rutina de hoy");
  await overlay.getByRole("button", { name: "Empezar de cero" }).click();
  await expect(overlay.getByRole("button", { name: "Guardar rutina" })).toBeDisabled();
  const search = overlay.locator("#routine-search");
  for (const term of ["flexión", "remo", "plancha"]) {
    await search.fill(term);
    await overlay.locator("#routine-search-results button.opt").first().click();
  }
  await expect(overlay.locator(".routine-row")).toHaveCount(3);
  // Cambiar uno: sin escribir, propone los del mismo músculo.
  await overlay.locator(".routine-row").nth(2).getByRole("button", { name: /^Cambiar/ }).click();
  await expect(overlay.locator(".routine-picker-h")).toContainText("En lugar de");
  await overlay.locator("#routine-search-results button.opt").first().click();
  await expect(overlay.locator(".routine-row")).toHaveCount(3);
  // Quitar uno.
  await overlay.locator(".routine-row").nth(1).getByRole("button", { name: /^Quitar/ }).click();
  await expect(overlay.locator(".routine-row")).toHaveCount(2);
  await expect(overlay.locator("#routine_remember")).toBeChecked();
  await overlay.getByRole("button", { name: "Guardar rutina" }).click();

  const custom = await page.evaluate(() => dayState(current).customExercises);
  expect(custom).toHaveLength(2);
  expect(await page.evaluate(() => workoutPrescription(current).steps.filter((s) => s.type === "strength").map((s) => s.exerciseSlug))).toEqual(custom);
  await expect(app.locator(".routine-pill")).toHaveText("tu rutina");
  // Se recuerda en el perfil (sincronizado) y el día lo lleva en day_log.
  await expect.poll(() => {
    const posts = calls.filter((c) => c.table === "profiles" && c.method === "POST");
    const last = posts.at(-1); const prefs = last && (Array.isArray(last.payload) ? last.payload[0] : last.payload).prefs;
    return prefs && prefs.savedRoutines && Object.values(prefs.savedRoutines)[0].exerciseIds;
  }).toEqual(custom);
  await expect.poll(() => calls.filter((c) => c.table === "day_log" && c.payload && c.payload.state && Array.isArray(c.payload.state.customExercises)).length).toBeGreaterThan(0);

  // Volver a la del plan deshace el día.
  await app.getByRole("button", { name: "Volver a la rutina del plan" }).click();
  expect(await page.evaluate(() => workoutPrescription(current).steps.filter((s) => s.type === "strength").map((s) => s.exerciseSlug))).toEqual(today.ids);

  // Otro día con el mismo tipo de sesión: sugiere repetir la rutina.
  const other = await page.evaluate((family) => {
    for (let i = 1; i <= 21; i++) { const d = addDays(current, i); if (d > END) break; if (routineFamily(effectiveWorkout(d).workout) === family) return d; }
    return null;
  }, today.family);
  expect(other).toBeTruthy();
  await page.evaluate((d) => { current = d; render(); }, other);
  const suggest = app.locator(".routine-suggest");
  await expect(suggest).toContainText("La última vez hiciste tu rutina de");
  await suggest.getByRole("button", { name: "Repetir mi rutina" }).click();
  await expect(suggest).toHaveCount(0);
  expect(await page.evaluate(() => workoutPrescription(current).steps.filter((s) => s.type === "strength").map((s) => s.exerciseSlug))).toEqual(custom);
  expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
});

test("'Hoy la del plan' oculta la sugerencia ese día", async ({ page, context }) => {
  await installMocks(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  await gotoApp(page);
  await page.locator("#tabs").getByText("Entreno").click();
  const app = page.locator("#app");
  await expect(app).toContainText(/Qué vas a hacer hoy/);
  await page.evaluate(() => {
    const family = routineFamilyKey(routineFamily(effectiveWorkout(current).workout));
    const ids = exerciseCatalog(false).filter((e) => e.discipline === "bodyweight").slice(0, 3).map((e) => e.slug);
    profile.prefs = { ...profile.prefs, savedRoutines: { [family]: { exerciseIds: ids, savedAt: new Date().toISOString() } } };
    render();
  });
  const suggest = app.locator(".routine-suggest");
  await expect(suggest).toBeVisible();
  await suggest.getByRole("button", { name: "Hoy la del plan" }).click();
  await expect(suggest).toHaveCount(0);
  await page.evaluate(() => render());
  await expect(suggest).toHaveCount(0);
});
