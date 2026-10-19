// REQ-218: el admin ve a los postulantes de la beta, acepta (90 días + mensaje
// de WhatsApp listo) o descarta, sin salir de la app.
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
  expect(calls.filter((c) => c.action === "betaAccept")).toEqual([{ action: "betaAccept", id: 7 }]);
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
