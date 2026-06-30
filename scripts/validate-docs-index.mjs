#!/usr/bin/env node
// Validates the compact hot-path docs used by autonomous agents.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REQUIREMENTS = path.join(ROOT, "REQUIREMENTS.md");
const CONTEXT = path.join(ROOT, "CONTEXT.md");
const REQ_HISTORY = path.join(ROOT, "docs", "requirements-history.md");
const ARCH_REF = path.join(ROOT, "docs", "architecture-reference.md");

const MAX_REQUIREMENTS_WORDS = 15000;
const MAX_CONTEXT_WORDS = 2500;
function read(file) {
  if (!fs.existsSync(file)) throw new Error(`Missing file: ${path.relative(ROOT, file)}`);
  return fs.readFileSync(file, "utf8");
}

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function parseRequirements(markdown) {
  const matches = [...markdown.matchAll(/^## (REQ-(\d+)) - (.+)$/gm)];
  return matches.map((match, index) => {
    const start = match.index;
    const end = index + 1 < matches.length ? matches[index + 1].index : markdown.length;
    const body = markdown.slice(start, end);
    const statusMatch = body.match(/^\*\*Estado:\s*(.+?)\*\*/m);
    return {
      id: match[1],
      number: Number(match[2]),
      title: match[3].trim(),
      body,
      status: statusMatch ? statusMatch[1].trim() : "",
    };
  });
}

function isManualOrHuman(status) {
  return /no implementable por el agente|requiere accion humana|requiere acción humana|requiere accion manual|requiere acción manual|requiere entrevistas/i.test(status);
}

function hasAnyHeading(body, variants) {
  return variants.some((heading) => body.includes(heading));
}

const errors = [];
const reqText = read(REQUIREMENTS);
const ctxText = read(CONTEXT);
const historyText = read(REQ_HISTORY);
const archText = read(ARCH_REF);
const sections = parseRequirements(reqText);

if (!sections.length) {
  errors.push("REQUIREMENTS.md has no REQ sections");
}

const seen = new Set();
for (const section of sections) {
  if (seen.has(section.number)) errors.push(`Duplicate ${section.id}`);
  seen.add(section.number);
}

const max = Math.max(...sections.map((section) => section.number));
for (let i = 1; i <= max; i += 1) {
  if (!seen.has(i)) errors.push(`Missing REQ-${String(i).padStart(2, "0")}`);
}

for (const section of sections) {
  if (!section.status) {
    errors.push(`${section.id} has no Estado line`);
    continue;
  }
  const implemented = /\bimplementado\b/i.test(section.status);
  const pending = /\bpendiente\b/i.test(section.status);
  const manual = isManualOrHuman(section.status);

  if (implemented && pending) {
    errors.push(`${section.id} status is ambiguous: contains implementado and pendiente`);
  }
  if (!implemented && !pending) {
    errors.push(`${section.id} status must contain implementado or pendiente`);
  }
  if (pending && !manual) {
    const hasCore = [
      ["### Origen"],
      ["### Problema"],
      ["### Objetivo"],
      ["### Alcance"],
      ["### Fuera de alcance"],
      ["### Riesgos"],
      ["### Criterios de aceptación", "### Criterios de aceptacion"],
      ["### Verificación sugerida", "### Verificacion sugerida"],
    ].every((variants) => hasAnyHeading(section.body, variants));
    if (!hasCore) errors.push(`${section.id} pending automatable REQ is missing required headings`);
  }
}

const reqWords = wordCount(reqText);
const ctxWords = wordCount(ctxText);
if (reqWords > MAX_REQUIREMENTS_WORDS) {
  errors.push(`REQUIREMENTS.md is too large for hot-path reading: ${reqWords} words > ${MAX_REQUIREMENTS_WORDS}`);
}
if (ctxWords > MAX_CONTEXT_WORDS) {
  errors.push(`CONTEXT.md is too large for hot-path reading: ${ctxWords} words > ${MAX_CONTEXT_WORDS}`);
}

if (!reqText.includes("docs/requirements-history.md")) {
  errors.push("REQUIREMENTS.md does not point to docs/requirements-history.md");
}
if (!ctxText.includes("docs/architecture-reference.md")) {
  errors.push("CONTEXT.md does not point to docs/architecture-reference.md");
}
if (!historyText.includes("## REQ-01") || !historyText.includes("## REQ-79")) {
  errors.push("docs/requirements-history.md does not look like the archived historical backlog");
}
if (!archText.includes("# Fitbud") || !archText.includes("## 3. Mapa de archivos")) {
  errors.push("docs/architecture-reference.md does not look like the archived extended context");
}

if (errors.length) {
  console.error("Docs index validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const pendingAuto = sections
  .filter((section) => /\bpendiente\b/i.test(section.status) && !isManualOrHuman(section.status))
  .map((section) => section.id);

console.log(`Docs index OK: ${sections.length} REQ sections, ${pendingAuto.length} automatable pending, ${reqWords} requirement words, ${ctxWords} context words.`);
