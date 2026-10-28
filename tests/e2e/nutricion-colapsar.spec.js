// REQ-292: la tarjeta "Prepara tus comidas de hoy" de Nutrición se colapsa a una
// línea, recuerda el estado al recargar y sigue ofreciendo "Preparar mi día".
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
  await expect(card).toContainText("Prepara tus comidas de hoy");

  await card.getByRole("button", { name: "Ocultar tarjeta" }).click();
  await expect(card).toHaveClass(/is-collapsed/);
  await expect(card).not.toContainText("Prepara tus comidas de hoy");
  await expect(card).toContainText("Comidas sin preparar");
  await expect(card.getByRole("button", { name: "Preparar mi día" })).toBeVisible();

  // El estado colapsado sobrevive a una recarga.
  await gotoApp(page);
  await page.locator("#tabs").getByText("Nutrición").click();
  await expect(app.locator(".nut-setup.is-collapsed")).toBeVisible();

  // Se puede volver a expandir.
  await app.getByRole("button", { name: "Mostrar cómo preparar tus comidas" }).click();
  await expect(app.locator(".nut-setup")).toContainText("Prepara tus comidas de hoy");
  await expect(app.locator(".nut-setup")).not.toHaveClass(/is-collapsed/);

  expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
});
