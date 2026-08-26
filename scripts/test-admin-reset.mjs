// REQ-126 — Admin: resetear futuro y regenerar nutrición/entrenamiento para
// cualquier usuario, y reiniciar un usuario normal a onboarding.
import fs from "node:fs";

async function importHandler(path) {
  const source = fs.readFileSync(new URL("../" + path, import.meta.url), "utf8");
  const url = "data:text/javascript;base64," + Buffer.from(source).toString("base64");
  return (await import(url)).default;
}

function response(status, data) {
  return { ok: status >= 200 && status < 300, status, json: async () => data };
}

function capture() {
  return {
    statusCode: 0,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

process.env.SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_PUBLISHABLE_KEY = "publishable";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service";

const admin = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", email: "admin@example.com" };
const normalUser = { id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", email: "user@example.com" };
const otherAdmin = { id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", email: "otheradmin@example.com" };
const handler = await importHandler("api/admin.js");

const FUTURE_TODAY = "2026-07-10";
const dayLogRows = [
  // Día futuro sin nada registrado: debe limpiarse.
  { log_date: "2026-07-10", state: { meals: { desayuno: { done: false, ovr: { name: "IA" } } }, extras: [], workoutDone: false } },
  // Día futuro con una comida ya registrada: debe protegerse (no tocar).
  { log_date: "2026-07-11", state: { meals: { desayuno: { done: true, ovr: { name: "Avena" } } }, extras: [], workoutDone: false } },
  // Día futuro con entrenamiento ya hecho: protegido solo para scope training/both.
  { log_date: "2026-07-12", state: { meals: {}, extras: [], workoutDone: true } },
];

function baseFetchMocks(requests) {
  return async (url, options = {}) => {
    const value = String(url);
    requests.push({ url: value, method: options.method || "GET", body: options.body || "" });
    if (value.endsWith("/auth/v1/user")) return response(200, admin);
    if (value.includes("/rest/v1/profiles?id=eq." + admin.id)) {
      return response(200, [{ id: admin.id, email: admin.email, is_admin: true, active: true }]);
    }
    if (value.includes("/rest/v1/profiles?id=eq." + normalUser.id)) {
      return response(200, [{ id: normalUser.id, email: normalUser.email, is_admin: false, active: true, prefs: { timeZone: "UTC" } }]);
    }
    if (value.startsWith("https://test.supabase.co/rest/v1/day_log?user_id=eq." + normalUser.id) && (!options.method || options.method === "GET")) {
      return response(200, dayLogRows);
    }
    if (value.includes("/rest/v1/day_log?") && options.method === "PATCH") {
      return response(200, [{}]);
    }
    if (value.includes("/rest/v1/plan_versions?user_id=eq." + normalUser.id) && (!options.method || options.method === "GET")) {
      return response(200, [{ id: 42, cycle_number: 1, version_number: 3, valid_from: "2026-06-15", valid_to: null }]);
    }
    if (value.includes("/rest/v1/plan_versions?id=eq.42") && options.method === "PATCH") {
      return response(200, [{}]);
    }
    if (value.includes("/rest/v1/admin_actions_log") && options.method === "POST") {
      return response(201, [{}]);
    }
    throw new Error("Ruta no simulada: " + value);
  };
}

// ── previewResetPlan: no debe mutar nada, solo reportar el impacto ──────────
{
  const requests = [];
  global.fetch = baseFetchMocks(requests);
  const res = capture();
  await handler({
    method: "POST",
    headers: { authorization: "Bearer admin-token" },
    body: { action: "previewResetPlan", userId: normalUser.id, scope: "nutrition", fromDate: FUTURE_TODAY },
  }, res);
  assert(res.statusCode === 200, "previewResetPlan debe responder 200.");
  assert(res.body.daysInRange === 3, "Debe reportar los 3 días en rango.");
  assert(res.body.clearedCount === 2 && res.body.protectedCount === 1,
    "Con scope=nutrition, solo el día con comida ya registrada debe quedar protegido.");
  assert(res.body.willSupersedePlanVersion === true, "Debe detectar la versión activa del plan.");
  assert(!requests.some((r) => r.method === "PATCH" || r.method === "DELETE"), "El preview no debe mutar ningún dato.");
  console.log("  Test 1 pasado: previewResetPlan reporta impacto sin mutar nada");
}

// ── applyResetPlan (scope=nutrition): solo limpia días no protegidos y archiva el plan ──
{
  const requests = [];
  global.fetch = baseFetchMocks(requests);
  const res = capture();
  await handler({
    method: "POST",
    headers: { authorization: "Bearer admin-token" },
    body: { action: "applyResetPlan", userId: normalUser.id, scope: "nutrition", fromDate: FUTURE_TODAY },
  }, res);
  assert(res.statusCode === 200 && res.body.ok === true, "applyResetPlan debe responder ok:true.");
  assert(res.body.daysCleared === 2 && res.body.daysProtected === 1,
    "Debe limpiar 2 días y proteger el día con comida ya registrada.");
  assert(res.body.planVersionSuperseded === true, "Debe archivar la versión activa del plan.");
  const patchedDates = requests.filter((r) => r.url.includes("/rest/v1/day_log?") && r.method === "PATCH")
    .map((r) => r.url.match(/log_date=eq\.([\d-]+)/)[1]);
  assert(patchedDates.includes("2026-07-10") && patchedDates.includes("2026-07-12"),
    "Debe limpiar los días sin comidas registradas (incluido el que solo tiene entreno hecho).");
  assert(!patchedDates.includes("2026-07-11"), "Nunca debe tocar el día con una comida ya registrada.");
  const versionPatch = requests.find((r) => r.url.includes("/rest/v1/plan_versions?id=eq.42") && r.method === "PATCH");
  assert(versionPatch && JSON.parse(versionPatch.body).status === "superseded", "Debe marcar la versión activa como superseded.");
  assert(requests.some((r) => r.url.includes("/rest/v1/admin_actions_log") && r.method === "POST"), "Debe auditar la acción aplicada.");
  console.log("  Test 2 pasado: applyResetPlan limpia solo lo no protegido y archiva la versión activa");
}

// ── previewResetPlan/applyResetPlan (scope=nutrition, fila COMBINADA): preserva
// el entrenamiento futuro en vez de archivarlo junto con la nutrición (REQ-149) ──
{
  const COMBINED_VERSION_ID = 77;
  const combinedFetchMocks = (requests) => async (url, options = {}) => {
    const value = String(url);
    requests.push({ url: value, method: options.method || "GET", body: options.body || "" });
    if (value.endsWith("/auth/v1/user")) return response(200, admin);
    if (value.includes("/rest/v1/profiles?id=eq." + admin.id)) {
      return response(200, [{ id: admin.id, email: admin.email, is_admin: true, active: true }]);
    }
    if (value.includes("/rest/v1/profiles?id=eq." + normalUser.id)) {
      return response(200, [{ id: normalUser.id, email: normalUser.email, is_admin: false, active: true, prefs: { timeZone: "UTC" } }]);
    }
    if (value.startsWith("https://test.supabase.co/rest/v1/day_log?user_id=eq." + normalUser.id) && (!options.method || options.method === "GET")) {
      return response(200, dayLogRows);
    }
    if (value.includes("/rest/v1/day_log?") && options.method === "PATCH") return response(200, [{}]);
    if (value.includes("/rest/v1/plan_versions?user_id=eq." + normalUser.id) && value.includes("status=eq.active")) {
      return response(200, [{
        id: COMBINED_VERSION_ID, cycle_number: 1, version_number: 3, valid_from: "2026-06-15", valid_to: null,
        snapshot: {
          prefs: { calorieTarget: 2200 },
          nutritionPlan: { days: [{ date: "2026-07-10", meals: [] }] },
          trainingPlan: { weeks: [{ week: 1, days: [] }] },
        },
      }]);
    }
    if (value.includes("/rest/v1/plan_versions?id=eq." + COMBINED_VERSION_ID) && options.method === "PATCH") return response(200, [{}]);
    if (value.includes("/rest/v1/plan_versions?user_id=eq." + normalUser.id) && value.includes("cycle_number=eq.1")) {
      return response(200, [{ version_number: 3 }]);
    }
    if (value === "https://test.supabase.co/rest/v1/plan_versions" && options.method === "POST") return response(201, [{}]);
    if (value.includes("/rest/v1/admin_actions_log") && options.method === "POST") return response(201, [{}]);
    throw new Error("Ruta no simulada: " + value);
  };

  // Preview: debe avisar que el entrenamiento se conserva, no que se archiva.
  {
    const requests = [];
    global.fetch = combinedFetchMocks(requests);
    const res = capture();
    await handler({
      method: "POST",
      headers: { authorization: "Bearer admin-token" },
      body: { action: "previewResetPlan", userId: normalUser.id, scope: "nutrition", fromDate: FUTURE_TODAY },
    }, res);
    assert(res.body.willSupersedePlanVersion === true, "Debe detectar la fila combinada activa.");
    assert(res.body.willPreserveTraining === true, "Debe avisar que el entrenamiento futuro se conserva.");
    assert(!("snapshot" in (res.body.activePlanVersion || {})), "No debe exponer el snapshot completo en la respuesta.");
    console.log("  Test 2b pasado: previewResetPlan avisa que el entrenamiento se conserva sobre fila combinada");
  }

  // Apply: debe superseder la fila combinada Y crear una nueva fila activa solo de entrenamiento.
  {
    const requests = [];
    global.fetch = combinedFetchMocks(requests);
    const res = capture();
    await handler({
      method: "POST",
      headers: { authorization: "Bearer admin-token" },
      body: { action: "applyResetPlan", userId: normalUser.id, scope: "nutrition", fromDate: FUTURE_TODAY },
    }, res);
    assert(res.statusCode === 200 && res.body.ok === true, "applyResetPlan (combinada) debe responder ok:true.");
    assert(res.body.planVersionSuperseded === true, "Debe archivar la fila combinada.");
    assert(res.body.trainingPreserved === true, "Debe marcar que el entrenamiento se preservó.");
    const supersedePatch = requests.find((r) => r.url.includes("/rest/v1/plan_versions?id=eq." + COMBINED_VERSION_ID) && r.method === "PATCH");
    assert(supersedePatch && JSON.parse(supersedePatch.body).status === "superseded", "Debe superseder la fila combinada.");
    const insertReq = requests.find((r) => r.url === "https://test.supabase.co/rest/v1/plan_versions" && r.method === "POST");
    assert(insertReq, "Debe insertar una nueva fila activa preservando el entrenamiento.");
    const insertedBody = JSON.parse(insertReq.body);
    assert(insertedBody.status === "active" && insertedBody.cycle_number === 1, "La fila nueva debe quedar activa en el mismo ciclo.");
    assert(insertedBody.valid_from === res.body.fromDate, "La fila nueva debe cubrir desde fromDate en adelante.");
    assert(insertedBody.version_number === 4, "Debe usar el siguiente número de versión disponible.");
    assert(insertedBody.snapshot.trainingPlan && insertedBody.snapshot.trainingPlan.weeks.length === 1,
      "Debe conservar snapshot.trainingPlan intacto.");
    assert(insertedBody.snapshot.nutritionPlan === null,
      "La fila nueva no debe traer nutritionPlan (nutrición cae a generación fresca, no a la vieja materializada).");
    console.log("  Test 2c pasado: applyResetPlan(scope=nutrition) sobre fila combinada preserva el entrenamiento futuro");
  }
}

// ── applyResetPlan (scope=training): protege por entrenamiento, no por comidas ──
{
  const requests = [];
  global.fetch = baseFetchMocks(requests);
  const res = capture();
  await handler({
    method: "POST",
    headers: { authorization: "Bearer admin-token" },
    body: { action: "applyResetPlan", userId: normalUser.id, scope: "training", fromDate: FUTURE_TODAY },
  }, res);
  assert(res.body.daysCleared === 2 && res.body.daysProtected === 1,
    "Con scope=training, el día con workoutDone=true debe protegerse en vez del de comida.");
  assert(res.body.planVersionSuperseded === false, "scope=training no debe tocar la versión del plan de nutrición.");
  assert(!requests.some((r) => r.url.includes("/rest/v1/plan_versions") && r.method === "PATCH"),
    "No debe archivar plan_versions cuando el alcance es solo entrenamiento.");
  console.log("  Test 3 pasado: applyResetPlan con scope=training protege por entrenamiento, no por comidas");
}

// ── validación: scope inválido ──────────────────────────────────────────────
{
  global.fetch = baseFetchMocks([]);
  const res = capture();
  await handler({
    method: "POST",
    headers: { authorization: "Bearer admin-token" },
    body: { action: "applyResetPlan", userId: normalUser.id, scope: "invalido" },
  }, res);
  assert(res.statusCode === 400, "Un scope inválido debe rechazarse con 400.");
  console.log("  Test 4 pasado: scope inválido se rechaza");
}

// ── resetUserToOnboarding: reutiliza el wipe de datos, sin marcar fitbros_test_user ──
{
  const requests = [];
  global.fetch = async (url, options = {}) => {
    const value = String(url);
    requests.push({ url: value, method: options.method || "GET", body: options.body || "" });
    if (value.endsWith("/auth/v1/user")) return response(200, admin);
    if (value.includes("/rest/v1/profiles?id=eq." + admin.id)) {
      return response(200, [{ id: admin.id, email: admin.email, is_admin: true, active: true }]);
    }
    if (value.includes("/auth/v1/admin/users/" + normalUser.id)) return response(200, normalUser);
    if (value.includes("/rest/v1/profiles?id=eq." + normalUser.id)) {
      return response(200, [{ id: normalUser.id, email: normalUser.email, is_admin: false, active: true }]);
    }
    if (value.includes("/storage/v1/object/list/progress-photos")) return response(200, []);
    if (value.includes("/rest/v1/") && options.method === "DELETE") return response(204, {});
    if (value.includes("/rest/v1/profiles?on_conflict=id") && options.method === "POST") return response(200, [{}]);
    if (value.includes("/rest/v1/admin_actions_log") && options.method === "POST") return response(201, [{}]);
    throw new Error("Ruta no simulada: " + value);
  };
  const res = capture();
  await handler({
    method: "POST",
    headers: { authorization: "Bearer admin-token" },
    body: { action: "resetUserToOnboarding", userId: normalUser.id },
  }, res);
  assert(res.statusCode === 200 && res.body.ok === true, "resetUserToOnboarding debe responder ok:true.");
  assert(requests.filter((r) => r.method === "DELETE" && r.url.includes("/rest/v1/")).length === 9,
    "Debe limpiar las mismas tablas que el reinicio de usuario de prueba.");
  const profileReset = requests.find((r) => r.url.includes("/rest/v1/profiles?on_conflict=id") && r.method === "POST");
  assert(profileReset, "Debe reiniciar el perfil (prefs vacíos, onboarding pendiente).");
  assert(!requests.some((r) => r.url.includes("/auth/v1/admin/users/" + normalUser.id) && r.method === "PUT"),
    "No debe tocar el usuario de Auth (no debe marcarlo como fitbros_test_user).");
  assert(requests.some((r) => r.url.includes("/rest/v1/admin_actions_log") && r.method === "POST"), "Debe auditar el reinicio.");
  console.log("  Test 5 pasado: resetUserToOnboarding reinicia datos sin convertir al usuario en QA");
}

// ── resetUserToOnboarding: no puede aplicarse sobre otro administrador ─────
{
  global.fetch = async (url, options = {}) => {
    const value = String(url);
    if (value.endsWith("/auth/v1/user")) return response(200, admin);
    if (value.includes("/rest/v1/profiles?id=eq." + admin.id)) {
      return response(200, [{ id: admin.id, email: admin.email, is_admin: true, active: true }]);
    }
    if (value.includes("/auth/v1/admin/users/" + otherAdmin.id)) return response(200, otherAdmin);
    if (value.includes("/rest/v1/profiles?id=eq." + otherAdmin.id)) {
      return response(200, [{ id: otherAdmin.id, email: otherAdmin.email, is_admin: true, active: true }]);
    }
    throw new Error("Ruta no simulada: " + value);
  };
  const res = capture();
  await handler({
    method: "POST",
    headers: { authorization: "Bearer admin-token" },
    body: { action: "resetUserToOnboarding", userId: otherAdmin.id },
  }, res);
  assert(res.statusCode === 409, "No debe permitir reiniciar a otro administrador.");
  console.log("  Test 6 pasado: no se puede reiniciar a otra cuenta administradora");
}

// ── resetUserToOnboarding: no puede aplicarse sobre uno mismo ──────────────
{
  global.fetch = async (url) => {
    const value = String(url);
    if (value.endsWith("/auth/v1/user")) return response(200, admin);
    if (value.includes("/rest/v1/profiles?id=eq." + admin.id)) {
      return response(200, [{ id: admin.id, email: admin.email, is_admin: true, active: true }]);
    }
    throw new Error("Ruta no simulada: " + value);
  };
  const res = capture();
  await handler({
    method: "POST",
    headers: { authorization: "Bearer admin-token" },
    body: { action: "resetUserToOnboarding", userId: admin.id },
  }, res);
  assert(res.statusCode === 400, "No debe permitir que un admin se reinicie a sí mismo desde el panel.");
  console.log("  Test 7 pasado: un admin no puede reiniciarse a sí mismo");
}

console.log("API admin (REQ-126): preview/aplicar reseteo de plan y reinicio de usuario verificados con mocks.");
