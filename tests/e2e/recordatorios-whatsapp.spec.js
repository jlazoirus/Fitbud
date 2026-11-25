// REQ-255: invitación semanal a activar los recordatorios y canal WhatsApp.
import { test, expect } from "@playwright/test";
import {
  installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges, completePrefs, USER_ID,
} from "./helpers.js";

const WA_CONFIG = { whatsapp: { enabled: true, number: "51999888777" } };
const inviteDialog = (page) => page.getByRole("dialog", { name: "¿Te recordamos tu día?" });
const dayMs = 24 * 3600 * 1000;
const isoAgo = (days) => new Date(Date.now() - days * dayMs).toISOString();
const writes = (calls, table) => calls.filter((c) => c.table === table && c.method !== "GET");
// Crear la fila de preferencias corta los correos del journey (REQ-296). El PATCH
// del resumen de racha (REQ-285) ya existía y no crea filas.
const prefsRowCreated = (calls) => calls.filter((c) => c.table === "notification_preferences" && c.method === "POST");
const lastPrefs = (calls) => {
  const w = writes(calls, "profiles").map((c) => (Array.isArray(c.payload) ? c.payload[0] : c.payload)).filter((p) => p && p.prefs);
  return w.length ? w[w.length - 1].prefs : null;
};

async function open(page, context, opts = {}) {
  const mocks = await installMocks(context, { reminderInvite: true, ...opts });
  await seedLoggedInUser(page);
  await autoDismissNudges(page); // la hoja de actividad ligera de Perfil
  const errors = collectConsoleErrors(page);
  await gotoApp(page);
  return { ...mocks, errors };
}

test.describe("Invitación a activar recordatorios (REQ-255)", () => {
  test("aparece al entrar; 'Ahora no' la calla una semana; a los 7 días vuelve", async ({ page, context }) => {
    const { calls, errors } = await open(page, context);
    const dialog = inviteDialog(page);
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Un aviso al día como máximo, a la hora que elijas, solo si te falta tu entreno o tus comidas.");
    await expect(dialog.getByRole("button", { name: "Correo" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "WhatsApp" })).toHaveCount(0); // sin configuración del servidor
    await expect(dialog).not.toContainText(/IA|inteligencia|modelo/);
    // Se guarda en el perfil (viaja entre dispositivos), nunca en notification_preferences.
    await expect.poll(() => lastPrefs(calls) && lastPrefs(calls).reminderInviteLastShownAt).toBeTruthy();
    expect(prefsRowCreated(calls)).toEqual([]);

    await dialog.getByRole("button", { name: "Ahora no" }).click();
    await expect(dialog).toHaveCount(0);
    await page.reload();
    await gotoApp(page);
    await page.waitForTimeout(2200);
    await expect(dialog).toHaveCount(0);

    // Pasaron 7 días: vuelve a aparecer al volver a la app.
    await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ last: new Date(Date.now() - 7 * 864e5 - 1000).toISOString() })), `evolv_reminder_invite_v1:${USER_ID}`);
    await page.evaluate(() => { profile.prefs.reminderInviteLastShownAt = new Date(Date.now() - 8 * 864e5).toISOString(); scheduleReminderInvite(0); });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    expect(prefsRowCreated(calls)).toEqual([]);
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  test("'No me interesa' no vuelve a mostrarla, ni la tarjeta de Hoy", async ({ page, context }) => {
    const { calls, errors } = await open(page, context);
    const dialog = inviteDialog(page);
    await dialog.getByRole("button", { name: "No me interesa" }).click();
    await expect(dialog).toHaveCount(0);
    await expect.poll(() => lastPrefs(calls) && lastPrefs(calls).reminderInviteDeclined).toBe(true);
    expect(prefsRowCreated(calls)).toEqual([]);
    await expect(page.locator(".notify-card")).toHaveCount(0);
    // Aunque pase la semana, no vuelve.
    await page.evaluate(() => { profile.prefs.reminderInviteLastShownAt = new Date(Date.now() - 30 * 864e5).toISOString(); scheduleReminderInvite(0); });
    await page.waitForTimeout(300);
    await expect(dialog).toHaveCount(0);
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  for (const [label, prefs, shown] of [
    ["'No me interesa'", { reminderInviteDeclined: true }, false],
    ["mostrada hace 3 días", { reminderInviteLastShownAt: isoAgo(3) }, false],
    ["mostrada hace 8 días", { reminderInviteLastShownAt: isoAgo(8) }, true],
  ]) {
    test(`otro dispositivo, con ${label} en el perfil: ${shown ? "aparece" : "no aparece"}`, async ({ page, context }) => {
      await open(page, context, { prefs: completePrefs(prefs) });
      if (shown) await expect(inviteDialog(page)).toBeVisible();
      else { await page.waitForTimeout(2200); await expect(inviteDialog(page)).toHaveCount(0); }
    });
  }

  test("con un recordatorio activo no aparece", async ({ page, context }) => {
    await open(page, context, {
      tables: { notification_preferences: { rows: [{ user_id: USER_ID, email_opt_in: true, notify_hour: 20 }] } },
    });
    await page.waitForTimeout(2200);
    await expect(inviteDialog(page)).toHaveCount(0);
  });

  test("no aparece encima de otro modal", async ({ page, context }) => {
    await installMocks(context, { reminderInvite: true });
    await seedLoggedInUser(page);
    await page.addInitScript(() => {
      // Un modal abierto antes de que toque la invitación.
      document.addEventListener("DOMContentLoaded", () => setTimeout(() => { if (typeof modal === "function") modal("<h3>Otro aviso</h3>"); }, 600));
    });
    await gotoApp(page);
    await expect(page.getByRole("dialog", { name: "Otro aviso" })).toBeVisible();
    await page.waitForTimeout(2000);
    await expect(inviteDialog(page)).toHaveCount(0);
    expect(await page.evaluate(() => reminderInviteState().last)).toBe("");
  });

});

test.describe("Invitación en un teléfono (REQ-255)", () => {
  test.use({ hasTouch: true }); // pointer:coarse activa los objetivos táctiles de 44 px (REQ-193)
  test("en un teléfono chico la hoja no se desborda", async ({ page, context }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await open(page, context, { config: WA_CONFIG });
    const dialog = inviteDialog(page);
    await expect(dialog).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    for (const name of ["WhatsApp", "Correo", "Ahora no", "No me interesa"]) {
      const box = await dialog.getByRole("button", { name }).boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe("WhatsApp en Perfil → Recordatorios (REQ-255)", () => {
  test("sin configuración del servidor no se ofrece", async ({ page, context }) => {
    await open(page, context, { reminderInvite: false });
    await page.locator("#profileBtn").click();
    await page.locator("#pfSecRecordatorios > summary").click();
    await expect(page.locator("#notif_hour")).toBeVisible();
    await expect(page.locator("#whatsappSection")).toBeEmpty();
  });

  test("activar abre WhatsApp con el código y, al volver vinculado, muestra el número enmascarado; desactivar", async ({ page, context }) => {
    const { tables, errors } = await open(page, context, { reminderInvite: false, config: WA_CONFIG });
    const requests = [];
    await context.route("**/api/whatsapp", async (route) => {
      const body = JSON.parse(route.request().postData() || "{}");
      requests.push({ body, auth: route.request().headers().authorization || "" });
      if (body.action === "link") {
        return route.fulfill({ status: 200, contentType: "application/json",
          body: JSON.stringify({ ok: true, code: "ABC234", url: "https://wa.me/51999888777?text=EVOLV%20ABC234" }) });
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    });
    await page.evaluate(() => { window.open = (url) => { window.__waOpened = url; return null; }; });
    await page.locator("#profileBtn").click();
    await page.locator("#pfSecRecordatorios > summary").click();
    const section = page.locator("#whatsappSection");
    await expect(section).toContainText("WhatsApp (Meta) recibe tu número y el texto del aviso");
    await section.getByRole("button", { name: "Activar en WhatsApp" }).click();
    await expect(section).toContainText("EVOLV ABC234");
    await expect(section.getByRole("link", { name: "Abrir WhatsApp" })).toHaveAttribute("href", "https://wa.me/51999888777?text=EVOLV%20ABC234");
    expect(await page.evaluate(() => window.__waOpened)).toBe("https://wa.me/51999888777?text=EVOLV%20ABC234");
    expect(requests[0].body.action).toBe("link");
    expect(requests[0].auth).toMatch(/^Bearer /);

    // El usuario envió el mensaje: el servidor ya vinculó el número.
    tables.whatsapp_links = { rows: [{ user_id: USER_ID, phone_e164: "51987654321", opted_in: true, paused_at: null, opted_out_at: null }] };
    await page.evaluate(() => refreshWhatsappAfterReturn());
    await expect(section).toContainText("Vinculado: +51 9•• ••• 321");
    await expect(page.locator("#app")).not.toContainText("51987654321");

    await section.getByRole("button", { name: "Desactivar WhatsApp" }).click();
    await expect(section.getByRole("button", { name: "Activar en WhatsApp" })).toBeVisible();
    expect(requests[requests.length - 1].body.action).toBe("unlink");
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  test("tras tres fallos de entrega pide volver a activarlo", async ({ page, context }) => {
    await open(page, context, {
      reminderInvite: false, config: WA_CONFIG,
      tables: { whatsapp_links: { rows: [{ user_id: USER_ID, phone_e164: "51987654321", opted_in: false, paused_at: new Date().toISOString(), opted_out_at: null }] } },
    });
    await page.locator("#profileBtn").click();
    await page.locator("#pfSecRecordatorios > summary").click();
    await expect(page.locator("#whatsappSection")).toContainText("No pudimos entregarte avisos por WhatsApp; vuelve a activarlos.");
  });

  test("la invitación ofrece WhatsApp cuando el servidor lo tiene", async ({ page, context }) => {
    await open(page, context, { config: WA_CONFIG });
    await expect(inviteDialog(page).getByRole("button", { name: "WhatsApp" })).toBeVisible();
  });
});
