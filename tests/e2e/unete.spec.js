// REQ-371: inscripción corta al club desde redes.
import { test, expect } from "@playwright/test";
import { installMocks, collectConsoleErrors } from "./helpers.js";

async function mockSignup(context, reply = { status: 200, body: { ok: true } }) {
  const sent = [];
  await context.route("**/api/unete", (route) => {
    sent.push(JSON.parse(route.request().postData() || "{}"));
    route.fulfill({ status: reply.status, contentType: "application/json", body: JSON.stringify(reply.body) });
  });
  return sent;
}

test("REQ-371: inscribirse guarda el origen y confirma", async ({ page, context }) => {
  await installMocks(context);
  const sent = await mockSignup(context);
  const errors = collectConsoleErrors(page);
  await page.goto("/unete/index.html?source=ig-bio-s1");

  await expect(page.locator("h1")).toContainText("Plan B.");
  const copy = await page.locator("body").innerText();
  expect(copy).not.toMatch(/\bIA\b|inteligencia artificial|S\/ ?\d/);

  await page.getByLabel("Nombre").fill("Ana Prueba");
  await page.getByLabel("Correo").fill("Ana@Correo.test");
  await page.getByRole("radio", { name: "Comer fuera" }).click();
  await page.locator("#consent").check();
  await page.getByRole("button", { name: "Inscribirme" }).click();

  await expect(page.getByRole("heading", { name: "Ya estás dentro, Ana." })).toBeVisible();
  await expect(page.locator("#doneLead")).toContainText("ana@correo.test");
  await expect(page.locator("#signupForm")).toBeHidden();
  await expect(page.getByRole("link", { name: "Postular ahora a la beta" })).toHaveAttribute("href", "/beta?source=unete");
  expect(await page.locator("#shareLink").getAttribute("href")).toContain("source%3Dcompartido");

  expect(sent).toHaveLength(1);
  expect(sent[0]).toMatchObject({ name: "Ana Prueba", email: "ana@correo.test", whatsapp: "", pain: "comer_fuera", consent: true, source: "ig-bio-s1" });
  expect(errors).toEqual([]);
});

test("REQ-371: sin casilla no envía y la pregunta opcional se puede desmarcar", async ({ page, context }) => {
  await installMocks(context);
  const sent = await mockSignup(context);
  await page.goto("/unete/index.html");

  await page.getByLabel("Nombre").fill("Ana");
  await page.getByLabel("Correo").fill("ana@correo.test");
  await page.getByRole("button", { name: "Inscribirme" }).click();
  await expect(page.locator("#error")).toContainText("casilla");
  expect(sent).toHaveLength(0);

  const option = page.locator('input[value="anotar"]');
  await option.click();
  await expect(option).toBeChecked();
  await option.click();
  await expect(option).not.toBeChecked();

  await page.locator("#consent").check();
  await page.getByRole("button", { name: "Inscribirme" }).click();
  await expect(page.getByRole("heading", { name: "Ya estás dentro, Ana." })).toBeVisible();
  expect(sent[0]).toMatchObject({ pain: "", source: "unete" });
});

test("REQ-371: si el servidor falla, avisa y conserva lo escrito", async ({ page, context }) => {
  await installMocks(context);
  await mockSignup(context, { status: 503, body: { error: "Las inscripciones no están disponibles en este momento. Intenta más tarde." } });
  await page.goto("/unete/index.html");

  await page.getByLabel("Nombre").fill("Ana");
  await page.getByLabel("Correo").fill("ana@correo.test");
  await page.locator("#consent").check();
  await page.getByRole("button", { name: "Inscribirme" }).click();

  await expect(page.locator("#error")).toContainText("no están disponibles");
  await expect(page.getByLabel("Correo")).toHaveValue("ana@correo.test");
  await expect(page.getByRole("button", { name: "Inscribirme" })).toBeEnabled();
});

test("REQ-371: la página no se desborda en un teléfono chico", async ({ page, context }) => {
  await installMocks(context);
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/unete/index.html");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
