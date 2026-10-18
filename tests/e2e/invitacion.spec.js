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

test("beta cerrada: registrarse pide el código y crea la cuenta con él (REQ-205)", async ({ page, context }) => {
  await installMocks(context);
  const errors = collectConsoleErrors(page);
  const sent = [];
  await page.route("**/api/entitlement", (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    sent.push(JSON.parse(route.request().postData() || "{}"));
    return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, entitlement: { duration_days: 90 } }) });
  });
  await page.goto("/index.html?codigo=FIT-AB12-CD34");
  await expect(page.locator("#au_code")).toHaveValue("FIT-AB12-CD34");
  await page.locator("#au_email").fill("ana@correo.test");
  await page.locator("#au_pwd").fill("ClaveSegura2026");
  await page.getByRole("button", { name: "Registrarme" }).click();
  await expect(page.locator("#au_email")).toHaveCount(0);
  expect(sent[0]).toEqual({ action: "invite-signup", code: "FIT-AB12-CD34", email: "ana@correo.test", password: "ClaveSegura2026" });
  expect(await page.evaluate(() => localStorage.getItem("evolv_invite_code"))).toBeNull();
  expect(errors).toEqual([]);
});

test("beta cerrada: sin código no se crea la cuenta (REQ-205)", async ({ page, context }) => {
  await installMocks(context);
  let posted = false;
  await page.route("**/api/entitlement", (route) => {
    if (route.request().method() === "POST") posted = true;
    return route.fallback();
  });
  await gotoApp(page);
  await page.getByRole("button", { name: "Ya tengo cuenta" }).click();
  await page.getByRole("button", { name: "¿No tienes cuenta? Regístrate" }).click();
  await expect(page.getByRole("link", { name: "Postula a la beta" })).toHaveAttribute("href", "beta-reclutamiento.html?source=registro");
  await page.locator("#au_email").fill("ana@correo.test");
  await page.locator("#au_pwd").fill("ClaveSegura2026");
  await page.getByRole("button", { name: "Registrarme" }).click();
  await expect(page.locator("#auOut")).toHaveText("Escribe tu código de invitación.");
  expect(posted).toBe(false);
});
