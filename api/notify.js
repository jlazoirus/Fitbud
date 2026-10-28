// Recordatorios por correo (REQ-24) y push de racha (REQ-38); journey según la
// ausencia —día, rescate, última llamada, regreso— (REQ-285, docs/reminders-journey.md)
// Excepción a allowNewRuntimeDependency: se usa `web-push` para firmar notificaciones
// VAPID sin depender de un proveedor externo de pago. Autorizado explícitamente
// para REQ-38; el resto del proyecto sigue sin dependencias runtime nuevas.
// Vercel cron job (GET /api/notify) + baja de un solo clic (GET /api/notify?unsubscribe=TOKEN)
//
// Variables de entorno requeridas en Vercel (además de las ya existentes):
//   RESEND_API_KEY       — API key de resend.com
//   NOTIFY_FROM_EMAIL    — dirección remitente verificada, ej: recordatorios@fitbros.app
//   NOTIFY_APP_URL       — URL pública de la app, ej: https://evolvapp.club
//   CRON_SECRET          — cadena aleatoria; Vercel la inyecta en Authorization al ejecutar cron
//
// vercel.json define: { "crons": [{ "path": "/api/notify", "schedule": "0 8 * * *" }] }
// Limitación Vercel Hobby: mínimo un disparo diario; granularidad horaria requiere plan Pro.
// Vercel envía Authorization: Bearer CRON_SECRET en cada invocación automática del cron.
// REQ-266: ese cron diario (03:00 en Lima) solo mantiene despierto Supabase. El
// envío lo dispara cada hora .github/workflows/notify-hourly.yml con el mismo
// CRON_SECRET (secreto del repo en GitHub).
// Lenguaje REQ-31: todos los textos hablan de "tu plan"/"tu racha"; sin mención de IA.
//
// Push VAPID (REQ-38) — variables de entorno adicionales requeridas en Vercel:
//   VAPID_PRIVATE_KEY   — clave privada VAPID (solo servidor; nunca en cliente/repo)
//   VAPID_SUBJECT       — ej: mailto:j.lazo.ir@gmail.com
//   VAPID_PUBLIC_KEY    — clave pública (el cliente usa el literal; esta var es opcional)

import webpush from "web-push";
import { createHmac, timingSafeEqual } from "node:crypto";

const VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY ||
  "BCLTdYHpdcITrwUwXO1J0OYSaIuHjtPKk3zcc2E3isQAV51IQG4OPOTOdP5KwIm5z_baw-mN4qOeZuAtvzPyHb8";

// REQ-281: espacios o saltos de línea al pegar en Vercel invalidaban la clave
// sin aviso. Se recortan, y si el push no queda listo la respuesta del job
// dice por qué (sin mostrar valores).
let vapidReady = false;
let vapidIssue = "";
try {
  const privateKey = String(process.env.VAPID_PRIVATE_KEY || "").trim();
  const subject = String(process.env.VAPID_SUBJECT || "").trim();
  if (!privateKey) vapidIssue = "falta VAPID_PRIVATE_KEY";
  else if (!subject) vapidIssue = "falta VAPID_SUBJECT";
  else {
    webpush.setVapidDetails(subject, VAPID_PUBLIC_KEY.trim(), privateKey);
    vapidReady = true;
  }
} catch (err) {
  vapidIssue = "VAPID inválida: " + String((err && err.message) || err);
}

function env() {
  return {
    url: (process.env.SUPABASE_URL || "").replace(/\/$/, ""),
    service: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    resendKey: process.env.RESEND_API_KEY || "",
    fromEmail: process.env.NOTIFY_FROM_EMAIL || "recordatorios@fitbros.app",
    appUrl: (process.env.NOTIFY_APP_URL || "https://evolvapp.club").replace(/\/$/, ""),
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

// REQ-266: se envía en el primer disparo a la hora elegida o después, dentro
// del mismo día local. Un disparo horario que llega tarde (GitHub Actions puede
// demorarse) no pierde el aviso; la idempotencia por día evita repetirlo.
function isNotifyTime(notifyHour, tz) {
  return currentHourInTz(tz) >= (notifyHour ?? 20);
}

// ── Journey de recordatorios (REQ-285) ────────────────────────────────────────
// Diseño: docs/reminders-journey.md. Una decisión pura por usuario y día según
// cuánto lleva sin registrar (gap): día en juego, rescate de ayer, última
// llamada (solo push) y regreso a los 2/5/7/14/30 días; después, silencio.

const ACTIVITY_WINDOW_DAYS = 60;
// REQ-296: quien nunca eligió sus avisos (sin fila de preferencias) recibe
// solo los correos de seguimiento a esta hora local. La app aún no guarda la
// zona horaria en el perfil: se asume la del mercado inicial.
const FOLLOWUP_HOUR = 20;
const FOLLOWUP_DEFAULT_TZ = "America/Lima";
// Sin plan ni registros (no terminó el perfil): tres correos y silencio.
const NO_PLAN_STEPS = new Set(["comeback_2", "comeback_7", "comeback_30"]);
const LAST_CALL_MIN_STREAK = 3;
const LAST_CALL_LATEST_HOUR = 22;
// Cada etapa de regreso es una ventana: sale una vez por ausencia, el primer
// día habilitado dentro de ella. Después de 45 días no se escribe más.
export const COMEBACK_STEPS = [
  { step: "comeback_2", from: 2, to: 3 },
  { step: "comeback_5", from: 5, to: 6 },
  { step: "comeback_7", from: 7, to: 13 },
  { step: "comeback_14", from: 14, to: 29 },
  { step: "comeback_30", from: 30, to: 45 },
];
// REQ-295: quien sigue registrando pero dejó de entrenar. Una vez por pausa en
// cada ventana (días desde el último entreno), y solo en un día que toca.
export const TRAINING_LAPSE_STEPS = [
  { step: "training_lapse_4", from: 4, to: 10 },
  { step: "training_lapse_11", from: 11, to: 30 },
];
const TRAINING_LAPSE_MIN_MISSED = 2;
// Mismas etiquetas que GOAL_OPTIONS en la app. Solo van dentro del correo.
const GOAL_LABELS = { deficit: "Bajar grasa", mantenimiento: "Recomponer mi cuerpo", volumen: "Ganar músculo" };

const isYmd = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
export function addDaysYmd(ds, n) {
  const d = new Date(ds + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function daysBetweenYmd(a, b) {
  return Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 86400000);
}

function trainedInState(st) {
  const ex = st.workoutExecution;
  return !!st.workoutDone
    || !!(ex && (ex.status === "completed" || ex.status === "partial"))
    || (Array.isArray(st.manualActivities) && st.manualActivities.some((a) => a && a.sport));
}

// Mismo criterio que dayActive() en la app: algo registrado ese día.
export function dayHasActivity(st) {
  if (!st || typeof st !== "object") return false;
  const meals = st.meals && typeof st.meals === "object" ? Object.values(st.meals) : [];
  if (meals.some((m) => m && m.done)) return true;
  if (Array.isArray(st.extras) && st.extras.some((x) => x && x.done)) return true;
  if (trainedInState(st)) return true;
  const steps = st.workoutExecution && Array.isArray(st.workoutExecution.steps) ? st.workoutExecution.steps : [];
  return steps.some((s) => s && (s.status === "done" || s.status === "skipped" || (Array.isArray(s.sets) && s.sets.some((x) => x && x.done))));
}

// Lo que falta hoy según la fila del día. REQ-265: el cliente guarda restDay
// y workoutOverride ("descanso") en cada guardado. REQ-282: un día abierto sin
// comidas preparadas ni nada registrado es un día que no empezó.
export function pendingFromState(st) {
  const meals = (st && st.meals) || {};
  const ids = Object.keys(meals);
  const notStarted = !ids.length && !(Array.isArray(st.extras) && st.extras.length) && !trainedInState(st);
  const nutrition = ids.length > 0 && ids.some((id) => !(meals[id] && meals[id].done));
  const isRestDay = st.restDay === true || st.workoutOverride === "descanso";
  return { nutrition, training: !trainedInState(st) && !isRestDay, notStarted };
}

// REQ-295: días desde el último entreno (o desde el inicio del plan) si hoy
// toca entrenar y en la pausa hubo al menos dos días que tocaba (los descansos
// planificados no cuentan). Sin la fila de hoy no se sabe si toca: no avisa.
export function trainingLapse(rows, today, planStart) {
  const todayRow = rows.find((r) => r.log_date === today);
  if (!todayRow || !pendingFromState(todayRow).training) return null;
  const lastTrain = rows.filter(trainedInState).map((r) => r.log_date).sort().pop() || null;
  const ref = lastTrain || planStart;
  if (!ref) return null;
  const since = daysBetweenYmd(ref, today);
  const stage = TRAINING_LAPSE_STEPS.find((s) => since >= s.from && since <= s.to);
  if (!stage) return null;
  const missed = rows.filter((r) => r.log_date > ref && r.log_date < today && !trainedInState(r)
    && r.restDay !== true && r.workoutOverride !== "descanso").length;
  if (missed < TRAINING_LAPSE_MIN_MISSED) return null;
  return { step: stage.step, ref, since };
}

// Última llamada: dos horas después del aviso del día, desde las 21:00 y
// nunca después de las 22:00.
export function lastCallHour(notifyHour) {
  const h = Math.max(21, (notifyHour ?? 20) + 2);
  return h <= LAST_CALL_LATEST_HOUR ? h : null;
}

/**
 * Decide el mensaje del día para un usuario. Puro: sin red ni reloj.
 * ctx: { today, hour, notifyHour, rows:[{log_date,...estado}], engagement,
 *        planStart, planEnd, planWeeks, goal, wantNutrition, wantTraining }
 * Devuelve { step, ref, ... } o null; `lastCall` indica si además toca la
 * última llamada por push.
 */
export function planReminder(ctx) {
  const { today } = ctx;
  if (!isYmd(today) || ctx.hour < (ctx.notifyHour ?? 20)) return null;
  const planStart = isYmd(ctx.planStart) ? ctx.planStart : null;
  if (planStart && today < planStart) return null;
  const planEnded = isYmd(ctx.planEnd) && today > ctx.planEnd;
  const rows = (ctx.rows || []).filter((r) => r && isYmd(r.log_date) && r.log_date <= today && (!planStart || r.log_date >= planStart));
  const active = rows.filter(dayHasActivity);
  const last = active.map((r) => r.log_date).sort().pop() || null;
  // REQ-296: quien no terminó el perfil no tiene plan ni registros: la
  // referencia es el alta de la cuenta.
  const noPlan = !planStart && !last;
  const ref = last || planStart || (noPlan && isYmd(ctx.accountCreated) ? ctx.accountCreated : null);
  if (!ref) return null;
  const gap = daysBetweenYmd(ref, today);
  const yesterday = addDaysYmd(today, -1);

  // El resumen de la app vale solo si es del ciclo actual.
  const raw = ctx.engagement && typeof ctx.engagement === "object" ? ctx.engagement : null;
  const eng = raw && (!planStart || raw.cycleStart === planStart) ? raw : null;
  const engStreak = eng ? Math.max(0, Number(eng.streak) || 0) : 0;
  const progress = {
    activeDays: eng ? Number(eng.activeDays) || 0 : active.length,
    workouts: eng ? Number(eng.workouts) || 0 : rows.filter(trainedInState).length,
    bestStreak: eng ? Number(eng.bestStreak) || 0 : 0,
    week: null,
    weeks: Number(ctx.planWeeks) || null,
    goal: GOAL_LABELS[ctx.goal] || null,
  };
  if (planStart && !planEnded) {
    const w = Math.floor(daysBetweenYmd(planStart, today) / 7) + 1;
    progress.week = progress.weeks ? Math.min(w, progress.weeks) : w;
  }

  // Rescate: ayer quedó sin cumplir y hasta anteayer había racha de 2+ días.
  // La ventana de corrección (REQ-23) es solo el día anterior. La app lo deja
  // calculado (rescueDate) si se abrió hoy; si no, la racha llega a anteayer.
  let rescue = 0;
  if (eng && eng.rescueDate === yesterday) rescue = Math.max(0, Number(eng.rescueStreak) || 0);
  else if (eng && eng.streakThrough === addDaysYmd(today, -2)) rescue = engStreak;
  if (!ctx.followupOnly && !planEnded && rescue >= 2 && (!planStart || yesterday >= planStart)) {
    return { step: "rescue", ref: today, date: yesterday, streak: rescue, gap, progress };
  }

  if (gap <= 1) {
    if (planEnded) return null;
    // REQ-295: registra, pero lleva días sin entrenar. Reemplaza el aviso del
    // día (nunca dos correos el mismo día) y sale aunque la racha esté a salvo.
    const lapse = ctx.wantTraining !== false ? trainingLapse(rows, today, planStart) : null;
    if (lapse) return { step: lapse.step, ref: lapse.ref, date: today, since: lapse.since, gap, progress };
    if (ctx.followupOnly) return null; // REQ-296: el aviso del día es solo para quien lo activó
    if (eng && eng.streakThrough === today) return null; // la racha de hoy ya está a salvo
    const streak = eng && eng.streakThrough === yesterday ? engStreak : 0;
    // REQ-282: sin la fila de hoy (no abrió la app) o con la fila sin nada,
    // el día no empezó: cuenta como comidas pendientes. Sin la fila no se sabe
    // si toca entrenar (puede ser descanso), así que el entreno solo no avisa.
    const todayRow = rows.find((r) => r.log_date === today);
    const pending = todayRow ? pendingFromState(todayRow) : { nutrition: false, training: false, notStarted: true };
    const wantN = ctx.wantNutrition !== false, wantT = ctx.wantTraining !== false;
    let missing;
    if (pending.notStarted && wantN) missing = "day";
    else {
      const n = pending.nutrition && wantN;
      const t = pending.training && wantT;
      if (!n && !t) return null;
      missing = n && t ? "both" : n ? "nutrition" : "training";
    }
    const callHour = lastCallHour(ctx.notifyHour);
    const lastCall = streak >= LAST_CALL_MIN_STREAK && callHour != null && ctx.hour >= callHour && ctx.hour <= LAST_CALL_LATEST_HOUR;
    return { step: "day", ref: today, date: today, streak, missing, lastCall, gap, progress };
  }

  const stage = COMEBACK_STEPS.find((s) => gap >= s.from && gap <= s.to);
  if (!stage) return null;
  if (noPlan && !NO_PLAN_STEPS.has(stage.step)) return null;
  return { step: stage.step, ref, gap, never: !last, noPlan, planEnded, progress };
}

// ── Textos (REQ-31: plan, racha, coach; sin datos corporales) ─────────────────
// El push se ve en la pantalla bloqueada: sin objetivo ni datos de progreso
// corporal. El objetivo con nombre va solo dentro del correo, nunca en el asunto.

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const MISSING_TEXT = {
  both: "registrar tus comidas y tu entreno",
  nutrition: "registrar tus comidas",
  training: "tu entreno",
  day: "registrar tu día",
};

function progressSentence(p) {
  const parts = [plural(p.activeDays, "día registrado", "días registrados")];
  if (p.workouts) parts.push(plural(p.workouts, "entreno", "entrenos"));
  return `Llevas ${parts.join(" y ")} en este plan.`;
}
function achievementsLine(p) {
  const parts = [];
  if (p.bestStreak >= 2) parts.push(`Mejor racha: ${p.bestStreak} días`);
  if (p.workouts) parts.push(plural(p.workouts, "entreno", "entrenos"));
  if (p.activeDays) parts.push(plural(p.activeDays, "día registrado", "días registrados"));
  return parts.join(" · ");
}
function weekLine(d) {
  const p = d.progress || {};
  if (d.planEnded || !p.week) return "";
  return p.weeks ? `Vas en la semana ${p.week} de ${p.weeks} de tu plan.` : `Vas en la semana ${p.week} de tu plan.`;
}

/**
 * Texto de una decisión. `title`/`body` son el push; `subject` y `paragraphs`
 * el correo. `url` abre el día correcto y deja la etapa para medir aperturas.
 */
export function reminderMessage(d, kind) {
  const p = d.progress || {};
  const days = (n) => plural(n, "día", "días");
  let title, body, subject, paragraphs, cta = "Volver a mi plan";
  let url = `/?r=${d.step}`;
  if (kind === "last_call") {
    title = "Quedan pocas horas";
    body = `Registra lo de hoy y tu racha de ${days(d.streak)} sigue.`;
    return { title, body, url: `/?date=${d.date}&r=last_call`, tag: "fitbros-streak" };
  }
  if (d.step === "day") {
    const missing = MISSING_TEXT[d.missing] || MISSING_TEXT.day;
    const notStarted = d.missing === "day";
    if (d.streak > 0) {
      title = `Tu racha de ${days(d.streak)} sigue en juego`;
      body = notStarted
        ? `Aún no has empezado tu plan de hoy. Regístralo para sumar el día ${d.streak + 1}.`
        : `Falta ${missing} para sumar el día ${d.streak + 1}.`;
    } else {
      title = "Tu plan de hoy te espera";
      body = notStarted ? "Aún no has empezado tu plan de hoy. Hoy puede empezar tu racha." : `Falta ${missing}. Hoy puede empezar tu racha.`;
    }
    subject = title;
    paragraphs = [body, notStarted
      ? "Abre tu plan y marca lo que vayas comiendo: unos minutos bastan para que el día cuente."
      : "Unos minutos bastan: marca lo que ya hiciste y el día cuenta."];
    cta = "Ver mi plan de hoy";
    url = `/?date=${d.date}&r=day`;
  } else if (d.step === "rescue") {
    title = "Ayer quedó sin registrar";
    body = `Si lo cumpliste, regístralo y tu racha de ${days(d.streak)} sigue.`;
    subject = `¿Cumpliste ayer? Tu racha de ${days(d.streak)} sigue en pie`;
    paragraphs = [body, "Puedes completar el día anterior hasta que termine hoy."];
    cta = "Registrar ayer";
    url = `/?date=${d.date}&r=rescue`;
  } else if (d.step.startsWith("training_lapse")) {
    const first = d.step === "training_lapse_4";
    title = first ? "¿Retomamos el entreno?" : "Tu entreno te espera";
    body = first
      ? `Llevas ${days(d.since)} sin entrenar. Hoy te toca: si vas justo de tiempo, la versión de 20 minutos también cuenta.`
      : `Llevas ${days(d.since)} sin entrenar. Retomar con una sesión suave está bien: tu plan se ajusta.`;
    subject = title;
    paragraphs = [body, "Los descansos planificados no cuentan: solo miramos los días en que te tocaba entrenar."];
    cta = "Ver mi entreno de hoy";
    url = `/?date=${d.date}&r=${d.step}`;
  } else if (d.noPlan) {
    // REQ-296: no terminó el perfil; no hay plan todavía.
    const byStep = {
      comeback_2: ["Tu plan está a dos minutos", "Termina tu perfil y te armamos tu primera semana de comidas y entrenos."],
      comeback_7: ["Tu plan te está esperando", "Solo faltan unas preguntas para armarte tu primera semana."],
      comeback_30: ["Aquí seguimos", "Cuando quieras, termina tu perfil y te armamos tu plan. Es nuestro último correo hasta entonces."],
    };
    [title, body] = byStep[d.step] || byStep.comeback_2;
    subject = title;
    paragraphs = [body];
    cta = "Terminar mi perfil";
  } else if (d.never) {
    // Nunca registró nada: activación, sin hablar de progreso.
    const byStep = {
      comeback_2: ["Tu plan está listo", "Aún no registras tu primer día. Empieza con una comida: ahí arranca tu racha."],
      comeback_5: ["Tu objetivo sigue en pie", "Tu plan está preparado. Registrar una comida es el primer paso."],
      comeback_7: ["Tu plan sigue listo", "Empieza cuando quieras; también puedes reiniciarlo desde la semana 1."],
      comeback_14: ["Tu plan sigue listo", "Tus comidas y entrenos siguen preparados. Empieza con una comida."],
      comeback_30: ["Aquí sigue tu plan", "Vuelve cuando quieras. Es nuestro último recordatorio hasta que empieces."],
    };
    [title, body] = byStep[d.step] || byStep.comeback_2;
    subject = title;
    paragraphs = [body, p.goal ? `Tu objetivo: ${p.goal}.` : "", weekLine(d)].filter(Boolean);
  } else if (d.step === "comeback_2") {
    title = "Tu racha se reinició, tu progreso no";
    body = `${progressSentence(p)} Hoy puede empezar tu siguiente racha.`;
    subject = title;
    paragraphs = [progressSentence(p), p.bestStreak >= 2 ? `Tu mejor racha fue de ${p.bestStreak} días: la siguiente empieza con un registro.` : "Hoy puede empezar tu siguiente racha."];
  } else if (d.step === "comeback_5") {
    title = "Tu objetivo sigue en pie";
    body = d.planEnded ? "Tu ciclo terminó: empieza el siguiente cuando quieras." : `${weekLine(d)} Retomar toma una comida registrada.`.trim();
    subject = title;
    paragraphs = [p.goal ? `Tu objetivo: ${p.goal}.` : "", d.planEnded ? "Tu ciclo terminó: empieza el siguiente cuando quieras." : weekLine(d), "Retomar toma una comida registrada."].filter(Boolean);
  } else if (d.step === "comeback_7") {
    title = "Una semana sin registrar";
    body = d.planEnded
      ? "Tu ciclo terminó. Empieza uno nuevo cuando quieras: tu historial se conserva."
      : "Retoma donde ibas o empieza de nuevo desde la semana 1. Tu historial se conserva.";
    subject = title;
    paragraphs = [body, progressSentence(p)];
  } else if (d.step === "comeback_14") {
    const line = achievementsLine(p);
    title = "Mira lo que ya lograste";
    body = line ? `${line}. Volver toma un registro.` : "Tu progreso sigue guardado. Volver toma un registro.";
    subject = title;
    paragraphs = [line ? `${line}.` : "Tu progreso sigue guardado.", p.goal ? `Tu objetivo: ${p.goal}.` : "", "Volver toma un registro."].filter(Boolean);
  } else {
    title = "Aquí sigue tu plan";
    body = "Tu progreso está guardado. Es nuestro último recordatorio hasta que vuelvas.";
    subject = title;
    paragraphs = ["Tu progreso está guardado y tu plan sigue disponible.", "Este es nuestro último recordatorio hasta que vuelvas."];
  }
  return { title, body, subject, paragraphs, cta, url, tag: d.step === "day" || d.step === "rescue" ? "fitbros-streak" : "fitbros-comeback" };
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

// Todo el texto sale de reminderMessage(): ningún dato escrito por el usuario.
export function buildEmailHtml(e, msg, unsubToken, opts = {}) {
  const link = e.appUrl + msg.url;
  const unsubLink = `${e.appUrl}/api/notify?unsubscribe=${encodeURIComponent(unsubToken || "")}`;
  const paragraphs = (msg.paragraphs || [msg.body])
    .map((t) => `<p style="color:#444;font-size:15px;line-height:1.5;margin:0 0 12px">${t}</p>`)
    .join("\n  ");
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${msg.subject}</title></head>
<body style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a;background:#fff">
  <p style="font-size:19px;font-weight:700;margin:0 0 14px">${msg.title}</p>
  ${paragraphs}
  <a href="${link}"
     style="display:inline-block;background:#101010;color:#d6ff3a;text-decoration:none;
            padding:12px 28px;border-radius:10px;font-weight:700;font-size:15px;margin-top:12px">
    ${msg.cta}
  </a>
  <hr style="margin:36px 0;border:none;border-top:1px solid #eee">
  <p style="font-size:12px;color:#777;margin:0">
    ${opts.followup
      ? "Te escribimos porque tienes una cuenta en Evolv y llevas días sin usar tu plan."
      : "Recibes estos recordatorios porque los activaste en tu perfil."}
    <a href="${unsubLink}" style="color:#1a1a1a">${opts.followup ? "No recibir más estos correos" : "Desactivar recordatorios"}</a>
  </p>
</body></html>`;
}

// ── Datos por usuario ─────────────────────────────────────────────────────────

const DAY_FIELDS = [
  "log_date", "meals:state->meals", "extras:state->extras", "workoutDone:state->workoutDone",
  "workoutExecution:state->workoutExecution", "manualActivities:state->manualActivities",
  "restDay:state->restDay", "workoutOverride:state->workoutOverride",
].join(",");

function loadRows(e, userId, today) {
  const from = addDaysYmd(today, -ACTIVITY_WINDOW_DAYS);
  return supaGet(e,
    `/rest/v1/day_log?user_id=eq.${userId}&log_date=gte.${from}&log_date=lte.${today}&select=${DAY_FIELDS}&order=log_date.desc`
  );
}

async function loadUserContext(e, userId, today) {
  const profiles = await supaGet(e,
    `/rest/v1/profiles?id=eq.${userId}&select=email,active,goal:prefs->>goal,` +
    "planStartDate:prefs->>planStartDate,planEndDate:prefs->>planEndDate,planDurationWeeks:prefs->>planDurationWeeks"
  );
  const profile = profiles[0];
  if (!profile || profile.active === false) return null;
  return { profile, rows: await loadRows(e, userId, today) };
}

// ── Envío idempotente ─────────────────────────────────────────────────────────
// Cada envío exige leer y registrar antes su intento en notification_log. Si no
// se puede (red, o una etapa nueva sin la migración del CHECK), no se envía:
// sin registro, el disparo de la hora siguiente lo repetiría.

async function deliver(e, dryRun, results, counter, job) {
  const { userId, type, keys, refDate, step, send } = job;
  const entry = { user: userId, type, step, date: refDate };
  const inList = keys.map((k) => encodeURIComponent(k)).join(",");
  const existing = await supaGet(e,
    `/rest/v1/notification_log?idempotency_key=in.(${inList})&select=id,status,idempotency_key`
  ).catch(() => null);
  if (existing === null) {
    counter.errors++;
    results.log.push({ ...entry, action: "log_unavailable" });
    return "log_unavailable";
  }
  if (existing.some((r) => r.status === "sent")) {
    counter.skipped++;
    results.log.push({ ...entry, action: "already_sent" });
    return "already_sent";
  }
  if (dryRun) {
    counter.skipped++;
    results.log.push({ ...entry, action: "dry_run" });
    return "dry_run";
  }
  let logId = (existing.find((r) => r.idempotency_key === keys[0]) || {}).id || null;
  if (!logId) {
    const ins = await supaPost(e, "/rest/v1/notification_log", {
      user_id: userId,
      notification_type: type,
      reference_date: refDate,
      idempotency_key: keys[0],
      status: "pending",
      attempted_at: new Date().toISOString(),
    }, { Prefer: "return=representation" }).catch(() => null);
    logId = ins && ins[0] && ins[0].id;
  }
  if (!logId) {
    counter.errors++;
    results.log.push({ ...entry, action: "log_failed" });
    return "log_failed";
  }
  try {
    const out = await send();
    await supaPatch(e, `/rest/v1/notification_log?id=eq.${logId}`,
      { status: "sent", delivered_at: new Date().toISOString() }
    ).catch(() => null);
    counter.sent++;
    results.log.push({ ...entry, action: "sent", ...(out && typeof out === "object" ? out : {}) });
    return "sent";
  } catch (err) {
    await supaPatch(e, `/rest/v1/notification_log?id=eq.${logId}`,
      { status: "error", error_message: err.message }
    ).catch(() => null);
    counter.errors++;
    results.log.push({ ...entry, action: "error", error: err.message });
    return "error";
  }
}

async function sendPush(e, subs, msg) {
  const payload = JSON.stringify({ title: msg.title, body: msg.body, tag: msg.tag, url: msg.url });
  let ok = false;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth } },
        payload
      );
      ok = true;
    } catch (err) {
      if (err.statusCode === 410) {
        // Suscripción caducada: eliminarla
        await fetch(
          `${e.url}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(sub.endpoint)}`,
          { method: "DELETE", headers: mutateHeaders(e) }
        ).catch(() => null);
      }
    }
  }
  if (!ok) throw new Error("Ninguna suscripción entregada");
  return { channel: "push" };
}

// ── Baja de un solo clic ──────────────────────────────────────────────────────

// REQ-296: quien no tiene fila de preferencias no tiene unsubscribe_token. Su
// enlace lleva el id firmado con CRON_SECRET (solo lo conoce el servidor).
export function followupUnsubToken(e, userId) {
  if (!e.cronSecret || !userId) return "";
  const sig = createHmac("sha256", e.cronSecret).update("unsubscribe:" + userId).digest("base64url").slice(0, 32);
  return `u-${userId}-${sig}`;
}
function followupUserFromToken(e, token) {
  const m = /^u-([0-9a-f-]{36})-[A-Za-z0-9_-]{32}$/.exec(token);
  if (!m) return null;
  const expected = Buffer.from(followupUnsubToken(e, m[1]));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given) ? m[1] : null;
}

function unsubscribedPage(e) {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Recordatorios desactivados</title></head>
<body style="font-family:sans-serif;max-width:400px;margin:60px auto;padding:24px;text-align:center;color:#1a1a1a">
  <p style="font-size:22px;font-weight:700">Recordatorios desactivados</p>
  <p style="color:#666;margin-bottom:28px">Ya no recibirás recordatorios de actividad. Puedes reactivarlos en tu perfil cuando quieras.</p>
  <a href="${e.appUrl}" style="color:#7c3aed;font-weight:600;text-decoration:none">Volver a la app</a>
</body></html>`;
}

async function handleUnsubscribe(token, e, res) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  const safeToken = String(token).replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeToken || safeToken.length < 10) {
    return res.status(400).send("<p>Enlace de baja no válido.</p>");
  }
  // REQ-296: baja de los correos de seguimiento. Crear la fila con el correo
  // apagado es elegir: desde ahí ya no recibe seguimiento (runFollowups).
  const followUser = followupUserFromToken(e, safeToken);
  if (followUser) {
    const ok = await supaPost(e, "/rest/v1/notification_preferences?on_conflict=user_id",
      { user_id: followUser, email_opt_in: false, updated_at: new Date().toISOString() },
      { Prefer: "resolution=merge-duplicates,return=minimal" }
    ).then(() => true).catch(() => false);
    if (!ok) return res.status(500).send("<p>No pudimos procesar la baja. Inténtalo de nuevo en unos minutos.</p>");
    return res.status(200).send(unsubscribedPage(e));
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
  return res.status(200).send(unsubscribedPage(e));
}

// ── Job principal del cron ────────────────────────────────────────────────────

async function runJob(e, dryRun) {
  const results = { processed: 0, sent: 0, skipped: 0, errors: 0, dryRun, log: [] };
  // REQ-281: la respuesta siempre dice si el push está listo.
  results.push = vapidReady ? { ready: true, sent: 0, skipped: 0, errors: 0 } : { ready: false, issue: vapidIssue };

  // select=*: la columna engagement (resumen de racha que escribe la app) llega
  // con supabase/notifications_journey.sql; sin ella la consulta sigue valiendo.
  const prefs = await supaGet(e,
    "/rest/v1/notification_preferences?or=(email_opt_in.eq.true,push_opt_in.eq.true)&select=*"
  );

  for (const pref of prefs) {
    const { user_id, notify_hour, enabled_days, unsubscribe_token } = pref;
    const wantEmail = !!pref.email_opt_in;
    const wantPush = !!pref.push_opt_in && vapidReady;
    if (!wantEmail && !wantPush) continue;
    const tz = safeTimezone(pref.timezone || "UTC");
    const today = todayInTz(tz);
    const hour = currentHourInTz(tz);

    // 1. ¿Ya llegó la hora elegida? ¿Día habilitado?
    if (!isNotifyTime(notify_hour, tz)) continue;
    const days = Array.isArray(enabled_days) ? enabled_days.map(Number) : [0, 1, 2, 3, 4, 5, 6];
    if (!days.includes(dayOfWeekInTz(tz))) continue;

    // 2. Perfil activo, objetivo y plan, y actividad de los últimos 60 días.
    const ctx = await loadUserContext(e, user_id, today).catch((err) => {
      results.errors++;
      results.log.push({ user: user_id, date: today, action: "context_error", error: err.message });
      return null;
    });
    if (!ctx) continue;

    // 3. Etapa del journey.
    const p = ctx.profile;
    const decision = planReminder({
      today, hour, notifyHour: notify_hour ?? 20, rows: ctx.rows, engagement: pref.engagement,
      planStart: p.planStartDate, planEnd: p.planEndDate, planWeeks: Number(p.planDurationWeeks) || null,
      goal: p.goal, wantNutrition: pref.notify_nutrition !== false, wantTraining: pref.notify_training !== false,
    });
    if (!decision) continue;
    results.processed++;

    const msg = reminderMessage(decision);
    const daily = decision.step === "day" || decision.step === "rescue";

    // 4. Correo: uno por día. El aviso del día conserva los tipos de REQ-24
    // (y sus claves, para no repetir el día del despliegue).
    if (wantEmail && p.email) {
      const emailType = daily ? (decision.missing === "training" ? "training" : "nutrition") : "comeback";
      const keys = daily
        ? [`${user_id}:${emailType}:${today}`, `${user_id}:${emailType === "training" ? "nutrition" : "training"}:${today}`]
        : [`${user_id}:${decision.step}:${decision.ref}`];
      await deliver(e, dryRun, results, results, {
        userId: user_id, type: emailType, keys, refDate: daily ? today : decision.ref, step: decision.step,
        send: async () => ({ emailId: await sendEmail(e, p.email, msg.subject, buildEmailHtml(e, msg, unsubscribe_token)) }),
      });
    }

    // 5. Push: el del día (o la etapa de regreso) y, si toca, la última
    // llamada, solo cuando el aviso del día ya salió en un disparo anterior.
    const subs = wantPush
      ? await supaGet(e, `/rest/v1/push_subscriptions?user_id=eq.${user_id}&select=endpoint,keys_p256dh,keys_auth`).catch(() => [])
      : [];
    if (subs.length) {
      const pushType = daily ? "push_streak" : "push_comeback";
      const pushKey = daily ? `${user_id}:push_streak:${today}` : `${user_id}:push_${decision.step}:${decision.ref}`;
      const status = await deliver(e, dryRun, results, results.push, {
        userId: user_id, type: pushType, keys: [pushKey], refDate: daily ? today : decision.ref, step: decision.step,
        send: () => sendPush(e, subs, msg),
      });
      if (decision.lastCall && status === "already_sent") {
        await deliver(e, dryRun, results, results.push, {
          userId: user_id, type: "push_last_call", keys: [`${user_id}:push_last_call:${today}`], refDate: today, step: "last_call",
          send: () => sendPush(e, subs, reminderMessage(decision, "last_call")),
        });
      }
    }
  }

  await runFollowups(e, dryRun, results);
  return results;
}

// REQ-296: correos de seguimiento para quien nunca eligió sus avisos (sin fila
// en notification_preferences): activación, regreso y volver a entrenar. Nunca
// el aviso del día ni push (el push exige permiso del dispositivo). Guardar las
// preferencias en Perfil o darse de baja crea la fila y corta el seguimiento.
async function runFollowups(e, dryRun, results) {
  if (!e.cronSecret) return; // sin enlace de baja firmado no se escribe
  let chose, people;
  try {
    [chose, people] = await Promise.all([
      supaGet(e, "/rest/v1/notification_preferences?select=user_id"),
      supaGet(e, "/rest/v1/profiles?active=not.is.false&email=not.is.null&select=id,email,created_at," +
        "timeZone:prefs->>timeZone,goal:prefs->>goal,planStartDate:prefs->>planStartDate," +
        "planEndDate:prefs->>planEndDate,planDurationWeeks:prefs->>planDurationWeeks"),
    ]);
  } catch (err) {
    results.errors++;
    results.log.push({ action: "followup_list_error", error: err.message });
    return;
  }
  const hasPrefs = new Set(chose.map((r) => r.user_id));
  for (const p of people) {
    if (hasPrefs.has(p.id) || !p.email) continue;
    const tz = safeTimezone(p.timeZone || FOLLOWUP_DEFAULT_TZ);
    if (!isNotifyTime(FOLLOWUP_HOUR, tz)) continue;
    const today = todayInTz(tz);
    const rows = await loadRows(e, p.id, today).catch(() => null);
    if (!rows) {
      results.errors++;
      results.log.push({ user: p.id, date: today, action: "context_error" });
      continue;
    }
    const created = p.created_at ? new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date(p.created_at)) : null;
    const decision = planReminder({
      today, hour: currentHourInTz(tz), notifyHour: FOLLOWUP_HOUR, rows, engagement: null,
      planStart: p.planStartDate, planEnd: p.planEndDate, planWeeks: Number(p.planDurationWeeks) || null,
      goal: p.goal, accountCreated: created, followupOnly: true,
    });
    if (!decision) continue;
    results.processed++;
    const msg = reminderMessage(decision);
    await deliver(e, dryRun, results, results, {
      userId: p.id, type: "comeback", keys: [`${p.id}:${decision.step}:${decision.ref}`], refDate: decision.ref, step: decision.step,
      send: async () => ({ emailId: await sendEmail(e, p.email, msg.subject, buildEmailHtml(e, msg, followupUnsubToken(e, p.id), { followup: true })) }),
    });
  }
}

// ── Keep-alive de Supabase (REQ-178) ──────────────────────────────────────────
// El plan gratuito de Supabase pausa el proyecto tras ~7 días sin actividad y
// eso tumba login y sync. El cron diario hace una lectura mínima ANTES de
// autenticar: aunque el job se corte por CRON_SECRET (Vercel identifica sus
// crons por user-agent y solo manda Authorization si CRON_SECRET existe), la
// base recibe actividad cada día. Una fila, solo el id, nada se devuelve.
async function keepSupabaseAwake(e) {
  if (!e.url || !e.service) return false;
  try {
    const r = await fetch(e.url + "/rest/v1/profiles?select=id&limit=1", { headers: getHeaders(e) });
    return r.ok;
  } catch (_) {
    return false;
  }
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

  const awake = await keepSupabaseAwake(e);

  // Job del cron — verificar CRON_SECRET
  const authHeader = req.headers["authorization"] || "";
  const isVercelCron = req.headers["x-vercel-cron"] === "1";
  if (!isVercelCron && (!e.cronSecret || authHeader !== "Bearer " + e.cronSecret)) {
    return res.status(401).json({ error: "Unauthorized", keepAlive: awake });
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
