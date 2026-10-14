#!/usr/bin/env node
// REQ-179 — El cron diario mantiene despierto Supabase (plan gratuito: pausa
// tras ~7 días sin actividad) aunque el job se corte por CRON_SECRET.
import assert from "node:assert/strict";

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
delete process.env.CRON_SECRET;
const calls = [];
globalThis.fetch = async (url) => { calls.push(String(url)); return { ok: true, json: async () => [] }; };
const { default: handler } = await import("../api/notify.js");
const response = () => ({ code: 0, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; }, send(b) { this.body = b; return this; } });

const res = response();
await handler({ method: "GET", url: "/api/notify", headers: { "user-agent": "vercel-cron/1.0" } }, res);
assert.equal(res.code, 401, "sin CRON_SECRET el job no corre");
assert.deepEqual(calls, ["https://example.supabase.co/rest/v1/profiles?select=id&limit=1"], "pero la base recibe la lectura mínima");
assert.equal(res.body.keepAlive, true);
console.log("  cron sin secreto: 401 y keep-alive ejecutado");

calls.length = 0;
const failing = response();
globalThis.fetch = async (url) => { calls.push(String(url)); throw new Error("red caída"); };
await handler({ method: "GET", url: "/api/notify", headers: {} }, failing);
assert.equal(failing.code, 401, "un fallo del keep-alive no rompe el handler");
assert.equal(failing.body.keepAlive, false);
console.log("validate-supabase-keepalive: OK");
