// REQ-292/316: el menú opcional empieza compacto y recuerda la elección.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges } from "./helpers.js";

test("la tarjeta de preparar el día se colapsa y se recuerda", async ({ page, context }) => {
  await installMocks(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const errors = collectConsoleErrors(page);

  await gotoApp(page);
  await page.locator("#tabs").getByText("Nutrición").click();

  const app = page.locator("#app");
  const card = app.locator(".nut-setup");
  await expect(card).toHaveClass(/is-collapsed/);
  await expect(card).toContainText("Menú opcional");
  await card.getByRole("button", { name: "Mostrar sugerencia de menú" }).click();
  await expect(card).not.toHaveClass(/is-collapsed/);
  await expect(card).toContainText("¿Quieres ideas para tus comidas?");
  await expect(card).toContainText("Puedes registrar lo que comiste sin preparar un menú");

  await card.getByRole("button", { name: "Ocultar tarjeta" }).click();
  await expect(card).toHaveClass(/is-collapsed/);
  await expect(card).not.toContainText("¿Quieres ideas para tus comidas?");
  await expect(card).toContainText("Menú opcional");
  await expect(card.getByRole("button", { name: "Sugerirme un menú" })).toBeVisible();

  // El estado colapsado sobrevive a una recarga.
  await gotoApp(page);
  await page.locator("#tabs").getByText("Nutrición").click();
  await expect(app.locator(".nut-setup.is-collapsed")).toBeVisible();

  // Se puede volver a expandir.
  await app.getByRole("button", { name: "Mostrar sugerencia de menú" }).click();
  await expect(app.locator(".nut-setup")).toContainText("¿Quieres ideas para tus comidas?");
  await expect(app.locator(".nut-setup")).not.toHaveClass(/is-collapsed/);
  await gotoApp(page);
  await page.locator("#tabs").getByText("Nutrición").click();
  await expect(app.locator(".nut-setup")).not.toHaveClass(/is-collapsed/);

  expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
});
