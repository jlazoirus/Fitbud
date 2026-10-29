// Journey Home (Hoy): los chips del coach deben reflejar el mismo estado que
// la agenda — REQ-153 (una comida saltada, o el entreno bajo pausa por
// seguridad, no deben ser "pendientes" sugeridos por el coach).
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges, screeningFixture } from "./helpers.js";

test.describe("Home — chips del coach", () => {
  test("REQ-153: una comida saltada deja de aparecer en los chips ('¿Qué como para...?')", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);

    await gotoApp(page);

    // Prepara el día (mealCount:3 → desayuno/almuerzo/cena) y lo aplica.
    const preparar = page.getByRole("button", { name: /Preparar mi día/i });
    await expect(preparar.first()).toBeVisible();
    await preparar.first().click();
    const overlay = page.locator("#overlay");
    await expect(overlay).toContainText(/Total del día/i, { timeout: 15_000 });
    const aplicar = overlay.getByRole("button", { name: /Aplicar al día/i });
    await expect(aplicar).toBeEnabled();
    await aplicar.click();

    const app = page.locator("#app");
    await expect(app).toContainText("¿Qué como para Desayuno?");

    // Saltar el desayuno (misma función que usa el botón "Saltar esta comida").
    await page.evaluate(() => skipMeal(todayStr(), "desayuno"));
    await page.locator("#tabs").getByText("Hoy").click();

    // El chip ya no debe ofrecer el desayuno saltado; debe pasar a la siguiente
    // comida pendiente real (almuerzo), igual que ya hacía la agenda.
    await expect(app).not.toContainText("¿Qué como para Desayuno?");
    await expect(app).toContainText("¿Qué como para Almuerzo?");

    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  test("REQ-153: con pausa por seguridad activa, ningún chip ofrece el entrenamiento", async ({ page, context }) => {
    await installMocks(context, {
      tables: { safety_screenings: { row: { ...screeningFixture(), has_red_flags: true, cleared_for_training: false } } },
    });
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);

    await gotoApp(page);

    const app = page.locator("#app");
    await expect(app).not.toContainText("¿Cómo hago el entrenamiento de hoy?");
    await expect(app).not.toContainText("Adapta el entreno de hoy por falta de tiempo");
    await expect(app).not.toContainText("Perdí la sesión de hoy");

    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
});

test.describe("Nutrición — comidas sin asignar (REQ-161)", () => {
  test("un slot 'Sin asignar' no puede marcarse como hecho ni contar como comida cumplida", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);

    await gotoApp(page);
    // Día SIN preparar (no se toca "Preparar mi día"): los 3 slots quedan "Sin asignar".
    await page.locator("#tabs").getByText("Nutrición").click();
    const app = page.locator("#app");
    await expect(app).toContainText("Sin asignar");

    // 1) El check debe estar deshabilitado y toggleMeal() debe ignorar el intento
    // (mismo camino que dispara el botón real).
    await expect(page.locator(".meal button.chk").first()).toBeDisabled();
    await page.evaluate(() => toggleMeal(todayStr(), "desayuno"));
    const doneAfterAttempt = await page.evaluate(() => {
      const st = S.days[todayStr()];
      return !!(st && st.meals && st.meals.desayuno && st.meals.desayuno.done);
    });
    expect(doneAfterAttempt, "toggleMeal() no debe poder marcar como hecha una comida sin contenido").toBe(false);

    // 2) Aunque el estado quedara done:true por otra vía (dato previo/otro camino
    // de escritura), dayTotals()/nutritionDayDone() no deben acreditarla.
    await page.evaluate(() => { dayState(todayStr()).meals.desayuno = { done: true }; save(); });
    const totals = await page.evaluate(() => dayTotals(todayStr()));
    expect(totals.doneMeals, "una comida sin contenido marcada done no debe sumar a doneMeals").toBe(0);
    const nutDone = await page.evaluate(() => nutritionDayDone(todayStr()));
    expect(nutDone, "nutritionDayDone no debe acreditarse por comidas sin contenido real").toBe(false);

    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
});

test.describe("Home — agenda (REQ-249)", () => {
  test("los botones de 'Lo que sigue hoy' no quedan pegados al borde de su tarjeta", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);

    await gotoApp(page);
    await page.getByRole("button", { name: /Preparar mi día/i }).first().click();
    const overlay = page.locator("#overlay");
    await expect(overlay).toContainText(/Total del día/i, { timeout: 15_000 });
    await overlay.getByRole("button", { name: /Aplicar al día/i }).click();
    await page.locator("#tabs").getByText("Hoy").click();
    await expect(page.locator(".agenda-item .agenda-actions .btn").first()).toBeVisible();

    // Para cada botón, el contenedor con borde más cercano debe dejarle aire a la
    // derecha. Antes, la fila heredaba la tarjeta global .meal/.workout (borde)
    // con relleno lateral 0 y "Ver detalle"/"Adaptar" tocaban el borde.
    const gaps = await page.evaluate(() => [...document.querySelectorAll(".agenda-item .agenda-actions .btn")].map((btn) => {
      let box = btn.parentElement;
      while (box && parseFloat(getComputedStyle(box).borderRightWidth) === 0) box = box.parentElement;
      const inner = box.getBoundingClientRect().right - parseFloat(getComputedStyle(box).borderRightWidth);
      return { text: btn.textContent.trim(), gap: Math.round(inner - btn.getBoundingClientRect().right) };
    }));
    expect(gaps.length).toBeGreaterThan(0);
    for (const { text, gap } of gaps) expect(gap, `"${text}" queda a ${gap}px del borde`).toBeGreaterThanOrEqual(12);

    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
});

test.describe("Home — día cerrado (REQ-258)", () => {
  test("REQ-299: registrar comidas propias cierra hoy sin exigir un menú para mañana", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);
    const preparations = [];
    page.on("request", request => {
      if (request.url().includes("/api/claude") && /diet_day|diet_week/.test(request.postData() || "")) preparations.push(request.url());
    });
    await gotoApp(page);
    // Datos de comidas propias, sin gen ni snapshot de un menú del coach.
    await page.evaluate(() => {
      const ds = todayStr();
      buildDay(ds).meals.forEach(m => {
        mealState(ds, m.id).ovr = { name: "Mi " + m.slot, kcal: 400, p: 25, c: 45, f: 13 };
        toggleMeal(ds, m.id);
      });
      dayState(ds).workoutDone = true;
      setView("hoy");
    });
    const original = await page.evaluate(() => JSON.stringify(dayState(todayStr())));
    const card = page.locator(".agenda-state.done");
    await expect(card).toContainText("Todo listo por hoy");
    await expect(card.locator(".agenda-sub")).toContainText("3/3 comidas registradas · 1200 kcal");
    const meals = card.locator(".agenda-next .kind-meal");
    await expect(meals).toContainText("Comidas de mañana");
    await expect(meals).toContainText("Puedes registrarlas mañana");
    await expect(meals).toContainText("Preparar un menú es opcional.");
    await expect(card).not.toContainText("Aún por preparar");

    // Revisar el texto real en móvil y escritorio, sin desbordes.
    for (const [name, width, height] of [["mobile", 390, 844], ["desktop", 1440, 1000]]) {
      await page.setViewportSize({ width, height });
      await expect(meals).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await card.screenshot({ path: `/tmp/req-299-${name}.png` });
    }
    await card.getByRole("button", { name: "Ver mañana" }).click();
    await expect.poll(() => page.evaluate(() => current)).toBe(await page.evaluate(() => addDays(todayStr(), 1)));
    expect(await page.evaluate(() => JSON.stringify(dayState(todayStr())))).toBe(original);

    // Una comida propia para mañana no equivale a tener todos los slots listos.
    await page.evaluate(() => {
      const ds = addDays(todayStr(), 1);
      mealState(ds, buildDay(ds).meals[0].id).ovr = { name: "Mi desayuno", kcal: 400, p: 25, c: 45, f: 13 };
      setView("hoy");
    });
    await expect(meals).toContainText("1 comida definida");
    await expect(meals).not.toContainText("3 comidas");
    await page.evaluate(() => {
      const ds = addDays(todayStr(), 1);
      buildDay(ds).meals.forEach(m => { mealState(ds, m.id).ovr = { name: "Mi " + m.slot, kcal: 400, p: 25, c: 45, f: 13 }; });
      render();
    });
    await expect(meals).toContainText("3 comidas definidas");
    expect(preparations).toEqual([]);
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  test("con comidas y entreno hechos, Hoy resume el día en una línea y muestra lo que toca mañana", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);

    await gotoApp(page);
    await page.getByRole("button", { name: /Preparar mi día/i }).first().click();
    const overlay = page.locator("#overlay");
    await expect(overlay).toContainText(/Total del día/i, { timeout: 15_000 });
    await overlay.getByRole("button", { name: /Aplicar al día/i }).click();

    // Cierra el día por los mismos caminos que los botones: todas las comidas y el entreno.
    await page.evaluate(() => {
      const ds = todayStr();
      buildDay(ds).meals.forEach((m) => { if (!mealState(ds, m.id).done) toggleMeal(ds, m.id); });
      dayState(ds).workoutDone = true;
    });
    await page.locator("#tabs").getByText("Hoy").click();

    const card = page.locator(".agenda-state.done");
    await expect(card).toContainText("Todo listo por hoy");
    await expect(card.locator(".agenda-sub")).toContainText(/3\/3 comidas registradas · \d+ kcal · (entreno completado|descanso planificado)/);
    // El consumo detallado de hoy ya no ocupa la pantalla.
    await expect(page.locator(".mini-macro-dash")).toHaveCount(0);

    // Mañana en resumen: qué entreno toca y si las comidas están listas.
    const tomorrow = await page.evaluate(() => addDays(todayStr(), 1));
    const tomorrowLabel = await page.evaluate((ds) => prettyDate(ds), tomorrow);
    await expect(card.locator(".agenda-next-head")).toHaveText(`Mañana · ${tomorrowLabel}`);
    await expect(card.locator(".agenda-next .agenda-item")).toHaveCount(2);
    await expect(card.locator(".agenda-next")).toContainText("Puedes registrarlas mañana");

    // "Ver mañana" abre el día siguiente.
    await card.getByRole("button", { name: "Ver mañana" }).click();
    await expect.poll(() => page.evaluate(() => ({ current, view }))).toEqual({ current: tomorrow, view: "nutricion" });

    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
});
