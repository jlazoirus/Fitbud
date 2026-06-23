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
const handler = await importHandler("api/billing-history.js");

let res = capture();
await handler({ method: "GET", headers: {} }, res);
assert(res.statusCode === 401, "Debe exigir sesión para consultar historial.");

let requests = [];
global.fetch = async (url, options = {}) => {
  const value = String(url);
  requests.push({
    url: value,
    method: options.method || "GET",
    authorization: options.headers && options.headers.Authorization,
  });
  if (value.endsWith("/auth/v1/user")) return response(200, user);
  if (value.includes("/rest/v1/profiles?id=eq." + user.id)) {
    return response(200, [{ active: true, is_admin: false }]);
  }
  if (value.includes("/rest/v1/billing_events?")) {
    assert(value.includes("user_id=eq." + user.id), "La consulta debe filtrar por el usuario autenticado.");
    assert(options.headers.Authorization === "Bearer service", "billing_events debe leerse con service role.");
    return response(200, [{
      event_type: "checkout.session.completed",
      plan_id: "monthly",
      status: "processed",
      created_at: "2026-06-23T20:10:00.000Z",
      payload: {
        id: "evt_secret",
        stripe_event_id: "evt_secret",
        data: { object: { amount_total: 1400, currency: "usd" } },
      },
      error: "internal detail",
    }]);
  }
  throw new Error("Ruta no simulada: " + value);
};

res = capture();
await handler({ method: "GET", headers: { authorization: "Bearer user-token" } }, res);
assert(res.statusCode === 200, "Debe responder 200 con sesión válida.");
assert(Array.isArray(res.body.history) && res.body.history.length === 1, "Debe devolver historial proyectado.");
const item = res.body.history[0];
assert(item.event_type === "checkout.session.completed", "Debe conservar el tipo seguro del movimiento.");
assert(item.plan_id === "monthly", "Debe conservar el plan.");
assert(item.status === "processed", "Debe conservar el estado.");
assert(item.amount_cents === 1400 && item.currency === "USD", "Debe proyectar monto y moneda.");
assert(!("payload" in item), "No debe devolver payload completo.");
assert(!("stripe_event_id" in item), "No debe devolver ID externo.");
assert(!("error" in item), "No debe devolver errores internos.");
assert(requests.some(item => item.url.includes("/rest/v1/billing_events?")), "Debe consultar billing_events.");

console.log("API billing-history: autenticación, filtro y proyección segura verificados con mocks.");
