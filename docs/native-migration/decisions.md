# Registro de decisiones humanas de la migración nativa

Aquí se anotan las respuestas a las tareas `NAT-Hx` (ver `BACKLOG.md`). Solo información no secreta: nunca contraseñas, llaves privadas, certificados ni tokens. Al cerrar una decisión, la persona ejecuta `node scripts/native-next-task.mjs --done NAT-Hx --human` y commitea este archivo junto con `native-migration.json`.

| ID | Decisión | Fecha | Quién | Resultado |
|---|---|---|---|---|
| — | Aplazar la ejecución hasta validar con usuarios en la web; reanudar con decisión GO (`estrategia/01-Plan-de-Validacion.md` §5) | 2026-10-19 | Jonathan | en pausa |
| NAT-H1 | Aprobar ADR-001 (Expo / React Native) | | | pendiente |
| NAT-H2 | Cuentas de tienda, bundle id, Team ID, huella SHA-256 Android | | | pendiente |
| NAT-H3 | Modelo de cobro dentro de las apps | | | pendiente |
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
- Productos de compra integrada por plataforma: _(pendiente NAT-H3)_
