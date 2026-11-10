// REQ-376: píxel de Meta solo en la web pública, solo con ID configurado y sin datos personales.
import { test, expect } from "@playwright/test";
import { installMocks, collectConsoleErrors, gotoApp } from "./helpers.js";

const PIXEL_ID = "123456789012345";
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
const PUBLIC_PAGES = ["/", "/planes/", "/pago/?plan=monthly", "/unete/index.html", "/beta-reclutamiento.html"];
const PII = /ana@example\.com|ana@correo\.test|Ana|Pérez|999|\+51/;

function watchMeta(page) {
  const urls = [];
  page.on("request", (r) => { if (/facebook\.(?:net|com)/.test(r.url())) urls.push(r.url()); });
  return urls;
}

// Config con píxel de prueba y fbevents.js falso: la cola de fbq queda a la vista.
async function withPixel(context, extra = {}) {
  await context.route("**/api/config", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ...CONFIG, ...extra, metaPixelId: PIXEL_ID }) }));
  await context.route("https://connect.facebook.net/**", (r) => r.fulfill({ status: 200, contentType: "application/javascript", body: "window.__fbevents = true;" }));
  await context.route("https://js.culqi.com/checkout-js", (r) => r.fulfill({ status: 200, contentType: "application/javascript", body: FAKE_CHECKOUT }));
  await context.route("https://3ds.culqi.com", (r) => r.fulfill({ status: 200, contentType: "application/javascript", body: FAKE_3DS }));
  await context.route("https://3ds.culqi.com/", (r) => r.fulfill({ status: 200, contentType: "application/javascript", body: FAKE_3DS }));
}

const fbqCalls = (page) => page.evaluate(() => (window.fbq && window.fbq.queue ? window.fbq.queue.map((args) => JSON.parse(JSON.stringify(Array.from(args)))) : null));
const tracked = async (page) => ((await fbqCalls(page)) || []).filter((c) => c[0] === "track").map((c) => c[1]);

async function fillPago(page) {
  await page.getByLabel("Correo").fill("ana@example.com");
  await page.getByLabel("Nombre").fill("Ana");
  await page.getByLabel("Apellido").fill("Pérez");
  await page.getByLabel("Celular").fill("999 888 777");
  await page.getByLabel(/Leí y acepto/).check();
}

test.describe("Medición de la campaña (REQ-376)", () => {
  test("sin ID de píxel ninguna página pública pide nada a Meta", async ({ page, context }) => {
    await installMocks(context);
    const meta = watchMeta(page);
    const errors = collectConsoleErrors(page);
    for (const path of PUBLIC_PAGES) {
      const config = page.waitForRequest("**/api/config");
      await page.goto(path);
      await config;
      await page.waitForLoadState("networkidle");
      expect(await page.evaluate(() => typeof window.fbq), path).toBe("undefined");
    }
    expect(meta).toEqual([]);
    expect(errors).toEqual([]);
  });

  test("con un ID de prueba: PageView en cada página, ViewContent en /planes y nada en la app", async ({ page, context }) => {
    await installMocks(context);
    await withPixel(context);
    for (const path of PUBLIC_PAGES) {
      await page.goto(path);
      await expect.poll(() => fbqCalls(page), { message: path }).not.toBeNull();
      const calls = await fbqCalls(page);
      expect(calls[0], path).toEqual(["set", "autoConfig", false, PIXEL_ID]);
      expect(calls[1], path + ": init sin datos de usuario").toEqual(["init", PIXEL_ID]);
      expect((await tracked(page))[0], path).toBe("PageView");
      expect(await page.evaluate(() => window.__fbevents), path).toBe(true);
    }
    await page.goto("/planes/");
    await expect.poll(() => tracked(page)).toEqual(["PageView", "ViewContent"]);
    const view = (await fbqCalls(page)).find((c) => c[1] === "ViewContent");
    expect(view[2]).toEqual({ content_type: "product", content_ids: ["monthly", "quarterly", "semiannual"], currency: "PEN" });

    // La app nunca carga el módulo ni el píxel, aunque haya ID configurado.
    const appRequests = [];
    page.on("request", (r) => appRequests.push(r.url()));
    await gotoApp(page);
    await page.waitForTimeout(500);
    expect(appRequests.filter((u) => /facebook|medicion\.js/.test(u))).toEqual([]);
    expect(await page.evaluate(() => typeof window.fbq)).toBe("undefined");
  });

  test("/pago: InitiateCheckout al abrir el checkout y un solo Purchase con el valor y el id del servidor", async ({ page, context }) => {
    await installMocks(context);
    await withPixel(context);
    await context.addCookies([{ name: "_fbp", value: "fb.1.1700000000000.1234567890", url: "http://127.0.0.1:8923" }]);
    const charges = [];
    await context.route("**/api/culqi-charge", async (r) => {
      charges.push(JSON.parse(r.request().postData()));
      await r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, cuenta: "existente", plan: "monthly", operacion: "chr_test_e2e", compra: { eventId: "compra-chr_test_e2e", value: 29.9, currency: "PEN" } }) });
    });
    const errors = collectConsoleErrors(page);
    await page.goto("/pago/?plan=monthly");
    await expect.poll(() => tracked(page)).toEqual(["PageView"]);
    await fillPago(page);
    await page.getByRole("button", { name: "Pagar S/ 29.90" }).click();
    await expect(page.locator("#listo")).toContainText("Tu plan ya está activo");
    await expect.poll(() => tracked(page)).toEqual(["PageView", "InitiateCheckout", "Purchase"]);
    const calls = await fbqCalls(page);
    expect(calls.find((c) => c[1] === "InitiateCheckout")[2]).toEqual({ value: 29.9, currency: "PEN", content_type: "product", content_ids: ["monthly"], num_items: 1 });
    const purchase = calls.find((c) => c[1] === "Purchase");
    expect(purchase[2]).toEqual({ value: 29.9, currency: "PEN", content_type: "product", content_ids: ["monthly"], num_items: 1 });
    expect(purchase[3]).toEqual({ eventID: "compra-chr_test_e2e" });
    expect(JSON.stringify(calls)).not.toMatch(PII);
    // Las cookies del píxel van al servidor para la API de conversiones.
    expect(charges[0].fbp).toBe("fb.1.1700000000000.1234567890");
    // Repetir el mismo Purchase no lo vuelve a contar.
    await page.evaluate(() => import("/web/medicion.js").then((m) => m.track("Purchase", { value: 29.9, currency: "PEN" }, { eventId: "compra-chr_test_e2e" })));
    expect((await tracked(page)).filter((n) => n === "Purchase")).toHaveLength(1);
    expect(errors).toEqual([]);
  });

  test("/pago: con el píxel caído o bloqueado se paga igual", async ({ page, context }) => {
    await installMocks(context);
    await withPixel(context);
    await context.route("https://connect.facebook.net/**", (r) => r.abort("blockedbyclient"));
    await context.route("**/web/medicion.js", (r) => r.abort("blockedbyclient"));
    await context.route("**/api/culqi-charge", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, cuenta: "existente", operacion: "chr_test_e2e", compra: { eventId: "compra-chr_test_e2e", value: 29.9, currency: "PEN" } }) }));
    await page.goto("/pago/?plan=monthly");
    await fillPago(page);
    await page.getByRole("button", { name: "Pagar S/ 29.90" }).click();
    await expect(page.locator("#listo")).toContainText("Tu plan ya está activo");
  });

  test("Lead solo cuando /unete y /beta responden con éxito", async ({ page, context }) => {
    await installMocks(context);
    await withPixel(context);
    let ok = false;
    await context.route("**/api/unete", (r) => r.fulfill({ status: ok ? 200 : 500, contentType: "application/json", body: JSON.stringify(ok ? { ok: true } : { error: "Falla" }) }));
    await page.goto("/unete/index.html");
    await expect.poll(() => tracked(page)).toEqual(["PageView"]);
    await page.getByLabel("Nombre").fill("Ana Prueba");
    await page.getByLabel("Correo").fill("ana@correo.test");
    await page.locator("#consent").check();
    await page.getByRole("button", { name: "Inscribirme" }).click();
    await expect(page.locator("#error")).toBeVisible();
    expect(await tracked(page)).toEqual(["PageView"]);
    ok = true;
    await page.getByRole("button", { name: "Inscribirme" }).click();
    await expect(page.getByRole("heading", { name: "Ya estás dentro, Ana." })).toBeVisible();
    await expect.poll(() => tracked(page)).toEqual(["PageView", "Lead"]);
    expect(JSON.stringify(await fbqCalls(page))).not.toMatch(PII);

    await context.route("**/api/beta-recruitment", (r) => r.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, submission: { id: 1 } }) }));
    await page.goto("/beta-reclutamiento.html");
    await expect.poll(() => tracked(page)).toEqual(["PageView"]);
    await page.getByLabel("Nombre").fill("Ana Prueba");
    await page.getByLabel("Correo").fill("ana@correo.test");
    await page.getByLabel("WhatsApp").fill("+51 999 111 222");
    await page.getByLabel("Edad").selectOption("25-34");
    await page.getByLabel("País / ciudad").fill("Lima");
    await page.getByLabel("¿Qué te describe mejor?").selectOption("returning");
    await page.getByLabel("Objetivo principal").selectOption({ label: "Ganar músculo" });
    await page.locator('input[name="recentAttempt"][value="yes"]').check();
    await page.getByRole("checkbox", { name: "No sé qué entrenar hoy", exact: true }).check();
    await page.getByLabel("Cuéntanos la última vez que te pasó").fill("Dejé el gym cuando cambió mi horario.");
    await page.getByLabel("¿Cuánto inviertes hoy en resolver esto?").selectOption("time");
    await page.getByLabel("Disponibilidad").selectOption({ label: "Llamada de 15-20 min y beta de 3 meses" });
    await page.locator('input[name="health"][value="clear"]').check();
    await page.getByRole("button", { name: "Enviar postulación" }).click();
    await expect(page.locator("#done")).toBeVisible();
    await expect.poll(() => tracked(page)).toEqual(["PageView", "Lead"]);
    expect(JSON.stringify(await fbqCalls(page))).not.toMatch(PII);
  });
});
