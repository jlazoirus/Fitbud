// REQ-218/REQ-225: el admin ve a los postulantes de la beta y acepta (invitación
// por correo con 90 días; enlace de respaldo si no hay correo) o descarta.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, gotoApp, autoDismissNudges, profileFixture, collectConsoleErrors } from "./helpers.js";

const ANA = {
  id: 7, created_at: "2026-10-18T15:00:00Z", name: "Ana Pérez", whatsapp: "+51 999 111 222",
  age_band: "25-34", country_city: "Lima, Perú", source: "ig-julio", stage: "returning",
  goal: "Ganar musculo", tools: ["App de tracking"], pains: ["Abandono despues de 1-3 semanas"],
  story: "Dejé el gym cuando cambió mi horario.", investment: "time", availability: "interview_beta",
  health: "clear", segment: "B - Principiante guiado", priority: "Alta", priority_score: 9,
  beta_eligible: true, status: "new", review_notes: null,
};

test("REQ-218: aceptar a una postulante crea su acceso y deja el WhatsApp listo", async ({ page, context }) => {
  await installMocks(context, { tables: { profiles: { row: { ...profileFixture(), is_admin: true } } } });
  await page.addInitScript(() => { window.__forceAdminConsole = true; }); // REQ-308: la consola vive en /admin
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const errors = collectConsoleErrors(page);
  const calls = [];
  let status = "new";
  await page.route("**/api/admin", (route) => {
    const body = JSON.parse(route.request().postData() || "{}");
    calls.push(body);
    const json = (data) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(data) });
    if (body.action === "betaApplicants") {
      const rows = (body.filter === "pending" && status === "new") || (body.filter === "invited" && status === "beta_invited") ? [{ ...ANA, status }] : [];
      return json({ applicants: rows, counts: { pending: status === "new" ? 1 : 0, invited: status === "beta_invited" ? 1 : 0, closed: 0 } });
    }
    if (body.action === "betaAccept") {
      status = "beta_invited";
      return json({
        applicant: { ...ANA, status }, code: "FIT-AB12-CD34", days: 90, validUntil: "2026-11-18T15:00:00Z",
        link: "https://evolvapp.club/?codigo=FIT-AB12-CD34",
        message: "Hola Ana, te escribimos de Evolv. https://evolvapp.club/?codigo=FIT-AB12-CD34",
        whatsappUrl: "https://wa.me/51999111222?text=Hola%20Ana",
      });
    }
    return json({});
  });
  await gotoApp(page);
  await page.evaluate(() => setView("adminBeta"));

  await expect(page.getByRole("heading", { name: "Postulantes beta" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Por revisar (1)" })).toHaveAttribute("aria-pressed", "true");
  const card = page.locator("#betaList .meal").first();
  await expect(card).toContainText("Ana Pérez");
  await expect(card).toContainText("Ganar músculo");
  await expect(card.getByRole("link", { name: "Abrir WhatsApp" })).toHaveAttribute("href", "https://wa.me/51999111222");

  await card.getByRole("button", { name: "Aceptar (90 días)" }).click();
  await expect(page.getByRole("heading", { name: "Ana está dentro" })).toBeVisible();
  await expect(page.locator("#betaInviteMsg")).toHaveValue(/codigo=FIT-AB12-CD34/);
  await expect(page.getByRole("link", { name: "Enviar por WhatsApp" })).toHaveAttribute("href", /^https:\/\/wa\.me\/51999111222\?text=/);
  const accepts = calls.filter((c) => c.action === "betaAccept");
  expect(accepts).toHaveLength(1);
  expect(accepts[0]).toMatchObject({ action: "betaAccept", id: 7 });
  await expect(page.getByRole("button", { name: "Aceptados (1)" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("REQ-218: un usuario normal no entra a la pantalla de postulantes", async ({ page, context }) => {
  await installMocks(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  await gotoApp(page);
  await page.evaluate(() => setView("adminBeta"));
  await expect(page.getByRole("heading", { name: "Postulantes beta" })).toHaveCount(0);
});

test("REQ-225: con correo, aceptar envía la invitación por correo y avisa de pendientes en Hoy", async ({ page, context }) => {
  await installMocks(context, { tables: { profiles: { row: { ...profileFixture(), is_admin: true } } } });
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const calls = [];
  let status = "new";
  await page.route("**/api/admin", (route) => {
    const body = JSON.parse(route.request().postData() || "{}");
    calls.push(body);
    const json = (data) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(data) });
    if (body.action === "betaApplicants") {
      const rows = body.filter === "pending" && status === "new" ? [{ ...ANA, email: "ana@correo.test", status }] : [];
      return json({ applicants: rows, counts: { pending: status === "new" ? 1 : 0, invited: status === "new" ? 0 : 1, closed: 0 } });
    }
    if (body.action === "betaAccept") {
      status = "beta_invited";
      return json({ mode: "email", email: "ana@correo.test", days: 90, betaError: "", applicant: { ...ANA, email: "ana@correo.test", status }, message: "Hola Ana, ¡ya estás en la beta de Evolv! Te acabo de enviar un correo a ana@correo.test", whatsappUrl: "https://wa.me/51999111222?text=Hola%20Ana" });
    }
    return json({});
  });
  await gotoApp(page);
  await expect(page.getByText("1 postulación espera tu revisión")).toBeVisible();
  // REQ-308: la tarjeta de Hoy enlaza a la consola separada en /admin
  await page.getByRole("button", { name: "Revisar" }).click();
  await expect(page).toHaveURL(/\/admin\?ver=postulantes$/);
  await page.addInitScript(() => { window.__forceAdminConsole = true; });
  await page.goto("/index.html");
  await page.waitForFunction(() => typeof profile !== "undefined" && profile && !_authBusy, { timeout: 15_000 });
  const card = page.locator("#betaList .meal").first();
  await expect(card).toContainText("ana@correo.test");
  await card.getByRole("button", { name: "Aceptar (90 días)" }).click();
  await expect(page.getByRole("dialog")).toContainText("Le enviamos la invitación a ana@correo.test");
  await expect(page.locator("#betaInviteMsg")).toHaveValue(/Te acabo de enviar un correo a ana@correo\.test/);
  await expect(page.getByRole("link", { name: "Enviar por WhatsApp" })).toHaveAttribute("href", /^https:\/\/wa\.me\/51999111222\?text=/);
  const accept = calls.find((c) => c.action === "betaAccept");
  expect(accept).toMatchObject({ id: 7 });
  expect(accept.redirectTo).toContain("/");
  expect(accept.channel).toBeUndefined();
});

test("REQ-226: el enlace del correo de aviso abre Postulantes beta al admin", async ({ page, context }) => {
  await installMocks(context, { tables: { profiles: { row: { ...profileFixture(), is_admin: true } } } });
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  await page.route("**/api/admin", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ applicants: [], counts: { pending: 0, invited: 0, closed: 0 } }) }));
  // REQ-308: el enlace apunta a la consola; si llega a la app, redirige a /admin
  await page.goto("/index.html?ver=postulantes");
  await page.waitForURL(/\/admin\?ver=postulantes$/, { timeout: 15_000 });
  await page.addInitScript(() => { window.__forceAdminConsole = true; });
  await page.goto("/index.html?ver=postulantes");
  await expect(page.getByRole("heading", { name: "Postulantes beta" })).toBeVisible();
  await page.waitForFunction(() => window.location.search === "");
});
