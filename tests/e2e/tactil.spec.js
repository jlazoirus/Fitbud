// REQ-193: en pantallas táctiles todo control mide al menos 44×44 px
// (o amplía su área táctil con ::after sin cambiar el tamaño visual).
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, gotoApp, autoDismissNudges } from "./helpers.js";

test.use({ hasTouch: true, isMobile: true });

async function smallTargets(page) {
  return page.evaluate(() => {
    const MIN = 44;
    const out = [];
    for (const el of document.querySelectorAll("button,a[href],input,select,textarea,[role=button],summary")) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || getComputedStyle(el).visibility === "hidden") continue;
      // Un checkbox/radio dentro de un label cuenta con el área del label
      const host = /^(checkbox|radio)$/.test(el.type) && el.closest("label") ? el.closest("label") : el;
      const hr = host.getBoundingClientRect();
      const after = getComputedStyle(el, "::after");
      const pad = after.content !== "none" && after.position === "absolute" ? -parseFloat(after.top) || 0 : 0;
      const w = hr.width + 2 * pad, h = hr.height + 2 * pad;
      // Los textos de enlace dentro de un párrafo quedan fuera de la regla (WCAG 2.5.8, excepción inline)
      if (el.tagName === "A" && getComputedStyle(el).display === "inline") continue;
      if (w < MIN - 0.5 || h < MIN - 0.5) out.push(`${Math.round(w)}x${Math.round(h)} ${el.outerHTML.slice(0, 90)}`);
    }
    return out;
  });
}

test("REQ-193: los controles de las 5 tabs miden ≥44 px en táctil", async ({ page, context }) => {
  await installMocks(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  await gotoApp(page);

  const found = {};
  for (const tab of ["Hoy", "Nutrición", "Entreno", "Progreso", "Perfil"]) {
    await page.locator("#tabs").getByText(tab).click();
    if (tab === "Perfil") {
      await page.keyboard.press("Escape");
      for (const summary of await page.locator("details.pf-accordion > summary").all()) await summary.click();
    }
    const small = await smallTargets(page);
    if (small.length) found[tab] = small;
  }
  expect(found).toEqual({});
});
