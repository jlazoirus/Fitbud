// REQ-278: contrato real del proxy con Supabase/proveedor simulados.
import assert from "node:assert/strict";
import fs from "node:fs";
const source = fs.readFileSync(new URL("../api/claude.js", import.meta.url), "utf8");
const handler = (await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"))).default;
process.env.SUPABASE_URL = "https://estimate.test";
process.env.SUPABASE_PUBLISHABLE_KEY = "public-test";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service-test";
process.env.ANTHROPIC_API_KEY = "provider-test";
const estimate = JSON.stringify({ nombre: "Yogur", kcal: 500, proteina_g: 25, carbohidratos_g: 55, grasa_g: 20, nota: "Porción indicada.", preguntas: [] });
const userA = "11111111-1111-4111-8111-111111111111";
const userB = "22222222-2222-4222-8222-222222222222";
const pool = [];
let nextId = 1;
const response = (status, data) => ({ ok: status >= 200 && status < 300, status, json: async () => data });
const payload = (extra = {}) => ({
  userText: "Un yogur de 250 g", system: "Contexto estable", ...extra,
  quota: { action: "meal_estimate", requestId: "33333333-3333-4333-8333-333333333333", partKey: "estimate", contextKey: "same-client-key", fallbackText: estimate, ...extra.quota },
});
async function call(body, opts = {}) {
  const log = { provider: 0, failures: 0, completed: 0, selections: [], keys: [] };
  let claims = 0;
  const userId = opts.user || userA;
  global.fetch = async (url, init = {}) => {
    const u = new URL(url), data = JSON.parse(init.body || "{}");
    if (u.pathname === "/auth/v1/user") return response(200, { id: userId });
    if (u.pathname === "/rest/v1/profiles") return response(200, [{ active: true, is_admin: false, prefs: { age: 30 } }]);
    if (u.pathname === "/rest/v1/user_consents") return response(200, [{ consent_type: "body_progress" }, { consent_type: "automated_coach" }]);
    if (u.pathname === "/rest/v1/safety_screenings") return response(200, [{ age_confirmed: true, has_red_flags: false, cleared_for_training: true }]);
    if (u.pathname === "/rest/v1/user_entitlements") return response(200, [{ id: 1 }]);
    if (u.pathname === "/rest/v1/rpc/reserve_coach_action") {
      assert.equal(data.p_user_id, userId);
      return response(200, [{ usage_id: 10, mode: opts.mode || "fresh", policy_enabled: true }]);
    }
    if (u.pathname === "/rest/v1/rpc/claim_coach_generation_part") {
      claims++;
      if (opts.part && (!opts.wait || claims > 1)) return response(200, [opts.part]);
      return response(200, [{ claimed: !opts.wait, part_status: "processing" }]);
    }
    if (u.pathname === "/rest/v1/rpc/complete_fresh_coach_part") {
      log.completed++;
      const row = { id: nextId++, user_id: userId, context_key: data.p_context_key, response_text: data.p_response_text };
      pool.push(row);log.keys.push(row.context_key);
      return response(200, [{ stored_result_id: row.id }]);
    }
    if (u.pathname === "/rest/v1/rpc/select_reusable_coach_part") {
      log.selections.push(data);log.keys.push(data.p_context_key);
      assert.equal(data.p_fallback_text, "", "No debe enviar al RPC una plantilla, incluso si el cliente la manda");
      if (opts.selected) return response(200, [opts.selected]);
      const row = pool.find(r => r.user_id === userId && r.context_key === data.p_context_key);
      if (!row) return response(400, { message: "compatible_fallback_required" });
      return response(200, [{ selected_origin: "user_pool", selected_result_id: row.id, selected_text: row.response_text }]);
    }
    if (u.pathname === "/rest/v1/coach_option_pool") {
      assert.equal(u.searchParams.get("action"), "eq.meal_estimate");
      assert.equal(u.searchParams.get("status"), "eq.active");
      assert.equal(u.searchParams.get("user_id"), "eq." + userId);
      log.keys.push(u.searchParams.get("context_key").slice(3));
      return response(200, pool.filter(r => ["id", "user_id", "context_key"].every(k => "eq." + r[k] === u.searchParams.get(k))));
    }
    if (u.pathname === "/rest/v1/rpc/fail_coach_generation_part") { log.failures++;return response(200, true); }
    if (u.hostname === "api.anthropic.com") {
      log.provider++;
      return opts.providerError ? response(503, { error: { message: "overloaded" } })
        : response(200, { content: [{ text: estimate }], usage: {} });
    }
    throw new Error("Ruta sin fixture: " + u.pathname);
  };
  const res = { statusCode: 0, body: null, status(n) { this.statusCode = n;return this; }, json(body) { this.body = body;return this; } };
  await handler({ method: "POST", headers: { authorization: "Bearer fixture" }, body }, res);
  return { ...res, log };
}
const ready = (r, source) => {
  assert.equal(r.statusCode, 200, JSON.stringify(r.body));
  assert.equal(r.body.origin, source === "generated" ? "fresh" : "reused");
  assert.equal(r.body.text, estimate);
};
const unavailable = r => {
  assert.equal(r.statusCode, 422, JSON.stringify(r.body));
  assert.equal(r.body.code, "no_compatible_result");
  assert.equal(r.body.text, undefined);
  assert.equal(r.body.origin, undefined);
  assert.equal(r.log.provider, 0);
};

let r = await call(payload());ready(r, "generated");
assert.equal(r.log.provider, 1);assert.equal(r.log.completed, 1);
assert.match(r.log.keys[0], /^estimate-v2-[a-f0-9]{64}$/);
// Una estimación genuina de 500 kcal es válida: se rechaza el origen de plantilla, no el número.
r = await call(payload(), { mode: "reuse" });ready(r, "reused");assert.equal(r.log.provider, 0);
unavailable(await call(payload({ userText: "Un vaso de agua" }), { mode: "reuse" }));
unavailable(await call(payload(), { mode: "reuse", user: userB }));
unavailable(await call(payload({ system: "Restricciones cambiadas" }), { mode: "reuse" }));
process.env.ANTHROPIC_MODEL_MEAL_ESTIMATE = "claude-sonnet-4-6";
unavailable(await call(payload(), { mode: "reuse" }));
delete process.env.ANTHROPIC_MODEL_MEAL_ESTIMATE;
console.log("Texto, usuario, contexto y política/modelo quedan aislados; reutilización válida sin proveedor.");

const image = { mediaType: "image/jpeg", data: Buffer.from("photo-a").toString("base64") };
const photo = payload({ image, userText: "Foto y aclaración: al horno" });
ready(await call(photo), "generated");ready(await call(photo, { mode: "reuse" }), "reused");
unavailable(await call(payload({ ...photo, image: { ...image, data: Buffer.from("photo-b").toString("base64") } }), { mode: "reuse" }));
unavailable(await call(payload({ ...photo, userText: "Foto y aclaración: fritas" }), { mode: "reuse" }));
console.log("Foto y aclaraciones se verifican en servidor aunque se repita la clave enviada por el cliente.");

unavailable(await call(payload(), { mode: "reuse", selected: { selected_origin: "template", selected_text: estimate, selected_result_id: null } }));
unavailable(await call(payload(), { mode: "reuse", selected: { selected_origin: "user_pool", selected_text: "JSON inválido", selected_result_id: pool[0].id } }));
const completed = { claimed: false, part_status: "completed", response_text: estimate, result_id: pool[0].id };
ready(await call(payload(), { part: completed }), "reused");
ready(await call(payload(), { part: completed, wait: true }), "reused");
unavailable(await call(payload(), { part: { ...completed, result_id: null } }));
unavailable(await call(payload({ userText: "Otra comida con el mismo requestId" }), { part: completed }));
unavailable(await call(payload(), { part: { ...completed, result_id: pool[1].id }, wait: true }));
r = await call(payload(), { providerError: true });
assert.equal(r.statusCode, 503);assert.equal(r.log.completed, 0);assert.equal(r.log.failures, 1);
assert.equal(r.body.origin, undefined);
console.log("Plantillas legacy, replays incompatibles y errores de proveedor nunca se publican como estimación.");
console.log("test-meal-estimate-reuse: OK");
