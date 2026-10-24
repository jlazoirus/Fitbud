#!/usr/bin/env node
// REQ-264 — Los recordatorios salen en el primer disparo a la hora elegida o
// después (mismo día local), una sola vez por día. Antes exigían que el cron
// cayera justo en esa hora y el cron diario (03:00 en Lima) nunca coincidía.
import assert from "node:assert/strict";

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
process.env.RESEND_API_KEY = "test-resend";
process.env.CRON_SECRET = "secret";
delete process.env.VAPID_PRIVATE_KEY;

// Una zona donde ahora sea entre las 02:00 y las 22:00, para probar una hora
// ya pasada y una por venir sin cruzar el día.
const localHour = (tz) => Number(new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false }).format(new Date())) % 24;
const tz = ["UTC", ...Array.from({ length: 12 }, (_, i) => `Etc/GMT-${i + 1}`), ...Array.from({ length: 12 }, (_, i) => `Etc/GMT+${i + 1}`)]
  .find((zone) => localHour(zone) >= 2 && localHour(zone) <= 22);
const hour = localHour(tz);

let state;
globalThis.fetch = async (url, init = {}) => {
  const u = String(url), method = init.method || "GET";
  state.calls.push(`${method} ${u}`);
  const json = (body) => ({ ok: true, status: 200, json: async () => body });
  if (u.startsWith("https://api.resend.com/")) { state.emails.push(JSON.parse(init.body)); return json({ id: "email-1" }); }
  if (u.includes("/notification_preferences?email_opt_in")) return json([state.pref]);
  if (u.includes("/notification_preferences?push_opt_in")) return json([]);
  if (u.includes("/profiles?id=")) return json([{ email: "ana@example.com", active: true }]);
  if (u.includes("/profiles?select=id")) return json([{ id: "u1" }]);
  if (u.includes("/day_log?")) return json([{ state: { meals: { desayuno: { done: false } }, workoutDone: true } }]);
  if (u.includes("/notification_log")) {
    if (method === "POST") return json([{ id: 1 }]);
    if (method === "PATCH") return json({});
    return json(state.log);
  }
  throw new Error("fetch inesperado: " + u);
};
const { default: handler } = await import("../api/notify.js");

async function run(notifyHour, log = []) {
  state = { calls: [], emails: [], log, pref: { user_id: "u1", timezone: tz, notify_hour: notifyHour, enabled_days: [0, 1, 2, 3, 4, 5, 6], notify_nutrition: true, notify_training: true, unsubscribe_token: "tok_0123456789" } };
  const res = { code: 0, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; }, send(b) { this.body = b; return this; }, setHeader() {} };
  await handler({ method: "GET", url: "/api/notify", headers: { authorization: "Bearer secret" } }, res);
  assert.equal(res.code, 200, JSON.stringify(res.body));
  return res.body;
}

let out = await run(hour - 1);
assert.equal(out.sent, 1, "la hora elegida ya pasó hoy: se envía en este disparo");
assert.equal(state.emails.length, 1);
assert.equal(state.emails[0].subject, "Tienes comidas pendientes para hoy");
console.log(`  ${tz}, ${hour}:xx con hora elegida ${hour - 1}:00 → enviado`);

out = await run(hour);
assert.equal(out.sent, 1, "justo a la hora elegida se envía");

out = await run(hour + 1);
assert.equal(out.sent, 0, "antes de la hora elegida no se envía");
assert.equal(state.emails.length, 0);
assert.equal(out.processed, 0);

out = await run(hour - 1, [{ id: 1, status: "sent" }]);
assert.equal(out.sent, 0, "ya enviado hoy: los disparos siguientes no repiten");
assert.equal(out.skipped, 1);
assert.equal(state.emails.length, 0);
console.log("validate-notify-schedule: OK");
