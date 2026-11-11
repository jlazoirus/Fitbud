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

const admin = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  email: "admin@example.com",
};
const testUser = {
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  email: "qa-flow@fitbros.app",
  user_metadata: { fitbros_test_user: true },
};
const invitedUser = {
  id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  email: "nuevo@fitbros.app",
  user_metadata: { fitbros_invited: true },
};
const handler = await importHandler("api/admin.js");

let requests = [];
global.fetch = async (url, options = {}) => {
  const value = String(url);
  requests.push({ url: value, method: options.method || "GET", body: options.body || "" });
  if (value.endsWith("/auth/v1/user")) return response(200, admin);
  if (value.includes("/rest/v1/profiles?id=eq." + admin.id)) {
    return response(200, [{ id: admin.id, email: admin.email, is_admin: true, active: true }]);
  }
  if (value.includes("/auth/v1/admin/users?page=")) return response(200, { users: [] });
  if (value.includes("/auth/v1/invite") && options.method === "POST") return response(200, { user: invitedUser });
  if (value.endsWith("/auth/v1/admin/users") && options.method === "POST") return response(200, testUser);
  if (value.includes("/auth/v1/admin/users/" + testUser.id) && options.method === "PUT") return response(200, testUser);
  if (value.includes("/storage/v1/object/list/progress-photos")) return response(200, []);
  if (value.includes("/rest/v1/") && options.method === "DELETE") return response(204, {});
  if (value.includes("/rest/v1/profiles?on_conflict=id") && options.method === "POST") return response(200, [{}]);
  throw new Error("Ruta no simulada: " + value);
};

let res = capture();
await handler({
  method: "POST",
  headers: { authorization: "Bearer admin-token", origin: "https://evolvapp.club" },
  body: {
    action: "inviteUser",
    email: invitedUser.email,
    redirectTo: "https://evolvapp.club/index.html?auth=invite",
  },
}, res);
assert(res.statusCode === 200 && res.body.ok === true, "Debe enviar invitación a un correo nuevo.");
const inviteRequest = requests.find((item) => item.url.includes("/auth/v1/invite") && item.method === "POST");
assert(inviteRequest, "Debe llamar al endpoint de invitación de Supabase Auth.");
assert(inviteRequest.url.includes("redirect_to="), "Debe enviar redirect_to seguro para la invitación.");
const invitePayload = JSON.parse(inviteRequest.body);
assert(invitePayload.email === invitedUser.email, "Debe enviar el correo al invite.");
assert(invitePayload.data.fitbros_invited === true && invitePayload.data.invited_by === admin.id, "Debe auditar metadata de invitación.");
assert(requests.some((item) => item.url.includes("/rest/v1/profiles?on_conflict=id") && item.method === "POST"), "Debe crear/activar profile del invitado.");

requests = [];
res = capture();
await handler({
  method: "POST",
  headers: { authorization: "Bearer admin-token" },
  body: {
    action: "prepareTestUser",
    email: testUser.email,
    password: "FitbrosQA!2026",
  },
}, res);
assert(res.statusCode === 200 && res.body.created === true, "Debe crear la cuenta QA si no existe.");
assert(requests.some((item) => item.url.endsWith("/auth/v1/admin/users") && item.method === "POST"), "Debe crear el usuario en Auth.");
assert(requests.filter((item) => item.method === "DELETE" && item.url.includes("/rest/v1/")).length === 9, "Debe limpiar progreso, privacidad y datos de consumo del coach.");
assert(requests.some((item) => item.url.includes("/rest/v1/profiles?on_conflict=id") && item.method === "POST"), "Debe reiniciar el perfil.");

requests = [];
global.fetch = async (url, options = {}) => {
  const value = String(url);
  requests.push({ url: value, method: options.method || "GET", body: options.body || "" });
  if (value.endsWith("/auth/v1/user")) return response(200, admin);
  if (value.includes("/rest/v1/profiles?id=eq." + admin.id)) {
    return response(200, [{ id: admin.id, email: admin.email, is_admin: true, active: true }]);
  }
  if (value.includes("/auth/v1/admin/users?page=")) return response(200, { users: [testUser] });
  if (value.includes("/rest/v1/profiles?id=eq." + testUser.id)) {
    return response(200, [{ id: testUser.id, email: testUser.email, is_admin: false, active: true }]);
  }
  if (value.includes("/auth/v1/admin/users/" + testUser.id) && options.method === "PUT") return response(200, testUser);
  if (value.includes("/storage/v1/object/list/progress-photos")) return response(200, []);
  if (value.includes("/rest/v1/") && options.method === "DELETE") return response(204, {});
  if (value.includes("/rest/v1/profiles?on_conflict=id") && options.method === "POST") return response(200, [{}]);
  throw new Error("Ruta no simulada: " + value);
};

res = capture();
await handler({
  method: "POST",
  headers: { authorization: "Bearer admin-token" },
  body: {
    action: "prepareTestUser",
    email: testUser.email,
    password: "FitbrosQA!2026",
  },
}, res);
assert(res.statusCode === 200 && res.body.created === false, "Debe reiniciar una cuenta QA existente.");
assert(!requests.some((item) => item.url.endsWith("/auth/v1/admin/users") && item.method === "POST"), "No debe duplicar la cuenta QA.");

global.fetch = async (url) => {
  const value = String(url);
  if (value.endsWith("/auth/v1/user")) return response(200, admin);
  if (value.includes("/rest/v1/profiles?id=eq." + admin.id)) {
    return response(200, [{ id: admin.id, email: admin.email, is_admin: true, active: true }]);
  }
  if (value.includes("/auth/v1/admin/users?page=")) {
    return response(200, { users: [{ ...testUser, user_metadata: {} }] });
  }
  throw new Error("Ruta no simulada: " + value);
};

res = capture();
await handler({
  method: "POST",
  headers: { authorization: "Bearer admin-token" },
  body: {
    action: "prepareTestUser",
    email: testUser.email,
    password: "FitbrosQA!2026",
  },
}, res);
assert(res.statusCode === 409, "No debe limpiar una cuenta normal con el mismo correo.");

requests = [];
global.fetch = async (url, options = {}) => {
  const value = String(url);
  requests.push({ url: value, method: options.method || "GET", body: options.body || "" });
  if (value.endsWith("/auth/v1/user")) return response(200, admin);
  if (value.includes("/rest/v1/profiles?id=eq." + admin.id)) {
    return response(200, [{ id: admin.id, email: admin.email, is_admin: true, active: true }]);
  }
  if (value.includes("/auth/v1/admin/users?page=")) return response(200, { users: [invitedUser] });
  throw new Error("Ruta no simulada: " + value);
};

res = capture();
await handler({
  method: "POST",
  headers: { authorization: "Bearer admin-token" },
  body: { action: "inviteUser", email: invitedUser.email },
}, res);
assert(res.statusCode === 409, "No debe invitar un correo que ya tiene cuenta.");
assert(!requests.some((item) => item.url.includes("/auth/v1/invite")), "No debe llamar invite si el correo ya existe.");

// ── REQ-381: el admin ya no fija contraseñas ajenas ──
const normalUser2 = { id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", email: "user2@example.com" };
requests = [];
global.fetch = async (url, options = {}) => {
  const value = String(url);
  requests.push({ url: value, method: options.method || "GET", body: options.body || "" });
  if (value.endsWith("/auth/v1/user")) return response(200, admin);
  if (value.includes("/rest/v1/profiles?id=eq." + admin.id)) {
    return response(200, [{ id: admin.id, email: admin.email, is_admin: true, active: true }]);
  }
  throw new Error("Ruta no simulada: " + value);
};
res = capture();
await handler({
  method: "POST",
  headers: { authorization: "Bearer admin-token" },
  body: { action: "setPassword", userId: normalUser2.id, password: "NuevaClave123" },
}, res);
assert(res.statusCode === 400, "setPassword ya no debe existir.");
assert(!requests.some((item) => item.method === "PUT" && item.url.includes("/auth/v1/admin/users/")), "No debe tocar la contraseña en Auth.");
console.log("  REQ-381: el admin no puede fijar la contraseña de otra persona.");

// ── REQ-381: la cortesía incluye el coach sin tope hasta que vence ──
function courtesyMocks(existingOverrides) {
  requests = [];
  return async (url, options = {}) => {
    const value = String(url);
    const method = options.method || "GET";
    requests.push({ url: value, method, body: options.body || "" });
    if (value.endsWith("/auth/v1/user")) return response(200, admin);
    if (value.includes("/rest/v1/profiles?id=eq." + admin.id)) {
      return response(200, [{ id: admin.id, email: admin.email, is_admin: true, active: true }]);
    }
    if (value.includes("/rest/v1/profiles?id=eq." + normalUser2.id)) {
      return response(200, [{ id: normalUser2.id, email: normalUser2.email, is_admin: false, active: true }]);
    }
    if (value.includes("/rest/v1/user_entitlements") && method === "POST") {
      const row = JSON.parse(options.body);
      return response(201, [{ id: "ffffffff-ffff-4fff-8fff-ffffffffffff", ...row }]);
    }
    if (value.includes("/rest/v1/coach_quota_overrides?user_id=eq.") && method === "GET") return response(200, existingOverrides);
    if (value.includes("/rest/v1/coach_quota_overrides?on_conflict=") && method === "POST") return response(201, {});
    throw new Error("Ruta no simulada: " + method + " " + value);
  };
}
global.fetch = courtesyMocks([]);
res = capture();
const before = Date.now();
await handler({
  method: "POST",
  headers: { authorization: "Bearer admin-token" },
  body: { action: "grantCourtesy", userId: normalUser2.id, planId: "semiannual", days: 180, notes: "promo" },
}, res);
assert(res.statusCode === 201 && res.body.ok && res.body.coachUnlimited === true, "La cortesía debe quedar con el coach sin tope: " + JSON.stringify(res.body));
const ent = JSON.parse(requests.find((r) => r.url.includes("/user_entitlements") && r.method === "POST").body);
assert(ent.status === "courtesy" && ent.plan_id === "semiannual" && ent.granted_by === admin.id, "Debe crear el acceso de cortesía auditado.");
const expMs = new Date(ent.expires_at).getTime() - before;
assert(Math.abs(expMs - 180 * 86400000) < 60000, "El acceso debe durar los días pedidos.");
const quotaRows = JSON.parse(requests.find((r) => r.url.includes("coach_quota_overrides?on_conflict=")).body);
assert(quotaRows.length === 8, "Debe cubrir todas las acciones del coach.");
assert(quotaRows.every((row) => row.daily_limit === 10000 && row.enabled === true && row.expires_at === ent.expires_at && row.user_id === normalUser2.id),
  "Cada acción queda sin tope y vence junto con el acceso.");

// Nunca acorta una cortesía sin tope que vence después.
const later = new Date(Date.now() + 400 * 86400000).toISOString();
global.fetch = courtesyMocks([
  { action: "coach_conversation", daily_limit: 10000, expires_at: later },
  { action: "diet_day", daily_limit: 10000, expires_at: null },
  { action: "meal_option", daily_limit: null, expires_at: null },
]);
res = capture();
await handler({
  method: "POST",
  headers: { authorization: "Bearer admin-token" },
  body: { action: "grantCourtesy", userId: normalUser2.id, planId: "quarterly", days: 90 },
}, res);
const kept = JSON.parse(requests.find((r) => r.url.includes("coach_quota_overrides?on_conflict=")).body).map((row) => row.action);
assert(kept.length === 6 && !kept.includes("coach_conversation") && !kept.includes("diet_day") && kept.includes("meal_option"),
  "Conserva los topes ya ilimitados más largos y reemplaza los manuales: " + kept.join(","));

// Si falla la cuota, el acceso queda y el admin lo ve.
global.fetch = (() => {
  const base = courtesyMocks([]);
  return async (url, options = {}) => String(url).includes("coach_quota_overrides?on_conflict=")
    ? response(500, { message: "boom" })
    : base(url, options);
})();
res = capture();
await handler({
  method: "POST",
  headers: { authorization: "Bearer admin-token" },
  body: { action: "grantCourtesy", userId: normalUser2.id, planId: "monthly", days: 30 },
}, res);
assert(res.statusCode === 201 && res.body.coachUnlimited === false && /boom/.test(res.body.quotaError), "Debe informar si no se pudo quitar el tope.");

res = capture();
await handler({
  method: "POST",
  headers: { authorization: "Bearer admin-token" },
  body: { action: "grantCourtesy", userId: "no-uuid", planId: "monthly", days: 30 },
}, res);
assert(res.statusCode === 400, "Rechaza un usuario inválido.");
console.log("  REQ-381: la cortesía da el coach sin tope hasta que vence, sin acortar topes más largos.");

console.log("API admin: invitación y usuario QA reiniciable verificados con mocks.");
