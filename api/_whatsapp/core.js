// REQ-255: recordatorios por WhatsApp con la Cloud API de Meta (fetch, sin SDK).
// Lo usan /api/push-subscribe (vinculación, baja y webhook) y /api/notify (envío).
// Diseño y activación: docs/whatsapp-reminders.md.
//
// Variables de entorno (Vercel):
//   WHATSAPP_TOKEN            token permanente de un usuario del sistema
//   WHATSAPP_PHONE_NUMBER_ID  id del número en WhatsApp Manager
//   WHATSAPP_APP_SECRET       secreto de la app de Meta (firma del webhook)
//   WHATSAPP_VERIFY_TOKEN     cadena propia para verificar el webhook
//   WHATSAPP_PUBLIC_NUMBER    número público en E.164 sin "+", para wa.me
//   WHATSAPP_TEMPLATE         plantilla de utilidad aprobada (recordatorio_diario)
//   WHATSAPP_MONTHLY_CAP      tope de mensajes por mes (600 ≈ US$18 a US$0,03)
//   WHATSAPP_GRAPH_VERSION    versión de la Graph API (opcional)
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

export const LINK_CODE_TTL_MS = 30 * 60 * 1000;
export const MAX_DELIVERY_FAILURES = 3;
export const DEFAULT_MONTHLY_CAP = 600;
export const DEFAULT_TEMPLATE = "recordatorio_diario";
const DEFAULT_GRAPH_VERSION = "v23.0";
// Sin 0/O ni 1/I/L: el código se lee y se puede escribir a mano.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const STOP_WORDS = new Set(["BAJA", "STOP", "SALIR", "CANCELAR", "DETENER"]);

const clean = (v) => String(v ?? "").trim();

// Configuración y motivo cuando falta algo, sin mostrar valores (como VAPID, REQ-281).
export function whatsappEnv(source = process.env) {
  const cfg = {
    token: clean(source.WHATSAPP_TOKEN),
    phoneNumberId: clean(source.WHATSAPP_PHONE_NUMBER_ID),
    appSecret: clean(source.WHATSAPP_APP_SECRET),
    verifyToken: clean(source.WHATSAPP_VERIFY_TOKEN),
    publicNumber: clean(source.WHATSAPP_PUBLIC_NUMBER).replace(/^\+/, ""),
    template: clean(source.WHATSAPP_TEMPLATE) || DEFAULT_TEMPLATE,
    graphVersion: clean(source.WHATSAPP_GRAPH_VERSION) || DEFAULT_GRAPH_VERSION,
  };
  // Vacío o inválido: el tope por defecto (Number("") sería 0 y no enviaría nada).
  const rawCap = clean(source.WHATSAPP_MONTHLY_CAP);
  const cap = rawCap ? Number(rawCap) : NaN;
  cfg.monthlyCap = Number.isFinite(cap) && cap >= 0 ? Math.floor(cap) : DEFAULT_MONTHLY_CAP;
  const missing = [
    ["WHATSAPP_TOKEN", cfg.token], ["WHATSAPP_PHONE_NUMBER_ID", cfg.phoneNumberId],
    ["WHATSAPP_APP_SECRET", cfg.appSecret], ["WHATSAPP_VERIFY_TOKEN", cfg.verifyToken],
    ["WHATSAPP_PUBLIC_NUMBER", cfg.publicNumber],
  ].filter(([, v]) => !v).map(([k]) => k);
  if (cfg.publicNumber && !/^[1-9]\d{7,14}$/.test(cfg.publicNumber)) missing.push("WHATSAPP_PUBLIC_NUMBER (formato E.164)");
  cfg.ready = missing.length === 0;
  cfg.issue = missing.length ? "falta " + missing.join(", ") : "";
  return cfg;
}

// Firma del webhook: X-Hub-Signature-256 = "sha256=" + HMAC-SHA256(cuerpo crudo, app secret).
// Meta firma su JSON con "/" escapado como "\/" y lo no ASCII como \uXXXX en hex
// minúscula. Si el cuerpo ya llegó parseado, estas son las serializaciones posibles.
export function metaJsonVariants(obj) {
  const plain = JSON.stringify(obj);
  const unicode = plain.replace(/[\u007f-\uffff]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
  const slash = (t) => t.replace(/\//g, "\\/");
  return [...new Set([plain, unicode, slash(plain), slash(unicode)])].map((t) => Buffer.from(t, "utf8"));
}

export function verifySignature(rawBody, header, appSecret) {
  if (!appSecret || typeof header !== "string" || !header.startsWith("sha256=")) return false;
  const got = Buffer.from(header.slice(7), "utf8");
  const want = Buffer.from(createHmac("sha256", appSecret).update(rawBody).digest("hex"), "utf8");
  return got.length === want.length && timingSafeEqual(got, want);
}

export function newLinkCode() {
  let code = "";
  for (let i = 0; i < 6; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return code;
}

export function linkUrl(publicNumber, code) {
  return `https://wa.me/${publicNumber}?text=${encodeURIComponent("EVOLV " + code)}`;
}

const normalizeText = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toUpperCase();

// Qué pidió el usuario con su mensaje: vincular, darse de baja o nada.
export function classifyText(text) {
  const t = normalizeText(text);
  const link = /^EVOLV\s+([A-Z0-9]{6})\b/.exec(t);
  if (link) return { kind: "link", code: link[1] };
  if (STOP_WORDS.has(t.replace(/[^A-Z]/g, ""))) return { kind: "stop" };
  return null;
}

// Mensajes de texto y estados de entrega del cuerpo del webhook.
export function parseWebhook(payload) {
  const messages = [], statuses = [];
  for (const entry of (payload && Array.isArray(payload.entry) ? payload.entry : [])) {
    for (const change of (Array.isArray(entry.changes) ? entry.changes : [])) {
      const v = change && change.value;
      if (!v) continue;
      for (const m of (Array.isArray(v.messages) ? v.messages : [])) {
        if (m && m.type === "text" && m.from) messages.push({ from: String(m.from), text: m.text && m.text.body || "", id: m.id || "" });
      }
      for (const s of (Array.isArray(v.statuses) ? v.statuses : [])) {
        if (s && s.id) statuses.push({ id: String(s.id), status: String(s.status || ""), recipient: String(s.recipient_id || ""),
          code: s.errors && s.errors[0] ? Number(s.errors[0].code) || null : null });
      }
    }
  }
  return { messages, statuses };
}

export function maskPhone(e164) {
  const d = String(e164 || "").replace(/\D/g, "");
  if (d.length < 10) return "";
  // Celulares de 9 dígitos (Perú y la mayoría de LatAm): +51 9•• ••• 123.
  return `+${d.slice(0, d.length - 9)} ${d[d.length - 9]}•• ••• ${d.slice(-3)}`;
}

// {{1}} de la plantilla: qué falta. Sin datos de salud ni rachas (utilidad, no marketing).
export function pendingLabel(decision) {
  if (!decision) return "";
  if (decision.step === "rescue") return "lo pendiente de ayer";
  return { nutrition: "tus comidas", training: "tu entreno", both: "tus comidas y tu entreno" }[decision.missing] || "tu día";
}

// Un fallo de entrega más; al llegar a MAX_DELIVERY_FAILURES se pausa el canal.
export function failurePatch(failCount, now = new Date()) {
  const fails = (Number(failCount) || 0) + 1;
  const updated_at = now.toISOString();
  return fails >= MAX_DELIVERY_FAILURES
    ? { fail_count: fails, opted_in: false, paused_at: updated_at, updated_at }
    : { fail_count: fails, updated_at };
}

export function wantsWhatsapp(decision) {
  return !!decision && (decision.step === "day" || decision.step === "rescue");
}

// Primer instante del mes en curso en Lima (UTC-5, sin horario de verano).
export function monthStartLima(now = new Date()) {
  const lima = new Date(now.getTime() - 5 * 3600 * 1000);
  return new Date(Date.UTC(lima.getUTCFullYear(), lima.getUTCMonth(), 1, 5)).toISOString();
}

export function templateBody(cfg, to, label) {
  return {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: cfg.template,
      language: { code: "es" },
      components: [{ type: "body", parameters: [{ type: "text", text: label }] }],
    },
  };
}

export function textBody(to, body) {
  return { messaging_product: "whatsapp", to, type: "text", text: { preview_url: false, body } };
}

// Envía a la Graph API. request(url, init) permite acotar el tiempo (REQ-383).
export async function sendWhatsapp(cfg, body, request = fetch) {
  const r = await request(`https://graph.facebook.com/${cfg.graphVersion}/${cfg.phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: "Bearer " + cfg.token, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error("whatsapp_" + ((data.error && data.error.code) || r.status));
    err.code = data.error && data.error.code;
    throw err;
  }
  return (data.messages && data.messages[0] && data.messages[0].id) || "";
}

export const LINKED_TEXT = (hour) =>
  `Listo, te avisaremos por aquí a las ${hour} si te falta algo del día. Responde BAJA para dejar de recibirlos.`;
export const STOP_TEXT = "Listo, ya no te enviaremos avisos por WhatsApp. Puedes volver a activarlos en Evolv, en Perfil → Recordatorios.";
export const EXPIRED_TEXT = "Ese código venció o ya se usó. Abre Evolv, ve a Perfil → Recordatorios y toca «Activar en WhatsApp» para generar uno nuevo.";
export const TAKEN_TEXT = "Este número ya recibe avisos de otra cuenta de Evolv. Responde BAJA y vuelve a intentarlo desde la cuenta que quieras usar.";
