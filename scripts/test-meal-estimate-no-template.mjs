#!/usr/bin/env node
// REQ-268 — "Estimar macros" nunca aplica una plantilla genérica (500/25/55/20)
// como si fuera la estimación de la comida descrita. Con la cuota de frescas
// agotada solo vale una generación previa del mismo contexto (user_pool); si no
// hay, el servidor responde 422 no_compatible_result y la reserva se devuelve.
import fs from "node:fs";

async function importHandler(path) {
  const source = fs.readFileSync(new URL("../" + path, import.meta.url), "utf8");
  return (await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"))).default;
}
const response = (status, data) => ({ ok: status >= 200 && status < 300, status, json: async () => data });
function capture() {
  return { statusCode: 0, body: null, status(c) { this.statusCode = c; return this; }, json(d) { this.body = d; return this; } };
}
function assert(condition, message) { if (!condition) throw new Error(message); }

process.env.SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_PUBLISHABLE_KEY = "publishable";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
process.env.ANTHROPIC_API_KEY = "provider-secret";

const user = { id: "11111111-1111-4111-8111-111111111111", email: "user@example.com" };
function authRoutes(value) {
  if (value.endsWith("/auth/v1/user")) return response(200, user);
  if (value.includes("/rest/v1/profiles")) return response(200, [{ active: true, is_admin: false, prefs: { age: 30, timeZone: "America/Lima" } }]);
  if (value.includes("/rest/v1/user_consents")) return response(200, [{ consent_type: "body_progress" }, { consent_type: "automated_coach" }]);
  if (value.includes("/rest/v1/safety_screenings")) return response(200, [{ age_confirmed: true, has_red_flags: false, cleared_for_training: true }]);
  return null;
}
const handler = await importHandler("api/claude.js");
const estimate = JSON.stringify({ nombre: "Ceviche", kcal: 380, proteina_g: 40, carbohidratos_g: 30, grasa_g: 8, nota: "Plato mediano.", preguntas: [] });
let n = 0;
const body = (fallbackText) => ({
  userText: "Estima kcal y macros de esta comida: \"Un vaso de agua\"",
  system: "Contexto",
  quota: { action: "meal_estimate", requestId: `5555555${n}-5555-4555-8555-55555555555${n++}`, partKey: "estimate", contextKey: "ctx-agua", fallbackText, validation: {} },
});

// Simula la reserva en modo reuse y lo que haría select_reusable_coach_part.
function reuseRoutes(select, log) {
  return async (url, options = {}) => {
    const value = String(url);
    const auth = authRoutes(value);
    if (auth) return auth;
    if (value.endsWith("/rpc/reserve_coach_action")) return response(200, [{ usage_id: 90, mode: "reuse", usage_status: "reused", effective_limit: 1, quota_day: "2026-10-24", policy_enabled: true }]);
    if (value.endsWith("/rpc/claim_coach_generation_part")) return response(200, [{ claimed: true, part_status: "processing", response_text: null, result_id: null }]);
    if (value.includes("/rest/v1/coach_option_pool?")) return response(200, [{ id: 7, response_text: estimate }]);
    if (value.endsWith("/rpc/select_reusable_coach_part")) { log.selectPayload = JSON.parse(options.body || "{}"); return select(log.selectPayload); }
    if (value.endsWith("/rpc/fail_coach_generation_part")) { log.failed = JSON.parse(options.body || "{}"); return response(200, true); }
    if (value.includes("api.anthropic.com")) { log.provider = true; return response(500, {}); }
    throw new Error("Ruta no simulada: " + value);
  };
}
// La función SQL lanza compatible_fallback_required si no hay pool y el fallback llega vacío.
const sqlLike = (pool) => (payload) => pool
  ? response(200, [{ selected_text: pool, selected_result_id: 7, selected_origin: "user_pool" }])
  : payload.p_fallback_text
    ? response(200, [{ selected_text: payload.p_fallback_text, selected_result_id: null, selected_origin: "template" }])
    : response(400, { message: "compatible_fallback_required", code: "P0001" });

// 1. Sin generación compatible: 422 con código, sin plantilla y con la reserva devuelta.
let log = {};
global.fetch = reuseRoutes(sqlLike(null), log);
let res = capture();
await handler({ method: "POST", headers: { authorization: "Bearer t" }, body: body("") }, res);
assert(res.statusCode === 422 && res.body.code === "no_compatible_result", "Sin resultado compatible debe responder 422 no_compatible_result.");
assert(!res.body.text, "No debe devolver ningún texto de estimación.");
assert(log.failed && log.failed.p_error_code === "no_compatible_result", "La parte debe marcarse fallida para devolver la reserva.");
assert(log.selectPayload.p_fallback_text === "", "Nunca se envía una plantilla a la selección.");
assert(!log.provider, "La reutilización no llama al proveedor.");
console.log("  Sin generación compatible: 422 no_compatible_result, sin plantilla");

// 2. Un cliente antiguo que aún manda la plantilla 500/25/55/20 tampoco la recibe.
log = {};
global.fetch = reuseRoutes(sqlLike(null), log);
res = capture();
const legacy = JSON.stringify({ kcal: 500, proteina_g: 25, carbohidratos_g: 55, grasa_g: 20, nota: "Estimación de referencia." });
await handler({ method: "POST", headers: { authorization: "Bearer t" }, body: body(legacy) }, res);
assert(res.statusCode === 422 && res.body.code === "no_compatible_result", "La plantilla de un cliente antiguo se ignora.");
assert(log.selectPayload.p_fallback_text === "", "El servidor descarta el fallback de meal_estimate.");
console.log("  La plantilla de un cliente antiguo se descarta en el servidor");

// 3. Reutilización exacta: misma descripción y contexto, generación previa del mismo usuario.
log = {};
global.fetch = reuseRoutes(sqlLike(estimate), log);
res = capture();
await handler({ method: "POST", headers: { authorization: "Bearer t" }, body: body("") }, res);
assert(res.statusCode === 200 && res.body.text === estimate && res.body.reused === true && res.body.origin === "reused", "La reutilización compatible sigue funcionando.");
assert(/^estimate-v2-[a-f0-9]{64}$/.test(log.selectPayload.p_context_key), "La selección usa el contexto de entrada verificado por el servidor.");
console.log("  La reutilización de una generación compatible sigue funcionando");

// 4. Si la base devolviera igualmente una plantilla, el servidor la rechaza.
log = {};
global.fetch = reuseRoutes(() => response(200, [{ selected_text: legacy, selected_result_id: null, selected_origin: "template" }]), log);
res = capture();
await handler({ method: "POST", headers: { authorization: "Bearer t" }, body: body("") }, res);
assert(res.statusCode === 422 && res.body.code === "no_compatible_result", "Un origen template nunca se sirve como estimación.");
console.log("  Un origen template nunca se sirve como estimación");

// 5. Otras acciones conservan su plantilla compatible (fuera de alcance).
const api = fs.readFileSync(new URL("../api/claude.js", import.meta.url), "utf8");
assert(/NO_TEMPLATE_ACTIONS = new Set\(\["meal_estimate"\]\)/.test(api), "Solo meal_estimate deja de usar plantilla.");

// 6. El cliente ya no fabrica una plantilla y valida lo que aplica.
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const estimateCode = html.slice(html.indexOf("async function aiEstimate("), html.indexOf("function renderPhotoEstimate("));
assert(!/kcal:500/.test(estimateCode) && !/Estimación de referencia/.test(estimateCode), "El cliente no envía la plantilla 500 kcal.");
assert(/coachQuota\("meal_estimate",requestId,"estimate",""/.test(estimateCode), "La estimación por texto va sin fallback.");
assert(/coachQuota\("meal_estimate",requestId,"photo-"\+st\.round,""/.test(estimateCode), "La estimación por foto va sin fallback.");
assert(/function validEstimate\(/.test(html) && /lastCoachCallOrigin==="template"/.test(html), "El cliente rechaza respuestas template o inválidas.");
console.log("  El cliente no fabrica plantillas y valida antes de aplicar");

console.log("test-meal-estimate-no-template: OK");
