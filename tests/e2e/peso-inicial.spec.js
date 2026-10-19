// REQ-210: la semana 1 de Progreso usa el peso y la grasa del alta, sin
// volver a pedirlos, y nunca pisa un registro existente.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, gotoApp, autoDismissNudges, completePrefs, profileFixture, daysFromToday } from "./helpers.js";

const weekOnePrefs = (extra = {}) => completePrefs({
  cycleStartWeight: 80, cycleStartBodyFat: 20,
  planStartDate: daysFromToday(-2), planEndDate: daysFromToday(-2 + 69), ...extra,
});

async function openProgress(page) {
  await page.locator("#tabs").getByText("Progreso").click();
}

test("cuenta existente sin semana 1: se rellena una vez con el peso del alta", async ({ page, context }) => {
  const { calls } = await installMocks(context, { tables: { profiles: { row: profileFixture(weekOnePrefs()) } } });
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  await gotoApp(page);
  await openProgress(page);
  const app = page.locator("#app");
  await expect(page.getByLabel("Peso de la semana 1 en kilogramos")).toHaveValue("80");
  await expect(page.getByLabel("Grasa corporal de la semana 1 en porcentaje")).toHaveValue("20");
  await expect(app).toContainText("Tu punto de partida: 80 kg · 20% de grasa");
  await expect(app).not.toContainText("Registra tu peso de la semana");
  const marker = calls.filter((c) => c.table === "profiles" && c.method === "POST")
    .map((c) => (Array.isArray(c.payload) ? c.payload[0] : c.payload).prefs).find((p) => p?.startWeightSeededCycle === 1);
  expect(marker, "guarda la marca para no rellenar otra vez").toBeTruthy();
});

test("si ya se rellenó en este ciclo (y el usuario lo borró), no reaparece", async ({ page, context }) => {
  await installMocks(context, { tables: { profiles: { row: profileFixture(weekOnePrefs({ startWeightSeededCycle: 1 })) } } });
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  await gotoApp(page);
  await openProgress(page);
  await expect(page.getByLabel("Peso de la semana 1 en kilogramos")).toHaveValue("");
});

test("una semana 1 ya registrada con otro valor no cambia", async ({ page, context }) => {
  await installMocks(context, {
    tables: {
      profiles: { row: profileFixture(weekOnePrefs()) },
      weight_log: { rows: [{ week: 1, kg: 78.5, bf_pct: null, updated_at: new Date().toISOString() }] },
    },
  });
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  await gotoApp(page);
  await openProgress(page);
  await expect(page.getByLabel("Peso de la semana 1 en kilogramos")).toHaveValue("78.5");
});
