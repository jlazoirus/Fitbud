// REQ-172: estimar los macros de una comida con una foto, con preguntas de aclaración.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges } from "./helpers.js";

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
