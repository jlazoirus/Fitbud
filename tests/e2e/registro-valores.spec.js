// REQ-266: el editor de comidas valida los números antes de tocar el día, las
// favoritas o la cola. Vacío ≠ 0; «Solo conozco las calorías» deja los macros
// como desconocidos y los totales se marcan como parciales.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges } from "./helpers.js";

async function openAddMeal(page, context) {
  await installMocks(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const errors = collectConsoleErrors(page);
  await gotoApp(page);
  await page.locator("#tabs").getByText("Nutrición").click();
  await page.getByRole("button", { name: /Agregar comida \/ snack/i }).first().click();
  return { overlay: page.locator("#overlay"), errors };
}
const snapshot = (page) => page.evaluate(() => ({
  extras: dayState(todayStr()).extras.length,
  queue: localStorage.getItem(SYNC_QUEUE_KEY),
  saved: JSON.stringify((profile.prefs || {}).savedMeals || []),
}));
async function fill(overlay, v) {
  for (const [id, value] of Object.entries(v)) await overlay.locator("#" + id).fill(value);
}

test("negativos, vacíos y texto no se guardan y el formulario conserva lo escrito", async ({ page, context }) => {
  const { overlay, errors } = await openAddMeal(page, context);
  const before = await snapshot(page);

  await fill(overlay, { f_name: "Yogur raro", f_kcal: "-100", f_p: "-10", f_c: "5", f_f: "1" });
  await overlay.locator("#f_fav").check();
  await overlay.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(overlay.locator("#f_errors")).toContainText("kcal: No puede ser negativo.");
  await expect(overlay.locator("#f_errors")).toContainText("Proteína: No puede ser negativo.");
  await expect(overlay.locator("#f_kcal")).toHaveAttribute("aria-invalid", "true");
  await expect(overlay.locator("#f_kcal")).toHaveValue("-100");
  await expect(overlay.locator("#f_kcal")).toBeFocused();

  await fill(overlay, { f_kcal: "120", f_p: "", f_c: "abc", f_f: "1" });
  await overlay.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(overlay.locator("#f_errors")).toContainText("Proteína: Indica proteína o marca «Solo conozco las calorías».");
  await expect(overlay.locator("#f_errors")).toContainText("Carbohidratos: Escribe un número");
  await expect(overlay.locator("#f_kcal")).not.toHaveAttribute("aria-invalid", "true");

  expect(await snapshot(page)).toEqual(before);
  await expect(overlay.locator("#f_name")).toHaveValue("Yogur raro");
  expect(errors).toEqual([]);
});

test("cero explícito y decimales con coma se guardan sin truncar; doble envío registra una vez", async ({ page, context }) => {
  const { overlay } = await openAddMeal(page, context);
  await fill(overlay, { f_name: "Un vaso de agua", f_kcal: "0", f_p: "0", f_c: "0", f_f: "0" });
  await overlay.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.locator("#app")).toContainText("Un vaso de agua");

  await page.getByRole("button", { name: /Agregar comida \/ snack/i }).first().click();
  await fill(overlay, { f_name: "Pan con mantequilla", f_kcal: "250,5", f_p: "8,25", f_c: "45", f_f: "3.5" });
  await page.evaluate(() => { saveEditor(); saveEditor(); });
  const extras = await page.evaluate(() => dayState(todayStr()).extras.map(({ name, kcal, p, c, f }) => ({ name, kcal, p, c, f })));
  expect(extras).toEqual([
    { name: "Un vaso de agua", kcal: 0, p: 0, c: 0, f: 0 },
    { name: "Pan con mantequilla", kcal: 250.5, p: 8.3, c: 45, f: 3.5 },
  ]);
  // Se muestra redondeado; al reabrir conserva la décima.
  await expect(page.locator("#app")).toContainText("251 kcal");
  await page.evaluate(() => editExtra(todayStr(), 1));
  await expect(overlay.locator("#f_kcal")).toHaveValue("250,5");
  await expect(overlay.locator("#f_p")).toHaveValue("8,3");
});

test("solo calorías: macros desconocidos, sin ceros aparentes y totales parciales", async ({ page, context }) => {
  const { overlay, errors } = await openAddMeal(page, context);
  await fill(overlay, { f_name: "Galletas de la oficina", f_p: "4" });
  await overlay.getByLabel("Solo conozco las calorías").check();
  await expect(overlay.locator("#f_p")).toBeDisabled();
  await expect(overlay.locator("#f_p")).toHaveValue("");
  await overlay.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(overlay.locator("#f_errors")).toContainText("kcal: Indica las kcal");

  await fill(overlay, { f_kcal: "180" });
  await overlay.getByRole("button", { name: "Guardar", exact: true }).click();
  const saved = await page.evaluate(() => dayState(todayStr()).extras[0]);
  expect(saved).toMatchObject({ name: "Galletas de la oficina", kcal: 180, p: 0, c: 0, f: 0, macrosUnknown: true, done: true });
  const card = page.locator(".meal", { hasText: "Galletas de la oficina" });
  await expect(card).toContainText("180 kcal · macros no informados");
  await expect(card).not.toContainText("P 0");
  await expect(page.locator("#app")).toContainText("Macros parciales: 1 comida registrada solo con calorías.");

  // Al reabrir sigue en modo solo calorías; completar los macros quita la marca.
  await page.evaluate(() => editExtra(todayStr(), 0));
  await expect(overlay.getByLabel("Solo conozco las calorías")).toBeChecked();
  await overlay.getByLabel("Solo conozco las calorías").uncheck();
  await fill(overlay, { f_p: "3", f_c: "25", f_f: "8" });
  await overlay.getByRole("button", { name: "Guardar", exact: true }).click();
  const fixed = await page.evaluate(() => dayState(todayStr()).extras[0]);
  expect(fixed.macrosUnknown).toBeUndefined();
  expect(fixed).toMatchObject({ kcal: 180, p: 3, c: 25, f: 8 });
  await expect(page.locator("#app")).not.toContainText("Macros parciales");
  expect(errors).toEqual([]);
});

test("un registro antiguo con ceros conserva sus números al editarlo", async ({ page, context }) => {
  const { overlay } = await openAddMeal(page, context);
  await page.evaluate(() => {
    closeModal();
    const d = dayState(todayStr());
    d.extras.push({ name: "Café antiguo", kcal: 5, p: 0, c: 0, f: 0, done: true, oid: nextExtraOid(d) });
    commitDay(todayStr()); render(); editExtra(todayStr(), 0);
  });
  await expect(overlay.locator("#f_p")).toHaveValue("0");
  await expect(overlay.getByLabel("Solo conozco las calorías")).not.toBeChecked();
  await overlay.getByRole("button", { name: "Guardar", exact: true }).click();
  expect(await page.evaluate(() => dayState(todayStr()).extras[0])).toMatchObject({ kcal: 5, p: 0, c: 0, f: 0 });
});
