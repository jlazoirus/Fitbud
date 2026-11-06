// REQ-198: portada "Escalera de días". REQ-352: la portada es una página propia
// en "/" (index.html + web/portada.js), separada de la app, que vive en /app.
import { test, expect } from "@playwright/test";
import { installMocks, collectConsoleErrors, gotoPortada, seedLoggedInUser } from "./helpers.js";

test.describe("Portada", () => {
  test("la demo del día cambia el plan con cada imprevisto y vuelve al tocarlo otra vez", async ({ page, context }) => {
    await installMocks(context);
    const errors = collectConsoleErrors(page);
    await gotoPortada(page);

    const demo = page.locator(".l-demo");
    await expect(demo).toContainText("Ejemplo");
    const train = demo.locator('[data-row="train"] .l-demo-name');
    await expect(train).toHaveText("Fuerza · Tren superior");

    const corto = demo.getByRole("button", { name: "Solo tengo 20 min" });
    await corto.click();
    await expect(corto).toHaveAttribute("aria-pressed", "true");
    await expect(train).toHaveText("Circuito exprés");

    await demo.getByRole("button", { name: "Como fuera" }).click();
    await expect(corto).toHaveAttribute("aria-pressed", "false");
    await expect(demo.locator('[data-row="lunch"] .l-demo-name')).toContainText("Pollo a la brasa");
    await expect(train).toHaveText("Fuerza · Tren superior");

    await demo.getByRole("button", { name: "Como fuera" }).click();
    await expect(demo.locator('[data-row="lunch"] .l-demo-name')).toHaveText("Arroz con lentejas y huevo");
    expect(errors).toEqual([]);
  });

  test("sin emoji ni vocabulario interno; planes de la tienda y acceso a la app (REQ-202, REQ-333)", async ({ page, context }) => {
    await installMocks(context);
    await gotoPortada(page);
    const text = await page.locator(".landing").innerText();
    expect(text).not.toMatch(/\p{Emoji_Presentation}/u);
    expect(text).not.toMatch(/\b(IA|Claude|Anthropic|prompt|tokens?|modelo de lenguaje)\b/i);
    expect(text).not.toMatch(/Perú|Chile|México/); // REQ-223
    await expect(page.locator(".l-step")).toHaveCount(5);
    // REQ-333: cada plan de la tienda (soles, tienda/planes.js) lleva a pagar con Culqi.
    await expect(page.locator(".l-plan-store")).toHaveCount(3);
    await expect(page.locator(".l-plan-price").first()).toContainText("29.90");
    await expect(page.locator(".l-plan a.l-btn").first()).toHaveAttribute("href", "/pago?plan=monthly");
    await expect(page.locator("[data-lcomercio]")).toContainText("RUC");
    // "Ya tengo cuenta" e "Iniciar sesión" llevan a la app, que muestra su inicio de sesión.
    await expect(page.locator(".landing-nav").getByRole("link", { name: "Iniciar sesión" })).toHaveAttribute("href", "/app");
    await page.getByRole("link", { name: "Ya tengo cuenta" }).click();
    await expect(page).toHaveURL(/\/app\/?$/);
    await expect(page.locator("#au_email")).toBeVisible();
  });

  test("REQ-352: la portada no carga la app, Supabase ni /api/config", async ({ page, context }) => {
    await installMocks(context);
    const requested = [];
    page.on("request", (r) => requested.push(new URL(r.url()).pathname + (r.url().includes("supabase") ? " [supabase]" : "")));
    await gotoPortada(page);
    expect(requested.filter((u) => /\/app\/|\/api\/config|\[supabase\]|exercise-catalog|nutrition-domain/.test(u))).toEqual([]);
    expect(await page.evaluate(() => typeof window.render === "undefined" && !document.querySelector("#app"))).toBe(true);
  });

  test("REQ-352: con sesión guardada, enlaces de la app o la app instalada, la portada lleva a /app con lo mismo", async ({ page, context }) => {
    await installMocks(context);
    // Enlace de invitación de un correo antiguo (/?codigo=…): llega a la app con la misma consulta,
    // y la app guarda el código para canjearlo (y lo quita de la barra de direcciones).
    const toApp = page.waitForRequest((r) => /\/app\/?\?codigo=FIT-AB12-CD34&source=whatsapp$/.test(r.url()));
    await page.goto("/?codigo=FIT-AB12-CD34&source=whatsapp");
    await toApp;
    await expect.poll(() => page.evaluate(() => localStorage.getItem("evolv_invite_code"))).toBe("FIT-AB12-CD34");
    // Hash de Supabase (invitación o recuperación): se conserva al pasar a /app.
    const urls = [];
    page.on("framenavigated", (f) => { if (f === page.mainFrame()) urls.push(f.url()); });
    await page.goto("/#access_token=x&type=invite");
    await expect.poll(() => urls.some((u) => /\/app\/?#access_token=x&type=invite$/.test(u))).toBe(true);
    // App instalada antes de REQ-352 (start_url "/").
    const installed = await context.newPage();
    await installed.addInitScript(() => {
      const real = window.matchMedia.bind(window);
      window.matchMedia = (q) => (q.includes("display-mode: standalone") ? { matches: true, media: q, addEventListener() {}, removeEventListener() {} } : real(q));
    });
    await installed.goto("/");
    await expect(installed).toHaveURL(/\/app\/?$/);
    await installed.close();
    // Con sesión guardada, directo a la app.
    await seedLoggedInUser(page);
    await page.goto("/");
    await expect(page).toHaveURL(/\/app\/?$/);
  });

  test.describe("escritorio", () => {
    test.use({ viewport: { width: 1440, height: 900 } });
    test("la escalera se enciende peldaño a peldaño al bajar", async ({ page, context }) => {
      await installMocks(context);
      await gotoPortada(page);
      const rail = page.locator(".l-stair-rail");
      await expect(rail).toBeVisible();
      await expect(rail).toHaveAttribute("data-lit", "1");

      await rail.getByRole("button", { name: "Cada semana" }).click();
      await expect(rail).toHaveAttribute("data-lit", "4");
      await expect(rail.locator(".tr.lit")).toHaveCount(4);
      await expect(rail.getByRole("button", { name: "Cada semana" })).toHaveAttribute("aria-current", "step");
      // Sigue a la vista (sticky) mientras se recorren los escalones
      expect(await rail.evaluate((el) => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; })).toBe(true);
    });
  });
});
