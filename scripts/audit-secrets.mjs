#!/usr/bin/env node
// Audit de secrets accidentales — REQ-30
// Escanea los archivos rastreados por git en busca de patrones de credenciales reales.
// Excluye comentarios de ejemplo, nombres de variables y valores de prueba documentados.
// Sale con código 0 si está limpio, 1 si detecta algo.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");

const PATTERNS = [
  // Anthropic
  { re: /sk-ant-api0[0-9]-[A-Za-z0-9_-]{80,}/g,      label: "Claude API key" },
  // Stripe live
  { re: /sk_live_[A-Za-z0-9]{24,}/g,                  label: "Stripe live secret key" },
  // Supabase service role (JWT con payload de service_role)
  { re: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g,
    label: "Supabase JWT (posible service role)" },
  // Resend API key
  { re: /re_[A-Za-z0-9]{20,}/g,                       label: "Resend API key" },
  // Stripe webhook secret
  { re: /whsec_[A-Za-z0-9]{20,}/g,                    label: "Stripe webhook secret" },
];

// Rutas y fragmentos que deben ignorarse aunque coincidan (ejemplos documentados)
const ALLOWLIST_FRAGMENTS = [
  "sb_publishable_",  // publishable key — pública por diseño
  "RESEND_API_KEY",   // nombre de variable de entorno, no el valor
  "CRON_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "process.env.",
  "//",              // líneas de comentario (heurístico simple)
];

function getTrackedFiles() {
  const out = execSync("git -C " + ROOT + " ls-files", { encoding: "utf8" });
  return out.trim().split("\n").filter(f =>
    f && !f.startsWith(".git/") && !f.includes("node_modules/")
  );
}

const files = getTrackedFiles();
const errors = [];
const checked = [];

for (const rel of files) {
  const ext = rel.split(".").pop();
  if (!["js", "mjs", "html", "json", "sql", "md", "txt", "ts"].includes(ext)) continue;

  let content;
  try { content = readFileSync(join(ROOT, rel), "utf8"); }
  catch { continue; }

  for (const { re, label } of PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(content)) !== null) {
      const lineNo = content.slice(0, m.index).split("\n").length;
      const lineText = content.split("\n")[lineNo - 1] || "";
      const isAllowed = ALLOWLIST_FRAGMENTS.some(f => lineText.includes(f));
      if (!isAllowed) {
        errors.push(`${rel}:${lineNo}  [${label}]  ${m[0].slice(0, 24)}…`);
      }
    }
  }
  checked.push(rel);
}

console.log(`Audit de secrets: ${checked.length} archivos escaneados.`);
if (errors.length) {
  console.error(`\n✗ ${errors.length} secret(s) potencial(es) detectado(s):`);
  errors.forEach(e => console.error("  " + e));
  console.error("\nSi son ejemplos documentados, agrégalos a ALLOWLIST_FRAGMENTS.");
  process.exit(1);
}
console.log("✓ Sin secrets detectados en el repo.");
