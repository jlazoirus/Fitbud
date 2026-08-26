// REQ-148: un reembolso parcial de Stripe (charge.refunded con refunded:false
// y amount_refunded < amount) no debe revocar el entitlement; solo un
// reembolso total (refunded:true o amount_refunded >= amount) revoca.
import fs from "node:fs";
import crypto from "node:crypto";
import { Readable } from "node:stream";

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

function fakeReq(bodyStr) {
  const req = Readable.from([Buffer.from(bodyStr, "utf8")]);
  req.method = "POST";
  const t = Math.floor(Date.now() / 1000);
  const v1 = crypto.createHmac("sha256", process.env.STRIPE_WEBHOOK_SECRET)
    .update(t + "." + bodyStr).digest("hex");
  req.headers = { "stripe-signature": `t=${t},v1=${v1}` };
  return req;
}

const ENT_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const handler = await importHandler("api/webhook.js");

async function runRefundEvent({ eventId, refunded, amount, amountRefunded }) {
  const requests = [];
  global.fetch = async (url, options = {}) => {
    const value = String(url);
    requests.push({ url: value, method: options.method || "GET", body: options.body ? JSON.parse(options.body) : null });
    if (value.includes("/rest/v1/billing_events?stripe_event_id=")) return response(200, []); // no duplicado
    if (value.includes("/rest/v1/user_entitlements?payment_ref=")) {
      return response(200, [{ id: ENT_ID, status: "active" }]);
    }
    if (value.includes("/rest/v1/user_entitlements?id=eq.")) return response(200, [{ id: ENT_ID }]);
    if (value.includes("/rest/v1/billing_events")) return response(201, [{ id: 1 }]);
    throw new Error("Ruta no simulada: " + value);
  };

  const body = JSON.stringify({
    id: eventId,
    type: "charge.refunded",
    data: {
      object: {
        payment_intent: "pi_" + eventId,
        refunded,
        amount,
        amount_refunded: amountRefunded,
        metadata: {},
      },
    },
  });

  const res = capture();
  await handler(fakeReq(body), res);
  assert(res.statusCode === 200, "El webhook debe responder 200 (Stripe reintenta si no).");
  return { res, requests };
}

// 1) Reembolso PARCIAL (refunded:false, amount_refunded < amount) → NO revoca.
{
  const { res, requests } = await runRefundEvent({
    eventId: "evt_partial", refunded: false, amount: 3600, amountRefunded: 500,
  });
  assert(res.body.status === "skipped", "Un reembolso parcial debe quedar 'skipped', no revocar.");
  assert(
    !requests.some(r => r.method === "PATCH" && r.url.includes("/user_entitlements?id=eq.")),
    "Un reembolso parcial NO debe hacer PATCH sobre user_entitlements."
  );
  const logged = requests.find(r => r.method === "POST" && r.url.includes("/rest/v1/billing_events") && !r.url.includes("?"));
  assert(logged && logged.body.status === "skipped", "billing_events debe auditar el parcial como 'skipped'.");
}

// 2) Reembolso TOTAL vía refunded:true → SÍ revoca.
{
  const { res, requests } = await runRefundEvent({
    eventId: "evt_full_flag", refunded: true, amount: 3600, amountRefunded: 3600,
  });
  assert(res.body.status === "processed", "Un reembolso total debe quedar 'processed'.");
  const patch = requests.find(r => r.method === "PATCH" && r.url.includes("/user_entitlements?id=eq." + ENT_ID));
  assert(patch, "Un reembolso total debe hacer PATCH revocando el entitlement.");
  assert(patch.body.status === "revoked", "El PATCH debe fijar status:'revoked'.");
}

// 3) Reembolso TOTAL vía amount_refunded >= amount (refunded aún false en el payload) → SÍ revoca.
{
  const { res, requests } = await runRefundEvent({
    eventId: "evt_full_amount", refunded: false, amount: 3600, amountRefunded: 3600,
  });
  assert(res.body.status === "processed", "amount_refunded >= amount debe tratarse como reembolso total.");
  assert(
    requests.some(r => r.method === "PATCH" && r.url.includes("/user_entitlements?id=eq." + ENT_ID)),
    "Debe revocar aunque 'refunded' todavía no sea true, si ya se reembolsó el monto completo."
  );
}

console.log("Webhook Stripe: reembolso parcial no revoca, reembolso total sí (por 'refunded' o por monto). Verificado con mocks.");
