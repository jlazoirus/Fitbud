// REQ-208: con acceso beta (cupón o cortesía) o con la invitación aún sin
// canjear, ninguna pantalla muestra precios ni "activa tu plan".
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, gotoApp, autoDismissNudges, collectConsoleErrors } from "./helpers.js";

const days = (n) => new Date(Date.now() + n * 86400000).toISOString();
const PRICE_WORDS = /USD|Ver planes|Activa tu plan|Activar plan|Renovar/;

function mockEntitlement(page, data, { redeemStatus } = {}) {
  return page.route("**/api/entitlement**", (route) => {
    const req = route.request();
    if (req.url().includes("billing-history")) return route.fulfill({ status: 200, contentType: "application/json", body: '{"history":[]}' });
    if (req.method() === "POST") return route.fulfill({ status: redeemStatus || 503, contentType: "application/json", body: '{"error":"no disponible"}' });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(data) });
  });
}

async function openSubscription(page) {
  await page.locator("#tabs").getByText("Perfil").click();
  await page.keyboard.press("Escape");
  await page.locator("details.pf-accordion > summary", { hasText: "suscripción" }).click();
}

test("acceso beta: sin precios en las tabs, Perfil y el aviso que reemplaza al paywall", async ({ page, context }) => {
  await installMocks(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const errors = collectConsoleErrors(page);
  await mockEntitlement(page, {
    entitlement: { plan_id: "quarterly", status: "active", origin: "coupon", starts_at: days(-85), expires_at: days(5) },
    expired: null,
  });
  await gotoApp(page);
  for (const tab of ["Hoy", "Nutrición", "Entreno", "Progreso"]) {
    await page.locator("#tabs").getByText(tab).click();
    await expect(page.locator("#app")).not.toContainText(PRICE_WORDS);
  }
  await openSubscription(page);
  const app = page.locator("#app");
  await expect(app).toContainText("Acceso beta");
  await expect(app).toContainText("Tu acceso beta termina el");
  await expect(app).not.toContainText(PRICE_WORDS);
  await expect(app).not.toContainText("días restantes");

  await page.evaluate(() => showPaywall("trial_limit"));
  const sheet = page.locator("#overlay");
  await expect(sheet).toContainText("Tu acceso está activo");
  await expect(sheet).not.toContainText(PRICE_WORDS);
  expect(errors).toEqual([]);
});

test("invitación sin canjear: Perfil ofrece activarla, no planes", async ({ page, context }) => {
  await installMocks(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  await page.addInitScript(() => localStorage.setItem("evolv_invite_code", "FIT-AB12-CD34"));
  await mockEntitlement(page, {
    entitlement: null, expired: null,
    trial: { status: "active", starts_at: days(-1), expires_at: days(6), days_left: 6 },
  });
  await gotoApp(page);
  await openSubscription(page);
  const app = page.locator("#app");
  await expect(app).toContainText("Invitación a la beta");
  await expect(app.getByRole("button", { name: "Activar mi invitación" })).toBeVisible();
  await expect(app).not.toContainText(PRICE_WORDS);
  await page.evaluate(() => showPaywall("ai"));
  await expect(page.locator("#overlay")).toContainText("Tu invitación se está activando");
  await expect(page.locator("#overlay")).not.toContainText(PRICE_WORDS);
});

test("sin acceso ni invitación, el paywall sigue mostrando los planes", async ({ page, context }) => {
  await installMocks(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  await mockEntitlement(page, { entitlement: null, expired: null });
  await gotoApp(page);
  await page.evaluate(() => showPaywall("ai"));
  await expect(page.locator("#overlay")).toContainText("USD");
});
