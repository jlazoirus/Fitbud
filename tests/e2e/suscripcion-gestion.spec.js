// REQ-357: ver y cancelar la suscripción mensual en Perfil (app) y en /cuenta (web
// pública, para quien usa la app nativa). /api/suscripcion/* simulado: el servidor
// y los correos se prueban en scripts/test-suscripcion-gestion.mjs.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, gotoApp, autoDismissNudges, collectConsoleErrors, SUPA_URL, USER_EMAIL } from "./helpers.js";

const days = (n) => new Date(Date.now() + n * 86400000).toISOString();
const enLima = (iso) => new Date(iso).toLocaleDateString("es-PE", { timeZone: "America/Lima", day: "numeric", month: "long", year: "numeric" });
const PRUEBA = {
  estado: "trialing", conPrueba: true, pruebaHasta: days(5), proximoCobro: days(5), monto: "S/ 29.90",
  tarjeta: { marca: "Visa", ultimos4: "1111" }, canceladaEl: null, accesoHasta: days(5), creadaEl: days(-2),
};

async function mockSuscripcion(context, sub, calls) {
  await context.route((u) => /\/api\/(suscripcion\/estado|checkout\?op=suscripcion-estado)$/.test(u.pathname + u.search), (route) => {
    calls.estado.push(route.request().headers().authorization || "");
    if (!String(route.request().headers().authorization || "").startsWith("Bearer ")) {
      return route.fulfill({ status: 401, contentType: "application/json", body: '{"error":"Sesión requerida."}' });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ suscripcion: sub }) });
  });
  await context.route((u) => /\/api\/(suscripcion\/cancelar|checkout\?op=suscripcion-cancelar)$/.test(u.pathname + u.search), (route) => {
    calls.cancelar.push(route.request().headers().authorization || "");
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, accesoHasta: sub.accesoHasta }) });
  });
}

test.describe("Gestionar la suscripción (REQ-357)", () => {
  test("Perfil → Mi suscripción: estado, tarjeta y cancelar con confirmación", async ({ page, context }) => {
    await installMocks(context);
    const calls = { estado: [], cancelar: [] };
    await mockSuscripcion(context, PRUEBA, calls);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);
    await page.locator("#profileBtn").click();
    await page.keyboard.press("Escape");
    await page.locator("details.pf-accordion > summary", { hasText: "Mi suscripción" }).click();
    const box = page.locator("#pfSubscriptionBox");
    await expect(box).toContainText("Semana gratis");
    await expect(box).toContainText("Gratis hasta" + enLima(PRUEBA.pruebaHasta));
    await expect(box).toContainText("Primer cobro" + enLima(PRUEBA.proximoCobro) + " · S/ 29.90");
    await expect(box).toContainText("Visa •••• 1111");
    await expect(box).not.toContainText("Renovar plan");
    expect(calls.estado[0]).toMatch(/^Bearer /);

    await box.getByRole("button", { name: "Cancelar suscripción" }).click();
    const sheet = page.locator("#overlay");
    await expect(sheet).toContainText("¿Cancelar tu suscripción?");
    await expect(sheet).toContainText("No se hará ningún cobro y conservas el acceso hasta el " + enLima(PRUEBA.accesoHasta) + ".");
    await sheet.getByRole("button", { name: "No, seguir suscrito" }).click();
    expect(calls.cancelar.length).toBe(0);

    await box.getByRole("button", { name: "Cancelar suscripción" }).click();
    await page.locator("#overlay").getByRole("button", { name: "Sí, cancelar" }).click();
    await expect(page.locator("#overlay")).toHaveCount(0);
    await expect(box).toContainText("Cancelada");
    await expect(box).toContainText("Acceso hasta" + enLima(PRUEBA.accesoHasta));
    await expect(box).toContainText("No se hará ningún cobro más.");
    await expect(box.getByRole("button", { name: "Cancelar suscripción" })).toHaveCount(0);
    expect(calls.cancelar).toHaveLength(1);
    expect(errors).toEqual([]);
  });

  test("/cuenta con la sesión de la app: ve el estado y cancela en la página", async ({ page, context }) => {
    await installMocks(context);
    const calls = { estado: [], cancelar: [] };
    await mockSuscripcion(context, { ...PRUEBA, estado: "active", pruebaHasta: null, proximoCobro: days(20), accesoHasta: days(20) }, calls);
    await seedLoggedInUser(page);
    const errors = collectConsoleErrors(page);
    await page.goto("/cuenta/");
    await expect(page.locator("#panel")).toBeVisible();
    await expect(page.locator("#login")).toBeHidden();
    await expect(page.locator("#filas")).toContainText("EstadoActiva");
    await expect(page.locator("#filas")).toContainText("Próximo cobro" + enLima(days(20)));
    await expect(page.locator("#filas")).toContainText("Visa •••• 1111");
    await page.getByRole("button", { name: "Cancelar suscripción" }).click();
    await expect(page.locator("#confirmarTxt")).toHaveText("¿Cancelar tu suscripción? No se harán más cobros y conservas el acceso hasta el " + enLima(days(20)) + ".");
    await page.getByRole("button", { name: "Sí, cancelar" }).click();
    await expect(page.locator("#resultado")).toContainText("tu suscripción está cancelada");
    await expect(page.locator("#filas")).toContainText("EstadoCancelada");
    await expect(page.getByRole("button", { name: "Cancelar suscripción" })).toBeHidden();
    expect(calls.cancelar).toHaveLength(1);
    expect(errors).toEqual([]);
  });

  test("/cuenta sin sesión: entra con correo y contraseña; sin suscripción lo dice", async ({ page, context }) => {
    await installMocks(context);
    const calls = { estado: [], cancelar: [] };
    await mockSuscripcion(context, null, calls);
    const tokenCalls = [];
    await context.route(SUPA_URL + "/auth/v1/token?grant_type=password", (route) => {
      tokenCalls.push(JSON.parse(route.request().postData() || "{}"));
      const ok = tokenCalls.at(-1).password === "clave-correcta";
      return route.fulfill({ status: ok ? 200 : 400, contentType: "application/json", body: JSON.stringify(ok ? { access_token: "tok-cuenta" } : { error: "invalid_grant" }) });
    });
    const errors = collectConsoleErrors(page);
    await page.goto("/cuenta/");
    await expect(page.locator("#login")).toBeVisible();
    await page.getByLabel("Correo").fill(USER_EMAIL);
    await page.getByLabel("Contraseña").fill("mala");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.locator("#loginError")).toHaveText("Correo o contraseña incorrectos.");
    await page.getByLabel("Contraseña").fill("clave-correcta");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.locator("#sinSuscripcion")).toBeVisible();
    await expect(page.locator("#sinSuscripcion")).toContainText("No tienes una suscripción activa");
    expect(calls.estado.at(-1)).toBe("Bearer tok-cuenta");
    expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => /auth-token/.test(k)))).toEqual([]);
    // Página pública sin desbordes en un celular.
    await page.setViewportSize({ width: 360, height: 740 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(errors.filter((e) => !/status of 400/.test(e))).toEqual([]);
  });
});
