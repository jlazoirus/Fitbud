// REQ-188: reutilizar comidas recientes y favoritas, y registrar alimentos
// sueltos por gramos desde el catálogo (0 llamadas pagadas).
import { test, expect } from "@playwright/test";
import {
  installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges,
  completePrefs, daysFromToday, USER_ID,
} from "./helpers.js";

const yesterdayWithSnack = () => ({
  user_id: USER_ID,
  log_date: daysFromToday(-1),
  state: {
    meals: {},
    extras: [{ name: "Bowl de yogur con avena", kcal: 420, p: 30, c: 50, f: 10, done: true, oid: 1 }],
    workoutDone: false,
  },
  plan_version_id: null,
  updated_at: new Date().toISOString(),
});

async function openAddMeal(page) {
  await page.locator("#tabs").getByText("Nutrición").click();
  await page.getByRole("button", { name: /Agregar comida \/ snack/i }).first().click();
  return page.locator("#overlay");
}

test.describe("Comidas guardadas", () => {
  test("una comida de ayer se reutiliza desde Recientes, con porción, y se guarda en favoritas", async ({ page, context }) => {
    const { calls } = await installMocks(context, { tables: { day_log: { rows: [yesterdayWithSnack()] } } });
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);

    const overlay = await openAddMeal(page);
    await expect(overlay.locator('.qp-tab[data-tab="recent"]')).toHaveAttribute("aria-pressed", "true");
    await overlay.locator(".qp-pick", { hasText: "Bowl de yogur con avena" }).click();
    await expect(overlay.locator("#f_name")).toHaveValue("Bowl de yogur con avena");
    await expect(overlay.locator("#f_kcal")).toHaveValue("420");
    await overlay.getByRole("button", { name: "×1,5" }).click();
    await expect(overlay.locator("#f_kcal")).toHaveValue("630");
    await expect(overlay.locator("#f_p")).toHaveValue("45");
    await overlay.locator("#f_fav").check();
    await overlay.getByRole("button", { name: "Guardar", exact: true }).click();

    // Registrada hoy con los macros escalados…
    const today = await page.evaluate(() => dayState(todayStr()).extras.map((e) => ({ name: e.name, kcal: e.kcal })));
    expect(today).toContainEqual({ name: "Bowl de yogur con avena", kcal: 630 });
    // …y guardada en favoritas del perfil (privado, sin migración).
    await expect
      .poll(() => {
        const saved = calls.filter((c) => c.table === "profiles" && c.payload && c.payload.prefs).map((c) => c.payload.prefs.savedMeals);
        return saved.at(-1);
      })
      .toEqual([{ name: "Bowl de yogur con avena", kcal: 630, p: 45, c: 75, f: 15 }]);

    // Al reabrir, aparece en Favoritas con la estrella encendida; se puede quitar.
    await page.getByRole("button", { name: /Agregar comida \/ snack/i }).first().click();
    await overlay.locator('.qp-tab[data-tab="fav"]').click();
    const star = overlay.getByRole("button", { name: "Quitar de favoritas: Bowl de yogur con avena" });
    await expect(star).toHaveAttribute("aria-pressed", "true");
    await star.click();
    await expect(overlay.locator("#qpList")).toContainText("Aún no tienes favoritas");
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  test("las favoritas vienen del perfil (otro dispositivo) y los alimentos sueltos suman por gramos", async ({ page, context }) => {
    const prefs = completePrefs({ savedMeals: [{ name: "Tostadas con palta", kcal: 350, p: 9, c: 38, f: 18 }] });
    await installMocks(context, { prefs });
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);

    const overlay = await openAddMeal(page);
    // Sin recientes, abre en Favoritas.
    await expect(overlay.locator('.qp-tab[data-tab="fav"]')).toHaveAttribute("aria-pressed", "true");
    await expect(overlay.locator("#qpList")).toContainText("Tostadas con palta");

    await overlay.locator('.qp-tab[data-tab="food"]').click();
    await overlay.locator("#qpSearch").fill("avena");
    await overlay.locator("#qpGrams0").fill("60");
    await overlay.getByRole("button", { name: "Añadir" }).first().click();
    await expect(overlay.locator("#f_name")).toHaveValue("Avena 60 g");
    await expect(overlay.locator("#f_kcal")).toHaveValue(String(Math.round(389 * 0.6)));
    await expect(overlay.locator("#f_p")).toHaveValue(String(Math.round(16.9 * 0.6)));

    await overlay.locator("#qpSearch").fill("platano"); // sin tilde también encuentra "Plátano"
    await overlay.locator("#qpGrams0").fill("120");
    await overlay.getByRole("button", { name: "Añadir" }).first().click();
    await expect(overlay.locator("#f_name")).toHaveValue("Avena 60 g + Plátano 120 g");
    await expect(overlay.locator("#f_kcal")).toHaveValue(String(Math.round(389 * 0.6 + 89 * 1.2)));
    await overlay.getByRole("button", { name: "Guardar", exact: true }).click();

    const today = await page.evaluate(() => dayState(todayStr()).extras.map((e) => e.name));
    expect(today).toContain("Avena 60 g + Plátano 120 g");
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
});
