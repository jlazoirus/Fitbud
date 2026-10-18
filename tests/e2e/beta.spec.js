// REQ-201: la página de postulación es el programa de fundadores y al enviar
// muestra una confirmación para la persona, no la clasificación interna.
import { test, expect } from "@playwright/test";
import { installMocks, collectConsoleErrors } from "./helpers.js";

test("REQ-201: postular muestra la confirmación sin segmento ni prioridad", async ({ page, context }) => {
  await installMocks(context);
  let sent = null;
  await context.route("**/api/beta-recruitment", (route) => {
    sent = JSON.parse(route.request().postData() || "{}");
    route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, submission: { id: 42, segment: "B - Principiante guiado", priority: "Baja", betaEligible: false } }),
    });
  });
  const errors = collectConsoleErrors(page);
  await page.goto("/beta-reclutamiento.html?source=portada");

  await expect(page.locator("h1")).toContainText("Úsalo gratis tres meses");
  await expect(page.getByRole("heading", { name: "Cómo funciona" })).toBeVisible();
  await page.getByRole("link", { name: "Postular a la beta" }).click();
  await expect(page).toHaveURL(/#postular$/);

  await page.getByLabel("Nombre").fill("Ana Prueba");
  await page.getByLabel("WhatsApp").fill("+51 999 111 222");
  await page.getByLabel("Edad").selectOption("25-34");
  await page.getByLabel("País / ciudad").fill("Santiago, Chile");
  await page.getByLabel("¿Qué te describe mejor?").selectOption("returning");
  await page.getByLabel("Objetivo principal").selectOption({ label: "Ganar músculo" });
  await page.locator('input[name="recentAttempt"][value="yes"]').check();
  await page.locator('input[name="pains"]').first().check();
  await page.getByLabel("Cuéntanos la última vez que te pasó").fill("Dejé el gym cuando cambió mi horario.");
  await page.getByLabel("¿Cuánto inviertes hoy en resolver esto?").selectOption("time");
  await page.getByLabel("Disponibilidad").selectOption({ label: "Llamada de 15-20 min y beta de 3 meses" });
  await page.locator('input[name="health"][value="clear"]').check();
  await page.getByRole("button", { name: "Enviar postulación" }).click();

  const result = page.locator("#result");
  await expect(result).toContainText("Recibimos tu postulación");
  await expect(result).toContainText("Número de postulación: 42");
  await expect(result).not.toContainText(/Prioridad|Baja|Principiante/);
  expect(sent).toMatchObject({ goal: "Ganar musculo", availability: "interview_beta", source: "portada" });
  expect(errors).toEqual([]);
});
