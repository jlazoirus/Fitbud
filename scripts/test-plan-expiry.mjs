// REQ-351: avisos por correo cuando un plan pagado está por vencer o venció.
// Sin red ni producción: fetch simulado para Supabase/Resend y PGlite para el SQL.
import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { planExpiryNotice, planExpiryMessage, runPlanExpiry, buildEmailHtml, expiryDateText } from "../api/notify.js";

const ROOT = new URL("..", import.meta.url).pathname;
const read = (p) => fs.readFileSync(ROOT + p, "utf8");
const H = 3600000;
// 10:00 en Lima (UTC-5) = 15:00 UTC.
const NOW = new Date("2026-11-20T15:00:00Z");
const at = (hours) => new Date(NOW.getTime() + hours * H).toISOString();

// ── Ventanas: 72 h antes → "3d"; 48 h después → "expired"; solo de 9 a 20 h ──
assert.deepEqual(planExpiryNotice({ expires_at: at(50) }, NOW), { kind: "3d", ref: "2026-11-22" });
assert.equal(planExpiryNotice({ expires_at: at(80) }, NOW), null, "más de 72 h: todavía no");
assert.deepEqual(planExpiryNotice({ expires_at: at(-5) }, NOW), { kind: "expired", ref: "2026-11-20" });
assert.equal(planExpiryNotice({ expires_at: at(-60) }, NOW), null, "vencido hace más de 48 h: ya no");
assert.equal(planExpiryNotice({ expires_at: at(50) }, new Date("2026-11-20T08:00:00Z")), null, "03:00 en Lima: fuera de horario");
assert.equal(planExpiryNotice({ expires_at: "no-es-fecha" }, NOW), null);

// ── Mensajes: fecha en español, enlace a la tienda, sin vocabulario interno ───
const m3 = planExpiryMessage("3d", { plan_id: "monthly", expires_at: at(50) }, NOW);
assert.equal(m3.subject, "Tu plan de Evolv vence el " + expiryDateText(at(50)));
assert.match(m3.subject, /22 de noviembre/);
assert.equal(m3.title, "Tu plan vence en 3 días");
assert.equal(m3.url, "/pago?plan=monthly");
assert.match(m3.paragraphs[0], /plan mensual está activo hasta el 22 de noviembre/);
assert.equal(planExpiryMessage("3d", { plan_id: "monthly", expires_at: at(10) }, NOW).title, "Tu plan vence mañana");
assert.equal(planExpiryMessage("3d", { plan_id: "plan-viejo", expires_at: at(50) }, NOW).url, "/planes", "plan fuera de la tienda: a Planes");
const mx = planExpiryMessage("expired", { plan_id: "quarterly", expires_at: at(-5) }, NOW);
assert.equal(mx.url, "/planes");
assert.match(mx.title, /^Tu plan venció el 20 de noviembre$/);
for (const msg of [m3, mx]) {
  const text = JSON.stringify(msg);
  assert.doesNotMatch(text, /\bIA\b|inteligencia artificial|modelo|prompt|token|Claude/i, "REQ-31");
  assert.doesNotMatch(text, /peso|kg|grasa|foto de progreso/i, "sin datos de salud ni de progreso");
}
const html = buildEmailHtml({ appUrl: "https://evolvapp.club" }, m3, "", { billing: true });
assert.match(html, /href="https:\/\/evolvapp\.club\/pago\?plan=monthly"/);
assert.match(html, /compraste un plan de Evolv/);
assert.doesNotMatch(html, /Desactivar recordatorios|unsubscribe/, "transaccional: sin baja de recordatorios");

// ── runPlanExpiry con Supabase y Resend simulados ─────────────────────────────
const E = { url: "https://mock.supabase.co", service: "svc", resendKey: "re_mock", fromEmail: "hola@evolvapp.club", appUrl: "https://evolvapp.club" };
function world({ logAccepts = true } = {}) {
  const w = { log: new Map(), mails: [], fails: 0 };
  w.ents = [
    { id: "e-a", user_id: "u-a", plan_id: "monthly", expires_at: at(50) },     // vence en ~2 días
    { id: "e-b", user_id: "u-b", plan_id: "monthly", expires_at: at(40) },     // vence pero ya renovó
    { id: "e-c", user_id: "u-c", plan_id: "semiannual", expires_at: at(-5) },  // venció hace 5 h
    { id: "e-d", user_id: "u-d", plan_id: "monthly", expires_at: at(100) },    // fuera de ventana
  ];
  const json = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
  globalThis.fetch = async (url, opts = {}) => {
    const u = decodeURIComponent(String(url));
    const method = opts.method || "GET";
    if (u.startsWith(E.url + "/rest/v1/user_entitlements?origin=eq.checkout")) {
      assert.match(u, /status=in\.\(active,expired\)/);
      return json(200, w.ents);
    }
    if (u.startsWith(E.url + "/rest/v1/user_entitlements?user_id=eq.")) {
      return json(200, u.includes("user_id=eq.u-b") ? [{ id: "e-b2" }] : []);
    }
    if (u.startsWith(E.url + "/rest/v1/profiles?id=eq.")) {
      const id = u.match(/id=eq\.([^&]+)/)[1];
      return json(200, [{ email: id + "@example.com", active: true }]);
    }
    if (u.startsWith(E.url + "/rest/v1/notification_log?idempotency_key=in.(")) {
      const key = u.match(/in\.\((.*)\)&/)[1];
      const row = w.log.get(key);
      return json(200, row ? [{ id: row.id, status: row.status, idempotency_key: key }] : []);
    }
    if (u === E.url + "/rest/v1/notification_log" && method === "POST") {
      const body = JSON.parse(opts.body);
      assert.equal(body.notification_type, "plan_expiry");
      if (!logAccepts) { w.fails++; return json(400, { message: "violates check constraint notification_log_notification_type_check" }); }
      const id = "log-" + (w.log.size + 1);
      w.log.set(body.idempotency_key, { id, status: "pending" });
      return json(201, [{ id }]);
    }
    if (u.startsWith(E.url + "/rest/v1/notification_log?id=eq.") && method === "PATCH") {
      const id = u.match(/id=eq\.(.+)$/)[1];
      for (const row of w.log.values()) if (row.id === id) row.status = JSON.parse(opts.body).status;
      return json(204, {});
    }
    if (u === "https://api.resend.com/emails") {
      w.mails.push({ ...JSON.parse(opts.body), idem: opts.headers["Idempotency-Key"] });
      return json(200, { id: "re_" + w.mails.length });
    }
    throw new Error("fetch inesperado: " + method + " " + u);
  };
  return w;
}

let w = world();
let results = { log: [] };
await runPlanExpiry(E, false, results, NOW);
assert.deepEqual(w.mails.map((m) => m.to).sort(), ["u-a@example.com", "u-c@example.com"], "avisa a A (3 días) y C (vencido); B ya renovó; D fuera de ventana");
assert.equal(results.planExpiry.sent, 2);
assert.ok(results.log.some((l) => l.user === "u-b" && l.action === "renewed"));
const mailA = w.mails.find((m) => m.to === "u-a@example.com");
assert.match(mailA.subject, /vence el/);
assert.equal(mailA.idem, "plan_expiry:e-a:3d");
assert.equal(mailA.from, "hola@evolvapp.club");
assert.match(w.mails.find((m) => m.to === "u-c@example.com").subject, /venció/);

// Segunda corrida del cron en la misma ventana: no repite.
results = { log: [] };
await runPlanExpiry(E, false, results, new Date(NOW.getTime() + H));
assert.equal(w.mails.length, 2, "el aviso ya enviado no se repite");
assert.equal(results.planExpiry.skipped, 3, "A y C ya enviados, B renovado");

// dry_run: no envía ni registra.
w = world();
results = { log: [] };
await runPlanExpiry(E, true, results, NOW);
assert.equal(w.mails.length, 0);
assert.equal(w.log.size, 0);
assert.ok(results.log.some((l) => l.action === "dry_run"));

// Sin el SQL aplicado: el registro falla, no se envía nada y se corta en el primero.
w = world({ logAccepts: false });
results = { log: [] };
await runPlanExpiry(E, false, results, NOW);
assert.equal(w.mails.length, 0, "sin registro de idempotencia no se envía");
assert.equal(w.fails, 1, "corta tras el primer rechazo");
assert.ok(results.log.some((l) => l.action === "plan_expiry_log_unavailable"));

// Si Supabase no responde, se cuenta el error y el cron sigue.
globalThis.fetch = async () => ({ ok: false, status: 503, json: async () => ({ message: "down" }) });
results = { log: [] };
await runPlanExpiry(E, false, results, NOW);
assert.equal(results.planExpiry.errors, 1);

// ── SQL: idempotente y admite plan_expiry sin perder los tipos anteriores ─────
const db = new PGlite();
await db.exec(`create schema auth; create role anon; create role authenticated; create role service_role;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql as $$ select null::uuid $$;`);
for (const f of ["notifications.sql", "push_subscriptions.sql", "notifications_journey.sql", "notifications_morning.sql"]) {
  await db.exec(read("supabase/" + f));
}
const sql = read("supabase/notifications_plan_expiry.sql");
await db.exec(sql);
await db.exec(sql); // dos veces: idempotente
const uid = "00000000-0000-0000-0000-000000000001";
await db.query("insert into auth.users(id) values ($1)", [uid]);
const ins = (type, key) => db.query("insert into notification_log(user_id, notification_type, reference_date, idempotency_key) values ($1,$2,'2026-11-22',$3)", [uid, type, key]);
await ins("plan_expiry", "plan_expiry:e-a:3d");
for (const t of ["nutrition", "training", "push_streak", "comeback", "push_comeback", "push_last_call", "morning", "push_morning"]) await ins(t, "k-" + t);
await assert.rejects(ins("plan_expiry", "plan_expiry:e-a:3d"), /duplicate|unique/i, "la clave de idempotencia es única");
await assert.rejects(ins("otro", "k-otro"), /check/i);
assert.equal((await db.query("select relrowsecurity from pg_class where relname='notification_log'")).rows[0].relrowsecurity, true, "RLS activo");

console.log("  ✓ avisos de vencimiento: ventanas, renovación, idempotencia, dry_run, sin SQL y SQL con PGlite");
