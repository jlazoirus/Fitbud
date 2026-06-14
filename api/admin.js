// Funciones de administración de usuarios (Vercel) — REQ-07.
// Usa la SERVICE ROLE KEY de Supabase, que vive SOLO en el servidor
// (variable SUPABASE_SERVICE_ROLE_KEY). Nunca llega al navegador ni a GitHub.
//
// Acceso: solo un usuario autenticado, admin y activo. El cliente manda su
// JWT en Authorization: Bearer; aquí se valida y se comprueba el perfil.
//
// Acciones (POST { action, ... }):
//   list                       -> lista de usuarios (email, alta, último acceso, admin, activo)
//   setActive {userId, active} -> activa/desactiva (profiles.active)
//   setPassword {userId, password}
//   resetPassword {email}      -> envía correo de recuperación

function env() {
  return {
    url: (process.env.SUPABASE_URL || "").replace(/\/$/, ""),
    anon: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "",
    service: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  };
}

// Valida el token del que llama y devuelve su user id.
async function callerId(req, e) {
  const auth = req.headers.authorization || req.headers.Authorization || "";
  const token = typeof auth === "string" && auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || !e.url || !e.anon) return null;
  try {
    const r = await fetch(e.url + "/auth/v1/user", {
      headers: { Authorization: "Bearer " + token, apikey: e.anon },
    });
    if (!r.ok) return null;
    const u = await r.json();
    return u && u.id ? u.id : null;
  } catch (_) {
    return null;
  }
}

// ¿El usuario es admin y está activo? (lee profiles con service role)
async function adminProfile(id, e) {
  try {
    const r = await fetch(e.url + "/rest/v1/profiles?id=eq." + id + "&select=is_admin,active", {
      headers: { apikey: e.service, Authorization: "Bearer " + e.service },
    });
    if (!r.ok) return null;
    const rows = await r.json();
    return rows && rows[0] ? rows[0] : null;
  } catch (_) {
    return null;
  }
}

async function listUsers(e) {
  // Usuarios de auth (email, alta, último acceso) + perfiles (admin, activo).
  const [au, pr] = await Promise.all([
    fetch(e.url + "/auth/v1/admin/users?per_page=200", {
      headers: { apikey: e.service, Authorization: "Bearer " + e.service },
    }).then((r) => r.json()).catch(() => ({})),
    fetch(e.url + "/rest/v1/profiles?select=id,is_admin,active,email", {
      headers: { apikey: e.service, Authorization: "Bearer " + e.service },
    }).then((r) => r.json()).catch(() => []),
  ]);
  const profById = {};
  (Array.isArray(pr) ? pr : []).forEach((p) => { profById[p.id] = p; });
  const users = (au && Array.isArray(au.users) ? au.users : []).map((u) => {
    const p = profById[u.id] || {};
    return {
      id: u.id,
      email: u.email || p.email || "",
      created_at: u.created_at || null,
      last_sign_in_at: u.last_sign_in_at || null,
      is_admin: !!p.is_admin,
      active: p.active !== false, // por defecto activo si no hay fila
    };
  });
  users.sort((a, b) => (a.email || "").localeCompare(b.email || ""));
  return users;
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Método no permitido" }); return; }
  const e = env();
  if (!e.url || !e.service) {
    res.status(500).json({ error: "Falta SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en el servidor (Vercel)." });
    return;
  }
  const cid = await callerId(req, e);
  if (!cid) { res.status(401).json({ error: "Sesión requerida." }); return; }
  const prof = await adminProfile(cid, e);
  if (!prof || !prof.is_admin || prof.active === false) {
    res.status(403).json({ error: "Solo un administrador activo puede hacer esto." });
    return;
  }

  let body = {};
  try { body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {}); } catch (_) {}
  const action = body.action;

  try {
    if (action === "list") {
      res.status(200).json({ users: await listUsers(e) });
      return;
    }
    if (action === "setActive") {
      if (!body.userId) { res.status(400).json({ error: "Falta userId." }); return; }
      const r = await fetch(e.url + "/rest/v1/profiles?id=eq." + body.userId, {
        method: "PATCH",
        headers: { apikey: e.service, Authorization: "Bearer " + e.service, "content-type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ active: !!body.active }),
      });
      if (!r.ok) { res.status(r.status).json({ error: "No se pudo actualizar el estado." }); return; }
      res.status(200).json({ ok: true });
      return;
    }
    if (action === "setPassword") {
      if (!body.userId || !body.password || String(body.password).length < 6) { res.status(400).json({ error: "userId y contraseña (mín. 6) requeridos." }); return; }
      const r = await fetch(e.url + "/auth/v1/admin/users/" + body.userId, {
        method: "PUT",
        headers: { apikey: e.service, Authorization: "Bearer " + e.service, "content-type": "application/json" },
        body: JSON.stringify({ password: String(body.password) }),
      });
      if (!r.ok) { const d = await r.json().catch(() => ({})); res.status(r.status).json({ error: (d && d.msg) || "No se pudo cambiar la contraseña." }); return; }
      res.status(200).json({ ok: true });
      return;
    }
    if (action === "resetPassword") {
      if (!body.email) { res.status(400).json({ error: "Falta email." }); return; }
      const r = await fetch(e.url + "/auth/v1/recover", {
        method: "POST",
        headers: { apikey: e.anon, "content-type": "application/json" },
        body: JSON.stringify({ email: String(body.email) }),
      });
      if (!r.ok) { res.status(r.status).json({ error: "No se pudo enviar el correo de reseteo." }); return; }
      res.status(200).json({ ok: true });
      return;
    }
    res.status(400).json({ error: "Acción desconocida." });
  } catch (err) {
    res.status(500).json({ error: String((err && err.message) || err) });
  }
}
