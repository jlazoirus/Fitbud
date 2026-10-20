// REQ-172: estimar los macros de una comida con una foto, con preguntas de aclaración.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges, todayYmd, USER_ID } from "./helpers.js";

// PNG de 2×2 px; la app lo convierte a JPEG antes de enviarlo.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDK+mmyAAAAABJRU5ErkJggg==",
  "base64",
);

test("foto → estimación con pregunta → respuesta → estimación final", async ({ page, context }) => {
  await installMocks(context);
  const coachCalls = [];
  await context.route("**/api/claude", (route) => {
    const payload = JSON.parse(route.request().postData() || "{}");
    coachCalls.push(payload);
    const first = payload.quota && payload.quota.partKey === "photo-1";
    const reply = first
      ? { nombre: "Lomo con papas fritas", kcal: 820, proteina_g: 42, carbohidratos_g: 70, grasa_g: 40, nota: "Supuse una porción mediana.", preguntas: ["¿Las papas eran fritas o al horno?"] }
      : { nombre: "Lomo con papas al horno", kcal: 640, proteina_g: 42, carbohidratos_g: 66, grasa_g: 22, nota: "Papas al horno: menos grasa.", preguntas: [] };
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ text: JSON.stringify(reply) }) });
  });
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const errors = collectConsoleErrors(page);
  await gotoApp(page);

  await page.locator("#tabs").getByText("Nutrición").click();
  await page.getByRole("button", { name: /Agregar comida \/ snack/i }).first().click();
  const overlay = page.locator("#overlay");
  await expect(overlay.getByRole("button", { name: /Estimar con foto/i })).toBeVisible();
  // REQ-207: sin `capture`, el móvil deja elegir entre cámara y galería.
  await expect(overlay.locator("#f_photo")).not.toHaveAttribute("capture", /.*/);
  await expect(overlay.locator("#f_photo")).toHaveAttribute("accept", "image/*");

  await overlay.locator("#f_photo").setInputFiles({ name: "plato.png", mimeType: "image/png", buffer: PNG });
  await expect(overlay).toContainText("Supuse una porción mediana.");
  await expect(overlay.locator("#f_kcal")).toHaveValue("820");
  await expect(overlay.locator("#f_name")).toHaveValue("Lomo con papas fritas");
  await expect(overlay.locator("#f_photo_preview")).toBeVisible();

  const first = coachCalls[0];
  expect(first.quota.action).toBe("meal_estimate");
  expect(first.image.mediaType).toBe("image/jpeg");
  expect(first.image.data.length).toBeGreaterThan(100);

  await overlay.getByLabel("¿Las papas eran fritas o al horno?").fill("al horno");
  await overlay.getByRole("button", { name: "Responder y recalcular" }).click();
  await expect(overlay).toContainText("Papas al horno: menos grasa.");
  await expect(overlay.locator("#f_kcal")).toHaveValue("640");
  await expect(overlay.locator(".photo-questions")).toHaveCount(0);
  await expect(overlay.locator("#f_name")).toHaveValue("Lomo con papas al horno");

  const second = coachCalls[1];
  expect(second.userText).toContain("¿Las papas eran fritas o al horno? → al horno");
  expect(second.image.data).toBe(first.image.data);
  expect(second.quota.contextKey).not.toBe(first.quota.contextKey);

  await overlay.getByRole("button", { name: "Guardar" }).click();
  await expect(page.locator("#app")).toContainText("Lomo con papas al horno");
  expect(errors).toEqual([]);
});

// REQ-228: si el análisis falla, el mensaje dice qué pasó y se puede reintentar con la misma foto.
test("foto → fallo con motivo claro → reintentar con la misma foto", async ({ page, context }) => {
  await installMocks(context);
  const responses = [
    { status: 503, body: { error: "Overloaded" } },
    { status: 500, body: { error: "fallo raro" } },
    { status: 200, body: { text: JSON.stringify({ nombre: "Espagueti con salsa", kcal: 650, proteina_g: 20, carbohidratos_g: 85, grasa_g: 24, nota: "Porción mediana.", preguntas: [] }) } },
  ];
  const coachCalls = [];
  await context.route("**/api/claude", (route) => {
    coachCalls.push(JSON.parse(route.request().postData() || "{}"));
    const r = responses[Math.min(coachCalls.length - 1, responses.length - 1)];
    return route.fulfill({ status: r.status, contentType: "application/json", body: JSON.stringify(r.body) });
  });
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  await gotoApp(page);

  await page.locator("#tabs").getByText("Nutrición").click();
  await page.getByRole("button", { name: /Agregar comida \/ snack/i }).first().click();
  const overlay = page.locator("#overlay");
  await overlay.locator("#f_photo").setInputFiles({ name: "plato.png", mimeType: "image/png", buffer: PNG });

  await expect(overlay.locator("#aiOut")).toContainText("Ahora mismo hay mucha demanda");
  await overlay.getByRole("button", { name: "Reintentar" }).click();
  // Un motivo no reconocido muestra su código para poder diagnosticarlo.
  await expect(overlay.locator("#aiOut")).toContainText("(código 500)");
  await overlay.getByRole("button", { name: "Reintentar" }).click();
  await expect(overlay.locator("#f_kcal")).toHaveValue("650");
  await expect(overlay.locator("#aiOut")).toContainText("Porción mediana.");

  // Los reintentos usan la misma foto y no gastan rondas de preguntas.
  expect(coachCalls.every((c) => c.image.data === coachCalls[0].image.data)).toBe(true);
  expect(coachCalls.map((c) => c.quota.partKey)).toEqual(["photo-1", "photo-1", "photo-1"]);
});

// REQ-229: al editar una comida del plan, el nombre planeado no es lo que comió:
// no se envía como descripción y la foto manda (nombre y macros salen de la foto).
test("comida del plan + foto de otro plato → estima lo que se ve, no lo planeado", async ({ page, context }) => {
  const planned = { done: false, ovr: { name: "Tacos de frijol negro y queso fresco", kcal: 520, p: 18, c: 62, f: 20 } };
  await installMocks(context, { tables: { day_log: { rows: [{
    user_id: USER_ID, log_date: todayYmd(), plan_version_id: null, updated_at: new Date().toISOString(),
    state: { meals: { almuerzo: planned }, extras: [], workoutDone: false },
  }] } } });
  const coachCalls = [];
  await context.route("**/api/claude", (route) => {
    coachCalls.push(JSON.parse(route.request().postData() || "{}"));
    const reply = { nombre: "Espagueti Alfredo", kcal: 780, proteina_g: 24, carbohidratos_g: 90, grasa_g: 34, nota: "Porción grande con salsa cremosa.", preguntas: [] };
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ text: JSON.stringify(reply) }) });
  });
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const errors = collectConsoleErrors(page);
  await gotoApp(page);

  await page.evaluate(() => openEditor("meal", todayStr(), "almuerzo"));
  const overlay = page.locator("#overlay");
  await expect(overlay.locator("#f_name")).toHaveValue("Tacos de frijol negro y queso fresco");
  await overlay.locator("#f_photo").setInputFiles({ name: "pasta.png", mimeType: "image/png", buffer: PNG });

  await expect(overlay.locator("#f_kcal")).toHaveValue("780");
  // REQ-230: se ve qué se aplicó y los campos cambiados se resaltan.
  await expect(overlay.locator("#aiOut .estimate-applied")).toHaveText("Aplicado: 780 kcal · P 24 g · C 90 g · G 34 g");
  await expect(overlay.locator("#f_kcal")).toHaveClass(/field-updated/);
  // El nombre planeado (sin tocar) se reemplaza por lo que se ve.
  await expect(overlay.locator("#f_name")).toHaveValue("Espagueti Alfredo");
  expect(coachCalls[0].userText).not.toContain("Tacos");
  expect(coachCalls[0].userText).toContain("Identifica el plato por lo que se ve en la foto");

  // Lo que escribe el usuario sí se envía, pero la foto manda si no coincide.
  await overlay.locator("#f_name").fill("Pasta alfredo con parmesano");
  await overlay.locator("#f_photo").setInputFiles({ name: "pasta2.png", mimeType: "image/png", buffer: Buffer.concat([PNG, Buffer.from([0])]) });
  await expect.poll(() => coachCalls.length).toBe(2);
  expect(coachCalls[1].userText).toContain('El usuario la describe así: "Pasta alfredo con parmesano"');
  expect(coachCalls[1].userText).toContain("manda la foto");
  await expect(overlay.locator("#f_name")).toHaveValue("Pasta alfredo con parmesano");
  expect(errors).toEqual([]);
});
