# Tienda en dólares (REQ-381)


> **Estado (13 nov 2026): activo.** Culqi habilitó USD y acepta tarjetas extranjeras con 3DS; el contador confirmó que no hay IGV para compradores del extranjero (los precios publicados no cambian); Jonathan aprobó los textos de `/terminos` y `/devoluciones` (`vigenciaLegal` = 13 nov 2026); `TIENDA_USD_ENABLED=1` en Production. `/privacidad` no cambia.

Para vender en Santiago y Bogotá (enero–febrero 2027), la tienda web cobra también en dólares (USD) con Culqi. Todo el camino en dólares está apagado hasta que Culqi lo habilite en la cuenta del comercio y se encienda la bandera `TIENDA_USD_ENABLED` en Vercel.

## Precios

Precios propios por moneda (no son conversiones), decididos por Jonathan el 11 nov 2026. Viven en `tienda/planes.js` (`precios: { PEN, USD }`, en céntimos o centavos):

| Plan | Soles | Dólares |
|------|-------|---------|
| Mensual (30 días) | S/ 29.90 | USD 8.99 |
| Trimestral (90 días) | S/ 79.90 | USD 21.99 |
| Semestral (180 días) | S/ 149.90 | USD 39.99 |

El ahorro que se muestra en cada plan («Ahorro del N % frente a 3/6 meses sueltos») se calcula con los precios de la moneda que se ve: 11 % y 16 % en soles, 18 % y 26 % en dólares.

## Cómo funciona

- **Bandera.** `TIENDA_USD_ENABLED` en las variables de entorno de Vercel. Solo `1` o `true` la encienden; cualquier otro valor, o no tenerla, la deja apagada.
- **Apagada (hoy):** todos ven soles como antes, sin selector; `/api/culqi-charge` rechaza `moneda: "USD"` (400, sin llamar a Culqi) y los textos dicen «en soles».
- **Encendida:**
  - `/api/config` devuelve `tienda: { usd: true, monedas: ["PEN","USD"], monedaSugerida }`. La sugerida sale de la cabecera `x-vercel-ip-country` de Vercel: Perú o país desconocido → soles; cualquier otro país → dólares. Con la bandera encendida esa respuesta deja de guardarse en la CDN (`Cache-Control: private`), porque cambia según el país.
  - La portada muestra los precios en la moneda sugerida. `/planes` y `/pago` muestran el selector «Soles / Dólares». La elección se guarda en el navegador (`localStorage`, clave `evolv_moneda`) y viaja de `/planes` a `/pago` con `?moneda=`. Orden: `?moneda=` de la URL, después la elección guardada, después la sugerida.
  - El navegador solo envía `moneda` (`"PEN"` o `"USD"`). `/api/culqi-charge` valida la moneda, toma el monto del catálogo para ese plan y esa moneda, y usa esa moneda en el cargo (`currency_code`), en el comprobante por correo, en las notas del acceso, en el `payload` de `billing_events` (`amount`, `currency`) y en el Purchase de la API de conversiones de Meta. La respuesta devuelve `moneda`, `monto` y `compra.currency`, que `/pago` usa en los eventos del píxel. Un monto enviado por el navegador se ignora.
  - `/terminos` y `/devoluciones` muestran la frase sobre dólares solo con la bandera encendida (ver «Textos legales» abajo).

Los módulos: `tienda/planes.js` (precios, `montoPlan`, `formatoPrecio`, `usdHabilitado`, `monedaPorPais`), `tienda/moneda.js` (navegador: configuración, elección guardada y selector), `api/config.js` (`tiendaConfig`), `api/_tienda/culqi-charge.js` y `api/_tienda/meta-capi.js`. No agrega funciones de Vercel.

## Pasos humanos antes de encender la bandera

1. **Culqi:** pedir que habiliten cobros en dólares (USD) en la cuenta del comercio y registrar una **cuenta bancaria en dólares** para los abonos.
2. **Culqi:** confirmar que la cuenta acepta **tarjetas emitidas fuera del Perú** (Chile, Colombia) y que **3-D Secure** funciona en dólares. Hacer una compra de prueba en USD con llaves de integración.
3. **Contador:** definir comprobantes e IGV para compradores del extranjero (posible exportación de servicios) y si «impuestos incluidos» sigue siendo correcto en dólares.
4. **Textos legales:** aprobar las frases condicionales de `/terminos` y `/devoluciones` (abajo) y decidir si `/privacidad` menciona el país aproximado. Si cambian, actualizar `vigenciaLegal` en `tienda/comercio.js` en el mismo despliegue.
5. **Vercel:** en el proyecto, *Settings → Environment Variables*, crear `TIENDA_USD_ENABLED = 1` solo en **Production** y redesplegar.
6. **Verificar en producción:** desde Perú `/planes` muestra soles; con VPN de Chile o Colombia muestra dólares; una compra real en USD de USD 8.99, reembolsada el mismo día desde CulqiPanel.

Para apagarlo: borrar la variable (o ponerla en `0`) y redesplegar. Las compras ya hechas en dólares conservan su moneda en `billing_events`; los reembolsos se hacen desde CulqiPanel sobre el cargo original, en su moneda.

## Textos legales (pendientes de aprobación)

Con la bandera apagada, las páginas legales no cambian. Con la bandera encendida:

- `/terminos`, sección 5: «Los precios están en soles (S/) o en dólares estadounidenses (USD) e incluyen los impuestos aplicables.» y un punto nuevo: «La tienda propone la moneda según el país desde el que nos visitas y puedes cambiarla antes de pagar. Se cobra el precio publicado en la moneda elegida, sin conversión.»
- `/devoluciones`, modalidad de reembolso: «…a la misma tarjeta con la que pagaste, a través de Culqi, en la misma moneda en la que se cobró (soles o dólares) y por el mismo monto.» Cambio de plan: «…te devolvemos la diferencia, en la moneda de tu compra original.»
- Propuesta para `/privacidad` (no aplicada): «Para proponerte la moneda usamos el país aproximado de tu conexión, que nos indica nuestro proveedor de hosting; no lo guardamos. Si eliges la moneda, tu navegador la recuerda.»

## Fuera de alcance

- El aviso de plan dentro de la app (`showStorePaywall`) sigue en soles: lo ven cuentas ya creadas, casi todas de Perú. Las cuentas beta siguen sin ver precios (REQ-208).
- `og:description` de `/planes` («Desde S/ 29.90») queda en soles: las vistas previas de enlaces no dependen del país.
- Otros medios de pago (Yape, billeteras) ni otras monedas.
