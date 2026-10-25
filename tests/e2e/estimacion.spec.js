// REQ-265: "Estimar macros" solo aplica una estimación real de la comida descrita.
// Una plantilla genérica, un valor negativo o la ausencia de resultado compatible
// se informan como fallo y los campos del formulario no cambian.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges } from "./helpers.js";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDK+mmyAAAAABJRU5ErkJggg==",
  "base64",
);
const TEMPLATE = { kcal: 500, proteina_g: 25, carbohidratos_g: 55, grasa_g: 20, nota: "Estimación de referencia. Ajusta la porción si conoces la receta." };

async function openFreeEditor(page, context, replies) {
  await installMocks(context);
  const calls = [];
  await context.route("**/api/claude", (route) => {
    calls.push(JSON.parse(route.request().postData() || "{}"));
    const r = replies[Math.min(calls.length - 1, replies.length - 1)];
    return route.fulfill({ status: r.status || 200, contentType: "application/json", body: JSON.stringify(r.body) });
  });
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const errors = collectConsoleErrors(page);
  await gotoApp(page);
  await page.locator("#tabs").getByText("Nutrición").click();
  await page.getByRole("button", { name: /Agregar comida \/ snack/i }).first().click();
  const overlay = page.locator("#overlay");
  return { overlay, calls, errors };
}

test("sin estimación compatible: avisa, conserva los valores y no envía plantilla", async ({ page, context }) => {
  const { overlay, calls, errors } = await openFreeEditor(page, context, [
    { status: 422, body: { error: "No hay una estimacion compatible para esta comida.", code: "no_compatible_result" } },
  ]);
  await overlay.locator("#f_name").fill("Un vaso de agua");
  await overlay.locator("#f_kcal").fill("0");
  await overlay.getByRole("button", { name: /Estimar macros/ }).click();
  await expect(overlay.locator("#aiOut")).toContainText("No pudimos estimar esta comida ahora. Tus valores no cambiaron");
  await expect(overlay.locator("#aiOut .estimate-applied")).toHaveCount(0);
  await expect(overlay.locator("#aiOut")).not.toContainText("✓");
  await expect(overlay.locator("#f_kcal")).toHaveValue("0");
  await expect(overlay.locator("#f_p")).toHaveValue("");
  expect(calls[0].quota.action).toBe("meal_estimate");
  expect(calls[0].quota.fallbackText).toBe("");
  expect(errors.filter((e) => !/status of 422/.test(e))).toEqual([]);
});

test("una plantilla reutilizada nunca se aplica como estimación", async ({ page, context }) => {
  const { overlay } = await openFreeEditor(page, context, [
    { body: { text: JSON.stringify(TEMPLATE), reused: true, origin: "template" } },
  ]);
  await overlay.locator("#f_name").fill("Un vaso de agua");
  await overlay.getByRole("button", { name: /Estimar macros/ }).click();
  await expect(overlay.locator("#aiOut")).toContainText("Tus valores no cambiaron");
  await expect(overlay.locator("#f_kcal")).toHaveValue("");
  await expect(overlay.locator("#aiOut")).not.toContainText("500");
});

test("valores negativos de una respuesta no se aplican", async ({ page, context }) => {
  const { overlay } = await openFreeEditor(page, context, [
    { body: { text: JSON.stringify({ nombre: "Agua", kcal: -10, proteina_g: 0, carbohidratos_g: 0, grasa_g: 0, preguntas: [] }) } },
  ]);
  await overlay.locator("#f_name").fill("Un vaso de agua");
  await overlay.getByRole("button", { name: /Estimar macros/ }).click();
  await expect(overlay.locator("#aiOut")).toContainText("Tus valores no cambiaron");
  await expect(overlay.locator("#f_kcal")).toHaveValue("");
});

test("una generación previa compatible (misma descripción) sí se aplica", async ({ page, context }) => {
  const reply = { nombre: "Ceviche", kcal: 380, proteina_g: 40, carbohidratos_g: 30, grasa_g: 8, nota: "Plato mediano.", preguntas: [] };
  const { overlay, calls } = await openFreeEditor(page, context, [
    { body: { text: JSON.stringify(reply), reused: true, origin: "reused" } },
  ]);
  await overlay.locator("#f_name").fill("Ceviche de pescado");
  await overlay.getByRole("button", { name: /Estimar macros/ }).click();
  await expect(overlay.locator("#aiOut .estimate-applied")).toHaveText("Aplicado: 380 kcal · P 40 g · C 30 g · G 8 g");
  await expect(overlay.locator("#f_kcal")).toHaveValue("380");
  expect(calls[0].quota.fallbackText).toBe("");
});

test("foto sin estimación compatible: avisa y conserva los campos", async ({ page, context }) => {
  const { overlay, calls } = await openFreeEditor(page, context, [
    { status: 422, body: { error: "No hay una estimacion compatible para esta comida.", code: "no_compatible_result" } },
  ]);
  await overlay.locator("#f_name").fill("Lomo saltado");
  await overlay.locator("#f_kcal").fill("700");
  await overlay.locator("#f_photo").setInputFiles({ name: "plato.png", mimeType: "image/png", buffer: PNG });
  await expect(overlay.locator("#aiOut")).toContainText("No pudimos estimar esta foto ahora. Tus valores no cambiaron");
  await expect(overlay.locator("#f_kcal")).toHaveValue("700");
  await expect(overlay.locator("#f_name")).toHaveValue("Lomo saltado");
  expect(calls[0].quota.fallbackText).toBe("");
  // Guardar después del fallo registra solo lo que el usuario escribió (REQ-266: solo calorías).
  await overlay.getByLabel("Solo conozco las calorías").check();
  await overlay.getByRole("button", { name: "Guardar" }).click();
  await expect(page.locator("#app")).toContainText("Lomo saltado");
});
