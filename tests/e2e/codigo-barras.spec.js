// REQ-273: código GTIN privado en tus alimentos, búsqueda por código escrito y
// escaneo solo donde el navegador trae BarcodeDetector. Sin servicios externos;
// un código desconocido ofrece alta manual, nunca un registro automático.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges, completePrefs } from "./helpers.js";

const YOGUR = { id: "fyogur01", name: "Yogur natural", brand: "Gloria", unit: "100g", base: { kcal: 59, p: 10, c: 3.6, f: 0.4 }, portion: { label: "1 pote", amount: 125 }, gtin: "036000291452", version: 1 };
async function setup(page, context, { scanner, codes } = {}) {
  if (scanner) {
    await page.addInitScript(({ mode, codes }) => {
      window.__scanCodes = codes || [];
      window.BarcodeDetector = class {
        static async getSupportedFormats() { return ["ean_13", "ean_8", "upc_a"]; }
        async detect() { return window.__scanCodes.map((rawValue) => ({ rawValue, format: "ean_13" })); }
      };
      navigator.mediaDevices.getUserMedia = async () => {
        if (mode === "denied") throw new DOMException("Permission denied", "NotAllowedError");
        const c = document.createElement("canvas"); c.width = 4; c.height = 4; c.getContext("2d").fillRect(0, 0, 4, 4);
        const stream = c.captureStream(5);
        window.__stream = stream;
        return stream;
      };
    }, { mode: scanner, codes });
  }
  const mocks = await installMocks(context, { prefs: completePrefs({ customFoods: [YOGUR] }) });
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const errors = collectConsoleErrors(page);
  await gotoApp(page);
  await page.locator("#tabs").getByText("Nutrición").click();
  await page.getByRole("button", { name: /Agregar comida \/ snack/i }).first().click();
  const overlay = page.locator("#overlay");
  await overlay.locator('.qp-tab[data-tab="food"]').click();
  return { overlay, errors, calls: mocks.calls };
}

test("código escrito: encuentra la presentación (aunque se lea como EAN-13), rechaza dígito de control y ofrece alta", async ({ page, context }) => {
  const { overlay, errors, calls } = await setup(page, context);
  // Sin BarcodeDetector no se anuncia escaneo: se ofrece escribir el código.
  await expect(overlay.getByRole("button", { name: /Escanear código/ })).toHaveCount(0);
  await expect(overlay.locator("#qpScanRow")).toHaveText("También puedes escribir el número del código de barras.");

  await overlay.locator("#qpSearch").fill("0 036000 291452");
  await expect(overlay.locator("#qpList")).toContainText("Tus alimentos con el código 0036000291452");
  await expect(overlay.locator("#qpList")).toContainText("Yogur natural");
  await expect(overlay.locator("#qpList")).toContainText("Confirma que coincide con la etiqueta y la cantidad");

  await overlay.locator("#qpSearch").fill("4006381333932");
  await expect(overlay.locator("#qpList")).toContainText("el último dígito no coincide");

  await overlay.locator("#qpSearch").fill("4006381333931");
  await expect(overlay.locator("#qpList")).toContainText("Este código no está en tus alimentos.");
  await overlay.getByRole("button", { name: "＋ Crear alimento con este código" }).click();
  await expect(overlay.locator("#cf_gtin")).toHaveValue("4006381333931");
  await expect(overlay.locator("#cf_name")).toHaveValue("");
  // Nada se registró por leer un código.
  expect(await page.evaluate(() => dayState(todayStr()).extras.length)).toBe(0);
  await overlay.locator("#cf_name").fill("Yogur natural 1 kg");
  await overlay.locator("#cf_brand").fill("Gloria");
  for (const [k, v] of Object.entries({ kcal: "59", p: "10", c: "3,6", f: "0,4" })) await overlay.locator("#cf_" + k).fill(v);

  // Mismo código que otra presentación: error.
  await overlay.locator("#cf_gtin").fill("036000291452");
  await overlay.getByRole("button", { name: "Guardar alimento" }).click();
  await expect(overlay.locator("#cf_errors")).toContainText("Ese código ya está en «Yogur natural (Gloria)»");
  await overlay.locator("#cf_gtin").fill("4006381333931");
  await overlay.getByRole("button", { name: "Guardar alimento" }).click();
  await expect(overlay.locator(".cf-form")).toHaveCount(0);
  const foods = calls.filter((c) => c.table === "profiles" && c.payload && c.payload.prefs).at(-1).payload.prefs.customFoods;
  expect(foods.map((f) => [f.name, f.gtin])).toEqual([["Yogur natural 1 kg", "4006381333931"], ["Yogur natural", "036000291452"]]);
  expect(errors).toEqual([]);
});

test("escaneo con BarcodeDetector: lee, busca y exige confirmar; cancelar apaga la cámara", async ({ page, context }) => {
  const { overlay } = await setup(page, context, { scanner: "ok", codes: [] });
  await overlay.getByRole("button", { name: "📷 Escanear código de barras" }).click();
  await expect(overlay.locator("#qpScanVideo")).toBeVisible();
  await overlay.getByRole("button", { name: "Cancelar" }).click();
  await expect(overlay.locator("#qpScanVideo")).toHaveCount(0);
  expect(await page.evaluate(() => window.__stream.getTracks().every((t) => t.readyState === "ended"))).toBe(true);

  await page.evaluate(() => { window.__scanCodes = ["0036000291452"]; });
  await overlay.getByRole("button", { name: "📷 Escanear código de barras" }).click();
  await expect(overlay.locator("#qpSearch")).toHaveValue("0036000291452");
  await expect(overlay.locator("#qpList")).toContainText("Yogur natural");
  expect(await page.evaluate(() => window.__stream.getTracks().every((t) => t.readyState === "ended"))).toBe(true);
  expect(await page.evaluate(() => dayState(todayStr()).extras.length)).toBe(0);
  await overlay.locator("#qpList .qp-item", { hasText: "Yogur natural" }).getByRole("button", { name: "Añadir" }).click();
  await expect(overlay.locator("#f_kcal")).toHaveValue("73,8");

  // Varios códigos a la vez: se elige.
  await page.evaluate(() => { window.__scanCodes = ["4006381333931", "96385074", "basura"]; });
  await overlay.getByRole("button", { name: "📷 Escanear código de barras" }).click();
  await expect(overlay.locator("#qpScan")).toContainText("Se leyeron varios códigos");
  await overlay.getByRole("button", { name: "96385074" }).click();
  await expect(overlay.locator("#qpList")).toContainText("Este código no está en tus alimentos.");
});

test("sin permiso de cámara: mensaje claro y se puede escribir el código", async ({ page, context }) => {
  const { overlay } = await setup(page, context, { scanner: "denied" });
  await overlay.getByRole("button", { name: "📷 Escanear código de barras" }).click();
  await expect(overlay.locator("#qpScan")).toHaveText("No pudimos usar la cámara (sin permiso o sin cámara). Escribe el número del código.");
  await overlay.locator("#qpSearch").fill("036000291452");
  await expect(overlay.locator("#qpList")).toContainText("Yogur natural");
});
