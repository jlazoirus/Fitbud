// REQ-265: el recordatorio de entreno (api/notify.js) no conoce el plan; la app
// guarda en cada día si es de descanso para que el servidor no avise de más.
import { test, expect } from "@playwright/test";
import { installMocks, seedLoggedInUser, collectConsoleErrors, gotoApp, autoDismissNudges } from "./helpers.js";

test("el día guarda restDay: falso con sesión prescrita, verdadero al convertirlo en descanso", async ({ page, context }) => {
  await installMocks(context);
  await seedLoggedInUser(page);
  await autoDismissNudges(page);
  const errors = collectConsoleErrors(page);
  await gotoApp(page);
  await page.locator("#tabs").getByText("Entreno").click();

  // El fixture garantiza que hoy toca entrenar.
  const before = await page.evaluate(() => { const ds = todayStr(); commitDay(ds); return S.days[ds].restDay; });
  expect(before).toBe(false);

  await page.getByRole("button", { name: "Me perdí la sesión" }).click();
  await page.locator("#overlay").getByRole("button", { name: /Convertir en descanso/ }).click();
  await expect(page.locator("#app")).toContainText("Descanso");
  const after = await page.evaluate(() => { const st = S.days[todayStr()]; return { restDay: st.restDay, override: st.workoutOverride }; });
  expect(after).toEqual({ restDay: true, override: "descanso" });
  expect(errors, `Errores de consola:\n${errors.join("\n")}`).toEqual([]);
});
