// Serverless: entitlement activo del usuario autenticado.
// GET  → entitlement activo (o null) + último vencido
// POST → admin: otorgar o revocar acceso de cortesía

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function env() {
  return {
    url: (process.env.SUPABASE_URL || "").replace(/\/$/, ""),
    anon: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "",
    service: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  };
}

function svcHeaders(e, extra) {
  return Object.assign({ apikey: e.service, Authorization: "Bearer " + e.service }, extra || {});
}

async function rj(r) { return r.json().catch(() => ({})); }

async function verifyUser(req, e) {
  const auth = req.headers.authorization || req.headers.Authorization || "";
  const token = typeof auth === "string" && auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || !e.url || !e.anon) return null;
  try {
    const r = await fetch(e.url + "/auth/v1/user", {
      headers: { Authorization: "Bearer " + token, apikey: e.anon },
    });
    if (!r.ok) return null;
    const user = await rj(r);
    if (!user || !user.id) return null;
    const pr = await fetch(
      e.url + "/rest/v1/profiles?id=eq." + encodeURIComponent(user.id) + "&select=active,is_admin",
      { headers: { Authorization: "Bearer " + token, apikey: e.anon } }
    );
    if (!pr.ok) return null;
    const rows = await rj(pr);
    if (!Array.isArray(rows) || !rows[0] || rows[0].active === false) return null;
    return { user, profile: rows[0], token };
  } catch (_) {
    return null;
  }
}

export default async function handler(req, res) {
  const e = env();
  if (!e.url || !e.service) {
    res.status(500).json({ error: "Servicio no configurado." });
    return;
  }
  const auth = await verifyUser(req, e);
  if (!auth) {
    res.status(401).json({ error: "Sesión requerida." });
    return;
  }

  if (req.method === "GET") {
    try {
      const now = new Date().toISOString();
      const activeUrl = e.url + "/rest/v1/user_entitlements?user_id=eq." + auth.user.id
        + "&status=in.(active,courtesy)&expires_at=gt." + now
        + "&order=expires_at.desc&limit=1"
        + "&select=id,plan_id,status,starts_at,expires_at,origin,notes";
      const ar = await fetch(activeUrl, { headers: svcHeaders(e) });
      const active = await rj(ar);
      if (ar.ok && Array.isArray(active) && active.length) {
        res.status(200).json({ entitlement: active[0], expired: null, isAdmin: !!auth.profile.is_admin });
        return;
      }
      // Check for most recent expired entitlement to show in UI
      const expUrl = e.url + "/rest/v1/user_entitlements?user_id=eq." + auth.user.id
        + "&status=in.(active,expired)&order=expires_at.desc&limit=1"
        + "&select=id,plan_id,status,starts_at,expires_at,origin";
      const er = await fetch(expUrl, { headers: svcHeaders(e) });
      const expired = await rj(er);
      res.status(200).json({
        entitlement: null,
        expired: er.ok && Array.isArray(expired) && expired.length ? expired[0] : null,
        isAdmin: !!auth.profile.is_admin,
      });
    } catch (err) {
      res.status(500).json({ error: String(err.message || err) });
    }
    return;
  }

  if (req.method === "POST") {
    if (!auth.profile.is_admin) {
      res.status(403).json({ error: "Solo administradores pueden gestionar entitlements." });
      return;
    }
    let body;
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    } catch (_) {
      res.status(400).json({ error: "JSON inválido." });
      return;
    }
    const action = String(body.action || "");
    const targetUserId = String(body.userId || "");
    if (!UUID_RE.test(targetUserId)) {
      res.status(400).json({ error: "userId inválido." });
      return;
    }

    if (action === "grant") {
      const planId = String(body.planId || "monthly");
      const days = Math.max(1, Math.min(365, Number(body.days) || 30));
      const notes = String(body.notes || "").slice(0, 500);
      const now = new Date();
      const exp = new Date(now.getTime() + days * 86400000);
      try {
        const r = await fetch(e.url + "/rest/v1/user_entitlements", {
          method: "POST",
          headers: svcHeaders(e, { "content-type": "application/json", "Prefer": "return=representation" }),
          body: JSON.stringify({
            user_id:   targetUserId,
            plan_id:   planId,
            status:    "courtesy",
            starts_at: now.toISOString(),
            expires_at: exp.toISOString(),
            origin:    "admin_courtesy",
            notes:     notes || "Acceso de cortesía otorgado por administrador",
            granted_by: auth.user.id,
          }),
        });
        const data = await rj(r);
        if (!r.ok) {
          res.status(500).json({ error: (data && data.message) || "No se pudo crear el acceso de cortesía." });
          return;
        }
        res.status(201).json({ entitlement: Array.isArray(data) ? data[0] : data });
      } catch (err) {
        res.status(500).json({ error: String(err.message || err) });
      }
      return;
    }

    if (action === "revoke") {
      const entitlementId = String(body.entitlementId || "");
      if (!UUID_RE.test(entitlementId)) {
        res.status(400).json({ error: "entitlementId inválido." });
        return;
      }
      try {
        const r = await fetch(
          e.url + "/rest/v1/user_entitlements?id=eq." + entitlementId + "&user_id=eq." + targetUserId,
          {
            method: "PATCH",
            headers: svcHeaders(e, { "content-type": "application/json" }),
            body: JSON.stringify({ status: "revoked", updated_at: new Date().toISOString() }),
          }
        );
        if (!r.ok) {
          res.status(500).json({ error: "No se pudo revocar el acceso." });
          return;
        }
        res.status(200).json({ ok: true });
      } catch (err) {
        res.status(500).json({ error: String(err.message || err) });
      }
      return;
    }

    res.status(400).json({ error: "Acción no reconocida. Use 'grant' o 'revoke'." });
    return;
  }

  res.status(405).json({ error: "Método no permitido" });
}
