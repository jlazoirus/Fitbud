// REQ-357: correos del ciclo de la suscripción mensual (docs/web-publica-y-suscripcion.md §3).
// Cinco correos, cada uno una sola vez por su clave en notification_log (tipo
// `subscription`, supabase/notifications_subscription.sql):
//   prueba        sub:<sxn>:prueba            al inscribirse con semana gratis
//   aviso_cobro   sub:<sxn>:aviso_cobro       2 días antes del primer cobro (cron de /api/notify)
//   recibo        sub:<sxn>:recibo:<chr>      cada cobro exitoso (webhook)
//   cobro_fallido sub:<sxn>:fallido:<fecha>   un aviso por cobro que vence, aunque Culqi reintente
//   cancelada     sub:<sxn>:cancelada         al cancelar (desde la cuenta o por Culqi)
// Sin datos de salud. Son correos de la compra: no tienen baja, como los de REQ-351.
// Nunca lanzan: un correo que falla no rompe el cobro, la cancelación ni el webhook.
import { SUSCRIPCION, formatoPrecio } from "../../tienda/planes.js";
import { COMERCIO } from "../../tienda/comercio.js";

export const TIPO_LOG = "subscription";
const TZ = "America/Lima";

export function fechaLima(iso) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return new Intl.DateTimeFormat("es-PE", { timeZone: TZ, day: "numeric", month: "long", year: "numeric" }).format(d);
}

export function ymdLima(iso) {
  const d = new Date(iso || Date.now());
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(Number.isFinite(d.getTime()) ? d : new Date()).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

export function tarjetaTexto(fila) {
  return fila && fila.card_last4 ? `${fila.card_brand || "Tarjeta"} •••• ${fila.card_last4}` : "tu tarjeta";
}

const MONTO = () => formatoPrecio(SUSCRIPCION.montoCentimos, SUSCRIPCION.moneda);
const CTA_CUENTA = { cta: "Ver o cancelar mi suscripción", url: "/cuenta" };

// datos: { fila, monto, primerCobro, accesoHasta, fecha }
export function mensajeSuscripcion(tipo, datos = {}) {
  const fila = datos.fila || {};
  const monto = datos.monto || MONTO();
  const tarjeta = tarjetaTexto(fila);
  if (tipo === "prueba") {
    const cobro = fechaLima(datos.primerCobro || fila.next_billing_at || fila.trial_ends_at);
    return {
      subject: "Tu semana gratis en Evolv empezó",
      title: "Tu semana gratis empezó",
      paragraphs: [
        `Tienes acceso completo a Evolv sin pagar nada hasta el ${cobro}.`,
        `Ese día se cobran ${monto} a ${tarjeta} y luego cada mes, hasta que canceles.`,
        `Te avisamos por correo ${SUSCRIPCION.diasAvisoCobro} días antes del primer cobro. Si cancelas antes, no se cobra nada.`,
      ],
      ...CTA_CUENTA,
    };
  }
  if (tipo === "aviso_cobro") {
    const cobro = fechaLima(datos.primerCobro || fila.next_billing_at);
    return {
      subject: `Tu primer cobro de Evolv es el ${cobro}`,
      title: `Tu semana gratis termina el ${cobro}`,
      paragraphs: [
        `Ese día se cobran ${monto} a ${tarjeta} y luego cada mes, hasta que canceles.`,
        "Si quieres seguir, no tienes que hacer nada. Si prefieres no continuar, cancela antes de esa fecha y no se cobra nada.",
      ],
      ...CTA_CUENTA,
    };
  }
  if (tipo === "recibo") {
    const filas = [`Cobro: ${monto} a ${tarjeta}, el ${fechaLima(datos.fecha || Date.now())}.`];
    if (datos.accesoHasta) filas.push(`Tu acceso está pagado hasta el ${fechaLima(datos.accesoHasta)}.`);
    if (fila.next_billing_at) filas.push(`El próximo cobro es el ${fechaLima(fila.next_billing_at)}.`);
    filas.push("Puedes cancelar cuando quieras, sin costo. Conservas el acceso hasta el final del mes pagado.");
    filas.push(`${COMERCIO.razonSocial} · RUC ${COMERCIO.ruc}.`);
    return { subject: `Recibo de tu suscripción a Evolv · ${monto}`, title: "Gracias, recibimos tu pago", paragraphs: filas, ...CTA_CUENTA };
  }
  if (tipo === "cobro_fallido") {
    return {
      subject: "No pudimos cobrar tu suscripción a Evolv",
      title: "Tu cobro no pasó",
      paragraphs: [
        `Intentamos cobrar ${monto} a ${tarjeta} y el banco no lo aprobó.`,
        "Culqi, la pasarela de pago, lo volverá a intentar en los próximos días. Revisa que tu tarjeta tenga saldo y esté habilitada para compras por internet.",
        "Si los intentos no pasan, la suscripción se cancela sola y no se cobra nada más. Tu historial y tu progreso se conservan.",
      ],
      ...CTA_CUENTA,
    };
  }
  if (tipo === "cancelada") {
    const hasta = datos.accesoHasta ? fechaLima(datos.accesoHasta) : "";
    return {
      subject: "Cancelaste tu suscripción a Evolv",
      title: "Tu suscripción está cancelada",
      paragraphs: [
        "No se hará ningún cobro más a tu tarjeta.",
        hasta ? `Conservas el acceso completo hasta el ${hasta}.` : "",
        "Tu historial y tu progreso se conservan. Si quieres volver, puedes elegir un plan cuando quieras.",
      ].filter(Boolean),
      cta: "Ver planes",
      url: "/planes",
    };
  }
  throw new Error("tipo de correo desconocido: " + tipo);
}

const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function htmlCorreoSuscripcion(appUrl, msg) {
  const parrafos = msg.paragraphs
    .map((t) => `<p style="color:#444;font-size:15px;line-height:1.5;margin:0 0 12px">${esc(t)}</p>`)
    .join("\n  ");
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(msg.subject)}</title></head>
<body style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a;background:#fff">
  <p style="font-size:19px;font-weight:700;margin:0 0 14px">${esc(msg.title)}</p>
  ${parrafos}
  <a href="${esc(String(appUrl || "").replace(/\/$/, "") + msg.url)}"
     style="display:inline-block;background:#101010;color:#d6ff3a;text-decoration:none;
            padding:12px 28px;border-radius:10px;font-weight:700;font-size:15px;margin-top:12px">
    ${esc(msg.cta)}
  </a>
  <hr style="margin:36px 0;border:none;border-top:1px solid #eee">
  <p style="font-size:12px;color:#777;margin:0">Te escribimos porque tienes una suscripción a Evolv con este correo. Es un aviso sobre tu suscripción, no un recordatorio.</p>
</body></html>`;
}

async function leerJson(r) {
  try { return await r.json(); } catch (_) { return null; }
}

function cabeceras(e, extra) {
  return { apikey: e.service, Authorization: "Bearer " + e.service, "Content-Type": "application/json", ...(extra || {}) };
}

// Reclama la clave en notification_log y envía con Resend. Devuelve:
// "sent" | "already" (ya salió o hay un envío en curso) | "log_unavailable"
// (sin el SQL o sin base: no se envía, para no repetir después) | "no_config" | "error".
export async function enviarCorreoSuscripcion(e, { userId, email, key, msg, refDate }) {
  if (!e || !e.resendKey || !e.url || !e.service || !userId || !email || !key) return "no_config";
  const base = e.url + "/rest/v1/notification_log";
  let logId = null;
  try {
    const ins = await fetch(base, {
      method: "POST",
      headers: cabeceras(e, { Prefer: "resolution=ignore-duplicates,return=representation" }),
      body: JSON.stringify({
        user_id: userId,
        notification_type: TIPO_LOG,
        reference_date: refDate || ymdLima(),
        idempotency_key: key,
        status: "pending",
        attempted_at: new Date().toISOString(),
      }),
    });
    if (!ins.ok) return "log_unavailable";
    const rows = await leerJson(ins);
    logId = Array.isArray(rows) && rows[0] ? rows[0].id : null;
    if (!logId) {
      // La clave ya existía: solo se reintenta un envío que falló.
      const prev = await fetch(base + "?idempotency_key=eq." + encodeURIComponent(key) + "&select=id,status&limit=1", { headers: cabeceras(e) });
      const fila = prev.ok ? ((await leerJson(prev)) || [])[0] : null;
      if (!fila) return "log_unavailable";
      if (fila.status !== "error") return "already";
      logId = fila.id;
    }
  } catch (_) {
    return "log_unavailable";
  }
  const marcar = (patch) => fetch(base + "?id=eq." + encodeURIComponent(logId), {
    method: "PATCH", headers: cabeceras(e), body: JSON.stringify(patch),
  }).catch(() => null);
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + e.resendKey, "Idempotency-Key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ from: e.fromEmail, to: email, subject: msg.subject, html: htmlCorreoSuscripcion(e.appUrl, msg) }),
    });
    if (!r.ok) throw new Error("resend_" + r.status);
    await marcar({ status: "sent", delivered_at: new Date().toISOString() });
    return "sent";
  } catch (err) {
    await marcar({ status: "error", error_message: String((err && err.message) || err).slice(0, 200) });
    return "error";
  }
}
