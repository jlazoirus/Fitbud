# Registro de decisiones humanas de la migración nativa

Aquí se anotan las respuestas a las tareas `NAT-Hx` (ver `BACKLOG.md`). Solo información no secreta: nunca contraseñas, llaves privadas, certificados ni tokens. Al cerrar una decisión, la persona ejecuta `node scripts/native-next-task.mjs --done NAT-Hx --human` y commitea este archivo junto con `native-migration.json`.

| ID | Decisión | Fecha | Quién | Resultado |
|---|---|---|---|---|
| — | Aplazar la ejecución hasta validar con usuarios en la web; reanudar con decisión GO (`estrategia/01-Plan-de-Validacion.md` §5) | 2026-10-19 | Jonathan | en pausa |
| NAT-H1 | Aprobar ADR-001 (Expo / React Native) | | | pendiente |
| NAT-H2 | Cuentas de tienda, bundle id, Team ID, huella SHA-256 Android | | | pendiente |
| NAT-H3 | Modelo de cobro dentro de las apps | 2026-11-05 | Jonathan | Decidido: cobro solo en la web (Culqi); las apps no venden, no enlazan a comprar y no canjean cupones; leen el acceso del servidor. Contingencia de compra integrada si una tienda la exige (`COBRO-WEB.md`). Cierre formal pendiente de la validación en beta con App Store y Google Play. |
| NAT-H4 | Privacidad para tiendas y excepción acotada a REQ-31 | | | pendiente |
| NAT-H5 | Expo/EAS (projectId), Firebase, APNs | | | pendiente |
| NAT-H6 | Migraciones nativas aplicadas en producción | | | pendiente |
| NAT-H7 | Fichas de tienda y formularios aprobados | | | pendiente |
| NAT-H8 | Go/no-go beta y público; convivencia PWA | | | pendiente |

## Datos públicos para agentes

- Bundle id iOS / package Android: _(pendiente NAT-H2)_
- Apple Team ID: _(pendiente NAT-H2)_
- SHA-256 del certificado de firma Android: _(pendiente NAT-H2)_
- EAS projectId: _(pendiente NAT-H5)_
- Productos de compra integrada por plataforma: ninguno (cobro solo en la web); solo se definen si se activa la contingencia de NAT-H3.
