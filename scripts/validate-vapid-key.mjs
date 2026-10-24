#!/usr/bin/env node
// REQ-265 — La clave pública VAPID del cliente y la del servidor son la misma
// y es un punto P-256 válido (65 bytes, sin comprimir). La privada vive solo
// en Vercel (VAPID_PRIVATE_KEY): nunca en el repo.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const client = readFileSync(new URL("../index.html", import.meta.url), "utf8").match(/const VAPID_PUBLIC_KEY="([^"]+)"/);
const server = readFileSync(new URL("../api/notify.js", import.meta.url), "utf8").match(/process\.env\.VAPID_PUBLIC_KEY \|\|\s*"([^"]+)"/);
assert.ok(client && server, "no se encontró la clave pública en index.html o api/notify.js");
assert.equal(client[1], server[1], "cliente y servidor usan claves públicas distintas");
const bytes = Buffer.from(client[1], "base64url");
assert.equal(bytes.length, 65, "la clave pública debe tener 65 bytes");
assert.equal(bytes[0], 4, "la clave pública debe ser un punto sin comprimir (0x04)");
assert.ok(!/BG6yyBKh5oUpZSu2/.test(client[1]), "la clave anterior no tiene privada en el servidor");
console.log("validate-vapid-key: OK");
