#!/usr/bin/env node
// REQ-166 — La pasada global de cierre optimiza el CONTRATO, no scoreMacros().
//
// Protege las dos propiedades de las que depende el salto del canario
// (32.3% -> 76.5%) y que son faciles de romper sin darse cuenta:
//   1. simetria: las 4 metricas pesan igual medidas en su propia tolerancia;
//   2. continuidad: sin zona plana ni escalon, o el hill-climbing se clava.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import "../js/nutrition-pure.js";
import "../js/nutrition-domain.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const d = globalThis.FITBUD_NUTRITION_DOMAIN;
assert.ok(d, "FITBUD_NUTRITION_DOMAIN debe existir");

const score = d.scoreDayAgainstContract;
assert.equal(typeof score, "function", "scoreDayAgainstContract debe exportarse");

const target = { kcal: 2250, p: 190, c: 215, f: 70 };
const tol = {
  kcal: d.dietContractTolerance("kcal", target.kcal),
  p: d.dietContractTolerance("p", target.p),
  c: d.dietContractTolerance("c", target.c),
  f: d.dietContractTolerance("f", target.f),
};

// 1. El dia exacto puntua 0.
assert.equal(score({ ...target }, target), 0, "un dia exacto debe puntuar 0");

// 2. Simetria: desviarse exactamente una tolerancia en CUALQUIER metrica cuesta
//    lo mismo. Es lo que scoreMacros() no cumple (carbs/grasa valen la mitad).
const atOneTolerance = [
  score({ ...target, kcal: target.kcal + tol.kcal }, target),
  score({ ...target, p: target.p + tol.p }, target),
  score({ ...target, c: target.c + tol.c }, target),
  score({ ...target, f: target.f + tol.f }, target),
];
atOneTolerance.forEach((value, index) => {
  assert.ok(
    Math.abs(value - atOneTolerance[0]) < 1e-9,
    `metrica ${index}: una tolerancia debe costar lo mismo en las 4 metricas (${atOneTolerance.join(", ")})`,
  );
});
assert.ok(atOneTolerance[0] > 0, "una tolerancia de desviacion debe costar algo");

// 3. Signo indiferente: pasarse o quedarse corto por igual cuesta igual.
assert.equal(
  score({ ...target, c: target.c + tol.c }, target),
  score({ ...target, c: target.c - tol.c }, target),
  "el contrato es simetrico: exceso y defecto cuestan igual",
);

// 4. Continuidad y monotonia estricta: mas desviacion siempre puntua peor,
//    tambien DENTRO de la tolerancia. Sin esto el hill-climbing pierde el
//    gradiente y se queda en el punto de partida (medido: 205/378 vs 289/378).
let prev = -1;
for (const frac of [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1, 1.5, 2, 4]) {
  const value = score({ ...target, c: target.c + tol.c * frac }, target);
  assert.ok(value > prev, `score debe crecer con la desviacion (frac ${frac}: ${value} <= ${prev})`);
  prev = value;
}

// 5. El error grande domina al chico: 2 tolerancias en una metrica debe costar
//    mas que 1 tolerancia en dos metricas distintas.
const oneBig = score({ ...target, c: target.c + tol.c * 2 }, target);
const twoSmall = score({ ...target, c: target.c + tol.c, f: target.f + tol.f }, target);
assert.ok(oneBig > twoSmall, "el desvio concentrado debe penalizar mas que el repartido");

// 6. Metas invalidas no explotan.
assert.equal(score({ kcal: 100, p: 10, c: 10, f: 5 }, { kcal: 0, p: 0, c: 0, f: 0 }), 0, "meta en cero no debe puntuar");

// 7. Estructural: globalClosePass() ya no puede puntuar el dia con scoreMacros().
const src = readFileSync(join(ROOT, "js", "nutrition-domain.js"), "utf8");
const start = src.indexOf("function globalClosePass(");
assert.ok(start > 0, "globalClosePass debe existir");
const body = src.slice(start, src.indexOf("\n  function ", start + 10));
assert.ok(
  !/scoreMacros\(/.test(body),
  "globalClosePass no debe puntuar el dia con scoreMacros(): rompe el contrato en carbohidratos/grasa",
);
assert.ok(
  /scoreDayAgainstContract\(currentDayMacros\(\),target\)/.test(body),
  "globalClosePass debe puntuar con scoreDayAgainstContract",
);

// 8. scoreMacros() sigue siendo el score POR COMIDA: el reparto de gramos no
//    debe haberse llevado por delante la seleccion de plato de cada slot.
assert.ok(
  /const s=scoreMacros\(macrosFromSolvedLines\(lines\),target\);/.test(src),
  "optimizeLines() debe seguir usando scoreMacros por comida",
);

console.log("validate-global-close-objective: 8 bloques de asserts pasaron.");
