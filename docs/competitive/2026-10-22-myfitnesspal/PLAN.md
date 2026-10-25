# Plan para aumentar el valor de Evolv frente a MyFitnessPal

**Propuesta de producto, no autorización de implementación masiva.** Depende de completar la verificación externa y de validar demanda. Los plazos son estimaciones de planificación, no compromisos. Contexto y límites en [README](README.md).

## 1. Resultado buscado

Una persona debe poder abrir Evolv, entender qué le conviene hacer hoy, registrar lo que realmente hizo sin trabajo repetido y adaptar su semana sin perder el historial. Para el segmento elegido, el conjunto debe resultar al menos tan útil como su combinación actual de tracker y rutina; la ventaja se mide mediante tareas y uso sostenido.

Tres principios:

1. Lo básico de registrar debe funcionar aun sin estimación o generación disponible.
2. Todo número debe conservar su procedencia; lo desconocido y lo estimado no se presentan como exactos.
3. Preparar, registrar y ajustar son acciones diferentes. Los ajustes cambian el futuro; no reescriben lo consumido ni las sesiones cerradas.

## 2. Secuencia y capacidad

Supuesto para estimar: un desarrollador con dedicación completa, producto/diseño disponible para decisiones, QA compartido y revisión nutricional de datos/recetas. Sin esa disponibilidad, el calendario se desplaza. Los rangos incluyen desarrollo y pruebas locales; excluyen espera por proveedores, tiendas, consentimiento, legal, estudios y despliegues ajenos al equipo.

| Horizonte relativo | Entrega | Presupuesto orientativo | Puerta para avanzar |
|---|---|---|---|
| Días 1–10, investigación paralela | MFP-00, baseline de tareas y cobertura local | 2–4 días de investigación; entrevistas según disponibilidad | Saber qué versión/plan/país se está comparando y cuáles son las tareas frecuentes |
| Días 1–30 | MFP-01 acceso, MFP-02 medición, MFP-03 confianza, MFP-04 reutilización | 13–20 días de desarrollo | Confirmación recuperable; registro habitual rápido; sin valores de fallback engañosos |
| Días 31–60 | MFP-05 búsqueda/porciones, MFP-06 productos/barras si pasa gate, MFP-07 compras activas | 15–23 días | Catálogo alcanza cobertura objetivo; búsquedas/códigos fallidos tienen salida; compras recuperables |
| Días 61–90 | MFP-09 adaptación, MFP-10 tendencia mínima, MFP-11 historial de fuerza | 15–23 días | Usuarios entienden y controlan los ajustes; mejora verificable en tareas y continuidad |
| Después de los 90 días, o por sustitución de alcance | MFP-08 recetas propias, MFP-12 onboarding, MFP-13 nutrientes, MFP-14 integraciones, MFP-15 portabilidad, MFP-16 hábitos, MFP-17 comunidad | Se decide con datos, no se suma automáticamente | El valor incremental compensa complejidad y coste |

Los máximos suman 66 días de desarrollo, más de la capacidad habitual de 13 semanas. **El compromiso inicial es el extremo bajo o un alcance menor**: si barra/catálogo se acercan al máximo, posponer la ampliación de tendencias o historial, y conservar sus versiones mínimas existentes. La receta propia puede adelantarse sustituyendo una de esas mejoras si aparece entre las tareas más repetidas. No meter las 18 iniciativas en el trimestre.

## 3. Backlog con criterios de aceptación

P0 = bloqueo o confianza en el recorrido principal; P1 = uso diario y ventaja del segmento; P2 = ampliación después del núcleo; P3 = exploración. Se usa prioridad cualitativa porque no hay datos fiables de alcance/retención para calcular RICE. Todos los umbrales numéricos siguientes son **metas propuestas**, no resultados actuales.

### MFP-00 · Completar el benchmark y el baseline

**Prioridad P0 de investigación · 2–4 días de investigación · responsable producto.**

Seguir FUENTES: comparar cuentas/plataformas/países equivalentes y revisar MFP Free, Premium y Premium+ si está disponible. Medir diez tareas, nivel de cuenta, precios efectivos, restricciones y versión. Evaluar una muestra de 100 alimentos/productos representativos obtenida con consentimiento y sin recopilar historiales personales completos.

Aceptación: cada afirmación decisiva de MFP tiene fuente oficial o captura fechada; matriz actualizada; ningún precio inferido; tabla de tareas con éxitos, errores, tiempos y toques observados. Si no se consigue cuenta o red, mantener P explícito y no publicar una comparación comercial de superioridad.

### MFP-01 · Recuperar el acceso sin intervención técnica

**P0 · 2–4 días · auth/servidor + producto.**

Mostrar estado de confirmación, reenviar enlace con límite y salida cuando no llega, conservar el correo escrito y orientar recuperación. Investigar configuración de SMTP, redirect URLs, expiración y entregabilidad antes de atribuir todo al frontend. El checkout analizado ya traduce un caso; comprobar el comportamiento vigente antes de contarlo como trabajo pendiente completo.

Aceptación: cuenta no confirmada puede solicitar reenvío y recibe feedback claro; doble clic no duplica envíos; se cubren expiración, rate limit, fallo de red y enlace en otro dispositivo. Respuestas públicas no revelan si un correo pertenece a una cuenta. No cambiar contraseña, confirmar una cuenta ajena ni modificar producción como parte de una prueba automatizada. El test de recepción real usa cuenta de prueba autorizada.

### MFP-02 · Medir el recorrido cotidiano sin datos sensibles

**P0 · 1–2 días · frontend/API/analytics.**

Extender el esquema permitido de eventos para apertura/fin/error de registro, búsqueda sin resultados, vía de entrada, uso de recientes, sustitución y acceso a compras. Separar plan preparado de comida consumida y primer uso de repetición.

Aceptación: eventos documentados con duración en bandas, vía y resultado; sin email, nombre, alimento escrito, foto, código de producto ligado a usuario, peso ni texto de salud en propiedades. Dedupe por acción y esquema validado en API. Datos personales de progreso continúan en su dominio protegido. Dashboard distingue error real, abandono y falta de observación; no modifica decisiones alimentarias por telemetría incompleta.

### MFP-03 · Contrato del registro y confianza nutricional

**P0 · 5–7 días · dominio + frontend/API.** Depende de decisiones de esquema, no de contratar un catálogo.

Añadir origen/versionado al registro libre: manual, catálogo, receta o estimación; cantidad/unidad, valores usados y supuestos cuando existan. Mantener snapshots de valores consumidos. Corregir fallback genérico del estimador y preview oculto; separar dato faltante de cero. Revisar validación de cantidades y entrada decimal local.

Aceptación: si una estimación no se pudo efectuar, no se rellenan 500 kcal u otros valores genéricos como resultado específico; se conserva lo escrito. El usuario puede inspeccionar y corregir origen/porción. Una actualización del catálogo no cambia el pasado. Un registro manual solo de calorías es posible si se indica que los macros faltan; no asumir ceros sin señal. Foto no elegida no muestra preview; fallo de foto no borra campos. Tests cubren fuente, corrección, incompatibilidad y fallback.

### MFP-04 · Reutilizar lo habitual y registrar o sustituir claramente

**P0 · 5–7 días · frontend + dominio.** Depende del contrato MFP-03; la instrumentación avanza en paralelo.

En «Registrar comida»: recientes, favoritos y copia de comida/día; búsqueda local de lo propio, cantidad editable y elección «En lugar de… / Además de…». Mantener el toque para registrar una comida planificada. Cambiar texto del botón según intención: «Registrar», «Guardar en mi plan» o «Guardar corrección».

Aceptación: reciente conocido se registra en un máximo propuesto de tres acciones de navegación, sin reescribir macros. Copiar crea objetos independientes y no marca el futuro como consumido; no reescribe origen ni fechas históricas. Sustituir no suma dos veces lo que era una misma comida. Deshacer restaura estado y totales; offline/reintento no duplica entradas. Favoritos privados por usuario y accesibles con lector de pantalla.

### MFP-05 · Buscar alimentos con cantidades comprensibles

**P1 · 5–8 días · catálogo + dominio/frontend.** Depende de MFP-03 y de una base con licencia/procedencia adecuadas.

Entrada de búsqueda de ingredientes/productos/recetas propios, con recientes primero y ranking por coincidencia, mercado, procedencia y revisión. Distinguir marca, variante, unidad, crudo/cocido y fecha. Permitir alimento propio cuando no haya resultado. Usar el dominio actual para calcular y conservar los valores aplicados.

Aceptación: «arroz cocido» y «arroz crudo» se distinguen antes de registrar; 0,5 porciones y gramos tienen cálculo coherente; error/ausencia no produce un alimento inventado. En la muestra acordada, objetivo inicial de ≥90% de tareas con un resultado utilizable o creación propia sin bloqueo; reportar por cocina/marca, no solo promedio. Búsqueda local p95 <500 ms en dispositivos de referencia; remota con estado, cancelación y salida manual, sin prometer esa latencia a redes no medidas.

### MFP-06 · Productos de marca y código de barras

**P1 condicionada · 6–10 días · backend/catálogo + frontend.** Depende de MFP-03/05, proveedor y compatibilidad de cámara.

Antes de construir el escáner, evaluar 100 productos del mercado objetivo: coincidencia GTIN/variante, vigencia, unidad y consistencia con etiqueta. Probar un proveedor como Open Food Facts o comercial como **candidato**, no como cobertura ya confirmada. Revisar licencia, atribución y condiciones de almacenamiento/redistribución con asesoría adecuada.

Aceptación: código conserva ceros iniciales, identifica presentación/mercado y permite comparar etiqueta. Gate propuesto: ≥80% de coincidencias válidas en la muestra para justificar captura por cámara, con salida manual siempre. El resultado no se registra hasta confirmar cantidad. Probar permiso denegado, iOS sin `BarcodeDetector`, imagen borrosa, múltiples códigos, red caída y producto no encontrado. Una nueva librería/runtime requiere decisión explícita; no introducirla silenciosamente contra la regla del repo. Si no pasa gate, priorizar alimentos propios/etiqueta y conservar el escáner fuera del release.

### MFP-07 · Plan y compras accesibles después de aplicar

**P1 · 4–5 días · frontend + dominio.** Reutiliza `nutritionPlan.shoppingList`; no rehacer el planner.

Acceso visible «Mi semana / Lista de compras» desde Nutrición, a partir del snapshot activo. Checklist privada persistente, fecha de semana, agrupación útil y opción «Ya lo tengo». Recalcular solo compras futuras al cambiar el plan, distinguiendo elementos comprados y cantidades ajustadas.

Aceptación: cerrar revisión, recargar o entrar en otro dispositivo permite recuperar la misma lista; fallo de sincronización se explica. Cambiar dos comidas actualiza solo su demanda futura, no el consumo. No restar cantidades de despensa imaginarias. Checklist usable offline, con teclado y lector. No publicar listas o fotos al compartir sin una acción explícita. Exportación simple/impresión puede ser primera entrega; integración comercial se deja fuera.

### MFP-08 · Recetas propias que se puedan cocinar

**P1/P2 por demanda · 5–9 días · nutrición + frontend/dominio.** Depende de MFP-03/05.

Constructor de receta privada con ingredientes, cantidades, rendimiento, porción, pasos y tiempo. Reutilizar recetas curadas existentes; agregar método culinario validado. Diferenciar alimento, receta, comida guardada y plan para no mezclar modelos.

Aceptación: cocinar cuatro porciones y registrar una no altera receta ni historial; editar genera nueva versión para usos futuros. Indicar crudo/cocido, peso final si se conoce y límites de equivalencia. Ninguna etiqueta alergénica inferida se presenta como certificación. Importar una URL o extraer una etiqueta con OCR es una extensión separada, no parte automática del constructor.

### MFP-09 · Adaptar el día real sin romper el plan

**P1 · 4–6 días · dominio + frontend.** Depende de MFP-03/04 y reutiliza contingencias, reemplazos y check-in.

Entrada contextual para «Comí otra cosa», «Hoy tengo menos tiempo» y «No tengo este ingrediente». Mostrar qué cambia y por qué; confirmar antes de aplicar. Sugerir cambios de comidas futuras compatibles con restricciones; no compensar agresivamente excesos puntuales.

Aceptación: comidas hechas/saltadas y sesiones cerradas permanecen intactas. La propuesta tiene diferencia legible de porción/macros/duración; opción de mantener. Si no hay alternativa compatible, explicarlo sin inventar plato ni volver a uno rechazado. Tests de restricciones, dos comidas, dietas con poca cobertura, viaje/fecha y fallo parcial de guardado.

### MFP-10 · Tendencias y revisión semanal comprensibles

**P1 · 5–8 días · producto/nutrición + dominio.** Depende de decisiones de persistencia y MFP-02/03.

Primera entrega: resumen de semana con datos disponibles, adherencia registrada, entrenamientos y una decisión propuesta o «mantener». Ampliación: pesajes por fecha y tendencia con tratamiento de ruido, sin sobreescribir el peso semanal histórico. No convertir el check-in actual en ajuste diario automático.

Aceptación: pérdida/ganancia/mantenimiento tienen lectura distinta; falta de datos no se interpreta como 0 kcal ni como incumplimiento. Mostrar periodo, muestra y límites; no cambiar metas con dos valores aislados sin revisión acordada. El usuario entiende el motivo y puede rechazar; aceptación crea versión futura y queda auditable. Los límites nutricionales/screening siguen activos. El modelo de suavizado y suficiencia requiere revisión profesional, no un número arbitrario puesto por el desarrollador.

### MFP-11 · Historial de fuerza y siguiente dosis

**P1 · 5–9 días · entrenamiento + dominio/frontend.** Reutiliza reproductor y datos guardados; verificar primero completitud de cargas/repeticiones reales.

Ver última sesión comparable por ejercicio, carga, repeticiones, esfuerzo y variación. Proponer mantener/subir/reducir en función de cumplimiento y recuperación, con razón y aceptación. No confundir dosis planeada con ejecutada ni comparar ejercicios incompatibles.

Aceptación: dentro de sesión, consultar lo anterior no pierde temporizador ni series actuales. Sesiones parciales/dolor no se usan como señal de progresión positiva; RPE/RIR explicados; cambio de equipo/unidades conserva contexto. Ajustar no reescribe sesiones cerradas. Retorno de segundo plano probado en dispositivo físico antes de anunciar soporte completo.

### MFP-12 · Activación progresiva

**P2, adelantar si baseline lo exige · 3–5 días · producto/frontend.**

Acortar preferencias opcionales y permitir ver un primer día viable antes de afinar gustos. No retirar edad, restricciones esenciales, permisos necesarios ni evaluación de seguridad. La primera semana ya se prepara automáticamente: mejorar el tiempo hasta ese valor, no volver a implementarlo.

Aceptación: datos obligatorios justificados, opcionales omitibles, vuelta atrás conserva cambios y error tiene salida. Medir finalización y primera acción útil, sin confundir carga rápida con plan válido. Objetivo propuesto: ≥80% del grupo de prueba llega sin ayuda a primera acción; validar contra baseline.

### MFP-13 · Calidad nutricional más allá de macros

**P2 · 5–9 días más revisión de datos · nutrición/catálogo.**

Empezar por fibra y sodio si su procedencia y cobertura son suficientes. Añadir valores nullable, unidades, fuente y porcentaje de cobertura del día. No inferir que todo producto libre de un texto es seguro para alergias.

Aceptación: desconocido nunca se convierte en cero, receta recalcula solo campos disponibles y advierte cobertura parcial. Objetivos se revisan profesionalmente y no sustituyen tratamiento; no bloquear el registro por faltar un nutriente secundario.

### MFP-14 · Integraciones de actividad y salud

**P2 · descubrimiento 2–3 días; implementación 8–15 días o más según arquitectura/proveedor · plataforma.**

Validar si pasos, peso o entrenos importados son la automatización que más reduce trabajo. Mapear permisos, coste, revocación y política de la plataforma. Seleccionar una integración concreta; HealthKit/Health Connect pueden requerir wrapper/nativo y rompen el supuesto de implementación solo web.

Aceptación: idempotencia por proveedor/registro, origen y fecha visibles, prioridad entre fuentes, revocación y borrado. Sin doble conteo entre reloj y teléfono ni suma automática de gasto al objetivo que ya incluye actividad. Estimar coste total antes de autorizar plataforma nueva; el roadmap base no la presupone.

### MFP-15 · Portabilidad e importación

**P2 · 4–8 días tras obtener formatos reales · backend/datos.**

Mantener exportación de privacidad existente; sumar CSV legible y estudiar importación del archivo que el usuario pueda obtener legítimamente. No pedir credenciales de MFP ni scraping de cuentas.

Aceptación: preview de filas, unidades, zona horaria y duplicados; importación idempotente con reversión de lote y sin alterar historia propia. Datos ausentes quedan ausentes. No prometer importar detalles que el formato no contiene. Archivo tratado como entrada no confiable, con límites y sin fórmulas ejecutables en exportación CSV.

### MFP-16 · Hábitos y recordatorios opcionales

**P2/P3 · 2–4 días por experimento · producto/frontend.**

Agua, recordatorios contextuales y continuidad flexible solo si ayudan al segmento. Evolv ya tiene recordatorios/rachas; extenderlos con controles de frecuencia y pausa. No usar rachas para penalizar una semana de descanso.

Aceptación: opt-in, horarios del usuario, pausa fácil, sin datos de salud en notificación de pantalla bloqueada por defecto. Probar utilidad y fatiga; desactivar si aumenta notificaciones sin mejorar continuidad. No sumar agua, ayuno y sueño como objetivos simultáneos obligatorios.

### MFP-17 · Comunidad y contenido

**P3 · primero investigación, sin estimación de build comprometida · producto.**

Probar acompañamiento privado, ayuda dentro de la tarea o grupos moderados pequeños antes de un feed público. Biblioteca técnica y explicaciones ya existentes son una base. No exponer fotos/progreso por defecto ni crear un panel clínico/profesional sin diseñar permisos.

Aceptación para avanzar: evidencia de necesidad recurrente, moderación/responsable definidos, privacidad y reporte/bloqueo. Si el usuario solo necesita saber cocinar o hacer un ejercicio, mejorar esa ayuda primero.

## 4. Arquitectura y datos: cambios mínimos necesarios

La aplicación sigue sin framework ni build obligatorio. No proponer una reescritura completa como condición del roadmap. Nuevos cálculos puros pueden ir a módulos bajo `js/`; endpoints y proveedores quedan del lado servidor. Preservar los contratos existentes de nutrición, sincronización y privacidad.

Modelo conceptual a revisar antes de migrar:

| Objeto | Necesidad | Invariante |
|---|---|---|
| Alimento/versionado | Nutrientes por base, fuente, mercado, marca, GTIN, estado de revisión y unidades | Un alimento global no revela quién lo consumió |
| Alimento/receta propia | Propietario, ingredientes, rendimiento y versiones | RLS por usuario; compartir solo con permiso explícito |
| Registro consumido | Fecha local/zona, cantidad, origen, snapshot de nutrientes, supuestos y correcciones | El catálogo futuro no modifica el pasado |
| Favorito/reciente | Referencia y contexto propio | No mezclar favoritos entre cuentas ni confundir con gustos del planner |
| Compras | Semana/versión activa, estado y demanda futura | Cambiar plan no borra la marca de comprado sin explicación |
| Peso por fecha | Lectura y fuente con compatibilidad de semana/ciclo | Migración no destructiva; registros antiguos se conservan |
| Sesión/ejercicio | Planeado frente a realizado, variación y unidades | Progresión usa observaciones comparables |

Es diseño conceptual, **no SQL listo para producción**. Primero evaluar extensión versionada del JSON actual frente a nuevas tablas y coste de queries/sync. Toda migración requiere revisión y procedimiento manual según el repo. Tests de aislamiento entre dos usuarios, dedupe, offline y compatibilidad con snapshots antiguos son obligatorios en cada incremento. Analytics recibe únicamente eventos mínimos permitidos; no se convierte en almacén de nutrición o salud.

Los proveedores de catálogo se evalúan por cobertura local, coste por llamada, límites, licencia, atribución, frescura y verificación, no por el número bruto anunciado de alimentos. La fuente curada del planner y la base de productos envasados cumplen funciones distintas; no abrir el solver a entradas de calidad desconocida sin validación.

## 5. Cómo medir si aportamos igual o más valor

### Baseline y experimento por tareas

Reclutar, con autorización, 12–20 adultos del segmento y separar experiencia/uso previo. Es una muestra exploratoria; no permite declarar superioridad poblacional ni clínica. Comparar versión y plan equivalente de MFP con Evolv, mismo dispositivo y tareas contrabalanceadas para reducir aprendizaje. Documentar acceso a funciones de pago; no comparar una función paga rival con una inexistente sin explicarlo.

Guion común:

1. Crear/acceder a cuenta y llegar al primer día útil.
2. Registrar desayuno conocido con cantidad distinta.
3. Repetir ayer sin duplicar ni editar el registro original.
4. Registrar producto de marca por etiqueta/código; manejar no encontrado.
5. Corregir una comida ya registrada y deshacer.
6. Comer fuera en lugar de lo previsto y entender el resto del día.
7. Preparar una semana, recuperar compras después de cerrar y cambiar un plato.
8. Cocinar una receta de varias porciones y registrar una.
9. Entrenar con menos tiempo y guardar una sesión real/ensayada sin perder datos.
10. Entender una tendencia y aceptar o mantener el plan con una razón propia.

Las tareas no soportadas por una app se marcan «no disponible en el plan probado»; no se les inventa un tiempo infinito. Medir también si el participante necesita su herramienta actual para terminar.

| Métrica | Definición | Meta de decisión propuesta |
|---|---|---|
| Éxito de tarea | Completa correctamente sin ayuda, verificando estado final | ≥90% en tareas básicas; comparar contra MFP observado |
| Tiempo de registro habitual | Desde intención hasta registro confirmado; separar entrada conocida y nueva | Mediana ≤15 s y p90 ≤30 s para habitual; además, no peor que baseline rival |
| Corrección/duplicados | Estado final y macros/cantidad coherentes; no solo click en guardar | Cero duplicados/pérdida en casos de integridad; registrar tasa humana y tipos de error |
| Facilidad percibida | SEQ 1–7 tras cada tarea y comentario del participante | Mediana ≥6 para núcleo, sin sacrificar exactitud |
| Carga de decidir | Decisiones explícitas, necesidad de ayuda y tarea mental reportada | Menor en planificación/adaptación, con evidencia cualitativa y conteo |
| Retorno D7/D28 | Usuarios que vuelven y completan una acción útil / cohorte activada | Medir baseline; mejora propuesta relativa ≥15%, no exigir significancia con muestra pequeña |
| Semana útil | Semana con registro suficiente para el objetivo y acciones de nutrición/entreno acordadas | Definir con usuarios antes de usar como north star; no igualar abrir app a recibir valor |
| Confianza | Puede explicar de dónde sale un dato y qué es estimado | ≥80% en entrevista de tarea; registrar dudas, no una afirmación de precisión clínica |
| Negocio | Conversión a pago y coste variable por semana activa | Elegir tras medir disposición a pagar; no solo CTR al paywall |

No mezclar «adherencia registrada» con adherencia real ni D7 de cuentas invitadas con usuarios captados de forma abierta. Separar cohortes por objetivo, experiencia y plan. La retención debe observarse al menos 4–6 semanas después del lanzamiento del núcleo; por eso no todo el aprendizaje cabe dentro del desarrollo de 90 días.

### Hipótesis de monetización

Probar núcleo de registro fiable, recientes y corrección accesibles; reservar planificación continua, adaptación y acompañamiento para un paquete de valor. Barcode puede ser adquisición o parte de un nivel según coste, pero no ocultar una función detrás de pago hasta medir su cobertura local. No cobrar por exportación básica de privacidad ni por recuperar un error.

Antes de fijar precio: obtener oferta vigente de MFP en Perú, coste de catálogo/estimaciones por usuario activo, impuestos/cobro y prueba de pago real del segmento. El benchmark de USD 14 del repo es una referencia histórica de Evolv, no una recomendación actual validada. No anunciar descuentos o renovaciones automáticas que checkout/entitlement no soporten.

## 6. Condiciones de lanzamiento y reversión

Cada entrega se publica detrás de una bandera o cohorte controlada cuando su complejidad lo justifica. Revertir presentación o desactivar proveedor debe conservar registros del usuario. El plan anterior permanece disponible si el siguiente no se puede completar. No reusar una estimación incompatible para evitar mostrar un error.

Checks por entrega: contratos de nutrición/entrenamiento afectados, E2E de tarea y corrección, dos usuarios para RLS/sync, offline y reintento para escrituras, WCAG en estados nuevos, verificación móvil/escritorio y cache PWA coherente. Tests relevantes, no duplicación mecánica de implementación. Revisar dispositivo físico cuando intervienen cámara, teclado móvil, notificaciones o segundo plano.

Puertas para frenar: búsqueda con baja cobertura, falta de licencia, estimaciones engañosas, pérdida/mezcla de datos, ajustes no comprendidos o retención sin mejora. En esos casos reducir alcance y corregir la tarea; no añadir funciones para compensar. La comunicación comercial de «más valor» solo se habilita para escenarios cuya comparación haya sido observada.

## 7. Próxima sesión

1. Completar MFP-00 si se activó el acceso externo; actualizar matriz sin borrar la evidencia original.
2. Elegir un incremento del paquete inicial: recomendación MFP-03 si el acceso real ya quedó resuelto; MFP-01 si siguen cuentas bloqueadas. Resolver la cuenta real exige herramientas/credenciales administrativas autorizadas, no está solucionado por este documento.
3. Escribir un REQ propio con criterios acotados y validar el estado actual del repo antes de tocar código.
4. Implementar y probar ese incremento; conservar la medición para comprobar si disminuye trabajo al usuario.
