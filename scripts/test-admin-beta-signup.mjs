// REQ-208: "Crear cuenta" e "Invitar por correo" con la casilla beta dan, en la
// misma acción, 90 días de acceso completo (cortesía del plan trimestral). Sin la
// casilla no se crea acceso, y si el acceso falla la cuenta no se deshace.
import fs from "node:fs";

async function importHandler(path) {
  const source = fs.readFileSync(new URL("../" + path, import.meta.url), "utf8");
  const url = "data:text/javascript;base64," + Buffer.from(source).toString("base64");
  return (await import(url)).default;
}
const response = (status, data) => ({ ok: status >= 200 && status < 300, status, json: async () => data });
function capture() {
  return { statusCode: 0, body: null, status(c) { this.statusCode = c; return this; }, json(d) { this.body = d; return this; } };
}
function assert(condition, message) { if (!condition) throw new Error(message); }

process.env.SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_PUBLISHABLE_KEY = "publishable";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
const handler = await importHandler("api/admin.js");

const ADMIN_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const NEW_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
let grants = [];
let failGrant = false;

global.fetch = async (url, options = {}) => {
  const value = String(url);
  const method = options.method || "GET";
  const body = options.body ? JSON.parse(options.body) : null;
  if (value.endsWith("/auth/v1/user")) return response(200, { id: ADMIN_ID });
  if (value.includes("/rest/v1/profiles?id=eq." + ADMIN_ID)) return response(200, [{ id: ADMIN_ID, is_admin: true, active: true }]);
  if (value.includes("/auth/v1/admin/users") && method === "GET") return response(200, { users: [] });
  if (value.endsWith("/auth/v1/admin/users") && method === "POST") return response(200, { user: { id: NEW_ID, email: body.email } });
  if (value.includes("/auth/v1/invite")) return response(200, { id: NEW_ID, email: body.email });
  if (value.includes("/rest/v1/profiles?on_conflict=id")) return response(200, [body]);
  if (value.endsWith("/rest/v1/user_entitlements") && method === "POST") {
    if (failGrant) return response(500, { message: "tabla no disponible" });
    assert(options.headers.Authorization === "Bearer service", "El acceso se crea con service role.");
    grants.push(body);
    return response(201, [body]);
  }
  throw new Error("Ruta no simulada: " + method + " " + value);
};

async function call(body) {
  const res = capture();
  await handler({ method: "POST", headers: { authorization: "Bearer admin-token", origin: "https://evolvapp.club" }, body }, res);
  return res;
}

let res = await call({ action: "createUser", email: "ana@correo.com", beta: true });
assert(res.statusCode === 200 && res.body.tempPassword, "Crea la cuenta: " + JSON.stringify(res.body));
const g = grants[0];
assert(g && g.user_id === NEW_ID && g.plan_id === "quarterly" && g.status === "courtesy" && g.granted_by === ADMIN_ID, "Da cortesía trimestral auditada.");
const days = (Date.parse(g.expires_at) - Date.parse(g.starts_at)) / 86400000;
assert(Math.round(days) === 90, "El acceso dura 90 días: " + days);
assert(res.body.betaAccess && res.body.betaAccess.expires_at === g.expires_at, "Devuelve la fecha de fin al admin.");

res = await call({ action: "createUser", email: "beto@correo.com" });
assert(res.statusCode === 200 && grants.length === 1 && !res.body.betaAccess, "Sin la casilla no se crea acceso.");

res = await call({ action: "inviteUser", email: "caro@correo.com", beta: true, redirectTo: "https://evolvapp.club/" });
assert(res.statusCode === 200 && grants.length === 2 && res.body.betaAccess, "Invitar por correo también da el acceso beta.");

failGrant = true;
res = await call({ action: "createUser", email: "dani@correo.com", beta: true });
assert(res.statusCode === 200 && res.body.tempPassword && /acceso beta/.test(res.body.betaError || ""), "Si el acceso falla, la cuenta queda creada y el admin ve el error.");

console.log("API admin: cuentas beta con 90 días de acceso (crear e invitar), sin casilla sin acceso y fallo informado.");
