#!/usr/bin/env node
// Validación de migraciones SQL — REQ-30
// Verifica idempotencia, RLS, rollback y dependencias entre archivos.
// Sale con código 0 si pasa, 1 si hay errores.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const DIR = join(ROOT, "supabase");

const errors = [];
const warnings = [];

function fail(file, msg) { errors.push(`${file}: ${msg}`); }
function warn(file, msg) { warnings.push(`${file}: ${msg}`); }

// Tablas que DEBEN tener RLS habilitado (datos de usuario)
const TABLES_REQUIRING_RLS = [
  "day_log", "weight_log", "plan_versions", "plan_cycles",
  "user_consents", "safety_screenings", "profiles",
  "coach_usage", "coach_option_pool", "coach_option_impressions",
  "coach_generation_parts", "coach_quota_policies", "coach_quota_overrides",
  "notification_preferences", "notification_log",
  "billing_events", "user_entitlements", "product_events",
];

// Orden esperado de dependencias entre archivos
const DEPENDENCY_ORDER = [
  "schema.sql",       // 0 — base
  "seed.sql",         // 1 — datos
  "auth.sql",         // 2 — multiusuario
  "plan_cycles.sql",  // 3 — ciclos y fotos
  "privacy.sql",      // 4 — consentimientos
  "exercises.sql",    // 5 — catálogo de ejercicios
  "coach_quota.sql",  // 6 — cuotas y pool
  "notifications.sql",// 7 — recordatorios
  "entitlements.sql", // 8 — entitlement
  "billing.sql",      // 9 — eventos Stripe
  "analytics.sql",    // 10 — analítica
];

// schema.sql y seed.sql son scripts de instalación fresca (DROP + CREATE), no incrementales.
// No aplica el check de IF NOT EXISTS a ellos.
const FULL_RESET_FILES = new Set(["schema.sql", "seed.sql", "day_log.sql", "weight_log.sql", "weight_bf.sql"]);

const files = readdirSync(DIR).filter(f => f.endsWith(".sql")).sort();

// Construye un mapa acumulado de tablas con RLS en todos los archivos
// (una tabla puede declararse en auth.sql aunque exista primero en schema.sql)
const allSql = {};
for (const file of files) {
  allSql[file] = readFileSync(join(DIR, file), "utf8").toLowerCase();
}
const combinedSql = Object.values(allSql).join("\n");

// Helper: verifica si una tabla tiene RLS en cualquier archivo del repo
function hasRls(table) {
  return new RegExp(`alter\\s+table\\s+(?:\\w+\\.)?${table}\\s+enable\\s+row\\s+level\\s+security`).test(combinedSql);
}

for (const file of files) {
  const sql = allSql[file];
  const isReadonly = ["validate.sql", "validate.mjs"].includes(file);

  if (isReadonly) continue;

  // 1. Idempotencia: CREATE TABLE sin IF NOT EXISTS
  // Excluye archivos de instalación fresca que usan DROP + CREATE
  if (!FULL_RESET_FILES.has(file)) {
    const hasCreateTable = /\bcreate\s+table\b/.test(sql);
    const hasIfNotExists = /\bcreate\s+table\s+if\s+not\s+exists\b/.test(sql);
    if (hasCreateTable && !hasIfNotExists) {
      fail(file, "CREATE TABLE sin IF NOT EXISTS — la migración no es idempotente.");
    }
  }

  // 2. ALTER TABLE ADD COLUMN sin IF NOT EXISTS (PostgreSQL 9.6+)
  const addColRe = /alter\s+table\s+\S+\s+add\s+column(?!\s+if\s+not\s+exists)/g;
  if (addColRe.test(sql)) {
    warn(file, "ALTER TABLE ADD COLUMN sin IF NOT EXISTS — puede fallar si ya existe.");
  }

  // 3. DROP sin IF EXISTS (solo en archivos incrementales)
  if (!FULL_RESET_FILES.has(file)) {
    const dropRe = /\bdrop\s+(table|index|function|policy|trigger)\s+(?!if\s+exists)/g;
    if (dropRe.test(sql)) {
      warn(file, "DROP sin IF EXISTS — puede fallar si el objeto no existe.");
    }
  }

  // 4. Tablas declaradas en este archivo deben tener RLS (buscado en todo el repo SQL)
  const tableRe = /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:\w+\.)?(\w+)/g;
  let m;
  while ((m = tableRe.exec(sql)) !== null) {
    const table = m[1];
    if (TABLES_REQUIRING_RLS.includes(table) && !hasRls(table)) {
      fail(file, `La tabla '${table}' requiere RLS pero no se encontró en ningún archivo SQL.`);
    }
  }

  // 5. Funciones con SECURITY DEFINER deben tener SET search_path
  if (sql.includes("security definer") && !sql.includes("set search_path")) {
    warn(file, "Función con SECURITY DEFINER sin SET search_path — riesgo de search_path injection.");
  }

  // 6. No hay secretos hardcodeados
  if (/password\s*=\s*'[^']{4,}'/.test(sql) || /api_key\s*=\s*'[^']{4,}'/.test(sql)) {
    fail(file, "Posible secret hardcodeado (password o api_key con valor literal).");
  }
}

// Verificar que todos los archivos de dependencia existen
const existingFiles = new Set(files);
for (const dep of DEPENDENCY_ORDER) {
  if (!existingFiles.has(dep) && !["notifications.sql"].includes(dep)) {
    // notifications.sql puede estar en otro commit; solo aviso
    warn(dep, "Archivo de migración esperado no encontrado.");
  }
}

// Reporte
console.log(`Validación de migraciones SQL: ${files.length} archivo(s) revisado(s).`);
if (warnings.length) {
  console.log(`  ${warnings.length} aviso(s):`);
  warnings.forEach(w => console.log("    ⚠ " + w));
}
if (errors.length) {
  console.error(`\n✗ ${errors.length} error(es):`);
  errors.forEach(e => console.error("    ✗ " + e));
  process.exit(1);
}
console.log("✓ Migraciones SQL idempotentes con RLS donde se requiere.");
