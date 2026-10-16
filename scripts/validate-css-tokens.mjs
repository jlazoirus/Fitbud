#!/usr/bin/env node
// REQ-195: toda var(--x) usada en las páginas públicas debe estar definida.
// Una variable sin definir cae a su fallback (o a nada) y así sobrevivieron
// colores de la marca anterior (lila) tras el rebranding a Evolv.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PAGES = ["index.html", "beta-reclutamiento.html"];
const errors = [];

for (const page of PAGES) {
  const src = fs.readFileSync(path.join(ROOT, page), "utf8");
  const used = new Set([...src.matchAll(/var\(--([a-zA-Z0-9-]+)/g)].map((m) => m[1]));
  const defined = new Set([...src.matchAll(/--([a-zA-Z0-9-]+)\s*:/g)].map((m) => m[1]));
  for (const name of used) if (!defined.has(name)) errors.push(`${page}: var(--${name}) no está definida`);
}

if (errors.length) {
  console.error("CSS tokens sin definir:\n- " + errors.join("\n- "));
  process.exit(1);
}
console.log(`CSS tokens OK: ${PAGES.join(", ")} sin variables sin definir.`);
