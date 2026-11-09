// REQ-371: inscripción corta al club por /api/beta-recruitment?op=unete.
import fs from "node:fs";

const source = fs.readFileSync(new URL("../api/beta-recruitment.js", import.meta.url), "utf8");
const moduleUrl = "data:text/javascript;base64," + Buffer.from(source).toString("base64");
const handler = (await import(moduleUrl)).default;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function capture() {
  return {
    statusCode: 0,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
  };
}

process.env.SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service";

let calls = [];
let reply = { ok: true, status: 201, json: async () => ({}) };
global.fetch = async (url, options = {}) => {
  calls.push({ url: String(url), options });
  return reply;
};

async function post(body, url = "/api/beta-recruitment?op=unete") {
  const res = capture();
  await handler({ method: "POST", url, query: { op: "unete" }, body }, res);
  return res;
}

const valid = {
  name: "  Ana   Prueba ",
  email: "Ana@Correo.test",
  whatsapp: "+51 999 111 222",
  pain: "comer_fuera",
  consent: true,
  website: "",
  source: "IG-bio-s1",
};

// Inscripción completa: guarda solo en community_signups y normaliza.
{
  calls = [];
  const res = await post(valid);
  assert(res.statusCode === 200 && res.body.ok === true, "Debe aceptar una inscripción válida.");
  assert(calls.length === 1, "Debe hacer una sola llamada.");
  assert(calls[0].url.includes("/rest/v1/community_signups?on_conflict=email"), "Debe escribir en community_signups.");
  assert(!calls[0].url.includes("beta_recruitment_submissions"), "No debe mezclarse con las postulaciones.");
  assert(calls[0].options.headers.prefer.includes("ignore-duplicates"), "Un correo repetido conserva su primer origen.");
  const row = JSON.parse(calls[0].options.body);
  assert(row.name === "Ana Prueba", "Debe limpiar el nombre.");
  assert(row.email === "ana@correo.test", "Debe normalizar el correo.");
  assert(row.source === "ig-bio-s1", "Debe guardar el origen en minúsculas.");
  assert(row.pain === "comer_fuera", "Debe guardar la respuesta opcional.");
  assert(typeof row.consent_at === "string", "Debe registrar cuándo dio el consentimiento.");
  assert(!("website" in row) && !("consent" in row), "No debe guardar campos internos.");
}

// Opcionales vacíos y valores fuera de lista.
{
  calls = [];
  const res = await post({ ...valid, whatsapp: "", pain: "inventado", source: "<script>" });
  assert(res.statusCode === 200, "WhatsApp y la pregunta son opcionales.");
  const row = JSON.parse(calls[0].options.body);
  assert(row.whatsapp === null, "Sin WhatsApp guarda null.");
  assert(row.pain === null, "Una respuesta fuera de lista no se guarda.");
  assert(row.source === "unete", "Un origen inválido cae al valor por defecto.");
}

// Rechazos: nada llega a la base.
for (const [label, body, expected] of [
  ["sin nombre", { ...valid, name: "" }, /nombre/],
  ["correo inválido", { ...valid, email: "no-es-correo" }, /correo/],
  ["WhatsApp corto", { ...valid, whatsapp: "123" }, /WhatsApp/],
  ["sin consentimiento", { ...valid, consent: false }, /casilla/],
  ["consentimiento no booleano", { ...valid, consent: "true" }, /casilla/],
  ["bot por el campo oculto", { ...valid, website: "http://spam.test" }, /procesar/],
]) {
  calls = [];
  const res = await post(body);
  assert(res.statusCode === 400, `${label}: debe responder 400.`);
  assert(expected.test(res.body.error), `${label}: mensaje inesperado "${res.body.error}".`);
  assert(calls.length === 0, `${label}: no debe llamar a la base.`);
}

// Tabla sin aplicar y otros fallos: mensajes de persona.
{
  reply = { ok: false, status: 404, json: async () => ({ code: "42P01" }) };
  const res = await post(valid);
  assert(res.statusCode === 503 && res.body.setup_pending === true, "Sin tabla debe avisar 503.");
  assert(/inscripciones/.test(res.body.error), "El mensaje debe hablar de inscripciones.");

  reply = { ok: false, status: 500, json: async () => ({}) };
  const failed = await post(valid);
  assert(failed.statusCode === 500 && /inscripción/.test(failed.body.error), "Un fallo de base da un mensaje claro.");
  reply = { ok: true, status: 201, json: async () => ({}) };
}

// La ruta de la beta sigue igual: sin op no entra al flujo corto.
{
  calls = [];
  const res = capture();
  await handler({ method: "POST", url: "/api/beta-recruitment", body: { name: "" } }, res);
  assert(res.statusCode === 400, "La beta sigue validando su propio formulario.");
  assert(/nombre/i.test(res.body.error), "La beta conserva sus mensajes.");
  assert(calls.length === 0, "Una postulación inválida no llega a la base.");
}

console.log("test-unete-api: OK");
