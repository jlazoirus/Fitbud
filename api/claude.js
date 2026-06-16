// Proxy serverless del coach (Vercel).
// La credencial del proveedor y la service role viven exclusivamente aqui.
const ALLOWED_MODELS = ["claude-haiku-4-5-20251001", "claude-sonnet-4-6"];
const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const PROMPT_VERSION = "v1";
// Costo estimado por token en USD (precios de agosto 2025).
const MODEL_COSTS = {
  "claude-haiku-4-5-20251001": { input: 0.0000008, output: 0.000004 },
  "claude-sonnet-4-6":         { input: 0.000003,  output: 0.000015 },
};
const CONSENT_POLICY_VERSION = "2026-06-15-v2";
const SAFETY_SCREENING_VERSION = "2026-06-15";
const REQUIRED_CONSENTS = ["body_progress", "automated_coach"];
const ALLOWED_ACTIONS = new Set([
  "diet_day",
  "diet_week",
  "meal_option",
  "meal_estimate",
  "macro_review",
  "training_plan",
  "training_replacement",
]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_KEY_RE = /^[a-zA-Z0-9._:-]{1,160}$/;
const SERVER_GUARDRAILS = [
  "Actua solo como coach de bienestar y educacion general.",
  "No diagnostiques enfermedades, no prescribas tratamientos y no sustituyas a un profesional de salud.",
  "Ante dolor de pecho, mareo, desmayo, falta de aire inusual, lesion aguda u otra senal de alerta, indica detener la actividad y buscar evaluacion profesional.",
  "Nunca recomiendes ignorar dolor, entrenar sobre una lesion aguda ni cambiar medicacion.",
].join(" ");

function env() {
  return {
    url: (process.env.SUPABASE_URL || "").replace(/\/$/, ""),
    anon: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "",
    service: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    providerKey: process.env.ANTHROPIC_API_KEY || "",
  };
}

function serviceHeaders(e, extra) {
  return Object.assign({
    apikey: e.service,
    Authorization: "Bearer " + e.service,
  }, extra || {});
}

async function responseJson(response) {
  return response.json().catch(() => ({}));
}

function apiError(data, fallback) {
  return (data && (data.msg || data.message || data.error_description || data.error)) || fallback;
}

async function rpc(e, name, payload) {
  const response = await fetch(e.url + "/rest/v1/rpc/" + name, {
    method: "POST",
    headers: serviceHeaders(e, { "content-type": "application/json" }),
    body: JSON.stringify(payload || {}),
  });
  const data = await responseJson(response);
  if (!response.ok) {
    const error = new Error(apiError(data, "No se pudo completar " + name + "."));
    error.status = response.status;
    error.code = data && data.code;
    throw error;
  }
  return data;
}

// Verifica el JWT y carga el perfil real. Falla cerrado.
async function verifyUser(req, e) {
  const auth = req.headers.authorization || req.headers.Authorization || "";
  const token = typeof auth === "string" && auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || !e.url || !e.anon) return null;
  try {
    const response = await fetch(e.url + "/auth/v1/user", {
      headers: { Authorization: "Bearer " + token, apikey: e.anon },
    });
    if (!response.ok) return null;
    const user = await responseJson(response);
    if (!user || !user.id) return null;
    const profileResponse = await fetch(
      e.url + "/rest/v1/profiles?id=eq." + encodeURIComponent(user.id) + "&select=active,is_admin,prefs",
      { headers: { Authorization: "Bearer " + token, apikey: e.anon } }
    );
    if (!profileResponse.ok) return null;
    const rows = await responseJson(profileResponse);
    if (!Array.isArray(rows) || !rows[0] || rows[0].active === false) return null;
    return { user, profile: rows[0], token, base: e.url, apikey: e.anon };
  } catch (_) {
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
    const consents = await responseJson(consentResponse);
    const accepted = new Set((Array.isArray(consents) ? consents : []).map((row) => row.consent_type));
    if (REQUIRED_CONSENTS.some((type) => !accepted.has(type))) return { ok: false, missingConsent: true };

    const screeningQuery = new URLSearchParams({
      screening_version: "eq." + SAFETY_SCREENING_VERSION,
      select: "age_confirmed,has_red_flags,cleared_for_training",
      limit: "1",
    });
    const screeningResponse = await fetch(auth.base + "/rest/v1/safety_screenings?" + screeningQuery.toString(), { headers });
    if (!screeningResponse.ok) return { ok: false, setup: screeningResponse.status === 404 };
    const screenings = await responseJson(screeningResponse);
    if (!Array.isArray(screenings) || !screenings[0] || screenings[0].age_confirmed !== true) {
      return { ok: false, missingScreening: true };
    }
    return { ok: true, safetyHold: screenings[0].has_red_flags === true || screenings[0].cleared_for_training !== true };
  } catch (_) {
    return { ok: false };
  }
}

async function verifyEntitlement(auth, e) {
  if (auth.profile.is_admin) return { ok: true };
  try {
    const now = new Date().toISOString();
    const r = await fetch(
      e.url + "/rest/v1/user_entitlements?user_id=eq." + auth.user.id
        + "&status=in.(active,courtesy)&expires_at=gt." + now + "&limit=1&select=id,status",
      { headers: serviceHeaders(e) }
    );
    if (!r.ok) {
      // Tabla inexistente (setup pendiente) → no bloquear
      if (r.status === 404) return { ok: true };
      return { ok: false, expired: true };
    }
    const rows = await r.json().catch(() => []);
    if (Array.isArray(rows) && rows.length) return { ok: true };
    return { ok: false, expired: true };
  } catch (_) {
    return { ok: true }; // error de red → no bloquear
  }
}

function bodyObject(req) {
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  return req.body && typeof req.body === "object" ? req.body : {};
}

function quotaInput(body) {
  const quota = body.quota && typeof body.quota === "object" ? body.quota : {};
  const action = String(quota.action || "");
  const requestId = String(quota.requestId || "");
  const partKey = String(quota.partKey || "main");
  const contextKey = String(quota.contextKey || "");
  const fallbackText = typeof quota.fallbackText === "string" ? quota.fallbackText : "";
  const validation = quota.validation && typeof quota.validation === "object" ? quota.validation : {};
  if (!ALLOWED_ACTIONS.has(action)) throw new Error("Accion de coach no permitida.");
  if (!UUID_RE.test(requestId)) throw new Error("requestId invalido.");
  if (!SAFE_KEY_RE.test(partKey)) throw new Error("partKey invalido.");
  if (!SAFE_KEY_RE.test(contextKey)) throw new Error("contextKey invalido.");
  if (fallbackText.length > 120000) throw new Error("Fallback demasiado grande.");
  return { action, requestId, partKey, contextKey, fallbackText, validation };
}

function parseJsonText(text) {
  let value = String(text || "").trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  if (start >= 0 && end >= start) value = value.slice(start, end + 1);
  return JSON.parse(value);
}

function finiteNumber(value) {
  return Number.isFinite(Number(value));
}

function restrictedTerms(validation) {
  const terms = Array.isArray(validation.hardRestrictions) ? validation.hardRestrictions : [];
  return terms.map((term) => String(term || "").trim().toLowerCase()).filter(Boolean);
}

function containsRestriction(value, validation) {
  const haystack = String(value || "").toLowerCase();
  return restrictedTerms(validation).some((term) => haystack.includes(term));
}

function validateDietDay(data, validation) {
  const meals = data && Array.isArray(data.comidas) ? data.comidas : [];
  const expected = Math.max(1, Number(validation.expectedMeals) || 0);
  const slots = new Set(Array.isArray(validation.slots) ? validation.slots.map(String) : []);
  if (!meals.length || (expected && meals.length !== expected)) return false;
  let kcal = 0;
  let protein = 0;
  for (const meal of meals) {
    const name = String((meal && (meal.nombre || meal.name)) || "");
    const slot = String((meal && (meal.slot_id || meal.slot)) || "");
    const ingredients = meal && Array.isArray(meal.ingredientes) ? meal.ingredientes : [];
    if (!name || !ingredients.length || (slots.size && !slots.has(slot))) return false;
    if (ingredients.some((item) => !String(item && (item.nombre || item.name) || "").trim()
      || !(Number(item && (item.gramos != null ? item.gramos : item.grams)) > 0))) return false;
    if (containsRestriction(name + " " + ingredients.map((item) => item.nombre || item.name || "").join(" "), validation)) return false;
    if (![meal.kcal, meal.proteina_g, meal.carbohidratos_g, meal.grasa_g].every(finiteNumber)) return false;
    kcal += Number(meal.kcal);
    protein += Number(meal.proteina_g);
  }
  const target = validation.target && typeof validation.target === "object" ? validation.target : {};
  if (Number(target.kcal) > 0 && Math.abs(kcal - Number(target.kcal)) > Number(target.kcal) * 0.15) return false;
  if (Number(target.p) > 0 && protein < Number(target.p) * 0.85) return false;
  return true;
}

function validateMealOptions(data, validation) {
  const options = data && Array.isArray(data.opciones) ? data.opciones : [];
  if (!options.length || options.length > 5) return false;
  const maxKcal = Number(validation.maxKcal) || 0;
  return options.every((option) => {
    const name = String((option && (option.nombre || option.name)) || "");
    return !!name
      && !containsRestriction(name, validation)
      && [option.kcal, option.proteina_g, option.carbohidratos_g, option.grasa_g].every(finiteNumber)
      && (!maxKcal || Number(option.kcal) <= maxKcal * 1.15);
  });
}

function collectExerciseIds(value, output) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectExerciseIds(item, output));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if ((key === "exercise_id" || key === "exerciseId") && typeof child === "string") output.push(child);
    collectExerciseIds(child, output);
  }
}

function trainingPhaseRanges(phase) {
  return {
    base: { sets: [2, 4], rpe: [5, 7] },
    progression: { sets: [3, 5], rpe: [6, 8] },
    deload: { sets: [1, 3], rpe: [4, 6] },
    build: { sets: [3, 5], rpe: [6, 9] },
    consolidation: { sets: [2, 4], rpe: [5, 7] },
  }[phase] || null;
}

function validateTrainingPlanWeek(data, validation) {
  const expected = Array.isArray(validation.expectedSessions) ? validation.expectedSessions : [];
  const sessions = data && Array.isArray(data.sessions) ? data.sessions : [];
  const phase = String(validation.expectedPhase || "");
  const ranges = trainingPhaseRanges(phase);
  const allowed = new Set(Array.isArray(validation.allowedExerciseIds) ? validation.allowedExerciseIds.map(String) : []);
  const expectedByDate = new Map(expected.map((item) => [String(item.date || ""), item]));
  const seen = new Set();
  if (!ranges || Number(data && data.week) !== Number(validation.expectedWeek)) return false;
  if (String(data && data.phase || "") !== phase || sessions.length !== expected.length) return false;
  if (containsRestriction(JSON.stringify(data), validation)) return false;
  for (const session of sessions) {
    const date = String(session && session.date || "");
    const spec = expectedByDate.get(date);
    if (!spec || seen.has(date)) return false;
    seen.add(date);
    const type = String(session.type || "");
    const role = String(session.role || "");
    const location = String(session.location || "");
    const duration = Number(session.duration_minutes);
    if (type !== spec.type || role !== spec.role || location !== spec.location) return false;
    if (Number(session.weekday) !== Number(spec.weekday)) return false;
    if (!["strength", "running", "cycling", "swimming"].includes(type)) return false;
    if (!String(session.name || "").trim() || !String(session.objective || "").trim() || !String(session.intensity || "").trim()) return false;
    if (!Number.isFinite(duration) || duration < 20 || duration > Number(validation.sessionMinutes || 60)) return false;
    const exercises = Array.isArray(session.exercises) ? session.exercises : [];
    const blocks = Array.isArray(session.blocks) ? session.blocks : [];
    if (type === "strength") {
      if (exercises.length < 2 || exercises.length > 8 || blocks.length) return false;
    } else if (exercises.length !== 1 || blocks.length < 3
      || String(blocks[0] && blocks[0].phase) !== "warmup"
      || String(blocks[blocks.length - 1] && blocks[blocks.length - 1].phase) !== "cooldown") {
      return false;
    }
    for (const exercise of exercises) {
      const id = String(exercise && (exercise.exercise_id || exercise.exerciseId) || "");
      const sets = Number(exercise && exercise.sets);
      const rest = Number(exercise && (exercise.rest_seconds != null ? exercise.rest_seconds : exercise.restSeconds));
      const rpe = Number(exercise && (exercise.target_rpe != null ? exercise.target_rpe : exercise.targetRpe));
      const rir = Number(exercise && (exercise.target_rir != null ? exercise.target_rir : exercise.targetRir));
      if (!id || (allowed.size && !allowed.has(id)) || !String(exercise && exercise.reps || "").trim()) return false;
      if (!Number.isInteger(sets) || sets < ranges.sets[0] || sets > ranges.sets[1]) return false;
      if (!Number.isFinite(rest) || rest < 20 || rest > 300) return false;
      if (!Number.isFinite(rpe) || rpe < ranges.rpe[0] || rpe > ranges.rpe[1]) return false;
      if (!Number.isFinite(rir) || rir < 0 || rir > 5) return false;
    }
    for (const block of blocks) {
      const blockPhase = String(block && block.phase || "");
      const seconds = Number(block && (block.duration_seconds != null ? block.duration_seconds : block.durationSeconds));
      if (!["warmup", "main", "recovery", "cooldown"].includes(blockPhase)) return false;
      if (!String(block && block.label || "").trim() || !String(block && block.target || "").trim()
        || !String(block && block.intensity || "").trim()) return false;
      if (!Number.isFinite(seconds) || seconds < 15 || seconds > 7200) return false;
    }
    if (type === "strength") {
      const estimatedSeconds = exercises.reduce((sum, exercise) => {
        const sets = Number(exercise && exercise.sets) || 0;
        const rest = Number(exercise && (exercise.rest_seconds != null ? exercise.rest_seconds : exercise.restSeconds)) || 0;
        return sum + sets * (rest + 45);
      }, 600);
      if (estimatedSeconds > duration * 60 * 1.25) return false;
    } else {
      const blockSeconds = blocks.reduce((sum, block) =>
        sum + (Number(block && (block.duration_seconds != null ? block.duration_seconds : block.durationSeconds)) || 0), 0);
      if (blockSeconds > duration * 60 * 1.1 || blockSeconds < duration * 60 * 0.45) return false;
    }
  }
  if (seen.size !== expected.length) return false;
  return true;
}

function validateTraining(data, validation) {
  if (!data || typeof data !== "object") return false;
  if (validation && validation.schema === "training_plan_week_v1") {
    return validateTrainingPlanWeek(data, validation);
  }
  const allowed = new Set(Array.isArray(validation.allowedExerciseIds) ? validation.allowedExerciseIds.map(String) : []);
  const ids = [];
  collectExerciseIds(data, ids);
  if (allowed.size && ids.some((id) => !allowed.has(id))) return false;
  const text = JSON.stringify(data);
  return !containsRestriction(text, validation);
}

function validateCoachOutput(action, text, validation) {
  let data;
  try {
    data = parseJsonText(text);
  } catch (_) {
    return false;
  }
  if (action === "diet_day" || action === "diet_week") return validateDietDay(data, validation);
  if (action === "meal_option") return validateMealOptions(data, validation);
  if (action === "meal_estimate") {
    return [data.kcal, data.proteina_g, data.carbohidratos_g, data.grasa_g].every(finiteNumber);
  }
  if (action === "macro_review") {
    return typeof data.evaluacion === "string" && typeof data.sugerencia === "string";
  }
  return validateTraining(data, validation);
}

function firstRow(data) {
  return Array.isArray(data) ? data[0] : data;
}

function estimateCostUsd(model, inputTokens, outputTokens) {
  const costs = MODEL_COSTS[model] || MODEL_COSTS[DEFAULT_MODEL];
  return Math.round((costs.input * (inputTokens || 0) + costs.output * (outputTokens || 0)) * 1e6) / 1e6;
}

async function claimPart(e, usageId, partKey) {
  return firstRow(await rpc(e, "claim_coach_generation_part", {
    p_usage_id: usageId,
    p_part_key: partKey,
  }));
}

async function waitForPart(e, usageId, partKey) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const part = await claimPart(e, usageId, partKey);
    if (part && part.part_status !== "processing") return part;
  }
  return null;
}

async function failPart(e, usageId, partKey, code, metrics) {
  try {
    await rpc(e, "fail_coach_generation_part", {
      p_usage_id: usageId,
      p_part_key: partKey,
      p_error_code: String(code || "generation_failed").slice(0, 120),
      p_provider_called: !!metrics,
      p_input_tokens: Number(metrics && metrics.inputTokens) || 0,
      p_output_tokens: Number(metrics && metrics.outputTokens) || 0,
      p_latency_ms: Number(metrics && metrics.latencyMs) || null,
    });
  } catch (_) {
    // El error original es mas importante que un fallo al registrar la devolucion.
  }
}

async function providerResponse(e, body, privacy) {
  if (!e.providerKey) {
    const error = new Error("El servicio del coach no esta configurado.");
    error.status = 503;
    throw error;
  }
  const model = ALLOWED_MODELS.includes(body.model)
    ? body.model
    : (ALLOWED_MODELS.includes(process.env.ANTHROPIC_MODEL) ? process.env.ANTHROPIC_MODEL : DEFAULT_MODEL);
  const maxTokens = Math.min(Math.max(parseInt(body.maxTokens, 10) || 512, 1), 2048);
  const safetyContext = privacy.safetyHold
    ? " La evaluacion del usuario tiene una senal de alerta: no propongas rutinas ni progresiones de ejercicio; limita la respuesta a detener actividad y buscar evaluacion profesional."
    : "";
  const clientSystem = typeof body.system === "string" ? body.system : "";
  const callStart = Date.now();
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": e.providerKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: clientSystem + " REGLAS OBLIGATORIAS DEL SERVIDOR: " + SERVER_GUARDRAILS + safetyContext,
      messages: [{ role: "user", content: String(body.userText || "") }],
    }),
  });
  const latencyMs = Date.now() - callStart;
  const data = await responseJson(response);
  if (!response.ok) {
    const error = new Error(apiError(data, "Error " + response.status));
    error.status = response.status;
    throw error;
  }
  return {
    text: (data.content && data.content[0] && data.content[0].text) || "",
    inputTokens: Number(data.usage && data.usage.input_tokens) || 0,
    outputTokens: Number(data.usage && data.usage.output_tokens) || 0,
    model,
    latencyMs,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Metodo no permitido" });
    return;
  }
  const e = env();
  if (!e.url || !e.anon || !e.service) {
    res.status(500).json({ error: "Falta configuracion server-side del coach." });
    return;
  }
  const auth = await verifyUser(req, e);
  if (!auth) {
    res.status(401).json({ error: "Sesion requerida para usar tu coach." });
    return;
  }
  const privacy = await verifyPrivacyAccess(auth);
  if (!privacy.ok) {
    res.status(403).json({
      error: privacy.setup
        ? "La proteccion de privacidad todavia no esta configurada."
        : "Revisa y acepta la privacidad y seguridad vigentes antes de usar tu coach.",
    });
    return;
  }

  const entitlement = await verifyEntitlement(auth, e);
  if (!entitlement.ok) {
    res.status(402).json({
      error: "Activa tu plan para continuar usando tu coach.",
      paywall: true,
      expired: !!entitlement.expired,
    });
    return;
  }

  let body;
  let quota;
  let providerMetrics = null;
  try {
    body = bodyObject(req);
    quota = quotaInput(body);
  } catch (error) {
    res.status(400).json({ error: String((error && error.message) || error) });
    return;
  }

  let reservation;
  try {
    reservation = firstRow(await rpc(e, "reserve_coach_action", {
      p_user_id: auth.user.id,
      p_action: quota.action,
      p_request_id: quota.requestId,
    }));
  } catch (error) {
    const setup = error.status === 404 || /reserve_coach_action|schema cache|function/i.test(error.message);
    res.status(setup ? 503 : 500).json({
      error: setup
        ? "El control de uso del coach todavia no esta configurado."
        : String(error.message || error),
    });
    return;
  }

  if (!reservation || !reservation.usage_id) {
    res.status(500).json({ error: "No se pudo reservar la accion del coach." });
    return;
  }
  if (reservation.mode === "refunded") {
    res.status(409).json({ error: "Esta solicitud ya fue devuelta. Intenta la accion nuevamente." });
    return;
  }

  try {
    let part = await claimPart(e, reservation.usage_id, quota.partKey);
    if (!part) throw new Error("No se pudo registrar la parte solicitada.");
    if (!part.claimed) {
      if (part.part_status === "completed" && part.response_text) {
        res.status(200).json({ text: part.response_text });
        return;
      }
      if (part.part_status === "failed") {
        res.status(409).json({ error: "Esta parte ya fallo. Reintenta la accion completa." });
        return;
      }
      part = await waitForPart(e, reservation.usage_id, quota.partKey);
      if (part && part.part_status === "completed" && part.response_text) {
        res.status(200).json({ text: part.response_text });
        return;
      }
      res.status(409).json({ error: "La misma accion sigue en proceso." });
      return;
    }

    if (reservation.mode === "reuse") {
      if (!validateCoachOutput(quota.action, quota.fallbackText, quota.validation)) {
        await failPart(e, reservation.usage_id, quota.partKey, "invalid_template");
        res.status(422).json({ error: "No existe una alternativa compatible para esta configuracion." });
        return;
      }
      const selected = firstRow(await rpc(e, "select_reusable_coach_part", {
        p_usage_id: reservation.usage_id,
        p_part_key: quota.partKey,
        p_context_key: quota.contextKey,
        p_fallback_text: quota.fallbackText,
        p_metadata: { policy_enabled: reservation.policy_enabled !== false },
      }));
      if (!selected || !selected.selected_text || !validateCoachOutput(quota.action, selected.selected_text, quota.validation)) {
        res.status(422).json({ error: "No existe una alternativa compatible para esta configuracion." });
        return;
      }
      const response = { text: selected.selected_text };
      if (auth.profile.is_admin) {
        response.adminDiagnostic = {
          origin: selected.selected_origin,
          resultId: selected.selected_result_id || null,
        };
      }
      res.status(200).json(response);
      return;
    }

    if (!body.userText) {
      await failPart(e, reservation.usage_id, quota.partKey, "missing_user_text");
      res.status(400).json({ error: "Falta userText." });
      return;
    }

    let generated;
    try {
      generated = await providerResponse(e, body, privacy);
      providerMetrics = generated;
    } catch (error) {
      await failPart(e, reservation.usage_id, quota.partKey, "provider_" + (error.status || "error"));
      res.status(Number(error.status) || 500).json({ error: String(error.message || error) });
      return;
    }

    if (!validateCoachOutput(quota.action, generated.text, quota.validation)) {
      await failPart(e, reservation.usage_id, quota.partKey, "invalid_provider_output", generated);
      res.status(422).json({ error: "La opcion preparada no paso las validaciones." });
      return;
    }

    const completed = firstRow(await rpc(e, "complete_fresh_coach_part", {
      p_usage_id: reservation.usage_id,
      p_part_key: quota.partKey,
      p_context_key: quota.contextKey,
      p_response_text: generated.text,
      p_metadata: {
        model: generated.model,
        validation_version: 1,
        prompt_version: PROMPT_VERSION,
      },
      p_input_tokens: generated.inputTokens,
      p_output_tokens: generated.outputTokens,
      p_latency_ms: generated.latencyMs || null,
      p_estimated_cost: estimateCostUsd(generated.model, generated.inputTokens, generated.outputTokens),
      p_prompt_version: PROMPT_VERSION,
    }));
    const response = { text: generated.text };
    if (auth.profile.is_admin) {
      response.adminDiagnostic = {
        origin: "fresh",
        resultId: completed && completed.stored_result_id || null,
      };
    }
    res.status(200).json(response);
  } catch (error) {
    await failPart(e, reservation.usage_id, quota.partKey, error.code || "server_error", providerMetrics);
    res.status(Number(error && error.status) || 500).json({ error: String((error && error.message) || error) });
  }
}
