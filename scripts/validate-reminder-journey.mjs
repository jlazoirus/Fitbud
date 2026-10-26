#!/usr/bin/env node
// REQ-285 — Journey de recordatorios (docs/reminders-journey.md).
// 1) planReminder() decide una etapa por usuario y día según la ausencia.
// 2) reminderMessage(): sin objetivo ni datos corporales en push/asunto (REQ-24/38)
//    y sin vocabulario técnico (REQ-31).
// 3) Handler con push: aviso del día, última llamada solo tras el aviso, regreso
//    que no se envía si no se pudo registrar el intento (falla cerrado).
import assert from "node:assert/strict";
import webpush from "web-push";

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
process.env.RESEND_API_KEY = "test-resend";
process.env.CRON_SECRET = "secret";
const vapid = webpush.generateVAPIDKeys();
process.env.VAPID_PRIVATE_KEY = vapid.privateKey;
process.env.VAPID_SUBJECT = "mailto:test@example.com";
const pushes = [];
webpush.sendNotification = async (sub, payload) => { pushes.push(JSON.parse(payload)); return {}; };

const mod = await import("../api/notify.js");
const { planReminder, reminderMessage, dayHasActivity, pendingFromState, addDaysYmd, lastCallHour, COMEBACK_STEPS } = mod;

const T = "2026-10-26";
const D = (n) => addDaysYmd(T, n);
const START = D(-30);
const meal = (done) => ({ done, ovr: { name: "x" } });
const activeRow = (n) => ({ log_date: D(n), meals: { desayuno: meal(true) }, workoutDone: true });
const plannedRow = (n, extra = {}) => ({ log_date: D(n), meals: { desayuno: meal(false), almuerzo: meal(false) }, workoutDone: false, restDay: false, ...extra });
const eng = (over = {}) => ({ v: 1, cycleStart: START, streak: 5, streakThrough: D(-1), bestStreak: 9, activeDays: 18, workouts: 9, ...over });
const base = (over = {}) => ({
  today: T, hour: 20, notifyHour: 20, rows: [activeRow(-1), plannedRow(0)], engagement: eng(),
  planStart: START, planEnd: addDaysYmd(START, 69), planWeeks: 10, goal: "deficit",
  wantNutrition: true, wantTraining: true, ...over,
});

// ── Actividad y pendiente ───────────────────────────────────────────────────
assert.equal(dayHasActivity({ meals: { a: { done: true } } }), true);
assert.equal(dayHasActivity({ extras: [{ done: true }] }), true);
assert.equal(dayHasActivity({ manualActivities: [{ sport: "running" }] }), true);
assert.equal(dayHasActivity({ workoutExecution: { status: "in_progress", steps: [{ sets: [{ done: true }] }] } }), true);
assert.equal(dayHasActivity({ meals: { a: { done: false } }, workoutDone: false }), false, "plan preparado sin marcar no es actividad");
assert.deepEqual(pendingFromState({ meals: { a: meal(true) }, workoutExecution: { status: "partial" } }), { nutrition: false, training: false, notStarted: false }, "sesión parcial cerrada no está pendiente");
assert.deepEqual(pendingFromState({ meals: {}, restDay: true }), { nutrition: false, training: false, notStarted: true }, "REQ-265: descanso sin aviso de entreno; REQ-282: día abierto sin nada");
assert.equal(pendingFromState({ meals: {}, extras: [{ name: "fruta" }], restDay: true }).notStarted, false, "REQ-282: con un extra ya empezó");
console.log("  actividad y pendiente: mismo criterio que la app");

// ── Día en juego ────────────────────────────────────────────────────────────
let d = planReminder(base());
assert.equal(d.step, "day");
assert.equal(d.streak, 5);
assert.equal(d.missing, "both");
let m = reminderMessage(d);
assert.equal(m.title, "Tu racha de 5 días sigue en juego");
assert.equal(m.body, "Falta registrar tus comidas y tu entreno para sumar el día 6.");
assert.equal(m.url, `/?date=${T}&r=day`);
assert.equal(planReminder(base({ hour: 19 })), null, "antes de la hora elegida no sale");
d = planReminder(base({ rows: [activeRow(-1)] }));
assert.equal(d.step, "day", "sin abrir la app hoy (sin fila) la racha sigue en riesgo");
assert.equal(d.missing, "day");
assert.equal(reminderMessage(d).body, "Aún no has empezado tu plan de hoy. Regístralo para sumar el día 6.");
assert.equal(planReminder(base({ rows: [activeRow(-1)], wantNutrition: false })), null, "REQ-282: sin la fila de hoy no se sabe si toca entrenar");
d = planReminder(base({ rows: [activeRow(-1), { log_date: T, meals: {}, extras: [], restDay: true }] }));
assert.equal(d.missing, "day", "REQ-282: día abierto sin nada registrado = no empezó");
assert.equal(planReminder(base({ engagement: eng({ streakThrough: T, streak: 6 }) })), null, "la racha de hoy ya está a salvo");
assert.equal(planReminder(base({ wantNutrition: false, rows: [activeRow(-1), plannedRow(0, { workoutDone: true })] })), null, "solo comidas pendientes y comidas desactivadas");
d = planReminder(base({ engagement: null }));
assert.equal(d.streak, 0);
assert.equal(reminderMessage(d).title, "Tu plan de hoy te espera");
assert.equal(planReminder(base({ engagement: eng({ cycleStart: D(-100) }) })).streak, 0, "el resumen de otro ciclo no cuenta");
console.log("  día en juego: con y sin fila de hoy, racha asegurada, preferencias y ciclo");

// ── Rescate de ayer ─────────────────────────────────────────────────────────
d = planReminder(base({ rows: [activeRow(-2)], engagement: eng({ streakThrough: D(-2), streak: 4 }) }));
assert.equal(d.step, "rescue");
assert.equal(d.date, D(-1));
m = reminderMessage(d);
assert.equal(m.title, "Ayer quedó sin registrar");
assert.equal(m.body, "Si lo cumpliste, regístralo y tu racha de 4 días sigue.");
assert.equal(m.url, `/?date=${D(-1)}&r=rescue`);
d = planReminder(base({ rows: [activeRow(-2)], engagement: eng({ streakThrough: D(-2), streak: 1 }) }));
assert.equal(d.step, "comeback_2", "con racha de 1 día no hay rescate: es un regreso");
assert.equal(planReminder(base({ rows: [activeRow(-3)], engagement: eng({ streakThrough: D(-3), streak: 6 }) })).step, "comeback_2", "solo se rescata ayer");
d = planReminder(base({ rows: [activeRow(-2), plannedRow(0)], engagement: eng({ streak: 0, streakThrough: null, rescueDate: D(-1), rescueStreak: 3 }) }));
assert.equal(d.step, "rescue", "abrió la app hoy con ayer roto: la app deja calculado el rescate");
assert.equal(d.streak, 3);
assert.equal(planReminder(base({ rows: [activeRow(-2), plannedRow(0)], engagement: eng({ streak: 0, streakThrough: null, rescueDate: D(-2), rescueStreak: 3 }) })).step, "comeback_2", "un rescate de otro día no vale");
console.log("  rescate de ayer: solo con racha de 2+ hasta anteayer");

// ── Última llamada ──────────────────────────────────────────────────────────
assert.equal(lastCallHour(20), 22);
assert.equal(lastCallHour(17), 21);
assert.equal(lastCallHour(21), null, "nunca después de las 22:00");
assert.equal(planReminder(base({ hour: 21 })).lastCall, false);
assert.equal(planReminder(base({ hour: 22 })).lastCall, true);
assert.equal(planReminder(base({ hour: 23 })).lastCall, false);
assert.equal(planReminder(base({ hour: 22, engagement: eng({ streak: 2 }) })).lastCall, false, "solo con racha de 3+");
assert.equal(reminderMessage(planReminder(base({ hour: 22 })), "last_call").body, "Registra lo de hoy y tu racha de 5 días sigue.");
console.log("  última llamada: 21-22 h, racha de 3+");

// ── Regreso por ausencia ────────────────────────────────────────────────────
const expected = { 2: "comeback_2", 3: "comeback_2", 4: null, 5: "comeback_5", 6: "comeback_5", 7: "comeback_7", 13: "comeback_7", 14: "comeback_14", 29: "comeback_14", 30: "comeback_30", 45: "comeback_30", 46: null, 59: null };
for (const [gap, step] of Object.entries(expected)) {
  // Racha de 1 día: sin rescate posible, es un regreso puro.
  const r = planReminder(base({ planStart: D(-80), planEnd: D(20), rows: [activeRow(-Number(gap))], engagement: eng({ cycleStart: D(-80), streakThrough: D(-Number(gap)), streak: 1 }) }));
  assert.equal(r ? r.step : null, step, `gap ${gap}`);
  if (r) assert.equal(r.ref, D(-Number(gap)), "una vez por ausencia: la clave usa el último día activo");
}
assert.equal(COMEBACK_STEPS.at(-1).to, 45, "tras 45 días, silencio");
d = planReminder(base({ rows: [activeRow(-2)], engagement: eng({ streakThrough: D(-4) }) }));
assert.equal(reminderMessage(d).body, "Llevas 18 días registrados y 9 entrenos en este plan. Hoy puede empezar tu siguiente racha.");
d = planReminder(base({ rows: [activeRow(-5)], engagement: eng({ streakThrough: D(-5) }) }));
m = reminderMessage(d);
assert.equal(m.title, "Tu objetivo sigue en pie");
assert.equal(m.body, "Vas en la semana 5 de 10 de tu plan. Retomar toma una comida registrada.");
assert.ok(m.paragraphs.includes("Tu objetivo: Bajar grasa."), "el correo nombra el objetivo");
d = planReminder(base({ rows: [activeRow(-14)], engagement: eng({ streakThrough: D(-14) }) }));
assert.equal(reminderMessage(d).body, "Mejor racha: 9 días · 9 entrenos · 18 días registrados. Volver toma un registro.");
d = planReminder(base({ rows: [activeRow(-20)], engagement: null }));
assert.equal(d.progress.activeDays, 1, "sin resumen de la app cuenta en day_log");
d = planReminder(base({ rows: [], engagement: null, planStart: D(-9), planEnd: D(60) }));
assert.equal(d.step, "comeback_7");
assert.equal(d.never, true);
assert.equal(reminderMessage(d).title, "Tu plan sigue listo");
d = planReminder(base({ rows: [], engagement: null, planStart: D(-1) }));
assert.equal(d.step, "day", "plan recién empezado sin registros: aviso del día, no de regreso");
assert.equal(reminderMessage(d).body, "Aún no has empezado tu plan de hoy. Hoy puede empezar tu racha.");
assert.equal(planReminder(base({ planStart: D(3) })), null, "plan sin empezar");
d = planReminder(base({ rows: [activeRow(-8)], planEnd: D(-2) }));
assert.equal(d.step, "comeback_7");
assert.equal(reminderMessage(d).body, "Tu ciclo terminó. Empieza uno nuevo cuando quieras: tu historial se conserva.");
assert.equal(planReminder(base({ planEnd: D(-1) })), null, "con el plan terminado no hay aviso del día");
console.log("  regreso: ventanas 2-3/5-6/7-13/14-29/30-45, activación, plan terminado y silencio");

// ── Privacidad y lenguaje de todas las variantes ─────────────────────────────
const decisions = [
  planReminder(base()), planReminder(base({ engagement: null })),
  planReminder(base({ rows: [activeRow(-2)], engagement: eng({ streakThrough: D(-2), streak: 4 }) })),
  ...[2, 5, 7, 14, 30].flatMap((g) => [
    planReminder(base({ rows: [activeRow(-g)], engagement: eng({ streakThrough: D(-g) }) })),
    planReminder(base({ rows: [], engagement: null, planStart: D(-g) })),
  ]),
].filter(Boolean);
assert.ok(decisions.length >= 12);
const BANNED = /\b(IA|inteligencia artificial|Claude|modelo|prompt|token|cuota)\b/i;
for (const dec of decisions) {
  for (const msg of [reminderMessage(dec), dec.step === "day" ? reminderMessage(dec, "last_call") : null].filter(Boolean)) {
    const lockScreen = `${msg.title} ${msg.body} ${msg.subject || ""}`;
    assert.doesNotMatch(lockScreen, /Bajar grasa|Recomponer|Ganar músculo/, `${dec.step}: sin objetivo en push/asunto`);
    assert.doesNotMatch(lockScreen + " " + (msg.paragraphs || []).join(" "), /\bkg\b|peso|grasa corporal|%/i, `${dec.step}: sin datos corporales`);
    assert.doesNotMatch(lockScreen + " " + (msg.paragraphs || []).join(" "), BANNED, `${dec.step}: REQ-31`);
    assert.ok(msg.title && msg.body && msg.url.startsWith("/?"), `${dec.step}: mensaje completo`);
  }
}
console.log(`  ${decisions.length} variantes sin objetivo en push/asunto, sin datos corporales ni vocabulario técnico`);

// ── Handler con push ────────────────────────────────────────────────────────
const localHour = (tz) => Number(new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false }).format(new Date())) % 24;
const zones = ["UTC", ...Array.from({ length: 12 }, (_, i) => `Etc/GMT-${i + 1}`), ...Array.from({ length: 12 }, (_, i) => `Etc/GMT+${i + 1}`)];
const tzAt = (h) => zones.find((z) => localHour(z) === h);
const localToday = (tz) => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());

let state;
globalThis.fetch = async (url, init = {}) => {
  const u = decodeURIComponent(String(url)), method = init.method || "GET";
  const json = (body, ok = true) => ({ ok, status: ok ? 200 : 400, json: async () => body });
  if (u.startsWith("https://api.resend.com/")) { state.emails.push(JSON.parse(init.body)); return json({ id: "email-1" }); }
  if (u.includes("/notification_preferences?")) return json([state.pref]);
  if (u.includes("/profiles?id=")) return json([state.profile]);
  if (u.includes("/profiles?select=id")) return json([{ id: "u1" }]);
  if (u.includes("/day_log?")) return json(state.rows);
  if (u.includes("/push_subscriptions?")) return json([{ endpoint: "https://push.example/1", keys_p256dh: "k", keys_auth: "a" }]);
  if (u.includes("/notification_log")) {
    if (method === "POST") {
      const row = JSON.parse(init.body);
      if (state.checkTypes && !state.checkTypes.includes(row.notification_type)) return json({ message: "violates check constraint" }, false);
      state.inserted.push(row);
      return json([{ id: state.inserted.length }]);
    }
    if (method === "PATCH") return json({});
    const keys = (u.match(/idempotency_key=in\.\((.*)\)&/) || [])[1];
    const list = keys ? keys.split(",") : [];
    return json(state.log.filter((r) => list.includes(r.idempotency_key)));
  }
  throw new Error("fetch inesperado: " + u);
};

async function run({ hour, notifyHour = hour, rows, engagement, log = [], checkTypes = null, emailOptIn = true }) {
  const tz = tzAt(hour);
  assert.ok(tz, `sin zona a las ${hour}`);
  const today = localToday(tz);
  pushes.length = 0;
  state = {
    emails: [], inserted: [], log: log.map((k) => ({ id: 9, status: "sent", idempotency_key: k.replace("{today}", today) })), checkTypes,
    rows: rows(today),
    pref: { user_id: "u1", timezone: tz, notify_hour: notifyHour, enabled_days: [0, 1, 2, 3, 4, 5, 6], notify_nutrition: true, notify_training: true, unsubscribe_token: "tok_0123456789", email_opt_in: emailOptIn, push_opt_in: true, engagement: engagement ? engagement(today) : null },
    profile: { email: "ana@example.com", active: true, goal: "deficit", planStartDate: addDaysYmd(today, -30), planEndDate: addDaysYmd(today, 39), planDurationWeeks: "10" },
  };
  const res = { code: 0, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; }, send(b) { this.body = b; return this; }, setHeader() {} };
  await mod.default({ method: "GET", url: "/api/notify", headers: { authorization: "Bearer secret" } }, res);
  assert.equal(res.code, 200, JSON.stringify(res.body));
  return { out: res.body, today };
}
const liveStreak = (today) => ({ cycleStart: addDaysYmd(today, -30), streak: 5, streakThrough: addDaysYmd(today, -1), bestStreak: 9, activeDays: 18, workouts: 9 });
const yesterdayActive = (today) => [{ log_date: addDaysYmd(today, -1), meals: { a: { done: true } }, workoutDone: true }];

// Aviso del día por correo y push, con la racha en el texto.
let r = await run({ hour: 20, rows: yesterdayActive, engagement: liveStreak });
assert.equal(r.out.sent, 1);
assert.equal(r.out.push.sent, 1);
assert.equal(state.emails[0].subject, "Tu racha de 5 días sigue en juego");
assert.equal(pushes[0].title, "Tu racha de 5 días sigue en juego");
assert.equal(pushes[0].url, `/?date=${r.today}&r=day`);
assert.deepEqual(state.inserted.map((x) => x.notification_type), ["nutrition", "push_streak"]);
console.log("  handler: aviso del día por correo y push");

// Última llamada: solo si el aviso del día ya salió antes.
r = await run({ hour: 22, notifyHour: 20, rows: yesterdayActive, engagement: liveStreak, emailOptIn: false });
assert.equal(pushes.length, 1, "sin aviso previo, a las 22 sale el aviso del día, no la última llamada");
assert.equal(pushes[0].title, "Tu racha de 5 días sigue en juego");
r = await run({ hour: 22, notifyHour: 20, rows: yesterdayActive, engagement: liveStreak, emailOptIn: false, log: ["u1:push_streak:{today}"], checkTypes: ["nutrition", "training", "push_streak"] });
assert.equal(pushes.length, 0, "sin la migración, la última llamada no sale (falla cerrado)");
assert.ok(r.out.log.some((x) => x.step === "last_call" && x.action === "log_failed"));
r = await run({ hour: 22, notifyHour: 20, rows: yesterdayActive, engagement: liveStreak, emailOptIn: false, log: ["u1:push_streak:{today}"] });
assert.equal(pushes.length, 1);
assert.equal(pushes[0].title, "Quedan pocas horas");
assert.equal(state.inserted[0].notification_type, "push_last_call");
console.log("  handler: última llamada tras el aviso del día y solo con la migración");

// Regreso: falla cerrado sin la migración; con ella, uno por canal y ausencia.
const away = (today) => [{ log_date: addDaysYmd(today, -7), meals: { a: { done: true } } }];
r = await run({ hour: 20, rows: away, engagement: null, checkTypes: ["nutrition", "training", "push_streak"] });
assert.equal(state.emails.length + pushes.length, 0, "sin registro del intento no se envía: el disparo siguiente lo repetiría");
assert.equal(r.out.errors, 1);
assert.equal(r.out.push.errors, 1);
r = await run({ hour: 20, rows: away, engagement: null });
assert.equal(state.emails[0].subject, "Una semana sin registrar");
assert.equal(pushes[0].title, "Una semana sin registrar");
assert.equal(pushes[0].url, "/?r=comeback_7");
assert.deepEqual(state.inserted.map((x) => [x.notification_type, x.idempotency_key]), [
  ["comeback", `u1:comeback_7:${addDaysYmd(r.today, -7)}`],
  ["push_comeback", `u1:push_comeback_7:${addDaysYmd(r.today, -7)}`],
]);
r = await run({ hour: 20, rows: away, engagement: null, log: [`u1:comeback_7:${addDaysYmd(localToday(tzAt(20)), -7)}`, `u1:push_comeback_7:${addDaysYmd(localToday(tzAt(20)), -7)}`] });
assert.equal(state.emails.length + pushes.length, 0, "la misma etapa no se repite en la misma ausencia");
console.log("  handler: regreso idempotente por ausencia y falla cerrado sin migración");

// Lectura del registro caída: no se envía.
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => (String(url).includes("/notification_log?") && (!init || !init.method) ? { ok: false, status: 500, json: async () => ({ message: "down" }) } : realFetch(url, init));
r = await run({ hour: 20, rows: yesterdayActive, engagement: liveStreak });
assert.equal(state.emails.length + pushes.length, 0, "sin poder leer el registro no se envía");
globalThis.fetch = realFetch;
console.log("  handler: registro ilegible → no se envía");

console.log("validate-reminder-journey: OK");
