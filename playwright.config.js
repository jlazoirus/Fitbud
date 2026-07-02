// Configuración de la suite E2E (REQ-96).
// Corre 100% offline: toda llamada a Supabase, /api/* y CDN se intercepta
// en tests/e2e/helpers.js con fixtures deterministas (0 llamadas pagadas).
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  retries: 1,
  workers: 1, // la app usa localStorage compartido por origen; en serie es determinista
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:8923",
    viewport: { width: 390, height: 844 }, // móvil: el formato real de la PWA
    locale: "es-PE",
    timezoneId: "America/Lima",
    screenshot: "only-on-failure",
    serviceWorkers: "block", // el SW cachearía y saltaría los mocks de red

  },
  webServer: {
    command: "python3 -m http.server 8923 --bind 127.0.0.1",
    url: "http://127.0.0.1:8923/index.html",
    reuseExistingServer: true,
    timeout: 15_000,
  },
});
