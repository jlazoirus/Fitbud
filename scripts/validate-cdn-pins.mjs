#!/usr/bin/env node
// REQ-197: los scripts de CDN de las páginas públicas van con versión exacta y SRI.
// Una versión flotante (p. ej. "@2") cambia el código en producción sin deploy;
// la copia offline de la suite E2E debe ser el mismo archivo que pide index.html.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PAGES = ["index.html", "beta-reclutamiento.html"];
const VENDOR = { "@supabase/supabase-js": "tests/e2e/vendor/supabase-js-2.min.js" };
const errors = [];

for (const page of PAGES) {
  const src = fs.readFileSync(path.join(ROOT, page), "utf8");
  for (const [tag] of src.matchAll(/<script\b[^>]*\bsrc="https?:\/\/[^"]+"[^>]*>/g)) {
    const url = tag.match(/src="([^"]+)"/)[1];
    const integrity = (tag.match(/integrity="([^"]+)"/) || [])[1];
    const pkg = url.match(/\/npm\/((?:@[^/]+\/)?[^@/]+)@([^/"]+)/);
    if (!pkg || !/^\d+\.\d+\.\d+$/.test(pkg[2])) errors.push(`${page}: ${url} no fija una versión exacta`);
    if (!integrity) errors.push(`${page}: ${url} no tiene integrity (SRI)`);
    if (!/crossorigin="anonymous"/.test(tag)) errors.push(`${page}: ${url} necesita crossorigin="anonymous" para SRI`);
    const vendor = pkg && VENDOR[pkg[1]];
    if (vendor && integrity) {
      const [algo, hash] = integrity.split("-");
      const local = crypto.createHash(algo).update(fs.readFileSync(path.join(ROOT, vendor))).digest("base64");
      if (local !== hash) errors.push(`${page}: ${vendor} no coincide con el SRI de ${url}`);
    }
  }
}

if (errors.length) {
  console.error("CDN sin fijar:\n- " + errors.join("\n- "));
  process.exit(1);
}
console.log("CDN pins OK: scripts externos con versión exacta y SRI.");
