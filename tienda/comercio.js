// Datos legales del comercio que vende Evolv (titular inscrito en Culqi).
// Única fuente: los leen las páginas públicas de la tienda (tienda/layout.js),
// el Libro de Reclamaciones y los correos de /api/reclamaciones y /api/culqi-charge.
// Un valor que empieza con "[COMPLETAR" es un marcador: hay que reemplazarlo
// por el dato real antes de reenviar la web a revisión de Culqi
// (node scripts/test-tienda-culqi.mjs lo avisa).

export const COMERCIO = {
  marca: "Evolv",
  razonSocial: "Sathya Bernedo Llerena",
  ruc: "10758585960",
  direccion: "Av. Arequipa 4856, Miraflores, Lima",
  correo: "hola@evolvapp.club",
  telefono: "+51 962 158 625",
  whatsappUrl: "https://wa.me/18302629397?text=Hola%2C+tengo+una+duda+sobre+Evolv",
  horario: "Lunes a viernes, de 9:00 a 18:00 (hora de Lima)",
  web: "https://evolvapp.club",
  // Solo cuentas reales: Culqi revisa que cada ícono lleve a la cuenta del comercio.
  redes: [],
  // Fecha de la versión vigente de términos, devoluciones y privacidad.
  vigenciaLegal: "10 de noviembre de 2026",
};

export function esMarcador(valor) {
  return typeof valor === "string" && valor.startsWith("[COMPLETAR");
}
