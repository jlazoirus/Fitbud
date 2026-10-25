# MyFitnessPal frente a Evolv: análisis y plan de valor

**22 de octubre de 2026 · Mercado de trabajo: Perú y usuarios de habla española en LatAm.**

**Publicación compartida: 24 de octubre de 2026.** Esta entrega documental parte de `origin/main` en `62c7860`. El análisis y las capturas corresponden al checkout `df27422` del 22 de octubre, que tenía cambios locales distintos de esa rama. No describen el estado actual de `main`. Antes de implementar MFP-00..17, contrastar cada propuesta con el código, `REQUIREMENTS.md` y el backlog nativo vigentes; algunas brechas o decisiones pueden haber cambiado. La migración nativa está pausada en la base de publicación y este informe no la reactiva.

Conclusión: Evolv puede aportar más valor a quien necesita decidir qué comer y cómo entrenar, pero todavía deja demasiado trabajo al registrar alimentos fuera del plan. La prioridad es combinar su planificación y ejecución guiada con un registro cotidiano rápido y datos trazables. La superioridad debe demostrarse por tareas y segmentos; no se deduce contando funciones.

## Lectura

1. [Análisis funcional, usabilidad y brechas](ANALISIS.md): capacidades, experiencia por tarea, ventajas, riesgos y comparación con límites explícitos.
2. [Plan de mejora y backlog ejecutable](PLAN.md): prioridades, criterios de aceptación, dependencias, entregas de 90 días, métricas y validación.
3. [Registro de fuentes y verificación pendiente](FUENTES.md): qué se comprobó, qué procede de conocimiento histórico y qué necesita acceso externo.
4. [Matriz de 48 dimensiones en CSV](matriz.csv): inventario para próximas sesiones.
5. [Evidencia de navegador](evidence/journeys.json): 14 capturas, móvil y escritorio, seis registros de recorridos/observaciones con fixtures.

## Alcance y nivel de certeza

Este es un análisis amplio de producto y una evaluación heurística por tareas, con revisión de código y navegador de Evolv. **La investigación contemporánea de MyFitnessPal está incompleta**: el proxy rechazó `www.myfitnesspal.com` con HTTP 403; no hay herramienta de búsqueda web ni una cuenta de MyFitnessPal disponible. Sus funciones históricas se usan como referencia provisional, no como prueba de su oferta, interfaz, precios o límites actuales. No se realizó una prueba de su app nativa.

Se guardó un borrador de red que permite `www.myfitnesspal.com`, `support.myfitnesspal.com`, `blog.myfitnesspal.com`, `apps.apple.com` y `play.google.com`. El guardado fue confirmado y requiere revisar, guardar y publicar el entorno para activarlo. No se amplió la política efectiva de esta ejecución. Para completar el benchmark, seguir [FUENTES.md](FUENTES.md).

Evolv se revisó en el commit de aplicación `df27422`, sin datos ni servicios de producción. El navegador usa fixtures existentes; las capturas no demuestran el estado del despliegue, entregabilidad de emails, checkout, calidad del proveedor de estimación ni retención real. No se ejecutó el comando formal `impeccable critique`: se emplearon los criterios de interacción y carga cognitiva de Impeccable para este trabajo de planificación competitiva.

## Comprobaciones realizadas

- 14 capturas: 390 × 844 y 1440 × 900; sin desbordamiento horizontal del documento en los estados capturados.
- Registro manual de snack, preparación/aplicación de día, registro de comida, navegación, entrada a entrenamiento guiado y revisión del acceso a compras.
- 11 pruebas E2E de nutrición, foto, entrenamiento y onboarding: aprobadas sin reintentos. Resumen en [evidence/checks.json](evidence/checks.json).
- Son evidencias de funcionamiento local; no constituyen un estudio de usabilidad con personas.

## Continuidad para otras sesiones

Los identificadores `MFP-00` a `MFP-17` son propuestas de este plan, **no REQ funcionales aprobados ni entradas del selector automático**. La solicitud autoriza el análisis y la planificación, no ejecutar todo el roadmap. REQ-264 registra únicamente la publicación de este entregable documental; se evita el REQ-202 usado en el checkout privado, porque ese número ya corresponde a otro trabajo en `main`. Al implementar una propuesta, convertirla en un REQ aislado, confirmar decisiones y dependencias pendientes, preservar historial/RLS y hacer su propio commit.

El primer paquete recomendado es MFP-01/02/03/04: desbloquear acceso, medir el recorrido, asegurar la procedencia de los registros y hacer reutilizables las comidas habituales. La investigación externa MFP-00 puede avanzar en paralelo.

`capture.mjs` conserva el recorrido utilizado en el checkout original, con Chromium local y fixtures. Para ejecutar una captura nueva sobre `main`, revisar primero sus selectores y helpers contra la versión actual; no se ha validado el script sobre la base de publicación. Servir la raíz con `python3 -m http.server 8923 --bind 127.0.0.1`, adaptar el recorrido y escribir nuevos resultados en otra carpeta fechada, conservando esta evidencia histórica. Detener el servidor de revisión al terminar. Los 11 E2E y los validadores documentados en el informe corresponden a la ejecución del 22 de octubre; no se afirman como resultados de la publicación actual.
