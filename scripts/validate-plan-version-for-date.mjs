#!/usr/bin/env node
// REQ-224 — planVersionForDate(): una versión reemplazada no le gana a la vigente.
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const start = html.indexOf("function planVersionForDate(");
const src = html.slice(start, html.indexOf("\n}\n", start) + 2);
const make = (versions, days) => new Function("PLAN_VERSIONS", "S", "validYmd", `${src}\nreturn planVersionForDate;`)(
  versions, { days: days || {} }, s => /^\d{4}-\d{2}-\d{2}$/.test(s));

const active = { id: 106, status: "active", version_number: 5, valid_from: "2026-10-12", valid_to: "2026-12-20" };
const archivedDraft = { id: 108, status: "superseded", version_number: 7, valid_from: "2026-10-13", valid_to: "2026-12-20" };
const pick = make([active, archivedDraft]);
assert.equal(pick("2026-10-19").id, 106, "el plan activo gana a un borrador archivado que empieza después");
// Historial: un día ya anclado conserva su versión aunque esté reemplazada.
assert.equal(make([active, archivedDraft], { "2026-10-14": { planVersionId: 108 } })("2026-10-14").id, 108);
// Si solo una versión reemplazada cubre el día (pasado), se sigue usando.
const old = { id: 101, status: "superseded", version_number: 1, valid_from: "2026-09-01", valid_to: "2026-10-11" };
assert.equal(make([active, old])("2026-10-05").id, 101);
console.log("validate-plan-version-for-date: OK");
