// Proxy serverless para la API de Anthropic (Vercel).
// La API key vive SOLO aquí (variable de entorno ANTHROPIC_API_KEY en Vercel).
// Nunca se envía al navegador ni se guarda en GitHub.
const ALLOWED_MODELS = ["claude-haiku-4-5-20251001", "claude-sonnet-4-6"];
const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const CONSENT_POLICY_VERSION = "2026-06-15";
const SAFETY_SCREENING_VERSION = "2026-06-15";
const REQUIRED_CONSENTS = ["body_progress", "automated_coach"];
const SERVER_GUARDRAILS = [
  "Actua solo como coach de bienestar y educacion general.",
  "No diagnostiques enfermedades, no prescribas tratamientos y no sustituyas a un profesional de salud.",
  "Ante dolor de pecho, mareo, desmayo, falta de aire inusual, lesion aguda u otra senal de alerta, indica detener la actividad y buscar evaluacion profesional.",
  "Nunca recomiendes ignorar dolor, entrenar sobre una lesion aguda ni cambiar medicacion.",
].join(" ");

// Verifica el token de Supabase (Bearer) contra /auth/v1/user.
// Falla cerrado: sin token válido o sin config de Supabase => no autenticado.
async function verifyUser(req) {
  const auth = req.headers.authorization || req.headers.Authorization || "";
  const token = typeof auth === "string" && auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  const url = process.env.SUPABASE_URL;
  const apikey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !apikey) return null;
  const base = url.replace(/\/$/, "");
  try {
    const r = await fetch(base + "/auth/v1/user", {
      headers: { Authorization: "Bearer " + token, apikey },
    });
    if (!r.ok) return null;
    const u = await r.json();
    if (!u || !u.id) return null;
    // Rechaza usuarios desactivados (profiles.active = false). Lee su propio
    // perfil con su token (RLS permite ver la fila propia).
    const pr = await fetch(base + "/rest/v1/profiles?id=eq." + u.id + "&select=active,prefs", {
      headers: { Authorization: "Bearer " + token, apikey },
    });
    if (!pr.ok) return null;
    const rows = await pr.json();
    if (!Array.isArray(rows) || !rows[0] || rows[0].active === false) return null;
    return { user: u, profile: rows[0], token, base, apikey };
  } catch (e) {
    return null;
  }
}

async function verifyPrivacyAccess(auth) {
  try {
    const age = Number(auth.profile && auth.profile.prefs && auth.profile.prefs.age);
    if (!Number.isFinite(age) || age < 18) return { ok: false, underage: true };
    const headers = { Authorization: "Bearer " + auth.token, apikey: auth.apikey };
    const consentQuery = new URLSearchParams({
      consent_type: "in.(" + REQUIRED_CONSENTS.join(",") + ")",
      policy_version: "eq." + CONSENT_POLICY_VERSION,
      status: "eq.accepted",
      select: "consent_type",
    });
    const consentResponse = await fetch(auth.base + "/rest/v1/user_consents?" + consentQuery.toString(), { headers });
    if (!consentResponse.ok) return { ok: false, setup: consentResponse.status === 404 };
    const consents = await consentResponse.json();
    const accepted = new Set((Array.isArray(consents) ? consents : []).map((row) => row.consent_type));
    if (REQUIRED_CONSENTS.some((type) => !accepted.has(type))) return { ok: false, missingConsent: true };

    const screeningQuery = new URLSearchParams({
      screening_version: "eq." + SAFETY_SCREENING_VERSION,
      select: "age_confirmed,has_red_flags,cleared_for_training",
      limit: "1",
    });
    const screeningResponse = await fetch(auth.base + "/rest/v1/safety_screenings?" + screeningQuery.toString(), { headers });
    if (!screeningResponse.ok) return { ok: false, setup: screeningResponse.status === 404 };
    const screenings = await screeningResponse.json();
    if (!Array.isArray(screenings) || !screenings[0] || screenings[0].age_confirmed !== true) {
      return { ok: false, missingScreening: true };
    }
    return { ok: true, safetyHold: screenings[0].has_red_flags === true || screenings[0].cleared_for_training !== true };
  } catch (_) {
    return { ok: false };
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    res.status(500).json({ error: "Falta ANTHROPIC_API_KEY en el servidor (Vercel → Environment Variables)." });
    return;
  }
  // Requiere sesión válida de Supabase: sin esto no se llama a Anthropic.
  const auth = await verifyUser(req);
  if (!auth) {
    res.status(401).json({ error: "Sesión requerida para usar tu coach." });
    return;
  }
  const privacy = await verifyPrivacyAccess(auth);
  if (!privacy.ok) {
    res.status(403).json({
      error: privacy.setup
        ? "La protección de privacidad todavía no está configurada."
        : "Revisa y acepta la privacidad y seguridad vigentes antes de usar tu coach.",
    });
    return;
  }
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const userText = body.userText;
    if (!userText) {
      res.status(400).json({ error: "Falta 'userText'." });
      return;
    }
    const model = ALLOWED_MODELS.includes(body.model)
      ? body.model
      : (ALLOWED_MODELS.includes(process.env.ANTHROPIC_MODEL) ? process.env.ANTHROPIC_MODEL : DEFAULT_MODEL);
    const maxTokens = Math.min(Math.max(parseInt(body.maxTokens, 10) || 512, 1), 2048);

    const safetyContext = privacy.safetyHold
      ? " La evaluacion del usuario tiene una senal de alerta: no propongas rutinas ni progresiones de ejercicio; limita la respuesta a detener actividad y buscar evaluacion profesional."
      : "";
    const clientSystem = typeof body.system === "string" ? body.system : "";
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: clientSystem + " REGLAS OBLIGATORIAS DEL SERVIDOR: " + SERVER_GUARDRAILS + safetyContext,
        messages: [{ role: "user", content: String(userText) }],
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      res.status(r.status).json({ error: (data && data.error && data.error.message) || ("Error " + r.status) });
      return;
    }
    const text = (data.content && data.content[0] && data.content[0].text) || "";
    res.status(200).json({ text });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
}
