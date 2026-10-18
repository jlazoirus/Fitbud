#!/usr/bin/env node
// REQ-200: cada valor que envía el formulario de beta-reclutamiento.html tiene
// que estar entre los que acepta api/beta-recruitment.js. Una opción sin
// `value` envía su texto visible: corregir la ortografía del texto (REQ-194)
// dejó "Ganar músculo" fuera de la lista y la API rechazaba la postulación.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(ROOT, "beta-reclutamiento.html"), "utf8");
const api = fs.readFileSync(path.join(ROOT, "api", "beta-recruitment.js"), "utf8");

// Valores aceptados por la API: new Set([...]) y new Map([[clave, ...], ...])
function apiValues(constName) {
  const m = api.match(new RegExp(`const ${constName} = new (Set|Map)\\(\\[([\\s\\S]*?)\\]\\);`));
  if (!m) throw new Error(`No encontré ${constName} en api/beta-recruitment.js`);
  const body = m[2];
  const re = m[1] === "Map" ? /\[\s*"([^"]+)"/g : /"([^"]+)"/g;
  return new Set([...body.matchAll(re)].map((x) => x[1]));
}

// Valores que envía el formulario para un campo: <select name> con sus <option>, o inputs con name
function formValues(name) {
  const out = [];
  const select = html.match(new RegExp(`<select[^>]*name="${name}"[^>]*>([\\s\\S]*?)</select>`));
  if (select) {
    for (const [, attrs, text] of select[1].matchAll(/<option([^>]*)>([^<]*)<\/option>/g)) {
      const v = (attrs.match(/value="([^"]*)"/) || [null, text.trim()])[1];
      if (v) out.push(v); // value="" es el "Selecciona" vacío
    }
  }
  for (const [tag] of html.matchAll(new RegExp(`<input[^>]*name="${name}"[^>]*>`, "g"))) {
    const v = (tag.match(/value="([^"]*)"/) || [])[1];
    if (v) out.push(v);
  }
  return out;
}

const FIELDS = {
  stage: "ALLOWED_STAGES", goal: "ALLOWED_GOALS", recentAttempt: "ALLOWED_RECENT",
  tools: "ALLOWED_TOOLS", pains: "ALLOWED_PAINS", investment: "ALLOWED_INVESTMENTS",
  availability: "ALLOWED_AVAILABILITY", health: "ALLOWED_HEALTH",
};
const errors = [];
for (const [field, constName] of Object.entries(FIELDS)) {
  const allowed = apiValues(constName);
  const sent = formValues(field);
  if (!sent.length) errors.push(`${field}: el formulario no tiene opciones`);
  for (const v of sent) if (!allowed.has(v)) errors.push(`${field}: "${v}" no está en ${constName}`);
}
if (errors.length) {
  console.error("El formulario de beta envía valores que la API rechaza:\n- " + errors.join("\n- "));
  process.exit(1);
}
console.log(`validate-beta-form-values: ${Object.keys(FIELDS).length} campos del formulario coinciden con la API.`);
