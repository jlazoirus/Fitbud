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

  test("REQ-106: todos los inputs/selects/textareas tienen nombre accesible", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);

    await gotoApp(page);
    await page.locator("#tabs").getByText("Perfil").click();
    // REQ-105: los campos quedan montados en el DOM aunque su sección esté
    // colapsada, así que no hace falta abrir cada <details> para auditarlos.
    await expect(page.locator("#pfSecCuenta")).toBeAttached();

    const unnamed = await page.evaluate(() => {
      const app = document.querySelector("#app");
      const fields = Array.from(app.querySelectorAll("input, select, textarea"));
      return fields
        .filter((el) => el.type !== "hidden")
        .filter((el) => {
          if (el.getAttribute("aria-label") || el.getAttribute("aria-labelledby")) return false;
          if (el.closest("label")) return false;
          if (el.id && app.querySelector(`label[for="${el.id}"]`)) return false;
          return true;
        })
        .map((el) => el.id || el.outerHTML.slice(0, 80));
    });

    expect(unnamed, `Inputs de Perfil sin nombre accesible: ${unnamed.join(", ")}`).toEqual([]);
  });
});
