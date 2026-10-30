// REQ-307: soporte por WhatsApp (línea de EE. UU. del equipo) en la web
// pública y dentro de la app. Sin mensajes automáticos: cada persona abre
// WhatsApp y escribe voluntariamente.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, gotoApp, autoDismissNudges } from "./helpers.js";

const WA = "https://wa.me/18302629397?text=Hola%2C+tengo+una+duda+sobre+Evolv";

test("REQ-307: la portada tiene widget flotante y enlace de pie a WhatsApp", async ({ page, context }) => {
  await installMocks(context);
  await page.goto("/index.html");
  const fab = page.locator("a.wa-fab");
  await expect(fab).toBeVisible();
  await expect(fab).toHaveAttribute("href", WA);
  await expect(fab).toHaveAttribute("target", "_blank");
  await expect(fab).toHaveAttribute("aria-label", "Escríbenos por WhatsApp");
  await expect(page.locator(".l-footer a", { hasText: "Escríbenos por WhatsApp" })).toHaveAttribute("href", WA);
});

test("REQ-307: la página beta ofrece escribir por WhatsApp sin tapar el formulario", async ({ page, context }) => {
  await installMocks(context);
  await page.goto("/beta-reclutamiento.html");
  const btn = page.locator(".wa-help a.wa-btn");
  await expect(btn).toBeVisible();
  await expect(btn).toHaveAttribute("href", WA);
  await expect(page.locator("a.wa-fab")).toHaveCount(0); // sin flotante: el formulario manda
});

test("REQ-307: Perfil tiene Ayuda y soporte con el botón de WhatsApp", async ({ page, context }) => {
  await installMocks(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  await gotoApp(page);
  await page.evaluate(() => setView("perfil"));
  const sec = page.locator("#pfSecAyuda");
  await sec.locator("> summary").click();
  await expect(sec.getByRole("link", { name: "Escríbenos por WhatsApp" })).toHaveAttribute("href", WA);
});

test("REQ-307: el último paso del onboarding avisa que hay soporte", async ({ page, context }) => {
  await installMocks(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  await gotoApp(page);
  await page.evaluate(() => { onboardingActive = true; onboardingStep = 4; onboardingDraft = onboardingDefaults(); renderOnboarding(); });
  await expect(page.getByText("Estamos contigo")).toBeVisible();
  await expect(page.getByRole("link", { name: "Escríbenos por WhatsApp" })).toHaveAttribute("href", WA);
});
