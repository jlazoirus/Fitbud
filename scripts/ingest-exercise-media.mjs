// ============================================================
// Ingesta de demostraciones reales desde Free Exercise DB
// (yuhonas/free-exercise-db — dominio público / Unlicense) hacia
// Supabase Storage, sin hotlinks (REQ-15). No requiere dependencias:
// usa fetch nativo (Node >= 18) y la API REST de Storage.
//
// Uso:
//   node scripts/ingest-exercise-media.mjs --check     (por defecto)
//        Valida el mapeo contra el dataset y sugiere candidatos.
//   node scripts/ingest-exercise-media.mjs --upload
//        Descarga las fotos, las sube a Storage y escribe el SQL.
//   node scripts/ingest-exercise-media.mjs --apply
//        Además, aplica los UPDATE vía PostgREST (opcional).
//
// Variables de entorno (solo para --upload / --apply):
//   SUPABASE_URL                 https://<proyecto>.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY    clave service role (NUNCA en el cliente)
//   EXERCISE_MEDIA_BUCKET        nombre del bucket (def. "exercise-media")
//   FREE_DB_REF                  rama/tag del repo (def. "main")
// ============================================================

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const REF = process.env.FREE_DB_REF || "main";
const RAW = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/${REF}`;
const DATASET_URL = `${RAW}/dist/exercises.json`;
const IMG_BASE = `${RAW}/exercises/`; // los `images` del dataset son rutas relativas a esta base

const BUCKET = process.env.EXERCISE_MEDIA_BUCKET || "exercise-media";
const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const SOURCE = {
  media_type: "image_sequence",
  source_name: "Free Exercise DB",
  source_url: "https://github.com/yuhonas/free-exercise-db",
  license_name: "Public Domain (Unlicense)",
  attribution: "Free Exercise DB (yuhonas) — dominio público",
};

const mode = process.argv.includes("--upload") ? "upload"
  : process.argv.includes("--apply") ? "apply"
  : "check";

function die(msg) { console.error(`\n✖ ${msg}\n`); process.exit(1); }
if (typeof fetch !== "function") die("Este script necesita Node >= 18 (fetch nativo).");

async function loadCatalogSlugs() {
  // exercise-catalog.js se autoadjunta a globalThis (FITBUD_EXERCISES).
  await import(resolve(ROOT, "exercise-catalog.js"));
  const list = globalThis.FITBUD_EXERCISES || [];
  if (!list.length) die("No se pudo cargar exercise-catalog.js (FITBUD_EXERCISES vacío).");
  return list.map(ex => ({ slug: ex.slug, name: ex.name }));
}

function tokens(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter(Boolean);
}
function score(qTokens, name) {
  const set = new Set(tokens(name));
  return qTokens.reduce((n, t) => n + (set.has(t) ? 1 : 0), 0);
}
function suggest(q, dataset, k = 3) {
  const qt = tokens(q);
  return dataset
    .map(d => ({ id: d.id, name: d.name, s: score(qt, d.name) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s || a.name.length - b.name.length)
    .slice(0, k);
}

async function fetchDataset() {
  const res = await fetch(DATASET_URL);
  if (!res.ok) die(`No se pudo descargar el dataset (${res.status}). URL: ${DATASET_URL}`);
  const data = await res.json();
  if (!Array.isArray(data)) die("El dataset no es un arreglo.");
  return data;
}

async function loadMap() {
  const mod = await import(resolve(__dirname, "free-exercise-db-map.mjs"));
  return mod.default || {};
}

// ---- Validación / sugerencias -------------------------------------------------

async function runCheck() {
  const [slugs, map, dataset] = await Promise.all([loadCatalogSlugs(), loadMap(), fetchDataset()]);
  const byId = new Map(dataset.map(d => [d.id, d]));
  let ok = 0, skip = 0, bad = 0;
  console.log(`\nDataset: ${dataset.length} ejercicios · catálogo: ${slugs.length} slugs\n`);
  for (const { slug, name } of slugs) {
    const entry = map[slug];
    if (!entry || entry.id == null) {
      skip++;
      console.log(`· ${slug.padEnd(26)} sin demo → SVG fallback`);
      continue;
    }
    const hit = byId.get(entry.id);
    if (hit) {
      const imgs = Array.isArray(hit.images) ? hit.images.length : 0;
      ok++;
      console.log(`✓ ${slug.padEnd(26)} ${entry.id}  (${imgs} img)`);
      if (imgs < 1) console.log(`    ⚠ sin imágenes en el dataset`);
    } else {
      bad++;
      console.log(`✖ ${slug.padEnd(26)} id NO existe: "${entry.id}"`);
      const sug = suggest(entry.q || name, dataset);
      if (sug.length) sug.forEach(s => console.log(`    → ${s.id}  (${s.name})`));
      else console.log(`    (sin candidatos; ajusta "q" en el mapeo)`);
    }
  }
  console.log(`\nResumen: ${ok} mapeados · ${skip} sin demo · ${bad} a corregir`);
  if (bad) { console.log("Corrige los `id` marcados con ✖ en scripts/free-exercise-db-map.mjs y vuelve a correr --check.\n"); process.exit(2); }
  console.log(mode === "check" ? "Mapeo válido. Ejecuta --upload para subir la media.\n" : "");
  return { slugs, map, dataset, byId };
}

// ---- Storage ------------------------------------------------------------------

function requireCreds() {
  if (!SUPABASE_URL || !SERVICE_KEY) die("Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en el entorno.");
}
async function ensureBucket() {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
  if (res.ok) { console.log(`Bucket "${BUCKET}" creado (público).`); return; }
  const txt = await res.text();
  if (res.status === 409 || /exists/i.test(txt)) { console.log(`Bucket "${BUCKET}" ya existe.`); return; }
  die(`No se pudo crear el bucket (${res.status}): ${txt}`);
}
async function uploadObject(path, bytes, contentType) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY, "Content-Type": contentType, "x-upsert": "true" },
    body: bytes,
  });
  if (!res.ok) die(`Fallo subiendo ${path} (${res.status}): ${await res.text()}`);
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}
async function downloadImage(relPath) {
  const url = IMG_BASE + relPath.replace(/^\/+/, "");
  const res = await fetch(url);
  if (!res.ok) die(`Fallo descargando ${url} (${res.status})`);
  return new Uint8Array(await res.arrayBuffer());
}

// ---- SQL ----------------------------------------------------------------------

function sqlEscape(s) { return String(s).replace(/'/g, "''"); }
function buildSql(records) {
  const head = [
    "-- ============================================================",
    "-- Fitbros — media real de ejercicios (REQ-15)",
    "-- Generado por scripts/ingest-exercise-media.mjs. Idempotente.",
    "-- Fuente: Free Exercise DB (yuhonas) — dominio público / Unlicense.",
    "-- Ejecutar después de supabase/exercises.sql.",
    "-- ============================================================",
    "",
    "alter table exercises add column if not exists media_url  text;",
    "alter table exercises add column if not exists poster_url text;",
    "alter table exercises add column if not exists frames     jsonb not null default '[]'::jsonb;",
    "",
  ];
  const updates = records.map(r => {
    const framesJson = sqlEscape(JSON.stringify(r.frames));
    return [
      "update exercises set",
      `  media_type   = '${SOURCE.media_type}',`,
      `  frames       = '${framesJson}'::jsonb,`,
      `  poster_url   = '${sqlEscape(r.poster)}',`,
      `  media_url    = null,`,
      `  source_name  = '${sqlEscape(SOURCE.source_name)}',`,
      `  source_url   = '${sqlEscape(SOURCE.source_url)}',`,
      `  license_name = '${sqlEscape(SOURCE.license_name)}',`,
      `  attribution  = '${sqlEscape(SOURCE.attribution)}',`,
      `  updated_at   = now()`,
      `where slug = '${sqlEscape(r.slug)}';`,
      "",
    ].join("\n");
  });
  return head.concat(updates).join("\n") + "\n";
}

async function applyViaRest(records) {
  for (const r of records) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/exercises?slug=eq.${encodeURIComponent(r.slug)}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY,
        "Content-Type": "application/json", Prefer: "return=minimal",
      },
      body: JSON.stringify({
        media_type: SOURCE.media_type, frames: r.frames, poster_url: r.poster, media_url: null,
        source_name: SOURCE.source_name, source_url: SOURCE.source_url,
        license_name: SOURCE.license_name, attribution: SOURCE.attribution,
        updated_at: new Date().toISOString(),
      }),
    });
    if (!res.ok) die(`PATCH ${r.slug} falló (${res.status}): ${await res.text()}. ¿Aplicaste el ALTER de columnas primero?`);
    console.log(`  ↻ ${r.slug} actualizado`);
  }
}

// ---- Upload -------------------------------------------------------------------

async function runUpload() {
  requireCreds();
  const { slugs, map, byId } = await runCheck();
  await ensureBucket();
  const records = [];
  for (const { slug } of slugs) {
    const entry = map[slug];
    if (!entry || entry.id == null) continue;
    const ex = byId.get(entry.id);
    const images = (Array.isArray(ex.images) ? ex.images : []).slice(0, 2);
    if (!images.length) { console.log(`⚠ ${slug}: sin imágenes, se omite`); continue; }
    console.log(`↑ ${slug} (${entry.id})`);
    const frames = [];
    for (let i = 0; i < images.length; i++) {
      const bytes = await downloadImage(images[i]);
      const url = await uploadObject(`${slug}/${i}.jpg`, bytes, "image/jpeg");
      frames.push(url);
    }
    records.push({ slug, frames, poster: frames[0] });
  }
  const sqlPath = resolve(ROOT, "supabase", "exercise-media.sql");
  await writeFile(sqlPath, buildSql(records), "utf8");
  console.log(`\n✓ ${records.length} ejercicios con media. SQL: ${sqlPath}`);
  if (mode === "apply") { console.log("\nAplicando vía PostgREST…"); await applyViaRest(records); }
  else console.log("Revisa el SQL y aplícalo en Supabase, o vuelve a correr con --apply.\n");
}

// ---- Main ---------------------------------------------------------------------

(async () => {
  try {
    if (mode === "check") await runCheck();
    else await runUpload();
  } catch (err) {
    die(err && err.stack ? err.stack : String(err));
  }
})();
