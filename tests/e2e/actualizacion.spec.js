// REQ-213: una versión nueva se aplica sola al volver de segundo plano, nunca
// a mitad de un entreno, y sin botón flotante sobre el contenido.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, gotoApp, autoDismissNudges, collectConsoleErrors } from "./helpers.js";

async function backFromBackground(page) {
  await page.evaluate(() => {
    const set = (state) => Object.defineProperty(document, "visibilityState", { value: state, configurable: true });
    set("hidden"); document.dispatchEvent(new Event("visibilitychange"));
    appHiddenAt = Date.now() - 60_000; // estuvo un minuto fuera
    set("visible"); document.dispatchEvent(new Event("visibilitychange"));
  });
}

test("con una versión nueva, se recarga sola al volver y avisa 'App actualizada'", async ({ page, context }) => {
  await installMocks(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const errors = collectConsoleErrors(page);
  await gotoApp(page);
  await expect(page.locator("#update-badge")).toHaveCount(0);
  await page.evaluate(() => { window.__antes = true; notifyAppUpdateAvailable(); });
  await Promise.all([page.waitForEvent("load"), backFromBackground(page)]);
  await expect(page.locator("#toast")).toContainText("App actualizada");
  expect(await page.evaluate(() => window.__antes)).toBeUndefined();
  expect(errors).toEqual([]);
});

test("a mitad de un entreno no se recarga", async ({ page, context }) => {
  await installMocks(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  await gotoApp(page);
  await page.locator("#tabs").getByText("Entreno").click();
  await page.getByRole("button", { name: "Iniciar sesión guiada" }).last().click();
  await page.evaluate(() => { window.__antes = true; notifyAppUpdateAvailable(); });
  await backFromBackground(page);
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.__antes)).toBe(true);
});

test("si no hubo momento seguro en 24 h, Perfil → Cuenta lo ofrece", async ({ page, context }) => {
  await installMocks(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  await gotoApp(page);
  await page.evaluate(() => { notifyAppUpdateAvailable(); localStorage.setItem("evolv_update_pending_since", String(Date.now() - 25 * 3600 * 1000)); });
  await page.locator("#tabs").getByText("Perfil").click();
  await page.keyboard.press("Escape");
  await page.locator("details.pf-accordion > summary", { hasText: "Cuenta" }).click();
  await expect(page.locator("#app")).toContainText("Hay una versión nueva de la app");
});
