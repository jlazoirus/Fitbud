# Análisis de MyFitnessPal y brechas de Evolv

**Snapshot histórico del 22 de octubre.** La [actualización del 24 de octubre](README.md) revalida `main`, incorpora fuentes oficiales de MFP y crea REQ-265..273 sin entrevistas. Este texto conserva el diagnóstico anterior y no determina la cola vigente.

**Estado en aquella ejecución: comparación de producto provisional; Evolv verificado localmente, MyFitnessPal sin inspección contemporánea.** Convenciones y fuentes: [FUENTES.md](FUENTES.md). El inventario completo se entrega en [48 dimensiones](matriz.csv).

## 1. Conclusión y decisión de producto

La mejor oportunidad para Evolv es unir **decisión, ejecución y registro**. Ya prepara comidas, protege restricciones, ofrece alternativas y guía el entrenamiento. Su punto más débil aparece cuando el usuario come algo distinto, repite un producto habitual o quiere entender qué está cambiando con el tiempo. Resolverlo puede aumentar su valor más que agregar otra forma de generar planes.

MyFitnessPal sirve como referencia de registro nutricional generalista: un diario, búsqueda de alimentos, porciones y reutilización de lo ya registrado (H). Es una base competitiva importante porque el usuario come varias veces al día y el coste de registrar se repite todos los días. Su posible oferta actual de planificación debe revisarse: el repositorio menciona Premium+ (R). La tesis de junio de «MFP deja todo el trabajo de decidir» **no debe reutilizarse como afirmación actual**.

Recomendación: construir para adultos de habla española, principiantes/intermedios que quieren comer mejor y entrenar fuerza con menos carga mental. Mantener un modo eficiente para quienes ya conocen macros. Validar primero Perú/LatAm, sin afirmar que los datos de un seed equivalen a cobertura local real. El segmento y mercado proceden de la estrategia del repo; su demanda todavía debe medirse.

«Igual o más valor» tiene tres condiciones: resolver al menos tan bien las tareas indispensables del segmento, aportar una ventaja que ese segmento valore y sostenerla sin más coste, errores o trabajo cotidiano. No requiere igualar una red social global ni una base mundial antes de probar el producto. Tampoco permite declarar superioridad por tener un chat o más funciones en un menú.

## 2. Trabajos que el usuario contrata

| Trabajo | Criterio de éxito | Referencia MyFitnessPal | Evolv hoy | Consecuencia |
|---|---|---|---|---|
| Saber qué y cuánto comió | Registro suficiente, corregible y rápido | Diario y alimentos reutilizables (H) | Plan: rápido; comida libre: descripción + cuatro valores o estimación (E02/E03) | Brecha prioritaria de uso diario |
| Decidir qué comer esta semana | Plan viable, presupuesto, compras y cambios | Planificación contemporánea por verificar (R/P) | Planner, restricciones y compras derivadas (E04–E06) | Diferencia potencial; acceso y ejecución incompletos |
| Entrenar sin adivinar | Rutina, dosis, técnica y registro de ejecución | Alcance de entrenamiento actual no verificado (P) | Sesión guiada con bloques, series y feedback (E08) | Ventaja propia que vale la pena preservar |
| Continuar cuando cambia el día | Adaptar sin rehacer todo ni perder historia | Flujos actuales por observar (P) | «Solo 20 min», casa, sin equipo, cambios de comida (E06/E08) | Hacerlo visible y consistente; no inventarlo desde cero |
| Entender si está funcionando | Tendencia comprensible y próxima decisión | Peso/reportes de nutrición (H) | Peso semanal, adherencia y check-in con reglas (E09/E10) | Falta síntesis por tendencia y mejor historial de rendimiento |
| Cambiar de herramienta sin perder confianza | Datos portables, errores recuperables | Exportación según plan por verificar (H/P) | Exportación JSON y borrado propios; sin importador identificado (E12) | Coste de cambio por atender |

## 3. Descomposición funcional de MyFitnessPal

Esta sección explica qué valor aporta la categoría de producto conocida de MyFitnessPal y qué hay que contrastar; no describe una sesión observada en su versión de octubre de 2026.

### 3.1 Diario nutricional y registro

La cadena de valor es buscar → distinguir el alimento correcto → elegir una cantidad → registrar → corregir/reutilizar. Cada eslabón importa. Una base extensa permite encontrar más productos, pero resultados duplicados, nombres ambiguos o una porción mal entendida pueden invalidar un registro. Son **riesgos a evaluar**, no una tasa de error medida de MFP.

El benchmark histórico incluye búsqueda, registros de alimentos propios, recetas, comidas guardadas, recientes/favoritos, copia y registro rápido (H). Código de barras reduce la identificación de un producto envasado; no confirma que la base tenga la etiqueta correcta ni la cantidad consumida. Sus permisos de pago, países y plataformas deben comprobarse. No se puede prometer paridad simplemente mostrando una cámara.

Para Evolv, el flujo libre actual es adecuado si el usuario conoce kcal, proteína, carbohidratos y grasa, o acepta una estimación. Es débil para «comí el mismo yogur que ayer». Tampoco se encontró un constructor de recetas de usuario con rendimiento y porciones, aunque sí hay catálogo de recetas y editor de comidas. No confundir esos objetos.

### 3.2 Información nutricional y objetivos

El valor histórico de MFP incluye balance de calorías/macros y análisis nutricional más amplio, con permisos variables (H). Comparar fibra, sodio, azúcares, grasa saturada y otros nutrientes exige verificar qué muestra cada plan y si su base los informa; un campo vacío no equivale a cero.

Evolv tiene calorías/macros y fórmulas personalizadas. El modelo base de ingredientes contiene kcal/proteína/carbohidratos/grasa por 100 g; no se identificó un diario de micronutrientes en el producto revisado (E07). Es una brecha real para quien necesita calidad nutricional más allá de macros. No debe cerrarse rellenando campos desconocidos con ceros ni sugiriendo consejo clínico automático.

Las necesidades más inmediatas son unidades comprensibles, cantidades decimales, distinguir peso crudo/cocido y procedencia del número. Añadir 30 nutrientes sin mejorar esto daría más apariencia de precisión que valor.

### 3.3 Planificación, recetas y compras

No usar «tener planes» como prueba de exclusividad de Evolv. El antecedente Premium+ en la estrategia obliga a revisar planificación, recetas, compras, mercados y nivel de personalización de MFP (R/P).

Evolv ya calcula la semana y compras por ingredientes; guarda el snapshot y conserva restricciones. La oportunidad concreta es convertirlo en una herramienta de ejecución: recuperar compras después de aplicar, ajustar número de comensales, descontar lo que hay en casa, marcar comprado y mostrar preparación. La receta visible actual se centra en ingredientes y gramos, sin un método culinario paso a paso (E07). Un principiante puede saber qué ingredientes usar y aun no saber cocinar el plato.

Escalar porciones no garantiza que una receta siga funcionando al cocinarse. El cambio de rendimiento, tiempos y equivalencias necesita validación de recetas. El motor de macros existente debe reutilizarse sin alterar lo consumido en el pasado.

### 3.4 Actividad, entrenamiento y dispositivos

MFP ha permitido registrar actividad y conectarse con servicios/dispositivos (H); sus integraciones vigentes y sentido de sincronización requieren verificación. Registrar «ejercicio» no prueba que genere una programación de fuerza con dosis y guía. A su vez, no inspeccionar su app impide afirmar que hoy carece de esas capacidades.

Evolv sí demuestra programación y sesión guiada. Tiene prescripción, temporizadores, registro de series y esfuerzo; el siguiente salto es usar el historial de cada ejercicio de forma legible, explicar la progresión y adaptar por rendimiento/recuperación con confirmación. La progresión por fase o semana ya existente no equivale a una progresión individual validada a partir de carga/repeticiones anteriores.

No se encontraron integraciones de salud o wearables. Es una brecha de automatización, pero HealthKit/Health Connect no se conectan de manera general desde una PWA con un simple permiso web. Hará falta evaluar wrapper/nativo o un servicio con API autorizada. Evitar prometer una integración que no cabe en la plataforma actual.

### 3.5 Seguimiento, adherencia y retención

Peso, reportes, rachas, recordatorios, contenido y funciones sociales pueden apoyar el hábito (H; disponibilidad actual pendiente). Su valor depende del objetivo: una racha puede motivar o castigar una pausa normal; una cifra de calorías puede orientar o fomentar una precisión engañosa.

Evolv ya tiene rachas, adherencia, ciclos/fotos, recordatorios y check-in. El hueco no es «crear seguimiento», sino explicar «qué cambió, por qué importa para mi objetivo y qué acción tiene sentido ahora». El check-in usa reglas sobre peso semanal, hambre, energía y recuperación; no es una estimación adaptativa continua del gasto. Ampliarlo requiere distinguir falta de registro de falta de consumo y suavizar ruido de peso antes de ajustar objetivos.

### 3.6 Modelo comercial, confianza y soporte

MFP históricamente ha usado niveles gratuito y de pago, con disponibilidad variable de funciones y publicidad (H). No se verificaron precios, anuncios, prueba gratuita, cancelación ni paquete actual en Perú. Los precios de junio en el repo no sirven para un pricing actualizado.

Evolv tiene entitlement, cuotas de funciones, catálogo, checkout y administración. Su funcionamiento comercial en producción no se comprobó aquí. La diferenciación propuesta es ofrecer herramientas básicas fiables de registro y reutilización sin obligar a pagar cada vez que se anota una comida, y cobrar por planificación, adaptación y acompañamiento que reduzcan trabajo. Debe contrastarse con coste real y disposición a pagar, no fijar un precio por intuición.

Privacidad y portabilidad son parte del producto. Evolv ya exporta y borra; no es una carencia total. Faltan formatos útiles para revisar el historial y una importación opcional que reduzca el coste de cambiarse. No puede prometerse importar datos de MFP sin obtener un archivo de muestra real y permiso del usuario.

## 4. Comparación condensada

La tabla completa y su estado de evidencia están en `matriz.csv`. «Ventaja potencial» indica que la capacidad de Evolv está comprobada y la superioridad competitiva todavía no.

| Área | Evolv comprobado | Brecha o mejora | Prioridad |
|---|---|---|---|
| Acceso | Auth, recuperación y mensajes traducidos | Reenvío/estado de confirmación y recuperación autónoma; el caso de Diego demuestra fricción real, no diagnóstico actual del servidor | P0 |
| Registro libre | Manual, texto, voz según navegador, foto con aclaraciones | Recientes/favoritos/copiar; buscador y productos de marca | P0–P1 |
| Calidad de datos | Cálculo por ingrediente y snapshots | Procedencia, unidades, nivel de revisión y desconocidos explícitos | P0 |
| Código de barras | No identificado | Catálogo GTIN por mercado, validación de etiqueta, captura compatible y código manual | P1 condicionada a cobertura |
| Recetas propias | Catálogo y editor de valores | Constructor con ingredientes, rendimiento, porciones y preparación | P1/P2 según demanda |
| Planner | Días/semanas, restricciones, reemplazos y protección de registros | Acceso al plan activo, personalización y compra ejecutable | P1 |
| Entrenamiento | Guía completa y adaptaciones de contexto | Historial por ejercicio y próxima carga explicada | P1 |
| Progreso | Peso semanal, adherencia y check-in | Tendencia, datos suficientes, síntesis y acciones | P1 |
| Nutrientes | Calorías/macros | Fibra/sodio y datos faltantes sin falsos ceros | P2 |
| Integraciones | No identificadas | Wearables/salud, deduplicación y arquitectura compatible | P2 |
| Portabilidad | Exportación JSON, borrado | CSV legible/importación validada por archivo | P2 |
| Comunidad | No identificada | No construir red social sin probar que resuelve un problema prioritario | P3 |

## 5. Evaluación de usabilidad por tareas

### Método y límites

Se inspeccionaron 14 estados de Evolv en Chromium con móvil táctil de 390 × 844 y escritorio de 1440 × 900, usando red simulada y datos ficticios. Se ejecutaron además 11 E2E existentes. Los conteos siguientes son pasos observados, no tiempos humanos. No se obtuvieron métricas equivalentes de MFP, así que no se calculó una puntuación ganadora ni una diferencia de velocidad.

| Tarea | Observación de Evolv | Implicación | Cambio propuesto |
|---|---|---|---|
| Registrar un snack conocido | Desde Nutrición: abrir editor, llenar cinco campos y guardar; el extra se consume inmediatamente | Poco coste de navegación, mucho trabajo de recordar números | Recientes + cantidad; CTA «Registrar»; explicar estado consumido |
| Consumir lo planificado | Preparar → revisar/aplicar → marcar comida; marcar una ya preparada requiere un toque | Buena base; conservar separación plan/consumo | Mantener registro de un toque y añadir corrección visible de cantidad |
| Registrar comida en lugar de la planificada | El editor libre dice «Agregar comida / snack» y crea un extra; sustituir está en «···» de la comida | Riesgo de registrar como adicional algo que era reemplazo | Elegir «En lugar de…» o «Además de…»; mostrar impacto antes de guardar |
| Volver a una comida habitual | Sin acceso identificado a recientes/favoritos/copia; existen preferencias de ingredientes, que son otra cosa | Repetición obliga a repetir trabajo | Comidas habituales reutilizables con edición, sin modificar el origen |
| Encontrar compras de la semana | Las compras están en revisión de borrador; no se vio entrada en «Más opciones» | Capacidad existente pierde valor al cerrar el modal | Acceso persistente al plan activo y lista por semana |
| Cocinar un plato | La ficha contiene cantidades; no muestra una preparación paso a paso | El plan no resuelve toda la ejecución para principiantes | Método probado, tiempo, utensilios y equivalencia crudo/cocido |
| Iniciar el entrenamiento | «Iniciar sesión guiada» funciona y muestra bloque actual | Valor concreto y visible | Conservar; mejorar resumen y recuperación al volver a la app |
| Interpretar evolución | Peso/adherencia/ciclos están separados; primer estado pide peso | No resume la próxima decisión y prioriza la báscula incluso si interesa fuerza | Resumen según meta con señales suficientes, sin exigir peso para valorar entrenamiento |
| Corregir un error de entrada | Se mantiene exportación/historial y edición de extras; borrar extra usa confirmación | Flujo posible, pero no hay deshacer uniforme | Deshacer no destructivo y confirmación solo donde haga falta |
| Añadir foto | El preview aparece como imagen rota antes de elegir foto en la captura | Reduce confianza antes de usar la función | Respetar `[hidden]`, validar archivo y conservar campos si falla |

### Jerarquía y carga cognitiva

Las cinco pestañas Hoy/Nutrición/Entreno/Progreso/Perfil son reconocibles y reducen ambigüedad. Hoy ya prioriza agenda; no hace falta sustituir la navegación completa. La tipografía, contraste y controles se beneficiaron de la auditoría anterior; este trabajo no encontró desbordamiento horizontal en los estados inspeccionados. Esto no certifica accesibilidad completa, todas las pantallas ni dispositivos reales.

En Nutrición, cada tarjeta puede tener estado, alternativa, vuelta al plan, menú y dos controles de orden. Repetidos, ocupan espacio antes de ver la siguiente comida. Propuesta: principal «Registrar»/«Registrada», alternativa contextual y menú para orden/acciones menos frecuentes. Mantener reordenado accesible sin arrastre obligatorio. No ocultar el acceso rápido al registro libre detrás del último elemento de una lista larga.

«Prot g / Carb g» y pedir cuatro cifras ayudan al usuario experto pero no al principiante. Mostrar nombres completos, porción y procedencia primero; permitir detalle. Evitar que «Guardar» signifique a veces planificar y otras consumir sin explicarlo. Diseñar estados claros de planificado, consumido, saltado y estimado; registrar y planificar son acciones distintas.

En entrenamiento, la sesión ocupa una vista más larga y el inicio mueve el foco visual al bloque. No se midió un fallo de rendimiento ni de reanudación en dispositivo real. Deben validarse con pantalla bloqueada, pérdida de red y retorno desde segundo plano antes de anunciar la guía como totalmente equivalente a una app nativa.

### Recuperación y confianza

El error de confirmación mostrado por el usuario ilustra una falla de servicio del recorrido: traducirlo es necesario, pero no entrega la confirmación ni da una salida autónoma. La solución incluye reenvío con límites, estado claro, cambio de correo cuando corresponda y soporte. No usar un UPDATE manual de producción como flujo normal de activación.

Hay además un riesgo técnico de confianza: `aiEstimate()` prepara un fallback genérico de 500 kcal y macros de referencia para cualquier descripción. La rama `reuse` del servidor admite un fallback compatible (E19). No se probó que esté ocurriendo a usuarios reales, pero debe cerrarse antes de vender precisión: si no puede estimar esa comida, conservar datos del usuario y explicar que faltan valores; no convertir una plantilla en análisis específico.

Actualmente `saveEditor()` conserva los números finales y la descripción; no guarda en ese objeto el origen, supuestos y método de la estimación. Una corrección manual y una receta calculada pueden acabar con apariencia similar. La trazabilidad debe acompañar al registro; no basta con una nota temporal en el modal.

### Las diez heurísticas, aplicadas sin puntuación ficticia

| Heurística | Evidencia/lectura de Evolv | Qué observar en MyFitnessPal antes de compararlo |
|---|---|---|
| Estado visible | Totales, comidas hechas y avance de sesión visibles; estados remotos dependen del servicio | ¿Distingue guardar, sincronizar, estimar y completar? ¿Qué ocurre sin red? |
| Lenguaje del usuario | Pestañas claras; «Prot g», «slots» y «check-in» pueden exigir conocimiento | Nombres de unidades, comidas y datos en español local; consistencia de traducción |
| Control y salida | Cambios se revisan antes de aplicar; editar/saltar/restaurar disponibles; deshacer no uniforme | Cancelar búsqueda/escaneo, deshacer registro y corregir día equivocado |
| Consistencia | Patrón común de tarjetas; «Guardar» puede significar registrar o editar un plan | Mismo alimento y cantidad significan lo mismo entre búsqueda, receta y diario |
| Prevención de errores | Restricciones y versiones son fortalezas; agregar en vez de sustituir queda ambiguo | Porción por defecto, crudo/cocido, etiquetas duplicadas y confirmación de cantidad |
| Reconocimiento | Agenda y plan reducen memoria; editor libre pide recordar cuatro números | Recientes/favoritos, contexto de búsqueda y datos necesarios antes de elegir |
| Eficiencia | Un toque para comida preparada; sin reutilización rápida libre identificada | Repetición, copia, edición masiva, comportamiento experto y nuevos usuarios |
| Minimalismo | Home prioriza el día; controles de orden repetidos consumen espacio | Densidad de diario, upsells/anuncios y acción principal; no asumir que aparecen siempre |
| Recuperación de errores | Error traducido localmente, pero acceso requiere salida de confirmación; estimación necesita fallo honesto | Mensaje, causa útil, estado conservado y alternativa tras error |
| Ayuda en contexto | Guía técnica y explicación de macros; preparación culinaria incompleta | Ayuda para porciones, discrepancia de etiqueta, soporte y recuperación de cuenta |

Estas observaciones no son una certificación ni una evaluación de severidad completa del producto. No se agregan a una nota de MFP: hacerlo sin observarlo produciría una comparación falsa.

### Personas y condiciones de uso

| Persona/situación | Riesgo observado o por comprobar en Evolv | Diseño de respuesta |
|---|---|---|
| Principiante que no conoce macros | Editor pide cifras que no sabe; receta sin método suficiente | Porción, búsqueda guiada y receta ejecutable; estimación identificada como tal |
| Intermedio que repite desayunos | No ve biblioteca de consumos recientes; repetir exige trabajo manual | Recientes, favoritos y copia con cantidad ajustable |
| Usuario comiendo fuera con una mano | Acción de registro al final de la lista y varios controles por tarjeta | Registro accesible desde el primer viewport sin tapar contenido; salida de sustitución clara |
| Usuario con baja visión o lector | Esta revisión no probó VoiceOver/TalkBack ni zoom extremo; no inferir aprobación por screenshots | Conservar semántica/foco y probar estados nuevos con lector, zoom y contraste |
| Conexión débil, viaje o cambio de teléfono | Shell offline no resuelve estimaciones/búsqueda remota ni garantiza recuperabilidad del nuevo flujo | Recientes cacheados por usuario, estados de pendiente, reintento idempotente y fecha/zona visibles |
| Persona centrada en rendimiento o mantenimiento | Primera pantalla de progreso enfatiza peso | Progreso según objetivo: rendimiento, consistencia y bienestar sin exigir un peso diario |

Para entradas móviles, validar teclado decimal con coma, autocorrección, teclado que cubre el botón y retorno desde cámara. Para acceso y paywall, preservar datos tras error y explicar la próxima acción. Son escenarios de verificación propuestos; no se afirma haber probado todos en iPhone físico.

## 6. Principales brechas, ordenadas por impacto

1. **Acceso recuperable y datos creíbles.** Un usuario bloqueado no recibe valor. Un dato arbitrario presentado como estimación daña confianza y afecta objetivos. Resolver antes de escalar adquisición.
2. **Registro repetitivo demasiado manual.** La ventaja de planificar desaparece si el día real exige otra app. Recientes, porciones, alimentos propios y corrección necesitan formar un flujo único.
3. **Cobertura de alimentos y productos del mercado objetivo.** El seed curado resuelve recetas del planner; no cubre automáticamente yogures, pan de marca o menús reales. Medir búsquedas y catálogo, no perseguir un número global de entradas.
4. **Plan activo difícil de ejecutar y recuperar.** Compras persistentes y preparación culinaria completan una capacidad que ya existe. Es una oportunidad de alto aprovechamiento del trabajo previo.
5. **Adaptación explicada, sostenida por datos suficientes.** Evolv tiene check-in y contingencias, pero puede conectar mejor plan real, adherencia y rendimiento. Preservar aceptación explícita y futuro; no castigar días sin datos.
6. **Rendimiento de fuerza legible.** El reproductor es una ventaja funcional; historial y próxima dosis la convierten en acompañamiento continuo.
7. **Coste de cambio e integración.** Historial importable y dispositivos pueden retener a usuarios sofisticados. Invertir según evidencia; no bloquear mejoras básicas esperando un wrapper nativo.

## 7. Dónde Evolv puede ofrecer más valor

| Segmento/situación | Promesa verificable propuesta | Evidencia necesaria para decir que aporta más valor |
|---|---|---|
| Principiante que no sabe qué comer | Una opción viable y receta ejecutable con compras accesibles | Completar compra/preparación sin ayuda; preferencia y uso sostenido |
| Persona que entrena y come distinto al plan | Registrar o sustituir sin desordenar el resto del día | Menor tiempo y menos duplicados; historial intacto |
| Usuario con poco tiempo/equipo | Adaptar la sesión conservando seguridad e intención | Completar sesión adaptada y entender qué cambió |
| Intermedio que registra fuerza | Ver lo anterior y una siguiente dosis razonada | Menos trabajo entre series y aceptación del ajuste |
| Usuario que quiere apoyo continuo | Revisar la semana y acordar un ajuste comprensible | Entender causa, tener opción de mantener y continuar cuatro semanas |

No prometer más pérdida de grasa, más hipertrofia ni resultados de salud que MFP sin un estudio apropiado. La comparación inicial debe demostrar facilidad, confianza, ahorro de decisiones y continuidad, que sí pueden probarse con un estudio de producto pequeño.

## 8. Qué no copiar por inercia

- Una red social y retos públicos antes de validar que ayudan al segmento. Elevan moderación y exposición de datos.
- Un catálogo enorme sin procedencia, deduplicación y porciones comprensibles. Cobertura y confianza deben crecer juntas.
- Precisión aparente de la foto. Mostrar supuestos y permitir corrección; no fabricar un porcentaje de confianza.
- Comer automáticamente todas las calorías «quemadas». Evitar doble conteo con actividad incluida en las metas y con varios dispositivos.
- Onboarding largo antes del primer resultado. Reducir lo opcional; mantener edad, restricciones y seguridad donde son necesarias.
- Un rediseño visual total. Las brechas prioritarias son de tarea, datos y continuidad.

## 9. Decisiones abiertas

Validar el nivel y país reales de MFP, el ICP con mayor disposición a pagar, cobertura local de productos, costes/licencias, acceso al dispositivo y tres tareas de mayor frecuencia. Estos datos pueden cambiar el orden de códigos de barras, recetas propias, tendencias y wearables. El [PLAN](PLAN.md) incluye puertas de decisión y un guion para resolverlas sin convertir cada hipótesis en una funcionalidad aprobada.
