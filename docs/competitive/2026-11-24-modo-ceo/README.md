# Demo de CEO App (Modo CEO Fitness) frente a Evolv: qué adoptar en la app del alumno

**24 de noviembre de 2026 · Pedido de Jonathan:** «copiemos la UX y simplicidad de esta demo en la parte de alumnos; tomar lo mejor y adaptarlo a nuestra app» (`https://demo.modoceofitness.com/#demo`).

En Evolv, «alumno» es la persona que usa la app (no hay un panel de coach humano). Este informe compara la app del alumno de la demo con la PWA de `main` `4517ba3` y convierte lo adoptable en la serie **REQ-415..421**. El estado operativo de cada REQ vive en `REQUIREMENTS.md`.

## Método y límites

- La demo se abrió en Chromium (Playwright) con sus datos ficticios: `?abrir=cliente` carga la app del alumno dentro de un marco de 390×807. Se recorrieron las cinco pestañas, el detalle de entreno, el reproductor (serie de fuerza, serie por tiempo y descanso) y las hojas de agua, pasos, suplementos y cardio. No se creó cuenta ni se envió nada: la demo no guarda.
- Evolv se recorrió con los fixtures E2E (`tests/e2e/helpers.js`, 390×844, sin red externa).
- No se copian marca, nombres, logotipo, colores, fotos, videos ni textos de la demo: solo patrones de interacción. Evolv conserva su identidad (REQ-180: lima `--accent`, Unbounded/Manrope).
- No se guardan capturas de la demo en el repositorio. Las citas entre comillas son textos de su interfaz, para describir el patrón.

## Lo que hace simple a la demo

1. **Hoy es una lista.** «Plan de hoy» muestra todo lo del día en una sola columna: cada actividad es una fila con un ícono de color por tipo unido a los demás por una línea vertical, un título, **una línea de estado concreta** («0 de 10.000 · cárgalos a mano», «Mañana: 3 · Noche: 1») y un chevron. No hay botones dentro de la tarjeta de inicio ni mensajes que compitan.
2. **El avance se ve y es honesto.** Una barra segmentada (un tramo por actividad), «Te faltan 8 actividades para cerrar el día.» y «0/8» en cifras monoespaciadas. Debajo, «Esta semana»: siete barras L–D, «50 % cumplido» y la regla escrita: «Cuenta las tareas hechas sobre las que ya tocaban hasta hoy: 8 de 16.», más «Semana pasada: 100 % · 3 de 3».
3. **Registrar cuesta uno o dos toques y no saca de la pantalla.** Agua, pasos, suplementos y cardio se marcan en una hoja inferior sobre Hoy (vasos de 250 ml, anillo de pasos, casillas por momento con «Marcar todo», «Marcar como hecho»).
4. **El entreno se ejecuta en modo foco.** Antes de empezar: resumen «9 ejercicios · 4 bloques · 60-75 min · 21 series», elección «Guiado / Lista», bloques numerados y, por ejercicio, miniatura, dosis, «Anterior: 60 kg × 10» y «Sugerido hoy: 62,5 kg». Durante: una serie por pantalla, dos campos grandes ya llenos (kilos y repeticiones), un solo botón «Registrar serie», y el descanso a pantalla completa con anillo, «−15 s / +15 s / Saltar», «Sigue: …» y «Editar la serie anterior». Lo secundario (nota técnica, sustituir, comentario, molestia) son chips pequeños.
5. **La comida es una tarjeta que se puede comer.** Cada comida trae sus opciones («Opción 1/2/3»), sus ingredientes con gramos y kcal, «Cambiar» por línea, P/C/G en una fila y un único «Registrar».
6. **Progreso muestra una métrica a la vez.** Selector de métrica, cifra grande, gráfico, cuatro números (Inicio, Actual, Cambio, Registros), una frase que baja la ansiedad («El peso es una referencia más: míralo junto con tus medidas y tus fotos.») y la lista de registros con su diferencia.
7. **Perfil resume antes de configurar.** Tarjeta con inicial, nombre, plan y fecha de inicio, tres cifras (altura, semana del plan, cumplimiento) y filas con su estado actual («Los 5 encendidos · entreno a las 06:45», «Último: domingo 15/11»).
8. **Lenguaje visual.** Fondo negro, tarjetas con borde fino, un color por tipo de actividad, números en monoespaciada, títulos grandes y una sola acción llamativa por pantalla de ejecución.

## Evolv hoy, en los mismos puntos

| Punto | Evolv en `main` | Brecha |
|---|---|---|
| Hoy | Tarjeta «¿Qué comiste hoy?» con botón lima, fila de entreno, fila de menú sugerido, «Resto del día» plegado, coach con tres preguntas y Avisos (`renderHoy`, `homeAgendaHtml`, `app/index.html:5841`). | Las comidas y el entreno no se ven como una lista con avance; lo pendiente queda plegado. |
| Semana | El cumplimiento semanal solo aparece en el check-in y en la lista de Progreso. | No hay lectura rápida de la semana en Hoy. |
| Reproductor | Seis tarjetas de dosis, texto de carga, todas las series abiertas con tres campos (repeticiones, carga, esfuerzo) y el menú de tabs visible (`renderStrengthSet`, `app/index.html:7455`; `renderWorkoutTimer`, `:7441`). | Mucho a la vista mientras se entrena; registrar una serie exige escribir en varios campos. |
| Vista previa | «Qué vas a hacer hoy» con dosis por ejercicio, más banners de personalización, «Adaptar hoy», actividad registrada, vista previa de ejercicios y resumen en la misma pestaña (`renderWorkout`, `app/index.html:8265`). | La acción «Iniciar entreno» compite con siete bloques. |
| Comida | «Nada registrado», «Registrar», «Ver opciones», «···» y flechas de orden por comida (`mealCard`, `app/index.html:8395`). | El plato y sus ingredientes no son la tarjeta; hay cuatro controles por comida. |
| Progreso | CTA de peso, «Tus números», «Racha», «Tus ciclos», peso por semana con campos y lista semanal (`renderProgress`, `app/index.html:8597`). | No hay una vista de evolución con cifras de inicio, actual y cambio. |
| Perfil | Ocho acordeones con título y «+», sin estado (`renderProfile`, `app/index.html:9698`). | Para saber si los recordatorios están activos hay que abrir cada sección. |

## Qué adoptamos y cómo se adapta

| Patrón de la demo | En Evolv | REQ |
|---|---|---|
| Plan de hoy con línea de tiempo, barra segmentada y «Te faltan N» | Entreno y cada comida del día como filas, ordenadas por hora (comidas por su horario; el entreno por `preferredTrainingTime`). La siguiente pendiente lleva la única acción lima. Registrar una comida planificada es un toque. | REQ-415 |
| «Esta semana» con barras L–D y regla explícita | Comidas registradas + entreno hecho sobre lo que ya tocaba desde el lunes (o desde el inicio del plan). Descanso y comidas saltadas no cuentan. | REQ-416 |
| Reproductor de una serie a la vez | Pantalla de foco: una serie, carga y repeticiones precargadas (última vez o sugerencia de REQ-409), «Registrar serie», descanso a pantalla completa con «Sigue» y «Editar la serie anterior». El esfuerzo pasa a opcional. | REQ-417 |
| Vista previa por bloques con «Anterior» y «Sugerido hoy» | Bloques numerados (calentamiento, principal, vuelta a la calma) con miniatura, dosis y «La última vez» / «Hoy» por ejercicio; «Iniciar entreno» fijo abajo; personalizar y adaptar en «···». | REQ-418 |
| Comida como tarjeta con líneas y un solo «Registrar» | Plato con ingredientes (gramos · kcal), «Cambiar» por línea cuando hay receta, P/C/G en una fila y un botón «Registrar». Saltar y ordenar pasan a «···». | REQ-419 |
| Progreso por métrica | Peso (y cintura/grasa si hay datos): cifra, gráfico, Inicio/Actual/Cambio/Registros, frase de contexto y registros con diferencia. | REQ-420 |
| Perfil con resumen y filas con estado | Tarjeta con nombre, ciclo y semana, cumplimiento de la semana; cada sección muestra su estado actual en una línea antes de abrirla. | REQ-421 |

## Qué no adoptamos (y por qué)

- **Coach humano** (mensaje del día firmado, formularios, chat con el coach, «el objetivo que fijó…»): Evolv no tiene coach humano. Nuestro coach mantiene su lugar y REQ-31 sigue mandando: nada de IA, modelos ni cuotas en la UI.
- **RIR, RM y jerga de bloques** («tipo IIa», «RIR 1»): REQ-400 y REQ-409 piden textos sin jerga.
- **Agua, pasos y suplementos**: son funciones nuevas, no simplificación. Quedan como candidatas; si se aprueban, usan la misma hoja inferior y entran como filas del Plan de hoy.
- **Cambiar las pestañas a Hoy / Agenda / Progreso / Biblioteca / Perfil**: en la demo Nutrición y Entreno se abren desde Hoy. Cambiar la navegación afecta a todos los recorridos y al tour; es una decisión de producto de Jonathan. Esta serie no toca las pestañas.
- **Marca, colores, tipografía y fotos de la demo**: Evolv conserva su identidad. Se adopta el principio de un color por tipo de actividad para los íconos del Plan de hoy, con tonos propios.

## Orden de implementación

1. REQ-415 y REQ-416 (Hoy): mayor impacto diario, sin cambios de datos. **Implementados en esta rama.**
2. REQ-417 (reproductor) y REQ-418 (vista previa). REQ-418 muestra «Hoy» cuando exista REQ-409; antes, solo «La última vez».
3. REQ-419 (comida), REQ-420 (progreso) y REQ-421 (perfil), independientes entre sí.

Todos son de interfaz: no cambian esquemas, no agregan dependencias ni llamadas pagadas y no envían datos nuevos a analytics.

## Diseño de REQ-415 y REQ-416 (implementado)

**Plan de hoy** (`homeAgendaHtml` → sección `.home-primary.day-plan`):

- Encabezado «Plan de hoy». Debajo, una barra con un tramo por actividad que cuenta (`role="progressbar"`), «Te faltan N para cerrar el día.» y «x/N» en monoespaciada. Con todo hecho: «Todo listo por hoy».
- Filas en orden horario. Entreno: hora según `preferredTrainingTime` (mañana 07:00, mediodía 12:30, tarde 17:30, noche 19:30); con horario flexible va primero. Comidas: su hora y el orden elegido por la persona (REQ-125). Las comidas saltadas no aparecen.
- Cada fila: punto de color por tipo (entreno, comida, descanso, pausa) con check al terminar, título, una línea de estado y, si queda algo por hacer, una sola píldora: «Registrar» (comida planificada: la marca hecha; comida vacía: abre el registro de esa franja), «Iniciar entreno», «Continuar entreno», «Registrar actividad» o «Completar evaluación».
- La primera fila pendiente lleva la píldora lima; las demás, neutras.
- No cuentan: descanso, pausa por seguridad. El día está cerrado cuando todo lo que cuenta está hecho y hay al menos una comida registrada.
- Debajo de la lista: «Registrar comida» (algo fuera de las franjas) y la fila de menú sugerido cuando corresponde. El resumen de consumo sigue antes del plan (REQ-364) y el resto de Hoy (un mensaje, Avisos, coach) no cambia (REQ-392).

**Esta semana** (`homeWeekHtml`):

- Siete barras L–D; cada barra se llena según lo hecho sobre lo que tocaba ese día. Hoy se marca; los días futuros y fuera del plan quedan vacíos.
- «N % cumplido» = hechas / las que ya tocaban hasta hoy. Texto: «Cuenta lo que hiciste sobre lo que ya tocaba hasta hoy: 8 de 16.» y, si hay semana anterior dentro del plan, «Semana pasada: N % · a de b».
- Sin nada que tocara todavía (primer día antes de cualquier actividad), la tarjeta no se muestra.
