// Journey (c): iniciar y completar una sesión de entreno con el reproductor.
// Cubre la regresión de REQ-92: la sesión trae calentamiento + bloque principal
// + vuelta a la calma (no solo calentamiento/cierre).
// El plan decide la sesión del día (y puede incluir bloque de cardio), así que
// el test lee el total de bloques de la UI y completa los que haya.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges } from "./helpers.js";

test.describe("Entreno", () => {
  test("sesión guiada completa: todos los bloques registrados y cierre guardado", async ({ page, context }) => {
    const { calls } = await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);

    await gotoApp(page);
    await page.locator("#tabs").getByText("Entreno").click();

    const app = page.locator("#app");
    // Hoy es día de entreno (el fixture lo garantiza) con sesión de fuerza en gimnasio
    await expect(app).toContainText(/Gimnasio ·/);
    await expect(app).toContainText(/ejercicios guiados/i);

    // Arrancar el reproductor
    await page.getByRole("button", { name: "Iniciar sesión guiada" }).last().click();
    await expect(app).toContainText(/0\/\d+ bloques/);

    // REQ-92: la sesión empieza con calentamiento y el total de bloques cubre
    // calentamiento + ejercicios + vuelta a la calma (mínimo 5 bloques).
    await expect(app).toContainText(/CALENTAMIENTO/i);
    const text = await app.innerText();
    const totalBloques = Number((text.match(/0\/(\d+) bloques/) || [])[1]);
    expect(totalBloques).toBeGreaterThanOrEqual(5);

    // Completar cada bloque como usuario: series en los de fuerza,
    // "Marcar completado" en calentamiento/cardio/vuelta a la calma.
    let sawStrengthBlock = false;
    for (let bloque = 0; bloque < totalBloques; bloque++) {
      const finalizar = page.getByRole("button", { name: "Finalizar y guardar sesión" });
      if (await finalizar.isVisible().catch(() => false)) break;

      const siguiente = page.getByRole("button", { name: "Siguiente ejercicio" }).first();
      if (await siguiente.isVisible().catch(() => false)) {
        sawStrengthBlock = true;
        const series = page.locator('#app button.chk[aria-label^="Serie"]');
        const n = await series.count();
        expect(n).toBeGreaterThanOrEqual(2); // un ejercicio de fuerza tiene ≥2 series
        for (let s = 0; s < n; s++) await series.nth(s).click();
        await siguiente.click();
      } else {
        await page.getByRole("button", { name: "Marcar completado" }).click();
      }
      await expect(app).toContainText(new RegExp(`${bloque + 1}\\/${totalBloques} bloques`));
    }
    expect(sawStrengthBlock, "la sesión debe incluir bloques de fuerza (REQ-92)").toBe(true);
    await expect(app).toContainText(new RegExp(`${totalBloques}\\/${totalBloques} bloques`));

    // Cierre: cuestionario de sensaciones y guardado
    await expect(app).toContainText(/Todos los bloques están registrados/i);
    await page.getByRole("button", { name: "Finalizar y guardar sesión" }).click();
    const overlay = page.locator("#overlay");
    const selects = overlay.locator("select");
    await expect(selects.first()).toBeVisible();
    await selects.nth(0).selectOption({ label: "No" });
    await selects.nth(1).selectOption({ label: "Adecuada" });
    await overlay.getByRole("button", { name: "Guardar resultado" }).click();

    // La sesión quedó cerrada: el reproductor ya no está en curso
    await expect(app).not.toContainText("Finalizar y guardar sesión");
    await expect(app).not.toContainText(/En curso ·/);

    // El progreso se persistió por acción (day_log recibe upserts durante la sesión)
    const dayWrites = calls.filter((c) => c.table === "day_log" && c.method === "POST").length;
    expect(dayWrites).toBeGreaterThan(totalBloques - 1);

    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  test("REQ-155: el cronómetro no cuenta el tiempo con la app en segundo plano", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);

    await gotoApp(page);
    await page.locator("#tabs").getByText("Entreno").click();
    await page.getByRole("button", { name: "Iniciar sesión guiada" }).last().click();
    await expect(page.locator("#app")).toContainText(/0\/\d+ bloques/);

    // Simula que la app se va a segundo plano (pantalla bloqueada / cambio de
    // app) SIN que el usuario haya pausado manualmente — dispara el listener
    // real de visibilitychange (no una versión simulada de la función).
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { value: true, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    const frozen = await page.evaluate(() => {
      const execution = S.days[todayStr()].workoutExecution;
      return { resumedAt: execution.resumedAt, elapsedSeconds: execution.elapsedSeconds };
    });
    expect(frozen.resumedAt, "al ocultarse, resumedAt debe quedar en null (pausa implícita)").toBeNull();
    expect(frozen.elapsedSeconds, "recién iniciada, el tiempo congelado debe ser casi 0").toBeLessThan(30);

    // Con resumedAt en null, elapsedSeconds() no debe sumar nada aunque "ahora"
    // esté 2 horas en el futuro (simula la app cerrada ese tiempo real).
    const afterTwoHours = await page.evaluate(() => {
      const execution = S.days[todayStr()].workoutExecution;
      return WORKOUT_PLAYER.elapsedSeconds(execution, Date.now() + 2 * 3600 * 1000);
    });
    expect(afterTwoHours).toBe(frozen.elapsedSeconds);
    expect(afterTwoHours, "no debe acercarse a las 2h (7200s) que antes se contaban de más").toBeLessThan(30);

    // Al volver (cualquier interacción re-normaliza la ejecución), el
    // cronómetro retoma desde AHORA, no desde el hueco de 2 horas.
    const resumedAt = await page.evaluate(() => normalizedWorkoutExecution(todayStr()).resumedAt);
    expect(resumedAt).toBeTruthy();
    expect(Date.now() - Date.parse(resumedAt)).toBeLessThan(10_000);

    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  test("REQ-163: una sesión abandonada 'en curso' no cuenta como entreno hecho para la racha", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);

    await gotoApp(page);
    await page.locator("#tabs").getByText("Entreno").click();

    const app = page.locator("#app");
    await page.getByRole("button", { name: "Iniciar sesión guiada" }).last().click();
    await expect(app).toContainText(/0\/\d+ bloques/);

    // Omite UN bloque (calentamiento, siempre el primero) y ABANDONA — nunca
    // "Finalizar y guardar sesión" ni "Terminar parcialmente".
    await page.getByRole("button", { name: "Omitir bloque" }).click();

    // El propio "Resumen" del día debe seguir mostrando "En curso" para
    // entrenamiento: la sesión no cerró (completed/partial).
    await expect(app).toContainText("En curso");

    const result = await page.evaluate(() => ({
      trainingDayResult: trainingDayResult(todayStr()),
      trainCur: streakStats().trainCur,
    }));
    expect(result.trainingDayResult, "una sesión in_progress abandonada no debe contar como 'hecho'").toBe("missed");
    expect(result.trainCur, "trainCur no debe subir por una sesión abandonada sin cerrar").toBe(0);

    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
});
