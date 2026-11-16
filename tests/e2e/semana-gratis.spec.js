// REQ-356: /registro con tarjeta y semana gratis, detrás de TIENDA_SUSCRIPCION_ENABLED.
// Culqi falso (Checkout y 3DS) y /api/suscripcion simulado: el servidor se prueba en
// scripts/test-suscripcion-culqi.mjs.
import { test, expect } from "@playwright/test";
import { installMocks, collectConsoleErrors, gotoPortada, gotoApp } from "./helpers.js";

const BASE = {
  supabase: { url: "https://e2emock.supabase.co", publishableKey: "e2e-publishable-key" },
  anthropic: { model: "", proxy: true },
  signup: { mode: "invite" },
  culqi: { publicKey: "pk_test_e2e", enabled: true },
};
const config = (suscripcion) => ({ ...BASE, tienda: { usd: false, monedas: ["PEN"], monedaSugerida: "PEN", suscripcion } });

const FAKE_CHECKOUT = `window.__tokens = 0;
window.CulqiCheckout = function (key, config) {
  window.__culqiConfig = { key, config };
  const self = this;
  this.open = () => setTimeout(() => { window.__tokens += 1; self.token = { id: "tkn_test_e2e" + window.__tokens }; self.culqi(); }, 10);
  this.close = () => {};
};`;
const FAKE_3DS = `window.Culqi3DS = {
  generateDevice: async () => "device-e2e",
  initAuthentication: () => setTimeout(() => window.postMessage({ parameters3DS: { eci: "05", xid: "x", cavv: "c" } }, location.origin), 10),
};`;

async function tienda(context, cfg) {
  await installMocks(context);
  await context.route("**/api/config", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(cfg) }));
  await context.route("https://js.culqi.com/checkout-js", (r) => r.fulfill({ status: 200, contentType: "application/javascript", body: FAKE_CHECKOUT }));
  for (const url of ["https://3ds.culqi.com", "https://3ds.culqi.com/"]) {
    await context.route(url, (r) => r.fulfill({ status: 200, contentType: "application/javascript", body: FAKE_3DS }));
  }
}

async function llenar(page, email = "ana@example.com") {
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Nombre").fill("Ana");
  await page.getByLabel("Apellido").fill("Pérez");
  await page.getByLabel("Celular").fill("999 888 777");
  await page.getByLabel("Dirección").fill("Av. Arequipa 123");
  await page.getByLabel("Ciudad").fill("Lima");
}

const enLima = (ms) => new Date(ms).toLocaleDateString("es-PE", { timeZone: "America/Lima", day: "numeric", month: "long", year: "numeric" });

test.describe("Registro con semana gratis (REQ-356)", () => {
  test("bandera apagada: /registro no inscribe y portada, planes y app siguen igual", async ({ page, context }) => {
    await tienda(context, config(false));
    const errors = collectConsoleErrors(page);
    await page.goto("/registro/");
    await expect(page.locator("#noDisponible")).toBeVisible();
    await expect(page.locator("#inscripcion")).toBeHidden();
    await page.goto("/planes/");
    await expect(page.getByRole("link", { name: "Empieza tu semana gratis" })).toBeHidden();
    await gotoPortada(page);
    await expect(page.locator('[data-lmode="hero"] a')).toHaveText("Ver planes");
    await expect(page.locator('[data-lmode="heroNote"]')).toContainText("Pago único");
    expect(errors).toEqual([]);
  });

  test("sin aceptar la renovación no continúa; al terminar muestra días gratis y fecha del primer cobro", async ({ page, context }) => {
    await tienda(context, config(true));
    const pedidos = [];
    await context.route("**/api/suscripcion", async (r) => {
      pedidos.push(JSON.parse(r.request().postData()));
      await r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        ok: true, cuenta: "invitada", conPrueba: true, suscripcion: "sxn_test_e2e", monto: "S/ 29.90",
        accesoHasta: "2026-11-23T15:00:00.000Z", primerCobro: "2026-11-23T15:00:00.000Z", tarjeta: { marca: "Visa", ultimos4: "1111" },
      }) });
    });
    const errors = collectConsoleErrors(page);
    await page.goto("/registro/");
    const cobro = enLima(Date.now() + 7 * 86400000);
    await expect(page.locator(".resumen")).toContainText("Hoy pagasS/ 0.00");
    const corta = new Date(Date.now() + 7 * 86400000).toLocaleDateString("es-PE", { timeZone: "America/Lima", day: "numeric", month: "long" });
    await expect(page.locator(".resumen")).toContainText("Desde el " + corta + "S/ 29.90 al mes");
    await expect(page.getByLabel(/renovación automática/)).toBeVisible();
    await expect(page.locator("label.check").first()).toContainText("si no cancelo antes del " + cobro + ", ese día se cobran S/ 29.90");

    await llenar(page);
    await page.getByLabel(/Leí y acepto/).check();
    await page.getByRole("button", { name: "Empezar mi semana gratis" }).click();
    await expect(page.getByRole("alert")).toHaveText("Para continuar, acepta la renovación automática mensual.");
    expect(pedidos).toHaveLength(0);
    expect(await page.evaluate(() => window.__culqiConfig || null)).toBeNull();

    await page.getByLabel(/renovación automática/).check();
    await page.getByRole("button", { name: "Empezar mi semana gratis" }).click();
    await expect(page.locator("#listoTitulo")).toHaveText("¡Tu semana gratis empezó!");
    await expect(page.locator("#listo")).toContainText("Te enviamos un correo a ana@example.com para crear tu contraseña");
    await expect(page.locator("#listoFilas")).toContainText("Gratis hasta" + enLima("2026-11-23T15:00:00.000Z"));
    await expect(page.locator("#listoFilas")).toContainText("Primer cobro" + enLima("2026-11-23T15:00:00.000Z") + " · S/ 29.90");
    await expect(page.locator("#listoFilas")).toContainText("Visa •••• 1111");
    await expect(page.getByRole("link", { name: "Ir a Evolv" })).toHaveAttribute("href", "/app");
    const cfg = await page.evaluate(() => window.__culqiConfig);
    expect(cfg.config.settings).toMatchObject({ currency: "PEN", amount: 0 });
    expect(pedidos).toEqual([expect.objectContaining({
      tokenId: "tkn_test_e2e1", deviceId: "device-e2e", email: "ana@example.com", phone: "999 888 777",
      address: "Av. Arequipa 123", city: "Lima", acceptTerms: true, acceptRenewal: true, aceptaCobroInmediato: false,
    })]);
    expect(errors).toEqual([]);
  });

  test("3DS al guardar la tarjeta: autentica y reintenta con el mismo token", async ({ page, context }) => {
    await tienda(context, config(true));
    const pedidos = [];
    await context.route("**/api/suscripcion", async (r) => {
      const body = JSON.parse(r.request().postData());
      pedidos.push(body);
      const out = body.authentication3DS ? { ok: true, cuenta: "existente", conPrueba: true, accesoHasta: "2026-11-23T15:00:00.000Z" } : { ok: false, needs3ds: true };
      await r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(out) });
    });
    await page.goto("/registro/");
    await llenar(page);
    await page.getByLabel(/renovación automática/).check();
    await page.getByLabel(/Leí y acepto/).check();
    await page.getByRole("button", { name: "Empezar mi semana gratis" }).click();
    await expect(page.locator("#listo")).toContainText("La suscripción quedó en tu cuenta de Evolv");
    expect(pedidos).toHaveLength(2);
    expect(pedidos[1].tokenId).toBe(pedidos[0].tokenId);
    expect(pedidos[1].authentication3DS).toEqual({ eci: "05", xid: "x", cavv: "c" });
  });

  test("sin semana gratis: se acepta aparte el cobro de hoy antes de suscribir", async ({ page, context }) => {
    await tienda(context, config(true));
    const pedidos = [];
    await context.route("**/api/suscripcion", async (r) => {
      const body = JSON.parse(r.request().postData());
      pedidos.push(body);
      const out = body.aceptaCobroInmediato
        ? { status: 200, body: { ok: true, cuenta: "existente", conPrueba: false, monto: "S/ 29.90" } }
        : { status: 409, body: { sinPrueba: true, error: "Con este correo ya usaste la semana gratis o un plan pagado. Si te suscribes, hoy se cobran S/ 29.90 y luego cada mes hasta que canceles." } };
      await r.fulfill({ status: out.status, contentType: "application/json", body: JSON.stringify(out.body) });
    });
    await page.goto("/registro/");
    await llenar(page, "vuelve@example.com");
    await page.getByLabel(/renovación automática/).check();
    await page.getByLabel(/Leí y acepto/).check();
    await page.getByRole("button", { name: "Empezar mi semana gratis" }).click();
    await expect(page.locator("#sinPrueba")).toContainText("ya usaste la semana gratis");
    const boton = page.getByRole("button", { name: "Suscribirme y pagar S/ 29.90 hoy" });
    await boton.click();
    await expect(page.getByRole("alert")).toHaveText("Para suscribirte sin días gratis, acepta el cobro de hoy.");
    expect(pedidos).toHaveLength(1);
    await page.getByLabel(/acepto que hoy se cobren/).check();
    await boton.click();
    await expect(page.locator("#listoTitulo")).toHaveText("¡Suscripción creada!");
    await expect(page.locator("#listoFilas")).toContainText("Cobro de hoyS/ 29.90");
    expect(pedidos).toHaveLength(2);
    expect(pedidos[1]).toMatchObject({ tokenId: pedidos[0].tokenId, aceptaCobroInmediato: true });
    expect(await page.evaluate(() => window.__tokens)).toBe(1, "el token sin usar se reenvía sin pedir la tarjeta otra vez");
  });

  test("bandera encendida: portada, planes y app sin sesión invitan a la semana gratis", async ({ page, context }) => {
    await tienda(context, config(true));
    const errors = collectConsoleErrors(page);
    await gotoPortada(page);
    for (const sel of ['[data-lmode="nav"] a', '[data-lmode="hero"] a', '[data-lmode="final"] a.l-btn']) {
      await expect(page.locator(sel)).toHaveText("Empieza tu semana gratis");
      await expect(page.locator(sel)).toHaveAttribute("href", "/registro");
    }
    await expect(page.locator('[data-lmode="heroNote"]')).toHaveText("7 días gratis · Luego S/ 29.90 al mes · Cancela cuando quieras");
    await expect(page.locator(".l-plan-store")).toHaveCount(3, { timeout: 5000 });
    await page.goto("/planes/");
    await expect(page.locator("#notaSuscripcion").getByRole("link", { name: "Empieza tu semana gratis" })).toHaveAttribute("href", "/registro");
    await page.addInitScript(() => localStorage.setItem("fitbros_tour_v1", "done"));
    await gotoApp(page);
    await page.getByRole("button", { name: "¿No tienes cuenta? Regístrate" }).click();
    await expect(page.getByRole("link", { name: "Empieza tu semana gratis" })).toHaveAttribute("href", "/registro");
    expect(errors).toEqual([]);
  });
});
