// Journey (a): onboarding completo de un usuario nuevo + cálculo de macros.
// Verifica el invariante nº1 del auditor: macros MOSTRADOS = macros GUARDADOS,
// y que el cálculo coincida con la fórmula declarada (Mifflin-St Jeor).
import { test, expect } from "@playwright/test";
import {selectOnboardingDays} from "./onboarding-actions.js";
import {
  installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges, profileFixture, completePrefs,
} from "./helpers.js";

// Datos del usuario de prueba y su cálculo esperado, independiente de la app
const USUARIO = { sexo: "male", edad: 30, estatura: 175, peso: 75, actividad: 1.35 };
const BMR = 10 * USUARIO.peso + 6.25 * USUARIO.estatura - 5 * USUARIO.edad + 5; // Mifflin hombre
const TDEE = BMR * USUARIO.actividad;

async function reachTrainingStep(page, age) {
  await gotoApp(page);
  const app = page.locator("#app");
  await expect(app).toContainText(/punto de partida/i);
  await page.fill("#ob_name", `Bro ${age}`);
  await page.selectOption("#ob_sex", "male");
  await page.fill("#ob_age", String(age));
  await page.fill("#ob_height", String(USUARIO.estatura));
  await page.fill("#ob_weight", String(USUARIO.peso));
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.locator("#ob_sport")).toBeVisible();
  return app;
}

test.describe("Onboarding", () => {
  test("usuario nuevo completa el onboarding y sus macros mostrados = guardados", async ({ page, context }) => {
    // Perfil SIN prefs → la app debe llevar al onboarding
    const { calls } = await installMocks(context, { tables: { profiles: { row: profileFixture({}) } } });
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);

    await gotoApp(page);
    const app = page.locator("#app");
    await expect(app).toContainText(/punto de partida/i);
    await expect(page.locator("#ob_bf, #ob_activity")).toHaveCount(0);
    await expect(page.locator("#ob_goal")).toContainText("Recomponer mi cuerpo");
    await expect(page.locator("#obGoalHelp")).toContainText("Comes un poco menos");

    // Paso 1: datos corporales
    await page.fill("#ob_name", "Bro Nuevo");
    await page.selectOption("#ob_sex", "male");
    await page.fill("#ob_age", String(USUARIO.edad));
    await page.fill("#ob_height", String(USUARIO.estatura));
    await page.fill("#ob_weight", String(USUARIO.peso));
      await page.getByRole("button", { name: "Continuar" }).click();

    // Paso 3: semana de entrenamiento (caminata, sin fuerza por ahora, 10 semanas, ≥3 días)
    await expect(page.locator("#ob_duration, #ob_experience, #ob_minutes")).toHaveCount(0);
    await expect(app).toContainText("¿Qué actividad quieres practicar?");
    await expect(page.locator("#ob_sport")).toContainText("Caminar");
    await expect(page.locator("#ob_strength")).toContainText("Sin fuerza");

    await page.selectOption("#ob_sport", "walking");
    await page.selectOption("#ob_strength", "none");

    await selectOnboardingDays(page,[1,3,5]);
    await page.getByRole("button", { name: "Continuar" }).click();

    // Paso 4: dieta + privacidad + evaluación de seguridad
    await expect(app).toContainText("Antes de empezar");
    await expect(app).toContainText("Como de todo");
    await page.selectOption("#ob_diet_pattern","omnivoro");
    const shown=await page.locator('#obMacroResult').textContent();
    const parts=shown.match(/(\d+) kcal · P (\d+) · C (\d+) · G (\d+)/);
    expect(parts).toBeTruthy();
    const [kcalShown,protShown,carbShown,fatShown]=parts.slice(1).map(Number);
    expect(kcalShown).toBeGreaterThan(TDEE*.7);expect(kcalShown).toBeLessThan(TDEE*.95);
    expect(kcalShown).toBe(4*protShown+4*carbShown+9*fatShown);
    await page.getByRole('button',{name:'¿Cómo lo calculamos?'}).click();
    await expect(page.locator('#overlay')).toContainText('Mifflin-St Jeor');await page.locator('#overlay').getByRole('button',{name:'Entendido'}).click();
    await page.check("#ob_consent_core");
    for (const s of await page.locator('#app select[id^="ob_safety_"]').all()) {
      await s.selectOption("no");
    }
    await page.getByRole("button", { name: "Guardar mi plan" }).click();

    // Aterriza en Hoy; las kcal del plan recién calculado se ven en Nutrición
    // (REQ-394: Hoy no muestra la tira de consumo hasta el primer registro).
    await expect(page.locator("#tabs")).toContainText("Hoy");
    await expect(page.locator("#app .home-primary")).toBeVisible();
    await page.locator('[data-tab="nutricion"]').click();
    await expect(app).toContainText(String(kcalShown));
    await page.locator('[data-tab="hoy"]').click();

    // MOSTRADO = GUARDADO: el upsert del perfil lleva exactamente los macros del paso 2
    const profilePosts = calls.filter((c) => c.table === "profiles" && c.method === "POST");
    expect(profilePosts.length).toBeGreaterThan(0);
    const saved = profilePosts.at(-1).payload;
    const prefs = (Array.isArray(saved) ? saved[0] : saved).prefs;
    expect(Number(prefs.calorieTarget)).toBe(kcalShown);
    expect(Number(prefs.proteinTarget)).toBe(protShown);
    expect(Number(prefs.carbTarget)).toBe(carbShown);
    expect(Number(prefs.fatTarget)).toBe(fatShown);
    expect(prefs.primarySport).toBe("walking");
    expect(prefs.strengthMode).toBe("none");
    expect(prefs.strengthPlace).toBe("none");
    expect(prefs.onboardingCompletedAt).toBeTruthy();
    expect(prefs.cycleFirstWeekPreparedAt).toBeTruthy();

    // Consentimientos y screening quedaron registrados (privacidad por defecto)
    expect(calls.filter((c) => c.table === "user_consents" && c.method === "POST").length).toBeGreaterThan(0);
    expect(calls.filter((c) => c.table === "safety_screenings" && c.method === "POST").length).toBeGreaterThan(0);
    const planPosts = calls.filter((c) => c.table === "plan_versions" && c.method === "POST");
    const combinedPlan = planPosts
      .map((c) => (Array.isArray(c.payload) ? c.payload[0] : c.payload))
      .find((row) => row?.snapshot?.nutritionPlan && row?.snapshot?.trainingPlan);
    expect(combinedPlan, "Debe guardar nutritionPlan + trainingPlan en un snapshot activo").toBeTruthy();
    expect(combinedPlan.status).toBe("active");
    expect(combinedPlan.snapshot.nutritionPlan.days.length).toBeGreaterThan(0);
    expect(combinedPlan.snapshot.trainingPlan.weeks.length).toBeGreaterThan(0);
    expect(calls.filter((c) => c.table === "day_log" && c.method === "POST").length).toBeGreaterThan(0);

    // REQ-210: el peso del alta queda como semana 1; Progreso no lo vuelve a pedir
    const w1 = calls.filter((c) => c.table === "weight_log" && c.method === "POST")
      .map((c) => (Array.isArray(c.payload) ? c.payload[0] : c.payload)).find((row) => row?.week === 1);
    expect(w1?.kg).toBe(USUARIO.peso);
    expect(prefs.startWeightSeededCycle).toBe(1);

    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  test("REQ-385: solo otro deporte completa el alta con tres días para su deporte", async ({ page, context }) => {
    const { calls } = await installMocks(context, { tables: { profiles: { row: profileFixture({}) } } });
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    await reachTrainingStep(page, 30);
    await page.selectOption("#ob_sport", "strength_only");
    await page.selectOption("#ob_strength", "none");
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByText("Elige una actividad o una opción de fuerza para preparar tu semana", { exact: true })).toBeVisible();
    await page.selectOption("#ob_sport", "other");
    await selectOnboardingDays(page,[1,3,5]);
    await expect(page.locator("#obTrainingSummary")).toContainText("3 días para tu deporte");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.selectOption("#ob_diet_pattern","omnivoro");
    await page.check("#ob_consent_core");
    for (const field of await page.locator('#app select[id^="ob_safety_"]').all()) await field.selectOption("no");
    await page.getByRole("button", { name: "Guardar mi plan" }).click();
    await expect(page.locator("#tabs")).toContainText("Hoy");
    const posts = calls.filter(c => c.table === "profiles" && c.method === "POST");
    const row = posts.at(-1).payload;
    const prefs = (Array.isArray(row) ? row[0] : row).prefs;
    expect(prefs.primarySport).toBe("other");
    expect(prefs.strengthMode).toBe("none");
    expect(prefs.trainingDays).toEqual([1, 3, 5]);
    const sessions = await page.evaluate(() => {
      const p = trainingPrefs();
      return workoutSchedule(p.days,p.dayIds,p.priority,p.locations,p.primary,p.experience,p.workoutSplit,p.strength,p.lightCardioEnabled);
    });
    for (const day of [1, 3, 5]) expect(sessions[day]).toBe("facil");
  });

  test("REQ-152: 'Mantenerlo por ahora' en el aviso de revisión cierra el modal y pospone sin errores", async ({ page, context }) => {
    // onboardingReviewedAt de hace 40 días (> PROFILE_REVIEW_DAYS=28) dispara el aviso.
    const staleReview = new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString();
    const { calls } = await installMocks(context, {
      prefs: completePrefs({ onboardingReviewedAt: staleReview, onboardingCompletedAt: staleReview }),
    });
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);

    await gotoApp(page);

    await expect(page.getByText("Han pasado 4 semanas")).toBeVisible();
    await page.getByRole("button", { name: "Mantenerlo por ahora" }).click();

    // El modal se cierra y aparece la confirmación (antes del fix, ReferenceError
    // impedía llegar a closeModal()/toast() y el modal quedaba abierto).
    await expect(page.getByText("Han pasado 4 semanas")).toHaveCount(0);
    await expect(page.locator("#toast")).toContainText(/Te preguntaremos de nuevo/i);

    // onboardingReviewedAt queda persistido (reciente), así que la revisión no vuelve a molestar de inmediato.
    await expect
      .poll(() => calls.filter((c) => c.table === "profiles" && c.method === "POST").length)
      .toBeGreaterThan(0);
    const saved = calls.filter((c) => c.table === "profiles" && c.method === "POST").at(-1).payload;
    const savedPrefs = (Array.isArray(saved) ? saved[0] : saved).prefs;
    expect(Date.now() - Date.parse(savedPrefs.onboardingReviewedAt)).toBeLessThan(60_000);

    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  for (const scenario of [
    { age: 20, text: "Construye técnica primero" },
    { age: 52, text: "Empieza con bajo impacto" },
    { age: 58, text: "Caminar también cuenta como plan" },
  ]) {
    test(`recomienda ritmo seguro para edad ${scenario.age}`, async ({ page, context }) => {
      await installMocks(context, { tables: { profiles: { row: profileFixture({}) } } });
      await seedLoggedInUser(page);
      await autoDismissNudges(page);
      const errors = collectConsoleErrors(page);

      const app = await reachTrainingStep(page, scenario.age);
      await expect(app).toContainText(scenario.text);
      await expect(page.locator("#ob_safety_mode")).toHaveCount(0);
      expect(await page.evaluate(()=>onboardingDraft.trainingSafetyMode)).toBe('auto');
      if (scenario.age >= 55) {
        await expect(page.locator("#ob_sport")).toContainText("Caminar");
        await expect(page.locator("#ob_strength")).toContainText("Sin fuerza");
      }

      expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
    });
  }

  // REQ-251: un postulante aceptado llega con nombre, objetivo y experiencia de su postulación.
  test("postulante beta: el onboarding trae lo que ya respondió al postular", async ({ page, context }) => {
    await installMocks(context, { tables: { profiles: { row: profileFixture({ name: "Ana", goal: "volumen", trainingExperience: "intermediate" }) } } });
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    await gotoApp(page);
    await expect(page.locator("#app")).toContainText(/punto de partida/i);
    await expect(page.locator("#ob_name")).toHaveValue("Ana");
    await page.selectOption("#ob_sex", "female");
    await page.fill("#ob_age", "28");
    await page.fill("#ob_height", "165");
    await page.fill("#ob_weight", "62");
    await expect(page.locator("#ob_goal")).toHaveValue("volumen");
    await page.getByRole("button", { name: "Continuar" }).click();
    expect(await page.evaluate(()=>onboardingDraft.trainingExperience)).toBe("intermediate");
  });
});
