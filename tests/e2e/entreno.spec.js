// Journey (c): iniciar y completar una sesión de entreno con el reproductor.
// Cubre la regresión de REQ-92: la sesión trae calentamiento + bloque principal
// + vuelta a la calma (no solo calentamiento/cierre).
// El plan decide la sesión del día (y puede incluir bloque de cardio), así que
// el test lee el total de bloques de la UI y completa los que haya.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges, startGuidedSession, completeTimedBlock } from "./helpers.js";

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
    await startGuidedSession(page);
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
        await completeTimedBlock(page);
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

  test("REQ-244: la duración cuenta el tiempo en segundo plano; una sesión olvidada queda en pausa", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);

    await gotoApp(page);
    await page.locator("#tabs").getByText("Entreno").click();
    await startGuidedSession(page);
    const app = page.locator("#app");
    await expect(app).toContainText(/0\/\d+ bloques/);

    // Sale de la app sin pausar: dispara los listeners reales de visibilitychange.
    const setHidden = (hidden) => page.evaluate((h) => {
      Object.defineProperty(document, "hidden", { value: h, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    }, hidden);
    // Retrocede los instantes guardados para simular minutos u horas fuera.
    const shift = (field, ms) => page.evaluate(([f, d]) => {
      const execution = S.days[todayStr()].workoutExecution;
      execution[f] = new Date(Date.parse(execution[f]) - d).toISOString();
    }, [field, ms]);
    const read = () => page.evaluate(() => {
      const execution = S.days[todayStr()].workoutExecution;
      return { status: execution.status, awayAt: execution.awayAt, elapsed: WORKOUT_PLAYER.elapsedSeconds(execution, Date.now()) };
    });

    // 1) 15 minutos fuera (descanso mirando el móvil, otra app): cuentan.
    await setHidden(true);
    expect((await read()).awayAt, "al salir se anota cuándo").toBeTruthy();
    await shift("resumedAt", 15 * 60 * 1000);
    await shift("awayAt", 15 * 60 * 1000);
    await setHidden(false);
    let state = await read();
    expect(state.status).toBe("in_progress");
    expect(state.awayAt).toBeNull();
    expect(state.elapsed).toBeGreaterThanOrEqual(15 * 60);
    await expect(app.locator(".player-clock")).toContainText(/^15:0\d$/);

    // 2) Se olvida la sesión 3 horas: al volver queda en pausa donde se dejó.
    await setHidden(true);
    await shift("resumedAt", 3 * 3600 * 1000);
    await shift("awayAt", 3 * 3600 * 1000);
    await setHidden(false);
    state = await read();
    expect(state.status).toBe("paused");
    expect(state.elapsed, "no suma las 3 horas fuera").toBeLessThan(16 * 60);
    expect(state.elapsed).toBeGreaterThanOrEqual(15 * 60);
    await expect(page.getByRole("button", { name: /Reanudar/ }).first()).toBeVisible();

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
    await startGuidedSession(page);
    await expect(app).toContainText(/0\/\d+ bloques/);

    // Omite UN bloque (calentamiento, siempre el primero; REQ-236: tras elegir
    // hacerlo) y ABANDONA — nunca "Finalizar y guardar sesión" ni "Terminar parcialmente".
    await page.getByRole("button", { name: "Sí, calentar" }).click();
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
    await startGuidedSession(page);
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
          firstExercise = (await app.locator(".player-step h3").first().innerText()).trim();
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
        await completeTimedBlock(page);
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
    await startGuidedSession(page);
    await completeTimedBlock(page);
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
    await startGuidedSession(page);
    await completeTimedBlock(page);
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
    await startGuidedSession(page);
    await completeTimedBlock(page);

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
    const ejercicio1 = (await app.locator(".player-step h3").first().innerText()).trim();

    // Pasa al siguiente ejercicio y el descanso sigue corriendo (no se reinicia).
    await page.getByRole("button", { name: "Siguiente ejercicio" }).click();
    await expect(app.locator(".player-step h3").first()).not.toHaveText(ejercicio1);
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

// REQ-235 (Jonathan): la sesión no arranca en seco; 3, 2, 1 antes de que corra el reloj.
test.describe("Cuenta atrás", () => {
  test("al iniciar hay 3 s de aviso, se puede cancelar o saltar", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);
    await page.locator("#tabs").getByText("Entreno").click();
    const app = page.locator("#app");
    const start = page.getByRole("button", { name: "Iniciar sesión guiada" }).last();
    const countdown = page.locator("#workoutCountdown");
    const hasExecution = () => page.evaluate(() => !!dayState(current).workoutExecution);

    // Cancelar no crea la sesión.
    await start.click();
    await expect(countdown).toBeVisible();
    await expect(countdown).toContainText("Prepárate");
    // REQ-236: el calentamiento es opcional y se pregunta después; no se anuncia.
    await expect(countdown).not.toContainText("Empiezas con");
    await expect(countdown.locator(".countdown-n")).toHaveText("3");
    expect(await hasExecution()).toBe(false);
    await countdown.getByRole("button", { name: "Cancelar" }).click();
    await expect(countdown).toHaveCount(0);
    await page.waitForTimeout(3500);
    expect(await hasExecution()).toBe(false);

    // Dejarla correr: 3, 2, 1 y recién entonces arranca el reloj.
    await start.click();
    const t0 = Date.now();
    await expect(countdown.locator(".countdown-n")).toHaveText("2");
    await expect(countdown.locator(".countdown-n")).toHaveText("1");
    expect(await hasExecution()).toBe(false);
    await expect(countdown).toHaveCount(0, { timeout: 3000 });
    expect(Date.now() - t0).toBeGreaterThanOrEqual(2500);
    await expect(app).toContainText(/0\/\d+ bloques/);
    await expect(app.locator(".player-clock")).toHaveText(/^00:0[0-2]$/);

    // "Empezar ya" la salta.
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Descartar" }).click();
    await expect(start).toBeVisible();
    await start.click();
    await countdown.getByRole("button", { name: "Empezar ya" }).click();
    await expect(countdown).toHaveCount(0);
    await expect(app).toContainText(/0\/\d+ bloques/);
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
});

// REQ-232 (feedback de Claudia): al hacer un ejercicio se ve con qué carga se
// hizo la última vez, sin tener que recordarlo.
test.describe("Última carga", () => {
  test("el ejercicio muestra lo registrado la semana pasada y el resumen previo la carga", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);
    await page.locator("#tabs").getByText("Entreno").click();
    const app = page.locator("#app");
    await expect(app).toContainText(/Qué vas a hacer hoy/);

    // La semana pasada hizo el primer ejercicio de hoy con 40 y 42,5 kg.
    const slug = await page.evaluate(() => {
      const step = workoutPrescription(current).steps.find((item) => item.type === "strength");
      const past = addDays(current, -7);
      S.days[past] = { ...(S.days[past] || {}), workoutExecution: { status: "completed", steps: [{
        type: "strength", exerciseSlug: step.exerciseSlug, unit: step.unit,
        sets: [{ done: true, reps: 8, load: "40", rpe: 8 }, { done: true, reps: 7, load: "42.5", rpe: 9 }],
      }] } };
      render();
      return step.exerciseSlug;
    });
    expect(slug).toBeTruthy();
    await expect(app.locator(".plan-last").first()).toHaveText("Última vez 42.5 kg");

    await startGuidedSession(page);
    await completeTimedBlock(page);
    const last = app.locator(".last-perf");
    await expect(last).toContainText(/Última vez · \S{3} \d+ \S{3}/);
    await expect(last.locator("b")).toHaveText("40 kg × 8, 42.5 kg × 7");
    await expect(last).toContainText("RPE 8-9");

    // Hoy registra 45 kg; el siguiente ejercicio (sin historial) invita a anotar la carga.
    await app.locator('input[aria-label^="Carga o asistencia, serie 1"]').fill("45");
    await app.locator('input[aria-label^="Carga o asistencia, serie 1"]').blur();
    expect(await page.evaluate(() => normalizedWorkoutExecution(current).steps.find((s) => s.type === "strength").sets[0].load)).toBe("45");
    const first = (await app.locator(".player-step h3").innerText()).trim();
    const pending = app.locator("button.set-done:not(.on)");
    while (await pending.count()) await pending.first().click();
    await page.getByRole("button", { name: "Siguiente ejercicio" }).click();
    await expect(app.locator(".player-step h3")).not.toHaveText(first);
    await expect(app.locator(".player-step")).not.toContainText("Última vez");
    await expect(app.locator(".last-perf-hint")).toBeVisible();
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
});

// REQ-236 (Jonathan): calentamiento y vuelta a la calma no se asignan por defecto.
test.describe("Bloques opcionales", () => {
  test("'Ahora no' salta calentamiento y vuelta a la calma y la sesión queda completada", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);
    await page.locator("#tabs").getByText("Entreno").click();
    const app = page.locator("#app");
    await startGuidedSession(page);
    const total = Number(((await app.innerText()).match(/0\/(\d+) bloques/) || [])[1]);

    await page.getByRole("button", { name: "Ahora no" }).click();
    await expect(app).toContainText(new RegExp(`0\\/${total - 1} bloques`));
    await expect(page.getByRole("button", { name: "Siguiente ejercicio" })).toBeVisible();
    for (;;) {
      const siguiente = page.getByRole("button", { name: "Siguiente ejercicio" });
      if (!(await siguiente.isVisible().catch(() => false))) break;
      const pending = app.locator("button.set-done:not(.on)");
      while (await pending.count()) await pending.first().click();
      await siguiente.click();
    }
    await expect(app.locator(".optional-offer")).toContainText("¿Quieres cerrar con unos minutos suaves?");
    await page.getByRole("button", { name: "Ahora no" }).click();
    await expect(app).toContainText(new RegExp(`${total - 2}\\/${total - 2} bloques`));

    await page.getByRole("button", { name: "Finalizar y guardar sesión" }).click();
    const overlay = page.locator("#overlay");
    await expect(overlay.locator("h3")).toHaveText("Finalizar sesión");
    await overlay.locator("#finishPain").selectOption({ label: "No" });
    await overlay.locator("#finishDifficulty").selectOption({ label: "Adecuada" });
    await overlay.getByRole("button", { name: "Guardar resultado" }).click();
    await expect(app).toContainText("Sesión completada");
    await expect(app.locator(".player-summary")).toContainText(/0\s*bloques omitidos/);
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  // REQ-250 (Jonathan): elegir el calentamiento y luego "Omitir bloque" dejaba
  // la sesión "parcial" con 16/16 series hechas.
  test("omitir un calentamiento ya elegido no deja la sesión parcial; una guardada así se corrige", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);
    await page.locator("#tabs").getByText("Entreno").click();
    const app = page.locator("#app");
    await startGuidedSession(page);
    const total = Number(((await app.innerText()).match(/0\/(\d+) bloques/) || [])[1]);

    await page.getByRole("button", { name: "Sí, calentar" }).click();
    await page.getByRole("button", { name: "Omitir bloque" }).click();
    await expect(app).toContainText(new RegExp(`0\\/${total - 1} bloques`));
    for (;;) {
      const siguiente = page.getByRole("button", { name: "Siguiente ejercicio" });
      if (!(await siguiente.isVisible().catch(() => false))) break;
      const pending = app.locator("button.set-done:not(.on)");
      while (await pending.count()) await pending.first().click();
      await siguiente.click();
    }
    await page.getByRole("button", { name: "Sí, hacerlo" }).click();
    await page.getByRole("button", { name: "Omitir bloque" }).click();
    await page.getByRole("button", { name: "Finalizar y guardar sesión" }).click();
    const overlay = page.locator("#overlay");
    await expect(overlay.locator("h3")).toHaveText("Finalizar sesión");
    await overlay.locator("#finishPain").selectOption({ label: "No" });
    await overlay.locator("#finishDifficulty").selectOption({ label: "Adecuada" });
    await overlay.getByRole("button", { name: "Guardar resultado" }).click();
    await expect(app).toContainText("Sesión completada");
    await expect(app.locator(".player-summary")).toContainText(/0\s*bloques omitidos/);

    // Una sesión guardada antes del arreglo: calentamiento "skipped" y parcial.
    await page.evaluate(() => {
      const st = dayState(current);
      st.workoutExecution.steps[0].status = "skipped";
      st.workoutExecution.status = "partial";
      st.workoutDone = false;
      commitDay(current); render();
    });
    await expect(app).toContainText("Sesión parcial");
    await expect(app.locator(".player-summary")).toContainText(/0\s*bloques omitidos/);
    await app.getByRole("button", { name: "Marcar como completada" }).click();
    await expect(app).toContainText("Sesión completada");
    expect(await page.evaluate(() => dayState(current).workoutDone)).toBe(true);
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
});

// REQ-239 (Jonathan): con la sesión en curso, el aviso, el plan y la tarjeta del
// entrenamiento solo ocupan espacio: van juntos en un desplegable cerrado.
test.describe("Sesión en curso", () => {
  test("el reproductor va primero y el resto queda en 'Plan y detalles de hoy'", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);
    await page.locator("#tabs").getByText("Entreno").click();
    const app = page.locator("#app");
    // Antes de empezar se ve todo, como siempre.
    await expect(app.getByText("Señales para detenerte:")).toBeVisible();
    await expect(app.getByRole("button", { name: "Preparar mi plan" })).toBeVisible();

    await startGuidedSession(page);
    const details = app.locator("details.wk-context");
    await expect(details).toHaveCount(1);
    await expect(details).not.toHaveAttribute("open", /.*/);
    await expect(app.getByText("Señales para detenerte:")).toBeHidden();
    await expect(app.getByRole("button", { name: "Preparar mi plan" })).toBeHidden();
    await expect(app.getByRole("button", { name: "Cambiar entrenamiento" })).toBeHidden();
    // El reproductor queda justo después de la cabecera del día, antes del desplegable.
    const order = await page.evaluate(() => {
      const overview = document.querySelector("#app .player-overview");
      const ctx = document.querySelector("#app details.wk-context");
      return !!(overview && ctx && (overview.compareDocumentPosition(ctx) & Node.DOCUMENT_POSITION_FOLLOWING));
    });
    expect(order).toBe(true);

    // Abrirlo muestra lo de siempre y sigue abierto tras una acción del reproductor.
    await details.locator("summary").click();
    await expect(app.getByText("Señales para detenerte:")).toBeVisible();
    await expect(app.getByRole("button", { name: "Preparar mi plan" })).toBeVisible();
    await page.getByRole("button", { name: "Ahora no" }).click();
    await expect(app.locator("details.wk-context")).toHaveAttribute("open", "");

    // Al descartar la sesión todo vuelve a su lugar.
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Descartar" }).click();
    await expect(app.locator("details.wk-context")).toHaveCount(0);
    await expect(app.getByText("Señales para detenerte:")).toBeVisible();
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
});

// REQ-241 (Jonathan): "Usar progresión" no cambiaba el ejercicio. Ahora pasa a
// otro ejercicio del catálogo (título e imagen), a una variante con nombre
// propio, o explica que solo toca subir la carga.
test.describe("Progresiones", () => {
  test("otro ejercicio, variante y solo carga", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);
    await page.locator("#tabs").getByText("Entreno").click();
    const app = page.locator("#app");
    await startGuidedSession(page);
    await page.getByRole("button", { name: "Ahora no" }).click();
    const setCurrent = (slug) => page.evaluate((s) => {
      const ex = normalizedWorkoutExecution(current);
      const step = currentWorkoutStep(ex);
      Object.assign(step, { exerciseSlug: s, originalExerciseSlug: s, variation: "standard" });
      persistWorkoutExecution(current, ex, true);
    }, slug);
    const title = app.locator(".player-title h3");
    const currentSlug = () => page.evaluate(() => currentWorkoutStep(normalizedWorkoutExecution(current)).exerciseSlug);

    // Otro ejercicio: Remo sentado → versión más fácil = Remo con banda (cambia título e imagen).
    await setCurrent("seated-cable-row");
    await expect(title).toHaveText("Remo sentado en polea");
    await app.getByRole("button", { name: "Usar versión más fácil" }).click();
    await expect(title).toHaveText("Remo con banda");
    expect(await currentSlug()).toBe("band-row");
    await expect(app.locator(".player-step .alert")).toContainText("en lugar de Remo sentado en polea");
    await expect(app.getByRole("button", { name: "Usar progresión" })).toHaveCount(0);
    await app.getByRole("button", { name: "Volver a Remo sentado en polea" }).click();
    await expect(title).toHaveText("Remo sentado en polea");
    expect(await currentSlug()).toBe("seated-cable-row");

    // Variante: Press de banca → "con pausa en el pecho" (mismo ejercicio, título nuevo).
    await setCurrent("bench-press");
    await app.getByRole("button", { name: "Usar progresión" }).click();
    await expect(title).toHaveText("Press de banca con pausa en el pecho");
    expect(await currentSlug()).toBe("bench-press");
    await app.getByRole("button", { name: "Volver a Press de banca" }).click();
    await expect(title).toHaveText("Press de banca");

    // Solo carga: Sentadilla búlgara → "Subir la carga" explica y no cambia nada.
    await setCurrent("bulgarian-split-squat");
    await expect(app.getByRole("button", { name: "Usar progresión" })).toHaveCount(0);
    await app.getByRole("button", { name: "Subir la carga" }).click();
    const overlay = page.locator("#overlay");
    await expect(overlay.locator("h3")).toHaveText("Cómo progresar");
    await expect(overlay).toContainText("Sentadilla búlgara con más carga");
    await overlay.getByRole("button", { name: "Entendido" }).click();
    await expect(title).toHaveText("Sentadilla búlgara");
    expect(await currentSlug()).toBe("bulgarian-split-squat");
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
});

// REQ-247 (Jonathan): "Sustituir" proponía cualquier ejercicio del mismo patrón
// ("pull": dominadas para un face pull, jalón para un remo). Ahora solo los que
// trabajan el mismo músculo principal.
test.describe("Sustituir ejercicio", () => {
  test("solo propone ejercicios del mismo músculo principal", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);
    await page.locator("#tabs").getByText("Entreno").click();
    const app = page.locator("#app");
    await startGuidedSession(page);
    await page.getByRole("button", { name: "Ahora no" }).click();
    const setCurrent = (slug) => page.evaluate((s) => {
      const ex = normalizedWorkoutExecution(current);
      const step = currentWorkoutStep(ex);
      Object.assign(step, { exerciseSlug: s, originalExerciseSlug: s, variation: "standard" });
      persistWorkoutExecution(current, ex, true);
    }, slug);
    const overlay = page.locator("#overlay");
    const options = overlay.locator("button.opt b");

    await setCurrent("seated-cable-row");
    await app.getByRole("button", { name: "Sustituir", exact: true }).click();
    await expect(overlay).toContainText("mismo músculo principal (espalda media)");
    await expect(options).toHaveText(["Remo con banda"]);
    await expect(overlay.locator("button.opt").first()).toContainText("Músculo principal: Espalda media");
    await overlay.locator("button.opt").first().click();
    await expect(app.locator(".player-title h3")).toHaveText("Remo con banda");

    await setCurrent("face-pull");
    await app.getByRole("button", { name: "Sustituir", exact: true }).click();
    await expect(overlay).toContainText("deltoides posterior");
    await expect(options).toHaveCount(0);
    await expect(overlay.locator(".alert")).toContainText("No hay otro ejercicio para deltoides posterior");
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
});

// REQ-240 (Jonathan): la demostración al final de las series quedaba escondida;
// se abre desde un botón junto al nombre del ejercicio.
test.describe("Cómo se hace", () => {
  test("el botón junto al nombre abre la demostración y los pasos", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);
    await page.locator("#tabs").getByText("Entreno").click();
    const app = page.locator("#app");
    await startGuidedSession(page);
    await page.getByRole("button", { name: "Ahora no" }).click();

    const step = app.locator(".player-step");
    const name = (await step.locator(".player-title h3").innerText()).trim();
    await expect(step.locator(".exercise-card")).toHaveCount(0);
    const howto = step.locator(".player-title").getByRole("button", { name: `Cómo se hace ${name}: demostración y pasos` });
    await expect(howto).toBeVisible();
    await howto.click();
    const overlay = page.locator("#overlay");
    await expect(overlay.locator("h3")).toHaveText(name);
    await expect(overlay.locator(".guide-demo")).toHaveCount(1);
    expect(await overlay.locator(".exercise-steps li").count()).toBeGreaterThan(1);
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
});

// REQ-237 (Jonathan): la tarjeta "3-1-1 tempo" no se entendía.
test.describe("Tempo", () => {
  test("la tarjeta dice qué es cada número y al tocarla lo explica", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);
    await page.locator("#tabs").getByText("Entreno").click();
    const app = page.locator("#app");
    await startGuidedSession(page);
    await page.getByRole("button", { name: "Ahora no" }).click();

    const card = app.getByRole("button", { name: /^Qué significa el ritmo / });
    const tempo = (await card.locator(".n").innerText()).trim();
    expect(tempo).toMatch(/^\d+-\d+-\d+$/);
    await expect(card.locator(".l")).toHaveText("baja · pausa · sube ⓘ");
    await card.click();
    const overlay = page.locator("#overlay");
    await expect(overlay.locator("h3")).toHaveText("Ritmo de cada repetición");
    const [down, , up] = tempo.split("-");
    await expect(overlay).toContainText(`${down} s bajando el peso`);
    await expect(overlay).toContainText(`${up} s subiendo`);
    await overlay.getByRole("button", { name: "Entendido" }).click();

    expect(await page.evaluate(() => [tempoPhases("Controlado"), tempoPhases("2-0-1-1")])).toEqual([
      null, { down: 2, pause: 0, up: 1, top: 1 },
    ]);
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
    await expect(app.locator(".plan-timed").first()).toContainText("opcional");
    await startGuidedSession(page);

    // REQ-236: primero pregunta; la lista solo aparece si eliges calentar.
    await expect(app.locator(".optional-offer")).toContainText("¿Quieres calentar antes de empezar?");
    await expect(app.locator(".optional-offer")).toContainText("Es opcional");
    await expect(app.locator(".move-list")).toHaveCount(0);
    await page.getByRole("button", { name: "Sí, calentar" }).click();

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

// Jonathan (2026-10-21): además de "Siguiente ejercicio" y "Omitir", poder volver
// al ejercicio anterior para revisarlo, sin cambiar lo registrado ni el avance.
test.describe("Ejercicio anterior", () => {
  test("se revisa el anterior sin tocar lo registrado y se vuelve al ejercicio en curso", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);
    await page.locator("#tabs").getByText("Entreno").click();
    const app = page.locator("#app");
    await startGuidedSession(page);
    const total = Number(((await app.innerText()).match(/0\/(\d+) bloques/) || [])[1]);
    await page.getByRole("button", { name: "Ahora no" }).click();
    // Sin nada registrado antes, no hay a dónde volver.
    await expect(page.getByRole("button", { name: "← Ejercicio anterior" })).toHaveCount(0);

    // Primer ejercicio: anota la carga, marca sus series y avanza.
    const first = (await app.locator(".player-step h3").innerText()).trim();
    await app.locator('input[aria-label^="Carga"]').first().fill("40");
    await app.locator('input[aria-label^="Carga"]').first().dispatchEvent("change");
    const pending = app.locator("button.set-done:not(.on)");
    const sets = await pending.count();
    while (await pending.count()) await pending.first().click();
    await page.getByRole("button", { name: "Siguiente ejercicio" }).click();
    await expect(app).toContainText(new RegExp(`1\\/${total - 1} bloques`));
    const second = (await app.locator(".player-step h3").innerText()).trim();
    expect(second).not.toBe(first);

    // Volver al anterior: se ve lo registrado, sin Omitir ni Siguiente ejercicio.
    await page.getByRole("button", { name: "← Ejercicio anterior" }).click();
    const review = app.locator(".player-step.reviewing");
    await expect(review.locator("h3")).toHaveText(first);
    await expect(review).toContainText(`Registraste ${sets} series`);
    await expect(review.locator(".review-sets li").first()).toContainText("40 kg");
    await expect(page.getByRole("button", { name: "Omitir ejercicio" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Siguiente ejercicio" })).toHaveCount(0);
    await expect(app).toContainText(new RegExp(`1\\/${total - 1} bloques`));

    // Volver al ejercicio en curso: sigue donde iba, con Omitir y Siguiente.
    await page.getByRole("button", { name: "Volver al ejercicio en curso" }).click();
    await expect(app.locator(".player-step h3")).toHaveText(second);
    await expect(page.getByRole("button", { name: "Omitir ejercicio" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Siguiente ejercicio" })).toBeVisible();

    // Omitir el segundo, revisarlo y retomarlo.
    await page.getByRole("button", { name: "Omitir ejercicio" }).click();
    await page.getByRole("button", { name: "← Ejercicio anterior" }).click();
    await expect(review.locator("h3")).toHaveText(second);
    await expect(review).toContainText("Lo omitiste.");
    await review.getByRole("button", { name: "← Anterior" }).click();
    await expect(review.locator("h3")).toHaveText(first);
    await review.getByRole("button", { name: "Siguiente →" }).click();
    await expect(review.locator("h3")).toHaveText(second);
    await review.getByRole("button", { name: "Hacerlo ahora" }).click();
    await expect(app.locator(".player-step h3")).toHaveText(second);
    await expect(app).toContainText(new RegExp(`1\\/${total - 1} bloques`));
    await expect(page.getByRole("button", { name: "Siguiente ejercicio" })).toBeVisible();

    // El registro del primero quedó intacto.
    const firstSets = await page.evaluate(() => {
      const ex = normalizedWorkoutExecution(todayStr());
      const step = ex.steps.find((s) => s.type === "strength" && s.status === "done");
      return step.sets.filter((s) => s.done).map((s) => s.load);
    });
    expect(firstSets[0]).toBe("40");
    expect(firstSets.length).toBe(sets);
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
});

test.describe("Plan de entrenamiento con el coach (REQ-251)", () => {
  test("el tope de tokens alcanza para la semana más larga y se pide JSON en una línea", async ({ page, context }) => {
    const { calls } = await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    await gotoApp(page);

    // En producción las 8 semanas pedidas terminaron con exactamente 2048 tokens
    // de salida (JSON cortado), incluida una de 4 sesiones de fuerza cuyo JSON con
    // sangría ocupa ~5.400 caracteres: 2048 tokens no alcanzan ni a 2,7 caracteres
    // por token. Se exige margen para ~2,5 caracteres por token.
    const weeks = await page.evaluate(async () => {
      const base = migrateProfilePrefs((profile && profile.prefs) || {});
      const variants = [
        {},
        { trainingDays: [1, 2, 3, 4, 5, 6], sessionMinutes: 90 },
        { trainingDays: [1, 2, 3, 4, 5, 6], sessionMinutes: 90, primarySport: "running", strengthMode: "gym" },
      ];
      const out = [];
      for (const variant of variants) {
        const prefs = { ...base, ...variant };
        const expected = trainingExpectedWeeks(prefs)[0];
        const pretty = JSON.stringify(deterministicTrainingWeekPayload(expected, prefs), null, 2).length;
        try {
          await generateTrainingWeek(expected, prefs, { action: "training_plan", requestId: crypto.randomUUID(), partKey: `week-${expected.week}` });
        } catch (_) { /* el mock no devuelve una semana: solo interesa lo enviado */ }
        out.push({ sessions: expected.sessions.length, pretty });
      }
      return out;
    });
    const sent = calls.filter((c) => c.table === "/api/claude" && c.payload?.quota?.action === "training_plan").map((c) => c.payload);
    expect(sent).toHaveLength(weeks.length);
    weeks.forEach((week, i) => {
      expect(sent[i].maxTokens, `semana de ${week.sessions} sesiones (${week.pretty} caracteres con sangría)`).toBeGreaterThanOrEqual(Math.ceil(week.pretty / 2.5));
      expect(sent[i].userText).toContain("en una sola línea, sin sangría");
    });
  });
});
