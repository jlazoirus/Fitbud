#!/usr/bin/env node
// REQ-355: crea en Culqi los dos planes de la suscripción mensual y muestra sus ids
// para cargarlos en Vercel. Se corre a mano, una vez por entorno:
//
//   CULQI_SECRET_KEY=sk_test_... node scripts/culqi-crear-planes.mjs            # integración
//   CULQI_SECRET_KEY=sk_live_... node scripts/culqi-crear-planes.mjs --live     # producción
//   node scripts/culqi-crear-planes.mjs --dry-run                                # solo muestra
//
// - CULQI_PLAN_PRUEBA_ID: 7 días gratis (initial_cycles diarios sin cargo) y luego mensual.
// - CULQI_PLAN_MENSUAL_ID: mensual desde el primer día, para quien ya tuvo prueba o plan.
// Montos de SUSCRIPCION (tienda/planes.js). Con llave live exige --live: el plan de
// producción se crea solo cuando la prueba en integración salió bien (plan §3).
// La llave se lee del entorno; nunca se escribe en archivos ni en la salida.

import { SUSCRIPCION } from "../tienda/planes.js";

const MENSUAL = 3; // interval_unit_time: 1 diario, 2 semanal, 3 mensual, 4 anual, 5 trimestral, 6 semestral
const DIARIO = 1;

export function planesSuscripcion(s = SUSCRIPCION) {
  const base = {
    amount: s.montoCentimos,
    currency: s.moneda,
    interval_unit_time: MENSUAL,
    interval_count: 0, // 0 = se cobra de forma indefinida, hasta cancelar
    metadata: { evolv_plan: s.planId },
  };
  return [
    {
      env: "CULQI_PLAN_PRUEBA_ID",
      body: {
        ...base,
        name: "Evolv mensual con " + s.diasPrueba + " días gratis",
        short_name: "evolv-mensual-prueba-" + s.diasPrueba + "d",
        description: "Acceso completo a Evolv. " + s.diasPrueba + " días gratis y luego cobro mensual hasta cancelar.",
        initial_cycles: { count: s.diasPrueba, has_initial_charge: false, amount: 0, interval_unit_time: DIARIO },
      },
    },
    {
      env: "CULQI_PLAN_MENSUAL_ID",
      body: {
        ...base,
        name: "Evolv mensual",
        short_name: "evolv-mensual",
        description: "Acceso completo a Evolv con cobro mensual hasta cancelar.",
        initial_cycles: { count: 0, has_initial_charge: false, amount: 0, interval_unit_time: MENSUAL },
      },
    },
  ];
}

async function main(argv) {
  const dry = argv.includes("--dry-run");
  const live = argv.includes("--live");
  const planes = planesSuscripcion();
  if (dry) {
    for (const p of planes) console.log(p.env + "\n" + JSON.stringify(p.body, null, 2));
    return 0;
  }
  const key = process.env.CULQI_SECRET_KEY || "";
  if (!/^sk_(test|live)_/.test(key)) {
    console.error("Falta CULQI_SECRET_KEY (sk_test_… o sk_live_…) en el entorno.");
    return 1;
  }
  if (key.startsWith("sk_live_") && !live) {
    console.error("Es una llave de producción: agrega --live para crear los planes reales.");
    return 1;
  }
  for (const p of planes) {
    const r = await fetch("https://api.culqi.com/v2/recurrent/plans/create", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify(p.body),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.id) {
      console.error(p.env + ": Culqi respondió " + r.status + " " + (data.merchant_message || data.user_message || ""));
      return 1;
    }
    console.log(p.env + "=" + data.id);
  }
  console.log("Carga estos valores en Vercel (Settings → Environment Variables) y redespliega.");
  return 0;
}

if (import.meta.url === new URL(process.argv[1], "file://").href) {
  main(process.argv.slice(2)).then((code) => process.exit(code));
}
