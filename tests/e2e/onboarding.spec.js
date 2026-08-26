// Journey (a): onboarding completo de un usuario nuevo + cálculo de macros.
// Verifica el invariante nº1 del auditor: macros MOSTRADOS = macros GUARDADOS,
// y que el cálculo coincida con la fórmula declarada (Mifflin-St Jeor).
import { test, expect } from "@playwright/test";
import {
  installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges, profileFixture, completePrefs,
} from "./helpers.js";

// Datos del usuario de prueba y su cálculo esperado, independiente de la app
const USUARIO = { sexo: "male", edad: 30, estatura: 175, peso: 75, actividad: 1.55 };
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
  await page.selectOption("#ob_activity", "moderate");
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.locator("#ob_goal")).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.locator("#ob_safety_mode")).toBeVisible();
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
    await expect(app).toContainText("Grasa corporal (opcional)");
    await expect(app).toContainText("Déjalo vacío si no lo sabes");

    // Paso 1: datos corporales
    await page.fill("#ob_name", "Bro Nuevo");
    await page.selectOption("#ob_sex", "male");
    await page.fill("#ob_age", String(USUARIO.edad));
    await page.fill("#ob_height", String(USUARIO.estatura));
    await page.fill("#ob_weight", String(USUARIO.peso));
    await page.selectOption("#ob_activity", "moderate");
    await page.getByRole("button", { name: "Continuar" }).click();

    // Paso 2: macros calculados. La fórmula (Mifflin-St Jeor) vive en el tooltip "¿Cómo lo calculamos?" (REQ-103).
    await expect(page.locator("#ob_goal")).toContainText("Mantener mi peso y mejorar mi cuerpo");
    await page.getByRole("button", { name: "¿Cómo lo calculamos?" }).click();
    const formulaModal = page.locator("#overlay");
    await expect(formulaModal).toContainText(/Mifflin-St Jeor/i);
    await formulaModal.getByRole("button", { name: "Entendido" }).click();
    const kcalShown = Number(await page.inputValue("#ob_kcal"));
    const protShown = Number(await page.inputValue("#ob_protein"));
    const carbShown = Number(await page.inputValue("#ob_carbs"));
    const fatShown = Number(await page.inputValue("#ob_fat"));
    // Déficit razonable: entre el 70 % y el 95 % del TDEE calculado aparte (±redondeos)
    expect(kcalShown).toBeGreaterThan(TDEE * 0.7);
    expect(kcalShown).toBeLessThan(TDEE * 0.95);
    // Piso de proteína en déficit: ≥1.6 g/kg
    expect(protShown).toBeGreaterThanOrEqual(USUARIO.peso * 1.6);
    // Coherencia interna: kcal ≈ 4P + 4C + 9G (±12 %)
    const kcalFromMacros = 4 * protShown + 4 * carbShown + 9 * fatShown;
    expect(Math.abs(kcalFromMacros - kcalShown) / kcalShown).toBeLessThan(0.12);
    await page.getByRole("button", { name: "Continuar" }).click();

    // Paso 3: semana de entrenamiento (caminata, sin fuerza por ahora, 10 semanas, ≥3 días)
    await expect(app).toContainText("Ciclo de seguimiento");
    await expect(app).toContainText("¿Practicas alguna actividad física?");
    await expect(page.locator("#ob_sport")).toContainText("Caminar");
    await expect(page.locator("#ob_strength")).toContainText("No quiero fuerza por ahora");
    await expect(page.locator("#ob_duration")).toContainText("10 semanas · recomendado");
    await expect(app).toContainText("10 semanas es el proceso completo recomendado");
    await page.selectOption("#ob_sport", "walking");
    await page.selectOption("#ob_strength", "none");
    await page.selectOption("#ob_duration", "10");
    for (const d of [1, 3, 5]) {
      const cb = page.locator(`#ob_day_${d}`);
      if (!(await cb.isChecked())) await cb.check();
    }
    await page.getByRole("button", { name: "Continuar" }).click();

    // Paso 4: dieta + privacidad + evaluación de seguridad
    await expect(app).toContainText("Cómo comes y restricciones generales");
    await expect(app).toContainText("Como de todo");
    await page.check("#ob_diet_omnivoro");
    await page.check("#ob_consent_core");
    for (const s of await page.locator('#app select[id^="ob_safety_"]').all()) {
      await s.selectOption("no");
    }
    await page.getByRole("button", { name: "Guardar mi plan" }).click();

    // Aterriza en Hoy con las tabs y las kcal del plan recién calculado
    await expect(page.locator("#tabs")).toContainText("Hoy");
    await expect(app).toContainText(String(kcalShown));

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

    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
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
      await expect(page.locator("#ob_safety_mode")).toContainText("Plan completo");
      await page.selectOption("#ob_safety_mode", "full");
      await expect(page.locator("#ob_safety_mode")).toHaveValue("full");
      if (scenario.age >= 55) {
        await expect(page.locator("#ob_sport")).toContainText("Caminar");
        await expect(page.locator("#ob_strength")).toContainText("No quiero fuerza por ahora");
      }

      expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
    });
  }
});
