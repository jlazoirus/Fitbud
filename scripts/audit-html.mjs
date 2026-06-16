#!/usr/bin/env node
// Audit de index.html — REQ-30
// Verifica sintaxis JS embebido, tags PWA, safe areas, accesibilidad básica,
// lenguaje de producto (REQ-31) y presupuesto de carga.
// Sale con código 0 si pasa, 1 si hay errores bloqueantes.
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { execSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const src = readFileSync(join(ROOT, "index.html"), "utf8");

const errors = [];
const warnings = [];

function fail(msg) { errors.push(msg); }
function warn(msg) { warnings.push(msg); }

// ── 1. Sintaxis JS embebido ────────────────────────────────────────────────────
const scriptMatch = src.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
if (!scriptMatch) {
  fail("No se encontró el bloque <script> principal antes de </body>.");
} else {
  const tmp = join(tmpdir(), "fitbud_inline_audit.js");
  try {
    writeFileSync(tmp, scriptMatch[1]);
    execSync(`node --check "${tmp}"`, { stdio: "pipe" });
  } catch (e) {
    fail("Sintaxis JS inválida en el script embebido: " + (e.stderr || e.message).toString().split("\n")[0]);
  } finally {
    try { unlinkSync(tmp); } catch {}
  }
}

// ── 2. HTML lang y charset ────────────────────────────────────────────────────
if (!/<html[^>]+lang="es"/i.test(src)) fail('<html> debe tener lang="es".');
if (!/<meta[^>]+charset/i.test(src)) fail("Falta meta charset.");

// ── 3. Tags PWA obligatorios ──────────────────────────────────────────────────
if (!src.includes('viewport-fit=cover')) fail("Falta viewport-fit=cover en el meta viewport.");
if (!src.includes('apple-mobile-web-app-capable')) fail("Falta meta apple-mobile-web-app-capable.");
if (!src.includes('apple-mobile-web-app-status-bar-style')) warn("Falta apple-mobile-web-app-status-bar-style.");
if (!src.includes('<link rel="manifest"')) fail("Falta <link rel='manifest'>.");
if (!src.includes('registerServiceWorker')) fail("Falta llamada registerServiceWorker.");

// ── 4. CSS safe areas e.  ────────────────────────────────────────────────────
if (!src.includes('env(safe-area-inset-')) fail("Falta uso de env(safe-area-inset-*) en el CSS.");

// ── 5. prefers-reduced-motion ─────────────────────────────────────────────────
if (!src.includes('@media(prefers-reduced-motion') && !src.includes('@media (prefers-reduced-motion')) {
  fail("Falta @media (prefers-reduced-motion) en el CSS.");
}

// ── 6. Open Graph y Twitter Card ─────────────────────────────────────────────
for (const tag of ['og:title', 'og:description', 'og:image', 'twitter:card']) {
  if (!src.includes(`property="${tag}"`) && !src.includes(`name="${tag}"`)) {
    warn(`Falta meta ${tag}.`);
  }
}

// ── 7. Imágenes: alt obligatorio ──────────────────────────────────────────────
// Busca <img sin alt (excluyendo etiquetas en comentarios HTML)
const imgRe = /<img\s[^>]*>/gi;
let imgMatch;
while ((imgMatch = imgRe.exec(src)) !== null) {
  const tag = imgMatch[0];
  if (!/\balt=/i.test(tag)) {
    const lineNo = src.slice(0, imgMatch.index).split("\n").length;
    fail(`<img> sin atributo alt en línea ${lineNo}: ${tag.slice(0, 60)}…`);
  }
}

// ── 8. Modales: botón de cierre accesible ────────────────────────────────────
// El overlay usa una sheet con botón ✕; verificar que el patrón existe
if (!src.includes('closeModal') || !src.includes('"sheet"')) {
  fail("No se encontró el patrón de modal (.sheet + closeModal).");
}

// ── 9. Selects con aria-label ────────────────────────────────────────────────
// Los select de días de entrenamiento deben tener aria-label
if (!src.includes('aria-label="Lugar para')) {
  fail('Faltan aria-label en los selects de lugar de entrenamiento.');
}

// ── 10. Lenguaje prohibido en texto de usuario (REQ-31) ──────────────────────
// Patrones en texto visible: entre etiquetas o en atributos de UI
const FORBIDDEN = [
  />\s*IA\s*</g,                    // texto literal IA entre etiquetas
  /placeholder="[^"]*\bIA\b/gi,    // placeholder con IA
  /placeholder="[^"]*\bAI\b/gi,    // placeholder con AI (mayúsculas)
  />\s*AI\s*</g,
  // Claude en texto visible (no en comentarios ni strings de código)
  />\s*Claude\s*</g,
  // "generado por IA" o "generado por Claude"
  /generado\s+por\s+(IA|AI|Claude)/gi,
  // "configura la IA"
  /configura\s+la\s+IA/gi,
  // "la IA está"
  /la\s+IA\s+est/gi,
];

for (const re of FORBIDDEN) {
  re.lastIndex = 0;
  let m;
  while ((m = re.exec(src)) !== null) {
    const lineNo = src.slice(0, m.index).split("\n").length;
    const lineText = src.split("\n")[lineNo - 1] || "";
    // Excluir comentarios HTML y líneas de código JS comentado
    if (lineText.trimStart().startsWith("//") || lineText.includes("<!--")) continue;
    // Excluir secciones de diagnóstico para admin
    if (lineText.includes("isAdmin") || lineText.includes("admin")) continue;
    fail(`Lenguaje prohibido (REQ-31) en línea ${lineNo}: "${m[0].trim()}"`);
  }
}

// ── 11. Presupuesto de carga: index.html < 600 KB ────────────────────────────
const sizeKb = Math.round(Buffer.byteLength(src, "utf8") / 1024);
if (sizeKb > 600) {
  warn(`index.html pesa ${sizeKb} KB. El presupuesto recomendado es ≤600 KB.`);
} else if (sizeKb > 1000) {
  fail(`index.html pesa ${sizeKb} KB. Supera el límite de 1 000 KB.`);
}

// ── Reporte ───────────────────────────────────────────────────────────────────
console.log(`Audit de index.html (${sizeKb} KB):`);
if (warnings.length) {
  console.log(`  ${warnings.length} aviso(s):`);
  warnings.forEach(w => console.log("    ⚠ " + w));
}
if (errors.length) {
  console.error(`\n✗ ${errors.length} error(es) bloqueante(s):`);
  errors.forEach(e => console.error("    ✗ " + e));
  process.exit(1);
}
console.log(`✓ HTML/JS/accesibilidad OK.`);
