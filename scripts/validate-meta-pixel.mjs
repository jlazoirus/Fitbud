#!/usr/bin/env node
// REQ-376 — El píxel de Meta solo vive en la web pública y nunca lleva datos personales.
// - La app (/app, /admin), el service worker y todo lo que la app carga no contienen
//   fbq, connect.facebook.net ni el módulo de medición.
// - Solo web/medicion.js carga el píxel y solo api/_tienda/meta-capi.js llama a la API
//   de conversiones. Ninguna página precarga dominios de Meta.
// - Los eventos de las páginas y la lista blanca del módulo no llevan correo, teléfono,
//   nombre ni datos de salud; el píxel se inicia sin datos de usuario.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const read = (file) => readFileSync(join(ROOT, file), "utf8");
const errors = [];
const fail = (msg) => errors.push(msg);

const MODULE = "web/medicion.js";
const CAPI = "api/_tienda/meta-capi.js";
const PIXEL_PAGES = ["index.html", "planes/index.html", "pago/index.html", "unete/index.html", "beta-reclutamiento.html"];
const PIXEL_CODE = /\bfbq\b|connect\.facebook\.net|fbevents/;
const META_ANY = /\bfbq\b|facebook\.(?:net|com)|fbevents|\/?web\/medicion\.js|evolvPixel|_fbp|_fbc|metaPixelId|META_PIXEL|META_CAPI/;

// ── 1. La app y todo lo que carga ────────────────────────────────────────────
// app/index.html, sus <script src> locales, sus import(), el service worker, su
// APP_SHELL y el manifest; y los imports relativos de esos módulos.
const appFiles = new Set(["app/index.html", "service-worker.js", "manifest.webmanifest", "config.js"]);
const appHtml = read("app/index.html");
for (const [, ref] of appHtml.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)) {
  if (!/^[a-z]+:|^\/\/|\$\{/.test(ref)) appFiles.add(ref.replace(/[?#].*$/, "").replace(/^\.?\//, ""));
}
for (const [, ref] of appHtml.matchAll(/(?:from\s*|import\()\s*"(\/[^"]+\.js)"/g)) appFiles.add(ref.slice(1));
const shell = read("service-worker.js").match(/const APP_SHELL = \[([\s\S]*?)\];/);
assert.ok(shell, "service-worker.js debe declarar APP_SHELL");
for (const [, ref] of shell[1].matchAll(/"\.\/([^"]+\.(?:js|html|webmanifest))"/g)) appFiles.add(ref);
for (const file of [...appFiles]) {
  if (!file.endsWith(".js") || !existsSync(join(ROOT, file))) continue;
  for (const [, ref] of read(file).matchAll(/(?:from\s*|import\()\s*"(\.{1,2}\/[^"]+\.js)"/g)) {
    appFiles.add(normalize(join(dirname(file), ref)));
  }
}
for (const file of appFiles) {
  if (!existsSync(join(ROOT, file))) continue;
  const hit = read(file).match(META_ANY);
  if (hit) fail(`${file} (lo carga la app) contiene "${hit[0]}": el píxel no puede llegar a /app ni /admin`);
}
if (appFiles.has(MODULE)) fail(`la app carga ${MODULE}`);

// ── 2. Solo las cinco páginas públicas cargan el módulo ─────────────────────
const tracked = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { cwd: ROOT, encoding: "utf8" })
  .split("\n").filter(Boolean);
const runtime = tracked.filter((f) => /\.(?:html|js|mjs|json|webmanifest)$/.test(f) && !/^(?:scripts|tests|docs|native|estrategia|supabase|\.claude|\.impeccable)\//.test(f));
for (const page of PIXEL_PAGES) {
  if (!read(page).includes('"/web/medicion.js"')) fail(`${page} debe cargar /web/medicion.js (PageView)`);
}
for (const file of runtime) {
  const text = read(file);
  if (file !== MODULE && PIXEL_PAGES.indexOf(file) < 0 && /["']\/?web\/medicion\.js/.test(text)) fail(`${file} carga el módulo de medición y no es una página pública con píxel`);
  if (file !== MODULE && PIXEL_CODE.test(text)) fail(`${file} contiene código del píxel; solo ${MODULE} puede cargarlo`);
  if (file !== CAPI && /graph\.facebook\.com/.test(text)) fail(`${file} llama a la API de Meta; solo ${CAPI} puede`);
  if (/<link\b[^>]*facebook/i.test(text)) fail(`${file} precarga un dominio de Meta (haría peticiones sin ID de píxel)`);
}

// ── 3. Eventos de las páginas: nombre permitido y solo parámetros de compra ─
const ALLOWED_KEYS = new Set(["value", "currency", "content_type", "content_ids", "num_items"]);
const PII_IDENT = /\b(?:email|correo|phone|telefono|teléfono|celular|whatsapp|name|nombre|firstName|lastName|apellido|health|salud|peso|weight|age|edad|goal|objetivo|datos|pedido|data|em|ph|fn|ln|external_id|user_data)\b/;
const { EVENTS, cleanParams, validPixelId, metaCookies } = await import("../web/medicion.js");
assert.deepEqual([...EVENTS], ["PageView", "ViewContent", "InitiateCheckout", "Purchase", "Lead"]);

function callArgs(text, start) {
  let depth = 0;
  for (let i = start; i < text.length; i += 1) {
    if (text[i] === "(") depth += 1;
    else if (text[i] === ")" && --depth === 0) return text.slice(start + 1, i);
  }
  return "";
}
const seen = new Set(["PageView"]);
for (const page of PIXEL_PAGES) {
  const text = read(page);
  for (const m of text.matchAll(/\btrack\(\s*"([A-Za-z]+)"/g)) {
    const args = callArgs(text, m.index + m[0].indexOf("("));
    if (!EVENTS.includes(m[1])) fail(`${page}: evento no permitido ${m[1]}`);
    seen.add(m[1]);
    const obj = args.match(/\{([\s\S]*?)\}\s*(?:,|$)/);
    if (obj) {
      for (const [, key] of obj[1].matchAll(/(?:^|,)\s*([A-Za-z_]+)\s*:/g)) {
        if (!ALLOWED_KEYS.has(key)) fail(`${page}: ${m[1]} lleva el parámetro "${key}" (solo ${[...ALLOWED_KEYS].join(", ")})`);
      }
    }
    const firstArg = args.indexOf(",");
    const rest = firstArg < 0 ? "" : args.slice(firstArg).replace(/eventId\s*:\s*compra\.eventId/, "");
    const pii = rest.match(PII_IDENT);
    if (pii) fail(`${page}: ${m[1]} recibe "${pii[0]}": los eventos no llevan datos personales ni de salud`);
  }
}
for (const name of EVENTS) if (!seen.has(name)) fail(`ninguna página dispara ${name}`);
// Lead: solo en /unete y /beta, justo después de que la API respondió bien, sin parámetros.
const leadPages = PIXEL_PAGES.filter((p) => /track\("Lead"/.test(read(p)));
if (leadPages.join() !== "unete/index.html,beta-reclutamiento.html") fail(`Lead debe dispararse solo en /unete y /beta (hoy: ${leadPages.join(", ") || "ninguna"})`);
for (const page of leadPages) {
  const text = read(page);
  const done = text.indexOf("renderDone(data);\n", text.indexOf("payload.ok"));
  const lead = text.indexOf('evolvPixel.track("Lead")');
  if (!(done > 0 && lead > done && lead - done < 200)) fail(`${page}: Lead va justo después de la respuesta correcta y sin parámetros`);
}

// La lista blanca del módulo descarta cualquier dato personal, aunque una página lo pase.
const dirty = cleanParams({
  value: 79.9, currency: "PEN", content_type: "product", content_ids: ["quarterly", "ana@example.com"], num_items: 1,
  em: "ana@example.com", email: "ana@example.com", ph: "999888777", phone: "999888777", fn: "ana", ln: "perez",
  name: "Ana", external_id: "u1", weight: 80, health: "x", user_data: { em: "x" }, content_name: "Ana",
});
assert.deepEqual(dirty, { value: 79.9, currency: "PEN", content_type: "product", content_ids: ["quarterly"], num_items: 1 });
assert.deepEqual(cleanParams({ currency: "EUR", value: -1, content_ids: "x" }), {});
assert.deepEqual(cleanParams({ currency: "USD", value: 8.99 }), { currency: "USD", value: 8.99 }, "REQ-381: dólares de la tienda");
assert.equal(validPixelId("123456789012345"), "123456789012345");
assert.equal(validPixelId("<script>"), "");
assert.equal(validPixelId(""), "");
assert.deepEqual(metaCookies("a=1; _fbp=fb.1.1700000000000.123456789; _fbc=fb.1.1700000000000.AbC_d-1; x=y"), { fbp: "fb.1.1700000000000.123456789", fbc: "fb.1.1700000000000.AbC_d-1" });
assert.deepEqual(metaCookies("_fbp=ana@example.com; _fbc=<x>"), {});

// El píxel se inicia sin datos de usuario (sin advanced matching) y sin autoConfig.
const mod = read(MODULE);
const inits = [...mod.matchAll(/fbq\("init"[^)]*\)/g)].map((m) => m[0]);
assert.deepEqual(inits, ['fbq("init", pixelId)'], "fbq init sin segundo argumento (datos de usuario)");
assert.match(mod, /fbq\("set", "autoConfig", false, pixelId\)/, "autoConfig apagado");
assert.match(mod, /addEventListener\("load"/, "la consulta del píxel espera al evento load");

// ── 4. API de conversiones y configuración pública ───────────────────────────
const capi = read(CAPI).replace(/\/\/.*$/gm, "");
const capiPii = capi.match(/\b(?:email|phone|firstName|lastName|em|ph|fn|ln|external_id|zp|ct|db|ge)\b\s*[:=]/);
if (capiPii) fail(`${CAPI} arma "${capiPii[0]}": la API de conversiones solo lleva fbp, fbc, IP y user agent`);
const charge = read("api/_tienda/culqi-charge.js");
assert.match(charge, /purchaseEvent\(\{ eventId: compra\.eventId, plan, ids: metaIds\(body\), client: clientInfo\(req\)/, "culqi-charge arma el Purchase sin datos de la compra");
const config = read("api/config.js");
assert.match(config, /metaPixelId:/, "api/config.js entrega metaPixelId");
assert.doesNotMatch(config, /META_CAPI_TOKEN/, "el token de la API de conversiones nunca va al navegador");

if (errors.length) {
  console.error("validate-meta-pixel: el píxel salió de la web pública o lleva datos personales:\n- " + errors.join("\n- "));
  process.exit(1);
}
console.log(`validate-meta-pixel: OK (${appFiles.size} archivos de la app sin píxel, ${PIXEL_PAGES.length} páginas públicas medidas, eventos sin datos personales)`);
