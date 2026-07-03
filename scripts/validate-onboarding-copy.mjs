#!/usr/bin/env node
// REQ-114 — copy de onboarding/perfil sin jerga visible.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const index = readFileSync("index.html", "utf8");
const pure = readFileSync("js/nutrition-pure.js", "utf8");

assert.ok(index.includes('value="mantenimiento"'), "El valor interno mantenimiento debe conservarse.");
assert.ok(index.includes(">Mantener mi peso y mejorar mi cuerpo<"), "El objetivo de mantenimiento debe tener copy claro.");
assert.ok(!index.includes("Mantener peso y recomponer"), "No debe volver el label anterior de mantenimiento.");

assert.ok(index.includes('["omnivoro","Como de todo"]'), "El valor omnivoro debe mostrarse como Como de todo.");
assert.ok(index.includes("Como de todo no puede combinarse"), "La validación debe usar el label visible nuevo.");
assert.ok(!index.includes("Omnívoro"), "El shell visible no debe mostrar Omnívoro.");

assert.ok(index.includes("<label>Grasa corporal (opcional)</label>"), "El campo de grasa corporal debe ser claramente opcional.");
assert.ok(index.includes("Déjalo vacío si no lo sabes; no bloquea tu plan."), "El campo opcional debe explicar que puede quedar vacío.");
assert.ok(!index.includes("Grasa corporal % (opcional)"), "El label anterior de grasa corporal no debe volver.");

assert.ok(index.includes("<label>Ciclo de seguimiento</label>"), "Onboarding debe hablar de ciclo de seguimiento.");
assert.ok(index.includes('<label for="pf_duration">Ciclo de seguimiento</label>'), "Perfil debe hablar de ciclo de seguimiento.");
assert.ok(pure.includes('4 semanas · ciclo corto'), "La opción de 4 semanas debe explicar el ciclo corto.");
assert.ok(pure.includes('10 semanas · recomendado'), "La opción de 10 semanas debe quedar como recomendada.");
assert.ok(index.includes("4 semanas es un ciclo corto; 10 semanas es el proceso completo recomendado."), "La nota visible debe explicar la decisión de ciclo.");
assert.ok(pure.includes("return validPlanDuration(duration)?duration:10;"), "10 semanas debe seguir siendo el default efectivo.");

console.log("validate-onboarding-copy: copy de REQ-114 verificado.");
