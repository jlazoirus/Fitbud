// Journey (b): objetivos del día en Nutrición + preparar el día y aplicarlo.
// El "coach" está mockeado en helpers.js: responde comidas construidas con el
// catálogo fixture que cumplen exactamente las metas del perfil (2200/160/220/65).
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges } from "./helpers.js";

test.describe("Nutrición", () => {
  test("los objetivos del día reflejan el perfil", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);

    await gotoApp(page);
    await page.locator("#tabs").getByText("Nutrición").click();

    const app = page.locator("#app");
    // Metas del perfil visibles: kcal y las tres pistas de macros
    await expect(app).toContainText("2200");
    await expect(app).toContainText(/160\s*g?/);
    await expect(app).toContainText(/220\s*g?/);
    await expect(app).toContainText(/65\s*g?/);

    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  test("preparar mi día genera comidas que cumplen las metas y se aplican", async ({ page, context }) => {
    const { calls } = await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);

    await gotoApp(page);

    // El día empieza sin plan: CTA visible
    const preparar = page.getByRole("button", { name: /Preparar mi día/i });
    await expect(preparar.first()).toBeVisible();
    await preparar.first().click();

    // Modal de revisión: totales vs meta y comidas con ingredientes reales
    const overlay = page.locator("#overlay");
    await expect(overlay).toContainText(/Total del día/i, { timeout: 15_000 });
    await expect(overlay).toContainText("meta 2200/160/220/65");
    await expect(overlay).toContainText("Bowl proteico de la mañana");
    await expect(overlay).toContainText("Pechuga de pollo");

    // El total recalculado del catálogo debe cumplir la meta (±15 % kcal, ≥85 % prot)
    const totalLine = await overlay.locator("text=/Total del día/").innerText();
    const [, kcal, prot] = totalLine.match(/([\d.]+)\s*kcal · P\s*([\d.]+)/) || [];
    expect(Math.abs(Number(kcal) - 2200) / 2200).toBeLessThan(0.15);
    expect(Number(prot)).toBeGreaterThanOrEqual(160 * 0.85);

    // Aplicar al día
    const aplicar = overlay.getByRole("button", { name: /Aplicar al día/i });
    await expect(aplicar).toBeEnabled();
    await aplicar.click();

    // La agenda del día ahora tiene las comidas generadas
    const app = page.locator("#app");
    await expect(app).toContainText("Bowl proteico de la mañana");

    // Y el día viajó a day_log (persistencia por usuario)
    await expect
      .poll(() => calls.filter((c) => c.table === "day_log" && c.method === "POST").length, { timeout: 10_000 })
      .toBeGreaterThan(0);

    // En Nutrición las comidas aparecen con sus slots
    await page.locator("#tabs").getByText("Nutrición").click();
    await expect(app).toContainText("Bowl proteico de la mañana");

    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  // REQ-233 (Jonathan): tocar la tarjeta de una comida abre el mismo menú que "···";
  // sus botones siguen haciendo lo suyo.
  test("tocar la tarjeta de una comida abre su menú de opciones", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);
    await page.getByRole("button", { name: /Preparar mi día/i }).first().click();
    const overlay = page.locator("#overlay");
    await overlay.getByRole("button", { name: /Aplicar al día/i }).click({ timeout: 15_000 });
    await page.locator("#tabs").getByText("Nutrición").click();
    const app = page.locator("#app");
    const card = app.locator(".meal.meal-tap").filter({ hasText: "Bowl proteico de la mañana" });

    // Tocar el nombre abre el menú de esa comida.
    await card.locator(".name").click();
    await expect(overlay).toContainText("Editar valores / comida personalizada");
    await expect(overlay.locator("h3")).toHaveText(await card.locator(".slot").innerText(), { ignoreCase: true });
    await overlay.getByRole("button", { name: "Cerrar", exact: true }).last().click();
    await expect(page.getByText("Editar valores / comida personalizada")).toHaveCount(0);

    // Marcarla como hecha no abre el menú.
    await card.locator("button.chk").click();
    await expect(card).toHaveClass(/done/);
    await expect(page.getByText("Editar valores / comida personalizada")).toHaveCount(0);

    // "···" sigue abriéndolo y tiene nombre accesible.
    await card.getByRole("button", { name: /^Más opciones de / }).click();
    await expect(overlay).toContainText("Editar valores / comida personalizada");
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  // REQ-256: editar una comida a mano sin marcarla hecha y "Volver a preparar
  // este día" no debe pisar la edición en silencio (antes solo se conservaban
  // las comidas marcadas como hechas).
  test("editar una comida sin marcarla hecha se conserva al volver a preparar el día", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);

    await page.getByRole("button", { name: /Preparar mi día/i }).first().click();
    const overlay = page.locator("#overlay");
    await overlay.getByRole("button", { name: /Aplicar al día/i }).click({ timeout: 15_000 });

    await page.locator("#tabs").getByText("Nutrición").click();
    const app = page.locator("#app");
    const card = app.locator(".meal.meal-tap").filter({ hasText: "Bowl proteico de la mañana" });

    // Editar el desayuno a mano, sin marcarlo como hecho.
    await card.getByRole("button", { name: /^Más opciones de / }).click();
    await overlay.getByRole("button", { name: /Editar valores \/ comida personalizada/ }).click();
    await page.locator("#f_name").fill("Dos huevos con pan");
    await page.locator("#f_kcal").fill("777");
    await overlay.getByRole("button", { name: "Guardar" }).click();
    await expect(app).toContainText("Dos huevos con pan");
    await expect(app).toContainText("777");

    // Volver a preparar el día: la edición manual sigue en pie.
    await page.getByRole("button", { name: "Más opciones de nutrición" }).click();
    await overlay.getByRole("button", { name: "Volver a preparar este día" }).click();
    await overlay.getByRole("button", { name: /Aplicar al día/i }).click({ timeout: 15_000 });

    await expect(app).toContainText("Dos huevos con pan");
    await expect(app).toContainText("777");
    await expect(app.locator(".meal.meal-tap", { hasText: "Bowl proteico de la mañana" })).toHaveCount(0);

    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
});
