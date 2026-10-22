// REQ-206: registrar a mano lo que entrenaste (también en un día de descanso),
// con estimación de calorías determinista (MET × kg × horas; 0 llamadas pagadas).
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges, completePrefs, todayYmd, USER_ID, trainingDaysIncludingToday } from "./helpers.js";

// Día de hoy ya preparado (comidas pendientes) para que Hoy muestre la agenda.
const meal = (name) => ({ done: false, ovr: { name, kcal: 600, p: 40, c: 60, f: 20 } });
const preparedToday = () => ({
  user_id: USER_ID,
  log_date: todayYmd(),
  state: { meals: { desayuno: meal("Avena con fruta"), almuerzo: meal("Pollo con arroz"), cena: meal("Tortilla y ensalada") }, extras: [], workoutDone: false },
  plan_version_id: null,
  updated_at: new Date().toISOString(),
});

// Tres días de entreno que NO incluyen hoy: hoy es descanso planificado.
function restTodayPrefs() {
  const today = new Date().getDay();
  const days = [1, 2, 3, 4, 5, 6, 0].filter((d) => d !== today).slice(0, 3);
  return completePrefs({ trainingDays: days, trainingLocations: Object.fromEntries(days.map((d) => [d, "gym"])) });
}

test.describe("Actividad registrada a mano", () => {
  test("en un día de descanso se registra lo entrenado, estima kcal y cuenta como entrenado", async ({ page, context }) => {
    const { calls } = await installMocks(context, { prefs: restTodayPrefs(), tables: { day_log: { rows: [preparedToday()] } } });
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);
    expect(await page.evaluate(() => trainingDayResult(todayStr()))).toBe("rest");
    // En Hoy, el descanso ofrece registrar que entrenó igual.
    await expect(page.locator("#app")).toContainText("Descanso planificado");
    await expect(page.getByRole("button", { name: "Entrené igual" })).toBeVisible();
    await expect(page.locator(".agenda-count")).toHaveText("1 pendiente"); // el descanso no cuenta

    await page.locator("#tabs").getByText("Entreno").click();
    const app = page.locator("#app");
    await expect(app).toContainText("Descanso planificado: no cuenta como sesión incompleta.");
    await page.getByRole("button", { name: "Hoy entrené igual: registrar actividad" }).click();

    const overlay = page.locator("#overlay");
    await overlay.locator("#ma_sport").selectOption("padel");
    await overlay.locator("#ma_minutes").fill("60");
    await overlay.locator("#ma_intensity").selectOption("moderate");
    // Pádel moderado: 6 MET × 75 kg × 1 h = 450 kcal.
    await expect(overlay.locator("#ma_estimate")).toContainText("≈ 450");
    await expect(overlay).toContainText("tu peso (75 kg)");
    await overlay.locator("#ma_notes").fill("Dos partidos con amigas");
    await overlay.getByRole("button", { name: "Guardar actividad" }).click();

    const row = app.locator(".activity-row");
    await expect(row).toContainText("Pádel / tenis");
    await expect(row).toContainText("60 min · Moderada · ≈ 450 kcal");
    await expect(row).toContainText("Dos partidos con amigas");
    await expect(app).toContainText("Descanso planificado, pero entrenaste igual");
    await expect(app.locator(".player-status").first()).toContainText("Actividad registrada");
    expect(await page.evaluate(() => trainingDayResult(todayStr()))).toBe("done");

    // Se sincroniza con el resto del día (sin migración).
    const synced = calls.filter((c) => c.table === "day_log" && c.payload && c.payload.state && c.payload.state.manualActivities);
    expect(synced.at(-1).payload.state.manualActivities[0]).toMatchObject({ sport: "padel", minutes: 60, intensity: "moderate", kcal: 450 });

    // Editar recalcula la estimación.
    await row.getByRole("button", { name: "Editar" }).click();
    await overlay.locator("#ma_minutes").fill("90");
    await expect(overlay.locator("#ma_estimate")).toContainText("≈ 675");
    await overlay.getByRole("button", { name: "Guardar actividad" }).click();
    await expect(row).toContainText("90 min · Moderada · ≈ 675 kcal");

    // Hoy (Home) refleja que entrenó igual.
    await page.locator("#tabs").getByText("Hoy").click();
    await expect(app).toContainText(/entrenaste igual/i);

    // Quitarla devuelve el día a descanso planificado.
    await page.locator("#tabs").getByText("Entreno").click();
    page.once("dialog", (d) => d.accept());
    await row.getByRole("button", { name: "Quitar" }).click();
    await expect(app.locator(".activity-row")).toHaveCount(0);
    expect(await page.evaluate(() => trainingDayResult(todayStr()))).toBe("rest");
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  test("en un día de entreno se puede registrar otro deporte en lugar de la sesión", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);
    expect(await page.evaluate(() => trainingDayResult(todayStr()))).toBe("missed");

    await page.locator("#tabs").getByText("Entreno").click();
    await page.getByRole("button", { name: "＋ Registrar otra actividad" }).click();
    const overlay = page.locator("#overlay");
    await overlay.locator("#ma_sport").selectOption("running");
    await overlay.locator("#ma_minutes").fill("30");
    await overlay.locator("#ma_intensity").selectOption("vigorous");
    // Correr intenso: 11,5 MET × 75 kg × 0,5 h = 431 → redondeado a 430.
    await expect(overlay.locator("#ma_estimate")).toContainText("≈ 430");
    await overlay.getByRole("button", { name: "Guardar actividad" }).click();
    await expect(page.locator("#app .activity-row")).toContainText("30 min · Intensa · ≈ 430 kcal");
    expect(await page.evaluate(() => trainingDayResult(todayStr()))).toBe("done");
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
  test("REQ-252: con \"Otra actividad\" el día de tu deporte se registra y no es un descanso", async ({ page, context }) => {
    // Como Diego: otro deporte + gimnasio, 4 días; hoy en exterior (su pádel), el resto en gimnasio.
    const today = new Date().getDay();
    const days = trainingDaysIncludingToday();
    const prefs = completePrefs({
      primarySport: "other", trainingPriority: "composition", trainingExperience: "beginner",
      trainingDays: days, trainingLocations: Object.fromEntries(days.map((d) => [d, d === today ? "outdoor" : "gym"])),
    });
    await installMocks(context, { prefs });
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);
    // Antes: los días de deporte de "other" pasaban a "Descanso total".
    const week = await page.evaluate(() => {
      const out = [];
      for (let i = 0; i < 7; i++) out.push(effectiveWorkout(addDays(todayStr(), i)).workout.name);
      return out;
    });
    expect(week.filter((n) => n === "Día de tu deporte")).toHaveLength(2);
    expect(week.filter((n) => n.startsWith("Gimnasio"))).toHaveLength(2);
    expect(week[0]).toBe("Día de tu deporte");
    // Sin registrar no cuenta como sesión perdida.
    expect(await page.evaluate(() => trainingDayResult(todayStr()))).toBe("rest");

    await page.locator("#tabs").getByText("Entreno").click();
    const app = page.locator("#app");
    await expect(app).toContainText("Día de tu deporte");
    await expect(app).not.toContainText("Descanso total");
    await expect(page.getByRole("button", { name: "Iniciar sesión guiada" })).toHaveCount(0);
    await expect(app).toContainText("Si hoy no la haces, no cuenta como sesión perdida.");
    await page.getByRole("button", { name: "Registrar mi actividad" }).click();
    const overlay = page.locator("#overlay");
    await expect(overlay.locator("#ma_sport")).toHaveValue("other");
    await overlay.locator("#ma_sport").selectOption("padel");
    await overlay.getByRole("button", { name: "Guardar actividad" }).click();
    await expect(app.locator(".activity-row")).toContainText("Pádel / tenis");
    await expect(page.getByRole("button", { name: "Registrar mi actividad" })).toHaveCount(0);
    expect(await page.evaluate(() => trainingDayResult(todayStr()))).toBe("done");
    // La próxima vez propone lo último que registraste.
    await page.evaluate(() => openManualActivity(todayStr()));
    await expect(overlay.locator("#ma_sport")).toHaveValue("padel");
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
  test("REQ-253: la pregunta del deporte se explica y \"Hice otro deporte\" reemplaza la sesión de fuerza", async ({ page, context }) => {
    // 3 de fuerza + 1 de deporte; el día de deporte va en exterior para que hoy sea de fuerza.
    const today = new Date().getDay();
    const days = trainingDaysIncludingToday();
    const sportDay = days.filter((d) => d !== today).pop();
    const prefs = completePrefs({
      primarySport: "other", trainingPriority: "strength",
      trainingDays: days, trainingLocations: Object.fromEntries(days.map((d) => [d, d === sportDay ? "outdoor" : "gym"])),
    });
    await installMocks(context, { prefs });
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);
    page.on("dialog", (dialog) => dialog.accept());

    await page.locator("#tabs").getByText("Perfil").click();
    await page.locator("#pfSecEntreno > summary").click();
    await expect(page.locator('label[for="pf_sport"]')).toHaveText("¿Haces otro deporte además de la fuerza?");
    await expect(page.locator("#pf_sport option:checked")).toHaveText("Otro deporte");
    await expect(page.locator("#pf_sport_help")).toContainText("quedan para tu deporte");
    await page.selectOption("#pf_sport", "running");
    await expect(page.locator("#pf_sport_help")).toHaveText("Tu semana suma sesiones guiadas de correr entre las de fuerza.");
    await expect(page.locator("#pfSecEntreno")).toContainText("Es tu semana de referencia, no una obligación");

    // Hoy toca fuerza: juega pádel en su lugar.
    await page.locator("#tabs").getByText("Entreno").click();
    const sesion = await page.evaluate(() => effectiveWorkout(todayStr()).workout.name);
    expect(sesion).toMatch(/^Gimnasio/);
    await page.getByRole("button", { name: "Hice otro deporte" }).click();
    const overlay = page.locator("#overlay");
    await expect(overlay).toContainText(`Cuenta como día entrenado en lugar de ${sesion}. Tu plan sigue igual desde la próxima sesión.`);
    await expect(overlay.locator("#ma_sport")).toHaveValue("other");
    await overlay.locator("#ma_sport").selectOption("padel");
    await overlay.getByRole("button", { name: "Guardar actividad" }).click();
    await expect(page.locator("#app .activity-row")).toContainText("Pádel / tenis");
    expect(await page.evaluate(() => trainingDayResult(todayStr()))).toBe("done");
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
});
