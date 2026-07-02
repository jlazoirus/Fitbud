// Journey (a): onboarding completo de un usuario nuevo + cálculo de macros.
// Verifica el invariante nº1 del auditor: macros MOSTRADOS = macros GUARDADOS,
// y que el cálculo coincida con la fórmula declarada (Mifflin-St Jeor).
import { test, expect } from "@playwright/test";
import {
  installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges, profileFixture,
} from "./helpers.js";

// Datos del usuario de prueba y su cálculo esperado, independiente de la app
const USUARIO = { sexo: "male", edad: 30, estatura: 175, peso: 75, actividad: 1.55 };
const BMR = 10 * USUARIO.peso + 6.25 * USUARIO.estatura - 5 * USUARIO.edad + 5; // Mifflin hombre
const TDEE = BMR * USUARIO.actividad;

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

    // Paso 1: datos corporales
    await page.fill("#ob_name", "Bro Nuevo");
    await page.selectOption("#ob_sex", "male");
    await page.fill("#ob_age", String(USUARIO.edad));
    await page.fill("#ob_height", String(USUARIO.estatura));
    await page.fill("#ob_weight", String(USUARIO.peso));
    await page.selectOption("#ob_activity", "moderate");
    await page.getByRole("button", { name: "Continuar" }).click();

    // Paso 2: macros calculados. La app declara Mifflin-St Jeor: lo verificamos.
    await expect(app).toContainText(/Mifflin-St Jeor/i);
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

    // Paso 3: semana de entrenamiento (solo fuerza, gym, 10 semanas, ≥3 días)
    await page.check("#ob_has_cardio_no");
    await page.selectOption("#ob_strength", "gym");
    await page.selectOption("#ob_duration", "10");
    for (const d of [1, 3, 5]) {
      const cb = page.locator(`#ob_day_${d}`);
      if (!(await cb.isChecked())) await cb.check();
    }
    await page.getByRole("button", { name: "Continuar" }).click();

    // Paso 4: dieta + privacidad + evaluación de seguridad
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
    expect(prefs.onboardingCompletedAt).toBeTruthy();

    // Consentimientos y screening quedaron registrados (privacidad por defecto)
    expect(calls.filter((c) => c.table === "user_consents" && c.method === "POST").length).toBeGreaterThan(0);
    expect(calls.filter((c) => c.table === "safety_screenings" && c.method === "POST").length).toBeGreaterThan(0);

    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
});
