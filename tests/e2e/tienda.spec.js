// REQ-331..334: tienda web con Culqi (requisitos de afiliación) sin tocar la beta.
import { test, expect } from "@playwright/test";
import { installMocks, collectConsoleErrors, gotoApp } from "./helpers.js";

const CONFIG_CULQI = {
  supabase: { url: "https://e2emock.supabase.co", publishableKey: "e2e-publishable-key" },
  anthropic: { model: "", proxy: true },
  signup: { mode: "invite" },
  culqi: { publicKey: "pk_test_e2e", enabled: true },
};

// Culqi falso: el checkout entrega un token apenas se abre y 3DS responde con parámetros.
const FAKE_CHECKOUT = `window.CulqiCheckout = function (key, config) {
  window.__culqiConfig = { key, config };
  const self = this;
  this.open = () => setTimeout(() => { self.token = { id: "tkn_test_e2e" }; self.culqi(); }, 10);
  this.close = () => { window.__culqiClosed = true; };
};`;
const FAKE_3DS = `window.Culqi3DS = {
  generateDevice: async () => "device-e2e",
  initAuthentication: (token) => setTimeout(() => window.postMessage({ parameters3DS: { eci: "05", xid: "x", cavv: "c" } }, location.origin), 10),
};`;

async function mockCulqi(context) {
  await context.route("https://js.culqi.com/checkout-js", (r) => r.fulfill({ status: 200, contentType: "application/javascript", body: FAKE_CHECKOUT }));
  await context.route("https://3ds.culqi.com/", (r) => r.fulfill({ status: 200, contentType: "application/javascript", body: FAKE_3DS }));
  await context.route("https://3ds.culqi.com", (r) => r.fulfill({ status: 200, contentType: "application/javascript", body: FAKE_3DS }));
  await context.route("**/api/config", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(CONFIG_CULQI) }));
}

test.describe("Tienda web (Culqi)", () => {
  test("la portada vende los planes en soles con imagen y lleva a pagar; la beta sigue a la vista", async ({ page, context }) => {
    await installMocks(context);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);
    const planes = page.locator(".l-plan");
    await expect(planes).toHaveCount(3);
    await expect(planes.first()).toContainText("S/29.90");
    await expect(planes.first().locator("img")).toHaveAttribute("src", "/assets/planes/mensual.webp");
    await expect(page.locator(".l-plan a.l-btn")).toHaveText(["Comprar", "Comprar", "Comprar"]);
    await expect(page.getByRole("link", { name: "Postular a la beta" }).first()).toBeVisible();
    const footer = page.locator(".l-footer");
    for (const [name, href] of [["Planes", "/planes"], ["Términos", "/terminos"], ["Devoluciones", "/devoluciones"], ["Privacidad", "/privacidad"], ["Contacto", "/contacto"], ["Libro de Reclamaciones", "/libro-de-reclamaciones"]]) {
      await expect(footer.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
    }
    await expect(footer).toContainText("RUC");
    expect(errors).toEqual([]);
  });

  test("/planes muestra cada producto con foto, descripción, precio y botón Comprar", async ({ page, context }) => {
    await installMocks(context);
    const errors = collectConsoleErrors(page);
    await page.goto("/planes/");
    const cards = page.locator("article.plan");
    await expect(cards).toHaveCount(3);
    for (const [i, nombre, precio] of [[0, "Plan mensual", "S/ 29.90"], [1, "Plan trimestral", "S/ 79.90"], [2, "Plan semestral", "S/ 149.90"]]) {
      const card = cards.nth(i);
      await expect(card.getByRole("heading")).toHaveText(nombre);
      await expect(card.locator(".plan-precio")).toContainText(precio);
      await expect(card.locator("img.plan-img")).toBeVisible();
      await expect(card.locator(".plan-desc")).not.toBeEmpty();
    }
    await cards.nth(1).getByRole("link", { name: /Comprar/ }).click();
    await expect(page).toHaveURL(/\/pago\/?\?plan=quarterly$/);
    await expect(page.locator("h1")).toHaveText("Pagar plan trimestral");
    await expect(page.locator("#rTotal")).toHaveText("S/ 79.90");
    // Pie común: datos del comercio y Libro de Reclamaciones en toda la tienda.
    await expect(page.locator("#t-footer").getByRole("link", { name: "Libro de Reclamaciones" }).first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("pago: exige aceptar términos, abre Culqi con el monto del plan y confirma la compra", async ({ page, context }) => {
    await installMocks(context);
    await mockCulqi(context);
    const charges = [];
    await context.route("**/api/culqi-charge", async (r) => {
      charges.push(JSON.parse(r.request().postData()));
      await r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, cuenta: "invitada", plan: "semiannual", expiresAt: "2027-05-01T00:00:00Z", operacion: "chr_test_e2e" }) });
    });
    const errors = collectConsoleErrors(page);
    await page.goto("/pago/?plan=semiannual");
    await page.getByLabel("Correo").fill("ana@example.com");
    await page.getByLabel("Nombre").fill("Ana");
    await page.getByLabel("Apellido").fill("Pérez");
    await page.getByRole("button", { name: "Pagar S/ 149.90" }).click();
    await expect(page.getByRole("alert")).toHaveText("Para comprar, acepta los Términos y la Política de devoluciones.");
    expect(charges).toHaveLength(0);

    await page.getByLabel(/Leí y acepto/).check();
    await page.getByRole("button", { name: "Pagar S/ 149.90" }).click();
    await expect(page.locator("h1")).toHaveText("¡Gracias por tu compra!");
    await expect(page.locator("#listo")).toContainText("Te enviamos un correo a ana@example.com para crear tu contraseña");
    await expect(page.locator("#listo")).toContainText("chr_test_e2e");
    const cfg = await page.evaluate(() => window.__culqiConfig);
    expect(cfg.key).toBe("pk_test_e2e");
    expect(cfg.config.settings).toMatchObject({ currency: "PEN", amount: 14990 });
    expect(cfg.config.options.paymentMethods.tarjeta).toBe(true);
    expect(charges).toEqual([expect.objectContaining({ planId: "semiannual", tokenId: "tkn_test_e2e", email: "ana@example.com", deviceId: "device-e2e", acceptTerms: true })]);
    expect(errors).toEqual([]);
  });

  test("pago: si el banco pide 3DS, autentica y reintenta el mismo cargo", async ({ page, context }) => {
    await installMocks(context);
    await mockCulqi(context);
    const charges = [];
    await context.route("**/api/culqi-charge", async (r) => {
      const body = JSON.parse(r.request().postData());
      charges.push(body);
      const out = body.authentication3DS ? { ok: true, cuenta: "existente", operacion: "chr_test_3ds" } : { ok: false, needs3ds: true };
      await r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(out) });
    });
    await page.goto("/pago/?plan=monthly");
    await page.getByLabel("Correo").fill("ana@example.com");
    await page.getByLabel("Nombre").fill("Ana");
    await page.getByLabel("Apellido").fill("Pérez");
    await page.getByLabel(/Leí y acepto/).check();
    await page.getByRole("button", { name: "Pagar S/ 29.90" }).click();
    await expect(page.locator("#listo")).toContainText("Tu plan ya está activo");
    expect(charges).toHaveLength(2);
    expect(charges[1].authentication3DS).toEqual({ eci: "05", xid: "x", cavv: "c" });
    expect(charges[1].tokenId).toBe(charges[0].tokenId);
  });

  test("pago: sin llaves de Culqi avisa en vez de fallar, y un plan inexistente vuelve a Planes", async ({ page, context }) => {
    await installMocks(context);
    await page.goto("/pago/?plan=monthly");
    await page.getByLabel("Correo").fill("ana@example.com");
    await page.getByLabel("Nombre").fill("Ana");
    await page.getByLabel("Apellido").fill("Pérez");
    await page.getByLabel(/Leí y acepto/).check();
    await page.getByRole("button", { name: "Pagar S/ 29.90" }).click();
    await expect(page.getByRole("alert")).toContainText("no están disponibles en este momento");
    await page.goto("/pago/?plan=annual");
    await expect(page.locator("#sinPlan")).toBeVisible();
    await expect(page.locator("#pago")).toBeHidden();
  });

  test("Libro de Reclamaciones: hoja integrada con número, constancia y contacto mínimo", async ({ page, context }) => {
    await installMocks(context);
    let sent = null;
    await context.route("**/api/reclamaciones", async (r) => {
      sent = JSON.parse(r.request().postData());
      if (!sent.email && !sent.telefono && !sent.domicilio) {
        await r.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ error: "Déjanos al menos un medio para responderte: correo, teléfono o domicilio." }) });
        return;
      }
      await r.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, hoja: { codigo: "EVOLV-LR-000007", copiaEnviada: false, filas: [["Hoja N.°", "EVOLV-LR-000007"], ["Consumidor", sent.nombre], ["Tipo", "Queja"]] } }) });
    });
    const errors = collectConsoleErrors(page);
    await page.goto("/libro-de-reclamaciones/");
    await expect(page.locator("h1")).toHaveText("Libro de Reclamaciones");
    await expect(page.locator("#libro")).toContainText("quince (15) días hábiles");
    await page.getByLabel("Nombre completo").fill("Ana Pérez");
    await page.getByLabel("Número de documento").fill("12345678");
    await page.getByLabel("Descripción").fill("Plan mensual");
    await page.getByRole("radio", { name: "Queja" }).check();
    await page.getByLabel("Detalle").fill("La atención por WhatsApp tardó tres días.");
    await page.getByLabel("Pedido").fill("Mejorar el tiempo de respuesta.");
    await page.getByRole("button", { name: "Enviar hoja de reclamación" }).click();
    await expect(page.getByRole("alert")).toContainText("al menos un medio");
    await expect(page.locator("#email")).toBeFocused();

    await page.getByLabel("Teléfono").fill("999888777");
    await page.getByRole("button", { name: "Enviar hoja de reclamación" }).click();
    await expect(page.locator("#emitida")).toContainText("EVOLV-LR-000007");
    await expect(page.locator("#emitida")).toContainText("Guarda o imprime esta hoja");
    expect(sent).toMatchObject({ tipo: "queja", tipoDocumento: "DNI", numeroDocumento: "12345678", telefono: "999888777", menorEdad: false });
    // El 400 de la validación simulada es esperado; ningún otro error.
    expect(errors.filter((e) => !/status of 400/.test(e))).toEqual([]);
  });

  test("páginas legales y de contacto con datos del comercio y sin enlaces rotos al resto de la tienda", async ({ page, context }) => {
    await installMocks(context);
    const errors = collectConsoleErrors(page);
    for (const [path, h1] of [["/terminos/", "Términos y condiciones"], ["/devoluciones/", "Política de cambios y devoluciones"], ["/privacidad/", "Política de privacidad"], ["/contacto/", "Contacto"]]) {
      await page.goto(path);
      await expect(page.locator("h1")).toHaveText(h1);
      await expect(page.locator("[data-comercio]").first()).not.toBeEmpty();
      await expect(page.locator("#t-footer")).toContainText("RUC");
    }
    await page.goto("/devoluciones/");
    await expect(page.locator("main")).toContainText("7 días calendario");
    // REQ-343: secciones que pide la revisión de Culqi, contacto con horario y enlaces que funcionan.
    for (const h of ["Introducción", "Condiciones para cambios y devoluciones", "Cómo pedir un cambio o una devolución", "Opciones de reembolso y cambios", "Costos de envío", "Excepciones y garantías", "Contacto y atención al cliente"]) {
      await expect(page.getByRole("heading", { name: new RegExp(h) })).toBeVisible();
    }
    await expect(page.locator('main [data-comercio="horario"]')).toHaveText(/Lunes a viernes/);
    await expect(page.locator('main a[data-comercio="whatsappUrl"]').first()).toHaveAttribute("href", /^https:\/\/wa\.me\//);
    await expect(page.getByRole("link", { name: "Pedir el reembolso por correo" })).toHaveAttribute("href", /^mailto:.+subject=Solicitud/);

    await page.goto("/terminos/");
    for (const h of ["Información general del comercio", "Aceptación de los términos", "Registro y cuenta de usuario", "Productos y servicios", "Precios y formas de pago", "Proceso de compra", "Entrega del servicio", "Protección de datos personales", "Propiedad intelectual", "Responsabilidad y limitaciones", "Legislación aplicable y resolución de conflictos", "Contacto y soporte"]) {
      await expect(page.getByRole("heading", { name: new RegExp(h) })).toBeVisible();
    }
    await expect(page.locator('main [data-comercio="ruc"]').first()).toHaveText(/^\d{11}$/);
    await expect(page.locator('main [data-comercio="horario"]').first()).toHaveText(/Lunes a viernes/);
    await expect(page.locator('main a[data-comercio="whatsappUrl"]')).toHaveAttribute("href", /^https:\/\/wa\.me\//);

    await page.goto("/contacto/");
    await expect(page.locator('main a[data-comercio="whatsappUrl"]')).toHaveAttribute("href", /^https:\/\/wa\.me\//);
    expect(errors).toEqual([]);
  });
});
