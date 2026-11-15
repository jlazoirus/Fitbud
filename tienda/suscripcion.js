// REQ-354: textos de la suscripción mensual en /terminos, /devoluciones y /planes.
// - Sin la bandera del servidor (tienda.suscripcion en /api/config), o si /api/config
//   falla, las páginas quedan como están: lo marcado con data-con-suscripcion sigue
//   oculto (atributo hidden en el HTML) y se ve lo marcado con data-sin-suscripcion.
// - Con la bandera, se invierte, se completan los montos y plazos desde SUSCRIPCION
//   (tienda/planes.js) y la vigencia pasa a COMERCIO.vigenciaLegalSuscripcion.
import { SUSCRIPCION, formatoPrecio } from "./planes.js";
import { COMERCIO } from "./comercio.js";

export function valoresSuscripcion() {
  return {
    monto: formatoPrecio(SUSCRIPCION.montoCentimos, SUSCRIPCION.moneda),
    validacion: formatoPrecio(SUSCRIPCION.validacionCentimos, SUSCRIPCION.moneda),
    diasPrueba: String(SUSCRIPCION.diasPrueba),
    diaPrimerCobro: String(SUSCRIPCION.diasPrueba + 1),
    diasAvisoCobro: String(SUSCRIPCION.diasAvisoCobro),
    diasAvisoPrecio: String(SUSCRIPCION.diasAvisoPrecio),
    horasDevolucion: String(SUSCRIPCION.horasDevolucionPrimerCobro),
  };
}

export function suscripcionActiva(cfg) {
  return !!(cfg && cfg.tienda && typeof cfg.tienda === "object" && cfg.tienda.suscripcion === true);
}

// Devuelve true si mostró la suscripción.
export function aplicarSuscripcion(cfg, root = document) {
  const activa = suscripcionActiva(cfg);
  root.querySelectorAll("[data-con-suscripcion]").forEach((n) => { n.hidden = !activa; });
  root.querySelectorAll("[data-sin-suscripcion]").forEach((n) => { n.hidden = activa; });
  if (!activa) return false;
  const valores = valoresSuscripcion();
  root.querySelectorAll("[data-suscripcion]").forEach((n) => {
    const v = valores[n.dataset.suscripcion];
    if (v != null) n.textContent = v;
  });
  if (COMERCIO.vigenciaLegalSuscripcion) {
    root.querySelectorAll('[data-comercio="vigenciaLegal"]').forEach((n) => { n.textContent = COMERCIO.vigenciaLegalSuscripcion; });
  }
  return true;
}
