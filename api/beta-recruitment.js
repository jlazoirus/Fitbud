// REQ-70: Captura publica de candidatos para validacion y beta controlada.
// POST /api/beta-recruitment — guarda postulacion con scoring server-side.

const ALLOWED_STAGES = new Set(["beginner", "returning", "consistent", "advanced"]);
const ALLOWED_RECENT = new Set(["yes", "no"]);
const ALLOWED_INVESTMENTS = new Set(["none", "time", "app", "coach"]);
const ALLOWED_AVAILABILITY = new Set(["interview_beta", "interview", "later"]);
const ALLOWED_HEALTH = new Set(["clear", "caution"]);

const ALLOWED_GOALS = new Set([
  "Bajar grasa",
  "Ganar musculo",
  "Comer mas sano y crear habitos",
  "Volver a entrenar con constancia",
  "Mejorar rendimiento",
]);

const ALLOWED_TOOLS = new Set([
  "App de tracking",
  "Excel o notas",
  "Coach o nutricionista",
  "YouTube o redes",
  "Nada sostenido",
]);

const ALLOWED_PAINS = new Map([
  ["No se que comer o entrenar hoy", "b"],
  ["Me abruma decidir o empezar", "b"],
  ["Tengo miedo a hacer mal los ejercicios", "b"],
  ["Mi plan se rompe cuando como fuera o cambia mi semana", "a"],
  ["Uso demasiadas herramientas", "a"],
  ["Registrar todo me da pereza", "both"],
  ["Abandono despues de 1-3 semanas", "b"],
]);

function env() {
  return {
    url: (process.env.SUPABASE_URL || "").replace(/\/$/, ""),
    service: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  };
}

function serviceHeaders(e, extra) {
  return Object.assign(
    { apikey: e.service, Authorization: "Bearer " + e.service },
    extra || {}
  );
}

async function responseJson(response) {
  return response.json().catch(() => ({}));
}

function clean(value, max = 240) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanArray(values, allowed, maxItems) {
  const seen = new Set();
  const out = [];
  for (const value of Array.isArray(values) ? values : []) {
    const item = clean(value, 120);
    if (allowed.has(item) && !seen.has(item)) {
      seen.add(item);
      out.push(item);
    }
    if (out.length >= maxItems) break;
  }
  return out;
}

function normalizeWhatsapp(value) {
  const raw = clean(value, 40);
  const digits = raw.replace(/\D/g, "");
  return { raw, digits };
}

function scoreCandidate(data) {
  let a = 0;
  let b = 0;
  let priorityPoints = 0;

  if (data.stage === "consistent") a += 2;
  if (data.stage === "advanced") a += 3;
  if (data.stage === "beginner") b += 3;
  if (data.stage === "returning") b += 2;

  if (data.tools.includes("App de tracking")) a += 2;
  if (data.tools.includes("Excel o notas")) a += 2;
  if (data.tools.includes("Coach o nutricionista")) a += 1;
  if (data.tools.includes("Nada sostenido")) b += 2;
  if (data.tools.includes("YouTube o redes")) b += 1;

  for (const pain of data.pains) {
    const type = ALLOWED_PAINS.get(pain);
    if (type === "a") a += 2;
    if (type === "b") b += 2;
    if (type === "both") {
      a += 1;
      b += 1;
    }
  }

  if (data.recentAttempt === "yes") priorityPoints += 2;
  if (data.story.length >= 60) priorityPoints += 2;
  if (data.pains.length >= 2) priorityPoints += 1;
  if (data.availability === "interview_beta") priorityPoints += 2;
  if (data.availability === "interview") priorityPoints += 1;
  if (["time", "app", "coach"].includes(data.investment)) priorityPoints += 1;
  if (data.health === "caution") priorityPoints -= 1;
  if (data.ageBand === "Menos de 18") priorityPoints -= 4;
  if (data.availability === "later") priorityPoints -= 2;

  const segment = a === b
    ? "Exploratorio"
    : (a > b ? "A - Comprometido autonomo" : "B - Principiante guiado");
  const priority = priorityPoints >= 6 ? "Alta" : (priorityPoints >= 3 ? "Media" : "Baja");
  const betaEligible = data.ageBand !== "Menos de 18"
    && data.health === "clear"
    && data.availability === "interview_beta";

  return {
    segment,
    priority,
    priorityScore: priorityPoints,
    betaEligible,
    segmentScores: { a, b },
  };
}

function parsePayload(body) {
  const name = clean(body.name, 90);
  // REQ-225: la invitación llega por correo; se guarda en raw_payload (sin migración).
  const email = clean(body.email, 254).toLowerCase();
  const { raw: whatsapp, digits: whatsappNormalized } = normalizeWhatsapp(body.whatsapp);
  const ageBand = clean(body.age, 20);
  const countryCity = clean(body.city, 120);
  const stage = clean(body.stage, 40);
  const goal = clean(body.goal, 80);
  const recentAttempt = clean(body.recentAttempt, 8);
  const tools = cleanArray(body.tools, ALLOWED_TOOLS, 5);
  const pains = cleanArray(body.pains, new Set(ALLOWED_PAINS.keys()), 3);
  const story = clean(body.story, 1400);
  const investment = clean(body.investment, 40);
  const availability = clean(body.availability, 40);
  const health = clean(body.health, 40);
  const source = clean(body.source || "beta-reclutamiento", 120);
  const website = clean(body.website, 120);

  const errors = [];
  if (website) errors.push("No pudimos procesar tu postulación.");
  if (name.length < 2) errors.push("Escribe tu nombre.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Revisa tu correo: ahí te llegará la invitación.");
  if (whatsappNormalized.length < 8 || whatsappNormalized.length > 15) errors.push("Revisa tu número de WhatsApp: incluye el código de tu país (empieza con +).");
  if (!ageBand) errors.push("Elige tu rango de edad.");
  if (!countryCity) errors.push("Escribe tu país y ciudad.");
  if (!ALLOWED_STAGES.has(stage)) errors.push("Elige qué te describe mejor.");
  if (!ALLOWED_GOALS.has(goal)) errors.push("Elige tu objetivo principal.");
  if (!ALLOWED_RECENT.has(recentAttempt)) errors.push("Cuéntanos si intentaste algo en los últimos 6 meses.");
  if (!pains.length) errors.push("Marca al menos una opción en \"Dónde se rompe\".");
  if (story.length < 20) errors.push("Cuéntanos un poco más sobre la última vez que te pasó (al menos 20 caracteres).");
  if (!ALLOWED_INVESTMENTS.has(investment)) errors.push("Elige cuánto inviertes hoy en resolver esto.");
  if (!ALLOWED_AVAILABILITY.has(availability)) errors.push("Elige tu disponibilidad.");
  if (!ALLOWED_HEALTH.has(health)) errors.push("Responde la pregunta de seguridad.");

  return {
    errors,
    data: {
      name,
      email,
      whatsapp,
      whatsappNormalized,
      ageBand,
      countryCity,
      stage,
      goal,
      recentAttempt,
      tools,
      pains,
      story,
      investment,
      availability,
      health,
      source,
    },
  };
}

// ── Aviso al admin por correo (REQ-226) ───────────────────────────────────────
// Reusa la conexión de Resend de los recordatorios (api/notify.js): RESEND_API_KEY
// y NOTIFY_FROM_EMAIL. Destinatarios: BETA_NOTIFY_EMAIL (coma-separados) o, si no
// está, los correos de los perfiles admin activos. Nunca bloquea la postulación:
// cualquier fallo se ignora y la persona ve su confirmación igual.

const NOTIFY_TIMEOUT_MS = 4000;

function escHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function adminRecipients(e) {
  const configured = String(process.env.BETA_NOTIFY_EMAIL || "").split(",").map((v) => v.trim()).filter(Boolean);
  if (configured.length) return configured;
  const r = await fetch(e.url + "/rest/v1/profiles?is_admin=eq.true&active=eq.true&select=email", { headers: serviceHeaders(e) });
  const rows = await responseJson(r);
  return r.ok && Array.isArray(rows) ? rows.map((row) => String(row.email || "").trim()).filter(Boolean) : [];
}

const STAGE_LABELS = { beginner: "Quiere empezar", returning: "Está retomando", consistent: "Con cierta constancia", advanced: "Entrena en serio" };
const AVAILABILITY_LABELS = { interview_beta: "Llamada y beta de 3 meses", interview: "Solo la llamada", later: "Más adelante" };

export function newApplicantEmail(data, score, appUrl) {
  const pains = (data.pains || []).join(" · ");
  const rows = [
    ["Correo", data.email], ["WhatsApp", data.whatsapp], ["Edad", data.ageBand], ["País / ciudad", data.countryCity],
    ["Objetivo", data.goal], ["Momento", STAGE_LABELS[data.stage] || data.stage], ["Disponibilidad", AVAILABILITY_LABELS[data.availability] || data.availability],
    ["Dónde se rompe", pains], ["Prioridad sugerida", score.priority + " · " + score.segment],
  ];
  const caution = data.health === "caution"
    ? '<p style="background:#fff7e6;border-radius:8px;padding:10px 12px;margin:0 0 16px">Marcó lesión o indicación médica: conviene la llamada antes de darle el entrenamiento.</p>' : "";
  const link = appUrl.replace(/\/$/, "") + "/?ver=postulantes";
  return {
    subject: "Nueva postulación a la beta: " + data.name,
    html: `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nueva postulación</title></head>
<body style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1a1a;background:#fff">
  <p style="font-size:18px;font-weight:700;margin:0 0 6px">${escHtml(data.name)} postuló a la beta</p>
  <p style="color:#555;margin:0 0 18px">Revísala y apruébala o descártala desde la app.</p>
  ${caution}
  <table style="border-collapse:collapse;width:100%;font-size:14px;margin:0 0 16px">${rows.map(([k, v]) => `<tr><td style="padding:6px 8px 6px 0;color:#666;vertical-align:top;white-space:nowrap">${escHtml(k)}</td><td style="padding:6px 0">${escHtml(v)}</td></tr>`).join("")}</table>
  <p style="font-size:14px;color:#333;margin:0 0 22px;white-space:pre-wrap"><b>Su historia:</b> ${escHtml(data.story)}</p>
  <a href="${escHtml(link)}" style="display:inline-block;background:#101010;color:#d6ff3a;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:999px">Revisar postulaciones</a>
</body></html>`,
  };
}

async function notifyAdmins(e, data, score, row) {
  const key = process.env.RESEND_API_KEY || "";
  if (!key) return "sin_resend";
  // Solo postulaciones nuevas: una re-postulación con el mismo WhatsApp actualiza la fila y no avisa otra vez.
  if (row && row.created_at && row.updated_at && Math.abs(Date.parse(row.updated_at) - Date.parse(row.created_at)) > 5000) return "repetida";
  const to = await adminRecipients(e);
  if (!to.length) return "sin_destinatarios";
  const mail = newApplicantEmail(data, score, process.env.NOTIFY_APP_URL || "https://evolvapp.club");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NOTIFY_TIMEOUT_MS);
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.NOTIFY_FROM_EMAIL || "recordatorios@fitbros.app", to, subject: mail.subject, html: mail.html, reply_to: data.email || undefined }),
      signal: controller.signal,
    });
    return r.ok ? "enviado" : "error_resend_" + r.status;
  } finally {
    clearTimeout(timer);
  }
}

async function handlePost(req, res, e) {
  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  } catch (_) {
    res.status(400).json({ error: "Cuerpo invalido." });
    return;
  }

  const { errors, data } = parsePayload(body);
  if (errors.length) {
    res.status(400).json({ error: errors[0], errors });
    return;
  }

  const score = scoreCandidate(data);
  const record = {
    source: data.source,
    name: data.name,
    whatsapp: data.whatsapp,
    whatsapp_normalized: data.whatsappNormalized,
    age_band: data.ageBand,
    country_city: data.countryCity,
    stage: data.stage,
    goal: data.goal,
    recent_attempt: data.recentAttempt === "yes",
    tools: data.tools,
    pains: data.pains,
    story: data.story,
    investment: data.investment,
    availability: data.availability,
    health: data.health,
    segment: score.segment,
    priority: score.priority,
    priority_score: score.priorityScore,
    segment_scores: score.segmentScores,
    beta_eligible: score.betaEligible,
    raw_payload: {
      email: data.email,
      goal: data.goal,
      stage: data.stage,
      recentAttempt: data.recentAttempt,
      submittedAt: new Date().toISOString(),
    },
    updated_at: new Date().toISOString(),
  };

  const url = e.url
    + "/rest/v1/beta_recruitment_submissions"
    + "?on_conflict=whatsapp_normalized"
    + "&select=id,created_at,updated_at,segment,priority,priority_score,beta_eligible,status";

  const response = await fetch(url, {
    method: "POST",
    headers: serviceHeaders(e, {
      "content-type": "application/json",
      prefer: "resolution=merge-duplicates,return=representation",
    }),
    body: JSON.stringify(record),
  });

  const payload = await responseJson(response);
  if (!response.ok) {
    if (response.status === 404 || String(payload && payload.code) === "42P01") {
      res.status(503).json({
        error: "Las postulaciones no están disponibles en este momento. Intenta más tarde.",
        setup_pending: true,
      });
      return;
    }
    res.status(500).json({ error: "No pudimos guardar tu postulación. Intenta de nuevo en unos minutos." });
    return;
  }

  const row = Array.isArray(payload) ? payload[0] : payload;
  try { await notifyAdmins(e, data, score, row); } catch (_) { /* el aviso nunca bloquea la postulación */ }
  res.status(200).json({
    ok: true,
    submission: {
      id: row && row.id,
      segment: score.segment,
      priority: score.priority,
      priorityScore: score.priorityScore,
      betaEligible: score.betaEligible,
      status: row && row.status ? row.status : "new",
    },
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido." });
    return;
  }

  const e = env();
  if (!e.url || !e.service) {
    res.status(500).json({ error: "Las postulaciones no están disponibles en este momento. Intenta más tarde." });
    return;
  }

  try {
    await handlePost(req, res, e);
  } catch (error) {
    res.status(500).json({ error: "No pudimos guardar tu postulación. Intenta de nuevo en unos minutos." });
  }
}
