// REQ-157: comprar/renovar con un entitlement activo (o de cortesía, sin
// vencer) debe extender desde su vencimiento vigente, no desde "ahora" a
// secas — si no, se pierden los días ya pagados, o (si el plan vigente dura
// más que el nuevo) la compra termina sumando 0 días de acceso extra.
import fs from "node:fs";

async function importHandler(path) {
  const source = fs.readFileSync(new URL("../" + path, import.meta.url), "utf8");
  const url = "data:text/javascript;base64," + Buffer.from(source).toString("base64");
  return (await import(url)).default;
}

function response(status, data) {
  return { ok: status >= 200 && status < 300, status, json: async () => data };
}

function capture() {
  return {
    statusCode: 0,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

process.env.SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";

const crypto = await import("node:crypto");
const { Readable } = await import("node:stream");
function fakeReq(bodyStr) {
  const req = Readable.from([Buffer.from(bodyStr, "utf8")]);
  req.method = "POST";
  const t = Math.floor(Date.now() / 1000);
  const v1 = crypto.createHmac("sha256", process.env.STRIPE_WEBHOOK_SECRET)
    .update(t + "." + bodyStr).digest("hex");
  req.headers = { "stripe-signature": `t=${t},v1=${v1}` };
  return req;
}

const USER_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const handler = await importHandler("api/webhook.js");
const DAY_MS = 86400000;

async function runCheckout({ eventId, planId, activeExpiryRow }) {
  const requests = [];
  global.fetch = async (url, options = {}) => {
    const value = String(url);
    requests.push({ url: value, method: options.method || "GET", body: options.body ? JSON.parse(options.body) : null });
    if (value.includes("/rest/v1/billing_events?stripe_event_id=")) return response(200, []); // evento no procesado aún
    if (value.includes("/rest/v1/user_entitlements?payment_ref=")) return response(200, []); // sin duplicado
    if (value.includes("/rest/v1/user_entitlements?user_id=") && value.includes("status=in.(active,courtesy)") && value.includes("expires_at=gt.")) {
      return response(200, activeExpiryRow ? [activeExpiryRow] : []);
    }
    if (value.includes("/rest/v1/user_entitlements") && options.method === "POST") {
      return response(201, [{ id: 1, ...JSON.parse(options.body) }]);
    }
    if (value.includes("/rest/v1/billing_events") && options.method === "POST") return response(201, [{ id: 1 }]);
    throw new Error("Ruta no simulada: " + value);
  };

  const body = JSON.stringify({
    id: eventId,
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_" + eventId,
        payment_intent: "pi_" + eventId,
        metadata: { user_id: USER_ID, plan_id: planId },
      },
    },
  });

  const res = capture();
  await handler(fakeReq(body), res);
  assert(res.statusCode === 200, "El webhook debe responder 200.");
  const created = requests.find(r => r.method === "POST" && r.url.includes("/rest/v1/user_entitlements") && r.body && r.body.payment_ref);
  assert(created, "Debe crear un entitlement nuevo.");
  return created.body;
}

const now = Date.now();

// 1) Sin entitlement activo (primera compra) → expira en now+duración, sin cambio de comportamiento.
{
  const created = await runCheckout({ eventId: "evt_first", planId: "monthly", activeExpiryRow: null });
  const expiresAt = Date.parse(created.expires_at);
  const expectedDays = (expiresAt - now) / DAY_MS;
  assert(Math.abs(expectedDays - 30) < 0.05, `Sin entitlement previo, debe expirar en ~30 días (fue ${expectedDays.toFixed(2)}).`);
  console.log("  Test 1 pasado: sin entitlement activo, expira en ~30 días desde ahora (sin regresión)");
}

// 2) Entitlement activo con 20 días restantes + compra mensual (30 días) → debe sumar, no reemplazar.
{
  const currentExpiry = new Date(now + 20 * DAY_MS).toISOString();
  const created = await runCheckout({ eventId: "evt_renew_20", planId: "monthly", activeExpiryRow: { expires_at: currentExpiry } });
  const expiresAt = Date.parse(created.expires_at);
  const expectedDays = (expiresAt - now) / DAY_MS;
  assert(Math.abs(expectedDays - 50) < 0.05, `Con 20 días vivos + mensual, debe expirar en ~50 días desde ahora (fue ${expectedDays.toFixed(2)}), no ~30.`);
  assert(created.starts_at === currentExpiry, "starts_at del nuevo período debe ser el vencimiento vigente, no 'ahora'.");
  console.log("  Test 2 pasado: 20 días vivos + mensual → ~50 días totales (no se pierden los 20 ya pagados)");
}

// 3) Trimestral vivo (90 días) + compra mensual (30 días) → debe sumar 120, no perder los 90.
{
  const currentExpiry = new Date(now + 90 * DAY_MS).toISOString();
  const created = await runCheckout({ eventId: "evt_renew_90", planId: "monthly", activeExpiryRow: { expires_at: currentExpiry } });
  const expiresAt = Date.parse(created.expires_at);
  const expectedDays = (expiresAt - now) / DAY_MS;
  assert(Math.abs(expectedDays - 120) < 0.05, `Con trimestral vivo (90d) + mensual, debe expirar en ~120 días (fue ${expectedDays.toFixed(2)}), no sumar 0.`);
  console.log("  Test 3 pasado: trimestral vivo + mensual → ~120 días totales (la compra no suma 0 días)");
}

console.log("Webhook Stripe (REQ-157): renovar/recomprar con entitlement activo extiende desde el vencimiento vigente. Verificado con mocks.");
