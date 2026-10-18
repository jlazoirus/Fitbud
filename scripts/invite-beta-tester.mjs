#!/usr/bin/env node
// REQ-203: invita a un postulante de la beta de fundadores.
// Genera un código de acceso (90 días por defecto), marca la postulación como
// beta_invited y deja listo el mensaje de WhatsApp con el enlace que canjea solo.
//
//   node scripts/invite-beta-tester.mjs <id-postulación> [--days=90] [--plan=quarterly] [--valid-days=30] [--dry-run]
//   node scripts/invite-beta-tester.mjs --self-test
//
// Necesita SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY. APP_URL (opcional) cambia
// el dominio del enlace; por defecto https://evolvapp.club.
import crypto from "node:crypto";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // mismo que api/entitlement.js

export function generatedCode(randomInt = crypto.randomInt) {
  let body = "";
  for (let i = 0; i < 8; i++) body += CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)];
  return "FIT-" + body.slice(0, 4) + "-" + body.slice(4);
}

export function whatsappDigits(raw) {
  return String(raw || "").replace(/\D/g, "");
}

export function inviteMessage({ name, code, days, validUntil, appUrl }) {
  const first = String(name || "").trim().split(/\s+/)[0] || "";
  const link = appUrl.replace(/\/$/, "") + "/?codigo=" + code;
  const until = new Date(validUntil).toLocaleDateString("es-PE", { day: "numeric", month: "long", timeZone: "America/Lima" });
  const months = days % 30 === 0 && days >= 60 ? `${days / 30} meses` : `${days} días`;
  return [
    `Hola${first ? " " + first : ""}, te escribimos de Evolv. Gracias por postular a la beta de fundadores: entraste al grupo.`,
    "",
    `Este es tu acceso completo por ${months}, sin costo: ${link}`,
    "",
    "Ábrelo en el teléfono donde vas a usar Evolv y crea tu cuenta; el acceso se activa solo. "
      + `Si en algún momento te pide un código, es ${code} (Perfil → Mi suscripción → ¿Tienes un código de acceso?).`,
    "",
    `El enlace se puede activar hasta el ${until}. ¿Te acomoda una llamada de 15 minutos esta semana para conocer tu caso?`,
  ].join("\n");
}

export function whatsappLink(whatsapp, message) {
  return "https://wa.me/" + whatsappDigits(whatsapp) + "?text=" + encodeURIComponent(message);
}

function selfTest() {
  const seq = [0, 1, 2, 3, 30, 31, 8, 9];
  const code = generatedCode(() => seq.shift());
  if (code !== "FIT-ABCD-89JK") throw new Error("Formato de código inesperado: " + code);
  if (!/^FIT-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(generatedCode())) throw new Error("El código aleatorio no respeta el formato.");
  if (whatsappDigits("+51 999-111 222") !== "51999111222") throw new Error("Normalización de WhatsApp incorrecta.");
  const msg = inviteMessage({ name: "Ana María Pérez", code, days: 90, validUntil: "2026-11-17T12:00:00Z", appUrl: "https://evolvapp.club/" });
  for (const part of ["Hola Ana,", "por 3 meses", "https://evolvapp.club/?codigo=FIT-ABCD-89JK", "es FIT-ABCD-89JK", "17 de noviembre"]) {
    if (!msg.includes(part)) throw new Error(`El mensaje no incluye "${part}":\n${msg}`);
  }
  if (/\b(IA|prompt|tokens?|modelo)\b/i.test(msg)) throw new Error("El mensaje menciona vocabulario interno (REQ-31).");
  const link = whatsappLink("+56 9 1234 5678", msg);
  if (!link.startsWith("https://wa.me/56912345678?text=Hola%20Ana")) throw new Error("Enlace de WhatsApp incorrecto: " + link.slice(0, 60));
  console.log("invite-beta-tester: código, mensaje y enlace de WhatsApp verificados.");
}

async function main(argv) {
  if (argv.includes("--self-test")) return selfTest();
  const flag = (name, fallback) => {
    const hit = argv.find((a) => a.startsWith(`--${name}=`));
    return hit ? hit.split("=")[1] : fallback;
  };
  const id = argv.find((a) => !a.startsWith("--"));
  const days = Number(flag("days", 90));
  const validDays = Number(flag("valid-days", 30));
  const plan = flag("plan", "quarterly");
  const dryRun = argv.includes("--dry-run");
  const appUrl = process.env.APP_URL || "https://evolvapp.club";

  const fail = (message) => { console.error(message); process.exit(1); };
  if (!id || !/^\d+$/.test(id)) fail("Uso: node scripts/invite-beta-tester.mjs <id-postulación> [--days=90] [--plan=quarterly] [--valid-days=30] [--dry-run]");
  if (!Number.isInteger(days) || days < 1 || days > 365) fail("--days debe estar entre 1 y 365.");
  if (!Number.isInteger(validDays) || validDays < 1 || validDays > 365) fail("--valid-days debe estar entre 1 y 365.");

  const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!SUPABASE_URL || !KEY) fail("Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.");
  const headers = { apikey: KEY, Authorization: "Bearer " + KEY, "content-type": "application/json" };
  const rest = (path) => SUPABASE_URL + "/rest/v1/" + path;

  const subRes = await fetch(rest(`beta_recruitment_submissions?id=eq.${id}&select=id,name,whatsapp,status,review_notes`), { headers });
  const rows = await subRes.json().catch(() => []);
  if (!subRes.ok) fail((rows && rows.message) || "No se pudo leer la postulación.");
  const sub = Array.isArray(rows) ? rows[0] : null;
  if (!sub) fail(`No existe la postulación ${id}.`);
  if (sub.status === "beta_invited") console.warn(`Aviso: ${sub.name} ya estaba invitado; se genera un código nuevo.`);

  const validUntil = new Date(Date.now() + validDays * 86400000).toISOString();
  let code = generatedCode();
  if (!dryRun) {
    let saved = false;
    for (let attempt = 0; attempt < 8 && !saved; attempt++) {
      const r = await fetch(rest("redemption_codes"), {
        method: "POST",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify({ code, plan_id: plan, duration_days: days, valid_until: validUntil }),
      });
      if (r.ok) { saved = true; break; }
      const err = await r.json().catch(() => ({}));
      if (!(r.status === 409 || String(err.code) === "23505")) fail(err.message || "No se pudo crear el código (¿aplicaste supabase/coupon_codes.sql?).");
      code = generatedCode();
    }
    if (!saved) fail("No se pudo generar un código único. Intenta de nuevo.");

    const stamp = new Date().toISOString().slice(0, 10);
    const note = `${stamp}: invitado a la beta con ${code} (${days} días, plan ${plan}).`;
    const upd = await fetch(rest(`beta_recruitment_submissions?id=eq.${id}`), {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify({
        status: "beta_invited",
        contacted_at: new Date().toISOString(),
        review_notes: sub.review_notes ? sub.review_notes + "\n" + note : note,
      }),
    });
    if (!upd.ok) console.warn(`Aviso: el código ${code} se creó, pero no se pudo marcar la postulación como invitada.`);
  }

  const message = inviteMessage({ name: sub.name, code, days, validUntil, appUrl });
  console.log(`# Invitación para ${sub.name} (postulación ${sub.id})${dryRun ? " — simulación, nada se guardó" : ""}\n`);
  console.log(`Código: ${code} · ${days} días · plan ${plan} · se puede activar hasta ${validUntil.slice(0, 10)}\n`);
  console.log(message);
  console.log("\nAbrir WhatsApp con el mensaje listo:\n" + whatsappLink(sub.whatsapp, message));
}

await main(process.argv.slice(2));
