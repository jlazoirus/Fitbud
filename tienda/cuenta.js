// REQ-357: textos de "Mi suscripción" en la web pública (/cuenta), para quien usa la
// app nativa (que no vende ni enlaza a comprar) o prefiere el navegador. Funciones
// puras sobre lo que devuelve GET /api/suscripcion/estado; la app web tiene su
// propio bloque en Perfil con los mismos textos.

const TZ = "America/Lima";

export function fechaLarga(iso) {
  const d = new Date(iso);
  if (!iso || !Number.isFinite(d.getTime())) return "";
  return d.toLocaleDateString("es-PE", { timeZone: TZ, day: "numeric", month: "long", year: "numeric" });
}

export const ESTADOS = {
  pending: "Activándose",
  trialing: "Semana gratis",
  active: "Activa",
  past_due: "Cobro pendiente",
  canceled: "Cancelada",
  ended: "Terminada",
};

export function puedeCancelar(s) {
  return !!s && ["pending", "trialing", "active", "past_due"].includes(s.estado);
}

// Filas [etiqueta, valor] para la hoja de estado.
export function filasEstado(s) {
  if (!s) return [];
  const filas = [["Estado", ESTADOS[s.estado] || "Activa"]];
  if (s.estado === "trialing" && s.pruebaHasta) filas.push(["Gratis hasta", fechaLarga(s.pruebaHasta)]);
  if (puedeCancelar(s) && s.proximoCobro) filas.push([s.estado === "trialing" ? "Primer cobro" : "Próximo cobro", fechaLarga(s.proximoCobro) + " · " + s.monto]);
  if (puedeCancelar(s)) filas.push(["Precio", s.monto + " al mes, hasta que canceles"]);
  if (s.tarjeta && s.tarjeta.ultimos4) filas.push(["Tarjeta", (s.tarjeta.marca || "Tarjeta") + " •••• " + s.tarjeta.ultimos4]);
  if (!puedeCancelar(s) && s.canceladaEl) filas.push(["Cancelada el", fechaLarga(s.canceladaEl)]);
  if (s.accesoHasta) filas.push(["Acceso hasta", fechaLarga(s.accesoHasta)]);
  return filas;
}

// Nota bajo la hoja: qué pasa ahora.
export function notaEstado(s) {
  if (!s) return "";
  if (s.estado === "past_due") return "Tu último cobro no pasó. Culqi lo volverá a intentar; si no pasa, la suscripción se cancela sola y no se cobra nada más.";
  if (s.estado === "trialing") return "Si cancelas antes del primer cobro, no se cobra nada.";
  if (s.estado === "pending") return "Estamos confirmando tu suscripción con Culqi. Puede tardar unos minutos.";
  if (!puedeCancelar(s)) return s.accesoHasta ? "No se hará ningún cobro más. Conservas el acceso hasta el " + fechaLarga(s.accesoHasta) + "." : "No se hará ningún cobro más.";
  return "Puedes cancelar cuando quieras, sin costo.";
}

// Confirmación de una línea antes de cancelar.
export function textoConfirmar(s) {
  const hasta = s && s.accesoHasta ? fechaLarga(s.accesoHasta) : "";
  if (s && s.estado === "trialing") return "¿Cancelar tu suscripción? No se hará ningún cobro" + (hasta ? " y conservas el acceso hasta el " + hasta : "") + ".";
  return "¿Cancelar tu suscripción? No se harán más cobros" + (hasta ? " y conservas el acceso hasta el " + hasta : "") + ".";
}

export function textoCancelada(accesoHasta) {
  return accesoHasta
    ? "Listo, tu suscripción está cancelada. No se hará ningún cobro más y conservas el acceso hasta el " + fechaLarga(accesoHasta) + ". Te enviamos la confirmación por correo."
    : "Listo, tu suscripción está cancelada. No se hará ningún cobro más. Te enviamos la confirmación por correo.";
}

// Sesión guardada por la app web en este mismo dominio (Supabase), si sigue vigente.
// No se refresca: usar el refresh token aquí cerraría la sesión de la app.
export function sesionGuardada(storage, now = Date.now()) {
  try {
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (!/^sb-.*-auth-token$/.test(key)) continue;
      const s = JSON.parse(storage.getItem(key) || "{}");
      const token = s && s.access_token;
      const exp = Number(s && s.expires_at) * 1000;
      if (token && Number.isFinite(exp) && exp - now > 60000) return { token, email: (s.user && s.user.email) || "" };
    }
  } catch (_) { /* sin almacenamiento: se pide iniciar sesión */ }
  return null;
}
