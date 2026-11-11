// REQ-381: cobro en dólares para Chile y Colombia, detrás de TIENDA_USD_ENABLED.
// El país lo resuelve el servidor (x-vercel-ip-country → tienda.monedaSugerida en
// /api/config, probado en scripts/test-tienda-culqi.mjs); aquí se simula su respuesta.
// Culqi falso: nunca llaves ni llamadas reales.
import { test, expect } from "@playwright/test";
import { installMocks, collectConsoleErrors, gotoPortada } from "./helpers.js";

const BASE = {
  supabase: { url: "https://e2emock.supabase.co", publishableKey: "e2e-publishable-key" },
  anthropic: { model: "", proxy: true },
  signup: { mode: "invite" },
  culqi: { publicKey: "pk_test_e2e", enabled: true },
};
const APAGADA = { ...BASE, tienda: { usd: false, monedas: ["PEN"], monedaSugerida: "PEN" } };
const pais = (sugerida) => ({ ...BASE, tienda: { usd: true, monedas: ["PEN", "USD"], monedaSugerida: sugerida } });

const FAKE_CHECKOUT = `window.CulqiCheckout = function (key, config) {
  window.__culqiConfig = { key, config };
  const self = this;
  this.open = () => setTimeout(() => { self.token = { id: "tkn_test_e2e" }; self.culqi(); }, 10);
  this.close = () => {};
};`;
const FAKE_3DS = `window.Culqi3DS = {
  generateDevice: async () => "device-e2e",
  initAuthentication: () => setTimeout(() => window.postMessage({ parameters3DS: { eci: "05", xid: "x", cavv: "c" } }, location.origin), 10),
};`;

async function tienda(context, config) {
  await installMocks(context);
  await context.route("**/api/config", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(config) }));
  await context.route("https://js.culqi.com/checkout-js", (r) => r.fulfill({ status: 200, contentType: "application/javascript", body: FAKE_CHECKOUT }));
  for (const url of ["https://3ds.culqi.com", "https://3ds.culqi.com/"]) {
    await context.route(url, (r) => r.fulfill({ status: 200, contentType: "application/javascript", body: FAKE_3DS }));
  }
}

const precios = (page) => page.locator("article.plan .plan-precio");

test.describe("Tienda en dólares (REQ-381)", () => {
  test("bandera apagada: soles como siempre y sin selector, aunque el navegador recuerde dólares", async ({ page, context }) => {
    await tienda(context, APAGADA);
    await context.addInitScript(() => { try { localStorage.setItem("evolv_moneda", "USD"); } catch (_) {} });
    const errors = collectConsoleErrors(page);
    await page.goto("/planes/?moneda=USD");
    await expect(precios(page)).toHaveCount(3);
    await expect(precios(page).first()).toContainText("S/ 29.90");
    await expect(page.locator("#selectorMoneda")).toBeHidden();
    await expect(page.locator(".nota")).toContainText("Precios en soles, impuestos incluidos.");
    await expect(page.locator("article.plan a.btn").first()).toHaveAttribute("href", "/pago?plan=monthly");
    await page.goto("/pago/?plan=monthly&moneda=USD");
    await expect(page.locator("#rTotal")).toHaveText("S/ 29.90");
    await expect(page.locator("#selectorMoneda")).toBeHidden();
    await expect(page.getByRole("button", { name: "Pagar S/ 29.90" })).toBeVisible();
    await gotoPortada(page);
    await expect(page.locator(".l-plan").first()).toContainText("S/29.90");
    expect(errors).toEqual([]);
  });

  test("bandera encendida: Chile ve dólares por defecto; Perú ve soles; ambos pueden cambiar", async ({ page, context, browser }) => {
    await tienda(context, pais("USD"));
    const errors = collectConsoleErrors(page);
    await page.goto("/planes/");
    await expect(precios(page)).toHaveText([/USD 8\.99/, /USD 21\.99/, /USD 39\.99/]);
    await expect(page.getByRole("radio", { name: "Dólares" })).toBeChecked();
    await expect(page.locator(".nota")).toContainText("Precios en soles o dólares según tu país");
    await expect(page.locator("article.plan").nth(1)).toContainText("Ahorro del 18 % frente a 3 meses sueltos");
    await expect(page.locator("article.plan a.btn").first()).toHaveAttribute("href", "/pago?plan=monthly&moneda=USD");
    await gotoPortada(page);
    await expect(page.locator(".l-plan").first()).toContainText("USD 8.99");
    await expect(page.locator('[data-lmode="heroNote"]')).toContainText("Pago único en dólares");
    expect(errors).toEqual([]);

    const peru = await browser.newContext();
    await tienda(peru, pais("PEN"));
    const p2 = await peru.newPage();
    await p2.goto("/planes/");
    await expect(p2.locator("article.plan .plan-precio")).toHaveText([/S\/ 29\.90/, /S\/ 79\.90/, /S\/ 149\.90/]);
    await expect(p2.getByRole("radio", { name: "Soles" })).toBeChecked();
    await expect(p2.locator("article.plan").nth(1)).toContainText("Ahorro del 11 % frente a 3 meses sueltos");
    await p2.getByRole("radio", { name: "Dólares" }).check();
    await expect(p2.locator("article.plan .plan-precio").first()).toContainText("USD 8.99");
    await peru.close();
  });

  test("el cambio manual se recuerda hasta /pago y el cobro pide esa moneda y ese plan", async ({ page, context }) => {
    await tienda(context, pais("PEN"));
    const charges = [];
    await context.route("**/api/culqi-charge", async (r) => {
      const body = JSON.parse(r.request().postData());
      charges.push(body);
      const out = body.authentication3DS
        ? { ok: true, cuenta: "existente", plan: body.planId, moneda: "USD", monto: 2199, operacion: "chr_test_usd", compra: { eventId: "compra-chr_test_usd", value: 21.99, currency: "USD" } }
        : { ok: false, needs3ds: true };
      await r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(out) });
    });
    const errors = collectConsoleErrors(page);
    await page.goto("/planes/");
    await expect(page.getByRole("radio", { name: "Soles" })).toBeChecked();
    await page.getByRole("radio", { name: "Dólares" }).check();
    await expect(precios(page).nth(1)).toContainText("USD 21.99");
    // Se recuerda al volver (sin parámetro en la URL).
    await page.reload();
    await expect(page.getByRole("radio", { name: "Dólares" })).toBeChecked();
    await page.locator("article.plan").nth(1).getByRole("link", { name: /Comprar/ }).click();
    await expect(page).toHaveURL(/\/pago\/?\?plan=quarterly&moneda=USD$/);
    await expect(page.locator("#rTotal")).toHaveText("USD 21.99");
    await expect(page.getByRole("radio", { name: "Dólares" })).toBeChecked();
    // En /pago también se puede cambiar, y vuelve a dólares.
    await page.getByRole("radio", { name: "Soles" }).check();
    await expect(page.locator("#rTotal")).toHaveText("S/ 79.90");
    await expect(page).toHaveURL(/moneda=PEN$/);
    await page.getByRole("radio", { name: "Dólares" }).check();
    await expect(page.locator("#rTotal")).toHaveText("USD 21.99");

    await page.getByLabel("Correo").fill("ana@example.com");
    await page.getByLabel("Nombre").fill("Ana");
    await page.getByLabel("Apellido").fill("Pérez");
    await page.getByLabel(/Leí y acepto/).check();
    await page.getByRole("button", { name: "Pagar USD 21.99" }).click();
    await expect(page.locator("#listo")).toContainText("Tu plan ya está activo");
    await expect(page.locator("#listoFilas")).toContainText("USD 21.99");
    const cfg = await page.evaluate(() => window.__culqiConfig);
    expect(cfg.config.settings).toMatchObject({ currency: "USD", amount: 2199 });
    expect(await page.evaluate(() => window.Culqi3DS.settings.charge)).toMatchObject({ currency: "USD", totalAmount: 2199 });
    expect(charges).toHaveLength(2);
    for (const c of charges) expect(c).toMatchObject({ planId: "quarterly", moneda: "USD", tokenId: "tkn_test_e2e" });
    expect(charges[0]).not.toHaveProperty("amount");
    expect(errors).toEqual([]);
  });
});
