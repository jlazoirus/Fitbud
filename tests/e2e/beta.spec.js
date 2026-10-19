// REQ-201/REQ-217: la página de postulación es el programa de fundadores y al
// enviar muestra una confirmación para la persona, no la clasificación interna.
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
  // REQ-223: la beta no se limita a países en ningún texto
  expect(await page.locator("body").innerText()).not.toMatch(/Perú|Chile|México/);
  expect(await page.locator('meta[name="description"]').getAttribute("content")).not.toMatch(/Perú|Chile|México/);
  await expect(page.getByRole("heading", { name: "Cómo funciona" })).toBeVisible();
  await page.getByRole("link", { name: "Postular a la beta" }).click();
  await expect(page).toHaveURL(/#postular$/);

  await page.getByLabel("Nombre").fill("Ana Prueba");
  await page.getByLabel("Correo").fill("Ana@Correo.test");
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

  // REQ-217: el formulario se reemplaza por una confirmación amable, sin clasificación interna
  const done = page.locator("#done");
  await expect(done).toBeVisible();
  await expect(done.getByRole("heading")).toHaveText("¡Gracias, Ana! Ya tenemos tu postulación.");
  await expect(done).toContainText("ana@correo.test"); // REQ-225: la invitación llega por correo
  await expect(page.locator("#recruitForm")).toBeHidden();
  await expect(page.locator("body")).not.toContainText(/Prioridad|Principiante|Número de postulación/);
  await expect(done).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem("evolv_beta_draft"))).toBeNull();
  expect(sent).toMatchObject({ email: "ana@correo.test", goal: "Ganar musculo", availability: "interview_beta", source: "portada" });
  expect(errors).toEqual([]);
});

test("REQ-217: sin fricciones no se envía, el límite de 3 respeta la elegida y el borrador sobrevive a recargar", async ({ page, context }) => {
  await installMocks(context);
  let posts = 0;
  await context.route("**/api/beta-recruitment", (route) => { posts += 1; route.fulfill({ status: 500, body: "{}" }); });
  await page.goto("/beta-reclutamiento.html");
  await page.getByLabel("Nombre").fill("Ana Prueba");
  await page.getByLabel("Cuéntanos la última vez que te pasó").fill("Dejé el gym cuando cambió mi horario.");
  await page.getByRole("button", { name: "Enviar postulación" }).click();
  expect(posts).toBe(0);

  const pains = page.locator('input[name="pains"]');
  for (const i of [0, 1, 6]) await pains.nth(i).check();
  await expect(page.locator("#painCount")).toHaveText("3 de 3 elegidas.");
  await pains.nth(2).click();
  await expect(pains.nth(2)).not.toBeChecked();
  await expect(pains.nth(6)).toBeChecked();
  await expect(page.locator("#painCount")).toHaveText("Ya elegiste 3. Desmarca una para cambiarla.");

  await page.reload();
  await expect(page.getByLabel("Nombre")).toHaveValue("Ana Prueba");
  await expect(pains.nth(6)).toBeChecked();
});

test("REQ-217: un error de la API se explica y lleva al campo", async ({ page, context }) => {
  await installMocks(context);
  await context.route("**/api/beta-recruitment", (route) => route.fulfill({
    status: 400, contentType: "application/json",
    body: JSON.stringify({ error: "Revisa tu número de WhatsApp: incluye el código de tu país (empieza con +)." }),
  }));
  await page.goto("/beta-reclutamiento.html");
  await page.getByLabel("Nombre").fill("Ana");
  await page.getByLabel("Correo").fill("ana@correo.test");
  await page.getByLabel("WhatsApp").fill("12345678");
  await page.getByLabel("Edad").selectOption("25-34");
  await page.getByLabel("País / ciudad").fill("Lima");
  await page.getByLabel("¿Qué te describe mejor?").selectOption("beginner");
  await page.getByLabel("Objetivo principal").selectOption({ label: "Bajar grasa" });
  await page.locator('input[name="recentAttempt"][value="no"]').check();
  await page.locator('input[name="pains"]').first().check();
  await page.getByLabel("Cuéntanos la última vez que te pasó").fill("Nunca supe por dónde empezar con la comida.");
  await page.getByLabel("¿Cuánto inviertes hoy en resolver esto?").selectOption("none");
  await page.getByLabel("Disponibilidad").selectOption("later");
  await page.locator('input[name="health"][value="clear"]').check();
  await page.getByRole("button", { name: "Enviar postulación" }).click();
  await expect(page.getByRole("alert")).toContainText("Revisa tu número de WhatsApp");
  await expect(page.getByLabel("WhatsApp")).toBeFocused();
  await expect(page.locator("#recruitForm")).toBeVisible();
});
