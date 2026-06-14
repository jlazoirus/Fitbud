// Administración de usuarios (Vercel) — REQ-07.
// SUPABASE_SERVICE_ROLE_KEY vive exclusivamente en el servidor.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BAN_DURATION = "876000h"; // 100 años; "none" levanta el bloqueo.

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
    };
  }).sort((a, b) => (a.email || "").localeCompare(b.email || ""));
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
      if (!await authUserById(userId, e)) {
        res.status(404).json({ error: "Usuario no encontrado." });
        return;
      }
      await updateAuthUser(userId, { password }, e);
      res.status(200).json({ ok: true });
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

    res.status(400).json({ error: "Acción desconocida." });
  } catch (error) {
    res.status(500).json({ error: String((error && error.message) || error) });
  }
}
