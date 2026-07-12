#!/usr/bin/env node
// REQ-139 — DIET_CONTRACT pasa a runtimeActive:true, pero solo como aviso suave
// no bloqueante sobre el día ya cerrado. Verifica en el código fuente (sin
// ejecutar la app, mismo patrón que validate-nutrition-finalize-wiring.mjs):
// (a) el flag quedó activo en el dominio puro;
// (b) el aviso se calcula y se muestra en revisión y al aplicar (día/semana/día práctico);
// (c) ningún flujo de aplicar/guardar bloquea por incumplir el contrato;
// (d) el copy nuevo no usa vocabulario técnico prohibido (REQ-31).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import "../js/nutrition-pure.js";
import "../js/nutrition-domain.js";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const src = readFileSync(join(ROOT, "index.html"), "utf8");
const nd = globalThis.FITBUD_NUTRITION_DOMAIN;

const errors = [];
function fail(msg) { errors.push(msg); }

// (a) Dominio puro
assert.ok(nd, "FITBUD_NUTRITION_DOMAIN debe existir");
assert.equal(nd.DIET_CONTRACT.runtimeActive, true, "REQ-139 debe activar runtimeActive");
assert.equal(typeof nd.validateDietContractTotals, "function", "validateDietContractTotals debe exportarse");

function extractFunctionBody(name) {
  const re = new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\(`);
  const m = re.exec(src);
  if (!m) return null;
  const braceStart = src.indexOf("{", m.index);
  if (braceStart < 0) return null;
  let depth = 0;
  for (let i = braceStart; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") {
      depth--;
      if (depth === 0) return src.slice(braceStart, i + 1);
    }
  }
  return null;
}

// (b) El helper de aviso existe, es puro y depende del dominio (no inventa su propio umbral).
const noticeBody = extractFunctionBody("dietContractNoticeText");
if (!noticeBody) fail("No se encontró dietContractNoticeText() en index.html.");
else if (!noticeBody.includes("validateDietContractTotals(")) {
  fail("dietContractNoticeText() debe delegar en nd.validateDietContractTotals().");
}

// Se muestra en la pantalla de revisión (día y semana) y al aplicar (día, semana, día práctico).
const NOTICE_CALL = "dietContractNoticeText(";
const SURFACES = [
  "genReviewHtml",
  "genWeekReviewHtml",
  "applyGeneratedDay",
  "applyWeekPlan",
  "applyDeterministicDay",
];
for (const name of SURFACES) {
  const body = extractFunctionBody(name);
  if (!body) { fail(`No se encontró la función ${name}() en index.html.`); continue; }
  if (!body.includes(NOTICE_CALL)) {
    fail(`${name}() no muestra el aviso suave de DIET_CONTRACT (${NOTICE_CALL}).`);
  }
}

// (c) finalizedDayIsComplete() sigue siendo el único criterio de "aplicable" — no debe
// consultar el contrato para decidir si un día se puede aplicar.
const completeBody = extractFunctionBody("finalizedDayIsComplete");
if (!completeBody) fail("No se encontró finalizedDayIsComplete() en index.html.");
else if (/\.contract\b/.test(completeBody)) {
  fail("finalizedDayIsComplete() no debe depender de .contract; solo de cobertura de slots.");
}

// Los flujos que aplican/guardan un día no deben tener un guard que corte antes de
// aplicar cuando el contrato falla (blocking regression guard).
const BLOCKING_PATTERN = /contract\s*&&?\s*!?\s*contract\.ok[^\n]{0,40}(return|closeModal\(\))/;
const APPLY_FLOWS = ["applyDayComidas", "applyGeneratedDay", "applyWeekPlan", "applyDeterministicDay"];
for (const name of APPLY_FLOWS) {
  const body = extractFunctionBody(name);
  if (!body) { fail(`No se encontró la función ${name}() en index.html.`); continue; }
  if (BLOCKING_PATTERN.test(body)) {
    fail(`${name}() parece bloquear la aplicación cuando DIET_CONTRACT falla; debe ser solo informativo.`);
  }
  if (!body.includes("applyDayComidas(") && name !== "applyDayComidas") {
    fail(`${name}() debe seguir llamando applyDayComidas() sin condicionarlo al contrato.`);
  }
}

// (d) Vocabulario prohibido (REQ-31) en el copy nuevo del aviso suave.
const FORBIDDEN_RE = /\b(ia|inteligencia artificial|claude|anthropic|proveedor|modelo|prompt|tokens?|cuotas?)\b/i;
if (noticeBody) {
  const stringLiterals = [...noticeBody.matchAll(/"([^"]*)"|'([^']*)'/g)].map(m => m[1] || m[2] || "");
  for (const literal of stringLiterals) {
    if (FORBIDDEN_RE.test(literal)) {
      fail(`El copy "${literal}" de dietContractNoticeText() usa vocabulario técnico prohibido (REQ-31).`);
    }
  }
}

console.log("Aviso suave de DIET_CONTRACT en runtime (REQ-139):");
if (errors.length) {
  console.error(`\n✗ ${errors.length} error(es):`);
  errors.forEach(e => console.error("    ✗ " + e));
  process.exit(1);
}
console.log(`✓ runtimeActive=true, aviso visible en ${SURFACES.length} pantallas, sin bloqueo de aplicar/guardar, sin vocabulario prohibido.`);
