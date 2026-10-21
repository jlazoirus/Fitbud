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

test.describe("Home — agenda (REQ-247)", () => {
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
