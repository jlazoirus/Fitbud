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

const tenth = (n) => String(Math.round(n * 10) / 10).replace(".", ",");

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
    // …y guardada en favoritas del perfil (privado, sin migración) como una porción (REQ-243).
    await expect
      .poll(() => {
        const saved = calls.filter((c) => c.table === "profiles" && c.payload && c.payload.prefs).map((c) => c.payload.prefs.savedMeals);
        return saved.at(-1);
      })
      .toEqual([{
        name: "Bowl de yogur con avena", kcal: 420, p: 30, c: 50, f: 10,
        // REQ-267: la favorita conserva su snapshot: viene de una reciente sin origen guardado, una porción.
        nutritionMeta: { v: 1, source: "legacy", ref: { kind: "recent", name: "Bowl de yogur con avena" }, base: { kcal: 420, p: 30, c: 50, f: 10, unit: "portion" }, qty: 1 },
      }]);

    // Al reabrir, Recientes sigue mostrando una porción, no la ×1,5 de hoy (REQ-243).
    await page.getByRole("button", { name: /Agregar comida \/ snack/i }).first().click();
    await expect(overlay.locator(".qp-pick", { hasText: "Bowl de yogur con avena" })).toContainText("420 kcal · P 30 · C 50 · G 10");
    // Aparece en Favoritas con la estrella encendida; se puede quitar.
    await overlay.locator('.qp-tab[data-tab="fav"]').click();
    const star = overlay.getByRole("button", { name: "Quitar de favoritas: Bowl de yogur con avena" });
    await expect(star).toHaveAttribute("aria-pressed", "true");
    await star.click();
    await expect(overlay.locator("#qpList")).toContainText("Aún no tienes favoritas");
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });

  test("REQ-243: registrar ×2 no duplica los macros de la reciente ni de lo que se vuelva a registrar", async ({ page, context }) => {
    await installMocks(context);
    await seedLoggedInUser(page);
    await autoDismissNudges(page);
    const errors = collectConsoleErrors(page);
    await gotoApp(page);

    let overlay = await openAddMeal(page);
    await overlay.locator('.qp-tab[data-tab="food"]').click();
    await overlay.locator("#f_name").fill("Shake proteina");
    for (const [id, v] of [["#f_kcal", "300"], ["#f_p", "24"], ["#f_c", "36"], ["#f_f", "3"]]) await overlay.locator(id).fill(v);
    await overlay.getByRole("button", { name: "Guardar", exact: true }).click();

    // Segundo shake del día, desde Recientes con ×2.
    overlay = await openAddMeal(page);
    await overlay.locator(".qp-pick", { hasText: "Shake proteina" }).click();
    await overlay.getByRole("button", { name: "×2" }).click();
    await expect(overlay.locator("#f_kcal")).toHaveValue("600");
    await overlay.getByRole("button", { name: "Guardar", exact: true }).click();
    const kcals = await page.evaluate(() => dayState(todayStr()).extras.map((e) => e.kcal));
    expect(kcals).toEqual([300, 600]);

    // La reciente sigue siendo una porción y al tocarla precarga 300, no 600.
    overlay = await openAddMeal(page);
    const recent = overlay.locator(".qp-pick", { hasText: "Shake proteina" });
    await expect(recent).toContainText("300 kcal · P 24 · C 36 · G 3");
    await recent.click();
    await expect(overlay.locator("#f_kcal")).toHaveValue("300");
    await expect(overlay.locator("#f_p")).toHaveValue("24");

    // Editar el extra ×2 sin tocar la porción la conserva; renombrarlo la quita.
    await page.evaluate(() => { closeModal(); editExtra(todayStr(), 1); });
    await page.locator("#overlay").getByRole("button", { name: "Guardar", exact: true }).click();
    expect(await page.evaluate(() => dayState(todayStr()).extras[1].portion)).toBe(2);
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
    await expect(overlay.locator("#f_kcal")).toHaveValue(tenth(389 * 0.6)); // REQ-266: una décima, con coma
    await expect(overlay.locator("#f_p")).toHaveValue(tenth(16.9 * 0.6));

    await overlay.locator("#qpSearch").fill("platano"); // sin tilde también encuentra "Plátano"
    await overlay.locator("#qpGrams0").fill("120");
    await overlay.getByRole("button", { name: "Añadir" }).first().click();
    await expect(overlay.locator("#f_name")).toHaveValue("Avena 60 g + Plátano 120 g");
    await expect(overlay.locator("#f_kcal")).toHaveValue(tenth(389 * 0.6 + 89 * 1.2));
    await overlay.getByRole("button", { name: "Guardar", exact: true }).click();

    const today = await page.evaluate(() => dayState(todayStr()).extras.map((e) => e.name));
    expect(today).toContain("Avena 60 g + Plátano 120 g");
    expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
  });
});
