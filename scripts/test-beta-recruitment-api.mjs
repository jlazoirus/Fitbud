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

res = capture();
await handler({
  method: "POST",
  headers: {},
  body: {
    name: "Bot",
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

console.log("API beta-recruitment: captura, scoring y validaciones verificados con mocks.");
