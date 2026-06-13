# Plan de construcción por fases — Fitbud

Cada fase es autocontenida y deja la app funcionando. Al terminar cada una: verificar, commit, marcar en PROGRESS.md.

- **Fase 0 — Andamiaje y control de versiones.** git init, estructura base de index.html (HTML+CSS+JS en un archivo), crear BUILD_PLAN.md y PROGRESS.md. Commit.
- **Fase 1 — Capa de datos.** Leer plan-10-semanas-recomposicion.md y codificar el calendario completo de 10 semanas en una estructura JS: días, tipo de día, menú asignado, comidas con kcal + macros, y entrenamiento. Metas por tipo de día. Commit.
- **Fase 2 — Vista HOY + persistencia.** Render del día actual (comidas + entrenamiento), checks de completado, contador de kcal vs meta, guardado en localStorage. (App ya usable.) Commit.
- **Fase 3 — Navegación.** Día anterior/siguiente, vista de semana, revisar días futuros. Commit.
- **Fase 4 — Reemplazo y comidas personalizadas.** Reemplazar comidas (del plan o personalizadas) y agregar extras, con ingreso manual de kcal y macros. Commit.
- **Fase 5 — Macros en vivo.** Acumulado de proteína/carbohidratos/grasa, barras de progreso por macro, proteína destacada con código de color. Commit.
- **Fase 6 — Integración Claude API.** Ajustes con API key; estimar comida (kcal+macros), sugerir comidas, revisar macros. Degradación elegante sin key. Commit.
- **Fase 7 — Entrada por voz.** Micrófono con Web Speech API en español que alimenta al estimador de la Fase 6. Commit.
- **Fase 8 — Extras.** Registro de peso + gráfico, indicador de semana, resumen del día. Commit.
- **Fase 9 — Despliegue en Vercel.** Subir a GitHub y desplegar en Vercel (gratis). Verificar que el micrófono y la API funcionen en la URL HTTPS. Commit final y entregar la URL.
