// REQ-190: tras registrarse (correo sin confirmar) se reemplaza el formulario
// por una pantalla "Revisa tu correo", con reenvío y paso a iniciar sesión.
import { test, expect } from "@playwright/test";
import { installMocks, gotoApp, SUPA_URL } from "./helpers.js";

test("registro sin sesión muestra la pantalla de confirmar correo", async ({ page, context }) => {
  await installMocks(context);
  const calls = [];
  await context.route(`${SUPA_URL}/auth/v1/signup**`, (route) => {
    calls.push("signup");
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      id: "11111111-2222-3333-4444-555555555555", aud: "authenticated", role: "authenticated",
      email: "nuevo@correo.test", confirmation_sent_at: new Date().toISOString(), identities: [{ id: "x" }],
      app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString(),
    }) });
  });
  await context.route(`${SUPA_URL}/auth/v1/resend**`, (route) => {
    calls.push("resend");
    return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
  await page.addInitScript(() => localStorage.setItem("fitbros_tour_v1", "done"));
  await gotoApp(page);

  await page.getByRole("button", { name: /Crear mi cuenta gratis/i }).first().click();
  const app = page.locator("#app");
  await app.locator("#au_email").fill("nuevo@correo.test");
  await app.locator("#au_pwd").fill("ClaveSegura2026");
  await app.getByRole("button", { name: "Registrarme" }).click();

  await expect(app.getByRole("heading", { name: "Revisa tu correo" })).toBeVisible();
  await expect(app).toContainText("nuevo@correo.test");
  await expect(app.locator("#au_email")).toHaveCount(0);
  await expect(app.locator("#au_pwd")).toHaveCount(0);

  await app.getByRole("button", { name: "Reenviar correo" }).click();
  await expect(app).toContainText("te enviamos otro enlace");
  expect(calls).toEqual(["signup", "resend"]);

  await app.getByRole("button", { name: "Ya confirmé, iniciar sesión" }).click();
  await expect(app.locator("#au_email")).toHaveValue("nuevo@correo.test");
  await expect(app.getByRole("button", { name: "Entrar" })).toBeVisible();
});
