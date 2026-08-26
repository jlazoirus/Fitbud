// Journey auth-roles: aislamiento de la cola offline entre usuarios en un
// dispositivo compartido (REQ-156). La purga debe ocurrir en TODOS los
// caminos de cierre de sesión, no solo al pulsar el botón — incluido el
// evento SIGNED_OUT que dispara Supabase por token vencido, revocación
// remota o logout propagado desde otra pestaña.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges, USER_ID } from "./helpers.js";

test.describe("Aislamiento de sesión — cola offline", () => {
  test("REQ-156: el evento SIGNED_OUT (no el botón) también purga la cola del usuario saliente", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);

    await gotoApp(page);

    // Encola una mutación con datos de salud del usuario logueado.
    await page.evaluate(() => enqueueMutation("weight_log", "w1", { week: 1, kg: 81.4 }));
    const seeded = await page.evaluate(() => _getSyncQ().filter((x) => x.uid === uid()).length);
    expect(seeded, "la mutación debe quedar encolada antes de cerrar sesión").toBe(1);

    // Dispara el cierre de sesión por el camino de EVENTO, no por el botón
    // "Cerrar sesión" de la app (signOutUser) — llama directo al cliente de
    // Supabase, igual que dispararía un token vencido o un logout remoto:
    // ambos terminan en el mismo callback onAuthStateChange('SIGNED_OUT', null).
    await page.evaluate(() => supa.auth.signOut());

    await expect
      .poll(() => page.evaluate((uidValue) => _getSyncQ().filter((x) => x.uid === uidValue).length, USER_ID), {
        timeout: 5_000,
      })
      .toBe(0);

    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
});
