// Journey retención: racha combinada (REQ-146).
// La racha combinada tiene una sola definición: mientras el día en curso no
// esté cumplido pero exista una racha previa viva, no debe mostrarse "0" ni
// un mensaje de "racha rota". El banner de recuperación solo debe aparecer
// cuando la racha esté realmente rota (un día ya vencido sin cumplir).
import { test, expect } from "@playwright/test";
import {
  installMocks,
  seedLoggedInUser,
  collectConsoleErrors,
  gotoApp,
  autoDismissNudges,
  daysFromToday,
  USER_ID,
} from "./helpers.js";

// mealCount:3 en completePrefs() → MEAL_SLOT_TEMPLATES[3] = desayuno/almuerzo/cena.
// Cada comida lleva un ovr con macros (REQ-161: una comida sin contenido real
// no cuenta como cumplida, así que el fixture debe simular una comida
// realmente registrada, no solo done:true).
const doneMeal = () => ({ done: true, ovr: { name: "Comida registrada", kcal: 500, p: 30, c: 50, f: 15 } });
const doneDayState = () => ({
  meals: { desayuno: doneMeal(), almuerzo: doneMeal(), cena: doneMeal() },
  extras: [],
  workoutDone: true,
});
const emptyDayState = () => ({ meals: {}, extras: [], workoutDone: false });

function dayLogRow(offset, done) {
  return {
    user_id: USER_ID,
    log_date: daysFromToday(offset),
    state: done ? doneDayState() : emptyDayState(),
    plan_version_id: null,
    updated_at: new Date().toISOString(),
  };
}

async function openProgreso(page) {
  // onAuth() dispara loadEntitlement().then(render) sin esperarlo junto al resto
  // de la carga (pullAllDays/pullWeights/etc.): un render() temprano de esa
  // promesa puede satisfacer el splash-gone de gotoApp() antes de que S.days
  // tenga los días sembrados. Esperar red inactiva evita leer el estado a medias.
  await page.waitForLoadState("networkidle");
  await page.locator("#tabs").getByText("Progreso").click();
}

const rachaDiasCard = (page) => page.locator(".scard", { hasText: "Racha (días)" }).locator(".n");
const rachaCombinadaCard = (page) => page.locator(".streak-card.main .streak-n");

test.describe("Progreso — racha combinada (REQ-146)", () => {
  test("hoy sin registrar todavía no muestra racha rota", async ({ page, context }) => {
    // 4 días previos completos (nutrición + entreno); hoy sin day_log (sin registrar aún).
    const rows = [dayLogRow(-4, true), dayLogRow(-3, true), dayLogRow(-2, true), dayLogRow(-1, true)];
    await installMocks(context, { tables: { day_log: { rows } } });
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);

    await gotoApp(page);
    await openProgreso(page);

    // Las dos tarjetas deben coincidir en el mismo número (>0)
    await expect(rachaDiasCard(page)).toHaveText("🔥 4");
    await expect(rachaCombinadaCard(page)).toHaveText("🔥 4");
    // Y no debe aparecer el banner de "racha rota"
    await expect(page.locator(".streak-recovery")).toHaveCount(0);

    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  test("un día vencido sin cumplir sí rompe la racha y muestra el banner", async ({ page, context }) => {
    // Ayer (ya vencido) no se cumplió → racha realmente rota, no solo "hoy pendiente".
    const rows = [
      dayLogRow(-4, true),
      dayLogRow(-3, true),
      dayLogRow(-2, true),
      dayLogRow(-1, false),
    ];
    await installMocks(context, { tables: { day_log: { rows } } });
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);

    await gotoApp(page);
    await openProgreso(page);

    // Ambos números en cero, coherentes entre sí.
    await expect(rachaDiasCard(page)).toHaveText("—");
    await expect(rachaCombinadaCard(page)).toHaveText("—");
    // El banner de recuperación sí debe aparecer, con la mejor racha real (3 días).
    await expect(page.locator(".streak-recovery")).toBeVisible();
    await expect(page.locator(".streak-recovery")).toContainText("Tu mejor racha fue de 3 días");

    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
});
