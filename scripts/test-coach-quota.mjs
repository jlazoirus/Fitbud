import fs from "node:fs";

async function importHandler(path) {
  const source = fs.readFileSync(new URL("../" + path, import.meta.url), "utf8");
  const url = "data:text/javascript;base64," + Buffer.from(source).toString("base64");
  return (await import(url)).default;
}

function response(status, data) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  };
}

function capture() {
  return {
    statusCode: 0,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

process.env.SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_PUBLISHABLE_KEY = "publishable";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
process.env.ANTHROPIC_API_KEY = "provider-secret";

const user = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "user@example.com",
};
const admin = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  email: "admin@example.com",
};
const requestId = "22222222-2222-4222-8222-222222222222";
const optionText = JSON.stringify({
  opciones: [{
    nombre: "Bowl de quinua",
    kcal: 500,
    proteina_g: 35,
    carbohidratos_g: 55,
    grasa_g: 15,
  }],
});
const quotaBody = {
  userText: "Sugiere una comida",
  system: "Contexto",
  quota: {
    action: "meal_option",
    requestId,
    partKey: "options",
    contextKey: "ctx-compatible",
    fallbackText: optionText,
    validation: { hardRestrictions: ["huevo"] },
  },
};

function authRoutes(value) {
  if (value.endsWith("/auth/v1/user")) return response(200, user);
  if (value.includes("/rest/v1/profiles")) {
    return response(200, [{ active: true, is_admin: false, prefs: { age: 30, timeZone: "America/Lima" } }]);
  }
  if (value.includes("/rest/v1/user_consents")) {
    return response(200, [{ consent_type: "body_progress" }, { consent_type: "automated_coach" }]);
  }
  if (value.includes("/rest/v1/safety_screenings")) {
    return response(200, [{ age_confirmed: true, has_red_flags: false, cleared_for_training: true }]);
  }
  return null;
}

const handler = await importHandler("api/claude.js");
let providerCalls = 0;
let completedCalls = 0;
let failedCalls = 0;

global.fetch = async (url, options = {}) => {
  const value = String(url);
  const auth = authRoutes(value);
  if (auth) return auth;
  if (value.endsWith("/rest/v1/rpc/reserve_coach_action")) {
    return response(200, [{
      usage_id: 10,
      mode: "fresh",
      usage_status: "reserved",
      effective_limit: 4,
      quota_day: "2026-06-15",
      policy_enabled: true,
    }]);
  }
  if (value.endsWith("/rest/v1/rpc/claim_coach_generation_part")) {
    return response(200, [{ claimed: true, part_status: "processing", response_text: null, result_id: null }]);
  }
  if (value.endsWith("/rest/v1/rpc/complete_fresh_coach_part")) {
    completedCalls += 1;
    return response(200, [{ stored_result_id: 77 }]);
  }
  if (value.endsWith("/rest/v1/rpc/fail_coach_generation_part")) {
    failedCalls += 1;
    return response(200, false);
  }
  if (value.includes("api.anthropic.com")) {
    providerCalls += 1;
    return response(200, {
      content: [{ text: optionText }],
      usage: { input_tokens: 100, output_tokens: 50 },
    });
  }
  throw new Error("Ruta no simulada: " + value + " " + (options.method || "GET"));
};

let res = capture();
await handler({ method: "POST", headers: { authorization: "Bearer token" }, body: quotaBody }, res);
assert(res.statusCode === 200, "Una reserva fresca valida debe responder.");
assert(providerCalls === 1, "La reserva fresca debe llamar una sola vez al proveedor.");
assert(completedCalls === 1 && failedCalls === 0, "Debe completar y guardar la opcion valida.");

providerCalls = 0;
global.fetch = async (url) => {
  const value = String(url);
  const auth = authRoutes(value);
  if (auth) return auth;
  if (value.endsWith("/rest/v1/rpc/reserve_coach_action")) {
    return response(200, [{ usage_id: 10, mode: "fresh", usage_status: "completed", effective_limit: 4, quota_day: "2026-06-15", policy_enabled: true }]);
  }
  if (value.endsWith("/rest/v1/rpc/claim_coach_generation_part")) {
    return response(200, [{ claimed: false, part_status: "completed", response_text: optionText, result_id: 77 }]);
  }
  if (value.includes("api.anthropic.com")) {
    providerCalls += 1;
    return response(500, {});
  }
  throw new Error("Ruta no simulada: " + value);
};
res = capture();
await handler({ method: "POST", headers: { authorization: "Bearer token" }, body: quotaBody }, res);
assert(res.statusCode === 200 && res.body.text === optionText, "Repetir el mismo request debe devolver la parte guardada.");
assert(providerCalls === 0, "Un request idempotente no debe repetir la llamada externa.");

providerCalls = 0;
global.fetch = async (url) => {
  const value = String(url);
  const auth = authRoutes(value);
  if (auth) return auth;
  if (value.endsWith("/rest/v1/rpc/reserve_coach_action")) {
    return response(200, [{ usage_id: 11, mode: "reuse", usage_status: "reused", effective_limit: 1, quota_day: "2026-06-15", policy_enabled: true }]);
  }
  if (value.endsWith("/rest/v1/rpc/claim_coach_generation_part")) {
    return response(200, [{ claimed: true, part_status: "processing", response_text: null, result_id: null }]);
  }
  if (value.endsWith("/rest/v1/rpc/select_reusable_coach_part")) {
    return response(200, [{ selected_text: optionText, selected_result_id: 77, selected_origin: "user_pool" }]);
  }
  if (value.includes("api.anthropic.com")) {
    providerCalls += 1;
    return response(500, {});
  }
  throw new Error("Ruta no simulada: " + value);
};
res = capture();
await handler({
  method: "POST",
  headers: { authorization: "Bearer token" },
  body: { ...quotaBody, quota: { ...quotaBody.quota, requestId: "33333333-3333-4333-8333-333333333333" } },
}, res);
assert(res.statusCode === 200 && res.body.text === optionText, "Al agotar cuota debe reutilizar una opcion compatible.");
assert(providerCalls === 0, "La reutilizacion no debe llamar al proveedor.");

failedCalls = 0;
global.fetch = async (url) => {
  const value = String(url);
  const auth = authRoutes(value);
  if (auth) return auth;
  if (value.endsWith("/rest/v1/rpc/reserve_coach_action")) {
    return response(200, [{ usage_id: 12, mode: "fresh", usage_status: "reserved", effective_limit: 4, quota_day: "2026-06-15", policy_enabled: true }]);
  }
  if (value.endsWith("/rest/v1/rpc/claim_coach_generation_part")) {
    return response(200, [{ claimed: true, part_status: "processing", response_text: null, result_id: null }]);
  }
  if (value.endsWith("/rest/v1/rpc/fail_coach_generation_part")) {
    failedCalls += 1;
    return response(200, true);
  }
  if (value.includes("api.anthropic.com")) return response(503, { error: { message: "timeout" } });
  throw new Error("Ruta no simulada: " + value);
};
res = capture();
await handler({
  method: "POST",
  headers: { authorization: "Bearer token" },
  body: { ...quotaBody, quota: { ...quotaBody.quota, requestId: "44444444-4444-4444-8444-444444444444" } },
}, res);
assert(res.statusCode === 503, "El error externo debe propagarse sin opcion falsa.");
assert(failedCalls === 1, "Un fallo tecnico debe devolver la reserva.");

const adminHandler = await importHandler("api/admin.js");
global.fetch = async (url, options = {}) => {
  const value = String(url);
  if (value.endsWith("/auth/v1/user")) return response(200, admin);
  if (value.includes("/rest/v1/profiles?id=eq." + admin.id)) {
    return response(200, [{ id: admin.id, email: admin.email, is_admin: true, active: true }]);
  }
  if (value.includes("/rest/v1/coach_quota_policies") && (options.method || "GET") === "GET") {
    return response(200, [{ action: "diet_day", entitlement_code: "default", daily_limit: 3, enabled: true }]);
  }
  if (value.includes("/rest/v1/coach_quota_overrides")) return response(200, []);
  if (value.includes("/rest/v1/coach_usage")) {
    return response(200, [
      { user_id: user.id, action: "diet_day", status: "completed", origin: "fresh", error_code: null },
      { user_id: user.id, action: "diet_day", status: "reused", origin: "user_pool", error_code: null },
    ]);
  }
  throw new Error("Ruta admin no simulada: " + value);
};
res = capture();
await adminHandler({
  method: "POST",
  headers: { authorization: "Bearer admin-token" },
  body: { action: "quotaOverview" },
}, res);
assert(res.statusCode === 200, "El administrador debe consultar políticas y consumo.");
assert(res.body.summary.diet_day.fresh === 1 && res.body.summary.diet_day.reused === 1, "El resumen debe separar nuevo y reutilizado.");

let savedPolicy = null;
global.fetch = async (url, options = {}) => {
  const value = String(url);
  if (value.endsWith("/auth/v1/user")) return response(200, admin);
  if (value.includes("/rest/v1/profiles?id=eq." + admin.id)) {
    return response(200, [{ id: admin.id, email: admin.email, is_admin: true, active: true }]);
  }
  if (value.includes("/rest/v1/coach_quota_policies?on_conflict=") && options.method === "POST") {
    savedPolicy = JSON.parse(options.body);
    return response(200, [savedPolicy]);
  }
  throw new Error("Ruta de política no simulada: " + value);
};
res = capture();
await adminHandler({
  method: "POST",
  headers: { authorization: "Bearer admin-token" },
  body: { action: "setQuotaPolicy", quotaAction: "diet_day", dailyLimit: 2, enabled: false },
}, res);
assert(res.statusCode === 200 && savedPolicy.daily_limit === 2 && savedPolicy.enabled === false, "El admin debe editar y desactivar políticas.");

let savedOverride = null;
global.fetch = async (url, options = {}) => {
  const value = String(url);
  if (value.endsWith("/auth/v1/user")) return response(200, admin);
  if (value.includes("/rest/v1/profiles?id=eq." + admin.id)) {
    return response(200, [{ id: admin.id, email: admin.email, is_admin: true, active: true }]);
  }
  if (value.includes("/rest/v1/profiles?id=eq." + user.id)) {
    return response(200, [{ id: user.id, email: user.email, is_admin: false, active: true }]);
  }
  if (value.includes("/rest/v1/coach_quota_overrides?on_conflict=") && options.method === "POST") {
    savedOverride = JSON.parse(options.body);
    return response(200, [savedOverride]);
  }
  throw new Error("Ruta de cortesía no simulada: " + value);
};
res = capture();
await adminHandler({
  method: "POST",
  headers: { authorization: "Bearer admin-token" },
  body: { action: "setQuotaOverride", userId: user.id, quotaAction: "meal_option", dailyLimit: "", bonusUnits: 2 },
}, res);
assert(res.statusCode === 200 && savedOverride.bonus_units === 2, "El admin debe otorgar cortesía por usuario.");

global.fetch = async (url) => {
  const value = String(url);
  if (value.endsWith("/auth/v1/user")) return response(200, admin);
  if (value.includes("/rest/v1/profiles?id=eq." + admin.id)) {
    return response(200, [{ id: admin.id, email: admin.email, is_admin: true, active: true }]);
  }
  if (value.endsWith("/rest/v1/rpc/admin_reset_coach_quota")) return response(200, 2);
  throw new Error("Ruta de reinicio no simulada: " + value);
};
res = capture();
await adminHandler({
  method: "POST",
  headers: { authorization: "Bearer admin-token" },
  body: { action: "resetQuota", userId: user.id, quotaAction: "meal_option" },
}, res);
assert(res.statusCode === 200 && res.body.reset === 2, "El admin debe reiniciar consumo sin borrar auditoría.");

console.log("Cuotas del coach: idempotencia, reutilizacion, devolucion y administracion verificadas con mocks.");
