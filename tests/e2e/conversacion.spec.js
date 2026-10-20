// REQ-216: modo conversacional (beta oculta). Se activa con un enlace secreto,
// se elige en Perfil y permite hacer el día desde el hilo; sin la marca nada cambia.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, gotoApp, autoDismissNudges, collectConsoleErrors } from "./helpers.js";

test("con el enlace de prueba: entreno, peso y comidas desde el hilo, y vuelta a la vista normal", async ({ page, context }) => {
  const { calls } = await installMocks(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const errors = collectConsoleErrors(page);
  await page.goto("/index.html?labs=conversacion");
  await expect(page.locator("#tabs")).toContainText("Hoy");
  await expect(page.locator("#toast")).toContainText("Modo conversación disponible");
  expect(new URL(page.url()).search).toBe("");

  await page.locator("#tabs").getByText("Perfil").click();
  await page.keyboard.press("Escape");
  await page.locator("details.pf-accordion > summary", { hasText: "Cuenta" }).click();
  await page.getByRole("button", { name: "Conversación" }).click();

  const app = page.locator("#app");
  await expect(app).toContainText("Conversación · en prueba");
  await expect(page.locator("#tabs button")).toHaveCount(0);
  await expect(app.locator(".chat-bubble").first()).toContainText(/Hoy toca .+ kcal/);
  const paid = () => calls.filter((c) => c.table === "/api/claude").length;
  const paidBefore = paid();

  // Entreno paso a paso dentro del hilo
  await app.getByRole("button", { name: "¿Qué entreno hoy?" }).click();
  const workout = app.locator('.chat-card[data-card="workout"]');
  await workout.getByRole("button", { name: "Empezar" }).click();
  await expect(workout).toContainText("Calentamiento");
  await workout.getByRole("button", { name: "Sí, calentar" }).click();
  await workout.getByRole("button", { name: "Ya calenté" }).click();
  await expect(workout.getByRole("button", { name: "Siguiente ejercicio" })).toBeVisible();

  // Peso
  await app.getByRole("button", { name: "Quiero registrar mi peso" }).click();
  await app.locator("#chatWeight").fill("74.5");
  await app.getByRole("button", { name: "Guardar" }).click();
  await expect(app).toContainText("Anotado: 74.5 kg");
  expect(paid(), "las tarjetas no llaman al coach").toBe(paidBefore);

  // Comidas
  await app.getByRole("button", { name: "¿Qué como hoy?" }).click();
  const meals = app.locator('.chat-card[data-card="meals"]');
  const prepare = meals.getByRole("button", { name: "Preparar mi día" });
  if (await prepare.isVisible().catch(() => false)) {
    await prepare.click();
    await page.getByRole("button", { name: "Aplicar al día" }).click();
  }
  const firstCheck = meals.locator(".meal .chk").first();
  await firstCheck.click();
  await expect(meals.locator(".meal .chk").first()).toHaveAttribute("aria-pressed", "true");

  // Volver a la vista normal
  await app.getByRole("button", { name: "Vista normal" }).click();
  await expect(page.locator("#tabs")).toContainText("Nutrición");
  await expect(app).not.toContainText("Conversación · en prueba");
  expect(errors).toEqual([]);
});

test("sin la marca de prueba, Perfil no ofrece el modo conversación", async ({ page, context }) => {
  await installMocks(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  await gotoApp(page);
  await page.locator("#tabs").getByText("Perfil").click();
  await page.keyboard.press("Escape");
  await page.locator("details.pf-accordion > summary", { hasText: "Cuenta" }).click();
  await expect(page.locator("#app")).not.toContainText("Modo de la app");
});
