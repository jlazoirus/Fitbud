# Plan de requerimientos de producto - Fitbud / Fitbros

Este documento es el backlog operativo para Codex y Claude Code. La regla base es:

**Un requerimiento = una implementacion aislada = un commit propio = un push propio.**

No mezclar requerimientos en un mismo commit. Si durante un requerimiento aparece otro problema, anotarlo y dejarlo para otro commit salvo que bloquee directamente el alcance actual.

## Vision del producto

Fitbros debe evolucionar de un planificador de dieta y entrenamiento a un **coach personal con IA** que:

- entiende el objetivo, experiencia, restricciones, preferencias, tiempo y recursos reales de cada usuario;
- propone planes de nutricion y entrenamiento de 4 o 10 semanas que se pueden adaptar sin perder coherencia;
- explica que hacer, como hacerlo y por que, especialmente a personas con poca experiencia;
- aprende de lo ejecutado, del progreso y de los check-ins para ajustar el siguiente paso;
- refuerza la constancia con rachas, hitos y recordatorios utiles, no punitivos;
- convierte esa experiencia en una suscripcion de 1 mes o un paquete de 3 meses;
- protege datos personales, fotos, informacion corporal y acceso a la IA.

La promesa no debe ser "la IA genera texto". La promesa debe ser: **"Siempre tengo una opcion viable para comer y entrenar hoy, se como ejecutarla y mi plan se adapta a mi vida y progreso."**

## Principios de producto

1. **Flexibilidad con estructura.** El usuario puede cambiar comidas, ejercicios, dias y lugar sin romper sus metas ni la progresion.
2. **Explicacion antes que prescripcion.** Cada recomendacion muestra instrucciones, intensidad, alternativas y senales de seguridad.
3. **La IA propone; el sistema valida.** Macros, restricciones, progresion, ejercicios y permisos se validan con reglas deterministas antes de guardar.
4. **Confirmacion antes de modificar.** La IA no cambia un plan activo ni datos del usuario sin mostrar el impacto y recibir confirmacion.
5. **Historial inmutable.** Ajustar el futuro no reescribe lo que el usuario ya hizo.
6. **Motivacion sostenible.** Descansos planificados y dias incompletos no deben convertir la experiencia en castigo.
7. **Privacidad por defecto.** Fotos, salud, progreso, conversaciones y preferencias son privadas por usuario.
8. **Costo controlado.** Toda funcion de IA debe tener limites, trazabilidad, validacion y una alternativa sin IA cuando sea posible.
9. **Tecnologia invisible para el usuario.** La experiencia para usuarios no administradores habla de su coach, plan y opciones; no menciona IA, Claude, modelos, prompts, tokens ni el origen tecnico de una recomendacion.

## Protocolo obligatorio antes de cada requerimiento

Antes de cambiar codigo, el agente debe:

1. Actualizar y confirmar estado:
   ```bash
   git pull --ff-only
   git status --short
   ```
2. Leer el commit anterior completo para entender que se hizo:
   ```bash
   git show --stat --format=fuller HEAD
   git show --name-status --format=fuller HEAD
   ```
3. Revisar el codigo relacionado con el requerimiento. No asumir que el estado es igual al descrito aqui.
4. Implementar solo el requerimiento tomado.
5. Verificar con comandos concretos y, si toca UI, probar en navegador/local.
6. Hacer commit con contexto y push.

Formato recomendado del commit:

```text
REQ-XX: resumen imperativo corto

Contexto:
- Commit previo leido: <hash> <subject>
- Archivos revisados: <lista corta>

Hecho:
- <cambio principal 1>
- <cambio principal 2>

Verificacion:
- <comando o prueba ejecutada>
- <resultado importante>
```

Despues del commit:

```bash
git push origin main
```

## Contexto actual al escribir este backlog

Lee el contexto del app en `CONTEXT.md`, pero confirma siempre el comportamiento real en el codigo y en el commit actual.

El commit actual leido para preparar esta lista fue:

`9e3fa4e Quitar el plan estatico: dia uniforme calculado con IA`

Estado funcional auditado el 14 de junio de 2026:

- Login obligatorio con Supabase Auth, perfiles separados, roles, administracion y cierre de sesion.
- Ciclos personales de 4 o 10 semanas, onboarding, revision cada 28 dias, recap y foto privada al cerrar un ciclo.
- Ya no existe un menu estatico ni tipos de dia PESAS/BAJO/REFEED/DIETBREAK: cada dia parte de slots vacios y se completa con IA, catalogo o edicion.
- Las metas personales de macros son uniformes para todos los dias y sirven como fuente de verdad para Home, Nutricion y generacion con IA.
- Preferencias actuales de entrenamiento: running, cycling o natacion combinados con gimnasio o peso corporal; 3 a 6 dias por semana.
- Preferencias actuales de alimentacion: tipo de dieta, restricciones, alimentos a evitar y nota libre.
- Claude puede estimar y sugerir comidas, revisar macros y generar un dia o una semana de dieta.
- Racha actual basada en cualquier actividad registrada; no distingue cumplimiento nutricional, entrenamiento ni descanso planificado.
- Entrenamientos actuales descritos como texto compacto; no existe catalogo de ejercicios, ejecucion por series ni demostraciones animadas.
- No existe todavia facturacion, entitlement de suscripcion, paywall, recordatorios por correo, check-in semanal adaptativo ni un centro conversacional de coach.
- La fuente de verdad personal es Supabase y `localStorage` actua como cache, pero la sincronizacion sigue siendo last-write-wins sin cola offline.

Cada agente debe volver a leer el commit real que exista en `HEAD` antes de empezar.

## Auditoria de flujos

| Flujo | Estado actual | Brecha principal |
|---|---|---|
| Registro y acceso | Login, registro, reset y admin disponibles | Falta relacionar acceso con suscripcion y ofrecer una muestra clara antes del pago |
| Onboarding | Calcula macros, objetivo, deporte, fuerza, dias, duracion y restricciones | Faltan numero de comidas, horarios, presupuesto, cocina, dias exactos, duracion por sesion, equipamiento, experiencia y limitaciones |
| Home diario | Muestra macros, dieta, entrenamiento y racha | Falta priorizacion inteligente, estado del dia, proxima accion y contingencias |
| Nutricion | Recetas, macros, checks, reemplazos y generacion IA diaria/semanal | Falta plan por numero de comidas, opciones equivalentes, lista de compras, contexto de presupuesto/tiempo y versionado |
| Entrenamiento | Plan combinado y reemplazo de sesion | Falta detalle para principiantes, series ejecutadas, cargas, temporizadores, sustituciones y GIF animado por ejercicio |
| Adaptacion | Revision manual cada 4 semanas y nuevo ciclo | Falta check-in semanal y ajustes graduales segun adherencia, hambre, energia, recuperacion y rendimiento |
| Progreso | Peso, grasa, entrenos, adherencia, racha, recap y fotos | Falta comparar tendencias, hitos y explicar que cambio en el plan |
| Motivacion | Racha simple visible | Falta definir rachas justas, descansos, metas semanales, hitos y recuperacion de constancia |
| Recordatorios | No existe | Falta programacion por zona horaria, consentimiento, deduplicacion y envio solo si hay acciones pendientes |
| Suscripcion | No existe | Falta oferta de 1/3 meses, checkout, webhooks, entitlement, renovacion, cancelacion y expiracion |
| Seguridad y privacidad | Auth, RLS y fotos privadas | Faltan consentimiento de salud/fotos/correos, exportacion, borrado, retencion y guardrails de entrenamiento |
| Operacion | Admin de usuarios y catalogo de alimentos | Faltan contenidos de ejercicios, media, prompts/versiones, soporte, metricas de IA y costos |
| Lenguaje y consumo | La UI actual expone botones y mensajes con "IA" y no limita generaciones | Falta vocabulario de coach, cuota diaria server-side y reutilizacion controlada de opciones |
| PWA y sincronizacion | Instalable, cache y safe areas de iPhone | Falta cola offline, conflictos, recuperacion ante fallos y pruebas end-to-end de journeys |

## Journey objetivo

1. El visitante entiende la oferta, crea su cuenta y conoce que incluye cada paquete.
2. Completa un onboarding flexible de cuerpo, objetivo, alimentacion, disponibilidad y entrenamiento.
3. El sistema calcula metas y genera un plan inicial validado de 4 o 10 semanas.
4. Cada dia Home muestra la proxima accion y permite adaptar comida o entrenamiento a la realidad de ese dia.
5. El usuario ejecuta rutinas guiadas y registra comidas con el minimo esfuerzo.
6. Las rachas y recordatorios refuerzan la constancia sin penalizar descansos programados.
7. Un check-in semanal propone ajustes pequenos y explicados.
8. Cada 4 semanas se revisan preferencias y metas; al finalizar el ciclo se muestra el recap y se inicia el siguiente desafio.
9. La suscripcion controla las funciones premium sin bloquear el acceso al historial personal.

## Orden sugerido

### Base ya construida

1. REQ-01 - Normalizar recetas y cumplimiento de macros.
2. REQ-02 - Usar recetas como fuente visible de cada comida.
3. REQ-03 - Corregir dia inicial, historial de peso y grasa corporal.
4. REQ-04 - Hacer bloques colapsables para movil.
5. REQ-05 - Login simple y modo publico solo lectura para DB e IA.
6. REQ-06 - Persistencia separada por usuario.
7. REQ-07 - Vista admin para usuarios.
8. REQ-08 - Generador de dias de dieta con Claude.
9. REQ-09 - Onboarding de objetivos, macros y preferencias.
10. REQ-10 - Cierre de ciclo, recap y siguiente desafio.
11. REQ-11 - Duracion configurable del plan.

### Fase A - Fundamentos del coach

12. REQ-12 - Perfil flexible de alimentacion y entrenamiento.
13. REQ-13 - Modelo de planes versionados.
14. REQ-14 - Seguridad, consentimiento y privacidad.
15. REQ-15 - Biblioteca de ejercicios y demostraciones animadas.
16. REQ-16 - Reproductor de entrenamiento para principiantes.
31. REQ-31 - Tecnologia invisible, cuotas y reutilizacion de opciones. Implementar antes de REQ-17/REQ-18.

### Fase B - Inteligencia y adaptacion

17. REQ-17 - Generador IA de planes de entrenamiento.
18. REQ-18 - Generador IA de planes nutricionales flexibles.
19. REQ-19 - Reemplazos y modo contingencia.
20. REQ-20 - Check-in semanal y ajuste adaptativo.
21. REQ-21 - Centro conversacional del coach.

### Fase C - Retencion

22. REQ-22 - Home como agenda diaria del coach.
23. REQ-23 - Rachas, consistencia e hitos.
24. REQ-24 - Recordatorios de inactividad por correo.

### Fase D - Monetizacion

25. REQ-25 - Oferta, entitlement y paywall.
26. REQ-26 - Checkout y ciclo de facturacion.

### Fase E - Calidad y escala

27. REQ-27 - Analitica de producto, IA y costos.
28. REQ-28 - Sincronizacion offline y resolucion de conflictos.
29. REQ-29 - Modularizacion incremental y contratos de dominio.
30. REQ-30 - Pruebas end-to-end, accesibilidad y release gates.

REQ-08 debe esperar a REQ-01/REQ-02 y preferiblemente a REQ-05/REQ-06, porque necesita recetas confiables, contexto por usuario y control de acceso a IA.

Los requerimientos REQ-12 a REQ-31 son el backlog recomendado para completar la vision comercial. Las dependencias de cada uno mandan sobre el orden numerico cuando exista una razon tecnica.

---

## REQ-01 - Normalizar recetas y cumplimiento de macros

**Estado: implementado como base de catalogo y validacion.**

### Objetivo

Asegurar que todas las comidas del plan tengan una receta clara con ingredientes y gramos, y que los macros calculados cumplan el objetivo del slot/dia.

### Alcance

- Revisar `supabase/schema.sql`, `supabase/seed.sql` y la logica actual de `buildDay()` en `index.html`.
- Garantizar que cada comida planificada tenga ingredientes con peso en gramos.
- Eliminar o convertir textos ambiguos como "carbo a la mitad", "+50% carbo", "almuerzo libre" o "arroz/pasta + tofu" cuando afecten macros sin receta real.
- Definir variantes solo cuando cambien porcion, numero de comidas o contexto de entrenamiento, sin depender de tipos de dia estaticos.
- Agregar una validacion reproducible, preferiblemente SQL o script simple, que detecte:
  - platos sin ingredientes;
  - ingredientes con gramos invalidos;
  - platos asignados al plan que no existen en recetas;
  - macros fuera de tolerancia para el slot esperado.

### Criterios de aceptacion

- Ninguna comida que aparezca en el plan depende solo de texto libre para sus ingredientes.
- Cada plato asignado al plan tiene ingredientes y gramos.
- Las kcal/proteina/carbohidratos/grasa calculadas desde ingredientes quedan dentro de una tolerancia documentada frente al objetivo del slot.
- El repo incluye una forma clara de verificarlo.
- Commit y push propios.

### Verificacion sugerida

- Ejecutar validacion SQL/script de recetas.
- Revisar que `dish_macros` calcule valores esperados.
- Si se modifica SQL, documentar si requiere re-ejecutar `schema.sql`/`seed.sql`.

---

## REQ-02 - Usar recetas como fuente visible de cada comida

**Estado: implementado.**

### Objetivo

La app debe mostrar las recetas reales de las comidas, no solo nombres y macros fijos en JavaScript.

### Alcance

- En la vista del dia, cada comida debe permitir ver ingredientes con gramos.
- Cuando Supabase este conectado, usar recetas y macros calculados desde `dish_ingredients`/`dish_macros` como fuente principal.
- Mantener fallback local razonable si Supabase no esta disponible.
- Evitar que `buildDay()` muestre macros hardcodeados que contradigan la receta.
- La UI debe seguir funcionando en movil.

### Criterios de aceptacion

- En una comida del plan se puede abrir/ver su receta con ingredientes por peso.
- Los macros mostrados coinciden con la receta calculada cuando hay DB.
- Los reemplazos y ediciones no rompen la lectura de recetas.
- Si no hay DB, la app sigue usable con datos base.
- Commit y push propios.

### Verificacion sugerida

- Probar `python3 -m http.server`.
- Abrir la app y revisar al menos desayuno, almuerzo, batido y cena.
- Probar la pestana `Alimentos`.

---

## REQ-03 - Dia inicial, historial de peso y grasa corporal

**Estado: implementado.**

### Objetivo

La app debe abrir en el dia correcto segun la fecha actual y el registro de peso debe contemplar porcentaje de grasa corporal.

### Alcance

- Revisar la logica `todayStr()`, `clampDate()` y `current`.
- Definir comportamiento explicito:
  - si hoy esta dentro del plan, abrir hoy;
  - si hoy esta antes del plan, abrir el primer dia;
  - si hoy esta despues del plan, abrir el ultimo dia o mostrar un estado claro de plan finalizado.
- Asegurar que la barra "Hoy" regrese al dia actual del plan, no a un dia navegado previamente.
- Extender peso para guardar tambien `% grasa corporal`.
- Mostrar metricas derivadas utiles:
  - masa grasa;
  - masa magra;
  - cambio semanal de peso;
  - cambio de grasa corporal si hay datos.
- Mantener compatibilidad con datos viejos de `localStorage`.

### Criterios de aceptacion

- Primera apertura usa fecha actual correctamente.
- Navegar dias no cambia el default de una nueva sesion.
- La vista Peso permite registrar peso y `% grasa corporal`.
- Datos viejos de peso numerico no se pierden.
- Grafico o resumen refleja grasa corporal de forma legible.
- Commit y push propios.

### Verificacion sugerida

- Probar con fecha actual real.
- Simular valores antiguos en `localStorage`.
- Revisar vista movil de Peso.

---

## REQ-04 - Bloques colapsables para movil

**Estado: implementado.**

### Objetivo

Hacer que los bloques de dieta, macros, comidas, entrenamiento, resumen, alimentos y peso sean mas faciles de revisar en celular.

### Alcance

- Agregar un componente/patron simple de secciones colapsables.
- Aplicarlo primero a la vista del dia:
  - macros;
  - comidas del plan;
  - comidas extra;
  - entrenamiento;
  - resumen.
- Aplicarlo donde aporte valor en `Alimentos` y `Peso`.
- Persistir estado de colapso por vista en `localStorage`, sin mezclarlo con datos nutricionales.
- Mantener accesibilidad basica: botones reales, estado visible, labels claros.

### Criterios de aceptacion

- En movil se pueden abrir/cerrar bloques sin saltos raros ni overflow horizontal.
- El estado colapsado se recuerda al recargar.
- Nada esencial queda inaccesible.
- Commit y push propios.

### Verificacion sugerida

- Probar viewport movil y desktop.
- Revisar que las acciones dentro de una seccion abierta siguen funcionando.

---

## REQ-05 - Login simple y modo publico solo lectura para DB e IA

**Estado: implementado con una decision posterior: el login es obligatorio. El modo muestra comercial se redefine en REQ-25.**

### Objetivo

Agregar una capa de login sencilla para permitir escritura en base de datos y uso de IA solo a usuarios autenticados, manteniendo una experiencia publica de solo lectura.

### Alcance

- Usar Supabase Auth como base de login.
- Mostrar estado de sesion: no logueado, logueado, modo solo lectura.
- Usuarios no logueados pueden ver el plan y navegar, pero no pueden:
  - editar ingredientes/platos/dietas;
  - guardar cambios en Supabase;
  - usar Claude/IA;
  - guardar datos personales en tablas compartidas.
- Ajustar RLS:
  - lectura publica para tablas de catalogo/recetas si aplica;
  - escritura solo para usuarios autenticados o admin;
  - eliminar politicas anonimas de escritura.
- Proteger `/api/claude`:
  - requiere sesion/JWT valido;
  - valida usuario antes de llamar Anthropic;
  - no expone keys.
- La app debe degradar bien cuando no hay sesion: botones deshabilitados o mensajes claros.

### Criterios de aceptacion

- Usuario anonimo puede ver la app en modo lectura.
- Usuario anonimo no puede modificar DB ni usar IA.
- Usuario autenticado puede usar IA y acciones permitidas.
- RLS ya no permite escritura anonima.
- `/api/claude` rechaza llamadas sin sesion.
- Commit y push propios.

### Verificacion sugerida

- Probar flujo no logueado.
- Probar flujo logueado.
- Intentar una llamada directa a `/api/claude` sin token y verificar rechazo.
- Revisar politicas RLS.

---

## REQ-06 - Persistencia separada por usuario

**Estado: implementado.**

### Objetivo

Permitir mas de un usuario con datos separados: progreso diario, pesos, grasa corporal, preferencias y comidas ejecutadas no deben mezclarse.

### Alcance

- Crear tablas por usuario para:
  - perfil/preferencias alimenticias;
  - dias ejecutados;
  - comidas marcadas;
  - comidas extra;
  - reemplazos;
  - peso y grasa corporal.
- Usar `auth.uid()` en RLS para aislar datos.
- Mantener una ruta de migracion desde `localStorage` para el usuario logueado.
- Definir que queda publico/global:
  - ingredientes base;
  - recetas base;
  - menus plantilla.
- Definir que es personal:
  - preferencias;
  - historial;
  - dietas generadas;
  - progreso.

### Criterios de aceptacion

- Dos usuarios autenticados no ven ni modifican el progreso del otro.
- Las preferencias de un usuario no afectan a otro.
- El modo anonimo sigue siendo solo lectura.
- Hay migracion o importacion clara desde datos locales existentes.
- Commit y push propios.

### Verificacion sugerida

- Probar con dos usuarios.
- Revisar politicas RLS con inserts/selects cruzados.
- Confirmar que `localStorage` no sigue siendo la unica fuente para datos personales cuando hay login.

---

## REQ-07 - Vista admin para usuarios

**Estado: implementado y endurecido.**

### Objetivo

Agregar una vista de administrador para activar/desactivar usuarios y cambiar contrasenas.

### Alcance

- Definir rol admin de forma segura:
  - tabla `profiles` con rol, o metadata de Supabase Auth;
  - solo el servidor puede ejecutar acciones admin sensibles.
- Agregar funciones serverless admin si se necesita service role key.
- La service role key nunca debe llegar al navegador ni al repo.
- Vista admin con:
  - lista de usuarios;
  - estado activo/inactivo;
  - activar/desactivar;
  - cambiar contrasena o generar reset;
  - ver fecha de creacion/ultimo acceso si esta disponible.
- Usuarios desactivados no pueden escribir ni usar IA.
- Desactivar también bloquea el inicio de sesión en Supabase Auth.
- El servidor impide auto-desactivación y conservará al menos un administrador activo.
- Los campos `profiles.is_admin` y `profiles.active` no pueden modificarse desde una sesión normal.
- El enlace de recuperación vuelve a una pantalla funcional para definir la nueva contraseña.

### Criterios de aceptacion

- Solo admin ve la vista admin.
- Usuario no admin no puede llamar endpoints admin.
- Admin puede activar/desactivar usuarios.
- Admin puede cambiar contrasena o iniciar flujo de reset de forma controlada.
- Commit y push propios.

### Verificacion sugerida

- Probar usuario admin y usuario normal.
- Probar llamadas directas a endpoints admin sin permisos.
- Confirmar que ninguna key sensible queda en frontend.

---

## REQ-08 - Generador de dias de dieta con Claude

**Estado: implementado como generacion de dia/semana; su evolucion comercial esta en REQ-18.**

### Objetivo

Agregar una funcion para generar mas dias de dieta con Claude usando todo el contexto necesario: restricciones, preferencias, macros, recetas existentes y comidas ejecutadas.

### Dependencias

- Requiere REQ-01/REQ-02 para tener recetas y macros confiables.
- Requiere REQ-05 para proteger el uso de IA.
- Requiere REQ-06 para contexto por usuario.

### Alcance

- Capturar preferencias alimenticias del usuario:
  - vegetariano;
  - no come huevo;
  - usa proteina en polvo;
  - alimentos preferidos/no preferidos;
  - restricciones adicionales;
  - tolerancia a repetir comidas;
  - objetivo de kcal/macros.
- Enviar a Claude:
  - metas del dia;
  - entrenamiento planificado y contexto del dia;
  - recetas disponibles;
  - historial de comidas ejecutadas;
  - preferencias;
  - restricciones;
  - formato JSON estricto esperado.
- Claude debe devolver dias con:
  - fecha o offset;
  - slots;
  - recetas con ingredientes en gramos;
  - macros calculables;
  - explicacion breve.
- Validar la respuesta antes de guardar:
  - JSON parseable;
  - macros dentro de tolerancia;
  - ingredientes existentes o marcados como nuevos;
  - sin huevo ni restricciones violadas;
  - no duplicar excesivamente comidas recientes.
- Guardar como dieta generada del usuario, no como plantilla global por defecto.
- Permitir revisar antes de aplicar.

### Criterios de aceptacion

- Usuario autenticado puede generar dias nuevos.
- Usuario anonimo no puede generar.
- La generacion usa contexto real del usuario y no solo prompt generico.
- La app valida antes de guardar.
- Los dias generados se pueden ver y usar en la vista diaria.
- Commit y push propios.

### Verificacion sugerida

- Probar respuesta mockeada si no se quiere gastar API.
- Probar con Claude real en Vercel si hay key.
- Verificar que una respuesta invalida no se guarda.

---

## REQ-09 - Onboarding de objetivos, macros y preferencias

**Estado: implementado como flujo base; se amplia en REQ-12.**

### Objetivo

Configurar el perfil completo del usuario al entrar por primera vez y ofrecer una revision cada cuatro semanas.

### Alcance

- Solicitar datos corporales, nivel de actividad y objetivo.
- Calcular calorias, proteina, carbohidratos y grasas con una formula documentada.
- Permitir editar las metas calculadas antes de guardarlas.
- Configurar disciplina, fuerza y entre 3 y 6 dias de entrenamiento.
- Capturar restricciones y preferencias alimenticias.
- Guardar todo por usuario en `profiles.prefs`.
- Usar las metas personales como fuente unica en Home, Nutricion y generacion con IA.
- Volver a preguntar cada 28 dias si el usuario desea actualizar el plan.
- Permitir abrir el flujo manualmente desde Perfil.

### Criterios de aceptacion

- Un perfil incompleto entra directamente al onboarding.
- Katch-McArdle se usa cuando existe porcentaje de grasa; Mifflin-St Jeor en caso contrario.
- Las calorias coinciden con la suma de macros base.
- El usuario puede mantener sus valores actuales durante la revision periodica.
- El guardado usa `upsert` y no depende de que el trigger haya creado previamente la fila de perfil.
- La interfaz funciona sin overflow horizontal en movil.
- Commit y push propios.

### Verificacion sugerida

- Probar los cuatro pasos con perfil vacio y con perfil prellenado.
- Verificar el limite exacto de 28 dias.
- Probar calculos con y sin porcentaje de grasa.
- Comprobar persistencia tras cerrar sesion y volver a entrar.

---

## REQ-10 - Cierre de ciclo, recap y siguiente desafío

**Estado: implementado.**

### Objetivo

Cerrar cada proceso de 4 o 10 semanas con un resumen útil, documentar visualmente el progreso y crear el siguiente ciclo a partir de un nuevo desafío.

### Alcance

- Detectar que terminó el ciclo activo y mostrar un recap antes de volver a la vista diaria.
- Resumir entrenamientos, adherencia a comidas, cambio de peso, grasa corporal y mejor racha.
- Permitir tomar o elegir una foto de cuerpo entero.
- Guardar la foto de forma privada por usuario y ciclo.
- Preguntar si el siguiente desafío es:
  - mantener lo logrado;
  - continuar el mismo objetivo;
  - mejorar rendimiento;
  - ganar fuerza.
- Volver a ejecutar el onboarding completo con valores preseleccionados según el desafío.
- Crear otro ciclo con la duración elegida, fechas, pesos y progreso independientes.
- Conservar recaps y fotos anteriores en la vista Progreso.

### Criterios de aceptación

- Un ciclo vencido abre el recap una sola vez.
- El usuario no pierde el historial anterior al iniciar el siguiente ciclo.
- Rendimiento prioriza sesiones aeróbicas/técnicas y fuerza prioriza sesiones de fuerza.
- Las fotos son privadas y solo accesibles por el propietario mediante URL firmada.
- La migración `supabase/plan_cycles.sql` conserva los pesos existentes.
- Commit y push propios.

---

## REQ-11 - Duración configurable del plan

**Estado: implementado.**

### Objetivo

Permitir que cada usuario elija entre un bloque corto de 4 semanas y un proceso completo de 10 semanas.

### Alcance

- Elegir la duración durante el onboarding inicial y al iniciar un nuevo desafío.
- Editar la duración en cualquier momento desde Perfil.
- Ajustar fecha final, calendario, semanas de peso, refeeds y progresión de entrenamiento.
- Mantener una progresión compacta con consolidación en la semana 4.
- Mantener descarga en la semana 6 y consolidación en la semana 10 para el plan largo.
- Conservar los registros existentes al acortar o ampliar el ciclo.
- Mostrar la duración correcta en Home, Progreso, onboarding y recap.

### Criterios de aceptación

- Un plan de 4 semanas abarca exactamente 28 días y contiene cuatro semanas.
- Un plan de 10 semanas abarca exactamente 70 días y contiene diez semanas.
- Cambiar la duración desde Perfil actualiza el ciclo activo sin borrar datos.
- El recap aparece al terminar la duración elegida.
- Los perfiles existentes conservan 10 semanas por defecto.
- Commit y push propios.

---

## REQ-12 - Perfil flexible de alimentacion y entrenamiento

**Estado: pendiente.**

### Objetivo

Recoger la disponibilidad y preferencias suficientes para que el coach pueda proponer opciones realmente ejecutables, no solo un plan generico con macros y deporte.

### Alcance

- Extender onboarding y Perfil con:
  - numero de comidas diarias, entre 2 y 6;
  - horarios aproximados, ventana de alimentacion y comida principal;
  - tiempo disponible para cocinar, presupuesto orientativo y frecuencia aceptable de repeticion;
  - cocinas, ingredientes y preparaciones preferidas;
  - alergias separadas de simples alimentos no preferidos;
  - dias exactos disponibles para entrenar;
  - minutos disponibles por sesion;
  - lugar por dia: gimnasio, casa, exterior o piscina;
  - equipamiento disponible;
  - nivel de experiencia;
  - lesiones, limitaciones y movimientos a evitar;
  - horario preferido y prioridad entre rendimiento, fuerza, composicion y salud general.
- Mantener la recomendacion de al menos 3 dias de entrenamiento y explicar el impacto si la disponibilidad cambia.
- Definir valores por defecto compatibles con perfiles existentes.
- Validar combinaciones imposibles, por ejemplo natacion sin acceso a piscina.
- Guardar un `profileSchemaVersion` para poder migrar preferencias futuras.

### Criterios de aceptacion

- El usuario puede completar el flujo sin escribir notas libres para las decisiones principales.
- El perfil distingue restricciones duras, preferencias blandas y recursos disponibles.
- Editar una preferencia no borra progreso ni planes anteriores.
- Claude recibe estos campos como datos estructurados, no solo como un parrafo.
- Perfiles existentes se migran con defaults sin volver a quedar bloqueados en onboarding.
- Commit y push propios.

### Verificacion sugerida

- Probar un usuario de gimnasio y otro de casa con distinto numero de comidas.
- Probar perfiles heredados sin los nuevos campos.
- Verificar persistencia tras cerrar sesion y entrar en otro dispositivo.
- Revisar onboarding a 375x812 y 390x844 sin overflow.

---

## REQ-13 - Modelo de planes versionados

**Estado: pendiente.**

### Objetivo

Separar el plan prescrito de lo que el usuario ejecuto para poder generar, adaptar y auditar planes sin reescribir el historial.

### Dependencias

- Requiere REQ-12 para definir el contexto que origina cada plan.

### Alcance

- Crear un modelo persistente para:
  - plan activo y versiones anteriores;
  - semanas y dias;
  - objetivos nutricionales por dia;
  - slots de comida;
  - sesiones de entrenamiento;
  - ejercicios prescritos;
  - origen de la version: onboarding, IA, check-in, cambio manual o nuevo ciclo.
- Cada version debe guardar:
  - snapshot de preferencias usadas;
  - fecha de vigencia;
  - prompt/modelo o regla que la genero;
  - razon del cambio;
  - estado `draft`, `active`, `superseded` o `completed`.
- Mantener `day_log` como ejecucion real y relacionarlo con la version prescrita.
- Activar una version nueva solo despues de validacion y confirmacion.
- Migrar el plan actual a una version inicial sin perder datos.

### Criterios de aceptacion

- Cambiar una semana futura no modifica dias ya ejecutados.
- Se puede reconstruir que plan vio el usuario en cualquier fecha.
- Solo existe una version activa por ciclo.
- Reintentar una generacion no crea duplicados ni activa borradores incompletos.
- RLS aisla todos los planes por usuario.
- La migracion es idempotente y documentada.
- Commit y push propios.

### Verificacion sugerida

- Crear, activar y reemplazar una version de prueba.
- Confirmar que un log historico sigue apuntando a su prescripcion original.
- Probar acceso cruzado entre dos usuarios.
- Ejecutar la migracion dos veces en una base de prueba.

---

## REQ-14 - Seguridad, consentimiento y privacidad

**Estado: pendiente.**

### Objetivo

Establecer los limites de un coach de bienestar antes de ampliar recomendaciones, fotos, correos y cobros.

### Alcance

- Añadir consentimiento versionado para:
  - tratamiento de datos corporales y de progreso;
  - fotos privadas;
  - recomendaciones automatizadas del coach;
  - correos de seguimiento y marketing por separado.
- Incorporar un cuestionario basico de aptitud y senales de alerta antes de generar entrenamiento.
- Mostrar instrucciones claras para detener un ejercicio ante dolor, mareo u otros sintomas de riesgo.
- La IA no debe diagnosticar, prescribir tratamientos ni reemplazar a un profesional.
- Definir la politica de edad minima antes del lanzamiento comercial; no habilitar menores sin el tratamiento legal y de consentimiento correspondiente.
- Permitir exportar y solicitar borrado de cuenta, progreso, conversaciones y fotos.
- Definir retencion, anonimizado y eliminacion de datos tras cancelar.
- Mantener fotos privadas con URLs firmadas de corta duracion.
- Registrar la version de terminos y consentimiento aceptada.
- La interfaz operativa no debe mencionar IA o proveedores. Privacidad y terminos deben describir el procesamiento automatizado con el nivel de transparencia que exija la revision legal.

### Criterios de aceptacion

- Ningun plan se genera sin los consentimientos obligatorios vigentes.
- El consentimiento de recordatorios puede retirarse sin cancelar la cuenta.
- Exportar datos produce un archivo legible con la informacion del usuario.
- Borrar cuenta elimina o agenda de forma verificable sus datos y archivos.
- Prompts y respuestas de IA aplican los guardrails definidos.
- Los textos legales quedan marcados para revision profesional antes de produccion comercial.
- Commit y push propios.

### Verificacion sugerida

- Probar aceptar, retirar y renovar consentimientos.
- Probar exportacion y borrado con datos y fotos.
- Enviar prompts con dolor o lesion y confirmar que no se genera una rutina riesgosa.
- Revisar RLS y expiracion de URLs firmadas.

---

## REQ-15 - Biblioteca de ejercicios y demostraciones animadas

**Estado: pendiente.**

### Objetivo

Crear una fuente de verdad de ejercicios que permita explicar cada movimiento a una persona sin experiencia y que la IA solo use contenido soportado.

### Dependencias

- Debe aplicar las reglas de seguridad de REQ-14.

### Alcance

- Crear catalogo de ejercicios para gimnasio, peso corporal, running, cycling y natacion.
- Cada ejercicio debe incluir:
  - nombre, aliases y disciplina;
  - nivel y equipamiento;
  - grupos musculares y patron de movimiento;
  - posicion inicial;
  - pasos de ejecucion;
  - respiracion;
  - errores comunes;
  - senales de seguridad;
  - regresion, progresion y sustitutos;
  - contraindicaciones o limitaciones conocidas;
  - GIF animado de demostracion y una imagen estatica alternativa;
  - fuente, licencia y atribucion del recurso.
- Guardar media en almacenamiento controlado; no depender de hotlinks externos.
- Optimizar peso y dimensiones. Se puede servir WebM/MP4 como formato eficiente, pero la experiencia debe conservar una demostracion animada visible.
- Respetar `prefers-reduced-motion` y ofrecer pausa/reproduccion.
- Crear CRUD admin y validacion de ejercicios incompletos o sin media.

### Criterios de aceptacion

- Todas las rutinas publicadas usan IDs del catalogo, no nombres libres.
- Cada ejercicio visible en una rutina tiene instrucciones y demostracion.
- No se publica media sin licencia/fuente registrada.
- Si falla el GIF se muestra la imagen estatica y las instrucciones.
- El catalogo puede filtrarse por lugar, equipo, nivel y limitacion.
- La carga de media no bloquea la pantalla principal.
- Commit y push propios.

### Verificacion sugerida

- Cargar al menos una sesion completa de gimnasio y otra de peso corporal.
- Probar red lenta, media inexistente y modo de movimiento reducido.
- Validar que una sesion no acepte un ejercicio archivado.
- Revisar CRUD con admin y denegacion con usuario normal.

---

## REQ-16 - Reproductor de entrenamiento para principiantes

**Estado: pendiente.**

### Objetivo

Convertir la tarjeta de entrenamiento en una experiencia guiada que indique exactamente que hacer y permita registrar lo ejecutado.

### Dependencias

- Requiere REQ-13 y REQ-15.

### Alcance

- Mostrar la sesion en orden:
  - objetivo y duracion estimada;
  - calentamiento;
  - bloques principales;
  - vuelta a la calma.
- Para fuerza, mostrar por ejercicio:
  - GIF e instrucciones;
  - series, repeticiones, descanso, tempo, RPE/RIR y carga sugerida;
  - carga, repeticiones y RPE realmente ejecutados por serie;
  - temporizador de descanso;
  - regresion, progresion y sustitucion.
- Para running, cycling y natacion, mostrar intervalos estructurados con duracion/distancia, intensidad, recuperacion y temporizador.
- Permitir pausar, reanudar, omitir y terminar parcialmente.
- Preguntar por dolor o dificultad anormal antes de marcar la sesion como completada.
- Guardar resumen, duracion real, notas y rendimiento para futuras progresiones.
- Funcionar en pantalla movil con controles grandes y estado recuperable si la PWA se cierra.

### Criterios de aceptacion

- Una persona puede completar una sesion sin interpretar una descripcion compacta.
- El avance por series e intervalos queda persistido.
- Cerrar y volver a abrir la app recupera una sesion en curso.
- Descansos programados no aparecen como sesiones incompletas.
- Sustituir un ejercicio conserva la intencion y el volumen de la sesion.
- Home y Progreso reflejan el resultado real, no solo un booleano.
- Commit y push propios.

### Verificacion sugerida

- Completar una rutina de fuerza y una sesion de intervalos.
- Interrumpir la PWA a mitad de sesion y recuperarla.
- Probar sustitucion por falta de equipo.
- Revisar controles en iPhone standalone y Android.

---

## REQ-17 - Generador IA de planes de entrenamiento

**Estado: pendiente.**

### Objetivo

Generar un plan de 4 o 10 semanas que combine la disciplina principal con fuerza y respete disponibilidad, experiencia, equipo y limitaciones.

### Dependencias

- Requiere REQ-12, REQ-13, REQ-14, REQ-15 y REQ-16.

### Alcance

- Enviar a Claude contexto estructurado de:
  - objetivo y duracion;
  - dias exactos, tiempo y lugar;
  - experiencia, historial y rendimiento reciente;
  - equipo disponible;
  - lesiones, limitaciones y consentimiento;
  - catalogo de ejercicios permitido.
- Exigir JSON con semanas, sesiones, ejercicios, dosis, intensidad, descansos y razon de la progresion.
- Validar antes de aplicar:
  - solo ejercicios activos del catalogo;
  - dias y duracion disponibles;
  - descanso suficiente;
  - volumen e intensidad compatibles con nivel y objetivo;
  - progresion y descarga coherentes;
  - ausencia de movimientos marcados como no permitidos.
- Permitir revisar, regenerar una sesion o cambiar una semana sin regenerar todo.
- Mostrar una explicacion breve de por que el plan encaja con el perfil.
- Guardar prompt, modelo, validacion y version del plan.
- Mantener una plantilla determinista de respaldo cuando la IA no este disponible.

### Criterios de aceptacion

- La IA no puede introducir ejercicios inventados o sin demostracion.
- Los planes de 4 y 10 semanas respetan los dias elegidos.
- Un perfil con limitacion recibe sustituciones compatibles o una advertencia que impide aplicar.
- El usuario revisa y confirma antes de activar.
- Una respuesta invalida no se guarda como plan.
- Fallar Claude no deja al usuario sin una opcion de entrenamiento.
- Commit y push propios.

### Verificacion sugerida

- Probar combinaciones running+gimnasio, cycling+casa y natacion+gimnasio.
- Mockear respuestas con ejercicios inexistentes, exceso de dias y volumen invalido.
- Comparar plan corto y largo.
- Medir tokens, latencia y tasa de validacion.

---

## REQ-18 - Generador IA de planes nutricionales flexibles

**Estado: pendiente.**

### Objetivo

Generar una semana nutricional por usuario que respete macros, numero de comidas, preferencias, presupuesto, tiempo y restricciones.

### Dependencias

- Extiende REQ-08 y requiere REQ-12, REQ-13 y REQ-14.

### Alcance

- Generar semanas rodantes, no diez semanas de contenido repetido en una sola llamada.
- Respetar:
  - 2 a 6 comidas por dia;
  - horarios y ventana alimenticia;
  - macros diarios y distribucion por comida;
  - alergias, restricciones, gustos y tolerancia a repetir;
  - tiempo de preparacion y presupuesto;
  - dias de entrenamiento y necesidades alrededor de la sesion;
  - comidas ya ejecutadas y feedback previo.
- Priorizar recetas del catalogo y crear variantes con ingredientes y gramos.
- Validar macros desde ingredientes, no confiar en los totales declarados por Claude.
- Ofrecer modo cocina, rapido, comer fuera y aprovechar sobras.
- Generar lista de compras agregada y bloques de preparacion semanal.
- Permitir generar un solo dia, una semana o solo una comida faltante.
- Guardar como borrador versionado y pedir confirmacion antes de activar.
- Cachear resultados reutilizables y evitar llamadas duplicadas.

### Criterios de aceptacion

- La semana contiene exactamente el numero de comidas configurado por dia.
- Ninguna alergia dura puede quedar como simple advertencia.
- Los macros calculados quedan dentro de tolerancias documentadas.
- La lista de compras coincide con las recetas aplicadas.
- Regenerar una comida no cambia las demas.
- La generacion utiliza historial real y evita repeticiones rechazadas.
- Commit y push propios.

### Verificacion sugerida

- Probar perfiles omnivoro, vegetariano, vegano y con alergia.
- Probar 2, 4 y 6 comidas con distinto presupuesto.
- Mockear macros falsos y confirmar que la validacion recalcula.
- Verificar lista de compras y consolidacion de ingredientes.

---

## REQ-19 - Reemplazos y modo contingencia

**Estado: pendiente.**

### Objetivo

Permitir que el usuario adapte el dia real sin abandonar el plan cuando cambia su tiempo, lugar, equipo o acceso a alimentos.

### Dependencias

- Requiere REQ-13, REQ-15, REQ-17 y REQ-18.

### Alcance

- Añadir acciones rapidas:
  - "solo tengo 20 minutos";
  - "hoy entreno en casa";
  - "no tengo este equipo";
  - "no puedo cocinar";
  - "voy a comer fuera";
  - "no consegui este ingrediente";
  - "me perdi la sesion".
- Proponer 2 o 3 reemplazos equivalentes con impacto visible en:
  - macros, porcion y tiempo para comidas;
  - patron, musculos, volumen e intensidad para ejercicios;
  - progresion semanal si se mueve o pierde una sesion.
- Aplicar el cambio solo al dia o propagarlo al futuro segun eleccion explicita.
- Registrar motivo, opcion elegida y resultado para mejorar futuras sugerencias.
- Permitir revertir al plan original.

### Criterios de aceptacion

- Un reemplazo nutricional mantiene macros dentro de tolerancia.
- Un reemplazo de ejercicio conserva el objetivo de la sesion y respeta equipo/limitaciones.
- Perder un dia ofrece reprogramar, reducir o continuar sin duplicar carga.
- El historial muestra prescrito, cambio y ejecutado.
- Ninguna contingencia reescribe dias completados.
- Commit y push propios.

### Verificacion sugerida

- Simular falta de gimnasio, comida fuera y sesion perdida.
- Verificar aplicar solo hoy frente a aplicar desde hoy.
- Revertir cambios y confirmar que el historial permanece.

---

## REQ-20 - Check-in semanal y ajuste adaptativo

**Estado: pendiente.**

### Objetivo

Usar el progreso y la experiencia del usuario para proponer ajustes pequenos cada semana, manteniendo la revision profunda de cuatro semanas.

### Dependencias

- Requiere REQ-13, REQ-16, REQ-17, REQ-18 y REQ-19.

### Alcance

- Solicitar semanalmente:
  - peso y grasa opcional;
  - hambre y saciedad;
  - energia, sueno y estres;
  - dolor muscular y recuperacion;
  - dificultad percibida;
  - adherencia nutricional;
  - sesiones realizadas y rendimiento;
  - lesiones o molestias nuevas.
- Combinar reglas deterministas e IA para decidir:
  - mantener;
  - ajustar calorias/macros dentro de limites seguros;
  - ajustar volumen, intensidad o descanso;
  - sustituir ejercicios;
  - recomendar una revision profesional.
- Mostrar datos, razon y delta antes de aplicar.
- Modificar solo fechas futuras mediante una nueva version.
- Permitir omitir el check-in y evitar ajustes con datos insuficientes.
- Mantener la revision completa cada 28 dias para preferencias y objetivos.

### Criterios de aceptacion

- Nunca se ajustan macros o entrenamiento sin confirmacion.
- Los limites maximos de cambio semanal quedan documentados y probados.
- Dolor o sintomas de alerta bloquean recomendaciones agresivas.
- El usuario puede comparar antes/despues de cada ajuste.
- El recap del ciclo incluye cuantos ajustes se aceptaron.
- Commit y push propios.

### Verificacion sugerida

- Probar estancamiento, baja energia, exceso de hambre y progreso normal.
- Confirmar que datos insuficientes producen "mantener" o pedir mas informacion.
- Revisar que el plan historico no cambia.

---

## REQ-21 - Centro conversacional del coach

**Estado: pendiente.**

### Objetivo

Dar al usuario un punto unico para pedir ayuda contextual y convertir respuestas en acciones seguras dentro del plan.

### Dependencias

- Requiere REQ-13, REQ-14, REQ-17, REQ-18, REQ-19 y REQ-20.

### Alcance

- Crear una vista de Coach con conversaciones por ciclo.
- Incluir como contexto minimo:
  - perfil y preferencias;
  - plan activo y version;
  - lo ejecutado hoy y esta semana;
  - macros restantes;
  - rendimiento y check-ins recientes;
  - cambios rechazados o preferidos.
- Soportar preguntas como:
  - que puedo comer ahora;
  - como hago este ejercicio;
  - que hago si perdi una sesion;
  - adapta hoy por falta de tiempo;
  - explica por que cambio mi plan.
- Usar herramientas internas con esquemas estrictos para consultar o proponer cambios.
- Toda accion que escriba datos debe mostrar una vista previa y pedir confirmacion.
- Resumir conversaciones largas y limitar contexto/tokens.
- Mostrar claramente cuando la respuesta es educativa, una propuesta o una accion aplicada.

### Criterios de aceptacion

- El coach responde usando el plan y registros del usuario correcto.
- No puede leer datos de otro usuario.
- No modifica datos con texto libre ni sin confirmacion.
- Las propuestas usan los mismos validadores de nutricion y entrenamiento.
- El usuario puede ver que cambio y deshacerlo cuando aplique.
- Existe fallback claro cuando IA no esta disponible o se agoto el limite.
- Commit y push propios.

### Verificacion sugerida

- Probar las cinco preguntas de ejemplo con contextos distintos.
- Intentar prompt injection y acceso cruzado.
- Medir tamano de contexto y confirmar resumen de conversaciones.
- Mockear una herramienta invalida y verificar rechazo.

---

## REQ-22 - Home como agenda diaria del coach

**Estado: pendiente.**

### Objetivo

Hacer que Home responda rapidamente "que debo hacer ahora" y conecte nutricion, entrenamiento, progreso y contingencias.

### Dependencias

- Requiere REQ-13 y debe integrarse progresivamente con REQ-19, REQ-20 y REQ-21.

### Alcance

- Mostrar un estado diario unico con:
  - proxima comida o sesion;
  - progreso nutricional y de entrenamiento;
  - tiempo estimado restante;
  - check-in o medicion pendiente;
  - estado de sincronizacion.
- Priorizar acciones segun hora local, plan y lo ya ejecutado.
- Incluir accesos rapidos para:
  - iniciar entrenamiento;
  - marcar o reemplazar comida;
  - activar modo contingencia;
  - abrir el coach con contexto del dia.
- Mostrar por que una accion es prioritaria sin generar una llamada IA en cada render.
- Adaptar el mensaje en descanso, plan pausado, dia completado, sin conexion o ciclo terminado.
- Permitir navegar a otro dia sin cambiar el default de Home, que siempre representa hoy.
- Mantener la informacion esencial visible en la primera pantalla movil.

### Criterios de aceptacion

- El usuario puede iniciar la accion principal del dia con un toque.
- Home nunca recomienda una sesion en un descanso programado.
- Los datos coinciden con Nutricion, Entreno y la version activa del plan.
- Completar una accion actualiza la siguiente prioridad sin recargar.
- La pantalla funciona sin Claude y con conectividad intermitente.
- No existe overflow ni contenido bajo las safe areas en PWA.
- Commit y push propios.

### Verificacion sugerida

- Probar manana, tarde y noche con distintos estados de avance.
- Probar descanso, dia completado, offline y ciclo vencido.
- Comparar los totales con Nutricion y Entreno.

---

## REQ-23 - Rachas, consistencia e hitos

**Estado: pendiente.**

### Objetivo

Transformar la racha actual en un sistema motivacional justo que mida constancia real sin castigar descansos planificados.

### Alcance

- Definir por separado:
  - racha de nutricion;
  - racha de entrenamiento;
  - racha combinada;
  - consistencia semanal.
- Definir cumplimiento diario:
  - nutricion por porcentaje de comidas o rango de macros;
  - entrenamiento solo cuando habia una sesion programada;
  - descanso planificado como dia neutral, no fallo.
- Calcular usando zona horaria del usuario y fuente de verdad del servidor.
- Permitir una ventana de correccion documentada para registros tardios.
- Mostrar:
  - racha actual y mejor racha;
  - progreso de la semana;
  - hitos de 3, 7, 14, 30 dias y ciclo completado;
  - mensajes de recuperacion cuando se rompe una racha.
- Evitar lenguaje de culpa y no premiar entrenar sobre dolor o saltarse descansos.
- Guardar eventos/hitos de forma idempotente.

### Criterios de aceptacion

- Un dia de descanso programado no rompe la racha de entrenamiento.
- Marcar una sola comida no cuenta automaticamente como dia nutricional cumplido.
- La racha coincide entre dispositivos.
- Cambiar zona horaria no duplica ni elimina hitos.
- Home, Progreso y recap usan la misma definicion.
- Commit y push propios.

### Verificacion sugerida

- Probar semana con descanso, sesion perdida y registro tardio.
- Probar cambio de zona horaria cerca de medianoche.
- Confirmar idempotencia de hitos.

---

## REQ-24 - Recordatorios de inactividad por correo

**Estado: pendiente futuro.**

### Objetivo

Enviar un recordatorio util al final del dia solo cuando el usuario lo autorizo y aun tiene actividad relevante sin registrar.

### Dependencias

- Requiere REQ-14 y REQ-23. Debe consultar entitlement cuando exista REQ-25.

### Alcance

- Guardar preferencias de notificacion:
  - opt-in;
  - zona horaria;
  - hora limite;
  - dias habilitados;
  - recordatorios de nutricion, entrenamiento o ambos.
- Ejecutar un job seguro que determine por usuario:
  - si habia entrenamiento programado y no esta completado;
  - si la nutricion esta por debajo del umbral definido;
  - si el plan esta pausado, el usuario ya recibio correo o el dia es neutral.
- Enviar maximo un correo por tipo y dia con clave idempotente.
- Incluir una accion directa que abra el dia correcto en la PWA.
- No incluir datos corporales ni sensibles en el asunto.
- Incluir baja de recordatorios en un paso.
- Registrar intento, entrega, rebote, error y cancelacion.
- Preparar la arquitectura para otros canales sin implementar push todavia.

### Criterios de aceptacion

- No se envia correo a usuarios sin opt-in, inactivos o sin acciones pendientes.
- Reintentar el job no duplica correos.
- La zona horaria decide correctamente cuando termina el dia.
- Completar la actividad antes del envio cancela el recordatorio.
- El enlace abre la fecha correspondiente despues del login.
- Commit y push propios.

### Verificacion sugerida

- Ejecutar el job en modo `dry-run`.
- Probar usuarios en distintas zonas horarias.
- Simular entrega, rebote y reintento.
- Confirmar baja inmediata.

---

## REQ-25 - Oferta, entitlement y paywall

**Estado: pendiente.**

### Objetivo

Definir que obtiene el usuario con el paquete de 1 mes o 3 meses y aplicar esos permisos de forma consistente.

### Dependencias

- Requiere REQ-14 para terminos y privacidad.

### Alcance

- Crear catalogo configurable con:
  - producto de 1 mes;
  - paquete de 3 meses;
  - precio, moneda, duracion, renovacion, estado y version de la oferta.
- Hacer explicito si cada producto renueva automaticamente o expira; no inferirlo desde el nombre.
- Definir la matriz de acceso:
  - visitante: explicacion y muestra no personalizada;
  - cuenta sin plan activo: onboarding/preview y acceso a su historial;
  - plan activo: generacion, coach, adaptaciones y funciones premium;
  - plan vencido: historial y exportacion, sin nuevas llamadas premium.
- Crear entitlement server-side con fechas, origen y estado.
- Proteger endpoints de IA y funciones premium en servidor, no solo ocultar botones.
- Agregar paywall contextual que explique el valor y conserve el trabajo previo.
- Permitir acceso de cortesia administrado sin alterar cobros.
- No hardcodear precios ni productos en `index.html`.

### Criterios de aceptacion

- Un usuario vencido conserva historial, fotos y exportacion.
- Manipular el frontend no permite usar IA sin entitlement.
- Los paquetes y precios se actualizan sin desplegar codigo.
- La UI muestra vigencia, renovacion y siguiente cobro/expiracion de forma clara.
- Accesos de cortesia quedan auditados.
- Commit y push propios.

### Verificacion sugerida

- Probar visitante, cuenta sin plan, plan activo, vencido y cortesia.
- Llamar directamente endpoints premium sin entitlement.
- Cambiar catalogo y confirmar reflejo en UI.

---

## REQ-26 - Checkout y ciclo de facturacion

**Estado: pendiente.**

### Objetivo

Vender y mantener los paquetes de 1 y 3 meses con un flujo de pago confiable y auditable.

### Dependencias

- Requiere REQ-25.

### Alcance

- Integrar un proveedor de pagos mediante checkout alojado.
- Crear sesiones de checkout en servidor para productos validos del catalogo.
- Procesar webhooks firmados e idempotentes para:
  - pago aprobado;
  - renovacion;
  - pago fallido;
  - cancelacion;
  - expiracion;
  - reembolso o disputa.
- El webhook debe ser la fuente de verdad para activar o retirar entitlement.
- Crear pantalla de cuenta/facturacion con:
  - paquete actual;
  - vigencia;
  - renovacion o expiracion;
  - administrar metodo/cancelar cuando aplique;
  - restaurar compra.
- Definir periodo de gracia y comportamiento ante fallos de pago.
- No almacenar datos de tarjeta en Fitbros.
- Relacionar IDs externos con usuario y eventos internos sin exponer secretos.

### Criterios de aceptacion

- Completar checkout activa entitlement una sola vez.
- Webhooks duplicados o desordenados no corrompen el estado.
- Cancelar conserva acceso hasta la fecha definida por el producto.
- Reembolso/expiracion retira acceso premium sin borrar datos.
- Un usuario no puede comprar para otro manipulando IDs.
- Existe entorno de prueba y procedimiento de conciliacion.
- Commit y push propios.

### Verificacion sugerida

- Probar todos los eventos en sandbox.
- Repetir y desordenar webhooks.
- Confirmar que no hay datos de tarjeta ni secrets en logs/frontend.
- Conciliar una compra con su entitlement y usuario.

---

## REQ-27 - Analitica de producto, IA y costos

**Estado: pendiente.**

### Objetivo

Medir si la experiencia crea valor, donde se abandona y cuanto cuesta operar la IA sin invadir la privacidad.

### Dependencias

- Puede empezar despues de REQ-13 y debe estar antes del lanzamiento comercial.

### Alcance

- Instrumentar eventos de:
  - registro, onboarding y activacion;
  - generacion y aplicacion de planes;
  - comida/sesion completada;
  - reemplazos y check-ins;
  - rachas e hitos;
  - paywall, checkout, conversion, renovacion y cancelacion.
- Registrar para cada llamada IA:
  - usuario pseudonimizado;
  - funcion, modelo y version de prompt;
  - tokens/costo estimado;
  - latencia y error;
  - resultado de validacion;
  - aplicado, descartado o regenerado.
- No enviar fotos, alergias, notas de salud ni prompts completos a analitica general.
- Crear vistas o tablero para:
  - activacion;
  - adherencia y retencion;
  - conversion;
  - tasa de aceptacion de IA;
  - costo por usuario activo;
  - errores por flujo.
- Añadir limites y alertas de consumo por usuario/funcion.
- Versionar prompts y permitir feature flags.

### Criterios de aceptacion

- Se puede responder cuantos usuarios llegan a su primer plan y primera semana activa.
- Se conoce el costo y tasa de error de cada funcion IA.
- Eventos duplicados no inflan metricas.
- Analitica no contiene datos sensibles prohibidos.
- Los limites de IA se aplican tambien en servidor.
- Commit y push propios.

### Verificacion sugerida

- Ejecutar un journey completo y revisar la secuencia de eventos.
- Simular reintentos offline y confirmar deduplicacion.
- Auditar payloads de analitica.
- Probar alerta y limite de gasto.

---

## REQ-28 - Sincronizacion offline y resolucion de conflictos

**Estado: pendiente.**

### Objetivo

Evitar perdida de registros cuando la PWA se usa sin red o desde varios dispositivos.

### Dependencias

- Requiere REQ-13 para identificar versiones y entidades.

### Alcance

- Crear cola local de mutaciones con:
  - ID unico;
  - usuario;
  - entidad y version base;
  - fecha local;
  - estado y numero de reintentos.
- Reenviar al recuperar conexion con operaciones idempotentes.
- Usar version/ETag o control optimista en datos editables.
- Definir politicas por entidad:
  - checks y series: merge cuando no colisionan;
  - preferencias y planes: pedir resolucion o conservar la version mas reciente confirmada;
  - fotos y cobros: nunca resolver silenciosamente.
- Mostrar estado `sin conexion`, `pendiente`, `sincronizado` o `requiere atencion`.
- Aislar y limpiar la cola al cambiar de usuario.
- Manejar expiracion de sesion sin perder mutaciones.
- Controlar actualizaciones del service worker y migraciones de cache.

### Criterios de aceptacion

- Registrar comidas y series offline se sincroniza al volver la red.
- Reintentar no duplica acciones.
- Dos dispositivos editando el mismo plan producen una resolucion explicita.
- Cerrar sesion no envia datos pendientes al siguiente usuario.
- Una actualizacion PWA no borra la cola.
- Commit y push propios.

### Verificacion sugerida

- Completar acciones offline y reconectar.
- Simular conflicto entre dos navegadores.
- Expirar el JWT con mutaciones pendientes.
- Actualizar el service worker durante una sesion.

---

## REQ-29 - Modularizacion incremental y contratos de dominio

**Estado: pendiente.**

### Objetivo

Reducir el riesgo de seguir agregando coach, pagos y notificaciones dentro de un unico script global.

### Alcance

- Definir contratos estables para:
  - perfil;
  - plan y version;
  - nutricion;
  - entrenamiento;
  - ejecucion diaria;
  - coach/IA;
  - entitlement;
  - sincronizacion.
- Extraer de forma incremental modulos de dominio y servicios desde `index.html`.
- Separar render/UI de reglas, persistencia y llamadas de red.
- Evitar una reescritura visual o cambio de framework dentro de este requerimiento.
- Mantener compatibilidad con service worker, despliegue Vercel y datos existentes.
- Añadir validacion de esquemas en los limites entre IA, API, DB y UI.
- Documentar como agregar una nueva preferencia, ejercicio, accion del coach o producto.

### Criterios de aceptacion

- Las reglas principales pueden probarse sin un DOM completo.
- No se depende de variables globales para comunicar dominios nuevos.
- La app conserva el comportamiento previo y carga en produccion/PWA.
- Los contratos rechazan datos incompletos antes de persistir.
- El cambio queda dividido en una migracion mecanica y verificable, sin mezclar nuevas funciones.
- Commit y push propios.

### Verificacion sugerida

- Ejecutar pruebas unitarias de macros, rachas, versiones y validadores.
- Comparar smoke tests antes/despues.
- Confirmar que el service worker sirve todos los nuevos assets.

---

## REQ-30 - Pruebas end-to-end, accesibilidad y release gates

**Estado: pendiente.**

### Objetivo

Proteger los journeys criticos antes de cobrar y reducir regresiones en PWA movil.

### Dependencias

- Puede construirse incrementalmente, pero debe completarse antes del lanzamiento comercial.

### Alcance

- Automatizar como minimo:
  - registro/login/reset/logout;
  - onboarding completo;
  - generacion y activacion de plan;
  - registrar comida y entrenamiento;
  - reemplazo/contingencia;
  - check-in y ajuste;
  - cierre de ciclo;
  - expiracion de suscripcion;
  - admin y aislamiento entre usuarios.
- Añadir pruebas de contratos para APIs, IA mockeada, webhooks y migraciones.
- Añadir pruebas visuales en movil, incluido iPhone standalone con safe areas.
- Revisar accesibilidad:
  - navegacion por teclado;
  - foco y modales;
  - labels;
  - contraste;
  - texto escalado;
  - movimiento reducido;
  - controles tactiles.
- Definir presupuestos de rendimiento para carga inicial y media de ejercicios.
- Crear smoke test de produccion y checklist de rollback.
- Bloquear release cuando fallen sintaxis, migraciones, RLS, tests criticos o auditoria de secretos.

### Criterios de aceptacion

- Los journeys criticos corren en CI con datos aislados.
- Una regresion de auth, macros, RLS o billing bloquea el despliegue.
- Las pantallas principales no tienen overflow ni contenido bajo barras del sistema.
- Los GIF no impiden usar la rutina con red lenta.
- Existe procedimiento probado de rollback.
- Commit y push propios.

### Verificacion sugerida

- Ejecutar suite en desktop y dos viewports moviles.
- Probar PWA instalada y actualizacion de service worker.
- Inyectar fallos de Claude, Supabase, correo y pagos.
- Ejecutar escaneo de secrets y `git diff --check`.

---

## REQ-31 - Tecnologia invisible, cuotas y reutilizacion de opciones

**Estado: pendiente prioritario.**

### Objetivo

Mantener la experiencia enfocada en Fitbros como coach, controlar el costo diario de generar dietas y rutinas, y seguir ofreciendo alternativas utiles cuando se agote el presupuesto de generacion nueva.

### Dependencias

- Requiere REQ-05/REQ-06 para identidad y control server-side.
- Debe implementarse antes de ampliar los generadores de REQ-17 y REQ-18.
- Debe integrarse con entitlement en REQ-25 y analitica en REQ-27.

### Lenguaje de producto

- Para cualquier usuario no administrador queda prohibido mostrar en la UI operativa:
  - `IA`, `AI`, `inteligencia artificial` o `Claude`;
  - nombre de proveedor o modelo;
  - prompt, tokens, costo o detalles de generacion;
  - textos como "generado por IA", "la IA esta pensando" o "configura la IA".
- Usar lenguaje de producto:
  - "tu coach";
  - "preparar mi semana";
  - "crear mi dieta";
  - "crear mi rutina";
  - "ver otra opcion";
  - "personalizar";
  - "estamos preparando tu plan".
- Los administradores si pueden ver proveedor, modelo, consumo, validaciones, errores y origen de cada resultado.
- Los textos legales y de privacidad deben tratar la automatizacion segun lo definido en REQ-14, fuera de la experiencia operativa normal.
- Auditar todos los textos visibles actuales, estados de carga, errores, modales, botones y mensajes offline.

### Cuota diaria

- Definir cuotas configurables y separadas por accion, como minimo:
  - dieta de un dia;
  - dieta de una semana;
  - nueva opcion de comida;
  - plan de entrenamiento;
  - reemplazo o nueva sesion de entrenamiento.
- La configuracion puede variar por producto, entitlement o acceso de cortesia y no debe quedar hardcodeada en `index.html`.
- Cada click intencional aceptado por el servidor reserva exactamente una unidad de la accion correspondiente.
- Dobles clicks, reintentos de red y requests con el mismo ID deben ser idempotentes y descontar una sola vez.
- Si la generacion falla por un error tecnico antes de producir una opcion valida, la unidad se devuelve.
- La ventana diaria se calcula con la zona horaria guardada del usuario.
- El contador y las unidades restantes nunca se muestran al usuario no administrador.
- El limite debe comprobarse y consumirse atomicamente en servidor; `localStorage` no puede ser la fuente de verdad.
- Renderizar una pantalla, revisar un resultado ya existente o aplicar una opcion no vuelve a consumir cuota.

### Reutilizacion despues de la cuota

- Cuando aun existe cuota, solicitar una opcion nueva, validarla y guardarla en un pool privado del usuario.
- Cuando se agota la cuota, no realizar otra llamada al proveedor. Resolver en este orden:
  - opciones validas que el usuario todavia no vio;
  - opciones menos recientemente mostradas al mismo usuario;
  - variantes deterministas construidas desde catalogos y plantillas aprobadas.
- Despues del numero configurado de opciones nuevas, se permite repetir dietas o rutinas previamente mostradas.
- La seleccion debe evitar repetir inmediatamente la ultima opcion cuando exista otra compatible.
- Antes de reutilizar, validar nuevamente contra:
  - macros y numero de comidas actuales;
  - alergias y restricciones;
  - objetivo, dias y duracion del plan;
  - lugar, equipamiento, experiencia y limitaciones;
  - version vigente del catalogo de recetas/ejercicios.
- Si cambio el perfil y una opcion dejo de ser compatible, no se puede mostrar.
- Los resultados personales nunca se comparten entre usuarios. Un cache comun solo puede contener plantillas anonimas sin datos, notas ni historial personal.
- La UI debe usar "otra opcion" o "alternativa" y no afirmar que el resultado es nuevo, unico o recien generado.

### Persistencia y administracion

- Crear politicas y registros server-side con:
  - usuario;
  - tipo de accion;
  - fecha/ventana de consumo;
  - ID idempotente;
  - estado reservado, completado, devuelto o reutilizado;
  - origen `fresh`, `user_pool` o `template`;
  - referencia al resultado mostrado;
  - timestamps y costo interno cuando aplique.
- Guardar historial de impresiones para ordenar por menos recientemente mostrado.
- Permitir al admin:
  - configurar cuotas por accion/producto;
  - ver consumo nuevo frente a reutilizado;
  - detectar abuso y errores;
  - otorgar o reiniciar cuota de cortesia;
  - desactivar temporalmente una funcion costosa.
- No exponer estos endpoints ni campos en consultas accesibles a usuarios normales.

### Criterios de aceptacion

- Ninguna pantalla operativa para usuarios no administradores contiene `IA`, `AI`, `Claude`, modelos, prompts, tokens o contadores.
- El mismo request repetido descuenta una sola unidad.
- Dos requests simultaneos no pueden superar la cuota diaria.
- Un fallo tecnico devuelve la unidad reservada.
- Al agotar la cuota, las acciones siguen respondiendo con opciones compatibles sin nuevas llamadas al proveedor.
- Las repeticiones empiezan solo despues de agotar las opciones nuevas disponibles y evitan la opcion mostrada inmediatamente antes.
- Cambiar una alergia, macros, equipo o limitacion invalida opciones incompatibles del pool.
- El admin puede comprobar si una respuesta fue nueva o reutilizada y modificar la politica sin desplegar codigo.
- Commit y push propios.

### Verificacion sugerida

- Buscar textos visibles prohibidos en HTML/JS y recorrer todos los flujos como usuario normal.
- Probar cuotas de dieta y entrenamiento con limites pequenos.
- Lanzar dobles clicks y requests concurrentes.
- Simular error del proveedor y confirmar devolucion.
- Agotar cuota y verificar orden `no vista` → `menos reciente` → `plantilla`.
- Cambiar preferencias despues de llenar el pool y confirmar revalidacion.
- Probar que un usuario no pueda leer pool, cuota o historial de otro.

---

## Notas de implementacion para agentes

- No guardar secrets en Git.
- No exponer `ANTHROPIC_API_KEY` ni service role key en frontend.
- Preferir Supabase RLS para seguridad de datos.
- Cualquier cambio de esquema debe venir con instrucciones de migracion o SQL idempotente.
- Si un requerimiento necesita partirse, crear un nuevo REQ en este archivo y hacer commit/push solo de esa actualizacion de backlog.
- Despues de cada implementacion revisar si es necesario actualizar el archivo CONTEXT.md y hacer push al repositorio con el cambio
- No incluir cambios ajenos o no relacionados que ya existan en el worktree.
- Toda funcion IA debe tener schema de salida, validacion, timeout, manejo de error y limite de uso.
- Ningun texto operativo para usuarios no administradores debe mencionar IA, Claude, modelos, prompts, tokens o cuotas internas.
- Toda mutacion sensible debe comprobar autenticacion, usuario activo y entitlement en servidor.
- Toda UI nueva debe probarse como PWA movil y respetar safe areas.
- Todo cambio SQL debe ser idempotente o incluir una ruta explicita de migracion y rollback.
