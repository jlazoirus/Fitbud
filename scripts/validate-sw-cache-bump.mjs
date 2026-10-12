#!/usr/bin/env node
// REQ-173 — Si cambia un archivo del app shell, CACHE_NAME del service worker
// debe cambiar también. El SW sirve HTML y JS cache-first (REQ-150): sin un
// CACHE_NAME nuevo el navegador no instala la versión desplegada y la PWA sigue
// mostrando la anterior indefinidamente.
// Compara el árbol de trabajo (cambios commiteados o no) contra origin/main.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
const baseArg = process.argv.indexOf("--base");
let base;
try { base = baseArg > 0 ? git("rev-parse", process.argv[baseArg + 1]) : git("merge-base", "HEAD", "origin/main"); } catch { base = ""; }
if (!base) { console.log("validate-sw-cache-bump: sin origin/main, se omite."); process.exit(0); }

const sw = fs.readFileSync(new URL("../service-worker.js", import.meta.url), "utf8");
const shell = [...sw.match(/const APP_SHELL = \[([\s\S]*?)\];/)[1].matchAll(/"\.\/([^"]*)"/g)]
  .map(m => m[1]).filter(Boolean).concat(["index.html"]);
const changed = git("diff", "--name-only", base, "--", ...new Set(shell)).split("\n").filter(Boolean);
const cacheName = src => (src.match(/CACHE_NAME\s*=\s*"([^"]+)"/) || [])[1];
const baseName = cacheName(git("show", `${base}:service-worker.js`));
const currentName = cacheName(sw);

if (changed.length) {
  assert.notEqual(currentName, baseName,
    `Cambió el app shell (${changed.join(", ")}) pero CACHE_NAME sigue en "${baseName}". Súbelo para que la PWA instale la versión nueva.`);
}
console.log(`validate-sw-cache-bump: ${changed.length ? `${changed.length} archivo(s) del shell cambiaron; CACHE_NAME ${baseName} → ${currentName}` : "sin cambios en el shell"}.`);
