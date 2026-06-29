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
  if (website) errors.push("No se pudo procesar la postulacion.");
  if (name.length < 2) errors.push("Nombre requerido.");
  if (whatsappNormalized.length < 8 || whatsappNormalized.length > 15) errors.push("WhatsApp invalido.");
  if (!ageBand) errors.push("Edad requerida.");
  if (!countryCity) errors.push("Pais o ciudad requerido.");
  if (!ALLOWED_STAGES.has(stage)) errors.push("Estado actual invalido.");
  if (!ALLOWED_GOALS.has(goal)) errors.push("Objetivo invalido.");
  if (!ALLOWED_RECENT.has(recentAttempt)) errors.push("Intento reciente invalido.");
  if (!pains.length) errors.push("Selecciona al menos una friccion.");
  if (story.length < 20) errors.push("Cuéntanos un caso concreto.");
  if (!ALLOWED_INVESTMENTS.has(investment)) errors.push("Inversion actual invalida.");
  if (!ALLOWED_AVAILABILITY.has(availability)) errors.push("Disponibilidad invalida.");
  if (!ALLOWED_HEALTH.has(health)) errors.push("Respuesta de seguridad invalida.");

  return {
    errors,
    data: {
      name,
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
        error: "Falta aplicar la migracion de reclutamiento beta.",
        setup_pending: true,
      });
      return;
    }
    res.status(500).json({ error: (payload && payload.message) || "No se pudo guardar la postulacion." });
    return;
  }

  const row = Array.isArray(payload) ? payload[0] : payload;
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
    res.status(405).json({ error: "Metodo no permitido." });
    return;
  }

  const e = env();
  if (!e.url || !e.service) {
    res.status(500).json({ error: "Falta configuracion server-side." });
    return;
  }

  try {
    await handlePost(req, res, e);
  } catch (error) {
    res.status(500).json({ error: String((error && error.message) || error) });
  }
}
