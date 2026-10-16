// REQ-193: la UI habla el idioma del usuario, no el del sistema.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, gotoApp, autoDismissNudges } from "./helpers.js";

test("REQ-193: Nutrición no muestra vocabulario interno y las fechas no capitalizan el mes", async ({ page, context }) => {
  await installMocks(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  await gotoApp(page);

  await page.locator("#tabs").getByText("Nutrición").click();
  const app = page.locator("#app");
  await expect(app).toContainText("Sin asignar");
  const text = await app.innerText();
  expect(text).not.toMatch(/\bslots?\b/i);
  expect(text).not.toMatch(/base de datos/i);
  expect(text).not.toMatch(/o elige\b/);
  // El h1 de la fecha se ve como se escribe: "Viernes, 16 oct", no "16 Oct"
  const visible = await page.locator("#app h1.date").innerText();
  expect(visible).toMatch(/^[A-ZÁÉÍÓÚ][a-záéíóú]+, \d{1,2} [a-z]{3}\b/);
});

test("REQ-193: la página de beta usa tildes y signos de apertura", async ({ page, context }) => {
  await installMocks(context);
  await page.goto("/beta-reclutamiento.html");
  const body = page.locator("body");
  await expect(body).toContainText("¿Qué te describe mejor?");
  await expect(body).toContainText("País / ciudad");
  await expect(body).toContainText("Cuéntanos la última vez que te pasó");
});
