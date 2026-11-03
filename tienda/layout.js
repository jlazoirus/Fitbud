// Cabecera, pie y datos del comercio comunes a las páginas de la tienda.
// Cada página pone <header id="t-header"></header>, <footer id="t-footer"></footer>
// y marca con data-comercio="campo" los textos que salen de tienda/comercio.js.
import { COMERCIO } from "./comercio.js";

const LOGO = `<svg width="30" height="30" viewBox="0 0 512 512" aria-hidden="true"><rect width="512" height="512" rx="112" fill="#1e1e1e"/><g transform="translate(0 35)" fill="none" stroke="#d6ff3a" stroke-width="46" stroke-linecap="round" stroke-linejoin="round"><path d="M146 352 L256 262 L366 352" stroke-opacity=".35"/><path d="M146 266 L256 176 L366 266" stroke-opacity=".65"/><path d="M146 180 L256 90 L366 180"/></g></svg>`;

// Ícono del aviso del Libro de Reclamaciones (libro abierto), visible en todas las páginas.
export const LIBRO_ICONO = `<svg width="34" height="28" viewBox="0 0 34 28" aria-hidden="true"><path d="M2 4.5C6.5 2.5 11.5 2.5 16 5v20c-4.5-2.5-9.5-2.5-14-.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M32 4.5C27.5 2.5 22.5 2.5 18 5v20c4.5-2.5 9.5-2.5 14-.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M5 9.5c2.8-.9 5.6-.7 8 .5M5 14c2.8-.9 5.6-.7 8 .5M21 10c2.4-1.2 5.2-1.4 8-.5M21 14.5c2.4-1.2 5.2-1.4 8-.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;

const NAV = [
  ["/planes", "Planes"],
  ["/contacto", "Contacto"],
];

const LEGALES = [
  ["/terminos", "Términos y condiciones"],
  ["/devoluciones", "Cambios y devoluciones"],
  ["/privacidad", "Política de privacidad"],
  ["/libro-de-reclamaciones", "Libro de Reclamaciones"],
];

function esc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function current(href) {
  const path = location.pathname.replace(/\.html$/, "").replace(/\/$/, "") || "/";
  return path === href ? ' aria-current="page"' : "";
}

function headerHtml() {
  return `<div class="wrap t-top">
    <a class="t-brand" href="/" aria-label="Evolv, ir al inicio">${LOGO}<span>evol<span class="v">v</span></span></a>
    <nav class="t-nav" aria-label="Tienda">${NAV.map(([href, label]) => `<a href="${href}"${current(href)}>${label}</a>`).join("")}</nav>
  </div>`;
}

function footerHtml() {
  const redes = (COMERCIO.redes || []).map((r) => `<li><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.nombre)}</a></li>`).join("");
  return `<div class="wrap">
    <div class="t-foot-grid">
      <div>
        <h2>${esc(COMERCIO.marca)}</h2>
        <p>${esc(COMERCIO.razonSocial)} · RUC ${esc(COMERCIO.ruc)}</p>
        <p>${esc(COMERCIO.direccion)}</p>
        <p><a href="mailto:${esc(COMERCIO.correo)}">${esc(COMERCIO.correo)}</a> · <a href="tel:${esc(String(COMERCIO.telefono).replace(/[^\d+]/g, ""))}">${esc(COMERCIO.telefono)}</a></p>
        <a class="libro-link" href="/libro-de-reclamaciones">${LIBRO_ICONO}<span>Libro de Reclamaciones</span></a>
      </div>
      <div>
        <h2>Tienda</h2>
        <ul>
          <li><a href="/planes">Planes y precios</a></li>
          <li><a href="/contacto">Contacto</a></li>
          <li><a href="${esc(COMERCIO.whatsappUrl)}" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
          ${redes}
        </ul>
      </div>
      <div>
        <h2>Legal</h2>
        <ul>${LEGALES.map(([href, label]) => `<li><a href="${href}">${label}</a></li>`).join("")}</ul>
      </div>
    </div>
    <p class="t-copy">© ${new Date().getFullYear()} ${esc(COMERCIO.marca)}. Pagos procesados de forma segura por Culqi.</p>
  </div>`;
}

export function fillComercio(root) {
  (root || document).querySelectorAll("[data-comercio]").forEach((node) => {
    const value = COMERCIO[node.dataset.comercio];
    if (value == null) return;
    if (node.tagName === "A" && node.dataset.comercio === "correo") node.href = "mailto:" + value;
    if (node.tagName === "A" && node.dataset.comercio === "telefono") node.href = "tel:" + String(value).replace(/[^\d+]/g, "");
    if (node.tagName === "A" && node.dataset.comercio === "whatsappUrl") return;
    node.textContent = value;
  });
}

export function mountLayout() {
  const header = document.getElementById("t-header");
  const footer = document.getElementById("t-footer");
  if (header) header.innerHTML = headerHtml();
  if (footer) {
    footer.classList.add("t-foot");
    footer.innerHTML = footerHtml();
  }
  fillComercio();
}

export { esc };
