// REQ-75 — Prompt de generateOneDay debe incluir instrucciones reforzadas
// cuando la meta de proteína es alta (>25% de kcal), con piso mínimo por
// comida y prohibición de sacrificar proteína por variedad.
// REQ-138 actualizó las aserciones #6 y #8: el prompt ya no le pide al modelo
// verificar/sumar los totales del día como autoridad final (eso ahora lo
// hace finalizeNutritionDay() aguas abajo); la proteína alta sigue reforzada
// vía el bloque táctico highProt, no vía la vieja línea OBLIGATORIO global.
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

function extractFunctionSource(src, name) {
  const marker = `function ${name}(`;
  const start = src.indexOf(marker);
  assert.ok(start !== -1, `No se encontró function ${name}( en index.html`);
  let i = src.indexOf("{", start);
  assert.ok(i !== -1, `No se encontró el cuerpo de ${name}`);
  let depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") { depth--; if (depth === 0) { i++; break; } }
  }
  return src.slice(start, i);
}

const genSrc = extractFunctionSource(html, "generateOneDay");

// 1. Calcula protPct para detectar metas altas
assert.ok(
  genSrc.includes("protPct") && genSrc.includes("target.p*4"),
  "generateOneDay debe calcular protPct = target.p * 4 / target.kcal para detectar metas altas de proteína."
);

// 2. Tiene bloque condicional highProt con instrucciones tácticas
assert.ok(
  genSrc.includes("highProt") && genSrc.includes("META DE PROTEÍNA ALTA"),
  "generateOneDay debe incluir un bloque condicional highProt con instrucciones tácticas para proteína alta."
);

// 3. Instrucción de combinar 2+ fuentes por comida
assert.ok(
  genSrc.includes("2+ fuentes de proteína"),
  "El bloque highProt debe instruir a combinar 2+ fuentes de proteína por comida."
);

// 4. Piso mínimo de proteína por comida
assert.ok(
  genSrc.includes("protPerMeal") && genSrc.includes("piso mínimo"),
  "El bloque highProt debe establecer un piso mínimo de proteína por comida."
);

// 5. Fuentes dinámicas filtradas por restricciones/disgustos
assert.ok(
  genSrc.includes("proteinPromptSources(prefs)") && genSrc.includes("proteinSources.join"),
  "El bloque highProt debe construir fuentes proteicas dinámicas filtradas por el perfil."
);
assert.ok(
  !genSrc.includes("tofu + legumbre") && !genSrc.includes("300g de tofu") && !genSrc.includes("80g prot/100g"),
  "El bloque highProt no debe contener ejemplos estáticos de tofu ni gramajes."
);

// 6. El bloque highProt sigue con peso retórico fuerte (OBLIGATORIA) y
// prohíbe sacrificar proteína por variedad, aunque la vieja línea global
// OBLIGATORIO — AMBAS metas ya no exista (REQ-138).
assert.ok(
  genSrc.includes("Estrategia OBLIGATORIA") && genSrc.includes("no sacrifiques proteína por variedad"),
  "El bloque highProt debe mantener peso retórico fuerte para la proteína."
);

// 7. Token limit sube para highProt y para dias con mas comidas
assert.ok(
  genSrc.includes("Math.min(4096") && genSrc.includes("highProt?2200:1800") && genSrc.includes("mealCount*520"),
  "El max_tokens debe escalar por proteína alta y cantidad de comidas, con cap 4096."
);

// 8. REQ-138: el prompt ya NO le exige al modelo sumar/verificar los totales
// del día como autoridad final — ese cierre lo hace finalizeNutritionDay().
assert.ok(
  !genSrc.includes("Suma y verifica los totales") && !genSrc.includes("OBLIGATORIO — el día DEBE cumplir AMBAS metas"),
  "El prompt no debe exigirle al modelo verificar los totales del día como autoridad final (REQ-138)."
);

// ── Simulación de casos ─────────────────────────────────────────────────────
const cases = [
  { kcal: 2300, p: 180, c: 284, f: 67, label: "2300/180p", expectHigh: true },
  { kcal: 2000, p: 150, c: 200, f: 65, label: "2000/150p", expectHigh: true },
  { kcal: 2400, p: 200, c: 250, f: 60, label: "2400/200p", expectHigh: true },
  { kcal: 2000, p: 100, c: 250, f: 67, label: "2000/100p", expectHigh: false },
];

for (const c of cases) {
  const pct = Math.round(c.p * 4 / c.kcal * 100);
  const isHigh = pct > 25;
  assert.equal(isHigh, c.expectHigh,
    `Caso ${c.label}: protPct=${pct}%, esperado highProt=${c.expectHigh} pero fue ${isHigh}`);
  if (isHigh) {
    const meals = 4;
    const perMeal = Math.round(c.p / meals);
    const floor = Math.round(perMeal * 0.7);
    assert.ok(floor >= 20,
      `Caso ${c.label}: piso mínimo por comida ${floor}g debe ser ≥20g para metas altas`);
  }
}

console.log("Prompt de alta proteína: bloque condicional, peso retórico igualado, tokens escalados, 4 casos simulados OK.");
