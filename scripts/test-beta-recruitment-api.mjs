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
process.env.SUPABASE_SERVICE_ROLE_KEY = "service";

const handler = await importHandler("api/beta-recruitment.js");

let requests = [];
global.fetch = async (url, options = {}) => {
  const value = String(url);
  requests.push({ url: value, method: options.method || "GET", body: options.body || "" });
  if (value.includes("/rest/v1/beta_recruitment_submissions") && options.method === "POST") {
    const body = JSON.parse(options.body);
    assert(body.whatsapp_normalized === "51999888777", "Debe normalizar WhatsApp.");
    assert(body.segment === "B - Principiante guiado", "Debe calcular segmento B en servidor.");
    assert(body.priority === "Alta", "Debe calcular prioridad alta en servidor.");
    assert(body.beta_eligible === true, "Debe marcar beta elegible.");
    assert(!("status" in body), "No debe resetear status al deduplicar.");
    assert(!("clientScore" in body), "No debe confiar en score del cliente.");
    return response(200, [{
      id: 12,
      created_at: "2026-06-29T00:00:00Z",
      updated_at: "2026-06-29T00:00:00Z",
      segment: body.segment,
      priority: body.priority,
      priority_score: body.priority_score,
      beta_eligible: body.beta_eligible,
      status: "new",
    }]);
  }
  throw new Error("Ruta no simulada: " + value);
};

let res = capture();
await handler({ method: "GET", headers: {} }, res);
assert(res.statusCode === 405, "Debe rechazar metodos que no sean POST.");

res = capture();
await handler({
  method: "POST",
  headers: {},
  body: {
    name: "Ana Test",
    email: "Ana@Correo.test",
    whatsapp: "+51 999 888 777",
    age: "25-34",
    city: "Lima, Peru",
    stage: "beginner",
    goal: "Bajar grasa",
    recentAttempt: "yes",
    tools: ["Nada sostenido", "YouTube o redes"],
    pains: ["No se que comer o entrenar hoy", "Me abruma decidir o empezar", "Abandono despues de 1-3 semanas"],
    story: "La ultima vez me inscribi al gimnasio y abandone porque no sabia que hacer cada dia ni como ordenar mi comida.",
    investment: "time",
    availability: "interview_beta",
    health: "clear",
    clientScore: "Alta",
  },
}, res);
assert(res.statusCode === 200 && res.body.ok === true, "Debe guardar una postulacion valida.");
assert(res.body.submission.id === 12, "Debe devolver el id guardado.");
assert(requests.some((item) => item.url.includes("on_conflict=whatsapp_normalized")), "Debe deduplicar por WhatsApp normalizado.");
assert(requests.some((item) => item.body && JSON.parse(item.body).raw_payload?.email === "ana@correo.test"), "REQ-225: guarda el correo normalizado para la invitación.");

res = capture();
await handler({
  method: "POST",
  headers: {},
  body: {
    name: "Bot",
    email: "Ana@Correo.test",
    whatsapp: "+51 999 888 777",
    website: "https://spam.example",
  },
}, res);
assert(res.statusCode === 400, "Debe rechazar honeypot.");

res = capture();
await handler({
  method: "POST",
  headers: {},
  body: {
    name: "Ana",
    email: "ana@correo.test",
    whatsapp: "123",
    age: "25-34",
    city: "Lima",
    stage: "beginner",
    goal: "Bajar grasa",
    recentAttempt: "yes",
    pains: ["No se que comer o entrenar hoy"],
    story: "Caso demasiado corto.",
    investment: "time",
    availability: "interview",
    health: "clear",
  },
}, res);
assert(res.statusCode === 400 && String(res.body.error).includes("WhatsApp"), "Debe validar WhatsApp.");

// REQ-226: aviso al admin por correo con Resend (misma conexión que api/notify.js)
const validBody = {
  name: "Ana <Test>", email: "ana@correo.test", whatsapp: "+51 999 888 777", age: "25-34", city: "Lima",
  stage: "beginner", goal: "Bajar grasa", recentAttempt: "yes", tools: [], pains: ["Me abruma decidir o empezar"],
  story: "Dejé el gym cuando cambió mi horario de trabajo.", investment: "time", availability: "interview_beta", health: "caution",
};
let mails = [];
let resendStatus = 200;
let rowCreatedAt = null;
const baseFetch = global.fetch;
global.fetch = async (url, options = {}) => {
  const value = String(url);
  if (value === "https://api.resend.com/emails") {
    mails.push({ auth: options.headers.Authorization, body: JSON.parse(options.body) });
    return response(resendStatus, { id: "m1" });
  }
  if (value.includes("/rest/v1/profiles?is_admin=eq.true")) return response(200, [{ email: "admin@evolv.test" }]);
  if (value.includes("/rest/v1/beta_recruitment_submissions") && options.method === "POST" && rowCreatedAt) {
    return response(201, [{ id: 13, created_at: rowCreatedAt, updated_at: new Date().toISOString(), status: "new" }]);
  }
  return baseFetch(url, options);
};
process.env.RESEND_API_KEY = "re_test";
process.env.NOTIFY_FROM_EMAIL = "Evolv <hola@evolv.test>";
delete process.env.BETA_NOTIFY_EMAIL;

rowCreatedAt = new Date().toISOString();
res = capture();
await handler({ method: "POST", headers: {}, body: validBody }, res);
assert(res.statusCode === 200 && mails.length === 1, "Postulación nueva: avisa por correo.");
const mail = mails[0].body;
assert(mails[0].auth === "Bearer re_test" && mail.from === "Evolv <hola@evolv.test>", "Usa la conexión de Resend de la app.");
assert(JSON.stringify(mail.to) === JSON.stringify(["admin@evolv.test"]), "Sin BETA_NOTIFY_EMAIL va a los admins activos.");
assert(mail.subject === "Nueva postulación a la beta: Ana <Test>" && mail.reply_to === "ana@correo.test", "Asunto con el nombre y respuesta directa al postulante.");
assert(mail.html.includes("Ana &lt;Test&gt;") && !mail.html.includes("<Test>"), "El correo escapa lo que escribe el postulante.");
assert(mail.html.includes("/admin?ver=postulantes") && mail.html.includes("lesión o indicación médica"), "Lleva el enlace a revisar y el aviso de salud.");

mails = [];
rowCreatedAt = "2026-01-01T00:00:00Z";
res = capture();
await handler({ method: "POST", headers: {}, body: validBody }, res);
assert(res.statusCode === 200 && mails.length === 0, "Re-postulación con el mismo WhatsApp: no vuelve a avisar.");

mails = []; resendStatus = 500; rowCreatedAt = new Date().toISOString();
process.env.BETA_NOTIFY_EMAIL = "yo@evolv.test, socio@evolv.test";
res = capture();
await handler({ method: "POST", headers: {}, body: validBody }, res);
assert(res.statusCode === 200 && res.body.ok === true, "Si Resend falla, la postulación se guarda igual.");
assert(JSON.stringify(mails[0].body.to) === JSON.stringify(["yo@evolv.test", "socio@evolv.test"]), "BETA_NOTIFY_EMAIL define los destinatarios.");

console.log("API beta-recruitment: captura, scoring, validaciones y aviso por correo al admin verificados con mocks.");
