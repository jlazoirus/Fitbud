// Catálogo de la tienda web (pago con Culqi, en soles y, con TIENDA_USD_ENABLED,
// en dólares: REQ-381).
// Fuente de verdad del precio: /api/culqi-charge cobra el monto de aquí y nunca
// el que manda el navegador. Los ids existen en subscription_plans (FK de
// user_entitlements). La app y la beta no leen este archivo: siguen con el
// catálogo de /api/catalog.
//
// REQ-381: cada plan tiene un precio propio por moneda (no es una conversión).
// `montoCentimos` sigue siendo el precio en soles para quien aún lo lea.

// Moneda por defecto (soles). Se conserva el nombre: la leen páginas y pruebas.
export const MONEDA = "PEN";
export const MONEDAS = Object.freeze(["PEN", "USD"]);

export const PLANES_TIENDA = [
  {
    id: "monthly",
    nombre: "Plan mensual",
    montoCentimos: 2990,
    precios: { PEN: 2990, USD: 899 },
    duracionDias: 30,
    periodo: "1 mes",
    imagen: "/assets/planes/mensual.webp",
    imagenAlt: "Plan mensual de Evolv: ejemplo de desayuno con ingredientes en gramos y macros, y de un ejercicio guiado",
    resumen: "Para empezar y probar el método con tu propio ritmo.",
    descripcion: "30 días de acceso completo a Evolv: plan de comidas personalizado según tus metas, rutinas de entrenamiento guiadas y seguimiento de tu progreso. Pago único, sin renovación automática.",
    incluye: [
      "Plan de nutrición personalizado",
      "Rutinas de entrenamiento guiadas",
      "Seguimiento de peso y progreso",
      "Adaptaciones cuando el día se tuerce",
      "Rachas, hitos y recordatorios opcionales",
    ],
    destacado: null,
  },
  {
    id: "quarterly",
    nombre: "Plan trimestral",
    montoCentimos: 7990,
    precios: { PEN: 7990, USD: 2199 },
    duracionDias: 90,
    periodo: "3 meses",
    imagen: "/assets/planes/trimestral.webp",
    imagenAlt: "Plan trimestral de Evolv: ejemplo de entreno guiado serie por serie con descanso y de un check-in semanal",
    resumen: "Un ciclo completo de 10 semanas con margen para cerrarlo.",
    descripcion: "90 días de acceso completo a Evolv: alcanza para un ciclo de 10 semanas de nutrición y entrenamiento, con check-ins semanales y el resumen al cerrar el ciclo. Pago único, sin renovación automática.",
    incluye: [
      "Todo lo del plan mensual",
      "Un ciclo completo de 10 semanas",
      "Check-in semanal con ajuste de calorías o intensidad",
      "Resumen de tu ciclo al terminar",
      "Ahorro del 11 % frente a 3 meses sueltos",
    ],
    destacado: null,
  },
  {
    id: "semiannual",
    nombre: "Plan semestral",
    montoCentimos: 14990,
    precios: { PEN: 14990, USD: 3999 },
    duracionDias: 180,
    periodo: "6 meses",
    imagen: "/assets/planes/semestral.webp",
    imagenAlt: "Plan semestral de Evolv: ejemplo del resumen de un ciclo de 10 semanas y de las fotos de progreso privadas",
    resumen: "Dos ciclos completos para consolidar el hábito.",
    descripcion: "180 días de acceso completo a Evolv: dos ciclos de nutrición y entrenamiento, con fotos de progreso privadas y el resumen detallado de cada ciclo. Pago único, sin renovación automática.",
    incluye: [
      "Todo lo del plan trimestral",
      "Dos ciclos completos de 10 semanas",
      "Fotos de progreso privadas",
      "Prioridad en nuevas funciones",
      "Ahorro del 16 % frente a 6 meses sueltos",
    ],
    destacado: "Mejor valor",
  },
];

export function planPorId(id) {
  return PLANES_TIENDA.find((plan) => plan.id === id) || null;
}

export function formatoSoles(centimos) {
  return "S/ " + (centimos / 100).toFixed(2);
}

// "PEN" | "USD" si es una moneda del catálogo; si no, "".
export function monedaValida(moneda) {
  return MONEDAS.includes(moneda) ? moneda : "";
}

// Monedas que se pueden cobrar: dólares solo con la bandera del servidor encendida.
export function monedasPermitidas(usdHabilitado) {
  return usdHabilitado ? MONEDAS.slice() : [MONEDA];
}

// Precio del plan en esa moneda, en céntimos; null si el plan no se vende en ella.
export function montoPlan(plan, moneda = MONEDA) {
  if (!plan) return null;
  const precios = plan.precios || { [MONEDA]: plan.montoCentimos };
  const monto = precios[monedaValida(moneda)];
  return Number.isInteger(monto) ? monto : null;
}

// "S/ 29.90" o "USD 8.99".
export function formatoPrecio(centimos, moneda = MONEDA) {
  if (moneda === "USD") return "USD " + (centimos / 100).toFixed(2);
  return formatoSoles(centimos);
}

// Lo que incluye el plan, con el ahorro calculado con los precios de esa moneda
// (en soles coincide con el texto fijo de `incluye`).
export function incluyePlan(plan, moneda = MONEDA) {
  const mensual = montoPlan(planPorId("monthly"), moneda);
  const monto = montoPlan(plan, moneda);
  return plan.incluye.map((item) => {
    const m = /^Ahorro del \d+ % frente a (\d+) meses sueltos$/.exec(item);
    if (!m || !mensual || !monto) return item;
    const sueltos = mensual * Number(m[1]);
    return "Ahorro del " + Math.round((1 - monto / sueltos) * 100) + " % frente a " + m[1] + " meses sueltos";
  });
}

// REQ-381: bandera del servidor (TIENDA_USD_ENABLED). Solo "1" o "true" la encienden.
export function usdHabilitado(valor) {
  const v = String(valor == null ? "" : valor).trim().toLowerCase();
  return v === "1" || v === "true";
}

// Moneda sugerida por el país del visitante (cabecera x-vercel-ip-country):
// Perú o país desconocido → soles; cualquier otro país → dólares.
export function monedaPorPais(pais) {
  const p = String(pais == null ? "" : pais).trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(p) || p === "PE" || p === "XX") return "PEN";
  return "USD";
}
