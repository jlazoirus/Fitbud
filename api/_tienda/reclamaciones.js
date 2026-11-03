// REQ-332: Libro de Reclamaciones virtual integrado en la web.
// POST /api/reclamaciones (reescrita a /api/checkout?op=reclamaciones) — pública. Guarda la hoja con número correlativo,
// devuelve la hoja emitida (el consumidor la ve, imprime o guarda) y envía la
// copia por correo al consumidor (si dejó correo) y el aviso al comercio.
// Vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, NOTIFY_FROM_EMAIL,
//       RECLAMOS_NOTIFY_EMAIL (opcional; si falta, avisa a los admins activos).
// Tabla: supabase/tienda_culqi.sql (libro_reclamaciones).

import { COMERCIO } from "../../tienda/comercio.js";

const TIPOS = new Set(["reclamo", "queja"]);
const DOCUMENTOS = new Set(["DNI", "CE", "Pasaporte", "RUC"]);
const BIENES = new Set(["servicio", "producto"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAIL_TIMEOUT_MS = 4000;

function env() {
  return {
    url: (process.env.SUPABASE_URL || "").replace(/\/$/, ""),
    service: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  };
}

function serviceHeaders(e, extra) {
  return Object.assign({ apikey: e.service, Authorization: "Bearer " + e.service }, extra || {});
}

function clean(value, max) {
  return String(value == null ? "" : value).replace(/\s+/g, " ").trim().slice(0, max || 240);
}

function cleanLong(value, max) {
  return String(value == null ? "" : value).replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim().slice(0, max || 3000);
}

// Valida la hoja. Los mensajes van tal cual a la persona y nombran el campo.
export function parseHoja(body) {
  const b = body && typeof body === "object" ? body : {};
  const data = {
    tipo: clean(b.tipo, 20).toLowerCase(),
    nombre: clean(b.nombre, 160),
    tipoDocumento: clean(b.tipoDocumento, 20),
    numeroDocumento: clean(b.numeroDocumento, 20).replace(/\s/g, ""),
    domicilio: clean(b.domicilio, 240),
    telefono: clean(b.telefono, 30),
    email: clean(b.email, 160).toLowerCase(),
    menorEdad: b.menorEdad === true || b.menorEdad === "si",
    apoderado: clean(b.apoderado, 160),
    bienTipo: clean(b.bienTipo || "servicio", 20).toLowerCase(),
    bienDescripcion: clean(b.bienDescripcion, 300),
    montoReclamado: null,
    detalle: cleanLong(b.detalle, 3000),
    pedido: cleanLong(b.pedido, 1500),
    website: clean(b.website, 80),
  };
  const monto = String(b.montoReclamado == null ? "" : b.montoReclamado).replace(",", ".").trim();
  const errors = [];
  if (!data.nombre) errors.push("Escribe tu nombre completo.");
  if (!DOCUMENTOS.has(data.tipoDocumento)) errors.push("Elige el tipo de documento.");
  if (!/^[A-Za-z0-9-]{6,20}$/.test(data.numeroDocumento)) errors.push("Revisa el número de documento.");
  if (data.email && !EMAIL_RE.test(data.email)) errors.push("Revisa el correo.");
  if (!data.email && !data.telefono && !data.domicilio) {
    errors.push("Déjanos al menos un medio para responderte: correo, teléfono o domicilio.");
  }
  if (data.menorEdad && !data.apoderado) errors.push("Si eres menor de edad, escribe el nombre de tu padre, madre o apoderado.");
  if (!BIENES.has(data.bienTipo)) errors.push("Elige si es un producto o un servicio.");
  if (!data.bienDescripcion) errors.push("Describe el producto o servicio contratado.");
  if (monto) {
    const n = Number(monto);
    if (!Number.isFinite(n) || n < 0 || n > 100000) errors.push("Revisa el monto reclamado.");
    else data.montoReclamado = Math.round(n * 100) / 100;
  }
  if (!TIPOS.has(data.tipo)) errors.push("Elige si es un reclamo o una queja.");
  if (data.detalle.length < 10) errors.push("Cuéntanos el detalle de tu reclamo o queja.");
  if (data.pedido.length < 3) errors.push("Escribe tu pedido: qué esperas que hagamos.");
  return { errors, data };
}

function escHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function fechaLima(iso) {
  return new Date(iso).toLocaleString("es-PE", { timeZone: "America/Lima", dateStyle: "long", timeStyle: "short" });
}

export function hojaRows(row) {
  return [
    ["Hoja N.°", row.codigo],
    ["Fecha", fechaLima(row.created_at)],
    ["Proveedor", COMERCIO.razonSocial + " · RUC " + COMERCIO.ruc],
    ["Domicilio del proveedor", COMERCIO.direccion],
    ["Consumidor", row.nombre],
    ["Documento", row.tipo_documento + " " + row.numero_documento],
    ["Domicilio", row.domicilio || "—"],
    ["Teléfono", row.telefono || "—"],
    ["Correo", row.email || "—"],
    ...(row.menor_edad ? [["Padre, madre o apoderado", row.apoderado]] : []),
    ["Bien contratado", (row.bien_tipo === "producto" ? "Producto" : "Servicio") + ": " + row.bien_descripcion],
    ["Monto reclamado", row.monto_reclamado == null ? "—" : "S/ " + Number(row.monto_reclamado).toFixed(2)],
    ["Tipo", row.tipo === "queja" ? "Queja" : "Reclamo"],
    ["Detalle", row.detalle],
    ["Pedido", row.pedido],
  ];
}

export function hojaEmail(row, paraComercio) {
  const titulo = paraComercio
    ? "Nueva hoja " + row.codigo + " en el Libro de Reclamaciones"
    : "Copia de tu hoja de reclamación " + row.codigo;
  const intro = paraComercio
    ? "Hay que responder en un plazo máximo de 15 días hábiles por el medio que indicó la persona."
    : "Recibimos tu " + (row.tipo === "queja" ? "queja" : "reclamo") + ". Te responderemos en un plazo máximo de 15 días hábiles.";
  return {
    subject: titulo,
    html: `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escHtml(titulo)}</title></head>
<body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a;background:#fff">
  <p style="font-size:18px;font-weight:700;margin:0 0 6px">${escHtml(titulo)}</p>
  <p style="color:#555;margin:0 0 18px">${escHtml(intro)}</p>
  <table style="border-collapse:collapse;width:100%;font-size:14px;margin:0 0 16px">${hojaRows(row).map(([k, v]) => `<tr><td style="padding:6px 10px 6px 0;color:#666;vertical-align:top;white-space:nowrap">${escHtml(k)}</td><td style="padding:6px 0;white-space:pre-wrap">${escHtml(v)}</td></tr>`).join("")}</table>
  <p style="font-size:12px;color:#666;margin:0">La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI. Reclamo: disconformidad relacionada a los productos o servicios. Queja: disconformidad no relacionada a los productos o servicios, o malestar o descontento respecto a la atención al público.</p>
</body></html>`,
  };
}

async function recipients(e) {
  const configured = String(process.env.RECLAMOS_NOTIFY_EMAIL || "").split(",").map((v) => v.trim()).filter(Boolean);
  if (configured.length) return configured;
  const r = await fetch(e.url + "/rest/v1/profiles?is_admin=eq.true&active=eq.true&select=email", { headers: serviceHeaders(e) });
  const rows = await r.json().catch(() => []);
  return r.ok && Array.isArray(rows) ? rows.map((row) => String(row.email || "").trim()).filter(Boolean) : [];
}

async function sendMail(to, mail, replyTo) {
  const key = process.env.RESEND_API_KEY || "";
  if (!key || !to || (Array.isArray(to) && !to.length)) return "sin_envio";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MAIL_TIMEOUT_MS);
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.NOTIFY_FROM_EMAIL || "recordatorios@fitbros.app", to, subject: mail.subject, html: mail.html, reply_to: replyTo || undefined }),
      signal: controller.signal,
    });
    return r.ok ? "enviado" : "error_" + r.status;
  } catch (_) {
    return "error_red";
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido." });
    return;
  }
  const e = env();
  if (!e.url || !e.service) {
    res.status(503).json({ error: "El Libro de Reclamaciones no está disponible en este momento. Escríbenos a " + COMERCIO.correo + "." });
    return;
  }
  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  } catch (_) {
    res.status(400).json({ error: "No pudimos leer el formulario. Intenta de nuevo." });
    return;
  }
  const { errors, data } = parseHoja(body);
  // Campo trampa para bots: una persona nunca lo llena.
  if (data.website) {
    res.status(400).json({ error: "No pudimos registrar la hoja. Intenta de nuevo." });
    return;
  }
  if (errors.length) {
    res.status(400).json({ error: errors[0], errors });
    return;
  }

  const record = {
    tipo: data.tipo,
    nombre: data.nombre,
    tipo_documento: data.tipoDocumento,
    numero_documento: data.numeroDocumento,
    domicilio: data.domicilio || null,
    telefono: data.telefono || null,
    email: data.email || null,
    menor_edad: data.menorEdad,
    apoderado: data.menorEdad ? data.apoderado : null,
    bien_tipo: data.bienTipo,
    bien_descripcion: data.bienDescripcion,
    monto_reclamado: data.montoReclamado,
    detalle: data.detalle,
    pedido: data.pedido,
  };

  let row;
  try {
    const r = await fetch(e.url + "/rest/v1/libro_reclamaciones", {
      method: "POST",
      headers: serviceHeaders(e, { "content-type": "application/json", prefer: "return=representation" }),
      body: JSON.stringify(record),
    });
    const payload = await r.json().catch(() => null);
    if (!r.ok) {
      console.error("reclamaciones: insert rechazado", r.status, payload && (payload.message || payload.code));
      res.status(503).json({ error: "No pudimos registrar la hoja. Intenta de nuevo en unos minutos o escríbenos a " + COMERCIO.correo + "." });
      return;
    }
    row = Array.isArray(payload) ? payload[0] : payload;
  } catch (_) {
    res.status(503).json({ error: "No pudimos registrar la hoja. Intenta de nuevo en unos minutos o escríbenos a " + COMERCIO.correo + "." });
    return;
  }

  // Los correos nunca bloquean la hoja: ya quedó registrada y la persona la ve en pantalla.
  let copia = "sin_correo";
  try {
    if (row.email) copia = await sendMail(row.email, hojaEmail(row, false));
    await sendMail(await recipients(e), hojaEmail(row, true), row.email);
    await fetch(e.url + "/rest/v1/libro_reclamaciones?id=eq." + encodeURIComponent(row.id), {
      method: "PATCH",
      headers: serviceHeaders(e, { "content-type": "application/json" }),
      body: JSON.stringify({ copia_enviada: copia }),
    });
  } catch (_) { /* aviso best-effort */ }

  res.status(201).json({
    ok: true,
    hoja: { codigo: row.codigo, numero: row.numero, fecha: fechaLima(row.created_at), filas: hojaRows(row), copiaEnviada: copia === "enviado" },
  });
}
