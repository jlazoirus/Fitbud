#!/usr/bin/env node
// REQ-134: prueba offline del pipeline de crecimiento de catalogo.
// Usa fixture local: no llama a Anthropic ni toca produccion.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const tmp = mkdtempSync(join(tmpdir(), "fitbud-grow-catalog-"));
const fixturePath = join(tmp, "fixture.json");
const outDir = join(tmp, "out");

const fixture = {
  brief: "Fixture REQ-134: desayunos ligeros omnivoros",
  ingredients: [
    {
      slug: "claras-organicas-pasteurizadas",
      name: "Claras organicas pasteurizadas",
      category: "Proteina animal",
      kcal: 52,
      protein_g: 11,
      carbs_g: 0.7,
      fat_g: 0.2,
      source: "Etiqueta nutricional fixture",
    },
    {
      slug: "proteina-imposible",
      name: "Proteina imposible",
      category: "Proteina",
      kcal: 10,
      protein_g: 50,
      carbs_g: 0,
      fat_g: 0,
      source: "Fixture inconsistente",
    },
    {
      slug: "tofu-fresco-magro",
      name: "Tofu fresco magro",
      category: "Proteina vegetal",
      kcal: 80,
      protein_g: 9,
      carbs_g: 2,
      fat_g: 4,
      source: "",
    },
  ],
  dishes: [
    {
      slug: "wrap-de-claras-y-pollo",
      name: "Wrap de claras y pollo",
      slot: "desayuno",
      compatible_slots: ["desayuno"],
      diet_tags: ["omnivoro"],
      cuisine_tags: ["criolla"],
      meal_weight: "medium",
      meal_form: "sandwich",
      prep_minutes: 12,
      budget_tier: "medium",
      needs_kitchen: true,
      eat_out_ok: false,
      ingredients: [
        { ingredient_slug: "claras-organicas-pasteurizadas", grams: 150, scalable: true, min_g: 100, max_g: 230, step_g: 10 },
        { ingredient_slug: "tortilla-integral-de-trigo", grams: 80, scalable: true, min_g: 55, max_g: 110, step_g: 5 },
        { ingredient_slug: "pechuga-de-pollo", grams: 70, scalable: true, min_g: 50, max_g: 120, step_g: 10 },
        { ingredient_slug: "palta", grams: 30, scalable: true, min_g: 20, max_g: 60, step_g: 5 },
      ],
    },
    {
      slug: "snack-sin-metadata",
      name: "Snack sin metadata",
      slot: "snack",
      compatible_slots: ["snack"],
      diet_tags: ["omnivoro"],
      cuisine_tags: ["mediterranea"],
      meal_weight: "light",
      meal_form: "snack",
      prep_minutes: 5,
      budget_tier: "low",
      eat_out_ok: false,
      ingredients: [
        { ingredient_slug: "yogur-griego-natural-0", grams: 120, scalable: true, min_g: 80, max_g: 180, step_g: 10 },
      ],
    },
  ],
};

writeFileSync(fixturePath, JSON.stringify(fixture, null, 2));

const stdout = execFileSync(process.execPath, [
  join(ROOT, "scripts/grow-catalog.mjs"),
  "--fixture",
  fixturePath,
  "--out-dir",
  outDir,
], { cwd: ROOT, encoding: "utf8" });

const summary = JSON.parse(stdout);
assert.equal(summary.acceptedIngredients, 1, "Debe aceptar solo el ingrediente nuevo con fuente y macros consistentes.");
assert.equal(summary.acceptedDishes, 1, "Debe aceptar solo el plato que escala contra el presupuesto del slot.");
assert.ok(summary.rejected >= 3, "Debe rechazar macros inconsistentes, fuente ausente y metadata incompleta.");

const report = JSON.parse(readFileSync(summary.report, "utf8"));
const sql = readFileSync(summary.sql, "utf8");

assert.equal(report.accepted.ingredients[0].slug, "claras-organicas-pasteurizadas");
assert.equal(report.accepted.dishes[0].slug, "wrap-de-claras-y-pollo");
assert.ok(report.rejected.some((item) => item.slug === "proteina-imposible" && item.reasons.includes("ingredient_macro_inconsistent")),
  "Debe explicar rechazo por macros inconsistentes.");
assert.ok(report.rejected.some((item) => item.slug === "tofu-fresco-magro" && item.reasons.includes("ingredient_source_required")),
  "Debe exigir fuente para ingredientes nuevos.");
assert.ok(report.rejected.some((item) => item.slug === "snack-sin-metadata" && item.reasons.includes("boolean_metadata_invalid")),
  "Debe rechazar platos sin metadata booleana completa.");

assert.ok(sql.includes("insert into ingredients") && sql.includes("on conflict (slug)"),
  "El SQL debe upsertear por slug, no por ID.");
assert.ok(sql.includes("cuisine_tags") && sql.includes("array['criolla']::text[]"),
  "El SQL debe incluir cuisine_tags validados.");
assert.ok(sql.includes("delete from dish_ingredients") && sql.includes("join ingredients i on i.slug"),
  "El SQL debe reconstruir recetas referenciando ingredientes por slug.");
assert.ok(sql.includes("'Wrap de claras y pollo'") && sql.includes("'claras-organicas-pasteurizadas'"),
  "El SQL debe contener el lote aceptado.");
assert.ok(!/truncate|restart identity/i.test(sql), "El patch no debe truncar ni depender de IDs reiniciados.");

console.log("Pipeline de crecimiento de catalogo validado con fixture offline.");
