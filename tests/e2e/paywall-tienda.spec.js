// REQ-350: con Culqi activo, el aviso de plan de la app web vende los planes de
// la tienda en soles y lleva a /pago con el correo de la cuenta. Sin Culqi, sigue
// igual que antes (beta-acceso.spec.js); con acceso beta, nunca hay precios.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, gotoApp, autoDismissNudges, collectConsoleErrors, USER_EMAIL } from "./helpers.js";

const days = (n) => new Date(Date.now() + n * 86400000).toISOString();

async function culqiOn(context) {
  await context.route("**/api/config", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        supabase: { url: "https://e2emock.supabase.co", publishableKey: "e2e-publishable-key" },
        anthropic: { model: "", proxy: true },
        signup: { mode: "invite" },
        culqi: { publicKey: "pk_test_e2e", enabled: true },
      }),
    }),
  );
}

// Estado del acceso que cambia durante la prueba (p. ej. al pagar en /pago).
function mockEntitlement(page, state) {
  return page.route("**/api/entitlement**", (route) => {
    if (route.request().url().includes("billing-history")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: '{"history":[]}' });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(state.data) });
  });
}

test("Culqi activo: el aviso de plan muestra los planes en soles y lleva a /pago con el correo de la cuenta", async ({ page, context }) => {
  await installMocks(context);
  await culqiOn(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const errors = collectConsoleErrors(page);
  await mockEntitlement(page, { data: { entitlement: null, expired: null, trial: { status: "exhausted", days_left: 0 } } });
  await gotoApp(page);

  await page.evaluate(() => showPaywall("trial_limit"));
  const sheet = page.locator("#overlay");
  await expect(sheet).toContainText("ya usaste tus cambios incluidos");
  await expect(sheet.locator(".paywall-plan")).toHaveCount(3);
  await expect(sheet.locator(".paywall-plan-price")).toHaveText([/S\/ 29\.90/, /S\/ 79\.90/, /S\/ 149\.90/]);
  await expect(sheet).not.toContainText("USD");
  await expect(sheet).not.toContainText("Disponible pronto");
  await expect(sheet.getByText("¿Tienes un código de acceso?")).toBeVisible();
  await expect(sheet.getByRole("link", { name: "Comprar plan mensual" })).toHaveAttribute("href", "/pago?plan=monthly");

  await sheet.getByRole("link", { name: "Comprar plan trimestral" }).click();
  await expect(page).toHaveURL(/\/pago\/?\?plan=quarterly$/);
  await expect(page.locator("h1")).toHaveText("Pagar plan trimestral");
  await expect(page.getByLabel("Correo")).toHaveValue(USER_EMAIL);
  expect(errors).toEqual([]);
});

test("Renovar plan en Perfil abre el mismo aviso y, al volver tras pagar, el plan aparece activo", async ({ page, context }) => {
  await installMocks(context);
  await culqiOn(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const state = { data: { entitlement: { plan_id: "monthly", status: "active", origin: "checkout", starts_at: days(-25), expires_at: days(5) }, expired: null } };
  await mockEntitlement(page, state);
  await gotoApp(page);

  await page.locator("#tabs").getByText("Perfil").click();
  await page.keyboard.press("Escape");
  await page.locator("details.pf-accordion > summary", { hasText: "suscripción" }).click();
  await page.getByRole("button", { name: "Renovar plan" }).click();
  const sheet = page.locator("#overlay");
  await expect(sheet.locator(".paywall-plan")).toHaveCount(3);
  await sheet.getByRole("link", { name: "Comprar plan mensual" }).click();
  await expect(page).toHaveURL(/\/pago\/?\?plan=monthly$/);

  // Pagó en /pago: el servidor ya tiene el plan extendido. Vuelve con "atrás".
  state.data = { entitlement: { plan_id: "monthly", status: "active", origin: "checkout", starts_at: days(-25), expires_at: days(35) }, expired: null };
  await page.goBack();
  await expect(page.locator("#toast, .toast").first()).toContainText("Tu plan está activo hasta el");
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("evolv_store_checkout_v1"))).toBeNull();
});

test("Culqi activo con acceso beta: el aviso no muestra precios", async ({ page, context }) => {
  await installMocks(context);
  await culqiOn(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  await mockEntitlement(page, { data: { entitlement: { plan_id: "quarterly", status: "active", origin: "coupon", starts_at: days(-10), expires_at: days(80) }, expired: null } });
  await gotoApp(page);
  await page.evaluate(() => showPaywall("ai"));
  const sheet = page.locator("#overlay");
  await expect(sheet).toContainText("Tu acceso está activo");
  await expect(sheet).not.toContainText(/S\/|USD|Comprar/);
});
