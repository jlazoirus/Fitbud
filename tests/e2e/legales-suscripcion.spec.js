// REQ-354: términos y devoluciones de la suscripción mensual con 7 días gratis,
// detrás de TIENDA_SUSCRIPCION_ENABLED (tienda.suscripcion en /api/config; el
// servidor se prueba en scripts/test-tienda-culqi.mjs). Apagada, las páginas
// legales y /planes no cambian; encendida, conviven con los pagos únicos.
import { test, expect } from "@playwright/test";
import { installMocks, collectConsoleErrors } from "./helpers.js";

const BASE = {
  supabase: { url: "https://e2emock.supabase.co", publishableKey: "e2e-publishable-key" },
  anthropic: { model: "", proxy: true },
  signup: { mode: "invite" },
  culqi: { publicKey: "pk_test_e2e", enabled: true },
};
const config = (suscripcion) => ({ ...BASE, tienda: { usd: false, monedas: ["PEN"], monedaSugerida: "PEN", suscripcion } });

async function tienda(context, cfg) {
  await installMocks(context);
  await context.route("**/api/config", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(cfg) }));
}

test.describe("Legales de la suscripción (REQ-354)", () => {
  test("bandera apagada: términos, devoluciones y planes siguen diciendo pago único sin renovación", async ({ page, context }) => {
    await tienda(context, config(false));
    const errors = collectConsoleErrors(page);

    await page.goto("/terminos/");
    await expect(page.locator(".vigencia")).toHaveText("Vigentes desde el 13 de noviembre de 2026.");
    await expect(page.locator("main")).toContainText("No hay renovación automática ni cobros recurrentes");
    await expect(page.locator("main")).toContainText("Como no hay renovación automática, no tienes que cancelar nada");
    await expect(page.locator("#suscripcion")).toBeHidden();
    for (const n of await page.locator("[data-con-suscripcion]").all()) await expect(n).toBeHidden();

    await page.goto("/devoluciones/");
    await expect(page.locator("#suscripcion")).toBeHidden();
    await expect(page.locator(".vigencia")).toHaveText("Vigente desde el 13 de noviembre de 2026.");

    await page.goto("/planes/");
    await expect(page.locator("article.plan")).toHaveCount(3);
    await expect(page.locator("#notaSuscripcion")).toBeHidden();
    await expect(page.locator(".nota")).toContainText("Pago único, sin renovación automática.");
    await expect(page.locator(".nota")).not.toContainText("Planes de 1, 3 y 6 meses", { useInnerText: true });
    expect(errors).toEqual([]);
  });

  test("bandera encendida: la suscripción aparece con monto, prueba, cancelación, cobro fallido y devoluciones", async ({ page, context }) => {
    await tienda(context, config(true));
    const errors = collectConsoleErrors(page);

    await page.goto("/terminos/");
    await expect(page.locator(".vigencia")).toHaveText("Vigentes desde el 14 de noviembre de 2026.");
    const sus = page.locator("#suscripcion");
    await expect(sus.getByRole("heading", { name: "4.1 Suscripción mensual con 7 días gratis" })).toBeVisible();
    for (const t of [
      "al inscribirte tienes 7 días de acceso completo sin costo",
      "el día 8 se cobran S/ 29.90 a tu tarjeta",
      "te la recordamos por correo 2 días antes",
      "Una sola prueba por persona",
      "Culqi hace un cargo de S/ 3.00 y lo anula al instante",
      "debes marcar que aceptas la renovación automática",
      "La cancelación es inmediata y sin costo",
      "Conservas el acceso hasta el final del período ya pagado",
      "la suscripción se cancela sola",
      "al menos 30 días antes",
    ]) await expect(sus).toContainText(t);
    await expect(sus.locator('a[data-comercio="correo"]')).toHaveAttribute("href", /^mailto:/);
    await expect(sus.locator('[data-comercio="web"]')).toHaveText("https://evolvapp.club");
    // Lo que contradecía a la suscripción ya no se ve; los pagos únicos siguen descritos.
    await expect(page.getByText("No hay renovación automática ni cobros recurrentes")).toBeHidden();
    await expect(page.getByText("Como no hay renovación automática, no tienes que cancelar nada")).toBeHidden();
    await expect(page.locator("main")).toContainText("La Suscripción mensual se cobra cada mes de forma automática");
    await expect(page.locator("main")).toContainText("En los planes de pago único tienes 7 días calendario");

    await page.goto("/devoluciones/");
    await expect(page.locator(".vigencia")).toHaveText("Vigente desde el 14 de noviembre de 2026.");
    const dev = page.locator("#suscripcion");
    await expect(dev.getByRole("heading", { name: "2.1 Suscripción mensual" })).toBeVisible();
    for (const t of [
      "Cancelar evita los cobros siguientes",
      "si cancelas antes del día 8, no se cobra nada",
      "dentro de las 48 horas siguientes, te devolvemos el 100 %",
      "después de una cancelación registrada",
      "S/ 3.00",
    ]) await expect(dev).toContainText(t);
    await expect(page.locator("main")).toContainText("Este punto se aplica a los planes de pago único");

    await page.goto("/planes/");
    await expect(page.locator("article.plan")).toHaveCount(3);
    await expect(page.locator("#notaSuscripcion")).toContainText("desde el día 8, se cobran S/ 29.90 al mes a tu tarjeta hasta que canceles");
    await expect(page.locator("#notaSuscripcion").getByRole("link", { name: "Condiciones de la suscripción" })).toHaveAttribute("href", "/terminos#suscripcion");
    await expect(page.locator(".nota")).toContainText("Planes de 1, 3 y 6 meses: Pago único, sin renovación automática.", { useInnerText: true });
    expect(errors).toEqual([]);
  });

  test("si /api/config falla, las páginas quedan como hoy (sin suscripción)", async ({ page, context }) => {
    await installMocks(context);
    await context.route("**/api/config", (r) => r.fulfill({ status: 500, body: "x" }));
    await page.goto("/terminos/");
    await expect(page.locator("main")).toContainText("No hay renovación automática ni cobros recurrentes");
    await expect(page.locator("#suscripcion")).toBeHidden();
  });
});
