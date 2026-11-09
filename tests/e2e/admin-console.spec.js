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
  await page.goto("/app/");
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

test("REQ-373: la consola reacomoda la navegación y los diálogos según el ancho", async ({ page, context }) => {
  await installMocks(context, { tables: { profiles: { row: { ...profileFixture(), is_admin: true } } } });
  // Reproduce el rewrite de Vercel sobre el servidor estático del test.
  await page.route("**/admin", (route) => route.fulfill({ path: "app/index.html", contentType: "text/html" }));
  await mockAdminApi(page);
  await seedLoggedInUser(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/admin");
  await page.waitForFunction(() => typeof _authBusy !== "undefined" && profile && !_authBusy);
  await expect(page.getByRole("heading", { name: "Postulantes beta" })).toBeVisible();
  const navigation = page.getByRole("navigation", { name: "Administración" });
  const workspace = page.locator("#app");
  await expect(navigation).toHaveCSS("flex-direction", "column");
  expect((await workspace.boundingBox()).width).toBeGreaterThan(900);
  const users = navigation.getByRole("button", { name: "Usuarios" });
  await users.focus();
  await users.press("Enter");
  await expect(users).toBeFocused();
  await expect(users).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { name: "Usuarios" })).toBeVisible();
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".overlay")).toHaveCSS("align-items", "center");
  await page.keyboard.press("Escape");

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(navigation).toHaveCSS("flex-direction", "row");
  expect((await navigation.boundingBox()).y).toBeGreaterThan((await workspace.boundingBox()).y);
  await expect(users).toHaveAttribute("aria-current", "page");
});
