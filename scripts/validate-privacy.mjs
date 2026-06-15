import fs from "node:fs";

const required = {
  "supabase/privacy.sql": [
    "create table if not exists user_consents",
    "create table if not exists safety_screenings",
    "enable row level security",
  ],
  "api/claude.js": [
    "user_consents",
    "safety_screenings",
    "CONSENT_POLICY_VERSION",
  ],
  "api/privacy.js": [
    "fitbros-personal-data-v1",
    "BORRAR ",
    "/auth/v1/admin/users/",
    "progress-photos",
  ],
  "index.html": [
    "renderPrivacyGate",
    "exportPersonalData",
    "deleteMyAccount",
    "trainingSafetyHold",
    'id="ob_consent_core"',
    'id="ob_consent_photos"',
    'id="pg_consent_core"',
    'id="pg_consent_photos"',
    "No vendemos tus datos ni los usamos para publicidad",
  ],
};

const missing = [];
for (const [file, needles] of Object.entries(required)) {
  const text = fs.readFileSync(new URL("../" + file, import.meta.url), "utf8");
  for (const needle of needles) {
    if (!text.includes(needle)) missing.push(file + ": " + needle);
  }
}

const index = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const removedConsentControls = [
  "ob_age_confirmed",
  "ob_consent_body",
  "ob_consent_coach",
  "ob_consent_followup",
  "ob_consent_marketing",
  "pg_age",
  "pg_body",
  "pg_coach",
  "pg_followup",
  "pg_marketing",
  "pf_consent_followup",
  "pf_consent_marketing",
];
for (const id of removedConsentControls) {
  if (index.includes(`id="${id}"`)) missing.push("index.html: control redundante " + id);
}

if (missing.length) {
  console.error("Faltan contratos de privacidad:\n- " + missing.join("\n- "));
  process.exit(1);
}
console.log("Privacidad: contratos estructurales presentes.");
