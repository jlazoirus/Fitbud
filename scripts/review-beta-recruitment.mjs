#!/usr/bin/env node
// Lista candidatos de reclutamiento beta REQ-70 priorizados para contacto humano.

const args = new Set(process.argv.slice(2));
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = Math.max(1, Math.min(100, Number(limitArg ? limitArg.split("=")[1] : 20) || 20));
const jsonMode = args.has("--json");
const allStatuses = args.has("--all");

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!SUPABASE_URL || !SERVICE_KEY) {
  fail("Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY para revisar postulaciones beta.");
}

const statusFilter = allStatuses ? "" : "&status=in.(new,shortlisted)";
const select = [
  "id",
  "created_at",
  "name",
  "whatsapp",
  "age_band",
  "country_city",
  "segment",
  "priority",
  "priority_score",
  "beta_eligible",
  "status",
  "goal",
  "stage",
  "recent_attempt",
  "tools",
  "pains",
  "investment",
  "availability",
  "health",
  "story",
].join(",");

const url = SUPABASE_URL
  + "/rest/v1/beta_recruitment_submissions?select=" + encodeURIComponent(select)
  + statusFilter
  + "&order=priority_score.desc,created_at.asc"
  + "&limit=" + limit;

const response = await fetch(url, {
  headers: { apikey: SERVICE_KEY, Authorization: "Bearer " + SERVICE_KEY },
});

const rows = await response.json().catch(() => []);
if (!response.ok) {
  const message = response.status === 404 || rows.code === "42P01"
    ? "Falta aplicar supabase/beta_recruitment.sql en Supabase."
    : (rows.message || "No se pudieron leer postulaciones beta.");
  fail(message);
}

if (jsonMode) {
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}

const list = Array.isArray(rows) ? rows : [];
const counts = list.reduce((acc, row) => {
  acc.total += 1;
  acc[row.segment] = (acc[row.segment] || 0) + 1;
  acc[row.priority] = (acc[row.priority] || 0) + 1;
  return acc;
}, { total: 0 });

console.log("# Reclutamiento beta REQ-70\n");
console.log(`Candidatos pendientes revisados: ${counts.total}`);
console.log(`Alta: ${counts.Alta || 0} · Media: ${counts.Media || 0} · Baja: ${counts.Baja || 0}`);
console.log(`A: ${counts["A - Comprometido autonomo"] || 0} · B: ${counts["B - Principiante guiado"] || 0} · Exploratorio: ${counts.Exploratorio || 0}\n`);

if (!list.length) {
  console.log("No hay postulaciones nuevas o preseleccionadas para revisar.");
  process.exit(0);
}

console.log("## Contactar primero\n");
list.slice(0, 10).forEach((row, index) => {
  const beta = row.beta_eligible ? "beta posible" : "solo entrevista/revisar";
  const pains = Array.isArray(row.pains) ? row.pains.join("; ") : "";
  const tools = Array.isArray(row.tools) ? row.tools.join("; ") : "";
  console.log(`${index + 1}. ${row.name} — ${row.priority} (${row.priority_score}) — ${row.segment} — ${beta}`);
  console.log(`   WhatsApp: ${row.whatsapp} · ${row.country_city} · ${row.age_band} · estado: ${row.status}`);
  console.log(`   Objetivo: ${row.goal} · Disponibilidad: ${row.availability} · Inversion: ${row.investment}`);
  console.log(`   Fricciones: ${pains || "sin detalle"} · Herramientas: ${tools || "sin detalle"}`);
  console.log(`   Caso: ${String(row.story || "").slice(0, 220)}${String(row.story || "").length > 220 ? "..." : ""}`);
});

console.log("\nSiguiente accion sugerida: contactar en orden a los candidatos Alta, cuidando mantener balance minimo de 5 A y 5 B para REQ-70.");
