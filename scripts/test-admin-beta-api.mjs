// REQ-218: acciones de postulantes beta en api/admin.js (solo admin).
// Con fetch simulado: lista con conteos, aceptar crea un código de 90 días del
// plan quarterly y marca beta_invited con nota, y el estado solo acepta valores válidos.
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
delete process.env.APP_URL;
const handler = await importHandler("api/admin.js");

const ADMIN_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
let isAdmin = true;
let codeInserts = [];
let patches = [];
const ana = { id: 7, name: "Ana Pérez", whatsapp: "+51 999 111 222", status: "new", review_notes: null };

global.fetch = async (url, options = {}) => {
  const value = String(url);
  const method = options.method || "GET";
  const body = options.body ? JSON.parse(options.body) : null;
  if (value.endsWith("/auth/v1/user")) return response(200, { id: ADMIN_ID });
  if (value.includes("/rest/v1/profiles?id=eq." + ADMIN_ID)) return response(200, [{ id: ADMIN_ID, is_admin: isAdmin, active: true }]);
  if (value.includes("/rest/v1/beta_recruitment_submissions?select=status&limit=")) {
    return response(200, [{ status: "new" }, { status: "shortlisted" }, { status: "beta_invited" }, { status: "rejected" }]);
  }
  if (value.includes("/rest/v1/beta_recruitment_submissions?select=") && method === "GET") {
    assert(value.includes("status=in.(new,shortlisted"), "Por revisar filtra los estados abiertos: " + value);
    return response(200, [ana]);
  }
  if (value.includes("/rest/v1/beta_recruitment_submissions?id=eq.7") && method === "GET") return response(200, [ana]);
  if (value.includes("/rest/v1/beta_recruitment_submissions?id=eq.") && method === "GET") return response(200, []);
  if (value.includes("/rest/v1/beta_recruitment_submissions?id=eq.7") && method === "PATCH") {
    patches.push(body);
    return response(200, [{ ...ana, ...body }]);
  }
  if (value.endsWith("/rest/v1/redemption_codes") && method === "POST") {
    assert(options.headers.Authorization === "Bearer service", "El código se crea con service role.");
    codeInserts.push(body);
    return response(201, {});
  }
  throw new Error("Ruta no simulada: " + method + " " + value);
};

async function call(body) {
  const res = capture();
  await handler({ method: "POST", headers: { authorization: "Bearer admin-token" }, body }, res);
  return res;
}

let res = await call({ action: "betaApplicants", filter: "pending" });
assert(res.statusCode === 200 && res.body.applicants.length === 1, "Lista postulantes por revisar.");
assert(JSON.stringify(res.body.counts) === JSON.stringify({ pending: 2, invited: 1, closed: 1 }), "Cuenta por grupo: " + JSON.stringify(res.body.counts));

res = await call({ action: "betaAccept", id: 7 });
assert(res.statusCode === 200, "Aceptar responde 200: " + JSON.stringify(res.body));
const insert = codeInserts[0];
assert(insert && /^FIT-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(insert.code) && insert.plan_id === "quarterly" && insert.duration_days === 90, "Crea un código de 90 días del plan quarterly.");
assert(insert.created_by === ADMIN_ID && Date.parse(insert.valid_until) > Date.now() + 29 * 86400000, "El código queda auditado y activable 30 días.");
assert(patches[0].status === "beta_invited" && patches[0].contacted_at && patches[0].review_notes.includes(insert.code), "Marca beta_invited con nota del código.");
assert(res.body.link === "https://evolvapp.club/?codigo=" + insert.code, "El enlace canjea el código.");
assert(res.body.message.startsWith("Hola Ana,") && res.body.message.includes("3 meses") && res.body.message.includes(insert.code), "Mensaje personalizado con el código.");
assert(res.body.whatsappUrl.startsWith("https://wa.me/51999111222?text="), "Enlace de WhatsApp al número normalizado.");
assert(!/\b(IA|prompt|tokens?|modelo)\b/i.test(res.body.message), "El mensaje no usa vocabulario interno (REQ-31).");

res = await call({ action: "betaAccept", id: 999 });
assert(res.statusCode === 404, "Postulación inexistente: 404.");
res = await call({ action: "betaAccept", id: "7; drop" });
assert(res.statusCode === 400, "Id inválido: 400.");

res = await call({ action: "betaSetStatus", id: 7, status: "rejected" });
assert(res.statusCode === 200 && patches.at(-1).status === "rejected", "Descartar cambia el estado.");
res = await call({ action: "betaSetStatus", id: 7, status: "beta_invited" });
assert(res.statusCode === 400, "beta_invited solo se pone aceptando (con código).");

isAdmin = false;
res = await call({ action: "betaAccept", id: 7 });
assert(res.statusCode === 403, "Un usuario normal no puede aceptar postulantes.");

console.log("API admin beta: lista, aceptar (código de 90 días + WhatsApp), estados y permisos verificados con mocks.");
