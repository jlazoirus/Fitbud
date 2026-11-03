// Catálogo de la tienda web (pago con Culqi, en soles).
// Fuente de verdad del precio: /api/culqi-charge cobra el monto de aquí y nunca
// el que manda el navegador. Los ids existen en subscription_plans (FK de
// user_entitlements). La app y la beta no leen este archivo: siguen con el
// catálogo de /api/catalog.

export const MONEDA = "PEN";

export const PLANES_TIENDA = [
  {
    id: "monthly",
    nombre: "Plan mensual",
    montoCentimos: 2990,
    duracionDias: 30,
    periodo: "1 mes",
    imagen: "/assets/planes/mensual.svg",
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
    duracionDias: 90,
    periodo: "3 meses",
    imagen: "/assets/planes/trimestral.svg",
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
    duracionDias: 180,
    periodo: "6 meses",
    imagen: "/assets/planes/semestral.svg",
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
