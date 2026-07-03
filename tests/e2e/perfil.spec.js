// Journey: Perfil en acordeon real (REQ-105).
// Verifica que las secciones no se desmontan al alternar y que el guardado
// global existente sigue apareciendo al editar preferencias.
import { test, expect } from "@playwright/test";
import {
  installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges,
} from "./helpers.js";

async function detailsOpen(locator) {
  return locator.evaluate((el) => Boolean(el.open));
}

test.describe("Perfil", () => {
  test("secciones colapsables conservan campos y abren una a la vez", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);

    await gotoApp(page);
    await page.locator("#tabs").getByText("Perfil").click();

    await expect(page.locator(".pf-nav")).toHaveCount(0);
    const sections = page.locator("details.pf-accordion");
    await expect(sections).toHaveCount(8);
    expect(await sections.evaluateAll((items) => items.filter((item) => item.open).length)).toBe(0);

    const comidas = page.locator("#pfSecComidas");
    const entreno = page.locator("#pfSecEntreno");
    await comidas.locator("> summary").click();
    expect(await detailsOpen(comidas)).toBe(true);
    expect(await comidas.evaluate((el) => el.scrollHeight)).toBeLessThanOrEqual(1500);

    await page.fill("#pf_preferred_ingredients", "avena, lentejas");
    await expect(page.locator("#profileSaveFloat")).toBeVisible();

    await entreno.locator("> summary").click();
    expect(await detailsOpen(entreno)).toBe(true);
    expect(await detailsOpen(comidas)).toBe(false);
    expect(await entreno.evaluate((el) => el.scrollHeight)).toBeLessThanOrEqual(1500);

    await comidas.locator("> summary").click();
    expect(await detailsOpen(comidas)).toBe(true);
    expect(await detailsOpen(entreno)).toBe(false);
    await expect(page.locator("#pf_preferred_ingredients")).toHaveValue("avena, lentejas");

    await page.setViewportSize({ width: 1024, height: 768 });
    const cuenta = page.locator("#pfSecCuenta");
    await cuenta.locator("> summary").click();
    expect(await detailsOpen(cuenta)).toBe(true);
    expect(await detailsOpen(comidas)).toBe(false);
    expect(await sections.evaluateAll((items) => items.filter((item) => item.open).length)).toBe(1);

    expect(errors, `Errores de consola en Perfil:\n${errors.join("\n")}`).toEqual([]);
  });
});
