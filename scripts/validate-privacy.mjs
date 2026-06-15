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
  ],
};

const missing = [];
for (const [file, needles] of Object.entries(required)) {
  const text = fs.readFileSync(new URL("../" + file, import.meta.url), "utf8");
  for (const needle of needles) {
    if (!text.includes(needle)) missing.push(file + ": " + needle);
  }
}

if (missing.length) {
  console.error("Faltan contratos de privacidad:\n- " + missing.join("\n- "));
  process.exit(1);
}
console.log("Privacidad: contratos estructurales presentes.");
