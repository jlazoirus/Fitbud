// REQ-370: origen de campaña de la web pública (portada, /planes y /pago).
// Lee `source` y `utm_source|medium|campaign|content` de la URL y guarda el primer
// contacto durante 30 días en localStorage, para que /pago lo envíe con la compra.
//
// - Solo letras, números, `-` y `_`, hasta 120 caracteres. Lo demás se descarta.
// - Gana el primer contacto vigente; vencidos los 30 días, un origen nuevo lo reemplaza.
// - Nunca guarda correo, nombre, teléfono ni salud: solo las cinco claves de abajo.
// - Viene del navegador: nunca influye en precio, plan ni acceso, y el servidor lo
//   revalida con limpiarCampana (api/_tienda/culqi-charge.js). Sin almacenamiento o
//   con cualquier error, la página y el pago funcionan igual.

export const CLAVES = Object.freeze(["source", "utm_source", "utm_medium", "utm_campaign", "utm_content"]);
export const VIGENCIA_MS = 30 * 86400000;
export const STORAGE_KEY = "evolv_origen";
const VALOR_RE = /^[A-Za-z0-9_-]{1,120}$/;

export function limpiarValor(value) {
  return typeof value === "string" && VALOR_RE.test(value) ? value : "";
}

// Deja solo las claves conocidas con valores válidos; sin ninguna, null.
export function limpiarCampana(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return null;
  const out = {};
  for (const key of CLAVES) {
    const value = limpiarValor(obj[key]);
    if (value) out[key] = value;
  }
  return Object.keys(out).length ? out : null;
}

export function campanaDeUrl(search) {
  let params;
  try { params = new URLSearchParams(search || ""); } catch (_) { return null; }
  const raw = {};
  for (const key of CLAVES) if (params.has(key)) raw[key] = params.get(key);
  return limpiarCampana(raw);
}

// Registro guardado { campana, at } válido y vigente a la fecha `ahora`, o null.
export function registroVigente(registro, ahora) {
  if (!registro || typeof registro !== "object") return null;
  const campana = limpiarCampana(registro.campana);
  const at = registro.at;
  if (!campana || !Number.isFinite(at) || at > ahora || ahora - at >= VIGENCIA_MS) return null;
  return { campana, at };
}

// Primer contacto: el guardado vigente gana; si no hay, el de la URL empieza uno nuevo.
export function elegirOrigen(guardado, nuevo, ahora) {
  const vigente = registroVigente(guardado, ahora);
  if (vigente) return vigente;
  const campana = limpiarCampana(nuevo);
  return campana ? { campana, at: ahora } : null;
}

let memoria = null; // respaldo de la página actual si localStorage no está disponible

function leer() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch (_) { return null; }
}

export function capturar(search, ahora = Date.now()) {
  const guardado = registroVigente(leer(), ahora) || registroVigente(memoria, ahora);
  const elegido = elegirOrigen(guardado, campanaDeUrl(search), ahora);
  memoria = elegido;
  try {
    if (!elegido) localStorage.removeItem(STORAGE_KEY);
    else if (elegido !== guardado) localStorage.setItem(STORAGE_KEY, JSON.stringify(elegido));
  } catch (_) { /* sin almacenamiento: queda el origen de esta página */ }
  return elegido ? elegido.campana : null;
}

// Lo que /pago envía como `campana`, o null si no hay origen vigente.
export function campanaActual(ahora = Date.now()) {
  const registro = registroVigente(leer(), ahora) || registroVigente(memoria, ahora);
  return registro ? registro.campana : null;
}

if (typeof window !== "undefined" && typeof location !== "undefined") {
  try { capturar(location.search); } catch (_) { /* el origen nunca rompe la página */ }
}
