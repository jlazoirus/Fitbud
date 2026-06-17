// Recordatorios por correo (REQ-24) y push de racha (REQ-38)
// Excepción a allowNewRuntimeDependency: se usa `web-push` para firmar notificaciones
// VAPID sin depender de un proveedor externo de pago. Autorizado explícitamente
// para REQ-38; el resto del proyecto sigue sin dependencias runtime nuevas.
// Vercel cron job (GET /api/notify) + baja de un solo clic (GET /api/notify?unsubscribe=TOKEN)
//
// Variables de entorno requeridas en Vercel (además de las ya existentes):
//   RESEND_API_KEY       — API key de resend.com
//   NOTIFY_FROM_EMAIL    — dirección remitente verificada, ej: recordatorios@fitbros.app
//   NOTIFY_APP_URL       — URL pública de la app, ej: https://fitbud-green.vercel.app
//   CRON_SECRET          — cadena aleatoria; Vercel la inyecta en Authorization al ejecutar cron
//
// vercel.json define: { "crons": [{ "path": "/api/notify", "schedule": "0 * * * *" }] }
// Vercel envía Authorization: Bearer CRON_SECRET en cada invocación automática del cron.
// Lenguaje REQ-31: todos los textos hablan de "tu plan"/"tu racha"; sin mención de IA.
//
// Push VAPID (REQ-38) — variables de entorno adicionales requeridas en Vercel:
//   VAPID_PRIVATE_KEY   — clave privada VAPID (solo servidor; nunca en cliente/repo)
//   VAPID_SUBJECT       — ej: mailto:j.lazo.ir@gmail.com
//   VAPID_PUBLIC_KEY    — clave pública (el cliente usa el literal; esta var es opcional)

import webpush from "web-push";

const VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY ||
  "BG6yyBKh5oUpZSu2OzOoxpn3THiWvZ3S8t528rEDRxn9-MKMz2UR16QkvoiYTHTgyXqDRGZiJOzgEh8tnqMp0_E";

let vapidReady = false;
try {
  if (process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT,
      VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    vapidReady = true;
  }
} catch (_) {}

function env() {
  return {
    url: (process.env.SUPABASE_URL || "").replace(/\/$/, ""),
    service: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    resendKey: process.env.RESEND_API_KEY || "",
    fromEmail: process.env.NOTIFY_FROM_EMAIL || "recordatorios@fitbros.app",
    appUrl: (process.env.NOTIFY_APP_URL || "https://fitbud-green.vercel.app").replace(/\/$/, ""),
    cronSecret: process.env.CRON_SECRET || "",
  };
}

function getHeaders(e) {
  return {
    apikey: e.service,
    Authorization: "Bearer " + e.service,
    Accept: "application/json",
  };
}

function mutateHeaders(e, extra) {
  return Object.assign({ "Content-Type": "application/json" }, getHeaders(e), extra || {});
}

async function supaGet(e, path) {
  const r = await fetch(e.url + path, { headers: getHeaders(e) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.message || data.error || "HTTP " + r.status);
  return Array.isArray(data) ? data : [data];
}

async function supaPatch(e, path, body) {
  const r = await fetch(e.url + path, {
    method: "PATCH",
    headers: mutateHeaders(e),
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.message || data.error || "HTTP " + r.status);
  }
}

async function supaPost(e, path, body, extraHeaders) {
  const r = await fetch(e.url + path, {
    method: "POST",
    headers: mutateHeaders(e, extraHeaders),
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.message || data.error || "HTTP " + r.status);
  return Array.isArray(data) ? data : data;
}

// ── Helpers de zona horaria ───────────────────────────────────────────────────

function safeTimezone(tz) {
  try { new Intl.DateTimeFormat("en", { timeZone: tz }); return tz; } catch { return "UTC"; }
}

function todayInTz(tz) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: safeTimezone(tz) }).format(new Date());
}

function currentHourInTz(tz) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: safeTimezone(tz), hour: "numeric", hour12: false,
  }).formatToParts(new Date());
  const h = parts.find(p => p.type === "hour");
  return h ? (parseInt(h.value, 10) % 24) : new Date().getUTCHours();
}

function dayOfWeekInTz(tz) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: safeTimezone(tz), weekday: "short",
  }).formatToParts(new Date());
  const w = parts.find(p => p.type === "weekday");
  if (!w) return new Date().getDay();
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(w.value);
}

// ── Verificar actividad pendiente del día ─────────────────────────────────────

async function checkPending(userId, dateStr, e) {
  const rows = await supaGet(e,
    `/rest/v1/day_log?user_id=eq.${userId}&log_date=eq.${dateStr}&select=state`
  );
  if (!rows.length) return { nutrition: false, training: false };
  const state = rows[0].state || {};

  const meals = state.meals || {};
  const mealIds = Object.keys(meals);
  const nutritionPending = mealIds.length > 0 && mealIds.some(id => !meals[id].done);

  const workoutDone = !!state.workoutDone;
  const override = state.workoutOverride || {};
  const isRestDay = override.type === "rest" || override.type === "missed_converted_rest";
  const trainingPending = !workoutDone && !isRestDay;

  return { nutrition: nutritionPending, training: trainingPending };
}

// ── Correo con Resend (fetch nativo, sin nuevas dependencias) ─────────────────

async function sendEmail(e, to, subject, html) {
  if (!e.resendKey) throw new Error("RESEND_API_KEY no configurada");
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + e.resendKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: e.fromEmail, to, subject, html }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.message || data.error || "Resend HTTP " + r.status);
  return data.id || "sent";
}

function buildEmailHtml(e, dateStr, unsubToken, type) {
  const label = type === "nutrition" ? "tu alimentación de hoy" : "tu entrenamiento de hoy";
  const link = `${e.appUrl}/?date=${dateStr}`;
  const unsubLink = `${e.appUrl}/api/notify?unsubscribe=${encodeURIComponent(unsubToken)}`;
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Actividad pendiente</title></head>
<body style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a;background:#fff">
  <p style="font-size:18px;font-weight:700;margin:0 0 14px">Todavía puedes completar ${label}</p>
  <p style="color:#555;margin:0 0 24px">El día está por cerrar y tu plan tiene actividad pendiente. Unos minutos son suficientes para mantener tu racha.</p>
  <a href="${link}"
     style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;
            padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px">
    Ver mi plan de hoy
  </a>
  <hr style="margin:36px 0;border:none;border-top:1px solid #eee">
  <p style="font-size:12px;color:#999;margin:0">
    Recibes este recordatorio porque lo activaste en tu perfil.
    <a href="${unsubLink}" style="color:#7c3aed;text-decoration:none">Desactivar recordatorios</a>
  </p>
</body></html>`;
}

// ── Baja de un solo clic ──────────────────────────────────────────────────────

async function handleUnsubscribe(token, e, res) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  const safeToken = String(token).replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeToken || safeToken.length < 10) {
    return res.status(400).send("<p>Enlace de baja no válido.</p>");
  }
  const rows = await supaGet(e,
    `/rest/v1/notification_preferences?unsubscribe_token=eq.${safeToken}&select=user_id`
  ).catch(() => []);
  if (!rows.length) {
    return res.status(400).send("<p>Enlace no válido o ya procesado.</p>");
  }
  await supaPatch(e,
    `/rest/v1/notification_preferences?unsubscribe_token=eq.${safeToken}`,
    { email_opt_in: false, updated_at: new Date().toISOString() }
  ).catch(() => null);
  return res.status(200).send(`<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Recordatorios desactivados</title></head>
<body style="font-family:sans-serif;max-width:400px;margin:60px auto;padding:24px;text-align:center;color:#1a1a1a">
  <p style="font-size:22px;font-weight:700">Recordatorios desactivados</p>
  <p style="color:#666;margin-bottom:28px">Ya no recibirás recordatorios de actividad. Puedes reactivarlos en tu perfil cuando quieras.</p>
  <a href="${e.appUrl}" style="color:#7c3aed;font-weight:600;text-decoration:none">Volver a la app</a>
</body></html>`);
}

// ── Job principal del cron ────────────────────────────────────────────────────

async function runJob(e, dryRun) {
  const results = { processed: 0, sent: 0, skipped: 0, errors: 0, dryRun, log: [] };

  // 1. Obtener usuarios con opt-in activo
  const prefs = await supaGet(e,
    "/rest/v1/notification_preferences?email_opt_in=eq.true" +
    "&select=user_id,timezone,notify_hour,enabled_days,notify_nutrition,notify_training,unsubscribe_token"
  );

  for (const pref of prefs) {
    const { user_id, timezone, notify_hour, enabled_days, notify_nutrition, notify_training, unsubscribe_token } = pref;
    const tz = safeTimezone(timezone || "UTC");
    const nowHour = currentHourInTz(tz);
    const nowDow = dayOfWeekInTz(tz);
    const dateStr = todayInTz(tz);

    // 2. ¿Es la hora configurada del usuario?
    if (nowHour !== (notify_hour ?? 20)) continue;

    // 3. ¿Día habilitado?
    const days = Array.isArray(enabled_days) ? enabled_days.map(Number) : [0,1,2,3,4,5,6];
    if (!days.includes(nowDow)) continue;

    // 4. Obtener email del usuario desde profiles
    const profileRows = await supaGet(e,
      `/rest/v1/profiles?id=eq.${user_id}&select=email,active`
    ).catch(() => []);
    if (!profileRows.length || !profileRows[0].email) continue;
    if (profileRows[0].active === false) continue;
    const userEmail = profileRows[0].email;

    // 5. Actividad pendiente
    const pending = await checkPending(user_id, dateStr, e)
      .catch(() => ({ nutrition: false, training: false }));

    const typesToSend = [];
    if (notify_nutrition && pending.nutrition) typesToSend.push("nutrition");
    if (notify_training && pending.training) typesToSend.push("training");

    results.processed++;

    for (const notifType of typesToSend) {
      const key = `${user_id}:${notifType}:${dateStr}`;

      // 6. Idempotencia: ¿ya se envió hoy?
      const existing = await supaGet(e,
        `/rest/v1/notification_log?idempotency_key=eq.${encodeURIComponent(key)}&select=id,status`
      ).catch(() => []);
      if (existing.length && existing[0].status === "sent") {
        results.skipped++;
        results.log.push({ user: user_id, type: notifType, date: dateStr, action: "already_sent" });
        continue;
      }

      // 7. Registrar intento (pending) si no existe
      let logId = existing.length ? existing[0].id : null;
      if (!logId && !dryRun) {
        const ins = await supaPost(e, "/rest/v1/notification_log",
          {
            user_id,
            notification_type: notifType,
            reference_date: dateStr,
            idempotency_key: key,
            status: "pending",
            attempted_at: new Date().toISOString(),
          },
          { Prefer: "return=representation" }
        ).catch(() => null);
        logId = ins && ins[0] && ins[0].id;
      }

      if (dryRun) {
        results.skipped++;
        results.log.push({ user: user_id, type: notifType, date: dateStr, action: "dry_run", email: userEmail });
        continue;
      }

      // 8. Enviar correo
      try {
        const subject = notifType === "nutrition"
          ? "Tienes comidas pendientes para hoy"
          : "Tienes entrenamiento pendiente para hoy";
        const emailId = await sendEmail(e, userEmail, subject,
          buildEmailHtml(e, dateStr, unsubscribe_token, notifType)
        );
        if (logId) {
          await supaPatch(e, `/rest/v1/notification_log?id=eq.${logId}`,
            { status: "sent", delivered_at: new Date().toISOString() }
          ).catch(() => null);
        }
        results.sent++;
        results.log.push({ user: user_id, type: notifType, date: dateStr, action: "sent", emailId });
      } catch (err) {
        if (logId) {
          await supaPatch(e, `/rest/v1/notification_log?id=eq.${logId}`,
            { status: "error", error_message: err.message }
          ).catch(() => null);
        }
        results.errors++;
        results.log.push({ user: user_id, type: notifType, date: dateStr, action: "error", error: err.message });
      }
    }
  }

  // ── Push de racha (REQ-38) ──────────────────────────────────────────────────
  if (vapidReady) {
    results.push = { sent: 0, skipped: 0, errors: 0 };

    const pushPrefs = await supaGet(e,
      "/rest/v1/notification_preferences?push_opt_in=eq.true" +
      "&select=user_id,timezone,notify_hour,enabled_days"
    ).catch(() => []);

    for (const pref of pushPrefs) {
      const { user_id, timezone, notify_hour, enabled_days } = pref;
      const tz = safeTimezone(timezone || "UTC");
      const nowHour = currentHourInTz(tz);
      const nowDow  = dayOfWeekInTz(tz);
      const dateStr = todayInTz(tz);

      if (nowHour !== (notify_hour ?? 20)) continue;
      const days = Array.isArray(enabled_days) ? enabled_days.map(Number) : [0,1,2,3,4,5,6];
      if (!days.includes(nowDow)) continue;

      // Verificar usuario activo
      const profileRows = await supaGet(e,
        `/rest/v1/profiles?id=eq.${user_id}&select=active`
      ).catch(() => []);
      if (!profileRows.length || profileRows[0].active === false) continue;

      // Actividad pendiente
      const pending = await checkPending(user_id, dateStr, e)
        .catch(() => ({ nutrition: false, training: false }));
      if (!pending.nutrition && !pending.training) continue;

      // Idempotencia
      const key = `${user_id}:push_streak:${dateStr}`;
      const existing = await supaGet(e,
        `/rest/v1/notification_log?idempotency_key=eq.${encodeURIComponent(key)}&select=id,status`
      ).catch(() => []);
      if (existing.length && existing[0].status === "sent") {
        results.push.skipped++;
        results.log.push({ user: user_id, type: "push_streak", date: dateStr, action: "already_sent" });
        continue;
      }

      // Obtener suscripciones del usuario
      const subs = await supaGet(e,
        `/rest/v1/push_subscriptions?user_id=eq.${user_id}&select=endpoint,keys_p256dh,keys_auth`
      ).catch(() => []);
      if (!subs.length) continue;

      // Registrar intento
      let logId = existing.length ? existing[0].id : null;
      if (!logId && !dryRun) {
        const ins = await supaPost(e, "/rest/v1/notification_log", {
          user_id,
          notification_type: "push_streak",
          reference_date: dateStr,
          idempotency_key: key,
          status: "pending",
          attempted_at: new Date().toISOString(),
        }, { Prefer: "return=representation" }).catch(() => null);
        logId = ins && ins[0] && ins[0].id;
      }

      if (dryRun) {
        results.push.skipped++;
        results.log.push({ user: user_id, type: "push_streak", date: dateStr, action: "dry_run" });
        continue;
      }

      // Enviar push a todas las suscripciones del usuario
      const payload = JSON.stringify({
        title: "Tu racha te espera",
        body: "Tienes actividad pendiente. Unos minutos bastan para mantener tu racha.",
        tag: "fitbros-streak",
        url: `/?date=${dateStr}`,
      });

      let sendOk = false;
      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth } },
            payload
          );
          sendOk = true;
        } catch (err) {
          if (err.statusCode === 410) {
            // Suscripción caducada: eliminarla
            await fetch(
              `${e.url}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(sub.endpoint)}`,
              { method: "DELETE", headers: mutateHeaders(e) }
            ).catch(() => null);
          }
          results.log.push({ user: user_id, type: "push_streak", date: dateStr, action: "push_error", error: err.message });
        }
      }

      if (logId) {
        await supaPatch(e, `/rest/v1/notification_log?id=eq.${logId}`,
          sendOk
            ? { status: "sent",  delivered_at: new Date().toISOString() }
            : { status: "error", error_message: "Ninguna suscripción entregada" }
        ).catch(() => null);
      }

      if (sendOk) {
        results.push.sent++;
        results.log.push({ user: user_id, type: "push_streak", date: dateStr, action: "push_sent" });
      } else {
        results.push.errors++;
      }
    }
  }

  return results;
}

// ── Handler de Vercel ─────────────────────────────────────────────────────────

export default async function handler(req, res) {
  const e = env();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const url = new URL(req.url, "https://x");
  const unsubToken = url.searchParams.get("unsubscribe");

  // Baja de un solo clic (no requiere autenticación)
  if (unsubToken) {
    if (!e.url || !e.service) return res.status(503).json({ error: "DB no configurada" });
    return handleUnsubscribe(unsubToken, e, res);
  }

  // Job del cron — verificar CRON_SECRET
  const authHeader = req.headers["authorization"] || "";
  const isVercelCron = req.headers["x-vercel-cron"] === "1";
  if (!isVercelCron && (!e.cronSecret || authHeader !== "Bearer " + e.cronSecret)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!e.url || !e.service) return res.status(500).json({ error: "Supabase no configurado" });

  const dryRun = url.searchParams.get("dry_run") === "true";
  try {
    const results = await runJob(e, dryRun);
    return res.status(200).json({ ok: true, ...results });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
