import fs from "node:fs";

const sql = fs.readFileSync(new URL("../supabase/coach_quota.sql", import.meta.url), "utf8");
const api = fs.readFileSync(new URL("../api/claude.js", import.meta.url), "utf8");
const admin = fs.readFileSync(new URL("../api/admin.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const table of [
  "coach_quota_policies",
  "coach_quota_overrides",
  "coach_usage",
  "coach_option_pool",
  "coach_generation_parts",
  "coach_option_impressions",
]) {
  assert(sql.includes("create table if not exists " + table), "Falta tabla " + table);
  assert(sql.includes("alter table " + table + " enable row level security"), "Falta RLS en " + table);
}

for (const fn of [
  "reserve_coach_action",
  "claim_coach_generation_part",
  "complete_fresh_coach_part",
  "fail_coach_generation_part",
  "select_reusable_coach_part",
  "admin_reset_coach_quota",
]) {
  assert(sql.includes("function " + fn), "Falta función " + fn);
  assert(sql.includes("grant execute on function " + fn), "Falta grant server-side para " + fn);
}

assert(sql.includes("pg_advisory_xact_lock"), "La reserva y selección deben bloquear concurrencia.");
assert(sql.includes("unique (user_id, action, request_id)"), "Falta idempotencia por request.");
assert(sql.includes("origin = 'fresh'") && sql.includes("status in ('reserved','completed')"), "El conteo debe excluir reutilizaciones y devoluciones.");
assert(sql.includes("prefs->>'timeZone'"), "La ventana diaria debe usar la zona horaria guardada.");
assert(sql.includes("v_pool_count <= 1 or id is distinct from v_last_result"), "Debe evitar la repetición inmediata cuando hay alternativas.");

for (const action of [
  "diet_day",
  "diet_week",
  "meal_option",
  "training_plan",
  "training_replacement",
]) {
  assert(api.includes('"' + action + '"'), "El proxy no reconoce " + action);
  assert(sql.includes("'" + action + "'"), "La política no incluye " + action);
}

assert(api.includes("validateCoachOutput"), "El servidor debe validar antes de guardar.");
assert(api.includes("fail_coach_generation_part"), "El servidor debe devolver reservas fallidas.");
assert(api.includes("select_reusable_coach_part"), "El servidor debe resolver pool o plantilla sin proveedor.");
assert(admin.includes('body.action === "quotaOverview"'), "Falta diagnóstico administrativo.");
assert(admin.includes('body.action === "setQuotaPolicy"'), "Falta edición administrativa de políticas.");
assert(admin.includes('body.action === "setQuotaOverride"'), "Falta cortesía por usuario.");
assert(admin.includes('body.action === "resetQuota"'), "Falta reinicio administrativo.");

assert(html.includes('coachQuota("diet_week"') || html.includes('action:"diet_week"'), "La semana debe consumir una sola acción agrupada.");
assert(html.includes("coachActionsInFlight"), "La UI debe bloquear dobles clicks en curso.");
assert(html.includes("deterministicDayPayload"), "Falta alternativa determinista.");
assert(html.includes("timeZone:p.timeZone"), "El perfil debe enviar la zona horaria.");
assert(!html.includes("unidades restantes"), "La UI normal no debe mostrar unidades restantes.");

console.log("Cuotas del coach: esquema, proxy, administración y cliente validados.");
