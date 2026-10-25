# Fuentes, certeza y trabajo externo pendiente

Fecha del informe: 22 de octubre de 2026, America/Lima.

## Convenciones

- **E**: comprobado en el código de Evolv; cuando se indica, también en navegador local con fixtures. No significa validado en producción.
- **H**: conocimiento histórico de MyFitnessPal, sin comprobación contemporánea. Permite formular una comparación provisional; no garantiza plataforma, país, precio o plan actuales.
- **R**: afirmación de un documento histórico del repositorio, no confirmada externamente.
- **P**: hipótesis, recomendación o dato pendiente de validación. No es un hallazgo medido.

No se asignan estrellas ni puntuaciones heurísticas comparables a MyFitnessPal sin usar su interfaz. No se presentan precios, número de alimentos, ratings, usuarios ni tiempos de su app como datos actuales. Las fuentes externas listadas abajo **son destinos por consultar**, no páginas leídas en esta ejecución.

## Fuentes primarias de Evolv

Los números de línea corresponden a `df27422`; pueden cambiar. Los nombres de función permiten reencontrarlas.

| ID | Evidencia | Qué acredita y límite |
|---|---|---|
| E01 | `index.html:3614`, `renderNutrition`, `openNutritionMoreMenu` | Vista diaria y opciones globales; recorrido móvil/escritorio |
| E02 | `index.html:7260`, `openEditor`, `editorSheet`, `saveEditor` | Registro libre: descripción + cuatro valores; extra nuevo queda `done:true` |
| E03 | `index.html:8088`, `aiEstimate`; `8140`, `photoEstimateRound`; `api/claude.js:349` | Estimación por texto/foto, aclaraciones y contrato; E2E con respuesta simulada |
| E04 | `js/nutrition-domain.js:1420`, `buildShoppingListFromNutritionPlan`; `index.html:8736` | Agregación de compras y visualización en borrador semanal |
| E05 | `index.html:895`, `buildNutritionPlanSnapshot`; `:877`, `activeNutritionPlanDay` | Plan y compras persistidos en snapshot; no prueba una entrada visible de compras |
| E06 | `index.html:6972`, `openChangeMeal`; `:7104`, `applyChangeMeal` | Reemplazo, deltas y cierre nutricional; reglas de comidas bloqueadas |
| E07 | `index.html:4389`, `mealRecipe`, `mealCard`; `supabase/schema.sql:19` | Ingredientes/gramos y macros; receta visible no incorpora un método de cocina paso a paso |
| E08 | `index.html:4325`, `renderWorkout`; `:3913`, `startWorkoutExecution`; `workout-player.js`, `training-plan.js` | Programación, guía, series, RPE/RIR, temporizadores y cierre; no inferir autorregulación por carga histórica |
| E09 | `index.html:4561`, `renderProgress`; `supabase/auth.sql:74` | Progreso, adherencia, ciclos, peso por semana/ciclo; no diario de pesajes por fecha |
| E10 | `index.html:10039`, `openWeeklyCheckin`; `:10097`, `analyzeCheckinAnswers` | Sueño/energía/hambre/recuperación y ajustes con reglas y confirmación; no un estimador continuo de gasto energético |
| E11 | `index.html:6592`, `authFailureMessage`; `api/admin.js` | Copia de error corregida localmente, administración; no se verificó entrega de correo ni cuenta real |
| E12 | `api/privacy.js:85`, `exportUser`; `PRIVACY.md` | Exportación JSON y borrado; no importador de diarios MFP ni informe nutricional CSV |
| E13 | `api/analytics.js:6`, eventos y propiedades permitidas | Telemetría parcial; no están declarados todos los eventos propuestos en el plan |
| E14 | `service-worker.js`; `index.html`, cola de sincronización; `sync-conflicts.js` | Shell offline y reconciliación propia; no garantías de catálogos/cámara/IA en offline |
| E15 | `supabase/seed.sql`; `scripts/validate-nutrition-catalog.mjs` | Seed de 200 ingredientes y 180 platos; no tamaño del catálogo de producción |
| E16 | `docs/audits/2026-10-16-impeccable/verification/README.md` | Auditoría previa y correcciones; evidencia histórica, no repetir sus métricas como medidas de hoy |
| E17 | `estrategia/00-Estrategia-y-Producto.md`; `NEGOCIO.md` | ICP e hipótesis de negocio; no evidencia de demanda ni prueba actual de precios rivales |
| E18 | `evidence/journeys.json`, 14 PNG de esta carpeta | Estados y recorridos locales nuevos; sin personas, errores de proveedor o servicios reales |
| E19 | `index.html:8095`, fallback de `aiEstimate`; `api/claude.js:924`, rama `reuse` | Riesgo de usar referencia genérica como estimación de una comida; no se provocó esa rama en producción |
| E20 | `assets/app.css:364`, `.meal-photo-preview`; `index.html:7288` | `display:block` vence el estado oculto por defecto del preview; imagen sin `src` aparece antes de elegir foto en captura móvil |

## Destinos oficiales de MyFitnessPal por consultar

| ID | URL | Verificación requerida | Estado |
|---|---|---|---|
| M01 | https://www.myfitnesspal.com/ | Propuesta actual, plataformas, capturas | Intento HEAD: CONNECT 403 del proxy |
| M02 | https://www.myfitnesspal.com/premium | Free/Premium/Premium+, condiciones por región | No consultada; política de red restringida |
| M03 | https://support.myfitnesspal.com/hc/en-us | Ayuda oficial, fecha de artículos y cobertura por plataforma | No consultada |
| M04 | https://blog.myfitnesspal.com/ | Lanzamientos y cambios de producto, especialmente planificación | No consultada |
| M05 | https://apps.apple.com/app/myfitnesspal-calorie-counter/id341232718 | iOS: versión, compras, screenshots y notas en storefront Perú | No consultada |
| M06 | https://play.google.com/store/apps/details?id=com.myfitnesspal.android | Android: versión, permisos, data safety y notas regionales | No consultada |
| M07 | https://www.myfitnesspal.com/privacy-policy | Política actual y uso/compartición de datos | No consultada |

El documento estratégico del repo de junio menciona **Premium+**. Se considera una señal R, no una comprobación de sus funciones ni de su disponibilidad en Perú. Es obligatorio verificar la planificación antes de mantener el posicionamiento histórico de «MFP solo registra».

## Protocolo para cerrar el benchmark externo (MFP-00)

1. Aplicar y publicar el borrador de red guardado. Reconsultar `environment_status`, comprobar observación vigente y probar los destinos. Publicar configuración no equivale a iniciar sesión ni contratar planes.
2. Registrar fecha, versión, OS, idioma, país/storefront, moneda y nivel de cuenta para cada captura. Como mínimo iOS en español/Perú; Android y web se inspeccionan aparte. Confirmar si el plan o la función no existen en ese país.
3. Leer ayuda y pricing oficial. Guardar título, URL final, fecha de publicación/actualización y fragmento pertinente para cada fila. Un enlace propuesto no cuenta como una fuente verificada. Solo añadir dominios CDN concretos si el navegador los necesita.
4. Con una cuenta de prueba facilitada de forma segura, recorrer registro, búsqueda, barra, alimento no encontrado, porción, copia, receta, restaurante, objetivo, gráfico, compras, cambio de plan y cancelación. No comprar una suscripción ni iniciar una prueba con cobro sin autorización.
5. Ejecutar el mismo guion de tareas de PLAN con alimentos y objetivos equivalentes. Separar tiempo de aprendizaje, latencia y tarea; contar toques y campos, no impresiones subjetivas.
6. Contrastar Free, Premium y, si existe en el mercado elegido, Premium+. Verificar texto/voz/foto/Meal Scan, planes, compras, exportación, ayuno, integraciones y restricciones. No inferir que MFP carece de entrenamiento por no verlo en la portada.
7. Para reseñas, muestrear de forma explícita: p. ej. 20 recientes por plataforma y 10 críticas por tarea, con fecha/idioma. Clasificar sin presentar esa muestra sesgada como prevalencia de problemas. No se han analizado reseñas en esta versión.
8. Reemplazar H/R/P por evidencia contemporánea en `matriz.csv`; revisar prioridades si MFP resuelve mejor una tarea que este plan considera oportunidad. Conservar histórico y límites del nuevo método.

## Registro técnico de acceso

Solicitud `curl -I --max-time 20 https://www.myfitnesspal.com/`, 2026-10-22: `CONNECT tunnel failed, response 403`, encabezado `server: envoy`. Es una restricción del entorno; no se atribuye a MyFitnessPal. No se intentaron proxies alternativos ni eludir la política.

El borrador guardado añade únicamente los cinco hosts indicados en README y mantiene los presets existentes. Respuesta: `status:saved`, `requires_publish:true`. No hay credenciales, datos de usuarios ni acceso a producción en este entregable.
