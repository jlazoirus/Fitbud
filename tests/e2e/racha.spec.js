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
  completePrefs,
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

// REQ-342: la racha ya no se repite en "Tus números"; la coherencia se comprueba
// entre el botón de Hoy y la tarjeta de Progreso.
const rachaHoyBoton = (page) => page.getByRole("button", { name: "Ver mi racha y amigos" });
const rachaCombinadaCard = (page) => page.locator("#streakPanel .streak-n");

test.describe("Progreso — racha combinada (REQ-146)", () => {
  test("hoy sin registrar todavía no muestra racha rota", async ({ page, context }) => {
    // 4 días previos completos (nutrición + entreno); hoy sin day_log (sin registrar aún).
    const rows = [dayLogRow(-4, true), dayLogRow(-3, true), dayLogRow(-2, true), dayLogRow(-1, true)];
    await installMocks(context, { tables: { day_log: { rows } } });
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);

    await gotoApp(page);
    await page.waitForLoadState("networkidle");
    await expect(rachaHoyBoton(page)).toHaveText("Racha 4");
    await openProgreso(page);

    // Hoy y Progreso deben coincidir en el mismo número (>0)
    await expect(rachaCombinadaCard(page)).toHaveText("4");
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
    await page.waitForLoadState("networkidle");
    await expect(rachaHoyBoton(page)).toHaveText("Racha 0");
    await openProgreso(page);

    // Ambos números en cero, coherentes entre sí.
    await expect(rachaCombinadaCard(page)).toHaveText("0");
    // El banner de recuperación sí debe aparecer, con la mejor racha real (3 días).
    await expect(page.locator(".streak-recovery")).toBeVisible();
    await expect(page.locator(".streak-recovery")).toContainText("Tu mejor racha fue de 3 días");

    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
});

// REQ-342: la racha cabe en una tarjeta. Sin la racha repetida en "Tus números",
// sin la lista de hitos con fechas y con un solo "Compartir mi racha".
test.describe("Progreso — racha en una tarjeta (REQ-342)", () => {
  const milestone = (level, offset) => ({ key: `combined-${level}-c1`, type: "combined", level, cycle: 1, date: daysFromToday(offset) });

  test("número, hitos en la barra, desglose y amigos sin duplicados", async ({ page, context }) => {
    const rows = [-8, -7, -6, -5, -4, -3, -2, -1].map((offset) => dayLogRow(offset, true));
    const prefs = completePrefs({ streakMilestones: [milestone(3, -6), milestone(7, -2)] });
    await installMocks(context, { prefs, tables: { day_log: { rows } } });
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);

    await gotoApp(page);
    await openProgreso(page);

    const panel = page.locator("#streakPanel");
    await expect(panel.locator(".streak-n")).toHaveText("8");
    await expect(panel).toContainText("días seguidos");
    await expect(panel.locator(".streak-record")).toHaveText("Tu mejor marca");
    await expect(panel).not.toContainText("combinada");
    // Hitos: 3 días y 1 semana logrados (con su fecha para lectores de pantalla), 2 semanas es el siguiente.
    const stops = page.getByRole("list", { name: "Hitos de racha" }).locator("li");
    await expect(stops).toHaveCount(4);
    await expect(stops.nth(0)).toHaveClass(/done/);
    await expect(stops.nth(1)).toHaveClass(/done/);
    await expect(stops.nth(1)).toContainText("1 semana, logrado el");
    await expect(stops.nth(2)).toHaveClass(/next/);
    await expect(stops.nth(3)).not.toHaveClass(/done|next/);
    await expect(panel.locator(".streak-next")).toHaveText("Faltan 6 días para el hito de 2 semanas.");
    // El entreno cuenta sesiones, no días: los descansos no suman.
    await expect(panel.locator(".streak-split")).toContainText("Comidas8 días seguidos");
    await expect(panel.locator(".streak-split")).toContainText(/Entreno\d+ sesi(ón seguida|ones seguidas)/);

    // "Tus números" ya no repite la racha; muestra las sesiones de la semana.
    await expect(page.locator(".scard", { hasText: "Racha" })).toHaveCount(0);
    await expect(page.locator(".scard", { hasText: "Sesiones esta semana" }).locator(".n")).toHaveText(/^\d+\/\d+$/);

    // Amigos vive dentro de la sección y "Compartir mi racha" aparece una sola vez.
    const section = page.locator(".csec", { has: panel });
    await expect(section.locator("#streakFriends")).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Compartir mi racha" })).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Ver amigos" })).toHaveCount(0);
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  test("desde Hoy abre la sección aunque esté plegada", async ({ page, context }) => {
    await installMocks(context, { tables: { day_log: { rows: [dayLogRow(-2, true), dayLogRow(-1, true)] } } });
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    await page.addInitScript(() => localStorage.setItem("fitbud_ui", JSON.stringify({ collapsed: { "pr.rachas": true } })));
    await gotoApp(page);
    await openProgreso(page);
    await expect(page.locator("#streakPanel")).toBeHidden();

    await page.locator("#tabs").getByText("Hoy").click();
    await rachaHoyBoton(page).click();
    await expect(page.locator("#streakPanel .streak-n")).toBeVisible();
    await expect(page.locator("#streakFriends")).toBeVisible();
  });
});
