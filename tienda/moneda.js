// REQ-381: moneda de la tienda en el navegador (portada, /planes y /pago).
// - /api/config dice si hay dólares (`tienda.usd`, bandera TIENDA_USD_ENABLED del
//   servidor) y qué moneda sugiere el país del visitante (`tienda.monedaSugerida`).
// - Sin dólares, o si /api/config falla: soles, sin selector, como siempre.
// - Con dólares gana, en orden: ?moneda= de la URL (viene de /planes), la elección
//   guardada con el selector «Soles / Dólares» (localStorage, try/catch) y la sugerida.
// - Solo decide qué se muestra y qué moneda se pide: el monto lo pone el servidor.
import { MONEDA, monedaValida } from "./planes.js";

export const STORAGE_KEY = "evolv_moneda";
const CONFIG_TIMEOUT_MS = 2500;

export function leerGuardada() {
  try { return monedaValida(localStorage.getItem(STORAGE_KEY)); } catch (_) { return ""; }
}

export function guardarMoneda(moneda) {
  try { if (monedaValida(moneda)) localStorage.setItem(STORAGE_KEY, moneda); } catch (_) { /* sin almacenamiento: vale para esta página */ }
}

export function resolverMoneda({ usd, sugerida, url, guardada }) {
  if (!usd) return MONEDA;
  return monedaValida(url) || monedaValida(guardada) || monedaValida(sugerida) || MONEDA;
}

let configPromesa = null;
// La configuración pública completa (la misma que usa /pago para Culqi). Nunca rechaza.
export function cargarConfig() {
  if (!configPromesa) {
    const fallo = {};
    configPromesa = Promise.race([
      fetch("/api/config", { cache: "no-store" }).then((r) => r.json()).catch(() => fallo),
      new Promise((resolve) => setTimeout(() => resolve(fallo), CONFIG_TIMEOUT_MS)),
    ]).then((j) => {
      // Sin respuesta (red o demora): soles ahora, y la próxima consulta (p. ej. al pagar) reintenta.
      if (j === fallo) { configPromesa = null; return {}; }
      return j && typeof j === "object" ? j : {};
    });
  }
  return configPromesa;
}

// { usd, moneda } para esta página.
export async function monedaTienda(search = location.search) {
  const cfg = await cargarConfig();
  const t = cfg.tienda && typeof cfg.tienda === "object" ? cfg.tienda : {};
  const usd = t.usd === true;
  let url = "";
  try { url = new URLSearchParams(search || "").get("moneda") || ""; } catch (_) { url = ""; }
  return { usd, moneda: resolverMoneda({ usd, sugerida: t.monedaSugerida, url: url.toUpperCase(), guardada: leerGuardada() }) };
}

// Selector «Soles / Dólares» (radios nativos: teclado y lector de pantalla sin código extra).
export function selectorHtml(moneda, id = "moneda") {
  const opcion = (valor, texto) => `<label class="moneda-op"><input type="radio" name="${id}" value="${valor}"${moneda === valor ? " checked" : ""}><span>${texto}</span></label>`;
  return `<fieldset class="moneda" id="${id}"><legend>Moneda</legend>${opcion("PEN", "Soles")}${opcion("USD", "Dólares")}</fieldset>`;
}

// Monta el selector en `contenedor` y llama a `alCambiar(moneda)` con cada elección (que se guarda).
export function montarSelector(contenedor, moneda, alCambiar, id) {
  if (!contenedor) return;
  contenedor.innerHTML = selectorHtml(moneda, id);
  contenedor.hidden = false;
  contenedor.addEventListener("change", (event) => {
    const valor = monedaValida(event.target && event.target.value);
    if (!valor) return;
    guardarMoneda(valor);
    // Si la URL trae ?moneda=, se actualiza: al recargar no vuelve la moneda anterior.
    try {
      const u = new URL(location.href);
      if (u.searchParams.has("moneda")) { u.searchParams.set("moneda", valor); history.replaceState(history.state, "", u); }
    } catch (_) { /* sin History API: la elección guardada basta */ }
    alCambiar(valor);
  });
}
