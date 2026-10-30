// REQ-308: la consola de administración vive separada en /admin; la app de
// usuarios ya no muestra vistas de administración, solo enlaza a la consola.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, gotoApp, autoDismissNudges, profileFixture } from "./helpers.js";

const BETA_EMPTY = { applicants: [], counts: { pending: 0, invited: 0, closed: 0 } };
const forceConsole = (page) => page.addInitScript(() => { window.__forceAdminConsole = true; });
const mockAdminApi = (page) => page.route("**/api/admin", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(BETA_EMPTY) }));

test("REQ-308: el admin entra a la consola con sus propias secciones", async ({ page, context }) => {
  await installMocks(context, { tables: { profiles: { row: { ...profileFixture(), is_admin: true } } } });
  await forceConsole(page);
  await mockAdminApi(page);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  await gotoApp(page);
  await expect(page.getByRole("heading", { name: "Postulantes beta" })).toBeVisible();
  const tabs = page.locator("#tabs");
  for (const label of ["Beta", "Usuarios", "Alimentos", "Ejercicios", "Analítica", "Ajustes", "App"]) {
    await expect(tabs.getByRole("button", { name: label })).toBeVisible();
  }
  await expect(tabs.getByRole("button", { name: "Hoy" })).toHaveCount(0);
  await tabs.getByRole("button", { name: "Usuarios" }).click();
  await expect(page.getByRole("heading", { name: "Usuarios" })).toBeVisible();
});

test("REQ-308: un usuario normal ve Sin acceso en la consola", async ({ page, context }) => {
  await installMocks(context);
  await forceConsole(page);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  await gotoApp(page);
  await expect(page.getByRole("heading", { name: "Sin acceso" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ir a la app" })).toHaveAttribute("href", "/");
});

test("REQ-308: sin sesión la consola pide iniciar sesión, no muestra la landing", async ({ page, context }) => {
  await installMocks(context);
  await forceConsole(page);
  await page.goto("/index.html");
  await expect(page.locator("#au_email")).toBeVisible();
  await expect(page.getByText("Tu mejor versión")).toHaveCount(0);
});

test("REQ-308: en la app el admin no abre vistas admin y su Perfil enlaza a /admin", async ({ page, context }) => {
  await installMocks(context, { tables: { profiles: { row: { ...profileFixture(), is_admin: true } } } });
  await mockAdminApi(page);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  await gotoApp(page);
  await page.evaluate(() => setView("admin"));
  await expect(page.getByRole("heading", { name: "Usuarios" })).toHaveCount(0);
  await page.evaluate(() => setView("perfil"));
  await page.locator("#pfSecAdmin summary").click();
  await expect(page.getByRole("link", { name: /Abrir consola de administración/ })).toHaveAttribute("href", "/admin");
});
