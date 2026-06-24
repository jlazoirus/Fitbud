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

const user = {
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  email: "user@example.com",
};
const admin = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  email: "admin@example.com",
};
const handler = await importHandler("api/coupon.js");

let res = capture();
await handler({ method: "POST", headers: {}, body: { action: "redeem", code: "FIT-TEST-1234" } }, res);
assert(res.statusCode === 401, "Debe exigir sesión para generar o canjear códigos.");

let currentUser = user;
let currentProfile = { active: true, is_admin: false };
let requests = [];

global.fetch = async (url, options = {}) => {
  const value = String(url);
  const body = options.body ? JSON.parse(options.body) : null;
  requests.push({
    url: value,
    method: options.method || "GET",
    authorization: options.headers && options.headers.Authorization,
    body,
  });

  if (value.endsWith("/auth/v1/user")) return response(200, currentUser);
  if (value.includes("/rest/v1/profiles?id=eq." + currentUser.id)) return response(200, [currentProfile]);
  if (value.includes("/rest/v1/subscription_plans?")) {
    assert(options.headers.Authorization === "Bearer service", "El catálogo debe validarse con service role.");
    return response(200, [{ id: "monthly" }]);
  }
  if (value.endsWith("/rest/v1/redemption_codes")) {
    assert(options.method === "POST", "La generación debe insertar redemption_codes.");
    assert(options.headers.Authorization === "Bearer service", "redemption_codes debe escribirse con service role.");
    assert(body.code && /^FIT-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(body.code), "El código debe tener formato FIT-XXXX-XXXX.");
    return response(201, [{
      code: body.code,
      plan_id: body.plan_id,
      duration_days: body.duration_days,
      valid_until: body.valid_until,
      created_at: "2026-06-24T05:00:00.000Z",
    }]);
  }
  if (value.endsWith("/rest/v1/rpc/redeem_redemption_code")) {
    assert(options.method === "POST", "El canje debe usar la función transaccional.");
    assert(options.headers.Authorization === "Bearer service", "La función de canje debe llamarse con service role.");
    assert(body.p_code === "FIT-X7K2-9ABQ", "Debe normalizar códigos sin guiones.");
    assert(body.p_user_id === user.id, "Debe canjear para el usuario autenticado.");
    return response(200, [{
      id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      plan_id: "monthly",
      status: "active",
      starts_at: "2026-06-24T05:00:00.000Z",
      expires_at: "2026-07-01T05:00:00.000Z",
      origin: "coupon",
      duration_days: 7,
    }]);
  }
  throw new Error("Ruta no simulada: " + value);
};

res = capture();
await handler({
  method: "POST",
  headers: { authorization: "Bearer user-token" },
  body: { action: "generate" },
}, res);
assert(res.statusCode === 403, "Un usuario regular no debe generar códigos.");

currentUser = admin;
currentProfile = { active: true, is_admin: true };
res = capture();
await handler({
  method: "POST",
  headers: { authorization: "Bearer admin-token" },
  body: { action: "generate", durationDays: 7, validUntil: "2026-07-31T00:00:00Z" },
}, res);
assert(res.statusCode === 201, "Admin debe generar códigos.");
assert(res.body.duration_days === 7, "Debe conservar duración configurable.");
assert(res.body.valid_until === "2026-07-31T00:00:00.000Z", "Debe normalizar validUntil ISO.");
assert(requests.some(item => item.url.endsWith("/rest/v1/redemption_codes")), "Debe insertar redemption_codes.");

currentUser = user;
currentProfile = { active: true, is_admin: false };
res = capture();
await handler({
  method: "POST",
  headers: { authorization: "Bearer user-token" },
  body: { action: "redeem", code: "fitx7k29abq" },
}, res);
assert(res.statusCode === 200, "Usuario autenticado debe canjear un código válido.");
assert(res.body.entitlement.origin === "coupon", "El entitlement debe tener origen coupon.");
assert(res.body.entitlement.duration_days === 7, "Debe devolver la duración real del código.");

console.log("API coupon: generación admin, bloqueo no-admin y canje seguro verificados con mocks.");
