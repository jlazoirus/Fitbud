// REQ-370: el origen de campaña (source/utm_*) de la web pública llega a la compra.
// Culqi falso y /api/culqi-charge simulado: ninguna llave real ni cobro.
import { test, expect } from "@playwright/test";
import { installMocks, collectConsoleErrors } from "./helpers.js";

const CONFIG = {
  supabase: { url: "https://e2emock.supabase.co", publishableKey: "e2e-publishable-key" },
  anthropic: { model: "", proxy: true },
  signup: { mode: "invite" },
  culqi: { publicKey: "pk_test_e2e", enabled: true },
};
const FAKE_CHECKOUT = `window.CulqiCheckout = function () {
  const self = this;
  this.open = () => setTimeout(() => { self.token = { id: "tkn_test_e2e" }; self.culqi(); }, 10);
  this.close = () => {};
};`;
const FAKE_3DS = `window.Culqi3DS = { generateDevice: async () => "device-e2e", initAuthentication: () => {} };`;
const KEY = "evolv_origen";
const DIA = 86400000;

async function mockTienda(context) {
  await context.route("**/api/config", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(CONFIG) }));
  await context.route("https://js.culqi.com/checkout-js", (r) => r.fulfill({ status: 200, contentType: "application/javascript", body: FAKE_CHECKOUT }));
  await context.route("https://3ds.culqi.com", (r) => r.fulfill({ status: 200, contentType: "application/javascript", body: FAKE_3DS }));
  await context.route("https://3ds.culqi.com/", (r) => r.fulfill({ status: 200, contentType: "application/javascript", body: FAKE_3DS }));
  const charges = [];
  await context.route("**/api/culqi-charge", async (r) => {
    charges.push(JSON.parse(r.request().postData()));
    await r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, cuenta: "existente", plan: "monthly", operacion: "chr_test_e2e" }) });
  });
  return charges;
}

async function pagarMensual(page) {
  await page.getByLabel("Correo").fill("ana@example.com");
  await page.getByLabel("Nombre").fill("Ana");
  await page.getByLabel("Apellido").fill("Pérez");
  await page.getByLabel("Celular").fill("999 888 777");
  await page.getByLabel(/Leí y acepto/).check();
  await page.getByRole("button", { name: "Pagar S/ 29.90" }).click();
  await expect(page.locator("#listo")).toContainText("Tu plan ya está activo");
}

const guardado = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "null"), KEY);

test.describe("Origen de campaña hasta la compra (REQ-370)", () => {
  test("/?source=ig-bio-s1 → /planes → /pago: la compra lleva campana.source", async ({ page, context }) => {
    await installMocks(context);
    const charges = await mockTienda(context);
    const errors = collectConsoleErrors(page);
    await page.goto("/?source=ig-bio-s1");
    await expect.poll(() => guardado(page)).not.toBeNull();
    const reg = await guardado(page);
    expect(reg.campana).toEqual({ source: "ig-bio-s1" });
    // Los enlaces no cargan el origen: viaja en el navegador, no en la URL.
    await page.locator(".l-footer").getByRole("link", { name: "Planes", exact: true }).click();
    await expect(page.locator("article.plan")).toHaveCount(3);
    await page.locator("article.plan").first().getByRole("link", { name: /Comprar/ }).click();
    await expect(page).toHaveURL(/\/pago\/?\?plan=monthly$/);
    await pagarMensual(page);
    expect(charges).toHaveLength(1);
    expect(charges[0].campana).toEqual({ source: "ig-bio-s1" });
    expect(charges[0].planId).toBe("monthly");
    // Lo guardado nunca incluye datos personales.
    expect(JSON.stringify(await guardado(page))).not.toMatch(/ana@example\.com|Ana|Pérez|999/);
    expect(errors).toEqual([]);
  });

  test("gana el primer contacto dentro de 30 días; vencido se reemplaza", async ({ page, context }) => {
    await installMocks(context);
    const charges = await mockTienda(context);
    await page.goto("/?source=ig-bio-s1");
    await expect.poll(async () => (await guardado(page))?.campana).toEqual({ source: "ig-bio-s1" });
    await page.goto("/planes/?utm_source=tiktok&utm_campaign=dic-2026");
    await page.waitForLoadState("networkidle");
    expect((await guardado(page)).campana).toEqual({ source: "ig-bio-s1" });

    // Primer contacto de hace 31 días: el nuevo origen lo reemplaza y es el que se envía.
    await page.evaluate(([k, at]) => localStorage.setItem(k, JSON.stringify({ campana: { source: "ig-bio-s1" }, at })), [KEY, Date.now() - 31 * DIA]);
    await page.goto("/pago/?plan=monthly&utm_source=instagram&utm_medium=paid_social&utm_campaign=dic-2026&utm_content=reel_02");
    await expect.poll(async () => (await guardado(page))?.campana).toEqual({ utm_source: "instagram", utm_medium: "paid_social", utm_campaign: "dic-2026", utm_content: "reel_02" });
    await pagarMensual(page);
    expect(charges[0].campana).toEqual({ utm_source: "instagram", utm_medium: "paid_social", utm_campaign: "dic-2026", utm_content: "reel_02" });
  });

  test("sin origen o con valores inválidos la compra es igual y no lleva el campo", async ({ page, context }) => {
    await installMocks(context);
    const charges = await mockTienda(context);
    const errors = collectConsoleErrors(page);
    await page.goto("/?source=ig%20bio&utm_source=%3Cscript%3E&utm_campaign=" + "a".repeat(121));
    await page.waitForLoadState("networkidle");
    expect(await guardado(page)).toBeNull();
    await page.goto("/pago/?plan=monthly");
    await pagarMensual(page);
    expect("campana" in charges[0]).toBe(false);
    expect(errors).toEqual([]);
  });

  test("si el módulo de origen no carga, se paga igual", async ({ page, context }) => {
    await installMocks(context);
    const charges = await mockTienda(context);
    await context.route("**/web/origen.js", (r) => r.abort());
    await page.goto("/pago/?plan=monthly&source=ig-bio-s1");
    await pagarMensual(page);
    expect(charges).toHaveLength(1);
    expect("campana" in charges[0]).toBe(false);
  });
});
