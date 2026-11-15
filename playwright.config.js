// Configuración de la suite E2E (REQ-96).
// Corre 100% offline: toda llamada a Supabase, /api/* y CDN se intercepta
// en tests/e2e/helpers.js con fixtures deterministas (0 llamadas pagadas).
import { defineConfig, chromium } from "@playwright/test";
import { existsSync } from "node:fs";

// Los helpers calculan "hoy" con la hora de Node y el navegador corre en
// America/Lima (timezoneId abajo): entre 00:00 y 05:00 UTC eran días distintos
// y fallaban los tests de racha y cronómetro. Misma zona en ambos lados.
process.env.TZ = "America/Lima";

// Prefiere el navegador de Playwright; si no está instalado, usa Chromium
// del sistema. La variable explícita sigue teniendo prioridad.
const chromiumPath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||
  (existsSync(chromium.executablePath())?chromium.executablePath():["/usr/bin/chromium","/usr/bin/chromium-browser","/usr/bin/google-chrome"].find(existsSync));

// E2E_PORT permite que dos checkouts (worktrees) prueben a la vez: el servidor
// que se reutiliza en 8923 puede ser de otra copia del repo. Por defecto, 8923.
const port = Number(process.env.E2E_PORT) || 8923;
const origin = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  retries: 1,
  // Por defecto en serie; cada contexto aísla almacenamiento y mocks.
  workers: process.env.PLAYWRIGHT_WORKERS ? Number(process.env.PLAYWRIGHT_WORKERS) : 1,
  reporter: [["list"]],
  use: {
    launchOptions: chromiumPath
      ? { executablePath: chromiumPath }
      : {},
    baseURL: origin,
    viewport: { width: 390, height: 844 }, // móvil: el formato real de la PWA
    locale: "es-PE",
    timezoneId: "America/Lima",
    screenshot: "only-on-failure",
    serviceWorkers: "block", // el SW cachearía y saltaría los mocks de red

  },
  webServer: {
    command: `python3 -m http.server ${port} --bind 127.0.0.1`,
    url: `${origin}/index.html`,
    reuseExistingServer: true,
    timeout: 15_000,
  },
});
