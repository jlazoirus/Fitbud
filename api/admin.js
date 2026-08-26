// Administración de usuarios (Vercel) — REQ-07.
// SUPABASE_SERVICE_ROLE_KEY vive exclusivamente en el servidor.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BAN_DURATION = "876000h"; // 100 años; "none" levanta el bloqueo.
const COACH_ACTIONS = new Set([
  "diet_day",
  "diet_week",
  "meal_option",
  "meal_estimate",
  "macro_review",
  "training_plan",
  "training_replacement",
  "coach_conversation",
]);

function env() {
  return {
    url: (process.env.SUPABASE_URL || "").replace(/\/$/, ""),
    anon: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "",
    service: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
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

async function callerId(req, e) {
  const auth = req.headers.authorization || req.headers.Authorization || "";
  const token = typeof auth === "string" && auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  try {
    const response = await fetch(e.url + "/auth/v1/user", {
      headers: { Authorization: "Bearer " + token, apikey: e.anon },
    });
    if (!response.ok) return null;
    const user = await responseJson(response);
    return user && user.id ? user.id : null;
  } catch (_) {
    return null;
  }
}

async function profileById(id, e) {
  const response = await fetch(
    e.url + "/rest/v1/profiles?id=eq." + encodeURIComponent(id) + "&select=id,email,is_admin,active",
    { headers: serviceHeaders(e) }
  );
  if (!response.ok) return null;
  const rows = await responseJson(response);
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function profileWithPrefsById(id, e) {
  const response = await fetch(
    e.url + "/rest/v1/profiles?id=eq." + encodeURIComponent(id) + "&select=id,email,is_admin,active,prefs",
    { headers: serviceHeaders(e) }
  );
  if (!response.ok) return null;
  const rows = await responseJson(response);
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function authUserById(id, e) {
  const response = await fetch(e.url + "/auth/v1/admin/users/" + encodeURIComponent(id), {
    headers: serviceHeaders(e),
  });
  if (!response.ok) return null;
  const data = await responseJson(response);
  return data && data.user ? data.user : data;
}

async function updateAuthUser(id, attributes, e) {
  const response = await fetch(e.url + "/auth/v1/admin/users/" + encodeURIComponent(id), {
    method: "PUT",
    headers: serviceHeaders(e, { "content-type": "application/json" }),
    body: JSON.stringify(attributes),
  });
  const data = await responseJson(response);
  if (!response.ok) throw new Error(apiError(data, "No se pudo actualizar el usuario en Auth."));
  return data;
}

async function createAuthUser(email, password, e) {
  const response = await fetch(e.url + "/auth/v1/admin/users", {
    method: "POST",
    headers: serviceHeaders(e, { "content-type": "application/json" }),
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { fitbros_test_user: true },
    }),
  });
  const data = await responseJson(response);
  if (!response.ok) throw new Error(apiError(data, "No se pudo crear el usuario de prueba."));
  return data && data.user ? data.user : data;
}

async function inviteAuthUser(email, redirectTo, caller, e) {
  const query = redirectTo ? "?redirect_to=" + encodeURIComponent(redirectTo) : "";
  const response = await fetch(e.url + "/auth/v1/invite" + query, {
    method: "POST",
    headers: serviceHeaders(e, { "content-type": "application/json" }),
    body: JSON.stringify({
      email,
      data: {
        fitbros_invited: true,
        invited_by: caller,
      },
    }),
  });
  const data = await responseJson(response);
  if (!response.ok) throw new Error(apiError(data, "No se pudo enviar la invitación."));
  return data && data.user ? data.user : data;
}

async function upsertProfileStatus(user, active, e) {
  const response = await fetch(e.url + "/rest/v1/profiles?on_conflict=id", {
    method: "POST",
    headers: serviceHeaders(e, {
      "content-type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    }),
    body: JSON.stringify({ id: user.id, email: user.email || "", active: !!active }),
  });
  const data = await responseJson(response);
  if (!response.ok) throw new Error(apiError(data, "No se pudo actualizar profiles.active."));
  return data;
}

async function resetTestProfile(user, e) {
  const response = await fetch(e.url + "/rest/v1/profiles?on_conflict=id", {
    method: "POST",
    headers: serviceHeaders(e, {
      "content-type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    }),
    body: JSON.stringify({
      id: user.id,
      email: user.email || "",
      is_admin: false,
      active: true,
      prefs: {},
      updated_at: new Date().toISOString(),
    }),
  });
  const data = await responseJson(response);
  if (!response.ok) throw new Error(apiError(data, "No se pudo reiniciar el perfil de prueba."));
}

async function deleteUserRows(table, userId, e) {
  const response = await fetch(
    e.url + "/rest/v1/" + table + "?user_id=eq." + encodeURIComponent(userId),
    {
      method: "DELETE",
      headers: serviceHeaders(e, { Prefer: "return=minimal" }),
    }
  );
  const data = await responseJson(response);
  if (!response.ok) throw new Error(apiError(data, "No se pudo limpiar " + table + "."));
}

async function listStorageLevel(e, prefix) {
  const response = await fetch(e.url + "/storage/v1/object/list/progress-photos", {
    method: "POST",
    headers: serviceHeaders(e, { "content-type": "application/json" }),
    body: JSON.stringify({ prefix, limit: 1000, offset: 0, sortBy: { column: "name", order: "asc" } }),
  });
  const data = await responseJson(response);
  if (response.status === 404) return [];
  if (!response.ok) throw new Error(apiError(data, "No se pudieron listar las fotos de progreso personal."));
  return Array.isArray(data) ? data : [];
}

async function deleteTestPhotos(userId, e) {
  const files = [];
  const queue = [userId];
  while (queue.length) {
    const prefix = queue.shift();
    const items = await listStorageLevel(e, prefix);
    for (const item of items) {
      if (!item || !item.name) continue;
      const path = prefix + "/" + item.name;
      if (item.metadata) files.push(path);
      else if (queue.length < 1000) queue.push(path);
    }
  }
  if (!files.length) return;
  const response = await fetch(e.url + "/storage/v1/object/progress-photos", {
    method: "DELETE",
    headers: serviceHeaders(e, { "content-type": "application/json" }),
    body: JSON.stringify({ prefixes: files }),
  });
  const data = await responseJson(response);
  if (!response.ok) throw new Error(apiError(data, "No se pudieron borrar las fotos de progreso personal."));
}

async function resetTestUserData(user, e) {
  await deleteTestPhotos(user.id, e);
  for (const table of [
    "coach_usage",
    "coach_option_pool",
    "coach_quota_overrides",
    "day_log",
    "weight_log",
    "plan_cycles",
    "plan_versions",
    "user_consents",
    "safety_screenings",
  ]) {
    await deleteUserRows(table, user.id, e);
  }
  await resetTestProfile(user, e);
}

async function restRequest(e, path, options) {
  const response = await fetch(e.url + "/rest/v1/" + path, Object.assign(
    { headers: serviceHeaders(e) },
    options || {}
  ));
  const data = await responseJson(response);
  if (!response.ok) {
    const error = new Error(apiError(data, "No se pudo consultar " + path.split("?")[0] + "."));
    error.status = response.status;
    throw error;
  }
  return data;
}

async function optionalRestRequest(e, path, options) {
  try {
    return await restRequest(e, path, options);
  } catch (error) {
    const message = String(error && error.message || "");
    if (error.status === 404 || /schema cache|does not exist|not found|v_coach_model_gate/i.test(message)) return [];
    throw error;
  }
}

// ---------------------------------------------------------------
// REQ-126 — resetear/regenerar futuro de nutrición y/o entrenamiento
// de cualquier usuario, y reiniciar un usuario a onboarding.
// ---------------------------------------------------------------
const RESET_SCOPES = new Set(["nutrition", "training", "both"]);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// Techo defensivo: evita escanear/mutar un rango de fechas sin límite.
const RESET_HORIZON_DAYS = 120;

function todayInTimeZone(timeZone) {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  } catch (_) {
    return new Date().toISOString().slice(0, 10);
  }
}
function addDaysToDate(ds, n) {
  const d = new Date(ds + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Un día queda protegido (nunca se toca) si ya tiene algo ejecutado dentro del
// alcance elegido: comida registrada (nutrición) o entrenamiento hecho/ejecutado.
function dayProtectedForScope(state, scope) {
  const st = state || {};
  const meals = st.meals && typeof st.meals === "object" ? st.meals : {};
  const nutritionDone = Object.values(meals).some((m) => m && m.done)
    || (Array.isArray(st.extras) && st.extras.some((x) => x && x.done));
  const trainingDone = !!st.workoutDone || !!st.workoutExecution;
  if (scope === "nutrition") return nutritionDone;
  if (scope === "training") return trainingDone;
  return nutritionDone || trainingDone;
}

// Limpia solo los campos del alcance elegido; nunca toca información fuera de ese alcance.
function clearedStateForScope(state, scope) {
  const st = Object.assign({}, state || {});
  if (scope === "nutrition" || scope === "both") {
    st.meals = {};
    st.extras = [];
  }
  if (scope === "training" || scope === "both") {
    delete st.workoutOverride;
    delete st.workoutExecution;
    st.workoutDone = false;
  }
  return st;
}

async function fetchFutureDayLogs(userId, fromDate, e) {
  const toDate = addDaysToDate(fromDate, RESET_HORIZON_DAYS);
  const rows = await restRequest(e, "day_log?user_id=eq." + encodeURIComponent(userId)
    + "&log_date=gte." + fromDate + "&log_date=lte." + toDate
    + "&select=log_date,state&order=log_date.asc");
  return Array.isArray(rows) ? rows : [];
}

async function fetchActivePlanVersion(userId, e) {
  const rows = await restRequest(e, "plan_versions?user_id=eq." + encodeURIComponent(userId)
    + "&status=eq.active&select=id,cycle_number,version_number,valid_from,valid_to,snapshot&order=created_at.desc&limit=1");
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

// REQ-149: nutrición y entrenamiento pueden vivir combinados en la misma fila
// activa (onboarding guarda snapshot.nutritionPlan + snapshot.trainingPlan
// juntos). "Solo nutrición" no debe arrastrar el entrenamiento futuro al
// archivar esa fila.
function planVersionHasTrainingContent(active) {
  const plan = active && active.snapshot && active.snapshot.trainingPlan;
  return !!(plan && Array.isArray(plan.weeks) && plan.weeks.length);
}

// Re-versiona la fila superseded: inserta una nueva fila activa que conserva
// solo snapshot.trainingPlan (sin nutritionPlan) cubriendo desde fromDate en
// adelante, para que el entrenamiento futuro no pierda su prescripción al
// archivar nutrición. Se llama DESPUÉS de superseder la fila combinada, así
// que nunca hay dos filas activas a la vez para el mismo (user_id, cycle_number).
async function insertTrainingOnlyVersion(userId, active, fromDate, e) {
  const nextVersionRows = await restRequest(e, "plan_versions?user_id=eq." + encodeURIComponent(userId)
    + "&cycle_number=eq." + active.cycle_number + "&select=version_number&order=version_number.desc&limit=1");
  const lastVersionNumber = Array.isArray(nextVersionRows) && nextVersionRows[0]
    ? Number(nextVersionRows[0].version_number) || 0 : Number(active.version_number) || 0;
  const snapshot = Object.assign({}, active.snapshot, { nutritionPlan: null });
  const now = new Date().toISOString();
  await restRequest(e, "plan_versions", {
    method: "POST",
    headers: serviceHeaders(e, { "content-type": "application/json", Prefer: "return=minimal" }),
    body: JSON.stringify({
      user_id: userId,
      cycle_number: active.cycle_number,
      version_number: lastVersionNumber + 1,
      version_key: active.cycle_number + ":" + fromDate + ":admin_reset_nutrition:" + Date.now(),
      source: "manual",
      status: "active",
      valid_from: fromDate,
      valid_to: active.valid_to || null,
      reason: "Admin: regenerar nutrición conservando entrenamiento (REQ-149)",
      snapshot,
      activated_at: now,
      updated_at: now,
    }),
  });
}

function summarizeResetTargets(rows, scope) {
  let protectedCount = 0, clearedCount = 0;
  const protectedDates = [];
  rows.forEach((row) => {
    if (dayProtectedForScope(row.state, scope)) { protectedCount++; protectedDates.push(row.log_date); }
    else clearedCount++;
  });
  return { protectedCount, clearedCount, protectedDates: protectedDates.slice(0, 20) };
}

async function logAdminAction(e, { adminId, targetUserId, action, scope, fromDate, result }) {
  try {
    await fetch(e.url + "/rest/v1/admin_actions_log", {
      method: "POST",
      headers: serviceHeaders(e, { "content-type": "application/json", Prefer: "return=minimal" }),
      body: JSON.stringify({
        admin_id: adminId || null,
        target_user_id: targetUserId,
        action,
        scope: scope || null,
        from_date: fromDate || null,
        result: result || {},
      }),
    });
  } catch (_) { /* la auditoría nunca debe bloquear la operación principal */ }
}

function validateResetPlanInput(body) {
  const userId = String(body.userId || "");
  const scope = String(body.scope || "");
  if (!UUID_RE.test(userId) || !RESET_SCOPES.has(scope)) {
    const error = new Error("Usuario y alcance (nutrition, training o both) válidos requeridos.");
    error.status = 400;
    throw error;
  }
  const fromDate = DATE_RE.test(String(body.fromDate || "")) ? String(body.fromDate) : null;
  return { userId, scope, fromDate };
}

// Resuelve la fecha de inicio efectiva: la elegida por el admin si es futura,
// o el día de hoy en la zona horaria del usuario objetivo (nunca el pasado).
async function resolveResetTarget(body, e) {
  const { userId, scope, fromDate: requestedFromDate } = validateResetPlanInput(body);
  const target = await profileWithPrefsById(userId, e);
  if (!target) {
    const error = new Error("Usuario no encontrado.");
    error.status = 404;
    throw error;
  }
  const timeZone = (target.prefs && target.prefs.timeZone) || "UTC";
  const today = todayInTimeZone(timeZone);
  const fromDate = requestedFromDate && requestedFromDate > today ? requestedFromDate : today;
  return { userId, scope, fromDate, today, target };
}

async function previewResetPlan(body, e) {
  const { userId, scope, fromDate, today } = await resolveResetTarget(body, e);
  const rows = await fetchFutureDayLogs(userId, fromDate, e);
  const active = scope === "training" ? null : await fetchActivePlanVersion(userId, e);
  const summary = summarizeResetTargets(rows, scope);
  // No exponer active.snapshot completo en la respuesta: solo metadata + el
  // flag de si el entrenamiento futuro se conserva al archivar nutrición.
  const activePlanVersion = active
    ? { id: active.id, cycle_number: active.cycle_number, version_number: active.version_number, valid_from: active.valid_from, valid_to: active.valid_to }
    : null;
  return {
    userId, scope, fromDate, today,
    daysInRange: rows.length,
    ...summary,
    willSupersedePlanVersion: !!active,
    willPreserveTraining: scope === "nutrition" && planVersionHasTrainingContent(active),
    activePlanVersion,
  };
}

async function applyResetPlan(body, caller, e) {
  const { userId, scope, fromDate } = await resolveResetTarget(body, e);
  const rows = await fetchFutureDayLogs(userId, fromDate, e);

  let cleared = 0, protectedCount = 0;
  for (const row of rows) {
    if (dayProtectedForScope(row.state, scope)) { protectedCount++; continue; }
    const nextState = clearedStateForScope(row.state, scope);
    await restRequest(e, "day_log?user_id=eq." + encodeURIComponent(userId) + "&log_date=eq." + row.log_date, {
      method: "PATCH",
      headers: serviceHeaders(e, { "content-type": "application/json", Prefer: "return=minimal" }),
      body: JSON.stringify({ state: nextState, updated_at: new Date().toISOString() }),
    });
    cleared++;
  }

  let planVersionSuperseded = false;
  let trainingPreserved = false;
  if (scope !== "training") {
    const active = await fetchActivePlanVersion(userId, e);
    if (active) {
      const validTo = active.valid_from && active.valid_from > fromDate ? active.valid_from : addDaysToDate(fromDate, -1);
      await restRequest(e, "plan_versions?id=eq." + active.id + "&user_id=eq." + encodeURIComponent(userId), {
        method: "PATCH",
        headers: serviceHeaders(e, { "content-type": "application/json", Prefer: "return=minimal" }),
        body: JSON.stringify({ status: "superseded", valid_to: validTo, superseded_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
      });
      planVersionSuperseded = true;
      // REQ-149: al archivar solo nutrición, si la fila combinada también
      // traía entrenamiento futuro, re-versionarlo por separado en vez de
      // dejarlo caer a generación determinista junto con la nutrición.
      if (scope === "nutrition" && planVersionHasTrainingContent(active)) {
        await insertTrainingOnlyVersion(userId, active, fromDate, e);
        trainingPreserved = true;
      }
    }
  }

  const result = { daysCleared: cleared, daysProtected: protectedCount, planVersionSuperseded, trainingPreserved, fromDate };
  await logAdminAction(e, { adminId: caller, targetUserId: userId, action: "reset_plan_apply", scope, fromDate, result });
  return result;
}

// REQ-126 item 7: reinicia cualquier usuario normal a onboarding (datos, planes,
// progreso y consentimientos) SIN convertirlo en usuario de prueba QA.
async function resetUserToOnboarding(body, caller, e) {
  const userId = String(body.userId || "");
  if (!UUID_RE.test(userId)) {
    const error = new Error("userId inválido.");
    error.status = 400;
    throw error;
  }
  if (userId === caller) {
    const error = new Error("No puedes reiniciar tu propia cuenta desde el panel.");
    error.status = 400;
    throw error;
  }
  const [targetUser, targetProfile] = await Promise.all([authUserById(userId, e), profileById(userId, e)]);
  if (!targetUser) {
    const error = new Error("Usuario no encontrado.");
    error.status = 404;
    throw error;
  }
  if (targetProfile && targetProfile.is_admin) {
    const error = new Error("No se puede reiniciar una cuenta administradora desde esta herramienta.");
    error.status = 409;
    throw error;
  }
  await resetTestUserData({ id: targetUser.id, email: targetUser.email || "" }, e);
  const result = { ok: true };
  await logAdminAction(e, { adminId: caller, targetUserId: userId, action: "reset_user", result });
  return result;
}

async function quotaOverview(e) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [policies, overrides, usage, modelGate] = await Promise.all([
    restRequest(e, "coach_quota_policies?select=action,entitlement_code,daily_limit,enabled,updated_at&order=action.asc"),
    restRequest(e, "coach_quota_overrides?select=user_id,action,entitlement_code,daily_limit,bonus_units,enabled,expires_at,updated_at&order=updated_at.desc&limit=500"),
    restRequest(
      e,
      "coach_usage?select=user_id,action,status,origin,error_code,created_at&created_at=gte."
        + encodeURIComponent(since)
        + "&order=created_at.desc&limit=2000"
    ),
    optionalRestRequest(
      e,
      "v_coach_model_gate?select=action,model,fresh_attempts,fresh_successes,invalid_provider_output,invalid_provider_output_rate_pct,degraded_calls,degradation_rate_pct,total_cost_usd,avg_latency_ms&action=in.(diet_day,diet_week,meal_option)&order=action.asc"
    ),
  ]);
  const summary = {};
  const byUser = {};
  (Array.isArray(usage) ? usage : []).forEach((row) => {
    const action = row.action || "unknown";
    if (!summary[action]) summary[action] = { fresh: 0, reused: 0, refunded: 0, errors: 0 };
    if (row.status === "refunded") summary[action].refunded += 1;
    else if (row.origin === "fresh") summary[action].fresh += 1;
    else summary[action].reused += 1;
    if (row.error_code) summary[action].errors += 1;
    const key = row.user_id + ":" + action;
    byUser[key] = (byUser[key] || 0) + 1;
  });
  const topConsumers = Object.entries(byUser)
    .map(([key, requests]) => {
      const split = key.lastIndexOf(":");
      return { user_id: key.slice(0, split), action: key.slice(split + 1), requests };
    })
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 10);
  return {
    policies: Array.isArray(policies) ? policies : [],
    overrides: Array.isArray(overrides) ? overrides : [],
    summary,
    topConsumers,
    modelGate: Array.isArray(modelGate) ? modelGate : [],
    windowDays: 7,
  };
}

async function setQuotaPolicy(body, caller, e) {
  const action = String(body.quotaAction || "");
  const dailyLimit = Number.parseInt(body.dailyLimit, 10);
  if (!COACH_ACTIONS.has(action) || !Number.isInteger(dailyLimit) || dailyLimit < 0 || dailyLimit > 1000) {
    const error = new Error("Acción y límite diario entre 0 y 1000 requeridos.");
    error.status = 400;
    throw error;
  }
  const response = await fetch(e.url + "/rest/v1/coach_quota_policies?on_conflict=action,entitlement_code", {
    method: "POST",
    headers: serviceHeaders(e, {
      "content-type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    }),
    body: JSON.stringify({
      action,
      entitlement_code: String(body.entitlementCode || "default").slice(0, 80),
      daily_limit: dailyLimit,
      enabled: body.enabled !== false,
      updated_by: caller,
      updated_at: new Date().toISOString(),
    }),
  });
  const data = await responseJson(response);
  if (!response.ok) throw new Error(apiError(data, "No se pudo actualizar la política."));
  return Array.isArray(data) ? data[0] : data;
}

async function setQuotaOverride(body, caller, e) {
  const userId = String(body.userId || "");
  const action = String(body.quotaAction || "");
  const dailyLimit = body.dailyLimit === "" || body.dailyLimit == null ? null : Number.parseInt(body.dailyLimit, 10);
  const bonusUnits = Number.parseInt(body.bonusUnits, 10) || 0;
  if (!UUID_RE.test(userId) || !COACH_ACTIONS.has(action)
    || (dailyLimit != null && (!Number.isInteger(dailyLimit) || dailyLimit < 0 || dailyLimit > 1000))
    || bonusUnits < 0 || bonusUnits > 1000) {
    const error = new Error("Usuario, acción y valores de cortesía válidos requeridos.");
    error.status = 400;
    throw error;
  }
  if (!await profileById(userId, e)) {
    const error = new Error("Usuario no encontrado.");
    error.status = 404;
    throw error;
  }
  const response = await fetch(e.url + "/rest/v1/coach_quota_overrides?on_conflict=user_id,action", {
    method: "POST",
    headers: serviceHeaders(e, {
      "content-type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    }),
    body: JSON.stringify({
      user_id: userId,
      action,
      entitlement_code: body.entitlementCode ? String(body.entitlementCode).slice(0, 80) : null,
      daily_limit: dailyLimit,
      bonus_units: bonusUnits,
      enabled: typeof body.enabled === "boolean" ? body.enabled : null,
      expires_at: body.expiresAt || null,
      updated_by: caller,
      updated_at: new Date().toISOString(),
    }),
  });
  const data = await responseJson(response);
  if (!response.ok) throw new Error(apiError(data, "No se pudo guardar la cortesía."));
  return Array.isArray(data) ? data[0] : data;
}

async function resetQuota(body, e) {
  const userId = String(body.userId || "");
  const action = String(body.quotaAction || "");
  if (!UUID_RE.test(userId) || !COACH_ACTIONS.has(action)) {
    const error = new Error("Usuario y acción válidos requeridos.");
    error.status = 400;
    throw error;
  }
  const response = await fetch(e.url + "/rest/v1/rpc/admin_reset_coach_quota", {
    method: "POST",
    headers: serviceHeaders(e, { "content-type": "application/json" }),
    body: JSON.stringify({ p_user_id: userId, p_action: action }),
  });
  const data = await responseJson(response);
  if (!response.ok) throw new Error(apiError(data, "No se pudo reiniciar la cuota."));
  return Number(data) || 0;
}

async function activeAdminCount(e) {
  const response = await fetch(
    e.url + "/rest/v1/profiles?is_admin=eq.true&active=eq.true&select=id",
    { headers: serviceHeaders(e) }
  );
  if (!response.ok) throw new Error("No se pudo verificar cuántos administradores activos quedan.");
  const rows = await responseJson(response);
  return Array.isArray(rows) ? rows.length : 0;
}

function isCurrentlyBanned(user) {
  const until = Date.parse(user && user.banned_until);
  return Number.isFinite(until) && until > Date.now();
}

async function listAuthUsers(e) {
  const users = [];
  for (let page = 1; page <= 50; page += 1) {
    const response = await fetch(e.url + "/auth/v1/admin/users?page=" + page + "&per_page=200", {
      headers: serviceHeaders(e),
    });
    const data = await responseJson(response);
    if (!response.ok) throw new Error(apiError(data, "No se pudo listar auth.users."));
    const batch = data && Array.isArray(data.users) ? data.users : [];
    users.push(...batch);
    if (batch.length < 200) break;
  }
  return users;
}

async function listUsers(e) {
  const [authUsers, profilesResponse] = await Promise.all([
    listAuthUsers(e),
    fetch(e.url + "/rest/v1/profiles?select=id,is_admin,active,email", {
      headers: serviceHeaders(e),
    }),
  ]);
  const profiles = await responseJson(profilesResponse);
  if (!profilesResponse.ok) throw new Error(apiError(profiles, "No se pudo listar profiles."));
  const byId = {};
  (Array.isArray(profiles) ? profiles : []).forEach((profile) => { byId[profile.id] = profile; });
  return authUsers.map((user) => {
    const profile = byId[user.id] || {};
    return {
      id: user.id,
      email: user.email || profile.email || "",
      created_at: user.created_at || null,
      last_sign_in_at: user.last_sign_in_at || null,
      is_admin: !!profile.is_admin,
      active: profile.active !== false && !isCurrentlyBanned(user),
      is_test_user: !!(user.user_metadata && user.user_metadata.fitbros_test_user === true),
    };
  }).sort((a, b) => (a.email || "").localeCompare(b.email || ""));
}

async function authUserByEmail(email, e) {
  const target = email.toLowerCase();
  const users = await listAuthUsers(e);
  return users.find((user) => String(user.email || "").toLowerCase() === target) || null;
}

function safeRedirect(req, candidate) {
  const origin = req.headers.origin || "";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "";
  const proto = req.headers["x-forwarded-proto"] || "https";
  const fallback = origin || (host ? proto + "://" + host : "");
  try {
    const url = new URL(candidate || fallback);
    if (!/^https?:$/.test(url.protocol)) return "";
    if (origin && url.origin !== new URL(origin).origin) return "";
    if (!origin && host && url.host !== host) return "";
    return url.origin + url.pathname;
  } catch (_) {
    return "";
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }
  const e = env();
  if (!e.url || !e.anon || !e.service) {
    res.status(500).json({ error: "Falta configuración de Supabase para la API administrativa." });
    return;
  }
  const caller = await callerId(req, e);
  if (!caller) {
    res.status(401).json({ error: "Sesión requerida." });
    return;
  }
  const callerProfile = await profileById(caller, e);
  if (!callerProfile || !callerProfile.is_admin || callerProfile.active === false) {
    res.status(403).json({ error: "Solo un administrador activo puede hacer esto." });
    return;
  }

  let body = {};
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  } catch (_) {
    res.status(400).json({ error: "JSON inválido." });
    return;
  }

  try {
    if (body.action === "list") {
      res.status(200).json({ users: await listUsers(e) });
      return;
    }

    if (body.action === "setActive") {
      const userId = String(body.userId || "");
      if (!UUID_RE.test(userId)) {
        res.status(400).json({ error: "userId inválido." });
        return;
      }
      if (userId === caller) {
        res.status(400).json({ error: "No puedes desactivar tu propia cuenta desde el panel." });
        return;
      }
      const [targetUser, targetProfile] = await Promise.all([
        authUserById(userId, e),
        profileById(userId, e),
      ]);
      if (!targetUser) {
        res.status(404).json({ error: "Usuario no encontrado." });
        return;
      }
      const active = body.active === true;
      if (!active && targetProfile && targetProfile.is_admin && await activeAdminCount(e) <= 1) {
        res.status(409).json({ error: "No puedes desactivar al último administrador activo." });
        return;
      }
      await updateAuthUser(userId, { ban_duration: active ? "none" : BAN_DURATION }, e);
      try {
        await upsertProfileStatus(targetUser, active, e);
      } catch (error) {
        await updateAuthUser(userId, { ban_duration: active ? BAN_DURATION : "none" }, e).catch(() => {});
        throw error;
      }
      res.status(200).json({ ok: true, active });
      return;
    }

    if (body.action === "setPassword") {
      const userId = String(body.userId || "");
      const password = String(body.password || "");
      if (!UUID_RE.test(userId) || password.length < 8 || password.length > 128) {
        res.status(400).json({ error: "userId y contraseña de 8 a 128 caracteres requeridos." });
        return;
      }
      const [targetUser, targetProfile] = await Promise.all([authUserById(userId, e), profileById(userId, e)]);
      if (!targetUser) {
        res.status(404).json({ error: "Usuario no encontrado." });
        return;
      }
      // REQ-158: cambiar contraseña habilita impersonación — mismo invariante
      // que ya protege setActive/resetUserToOnboarding: nunca sobre OTRO admin
      // (uno mismo sigue permitido).
      if (userId !== caller && targetProfile && targetProfile.is_admin) {
        res.status(409).json({ error: "No puedes cambiar la contraseña de otro administrador." });
        return;
      }
      await updateAuthUser(userId, { password }, e);
      res.status(200).json({ ok: true });
      return;
    }

    if (body.action === "prepareTestUser") {
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      if (!EMAIL_RE.test(email) || email.length > 254 || password.length < 8 || password.length > 128) {
        res.status(400).json({ error: "Correo válido y contraseña de 8 a 128 caracteres requeridos." });
        return;
      }
      let targetUser = await authUserByEmail(email, e);
      let created = false;
      if (targetUser) {
        if (targetUser.id === caller) {
          res.status(400).json({ error: "No puedes convertir tu cuenta administradora en usuario de prueba." });
          return;
        }
        if (!(targetUser.user_metadata && targetUser.user_metadata.fitbros_test_user === true)) {
          res.status(409).json({ error: "Ese correo ya pertenece a una cuenta normal y no puede reiniciarse como prueba." });
          return;
        }
        const targetProfile = await profileById(targetUser.id, e);
        if (targetProfile && targetProfile.is_admin) {
          res.status(409).json({ error: "Una cuenta administradora no puede reiniciarse como prueba." });
          return;
        }
      } else {
        targetUser = await createAuthUser(email, password, e);
        created = true;
      }
      await updateAuthUser(targetUser.id, {
        password,
        email_confirm: true,
        ban_duration: "none",
        user_metadata: Object.assign({}, targetUser.user_metadata || {}, { fitbros_test_user: true }),
      }, e);
      await resetTestUserData({ id: targetUser.id, email }, e);
      res.status(200).json({
        ok: true,
        created,
        user: { id: targetUser.id, email, is_test_user: true },
      });
      return;
    }

    if (body.action === "inviteUser") {
      const email = String(body.email || "").trim().toLowerCase();
      if (!EMAIL_RE.test(email) || email.length > 254) {
        res.status(400).json({ error: "Correo válido requerido." });
        return;
      }
      const existing = await authUserByEmail(email, e);
      if (existing) {
        res.status(409).json({ error: "Ese correo ya tiene una cuenta. Usa el reset de contraseña si necesita recuperar acceso." });
        return;
      }
      const redirectTo = safeRedirect(req, body.redirectTo);
      const invited = await inviteAuthUser(email, redirectTo, caller, e);
      if (invited && invited.id) await upsertProfileStatus({ id: invited.id, email }, true, e);
      res.status(200).json({
        ok: true,
        user: invited && invited.id ? { id: invited.id, email } : { email },
      });
      return;
    }

    if (body.action === "resetPassword") {
      const userId = String(body.userId || "");
      if (!UUID_RE.test(userId)) {
        res.status(400).json({ error: "userId inválido." });
        return;
      }
      const targetUser = await authUserById(userId, e);
      if (!targetUser || !targetUser.email) {
        res.status(404).json({ error: "Usuario sin correo disponible." });
        return;
      }
      const redirectTo = safeRedirect(req, body.redirectTo);
      const response = await fetch(e.url + "/auth/v1/recover", {
        method: "POST",
        headers: { apikey: e.anon, "content-type": "application/json" },
        body: JSON.stringify(Object.assign(
          { email: targetUser.email },
          redirectTo ? { redirect_to: redirectTo } : {}
        )),
      });
      const data = await responseJson(response);
      if (!response.ok) {
        res.status(response.status).json({ error: apiError(data, "No se pudo enviar el correo de recuperación.") });
        return;
      }
      res.status(200).json({ ok: true });
      return;
    }

    if (body.action === "quotaOverview") {
      res.status(200).json(await quotaOverview(e));
      return;
    }

    if (body.action === "setQuotaPolicy") {
      res.status(200).json({ ok: true, policy: await setQuotaPolicy(body, caller, e) });
      return;
    }

    if (body.action === "setQuotaOverride") {
      res.status(200).json({ ok: true, override: await setQuotaOverride(body, caller, e) });
      return;
    }

    if (body.action === "resetQuota") {
      res.status(200).json({ ok: true, reset: await resetQuota(body, e) });
      return;
    }

    if (body.action === "previewResetPlan") {
      res.status(200).json(await previewResetPlan(body, e));
      return;
    }

    if (body.action === "applyResetPlan") {
      res.status(200).json({ ok: true, ...(await applyResetPlan(body, caller, e)) });
      return;
    }

    if (body.action === "resetUserToOnboarding") {
      res.status(200).json(await resetUserToOnboarding(body, caller, e));
      return;
    }

    res.status(400).json({ error: "Acción desconocida." });
  } catch (error) {
    res.status(Number(error && error.status) || 500).json({ error: String((error && error.message) || error) });
  }
}
