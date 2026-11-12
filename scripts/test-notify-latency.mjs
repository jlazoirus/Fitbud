#!/usr/bin/env node
// REQ-383: latencia, cancelación real, concurrencia y reintentos, sin servicios externos.
import assert from "node:assert/strict";
import webpush from "web-push";
import { setTimeout as sleep } from "node:timers/promises";
import { createServer } from "node:net";
import { createECDH, randomBytes } from "node:crypto";
const realSendNotification = webpush.sendNotification.bind(webpush);

const RealDate = Date;
const NOW = "2026-11-12T01:00:04Z"; // aviso reportado: 20:00 Lima, campaña activa
globalThis.Date = class extends RealDate {
  constructor(...args) { super(...(args.length ? args : [NOW])); }
  static now() { return RealDate.parse(NOW); }
};
const vapid = webpush.generateVAPIDKeys();
Object.assign(process.env, {
  SUPABASE_URL: "https://notify.example.test", SUPABASE_SERVICE_ROLE_KEY: "fixture",
  RESEND_API_KEY: "fixture", CRON_SECRET: "fixture", NOTIFY_FROM_EMAIL: "notify@example.test",
  VAPID_PUBLIC_KEY: vapid.publicKey, VAPID_PRIVATE_KEY: vapid.privateKey, VAPID_SUBJECT: "mailto:qa@example.test",
});
const { default: handler, runReferralCampaign } = await import(process.env.NOTIFY_TEST_MODULE || "../api/notify.js");
const E = () => ({ url: process.env.SUPABASE_URL, service: "fixture", resendKey: "fixture", cronSecret: "fixture", appUrl: "https://example.test" });
const counter = () => ({ sent: 0, skipped: 0, errors: 0, log: [] });
const response = () => ({ code: 0, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } });
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const campaignKey = (uid) => `${uid}:referral_campaign:2026-11-09`;
let w;
function world({ users = 0, cohort = 0, alreadySent = true, latency = 0, push = false, followups = false } = {}) {
  w = { calls: [], emails: [], log: new Map(), inFlight: 0, maxInFlight: 0, aborted: 0, pushDestroyed: 0, hang: null, hangBody: null, failLogRead: false };
  w.prefs = followups ? [] : Array.from({ length: users }, (_, n) => ({ user_id: id(n), email_opt_in: true, push_opt_in: push,
    timezone: "America/Lima", notify_hour: 20, enabled_days: [0, 1, 2, 3, 4, 5, 6], unsubscribe_token: "fixture-token" }));
  w.people = Array.from({ length: cohort }, (_, n) => ({ id: id(n + 1000), email: `campaign${n}@example.test` }));
  w.followups = followups ? Array.from({ length: users }, (_, n) => ({ id: id(n), email: `followup${n}@example.test`,
    created_at: "2026-11-09T15:00:00Z", timeZone: "America/Lima" })) : [];
  for (const p of w.people) if (alreadySent) w.log.set(campaignKey(p.id), { id: campaignKey(p.id), idempotency_key: campaignKey(p.id), status: "sent" });
  const json = (data, status = 200) => ({ ok: status < 400, status, json: async () => data });
  const hanging = (signal) => new Promise((_, reject) => {
    assert.ok(signal, "toda petición lleva cancelación");
    signal.addEventListener("abort", () => { w.aborted++; reject(signal.reason); }, { once: true });
  });
  globalThis.fetch = async (raw, init = {}) => {
    const url = new URL(raw), q = url.searchParams, route = url.pathname, method = init.method || "GET";
    w.calls.push({ url: String(url), route, method });
    w.inFlight++; w.maxInFlight = Math.max(w.maxInFlight, w.inFlight);
    try {
      if (w.hang?.(url, init)) return await hanging(init.signal);
      if (latency) await sleep(latency, undefined, { signal: init.signal });
      if (w.hangBody?.(url)) return { ok: true, status: 200, json: () => hanging(init.signal) };
      if (route === "/emails") {
        w.emails.push({ ...JSON.parse(init.body), key: init.headers["Idempotency-Key"], at: performance.now() });
        return json({ id: "email-" + w.emails.length });
      }
      if (route.endsWith("/notification_preferences")) {
        if (q.has("user_id")) return json([]);
        return json(w.prefs);
      }
      if (route.endsWith("/profiles")) {
        if (q.has("created_at")) return json(w.people.slice(Number(q.get("offset")), Number(q.get("offset")) + 200));
        if (q.has("id")) return json([{ email: `${q.get("id").slice(3)}@example.test`, active: true }]);
        if (q.has("active")) return json(w.followups);
        return json([{ id: id(0) }]);
      }
      if (route.endsWith("/day_log")) return json(followups ? [] : [{ log_date: "2026-11-10", meals: { cena: { done: true } } }]);
      if (route.endsWith("/referral_dashboard")) return json({ eligible: w.eligible !== false });
      if (route.endsWith("/user_entitlements")) return json([]);
      if (route.endsWith("/push_subscriptions")) return json(w.subs || [{ endpoint: "https://push.example.test", keys_p256dh: "fixture", keys_auth: "fixture" }]);
      if (route.endsWith("/notification_log")) {
        if (method === "POST") {
          const row = JSON.parse(init.body);
          if (w.log.has(row.idempotency_key)) return json({ message: "duplicate key" }, 409);
          const record = { ...row, id: row.idempotency_key };
          w.log.set(row.idempotency_key, record);
          return json([record]);
        }
        if (method === "PATCH") { Object.assign(w.log.get(q.get("id").slice(3)), JSON.parse(init.body)); return json({}); }
        if (w.failLogRead) return json({ message: "log unavailable" }, 503);
        const keys = q.get("idempotency_key").slice(4, -1).split(",");
        return json(keys.map((key) => w.log.get(key)).filter((row) => row && (!q.has("status") || row.status === "sent")));
      }
      throw new Error("Ruta inesperada: " + raw);
    } finally { w.inFlight--; }
  };
  webpush.sendNotification = async () => ({});
  return w;
}
async function run({ dryRun = false, authorized = true } = {}) {
  const res = response();
  await handler({ method: "GET", url: "/api/notify" + (dryRun ? "?dry_run=true" : ""),
    headers: { authorization: authorized ? "Bearer fixture" : "Bearer invalid" } }, res);
  return res;
}

// Misma carga y latencia antes/después. El baseline se puede medir sin alterar HEAD.
world({ users: 18, cohort: 50, latency: 150 });
const began = performance.now();
let res = await run({ dryRun: true });
const elapsed = Math.round(performance.now() - began);
console.log(JSON.stringify({ benchmark: "18 recordatorios + 50 referidos enviados; 150 ms/red", elapsedMs: elapsed,
  requests: w.calls.length, referralRpcs: w.calls.filter((c) => c.route.endsWith("/referral_dashboard")).length, peakRequests: w.maxInFlight }));
if (!process.argv.includes("--benchmark-only")) {
  assert.equal(res.code, 200);
  assert.ok(elapsed < 15000, "la carga representativa termina con margen antes de 30 s");
  assert.ok(w.maxInFlight > 1 && w.maxInFlight <= 4, "concurrencia de red acotada");
  assert.equal(w.calls.filter((c) => c.route.endsWith("/referral_dashboard")).length, 0, "no recalcula beneficios ya enviados");
  assert.equal(w.emails.length, 0, "dry_run no envía");
  assert.ok(w.calls.every((c) => c.method === "GET"), "dry_run de enviados no muta");

  world({ cohort: 205 });
  await runReferralCampaign(E(), false, counter());
  assert.equal(w.calls.length, 7, "dos páginas, cinco lotes de claves, cero RPC/envíos");
  assert.ok(w.calls.every((c) => c.url.length < 8000), "URL acotada también con UUID");

  world({ cohort: 50, alreadySent: false, latency: 150 }); w.eligible = false;
  const ineligibleStarted = performance.now();
  await runReferralCampaign(E(), false, counter());
  assert.ok(performance.now() - ineligibleStarted < 5000, "también acota la cohorte que aún no es elegible");
  assert.equal(w.calls.length, 52, "sin leer preferencias de quienes no pueden recibir la campaña");
  assert.equal(w.maxInFlight, 4); assert.equal(w.emails.length, 0);

  world({ cohort: 3 });
  const failedKey = campaignKey(w.people[1].id);
  w.log.get(failedKey).status = "error";
  await runReferralCampaign(E(), false, counter());
  assert.equal(w.emails.length, 1, "reintenta solo el envío fallido");
  assert.equal(w.emails[0].key, failedKey);
  await runReferralCampaign(E(), false, counter());
  assert.equal(w.emails.length, 1, "siguiente disparo no duplica");

  world({ cohort: 2, alreadySent: false }); w.failLogRead = true;
  await assert.rejects(runReferralCampaign(E(), false, counter()), /log unavailable/);
  assert.equal(w.emails.length, 0, "sin registro fiable nunca envía");

  for (const followups of [false, true]) {
    world({ users: 6, followups });
    res = await run();
    assert.equal(res.code, 200);
    assert.equal(w.emails.length, 6, "procesa todos los usuarios");
    assert.equal(new Set(w.emails.map((m) => m.key)).size, 6, "claves estables por usuario");
    for (let i = 1; i < w.emails.length; i++) assert.ok(w.emails[i].at - w.emails[i - 1].at >= 580, "sin ráfagas de correo");
    await run();
    assert.equal(w.emails.length, 6, "segundo disparo conserva idempotencia");
  }

  // El timeout también cubre un cuerpo HTTP que nunca termina, no solo cabeceras.
  world(); w.hangBody = (url) => url.searchParams.get("select") === "id";
  res = await run({ authorized: false });
  assert.equal(res.code, 401); assert.equal(res.body.keepAlive, false);
  assert.equal(w.aborted, 1); assert.equal(w.calls.length, 1);

  world({ users: 2 });
  w.hang = (url) => url.pathname === "/emails";
  res = await run();
  assert.equal(res.code, 503); assert.equal(res.body.ok, false); assert.equal(res.body.retryable, true);
  assert.equal(w.aborted, 2); assert.equal(w.emails.length, 0);
  assert.ok([...w.log.values()].every((row) => row.status === "error"));

  world({ users: 1, push: true });
  // Socket real que nunca contesta al handshake TLS: web-push no recibe cabeceras.
  const sockets = new Set();
  let connections = 0;
  const blackhole = createServer((socket) => {
    connections++; sockets.add(socket); socket.resume();
    socket.on("close", () => { sockets.delete(socket); });
  });
  await new Promise((resolve) => blackhole.listen(0, "127.0.0.1", resolve));
  const clientKey = createECDH("prime256v1"); clientKey.generateKeys();
  w.subs = [{ endpoint: `https://127.0.0.1:${blackhole.address().port}/push`,
    keys_p256dh: clientKey.getPublicKey().toString("base64url"), keys_auth: randomBytes(16).toString("base64url") }];
  webpush.sendNotification = realSendNotification;
  try {
    res = await run();
    assert.equal(res.code, 503); assert.equal(res.body.push.errors, 1);
    await sleep(50);
    assert.equal(connections, 1, "se intentó la conexión real");
    assert.equal(sockets.size, 0, "el timeout cierra el socket push real");
    assert.equal(w.inFlight, 0, "sin fetch pendiente al responder");
  } finally {
    for (const socket of sockets) socket.destroy();
    await new Promise((resolve) => blackhole.close(resolve));
  }

  // Agotar el presupuesto frena la cola. Los usuarios restantes quedan para reintento.
  world({ users: 12 });
  const realPerformance = globalThis.performance;
  let advance = 0;
  globalThis.performance = { now: () => realPerformance.now() + advance };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (...args) => {
    const result = await originalFetch(...args);
    if (w.calls.length === 6) advance = 24001;
    return result;
  };
  try {
    res = await run();
    assert.equal(res.code, 503); assert.equal(res.body.timedOut, true);
    assert.equal(w.emails.length, 0);
    assert.ok(w.calls.filter((c) => c.url.includes("profiles?id=")).length < 12);
  } finally { globalThis.performance = realPerformance; }
  globalThis.fetch = originalFetch;
  res = await run();
  assert.equal(res.code, 200); assert.equal(w.emails.length, 12, "el próximo disparo recupera pendientes");
  console.log("PASS notify latency: carga, paginación, reintentos, bajas, dry_run, cuerpos colgados, push y presupuesto.");
}
globalThis.Date = RealDate;
