// REQ-75 — Prompt de generateOneDay debe incluir instrucciones reforzadas
// cuando la meta de proteína es alta (>25% de kcal) y dar a proteína igual
// peso retórico que a calorías en la línea OBLIGATORIO.
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

// 5. La línea OBLIGATORIO da igual peso a proteína y calorías
assert.ok(
  genSrc.includes("AMBAS metas") && genSrc.includes("TAN importante como"),
  "La línea OBLIGATORIO debe dar a proteína igual peso retórico que a calorías."
);

// 6. Token limit sube para highProt
assert.ok(
  /highProt\s*\?\s*1800\s*:\s*1400/.test(genSrc),
  "El max_tokens debe subir a 1800 para metas de proteína alta (1400 normal)."
);

// 7. Instrucción de verificar totales antes de responder
assert.ok(
  genSrc.includes("Suma y verifica los totales"),
  "El prompt debe pedir a la IA que sume y verifique los totales antes de responder."
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
