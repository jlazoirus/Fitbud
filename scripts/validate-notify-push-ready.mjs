#!/usr/bin/env node
// REQ-281 — El job de recordatorios dice si el push está listo y, si no, por
// qué (falta una variable o es inválida), sin mostrar valores. Tolera espacios
// y saltos de línea pegados al configurar las variables en Vercel.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const notifyUrl = new URL("../api/notify.js", import.meta.url).href;
// Par de prueba: la pública va por VAPID_PUBLIC_KEY para que la privada encaje.
const { default: webpush } = await import("web-push");
const keys = webpush.generateVAPIDKeys();

function pushResult(extraEnv) {
  const code = `
    globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => [] });
    const { default: handler } = await import(${JSON.stringify(notifyUrl)});
    const res = { code: 0, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; }, setHeader() {} };
    await handler({ method: "GET", url: "/api/notify", headers: { authorization: "Bearer s" } }, res);
    process.stdout.write(JSON.stringify(res.body.push));
  `;
  const env = { ...process.env, SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "k", CRON_SECRET: "s", VAPID_PUBLIC_KEY: keys.publicKey, ...extraEnv };
  for (const k of ["VAPID_PRIVATE_KEY", "VAPID_SUBJECT"]) if (extraEnv[k] === undefined) delete env[k];
  return JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", code], { env, cwd: fileURLToPath(new URL("..", import.meta.url)) }).toString());
}

assert.deepEqual(pushResult({}), { ready: false, issue: "falta VAPID_PRIVATE_KEY" });
assert.deepEqual(pushResult({ VAPID_PRIVATE_KEY: keys.privateKey }), { ready: false, issue: "falta VAPID_SUBJECT" });
const bad = pushResult({ VAPID_PRIVATE_KEY: "abc", VAPID_SUBJECT: "mailto:a@b.c" });
assert.equal(bad.ready, false);
assert.match(bad.issue, /^VAPID inválida: /);
assert.ok(!bad.issue.includes("abc"), "el diagnóstico no muestra la clave");
const pasted = pushResult({ VAPID_PRIVATE_KEY: ` ${keys.privateKey}\n`, VAPID_SUBJECT: "mailto:a@b.c\n" });
assert.equal(pasted.ready, true, "espacios y saltos de línea pegados no invalidan la clave");
console.log("validate-notify-push-ready: OK");
