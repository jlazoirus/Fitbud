// REQ-175: mientras el coach responde, una capa bloquea la app y dice qué pasa.
// REQ-176: una cuenta creada por el admin pide crear la contraseña propia al entrar.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, gotoApp, autoDismissNudges, sessionFixture, STORAGE_KEY } from "./helpers.js";

test("la consulta al coach bloquea la app con un aviso hasta que responde", async ({ page, context }) => {
  await installMocks(context);
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  await context.route("**/api/claude", async (route) => {
    await gate;
    const reply = { nombre: "Pan con palta", kcal: 310, proteina_g: 8, carbohidratos_g: 30, grasa_g: 17, nota: "Dos tostadas medianas.", preguntas: [] };
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ text: JSON.stringify(reply) }) });
  });
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  await gotoApp(page);

  await page.locator("#tabs").getByText("Nutrición").click();
  await page.getByRole("button", { name: /Agregar comida \/ snack/i }).first().click();
  const overlay = page.locator("#overlay");
  await overlay.locator("#f_name").fill("2 panes con palta");
  await overlay.getByRole("button", { name: /Estimar macros/i }).click();

  const busy = page.locator("#coach-busy");
  await expect(busy).toBeVisible();
  await expect(busy).toContainText("Estimando tu comida…");
  // El botón Guardar queda tapado por la capa: no se puede tocar mientras espera.
  const covered = await overlay.getByRole("button", { name: "Guardar" }).evaluate((btn) => {
    const r = btn.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!(top && top.closest("#coach-busy"));
  });
  expect(covered).toBe(true);
  await page.keyboard.press("Escape");
  await expect(overlay.locator("#f_name")).toBeVisible(); // Escape no cierra el modal

  release();
  await expect(busy).toBeHidden();
  await expect(overlay.locator("#f_kcal")).toHaveValue("310");
});

test("una cuenta creada por el admin crea su contraseña al entrar y sigue con la misma sesión", async ({ page, context }) => {
  await installMocks(context);
  const session = sessionFixture();
  session.user.user_metadata = { must_change_password: true, fitbros_created_by_admin: true };
  let updatePayload = null;
  await context.route("**/auth/v1/user**", async (route) => {
    if (route.request().method() === "PUT") updatePayload = JSON.parse(route.request().postData() || "{}");
    const user = { ...sessionFixture().user, user_metadata: { must_change_password: !updatePayload } };
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(user) });
  });
  await page.addInitScript(({ key, value }) => {
    localStorage.setItem(key, JSON.stringify(value));
    localStorage.setItem("fitbros_tour_v1", "done");
  }, { key: STORAGE_KEY, value: session });
  await autoDismissNudges(page);
  await gotoApp(page);

  const app = page.locator("#app");
  await expect(app).toContainText("Crea tu propia contraseña");
  await app.locator("#recovery_pwd").fill("MiClaveNueva2026");
  await app.locator("#recovery_confirm").fill("MiClaveNueva2026");
  await app.getByRole("button", { name: "Guardar y entrar" }).click();

  await expect(page.locator("#tabs")).toContainText("Hoy");
  await expect(app).not.toContainText("Crea tu propia contraseña");
  expect(updatePayload.password).toBe("MiClaveNueva2026");
  expect(updatePayload.data).toEqual({ must_change_password: false });
});

test("mientras se prepara el plan de entrenamiento no se puede cerrar el modal con la X", async ({ page, context }) => {
  await installMocks(context);
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  await context.route("**/api/claude", async (route) => {
    await gate;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ text: "{}" }) });
  });
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  await gotoApp(page);
  await page.locator("#tabs").getByText("Entreno").click();
  await page.getByRole("button", { name: /Preparar mi plan|Preparar otra versión/ }).first().click();

  const busy = page.locator("#coach-busy");
  await expect(busy).toBeVisible();
  await expect(busy).toContainText("Preparando tu plan…");
  const xCovered = await page.locator("#overlay .closebar button").evaluate((btn) => {
    const r = btn.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!(top && top.closest("#coach-busy"));
  });
  expect(xCovered).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.locator("#overlay")).toBeVisible();

  release();
  await expect(busy).toBeHidden({ timeout: 20_000 });
  await expect(page.locator("#overlay")).toBeVisible(); // el resultado queda en el modal, no se perdió
});
