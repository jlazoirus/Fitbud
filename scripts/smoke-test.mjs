#!/usr/bin/env node
// Smoke test de producción — REQ-30
// Prueba los endpoints críticos de la app desplegada.
// Uso: node scripts/smoke-test.mjs [--url https://fitbud-green.vercel.app]
// Sale con código 0 si todos los checks pasan, 1 si alguno falla.
// No requiere credenciales: solo prueba rutas públicas y rechazos de auth.

const DEFAULT_URL = "https://fitbud-green.vercel.app";
const args = process.argv.slice(2);
const urlIdx = args.indexOf("--url");
const BASE = urlIdx >= 0 && args[urlIdx + 1] ? args[urlIdx + 1].replace(/\/$/, "") : DEFAULT_URL;
const DRY = args.includes("--dry");

const results = [];

async function check(name, fn) {
  try {
    const t0 = Date.now();
    await fn();
    results.push({ name, ok: true, ms: Date.now() - t0 });
    process.stdout.write("  ✓ " + name + "\n");
  } catch (e) {
    results.push({ name, ok: false, error: e.message });
    process.stdout.write("  ✗ " + name + ": " + e.message + "\n");
  }
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }

if (DRY) {
  console.log(`[dry-run] Se probarían endpoints en: ${BASE}`);
  process.exit(0);
}

console.log(`Smoke test → ${BASE}\n`);

await check("GET / devuelve 200 con título Fitbros", async () => {
  const r = await fetch(BASE + "/");
  assert(r.ok, `HTTP ${r.status}`);
  const html = await r.text();
  assert(html.includes("Fitbros"), "Título 'Fitbros' no encontrado en la respuesta.");
  assert(html.includes("<html"), "Respuesta no parece HTML.");
});

await check("GET /api/config devuelve JSON con supabase y model", async () => {
  const r = await fetch(BASE + "/api/config");
  assert(r.ok, `HTTP ${r.status}`);
  const json = await r.json();
  assert(json.supabase && json.supabase.url, "Falta supabase.url en /api/config.");
  assert(json.supabase.publishableKey, "Falta supabase.publishableKey.");
  assert(!json.supabase.publishableKey.includes("service_role"), "publishableKey no debe ser service role.");
  assert(!json.anthropicKey && !json.claudeKey, "/api/config no debe exponer la API key de Claude.");
});

await check("GET /api/catalog devuelve planes con precio", async () => {
  const r = await fetch(BASE + "/api/catalog");
  assert(r.ok, `HTTP ${r.status}`);
  const json = await r.json();
  const plans = json.plans || json;
  assert(Array.isArray(plans) && plans.length > 0, "El catálogo debe devolver al menos un plan.");
  assert(plans[0].price_usd || plans[0].id, "Cada plan debe tener id o price_usd.");
});

await check("POST /api/claude sin auth devuelve 401", async () => {
  const r = await fetch(BASE + "/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userText: "test" }),
  });
  assert(r.status === 401 || r.status === 403, `Se esperaba 401/403, recibido ${r.status}.`);
});

await check("POST /api/checkout sin auth devuelve 401", async () => {
  const r = await fetch(BASE + "/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId: "monthly_v1" }),
  });
  assert(r.status === 401 || r.status === 403, `Se esperaba 401/403, recibido ${r.status}.`);
});

await check("POST /api/admin sin auth devuelve 401/403", async () => {
  const r = await fetch(BASE + "/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "listUsers" }),
  });
  assert(r.status === 401 || r.status === 403, `Se esperaba 401/403, recibido ${r.status}.`);
});

await check("GET /api/analytics sin auth devuelve 401/403", async () => {
  const r = await fetch(BASE + "/api/analytics");
  assert(r.status === 401 || r.status === 403, `Se esperaba 401/403, recibido ${r.status}.`);
});

await check("manifest.webmanifest devuelve JSON válido", async () => {
  const r = await fetch(BASE + "/manifest.webmanifest");
  assert(r.ok, `HTTP ${r.status}`);
  const json = await r.json();
  assert(json.name || json.short_name, "El manifest debe tener name o short_name.");
  assert(Array.isArray(json.icons) && json.icons.length > 0, "El manifest debe tener íconos.");
});

await check("service-worker.js devuelve JS válido", async () => {
  const r = await fetch(BASE + "/service-worker.js");
  assert(r.ok, `HTTP ${r.status}`);
  const text = await r.text();
  assert(text.includes("CACHE_NAME") || text.includes("fitbud-pwa"), "El SW no parece el de Fitbros.");
  assert(!text.includes("ANTHROPIC_API_KEY") && !text.includes("sk-ant-"), "El SW no debe contener secrets.");
});

// ── Resumen ───────────────────────────────────────────────────────────────────
const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks pasaron.`);
if (failed.length) {
  console.error(`✗ ${failed.length} check(s) fallaron.`);
  process.exit(1);
}
const avgMs = Math.round(results.reduce((a, r) => a + (r.ms || 0), 0) / results.filter(r => r.ms).length);
console.log(`✓ Smoke test OK (latencia promedio ~${avgMs} ms).`);
