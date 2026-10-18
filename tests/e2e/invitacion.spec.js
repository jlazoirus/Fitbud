// REQ-203: el enlace de invitación a la beta abre el registro y canjea el
// código solo al iniciar sesión.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, gotoApp, autoDismissNudges, collectConsoleErrors } from "./helpers.js";

test("el enlace con ?codigo= abre el registro, guarda el código y limpia la URL", async ({ page, context }) => {
  await installMocks(context);
  const errors = collectConsoleErrors(page);
  await page.goto("/index.html?codigo=fit-ab12-cd34&source=whatsapp");
  await expect(page.locator("#au_email")).toBeVisible();
  await expect(page.getByRole("button", { name: "Registrarme" })).toBeVisible();
  await expect(page.locator(".auth-invite")).toContainText("Tu invitación a la beta está lista");
  expect(new URL(page.url()).search).toBe("?source=whatsapp");
  expect(await page.evaluate(() => localStorage.getItem("evolv_invite_code"))).toBe("FIT-AB12-CD34");
  expect(errors).toEqual([]);
});

function seedInvite(page, code) {
  return page.addInitScript((c) => localStorage.setItem("evolv_invite_code", c), code);
}

test("con sesión, el código pendiente se canjea solo y se borra", async ({ page, context }) => {
  await installMocks(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  await seedInvite(page, "FIT-AB12-CD34");
  const redeemed = [];
  await page.route("**/api/entitlement", (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    redeemed.push(JSON.parse(route.request().postData() || "{}"));
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ entitlement: { plan_id: "quarterly", status: "courtesy", origin: "coupon", duration_days: 90 } }),
    });
  });
  await gotoApp(page);
  await expect(page.locator("#toast")).toContainText("acceso completo por 90 días");
  expect(redeemed).toEqual([{ action: "redeem", code: "FIT-AB12-CD34" }]);
  expect(await page.evaluate(() => localStorage.getItem("evolv_invite_code"))).toBeNull();
});

test("un código ya usado avisa y no se vuelve a intentar", async ({ page, context }) => {
  await installMocks(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  await seedInvite(page, "FIT-AB12-CD34");
  await page.route("**/api/entitlement", (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    return route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ error: "Este código ya fue utilizado." }) });
  });
  await gotoApp(page);
  await expect(page.locator("#toast")).toContainText("Este código ya fue utilizado.");
  expect(await page.evaluate(() => localStorage.getItem("evolv_invite_code"))).toBeNull();
});
