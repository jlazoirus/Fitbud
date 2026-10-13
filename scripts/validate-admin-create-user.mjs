#!/usr/bin/env node
// REQ-176 — Alta sin correo: createUser crea la cuenta confirmada con una
// contraseña temporal fuerte y must_change_password; la app la exige al entrar.
import assert from "node:assert/strict";
import fs from "node:fs";

const admin = fs.readFileSync(new URL("../api/admin.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

const pick = (re, label) => { const m = admin.match(re); assert.ok(m, `falta ${label}`); return m[0]; };
const tempPassword = new Function(`${pick(/const TEMP_PASSWORD_ALPHABET = [^\n]+/, "alfabeto")}
${pick(/function tempPassword\(\) \{[\s\S]*?\n\}/, "tempPassword")}
return tempPassword;`)();
const seen = new Set();
for (let i = 0; i < 500; i++) {
  const p = tempPassword();
  assert.match(p, /^[a-zA-Z2-9]{4}-[a-zA-Z2-9]{4}-[a-zA-Z2-9]{4}$/, "formato xxxx-xxxx-xxxx");
  assert.ok(!/[0O1lI]/.test(p), "sin caracteres ambiguos");
  seen.add(p);
}
assert.equal(seen.size, 500, "las contraseñas temporales no se repiten");
console.log("  tempPassword: 14 caracteres, sin ambiguos, aleatoria");

const action = admin.slice(admin.indexOf('body.action === "createUser"'), admin.indexOf('body.action === "inviteUser"'));
assert.ok(action.includes("authUserByEmail(email, e)") && action.includes("409"), "no pisa cuentas existentes");
assert.ok(action.includes("must_change_password: true"), "marca el cambio obligatorio");
assert.ok(action.includes("upsertProfileStatus"), "deja el perfil activo");
assert.ok(admin.includes("crypto.getRandomValues"), "usa aleatoriedad criptográfica");
console.log("  createUser: sin duplicados, perfil activo y cambio obligatorio");

const onAuth = html.slice(html.indexOf("async function onAuth("), html.indexOf("async function onAuth(") + 400);
assert.ok(onAuth.includes("mustChangePassword()") && onAuth.includes('passwordRecoveryMode="first_login"'), "el primer ingreso pide la contraseña propia");
assert.ok(html.includes("data:{must_change_password:false}"), "al guardarla se limpia la marca");
console.log("validate-admin-create-user: OK");
