// REQ-191: nombres accesibles, landmarks y estado de la FAQ.
import { test, expect } from "@playwright/test";
import {
  installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges, profileFixture,
} from "./helpers.js";

test.describe("Accesibilidad", () => {
  test("cada tab tiene un único <main> y un h1", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);

    for (const tab of ["Hoy", "Nutrición", "Entreno", "Progreso", "Perfil"]) {
      await page.locator("#tabs").getByText(tab).click();
      await expect(page.locator("main")).toHaveCount(1);
      await expect(page.locator("#app h1"), `h1 en ${tab}`).toHaveCount(1);
    }
    // El campo del coach se anuncia con nombre, no solo con placeholder
    await page.locator("#tabs").getByText("Hoy").click();
    await expect(page.getByRole("textbox", { name: "Pregunta a tu coach" })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("los campos del onboarding están asociados a su etiqueta", async ({ page, context }) => {
    await installMocks(context, { tables: { profiles: { row: profileFixture({}) } } });
    await seedLoggedInUser(page);
    await gotoApp(page);

    await expect(page.getByLabel("Sexo para la fórmula")).toHaveAttribute("id", "ob_sex");
    await expect(page.getByLabel("Nivel de actividad habitual")).toHaveAttribute("id", "ob_activity");
    await expect(page.getByLabel("Edad")).toHaveAttribute("id", "ob_age");
    const progress = page.getByRole("progressbar");
    await expect(progress).toHaveAttribute("aria-valuenow", "1");
    await expect(progress).toHaveAttribute("aria-valuemax", "4");
  });

  test("la FAQ de la portada usa <details> nativo (estado anunciado por el navegador)", async ({ page, context }) => {
    await installMocks(context);
    await gotoApp(page);
    const item = page.locator(".l-faq-item").first();
    await expect(item).toHaveJSProperty("tagName", "DETAILS");
    await expect(item).not.toHaveAttribute("open", "");
    await item.locator("summary").click();
    await expect(item).toHaveAttribute("open", "");
    await item.locator("summary").click();
    await expect(item).not.toHaveAttribute("open", "");
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveCount(1);
  });
});
