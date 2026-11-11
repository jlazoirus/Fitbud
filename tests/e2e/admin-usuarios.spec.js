// REQ-382: las acciones del panel de usuarios muestran que están en curso,
// confirman el resultado de forma visible y la cortesía incluye el coach.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, gotoApp, autoDismissNudges, profileFixture } from "./helpers.js";

const USER = { id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", email: "persona@correo.test", created_at: "2026-10-30T14:31:00Z", last_sign_in_at: null, is_admin: false, active: false, is_test_user: false };
const QUOTA = { policies: [], overrides: [], summary: {}, topConsumers: [], modelGate: [] };

async function openUsers(page, context) {
  const calls = [];
  let release = null;
  await installMocks(context, { tables: { profiles: { row: { ...profileFixture(), is_admin: true } } } });
  await page.addInitScript(() => { window.__forceAdminConsole = true; });
  await page.route("**/api/admin", async (route) => {
    const body = JSON.parse(route.request().postData() || "{}");
    calls.push(body);
    const json = (data, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) });
    if (body.action === "list") return json({ users: [{ ...USER }] });
    if (body.action === "quotaOverview") return json(QUOTA);
    if (body.action === "betaApplicants") return json({ applicants: [], counts: { pending: 0, invited: 0, closed: 0 } });
    // Respuesta lenta: el test controla cuándo termina para ver el estado en curso.
    await new Promise((resolve) => { release = resolve; });
    if (body.action === "setActive") return json({ ok: true, active: body.active });
    if (body.action === "resetUserToOnboarding") return json({ ok: true });
    if (body.action === "resetPassword") return json({ error: "Email rate limit exceeded" }, 429);
    if (body.action === "grantCourtesy") {
      const expires = new Date(Date.now() + body.days * 86400000).toISOString();
      return json({ ok: true, coachUnlimited: true, entitlement: { plan_id: body.planId, expires_at: expires } }, 201);
    }
    return json({ error: "Acción desconocida." }, 400);
  });
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  await gotoApp(page);
  await page.locator("#tabs").getByRole("button", { name: "Usuarios" }).click();
  const card = page.locator(`[data-admin-user="${USER.id}"]`);
  await expect(card).toBeVisible();
  return { calls, card, finish: async () => { await expect.poll(() => !!release).toBe(true); release(); release = null; } };
}

test("REQ-382: activar muestra que está en curso y confirma sin recargar la lista", async ({ page, context }) => {
  const { calls, card, finish } = await openUsers(page, context);
  await expect(card.getByRole("button", { name: "Cambiar contraseña" })).toHaveCount(0);
  await expect(card.getByRole("button", { name: "Restablecer contraseña" })).toBeVisible();
  await card.getByRole("button", { name: "Activar" }).click();
  const busy = card.getByRole("button", { name: "Activando…" });
  await expect(busy).toBeDisabled();
  await expect(busy).toHaveAttribute("aria-busy", "true");
  await expect(busy.locator(".spinner")).toBeVisible();
  await finish();
  await expect(page.locator("#toast")).toHaveClass(/show/);
  await expect(page.locator("#toast")).toHaveClass(/ok/);
  await expect(page.locator("#toast")).toContainText("persona@correo.test está activo");
  await expect(card.getByRole("button", { name: "Desactivar" })).toBeVisible();
  await expect(card.locator(".pill", { hasText: "inactivo" })).toHaveCount(0);
  expect(calls.filter((c) => c.action === "list")).toHaveLength(1);
  // El aviso se puede leer: sigue visible pasados los 1,6 s de antes.
  await page.waitForTimeout(1900);
  await expect(page.locator("#toast")).toHaveClass(/show/);
});

test("REQ-382: reiniciar usuario muestra el progreso y deja la confirmación en pantalla", async ({ page, context }) => {
  const { card, finish } = await openUsers(page, context);
  page.on("dialog", (dialog) => dialog.accept());
  await card.getByRole("button", { name: "Reiniciar usuario" }).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByRole("button", { name: "Sí, reiniciar usuario" }).click();
  await expect(sheet.getByRole("button", { name: "Reiniciando…" })).toBeDisabled();
  await expect(sheet.getByRole("button", { name: "Cancelar" })).toBeDisabled();
  await expect(sheet.getByText("no cierres esta ventana")).toBeVisible();
  await finish();
  await expect(sheet.getByRole("heading", { name: "Usuario reiniciado" })).toBeVisible();
  await expect(sheet).toContainText("persona@correo.test volverá a onboarding");
  await page.waitForTimeout(2500);
  await expect(sheet.getByRole("heading", { name: "Usuario reiniciado" })).toBeVisible();
  await sheet.getByRole("button", { name: "Listo" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("REQ-382: restablecer contraseña envía un correo y explica los errores", async ({ page, context }) => {
  const { calls, card, finish } = await openUsers(page, context);
  await card.getByRole("button", { name: "Restablecer contraseña" }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet).toContainText("Tú no la ves ni la eliges");
  await expect(sheet.locator("input[type=password]")).toHaveCount(0);
  await sheet.getByRole("button", { name: "Enviar correo" }).click();
  await expect(sheet.getByRole("button", { name: "Enviando…" })).toBeDisabled();
  await finish();
  await expect(sheet.getByRole("alert")).toContainText("límite de correos por hora");
  await expect(sheet.getByRole("button", { name: "Enviar correo" })).toBeEnabled();
  expect(calls.some((c) => c.action === "setPassword")).toBe(false);
});

test("REQ-382: la cortesía usa la duración del plan e incluye el coach sin tope", async ({ page, context }) => {
  const { calls, card, finish } = await openUsers(page, context);
  await card.getByRole("button", { name: "Cortesía" }).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByLabel("Plan").selectOption("semiannual");
  await expect(sheet.getByLabel("Días de acceso")).toHaveValue("180");
  await sheet.getByRole("button", { name: "Otorgar acceso" }).click();
  await expect(sheet.getByRole("button", { name: "Otorgando…" })).toBeDisabled();
  await finish();
  await expect(sheet.getByRole("heading", { name: "Cortesía activa" })).toBeVisible();
  await expect(sheet).toContainText("Paquete 6 meses por 180 días");
  await expect(sheet).toContainText("coach sin tope");
  const grant = calls.find((c) => c.action === "grantCourtesy");
  expect(grant).toMatchObject({ userId: USER.id, planId: "semiannual", days: 180 });
});
