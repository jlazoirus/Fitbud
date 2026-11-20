// Registra o elimina suscripciones Web Push para el usuario autenticado (REQ-38)
// POST   /api/push-subscribe — guarda un endpoint de suscripción
// DELETE /api/push-subscribe — elimina todas las suscripciones del usuario (opt-out)
//
// REQ-255: también atiende WhatsApp (Vercel Hobby admite 12 funciones y ya hay 12).
// /api/whatsapp se reescribe aquí con ?channel=whatsapp (vercel.json):
//   GET  (Meta)  verificación del webhook con hub.verify_token
//   POST (Meta)  webhook firmado con X-Hub-Signature-256: vincular y dar de baja
//   POST (app)   { action: "link" | "unlink" } con el JWT de sesión
//
// El cliente llama este endpoint con el JWT de sesión en Authorization.
// Usa service role para escribir en push_subscriptions y whatsapp_links (tablas
// solo accesibles por el propio usuario vía RLS o por service role).
import {
  whatsappEnv, verifySignature, metaJsonVariants, parseWebhook, classifyText, newLinkCode, linkUrl,
  textBody, sendWhatsapp, failurePatch, LINK_CODE_TTL_MS,
  LINKED_TEXT, STOP_TEXT, EXPIRED_TEXT, TAKEN_TEXT,
} from "./_whatsapp/core.js";

// El webhook de Meta se valida con el cuerpo crudo: se lee a mano en todas las rutas.
export const config = { api: { bodyParser: false } };

function env() {
  return {
    url: (process.env.SUPABASE_URL || "").replace(/\/$/, ""),
    anon: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "",
    service: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  };
}

async function rj(r) { return r.json().catch(() => ({})); }

// En Vercel, consultar req.body hace que la plataforma parsee el JSON: los bytes que
// firmó Meta se pierden. Por eso el webhook prueba también el formato de Meta.
function signedBodies(req, raw) {
  return req.body != null && !Buffer.isBuffer(req.body) && typeof req.body !== "string"
    ? metaJsonVariants(req.body) : [raw];
}

async function readRawBody(req) {
  if (req.body != null) {
    if (Buffer.isBuffer(req.body)) return req.body;
    return Buffer.from(typeof req.body === "string" ? req.body : JSON.stringify(req.body));
  }
  if (typeof req.on !== "function") return Buffer.alloc(0);
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function parseJson(raw) {
  if (!raw || !raw.length) return {};
  try { return JSON.parse(raw.toString("utf8")); } catch (_) { return null; }
}

async function verifyUser(req, e) {
  const auth = req.headers.authorization || req.headers.Authorization || "";
  const token = typeof auth === "string" && auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || !e.url || !e.anon) return null;
  try {
    const r = await fetch(e.url + "/auth/v1/user", {
      headers: { Authorization: "Bearer " + token, apikey: e.anon },
    });
    if (!r.ok) return null;
    const user = await rj(r);
    if (!user || !user.id) return null;
    const pr = await fetch(
      e.url + "/rest/v1/profiles?id=eq." + encodeURIComponent(user.id) + "&select=active",
      { headers: { Authorization: "Bearer " + token, apikey: e.anon } }
    );
    if (!pr.ok) return null;
    const rows = await rj(pr);
    if (!Array.isArray(rows) || !rows[0] || rows[0].active === false) return null;
    return user;
  } catch (_) {
    return null;
  }
}

function svcHeaders(e, extra) {
  return Object.assign(
    { apikey: e.service, Authorization: "Bearer " + e.service, "Content-Type": "application/json" },
    extra || {}
  );
}

async function svc(e, path, init = {}) {
  const r = await fetch(e.url + path, { ...init, headers: svcHeaders(e, init.headers) });
  if (!r.ok) {
    const err = await rj(r);
    const error = new Error(err.message || "HTTP " + r.status);
    error.status = r.status;
    error.code = err.code;
    throw error;
  }
  return r.status === 204 ? null : rj(r);
}

function isWhatsappRoute(req) {
  const url = new URL(req.url || "/", "https://x");
  return url.searchParams.get("channel") === "whatsapp" || url.pathname.startsWith("/api/whatsapp");
}

// ── WhatsApp: webhook de Meta ────────────────────────────────────────────────

const hourLabel = (h) => String(h == null ? 20 : Number(h)).padStart(2, "0") + ":00";

async function replyText(wa, to, text, log) {
  try { await sendWhatsapp(wa, textBody(to, text)); }
  catch (err) { log.push({ action: "reply_error", error: err.message }); }
}

async function handleLink(e, wa, from, code, log) {
  const now = new Date().toISOString();
  const rows = await svc(e, `/rest/v1/whatsapp_links?link_code=eq.${encodeURIComponent(code)}` +
    `&link_code_expires_at=gt.${encodeURIComponent(now)}&select=user_id,timezone`);
  const row = rows && rows[0];
  if (!row) { log.push({ action: "link_invalid" }); return replyText(wa, from, EXPIRED_TEXT, log); }
  const taken = await svc(e, `/rest/v1/whatsapp_links?phone_e164=eq.${from}&opted_in=is.true` +
    `&user_id=neq.${row.user_id}&select=user_id&limit=1`);
  if (taken && taken.length) { log.push({ action: "link_taken" }); return replyText(wa, from, TAKEN_TEXT, log); }
  try {
    await svc(e, `/rest/v1/whatsapp_links?user_id=eq.${row.user_id}`, {
      method: "PATCH",
      body: JSON.stringify({ phone_e164: from, opted_in: true, consent_at: now, opted_out_at: null, paused_at: null,
        fail_count: 0, link_code: null, link_code_expires_at: null, updated_at: now }),
    });
  } catch (err) {
    // Índice único: otro usuario vinculó este número entre la lectura y la escritura.
    if (err.code === "23505") { log.push({ action: "link_taken" }); return replyText(wa, from, TAKEN_TEXT, log); }
    throw err;
  }
  // Activar WhatsApp es elegir recordatorios: la fila de preferencias da la hora,
  // los días y la zona horaria del aviso. No pisa una fila existente.
  await svc(e, "/rest/v1/notification_preferences?on_conflict=user_id", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify({ user_id: row.user_id, timezone: row.timezone || "America/Lima", updated_at: now }),
  }).catch(() => null);
  const prefs = await svc(e, `/rest/v1/notification_preferences?user_id=eq.${row.user_id}&select=notify_hour`).catch(() => null);
  log.push({ action: "linked" });
  return replyText(wa, from, LINKED_TEXT(hourLabel(prefs && prefs[0] && prefs[0].notify_hour)), log);
}

async function handleStop(e, wa, from, log) {
  const now = new Date().toISOString();
  const rows = await svc(e, `/rest/v1/whatsapp_links?phone_e164=eq.${from}&opted_in=is.true`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ opted_in: false, opted_out_at: now, updated_at: now }),
  });
  if (!rows || !rows.length) { log.push({ action: "stop_none" }); return; }
  log.push({ action: "stopped" });
  return replyText(wa, from, STOP_TEXT, log);
}

// Entregado o leído: el número funciona. Fallido: cuenta el fallo, marca el
// registro del envío y, tras MAX_DELIVERY_FAILURES seguidos, pausa el canal.
async function handleStatus(e, s, log) {
  if (!/^[1-9]\d{7,14}$/.test(s.recipient)) return;
  if (s.status === "delivered" || s.status === "read") {
    await svc(e, `/rest/v1/whatsapp_links?phone_e164=eq.${s.recipient}&opted_in=is.true&fail_count=gt.0`, {
      method: "PATCH", body: JSON.stringify({ fail_count: 0 }),
    });
    return;
  }
  if (s.status !== "failed") return;
  await svc(e, `/rest/v1/notification_log?provider_message_id=eq.${encodeURIComponent(s.id)}`, {
    method: "PATCH", body: JSON.stringify({ status: "error", error_message: "whatsapp_" + (s.code || "failed") }),
  }).catch(() => null);
  await registerFailure(e, `phone_e164=eq.${s.recipient}`);
  log.push({ action: "delivery_failed", code: s.code });
}

async function registerFailure(e, filter) {
  const rows = await svc(e, `/rest/v1/whatsapp_links?${filter}&opted_in=is.true&select=user_id,fail_count`);
  for (const row of rows || []) {
    await svc(e, `/rest/v1/whatsapp_links?user_id=eq.${row.user_id}`, {
      method: "PATCH", body: JSON.stringify(failurePatch(row.fail_count)),
    });
  }
}

async function handleWebhook(req, res, e, wa) {
  const url = new URL(req.url || "/", "https://x");
  if (req.method === "GET") {
    const ok = url.searchParams.get("hub.mode") === "subscribe" && wa.verifyToken &&
      url.searchParams.get("hub.verify_token") === wa.verifyToken;
    if (!ok) return res.status(403).send("Forbidden");
    res.setHeader("Content-Type", "text/plain");
    return res.status(200).send(url.searchParams.get("hub.challenge") || "");
  }
  const raw = await readRawBody(req);
  const signature = req.headers["x-hub-signature-256"];
  if (!signedBodies(req, raw).some((b) => verifySignature(b, signature, wa.appSecret))) {
    console.warn(JSON.stringify({ event: "whatsapp_webhook", action: "bad_signature", parsed: !Buffer.isBuffer(req.body) && req.body != null }));
    return res.status(401).json({ error: "Firma inválida" });
  }
  const payload = parseJson(raw);
  const { messages, statuses, shapes } = parseWebhook(payload || {});
  const log = [];
  for (const m of messages) {
    if (!/^[1-9]\d{7,14}$/.test(m.from)) continue;
    const intent = classifyText(m.text);
    try {
      if (intent && intent.kind === "link") await handleLink(e, wa, m.from, intent.code, log);
      else if (intent && intent.kind === "stop") await handleStop(e, wa, m.from, log);
    } catch (err) {
      log.push({ action: "message_error", error: err.message });
    }
  }
  for (const s of statuses) {
    try { await handleStatus(e, s, log); }
    catch (err) { log.push({ action: "status_error", error: err.message }); }
  }
  // Sin números ni textos en los logs: solo conteos y acciones (cada entrega válida deja rastro).
  const fields = [...new Set(((payload && payload.entry) || []).flatMap((en) => (en.changes || []).map((c) => c && c.field)).filter(Boolean))];
  const valueKeys = [...new Set(((payload && payload.entry) || []).flatMap((en) => (en.changes || []).flatMap((c) => Object.keys((c && c.value) || {}))))];
  console.info(JSON.stringify({ event: "whatsapp_webhook", action: "received", fields, valueKeys, shapes,
    messages: messages.length, statuses: statuses.length, actions: log.map((l) => l.action) }));
  // 200 siempre tras validar la firma: Meta no reintenta lo ya procesado.
  return res.status(200).json({ ok: true });
}

// ── WhatsApp: acciones del usuario autenticado ───────────────────────────────

const validTz = (tz) => {
  if (typeof tz !== "string" || tz.length > 64) return "";
  try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return tz; } catch (_) { return ""; }
};

async function handleUserAction(req, res, e, wa) {
  const user = await verifyUser(req, e);
  if (!user) return res.status(401).json({ error: "Sesión requerida" });
  const body = parseJson(await readRawBody(req));
  if (!body) return res.status(400).json({ error: "JSON inválido" });
  const now = new Date();
  const stamp = now.toISOString();
  try {
    if (body.action === "link") {
      const code = newLinkCode();
      await svc(e, "/rest/v1/whatsapp_links?on_conflict=user_id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ user_id: user.id, link_code: code,
          link_code_expires_at: new Date(now.getTime() + LINK_CODE_TTL_MS).toISOString(),
          timezone: validTz(body.timezone) || null, updated_at: stamp }),
      });
      return res.status(200).json({ ok: true, code, url: linkUrl(wa.publicNumber, code) });
    }
    if (body.action === "unlink") {
      await svc(e, `/rest/v1/whatsapp_links?user_id=eq.${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ opted_in: false, opted_out_at: stamp, link_code: null, link_code_expires_at: null, updated_at: stamp }),
      });
      return res.status(200).json({ ok: true });
    }
  } catch (err) {
    return res.status(500).json({ error: "No se pudo actualizar WhatsApp" });
  }
  return res.status(400).json({ error: "Acción desconocida" });
}

async function handleWhatsapp(req, res, e) {
  const wa = whatsappEnv();
  if (!wa.ready) return res.status(503).json({ error: "WhatsApp no configurado" });
  if (req.method === "GET" || req.headers["x-hub-signature-256"] != null) return handleWebhook(req, res, e, wa);
  if (req.method === "POST") return handleUserAction(req, res, e, wa);
  return res.status(405).json({ error: "Method not allowed" });
}

// ── Web Push ─────────────────────────────────────────────────────────────────

export async function handler(req, res) {
  const e = env();
  if (!e.url || !e.service) {
    return res.status(503).json({ error: "DB no configurada" });
  }

  if (isWhatsappRoute(req)) return handleWhatsapp(req, res, e);

  const user = await verifyUser(req, e);
  if (!user) return res.status(401).json({ error: "Sesión requerida" });

  const userId = user.id;

  if (req.method === "DELETE") {
    const r = await fetch(
      e.url + "/rest/v1/push_subscriptions?user_id=eq." + encodeURIComponent(userId),
      { method: "DELETE", headers: svcHeaders(e) }
    );
    if (!r.ok) {
      const err = await rj(r);
      return res.status(500).json({ error: err.message || "Error al eliminar" });
    }
    return res.status(200).json({ ok: true });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = parseJson(await readRawBody(req));
  if (!body) return res.status(400).json({ error: "JSON inválido" });

  const { endpoint, keys } = body || {};
  if (!endpoint || typeof endpoint !== "string" ||
      !keys || typeof keys.p256dh !== "string" || typeof keys.auth !== "string") {
    return res.status(400).json({ error: "Suscripción incompleta (endpoint, keys.p256dh, keys.auth)" });
  }

  const userAgent = String(req.headers["user-agent"] || "").slice(0, 512);

  const r = await fetch(e.url + "/rest/v1/push_subscriptions", {
    method: "POST",
    headers: svcHeaders(e, { Prefer: "resolution=merge-duplicates" }),
    body: JSON.stringify({
      user_id: userId,
      endpoint,
      keys_p256dh: keys.p256dh,
      keys_auth: keys.auth,
      user_agent: userAgent,
      created_at: new Date().toISOString(),
    }),
  });

  if (!r.ok) {
    const err = await rj(r);
    return res.status(500).json({ error: err.message || "Error al guardar suscripción" });
  }
  return res.status(200).json({ ok: true });
}

// ── Entrada Web (Request → Response) ─────────────────────────────────────────
// Con la firma (req, res), Vercel lee y parsea el JSON antes de llamar al handler,
// y los bytes que firmó Meta se pierden. Con GET/POST/DELETE exportados, Vercel
// entrega un Request estándar: se lee el cuerpo crudo y se reusa el mismo handler.
export async function webHandler(request) {
  const url = new URL(request.url);
  const headers = {};
  request.headers.forEach((v, k) => { headers[k] = v; });
  const body = request.method === "GET" || request.method === "HEAD"
    ? undefined : Buffer.from(await request.arrayBuffer());
  const out = { status: 200, headers: {}, body: "" };
  const res = {
    status(c) { out.status = c; return this; },
    setHeader(k, v) { out.headers[k] = String(v); },
    json(b) {
      if (!Object.keys(out.headers).some((k) => k.toLowerCase() === "content-type")) {
        out.headers["Content-Type"] = "application/json; charset=utf-8";
      }
      out.body = JSON.stringify(b);
      return this;
    },
    send(b) { out.body = b == null ? "" : typeof b === "string" || Buffer.isBuffer(b) ? b : JSON.stringify(b); return this; },
  };
  await handler({ method: request.method, url: url.pathname + url.search, headers, body }, res);
  return new Response(out.status === 204 ? null : out.body, { status: out.status, headers: out.headers });
}

export const GET = webHandler;
export const POST = webHandler;
export const DELETE = webHandler;
