// REQ-215: lista de compra semanal sobre las comidas efectivas, con "ya lo
// tengo" / "por comprar" guardado por semana.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, gotoApp, autoDismissNudges, collectConsoleErrors } from "./helpers.js";

async function openList(page) {
  await page.locator("#tabs").getByText("Nutrición").click();
  await page.getByRole("button", { name: /^Lista de compra/ }).click();
  return page.locator("#overlay");
}

test("arma la lista de la semana, mueve lo que ya tengo y lo recuerda al reabrir", async ({ page, context }) => {
  const { calls } = await installMocks(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const errors = collectConsoleErrors(page);
  await gotoApp(page);
  await page.locator("#tabs").getByText("Nutrición").click();
  const prepare = page.getByRole("button", { name: "Preparar mi día" });
  if (await prepare.isVisible().catch(() => false)) {
    await prepare.click();
    await page.getByRole("button", { name: "Aplicar al día" }).click();
    await expect(page.locator("#overlay")).toHaveCount(0);
  }
  const sheet = await openList(page);
  await expect(sheet).toContainText(/Por comprar · \d+/);
  const items = sheet.locator(".shop-item");
  const total = await items.count();
  expect(total).toBeGreaterThan(0);
  const first = items.first();
  const name = (await first.locator(".n").innerText()).trim();
  await first.locator("input").click(); // click, no check(): el ítem cambia de sección al marcarlo
  await expect(sheet).toContainText(`Ya lo tengo · 1`);
  await expect(sheet).toContainText(`Por comprar · ${total - 1}`);
  await expect.poll(() => {
    const c = calls.filter((x) => x.table === "profiles" && x.method === "POST").at(-1);
    const prefs = c && (Array.isArray(c.payload) ? c.payload[0] : c.payload).prefs;
    return prefs && prefs.shoppingChecks && prefs.shoppingChecks.have.length;
  }).toBe(1);
  await page.keyboard.press("Escape");
  const again = await openList(page);
  await expect(again.locator(".shop-item.have .n")).toHaveText(name);
  expect(errors).toEqual([]);
});

test("una comida saltada deja de sumar en la lista", async ({ page, context }) => {
  await installMocks(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  await gotoApp(page);
  await page.locator("#tabs").getByText("Nutrición").click();
  const prepare = page.getByRole("button", { name: "Preparar mi día" });
  if (await prepare.isVisible().catch(() => false)) {
    await prepare.click();
    await page.getByRole("button", { name: "Aplicar al día" }).click();
    await expect(page.locator("#overlay")).toHaveCount(0);
  }
  const grams = () => page.evaluate(() => shoppingList("rest").items.reduce((s, i) => s + i.grams, 0));
  const before = await grams();
  expect(before).toBeGreaterThan(0);
  await page.evaluate(() => {
    const ds = todayStr(); const meal = buildDay(ds).meals.find((b) => mealRecipe(b, mealState(ds, b.id)));
    mealState(ds, meal.id).skipped = true; save();
  });
  expect(await grams()).toBeLessThan(before);
});
