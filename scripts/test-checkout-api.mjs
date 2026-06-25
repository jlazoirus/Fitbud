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
process.env.STRIPE_PRICE_MONTHLY = "price_monthly";
process.env.STRIPE_PRICE_QUARTERLY = "price_quarterly";
process.env.NOTIFY_APP_URL = "https://fitbud.test";
delete process.env.STRIPE_SECRET_KEY;

const handler = await importHandler("api/checkout.js");
const user = {
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  email: "user@example.com",
};

let requests = [];
global.fetch = async (url, options = {}) => {
  const value = String(url);
  requests.push({
    url: value,
    method: options.method || "GET",
    authorization: options.headers && options.headers.Authorization,
    body: options.body,
  });

  if (value.endsWith("/auth/v1/user")) {
    return response(200, user);
  }
  if (value === "https://api.stripe.com/v1/checkout/sessions") {
    assert(options.headers.Authorization === "Bearer stripe_test", "Debe enviar la key de Stripe solo al crear sesión.");
    assert(String(options.body).includes("metadata%5Buser_id%5D=" + user.id), "Debe asociar la sesión al usuario autenticado.");
    return response(200, { url: "https://checkout.stripe.test/session" });
  }
  throw new Error("Ruta no simulada: " + value);
};

let res = capture();
await handler({ method: "GET", headers: {} }, res);
assert(res.statusCode === 405, "Debe validar primero el método HTTP.");

requests = [];
res = capture();
await handler({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: { planId: "monthly" },
}, res);
assert(res.statusCode === 401, "Sin sesión debe devolver 401 aunque falte STRIPE_SECRET_KEY.");
assert(!requests.some(item => item.url.includes("stripe.com")), "Sin sesión no debe intentar crear sesión en Stripe.");

requests = [];
res = capture();
await handler({
  method: "POST",
  headers: { authorization: "Bearer user-token" },
  body: { planId: "monthly" },
}, res);
assert(res.statusCode === 503, "Con sesión válida y Stripe sin configurar debe devolver 503.");
assert(requests.some(item => item.url.endsWith("/auth/v1/user")), "Debe validar la sesión antes de revisar Stripe.");
assert(!requests.some(item => item.url.includes("stripe.com")), "Sin STRIPE_SECRET_KEY no debe llamar a Stripe.");

process.env.STRIPE_SECRET_KEY = "stripe_test";
requests = [];
res = capture();
await handler({
  method: "POST",
  headers: { authorization: "Bearer user-token" },
  body: { planId: "monthly_v1" },
}, res);
assert(res.statusCode === 400, "Con sesión y Stripe configurado debe rechazar plan inválido sin llamar a Stripe.");
assert(!requests.some(item => item.url.includes("stripe.com")), "Plan inválido no debe llamar a Stripe.");

requests = [];
res = capture();
await handler({
  method: "POST",
  headers: { authorization: "Bearer user-token" },
  body: { planId: "monthly" },
}, res);
assert(res.statusCode === 200, "Con sesión, config y plan válido debe crear checkout.");
assert(res.body.url === "https://checkout.stripe.test/session", "Debe devolver la URL de checkout.");

console.log("API checkout: orden método → sesión → config Stripe verificado con mocks.");
