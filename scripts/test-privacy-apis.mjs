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
  created_at: "2026-06-15T00:00:00.000Z",
};

const claudeHandler = await importHandler("api/claude.js");
let providerCalls = 0;
global.fetch = async (url) => {
  const value = String(url);
  if (value.endsWith("/auth/v1/user")) return response(200, user);
  if (value.includes("/rest/v1/profiles")) return response(200, [{ active: true, prefs: { age: 30 } }]);
  if (value.includes("/rest/v1/user_consents")) return response(200, []);
  if (value.includes("/rest/v1/safety_screenings")) return response(200, []);
  if (value.includes("api.anthropic.com")) {
    providerCalls += 1;
    return response(200, { content: [{ text: "{}" }] });
  }
  throw new Error("Ruta no simulada: " + value);
};
let res = capture();
await claudeHandler({
  method: "POST",
  headers: { authorization: "Bearer token" },
  body: { userText: "Prepara una opcion" },
}, res);
assert(res.statusCode === 403, "El coach debe rechazar consentimientos faltantes.");
assert(providerCalls === 0, "No debe llamar al proveedor sin consentimiento.");

global.fetch = async (url) => {
  const value = String(url);
  if (value.endsWith("/auth/v1/user")) return response(200, user);
  if (value.includes("/rest/v1/profiles")) return response(200, [{ active: true, prefs: { age: 17 } }]);
  if (value.includes("/rest/v1/user_consents")) {
    return response(200, [{ consent_type: "body_progress" }, { consent_type: "automated_coach" }]);
  }
  if (value.includes("/rest/v1/safety_screenings")) {
    return response(200, [{ age_confirmed: true, has_red_flags: false, cleared_for_training: true }]);
  }
  if (value.includes("api.anthropic.com")) {
    providerCalls += 1;
    return response(200, { content: [{ text: "{}" }] });
  }
  throw new Error("Ruta no simulada: " + value);
};
res = capture();
await claudeHandler({
  method: "POST",
  headers: { authorization: "Bearer token" },
  body: { userText: "Prepara una opcion" },
}, res);
assert(res.statusCode === 403, "El servidor debe aplicar la edad minima.");
assert(providerCalls === 0, "No debe llamar al proveedor para una cuenta menor de edad.");

let providerSystem = "";
global.fetch = async (url, options = {}) => {
  const value = String(url);
  if (value.endsWith("/auth/v1/user")) return response(200, user);
  if (value.includes("/rest/v1/profiles")) return response(200, [{ active: true, prefs: { age: 30 } }]);
  if (value.includes("/rest/v1/user_consents")) {
    return response(200, [{ consent_type: "body_progress" }, { consent_type: "automated_coach" }]);
  }
  if (value.includes("/rest/v1/safety_screenings")) {
    return response(200, [{ age_confirmed: true, has_red_flags: false, cleared_for_training: true }]);
  }
  if (value.includes("api.anthropic.com")) {
    providerCalls += 1;
    providerSystem = JSON.parse(options.body).system;
    return response(200, { content: [{ text: "{}" }] });
  }
  throw new Error("Ruta no simulada: " + value);
};
res = capture();
await claudeHandler({
  method: "POST",
  headers: { authorization: "Bearer token" },
  body: { userText: "Prepara una opcion", system: "Contexto del perfil" },
}, res);
assert(res.statusCode === 200, "El coach debe aceptar privacidad vigente.");
assert(providerCalls === 1, "Debe realizar una sola llamada autorizada.");
assert(providerSystem.includes("No diagnostiques"), "El servidor debe inyectar guardrails.");

const privacyHandler = await importHandler("api/privacy.js");
let deletedUser = false;
global.fetch = async (url, options = {}) => {
  const value = String(url);
  if (value.endsWith("/auth/v1/user")) return response(200, user);
  if (value.includes("/rest/v1/profiles")) {
    if (value.includes("is_admin=eq.true")) return response(200, [{ id: "admin" }]);
    return response(200, [{ id: user.id, email: user.email, is_admin: false, active: true, prefs: {} }]);
  }
  if (value.includes("/rest/v1/")) return response(200, []);
  if (value.includes("/storage/v1/object/list/progress-photos")) return response(200, []);
  if (value.includes("/auth/v1/admin/users/") && options.method === "DELETE") {
    deletedUser = true;
    return response(200, {});
  }
  throw new Error("Ruta no simulada: " + value);
};
res = capture();
await privacyHandler({ method: "GET", headers: { authorization: "Bearer token" } }, res);
assert(res.statusCode === 200, "La exportacion autenticada debe responder.");
assert(res.body.account.id === user.id, "La exportacion debe pertenecer al usuario autenticado.");

res = capture();
await privacyHandler({
  method: "DELETE",
  headers: { authorization: "Bearer token" },
  body: { confirmation: "BORRAR otra@example.com" },
}, res);
assert(res.statusCode === 400 && !deletedUser, "Una confirmacion incorrecta no debe borrar.");

res = capture();
await privacyHandler({
  method: "DELETE",
  headers: { authorization: "Bearer token" },
  body: { confirmation: "BORRAR user@example.com" },
}, res);
assert(res.statusCode === 200 && deletedUser, "La confirmacion exacta debe borrar la cuenta.");

console.log("APIs de privacidad: consentimiento, exportacion y borrado verificados con mocks.");
