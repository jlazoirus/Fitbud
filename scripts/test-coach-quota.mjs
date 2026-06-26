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

// --- diet_day: estructura valida debe pasar validateDietDay ---
const validDietDayText = JSON.stringify({
  explicacion: "Plan equilibrado.",
  comidas: [
    { slot_id: "desayuno", nombre: "Avena proteica", ingredientes: [{ nombre: "Avena", gramos: 80 }, { nombre: "Leche desnatada", gramos: 200 }], kcal: 350, proteina_g: 18, carbohidratos_g: 55, grasa_g: 5 },
    { slot_id: "almuerzo", nombre: "Pollo con arroz", ingredientes: [{ nombre: "Pechuga de pollo", gramos: 150 }, { nombre: "Arroz cocido", gramos: 200 }], kcal: 520, proteina_g: 45, carbohidratos_g: 70, grasa_g: 8 },
    { slot_id: "snack", nombre: "Yogur con fruta", ingredientes: [{ nombre: "Yogur natural", gramos: 150 }, { nombre: "Arandanos", gramos: 80 }], kcal: 180, proteina_g: 12, carbohidratos_g: 25, grasa_g: 3 },
    { slot_id: "cena", nombre: "Salmon al horno", ingredientes: [{ nombre: "Salmon", gramos: 180 }, { nombre: "Espinacas", gramos: 150 }], kcal: 380, proteina_g: 38, carbohidratos_g: 5, grasa_g: 20 },
  ],
});

const dietDayQuota = {
  action: "diet_day",
  requestId: "55555555-5555-4555-8555-555555555555",
  partKey: "day",
  contextKey: "ctx-diet-day-test",
  fallbackText: validDietDayText,
  validation: { expectedMeals: 4, slots: ["desayuno", "almuerzo", "snack", "cena"], hardRestrictions: [] },
};

completedCalls = 0; failedCalls = 0; providerCalls = 0;
global.fetch = async (url, options = {}) => {
  const value = String(url);
  const auth = authRoutes(value);
  if (auth) return auth;
  if (value.endsWith("/rest/v1/rpc/reserve_coach_action")) return response(200, [{ usage_id: 20, mode: "fresh", usage_status: "reserved", effective_limit: 3, quota_day: "2026-06-25", policy_enabled: true }]);
  if (value.endsWith("/rest/v1/rpc/claim_coach_generation_part")) return response(200, [{ claimed: true, part_status: "processing", response_text: null, result_id: null }]);
  if (value.endsWith("/rest/v1/rpc/complete_fresh_coach_part")) { completedCalls += 1; return response(200, [{ stored_result_id: 88 }]); }
  if (value.endsWith("/rest/v1/rpc/fail_coach_generation_part")) { failedCalls += 1; return response(200, true); }
  if (value.includes("api.anthropic.com")) { providerCalls += 1; return response(200, { content: [{ text: validDietDayText }], usage: { input_tokens: 200, output_tokens: 300 } }); }
  throw new Error("Ruta diet_day no simulada: " + value);
};
res = capture();
await handler({ method: "POST", headers: { authorization: "Bearer token" }, body: { userText: "Genera mi dia", system: "Contexto", quota: dietDayQuota } }, res);
assert(res.statusCode === 200, "diet_day valido debe completarse con 200.");
assert(completedCalls === 1 && failedCalls === 0, "diet_day valido debe guardar sin registrar fallo.");

// --- diet_day: ingrediente restringido debe rechazar con 422 ---
const restrictedDietDayText = JSON.stringify({
  explicacion: "Plan con proteina.",
  comidas: [
    { slot_id: "desayuno", nombre: "Tortilla de huevo", ingredientes: [{ nombre: "Huevo", gramos: 100 }, { nombre: "Tomate", gramos: 80 }], kcal: 220, proteina_g: 14, carbohidratos_g: 5, grasa_g: 15 },
    { slot_id: "almuerzo", nombre: "Pollo con arroz", ingredientes: [{ nombre: "Pollo", gramos: 150 }, { nombre: "Arroz", gramos: 200 }], kcal: 500, proteina_g: 42, carbohidratos_g: 68, grasa_g: 7 },
    { slot_id: "snack", nombre: "Batido de proteina", ingredientes: [{ nombre: "Proteina en polvo", gramos: 30 }, { nombre: "Agua", gramos: 300 }], kcal: 120, proteina_g: 24, carbohidratos_g: 3, grasa_g: 1 },
    { slot_id: "cena", nombre: "Atun con ensalada", ingredientes: [{ nombre: "Atun en lata", gramos: 150 }, { nombre: "Lechuga", gramos: 100 }], kcal: 250, proteina_g: 35, carbohidratos_g: 5, grasa_g: 8 },
  ],
});

failedCalls = 0; providerCalls = 0;
global.fetch = async (url, options = {}) => {
  const value = String(url);
  const auth = authRoutes(value);
  if (auth) return auth;
  if (value.endsWith("/rest/v1/rpc/reserve_coach_action")) return response(200, [{ usage_id: 21, mode: "fresh", usage_status: "reserved", effective_limit: 3, quota_day: "2026-06-25", policy_enabled: true }]);
  if (value.endsWith("/rest/v1/rpc/claim_coach_generation_part")) return response(200, [{ claimed: true, part_status: "processing", response_text: null, result_id: null }]);
  if (value.endsWith("/rest/v1/rpc/fail_coach_generation_part")) { failedCalls += 1; return response(200, true); }
  if (value.includes("api.anthropic.com")) { providerCalls += 1; return response(200, { content: [{ text: restrictedDietDayText }], usage: { input_tokens: 200, output_tokens: 300 } }); }
  throw new Error("Ruta diet_day restringido no simulada: " + value);
};
res = capture();
await handler({
  method: "POST", headers: { authorization: "Bearer token" },
  body: { userText: "Genera mi dia", system: "Contexto", quota: { ...dietDayQuota, requestId: "66666666-6666-4666-8666-666666666666", validation: { ...dietDayQuota.validation, hardRestrictions: ["huevo"] } } },
}, res);
assert(res.statusCode === 422, "diet_day con ingrediente restringido debe rechazar con 422.");
assert(failedCalls === 1, "diet_day rechazado debe registrar invalid_provider_output.");

console.log("diet_day: estructura valida y rechazo por restriccion verificados.");

// --- REQ-65: perfil vegano debe rechazar un día con lácteo ---
// coachHardRestrictions() añade términos de lácteo cuando diet incluye "vegano"; el servidor los
// recibe en validation.hardRestrictions y debe devolver 422 si un plato los contiene. "Leche
// vegetal" NO debe disparar (no se incluye el término "leche" a secas).
const veganViolationText = JSON.stringify({
  explicacion: "Plan vegano con un desliz de lácteo.",
  comidas: [
    { slot_id: "desayuno", nombre: "Avena con leche vegetal", ingredientes: [{ nombre: "Avena", gramos: 80 }, { nombre: "Leche vegetal", gramos: 200 }], kcal: 350, proteina_g: 14, carbohidratos_g: 55, grasa_g: 6 },
    { slot_id: "almuerzo", nombre: "Bowl de tofu y arroz", ingredientes: [{ nombre: "Tofu firme", gramos: 200 }, { nombre: "Arroz cocido", gramos: 220 }], kcal: 560, proteina_g: 32, carbohidratos_g: 78, grasa_g: 12 },
    { slot_id: "snack", nombre: "Hummus con verduras", ingredientes: [{ nombre: "Hummus", gramos: 120 }, { nombre: "Pimiento", gramos: 100 }], kcal: 230, proteina_g: 9, carbohidratos_g: 22, grasa_g: 11 },
    { slot_id: "cena", nombre: "Ensalada con queso fresco", ingredientes: [{ nombre: "Queso fresco", gramos: 100 }, { nombre: "Lechuga", gramos: 100 }], kcal: 250, proteina_g: 18, carbohidratos_g: 6, grasa_g: 16 },
  ],
});

failedCalls = 0; providerCalls = 0;
global.fetch = async (url, options = {}) => {
  const value = String(url);
  const auth = authRoutes(value);
  if (auth) return auth;
  if (value.endsWith("/rest/v1/rpc/reserve_coach_action")) return response(200, [{ usage_id: 22, mode: "fresh", usage_status: "reserved", effective_limit: 3, quota_day: "2026-06-25", policy_enabled: true }]);
  if (value.endsWith("/rest/v1/rpc/claim_coach_generation_part")) return response(200, [{ claimed: true, part_status: "processing", response_text: null, result_id: null }]);
  if (value.endsWith("/rest/v1/rpc/fail_coach_generation_part")) { failedCalls += 1; return response(200, true); }
  if (value.includes("api.anthropic.com")) { providerCalls += 1; return response(200, { content: [{ text: veganViolationText }], usage: { input_tokens: 200, output_tokens: 300 } }); }
  throw new Error("Ruta diet_day vegano no simulada: " + value);
};
res = capture();
await handler({
  method: "POST", headers: { authorization: "Bearer token" },
  body: { userText: "Genera mi dia", system: "Contexto", quota: { ...dietDayQuota, requestId: "77777777-7777-4777-8777-777777777777", validation: { ...dietDayQuota.validation, hardRestrictions: ["queso", "yogur", "yogurt", "parmesano", "leche evaporada", "lácteo", "lacteo"] } } },
}, res);
assert(res.statusCode === 422, "REQ-65: diet_day vegano con queso fresco debe rechazar con 422.");
assert(failedCalls === 1, "REQ-65: el rechazo vegano debe registrar invalid_provider_output.");

// El mismo set de términos NO debe rechazar un día 100% vegetal (control: leche vegetal sí permitida).
const veganCleanText = JSON.stringify({
  explicacion: "Plan vegano correcto.",
  comidas: [
    { slot_id: "desayuno", nombre: "Avena con leche vegetal", ingredientes: [{ nombre: "Avena", gramos: 80 }, { nombre: "Leche vegetal", gramos: 200 }], kcal: 350, proteina_g: 14, carbohidratos_g: 55, grasa_g: 6 },
    { slot_id: "almuerzo", nombre: "Bowl de tofu y arroz", ingredientes: [{ nombre: "Tofu firme", gramos: 200 }, { nombre: "Arroz cocido", gramos: 220 }], kcal: 560, proteina_g: 32, carbohidratos_g: 78, grasa_g: 12 },
    { slot_id: "snack", nombre: "Hummus con verduras", ingredientes: [{ nombre: "Hummus", gramos: 120 }, { nombre: "Pimiento", gramos: 100 }], kcal: 230, proteina_g: 9, carbohidratos_g: 22, grasa_g: 11 },
    { slot_id: "cena", nombre: "Tempeh salteado con quinua", ingredientes: [{ nombre: "Tempeh", gramos: 150 }, { nombre: "Quinua cocida", gramos: 180 }], kcal: 420, proteina_g: 28, carbohidratos_g: 40, grasa_g: 16 },
  ],
});

completedCalls = 0; failedCalls = 0; providerCalls = 0;
global.fetch = async (url, options = {}) => {
  const value = String(url);
  const auth = authRoutes(value);
  if (auth) return auth;
  if (value.endsWith("/rest/v1/rpc/reserve_coach_action")) return response(200, [{ usage_id: 23, mode: "fresh", usage_status: "reserved", effective_limit: 3, quota_day: "2026-06-25", policy_enabled: true }]);
  if (value.endsWith("/rest/v1/rpc/claim_coach_generation_part")) return response(200, [{ claimed: true, part_status: "processing", response_text: null, result_id: null }]);
  if (value.endsWith("/rest/v1/rpc/complete_fresh_coach_part")) { completedCalls += 1; return response(200, [{ stored_result_id: 99 }]); }
  if (value.endsWith("/rest/v1/rpc/fail_coach_generation_part")) { failedCalls += 1; return response(200, true); }
  if (value.includes("api.anthropic.com")) { providerCalls += 1; return response(200, { content: [{ text: veganCleanText }], usage: { input_tokens: 200, output_tokens: 300 } }); }
  throw new Error("Ruta diet_day vegano limpio no simulada: " + value);
};
res = capture();
await handler({
  method: "POST", headers: { authorization: "Bearer token" },
  body: { userText: "Genera mi dia", system: "Contexto", quota: { ...dietDayQuota, requestId: "88888888-8888-4888-8888-888888888888", validation: { ...dietDayQuota.validation, hardRestrictions: ["queso", "yogur", "yogurt", "parmesano", "leche evaporada", "lácteo", "lacteo"] } } },
}, res);
assert(res.statusCode === 200, "REQ-65: día vegano sin lácteos (con leche vegetal) debe pasar.");
assert(completedCalls === 1 && failedCalls === 0, "REQ-65: 'leche vegetal' no debe disparar el término de lácteo.");

console.log("REQ-65: enforcement de lacteos para vegano (rechazo + control de leche vegetal) verificado.");

// --- REQ-66: carne/pescado para vegetariano/vegano + regresión de matcher por palabra ---
// Términos cárnicos que coachHardRestrictions() añade para vegetariano/vegano.
const MEAT_TERMS = ["carne", "pollo", "pavo", "cerdo", "ternera", "res", "jamón", "chorizo", "tocino", "pescado", "atún", "salmón", "trucha", "merluza", "gamba", "langostino", "camarón", "marisco", "calamar", "pulpo", "anchoa", "sardina"];

const chickenDayText = JSON.stringify({
  explicacion: "Día omnívoro con pollo.",
  comidas: [
    { slot_id: "desayuno", nombre: "Avena con fruta", ingredientes: [{ nombre: "Avena", gramos: 80 }, { nombre: "Plátano", gramos: 100 }], kcal: 350, proteina_g: 12, carbohidratos_g: 60, grasa_g: 6 },
    { slot_id: "almuerzo", nombre: "Pollo a la plancha + arroz", ingredientes: [{ nombre: "Pechuga de pollo", gramos: 180 }, { nombre: "Arroz cocido", gramos: 200 }], kcal: 560, proteina_g: 60, carbohidratos_g: 55, grasa_g: 10 },
    { slot_id: "snack", nombre: "Hummus con verduras", ingredientes: [{ nombre: "Hummus", gramos: 100 }, { nombre: "Pimiento", gramos: 100 }], kcal: 200, proteina_g: 8, carbohidratos_g: 20, grasa_g: 10 },
    { slot_id: "cena", nombre: "Tofu salteado", ingredientes: [{ nombre: "Tofu firme", gramos: 200 }, { nombre: "Verduras mixtas", gramos: 150 }], kcal: 300, proteina_g: 22, carbohidratos_g: 12, grasa_g: 16 },
  ],
});

// 1) Vegetariano: el día con pollo debe rechazarse (422).
failedCalls = 0; providerCalls = 0;
global.fetch = async (url) => {
  const value = String(url);
  const auth = authRoutes(value);
  if (auth) return auth;
  if (value.endsWith("/rest/v1/rpc/reserve_coach_action")) return response(200, [{ usage_id: 30, mode: "fresh", usage_status: "reserved", effective_limit: 3, quota_day: "2026-06-25", policy_enabled: true }]);
  if (value.endsWith("/rest/v1/rpc/claim_coach_generation_part")) return response(200, [{ claimed: true, part_status: "processing", response_text: null, result_id: null }]);
  if (value.endsWith("/rest/v1/rpc/fail_coach_generation_part")) { failedCalls += 1; return response(200, true); }
  if (value.includes("api.anthropic.com")) { providerCalls += 1; return response(200, { content: [{ text: chickenDayText }], usage: { input_tokens: 200, output_tokens: 300 } }); }
  throw new Error("Ruta diet_day vegetariano/pollo no simulada: " + value);
};
res = capture();
await handler({
  method: "POST", headers: { authorization: "Bearer token" },
  body: { userText: "Genera mi dia", system: "Contexto", quota: { ...dietDayQuota, requestId: "a1a1a1a1-aaaa-4aaa-8aaa-a11111111111", validation: { ...dietDayQuota.validation, hardRestrictions: MEAT_TERMS } } },
}, res);
assert(res.statusCode === 422, "REQ-66: vegetariano con pechuga de pollo debe rechazar con 422.");
assert(failedCalls === 1, "REQ-66: el rechazo de carne debe registrar invalid_provider_output.");

// 2) Omnívoro (sin restricciones de carne): el mismo día con pollo debe pasar (200).
completedCalls = 0; failedCalls = 0; providerCalls = 0;
global.fetch = async (url) => {
  const value = String(url);
  const auth = authRoutes(value);
  if (auth) return auth;
  if (value.endsWith("/rest/v1/rpc/reserve_coach_action")) return response(200, [{ usage_id: 31, mode: "fresh", usage_status: "reserved", effective_limit: 3, quota_day: "2026-06-25", policy_enabled: true }]);
  if (value.endsWith("/rest/v1/rpc/claim_coach_generation_part")) return response(200, [{ claimed: true, part_status: "processing", response_text: null, result_id: null }]);
  if (value.endsWith("/rest/v1/rpc/complete_fresh_coach_part")) { completedCalls += 1; return response(200, [{ stored_result_id: 100 }]); }
  if (value.endsWith("/rest/v1/rpc/fail_coach_generation_part")) { failedCalls += 1; return response(200, true); }
  if (value.includes("api.anthropic.com")) { providerCalls += 1; return response(200, { content: [{ text: chickenDayText }], usage: { input_tokens: 200, output_tokens: 300 } }); }
  throw new Error("Ruta diet_day omnivoro no simulada: " + value);
};
res = capture();
await handler({
  method: "POST", headers: { authorization: "Bearer token" },
  body: { userText: "Genera mi dia", system: "Contexto", quota: { ...dietDayQuota, requestId: "b2b2b2b2-bbbb-4bbb-8bbb-b22222222222", validation: { ...dietDayQuota.validation, hardRestrictions: [] } } },
}, res);
assert(res.statusCode === 200, "REQ-66: omnívoro con pollo debe pasar (200).");
assert(completedCalls === 1 && failedCalls === 0, "REQ-66: el día omnívoro debe completarse sin fallo.");

// 3) Regresión del matcher: un día vegetariano con "Repollo" NO debe rechazarse aunque "pollo"
//    esté entre las restricciones (prueba que el matcher es por palabra, no substring).
const cabbageDayText = JSON.stringify({
  explicacion: "Día vegetariano con repollo.",
  comidas: [
    { slot_id: "desayuno", nombre: "Avena con fruta", ingredientes: [{ nombre: "Avena", gramos: 80 }, { nombre: "Plátano", gramos: 100 }], kcal: 350, proteina_g: 12, carbohidratos_g: 60, grasa_g: 6 },
    { slot_id: "almuerzo", nombre: "Tacos de frijol con repollo", ingredientes: [{ nombre: "Frijoles negros cocidos", gramos: 200 }, { nombre: "Repollo", gramos: 100 }, { nombre: "Tortilla de maíz", gramos: 75 }], kcal: 480, proteina_g: 20, carbohidratos_g: 70, grasa_g: 8 },
    { slot_id: "snack", nombre: "Queso fresco con tomate", ingredientes: [{ nombre: "Queso fresco", gramos: 80 }, { nombre: "Tomate", gramos: 100 }], kcal: 180, proteina_g: 14, carbohidratos_g: 6, grasa_g: 11 },
    { slot_id: "cena", nombre: "Tofu salteado", ingredientes: [{ nombre: "Tofu firme", gramos: 200 }, { nombre: "Verduras mixtas", gramos: 150 }], kcal: 300, proteina_g: 22, carbohidratos_g: 12, grasa_g: 16 },
  ],
});

completedCalls = 0; failedCalls = 0; providerCalls = 0;
global.fetch = async (url) => {
  const value = String(url);
  const auth = authRoutes(value);
  if (auth) return auth;
  if (value.endsWith("/rest/v1/rpc/reserve_coach_action")) return response(200, [{ usage_id: 32, mode: "fresh", usage_status: "reserved", effective_limit: 3, quota_day: "2026-06-25", policy_enabled: true }]);
  if (value.endsWith("/rest/v1/rpc/claim_coach_generation_part")) return response(200, [{ claimed: true, part_status: "processing", response_text: null, result_id: null }]);
  if (value.endsWith("/rest/v1/rpc/complete_fresh_coach_part")) { completedCalls += 1; return response(200, [{ stored_result_id: 101 }]); }
  if (value.endsWith("/rest/v1/rpc/fail_coach_generation_part")) { failedCalls += 1; return response(200, true); }
  if (value.includes("api.anthropic.com")) { providerCalls += 1; return response(200, { content: [{ text: cabbageDayText }], usage: { input_tokens: 200, output_tokens: 300 } }); }
  throw new Error("Ruta diet_day repollo no simulada: " + value);
};
res = capture();
await handler({
  method: "POST", headers: { authorization: "Bearer token" },
  body: { userText: "Genera mi dia", system: "Contexto", quota: { ...dietDayQuota, requestId: "c3c3c3c3-cccc-4ccc-8ccc-c33333333333", validation: { ...dietDayQuota.validation, hardRestrictions: MEAT_TERMS } } },
}, res);
assert(res.statusCode === 200, "REQ-66: 'repollo' no debe activar el término 'pollo' (matcher por palabra).");
assert(completedCalls === 1 && failedCalls === 0, "REQ-66: el día con repollo debe completarse sin fallo.");

console.log("REQ-66: carne para vegetariano rechazada, omnivoro permitido y regresion repollo/pollo verificadas.");
