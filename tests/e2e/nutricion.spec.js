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
    await expect(overlay).toContainText("Bowl de pollo con arroz al olivo");
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
    await expect(app).toContainText("Bowl de pollo con arroz al olivo");

    // Y el día viajó a day_log (persistencia por usuario)
    await expect
      .poll(() => calls.filter((c) => c.table === "day_log" && c.method === "POST").length, { timeout: 10_000 })
      .toBeGreaterThan(0);

    // En Nutrición las comidas aparecen con sus slots
    await page.locator("#tabs").getByText("Nutrición").click();
    await expect(app).toContainText("Bowl de pollo con arroz al olivo");

    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
});
