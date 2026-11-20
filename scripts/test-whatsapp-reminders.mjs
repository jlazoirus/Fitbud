#!/usr/bin/env node
// REQ-255: recordatorios por WhatsApp. Webhook firmado, vinculación, baja, envío
// del aviso del día, tope mensual y fallos, con Supabase y Meta simulados.
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

const RealDate = Date;
const NOW = "2026-11-12T01:30:00Z"; // 20:30 en Lima del 11/11: hora del aviso
globalThis.Date = class extends RealDate {
  constructor(...args) { super(...(args.length ? args : [NOW])); }
  static now() { return RealDate.parse(NOW); }
};
const WA_ENV = {
  WHATSAPP_TOKEN: "wa-token", WHATSAPP_PHONE_NUMBER_ID: "123456", WHATSAPP_APP_SECRET: "app-secret",
  WHATSAPP_VERIFY_TOKEN: "verify-me", WHATSAPP_PUBLIC_NUMBER: "51999888777", WHATSAPP_TEMPLATE: "recordatorio_diario",
  WHATSAPP_MONTHLY_CAP: "5",
};
Object.assign(process.env, {
  SUPABASE_URL: "https://db.example.test", SUPABASE_SERVICE_ROLE_KEY: "service", SUPABASE_PUBLISHABLE_KEY: "anon",
  RESEND_API_KEY: "fixture", CRON_SECRET: "fixture", NOTIFY_FROM_EMAIL: "notify@example.test", ...WA_ENV,
});

const core = await import("../api/_whatsapp/core.js");
const { default: notify } = await import("../api/notify.js");
const { default: channel } = await import("../api/push-subscribe.js");
const { whatsappPublic } = await import("../api/config.js");

const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const PHONE = "51987654321";
const response = () => ({
  code: 0, body: null, headers: {},
  status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; },
  send(b) { this.body = b; return this; }, setHeader(k, v) { this.headers[k] = v; },
});
const json = (data, status = 200) => ({ ok: status < 400, status, json: async () => data });

// ── Unidades ─────────────────────────────────────────────────────────────────
{
  assert.deepEqual(core.classifyText("evolv abc234"), { kind: "link", code: "ABC234" });
  assert.deepEqual(core.classifyText(" EVOLV  K7M2PQ gracias"), { kind: "link", code: "K7M2PQ" });
  for (const t of ["BAJA", "baja", "Stop", "salir.", "Cancelar", "DETENER"]) assert.deepEqual(core.classifyText(t), { kind: "stop" }, t);
  assert.equal(core.classifyText("hola, ¿qué como hoy?"), null);
  assert.equal(core.classifyText("no quiero la baja de peso"), null);
  assert.match(core.newLinkCode(), /^[A-HJ-NP-Z2-9]{6}$/);
  assert.equal(core.maskPhone(PHONE), "+51 9•• ••• 321");
  assert.equal(core.maskPhone("123"), "");
  assert.equal(core.linkUrl("51999888777", "ABC234"), "https://wa.me/51999888777?text=EVOLV%20ABC234");
  assert.equal(core.pendingLabel({ step: "day", missing: "nutrition" }), "tus comidas");
  assert.equal(core.pendingLabel({ step: "day", missing: "training" }), "tu entreno");
  assert.equal(core.pendingLabel({ step: "day", missing: "both" }), "tus comidas y tu entreno");
  assert.equal(core.pendingLabel({ step: "day", missing: "day" }), "tu día");
  assert.equal(core.pendingLabel({ step: "rescue" }), "lo pendiente de ayer");
  assert.equal(core.wantsWhatsapp({ step: "day" }), true);
  assert.equal(core.wantsWhatsapp({ step: "rescue" }), true);
  for (const step of ["morning", "comeback_2", "train_lapse", "push_invite"]) assert.equal(core.wantsWhatsapp({ step }), false, step);
  assert.equal(core.monthStartLima(new RealDate("2026-11-01T04:59:00Z")), "2026-10-01T05:00:00.000Z");
  assert.equal(core.monthStartLima(new RealDate("2026-11-01T05:00:00Z")), "2026-11-01T05:00:00.000Z");
  assert.deepEqual(core.failurePatch(0, new RealDate(NOW)), { fail_count: 1, updated_at: new RealDate(NOW).toISOString() });
  assert.equal(core.failurePatch(2).opted_in, false, "el tercer fallo seguido pausa el canal");
  assert.ok(core.failurePatch(2).paused_at);
  const body = core.templateBody(core.whatsappEnv(), PHONE, "tus comidas");
  assert.equal(body.template.name, "recordatorio_diario");
  assert.deepEqual(body.template.components[0].parameters, [{ type: "text", text: "tus comidas" }]);
  // Configuración incompleta: motivo sin valores.
  const partial = core.whatsappEnv({ ...WA_ENV, WHATSAPP_APP_SECRET: "", WHATSAPP_PUBLIC_NUMBER: "+51 999" });
  assert.equal(partial.ready, false);
  assert.match(partial.issue, /WHATSAPP_APP_SECRET/);
  assert.ok(!partial.issue.includes("wa-token"));
  assert.deepEqual(whatsappPublic({}), { enabled: false });
  assert.deepEqual(whatsappPublic(WA_ENV), { enabled: true, number: "51999888777" });
  assert.equal(core.whatsappEnv({ ...WA_ENV, WHATSAPP_MONTHLY_CAP: "" }).monthlyCap, 600);
  // REQ-31: los textos y la plantilla no hablan de IA.
  for (const t of [core.LINKED_TEXT("20:00"), core.STOP_TEXT, core.EXPIRED_TEXT, core.TAKEN_TEXT]) assert.doesNotMatch(t, /\bIA\b|inteligencia|modelo|prompt|token/i);
}

// ── Webhook y acciones del usuario (api/push-subscribe.js?channel=whatsapp) ──
let db;
function webhookWorld({ links = [], prefs = [] } = {}) {
  db = { links: links.map((l) => ({ ...l })), prefs: prefs.map((p) => ({ ...p })), logPatches: [], prefsPosts: [], sent: [], calls: [] };
  globalThis.fetch = async (raw, init = {}) => {
    const url = new URL(raw), q = url.searchParams, route = url.pathname, method = init.method || "GET";
    db.calls.push({ route, method, q: String(q) });
    if (url.hostname === "graph.facebook.com") { db.sent.push(JSON.parse(init.body)); return json({ messages: [{ id: "wamid.reply" }] }); }
    if (route === "/auth/v1/user") return init.headers.Authorization === "Bearer user-jwt" ? json({ id: id(1) }) : json({}, 401);
    if (route.endsWith("/profiles")) return json([{ active: true }]);
    if (route.endsWith("/whatsapp_links")) {
      const eq = (k) => (q.get(k) || "").replace(/^(eq|gt|neq|is)\./, "");
      if (method === "GET") {
        let rows = db.links;
        if (q.has("link_code")) rows = rows.filter((l) => l.link_code === eq("link_code") && l.link_code_expires_at > eq("link_code_expires_at"));
        if (q.has("phone_e164")) rows = rows.filter((l) => l.phone_e164 === eq("phone_e164"));
        if (q.get("opted_in") === "is.true") rows = rows.filter((l) => l.opted_in);
        if (q.has("user_id") && q.get("user_id").startsWith("neq.")) rows = rows.filter((l) => l.user_id !== eq("user_id"));
        return json(rows);
      }
      if (method === "POST") {
        const row = JSON.parse(init.body);
        const cur = db.links.find((l) => l.user_id === row.user_id);
        if (cur) Object.assign(cur, row); else db.links.push(row);
        return json(null, 201);
      }
      if (method === "PATCH") {
        let rows = db.links;
        if (q.has("user_id")) rows = rows.filter((l) => l.user_id === eq("user_id"));
        if (q.has("phone_e164")) rows = rows.filter((l) => l.phone_e164 === eq("phone_e164"));
        if (q.get("opted_in") === "is.true") rows = rows.filter((l) => l.opted_in);
        if (q.get("fail_count") === "gt.0") rows = rows.filter((l) => l.fail_count > 0);
        const patch = JSON.parse(init.body);
        rows.forEach((r) => Object.assign(r, patch));
        return json(rows);
      }
    }
    if (route.endsWith("/notification_preferences")) {
      if (method === "POST") { db.prefsPosts.push({ body: JSON.parse(init.body), prefer: init.headers.Prefer }); return json(null, 201); }
      return json(db.prefs.filter((p) => `eq.${p.user_id}` === q.get("user_id")));
    }
    if (route.endsWith("/notification_log") && method === "PATCH") { db.logPatches.push({ q: String(q), body: JSON.parse(init.body) }); return json([]); }
    throw new Error("Ruta inesperada: " + method + " " + raw);
  };
}
const sign = (raw, secret = "app-secret") => "sha256=" + createHmac("sha256", secret).update(raw).digest("hex");
const inbound = (from, text) => ({ object: "whatsapp_business_account", entry: [{ changes: [{ field: "messages", value: {
  messages: [{ from, id: "wamid.in", type: "text", text: { body: text } }] } }] }] });
async function webhook(payload, { signature, method = "POST", url = "/api/push-subscribe?channel=whatsapp" } = {}) {
  const raw = Buffer.from(JSON.stringify(payload));
  const res = response();
  await channel({ method, url, body: raw, headers: { "x-hub-signature-256": signature ?? sign(raw) } }, res);
  return res;
}
async function userAction(body, token = "user-jwt") {
  const res = response();
  await channel({ method: "POST", url: "/api/whatsapp", body: Buffer.from(JSON.stringify(body)),
    headers: { authorization: "Bearer " + token } }, res);
  return res;
}
const future = new RealDate(RealDate.parse(NOW) + 10 * 60 * 1000).toISOString();
const past = new RealDate(RealDate.parse(NOW) - 60 * 1000).toISOString();

{
  // Verificación GET de Meta.
  webhookWorld();
  let res = response();
  await channel({ method: "GET", url: "/api/whatsapp?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=4242", headers: {} }, res);
  assert.equal(res.code, 200); assert.equal(res.body, "4242");
  res = response();
  await channel({ method: "GET", url: "/api/push-subscribe?channel=whatsapp&hub.mode=subscribe&hub.verify_token=otro&hub.challenge=1", headers: {} }, res);
  assert.equal(res.code, 403);

  // Firma inválida: 401 y nada cambia.
  webhookWorld({ links: [{ user_id: id(1), link_code: "ABC234", link_code_expires_at: future, opted_in: false }] });
  res = await webhook(inbound(PHONE, "EVOLV ABC234"), { signature: sign("otro cuerpo") });
  assert.equal(res.code, 401);
  res = await webhook(inbound(PHONE, "EVOLV ABC234"), { signature: sign(JSON.stringify(inbound(PHONE, "EVOLV ABC234")), "otro-secreto") });
  assert.equal(res.code, 401);
  assert.equal(db.links[0].opted_in, false); assert.equal(db.sent.length, 0);
  assert.ok(db.calls.every((c) => c.method === "GET" || c.route === "/auth/v1/user"), "sin escrituras con firma inválida");

  // Código vigente: vincula el número del remitente, crea la fila de preferencias sin pisarla y confirma.
  res = await webhook(inbound(PHONE, "evolv abc234"));
  assert.equal(res.code, 200);
  assert.equal(db.links[0].opted_in, true);
  assert.equal(db.links[0].phone_e164, PHONE);
  assert.equal(db.links[0].link_code, null, "el código es de un solo uso");
  assert.ok(db.links[0].consent_at);
  assert.equal(db.prefsPosts.length, 1);
  assert.match(db.prefsPosts[0].prefer, /ignore-duplicates/);
  assert.equal(db.sent.length, 1);
  assert.equal(db.sent[0].to, PHONE);
  assert.match(db.sent[0].text.body, /a las 20:00/);

  // Reusar el código no vincula otra cosa.
  const before = JSON.stringify(db.links);
  res = await webhook(inbound("51911122233", "EVOLV ABC234"));
  assert.equal(res.code, 200);
  assert.equal(JSON.stringify(db.links), before);
  assert.equal(db.sent.at(-1).text.body, core.EXPIRED_TEXT);

  // En Vercel el cuerpo llega ya parseado: vale la firma sobre el JSON tal como lo
  // serializa Meta ("\/" y \uXXXX), y una firma ajena sigue rechazándose.
  {
    webhookWorld({ links: [{ user_id: id(3), link_code: "MNB234", link_code_expires_at: future, opted_in: false }] });
    const payload = inbound(PHONE, "EVOLV MNB234");
    payload.entry[0].changes[0].value.contacts = [{ profile: { name: "José/Lima" }, wa_id: PHONE }];
    const metaRaw = JSON.stringify(payload).replace(/\//g, "\\/").replace(/[\u007f-\uffff]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
    assert.notEqual(metaRaw, JSON.stringify(payload));
    let r = response();
    await channel({ method: "POST", url: "/api/whatsapp", body: JSON.parse(metaRaw), headers: { "x-hub-signature-256": sign(metaRaw, "otro-secreto") } }, r);
    assert.equal(r.code, 401);
    assert.equal(db.links[0].opted_in, false);
    r = response();
    await channel({ method: "POST", url: "/api/whatsapp", body: JSON.parse(metaRaw), headers: { "x-hub-signature-256": sign(metaRaw) } }, r);
    assert.equal(r.code, 200);
    assert.equal(db.links[0].opted_in, true);
    assert.equal(db.links[0].phone_e164, PHONE);
  }

  // Código vencido.
  webhookWorld({ links: [{ user_id: id(2), link_code: "XYZ789", link_code_expires_at: past, opted_in: false }] });
  await webhook(inbound(PHONE, "EVOLV XYZ789"));
  assert.equal(db.links[0].opted_in, false); assert.equal(db.sent[0].text.body, core.EXPIRED_TEXT);

  // Número ya vinculado a otra cuenta.
  webhookWorld({ links: [
    { user_id: id(1), phone_e164: PHONE, opted_in: true },
    { user_id: id(2), link_code: "QWE234", link_code_expires_at: future, opted_in: false },
  ] });
  await webhook(inbound(PHONE, "EVOLV QWE234"));
  assert.equal(db.links[1].opted_in, false); assert.equal(db.links[1].phone_e164, undefined);
  assert.equal(db.sent[0].text.body, core.TAKEN_TEXT);

  // Baja por palabra clave.
  webhookWorld({ links: [{ user_id: id(1), phone_e164: PHONE, opted_in: true }] });
  await webhook(inbound(PHONE, "Baja"));
  assert.equal(db.links[0].opted_in, false); assert.ok(db.links[0].opted_out_at);
  assert.equal(db.sent[0].text.body, core.STOP_TEXT);

  // Otro texto: sin respuesta ni cambios.
  webhookWorld({ links: [{ user_id: id(1), phone_e164: PHONE, opted_in: true }] });
  await webhook(inbound(PHONE, "¿qué ceno hoy?"));
  assert.equal(db.sent.length, 0); assert.equal(db.links[0].opted_in, true);

  // Estados: fallido marca el envío y cuenta el fallo; tres seguidos pausan; entregado reinicia.
  webhookWorld({ links: [{ user_id: id(1), phone_e164: PHONE, opted_in: true, fail_count: 2 }] });
  const status = (s, code) => ({ entry: [{ changes: [{ value: { statuses: [{ id: "wamid.42", status: s, recipient_id: PHONE,
    ...(code ? { errors: [{ code }] } : {}) }] } }] }] });
  await webhook(status("failed", 131026));
  assert.match(db.logPatches[0].q, /provider_message_id=eq.wamid.42/);
  assert.deepEqual(db.logPatches[0].body, { status: "error", error_message: "whatsapp_131026" });
  assert.equal(db.links[0].opted_in, false); assert.ok(db.links[0].paused_at);
  webhookWorld({ links: [{ user_id: id(1), phone_e164: PHONE, opted_in: true, fail_count: 1 }] });
  await webhook(status("delivered"));
  assert.equal(db.links[0].fail_count, 0);

  // Acciones de la app: requieren sesión.
  webhookWorld();
  res = await userAction({ action: "link", timezone: "America/Lima" }, "otro");
  assert.equal(res.code, 401);
  res = await userAction({ action: "link", timezone: "America/Lima" });
  assert.equal(res.code, 200);
  assert.match(res.body.code, /^[A-HJ-NP-Z2-9]{6}$/);
  assert.equal(res.body.url, "https://wa.me/51999888777?text=EVOLV%20" + res.body.code);
  assert.equal(db.links[0].link_code, res.body.code);
  assert.equal(db.links[0].timezone, "America/Lima");
  assert.ok(db.links[0].link_code_expires_at > NOW);
  res = await userAction({ action: "link", timezone: "Mars/Olympus" });
  assert.equal(db.links[0].timezone, null, "zona inválida no se guarda");
  db.links[0].opted_in = true;
  res = await userAction({ action: "unlink" });
  assert.equal(res.code, 200); assert.equal(db.links[0].opted_in, false); assert.equal(db.links[0].link_code, null);
  res = await userAction({ action: "otra" });
  assert.equal(res.code, 400);

  // Sin configuración, el canal no responde.
  const saved = process.env.WHATSAPP_APP_SECRET;
  delete process.env.WHATSAPP_APP_SECRET;
  res = await webhook(inbound(PHONE, "BAJA"));
  assert.equal(res.code, 503);
  process.env.WHATSAPP_APP_SECRET = saved;
}

// ── Cron: aviso del día por WhatsApp (api/notify.js) ─────────────────────────
let w;
const TODAY = "2026-11-11";
function cronWorld({ users, monthSent = 0, graphError = null, dayLog = null } = {}) {
  w = { users, log: new Map(), graph: [], emails: [], linkPatches: [], prefsQuery: "", monthSent };
  globalThis.fetch = async (raw, init = {}) => {
    const url = new URL(raw), q = url.searchParams, route = url.pathname, method = init.method || "GET";
    if (url.hostname === "graph.facebook.com") {
      w.graph.push({ auth: init.headers.Authorization, body: JSON.parse(init.body) });
      if (graphError) return json({ error: { code: graphError } }, 400);
      return json({ messages: [{ id: "wamid." + w.graph.length }] });
    }
    if (route === "/emails") { w.emails.push(JSON.parse(init.body)); return json({ id: "email-" + w.emails.length }); }
    if (route.endsWith("/whatsapp_links")) {
      if (method === "PATCH") { w.linkPatches.push({ q: String(q), body: JSON.parse(init.body) }); return json([]); }
      return json(users.filter((u) => u.wa).map((u) => ({ user_id: u.id, phone_e164: u.wa, fail_count: u.fails || 0 })));
    }
    if (route.endsWith("/notification_preferences")) {
      if (q.has("user_id")) return json([]);
      if (!q.has("or")) return json(users.filter((u) => u.prefs !== false).map((u) => ({ user_id: u.id }))); // seguimientos (REQ-296)
      w.prefsQuery = q.get("or");
      const ids = (/user_id\.in\.\(([^)]*)\)/.exec(w.prefsQuery) || [, ""])[1].split(",").filter(Boolean);
      // Igual que PostgREST: solo quien activó algún canal.
      return json(users.filter((u) => u.prefs !== false && (u.email || u.push || ids.includes(u.id))).map((u) => ({
        user_id: u.id, email_opt_in: !!u.email, push_opt_in: !!u.push, timezone: "America/Lima", notify_hour: 20,
        enabled_days: [0, 1, 2, 3, 4, 5, 6], unsubscribe_token: "t" })));
    }
    if (route.endsWith("/profiles")) {
      if (q.has("id")) return json([{ email: q.get("id").slice(3) + "@example.test", active: true, planStartDate: "2026-10-01" }]);
      return json([]);
    }
    if (route.endsWith("/day_log")) return json(dayLog || [{ log_date: "2026-11-10", meals: { cena: { done: true } } }]);
    if (route.endsWith("/push_subscriptions")) return json([]);
    if (route.endsWith("/user_entitlements")) return json([]);
    if (route.endsWith("/referral_dashboard")) return json({ eligible: false });
    if (route.endsWith("/notification_log")) {
      if (q.get("notification_type") === "eq.whatsapp") return json(Array.from({ length: w.monthSent }, (_, n) => ({ id: n })));
      if (method === "POST") {
        const row = JSON.parse(init.body);
        const record = { ...row, id: row.idempotency_key };
        w.log.set(row.idempotency_key, record);
        return json([record]);
      }
      if (method === "PATCH") { Object.assign(w.log.get(decodeURIComponent(q.get("id").slice(3))), JSON.parse(init.body)); return json({}); }
      const keys = decodeURIComponent(q.get("idempotency_key") || "in.()").slice(4, -1).split(",");
      return json(keys.map((k) => w.log.get(k)).filter(Boolean));
    }
    throw new Error("Ruta inesperada: " + method + " " + raw);
  };
}
async function cron({ dryRun = false } = {}) {
  const res = response();
  await notify({ method: "GET", url: "/api/notify" + (dryRun ? "?dry_run=true" : ""), headers: { authorization: "Bearer fixture" } }, res);
  assert.ok([200].includes(res.code), "cron responde 200: " + JSON.stringify(res.body).slice(0, 300));
  return res.body;
}
const waLogs = () => [...w.log.values()].filter((r) => r.notification_type === "whatsapp");

{
  // Solo WhatsApp (sin correo): un mensaje con la plantilla, a su número; el mismo día no se repite.
  cronWorld({ users: [{ id: id(1), wa: PHONE }] });
  let out = await cron();
  assert.match(w.prefsQuery, new RegExp(`user_id\\.in\\.\\(${id(1)}\\)`));
  assert.equal(w.graph.length, 1);
  assert.equal(w.graph[0].auth, "Bearer wa-token");
  assert.equal(w.graph[0].body.to, PHONE);
  assert.equal(w.graph[0].body.template.name, "recordatorio_diario");
  assert.equal(w.graph[0].body.template.components[0].parameters[0].text, "tu día");
  assert.equal(w.emails.length, 0, "sin correo activado no hay correo");
  assert.equal(waLogs().length, 1);
  assert.equal(waLogs()[0].idempotency_key, `${id(1)}:whatsapp:${TODAY}`);
  assert.equal(waLogs()[0].status, "sent");
  assert.equal(waLogs()[0].provider_message_id, "wamid.1");
  assert.equal(out.whatsapp.sent, 1);
  assert.equal(out.whatsapp.ready, true);
  assert.ok(!JSON.stringify(out).includes(PHONE), "la respuesta del cron no incluye el número");
  out = await cron();
  assert.equal(w.graph.length, 1, "no se envía dos veces el mismo día");

  // Con correo y WhatsApp: ambos canales, uno de cada uno.
  cronWorld({ users: [{ id: id(1), wa: PHONE, email: true }] });
  await cron();
  assert.equal(w.graph.length, 1); assert.equal(w.emails.length, 1);

  // Sin ningún canal activo: nada del aviso del día.
  cronWorld({ users: [{ id: id(3) }] });
  await cron();
  assert.equal(w.graph.length, 0); assert.equal(w.emails.length, 0);
  assert.equal(waLogs().length, 0);

  // Tope del mes: no sale WhatsApp; el correo sigue.
  cronWorld({ users: [{ id: id(1), wa: PHONE, email: true }], monthSent: 5 });
  out = await cron();
  assert.equal(w.graph.length, 0); assert.equal(w.emails.length, 1);
  assert.equal(out.whatsapp.capped, 1);
  assert.ok(out.log.some((l) => l.action === "whatsapp_cap"));

  // El tope se respeta también con usuarios en paralelo.
  cronWorld({ users: Array.from({ length: 6 }, (_, n) => ({ id: id(10 + n), wa: "5198765430" + n })), monthSent: 3 });
  out = await cron();
  assert.equal(w.graph.length, 2, "5 - 3 = 2 mensajes");
  assert.equal(out.whatsapp.capped, 4);

  // dry_run: no llama a Meta.
  cronWorld({ users: [{ id: id(1), wa: PHONE }] });
  out = await cron({ dryRun: true });
  assert.equal(w.graph.length, 0);
  assert.equal(out.whatsapp.skipped, 1);

  // Otra etapa (regreso tras días sin registrar): no va por WhatsApp.
  cronWorld({ users: [{ id: id(1), wa: PHONE, email: true }], dayLog: [{ log_date: "2026-11-06", meals: { cena: { done: true } } }] });
  await cron();
  assert.equal(w.graph.length, 0);
  assert.equal(w.emails.length, 1, "el correo de regreso sigue");

  // Fallo de entrega: queda el error, cuenta el fallo y no se reintenta el mismo día.
  cronWorld({ users: [{ id: id(1), wa: PHONE, fails: 2 }], graphError: 131026 });
  out = await cron();
  assert.equal(w.graph.length, 1);
  assert.equal(waLogs()[0].status, "error");
  assert.equal(out.whatsapp.errors, 1);
  assert.equal(w.linkPatches.length, 1);
  assert.equal(w.linkPatches[0].body.opted_in, false, "tercer fallo seguido: se pausa");
  out = await cron();
  assert.equal(w.graph.length, 1, "un WhatsApp fallido no se reintenta el mismo día");
  assert.ok(out.log.some((l) => l.action === "already_failed"));

  // Sin configuración: no se llama a Meta y la respuesta dice por qué.
  const saved = process.env.WHATSAPP_TOKEN;
  delete process.env.WHATSAPP_TOKEN;
  cronWorld({ users: [{ id: id(1), wa: PHONE, email: true }] });
  out = await cron();
  assert.equal(w.graph.length, 0);
  assert.equal(out.whatsapp.ready, false);
  assert.match(out.whatsapp.issue, /WHATSAPP_TOKEN/);
  assert.ok(!w.prefsQuery.includes("user_id.in"), "sin WhatsApp listo no se suman sus usuarios");
  process.env.WHATSAPP_TOKEN = saved;
}

console.log("WhatsApp OK: firma, verificación, vinculación, código vencido/reusado, número ocupado, baja, estados, acciones con sesión, aviso del día, idempotencia, tope mensual, dry_run, fallos y configuración incompleta.");
