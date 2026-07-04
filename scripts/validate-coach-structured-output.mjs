import assert from "node:assert/strict";
import fs from "node:fs";

const api = fs.readFileSync(new URL("../api/claude.js", import.meta.url), "utf8");
const admin = fs.readFileSync(new URL("../api/admin.js", import.meta.url), "utf8");
const analytics = fs.readFileSync(new URL("../supabase/analytics.sql", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const readme = fs.readFileSync(new URL("../README.md", import.meta.url), "utf8");

assert.ok(api.includes('"claude-sonnet-5"'), "ALLOWED_MODELS debe incluir claude-sonnet-5.");
assert.ok(api.includes("introUntil: \"2026-08-31T23:59:59Z\""), "MODEL_COSTS debe registrar precio introductorio de Sonnet 5.");
assert.ok(api.includes("ANTHROPIC_MODEL_DIET") && api.includes("ANTHROPIC_MODEL_MEAL_OPTION"), "Debe existir modelo por accion via env.");
assert.ok(api.includes("output_config: { format: { type: \"json_schema\", schema } }"), "El proxy debe enviar output_config.format json_schema.");
assert.ok(api.includes("structuredRejected(response.status, data)") && api.includes("structuredFallback = true"), "Debe existir fallback si structured outputs es rechazado.");
assert.ok(api.includes("), 4096)"), "El proxy debe capear maxTokens en 4096.");
assert.ok(api.includes("dietDayOutputSchema") && api.includes("mealOptionOutputSchema"), "Faltan schemas de diet_day/diet_week o meal_option.");
assert.ok(html.includes("Math.min(4096") && html.includes("mealCount*520"), "generateOneDay debe pedir tokens segun cantidad de comidas.");
assert.ok(analytics.includes("CREATE OR REPLACE VIEW v_coach_model_gate"), "analytics.sql debe crear v_coach_model_gate.");
assert.ok(analytics.includes("invalid_provider_output_rate_pct") && analytics.includes("degradation_rate_pct"), "La vista del gate debe reportar JSON invalido y degradacion.");
assert.ok(admin.includes("v_coach_model_gate") && admin.includes("modelGate"), "El admin debe exponer modelGate desde quotaOverview.");
assert.ok(readme.includes("ANTHROPIC_MODEL_DIET") && readme.includes("claude-sonnet-5"), "README debe documentar env de dieta y criterio del gate.");

console.log("Structured outputs del coach: proxy, gate admin y documentacion validados.");
