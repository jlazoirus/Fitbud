#!/usr/bin/env node
// REQ-342: genera la imagen de cada plan de la tienda (assets/planes/*.webp).
// Culqi pide que cada producto tenga una imagen representativa de lo que se
// vende. Cada imagen muestra el servicio (comidas con gramos y macros, entreno
// guiado, check-in, resumen de ciclo) con las mismas tarjetas "Ejemplo" de la
// portada, más la duración del plan.
//
// Uso: node scripts/build-plan-images.mjs   (necesita red para Google Fonts)
// Escribe un PNG temporal por plan y lo convierte a WebP con python3 + Pillow.
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { PLANES_TIENDA } from "../tienda/planes.js";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const W = 1200;
const H = 750;

const ICON = {
  bowl: '<path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M9 7.5c0-1.6 1.2-2.4 1.2-4M13.5 7.5c0-1.6 1.2-2.4 1.2-4"/>',
  dumbbell: '<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
  chart: '<path d="M4 4v16h16"/><path d="M7.5 15l3.5-4 3 2.5 5-6.5"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  camera: '<rect x="3" y="7" width="18" height="13" rx="3"/><circle cx="12" cy="13.5" r="3.5"/><path d="M9 7l1.5-3h3L15 7"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  pulse: '<path d="M3 12h4l2.5-6 4 12 2.5-6H21"/>',
};
const icon = (name, size = 30, color = "currentColor", width = 2.4) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name]}</svg>`;
const tile = (name, tone = "lime") => `<span class="tile ${tone}">${icon(name, 34)}</span>`;
const tag = '<span class="tag">Ejemplo</span>';

// Escena de cada plan: qué parte del servicio muestra la imagen.
const SCENES = {
  monthly: () => `
    <div class="card big">
      <div class="head">${tile("bowl")}<div><div class="t">Avena con plátano</div><div class="m">Desayuno · 420 kcal</div></div>${tag}</div>
      <div class="ings">
        <div><span>Avena en hojuelas</span><b>60 g</b></div>
        <div><span>Leche descremada</span><b>250 ml</b></div>
        <div><span>Plátano</span><b>1 unidad</b></div>
        <div><span>Proteína de suero</span><b>20 g</b></div>
      </div>
      <div class="macros"><span><b>28 g</b> proteína</span><span><b>59 g</b> carbos</span><span><b>8 g</b> grasa</span></div>
    </div>
    <div class="card row">${tile("dumbbell", "blue")}<div><div class="t">Sentadilla goblet</div><div class="m">3 × 12 · descanso 90 s</div></div></div>`,
  quarterly: () => `
    <div class="card big">
      <div class="head">${tile("dumbbell", "blue")}<div><div class="t">Press de banca</div><div class="m">3 × 8–10 · esfuerzo 7 de 10</div></div>${tag}</div>
      <div class="sets"><span class="on">${icon("check", 26, "#101010", 3.2)}S1</span><span class="on">${icon("check", 26, "#101010", 3.2)}S2</span><span>S3</span></div>
      <div class="rest"><span>Descanso</span><b>1:24</b><span class="of">de 2:00</span></div>
      <div class="bar"><i style="width:70%"></i></div>
    </div>
    <div class="card">
      <div class="head">${tile("pulse")}<div><div class="t">Check-in · semana 3</div><div class="m">Cumpliste 5 de 7 días</div></div></div>
      <div class="change">−100 kcal en días de descanso</div>
    </div>`,
  semiannual: () => `
    <div class="card big">
      <div class="head">${tile("chart")}<div><div class="t">Resumen del ciclo</div><div class="m">Ciclo de 10 semanas</div></div>${tag}</div>
      <table class="recap"><thead><tr><th>Semana</th><th>Peso</th><th>Comidas</th></tr></thead>
        <tbody><tr><td>1</td><td>81,2 kg</td><td>71 %</td></tr><tr><td>5</td><td>79,6 kg</td><td>83 %</td></tr><tr class="hi"><td>10</td><td>78,1 kg</td><td>88 %</td></tr></tbody></table>
    </div>
    <div class="card">
      <div class="head">${tile("camera")}<div><div class="t">Fotos de progreso</div><div class="m">${icon("lock", 22)} Solo las ves tú</div></div></div>
      <div class="photos"><span>Semana 1</span><span>Semana 5</span><span>Semana 10</span></div>
    </div>`,
};

function page(plan) {
  const [num, unit] = plan.periodo.split(" ");
  const scene = SCENES[plan.id];
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@700;800&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}
body{margin:0;width:${W}px;height:${H}px;overflow:hidden;position:relative;background:#101010;color:#f2f2ee;font-family:Manrope,sans-serif;-webkit-font-smoothing:antialiased;font-variant-numeric:tabular-nums}
.glow{position:absolute;inset:0;background:radial-gradient(60% 75% at 82% 22%,rgba(214,255,58,.14),rgba(214,255,58,0) 70%)}
.left{position:absolute;left:68px;top:64px;bottom:64px;width:450px;display:flex;flex-direction:column}
.brand{display:flex;align-items:center;gap:14px;font-family:Unbounded;font-weight:800;font-size:34px;letter-spacing:-.02em}
.brand .v{color:#d6ff3a}
.dur{margin-top:auto;font-family:Unbounded;font-weight:800;line-height:.9}
.dur .n{font-size:${num.length > 1 ? 196 : 228}px;letter-spacing:-.05em;display:block}
.dur .u{font-size:50px;color:#d6ff3a;letter-spacing:.04em;text-transform:uppercase;display:block;margin-top:14px}
.name{font-size:34px;font-weight:800;margin-top:22px}
.pills{display:flex;gap:8px;margin-top:22px}
.pills span{display:inline-flex;align-items:center;gap:7px;font-size:20px;font-weight:700;color:#d8d8d0;border:2px solid rgba(255,255,255,.14);border-radius:999px;padding:7px 14px 7px 10px;white-space:nowrap}
.pills svg{color:#d6ff3a}
.right{position:absolute;right:60px;top:58px;bottom:58px;width:610px;display:flex;flex-direction:column;justify-content:center;gap:22px}
.card{background:#1a1a1a;border:2px solid rgba(255,255,255,.1);border-radius:34px;padding:30px 32px;box-shadow:0 24px 60px rgba(0,0,0,.45)}
.card.big{padding:32px}
.card.row,.head{display:flex;align-items:center;gap:20px}
.head > div{flex:1;min-width:0}
.tile{flex:0 0 auto;width:68px;height:68px;border-radius:20px;display:grid;place-items:center}
.tile.lime{background:rgba(214,255,58,.14);color:#d6ff3a}
.tile.blue{background:rgba(143,180,255,.16);color:#8fb4ff}
.t{font-size:34px;font-weight:800;line-height:1.15;letter-spacing:-.01em}
.m{font-size:24px;font-weight:600;color:#a8a8a0;margin-top:4px;display:flex;align-items:center;gap:8px}
.tag{align-self:flex-start;font-size:18px;font-weight:700;color:#c8c8c0;border:2px solid rgba(255,255,255,.18);border-radius:999px;padding:4px 14px}
.ings{margin-top:22px;display:grid;gap:12px}
.ings div{display:flex;justify-content:space-between;font-size:26px;font-weight:600;color:#d8d8d0;padding-bottom:10px;border-bottom:2px solid rgba(255,255,255,.07)}
.ings b{color:#f2f2ee}
.macros{display:flex;gap:12px;margin-top:20px}
.macros span{flex:1;text-align:center;font-size:22px;font-weight:600;color:#a8a8a0;background:#232323;border-radius:16px;padding:12px 6px}
.macros b{display:block;font-size:30px;color:#d6ff3a;font-weight:800}
.sets{display:flex;gap:14px;margin-top:26px}
.sets span{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;height:74px;border-radius:20px;font-size:28px;font-weight:800;background:#262626;color:#a8a8a0}
.sets span.on{background:#d6ff3a;color:#101010}
.rest{display:flex;align-items:baseline;gap:12px;margin-top:24px;font-size:26px;font-weight:600;color:#a8a8a0}
.rest b{font-family:Unbounded;font-size:44px;color:#f2f2ee}
.bar{height:14px;border-radius:999px;background:#2a2a2a;margin-top:14px;overflow:hidden}
.bar i{display:block;height:100%;background:#d6ff3a;border-radius:999px}
.change{display:inline-block;margin-top:20px;font-size:26px;font-weight:800;color:#101010;background:#d6ff3a;border-radius:999px;padding:10px 22px}
.recap{width:100%;border-collapse:collapse;margin-top:20px;font-size:28px}
.recap th{font-size:21px;font-weight:700;color:#a8a8a0;text-align:left;padding:0 0 10px}
.recap td{padding:12px 0;border-top:2px solid rgba(255,255,255,.07);font-weight:700}
.recap tr.hi td{color:#d6ff3a}
.photos{display:flex;gap:14px;margin-top:20px}
.photos span{flex:1;height:96px;border-radius:18px;background:linear-gradient(160deg,#2c2c2c,#202020);display:flex;align-items:flex-end;justify-content:center;padding-bottom:10px;font-size:20px;font-weight:700;color:#a8a8a0}
</style></head><body>
<div class="glow"></div>
<div class="left">
  <div class="brand"><svg width="54" height="54" viewBox="0 0 512 512" aria-hidden="true"><rect width="512" height="512" rx="112" fill="#1e1e1e"/><g transform="translate(0 35)" fill="none" stroke="#d6ff3a" stroke-width="46" stroke-linecap="round" stroke-linejoin="round"><path d="M146 352 L256 262 L366 352" stroke-opacity=".35"/><path d="M146 266 L256 176 L366 266" stroke-opacity=".65"/><path d="M146 180 L256 90 L366 180"/></g></svg><span>evol<span class="v">v</span></span></div>
  <div class="dur"><span class="n">${num}</span><span class="u">${unit}</span></div>
  <div class="name">${plan.nombre}</div>
  <div class="pills"><span>${icon("bowl", 24)}Comidas</span><span>${icon("dumbbell", 24)}Entreno</span><span>${icon("chart", 24)}Progreso</span></div>
</div>
<div class="right">${scene()}</div>
</body></html>`;
}

const missing = PLANES_TIENDA.filter((p) => !SCENES[p.id]).map((p) => p.id);
if (missing.length) throw new Error("Falta la escena de imagen para: " + missing.join(", "));

const launch = {};
for (const path of [process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, chromium.executablePath(), "/opt/pw-browsers/chromium"]) {
  if (path && existsSync(path)) { launch.executablePath = path; break; }
}
const browser = await chromium.launch(launch);
const tmp = mkdtempSync(join(tmpdir(), "plan-img-"));
try {
  const tab = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  for (const plan of PLANES_TIENDA) {
    if (!plan.imagen.endsWith(".webp")) throw new Error(plan.id + ": la imagen debe ser .webp (" + plan.imagen + ")");
    await tab.setContent(page(plan), { waitUntil: "networkidle" });
    await tab.evaluate(() => document.fonts.ready);
    const png = join(tmp, plan.id + ".png");
    await tab.screenshot({ path: png });
    const out = join(ROOT, plan.imagen.slice(1));
    execFileSync("python3", ["-I", "-c", "import sys;from PIL import Image;Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2],'WEBP',quality=84,method=6)", png, out]);
    console.log("✓ " + plan.imagen);
  }
} finally {
  await browser.close();
  rmSync(tmp, { recursive: true, force: true });
}
