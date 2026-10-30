// Prueba local con mocks del flujo invite-signup (api/entitlement.js de Fitbud).
// No toca producción: globalThis.fetch se reemplaza por respuestas simuladas.
import { pathToFileURL } from "node:url";

const mod = await import(pathToFileURL(process.argv[2] || new URL("../../api/entitlement.js", import.meta.url).pathname).href);
const handler = mod.default;

process.env.SUPABASE_URL = "https://mock.supabase.co";
process.env.SUPABASE_ANON_KEY = "anon";
process.env.SUPABASE_SERVICE_ROLE_KEY = "svc";

function req(body) {
  return { method: "POST", headers: {}, body: JSON.stringify(body) };
}
function res() {
  return {
    statusCode: 0, payload: null,
    status(code) { this.statusCode = code; return this; },
    json(obj) { this.payload = obj; return this; },
  };
}
const jsonResp = (status, obj) => ({ ok: status >= 200 && status < 300, status, json: async () => obj });

let deletedUser = null;
let scenario = "email_exists";
globalThis.fetch = async (url, opts = {}) => {
  if (url.includes("/rest/v1/redemption_codes")) {
    return jsonResp(200, [{ code: "FIT-TEST-1234", redeemed_by: null, valid_until: null }]);
  }
  if (url.endsWith("/auth/v1/admin/users") && opts.method === "POST") {
    if (scenario === "email_exists") {
      // forma real de GoTrue: code numérico + error_code + msg
      return jsonResp(422, { code: 422, error_code: "email_exists", msg: "A user with this email address has already been registered" });
    }
    if (scenario === "weak_password") {
      return jsonResp(422, { code: 422, error_code: "weak_password", msg: "Password is known to be weak and easy to guess, please choose a different one" });
    }
    return jsonResp(200, { id: "user-mock-1" });
  }
  if (url.includes("/auth/v1/admin/users/") && opts.method === "DELETE") {
    deletedUser = url.split("/").pop();
    return jsonResp(204, {});
  }
  if (url.includes("/rest/v1/rpc/redeem_redemption_code")) {
    if (scenario === "redeem_fails") {
      return jsonResp(400, { code: "23514", details: null, hint: null, message: 'new row for relation "user_entitlements" violates check constraint "user_entitlements_origin_check"' });
    }
    return jsonResp(200, [{ id: "ent-1", plan_id: "quarterly", status: "active", starts_at: "x", expires_at: "y", origin: "coupon", duration_days: 90 }]);
  }
  if (url.includes("/rest/v1/beta_recruitment_submissions")) return jsonResp(200, []);
  throw new Error("fetch inesperado: " + url);
};

const base = { action: "invite-signup", code: "FIT-TEST-1234", email: "tester@example.com", password: "Sup3rSegura!" };
let failures = 0;
async function run(name, scen, expectStatus, expectMsgPart) {
  scenario = scen; deletedUser = null;
  const r = res();
  await handler(req(base), r);
  const ok = r.statusCode === expectStatus && String(r.payload && (r.payload.error || "")).includes(expectMsgPart);
  console.log((ok ? "PASS" : "FAIL") + " | " + name + " | status=" + r.statusCode + " | error=" + (r.payload && r.payload.error ? r.payload.error : "(sin error)"));
  if (!ok) failures++;
}
await run("correo ya registrado (forma GoTrue real) → 409 con instrucciones", "email_exists", 409, "Ya tienes una cuenta con este correo");
await run("contraseña débil → 400", "weak_password", 400, "contraseña");
await run("canje falla por constraint → mensaje amable + usuario borrado", "redeem_fails", 400, "No pudimos canjear");
if (deletedUser !== "user-mock-1") { console.log("FAIL | rollback no borró el usuario (deletedUser=" + deletedUser + ")"); failures++; }
else console.log("PASS | rollback borró el usuario creado");
await run("camino feliz → 201", "ok", 201, "");
process.exit(failures ? 1 : 0);
