#!/usr/bin/env node
// Release gate — REQ-30
// Ejecuta todos los checks locales en secuencia. Bloquea el release si alguno falla.
// Uso: node scripts/release-gate.mjs [--warn-only]
// Sale con código 0 si todos pasan, 1 si hay errores bloqueantes.
import { execSync, execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const WARN_ONLY = process.argv.includes("--warn-only");
const t0 = Date.now();

const results = [];

function run(label, cmd, opts = {}) {
  const t = Date.now();
  try {
    execSync(cmd, { cwd: ROOT, stdio: "pipe", ...opts });
    const ms = Date.now() - t;
    results.push({ label, ok: true, ms });
    console.log(`  ✓ ${label} (${ms} ms)`);
  } catch (e) {
    const ms = Date.now() - t;
    const out = ((e.stdout || "") + (e.stderr || "")).toString().trim();
    results.push({ label, ok: false, ms, detail: out });
    console.error(`  ✗ ${label}`);
    if (out) console.error("    " + out.split("\n").slice(0, 6).join("\n    "));
  }
}

console.log("=== Fitbros Release Gate ===\n");

// ── Worktree y rama ──────────────────────────────────────────────────────────
console.log("[ Estado del repositorio ]");
run("git diff --check (sin whitespace errors)", "git diff --check");
run("git diff --cached --check", "git diff --cached --check");

const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
if (branch !== "main") {
  results.push({ label: "Rama activa es main", ok: false, detail: `Rama actual: ${branch}` });
  console.error(`  ✗ Rama activa es main — actual: ${branch}`);
} else {
  results.push({ label: "Rama activa es main", ok: true, ms: 0 });
  console.log("  ✓ Rama activa es main");
}

const status = execSync("git status --short", { cwd: ROOT, encoding: "utf8" }).trim();
// Solo falla en archivos modificados o eliminados; untracked (??) pueden ser nuevos archivos a punto de commitear
const modifiedLines = status ? status.split("\n").filter(l => l && !l.startsWith("??")) : [];
if (modifiedLines.length) {
  results.push({ label: "Sin modificaciones no intencionadas", ok: false, detail: modifiedLines.join("\n") });
  console.error("  ✗ Sin modificaciones no intencionadas:\n    " + modifiedLines.join("\n    "));
} else {
  results.push({ label: "Sin modificaciones no intencionadas", ok: true, ms: 0 });
  const untracked = status ? status.split("\n").filter(l => l.startsWith("??")).length : 0;
  console.log(`  ✓ Sin modificaciones no intencionadas${untracked ? ` (${untracked} archivo(s) nuevo(s) sin stagear)` : ""}`);
}

// ── Sintaxis de módulos JS ────────────────────────────────────────────────────
console.log("\n[ Sintaxis de módulos JS ]");
for (const file of ["domain-contracts.js", "exercise-catalog.js", "workout-player.js", "training-plan.js"]) {
  if (existsSync(join(ROOT, file))) {
    run(`node --check ${file}`, `node --check "${join(ROOT, file)}"`);
  }
}

// ── Validadores de dominio ───────────────────────────────────────────────────
console.log("\n[ Validadores de dominio ]");
run("validate-contracts.mjs", "node scripts/validate-contracts.mjs");
run("validate-exercises.mjs", "node scripts/validate-exercises.mjs");
run("validate-workout-player.mjs", "node scripts/validate-workout-player.mjs");
run("validate-training-plan.mjs", "node scripts/validate-training-plan.mjs");
run("validate-training-plan-wiring.mjs", "node scripts/validate-training-plan-wiring.mjs");
run("validate-coach-quota.mjs", "node scripts/validate-coach-quota.mjs");
run("validate-privacy.mjs", "node scripts/validate-privacy.mjs");
run("validate-splits.mjs", "node scripts/validate-splits.mjs");

// ── Validadores de SQL y datos ───────────────────────────────────────────────
console.log("\n[ SQL y datos ]");
run("supabase/validate.mjs (recetas y macros)", "node supabase/validate.mjs");
run("validate-migrations.mjs", "node scripts/validate-migrations.mjs");

// ── Auditorías de seguridad y calidad ───────────────────────────────────────
console.log("\n[ Seguridad y calidad ]");
run("audit-secrets.mjs", "node scripts/audit-secrets.mjs");
run("audit-html.mjs", "node scripts/audit-html.mjs");

// ── Resumen ──────────────────────────────────────────────────────────────────
const passed = results.filter(r => r.ok).length;
const failed = results.filter(r => !r.ok);
const total = results.length;
const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

console.log(`\n${"─".repeat(44)}`);
console.log(`${passed}/${total} checks pasaron en ${elapsed} s.`);

if (failed.length) {
  console.error(`\n✗ ${failed.length} check(s) bloqueante(s):`);
  failed.forEach(f => console.error(`  - ${f.label}`));
  if (WARN_ONLY) {
    console.warn("\n⚠ --warn-only: se reportan errores pero el proceso sale con 0.");
    process.exit(0);
  }
  console.error("\nCorregir estos errores antes de hacer push a producción.");
  process.exit(1);
}

console.log("✓ Release gate: todos los checks pasaron.");
