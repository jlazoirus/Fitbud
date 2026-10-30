#!/usr/bin/env node
// REQ-184 — El deploy de Vercel publica solo lo que el runtime carga.
// Evalúa .vercelignore con semántica gitignore sobre los archivos del repo y
// falla si falta un archivo del runtime o si se publicaría uno no declarado.
import assert from "node:assert/strict";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const read = (file) => readFileSync(join(ROOT, file), "utf8");

// Archivos públicos que el runtime no referencia de forma detectable. Vacío a
// propósito: agregar aquí solo con una razón explícita.
const EXTRA_PUBLIC = [
  "assets/og-image.png", // og:image/twitter:image con URL absoluta (REQ-189)
];

function compileRules(text) {
  return text.split("\n").map((line) => line.trim()).filter((line) => line && !line.startsWith("#")).map((line) => {
    const negate = line.startsWith("!");
    let pattern = negate ? line.slice(1) : line;
    const dirOnly = pattern.endsWith("/");
    if (dirOnly) pattern = pattern.slice(0, -1);
    const anchored = pattern.includes("/");
    pattern = pattern.replace(/^\//, "");
    const body = pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*\*/g, "\u0000")
      .replace(/\*/g, "[^/]*")
      .replace(/\?/g, "[^/]")
      .replace(/\u0000/g, ".*");
    return { negate, dirOnly, re: new RegExp(`^${anchored ? "" : "(?:.*/)?"}${body}$`) };
  });
}

function makeMatcher(rules) {
  const matches = (path, isDir) => {
    let ignored = false;
    for (const rule of rules) {
      if (rule.dirOnly && !isDir) continue;
      if (rule.re.test(path)) ignored = !rule.negate;
    }
    return ignored;
  };
  // Como en gitignore: si un directorio padre queda excluido, sus archivos no
  // se pueden reincluir.
  return (path) => {
    const parts = path.split("/");
    for (let i = 1; i < parts.length; i++) {
      if (matches(parts.slice(0, i).join("/"), true)) return true;
    }
    return matches(path, false);
  };
}

const isIgnored = makeMatcher(compileRules(read(".vercelignore")));
const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { cwd: ROOT, encoding: "utf8" })
  .split("\n").filter(Boolean);
const deployed = new Set(files.filter((file) => !isIgnored(file)));

// Lo que el runtime carga: referencias locales de las páginas, shell del SW,
// íconos del manifest, funciones serverless y su configuración.
const required = new Set(["index.html", "beta-reclutamiento.html", "service-worker.js", "manifest.webmanifest", "package.json", "package-lock.json", "vercel.json"]);
for (const page of ["index.html", "beta-reclutamiento.html"]) {
  for (const [, ref] of read(page).matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (/^[a-z]+:|^\/\/|^#|\$\{/.test(ref)) continue;
    // href="/" es la portada; ?source=… y #ancla no son parte del archivo
    required.add(ref.replace(/[?#].*$/, "").replace(/^\.?\//, "") || "index.html");
  }
}
// Fotos de ejercicios servidas desde el propio deploy (REQ-259).
for (const [, ref] of read("exercise-catalog.js").matchAll(/"(assets\/[^"]+)"/g)) required.add(ref);
// REQ-302: incluye también rutas derivadas por slug, sin permitir assets ajenos.
const catalogContext={globalThis:{}};
vm.runInNewContext(read("exercise-catalog.js"),catalogContext);
for(const ex of catalogContext.globalThis.FITBUD_EXERCISES){
  for(const ref of [ex.media_url,ex.poster_url,...(ex.frames||[])]){
    if(String(ref||"").startsWith("assets/"))required.add(ref);
  }
}
const shell = read("service-worker.js").match(/const APP_SHELL = \[([\s\S]*?)\];/);
assert.ok(shell, "service-worker.js debe declarar APP_SHELL");
for (const [, ref] of shell[1].matchAll(/"\.\/([^"]*)"/g)) required.add(ref || "index.html");
for (const icon of JSON.parse(read("manifest.webmanifest")).icons || []) required.add(icon.src.replace(/^\.?\//, ""));
for (const file of files) if (/^api\/[^/]+\.js$/.test(file)) required.add(file);
for (const file of EXTRA_PUBLIC) required.add(file);

const missing = [...required].filter((file) => !deployed.has(file));
assert.deepEqual(missing, [], `El runtime necesita estos archivos y .vercelignore los excluye: ${missing.join(", ")}`);

const undeclared = [...deployed].filter((file) => !required.has(file));
assert.deepEqual(undeclared, [], `Se publicarían archivos no declarados (excluirlos en .vercelignore o declararlos en EXTRA_PUBLIC): ${undeclared.join(", ")}`);

for (const internal of ["NEGOCIO.md", "REQUIREMENTS.md", "CONTEXT.md", "STRIPE_SETUP.md", "agent-loop.json", "supabase/admin.sql", "scripts/release-gate.mjs", "tests/e2e/helpers.js", "assets/ux-audit-2026-06-23/metrics.json"]) {
  assert.ok(isIgnored(internal), `${internal} no debe publicarse`);
}

console.log(`validate-deploy-allowlist: OK (${deployed.size} archivos publicados de ${files.length})`);
