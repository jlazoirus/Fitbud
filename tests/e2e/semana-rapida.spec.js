// REQ-336 (Diego, beta): "Preparando tu semana…" parecía colgado. Los 7 días de
// comidas (y las semanas de entreno) se pedían uno tras otro y la capa de espera
// tapaba el contador. Ahora van en paralelo y el progreso se ve en la capa.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges } from "./helpers.js";

test("la primera semana pide los días en paralelo y muestra el progreso en la capa de espera", async ({ page, context }) => {
  await installMocks(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const errors = collectConsoleErrors(page);
  await gotoApp(page);

  // Cada llamada al coach tarda 700 ms: en serie, 7 días serían ≥ 4,9 s.
  await page.evaluate(() => {
    const original = window.fetch;
    window.__coach = { inflight: 0, max: 0, calls: 0, details: [] };
    window.fetch = async (...args) => {
      if (!String(args[0]).includes("/api/claude")) return original(...args);
      const c = window.__coach;
      c.calls++; c.inflight++; c.max = Math.max(c.max, c.inflight);
      const detail = document.querySelector("#coach-busy .coach-busy-detail");
      if (detail && detail.textContent) c.details.push(detail.textContent);
      await new Promise((r) => setTimeout(r, 700));
      try { return await original(...args); } finally { c.inflight--; }
    };
  });

  const out = await page.evaluate(async () => {
    const t0 = performance.now();
    const res = await prepareFirstWeekNutrition(todayStr(), { current: "nutrition", done: [], failed: [], message: "" });
    return { ok: res.ok, days: res.daysData.length, ms: performance.now() - t0, ...window.__coach };
  });
  expect(out.ok).toBe(true);
  expect(out.calls).toBeGreaterThan(1);
  expect(out.max).toBeGreaterThan(1);
  expect(out.max).toBeLessThanOrEqual(4);
  expect(out.ms).toBeLessThan(4000);
  // El contador del día se ve dentro de la capa de espera.
  expect(out.details.some((t) => /Preparando comidas: \d+ de \d+ días/.test(t))).toBe(true);
  // Al terminar la capa se cierra y el detalle se limpia.
  await expect(page.locator("#coach-busy")).toBeHidden();
  expect(await page.evaluate(() => _coachBusyDetail)).toBe("");

  expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
});
