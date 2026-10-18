// REQ-205: registro por invitación en api/entitlement.js (beta cerrada).
// Verifica con fetch simulado: valida el código antes de crear la cuenta,
// crea el usuario con service role, canjea y, si el canje falla, borra la cuenta.
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
const handler = await importHandler("api/entitlement.js");
const NEW_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

let codeRow, createStatus, redeemOk, calls;
global.fetch = async (url, options = {}) => {
  const value = String(url);
  const method = options.method || "GET";
  calls.push(method + " " + value.replace("https://test.supabase.co", ""));
  assert(!options.headers || options.headers.Authorization === "Bearer service", "Todo el registro va con service role: " + value);
  if (value.includes("/rest/v1/redemption_codes?code=eq.")) return response(200, codeRow ? [codeRow] : []);
  if (value.endsWith("/auth/v1/admin/users") && method === "POST") {
    const body = JSON.parse(options.body);
    assert(body.email_confirm === true && body.email === "ana@correo.test", "Crea el usuario confirmado con el correo normalizado.");
    if (createStatus === 422) return response(422, { code: "email_exists", msg: "A user with this email address has already been registered" });
    return response(200, { id: NEW_ID, email: body.email });
  }
  if (value.endsWith("/rest/v1/rpc/redeem_redemption_code")) {
    const body = JSON.parse(options.body);
    assert(body.p_user_id === NEW_ID && body.p_code === "FIT-AB12-CD34", "Canjea el código para el usuario recién creado.");
    return redeemOk
      ? response(200, [{ id: "e1", plan_id: "quarterly", status: "courtesy", origin: "coupon", duration_days: 90, starts_at: "2026-10-18T00:00:00Z", expires_at: "2027-01-16T00:00:00Z" }])
      : response(400, { message: "Este código ya fue utilizado." });
  }
  if (value.endsWith("/auth/v1/admin/users/" + NEW_ID) && method === "DELETE") return response(200, {});
  throw new Error("fetch inesperado: " + method + " " + value);
};

async function signup(body, setup) {
  codeRow = { code: "FIT-AB12-CD34", redeemed_by: null, valid_until: null };
  createStatus = 200; redeemOk = true; calls = [];
  if (setup) setup();
  const res = capture();
  await handler({ method: "POST", headers: {}, body: { action: "invite-signup", code: "fit ab12 cd34", email: " Ana@Correo.test ", password: "ClaveSegura2026", ...body } }, res);
  return res;
}

let res = await signup({});
assert(res.statusCode === 201 && res.body.ok && res.body.entitlement.duration_days === 90, "Código válido: crea la cuenta y devuelve 90 días.");
assert(calls.length === 3, "Valida, crea y canjea (3 llamadas): " + calls.join(", "));

res = await signup({}, () => { codeRow = null; });
assert(res.statusCode === 400 && res.body.error === "Código no válido." && calls.length === 1, "Código inexistente: no crea cuenta.");

res = await signup({}, () => { codeRow.redeemed_by = NEW_ID; });
assert(res.statusCode === 400 && res.body.error === "Este código ya fue utilizado." && calls.length === 1, "Código usado: no crea cuenta.");

res = await signup({}, () => { codeRow.valid_until = "2020-01-01T00:00:00Z"; });
assert(res.statusCode === 400 && res.body.error === "El código ha expirado.", "Código vencido: no crea cuenta.");

res = await signup({ password: "corta" });
assert(res.statusCode === 400 && calls.length === 0, "Contraseña corta: se rechaza antes de tocar Supabase.");

res = await signup({ email: "no-es-correo" });
assert(res.statusCode === 400 && calls.length === 0, "Correo inválido: se rechaza antes de tocar Supabase.");

res = await signup({}, () => { createStatus = 422; });
assert(res.statusCode === 409 && /Ya existe una cuenta/.test(res.body.error), "Correo ya registrado: 409 con instrucción de canjear en Perfil.");

res = await signup({}, () => { redeemOk = false; });
assert(res.statusCode === 400 && res.body.error === "Este código ya fue utilizado.", "Canje perdido en carrera: avisa.");
assert(calls.includes("DELETE /auth/v1/admin/users/" + NEW_ID), "Canje perdido en carrera: borra la cuenta recién creada.");

res = capture();
await handler({ method: "POST", headers: {}, body: { action: "redeem", code: "FIT-AB12-CD34" } }, res);
assert(res.statusCode === 401, "Las demás acciones siguen exigiendo sesión.");

console.log("API invite-signup: validación del código, alta con service role, canje y limpieza verificados con mocks.");
