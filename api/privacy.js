// Exportacion y borrado de datos personales (REQ-14).
// SUPABASE_SERVICE_ROLE_KEY vive exclusivamente en el servidor.

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

async function caller(req, e) {
  const auth = req.headers.authorization || req.headers.Authorization || "";
  const token = typeof auth === "string" && auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  try {
    const response = await fetch(e.url + "/auth/v1/user", {
      headers: { Authorization: "Bearer " + token, apikey: e.anon },
    });
    if (!response.ok) return null;
    const user = await responseJson(response);
    return user && user.id ? user : null;
  } catch (_) {
    return null;
  }
}

async function restRows(e, table, filter, select) {
  const query = new URLSearchParams();
  if (select) query.set("select", select);
  Object.entries(filter || {}).forEach(([key, value]) => query.set(key, value));
  const response = await fetch(e.url + "/rest/v1/" + table + "?" + query.toString(), {
    headers: serviceHeaders(e),
  });
  const data = await responseJson(response);
  if (!response.ok) throw new Error(apiError(data, "No se pudo exportar " + table + "."));
  return Array.isArray(data) ? data : [];
}

async function listStorageLevel(e, prefix) {
  const response = await fetch(e.url + "/storage/v1/object/list/progress-photos", {
    method: "POST",
    headers: serviceHeaders(e, { "content-type": "application/json" }),
    body: JSON.stringify({ prefix, limit: 1000, offset: 0, sortBy: { column: "name", order: "asc" } }),
  });
  const data = await responseJson(response);
  if (!response.ok) {
    if (response.status === 404) return [];
    throw new Error(apiError(data, "No se pudieron listar las fotos de progreso personal."));
  }
  return Array.isArray(data) ? data : [];
}

async function listPhotos(e, userId) {
  const files = [];
  const queue = [userId];
  while (queue.length) {
    const prefix = queue.shift();
    const items = await listStorageLevel(e, prefix);
    for (const item of items) {
      if (!item || !item.name) continue;
      const path = prefix + "/" + item.name;
      if (item.metadata) files.push(Object.assign({}, item, { path }));
      else if (queue.length < 1000) queue.push(path);
    }
  }
  return files;
}

async function exportUser(user, e) {
  const userFilter = { user_id: "eq." + user.id };
  const [profiles, days, weights, versions, cycles, consents, screenings, coachUsage, coachOptions, photos] = await Promise.all([
    restRows(e, "profiles", { id: "eq." + user.id }, "*"),
    restRows(e, "day_log", userFilter, "*"),
    restRows(e, "weight_log", userFilter, "*"),
    restRows(e, "plan_versions", userFilter, "*"),
    restRows(e, "plan_cycles", userFilter, "*"),
    restRows(e, "user_consents", userFilter, "*"),
    restRows(e, "safety_screenings", userFilter, "*"),
    restRows(e, "coach_usage", userFilter, "*"),
    restRows(e, "coach_option_pool", userFilter, "*"),
    listPhotos(e, user.id),
  ]);
  return {
    format: "fitbros-personal-data-v1",
    generated_at: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email || null,
      created_at: user.created_at || null,
      last_sign_in_at: user.last_sign_in_at || null,
    },
    profile: profiles[0] || null,
    day_log: days,
    weight_log: weights,
    plan_versions: versions,
    plan_cycles: cycles,
    consents,
    safety_screenings: screenings,
    coach_usage: coachUsage,
    coach_options: coachOptions,
    progress_photos: photos.map((photo) => ({
      path: photo.path || null,
      created_at: photo.created_at || null,
      updated_at: photo.updated_at || null,
      metadata: photo.metadata || null,
    })),
    note: "Las fotos se describen por metadatos y rutas privadas; no se incluyen URLs temporales.",
  };
}

async function profileFor(userId, e) {
  const rows = await restRows(e, "profiles", { id: "eq." + userId }, "id,email,is_admin,active");
  return rows[0] || null;
}

async function activeAdminCount(e) {
  const rows = await restRows(e, "profiles", { is_admin: "eq.true", active: "eq.true" }, "id");
  return rows.length;
}

async function deletePhotos(e, userId) {
  const objects = await listPhotos(e, userId);
  const paths = objects.map((item) => item && item.path ? item.path : "").filter(Boolean);
  if (!paths.length) return;
  const response = await fetch(e.url + "/storage/v1/object/progress-photos", {
    method: "DELETE",
    headers: serviceHeaders(e, { "content-type": "application/json" }),
    body: JSON.stringify({ prefixes: paths }),
  });
  const data = await responseJson(response);
  if (!response.ok) throw new Error(apiError(data, "No se pudieron borrar las fotos de progreso personal."));
}

async function deleteUser(user, e) {
  const profile = await profileFor(user.id, e);
  if (profile && profile.is_admin && profile.active !== false && await activeAdminCount(e) <= 1) {
    const error = new Error("No se puede borrar al ultimo administrador activo.");
    error.status = 409;
    throw error;
  }
  await deletePhotos(e, user.id);
  const response = await fetch(e.url + "/auth/v1/admin/users/" + encodeURIComponent(user.id), {
    method: "DELETE",
    headers: serviceHeaders(e),
  });
  const data = await responseJson(response);
  if (!response.ok) throw new Error(apiError(data, "No se pudo borrar la cuenta."));
}

export default async function handler(req, res) {
  if (!["GET", "DELETE"].includes(req.method)) {
    res.status(405).json({ error: "Metodo no permitido" });
    return;
  }
  const e = env();
  if (!e.url || !e.anon || !e.service) {
    res.status(500).json({ error: "Falta configuracion de Supabase para privacidad." });
    return;
  }
  const user = await caller(req, e);
  if (!user) {
    res.status(401).json({ error: "Sesion requerida." });
    return;
  }

  try {
    if (req.method === "GET") {
      res.status(200).json(await exportUser(user, e));
      return;
    }

    let body = {};
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    } catch (_) {
      res.status(400).json({ error: "JSON invalido." });
      return;
    }
    const expected = "BORRAR " + String(user.email || "").toLowerCase();
    if (String(body.confirmation || "").trim().toLowerCase() !== expected.toLowerCase()) {
      res.status(400).json({ error: "La confirmacion no coincide." });
      return;
    }
    await deleteUser(user, e);
    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(error.status || 500).json({ error: String((error && error.message) || error) });
  }
}
