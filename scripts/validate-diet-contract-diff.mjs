#!/usr/bin/env node
// REQ-144: valida que el diff del canario reporte delta total y por dimension.
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const seed = join(ROOT, "supabase", "seed.sql");

const out = execFileSync("node", [
  join(ROOT, "scripts", "diff-diet-contract.mjs"),
  "--before", seed,
  "--after", seed,
  "--json",
], { cwd: ROOT, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });

const report = JSON.parse(out);

assert.equal(report.total.beforeOkDays, report.total.afterOkDays, "semilla identica no debe cambiar okDays");
assert.equal(report.total.deltaOkDays, 0, "semilla identica debe tener delta total 0");
assert.equal(report.total.deltaPct, 0, "semilla identica debe tener delta porcentual 0");
assert.equal(report.catalogDelta.ingredients, 0, "semilla identica no cambia ingredientes");
assert.equal(report.catalogDelta.dishes, 0, "semilla identica no cambia platos");
assert.equal(report.catalogDelta.dishIngredients, 0, "semilla identica no cambia recetas");
assert.equal(report.dimensionDeltas.length, 54, "debe reportar 3 mealCounts x 3 dietas x 2 targets x 3 disgustos");
assert.ok(report.dimensionDeltas.every(row => row.before && row.after), "cada dimension debe tener before y after");
assert.ok(report.dimensionDeltas.every(row => row.deltaOkDays === 0), "semilla identica no debe mover dimensiones");
assert.ok(report.dimensionDeltas.every(row => typeof row.label === "string" && row.label.includes("comidas")), "cada dimension debe tener label legible");
assert.equal(report.improvedDimensions, 0, "semilla identica no mejora dimensiones");
assert.equal(report.regressedDimensions, 0, "semilla identica no empeora dimensiones");
assert.equal(report.unchangedDimensions, 54, "semilla identica deja las 54 dimensiones sin cambio");

console.log("Diff del canario DIET_CONTRACT validado con semilla identica.");
