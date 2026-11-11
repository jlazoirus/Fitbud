// Portada pública (REQ-352). Pinta los planes desde tienda/planes.js (el mismo
// catálogo que cobra /api/culqi-charge), los datos del comercio, la demo del día
// y la escalera del recorrido. No carga la app ni Supabase.
import { PLANES_TIENDA, MONEDA, montoPlan, incluyePlan } from "/tienda/planes.js";
import { COMERCIO } from "/tienda/comercio.js";
import { monedaTienda } from "/tienda/moneda.js";

const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const TICK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

// REQ-381: `moneda` "USD" solo llega con dólares habilitados en el servidor; entonces
// el enlace a /pago lleva la moneda (`conMoneda`).
export function planesHtml(planes = PLANES_TIENDA, moneda = MONEDA, conMoneda = false) {
  const simbolo = moneda === "USD" ? "USD " : "S/";
  return planes.map((p) => {
    const isHi = !!p.destacado;
    const items = incluyePlan(p, moneda).map((f) => `<div class="l-plan-item">${TICK}<span>${esc(f)}</span></div>`).join("");
    return `<div class="l-plan l-plan-store${isHi ? " highlight" : ""}">
        <img class="l-plan-img" src="${esc(p.imagen)}" alt="${esc(p.imagenAlt)}" width="1200" height="750" loading="lazy">
        ${isHi ? `<div class="l-plan-badge">${esc(p.destacado)}</div>` : ""}
        <div class="l-plan-name">${esc(p.nombre)}</div>
        <div class="l-plan-price"><span class="l-plan-cur">${simbolo}</span>${(montoPlan(p, moneda) / 100).toFixed(2)} <span class="l-plan-period">/ ${esc(p.periodo)}</span></div>
        <div class="l-plan-desc">${esc(p.descripcion)}</div>
        <div class="l-plan-items">${items}</div>
        <a class="l-btn l-btn-lg ${isHi ? "l-btn-ink" : "l-btn-lime"}" href="/pago?plan=${encodeURIComponent(p.id)}${conMoneda ? "&moneda=" + moneda : ""}">Comprar</a>
      </div>`;
  }).join("");
}

const plans = document.querySelector(".l-plans");
if (plans) plans.innerHTML = planesHtml();
// REQ-381: con dólares habilitados, quien llega desde fuera de Perú ve sus precios en
// dólares (el selector vive en /planes y /pago). Sin dólares o sin red, todo sigue en soles.
monedaTienda().then(({ usd, moneda }) => {
  if (!usd) return;
  if (plans) plans.innerHTML = planesHtml(PLANES_TIENDA, moneda, true);
  if (moneda !== "USD") return;
  document.querySelectorAll('[data-lmode="heroNote"], [data-lmode="sub"], .l-cta-note').forEach((n) => {
    for (const t of n.childNodes) if (t.nodeType === 3) t.textContent = t.textContent.replace("Pago único en soles", "Pago único en dólares");
  });
}).catch(() => {});
document.querySelectorAll("[data-lcomercio]").forEach((n) => { n.textContent = `${COMERCIO.razonSocial} · RUC ${COMERCIO.ruc}`; });

// Demo del día: tres imprevistos reales de la app sobre datos de ejemplo.
const DEMO = {
  base: { lunch: ["Arroz con lentejas y huevo", "610 kcal · 34 g de proteína"], train: ["Fuerza · Tren superior", "5 ejercicios · 55 min"], note: "" },
  fuera: { lunch: ["Pollo a la brasa sin piel + ensalada", "¼ de pollo · 590 kcal · 41 g de proteína"], note: "Comes fuera y <b>el día sigue dentro de tus metas</b>." },
  corto: { train: ["Circuito exprés", "4 ejercicios · 20 min"], note: "Veinte minutos <b>también cuentan</b> para tu semana." },
  casa: { train: ["En casa, sin equipo", "6 ejercicios · 35 min"], note: "Mismos grupos musculares, <b>sin pisar el gimnasio</b>." },
};
window.landingDemo = function landingDemo(kind, btn) {
  const box = document.querySelector(".l-demo");
  if (!box) return;
  const wasOn = btn && btn.getAttribute("aria-pressed") === "true";
  box.querySelectorAll(".l-chip").forEach((c) => c.setAttribute("aria-pressed", "false"));
  const key = wasOn ? "base" : kind;
  if (!wasOn && btn) btn.setAttribute("aria-pressed", "true");
  const d = Object.assign({}, DEMO.base, DEMO[key]);
  const paint = (sel, [name, meta]) => {
    const row = box.querySelector(sel);
    if (!row || row.querySelector(".l-demo-name").textContent === name) return;
    row.classList.add("swap");
    setTimeout(() => { row.querySelector(".l-demo-name").textContent = name; row.querySelector(".l-demo-meta").textContent = meta; row.classList.remove("swap"); }, 140);
  };
  paint('[data-row="lunch"]', d.lunch);
  paint('[data-row="train"]', d.train);
  box.querySelector(".l-demo-note").innerHTML = d.note;
};

// Escalera: el peldaño se enciende con el paso visible; tocar una etiqueta lleva al paso.
const STEPS = [...document.querySelectorAll(".l-step")];
window.landingGoStep = function landingGoStep(i) {
  const el = STEPS[i];
  if (!el) return;
  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
};
const rail = document.querySelector(".l-stair-rail");
if (rail && "IntersectionObserver" in window) {
  const setLit = (n) => {
    rail.dataset.lit = String(n);
    rail.querySelectorAll(".tr").forEach((p, i) => p.classList.toggle("lit", i < n));
    rail.querySelectorAll(".l-stair-label").forEach((b, i) => { if (i === n - 1) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); });
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) setLit(Number(e.target.dataset.step) + 1); });
  }, { rootMargin: "-45% 0px -50% 0px" });
  STEPS.forEach((el) => io.observe(el));
}
