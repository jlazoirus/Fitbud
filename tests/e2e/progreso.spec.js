// Journey (d): registrar peso en Progreso.
// Verifica que el número mostrado = el número guardado (invariante del auditor)
// y que la escritura viaja a weight_log vía la cola de sync.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges, completePrefs } from "./helpers.js";

test.describe("Progreso", () => {
  test("registrar peso semanal: se muestra, persiste y se sincroniza", async ({ page, context }) => {
    const { calls } = await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);

    await gotoApp(page);
    await page.locator("#tabs").getByText("Progreso").click();

    // La tabla de pesos semanales existe y la semana 1 acepta un registro
    const kgInput = page.getByLabel("Peso de la semana 1 en kilogramos");
    await expect(kgInput).toBeVisible();
    await kgInput.fill("74.4");
    await kgInput.blur();

    // 1) Lo mostrado persiste tras salir y volver a la vista
    await page.locator("#tabs").getByText("Hoy").click();
    await page.locator("#tabs").getByText("Progreso").click();
    await expect(page.getByLabel("Peso de la semana 1 en kilogramos")).toHaveValue("74.4");

    // 2) Lo mostrado = lo guardado en el estado local (fitbud_v1)
    const savedKg = await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem("fitbud_v1") || "{}");
      const w = s.weights || {};
      const entry = w[1] ?? w["1"];
      return entry && typeof entry === "object" ? Number(entry.kg) : Number(entry);
    });
    expect(savedKg).toBe(74.4);

    // 3) La escritura sale hacia weight_log (upsert de la cola de sync)
    await expect
      .poll(() => calls.filter((c) => c.table === "weight_log" && c.method === "POST").length, {
        timeout: 10_000,
      })
      .toBeGreaterThan(0);
    const upsert = calls.findLast((c) => c.table === "weight_log" && c.method === "POST");
    const row = Array.isArray(upsert.payload) ? upsert.payload[0] : upsert.payload;
    expect(Number(row.kg)).toBe(74.4);
    expect(Number(row.week)).toBe(1);

    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  test("REQ-164: en meta volumen, subir de peso se pinta como logro, no advertencia", async ({ page, context }) => {
    await installMocks(context, { prefs: completePrefs({ goal: "volumen" }) });
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);

    await gotoApp(page);
    await page.locator("#tabs").getByText("Progreso").click();

    // Dos semanas de peso ascendente (ganancia deliberada, on-target para volumen).
    await page.getByLabel("Peso de la semana 1 en kilogramos").fill("74");
    await page.getByLabel("Peso de la semana 1 en kilogramos").blur();
    await page.getByLabel("Peso de la semana 2 en kilogramos").fill("75");
    await page.getByLabel("Peso de la semana 2 en kilogramos").blur();

    const deltaCard = page.locator(".scard", { hasText: "Δ peso (sem)" }).locator(".n");
    await expect(deltaCard).toHaveText("+1.0");
    const color = await deltaCard.evaluate((el) => el.style.color);
    expect(color, "en volumen, ganar peso on-target debe pintarse como logro (--good), no advertencia (--warn)").toBe("var(--good)");

    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
});
