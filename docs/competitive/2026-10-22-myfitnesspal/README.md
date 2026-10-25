# MyFitnessPal frente a Evolv: análisis y requerimientos

**Actualización: 24 de octubre de 2026 · Trabajo autorizado sin entrevistas ni reclutamiento.**

Se contrastó el plan con `origin/main` `62c7860`, se leyeron 14 artículos oficiales actuales de MyFitnessPal, se ejecutaron seis E2E de Evolv y tres reproducciones en Chromium con fixtures. El resultado es un paquete de **nueve REQ pendientes, REQ-265..273**, con alcance, dependencias, aceptación y pruebas. No son funcionalidades terminadas.

## Empezar aquí

1. [Plan de implementación vigente](PLAN.md): decisiones, secuencia y verificación sin entrevistas.
2. [Backlog detallado](BACKLOG.md): cada REQ, sus casos y lo excluido; el estado operativo vive en `REQUIREMENTS.md` de la raíz.
3. [Fuentes verificadas](FUENTES-VERIFICADAS.md): catorce artículos oficiales, límites de país/plataforma y evidencia de Evolv.
4. [Matriz actualizada de 48 dimensiones](matriz-actualizada-2026-10-24.csv): fuente y estado de revalidación por fila; lo no revalidado está identificado y no genera un REQ nuevo.

El primer trabajo es **REQ-265: eliminar la estimación genérica aplicada como resultado**. Luego REQ-266 valida valores, REQ-267 preserva procedencia y REQ-268 permite editar ingredientes. Continúan sustitución, copia, alimentos propios, recetas y GTIN. El selector existente descubre pendientes no listados por orden numérico; la cola estará disponible al integrarse en `main`.

## Qué cambió respecto al informe inicial

- Recientes/favoritas, buscador de ingredientes, compras con checklist, reenvío de confirmación y última carga de fuerza ya existen en `main`: se retiraron del trabajo nuevo.
- MFP sí documenta planificación/compras en Premium+, con límites de país e inglés, y creación de alimentos/recetas en Free. No se sostiene la tesis de que solo registra o no tenga rutinas.
- Entrevistas, reclutamiento y métricas de retención dejan de ser puertas previas de implementación. Se decide con documentación, código y tareas reproducibles; una validación de funcionamiento no se presenta como prueba de demanda ni resultado clínico.
- La creación masiva de propuestas MFP-00..17 se sustituye por nueve requerimientos acotados y autorizados. El resto queda fuera del paquete activo.

## Evidencia actual y límites

- [Seis E2E aprobados sin reintentos](evidence/2026-10-24/baseline-checks.json): comidas guardadas, compras y confirmación de correo.
- [Tres reproducciones](evidence/2026-10-24/probes.json) con capturas: negativos guardados, ingredientes reducidos a texto/totales y efecto de la plantilla de 500 kcal. La última usa una respuesta del servidor simulada con la plantilla real del código; no mide incidencias en producción.
- [Registro de fuentes oficiales](evidence/2026-10-24/official-sources.json): URLs consultadas, fechas de actualización, método y resúmenes propios. No se inició sesión ni probó la app nativa de MFP. Se reconstruyeron sus flujos desde la ayuda; no se inventan tiempos de personas ni precios.
- `verify-current.mjs` permite repetir los probes sobre la base declarada, con servidor en 127.0.0.1:8923 y Chromium local. Todo usa fixtures, no cuentas o servicios de producción. Si el código cambia, escribir evidencia nueva en otra carpeta fechada.

## Histórico y continuidad

El [análisis del 22 de octubre](ANALISIS.md), la [matriz original](matriz.csv), el [registro de fuentes inicial](FUENTES.md), `capture.mjs` y las capturas iniciales describen `df27422`, un checkout distinto del `main` contrastado. Sus 11 E2E/14 capturas son históricos; no son resultados de esta actualización. Las decisiones vigentes están en PLAN/BACKLOG y los nuevos REQ.

REQ-274 registra la publicación compartida del informe. REQ-265..273 son pendientes funcionales, uno por implementación/commit. Al tomar uno, revalidar su necesidad, revisar dependencias y respetar lock, privacidad, historial y los contratos existentes. Este paquete no reanuda el track nativo pausado ni introduce proveedores, pagos o migraciones de producción como prerrequisito.
