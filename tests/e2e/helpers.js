// Helpers de la suite E2E (REQ-96).
//
// Principio: la app corre ENTERA y real en el navegador; lo único simulado es
// la red. Todas las llamadas a Supabase, /api/* y CDNs se interceptan con
// fixtures deterministas — 0 llamadas pagadas, 0 dependencia de producción.
//
// El loop auditor puede reusar `installMocks` + `seedLoggedInUser` para llegar
// autenticado a cualquier pantalla durante su verificación funcional.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { INGREDIENTS, buildMealsForTargets } from "./fixtures/catalog.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SUPA_REF = "e2emock";
export const SUPA_URL = `https://${SUPA_REF}.supabase.co`;
export const STORAGE_KEY = `sb-${SUPA_REF}-auth-token`;
export const USER_ID = "e2e00000-0000-4000-8000-000000000001";
export const USER_EMAIL = "e2e@fitbros.test";
const LOCAL_ORIGIN = "http://127.0.0.1:8923";

const iso = (offsetMs = 0) => new Date(Date.now() + offsetMs).toISOString();
const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const todayYmd = () => ymd(new Date());
export const daysFromToday = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return ymd(d);
};

// El orden real de días de entreno en la app es Lunes..Domingo (WEEKDAY_OPTIONS
// en js/nutrition-pure.js), no el orden numérico de Date#getDay() (0=Domingo).
// workoutSchedule() asigna las sesiones segun este orden. El fixture usa
// trainingPriority="strength" para que los 4 slots sean de fuerza incluso si
// Domingo queda al final tras la normalizacion de la app.
const WEEKDAY_APP_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Lunes..Domingo

/**
 * 4 dias de entreno/semana, siempre incluyendo el dia actual. 0=Dom...6=Sab.
 * Acepta una fecha inyectada para validar los 7 dias sin tocar el reloj real.
 */
export function trainingDaysIncludingToday(referenceDate = new Date()) {
  const dow = referenceDate instanceof Date ? referenceDate.getDay() : Number(referenceDate);
  const rank = WEEKDAY_APP_ORDER.indexOf(dow);
  if (rank < 0) throw new Error(`Dia de semana invalido para fixture E2E: ${referenceDate}`);
  const days = new Set([dow]);
  for (let offset = 1; days.size < 4; offset++) {
    days.add(WEEKDAY_APP_ORDER[(rank + offset) % 7]);
  }
  return [...days];
}

/* ── Fixtures de usuario ──────────────────────────────────────────────── */

export function sessionFixture() {
  return {
    access_token: "e2e-access-token",
    token_type: "bearer",
    expires_in: 6 * 3600,
    expires_at: Math.floor(Date.now() / 1000) + 6 * 3600,
    refresh_token: "e2e-refresh-token",
    user: {
      id: USER_ID,
      aud: "authenticated",
      role: "authenticated",
      email: USER_EMAIL,
      email_confirmed_at: "2026-01-01T00:00:00Z",
      app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: {},
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
  };
}

// Perfil COMPLETO: pasa hasCompleteOnboarding() + edad ≥18 + schema v3 (sin
// migración → sin upsert al arrancar). Plan de 10 semanas que cubre hoy.
export function completePrefs(overrides = {}) {
  return {
    profileSchemaVersion: 3,
    name: "Bro de Pruebas",
    sex: "male",
    age: 30,
    heightCm: 175,
    weightKg: 75,
    bodyFatPct: 18,
    activityLevel: "moderate",
    goal: "deficit",
    calorieTarget: 2200,
    proteinTarget: 160,
    carbTarget: 220,
    fatTarget: 65,
    maintenanceCalories: 2600,
    macroMethod: "formula",
    primarySport: "strength_only",
    strengthMode: "gym",
    // Incluye SIEMPRE el día de hoy para que "hoy hay entreno" sea invariante
    // sin importar qué día de la semana corra la suite.
    trainingDays: trainingDaysIncludingToday(),
    sessionMinutes: 60,
    equipment: ["barbell", "dumbbells", "machines", "pullup"],
    trainingExperience: "intermediate",
    trainingPriority: "strength",
    preferredTrainingTime: "morning",
    injuries: "",
    limitations: "",
    avoidMovements: "",
    diet: [],
    mealCount: 3,
    mealTimes: ["08:00", "13:00", "20:00"],
    // Debe encerrar mealTimes[0..n-1] o validateFoodSchedule rechaza el guardado.
    eatingWindowStart: "07:00",
    eatingWindowEnd: "21:00",
    mainMealIndex: 2,
    cookingMinutes: 30,
    foodBudget: "medium",
    repeatPreference: "moderate",
    preferredCuisines: ["peruvian"],
    preferredPreparations: ["quick"],
    preferredIngredients: "",
    foodNotes: "",
    allergies: "",
    dislikedIngredients: "",
    onboardingCompletedAt: iso(-2 * 24 * 3600 * 1000),
    onboardingReviewedAt: iso(-2 * 24 * 3600 * 1000),
    planCycleNumber: 1,
    planDurationWeeks: 10,
    planStartDate: daysFromToday(-9),
    planEndDate: daysFromToday(-9 + 7 * 10 - 1),
    ...overrides,
  };
}

export function profileFixture(prefs) {
  return {
    id: USER_ID,
    email: USER_EMAIL,
    is_admin: false,
    active: true,
    prefs: prefs ?? completePrefs(),
  };
}

export function consentsFixture() {
  const POLICY = "2026-06-15-v2"; // CONSENT_POLICY_VERSION (index.html)
  return ["body_progress", "automated_coach", "progress_photos"].map((type, i) => ({
    id: i + 1,
    user_id: USER_ID,
    consent_type: type,
    policy_version: POLICY,
    status: "accepted",
    created_at: "2026-06-20T00:00:00Z",
  }));
}

export function screeningFixture() {
  return {
    id: 1,
    user_id: USER_ID,
    screening_version: "2026-06-15", // SAFETY_SCREENING_VERSION (index.html)
    age_confirmed: true,
    cleared_for_training: true,
    has_red_flags: false,
    responses: {},
    created_at: "2026-06-20T00:00:00Z",
  };
}

export function entitlementFixture() {
  return {
    entitlement: {
      plan_id: "monthly",
      status: "active",
      starts_at: iso(-10 * 24 * 3600 * 1000),
      expires_at: iso(30 * 24 * 3600 * 1000),
    },
    expired: null,
  };
}

/* ── Mock del coach (/api/claude) ─────────────────────────────────────── */
// Lee las metas y los slots del propio prompt y construye un día que cumple
// exactamente esas metas con ingredientes del catálogo fixture, para que
// validateGeneratedDay + recalcCoachMealMacros lo acepten.
function coachReply(payload) {
  const text = String(payload?.userText || "");
  const m = text.match(/Metas del día:\s*(\d+)\s*kcal,\s*(\d+)\s*g proteína,\s*(\d+)\s*g carbohidratos,\s*(\d+)\s*g grasa/);
  if (m) {
    const target = { kcal: +m[1], p: +m[2], c: +m[3], f: +m[4] };
    const slotsLine = text.match(/"slot_id"\):\s*([^\n]+)/);
    const slotIds = slotsLine
      ? [...slotsLine[1].matchAll(/(?:^|,\s*)([a-z0-9_]+)\s*\(/g)].map((x) => x[1])
      : [];
    const comidas = buildMealsForTargets(target, slotIds);
    return { text: JSON.stringify({ explicacion: "Día armado con tus metas y tu catálogo.", comidas }) };
  }
  // Cualquier otra acción del coach: respuesta breve y neutra (sin vocabulario de IA, REQ-31).
  return { text: "Anotado. Sigue con tu plan de hoy y registra cómo te fue." };
}

/* ── Router PostgREST ─────────────────────────────────────────────────── */

function pgrstRespond(route, { row = undefined, rows = undefined } = {}) {
  const req = route.request();
  const method = req.method();
  const accept = req.headers()["accept"] || "";
  const wantsObject = accept.includes("vnd.pgrst.object");
  const prefer = req.headers()["prefer"] || "";

  if (method === "GET" || method === "HEAD") {
    if (wantsObject) {
      if (row == null) {
        return route.fulfill({
          status: 406,
          contentType: "application/json",
          body: JSON.stringify({
            code: "PGRST116",
            message: "JSON object requested, multiple (or no) rows returned",
            details: "The result contains 0 rows",
          }),
        });
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(row) });
    }
    const list = rows ?? (row != null ? [row] : []);
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "content-range": `0-${Math.max(list.length - 1, 0)}/${list.length}` },
      body: JSON.stringify(list),
    });
  }
  if (method === "POST" || method === "PATCH" || method === "PUT") {
    if (prefer.includes("return=representation")) {
      let body = [];
      try { body = JSON.parse(req.postData() || "[]"); } catch {}
      const list = Array.isArray(body) ? body : [body];
      return route.fulfill({
        status: method === "POST" ? 201 : 200,
        contentType: "application/json",
        body: JSON.stringify(wantsObject ? list[0] ?? {} : list),
      });
    }
    return route.fulfill({ status: method === "POST" ? 201 : 204, body: "" });
  }
  if (method === "DELETE") return route.fulfill({ status: 204, body: "" });
  return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
}

/* ── Instalación de mocks sobre el contexto ───────────────────────────── */

/**
 * Intercepta TODA la red. `opts.tables` permite fijar fixtures por tabla:
 *   { profiles: {row}, user_consents: {rows}, weight_log: {rows}, ... }
 * Devuelve `calls`: registro de escrituras REST para asserts (tabla, método, payload).
 */
export async function installMocks(context, opts = {}) {
  const calls = [];
  const tables = {
    profiles: { row: profileFixture(opts.prefs) },
    user_consents: { rows: consentsFixture() },
    safety_screenings: { row: screeningFixture() },
    ingredients: { rows: INGREDIENTS },
    dishes: { rows: [] },
    dish_ingredients: { rows: [] },
    diets: { rows: [] },
    diet_dishes: { rows: [] },
    exercises: { rows: [] }, // fuerza el fallback LOCAL_EXERCISES (REQ-93), sin depender de seed
    plan_versions: { rows: [] },
    plan_cycles: { rows: [] },
    day_log: { rows: [] },
    weight_log: { rows: [] },
    notification_preferences: { rows: [] },
    ...(opts.tables || {}),
  };

  // 1) Catch-all: nada sale a internet. Registrado primero = se evalúa último.
  await context.route("**/*", (route) => {
    const url = route.request().url();
    if (url.startsWith(LOCAL_ORIGIN)) return route.continue();
    return route.abort("blockedbyclient");
  });

  // 2) CDN de supabase-js → copia vendorizada local (offline).
  await context.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: fs.readFileSync(path.join(HERE, "vendor", "supabase-js-2.min.js")),
    }),
  );

  // 3) Fuentes: CSS vacío para no tocar Google Fonts.
  await context.route("https://fonts.googleapis.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/css", body: "/* e2e: sin fuentes externas */" }),
  );
  await context.route("https://fonts.gstatic.com/**", (route) => route.abort("blockedbyclient"));

  // 4) Funciones serverless /api/*.
  await context.route("**/api/config", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        supabase: { url: SUPA_URL, publishableKey: "e2e-publishable-key" },
        anthropic: { model: "", proxy: true },
      }),
    }),
  );
  await context.route("**/api/entitlement**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        route.request().url().includes("billing-history") ? { history: [] } : entitlementFixture(),
      ),
    }),
  );
  await context.route("**/api/analytics", (route) => {
    if (route.request().method() === "POST")
      return route.fulfill({ status: 204, body: "" });
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ funnel: [], ai_costs: [], summary: {} }),
    });
  });
  // {plans:[]} → la app usa su catálogo fallback inline, sin error de consola
  await context.route("**/api/catalog", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ plans: [] }) }),
  );
  await context.route("**/api/privacy**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
  );
  await context.route("**/api/push-subscribe**", (route) => route.fulfill({ status: 204, body: "" }));
  await context.route("**/api/claude", (route) => {
    let payload = {};
    try { payload = JSON.parse(route.request().postData() || "{}"); } catch {}
    calls.push({ table: "/api/claude", method: "POST", payload });
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(coachReply(payload)),
    });
  });

  // 5) Supabase: auth, storage y PostgREST.
  await context.route(`${SUPA_URL}/auth/v1/**`, (route) => {
    const url = route.request().url();
    if (url.includes("/logout")) return route.fulfill({ status: 204, body: "" });
    if (url.includes("/user"))
      return route.fulfill({
        status: 200, contentType: "application/json", body: JSON.stringify(sessionFixture().user),
      });
    return route.fulfill({
      status: 200, contentType: "application/json", body: JSON.stringify(sessionFixture()),
    });
  });
  await context.route(`${SUPA_URL}/storage/v1/**`, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
  );
  // Tablas de escritura del usuario: el mock es STATEFUL (lo upserteado se
  // devuelve en GETs posteriores). La app trata a Supabase como fuente de
  // verdad (p. ej. pullWeights borra lo que el remoto no tenga), así que un
  // mock sin memoria haría desaparecer datos recién guardados.
  const STATEFUL = { weight_log: "week", day_log: "ds", plan_versions: "id", plan_cycles: "cycle_number" };
  const store = Object.fromEntries(Object.keys(STATEFUL).map((t) => [t, new Map()]));
  let autoId = 1000;

  await context.route(`${SUPA_URL}/rest/v1/**`, (route) => {
    const url = new URL(route.request().url());
    const table = url.pathname.replace(/^\/rest\/v1\//, "").split("/")[0];
    const method = route.request().method();
    if (method !== "GET" && method !== "HEAD") {
      let payload = null;
      try { payload = JSON.parse(route.request().postData() || "null"); } catch {}
      calls.push({ table, method, payload });
      if (store[table] && (method === "POST" || method === "PATCH")) {
        const keyField = STATEFUL[table];
        for (const raw of Array.isArray(payload) ? payload : payload ? [payload] : []) {
          const row = { id: autoId++, ...raw };
          store[table].set(String(row[keyField] ?? row.id), row);
        }
      }
    }
    if (store[table]) {
      const stored = [...store[table].values()];
      const fixture = tables[table] || {};
      const base = fixture.rows ?? (fixture.row != null ? [fixture.row] : []);
      // Filtros PostgREST `col=eq.valor` (suficiente para maybeSingle post-upsert)
      const eqs = [...url.searchParams.entries()]
        .filter(([, v]) => typeof v === "string" && v.startsWith("eq."))
        .map(([k, v]) => [k, v.slice(3)]);
      const rows = [...base, ...stored].filter((r) =>
        eqs.every(([k, v]) => !(k in r) || String(r[k]) === v),
      );
      return pgrstRespond(route, { rows, row: rows[0] });
    }
    return pgrstRespond(route, tables[table] || { rows: [] });
  });

  return { calls, tables };
}

/* ── Estado inicial del navegador ─────────────────────────────────────── */

/** Siembra sesión de Supabase + tour visto ANTES de que cargue la app. */
export async function seedLoggedInUser(page, { skipTour = true } = {}) {
  await page.addInitScript(
    ({ storageKey, session, skipTour }) => {
      localStorage.setItem(storageKey, JSON.stringify(session));
      if (skipTour) localStorage.setItem("fitbros_tour_v1", "done");
    },
    { storageKey: STORAGE_KEY, session: sessionFixture(), skipTour },
  );
}

/** Colector de errores de consola y excepciones no atrapadas. */
export function collectConsoleErrors(page) {
  const errors = [];
  const IGNORE = [
    /favicon/i,
    /apple-touch/i,
    /manifest/i,
    /service.?worker/i, // bloqueado a propósito por la config E2E
    /net::ERR_BLOCKED_BY_CLIENT|blockedbyclient/i, // catch-all de red externa
    /Failed to load resource.*(fonts|gstatic)/i,
  ];
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (IGNORE.some((re) => re.test(text))) return;
    errors.push(text);
  });
  page.on("pageerror", (err) => {
    const text = String(err && err.message ? err.message : err);
    if (IGNORE.some((re) => re.test(text))) return;
    errors.push(`pageerror: ${text}`);
  });
  return errors;
}

/**
 * Nudges/interstitials legítimos que pueden taparse en medio de un journey.
 * Se descartan igual que lo haría un usuario (clic en su botón), solo si aparecen.
 */
export async function autoDismissNudges(page) {
  const cardio = page.locator('#overlay [onclick="dismissCardioNudge()"]');
  await page.addLocatorHandler(cardio, async () => {
    await cardio.click();
  });
}

/** Navega a la app y espera a que salga del splash. */
export async function gotoApp(page) {
  await page.goto("/index.html");
  await page.waitForFunction(
    () => !document.querySelector("#app .splash") && document.querySelector("#app")?.childElementCount > 0,
    { timeout: 15_000 },
  );
}
