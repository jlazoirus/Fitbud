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
    // REQ-174: antes de empezar se ve la dosis de cada ejercicio
    await expect(app).toContainText(/Qué vas a hacer hoy · \d+ ejercicios · \d+ series/);
    await expect(app.locator(".plan-row:not(.plan-timed) .plan-dose").first()).toContainText(/\d+ × /);

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
    // "Ya calenté"/"Ya terminé" (REQ-212) o "Marcar completado" en los bloques de tiempo.
    let sawStrengthBlock = false;
    for (let bloque = 0; bloque < totalBloques; bloque++) {
      const finalizar = page.getByRole("button", { name: "Finalizar y guardar sesión" });
      if (await finalizar.isVisible().catch(() => false)) break;

      const siguiente = page.getByRole("button", { name: "Siguiente ejercicio" }).first();
      if (await siguiente.isVisible().catch(() => false)) {
        sawStrengthBlock = true;
        const series = page.locator('#app button.set-done[aria-label^="Serie"]');
        const n = await series.count();
        expect(n).toBeGreaterThanOrEqual(2); // un ejercicio de fuerza tiene ≥2 series
        for (let s = 0; s < n; s++) await series.nth(s).click();
        await siguiente.click();
      } else {
        await page.getByRole("button", { name: /^(Ya calenté|Ya terminé|Marcar completado)$/ }).click();
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
  // REQ-185: recorre la sesión dejando UNA serie prescrita sin marcar en el primer
  // ejercicio de fuerza y una serie extra sin hacer en el segundo.
  async function runSessionLeavingOneSet(page) {
    const app = page.locator("#app");
    await page.getByRole("button", { name: "Iniciar sesión guiada" }).last().click();
    const text = await app.innerText();
    const total = Number((text.match(/0\/(\d+) bloques/) || [])[1]);
    let strength = 0;
    let firstExercise = "";
    for (let bloque = 0; bloque < total; bloque++) {
      const siguiente = page.getByRole("button", { name: "Siguiente ejercicio" }).first();
      if (await siguiente.isVisible().catch(() => false)) {
        strength++;
        const series = page.locator('#app button.set-done[aria-label^="Serie"]');
        const n = await series.count();
        if (strength === 1) {
          firstExercise = (await app.locator(".player-step > h3").first().innerText()).trim();
          for (let s = 0; s < n - 1; s++) await series.nth(s).click();
          await siguiente.click();
          const overlay = page.locator("#overlay");
          await expect(overlay).toContainText("Te queda 1 serie sin marcar");
          await overlay.getByRole("button", { name: "Seguir sin registrarla" }).click();
        } else {
          for (let s = 0; s < n; s++) await series.nth(s).click();
          if (strength === 2) await page.getByRole("button", { name: "+ Añadir serie" }).click();
          await siguiente.click();
        }
      } else {
        await page.getByRole("button", { name: /^(Ya calenté|Ya terminé|Marcar completado)$/ }).click();
      }
      await expect(app).toContainText(new RegExp(`${bloque + 1}\\/${total} bloques`));
    }
    expect(strength).toBeGreaterThanOrEqual(2);
    return firstExercise;
  }
  async function answerAndSave(page) {
    const overlay = page.locator("#overlay");
    await overlay.locator("#finishPain").selectOption({ label: "No" });
    await overlay.locator("#finishDifficulty").selectOption({ label: "Adecuada" });
    await overlay.getByRole("button", { name: "Guardar resultado" }).click();
  }

  test("REQ-185: la serie sin marcar se marca desde el cierre y la sesión queda completada", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);
    await page.locator("#tabs").getByText("Entreno").click();
    const app = page.locator("#app");

    const firstExercise = await runSessionLeavingOneSet(page);
    await page.getByRole("button", { name: "Finalizar y guardar sesión" }).click();
    const overlay = page.locator("#overlay");
    // El modal dice qué falta (y no cuenta la serie extra sin hacer).
    await expect(overlay).toContainText("Falta 1 serie por marcar");
    await expect(overlay.locator(".finish-pending li")).toHaveText([new RegExp(`^${firstExercise} · Serie \\d+$`)]);
    await overlay.locator("#finishPain").selectOption({ label: "No" });
    await overlay.getByRole("button", { name: "Marcarla como hecha" }).click();
    await expect(overlay).not.toContainText("por marcar");
    await expect(overlay.locator("#finishPain")).toHaveValue("none"); // conserva lo respondido
    await expect(overlay.locator("h3")).toHaveText("Finalizar sesión");
    await answerAndSave(page);

    await expect(app).toContainText("Sesión completada");
    const sets = (await app.innerText()).match(/(\d+)\/(\d+)\s*series registradas/);
    expect(sets && sets[1]).toBe(sets && sets[2]);
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  test("REQ-185: una sesión guardada parcial por una serie sin marcar se puede corregir", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);
    await page.locator("#tabs").getByText("Entreno").click();
    const app = page.locator("#app");

    await runSessionLeavingOneSet(page);
    await page.getByRole("button", { name: "Finalizar y guardar sesión" }).click();
    await answerAndSave(page);
    await expect(app).toContainText("Sesión parcial");

    // Antes no había salida: 0 bloques pendientes ⇒ sin "Continuar sesión".
    await page.getByRole("button", { name: "Marcar 1 serie sin registrar" }).click();
    await page.locator('#app button.set-done:not(.on)').first().click();
    await page.getByRole("button", { name: "Siguiente ejercicio" }).click();
    await page.getByRole("button", { name: "Finalizar y guardar sesión" }).click();
    await expect(page.locator("#overlay")).not.toContainText("por marcar");
    await answerAndSave(page);
    await expect(app).toContainText("Sesión completada");
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
  test("REQ-186: el descanso no se congela si un guardado anterior responde tarde", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);
    await page.locator("#tabs").getByText("Entreno").click();
    const app = page.locator("#app");
    await page.getByRole("button", { name: "Iniciar sesión guiada" }).last().click();
    await page.getByRole("button", { name: /^(Ya calenté|Ya terminé|Marcar completado)$/ }).click();
    await expect(page.getByRole("button", { name: "Siguiente ejercicio" })).toBeVisible();

    // Marcar una serie dispara dos guardados seguidos (serie hecha, luego
    // descanso). Con red irregular el primero puede responder después del
    // segundo: se retrasa solo ese.
    let delayed = false;
    await context.route("**/rest/v1/day_log*", async (route) => {
      if (route.request().method() === "POST" && !delayed) {
        delayed = true;
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      await route.fallback();
    });
    await page.locator("#app button.set-done").first().click();
    const timer = app.locator(".workout-timer-value");
    await expect(timer).toBeVisible();
    const start = (await timer.innerText()).trim();

    await page.waitForTimeout(3500);
    expect(delayed).toBe(true);
    const state = await page.evaluate(() => {
      const ex = normalizedWorkoutExecution(current);
      return { timer: !!(ex && ex.timer), setDone: ex.steps[ex.currentStep].sets[0].done };
    });
    expect(state.setDone).toBe(true);
    expect(state.timer, "el estado no debe perder el descanso en curso").toBe(true);
    await expect(timer).not.toHaveText(start); // la cuenta atrás sigue bajando
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
  test("REQ-186: al volver a primer plano el descanso refleja el tiempo real aunque los intervalos se hayan suspendido", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    await page.clock.install();
    const errors = collectConsoleErrors(page);
    await gotoApp(page);
    await page.locator("#tabs").getByText("Entreno").click();
    const app = page.locator("#app");
    await page.getByRole("button", { name: "Iniciar sesión guiada" }).last().click();
    await page.getByRole("button", { name: /^(Ya calenté|Ya terminé|Marcar completado)$/ }).click();
    await page.locator("#app button.set-done").first().click();
    await expect(app.locator(".workout-timer-value")).toBeVisible();
    const restSeconds = await page.evaluate(() => normalizedWorkoutExecution(current).timer.totalSeconds);

    // Pantalla bloqueada: ningún intervalo corre, pero el reloj real avanza.
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { value: true, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    const now = await page.evaluate(() => Date.now());
    await page.clock.pauseAt(now + 1000);
    await page.clock.setSystemTime(now + (restSeconds + 30) * 1000);
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { value: false, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    // Sin avanzar ningún intervalo, la vuelta ya cerró el descanso.
    await expect(app.locator(".workout-timer-value")).toHaveCount(0);
    expect(await page.evaluate(() => normalizedWorkoutExecution(current).timer)).toBeNull();
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
  test("REQ-187: al terminar un ejercicio corre el descanso entre ejercicios (2:00 por defecto)", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);
    await page.locator("#tabs").getByText("Entreno").click();
    const app = page.locator("#app");
    await expect(app).toContainText("Entre ejercicios: 2 min de descanso");
    await page.getByRole("button", { name: "Iniciar sesión guiada" }).last().click();
    await page.getByRole("button", { name: /^(Ya calenté|Ya terminé|Marcar completado)$/ }).click();

    const series = page.locator('#app button.set-done[aria-label^="Serie"]');
    const timerBox = app.locator(".player-timer");
    const timerValue = app.locator(".workout-timer-value");
    const n = await series.count();
    for (let s = 0; s < n - 1; s++) await series.nth(s).click();
    await expect(timerBox).toContainText("Descanso"); // entre series, como antes
    await expect(timerBox).not.toContainText("entre ejercicios");
    await series.nth(n - 1).click();
    // Última serie: arranca el descanso entre ejercicios con 2:00.
    await expect(timerBox).toContainText("Descanso entre ejercicios");
    await expect(timerValue).toHaveText(/^(02:00|01:5\d)$/);
    const ejercicio1 = (await app.locator(".player-step > h3").first().innerText()).trim();

    // Pasa al siguiente ejercicio y el descanso sigue corriendo (no se reinicia).
    await page.getByRole("button", { name: "Siguiente ejercicio" }).click();
    await expect(app.locator(".player-step > h3").first()).not.toHaveText(ejercicio1);
    await expect(timerBox).toContainText("Descanso entre ejercicios");
    await page.waitForTimeout(1500);
    await expect(timerValue).toHaveText(/^01:5\d$/);

    // Marcar la primera serie del ejercicio 2 lo reemplaza por el descanso entre series.
    await series.first().click();
    await expect(timerBox).not.toContainText("entre ejercicios");
    await expect(timerBox).toContainText("Descanso");

    // Omitir lo quita.
    await timerBox.getByRole("button", { name: "Omitir" }).click();
    await expect(timerBox).toHaveCount(0);

    // Tras el último ejercicio de fuerza no arranca ningún descanso.
    for (;;) {
      const siguiente = page.getByRole("button", { name: "Siguiente ejercicio" });
      if (!(await siguiente.isVisible().catch(() => false))) break;
      const isLast = await page.evaluate(() => {
        const ex = normalizedWorkoutExecution(current);
        return !ex.steps.slice(ex.currentStep + 1).some((step) => step.type === "strength" && step.status === "pending");
      });
      const pending = page.locator('#app button.set-done:not(.on)');
      while (await pending.count()) await pending.first().click();
      if (isLast) {
        // Puede seguir el descanso entre series de la serie anterior, pero no
        // arranca un descanso entre ejercicios: sigue la vuelta a la calma.
        expect(await page.evaluate(() => {
          const timer = normalizedWorkoutExecution(current).timer;
          return !!(timer && timer.transition);
        })).toBe(false);
        await expect(app).not.toContainText("Descanso entre ejercicios");
        await siguiente.click();
        break;
      }
      await siguiente.click();
    }
    expect(await page.evaluate(() => normalizedWorkoutExecution(current).timer)).toBeNull();
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
});

// REQ-212: el calentamiento dice qué movimientos hacer y el cronómetro es opcional.
test.describe("Calentamiento guiado", () => {
  test("lista movimientos concretos, 'Ya calenté' avanza sin cronómetro y 'Guíame' los recorre", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);
    await page.locator("#tabs").getByText("Entreno").click();
    const app = page.locator("#app");
    // El resumen previo (REQ-174) nombra los movimientos del calentamiento
    await expect(app.locator(".plan-timed").first()).toContainText(/Círculos|Marcha/);
    await page.getByRole("button", { name: "Iniciar sesión guiada" }).last().click();

    const moves = app.locator(".move-list li");
    expect(await moves.count()).toBeGreaterThanOrEqual(4);
    await expect(moves.first()).toContainText(/\d/); // cada movimiento trae su dosis
    await expect(app.locator(".workout-timer-value")).toHaveCount(0); // sin cuenta atrás automática

    // Guíame: recorre movimiento a movimiento, con cronómetro solo si lo pides
    await page.getByRole("button", { name: "Guíame" }).click();
    await expect(app).toContainText(/Movimiento 1 de \d/);
    await page.getByRole("button", { name: "Siguiente" }).click();
    await expect(app).toContainText(/Movimiento 2 de \d/);
    await page.getByRole("button", { name: "Anterior" }).click();
    await expect(app).toContainText(/Movimiento 1 de \d/);
    await page.getByRole("button", { name: "Ya calenté sin terminar la guía" }).click();
    await expect(app).toContainText(/1\/\d+ bloques/);
    await expect(page.getByRole("button", { name: "Siguiente ejercicio" })).toBeVisible();
    expect(errors).toEqual([]);
  });
});
