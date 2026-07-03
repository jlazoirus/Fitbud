// Journey: Perfil en acordeon real (REQ-105).
// Verifica que las secciones no se desmontan al alternar y que el guardado
// global existente sigue apareciendo al editar preferencias.
import { test, expect } from "@playwright/test";
import {
  installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges, completePrefs,
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
    // REQ-108: navegar con cambios sin guardar dispara un confirm(); esta
    // prueba se enfoca en persistencia del DOM, así que lo acepta siempre.
    page.on("dialog", (dialog) => dialog.accept());

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

  test("REQ-107: Privacidad, Suscripción, Recordatorios y Avisos quedan agrupados junto a Cuenta", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);

    await gotoApp(page);
    await page.locator("#tabs").getByText("Perfil").click();
    // REQ-108: activar el opt-in de recordatorios deja esa sección "dirty";
    // aceptar el confirm() para poder navegar a Avisos en esta prueba.
    page.on("dialog", (dialog) => dialog.accept());

    const ids = await page.locator("details.pf-accordion").evaluateAll((items) => items.map((el) => el.id));
    expect(ids).toEqual([
      "pfSecObjetivo", "pfSecComidas", "pfSecEntreno",
      "pfSecPrivacidad", "pfSecSuscripcion", "pfSecRecordatorios", "pfSecAvisos",
      "pfSecCuenta",
    ]);

    // Recordatorios: activar el opt-in sigue revelando las opciones (wiring de #notif_* intacto).
    const recordatorios = page.locator("#pfSecRecordatorios");
    await recordatorios.locator("> summary").click();
    await page.check("#notif_opt_in");
    await expect(page.locator("#notifOptions")).toBeVisible();

    // Avisos del dispositivo: renderPushSection() sigue pintando el estado de push sin errores.
    const avisos = page.locator("#pfSecAvisos");
    await avisos.locator("> summary").click();
    expect(await detailsOpen(avisos)).toBe(true);
    await expect(page.locator("#pushSection")).not.toBeEmpty();

    expect(errors, `Errores de consola en Perfil:\n${errors.join("\n")}`).toEqual([]);
  });

  test("REQ-108: aviso de cambios sin guardar al cambiar de sección, por vía de guardado", async ({ page, context }) => {
    // diet:["omnivoro"] porque este test sí completa un saveProfile() real
    // (validateFoodPreferences exige al menos un patrón de alimentación).
    const { calls } = await installMocks(context, { prefs: completePrefs({ diet: ["omnivoro"] }) });
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);

    await gotoApp(page);
    await page.locator("#tabs").getByText("Perfil").click();

    const entreno = page.locator("#pfSecEntreno");
    const comidas = page.locator("#pfSecComidas");
    const privacidad = page.locator("#pfSecPrivacidad");
    const recordatorios = page.locator("#pfSecRecordatorios");

    // 1) Editar Entreno, intentar navegar a Comidas sin guardar: se avisa y,
    // si se cancela, la sección editada permanece abierta con el valor intacto.
    await entreno.locator("> summary").click();
    await page.fill("#pf_minutes", "45");
    await expect(page.locator("#profileSaveFloat")).toBeVisible();

    let dialogSeen = null;
    page.once("dialog", (dialog) => { dialogSeen = dialog.message(); dialog.dismiss(); });
    await comidas.locator("> summary").click();
    expect(dialogSeen).toBeTruthy();
    expect(await detailsOpen(entreno)).toBe(true);
    expect(await detailsOpen(comidas)).toBe(false);
    await expect(page.locator("#pf_minutes")).toHaveValue("45");

    // 2) Reintentar y aceptar el aviso: se navega y el valor sigue ahí al volver.
    page.once("dialog", (dialog) => dialog.accept());
    await comidas.locator("> summary").click();
    expect(await detailsOpen(comidas)).toBe(true);
    await entreno.locator("> summary").click();
    await expect(page.locator("#pf_minutes")).toHaveValue("45");

    // 3) Guardar limpia el indicador global (saveProfile() vuelve a renderizar
    // Perfil, así que las secciones quedan colapsadas de nuevo).
    await page.click("#profileSaveFloat button");
    await expect(page.locator("#profileSaveFloat")).toBeHidden();

    // 4) Privacidad muestra su propio indicador "Cambios sin guardar" y lo
    // limpia al guardar con su botón propio (no el flotante global).
    await privacidad.locator("> summary").click();
    // El fixture ya trae progress_photos aceptado (consentsFixture()); destildar
    // es el cambio real que debe marcar la sección como "dirty".
    await page.uncheck("#pf_consent_photos");
    await expect(page.locator("#pfPrivacyDirtyHint")).toBeVisible();
    await page.getByRole("button", { name: "Guardar permiso de fotos" }).click();
    await expect
      .poll(() => calls.filter((c) => c.table === "user_consents" && c.method === "POST").length)
      .toBeGreaterThan(0);

    // 5) Recordatorios: mismo patrón, con su propio botón e indicador.
    await recordatorios.locator("> summary").click();
    await page.check("#notif_opt_in");
    await expect(page.locator("#pfNotifDirtyHint")).toBeVisible();
    await page.click("#notifSaveBtn");
    await expect(page.locator("#pfNotifDirtyHint")).toBeHidden();
    expect(calls.filter((c) => c.table === "notification_preferences" && c.method === "POST").length).toBeGreaterThan(0);

    expect(errors, `Errores de consola en Perfil:\n${errors.join("\n")}`).toEqual([]);
  });
});
