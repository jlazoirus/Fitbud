// REQ-86 — coachCompatibilityContext debe usar COACH_PROMPT_VERSION (no un
// literal hardcodeado) para que bumpar la constante invalide el cache de
// resultados reutilizables cuando cambia la lógica del prompt.
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

// 1. La constante COACH_PROMPT_VERSION existe y es >= 2
const constMatch = html.match(/const\s+COACH_PROMPT_VERSION\s*=\s*(\d+)/);
assert.ok(constMatch, "Debe existir const COACH_PROMPT_VERSION = N en index.html.");
const ver = Number(constMatch[1]);
assert.ok(ver >= 2, `COACH_PROMPT_VERSION debe ser >= 2 (actual: ${ver}). La versión 1 era el literal hardcodeado pre-REQ-86.`);

// 2. coachCompatibilityContext usa la constante, no un literal
const ctxStart = html.indexOf("function coachCompatibilityContext(");
assert.ok(ctxStart !== -1, "Debe existir function coachCompatibilityContext.");
const ctxBlock = html.slice(ctxStart, ctxStart + 600);
assert.ok(
  ctxBlock.includes("version:COACH_PROMPT_VERSION"),
  "coachCompatibilityContext debe usar version:COACH_PROMPT_VERSION, no un literal numérico."
);
assert.ok(
  !(/version:\s*\d+/.test(ctxBlock)),
  "coachCompatibilityContext NO debe tener version:N con un literal numérico."
);

console.log(`Coach prompt version: COACH_PROMPT_VERSION=${ver}, wired en coachCompatibilityContext — OK.`);
