// REQ-113 — los campos de contraseña de usuario/admin deben tener toggle
// accesible sin cambiar ids, autocomplete ni validaciones.
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

const expectedFields = [
  { id: "au_pwd", autocomplete: 'mode==="in"?"current-password":"new-password"' },
  { id: "recovery_pwd", autocomplete: '"new-password"', minlength: '"8"' },
  { id: "recovery_confirm", autocomplete: '"new-password"', minlength: '"8"' },
  { id: "adminTestPwd", autocomplete: '"new-password"', minlength: '"8"' },
  { id: "adminTestPwdConfirm", autocomplete: '"new-password"', minlength: '"8"' },
  { id: "adminPwd", autocomplete: '"new-password"', minlength: '"8"' },
  { id: "adminPwdConfirm", autocomplete: '"new-password"', minlength: '"8"' },
];

assert.ok(html.includes("function passwordField({id,label"), "Falta helper passwordField().");
assert.ok(html.includes("function togglePasswordVisibility(id,button)"), "Falta togglePasswordVisibility().");
assert.ok(html.includes('button type="button" class="password-toggle"'), "El botón debe ser type=button.");
assert.ok(html.includes('aria-label="Mostrar contraseña"'), "El botón debe tener aria-label inicial.");
assert.ok(html.includes('aria-controls="${esc(id)}"'), "El botón debe apuntar al input con aria-controls.");
assert.ok(html.includes('aria-pressed="false"'), "El botón debe exponer estado inicial con aria-pressed.");
assert.ok(html.includes('show?"Ocultar contraseña":"Mostrar contraseña"'), "El aria-label debe cambiar al alternar.");
assert.ok(html.includes('input.type=show?"text":"password"'), "El input debe alternar entre text y password.");
assert.ok(html.includes('miniIcon(show?"eyeOff":"eye",18)'), "El icono debe cambiar entre ojo y ojo tachado.");

for (const field of expectedFields) {
  const marker = `passwordField({id:"${field.id}"`;
  assert.ok(html.includes(marker), `El campo ${field.id} debe renderizarse con passwordField().`);
  const start = html.indexOf(marker);
  const end = html.indexOf("})", start);
  const src = html.slice(start, end + 2);
  assert.ok(src.includes(`autocomplete:${field.autocomplete}`), `${field.id} debe conservar autocomplete.`);
  if (field.minlength) assert.ok(src.includes(`minlength:${field.minlength}`), `${field.id} debe conservar minlength.`);
}

for (const technicalId of ["au_key", "set_key", "set_supakey"]) {
  assert.ok(
    !html.includes(`passwordField({id:"${technicalId}"`),
    `${technicalId} es un campo técnico local y no debe ganar toggle de secreto por REQ-113.`,
  );
}

console.log("Toggle de contraseña: helper, accesibilidad y campos usuario/admin verificados.");
