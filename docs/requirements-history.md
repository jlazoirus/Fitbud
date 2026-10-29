# Historial de requerimientos - Fitbros

Este archivo conserva el detalle historico movido desde `REQUIREMENTS.md` el 2026-06-30. La fuente operativa para agentes sigue siendo `../REQUIREMENTS.md`; usa este historial solo bajo demanda para investigar contexto, evitar duplicados o auditar decisiones antiguas.

---

# Plan de requerimientos de producto - Fitbros

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
- Ciclos personales de 4 o 10 semanas, onboarding, revision cada 28 dias, recap y foto de progreso personal al cerrar un ciclo.
- Ya no existe un menu estatico ni tipos de dia PESAS/BAJO/REFEED/DIETBREAK: cada dia parte de slots vacios y se completa con IA, catalogo o edicion.
- Las metas personales de macros son uniformes para todos los dias y sirven como fuente de verdad para Home, Nutricion y generacion con IA.
- Perfil flexible versionado: 2 a 6 comidas con horarios/logistica; alergias separadas de gustos; dias, lugares, recursos, experiencia y limitaciones de entrenamiento.
- Preferencias de entrenamiento: running, cycling o natacion combinados con gimnasio o peso corporal; 3 a 6 dias exactos por semana y lugar por dia.
- Claude puede estimar y sugerir comidas, revisar macros y generar un dia o una semana de dieta.
- Racha actual basada en cualquier actividad registrada; no distingue cumplimiento nutricional, entrenamiento ni descanso planificado.
- Entrenamientos actuales enlazan un catalogo propio de 40 ejercicios, cuentan con reproductor recuperable y permiten preparar, revisar y activar planes personalizados completos de 4 o 10 semanas.
- No existe todavia facturacion, entitlement de suscripcion, paywall, recordatorios por correo, check-in semanal adaptativo ni un centro conversacional de coach.
- La fuente de verdad personal es Supabase y `localStorage` actua como cache, pero la sincronizacion sigue siendo last-write-wins sin cola offline.

Cada agente debe volver a leer el commit real que exista en `HEAD` antes de empezar.

## Auditoria de flujos

| Flujo | Estado actual | Brecha principal |
|---|---|---|
| Registro y acceso | Login, registro, reset y admin disponibles | Falta relacionar acceso con suscripcion y ofrecer una muestra clara antes del pago |
| Onboarding | Perfil v3 implementado: macros, zona horaria, 2-6 comidas, horarios, logistica alimentaria, dias/lugares, recursos, experiencia y limitaciones | - |
| Home diario | Muestra macros, dieta, entrenamiento y racha | Falta priorizacion inteligente, estado del dia, proxima accion y contingencias |
| Nutricion | Recetas, macros, checks, reemplazos, generacion IA diaria/semanal con borrador+lista de compras y regeneracion por comida | Falta contingencia nutricional y reemplazos equivalentes (REQ-19). Campos de ventana de alimentación y repetición aceptable visibles en onboarding y perfil sin contexto suficiente para un usuario normal (REQ-46). |
| Entrenamiento | Planes personalizados de 4/10 semanas, biblioteca guiada y reproductor recuperable con series, intervalos, temporizadores y sustituciones | Falta el modo contingencia y la adaptación semanal (REQ-19/REQ-20). Solo running/cycling/natación; el selector no diferencia entre usuarios de otro deporte cardio libre y usuarios sin cardio estructurado (REQ-45). |
| Adaptacion | Revision manual cada 4 semanas y nuevo ciclo | Falta check-in semanal y ajustes graduales segun adherencia, hambre, energia, recuperacion y rendimiento |
| Progreso | Peso, grasa, entrenos, adherencia, racha, recap y fotos | Gráfico personalizado (REQ-43) y adherencia nutricional + contexto de peso en ciclos (REQ-44) implementados. Falta contingencia y adaptación semanal. |
| Motivacion | Racha simple visible | Falta definir rachas justas, descansos, metas semanales, hitos y recuperacion de constancia |
| Recordatorios | No existe | Falta el canal por correo (REQ-24) y el canal push de recordatorios de racha con permiso del dispositivo (REQ-38); ambos exigen programacion por zona horaria, consentimiento, deduplicacion y envio solo si hay acciones pendientes |
| Adquisicion | No existe superficie publica; la primera pantalla es el login | Falta landing/funnel que explique la oferta antes del registro y conecte con el paywall (REQ-33) |
| Suscripcion | Checkout Stripe (REQ-26): sesión alojada, webhooks firmados, entitlement activado por webhook. Historial de pagos visible (REQ-48) y cupones gratuitos de un solo uso con duración configurable (REQ-50). | Checklist de revisión legal pre-lanzamiento formalizado como REQ-49 (requiere acción humana). |
| Seguridad y privacidad | Auth, RLS y fotos de progreso personal protegidas | Faltan consentimiento de salud/fotos/correos, exportacion, borrado, retencion y guardrails de entrenamiento |
| Operacion | Admin de usuarios, alimentos y ejercicios con fuente/licencia | Faltan prompts/versiones, soporte, metricas de IA y costos |
| Lenguaje (Principio 9) | Implementado: la UI operativa habla de coach, plan y opciones; los detalles técnicos quedan en administración | Mantener el barrido como gate de nuevas superficies |
| Consumo de generacion | Cuota diaria server-side, reserva idempotente y pool privado implementados | Integrar entitlement de REQ-25 y costo por accion de REQ-27 |
| PWA y sincronizacion | Instalable, cache y safe areas de iPhone | Falta cola offline, conflictos, recuperacion ante fallos y pruebas end-to-end de journeys |
| Feedback de carga | Botones con `disabled + textContent` en operaciones cortas + spinner/loading-row CSS puro en generación de plan, coach y día nutricional (REQ-47) | — |

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

0. REQ-31 - Tecnologia invisible (lenguaje). **Implementado**: copy operativo de coach y diagnostico tecnico solo para administradores.
12. REQ-12 - Perfil flexible de alimentacion y entrenamiento.
13. REQ-13 - Modelo de planes versionados. **Implementado**.
14. REQ-14 - Seguridad, consentimiento y privacidad.
15. REQ-15 - Biblioteca de ejercicios y demostraciones animadas.
16. REQ-16 - Reproductor de entrenamiento para principiantes. **Implementado**.
32. REQ-32 - Cuotas diarias y reutilizacion de opciones. **Implementado** antes de ampliar REQ-17/REQ-18 y retrofiteado a REQ-08.

### Fase B - Inteligencia y adaptacion

17. REQ-17 - Generador IA de planes de entrenamiento. **Implementado**.
18. REQ-18 - Generador IA de planes nutricionales flexibles. **Implementado**.
19. REQ-19 - Reemplazos y modo contingencia. **Implementado**.
20. REQ-20 - Check-in semanal y ajuste adaptativo.
21. REQ-21 - Centro conversacional del coach.

### Fase C - Retencion

22. REQ-22 - Home como agenda diaria del coach.
23. REQ-23 - Rachas, consistencia e hitos.
24. REQ-24 - Recordatorios de inactividad por correo.

### Fase D - Monetizacion

33. REQ-33 - Landing publica y funnel de adquisicion. Precede a REQ-25/REQ-26: sin superficie publica no hay embudo de venta.
25. REQ-25 - Oferta, entitlement y paywall.
26. REQ-26 - Checkout y ciclo de facturacion.

### Fase E - Calidad y escala

27. REQ-27 - Analitica de producto, IA y costos.
28. REQ-28 - Sincronizacion offline y resolucion de conflictos.
29. REQ-29 - Modularizacion incremental y contratos de dominio. **Implementado**.
30. REQ-30 - Pruebas end-to-end, accesibilidad y release gates. **Implementado**.

### Fase F - Activacion, retencion y pulido (auditoria heuristica + directiva de producto, jun 2026)

Hallazgos de una evaluacion heuristica de los flujos reales (REQ-34..37) mas una directiva de producto de notificaciones push (REQ-38). No estaban capturados en REQ-12..33. Prioridad de producto: la activacion (REQ-34/REQ-35) deberia preceder a la monetizacion (REQ-25/REQ-26/REQ-33), porque dirigir trafico pago a un primer dia vacio rompe la promesa central. **REQ-34 ya esta priorizado como siguiente en `agent-loop.json`.**

34. REQ-34 - Primer plan al terminar el onboarding (primer valor inmediato). **Priorizado como siguiente · alta prioridad, bajo esfuerzo.**
35. REQ-35 - Onboarding minimo viable con divulgacion progresiva.
36. REQ-36 - Unificar acciones de comida (cambiar/adaptar).
37. REQ-37 - Accesibilidad de modales y confirmacion de acciones destructivas.
38. REQ-38 - Notificaciones push y recordatorios de racha (retencion; comparte infraestructura con REQ-24 y depende de REQ-23). Bloqueado en una decision de proveedor/transport y secretos antes de implementar el envio.

### Fase H - Cierre del ciclo de feedback de Progreso (auditoria jun 2026)

43. REQ-43 - Gráfico de peso personalizado por usuario.
44. REQ-44 - Adherencia nutricional y contexto de peso en Progreso.

### Fase I - Pulido de UX y alcance de perfil (directiva de producto, jun 2026)

45. REQ-45 - Selector de disciplina en dos pasos: cardio opcional, aviso cardiovascular y cardio ligero genérico.
46. REQ-46 - Simplificar configuración de nutrición (ocultar ventana y repetición en flujo estándar).
47. REQ-47 - Indicadores de carga (spinners) en generación de plan, coach y nutrición diaria.

### Fase J - Facturacion del usuario y cumplimiento legal pre-lanzamiento (jun 2026)

48. REQ-48 - Panel de historial de pagos para el usuario. Depende de REQ-26 (webhooks activos).
49. REQ-49 - Checklist de revision legal antes del lanzamiento comercial. **No implementable por el agente; requiere accion humana. No agregar a `agent-loop.json`.**
50. REQ-50 - Cupones de acceso gratuito (duración configurable) sin Stripe. **Implementado**.

### Fase K - Configuracion externa y pendientes de infraestructura (jun 2026)

60. REQ-60 - Corregir Site URL / Redirect URLs de Supabase (recuperar contrasena apunta a localhost). **No implementable por el agente; requiere accion manual en dashboard de Supabase. No agregar a `agent-loop.json`.**

### Fase G - Operacion del catalogo nutricional (auditoria jun 2026)

39. REQ-39 - Editor administrativo de dietas y asignaciones. Descubierto al auditar el journey Administracion -> Alimentos -> Dietas: el backend permite escribir `diets`/`diet_dishes` como admin, pero la app solo muestra esas asignaciones.

REQ-08 debe esperar a REQ-01/REQ-02 y preferiblemente a REQ-05/REQ-06, porque necesita recetas confiables, contexto por usuario y control de acceso a IA.

Los requerimientos REQ-12 a REQ-33 son el backlog recomendado para completar la vision comercial. Las dependencias de cada uno mandan sobre el orden numerico cuando exista una razon tecnica.

### Frontera de MVP para el primer cobro

No se necesitan los 33 REQ para vender la primera suscripcion. **MVP de lanzamiento pago** (lo minimo para cobrar con una experiencia honesta):

- REQ-31 (lenguaje invisible) — bloqueante de imagen.
- REQ-12 (perfil flexible) y REQ-18 (dieta IA flexible por # de comidas/preferencias).
- REQ-15 en version reducida + REQ-16 (rutina guiada con descripcion y demostracion para principiantes).
- REQ-23 (rachas justas) para retencion.
- REQ-32 (cuota+reutilizacion) para controlar costo antes de abrir el grifo.
- REQ-14 (consentimiento/privacidad minimos) + REQ-33 (landing) + REQ-25/REQ-26 (paywall y checkout).

**Diferibles tras el primer cobro** (mejoran, no bloquean): REQ-13 (versionado completo), REQ-19 (contingencias), REQ-20 (check-in adaptativo), REQ-21 (coach conversacional), REQ-27 (analitica), REQ-28 (offline), REQ-29 (modularizacion), REQ-30 (e2e). Se recomienda igual REQ-27 minimo y REQ-30 smoke antes de escalar trafico.

**Decision de producto pendiente (define la conversion):** cuando se entrega el primer valor. Recomendado: registro → onboarding → **un primer plan/dia gratis** (trial de valor) → paywall para seguir generando/adaptando. Confirmar antes de construir REQ-25/REQ-33.

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

**Estado: implementado, pero con una decision posterior que invalida parte del alcance original: el login es OBLIGATORIO. Hoy no existe modo anonimo de solo lectura; la primera pantalla es el login. La experiencia de visitante/muestra y el funnel comercial se definen en REQ-25 y en el nuevo REQ-33 (landing publica). Los criterios de "usuario anonimo" de abajo quedan derogados y se conservan solo como historia.**

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

### Criterios de aceptacion (vigentes)

- Sin sesion no se puede ver el plan ni navegar la app: la primera pantalla es el login (decision: login obligatorio).
- Usuario no autenticado no puede modificar DB ni usar funciones del coach.
- Usuario autenticado activo puede usar las funciones permitidas.
- RLS ya no permite escritura anonima.
- `/api/claude` rechaza llamadas sin sesion valida (y bloquea usuarios inactivos).
- Commit y push propios.

### Criterios derogados (historia, ya no aplican)

- ~~Usuario anonimo puede ver la app en modo lectura.~~ (Se decidio login obligatorio; el acceso de visitante a una muestra se rehace en REQ-33.)

### Verificacion sugerida

- Probar flujo logueado y confirmar que sin sesion solo se ve el login.
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
  - crear o reiniciar una cuenta QA que conserve el acceso y vuelva al onboarding sin datos;
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
- Admin puede reiniciar una cuenta marcada como QA y entrar con ella como usuario nuevo.
- Una cuenta normal o administradora no puede borrarse accidentalmente mediante la herramienta QA.
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
- Ajustar fecha final, calendario y semanas de peso del ciclo.
- La progresión por semanas es del **entrenamiento** (consolidación/descarga), no de la nutrición: tras quitar el plan estático (commit `9e3fa4e`) ya no existen tipos de día ni refeeds; los macros son uniformes todos los días y las comidas se arman por usuario.
- Periodización de entrenamiento: consolidación en la semana 4 (plan corto) y descarga en la semana 6 + consolidación en la semana 10 (plan largo), aplicada por el generador de entrenamiento de REQ-17.
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

**Estado: implementado.**

La implementacion amplía onboarding y Perfil a cinco pasos, guarda preferencias estructuradas en `profiles.prefs` (evolucionadas a `profileSchemaVersion: 3` por REQ-32 para persistir zona horaria), migra perfiles heredados con defaults sin reabrir onboarding y adapta el calendario de entrenamiento a los dias/lugares seleccionados. El contexto del coach recibe el perfil como JSON estructurado y las alergias se validan como restricciones duras, separadas de ingredientes no preferidos.

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

**Estado: implementado.**

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

### Resultado

- Se creo `plan_versions` como snapshot persistente del plan prescrito.
- `day_log` guarda `plan_version_id` para conservar la ejecucion historica.
- El cliente crea, activa y backfillea versiones sin perder el historial existente.

### Verificacion sugerida

- Crear, activar y reemplazar una version de prueba.
- Confirmar que un log historico sigue apuntando a su prescripcion original.
- Probar acceso cruzado entre dos usuarios.
- Ejecutar la migracion dos veces en una base de prueba.

---

## REQ-14 - Seguridad, consentimiento y privacidad

**Estado: implementado.**

La implementacion agrega consentimientos versionados, edad minima de 18 anos, evaluacion de aptitud con pausa de entrenamiento ante senales de alerta, guardrails obligatorios en cliente y servidor, y un Centro de privacidad para fotos opcionales, exportacion JSON y borrado verificable de cuenta y fotos. La experiencia presenta un solo check esencial para personalizar el plan y un segundo check opcional para fotos; no solicita permisos de correo o marketing. `supabase/privacy.sql` crea las tablas con RLS; `PRIVACY.md` define retencion y queda marcado para revision legal profesional.

### Objetivo

Establecer los limites de un coach de bienestar antes de ampliar recomendaciones, fotos, correos y cobros.

### Alcance

- Añadir consentimiento versionado con una experiencia de maximo dos checks:
  - un permiso esencial para tratamiento de datos corporales, progreso y recomendaciones del coach;
  - un permiso opcional para fotos de progreso personal.
- No solicitar permisos de correo o marketing hasta que exista una funcion contextual que los necesite.
- Incorporar un cuestionario basico de aptitud y senales de alerta antes de generar entrenamiento.
- Mostrar instrucciones claras para detener un ejercicio ante dolor, mareo u otros sintomas de riesgo.
- La IA no debe diagnosticar, prescribir tratamientos ni reemplazar a un profesional.
- Definir la politica de edad minima antes del lanzamiento comercial; no habilitar menores sin el tratamiento legal y de consentimiento correspondiente.
- Permitir exportar y solicitar borrado de cuenta, progreso, conversaciones y fotos.
- Definir retencion, anonimizado y eliminacion de datos tras cancelar.
- Mantener las fotos de progreso personal protegidas con URLs firmadas de corta duracion.
- Registrar la version de terminos y consentimiento aceptada.
- La interfaz operativa no debe mencionar IA o proveedores. Privacidad y terminos deben describir el procesamiento automatizado con el nivel de transparencia que exija la revision legal.

### Criterios de aceptacion

- Ningun plan se genera sin el permiso esencial vigente.
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

**Estado: implementado.**

La implementacion usa IDs estables del catalogo en todas las rutinas; Entreno muestra instrucciones, respiracion, errores, senales de seguridad y regresion/progresion. La demostracion visual sigue una cadena de degradacion (`exerciseMediaHtml`): clip de video/gif → imagen estatica → secuencia de 2 fotos → SVG procedimental → solo texto, con pausa/reproduccion y respeto de `prefers-reduced-motion`. Un modo "Ver tecnica" (`openExerciseGuide`) amplia la demostracion con las instrucciones completas. `supabase/exercises.sql` crea la fuente compartida con RLS y CRUD admin (incluida gestion de media: tipo, fotogramas, poster, fuente/licencia, con previsualizacion); `exercise-catalog.js` mantiene un respaldo local con el SVG procedimental como fallback garantizado.

**Actualizacion (2026-06-29) — decision build vs buy revisada.** El SVG procedimental original era generico por patron de movimiento (no por ejercicio), por lo que no ensenaba la tecnica real. Se reabrio la decision y se eligio **licenciar Free Exercise DB** (`yuhonas/free-exercise-db`, dominio publico / Unlicense): se espejan las fotos a Supabase Storage (bucket `exercise-media` publico, sin hotlinks) y se pueblan `media_url/poster_url/frames`. Resultado: 42 ejercicios de fuerza con fotos reales de inicio/fin; los 9 de cardio (running/cycling/natacion) conservan el SVG porque la fuente es solo de fuerza. Pipeline: `scripts/free-exercise-db-map.mjs` (mapeo slug→id) + `scripts/ingest-exercise-media.mjs` (`--check`/`--upload`/`--apply`) + `supabase/exercise-media.sql`. El service worker cachea `/storage/v1/object/` para uso offline. El SVG sigue como fallback para cualquier ejercicio sin foto.

### Objetivo

Crear una fuente de verdad de ejercicios que permita explicar cada movimiento a una persona sin experiencia y que la IA solo use contenido soportado.

### Dependencias

- Debe aplicar las reglas de seguridad de REQ-14.

### Decision previa bloqueante (build vs buy)

- **Decision vigente (2026-06-29):** **licenciar** Free Exercise DB (dominio publico / Unlicense) y espejar la media a Supabase Storage. El SVG procedimental propio queda como fallback, no como demostracion principal. Se mantiene la regla: no hotlinks ni media sin fuente/licencia registrada.
- **Decision anterior (superada):** producir demostraciones SVG procedimentales propias como unica fuente. Se descarto porque el SVG es generico por patron de movimiento y no ensena la tecnica real de cada ejercicio.
- Conseguir cientos de demostraciones animadas con licencia es un sub-proyecto de contenido y legal por si solo. Las opciones evaluadas fueron: **licenciar** una libreria (elegida: Free Exercise DB, gratis/dominio publico; alternativa premium: pack comercial de GIF/video), **grabar/producir** propio, o **generar** (SVG). Pendiente futuro: cubrir cardio y mejoras de calidad (video) reusan el mismo pipeline.

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

**Estado: implementado.**

La implementacion convierte cada sesion en una prescripcion ordenada con calentamiento, bloque principal y vuelta a la calma. Fuerza registra carga, repeticiones y RPE por serie, usa descansos recuperables y permite regresion, progresion o sustitucion compatible conservando el volumen. Running, cycling y natacion se descomponen en bloques temporizados con objetivo, intensidad y recuperacion. El estado completo vive en `day_log.state.workoutExecution`, por lo que pausar, cerrar y volver a abrir la PWA recupera el avance. El cierre pregunta por dificultad y senales anormales; dolor, pasos omitidos o volumen incompleto producen un resultado parcial en vez de marcar la sesion como completada.

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

**Estado: implementado.**

La implementacion prepara el plan por semanas bajo una sola accion idempotente, valida fechas, lugares, duracion, fase, dosis y ejercicios contra el catalogo activo, y usa una alternativa determinista compatible si el servicio no responde. El usuario revisa las 4 o 10 semanas, puede preparar otra semana o sesion sin rehacer el resto y activa el borrador versionado solo despues de confirmar. La nueva version empieza en la primera fecha sin entrenamiento registrado; el reproductor consume las dosis e intervalos del plan activo y conserva el historial anterior.

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

**Estado: implementado.**

La implementacion adapta la UI a 2-6 comidas segun el perfil, distribuye macros con peso mayor en la comida principal, enriquece el prompt con tiempo de cocina/presupuesto/dia de entrenamiento, muestra un borrador de semana para revisar antes de aplicar, genera lista de compras agregada y permite regenerar cualquier comida individual sin afectar las demas.

### Objetivo

Generar una semana nutricional por usuario que respete macros, numero de comidas, preferencias, presupuesto, tiempo y restricciones.

### Dependencias

- Extiende REQ-08 y requiere REQ-12, REQ-13 y REQ-14.

### Alcance

- Generar semanas rodantes, no diez semanas de contenido repetido en una sola llamada.
- Hacer variable el numero de comidas en la UI: hoy `BASE_SLOTS` esta fijo en 4 (desayuno/almuerzo/cena/snack). Home y Nutricion deben renderizar entre 2 y 6 slots segun el perfil, y el reparto de macros por comida debe ajustarse a ese numero.
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

**Estado: implementado.**

La implementación agrega acciones rápidas de contingencia para nutrición ("Adaptar" → No puedo cocinar / Voy a comer fuera / Sin ingrediente) y entrenamiento ("Solo 20 min" / "En casa" / "Sin equipo" / "Me perdí la sesión"). Los reemplazos de comida muestran el delta de kcal respecto al plato actual, permiten elegir el alcance (solo hoy o toda la semana) y registran motivo, opción elegida y timestamp en `day_log.state.contingencyLog`. El botón "Volver al plan" revierte overrides de contingencia. La sesión perdida ofrece tres acciones: seguir con el plan, recuperar en otro momento o convertir en descanso planificado. El resumen del día lista las adaptaciones registradas. Ninguna contingencia reescribe días ya completados.

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

**Estado: implementado.**

La implementación agrega un check-in semanal opcional que aparece en Progreso al inicio de cada nueva semana del ciclo. El formulario recoge peso (opcional), escala 1-5 para hambre, energía, sueño, estrés, recuperación muscular, dificultad percibida y adherencia nutricional, más sesiones realizadas (pre-calculadas desde el historial) y texto libre para molestias. Un motor determinista analiza las respuestas y propone ajustes de ±0-200 kcal/día (proteína fija; carbs y grasas escalan proporcionalmente) o recomendaciones de intensidad de entrenamiento. Una señal de alerta (dolor) bloquea recomendaciones de entrenamiento y solicita consulta profesional. El usuario ve un delta antes/después antes de confirmar. Los check-ins se guardan en `profiles.prefs.weeklyCheckins` (no requiere migración SQL). El recap del ciclo muestra cuántos ajustes se aceptaron.

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

**Estado: implementado.**
Tab "Coach" con conversación por ciclo, contexto enriquecido (macros, entreno, check-ins, adaptaciones), sugerencias predefinidas, confirmación antes de aplicar cambios de datos, fallback claro y resumen automático al superar 30 mensajes.

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

**Estado: implementado.**
Home muestra una tarjeta de acción prioritaria determinista (sin llamada IA), progreso nutricional con anillo de kcal y macros, accesos rápidos a Nutrición/Entreno/Coach, banner de check-in cuando hay uno pendiente y mensajes diferenciados para descanso, día completado, plan terminado y evaluación de seguridad.

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

**Estado: implementado.**
Streak combinada (nutrición ≥50% comidas + entrenamiento hecho o descanso planificado), rachas separadas de nutrición y entrenamiento, consistencia semanal, hitos idempotentes 3/7/14/30 días guardados en prefs, mensajes de recuperación y sección "Rachas e hitos" en Progreso. Home usa la racha combinada.

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

**Estado: implementado.**
Infraestructura completa; activación final requiere configurar en Vercel: RESEND_API_KEY, NOTIFY_FROM_EMAIL (dominio verificado en resend.com), NOTIFY_APP_URL y CRON_SECRET.

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
- Definir la infraestructura antes de implementar: **scheduler** (Vercel Cron o Supabase `pg_cron`) y **proveedor de correo transaccional** (p. ej. Resend, Postmark o SES) con dominio verificado. El secreto del proveedor vive solo en el servidor.
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

**Estado: implementado.**
Catálogo server-side en `subscription_plans` (Supabase); dos planes con precio, duración, renovación y características. Entitlements en `user_entitlements` con estados active/expired/courtesy/revoked, origen y auditoría de quién los concede. `api/catalog.js` sirve los planes públicamente con fallback inline. `api/entitlement.js` devuelve el entitlement activo (GET) y permite al admin otorgar/revocar acceso de cortesía (POST). `api/claude.js` verifica `user_entitlements` antes de cualquier generación: retorna 402 con `paywall:true` si no hay plan activo; admins y dev-mode (key local) siempre pasan. Cliente: `loadCatalog()` y `loadEntitlement()` se llaman en boot/onAuth de forma no bloqueante; `hasEntitlement()` es permisivo hasta confirmar la tabla existe; `coachUnavailable(context)`, `openTrainingPlanGenerator()` y `sendCoachMessage()` muestran el paywall modal contextual antes de intentar cualquier llamada; `subscriptionStatusHtml()` en Perfil muestra vigencia, tipo y días restantes; admin tiene botón "Cortesía" por usuario. Precios y planes no están hardcodeados en index.html.

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

**Estado: implementado.**
Stripe como proveedor (checkout alojado, modo `payment` por ser paquetes sin auto-renovación). `api/checkout.js` crea sesión Stripe vía fetch nativo, requiere sesión autenticada y retorna URL de redirección. `api/webhook.js` verifica firma HMAC-SHA256 con Node `crypto` (bodyParser desactivado), activa entitlement en `checkout.session.completed` y lo revoca en `charge.refunded`; idempotente por `billing_events.stripe_event_id UNIQUE`. `billing_events` audita todos los eventos; sin acceso para usuarios (solo service_role). Cliente: `activatePlanFromPaywall()` llama `/api/checkout` y redirige a Stripe; `checkCheckoutReturn()` maneja `?checkout=success|cancel` al volver y recarga el entitlement; `subscriptionStatusHtml()` agrega "Renovar plan" (≤14 días restantes, solo checkout) y "Restaurar compra" (sin plan activo). `restorePurchase()` vuelve a llamar `loadEntitlement()` para recuperar plans con webhook tardío. Datos de tarjeta nunca salen de Stripe; `metadata.user_id` relaciona eventos con el usuario sin exponer secretos. Nuevas vars Vercel: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_QUARTERLY`. Migración: `supabase/billing.sql`.

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

**Estado: implementado.**
`product_events` registra eventos de embudo anonimizados (sin datos de salud, alergias ni prompts) con filtro de propiedades en servidor y cliente. `feature_flags` versiona prompts y flags. `coach_usage` extiende con `latency_ms`, `estimated_cost_usd` (calculado en `api/claude.js` desde precios por modelo), `prompt_version` y `outcome`. `complete_fresh_coach_part` y `fail_coach_generation_part` actualizados con nuevos parametros opcionales (backward compatible). Vistas admin `v_activation_funnel` y `v_ai_cost_summary`. `api/analytics.js`: POST registra eventos del cliente, GET devuelve metricas agregadas solo a admin. `index.html`: `trackEvent()` con allowlist de 15 claves seguras; 8 puntos instrumentados (session_start, onboarding_complete, paywall_shown, checkout_start, checkout_complete, diet_week_applied, training_plan_applied, coach_message_sent); vista "Analitica" en la seccion admin de Perfil. Migracion: `supabase/analytics.sql`.

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
- Contabilizar el costo por **accion de producto**, no solo por llamada: una accion puede disparar varias llamadas al proveedor (p. ej. "preparar mi semana" hace ~7 generaciones de dia). El costo de la unidad de cuota (REQ-32) debe sumar todas sus llamadas.
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

**Estado: implementado.**
Cola `fitbud_syncq_v1` en localStorage: cada mutación de `day_log` y `weight_log` se almacena con `{id, uid, entity, entityKey, payload, ts, retries, status}`. `pushDay` y `pushWeight` encolan al perder red o ante error de red; `drainSyncQueue()` procesa la cola al recuperar red, al iniciar sesión y al cerrar sesión (con timeout de 5 s). `pullDay` y `pullAllDays` saltan días con mutaciones pendientes para no sobreescribir cambios offline. La cola se aísla por usuario en `clearSyncQueueForUser()` al detectar cierre de sesión. Badge `#sync-badge` muestra: "Sin red" (offline), "↑ N" (pendientes), "✓" (sincronizado, desaparece a los 2 s), "⚠ Atención" (fallido tras 3 reintentos, clicable). El drenado incluye manejo de sesión expirada con `refreshAuth()`. `drainSyncQueue` es idempotente porque `pushDay`/`pushWeight` usan upsert con clave de conflicto. Sin migraciones SQL (la cola vive en localStorage). Service worker v33.

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

**Estado: implementado.**
`domain-contracts.js` exporta seis validadores puramente funcionales (sin DOM) para los dominios de perfil, macros, estado de día, entitlement, cola de sync y solicitud al coach. Cada validador devuelve `{ok, errors[]}`. Los contratos se usan como advertencias no bloqueantes en `commitDay` (día), `enqueueMutation` (sync) y `loadEntitlement` (entitlement) — los tres puntos de frontera donde datos externos o del usuario llegan al sistema. `scripts/validate-contracts.mjs` prueba los seis validadores en Node.js sin DOM. Service worker v34 añade `domain-contracts.js` al shell.

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

**Estado: implementado.**
`scripts/release-gate.mjs` orquesta 18 checks locales (sintaxis JS, dominio, SQL, secrets, HTML/a11y) en 0.8 s y sale con código 1 si alguno falla. `scripts/audit-secrets.mjs` escanea todos los archivos rastreados por git contra patrones de credenciales reales (Claude, Stripe, Supabase JWT, Resend). `scripts/audit-html.mjs` verifica sintaxis del JS embebido (node --check sobre tmp file), tags PWA (viewport-fit, apple-mobile-web-app-*, manifest, SW), safe-area-inset, prefers-reduced-motion, alt en imágenes, aria-label en selects y lenguaje prohibido (REQ-31) en atributos de UI. `scripts/validate-migrations.mjs` verifica idempotencia (IF NOT EXISTS en incrementales; DROP+CREATE en scripts de instalación fresca), RLS en tablas de usuario (buscado en todos los archivos SQL del repo), ADD COLUMN sin IF NOT EXISTS, DROP sin IF EXISTS y secrets hardcodeados. `scripts/smoke-test.mjs` prueba 8 endpoints de producción con fetch nativo: /, /api/config, /api/catalog, /api/claude sin auth, /api/checkout sin auth, /api/admin sin auth, /api/analytics sin auth, manifest y SW. `ROLLBACK.md` documenta el procedimiento de rollback para Vercel, Supabase, SW y Git.

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

## REQ-31 - Tecnologia invisible (lenguaje de producto)

**Estado: implementado.**

La implementacion reemplaza el copy operativo por lenguaje de coach, neutraliza errores tecnicos para usuarios normales, filtra referencias tecnicas de respuestas dinamicas y conserva proveedor, modelo y diagnostico en Ajustes para administradores. El manifiesto y la descripcion publica tampoco exponen el origen tecnico.

### Objetivo

Que ningun usuario no administrador vea en la UI operativa la palabra IA, el proveedor, el modelo, prompts, tokens ni el origen tecnico de una recomendacion. La experiencia habla de "tu coach", "tu plan" y "otra opcion".

### Dependencias

- Ninguna tecnica: es un cambio de copy. Idealmente antes de sumar mas superficies de generacion.

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

### Criterios de aceptacion

- Ninguna pantalla operativa para usuarios no administradores contiene `IA`, `AI`, `Claude`, modelos, prompts, tokens ni "generado por...".
- Los administradores si pueden ver proveedor, modelo, validaciones, errores y origen de cada resultado.
- Se auditaron botones, secciones, modales, estados de carga/vacio, errores, mensajes offline y el banner de instalacion.
- Commit y push propios.

### Verificacion sugerida

- `grep` de textos prohibidos (`IA`, `AI`, `Claude`, "genera con", "configura la IA", "generado por") en HTML/JS y recorrer todos los flujos como usuario normal.

---

## REQ-32 - Cuotas diarias y reutilizacion de opciones

**Estado: implementado.**

La implementación agrega una reserva atómica por acción y día en Supabase, usando la zona horaria persistida del perfil y un `request_id` idempotente. Una semana completa comparte una sola reserva aunque prepare hasta siete días. Las respuestas válidas se guardan en un pool privado por usuario y contexto compatible; al alcanzar el límite, el servidor elige primero opciones no vistas, luego la menos reciente y finalmente una alternativa determinista, sin llamar otra vez al proveedor. Los fallos previos a una opción válida devuelven la reserva. Administración permite editar políticas, desactivar acciones, distinguir resultados nuevos/reutilizados, otorgar cortesía y reiniciar el consumo del día. Las políticas para planes y reemplazos de entrenamiento quedan disponibles para REQ-17/REQ-19.

### Objetivo

Controlar el costo diario de generar dietas y rutinas y seguir ofreciendo alternativas utiles cuando se agote el presupuesto de generacion nueva, sin mostrar nunca el contador al usuario.

### Dependencias

- Requiere REQ-05/REQ-06 para identidad y control server-side.
- Debe implementarse antes de ampliar los generadores de REQ-17 y REQ-18, y debe retrofitearse a los generadores YA vivos de REQ-08 (dia/semana), que hoy no tienen cuota.
- Debe integrarse con entitlement en REQ-25 y analitica en REQ-27.

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

## REQ-33 - Landing publica y funnel de adquisicion

**Estado: implementado.**
La implementación renderiza la landing dentro de `index.html` via `renderLanding()`: visible para cualquier visitante no autenticado antes de mostrar el formulario de login. Incluye hero con gradiente de marca, mockup de demo de la app, grid de features, pasos de cómo funciona, precios desde `PRICING_CONFIG` (stub desacoplado listo para conectar con REQ-25), FAQ con acordeón y CTA final. Open Graph/Twitter Card en `<head>`. El botón "← Conoce Fitbros" en el formulario de auth devuelve a la landing. Ningún texto menciona IA, proveedor, modelo ni cuota (REQ-31). Service worker v29.

### Objetivo

Crear la superficie publica que hoy no existe (la primera pantalla es el login) para que un visitante entienda la oferta, vea una muestra y se convierta en cuenta y suscripcion. Es el paso 1 del journey objetivo y un prerequisito real de la monetizacion.

### Dependencias

- Se coordina con REQ-25 (oferta/paywall) y REQ-26 (checkout).
- Reusa el branding de Fitbros (paleta purpura/terracota, Syne/DM Sans) ya en la app y el `Fitbros Landing.html` del brandbook como referencia visual.

### Alcance

- Pagina(s) publica(s) sin login: propuesta de valor ("siempre tengo algo viable para comer y entrenar hoy"), como funciona, paquetes de 1 y 3 meses, prueba social y FAQ.
- Muestra no personalizada del producto (capturas o demo guiada) sin exponer IA/proveedor (Principio 9 / REQ-31).
- CTA claro a registro; tras registrarse, continuar al onboarding y al primer valor segun la decision de trial.
- SEO basico, Open Graph/sharing, rendimiento y accesibilidad; respetar safe areas en movil.
- Definir el momento de paywall respecto al primer plan gratis (ver "Decision de producto pendiente" en Orden sugerido).
- No hardcodear precios: leerlos del catalogo de REQ-25.
- Medir el funnel (visita → registro → onboarding → primer plan → checkout) con REQ-27.

### Criterios de aceptacion

- Un visitante sin cuenta puede entender la oferta y los paquetes sin iniciar sesion.
- Ningun texto publico menciona IA, modelos ni proveedores.
- El CTA lleva a registro y de ahi al onboarding sin callejones.
- Los precios mostrados provienen del catalogo, no de constantes en el codigo.
- Funciona y se ve correcto en movil instalado y en navegador.
- Commit y push propios.

### Verificacion sugerida

- Recorrer visita → registro → onboarding como usuario nuevo.
- Revisar que no haya terminos prohibidos en el HTML publico.
- Probar Open Graph y rendimiento en movil.

---

## REQ-34 - Primer plan al terminar el onboarding (primer valor inmediato)

**Estado: implementado.**
`prepareFirstCycleDay(ds)` se dispara desde `saveOnboarding()` solo cuando `firstCycle||newCycle`. Pantalla de transición → generación (o plantilla determinista ante fallo) → `applyDayComidas` → marca `cycleFirstDayPreparedAt` en prefs. Idempotente por flag; no se re-dispara en renders ni recargas posteriores. Sin vocabulario técnico en UI (REQ-31). Service worker v26.

### Objetivo

Que el usuario vea un dia real (comidas con macros + sesion o descanso) inmediatamente despues de terminar el onboarding, en lugar de slots vacios (`Sin asignar`), cumpliendo la promesa central "siempre tengo una opcion viable para comer y entrenar hoy". Hoy el alta termina y aterriza en un dia vacio; el usuario debe descubrir solo los botones de generacion en otra pestana.

### Dependencias

- Requiere REQ-13, REQ-17, REQ-18 y REQ-32 (todos implementados).
- Coordinar con la "Decision de producto pendiente" del trial y con REQ-25 cuando exista entitlement: no asumir generacion ilimitada.

### Alcance

- Al cerrar el onboarding inicial (y opcionalmente al iniciar un ciclo nuevo desde el recap), preparar el primer dia con las metas recien calculadas.
- Patron recomendado: una transicion clara ("Estamos preparando tu primer dia") con un unico disparo controlado; no encadenar multiples llamadas sin control.
- Respetar REQ-32: una sola reserva idempotente, devolucion de cuota ante fallo tecnico y fallback determinista.
- Si la generacion falla, mostrar el dia con la plantilla determinista para que nunca quede vacio.
- Marcar en `profiles.prefs` que el primer dia del ciclo ya se preparo: no re-disparar en cada apertura ni en cada render.
- Home y Nutricion deben reflejar el dia ya preparado.
- Ningun texto operativo menciona IA, proveedor, modelo ni cuota (REQ-31).

### Criterios de aceptacion

- Tras completar el onboarding, el primer dia tiene comidas con macros y una sesion (o descanso) asignada sin pasos manuales adicionales.
- La preparacion consume como maximo una unidad de cuota y es idempotente ante reintentos o doble montaje.
- Un fallo del servicio deja un dia valido mediante plantilla, nunca vacio.
- No se dispara mas de una vez por ciclo.
- Respeta alergias, restricciones y metas del perfil recien guardado.
- Commit y push propios.

### Verificacion sugerida

- Onboarding nuevo con servicio mockeado correcto y en fallo; confirmar dia valido en ambos casos.
- Probar idempotencia (recargar/remontar durante la preparacion).
- Perfil con alergia dura: confirmar que el primer dia la respeta.
- Confirmar que no se vuelve a generar al reabrir la app.

---

## REQ-35 - Onboarding minimo viable con divulgacion progresiva

**Estado: implementado.**
El onboarding pasa de 5 pasos densos a 4 pasos ligeros. Paso 3 (entrenamiento) conserva disciplina, fuerza, duración, experiencia, minutos y días/lugar; difiere prioridad, horario, equipo, lesiones y limitaciones. Nuevo paso 4 combinado pide solo número de comidas, patrón de alimentación, alergias, consentimiento core y screening de seguridad; difiere ventana alimentaria, horarios exactos, cocinas, preparaciones, presupuesto, repetición y fotos. Los campos diferidos tienen defaults válidos desde `migrateProfilePrefs` y se siguen enviando al coach como JSON estructurado. `saveOnboarding()` marca `onboardingEssentialOnly:true` en prefs para ciclos nuevos; `saveProfile()` setea `profileRefinedAt` al guardar desde Perfil. `needsProfileTuning()` detecta el estado y muestra un banner "Afina tu plan" en Home y Perfil. `validate-privacy.mjs` actualizado: el consentimiento de fotos se comprueba en `pf_consent_photos` (Perfil) en lugar de `ob_consent_photos`. Service worker v35.

### Objetivo

Reducir la friccion de activacion: pedir en el alta solo lo imprescindible para calcular metas y armar el primer dia, y diferir el resto a Perfil con un nudge posterior, sin perder el perfil flexible de REQ-12. Hoy el onboarding son 5 pasos densos (el paso 3 tiene ~13 campos; el 5 mezcla dieta, cocinas, preparaciones, alergias, dos consentimientos y el cuestionario de seguridad) antes de ver cualquier valor.

### Dependencias

- Requiere REQ-12 (perfil v3, implementado). Se coordina con REQ-34 (primer valor) y, si aplica, con REQ-33 (funnel).

### Alcance

- Separar los campos del perfil en "esenciales" (datos corporales, objetivo, dias y lugar de entreno, numero de comidas, alergias, consentimiento esencial y screening de seguridad) y "afinables" (cocinas, preparaciones, presupuesto, horario preferido, ventana alimentaria, ingredientes preferidos, notas, movimientos a evitar).
- El alta solicita solo esenciales con valores por defecto sensatos; los afinables quedan con default y un nudge posterior ("Afina tu plan") accesible desde Home/Perfil.
- No degradar el contexto del coach: los afinables se siguen guardando (con default) y enviando como JSON estructurado.
- Conservar la migracion de perfiles existentes y `profileSchemaVersion` sin reabrir onboarding.
- Mantener obligatorias en el alta las validaciones duras: edad minima, alergias y screening de seguridad.
- Sin overflow en 375x812 y 390x844.

### Criterios de aceptacion

- Un usuario nuevo completa el alta con notablemente menos campos y llega antes al primer valor.
- Los campos diferidos tienen default valido y pueden completarse despues sin volver a hacer onboarding.
- Edad minima, alergias y screening siguen siendo obligatorios en el alta.
- El coach sigue recibiendo el perfil completo (con defaults) como datos estructurados.
- Editar una preferencia diferida no borra progreso ni planes.
- Commit y push propios.

### Verificacion sugerida

- Alta nueva: confirmar menos pasos y que el plan se puede generar.
- Completar afinables luego desde Perfil y verificar persistencia.
- Perfil heredado: confirmar migracion sin reabrir onboarding.
- Revisar el prompt del coach con datos completos.

---

## REQ-36 - Unificar acciones de comida (cambiar/adaptar)

**Estado: implementado.**
La tarjeta de comida ahora expone un único botón primario "Cambiar" que abre una hoja con motivo opcional (Sin cocina / Comer fuera / Sin ingrediente) y a continuación la lista de platos con delta de kcal visible y selector de alcance (Solo hoy / Esta semana). "Ver receta" y "Editar valores" se unificaron en el botón secundario "···" que abre un modal con la receta completa y la opción de editar. "Volver al plan" aparece ante cualquier override (antes solo con motivo). `contingencyLog` sigue registrando tipo, motivo, plato elegido y prescripción previa. Sin SQL nuevo.

### Objetivo

Eliminar la redundancia entre "Reemplazar" y "Adaptar" en la tarjeta de comida y reducir la carga de decision a dos acciones claras. Hoy cada comida ofrece hasta cinco botones (Ver receta, Reemplazar, Editar valores, Adaptar, Volver al plan) donde "Reemplazar" y "Adaptar" terminan en el mismo flujo de reemplazo (`openReplace`), con o sin motivo.

### Dependencias

- Requiere REQ-19 (contingencias, implementado).

### Alcance

- Consolidar "Reemplazar" y "Adaptar" en una sola accion ("Cambiar") que abra una hoja con motivo opcional (no puedo cocinar / como fuera / sin ingrediente) y luego las opciones con delta de macros y alcance (solo hoy / esta semana). El motivo deja de ser un paso separado obligatorio.
- Degradar "Editar valores" y "Ver receta" a acciones secundarias (p. ej. menu overflow) sin perder funcionalidad.
- Conservar el registro en `contingencyLog` (motivo, opcion elegida, prescripcion previa) y el boton "Volver al plan".
- Mantener consistencia de verbo con Entreno ("Adaptar"/"Cambiar").

### Criterios de aceptacion

- La tarjeta de comida no muestra dos botones distintos que lleven al mismo flujo de reemplazo.
- Cambiar una comida sigue registrando motivo (cuando se indica), alcance y delta, y se puede revertir.
- No se pierde ninguna funcionalidad existente (editar valores, ver receta, comida personalizada).
- Sin overflow de botones en movil.
- Commit y push propios.

### Verificacion sugerida

- Cambiar una comida con y sin motivo; alcance hoy vs semana; revertir al plan.
- Editar valores y ver receta desde la accion secundaria.
- Revisar 375x812 sin overflow.

---

## REQ-37 - Accesibilidad de modales y confirmacion de acciones destructivas

**Estado: implementado.**
`modal()` ahora asigna `role="dialog"` y `aria-modal="true"` al sheet, conecta `aria-labelledby` al primer `<h3>` (id `sheet-title`), añade `aria-label="Cerrar"` al botón ✕, guarda el elemento disparador y lo restaura al cerrar, y registra un handler de teclado (`_modalKeyHandler`) que cierra con Esc y atrapa el foco con Tab/Shift-Tab dentro del sheet. `delExtra()` pide confirmación antes de eliminar una comida extra, consistente con las otras acciones destructivas. El bloque de actualización directa del sheet en el check-in semanal también incluye `aria-label` en su botón de cierre e `id="sheet-title"` en su h3. La remoción directa del overlay en `signOutUser()` fue reemplazada por `closeModal()` para limpiar el listener de teclado al cerrar sesión. Sin SQL nuevo.

### Objetivo

Cerrar brechas de teclado y foco en los modales (`.sheet`) y unificar la confirmacion de acciones destructivas. Hoy los modales solo cierran con la X o clic fuera (sin Esc ni atrapado de foco) y algunas acciones destructivas no piden confirmacion (p. ej. eliminar comida extra), a diferencia de otras que si lo hacen.

### Dependencias

- Ninguna tecnica.

### Alcance

- Modales: atrapar el foco mientras estan abiertos, cerrar con Esc, devolver el foco al elemento disparador al cerrar y marcar `role="dialog"`/`aria-modal="true"` con un titulo asociado.
- Confirmar las acciones destructivas que hoy no confirman (al menos eliminar comida extra), de forma consistente con las que ya lo hacen.
- No introducir regresiones en los flujos que abren/cierran modales (editor, reemplazo, contingencias, check-in, generadores).

### Criterios de aceptacion

- Con teclado, el foco no escapa del modal abierto y Esc lo cierra.
- Al cerrar un modal, el foco vuelve a un punto razonable.
- Borrar una comida extra pide confirmacion.
- Lectores de pantalla anuncian el modal como dialogo.
- Commit y push propios.

### Verificacion sugerida

- Navegacion por teclado en editor, reemplazo y check-in; probar Esc y foco de retorno.
- Borrar una comida extra y confirmar el paso de confirmacion.
- Revision rapida con un lector de pantalla o el arbol de accesibilidad.

---

## REQ-38 - Notificaciones push y recordatorios de racha

**Estado: implementado.**
Transporte Web Push estándar con VAPID (sin FCM ni OneSignal). Tabla `push_subscriptions` con RLS. UI de permiso con gesto explícito y explicación en Perfil → Avisos del dispositivo; manejo de los tres estados (`default`/`granted`/`denied`). Endpoint `api/push-subscribe` (POST/DELETE) con verificación de sesión. Handlers `push` y `notificationclick` en el service worker (v37). Cron horario extendido en `api/notify.js` con `web-push`: deduplicación idempotente vía `notification_log` (tipo `push_streak`), máximo un push por día, purga de suscripciones caducadas (410). Variables de entorno: `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` y opcional `VAPID_PUBLIC_KEY`. Clave pública embebida en el frontend como literal; la privada solo en el servidor. Migración: `supabase/push_subscriptions.sql` (aplicada en producción 2026-06-18).

### Objetivo

Enviar recordatorios push al dispositivo (estilo Duolingo) para que el usuario no pierda su racha, solo con permiso explicito del dispositivo y consentimiento, y solo cuando hay algo pendiente. El recordatorio refuerza la constancia sin castigar descansos planificados.

### Dependencias

- Requiere REQ-14 (consentimiento; hoy no se pide permiso de notificaciones, se introduce aqui un consentimiento contextual).
- Requiere REQ-23 (definicion justa de racha: un descanso planificado no la rompe; el recordatorio solo aplica cuando la racha esta realmente en riesgo).
- Comparte infraestructura con REQ-24 (scheduler por zona horaria, deduplicacion idempotente, "enviar solo si hay acciones pendientes", baja en un paso). REQ-24 ya anticipa "preparar la arquitectura para otros canales sin implementar push todavia": este es ese canal.
- Debe consultar entitlement cuando exista REQ-25.

### Decision previa bloqueante (proveedor/transport)

- Definir y documentar el transporte antes de cargar nada: **Web Push estandar con VAPID** (sin costo de proveedor, la clave privada vive solo en el servidor) frente a un **proveedor** (FCM/OneSignal). La eleccion condiciona claves, esquema de suscripciones y el job de envio.
- Contemplar iOS: el web push solo funciona en la **PWA instalada** (iOS 16.4+); en Safari no instalado no hay push. La UX debe explicarlo y, en su caso, invitar a instalar primero.
- Requiere secretos (clave privada VAPID o credenciales del proveedor). No crear cuentas, compras ni secretos automaticamente: si faltan, bloquear con un reporte.

### Alcance

- **Flujo de permiso del dispositivo:**
  - Solicitar `Notification.requestPermission()` SOLO tras un gesto explicito del usuario y despues de explicar el valor ("Activa los recordatorios para no perder tu racha"). Nunca al cargar la app.
  - Manejar los tres estados: `default` (no preguntado), `granted`, `denied`. Si esta `denied`, no volver a forzar el prompt; explicar como reactivarlo desde los ajustes del dispositivo.
  - Registrar la `PushSubscription` y guardarla por usuario (tabla con RLS), ligada a un consentimiento de recordatorios revocable.
- **Service worker:** anadir handlers `push` (mostrar la notificacion) y `notificationclick` (abrir el dia correcto en la PWA). Hoy el SW solo cachea; no debe romperse el cache existente.
- **Scheduler server-side** (Vercel Cron o `pg_cron`) que por usuario y zona horaria determine si la racha esta en riesgo (dia por terminar, con racha activa y sin actividad registrada) y envie como maximo un push por dia con clave idempotente.
- **Preferencias:** opt-in, hora limite, dias habilitados y tipo (racha / nutricion / entreno), reutilizando o compartiendo el modelo de REQ-24.
- No enviar a usuarios sin permiso del dispositivo, sin consentimiento, inactivos o sin acciones pendientes; completar la actividad antes del envio cancela el recordatorio.
- No incluir datos corporales ni sensibles en el titulo o cuerpo de la notificacion.
- Lenguaje invisible (REQ-31): la notificacion habla de "tu coach"/"tu racha", nunca de tecnologia, proveedor ni modelos.
- La clave privada VAPID o las credenciales del proveedor viven solo en el servidor; nunca en el cliente ni en el repo.

### Criterios de aceptacion

- El permiso del dispositivo solo se solicita tras un gesto y una explicacion; un `denied` no se vuelve a forzar.
- Sin permiso del dispositivo y consentimiento vigente no se envia ningun push.
- Un usuario con la racha en riesgo recibe como maximo un recordatorio por dia; reintentos del job no duplican.
- La notificacion abre el dia correcto despues de autenticarse.
- Completar la actividad pendiente antes del envio cancela el recordatorio.
- La zona horaria del usuario decide cuando termina el dia.
- Ninguna notificacion expone datos sensibles ni vocabulario tecnico.
- No hay secretos en el cliente ni en el repo.
- Un descanso planificado no genera un recordatorio de "racha en riesgo".
- Commit y push propios.

### Verificacion sugerida

- Probar el permiso: `default`→`granted`, `default`→`denied` y la guia de reactivacion.
- Probar en PWA instalada (incluido iOS 16.4+ en modo standalone) y en navegador de escritorio.
- Ejecutar el job en `dry-run` con usuarios en distintas zonas horarias; simular entrega, reintento y deduplicacion.
- Confirmar que sin actividad pendiente o con descanso planificado no se envia.
- Verificar que el service worker maneja `push`/`notificationclick` sin romper el cache.

---

## REQ-39 - Editor administrativo de dietas y asignaciones

**Estado: implementado (2026-06-18).**

### Evidencia

- `index.html` carga `diets` y `diet_dishes` en `dbLoad()` y `foodsDiets()` solo renderiza filas; no existe accion para crear, editar, reasignar o eliminar asignaciones de menu.
- `supabase/auth.sql` ya da escritura admin sobre `ingredients`, `dishes`, `dish_ingredients`, `diets` y `diet_dishes`, por lo que la brecha es de producto/UI, no de permisos.
- `README.md` documenta que desde la app se pueden crear y editar ingredientes y platos, pero no dietas. `CONTEXT.md` tambien lista "Editor de dietas" como pendiente.

### Objetivo

Permitir que un administrador mantenga los menus nutricionales desde la app sin tocar SQL manual, conservando macros calculados desde recetas y sin reescribir historial personal.

### Dependencias

- Requiere REQ-01 y REQ-02 para recetas/macros confiables.
- Requiere REQ-07 para rol admin y RLS de escritura sobre catalogo.
- Debe respetar REQ-31: usuarios normales no ven lenguaje tecnico ni controles administrativos.

### Alcance

- En Perfil -> Alimentos -> Dietas, agregar controles admin para:
  - crear y editar `diets` (`code`, `name`, `description`);
  - agregar, cambiar y eliminar filas de `diet_dishes`;
  - elegir dia de semana, slot y plato desde el catalogo existente;
  - mostrar resumen de kcal/proteina promedio y avisos por dia/slot.
- Validar antes de guardar:
  - plato existente y activo en el catalogo;
  - slot compatible con el plato o confirmacion explicita si se reutiliza fuera de su slot;
  - ausencia de duplicados para la misma dieta, dia y slot;
  - dieta con codigo y nombre no vacios.
- Mantener el comportamiento historico:
  - no modificar `day_log`, `plan_versions` ni registros ya ejecutados;
  - las nuevas asignaciones solo afectan catalogo/fallback y futuras consultas de `dietLunchDish()`;
  - conservar RLS: solo admins activos escriben, usuarios normales solo leen lo necesario para su plan.
- Si se agrega una restriccion SQL, debe ser idempotente y documentarse como migracion pendiente manual.

### Criterios de aceptacion

- Un admin puede crear una dieta y asignar/cambiar/quitar un plato por dia/slot desde la UI.
- Al recargar, `dbLoad()` muestra las asignaciones guardadas y los macros calculados coinciden con la receta del plato.
- El sistema bloquea o advierte duplicados e incompatibilidades de slot antes de guardar.
- Un usuario no administrador no ve controles de edicion ni puede mutar `diets`/`diet_dishes`.
- Editar el catalogo no cambia dias completados ni snapshots de planes activos ya guardados.
- La vista funciona sin overflow en 375x812.
- Commit y push propios.

### Verificacion sugerida

- Como admin: crear una dieta de prueba, asignar almuerzos de lunes a domingo, recargar y comprobar persistencia.
- Cambiar una asignacion usada por `dietLunchDish()` y verificar que un dia futuro sin override toma el nuevo plato.
- Intentar duplicar dieta/dia/slot y confirmar bloqueo o advertencia.
- Probar usuario normal: sin acceso a la vista/admin y sin mutacion directa permitida por RLS.
- Ejecutar `git diff --check` y el release gate local.

---

## REQ-40 - Home Hoy: agenda determinista del dia (sin IA)

**Estado: implementado.**

La implementación reemplaza la tarjeta prioritaria única de `renderHoy()` por un bloque "Lo que sigue hoy" debajo del strip de macros. La agenda se calcula en cliente desde `buildDay()`, `dayTotals()`, `effectiveWorkout()`, `normalizedWorkoutExecution()` y el estado local: muestra la próxima comida pendiente y el entrenamiento pendiente con acciones directas, conserva descanso planificado sin sugerir entrenar, y añade estados explícitos para día sin comidas preparadas, día cerrado y operación con datos guardados/offline. Los clicks de "Registrar", "Iniciar", "Adaptar" y "Preparar mi día" instrumentan `home_agenda_action` con propiedades seguras (`source`, `action`, `slot`, `day_of_week`) y no disparan llamadas al proveedor salvo el CTA explícito de preparar día. Service worker v38.

### Contexto y decision de producto

Se evaluo convertir la app en "IA agentic first" con la conversacion como entry point. El review heuristico concluyo que la columna vertebral real no es el chat (caro, alto esfuerzo, pagina en blanco) sino la **agenda determinista** "que sigue ahora", que hoy ya calcula `nextDailyAction()` sin gastar tokens. Esta fase entrega y mide ese nucleo de forma aislada, antes de tocar IA o navegacion. Es la pieza de mayor valor a costo cero.

### Evidencia

- `renderHoy()` (en `index.html`) muestra una sola "prio-card" con la accion prioritaria del dia y tres botones de atajo (`home-quick`). Solo expone un item a la vez aunque queden comida **y** entreno pendientes.
- `nextDailyAction(ds)` ya deriva de forma determinista el estado del dia (comida pendiente, entreno pendiente, descanso, completado) reutilizando `buildDay()`, `effectiveWorkout()`, `dayTotals()`, `normalizedWorkoutExecution()` y `workoutOutcomeForState()`. No hace llamadas al proveedor.
- No existen estados de diseno para: dia 0 sin plan generado, dia totalmente completado (cierre celebratorio) ni operacion sin conexion.

### Objetivo

Que al abrir "Hoy" el usuario vea, sin una sola llamada IA, **todo lo que le toca hoy** (proxima comida y entreno pendiente) con acciones directas, mas un cierre claro cuando termina y un arranque claro cuando aun no tiene plan. Metrica norte: adherencia (porcentaje de comidas registradas y entrenos completados por semana). Guardarrail: costo IA por usuario activo no debe subir con esta fase (debe ser cero).

### Dependencias

- No requiere migracion ni decisiones manuales: es 100% cliente y determinista. Puede ejecutarse antes que las fases de IA.
- Reutiliza REQ-22 (`nextDailyAction`) y REQ-27 (`trackEvent`) ya presentes.

### Alcance

- Reemplazar la "prio-card" unica por un bloque "Lo que sigue hoy" que liste, en orden, los items pendientes del dia calculados por `nextDailyAction()` y `buildDay()`:
  - proxima comida no registrada, con kcal/proteina del plato y boton "Registrar" que llama a `toggleMeal()` directo;
  - entreno pendiente (solo si no se entreno y no es descanso), con boton "Iniciar" (ir a `entreno`) y "Adaptar" (`openWorkoutContingency()`);
  - sello "Tu agenda" o equivalente; nunca lenguaje de IA (REQ-31).
- Conservar el strip de macros (`heroDash`) siempre visible arriba.
- Disenar los tres estados huerfanos:
  - **Dia 0 / sin plan:** mensaje de bienvenida + CTA unico para generar/afinar el plan (a Perfil u onboarding), sin agenda vacia confusa.
  - **Dia completado:** estado de cierre con racha, comidas/entreno del dia y atajo a Progreso (reusar caso `type:"complete"`).
  - **Sin conexion / datos no cargados:** la agenda sigue mostrandose desde cache local; degradar sin pantallas en blanco ni errores tecnicos.
- Conservar el rotulo de pestana "Hoy" (no renombrar): evitar costo de re-aprendizaje. **No** promover el chat ni cambiar la navegacion en esta fase.
- Mantener 375x812 sin overflow y minimo 44px de area tactil en los botones.
- Instrumentar un evento de adherencia determinista (allowlist REQ-27) al registrar comida o iniciar entreno desde el home, para poder medir la fase de forma aislada. Sin datos de salud en el evento.

### Criterios de aceptacion

- Con comida y entreno pendientes, el home muestra **ambos** items con sus acciones, no solo uno.
- Registrar una comida o iniciar el entreno desde el home no dispara ninguna llamada a `/api/claude` (verificable en red).
- Dia 0 muestra bienvenida y CTA de plan; dia completado muestra cierre; sin conexion muestra la agenda desde cache.
- Ningun texto del home menciona IA, modelos, tokens ni cuotas.
- La vista no presenta overflow en 375x812.
- Commit y push propios.

### Verificacion sugerida

- Simular dia con 2 comidas y entreno pendientes: confirmar dos items y acciones.
- Registrar comida desde el home con el panel de red abierto: cero llamadas al proveedor.
- Forzar `DB.error`/offline y confirmar que la agenda persiste desde cache.
- Revisar estados dia-0 (perfil sin plan) y dia-completado.
- `git diff --check` y release gate local.

---

## REQ-41 - Coach ejecutor con guardrales de confianza

**Estado: implementado.**

La implementacion mantiene el chat como propuesta confirmada y agrega una compuerta unica `canApplyCoachAction(action)` antes de mostrar o ejecutar botones del coach. El vocabulario queda acotado a `marcar_descanso`, `registrar_comida`, `cambiar_plato`, `adaptar_entreno` y `registrar_peso`; `parseCoachReply()` normaliza el schema, `/api/claude` rechaza respuestas conversacionales con acciones fuera de vocabulario, y `domain-contracts.js` valida la forma de cada accion en pruebas Node. Una accion bloqueada muestra una explicacion neutral y no ofrece "Aplicar". Las acciones validas reutilizan las rutas deterministas existentes: comidas se registran sin toggle inverso, cambios de plato exigen catalogo real, slot compatible, receta con macros y restricciones/gustos del perfil; entreno abre o aplica las contingencias existentes sin reescribir sesiones registradas; descanso usa `workoutOverride="descanso"` con log; peso escribe en `weight_log` del ciclo actual. La reserva, sesion, usuario activo, privacidad, entitlement y cuota siguen verificandose en `/api/claude` antes de devolver propuestas. Sin SQL nuevo. Service worker v39.

### Contexto y decision de producto

El coach actual solo sabe ejecutar una accion (`marcar_descanso`); todo lo demas es texto. El salto agentico es que el coach **haga** cosas (registrar comida, cambiar plato, adaptar entreno, registrar peso). El review marco esto como el riesgo numero uno: un coach que ejecuta puede romper el plan o violar restricciones del usuario (p. ej. proponer un plato con huevo a un vegetariano sin huevo) y destruir la confianza en un solo toque. Por eso la regla dura: el modelo solo **propone intencion**; un validador determinista decide si la accion es legal **antes** de ofrecer el boton "Aplicar".

### Evidencia

- `sendCoachMessage()` arma el prompt con un unico tipo de accion (`marcar_descanso`); `parseCoachReply()` acepta `accion.tipo`/`accion.descripcion` libres; `applyCoachAction()` solo implementa `marcar_descanso`.
- `domain-contracts.js` ya expone validadores puros (`validateDayLogState`, `validateMacroTargets`, `validateCoachRequest`, etc.) reutilizables como compuerta.
- `profiles.prefs` guarda alergias/gustos; los platos tienen `slot`; existe logica de compatibilidad de slot y override por dia (REQ-36).

### Objetivo

Permitir que el coach proponga y, tras confirmacion, ejecute un conjunto acotado de acciones, garantizando que **ninguna** accion que viole restricciones del usuario (alergias, slot, metas, plan activo, historial ya ejecutado) llegue siquiera a ofrecerse. La IA sigue siendo opt-in y con techo de costo por usuario.

### Dependencias

- Requiere REQ-40 entregado (el home determinista es la base sobre la que actua el coach).
- Requiere REQ-25/26 (entitlement + cuota) ya activos en produccion: la ejecucion es una mutacion sensible y debe comprobar sesion, usuario activo y entitlement en servidor.
- Requiere que las migraciones manuales de entitlement esten aplicadas.

### Alcance

- Definir una compuerta unica `canApplyCoachAction(action)` (cliente + validacion server-side en el endpoint que persista) que, para cada tipo de accion, valide de forma determinista contra: alergias/gustos de `profiles.prefs`, compatibilidad de slot, metas de macros, plan activo y dias ya completados. Aplicarla tambien a `marcar_descanso`.
- Ampliar el vocabulario de acciones de forma controlada, cada una enrutada a la funcion determinista existente y nunca reescribiendo dias completados:
  - `registrar_comida` -> `toggleMeal()`;
  - `cambiar_plato` -> flujo de contingencia/override de REQ-36, solo con platos validos y del slot correcto;
  - `adaptar_entreno` -> `openWorkoutContingency()` (20 min / en casa / sin equipo / sesion perdida);
  - `registrar_peso` -> registro de peso existente.
- Mantener el patron `propuesta -> confirmar -> aplicar`: el usuario siempre confirma; las acciones rechazadas por la compuerta no muestran boton "Aplicar" sino una explicacion neutral.
- Schema de salida estricto, validacion, timeout, manejo de error y **techo de uso por usuario** reutilizando `coach_quota` (REQ-32). Sin texto de IA/tokens para usuarios normales (REQ-31).
- Si se requiere persistir auditoria de acciones, usar SQL idempotente documentado como migracion manual; preferir reutilizar tablas existentes.

### Criterios de aceptacion

- Una accion que viola una restriccion (p. ej. plato con ingrediente alergeno o de slot incompatible) **no** ofrece boton "Aplicar"; muestra explicacion neutral.
- Aplicar una accion valida produce exactamente el mismo resultado que hacerlo manualmente por la UI determinista, y nunca modifica un dia ya completado.
- La ejecucion comprueba sesion, usuario activo y entitlement en servidor; un usuario sin entitlement no puede mutar via coach.
- Se respeta el techo de costo por usuario; al superarlo, fallback determinista sin llamar al proveedor.
- Ningun texto operativo menciona IA, modelos, tokens ni cuotas.
- Commit y push propios.

### Verificacion sugerida

- Proponer un cambio de plato con alergeno del usuario y confirmar que se bloquea antes de ofrecer "Aplicar".
- Aplicar `registrar_comida` y comparar el estado resultante con `toggleMeal()` manual.
- Intentar accion sobre un dia completado y confirmar que no lo reescribe.
- Forzar limite de cuota y confirmar fallback determinista.
- Revisar que la mutacion falla sin entitlement (usuario de prueba).

---

## REQ-42 - Home agentico: conversacion como entry point

**Estado: implementado.**
Coach integrado en Home: tabs 6→5, renderHoy() fusionado con chips contextuales e input del coach; degradacion limpia sin IA.

### Contexto y decision de producto

Solo despues de validar que la agenda determinista (REQ-40) mueve la adherencia y que el ejecutor (REQ-41) es seguro, se promueve la conversacion a superficie principal. El review advirtio no mezclar este cambio de navegacion con las fases anteriores para poder atribuir el impacto, y conservar la degradacion: sin IA o sin conexion, el home colapsa exactamente a la agenda determinista de REQ-40.

### Evidencia

- La pestana "Coach" es la 5.a de 6 (`renderTabs()`), con el mismo peso visual que el resto: la conversacion esta enterrada.
- `buildCoachContextText()` ya alimenta al coach con macros, entreno, semana y check-ins: el contexto para un home conversacional ya existe.
- `renderHoy()` (post REQ-40) y `renderCoach()` comparten datos pero viven en pantallas separadas.

### Objetivo

Hacer de la conversacion el eje de la pantalla de inicio, con la agenda determinista y los macros siempre encima, los chips aterrizados en el estado actual y el input de coach a mano, sin subir el costo base (cargar el home sigue costando cero tokens; la IA solo se activa al tocar un chip o escribir).

### Dependencias

- Requiere REQ-40 (agenda determinista) y REQ-41 (ejecutor con guardrails) entregados y con metrica de adherencia validada.

### Alcance

- Fusionar la pantalla de inicio y el coach en un `renderCoachHome()` que muestre, en orden: cabecera + racha, strip de macros (`heroDash`), bloque "Lo que sigue hoy" (REQ-40), separador "O preguntale a tu coach", chips contextuales derivados del estado e input persistente.
- Reducir la navegacion de 6 a 5 pestanas integrando el coach en el inicio; conservar Nutricion, Entreno, Progreso, Perfil como superficies de detalle. Conservar un rotulo de inicio reconocible (no introducir lenguaje de IA).
- Generar los chips de sugerencia desde el estado real (kcal restantes, comida pendiente, sesion perdida) de forma determinista; tocar un chip o escribir es el unico punto que gasta tokens.
- Degradacion: sin IA disponible o sin conexion, ocultar input/chips y mostrar solo la agenda determinista de REQ-40, sin errores tecnicos.
- Mantener 375x812 sin overflow, area tactil minima 44px y accesibilidad de foco del input.

### Criterios de aceptacion

- El inicio muestra macros + agenda determinista + acceso a conversacion en una sola pantalla, y cargarlo no dispara ninguna llamada a `/api/claude`.
- La navegacion baja a 5 pestanas sin perder acceso a Nutricion/Entreno/Progreso/Perfil.
- Los chips reflejan el estado actual del dia y solo gastan tokens al activarse.
- Sin IA o sin conexion, el inicio degrada a la agenda determinista sin romperse.
- Ningun texto operativo para usuarios normales menciona IA, modelos, tokens ni cuotas.
- Commit y push propios.

### Verificacion sugerida

- Cargar el inicio con el panel de red abierto: cero llamadas al proveedor hasta tocar un chip o enviar texto.
- Confirmar 5 pestanas y que cada superficie de detalle sigue accesible.
- Desactivar IA/forzar offline y confirmar degradacion a la agenda determinista.
- Revisar overflow en 375x812 y foco del input.

---

## REQ-43 - Gráfico de peso personalizado por usuario

**Estado: implementado.**

La implementación reemplaza los valores fijos `74/82` y la etiqueta `meta ~74.5` de `weightChart()` por un eje Y calculado desde los pesos reales del usuario con padding dinámico. La línea de referencia ahora muestra `Inicio` con el peso inicial del ciclo: prioriza el peso registrado en semana 1, luego `cycleStartWeight` y finalmente `weightKg` del perfil. Si no hay registros de peso, el gráfico mantiene el estado vacío sin línea de referencia. La superposición de porcentaje de grasa conserva su eje independiente. Service worker v41.

### Evidencia

- `weightChart()` en `index.html` (líneas ~6626 y ~6643-6644) tiene dos valores hardcodeados del primer usuario:
  - `const allY=pts.map(p=>p.y).concat([74,82])` fuerza el eje Y a incluir el rango 74-82 kg, distorsionando el gráfico para cualquier usuario con peso fuera de ese rango.
  - Las líneas de referencia SVG codifican `ys(82)` y `ys(74.5)` con la etiqueta `meta ~74.5`.
- Para un usuario con rango de peso 90-100 kg, el eje Y queda comprimido y la referencia "meta ~74.5" es irrelevante y puede ser confusa.
- Ningún REQ existente aborda la personalización de los valores de referencia del gráfico de peso.

### Objetivo

Que el gráfico de peso en Progreso refleje el rango real del usuario en lugar de los valores del primer usuario, y muestre una referencia significativa (peso de inicio del ciclo) en lugar de un valor hardcodeado.

### Dependencias

- Ninguna técnica. Cambio 100% en cliente (`weightChart()` dentro de `index.html`). No requiere migración SQL.

### Alcance

- Eliminar `concat([74,82])` del cálculo del eje Y. Usar solo los valores reales de peso registrado, más un padding dinámico (p. ej. ±2 kg o ±5 % del rango real).
- Reemplazar las dos líneas de referencia hardcodeadas (`ys(82)` y `ys(74.5)`) por:
  - Una línea de "Inicio" en el peso del usuario al arrancar el ciclo: en primer lugar el primer peso registrado en `weight_log` para este ciclo (`wkg(1)`); si no hay datos, usar `profile.prefs.weightKg` del perfil.
  - Eliminar la referencia `ys(82)` o convertirla en un margen visual sin etiqueta.
- Si no hay ningún punto de referencia disponible (`wkg(1)` nulo y `prefs.weightKg` ausente), omitir la línea de referencia.
- Conservar la superposición del porcentaje de grasa corporal con su eje independiente.
- Ningún texto nuevo menciona IA, proveedor, modelo ni cuota (REQ-31).

### Criterios de aceptacion

- Un usuario con rango de peso 90-100 kg ve el gráfico con eje Y centrado en ese rango, sin distorsión por valores de 74-82.
- La referencia mostrada corresponde al peso de inicio del ciclo del usuario activo, no un valor fijo de otro usuario.
- Si no hay datos de inicio, no se muestra ninguna referencia, y el gráfico sigue siendo útil.
- No hay regresión en el gráfico de usuarios con datos de grasa corporal.
- Commit y push propios.

### Verificacion sugerida

- Probar con un usuario cuyo rango de peso esté fuera de 74-82 (p. ej. 90-100 kg) y confirmar que el gráfico no comprime la curva en el extremo inferior del eje.
- Confirmar que la referencia muestra el peso de inicio, no "74.5".
- Probar sin datos registrados: sin línea de referencia, sin errores.
- `git diff --check` y release gate local.

---

## REQ-44 - Adherencia nutricional y contexto de peso en Progreso

**Estado: implementado.**

### Evidencia

- `progressStats()` en `index.html` muestra tres métricas: cambio de peso (delta del ciclo), entrenamientos completados (número absoluto) y racha actual. No muestra el porcentaje de adherencia nutricional del ciclo en curso.
- `getCycleSummary()` ya calcula `mealAdherence` (porcentaje de comidas planificadas efectivamente registradas), pero ese valor solo se muestra en el recap al cerrar el ciclo. Durante el ciclo el usuario no puede ver cuánto ha cumplido su plan de comidas en conjunto.
- La racha mide consistencia *consecutiva*, no adherencia acumulada: un usuario con 94 % de adherencia en el ciclo que falla un día ve "0 días de racha", sin poder saber que su adherencia global sigue siendo muy alta.
- Las tarjetas de ciclos completados en `progressJourney()` muestran `s.weightChange` (p. ej. `-2.5 kg`) pero no `s.startWeight` ni `s.endWeight`, que sí están guardados en `plan_cycles.summary` y que dan contexto imprescindible: bajar 2.5 kg desde 90 kg es diferente que desde 65 kg.

### Objetivo

Cerrar el ciclo de feedback de Progreso: mostrar al usuario, durante el ciclo activo, el porcentaje de adherencia nutricional acumulada, y en los ciclos completados el peso inicial y final junto al delta, sin necesidad de llamadas adicionales al servidor (todos los datos ya están disponibles en `getCycleSummary()` y `plan_cycles.summary`).

### Dependencias

- Ninguna técnica. Cambio 100% en cliente (`progressStats()` y `progressJourney()` dentro de `index.html`). No requiere migración SQL.
- Complementa REQ-43 (gráfico personalizado) dentro del mismo journey de Progreso.

### Alcance

- En `progressStats()`, añadir una cuarta tarjeta con la adherencia nutricional del ciclo en curso:
  - Llamar a `getCycleSummary()` (ya existe) para obtener `mealAdherence`.
  - Mostrar como `XX %` con la etiqueta "comidas del plan".
  - Si `plannedMeals` es 0 (ciclo sin comidas planificadas todavía), omitir la tarjeta o mostrar `—`.
  - Ajustar el grid de `summary` de `1fr 1fr 1fr` a `repeat(4,1fr)` o `repeat(2,1fr) repeat(2,1fr)` para que quepan cuatro en móvil sin overflow.
- En `progressJourney()`, dentro de cada tarjeta de ciclo completado, añadir inicio y fin de peso junto al delta existente:
  - Usar `s.startWeight` y `s.endWeight` ya almacenados en `plan_cycles.summary`.
  - Formato sugerido: `${s.startWeight} → ${s.endWeight} kg (${recapDelta(s.weightChange," kg")})`.
  - Si `s.startWeight` o `s.endWeight` son nulos, conservar solo el delta actual.
- Ningún texto nuevo menciona IA, proveedor, modelo ni cuota (REQ-31).
- Sin overflow en 375x812.

### Criterios de aceptacion

- La sección "Progreso" muestra el porcentaje de comidas planificadas registradas durante el ciclo activo, sin necesidad de cerrar el ciclo para verlo.
- Una racha de 0 días no impide ver una adherencia acumulada alta (p. ej. 85 %).
- Las tarjetas de ciclos completados muestran peso de inicio y fin junto al delta; si falta alguno, se muestra solo lo disponible sin errores.
- El layout no presenta overflow en 375x812 con las cuatro tarjetas visibles.
- Commit y push propios.

### Verificacion sugerida

- Simular un ciclo con 10 días registrados y 2 fallidos; confirmar que la adherencia muestra ~83 % aunque la racha sea 0.
- Probar sin ningún día registrado; confirmar que la tarjeta de adherencia muestra `—` o se omite sin errores.
- Simular un ciclo completado con `startWeight=90`, `endWeight=87.5`; confirmar que la tarjeta muestra "90 → 87.5 kg (-2.5 kg)".
- Revisar layout en 375x812 con las cuatro tarjetas.
- `git diff --check` y release gate local.

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

---

## REQ-45 - Selector de disciplina en dos pasos: cardio opcional, aviso cardiovascular y cardio ligero genérico

**Estado: implementado.**

### Evidencia

- `VALID_SPORTS = new Set(["running","cycling","swimming"])` en `domain-contracts.js:7` trata el cardio como obligatorio; el mensaje de error usa "deporte" en lugar de "disciplina" (`domain-contracts.js:45`).
- `SPORT_LABELS = {running:"Running",cycling:"Cycling",swimming:"Natación"}` en `index.html:786` — sin camino para quien no hace ningún deporte cardio.
- `ob_sport` (onboarding, `index.html:2267-2268`) y `pf_sport` (perfil, `index.html:4570-4571`) presentan el selector como si el cardio fuera universal, sin preguntar primero si el usuario lo practica.
- `sportSessions()` en `index.html:1062-1145` — cuando `primary` no está en `plans`, cae silenciosamente a `plans.running`, generando sesiones de running para perfiles que no corren.
- El diseño original mezclaba dos casos distintos bajo una sola opción "Otra actividad": (a) usuario que hace un deporte cardio no listado (tenis, box, hiking…) y (b) usuario sin ningún deporte cardio estructurado. El nombre "disciplina principal" no es correcto para el caso (b) porque no se está eligiendo una disciplina, se está indicando que no hay ninguna.

### Objetivo

Separar la selección de deporte en dos pasos explícitos: primero preguntar si el usuario practica algún deporte cardio, y solo entonces mostrar el selector de deporte. Para quien no hace cardio, reemplazar el selector por un camino limpio ("solo fuerza") con un aviso informativo único sobre actividad cardiovascular y la opción de incorporar sesiones de cardio ligero genérico al plan.

### Dependencias

- Ninguna técnica. Cambio 100 % en cliente (`index.html` y `domain-contracts.js`). No requiere migración SQL.

### Alcance

#### Paso 1 — bifurcación en el selector de deporte

El selector de deporte actual (onboarding paso 3, línea 2267-2268; perfil, línea 4570-4571) se reemplaza por dos controles en secuencia:

1. Una pregunta binaria: "¿Tienes un deporte cardio como actividad principal?" con dos opciones de radio o botones: **"Sí"** y **"No, solo entreno fuerza"**.
2. Si el usuario elige **"Sí"**, se despliega el select existente con las opciones: Running / Ciclismo / Natación / **Otro deporte cardio no listado** (valor `"other"`). El comportamiento de los tres deportes existentes no cambia. Para `"other"`, el plan genera solo sesiones de fuerza (sin cardio estructurado), tal como se describía en el diseño original de este REQ.
3. Si el usuario elige **"No, solo entreno fuerza"**, no se muestra ningún select de deporte. El campo `primarySport` se guarda con el valor `"strength_only"`.

`domain-contracts.js`: añadir `"other"` y `"strength_only"` a `VALID_SPORTS`. Actualizar el mensaje de error de `domain-contracts.js:45` para listar los valores válidos actualizados y reemplazar "deporte" por "disciplina".

`SPORT_LABELS` en `index.html:786`: añadir `other: "Otro deporte cardio"` (etiqueta visible en resumen/summary cuando el usuario eligió "Sí" + other). `"strength_only"` no necesita etiqueta en `SPORT_LABELS` porque su texto de resumen se genera por separado.

#### Paso 2 — comportamiento del plan para cada valor

- `primary === "running"` / `"cycling"` / `"swimming"`: sin cambios.
- `primary === "other"`: `sportSessions()` retorna sesiones de cardio vacías (sin `detail`), que el template descarta — el plan contiene solo fuerza. `trainingPlanSummary()` devuelve texto apropiado, p. ej.: `"Deporte cardio libre + fuerza — sin plan estructurado para tu deporte."`.
- `primary === "strength_only"`: `sportSessions()` retorna sesiones vacías idénticas al caso `"other"`. Si el usuario activó el toggle de cardio ligero (`prefs.lightCardioEnabled === true`), `sportSessions()` puede añadir una sesión genérica por semana etiquetada como "Cardio ligero (actividad aeróbica libre)" sin serie de ejercicios específicos de ningún deporte, únicamente duración e indicación de intensidad baja. `trainingPlanSummary()` devuelve texto apropiado, p. ej.: `"Solo fuerza — sin deporte cardio estructurado."` o, si tiene cardio ligero: `"Fuerza + cardio ligero (actividad aeróbica libre)."`.

#### Paso 3 — aviso informativo de salud cardiovascular

Cuando `primary === "strength_only"`, mostrar **una sola vez** un aviso informativo breve y no bloqueante (tipo banner o modal ligero) que:

- Informa de forma general sobre los beneficios de la actividad aeróbica moderada con referencia a la recomendación de salud pública (p. ej., ~150 min/semana de actividad aeróbica moderada según la OMS), sin dar consejo médico personalizado.
- Incluye un toggle o checkbox opcional: **"Agregar cardio ligero a mi plan"**. Si el usuario lo activa, escribe `prefs.lightCardioEnabled = true` en el perfil (campo persistido en Supabase junto al resto de prefs).
- Si el usuario cierra el aviso o elige no activar el toggle, el aviso **no debe volver a aparecer nunca**. La decisión se persiste en el objeto `UI` del localStorage (p. ej., `UI.cardioNudgeDismissed = true; uiSave()`), siguiendo el mismo patrón que `UI.installDismissed`.
- El aviso se muestra en el flujo de onboarding inmediatamente después de que el usuario selecciona "No, solo entreno fuerza" y avanza al paso siguiente, o bien al entrar a la pantalla de Perfil si el usuario cambia la opción ahí. En ambos casos solo se muestra si `!UI.cardioNudgeDismissed`.
- Ningún texto del aviso menciona IA, proveedor, modelo ni cuota (REQ-31). El lenguaje es informativo, no prescriptivo.

#### Restricciones de alcance

- No modificar la validación de piscina ni las sesiones de natación.
- `strengthSessions()` no depende de `primarySport` — sin cambios.
- `generateWorkout()` / filtrado por disciplina (líneas 5971-5984): `WORKOUT_EXERCISE_IDS["other"]` y `WORKOUT_EXERCISE_IDS["strength_only"]` serán `undefined`, el filtro ya no aplica — sin cambios requeridos.
- Probar en 375×812 sin overflow en la bifurcación y en el aviso.

### Criterios de aceptacion

- (a) Un usuario que selecciona "No, solo entreno fuerza" puede completar el onboarding sin error de validación en `domain-contracts.js`, y su plan semanal no contiene ninguna sesión de "Running · calidad", "Cycling · fondo", "Natación · técnica" ni ningún otro cardio estructurado de deporte específico.
- (b) El aviso de cardio aparece exactamente una vez para `primary === "strength_only"`. Tras cerrarlo (sin activar el toggle), `UI.cardioNudgeDismissed` queda en `true` y el aviso no reaparece al recargar la app, volver al onboarding ni al perfil.
- (c) Si el usuario activa el toggle antes de cerrar el aviso, `prefs.lightCardioEnabled` queda en `true`, se persiste en Supabase, y el plan generado incluye sesiones genéricas de cardio ligero sin mencionar ningún deporte específico.
- (d) Un usuario que selecciona "Sí" + "Otro deporte cardio" (`primary === "other"`) recibe un plan con solo sesiones de fuerza (sin cardio estructurado) y sin que aparezca el aviso cardiovascular.
- (e) Los tres deportes existentes (running, cycling, swimming) no sufren regresión: sus sesiones de cardio se siguen generando correctamente.
- (f) El summary box en onboarding y perfil muestra texto coherente para `"other"` y `"strength_only"` (sin mencionar running/cycling/natación cuando no corresponde).
- Commit y push propios.

### Verificacion sugerida

- Completar onboarding con "No, solo entreno fuerza", verificar que el plan no tiene sesiones de cardio estructurado y que el aviso aparece; cerrarlo y confirmar que no reaparece en una recarga.
- Repetir el flujo activando el toggle: confirmar que `prefs.lightCardioEnabled === true` en Supabase y que el plan contiene sesiones de cardio ligero genéricas.
- Completar onboarding con "Sí" + "Otro deporte cardio": confirmar plan solo-fuerza sin aviso cardiovascular.
- Con cada uno de los tres deportes originales, verificar que sus sesiones de cardio se siguen generando correctamente.
- Ejecutar `domain-contracts.js` en Node con `primarySport="strength_only"` y `primarySport="other"` y confirmar que no arroja error.
- `git diff --check` y release gate local.

---

## REQ-46 - Simplificar configuracion de nutricion (ocultar ventana y repeticion en flujo estandar)

**Estado: implementado.**

### Evidencia

- `eatingWindowStart` / `eatingWindowEnd` se muestran en perfil como "Inicio de ventana" / "Fin de ventana" (`index.html:4544-4545`) y se leen en onboarding como `ob_window_start` / `ob_window_end` (`index.html:2409-2411`).
- `repeatPreference` se muestra en perfil como "Repetición aceptable" (`index.html:4554-4555`) con valores poco intuitivos: "Poca repetición", "Repetir 2-3 veces", "Priorizar practicidad" (`REPEAT_LABELS`, `index.html:821`). Se lee en onboarding como `ob_repeat` (`index.html:2415`).
- Los tres valores se envían al prompt de IA de nutrición: `eating_window.start/end` (`index.html:5702`) y `repetition` (`index.html:5706`). La lógica de generación los consume y debe seguir recibiéndolos.
- Los defaults ya existen y son sensatos: `repeatPreference: "moderate"` (`index.html:950`); ventana: primera/última hora de las comidas según `defaultMealTimes(mealCount)` (`index.html:945-946`).
- La validación `validateOnboardingNutStep()` (aprox. `index.html:2201-2208`) comprueba coherencia de la ventana; si los campos no están en el DOM, la lectura retorna `""`, lo que puede romper la validación — hay que condicionar esa rama.
- No existe ningún patrón `<details>/<summary>` ni sección colapsable en el código actual.

### Objetivo

Ocultar "Repetición aceptable" y la ventana de inicio/fin del flujo estándar (onboarding y perfil), usando defaults sensatos, exponiendo los controles solo bajo un bloque "Configuración avanzada" opcional en el perfil. No romper la lógica que consume esos valores.

### Dependencias

- Ninguna técnica. Cambio 100% en cliente (`index.html`). No requiere migración SQL.
- No depende de REQ-45 ni REQ-47.

### Alcance

- **Onboarding**: eliminar del HTML del paso de nutrición los tres inputs (`ob_window_start`, `ob_window_end`, `ob_repeat`). En `readOnboardingNutStep()`, mantener la lectura con fallback: `ws?.value || ""` y `rp?.value || "moderate"`. En `validateOnboardingNutStep()`, omitir las validaciones de ventana si `$('#ob_window_start')` es `null` (el paso ya no existe en el DOM).
- **Perfil** (sección nutrición, aprox. `index.html:4540-4560`): envolver los tres campos en `<details class="adv-settings"><summary>Configuración avanzada</summary>…</details>`, cerrado por defecto. Añadir CSS mínimo: `.adv-settings summary { cursor:pointer; color:var(--muted); font-size:13px; margin:8px 0; }`.
- **Defaults aplicados cuando los campos no están visibles**: `eatingWindowStart` = `defaultMealTimes(mealCount)[0]`; `eatingWindowEnd` = `defaultMealTimes(mealCount).slice(-1)[0]`; `repeatPreference` = `"moderate"`. Estos defaults ya existen en `planPrefsForDate()`; no duplicar lógica, solo asegurarse de que los valores llegan con ese fallback cuando los campos no están en el DOM.
- No tocar `planPrefsForDate()`, `buildMealPlanContext()` ni el prompt de IA — los valores siguen fluyendo.
- Usuarios con valores guardados distintos del default ven esos valores pre-llenados cuando expanden "Configuración avanzada" en perfil (la lectura de `p.repeatPreference`, `p.eatingWindowStart`, `p.eatingWindowEnd` no cambia).
- Ningún texto nuevo menciona IA, proveedor, modelo ni cuota (REQ-31).
- Probar en 375×812 sin overflow, bloque colapsado y expandido.

### Criterios de aceptacion

- En onboarding, el paso de nutrición no muestra los tres campos; el flujo se completa sin errores de validación de ventana.
- En perfil, los tres campos están dentro de `<details>` cerrado por defecto.
- Un usuario que expande "Configuración avanzada" puede cambiar y guardar los valores; la generación de nutrición los usa correctamente.
- Usuarios con valores previamente guardados distintos del default ven sus valores al expandir el bloque.
- No hay regresión en la generación de planes nutricionales: `eating_window` y `repetition` siempre llegan al prompt con valores válidos (default o configurados).
- Sin overflow en 375×812.
- Commit y push propios.

### Verificacion sugerida

- Completar onboarding sin ver los tres campos; confirmar que el plan nutricional se genera sin error.
- Abrir Perfil → nutrición; confirmar que "Configuración avanzada" está colapsada.
- Expandir, cambiar `repeatPreference` a "high", guardar y confirmar que `buildMealPlanContext()` retorna `repetition:"high"`.
- Probar con un usuario que ya tenga `eatingWindowStart` guardado distinto del default: confirmar que aparece al expandir.
- `git diff --check` y release gate local.

---

## REQ-47 - Indicadores de carga (spinners) en generacion de plan, coach y nutricion diaria

**Estado: implementado.**

### Evidencia

- Patrón existente de feedback en botones: `button.disabled=true` + `button.textContent="Guardando…"` en ~10 lugares (`index.html:1821,2067,4793,4865,4905,4983,5044,5079,6994`). Solo cubre operaciones de guardado rápido (<3 s); no hay feedback durante esperas largas.
- No existe ninguna clase CSS `spinner`, `loading` ni `skeleton` en el código.
- Operaciones con mayor fricción identificadas (sin feedback hoy):
  1. **Generación de plan de entrenamiento** (`openTrainingPlanGenerator()`, `index.html:6249`): solo hace `button.disabled=true` sin texto ni indicador visual durante la llamada a Claude (puede tardar 10-20 s).
  2. **Respuesta del coach** (`sendCoachMessage()`, aprox. `index.html:700-710`): el área de respuesta queda vacía/congelada mientras se espera; `toast()` solo aparece en error.
  3. **Generación de día nutricional** (botón de generación IA de día): el botón "Aplicar al día" se deshabilita tras recibir respuesta (`index.html:6440`) pero no hay indicador durante la generación.
- `<div class="toast" id="toast">` (`index.html:632`) es la única pieza de feedback transient existente; no sirve para esperas largas.

### Objetivo

Añadir un indicador de carga inline (spinner CSS puro + texto de estado) para las tres operaciones con mayor fricción que carecen de feedback hoy, sin afectar las operaciones que ya tienen su patrón `textContent` propio.

### Dependencias

- Ninguna técnica. Cambio 100% en cliente (`index.html`). No requiere migración SQL.
- No depende de REQ-45 ni REQ-46.

### Alcance

- **CSS** (bloque de estilos de `index.html`): añadir:
  ```css
  @keyframes spin{to{transform:rotate(360deg)}}
  .spinner{width:18px;height:18px;border:2px solid var(--border-2);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite;flex-shrink:0}
  .loading-row{display:flex;align-items:center;gap:10px;padding:14px 0;color:var(--muted);font-size:14px}
  @media(prefers-reduced-motion:reduce){.spinner{animation:none;opacity:.6}}
  ```
- **Generación de plan de entrenamiento** (`openTrainingPlanGenerator()`, `index.html:6249`): antes de llamar al API, inyectar `<div class="loading-row"><div class="spinner"></div><span>Preparando tu plan…</span></div>` en `#trainingPlanOut`. Al completar (éxito o error), `innerHTML` del contenedor se reemplaza con el resultado, eliminando el loading-row automáticamente.
- **Respuesta del coach** (`sendCoachMessage()` o equivalente, aprox. `index.html:700-710`): al enviar el mensaje, añadir un loading-row al final del hilo de mensajes del coach. Al recibir respuesta, reemplazar ese nodo con el mensaje del coach.
- **Generación de día nutricional** (la función que llama al API de generación y actualiza el contenedor del día): al iniciar, inyectar loading-row con texto "Preparando tus comidas de hoy…" en el contenedor del día nutricional. Al completar, reemplazar con el plan.
- No tocar los botones que ya usan el patrón `disabled + textContent` — ese patrón es suficiente para operaciones cortas.
- El loading-row debe eliminarse completo al completar la operación, sin dejar nodos huérfanos.
- Ningún texto nuevo menciona IA, proveedor, modelo ni cuota (REQ-31): los textos de estado son "Preparando…", "Tu coach está listo…" — sin mencionar Claude, tokens ni modelos.
- Probar en 375×812 sin overflow.

### Criterios de aceptacion

- Al disparar la generación de plan de entrenamiento, el usuario ve el spinner y el texto "Preparando tu plan…" en lugar de una pantalla congelada.
- Al enviar un mensaje al coach, el usuario ve el spinner y "Tu coach está pensando…" hasta recibir respuesta.
- Al regenerar el día nutricional con IA, el usuario ve "Preparando tus comidas de hoy…" con spinner.
- Con `prefers-reduced-motion: reduce` activo, el spinner no rota pero el texto de estado sigue visible.
- Tras recibir respuesta, el spinner/loading-row desaparece completamente; el contenido final es el único elemento visible.
- No hay regresión en el texto del coach ni en el plan de entrenamiento generado.
- Sin overflow en 375×812.
- Commit y push propios.

### Verificacion sugerida

- Throttling de red a Slow 3G en DevTools; disparar generación de plan y confirmar spinner visible durante la espera.
- Idem para el coach y la generación de día nutricional.
- Verificar con `prefers-reduced-motion` activo (DevTools → Rendering → Emulate) que no hay animación pero sí texto.
- Confirmar que el spinner desaparece por completo tras recibir respuesta (sin nodos `loading-row` huérfanos en el DOM).
- `git diff --check` y release gate local.

---

## REQ-48 - Panel de historial de pagos para el usuario

**Estado: implementado.**
Endpoint `api/billing-history.js` autenticado: verifica sesión activa, lee `billing_events` con `service_role` filtrando por `auth.uid()` y devuelve solo `event_type`, `plan_id`, `status`, `created_at`, `amount_cents` y `currency`. No expone `payload`, `stripe_event_id`, `error` ni eventos de otros usuarios. Perfil → "Mi suscripción" ahora muestra "Historial de pagos" debajo del estado del plan, con fecha, plan, monto si existe, estado legible y vacío "No hay pagos registrados en tu cuenta." para cortesías/admin/sin pagos. Test local `scripts/test-billing-history-api.mjs`. Service worker v42.

### Evidencia

- `subscriptionStatusHtml()` en `index.html:5198` muestra únicamente el estado vigente (plan activo/vencido/cortesía/sin plan), la fecha de vencimiento y un botón de renovación o de restaurar compra. No existe ninguna vista de transacciones pasadas.
- `billing_events` (`supabase/billing.sql`): tabla con campos `user_id`, `event_type`, `plan_id`, `status`, `payload` (jsonb con el evento Stripe completo, que incluye `amount`, `currency` y `created`), `created_at`. Índice en `(user_id)` y en `(event_type, created_at desc)`.
- RLS de `billing_events`: la tabla tiene `enable row level security` pero sin ninguna política declarada — el comentario explícito del archivo lo confirma (`billing.sql:18-19`: `-- Sin políticas RLS = solo service_role puede operar esta tabla`). No existe política `SELECT` para usuarios autenticados.
- `user_entitlements` (`supabase/entitlements.sql`): tiene la política `entitlement_select_own` que permite al usuario leer sus propias filas. Contiene `plan_id`, `status`, `starts_at`, `expires_at`, `origin` (`checkout`/`admin_courtesy`/`admin_grant`) y `payment_ref`. Un usuario con acceso de cortesía (`origin = 'admin_courtesy'`) no tiene ningún evento en `billing_events`.
- No existe ningún endpoint `api/billing-history.js` ni equivalente; `index.html` no consulta `billing_events` en ningún lugar.

### Objetivo

Que el usuario pueda ver en Perfil un listado de sus eventos de pago pasados — fecha, plan, monto si está disponible en el evento de Stripe, estado — ordenados de más reciente a más antiguo, con un mensaje claro cuando no hay historial (usuarios con cortesía o admin). No se exponen datos de otros usuarios ni el `payload` completo de Stripe.

### Dependencias

- Requiere REQ-26 (checkout y webhooks activos que pueblan `billing_events`).
- Requiere REQ-25 (entitlements) para leer `user_entitlements` como fuente complementaria de plan y fechas.
- Respetar REQ-31: ningún texto de la UI menciona Stripe, webhooks, eventos ni lenguaje técnico.

### Alcance

- Crear un endpoint de solo lectura `api/billing-history.js` que:
  - Verifique la sesión del usuario con el JWT de Supabase (`Authorization: Bearer …`).
  - Consulte `billing_events` filtrando estrictamente por `user_id = auth.uid()` usando `service_role` (dado que RLS no tiene política SELECT para usuarios; mismo patrón que `api/checkout.js`).
  - Proyecte solo los campos seguros: `event_type`, `plan_id`, `status`, `created_at`, y si existen en `payload`: `payload->>'amount'` y `payload->>'currency'` (monto en centavos de Stripe, convertido a display en el cliente).
  - Ordene por `created_at DESC`. Límite de 24 eventos.
  - No devuelva `stripe_event_id`, `error`, `entitlement_id` ni el `payload` completo.
- En la sección de suscripción de Perfil (`index.html:4703`), añadir debajo de `subscriptionStatusHtml()` una sección "Historial de pagos" que:
  - Llame al endpoint al cargar Perfil (junto a `loadEntitlement()`).
  - Muestre una lista con: fecha formateada, nombre del plan legible (`plan_id` → label), monto si disponible, estado del evento.
  - Si la lista está vacía (usuario de cortesía, admin o sin pagos), muestre "No hay pagos registrados en tu cuenta."
  - Solo se renderiza si hay sesión activa; no expone datos de otros usuarios.
- Alternativa descartada: ajustar RLS de `billing_events` con una política SELECT y leer directo desde el cliente. Descartada porque `billing_events` contiene el `payload` Stripe completo y exponerlo al cliente amplía la superficie de ataque; el patrón de `service_role` en un endpoint autenticado ya existe en el proyecto.
- Sin columnas SQL nuevas; usar solo lo que ya existe en `billing_events` y `user_entitlements`.
- Probar en 375×812 sin overflow.

### Criterios de aceptacion

- Un usuario con al menos un evento en `billing_events` ve en Perfil → sección de suscripción su historial con fecha, plan, monto (si disponible) y estado, ordenado de más reciente a más antiguo.
- Un usuario con acceso de cortesía o sin ningún evento ve "No hay pagos registrados en tu cuenta."
- El endpoint devuelve 401 si la petición no incluye un JWT válido.
- El endpoint nunca devuelve eventos de otro usuario; la consulta filtra estrictamente por el `uid` del JWT.
- El `payload` completo de Stripe, `stripe_event_id` y `error` no se incluyen en la respuesta al cliente.
- Ningún texto de la UI menciona Stripe, webhooks, tokens ni lenguaje técnico (REQ-31).
- Sin overflow en 375×812.
- Commit y push propios.

### Verificacion sugerida

- Con usuario de prueba con al menos un evento en `billing_events`: cargar Perfil y confirmar que aparece el historial.
- Con usuario de cortesía o admin: confirmar mensaje "No hay pagos registrados en tu cuenta."
- Sin sesión: confirmar que `api/billing-history.js` devuelve 401.
- Inspeccionar la respuesta JSON del endpoint y confirmar ausencia de `stripe_event_id`, `payload` completo y `error`.
- `git diff --check` y release gate local.

---

## REQ-49 - Checklist de revision legal antes del lanzamiento comercial

**Estado: pendiente. Requiere accion humana; no implementable por el agente autonomo.**

### Contexto y condicion de parada

Este requerimiento no produce código. Documenta los puntos de `PRIVACY.md` que exigen validación legal profesional antes de que Fitbros pueda lanzarse comercialmente. Si el agente autónomo (`agent-loop.json`) encontrara este REQ en cola, debe detenerse inmediatamente con la condición `legal_or_medical_decision_required` (ya declarada en `agent-loop.json:stopConditions`) y reportar los puntos pendientes sin intentar redactar texto legal ni tomar decisión alguna. Este REQ no debe agregarse nunca a la cola de `agent-loop.json`.

### Evidencia

- `PRIVACY.md:4`: `**Estado legal:** texto preliminar. Requiere revision profesional antes de un lanzamiento comercial.` — el documento completo de privacidad es una versión operativa preliminar, sin revisión profesional.
- `PRIVACY.md:10`: `La edad minima operativa es **18 anos**. No se habilitan cuentas de menores hasta definir el tratamiento legal y los consentimientos correspondientes.` — la restricción existe en el texto pero el tratamiento legal para menores no está definido.
- `PRIVACY.md:38`: `Los respaldos gestionados por proveedores deben configurarse para expirar en un maximo operativo de 30 dias. Este plazo y los contratos de los proveedores deben verificarse legalmente antes del lanzamiento comercial.` — el plazo de retención de backups y los contratos con proveedores (Supabase, Vercel, Anthropic, Stripe) no están verificados legalmente.

### Objetivo

Formalizar como requerimiento de producto los tres puntos de `PRIVACY.md` que requieren revisión legal externa, de modo que queden registrados en el backlog y no se omitan al preparar el lanzamiento comercial.

### Dependencias

- **Condicion de parada del agente**: `legal_or_medical_decision_required` (definida en `agent-loop.json:stopConditions`). El agente autonomo nunca intenta ejecutar este REQ.
- Debe completarse antes del primer cobro real (ver "Frontera de MVP para el primer cobro").
- Se coordina con REQ-14 (consentimiento y privacidad).

### Alcance — checklist de revision

Los tres puntos a revisar, tomados directamente de `PRIVACY.md`:

1. **Revision del documento completo de PRIVACY.md por un profesional legal** (`PRIVACY.md:4`).
   - El texto actual es preliminar y no ha sido revisado por un abogado.
   - Verificar que el lenguaje cumple la normativa aplicable (LGPD, GDPR si hay usuarios de la UE, leyes de privacidad del país de operación).
   - Confirmar que los propósitos declarados de tratamiento de datos (personalización de planes, fotos de progreso privadas) son suficientes, están correctamente limitados y son coherentes con lo que el código realmente hace.

2. **Tratamiento legal para menores de edad** (`PRIVACY.md:10`).
   - Hoy la app bloquea cuentas de menores. Verificar que esa restricción está adecuadamente comunicada en el flujo de registro (campo de fecha de nacimiento o confirmación explícita de mayoría de edad).
   - Si en el futuro se quiere bajar la edad mínima, definir previamente: consentimiento parental, datos a recopilar o excluir, y obligaciones legales por jurisdicción. Hasta entonces, documentar que la restricción de 18 años es intencional y no una omisión.

3. **Retencion de backups y contratos de procesamiento de datos con proveedores** (`PRIVACY.md:38`).
   - Verificar que el plazo operativo de 30 días para expiración de backups es configurable en Supabase y Vercel, y que coincide con las políticas reales de cada proveedor.
   - Revisar y archivar los contratos de procesamiento de datos (DPA) con Supabase, Vercel, Anthropic y Stripe; confirmar que permiten el uso previsto y definen sus propias obligaciones de retención y borrado compatibles con los compromisos de `PRIVACY.md`.

### Criterios de aceptacion

Los criterios de aceptación de este REQ son **acciones humanas**, no código:

- Un profesional legal revisó el documento completo de `PRIVACY.md` y emitió un dictamen o aprobó explícitamente su contenido para el mercado objetivo.
- El equipo confirmó por escrito que la restricción de edad mínima de 18 años está adecuadamente implementada y comunicada en el flujo de registro, y que el tratamiento legal de menores está documentado como fuera de alcance hasta nueva decisión.
- El equipo verificó con Supabase, Vercel, Anthropic y Stripe que el plazo de retención de 30 días para backups es configurable en cada proveedor, y que los contratos DPA están firmados o aceptados formalmente.
- La condición de cierre es una confirmación humana registrada en el repositorio (p. ej., una anotación en `PRIVACY.md` con "Revisado por: [nombre/fecha]" o un commit firmado por el responsable de producto o legal), no una verificación automatizada.
- El agente autónomo no completa ni intenta completar este REQ.

### Verificacion sugerida

No aplica verificación técnica automatizada. La verificación es documental:

- Confirmar que `PRIVACY.md` tiene una anotación de revisión con nombre y fecha del profesional que aprobó el contenido.
- Confirmar que los contratos DPA con los cuatro proveedores están archivados y referenciados.
- Confirmar que el flujo de registro muestra explícitamente la restricción de edad mínima antes de crear la cuenta.

---

## REQ-50 - Cupones de acceso gratuito (duración configurable) sin Stripe

**Estado: implementado.**
Migración `supabase/coupon_codes.sql`: tabla privada `redemption_codes`, constraint de `user_entitlements.origin` extendido con `coupon` y función transaccional `redeem_redemption_code()` para canjear un código de un solo uso creando el entitlement y marcándolo como usado en la misma operación. Endpoint `api/coupon.js`: `generate` solo admin con duración configurable y caducidad opcional del código; `redeem` para usuarios autenticados sin plan activo. Perfil muestra "¿Tienes un código de acceso?" cuando no hay plan activo, canjea sin Stripe, actualiza el estado inmediatamente y etiqueta el entitlement como "Acceso gratuito". Service worker v43. Prueba local `scripts/test-coupon-api.mjs`.

### Evidencia

- `supabase/entitlements.sql`: tabla `user_entitlements` con `origin check (origin in ('checkout','admin_courtesy','admin_grant'))`. Hay que agregar `'coupon'` a esa restricción mediante una migración SQL (`supabase/coupon_codes.sql`).
- `api/entitlement.js:GET` (línea ~51): consulta `status in (active,courtesy) and expires_at > now()` — un entitlement con `status='active'` y `origin='coupon'` sería detectado sin cambios en el endpoint.
- `index.html:5202-5204` (`subscriptionStatusHtml()`): ya distingue `origin === 'checkout'` → "Suscripción activa", `origin.includes('courtesy')` → "Acceso de cortesía", y cualquier otro → "Plan activo". Un entitlement `origin='coupon'` caería en el tercer caso; el alcance especifica mostrar "Acceso gratuito" para este origen, lo que requiere un cambio mínimo de una línea en esa función.
- `api/entitlement.js:POST` (línea ~79): ya existe un endpoint admin que otorga/revoca acceso de cortesía. La generación de cupones es distinta (códigos predistribuidos que el usuario canjea solo) y requiere un endpoint nuevo separado.
- `api/webhook.js`: crea entitlements con `origin: 'checkout'` y `payment_ref` del `payment_intent` de Stripe. El flujo de cupones no toca este archivo.
- `api/checkout.js`: redirige a Stripe. No se modifica.

### Objetivo

Permitir que Jona (admin del producto) genere manualmente códigos de cupón alfanuméricos y los distribuya a quien quiera (influencers, casos de soporte, partners). Al generar cada código se puede configurar la duración de acceso que otorga (default 28 días), de modo que distintos códigos pueden dar 7, 14, 28, 60 días u otra cantidad. El usuario canjea el código dentro de la app — sin tarjeta ni Stripe — y se le activa un entitlement gratuito por la duración configurada en ese código, a partir del momento del canje. Al vencer, el paywall contextual de REQ-25 aparece exactamente igual que con cualquier plan vencido.

### Dependencias

- **REQ-25** (entitlements y paywall): el entitlement de cupón se detecta con la misma consulta `status=active AND expires_at > now()` que REQ-25 ya ejecuta. El paywall al vencer funciona sin cambios.
- **REQ-26** (billing/checkout): completamente aditivo. No se modifica `api/checkout.js`, `api/webhook.js` ni `billing_events`. Los cupones no generan eventos de Stripe ni filas en `billing_events`.
- **REQ-31** (sin lenguaje técnico en UI): los textos del usuario no mencionan tokens, códigos internos ni términos técnicos.
- No requiere cambios en `api/entitlement.js:GET` ni en `showPaywall()`.

### Alcance

#### 1 — Migración SQL (`supabase/coupon_codes.sql`)

Crear tabla `redemption_codes` con las columnas:

| columna | tipo | descripción |
|---|---|---|
| `code` | `text primary key` | Código alfanumérico en mayúsculas (ej. `FIT-X7K2-9A`). Unique por definición (PK). |
| `plan_id` | `text references subscription_plans(id)` | Plan que se otorga al canjear (default `'monthly'`). |
| `duration_days` | `int not null default 28` | Días de acceso que otorga este código al canjearse. Configurable por código; default 28 si no se especifica al generarlo. **Concepto distinto de `valid_until`**: `duration_days` es cuánto dura el plan gratuito una vez canjeado; `valid_until` es hasta cuándo el código puede canjearse (caducidad del código en sí). Son independientes y ambos opcionales desde el punto de vista del admin. |
| `created_by` | `uuid references auth.users` | Admin que generó el código. |
| `created_at` | `timestamptz not null default now()` | |
| `valid_until` | `timestamptz` | Opcional: fecha hasta la que Jona acepta canjear este código. Nulo = sin expiración del código. |
| `redeemed_by` | `uuid references auth.users` | Nulo hasta que se canjea. |
| `redeemed_at` | `timestamptz` | Nulo hasta que se canjea. |
| `entitlement_id` | `uuid references user_entitlements` | Nulo hasta que se canjea; enlaza con el entitlement creado. |

**Decisión: códigos de un solo uso.** Un código solo puede ser canjeado una vez (`redeemed_by IS NOT NULL` bloquea un segundo canje). Razón: evita el abuso de distribución masiva (p. ej., alguien publica el código en redes) y mantiene la lógica de canje atómica y simple — un solo `UPDATE ... WHERE redeemed_by IS NULL` como check de disponibilidad antes del INSERT del entitlement.

También en `coupon_codes.sql`: `ALTER TABLE user_entitlements DROP CONSTRAINT user_entitlements_origin_check; ALTER TABLE user_entitlements ADD CONSTRAINT user_entitlements_origin_check CHECK (origin IN ('checkout','admin_courtesy','admin_grant','coupon'));`

RLS: `redemption_codes` habilitada pero sin política SELECT para usuarios (solo `service_role` puede leer). No se expone al cliente ningún listado de códigos.

#### 2 — Endpoint `/api/coupon.js`

Maneja dos acciones en un único archivo serverless para mantener la convención del proyecto (`api/checkout.js`, `api/entitlement.js`, etc.):

**`POST /api/coupon` — action `'generate'` (solo admin)**

- Verifica sesión y `is_admin === true` con el mismo patrón de `verifyUser()` de `api/entitlement.js`.
- Genera un código aleatorio de 8 caracteres alfanuméricos (A-Z 0-9, excluyendo 0/O/I/1 para evitar confusiones visuales), formateado como `XXX-XXXX` (ej. `FIT-X7K2` o similar). Formato exacto: decisión de implementación, documentar en el código.
- Acepta parámetros opcionales e independientes entre sí:
  - `durationDays` (entero, default `28`): días de acceso gratuito que otorgará el código al canjearse. Puede ser 7, 14, 28, 60, etc. **No tiene relación con `validUntil`.**
  - `validUntil` (ISO string, sin default → nulo): fecha límite hasta la que el código puede canjearse. Nulo significa que el código no caduca. **No afecta la duración del plan**, solo cuándo el código deja de ser canjeable.
  - `planId` (default `'monthly'`).
- Inserta la fila en `redemption_codes` usando `service_role`.
- Devuelve `{ code, plan_id, duration_days, valid_until, created_at }`.
- Sin panel de admin adicional: Jona llama al endpoint directamente (ej. con `curl` o un script) o se puede invocar desde la consola del navegador con su token de admin.

**`POST /api/coupon` — action `'redeem'` (cualquier usuario autenticado)**

- Verifica sesión del usuario.
- Valida el `code` (existe, `redeemed_by IS NULL`, y si tiene `valid_until` este no pasó).
- Verifica que el usuario no tenga ya un entitlement activo (evita acumulación).
- En una operación atómica:
  1. Calcula `expires_at = now() + duration_days * 86400 s`.
  2. Crea fila en `user_entitlements`: `status='active'`, `origin='coupon'`, `payment_ref=null`, `notes='Cupón {code}'`, `granted_by=null`.
  3. Actualiza `redemption_codes`: `redeemed_by=user.id`, `redeemed_at=now()`, `entitlement_id=<id_recién_creado>`.
- Respuestas de error claras al usuario: `"Código no válido."` (no existe), `"Este código ya fue utilizado."` (ya canjeado), `"El código ha expirado."` (pasó `valid_until`), `"Ya tienes un plan activo."`.
- Devuelve `{ entitlement: { plan_id, expires_at, origin } }` en éxito.

#### 3 — UI en Perfil (`index.html`)

- En `subscriptionStatusHtml()` (línea 5203): añadir rama para `origin === 'coupon'` → muestra etiqueta "Acceso gratuito" (en lugar de "Plan activo"). Cambio de una línea.
- En la sección de suscripción de Perfil (línea 4703), dentro del bloque de estado `!entitlement && entitlementChecked` (es decir, sin plan activo), agregar debajo de los botones existentes un bloque colapsable "¿Tienes un código de acceso?" con:
  - Un campo `<input type="text" placeholder="Ej. FIT-X7K2">` y botón "Canjear".
  - Al pulsar, llama a `POST /api/coupon` con `{ action: 'redeem', code }` usando el token del usuario.
  - En éxito: muestra confirmación "¡Código canjeado! Acceso gratuito activo por {N} días." (donde N proviene del campo `duration_days` devuelto por el endpoint en el objeto `entitlement` — no hardcodeado) y llama a `loadEntitlement().then(() => render())` para actualizar el estado sin recargar.
  - En error: muestra el mensaje devuelto por el endpoint (ya son mensajes de usuario, no técnicos).
- El bloque de canje solo se renderiza cuando `!entitlement && entitlementChecked` (sin plan activo). Usuarios con plan activo no ven el campo.
- Sin overflow en 375×812.

#### 4 — Flujo al vencer

Ningún cambio requerido. Cuando `expires_at` pasa, `api/entitlement.js:GET` deja de devolver el entitlement como activo, `entitlementExpired` se puebla, y el paywall de REQ-25 aparece con el botón "Ver planes disponibles" — idéntico al flujo de un plan pagado vencido.

### Criterios de aceptacion

- Jona puede llamar a `POST /api/coupon` con `{ action: 'generate' }` usando su token de admin y recibe un código con `duration_days: 28` por defecto. El mismo endpoint devuelve 403 si el token no es de admin.
- Jona puede generar un código con duración distinta (ej. `{ action: 'generate', durationDays: 7 }`) y al canjearse el entitlement expira en `now() + 7 días`, no 28. `durationDays` y `validUntil` son independientes y pueden combinarse libremente.
- Un usuario sin plan activo puede ingresar el código en Perfil y recibe confirmación de activación. La sección de suscripción actualiza inmediatamente mostrando "Acceso gratuito" y la fecha de expiración (calculada como `now() + duration_days` configurado en ese código).
- El mensaje de éxito en UI muestra la duración real del código canjeado (no "28 días" hardcodeado).
- El mismo código no puede canjearse dos veces: el segundo intento devuelve "Este código ya fue utilizado."
- Un código con `valid_until` pasado devuelve "El código ha expirado." (la caducidad del código no altera la duración del plan que hubiera otorgado).
- Un usuario con entitlement activo ve 400 "Ya tienes un plan activo." e intenta no crear un segundo entitlement.
- Al vencer el entitlement (`expires_at < now()`), `api/entitlement.js:GET` devuelve `entitlement: null` y el paywall de REQ-25 aparece exactamente igual que para un plan pagado vencido.
- El flujo de pago real con Stripe (REQ-26) no sufre regresión: `api/checkout.js` y `api/webhook.js` funcionan sin cambios.
- `subscriptionStatusHtml()` muestra "Acceso gratuito" (no "Plan activo") para entitlements con `origin === 'coupon'`.
- `redemption_codes` no es accesible directamente desde el cliente (sin política RLS SELECT para `authenticated`).
- Ningún texto de UI menciona tokens, códigos internos, `service_role` ni lenguaje técnico (REQ-31).
- Commit y push propios.

### Verificacion sugerida

- Con token de admin: `curl -X POST /api/coupon -H "Authorization: Bearer $TOKEN" -d '{"action":"generate"}'` → respuesta con `duration_days: 28` (default).
- Con duración personalizada: `curl ... -d '{"action":"generate","durationDays":7}'` → respuesta con `duration_days: 7`; al canjearlo, el entitlement expira en 7 días.
- Con caducidad de código: `curl ... -d '{"action":"generate","durationDays":14,"validUntil":"2026-07-31T00:00:00Z"}'` → código que otorga 14 días de acceso pero solo puede canjearse antes del 31/07/2026 (los dos parámetros son independientes).
- Con token de usuario regular: canjear el código en Perfil → confirmar que aparece "Acceso gratuito" con la fecha correcta y que `user_entitlements` tiene la fila con `origin='coupon'`.
- Intentar canjear el mismo código con otro usuario → confirmar error "Este código ya fue utilizado."
- Verificar en `redemption_codes` que la fila tiene `redeemed_by` y `entitlement_id` correctos.
- Cambiar manualmente `expires_at` del entitlement a una fecha pasada en Supabase → recargar la app → confirmar que aparece el paywall.
- Sin sesión: `POST /api/coupon` con `action='redeem'` devuelve 401.
- `git diff --check` y release gate local.

---

## REQ-51 - Activacion: primer dia siempre ejecutable y CTA de Home directo

**Estado: implementado.**

> Origen: pase de UX desde Cowork (auditoria del 23 jun 2026 + plan `estrategia/06-Plan-UX-Guided-Tour-y-Simplificacion-2026-06-24.md`). Hallazgo P0 de la auditoria: Home podia quedar en "Aun falta preparar este dia" sin salida cuando el coach no estaba disponible.

### Evidencia

- `prepareFirstCycleDay()` ya arma un dia determinista tras el onboarding con fallback a `deterministicDayPayload()` (`index.html:~2509-2537`), pero solo cubre el primer dia del ciclo.
- `homePrepareDay()` caia a `setView("perfil")` + toast cuando `!aiAvailable()`, dejando el dia vacio sin accion util (callejon sin salida en activacion).
- `homeAgendaHtml()` mostraba el CTA "Revisar mi perfil" en estado `setup` cuando no habia IA, reforzando la sensacion de "complete datos pero no recibi plan".
- `deterministicDayPayload()` (`index.html:~6125`) y `applyDayComidas()` (`index.html:~6708`) ya existian y son sincronos.

### Objetivo

Que el usuario siempre pueda obtener un dia ejecutable desde Home con una sola accion, aun sin coach IA, sin ser desviado a Perfil.

### Implementado

- `homePrepareDay()` (`index.html:3015-3032`): sin IA disponible, arma un dia con `deterministicDayPayload()`, lo aplica con `applyDayComidas()`, re-renderiza y muestra toast de confirmacion; solo cae a Perfil si el fallback no produce comidas. Emite `home_agenda_action` con `prepare_day_deterministic` (`index.html:3023`).
- CTA del estado `setup` siempre dice "Preparar mi dia" (`index.html:3136`).

### Dependencias

- Ninguna. Cambio 100% cliente en `index.html`. Sin migracion SQL. Respeta REQ-31 (sin vocabulario tecnico).

### Criterios de aceptacion

- Tras onboarding, Home nunca queda en estado vacio sin accion que lo resuelva en un toque.
- Con IA desactivada, "Preparar mi dia" llena el dia al instante y re-renderiza; el usuario puede registrar comidas sin pasar por Perfil.
- Ningun texto menciona IA, proveedor ni cuota.
- Commit y push propios.

### Verificacion sugerida

- Con `aiAvailable()` falso, completar onboarding y tocar "Preparar mi dia" en Home; confirmar dia lleno y toast.
- `node scripts/audit-html.mjs`, `validate-contracts.mjs` (ejecutados, PASS).

---

## REQ-52 - Accesibilidad tactil: touch targets de 44px y labels en Progreso

**Estado: implementado.**

> Origen: auditoria UX 23 jun 2026 — 30 targets <44px en Perfil, 26 en Progreso, 19 en Nutricion; 20 inputs sin etiqueta programatica en Progreso.

### Evidencia

- `.btn-sm` (`index.html:88`), `.chip-check` y controles de tabla quedaban por debajo de 44px en movil.
- Inputs de peso/grasa en `weightRows()` (`index.html:4118-4120`) comunicaban "kg"/"%" solo por placeholder, sin `aria-label` por semana.

### Objetivo

Elevar el area tactil minima a 44px en pantallas tactiles y dar etiqueta programatica a los inputs de Progreso, sin alterar el layout en desktop.

### Implementado

- Bloque CSS `@media(pointer:coarse)` (`index.html:89-96`): `min-height:44px` para `.btn-sm`, `.chip-check`, `.csec-h` e inputs numericos/texto de tabla.
- `aria-label` por semana en los inputs de peso ("Peso de la semana N en kilogramos") y grasa ("Grasa corporal de la semana N en porcentaje") (`index.html:4119-4120`).

### Dependencias

- Ninguna. Cambio 100% cliente. No depende de REQ-56 (que migrara la tabla a tarjetas y reutilizara estas labels).

### Criterios de aceptacion

- En dispositivos `pointer:coarse`, los controles citados miden >=44px.
- Lectores de pantalla anuncian semana y metrica en cada input de Progreso.
- Sin regresion visual en desktop.
- Commit y push propios.

### Verificacion sugerida

- Emular dispositivo tactil (375x812) y medir alturas de `.btn-sm`/chips/inputs.
- Inspeccionar `aria-label` en los inputs de la tabla de peso.

---

## REQ-53 - Guided tour contextual ligero (prototipo)

**Estado: implementado (prototipo, sin dependencias externas).**

> Origen: pedido de producto ("guided tour") + decision del plan: tour contextual corto en vez de tour lineal pesado. Las librerias externas (Shepherd/intro.js) se descartaron por mantener la app estatica sin build step.

### Evidencia

- No existia ningun mecanismo de tour, coachmarks ni tooltips de primer uso en el repo.
- `renderTabs()` no exponia selectores estables para apuntar a las pestanas.

### Objetivo

Orientar al usuario nuevo con coachmarks contextuales una sola vez tras el onboarding, sin bloquear ni retrasar el primer valor, y permitir repetirlo a demanda.

### Implementado

- Modulo vanilla autocontenido (`index.html:8869-8975`): `FITBROS_TOUR_KEY`, `tourSteps()`, `maybeStartFitbrosTour()`, `startFitbrosTour()`, `tourNext/Prev/Render/Cleanup/Finish`, `tourKey`.
- 5 pasos: tarjeta de agenda del dia + pestanas Nutricion, Entreno, Progreso, Perfil.
- Disparo unico tras onboarding via `maybeStartFitbrosTour()` al final de `renderHoy()` (`index.html:3262`); estado en `localStorage` (`fitbros_tour_v1`).
- Saltable (boton Saltar / Esc), navegable (Siguiente/Atras, flechas), repetible desde el boton "?" del header de Home (`index.html:3251`, `startFitbrosTour(true)`).
- Selectores estables via `data-tab` agregado en `renderTabs()` (`index.html:2827`).
- Respeta `prefers-reduced-motion`; spotlight + tooltip posicionados con `getBoundingClientRect`; emite `tour_start`/`tour_finish` para analitica; CSS inyectado bajo demanda (`tourEnsureStyle`).

### Dependencias

- Ninguna runtime. No agrega dependencias (cumple `allowNewRuntimeDependency:false`). Persistencia por dispositivo; si se quiere "visto" por cuenta, mover el flag a `profiles.prefs` (mejora futura).

### Criterios de aceptacion

- El tour aparece una sola vez tras completar el onboarding y no reaparece salvo reinicio manual del flag o boton "?".
- Es saltable y navegable por teclado; no atrapa al usuario.
- No rompe re-render: el overlay vive fuera de `#app` y recalcula posiciones en `resize`/`scroll`.
- No menciona IA ni vocabulario tecnico.
- Commit y push propios.

### Verificacion sugerida

- Servir local, completar onboarding y confirmar disparo unico; repetir con el boton "?".
- Reiniciar con `localStorage.removeItem('fitbros_tour_v1')`.
- Pruebas de control de flujo (jsdom): auto-disparo, avance/retroceso, persistencia done/skipped, no-reaparicion, replay manual — 9/9 OK.

### Mejoras futuras (no en este alcance)

- Empty states que ensenan (REQ-57) y tooltips just-in-time la primera vez que se abre Entreno o el reproductor.

---

## REQ-54 - Perfil en secciones con navegacion local y guardado por seccion

**Estado: implementado.**
Navegacion local por chips (Objetivo / Comidas / Entreno / Privacidad / Cuenta) con anchors y scrollIntoView; boton flotante "Guardar cambios" condicionado a cambios sin guardar (dirty tracking via delegacion oninput/onchange en pfEditableBody); boton estatico eliminado; profileClearDirty() en saveProfile(); cache SW v45.

> Origen: auditoria UX 23 jun 2026 — Perfil mide ~5.436px de alto en movil y mezcla macros, alimentacion, entrenamiento, suscripcion, privacidad, recordatorios, push y cuenta en una sola pantalla con guardado al final.

### Evidencia

- `renderProfile()` concentra todas las secciones en un solo scroll.
- Ya existen los helpers `section()` y `toggleSection()` (`index.html:~2809-2818`) y el estado `UI.collapsed` con `uiSave()`.
- El guardado consolida todo al final (mayor miedo a perder cambios).

### Objetivo

Reducir la densidad percibida de Perfil dividiendolo en secciones con navegacion local y guardado por seccion (o un boton sticky "Guardar cambios" que aparezca solo cuando hay modificaciones).

### Dependencias

- Cliente (`index.html`). Cuidado con `saveProfilePrefs()` y los esquemas versionados (`profileSchemaVersion`). No depende de REQ-55 pero se complementan.

### Alcance

- Agrupar Perfil en: Objetivo, Comidas, Entrenamiento, Privacidad, Cuenta.
- Navegacion local (chips o tabs internos) que ancla/scrollea a cada seccion.
- Guardado por seccion o boton sticky condicionado a "hay cambios sin guardar".
- Reusar `section()`/`toggleSection()`; no duplicar logica de lectura/escritura de prefs.
- Mantener compatibilidad: usuarios con datos previos ven sus valores sin migracion.
- Sin overflow en 375x812; sin vocabulario tecnico (REQ-31).

### Criterios de aceptacion

- Perfil presenta secciones navegables; el usuario llega a una seccion sin recorrer toda la pantalla.
- Guardar una seccion no exige tocar el resto; el indicador de "cambios sin guardar" es claro.
- Sin regresion en `saveProfilePrefs()` ni en los consentimientos/evaluacion versionados.
- Commit y push propios.

### Verificacion sugerida

- Editar solo "Objetivo" y guardar; confirmar persistencia y que el resto no se altera.
- Medir alto de Perfil en movil (debe bajar sustancialmente respecto a ~5.436px).
- `git diff --check` y release gate local.

---

## REQ-55 - Onboarding esencial y opciones avanzadas colapsadas por defecto

**Estado: implementado.**
Experiencia y minutos (paso 3) + número de comidas (paso 4) agrupados en `<details class="adv-settings">` colapsados por defecto; lecturas de DOM guardadas con null-check; defaults de migrateProfilePrefs aseguran plan válido sin abrir avanzado.

> Origen: auditoria UX + principio de "menos pasos". Demasiadas decisiones avanzadas durante onboarding y en Perfil.

### Evidencia

- Existen `onboardingEssentialOnly` y `needsProfileTuning()` y un alert "Afina tu plan" en Home (`index.html:~3237`).
- El onboarding pide preferencias de cocina, preparaciones, equipo detallado, lesiones y recordatorios en el flujo principal.

### Objetivo

Pedir en onboarding solo lo esencial para generar el primer plan y mover lo avanzado a un bloque opcional colapsado, dejando "afinar el plan" como mejora posterior, nunca como prerrequisito percibido.

### Dependencias

- Cliente (`index.html`). Se apoya en `onboardingEssentialOnly` ya existente. Complementa REQ-54.

### Alcance

- Revisar pasos 3 y 4 del onboarding: dejar visibles solo los campos imprescindibles; agrupar el resto bajo "Configuracion avanzada (opcional)" colapsada.
- Asegurar defaults sensatos cuando los campos avanzados no se completan (sin romper generacion ni validaciones; condicionar lecturas a la existencia del campo en el DOM, patron de REQ-46).
- El mensaje "Afina tu plan" comunica mejora opcional, no trabajo bloqueante.
- Sin vocabulario tecnico (REQ-31).

### Criterios de aceptacion

- El onboarding se completa con el minimo de campos y genera un primer plan valido.
- Las opciones avanzadas existen pero no abruman el flujo principal.
- Sin regresion en validaciones de onboarding ni en la generacion de planes.
- Commit y push propios.

### Verificacion sugerida

- Completar onboarding sin tocar avanzado; confirmar plan valido.
- Expandir avanzado, guardar valores y confirmar que se usan.
- `git diff --check` y release gate local.

---

## REQ-56 - Progreso: tabla de peso a tarjetas full-width en movil

**Estado: implementado.**

> Origen: auditoria UX — 26 targets <44px y tabla densa en Progreso movil.

### Evidencia

- `weightRows()` (`index.html:4117-4121`) renderiza una tabla con inputs estrechos; los `aria-label` por semana ya quedaron listos en REQ-52.

### Objetivo

Convertir la tabla de peso en filas tipo tarjeta full-width en movil, con inputs comodos o steppers, manteniendo la tabla en desktop si conviene.

### Dependencias

- Cliente (`index.html`). Reutiliza los `aria-label` de REQ-52. No depende de REQ-54.

### Alcance

- En movil, cada semana es una tarjeta con peso y grasa en inputs full-width (o steppers), area tactil >=44px.
- Conservar `setWeight()`/`setBodyFat()` y los `aria-label` existentes.
- Mantener el grafico de evolucion (REQ-43) sin regresion.
- Sin overflow en 375x812.

### Criterios de aceptacion

- En movil, registrar peso/grasa es comodo y accesible; no hay inputs minusculos.
- Sin regresion en persistencia ni en el grafico.
- Commit y push propios.

### Verificacion sugerida

- Registrar peso en 375x812; medir area tactil.
- Confirmar que el grafico y el resumen siguen correctos.
- `git diff --check` y release gate local.

---

## REQ-57 - Empty states que ensenan en Nutricion, Entreno y Progreso

**Estado: implementado.**

> Origen: plan de UX — donde hoy se lee "Sin asignar" o "Aun falta...", el vacio no ensena ni ofrece accion.

### Evidencia

- Nutricion muestra comidas "Sin asignar"; Progreso/Entreno pueden mostrar vacios sin guia.
- El patron `agenda-state setup` de Home (con CTA directo) es un buen modelo a replicar (`index.html:~3116-3128`).

### Objetivo

Que cada pantalla sin datos explique brevemente que es la seccion y ofrezca la accion que la llena, en vez de un texto muerto.

### Dependencias

- Cliente (`index.html`). Se apoya en el patron de Home y en REQ-51 (dia preparable en un toque).

### Alcance

- Definir empty states con: titulo claro, 1 linea de que aporta la seccion, y CTA que resuelve (preparar, registrar, ir al paso correspondiente).
- Aplicar en Nutricion, Entreno y Progreso.
- Sin vocabulario tecnico (REQ-31).

### Criterios de aceptacion

- Ninguna pantalla principal muestra un vacio sin accion.
- Cada empty state lleva a la accion correcta en un toque.
- Commit y push propios.

### Verificacion sugerida

- Forzar estados vacios y confirmar copy + CTA en cada vista.
- `git diff --check` y release gate local.

---

## REQ-58 - Landing: breakpoint desktop propio y product proof en el primer viewport

**Estado: implementado.**
Landing pública desacoplada del ancho móvil global de `#app` mediante `landing-host`, hero con texto + mockup en el primer bloque y breakpoint desktop propio (dos columnas, grids anchos para features/planes/pasos). En móvil el mockup aparece dentro del primer viewport sin scroll largo; en desktop la landing usa hasta 1120px sin afectar la app autenticada. Service worker v48.

> Origen: auditoria UX P2 — la landing es persuasiva pero larga; en desktop hereda el contenedor movil centrado y el mockup aparece tarde.

### Evidencia

- Landing movil ~3.334px de alto; el primer viewport es casi todo headline + copy + CTA; el mockup llega despues.
- En desktop se mantiene una columna movil centrada con mucho espacio vacio.

### Objetivo

Acelerar la conviccion: acercar el product proof (mockup / "que recibire hoy") al primer viewport en movil y dar a la landing un layout propio en desktop, sin alterar la app autenticada (que sigue mobile-first).

### Dependencias

- Cliente (`index.html`, `renderLanding()`). No toca la app autenticada.

### Alcance

- Movil: subir parte del mockup/prueba de producto al primer viewport o reducir la altura del hero.
- Desktop: breakpoint propio (dos columnas o composicion mas ancha) solo para la landing publica.
- Sin overflow horizontal; sin regresion en los CTAs de registro (`showAuthFromLanding`).

### Criterios de aceptacion

- En movil, hay prueba de producto visible sin scroll largo.
- En desktop, la landing no se ve como una columna movil perdida en el centro.
- La app autenticada permanece en ancho movil.
- Commit y push propios.

### Verificacion sugerida

- Revisar landing en 375x812 y en >=1280px.
- Confirmar CTAs de registro intactos.
- `git diff --check` y release gate local.

---

## REQ-59 - Fix de contrato: validar autenticacion antes de la config de Stripe en checkout

**Estado: implementado.**
`api/checkout.js` valida ahora el método y la sesión antes de revisar `STRIPE_SECRET_KEY`, de modo que una petición sin sesión devuelve 401 aunque la pasarela no esté configurada. Una sesión válida sin configuración de Stripe conserva el 503 operativo. Se agregó `scripts/test-checkout-api.mjs` para cubrir el contrato con mocks sin llamar a Stripe.

> Origen: smoke test de produccion (auditoria 23 jun 2026): `POST /api/checkout` sin sesion devuelve 503 en vez de 401/403.

### Evidencia

- En `api/checkout.js`, si `STRIPE_SECRET_KEY` no esta configurada, el endpoint responde 503 antes de llamar a `verifyUser`, por lo que una peticion sin auth recibe 503 en lugar del 401/403 esperado por el smoke test.

### Objetivo

Ordenar la validacion del endpoint: primero metodo, luego sesion, luego configuracion de pasarela; sin cambiar el comportamiento del flujo de pago valido.

### Dependencias

- Servidor (`api/checkout.js`). Sin migracion. No consumir Stripe real (mockear). No depende de otros REQ.

### Alcance

- Reordenar: validar metodo HTTP -> validar sesion (`verifyUser`) -> validar config de Stripe.
- Peticion sin auth devuelve 401/403; con auth pero sin config devuelve 503 (o el codigo correcto) recien entonces.
- Sin regresion en el checkout valido (REQ-26) ni en el webhook.

### Criterios de aceptacion

- `POST /api/checkout` sin sesion devuelve 401/403 (no 503).
- El smoke test `scripts/smoke-test.mjs` pasa 9/9.
- Sin regresion en `api/webhook.js`.
- Commit y push propios.

### Verificacion sugerida

- `node scripts/smoke-test.mjs --url <deploy>` -> 9/9.
- Probar sin auth (espera 401/403) y con auth + sin config (espera 503).
- `git diff --check` y release gate local.

---

## REQ-60 - Corregir Site URL / Redirect URLs de Supabase (recuperar contrasena apunta a localhost)

**Estado: pendiente. Requiere accion manual en el dashboard de Supabase; no implementable por el agente autonomo.**

### Diagnostico

El codigo de la app ya esta correcto y no requiere ningun cambio:

- `index.html` (~linea 5769, flujo de autoservicio): arma el `redirectTo` con `window.location.origin` dinamicamente antes de llamar a `supabase.auth.resetPasswordForEmail()`.
- `index.html` (~linea 8122, panel admin): mismo patron; el `redirectTo` se construye con `location.origin` antes de llamar al endpoint de reset.
- `api/admin.js`: valida el `redirectTo` con `safeRedirect()` antes de pasarlo a la API de Supabase, rechazando dominios no autorizados.

La causa raiz es de **configuracion externa**: en el dashboard de Supabase (Authentication → URL Configuration), el campo "Site URL" del proyecto apunta a `http://localhost:xxxx` y/o la URL de produccion no esta en la allowlist de "Redirect URLs". Cuando Supabase recibe un `resetPasswordForEmail` con un `redirectTo`, lo valida contra esa allowlist. Si el dominio no esta en la lista, Supabase ignora el `redirectTo` y cae al Site URL configurado (localhost), por lo que el correo de recuperacion llega con un link que apunta a localhost en vez de a produccion.

### Objetivo

Que los correos de recuperacion de contrasena — y cualquier otro flujo de Supabase Auth que use redirect (confirmacion de email, invitaciones, magic links) — apunten siempre al dominio de produccion real (`https://fitbud-green.vercel.app`), no a localhost.

### Dependencias

- Acceso al dashboard de Supabase del proyecto como propietario o administrador (Jona).
- No depende de ningun otro REQ de codigo; es un cambio de configuracion puro.
- **Condicion de parada del agente**: el agente autonomo nunca intenta ejecutar este REQ. Si lo encontrara en cola (cosa que no debe ocurrir), debe detenerse con `external_dashboard_action_required`.

### Alcance — accion requerida

Cambio manual en el dashboard de Supabase, seccion **Authentication → URL Configuration**:

1. **Site URL**: cambiar a `https://fitbud-green.vercel.app`.
2. **Redirect URLs** (allowlist): agregar `https://fitbud-green.vercel.app/**`.
3. Opcional pero recomendado: agregar tambien `http://localhost:*` o `http://localhost:3000/**` para poder seguir probando el flujo en local sin afectar produccion (Supabase acepta multiples entradas).

No se requiere ningun cambio de codigo, migracion SQL ni nuevo commit de app.

### Por que no es automatizable por el agente

Esta configuracion vive en el dashboard de cuenta de Supabase (un proveedor externo), no en el repositorio. No existe una API publica de administracion de proyectos Supabase que el agente pueda llamar desde el repo con los secretos actuales. Requiere que el dueno del proyecto entre con su cuenta al dashboard y realice el cambio de forma manual. El agente no tiene acceso ni debe tenerlo a credenciales de administracion de la plataforma.

### Criterios de aceptacion

Los criterios de aceptacion son **acciones humanas y verificacion manual**, no codigo:

- El campo "Site URL" en Authentication → URL Configuration del proyecto Supabase es `https://fitbud-green.vercel.app`.
- La allowlist de "Redirect URLs" incluye `https://fitbud-green.vercel.app/**`.
- Tras el cambio, al solicitar un reset de contrasena real desde el formulario de produccion, el correo recibido contiene un link a `https://fitbud-green.vercel.app/...` y no a `localhost`.
- El agente autonomo no completa ni intenta completar este REQ.

### Verificacion sugerida

1. Entrar a `https://fitbud-green.vercel.app`, usar "Olvidé mi contraseña" con un correo real.
2. Revisar el correo recibido y confirmar que el link de reset apunta a `https://fitbud-green.vercel.app/...`.
3. Hacer clic en el link y confirmar que la app carga correctamente el formulario de nueva contrasena en produccion.
4. Opcional: verificar tambien el flujo desde el panel admin (enviar reset a un usuario de prueba y confirmar el dominio del link recibido).

---

## REQ-127 - Personalizar remitente y asunto de los correos de autenticacion de Supabase (branding Fitbud)

**Estado: pendiente. Requiere accion manual en el dashboard de Supabase (y de un proveedor SMTP externo para el remitente); no implementable por el agente autonomo.**

### Diagnostico

`api/admin.js` llama a la API administrativa de GoTrue (Supabase Auth) por dos caminos:

- `inviteAuthUser()` — `POST {SUPABASE_URL}/auth/v1/invite` con body `{ email, data }` y query param `redirect_to`.
- Accion `resetPassword` — `POST {SUPABASE_URL}/auth/v1/recover` con body `{ email, redirect_to }`.

Ninguno de los dos endpoints acepta un parametro para cambiar el nombre del remitente ("From") ni el asunto del correo. El campo `data` solo puebla `raw_user_meta_data` del usuario y queda disponible en las plantillas como `{{ .Data.campo }}`, pero no controla subject ni sender. Lo mismo aplica al SDK (`supabase-js`): `auth.admin.inviteUserByEmail()` y `auth.resetPasswordForEmail()` solo aceptan `redirectTo` y `data`/opciones de captcha, nada de branding. El remitente y el asunto de cada correo (invitacion, recuperacion, confirmacion de registro, magic link) se controlan exclusivamente desde el dashboard del proyecto. No existe ningun cambio de codigo que resuelva el branding del email.

### Objetivo

Que los correos de autenticacion (invitacion, recuperacion de contrasena, confirmacion de registro) se identifiquen como "Fitbud" en el asunto y, idealmente, tambien en el remitente, en vez de mostrar branding de Supabase.

### Alcance — accion requerida

Cambios manuales en el dashboard de Supabase:

1. **Asunto y cuerpo del correo** (siempre disponible, no requiere SMTP propio): **Authentication → Email Templates**. Editar cada plantilla usada (`Invite user`, `Reset Password`, `Confirm signup`, y `Magic Link` si se usa) y:
   - Cambiar el "Subject" para incluir "Fitbud", ej.: `Restablece tu contrasena de Fitbud`, `Te invitaron a Fitbud`.
   - Ajustar el cuerpo HTML para mostrar el nombre/logo de Fitbud en vez del texto generico por defecto.
2. **Nombre y direccion del remitente ("From")**: por defecto Supabase usa su propio mailer compartido (pensado solo para pruebas, con limite de envios y remitente fijo tipo `Supabase Auth <noreply@mail.app.supabase.io>`); el remitente no es editable en ese modo. Para que el correo llegue como "Fitbud <noreply@tudominio>" hace falta **SMTP propio**: **Project Settings → Auth → SMTP Settings** (la ruta exacta puede variar segun version del dashboard):
   - Activar "Enable Custom SMTP".
   - Configurar host/puerto/usuario/password de un proveedor SMTP (ej. Resend, SendGrid, Postmark, SES) con un dominio verificado.
   - Setear "Sender name" = `Fitbud` y "Sender email" = una direccion del dominio propio (ej. `noreply@fitbud.app` o el dominio real del proyecto).
3. Guardar y enviar una invitacion o un reset de prueba real para confirmar remitente y asunto en la bandeja de entrada.

No se requiere ningun cambio de codigo, migracion SQL ni nuevo commit de app para el asunto/cuerpo. El remitente real solo cambia si ademas se activa SMTP propio.

### Dependencias

- Para el asunto/cuerpo: solo acceso al dashboard de Supabase, sin dependencias extra. Ver tambien [[REQ-60]] (misma seccion de Authentication, URL Configuration vs. Email Templates/SMTP).
- Para el remitente real: cuenta en un proveedor SMTP (Resend/SendGrid/Postmark/SES) con dominio verificado; puede quedar pendiente hasta que se elija el proveedor.
- No depende de ningun otro REQ de codigo.
- **Condicion de parada del agente**: el agente autonomo nunca intenta ejecutar este REQ. Si lo encontrara en cola, debe detenerse con `external_dashboard_action_required`.

### Por que no es automatizable por el agente

El asunto/cuerpo vive en el dashboard de la cuenta de Supabase (proveedor externo). El remitente real ademas depende de credenciales de un proveedor SMTP externo. No hay API publica de administracion que el agente pueda invocar desde este repo con los secretos actuales para modificar ninguno de los dos. Requiere que el dueno del proyecto (Jona) entre al dashboard y, para el remitente, tambien configure una cuenta SMTP propia.

### Criterios de aceptacion

Los criterios de aceptacion son **acciones humanas y verificacion manual**, no codigo:

- Las plantillas de Authentication → Email Templates (`Invite user`, `Reset Password`, `Confirm signup`) mencionan "Fitbud" en el asunto.
- (Si se configura SMTP propio) el correo recibido muestra "Fitbud" como remitente, no "Supabase Auth".
- El agente autonomo no completa ni intenta completar este REQ.

### Verificacion sugerida

1. Desde produccion, disparar una invitacion real y un reset de contrasena real.
2. Revisar la bandeja de entrada: el asunto debe mencionar Fitbud; el remitente debe mostrar Fitbud si ya se configuro SMTP propio.

---

## REQ-61 - Fix: "Preparar mi día" rechaza respuestas válidas cuando el perfil tiene restricciones de dieta

**Estado: implementado.**

### Causa raíz

`generateOneDay()` construía `dishList` con **todos** los platos del catálogo, sin filtrar por las restricciones duras del perfil (`sin_huevo`, `vegano`, alergias). La IA veía platos con huevo u otros ingredientes restringidos en la lista de "Platos disponibles" y en algunos casos los incluía en el plan generado. La validación server-side en `validateDietDay` (`api/claude.js`) corría `containsRestriction` y rechazaba esas respuestas con 422 "La opcion preparada no paso las validaciones."

El commit anterior `6a2776c` había eliminado la comprobación de rango de macros (kcal ±15%, proteína ≥85%) pero no esta causa: el fallo por restricciones de ingredientes persistía para usuarios con `sin_huevo`, `vegano` o alergias configuradas.

### Cambios (commit único en main)

- **`index.html`** — `generateOneDay()`:
  - Filtra `dishList` con `coachDishBlockedByProfile` antes de enviarlo al prompt; la IA solo ve platos compatibles con el perfil.
  - Añade línea `PROHIBIDO incluir en cualquier comida o ingrediente: <términos>` al prompt cuando hay restricciones duras, reforzando la instrucción ya presente en el system prompt.

- **`scripts/test-coach-quota.mjs`**:
  - Test `diet_day` con respuesta válida (4 comidas, slots correctos, sin restricciones) → espera 200 y `complete_fresh_coach_part` llamado.
  - Test `diet_day` con ingrediente restringido (`huevo` con `hardRestrictions: ["huevo"]`) → espera 422 y `fail_coach_generation_part` llamado.

### Criterios de aceptacion

- `node scripts/test-coach-quota.mjs` pasa incluyendo los nuevos casos de `diet_day`.
- `node scripts/release-gate.mjs` pasa 18/18 tras el commit.
- Usuarios con `sin_huevo`, `vegano` o alergias pueden generar su día sin recibir el error 422.
- La validación server-side sigue rechazando respuestas que violen restricciones (comportamiento correcto, mantenido).


---

## REQ-62 - Fix infra: consolidar billing-history y coupon dentro de entitlement para cumplir límite de Vercel Hobby

**Estado: implementado.**

### Contexto

Vercel plan Hobby (gratuito) impone un máximo de **12 Serverless Functions** por deployment. El repo había llegado a 13 archivos en `api/*.js`, bloqueando el build con:

> "No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan."

**Regla permanente:** cualquier futuro endpoint nuevo debe evaluarse contra este límite. Si ya hay 12 funciones, un archivo nuevo haría fallar el build — debe consolidarse dentro de un endpoint existente o reemplazar uno.

### Cambios (commit único en main)

- **`api/entitlement.js`**: absorbe la lógica completa de `billing-history.js` y `coupon.js`.
  - `GET /api/entitlement?action=billing-history` → historial de pagos (antes `GET /api/billing-history`)
  - `POST /api/entitlement { action:"generate", ... }` → generar código de canje (antes `POST /api/coupon`)
  - `POST /api/entitlement { action:"redeem", ... }` → canjear código (antes `POST /api/coupon`)
  - `GET /api/entitlement`, `POST { action:"grant" }`, `POST { action:"revoke" }` → comportamiento existente sin cambios
- **`api/billing-history.js`**: eliminado.
- **`api/coupon.js`**: eliminado.
- **`index.html`**: dos llamadas `fetch` actualizadas al endpoint consolidado.
- **`scripts/test-billing-history-api.mjs`** y **`scripts/test-coupon-api.mjs`**: adaptados para importar desde `api/entitlement.js`; misma cobertura.

### Verificacion

- En ese commit, `ls api/*.js | wc -l` → **11** (bajo el límite de 12). REQ-70 luego agrego `api/beta-recruitment.js`, dejando el total en **12**.
- `node scripts/test-billing-history-api.mjs` pasa.
- `node scripts/test-coupon-api.mjs` pasa.

---

## REQ-63 - Aprendizaje silencioso de patrones de alimentación del usuario

**Estado: implementado.**

### Objetivo

Detectar automáticamente cuándo el usuario tiene buena adherencia nutricional reciente y usar los ingredientes y platos que realmente comió (marcados `done:true`) como contexto adicional para la IA al generar días, sin notificar al usuario ni modificar sus preferencias editables.

### Decisiones de producto (tomadas por el dueño del producto, no modificar)

- **Opción A — silencioso**: el sistema aprende internamente; sin toast, sin card, sin mensaje al usuario. No modifica `profile.prefs.preferredIngredients` (campo editable). Persiste en `profile.prefs.learnedPatterns`, campo nuevo no visible en la UI de Perfil.
- **Tolerancia 5-de-7**: se activa si al menos 5 de los últimos 7 días calendario (ventana deslizante hacia atrás desde hoy, no racha estricta consecutiva) cumplen `nutritionDayDone()=true`.

### Decisión técnica (tomada por el agente, documentada aquí)

**Frecuencia de recálculo**: `maybeUpdateLearnedPatterns()` recalcula como máximo una vez por día, comparando `learnedPatterns.detectedAt` con `todayStr()`. Esto evita una escritura a Supabase en cada login o render mientras el usuario siga en el mismo día. Si la condición deja de cumplirse al día siguiente (el usuario falla más días), los patrones quedan en caché hasta que se vuelvan a calcular con la condición cumplida. El tiempo de staleness máximo es 24h — aceptable para una sugerencia de IA soft (no es una restricción dura).

### Dependencias

- `nutritionDayDone(ds)` — función existente, sin cambios.
- `S.days` — estado en memoria cargado por `pullAllDays()`.
- `profile.prefs` — campo JSONB en tabla `profiles` de Supabase.

### Alcance

**`index.html`**:
- `recentNutritionAdherence(ds)` — nueva función; devuelve `true` si ≥5 de los últimos 7 días cumplen `nutritionDayDone`.
- `extractLearnedPatterns(ds, windowDays=14)` — nueva función; escanea `S.days` buscando comidas `done:true` con `ovr` presente; devuelve `{topIngredients:[...8], topMealNames:[...5], detectedAt, windowDays}`.
- `maybeUpdateLearnedPatterns()` — nueva función async; comprueba condición y persiste en `profile.prefs.learnedPatterns` via `supa.from("profiles").update(...)` directo (sin `saveProfilePrefs` para no disparar `ensurePlanVersion`/`backfillDayVersions`). Llamada sin `await` desde `onAuth()` tras `pullAllDays()`.
- `generateOneDay()` — añade línea al prompt: "El usuario suele disfrutar ingredientes como: X, Y, Z. Incorpóralos cuando encajen con las metas." Solo si `learnedPatterns.topIngredients` no está vacío.
- `buildSysPrompt()` — añade campo `learned_patterns` al bloque `nutrition` del contexto estructurado JSON que recibe la IA (coach conversacional incluido).

**`scripts/test-learned-patterns.mjs`** — tests unitarios de `recentNutritionAdherence` (7/7, 5/7, 4/7, 0/7, 3 días con datos, 6/7, umbral 50 % de slots) y de `extractLearnedPatterns` (ingredientes frecuentes, sin done/sin ovr, top 8 ingredientes, top 5 platos, campo `name` vs `nombre`).

### Criterios de aceptación

- `node scripts/test-learned-patterns.mjs` pasa sin errores.
- `node scripts/release-gate.mjs` pasa 18/18 tras commit.
- No hay ningún toast, card ni cambio visible en la UI de Perfil cuando se actualiza `learnedPatterns`.
- `profile.prefs.preferredIngredients` no es modificado por este flujo.
- Si el usuario tiene adherencia ≥5/7, la próxima vez que la IA genere un día el prompt incluye la línea de ingredientes aprendidos.
- `buildSysPrompt()` incluye `learned_patterns` en el JSON de contexto enviado al coach conversacional.

### Verificación sugerida

1. `node scripts/test-learned-patterns.mjs` → "todos los tests pasaron".
2. Marcar ≥5 días de los últimos 7 como completados (≥50 % de comidas por día).
3. Recargar la app (o hacer login), esperar que `maybeUpdateLearnedPatterns` termine (async background).
4. Inspeccionar `profile.prefs.learnedPatterns` en Supabase: debe tener `{topIngredients:[...], topMealNames:[...], detectedAt:"YYYY-MM-DD", windowDays:14}`.
5. Generar un día con "Preparar mi día": el prompt enviado debe incluir la línea de ingredientes aprendidos (verificable habilitando apiKey local y revisando la petición en DevTools).
6. Confirmar que en el panel de Perfil no aparece ningún elemento nuevo de UI relacionado con patrones o aprendizaje.

## REQ-64 - Fix: "Preparar mi semana" genera días con déficit calórico porque la IA no escalaba porciones a la meta

**Estado: implementado.**

### Problema

Al usar "Preparar mi semana", los 7 días fallaban `validateGeneratedDay` con calorías entre 25%–35% por debajo de la meta. Ejemplo: meta 2300 kcal/día, días generados 1500–1735 kcal.

### Causa raíz (verificada contra producción)

El prompt de `generateOneDay()` decía "Cada comida debe llevar ingredientes reales con gramos y macros que sumen **cerca de** la meta del día" — instrucción demasiado vaga. La IA anclaba a los macros de porción por defecto de los platos de referencia (~300 kcal c/u), elegía un plato por slot y no escalaba gramajes, sumando ~1500–1735 kcal contra una meta de 2300.

**Hipótesis descartadas con datos** (consulta SQL a `profiles` y `dishes` en producción):
- *No era el filtrado de platos.* El perfil que reportó el bug (`kcal_target=2300`) tiene `diet=["vegetariano","sin_huevo"]`, sin `allergies` ni `dislikedIngredients` ni `sin_lacteos`/`sin_gluten`. Para ese perfil `coachFoodBlockTerms(true)` == `coachHardRestrictions()` == `["huevo","clara de huevo","yema"]`: el filtro suave no recortaba nada extra. Quedaban ~40 de 43 platos en la lista.
- *No era el catálogo.* De 43 platos, 29 superan 500 kcal y 16 son densos y libres de lácteos/gluten/huevo. Densidad calórica de sobra.

> Nota histórica: el commit anterior `e0fbd51` atribuyó el bug al filtro suave y relajó `compatDishes` a solo restricciones duras. Esa relajación no ayudaba (no-op para este perfil) y además debilitaba el honrar `sin_lacteos`/`sin_gluten` —que `validateGeneratedDay` no valida— en planes de futuros usuarios. Este REQ revierte esa parte y deja solo el fix de prompt, que es el que ataca la causa real.

### Fix (`index.html`)

**Prompt reforzado** en `generateOneDay()`: "Platos disponibles (reutilízalos cuando encajen)" → "Referencia de platos compatibles (úsalos como inspiración; ajusta gramajes o crea platos distintos si hace falta para alcanzar la meta)", y la línea de meta pasa de "cerca de la meta" a "OBLIGATORIO: el total del día debe ser `${target.kcal}` kcal ±10% y proteína ≥`${Math.round(target.p*0.85)}` g. ... ajusta porciones libremente para cumplir la meta."

El filtrado de `compatDishes` se mantiene en `coachDishBlockedByProfile()` (duras + suaves), igual que REQ-61, para no sugerir platos con ingredientes que el usuario marcó evitar. `hardResLine` sigue diciendo PROHIBIDO y `validateGeneratedDay` sigue rechazando ingredientes vetados.

### Tests

El test de REQ-61 en `scripts/test-coach-quota.mjs` (diet_day válido → 200, con ingrediente restringido → 422) se mantiene como guarda de regresión del filtrado duro. No se añade test de calorías: el fix es puramente de prompt (string) y `validateGeneratedDay` vive en `index.html` (browser), fuera del alcance del harness de tests `.mjs` de Node; un aserto sobre la aritmética de tolerancia no ejercitaría código real.

### Pendiente conocido (fuera de alcance, candidato a REQ nuevo)

`vegetariano` no se filtra en ningún lado (solo `vegano` dispara restricciones en `coachHardRestrictions`/`coachFoodBlockTerms`). Un usuario vegetariano puede recibir platos con carne/pescado como referencia, y `validateGeneratedDay` tampoco lo valida. No afecta a las calorías (la carne sube kcal), pero es un hueco de cumplimiento de dieta.

### Criterios de aceptación

- `node scripts/test-coach-quota.mjs` pasa sin errores.
- `node scripts/release-gate.mjs` pasa 18/18.
- "Preparar mi semana" genera días dentro de ±15% de la meta calórica (la IA escala porciones para alcanzarla).
- Platos con restricciones (duras y suaves) siguen sin sugerirse en la lista de referencia.

## REQ-65 - Fix: los patrones vegano/vegetariano no excluían productos de origen animal

**Estado: implementado.**

### Problema (descubierto al verificar REQ-64)

Las dietas `vegano` y `vegetariano` no filtraban carne/pescado, y `vegano` tampoco filtraba lácteos. `coachHardRestrictions()` solo añadía términos de huevo para `sin_huevo`/`vegano`. El hueco **activo** era vegano: el catálogo tiene varios platos densos con lácteo (`Queso fresco`, `Yogur griego`, `Parmesano`, `Leche evaporada`), así que un usuario vegano recibía esos platos en la lista de referencia, en las opciones del coach y podían pasar la validación del servidor. El hueco de `vegetariano` (carne/pescado) estaba **latente**: el catálogo es 100% vegetariano (el seed lo declara: "Vegetariano sin huevo"), así que hoy no hay carne que filtrar, pero la IA podría inventarla.

### Decisión técnica (alcance y por qué)

El matcher de restricciones (cliente `coachTextHasTerms` y servidor `containsRestriction`) usa **substring sin límites de palabra** (`haystack.includes(term)`). Esto impide añadir términos de carne comunes con seguridad: `"pollo"` colisionaría con `"repollo"` (col, usada en varios platos veganos), y `"res"` con `"fresco"`/`"fresa"`. Por eso:

- **Lácteos de vegano → términos duros** en `coachHardRestrictions()`: `queso, yogur, yogurt, parmesano, leche evaporada, lácteo, lacteo`. Estos no colisionan en el catálogo y deliberadamente **no** incluyen `"leche"` a secas (bloquearía `Leche vegetal`/`Leche de coco`, aptas) ni `"mantequilla"` (bloquearía `Mantequilla de maní`). Al ser duros fluyen a los tres caminos: filtro de la lista de referencia (`coachFoodBlockTerms`), línea `PROHIBIDO` del prompt (`hardResLine`) y validación del servidor (`dietQuotaValidation` → 422).
- **Carne/pescado → instrucción de prompt** (`vegLine`), no término, para evitar la colisión `pollo`/`repollo`. Cubre `vegetariano` ("no carne, aves, pescado ni mariscos") y `vegano` (además lácteos/huevo/miel). No hay enforcement por término para carne; es aceptable porque el catálogo no tiene carne y la IA recibe la instrucción explícita.

### Alcance (`index.html`)

- `coachHardRestrictions()`: añade los términos de lácteo cuando `diet` incluye `vegano`.
- `generateOneDay()`: nueva `vegLine` insertada en el prompt tras `hardResLine`.

### Test (`scripts/test-coach-quota.mjs`)

Dos casos nuevos que ejercitan el enforcement real del servidor con el set de términos vegano: (1) un día con `Queso fresco` → **422**; (2) control: un día 100% vegetal con `Leche vegetal` → **200** (confirma que no hay falso positivo por el término de lácteo).

### Pendiente conocido (fuera de alcance)

El enforcement por término de carne/pescado requiere que el matcher soporte límites de palabra (hoy es substring puro). Si en el futuro se agregan platos con carne al catálogo, conviene primero mejorar `coachTextHasTerms`/`containsRestriction` a comparación por palabra y entonces añadir términos cárnicos. Igualmente, `miel` para vegano no está como término duro (solo en prompt).

### Criterios de aceptación

- `node scripts/test-coach-quota.mjs` pasa sin errores.
- `node scripts/release-gate.mjs` pasa 18/18.
- Un perfil vegano no recibe platos con lácteo en la lista de referencia ni en opciones del coach, y un plan con lácteo se rechaza (422).
- `Leche vegetal`/`Leche de coco` siguen permitidas para veganos.
- Los planes de vegetariano/vegano incluyen en el prompt la instrucción de excluir carne y pescado.

## REQ-66 - Soporte real de dietas omnívoras: catálogo con carne/pescado + matcher por palabra

**Estado: implementado.**

### Problema

La app ofrecía `omnívoro` como patrón de alimentación, pero el catálogo era 100% vegetariano (sin un solo ingrediente de carne, ave o pescado). Un usuario omnívoro recibía, de facto, planes vegetarianos. Cerrarlo requería (a) contenido animal en el catálogo y (b) poder filtrar ese contenido para perfiles vegetarianos/veganos — lo que REQ-65 dejó pendiente porque el matcher de restricciones era substring puro y `"pollo"` colisionaba con `"repollo"`.

### Fix

**1. Matcher por palabra (`index.html` y `api/claude.js`).** `coachTextHasTerms` (cliente) y `containsRestriction` (servidor) pasan de `includes()` substring a comparación por token: se tokeniza el texto (minúsculas, sin acentos, separando por no-alfanumérico) y un término coincide si sus tokens aparecen consecutivos, admitiendo prefijo solo en el último token (plurales: `pollo`→`pollos`). Así `"pollo"` ya no matchea `"repollo"` ni `"res"` matchea `"fresco"`. Ambas implementaciones son equivalentes en semántica (los tests del servidor cubren el caso `repollo`).

**2. Términos de carne/pescado (`coachHardRestrictions`).** Para `vegetariano`/`vegano` se añaden términos duros: `carne, pollo, pavo, cerdo, ternera, res, jamón, chorizo, tocino, pescado, atún, salmón, trucha, merluza, gamba, langostino, camarón, marisco, calamar, pulpo, anchoa, sardina`. Al ser duros fluyen al filtro de la lista de referencia, a la línea `PROHIBIDO` del prompt y a la validación del servidor (422). Verificado que ninguno colisiona (como prefijo de palabra) con el catálogo vegetariano existente.

**3. Contenido omnívoro (`supabase/seed.sql`).** Nuevos ingredientes (categoría `Proteína animal`, macros por 100 g): Pechuga de pollo, Pavo molido magro, Carne de res magra, Huevo entero, Atún en agua, Salmón. Nuevos platos: Huevos revueltos + avena (desayuno), Pollo a la plancha + arroz + brócoli y Bowl de atún + arroz + palta (almuerzo), Carne de res salteada + papa + verduras y Salmón al horno + quinua + verduras (cena). El encabezado del seed deja de decir "Vegetariano sin huevo".

### Tests (`scripts/test-coach-quota.mjs`)

Tres casos nuevos contra el enforcement real del servidor: (1) perfil vegetariano + día con pechuga de pollo → **422**; (2) omnívoro (sin restricciones) + el mismo día → **200**; (3) **regresión**: día vegetariano que usa `Repollo` con `"pollo"` entre las restricciones → **200** (prueba que el matcher es por palabra). `supabase/validate.mjs` sigue en verde (61 ingredientes, 48 platos).

### Acción manual pendiente (no la hace el agente)

⚠️ El seed cambia el **repo**, no la base de producción. Para que el contenido omnívoro aparezca en producción hay que re-ejecutar `supabase/seed.sql` en Supabase. **Cuidado: el seed hace `truncate ... restart identity cascade` de `ingredients/dishes/dish_ingredients/diets/diet_dishes`** — borra y recarga el catálogo (no toca perfiles, day_log ni datos de usuario, pero reinicia los ids de platos). Hacerlo en una ventana sin tráfico.

### Pendiente conocido (fuera de alcance)

`miel` no es término duro para vegano (solo va por prompt). Las dietas `pescetariano`/`flexitariano` no existen como opción. Si se amplía el catálogo con más cortes/pescados, basta añadir términos (el matcher ya los soporta con seguridad).

### Criterios de aceptación

- `node scripts/test-coach-quota.mjs` y `node scripts/validate.mjs` pasan.
- `node scripts/release-gate.mjs` pasa 18/18.
- Un perfil omnívoro ve platos con carne/pescado en la lista de referencia; uno vegetariano/vegano no, y un plan con carne se rechaza (422).
- `Repollo` (y otros ingredientes vegetales) no se bloquean por colisión de substring.

## REQ-67 - Splits progresivos de entrenamiento (Full Body → Upper/Lower → Push/Pull/Legs)

### Objetivo

Implementar splits de entrenamiento adaptados al nivel de experiencia del usuario (`trainingExperience`): principiantes usan Full Body, intermedios Upper/Lower y avanzados Push/Pull/Legs por defecto — sin que el usuario tenga que elegir nada (excepto usuarios avanzados, que pueden cambiar el split manualmente). El nivel asciende automáticamente en función del RPE reportado en las sesiones; nunca baja.

### Contexto

- `trainingExperience` (`beginner`/`intermediate`/`advanced`) ya existía en el onboarding y se pasaba al prompt de Claude, pero no afectaba qué split se asignaba.
- El catálogo de ejercicios ya tenía todos los ejercicios con `level='beginner'`; no había ejercicios de nivel intermedio/avanzado ni filtrado por nivel en las sesiones.
- Los roles `pushA`/`pullA`/`legsA` (PPL) no existían en `FITBUD_WORKOUT_EXERCISES`.
- El RPE por serie en `day_log.state.workoutExecution` ya se capturaba — faltaba la lógica que lo analizara para subir el nivel.

### Alcance

1. **Nivel inicial**: se declara en el onboarding como antes (sin cambios en esa UI).

2. **Splits por nivel** — asignados automáticamente, sin opción de elegir para principiante/intermedio:
   - `beginner` → Full Body (`fullA`/`fullB`).
   - `intermediate` → Upper/Lower (`torsoA`/`piernaA`/`torsoB`/`piernaB`).
   - `advanced` → Push/Pull/Legs (`pushA`/`pullA`/`legsA`/`pushB`/`pullB`/`legsB`) por defecto; puede elegir otro split en Perfil (campo `workoutSplit`).

3. **Roles PPL nuevos en el catálogo** (`FITBUD_WORKOUT_EXERCISES`):
   - `pushA`, `pullA`, `legsA`, `pushB`, `pullB`, `legsB` para `gym` y `bodyweight`.

4. **Ejercicios nuevos con nivel intermedio/avanzado** en `exercise-catalog.js` y `supabase/exercises.sql`:
   - *Intermedios*: lateral-raise, cable-fly, face-pull, hammer-curl, diamond-push-up, pull-up, decline-push-up.
   - *Avanzados*: weighted-pull-up, front-squat, archer-push-up, nordic-hamstring-curl.

5. **Filtro de nivel en `allowedExercisesForSession`**: principiante solo ve ejercicios `beginner`; intermedio ve `beginner`+`intermediate`; avanzado ve todos.

6. **Progresión automática de nivel** (`checkAutoLevelProgression`):
   - Se ejecuta al abrir el generador de plan de entrenamiento.
   - Analiza `S.days` (historial local de `workoutExecution` en `day_log`).
   - **Umbral recomendado (decisión técnica — el dueño de producto no fijó valores exactos)**:
     - `beginner → intermediate`: en las últimas **3 semanas**, al menos **3 sesiones de fuerza** con RPE registrado, ≥ **6 series** totales con RPE, y ≥ **75 %** de esas series con RPE ≤ 6. *Justificación: RPE ≤ 6 implica ≥ 4 RIR (muy poco estímulo); 3 semanas / 3 sesiones / 75% garantizan consistencia sin pedir demasiado datos.*
     - `intermediate → advanced`: en las últimas **4 semanas**, al menos **4 sesiones de fuerza**, ≥ **8 series** con RPE, y ≥ **75 %** con RPE ≤ 7. *Justificación: umbral ligeramente más alto (RPE ≤ 7 = ≥ 3 RIR) y mayor ventana para asegurar que el usuario ha superado el nivel intermedio de forma sostenida.*
   - El nivel **solo sube**, nunca baja — aunque el usuario deje de entrenar mucho tiempo. Confirmado por el dueño de producto.
   - Si el nivel sube, se guarda vía `saveProfilePrefs` y se notifica al usuario con un toast.

7. **Selector de split en Perfil** visible solo para `advanced`:
   - Campo `pf_split` con opciones: Full Body (`fullbody`), Superior/Inferior (`upperlower`), Push/Pull/Piernas (`ppl`).
   - Se guarda en `profile.prefs.workoutSplit`; se ignora si el nivel no es `advanced`.
   - Por defecto (vacío) = PPL.

### Criterios de aceptación

- Un `beginner` recibe siempre `fullA`/`fullB`, sin importar priority ni número de días.
- Un `intermediate` recibe siempre `torsoA`/`piernaA`/`torsoB`/`piernaB` (Upper/Lower).
- Un `advanced` recibe PPL por defecto; puede cambiar el split a Full Body o Upper/Lower desde Perfil.
- El selector de split NO aparece en el Perfil para `beginner` ni `intermediate`.
- `allowedExercisesForSession` excluye ejercicios `intermediate` y `advanced` para usuarios `beginner`.
- `checkAutoLevelProgression` sube a `intermediate` cuando se cumple el umbral de RPE ≤ 6 definido; no baja si las semanas siguientes tienen RPE alto.
- `release-gate.mjs` y `validate-splits.mjs` pasan en verde.

### Verificación sugerida

```
node scripts/validate-splits.mjs
node scripts/release-gate.mjs
```

### Acción manual pendiente (Supabase)

Ejecutar el bloque de INSERT adicional de `supabase/exercises.sql` para que los ejercicios `intermediate`/`advanced` nuevos aparezcan en la tabla `exercises` de producción.

## REQ-68 - Fix: "Preparar mi plan de entrenamiento" rechazaba el plan con "La semana 2 está fuera de orden."

**Estado: implementado.**

### Problema

Al generar "Preparar mi plan de entrenamiento" aparecía un modal de error: "La semana 2 está fuera de orden." El mensaje proviene de `training-plan.js#validatePlan`, que exige `plan.weeks[index].week === index+1` para cada semana.

### Causa raíz (verificada contra código, no es una regresión de REQ-67)

`trainingPlanValidationConfig()` en `index.html` construye el objeto `validation` que se pasa con spread a `TRAINING_PLAN.normalizeWeek(parsed, {...validation, ...})` —tanto en el camino con IA como en el determinista (`fallbackOnly`), en `generateTrainingWeek()`—. Esa función nombraba la semana solicitada como `expectedWeek:expected.week`. Pero `training-plan.js#normalizeWeek` lee `config.week` (línea: `const expectedWeek=Math.max(1,integer(config&&config.week,1));`), no `config.expectedWeek`. Como esa clave nunca existía en `validation`, `config.week` era siempre `undefined` y `normalizeWeek` caía al fallback `1` **en cada semana**, devolviendo `week.week=1` sin importar cuál semana se estuviera generando. Al ensamblarse `plan.weeks` en `openTrainingPlanGenerator()`, la semana en el índice 1 (la segunda) llegaba con `week.week=1`, y `validatePlan` lo detectaba como "fuera de orden" (`1 !== 2`). Por la misma razón, `normalizeWeek` también calculaba internamente la fase de progresión (`expectedPhase`) a partir de esa semana mal calculada, así que el plan completo —más allá de la primera semana— quedaba con datos de semana 1 disfrazados de semana N; ese segundo síntoma quedaba enmascarado porque el primer `issue` ("fuera de orden") ya hacía fallar la validación antes de notarlo.

Esto **no es una regresión de REQ-67** (commit `b3b1d25`, mismo día): ese commit no modificó `training-plan.js`, ni `trainingPlanValidationConfig`, ni el bucle de `openTrainingPlanGenerator`/`generateTrainingWeek` que ensambla `plan.weeks`. `git log --follow -- training-plan.js` muestra que ese archivo solo se tocó una vez, en `0d19a23` (REQ-17, generador IA de planes de entrenamiento), commit donde se introdujo `trainingPlanValidationConfig` con la clave `expectedWeek` desde el primer día. El bug es preexistente desde REQ-17 y simplemente no había sido detectado hasta ahora.

Por qué el release gate nunca lo capturó: `scripts/validate-training-plan.mjs` prueba `training-plan.js` de forma aislada pasando manualmente un config con la clave correcta (`week:` en vez de `expectedWeek:`), por lo que nunca ejercitó el wiring real de `index.html`. La discrepancia de nombre de propiedad entre productor (`index.html`) y consumidor (`training-plan.js`) quedó invisible para los tests existentes.

### Fix (`index.html`)

Una línea en `trainingPlanValidationConfig()`: se agrega `week:expected.week` (se conserva `expectedWeek` por compatibilidad, ya que se usa como metadata en `coachQuota`). Con esto `normalizeWeek` recibe la semana correcta en cada iteración y calcula la fase de progresión real para esa semana.

### Tests

`scripts/validate-training-plan-wiring.mjs` (nuevo, integrado en `release-gate.mjs`): extrae la función real `trainingPlanValidationConfig` (y su dependencia `trainingBlockedTerms`) del código fuente de `index.html` por parseo de llaves balanceadas —mismo patrón que usan otros `validate-*.mjs` que auditan `index.html` sin DOM— y reproduce el flujo real de `generateTrainingWeek` → `normalizeWeek` → `validatePlan` para planes de 4 y 10 semanas, confirmando `plan.weeks[index].week === index+1` para todas las semanas. Se verificó manualmente que el test falla con el mensaje original ("La semana no coincide con la solicitada.") al revertir el fix sobre una copia del archivo, y pasa limpio con el fix aplicado.

### Criterios de aceptación

- `node scripts/validate-training-plan-wiring.mjs` pasa sin errores.
- `node scripts/release-gate.mjs` pasa con el mismo conteo de checks en verde que antes de este fix, más el nuevo validador.
- "Preparar mi plan de entrenamiento" genera planes de 4 y 10 semanas sin el error "La semana N está fuera de orden." en ningún índice.

## REQ-69 - Fix: editar macros en el perfil no actualizaba el objetivo del día en Nutrición

**Estado: implementado.**

### Problema

Al editar macros en la pantalla "Define tu objetivo y tus macros" (Perfil → Recalcular objetivos), los cambios se guardaban en `profile.prefs` pero el tab Nutrición seguía mostrando los objetivos del plan anterior. Caso concreto reportado: proteína editada a 180 g, mostrada como 141 g en "Macros del día". Las calorías sí coincidían (ambas 2300) porque el snapshot del plan también tenía ese valor, lo que hacía el bug menos obvio.

### Causa raíz

`buildDay(ds)` construye el objeto de día con `target: effectiveDayTarget(ctx.prefs)`, donde `ctx.prefs` viene de `planContextForDate(ds)` → `planPrefsForDate(ds)`. Esa función, cuando existe una versión de plan activa para la fecha, devuelve `version.snapshot.prefs` (los prefs congelados al momento de generar el plan) en lugar de `profile.prefs` (los prefs actuales del usuario):

```js
function planPrefsForDate(ds){
  const version=planVersionForDate(ds);
  const source=version&&version.snapshot&&version.snapshot.prefs
    ?version.snapshot.prefs          // ← snapshot congelado
    :((profile&&profile.prefs)||{}); // ← prefs actuales (solo si no hay plan)
  return migrateProfilePrefs(source);
}
```

Al pasar esos snapshot-prefs a `effectiveDayTarget(ctx.prefs)`, el objetivo del día se calculaba desde los valores congelados del snapshot (proteína: 141 g calculada automáticamente cuando se generó el plan), ignorando que el usuario luego había cambiado manualmente su proteína objetivo a 180 g.

El snapshot tiene sentido para estructura del plan (entrenamientos, horarios de comida), pero los macros objetivo deben reflejar siempre lo que el usuario guardó más recientemente en su perfil.

### Fix (`index.html`, línea ~1593)

En `buildDay()`, se quita el argumento `ctx.prefs` de la llamada a `effectiveDayTarget`:

```diff
- return {ds,...,target:effectiveDayTarget(ctx.prefs),...};
+ return {ds,...,target:effectiveDayTarget(),...};
```

Sin argumento, `effectiveDayTarget` cae al fallback `(profile&&profile.prefs)||{}` — siempre los valores actuales. El snapshot sigue siendo usado para todo lo demás (estructura de comidas, workout plan).

### Tests

`scripts/validate-macro-target-wiring.mjs` (nuevo, integrado en `release-gate.mjs`): extrae `buildDay` del fuente real de `index.html` y verifica estructuralmente que no contiene `effectiveDayTarget(ctx.prefs)` y sí contiene `effectiveDayTarget()`.

### Criterios de aceptación

- `node scripts/validate-macro-target-wiring.mjs` pasa sin errores.
- `node scripts/release-gate.mjs` pasa con todos los checks en verde tras el commit.
- En el tab Nutrición, "Macros del día" muestra el objetivo de proteína que el usuario guardó en su perfil, no el calculado automáticamente al generar el plan.

## REQ-70 - Validación de negocio y beta controlada

**Estado: pendiente. Requiere entrevistas, usuarios reales y decisión de producto; no implementable por el agente autónomo.**

### Origen

Punto 6 del status general: el producto está construido, desplegado y técnicamente verde, pero aún falta validar con uso real si el problema duele, si el primer valor se entiende, si hay retención y si existe disposición de pago. La fuente estratégica es `estrategia/01-Plan-de-Validacion.md`.

### Objetivo

Convertir Fitbros de "producto implementado" a "producto validado o invalidado con evidencia", antes de invertir en adquisición, checkout comercial definitivo o nuevas features grandes.

La decisión final debe ser una de tres:

- **GO**: hay señal suficiente para activar cobro y adquisición.
- **ITERAR**: el problema existe, pero activación/retención/fricción requieren ajustes.
- **PIVOT**: el problema, segmento o promesa no sostienen uso/pago.

### Alcance humano obligatorio

1. **Dogfooding Cliente 0**
   - Usar Fitbros como única herramienta durante al menos 4 semanas.
   - Registrar diariamente fricción, momento de valor, adherencia y casos donde el plan se rompió.
   - Hacer una revisión semanal con top 3 fricciones y top 3 momentos de valor.

2. **Entrevistas de problema**
   - Reclutar 10-15 personas, mínimo 5 por segmento A y 5 por segmento B.
   - Entrevistar antes de mostrar el producto.
   - Registrar si el dolor aparece espontáneamente, si hubo intentos fallidos recientes y si ya gastan tiempo o dinero en resolverlo.

3. **Prueba de activación observada**
   - Pedir a cada persona crear cuenta, completar onboarding, llegar al primer día útil, registrar una comida y resolver una contingencia.
   - Medir time-to-first-value y puntos de bloqueo sin ayuda.

4. **Beta de uso real**
   - Dar acceso 1-2 semanas.
   - Medir activación, adherencia, D7/D14, uso del coach, generación/adaptación y costo IA.
   - Separar resultados por segmento A/B.

5. **Encuesta de valor y disposición a pagar**
   - Sean Ellis: porcentaje "muy decepcionado" si Fitbros desaparece.
   - Test de precio con compromiso real: pago simbólico, lista founder, método de pago o intención fuerte con monto concreto.
   - Identificar método preferido: tarjeta, Yape/Plin, Mercado Pago u otro.

### Alcance implementable por el agente

El agente sí puede preparar soporte para la validación, pero no reemplazarla:

- Crear plantillas de entrevista, encuesta y diario en `estrategia/`.
- Automatizar captura y priorización de candidatos de reclutamiento sin cerrar el REQ: formulario público, endpoint server-side, tabla privada y script de revisión.
- Crear un tablero estático o script de métricas que lea `product_events`, `day_log` y `billing_events`.
- Agregar eventos faltantes si se detecta que una métrica crítica no está instrumentada.
- Sintetizar resultados pegados por el usuario y producir recomendación GO/ITERAR/PIVOT.

### Fuera de alcance

- No inventar resultados de entrevistas o beta.
- No activar adquisición paga antes de una decisión GO.
- No cambiar precio, packaging o cabeza de playa solo por intuición.
- No marcar este REQ como implementado por crear documentos; solo se cierra con evidencia real.

### Métricas mínimas

| Métrica | Umbral de señal positiva |
|---|---|
| H1 Problema | >=60% describe el dolor sin sugerirlo |
| Activación | >=70% completa onboarding y llega al primer día útil sin ayuda |
| Time-to-first-value | <10 min en prueba observada |
| Retención beta | D7 >=40%, D14 >=25% |
| Sean Ellis | >=40% "muy decepcionado" |
| Disposición a pagar | >=30% da un paso de compromiso real |
| Costo IA | No se dispara por usuario activo |

### Criterios de aceptación

- Existe una tabla de participantes con segmento, estado y resultado.
- Hay notas o grabaciones resumidas de al menos 10 entrevistas.
- Hay resultados separados para Segmento A y Segmento B.
- Hay medición de activación, adherencia, retención D7/D14 y costo IA.
- Hay decisión escrita GO/ITERAR/PIVOT con evidencia.
- Se actualiza `estrategia/01-Plan-de-Validacion.md` o se crea un informe de cierre de beta con aprendizajes y próximos RQs.

## REQ-71 - Sincronizar documentación operativa con el estado real del código

**Estado: implementado.**

### Origen

Punto 8 del status general: existe drift documental. El código consolidó endpoints y cambió decisiones operativas, pero algunos documentos siguen describiendo superficies antiguas o estados ya resueltos.

Ejemplos detectados:

- `README.md` todavía menciona `/api/coupon`, pero REQ-62 consolidó cupones dentro de `/api/entitlement`.
- `CONTEXT.md` todavía lista `api/billing-history.js` y `api/coupon.js`, aunque esos archivos fueron eliminados.
- Algunos documentos de negocio siguen diciendo "checkout pendiente de activar" sin distinguir entre infraestructura implementada y configuración externa pendiente.
- `api/notify.js` comenta cron horario, mientras `vercel.json` usa cron diario por restricción de Vercel Hobby.
- `PROGRESS.md` representa solo las fases iniciales y ya no comunica el estado real del producto.

### Objetivo

Que cualquier persona o agente que retome el proyecto lea documentación consistente con el código actual, sin perseguir endpoints inexistentes ni asumir pendientes ya resueltos.

### Alcance

1. **Actualizar mapa de archivos**
   - `CONTEXT.md` debe listar solo archivos existentes.
   - Reemplazar `api/billing-history.js` y `api/coupon.js` por las acciones consolidadas de `api/entitlement.js`.
   - Ajustar el conteo de release gate si el documento menciona valores antiguos.

2. **Actualizar README**
   - Reemplazar `/api/coupon` por `/api/entitlement` con acciones `generate`/`redeem`.
   - Documentar que billing history se consulta con `GET /api/entitlement?action=billing-history`.
   - Aclarar que Stripe checkout está implementado en código pero requiere configuración externa para cobro real.

3. **Actualizar documentos de negocio/estrategia**
   - Separar "implementado en código" de "activado comercialmente".
   - Marcar landing/paywall/checkout como infraestructura lista, con validación y configuración comercial pendientes.
   - Actualizar referencias antiguas a "no existe landing" si ya quedaron superadas.

4. **Actualizar cron y notificaciones**
   - Alinear `api/notify.js`, `CONTEXT.md` y `vercel.json`.
   - Documentar explícitamente la limitación actual: cron diario en Hobby; granularidad horaria requiere plan Pro o scheduler externo.

5. **Agregar guardrail liviano**
   - Extender `scripts/audit-html.mjs` o crear un script pequeño de docs audit que falle si reaparecen referencias a endpoints eliminados (`/api/coupon`, `/api/billing-history`) o afirmaciones obvias ya falsas.
   - Integrarlo en `scripts/release-gate.mjs` si el costo es bajo.

### Fuera de alcance

- No reescribir todos los documentos estratégicos desde cero.
- No cambiar código funcional salvo que la auditoría detecte una contradicción real.
- No borrar historia útil de decisiones; si una sección antigua se conserva, marcarla como histórica.

### Criterios de aceptación

- `rg -n "api/coupon|api/billing-history|billing-history.js|coupon.js" README.md CONTEXT.md NEGOCIO.md estrategia REQUIREMENTS.md` no devuelve referencias vigentes incorrectas; solo referencias históricas explícitamente marcadas como "antes" o REQ-62.
- `README.md` y `CONTEXT.md` describen correctamente `api/entitlement.js`.
- Los docs distinguen checkout implementado vs Stripe configurado/activado.
- La documentación del cron coincide con `vercel.json`.
- `node scripts/release-gate.mjs` pasa.

## REQ-72 - Modularización incremental de index.html sin cambio funcional

**Estado: implementado.**
Fase 1 completa: creado `js/nutrition-pure.js` (377 líneas, patrón IIFE idéntico a `domain-contracts.js`) con 59 símbolos extraídos. `index.html` redujo 249 líneas (9563→9314). Sin build step, sin dependencias nuevas. Tests directos en `scripts/test-nutrition-pure.mjs`.

### Origen

Punto 9 del status general: `index.html` concentra la mayoría de la app (~9k líneas). Está validado y funciona, pero el tamaño aumenta el riesgo de regresiones, dificulta revisión y vuelve lentas las futuras mejoras.

### Objetivo

Reducir la complejidad operativa de `index.html` mediante módulos incrementales, sin cambiar comportamiento visible ni introducir framework/build step.

La regla de oro es: **extraer primero dominio puro y servicios aislados; dejar el render acoplado al DOM para fases posteriores.**

### Alcance fase 1

1. **Inventario de responsabilidades**
   - Crear un mapa breve de secciones actuales de `index.html`: config, estado, planes, nutrición, entrenamiento, coach, perfil, admin, sync, analytics, tour.
   - Identificar funciones puras ya testeables y funciones DOM-heavy que no deben tocarse todavía.

2. **Extraer módulo de nutrición/coach puro**
   - Candidatos: normalización de restricciones, matcher por palabra, validación de platos generados, cálculo de deltas de macros, learned patterns.
   - El módulo debe funcionar en navegador y Node sin dependencias externas.
   - Exportar vía ESM y exponer fallback global solo si la carga desde `index.html` lo necesita.

3. **Extraer módulo de sync puro**
   - Candidatos: forma de entradas de cola, clasificación de estados, merge policy básica, sanitización de payload.
   - Mantener acceso a `localStorage` en `index.html` salvo que se cree un wrapper muy pequeño.

4. **Actualizar pruebas**
   - Migrar validadores basados en parsing de `index.html` hacia imports directos cuando aplique.
   - Conservar los validadores de wiring para asegurar que `index.html` usa el módulo extraído.

5. **Mantener compatibilidad**
   - Sin build step.
   - Sin framework.
   - Sin nuevas dependencias runtime.
   - Sin cambiar nombres públicos usados por HTML inline antes de adaptar los handlers.

### Fuera de alcance

- No convertir toda la app a SPA con bundler.
- No reescribir la UI.
- No mover todo el coach, entrenamiento o perfil en un solo commit.
- No cambiar contrato de Supabase ni API.

### Riesgos

- Los handlers inline (`onclick`) dependen de funciones globales.
- El service worker puede cachear versiones mezcladas si no se sube `CACHE`.
- Los validadores actuales parsean `index.html`; mover funciones exige actualizarlos.

### Criterios de aceptación

- `index.html` reduce al menos 500 líneas o se extrae un bloque funcional claro con pruebas directas.
- La app sigue cargando sin build desde `python3 -m http.server 8923`.
- `node scripts/release-gate.mjs` pasa.
- Los módulos extraídos tienen tests o validadores dedicados.
- No cambia ninguna tabla Supabase ni endpoint público.
- Si se toca UI, se verifica manualmente Home, Nutrición, Entreno y Perfil en local.

## REQ-73 - Resolución explícita de conflictos de sincronización offline

**Estado: implementado.**

### Origen

Punto 10 del status general: la cola offline ya evita perder cambios locales, pero cuando dos dispositivos editan el mismo día o peso, el último `upsert` gana. Eso es aceptable como MVP técnico, pero no es resolución de conflictos real.

### Objetivo

Detectar y resolver conflictos entre estado local pendiente y estado remoto modificado por otro dispositivo, sin sobrescribir silenciosamente actividad relevante del usuario.

### Alcance

1. **Versionado mínimo de registros sincronizados**
   - Agregar a payloads locales metadata `updatedAt`, `clientId` y `baseRemoteUpdatedAt` cuando se encola una mutación.
   - Reutilizar columnas existentes si `updated_at` ya existe; si falta en alguna tabla, proponer migración idempotente.

2. **Detección de conflicto**
   - Antes de drenar una mutación pendiente, leer el registro remoto actual.
   - Si el remoto cambió después de `baseRemoteUpdatedAt` y no fue el mismo `clientId`, marcar conflicto en la cola en vez de hacer `upsert` ciego.
   - Mantener last-write-wins solo para cambios claramente no conflictivos.

3. **Merge automático seguro**
   - Para `day_log.state.meals`: combinar checks `done` por comida cuando no editan el mismo slot con valores distintos.
   - Para `extras`: preservar extras con IDs distintos; si dos extras tienen el mismo ID y distinto contenido, marcar conflicto.
   - Para `workoutExecution`: no mergear series contradictorias; marcar conflicto si ambos dispositivos cambiaron la ejecución.
   - Para `weight_log`: si peso/grasa difieren para la misma semana, marcar conflicto.

4. **UI de resolución**
   - Badge de sync debe mostrar estado "conflicto" o "revisar".
   - Modal simple: "Conservar este dispositivo", "Usar versión guardada" o "Combinar seguro" cuando exista merge automático.
   - Mostrar fecha/dispositivo de cada versión cuando esté disponible.

5. **Auditoría local**
   - Registrar resolución en `day_log.state.syncResolutionLog` o metadata local equivalente.
   - No enviar datos de salud a analytics.

### Implementado

**Motor puro (`sync-conflicts.js`).** Nuevo módulo sin DOM ni dependencias que expone `normalizeDayStateForSync`, `remoteChangedSince`, `mergeDayLogStates` y `mergeWeightPayload`. La app lo carga antes del cliente Supabase y el service worker lo incluye en el shell (`fitbud-pwa-v49`). El módulo se valida en Node con `scripts/test-sync-conflicts.mjs`.

**Metadata local de sync.** La cola `fitbud_syncq_v1` conserva `clientId`, `baseRemoteUpdatedAt` y `basePayload` al encolar. La metadata `fitbud_sync_meta_v1` recuerda la última versión remota vista por usuario, entidad y clave. Los pulls de `day_log`/`weight_log` ahora leen `updated_at` y actualizan esa base; `pullDay`, `pullAllDays` y `pullWeights` no pisan registros con estado `pending`, `failed` o `conflict`.

**Detección antes del upsert.** `drainSyncQueue()` lee la fila remota antes de guardar una mutación pendiente. Si `updated_at` remoto avanzó respecto de `baseRemoteUpdatedAt`, intenta resolver con el motor puro. Si el payload remoto ya coincide con el local, elimina la mutación; si el merge es seguro, guarda el payload combinado; si hay conflicto, marca la entrada como `status:"conflict"` y conserva el remoto dentro de `item.conflict.remotePayload`.

**Merge seguro.** En `day_log.state`, las comidas distintas se combinan por id de slot, los extras se preservan por `_syncId` interno y `syncResolutionLog` se une sin duplicar entradas. Si ambos lados cambiaron `workoutExecution` u otro campo incompatible de forma distinta, queda conflicto. En `weight_log`, peso local y grasa remota pueden combinarse si no cambian el mismo campo; dos valores distintos para `kg` o `bf_pct` generan conflicto.

**UI de resolución.** El badge `#sync-badge` agrega estado `conflict` con texto "Revisar". El modal `openSyncConflicts()` muestra cada conflicto y permite: "Conservar este dispositivo", "Usar versión guardada" o "Combinar seguro" cuando exista payload seguro. Elegir la versión local reintenta como mutación pendiente con la nueva base remota; elegir la remota aplica el payload remoto y elimina la mutación. Los conflictos sobreviven reload porque quedan en localStorage y están aislados por `uid`.

**Contratos y PWA.** `domain-contracts.js` acepta `status:"conflict"` y valida metadata opcional de cola. `service-worker.js` sube a `fitbud-pwa-v49` e incluye `sync-conflicts.js`.

### Fuera de alcance

- No construir CRDT completo.
- No resolver edición colaborativa en tiempo real.
- No sincronizar conversaciones del coach si siguen siendo localStorage por ciclo.
- No cambiar modelo de autenticación.

### Criterios de aceptación

- Dos dispositivos editando comidas distintas del mismo día pueden combinarse sin pérdida.
- Dos dispositivos editando el mismo peso semanal con valores distintos generan conflicto visible.
- Una ejecución de entrenamiento modificada en dos dispositivos no se sobrescribe silenciosamente.
- El badge de sync diferencia pendiente, sincronizado, error y conflicto.
- Cerrar sesión no transfiere conflictos a otro usuario.
- Los conflictos sobreviven reload hasta que el usuario elige resolución.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Test unitario o script Node para el merge de `day_log`.
- Test unitario o script Node para conflicto de `weight_log`.
- Prueba manual con dos navegadores/perfiles locales simulando cambios offline y reconexión.

### Verificación ejecutada

```
node --check sync-conflicts.js
node --check domain-contracts.js
node scripts/test-sync-conflicts.mjs
node scripts/validate-contracts.mjs
node scripts/audit-html.mjs
```

## REQ-74 - Aviso de privacidad y términos accesibles antes del registro

**Estado: implementado.**

### Origen

Auditoría del journey de **adquisición** (loop auditor, `AUDIT_AGENT.md`). Se recorrió la landing pública y la pantalla de registro estando deslogueado.

### Problema

Un visitante puede crear cuenta y empezar a entregar datos sensibles (peso, % de grasa, fotos corporales, preferencias de salud) sin poder leer en ningún momento un aviso de privacidad ni términos de servicio:

- El footer de la landing solo contiene `© 2026 Fitbros · Iniciar sesión` (`index.html:6008`). No hay enlace a privacidad ni a términos.
- La nav y el hero de la landing tampoco lo enlazan.
- La pantalla de registro (`renderAuth`, `index.html:6016`) no muestra aviso, enlace ni casilla de consentimiento antes de crear la cuenta.
- El gate de privacidad (`renderPrivacyGate` / `openPrivacyNotice`) solo aparece **después** de autenticarse, dentro de la app.

Esto contradice el principio de producto 7 ("Privacidad por defecto") y la propia FAQ de la landing, que promete: *"Tu progreso, fotos, conversaciones y datos corporales son privados… Puedes exportar o solicitar el borrado de tu cuenta y todos tus datos en cualquier momento"* (`index.html:5994`), sin dar al visitante forma de verificar esa promesa antes de registrarse.

### Causa raíz

La función que muestra el aviso ya existe y **no depende de sesión** — es un `modal()` plano:

```js
function openPrivacyNotice(){            // index.html:2455
  modal(`<h3>Privacidad sencilla</h3> ... `);
}
```

Pero solo está cableada desde pantallas autenticadas: el centro de privacidad (`index.html:2433`) y Perfil (`index.html:2708`). Ni `renderLanding()` (footer en `index.html:6008`) ni `renderAuth()` (`index.html:6016`) la invocan. No existe, además, una ruta pública estática a `PRIVACY.md`.

### Objetivo

Que cualquier visitante pueda leer el aviso de privacidad (y los términos) **antes** de crear una cuenta, desde la landing y desde la pantalla de registro, sin necesidad de loguearse.

### Alcance

1. Añadir al footer de la landing (`index.html:6008`) enlaces "Privacidad" y "Términos" que abran el aviso correspondiente (reutilizar `openPrivacyNotice()` para privacidad).
2. Añadir en la pantalla de registro (`renderAuth`) una línea bajo el botón de crear cuenta del tipo "Al crear tu cuenta aceptas nuestros Términos y el Aviso de privacidad", con ambos enlaces abriendo el modal correspondiente sin requerir sesión.
3. Si no existe aún un texto de Términos, crear un `openTermsNotice()` mínimo equivalente a `openPrivacyNotice()`, con el mismo marcado de "texto preliminar pendiente de revisión profesional" que ya usa el aviso (`index.html:2460`).
4. Verificar que ambos modales funcionan estando deslogueado (no dependen de `session`, `uid()` ni `privacyReady`).

### Fuera de alcance

- No redactar la versión legal definitiva (sigue siendo "texto preliminar pendiente de revisión profesional"; es decisión humana/legal, no del agente).
- No añadir casilla de consentimiento bloqueante en el registro: el gate de consentimiento post-login (`renderPrivacyGate`) sigue siendo la captura formal de consentimiento. Aquí solo se trata de **acceso** al aviso antes de registrarse.
- No crear una ruta/archivo HTML estático nuevo si basta con el modal in-app.

### Riesgos

- `openPrivacyNotice()` usa `modal()`, `closeModal()` y `CONSENT_POLICY_VERSION`; confirmar que están definidos en el scope global cuando se renderiza la landing (lo están, ya se usan en otros puntos sin sesión).
- No romper el layout del footer ni el de la pantalla de registro en móvil.
- Mantener REQ-31: el aviso no debe mencionar IA, modelos ni proveedores.

### Criterios de aceptación

- Estando deslogueado, el footer de la landing muestra enlaces "Privacidad" y "Términos" que abren su modal.
- La pantalla de registro enlaza ambos avisos antes de crear cuenta.
- Ambos modales abren sin error con `session` nula (probado en local sin login).
- `node scripts/release-gate.mjs` pasa.
- No se introduce vocabulario técnico prohibido por REQ-31 en los textos públicos.

### Verificación sugerida

- Servir en local (`python3 -m http.server 8923`), abrir la landing sin sesión y comprobar los enlaces del footer.
- Pulsar "Crear mi cuenta gratis" y confirmar que la pantalla de registro enlaza privacidad y términos.
- Abrir cada modal y verificar que cierra con "Entendido" y que no aparece error en consola.

## REQ-75 - Fix: prompt de generateOneDay no alcanzaba metas altas de proteína

### Problema

Con metas de macros de proteína alta (ej. 2300 kcal / 180 g proteína — 31% de kcal de proteína), la IA generaba días muy por debajo de la meta (ej. 1640 kcal, 88 g proteína). `validateGeneratedDay` rechazaba correctamente el resultado, pero el usuario quedaba sin plan.

No es un bug de caché ni de snapshot (a diferencia de REQ-69): el `contextKey` en el sistema de quota ya incluye el target de macros. El problema era puramente de prompt engineering.

### Causa raíz (verificada contra código)

1. **La línea OBLIGATORIO no daba peso igualitario a proteína**: mencionaba "kcal ±10% y proteína ≥X g" como cláusula subordinada. La IA priorizaba calorías sobre proteína.
2. **Sin instrucciones tácticas para metas altas**: el catálogo es mayormente vegetariano (tofu 16g/100g, legumbres 8-9g/100g). Para 180 g/día la IA necesita combinar múltiples fuentes de proteína por comida y usar porciones generosas, pero nada en el prompt lo instruía.
3. **Token limit fijo**: 1400 tokens para todas las metas. Un día con stacking de proteína necesita describir más ingredientes por comida.

### Solución

**Archivo: `index.html`, función `generateOneDay` (~línea 7089).**

1. **Detección de meta alta**: calcula `protPct = target.p * 4 / target.kcal * 100`. Si `protPct > 25%`, activa el bloque `highProt`.
2. **Bloque condicional `highProtLine`** (se inyecta solo cuando aplica):
   - Piso mínimo de proteína por comida: `≥ Math.round(protPerMeal * 0.7)` g.
   - Instrucción explícita de combinar 2+ fuentes de proteína por comida.
   - Lista de los ingredientes más proteicos del catálogo con su rendimiento (g prot/100g).
   - Permiso explícito de subir gramajes para alcanzar la meta.
3. **Línea OBLIGATORIO reforzada**: ahora enumera calorías y proteína como dos metas igualmente obligatorias ("AMBAS metas", "TAN importante como las calorías") e instruye a sumar y verificar totales antes de responder.
4. **Token limit escalado**: 1800 tokens cuando `highProt`, 1400 cuando no. No afecta quota/costos significativamente (es un ~28% de aumento en el techo, no en el uso real).

### Decisión: no agregar platos al seed

Se evaluó agregar variantes de "doble porción de proteína" al seed.sql. Se descartó porque:
- El prompt ya instruye a ajustar gramajes libremente y crear platos distintos.
- Agregar platos al seed requiere también recetas (`dish_ingredients`) y afecta a todos los usuarios.
- La solución de prompt es menos invasiva y más flexible: aplica proporcionalmente según la meta de cada usuario.

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `index.html` | Bloque `highProtLine` condicional + línea OBLIGATORIO reforzada + token limit escalado |
| `scripts/validate-high-protein-prompt.mjs` | Validador estructural nuevo (7 asserts + 4 casos simulados) |
| `scripts/release-gate.mjs` | Agrega `validate-high-protein-prompt.mjs` al gate |

### Invariantes que se mantienen

- `validateGeneratedDay` no cambia: sigue validando kcal ±15% y proteína ≥85%.
- El `contextKey` del sistema de quota sigue incluyendo los targets (cambia cuando cambia la meta).
- Platos incompatibles siguen filtrados por `coachDishBlockedByProfile` (REQ-61).
- Restricciones duras (`hardResLine`, dietas, alergias) no se alteran.

### Criterios de aceptación

- Con meta 2300 kcal / 180 g proteína, el prompt generado incluye "META DE PROTEÍNA ALTA", "2+ fuentes de proteína", piso mínimo por comida, y usa 1800 tokens.
- Con meta 2000 kcal / 100 g proteína (20%), el prompt no incluye el bloque extra y usa 1400 tokens.
- `node scripts/validate-high-protein-prompt.mjs` pasa (4 casos: 2300/180p, 2000/150p, 2400/200p, 2000/100p).
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Servir en local, configurar perfil con meta 2300 kcal / 180 g proteína, ejecutar "Preparar mi día" y verificar que el día generado pasa validación (sin el error "kcal fuera de ±15%" ni "Proteína por debajo del 85%").
- Repetir con meta normal (2000 kcal / 100 g proteína) y verificar que sigue funcionando igual.

## REQ-76 - Catálogo: shakes de proteína como opción de alta proteína por porción

### Contexto

Complemento de REQ-75. El prompt reforzado de `generateOneDay` instruye a la IA a combinar fuentes de proteína y subir gramajes, pero el catálogo de platos no tenía una opción simple de "shake de proteína" que la IA pudiera usar para tapar déficits rápidamente. Los batidos existentes (`Batido peri-entreno día pesas/bajo`) son específicos de entrenamiento y van en slot `batido` (que no existe en los templates de comidas estándar).

### Solución

Agregar 2 variantes de shake de proteína al seed, en slot `snack` (aparece en configuraciones de 4+ comidas), usando ingredientes que ya existen en el catálogo.

| Plato | Ingredientes | kcal | P | C | F |
|---|---|---|---|---|---|
| Shake de proteína con agua | 35g proteína en polvo | 131 | 28 | 3 | 2 |
| Shake de proteína con yogur griego | 30g proteína en polvo + 200g yogur griego 0% | 233 | 44 | 10 | 2 |

El primero es un tapahuecos mínimo (131 kcal, 28g P); el segundo es una bomba de proteína (233 kcal, 44g P) que permite a la IA cerrar déficits grandes de proteína sin excederse en calorías.

### Impacto

- **No requiere migración SQL**: el seed es re-ejecutable (`truncate` + inserts).
- **No requiere cambios en index.html**: `generateOneDay` ya itera `DB.dishes` dinámicamente y los incluye en el prompt con sus macros.
- **No afecta el plan fijo**: los shakes no están en `PLAN_SLOTS` del validador.
- **Afecta a todos los usuarios**: al re-ejecutar el seed, los 2 platos nuevos aparecen para todos. Es intencional — son opciones universalmente útiles.

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `supabase/seed.sql` | 2 dishes nuevos + 3 filas de `dish_ingredients` |

### Criterios de aceptación

- `node supabase/validate.mjs` pasa (50 platos, 50 recetas, 0 errores).
- Los macros calculados del shake con agua son ~131 kcal / 28g P.
- Los macros calculados del shake con yogur son ~233 kcal / 44g P.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Re-ejecutar `seed.sql` en Supabase (o entorno local) y verificar que los 2 platos aparecen en la tabla `dishes`.
- Servir en local, abrir "Preparar mi día" con meta alta de proteína y verificar que el prompt enviado a la IA incluye los shakes en la lista de referencia.

## REQ-77 - Fix: las metas calculadas en onboarding incumplen "kcal = suma de macros" para usuarios de alto peso en déficit

**Estado: implementado.**

### Origen

Auditoría del journey **onboarding** (commit previo leído: `bd82606` — REQ-76 shakes de proteína). Se reconstruyó el cálculo de metas de `calculateMacroTargets()` que dispara el paso 1→2 (`applyCalculatedMacros`, `index.html:2771`) y se contrastó contra el criterio de aceptación ya declarado en REQ-09: *"Las calorías coinciden con la suma de macros base"* (`REQUIREMENTS.md:616`). Para personas con peso corporal alto, objetivo déficit y BMR deprimido (estatura baja / edad alta / actividad ligera), la igualdad se rompe.

### Problema

El objetivo de calorías que se guarda y muestra no coincide con la suma calórica de las metas de macros que se guardan junto a él. Reproducción concreta (todos dentro de los rangos que valida `validateOnboardingStep`, `index.html:2752-2758`):

- Mujer 140 kg / 160 cm / 60 años, actividad ligera, objetivo **déficit**:
  - `calorieTarget = 2230`
  - macros: **P 280 g · C 50 g · F 112 g** → 280·4 + 50·4 + 112·9 = **2328 kcal**
  - **Discrepancia: +98 kcal** entre el objetivo de calorías y la suma de sus propios macros.

Como `calorieTarget`, `proteinTarget`, `carbTarget` y `fatTarget` se guardan de forma independiente y ambos afloran por separado en Hoy y Nutrición (`profileMacroTargetsFromPrefs`, `index.html:1367-1371`), el usuario recibe un objetivo internamente contradictorio: el anillo de kcal dice 2230 pero seguir los macros prescritos implica 2328 kcal/día, lo que anula ~100 kcal del déficit pretendido. Casos de control (80 kg/175/30 déficit, 110-120 kg en déficit) sí cuadran, por lo que el bug es silencioso y solo afecta al extremo de peso alto — demografía central de una app centrada en déficit.

### Causa raíz

`calculateMacroTargets()` (`index.html:1345-1361`) deriva los carbohidratos como el residuo calórico pero lo recorta con un piso sin re-balancear las calorías:

```js
const kcal=Math.round(maintenance*goalFactor/10)*10;     // 1356
const proteinRate=input.goal==="deficit"?2:1.8;
const p=Math.round((hasBf?Math.max(leanKg*2.2,kg*1.6):kg*proteinRate)); // 1358
const f=Math.round(Math.max(45,kg*.8));                  // 1359
const c=Math.max(50,Math.round((kcal-p*4-f*9)/4));       // 1360
```

- La proteína se ancla a **peso corporal total** (`kg*2` en déficit), no a masa magra ni a peso objetivo, así que para 140 kg da 280 g — fisiológicamente excesivo.
- La grasa tiene piso `Math.max(45, kg*0.8)`.
- Cuando `p*4 + f*9` se acerca o supera a `kcal`, el residuo de carbohidratos cae por debajo de 50 y el `Math.max(50, …)` lo fija en 50 **sin ajustar `kcal`**, dejando `kcal < p*4 + c*4 + f*9`.

### Objetivo

Que las metas que el onboarding calcula y guarda sean siempre internamente consistentes: la suma calórica de proteína + carbohidratos + grasa debe igualar (dentro de redondeo) el objetivo de calorías mostrado, para cualquier combinación válida de peso/estatura/edad/actividad/objetivo, cumpliendo el criterio ya prometido en REQ-09.

### Alcance

1. En `calculateMacroTargets` (`index.html:1345`), garantizar la invariante `kcal ≈ p*4 + c*4 + f*9`: cuando el residuo de carbohidratos toque el piso, reconciliar reduciendo grasa hasta su propio piso y/o ajustando `kcal` (o proteína) de forma documentada, en lugar de dejar metas que no suman.
2. Acotar la proteína para que no escale sin límite con el peso corporal total en personas de peso alto (p. ej. basarla en masa magra cuando no hay %grasa, o aplicar un techo razonable), evitando objetivos de 280 g.
3. Añadir un validador de dominio (estilo `scripts/validate-macro-target-wiring.mjs`) que recorra un barrido de perfiles válidos y falle si `|kcal − (p*4+c*4+f*9)| > 10`.

### Fuera de alcance

- Rediseñar la fórmula de BMR/mantenimiento (Mifflin/Katch-McArdle se conservan).
- Cambiar la generación de comidas con IA (REQ-75/76) ni el objetivo del día en Nutrición.
- Tocar el flujo de pasos, validaciones de rango o la UI del onboarding más allá de mostrar metas consistentes.

### Riesgos

- Reajustar proteína/grasa puede cambiar metas ya calculadas para usuarios existentes; debe afectar solo el cálculo, no reescribir prefs guardadas sin que el usuario recalcule.
- El re-balanceo no debe romper los casos de control que hoy ya cuadran (80/110/120 kg).

### Criterios de aceptación

- Para el caso 140 kg / 160 cm / 60 años / ligera / déficit, `calorieTarget` y la suma de macros difieren en ≤ 10 kcal.
- Un barrido de perfiles válidos (peso 35-250, estatura 130-230, edad MIN-90, todas las actividades y objetivos, con y sin %grasa) no produce ninguna meta donde `|kcal − suma de macros| > 10`.
- La proteína calculada para un usuario de 140 kg en déficit queda en un rango fisiológico documentado (no 280 g por anclarse al peso total).
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Reproducir en local (`python3 -m http.server 8923`): abrir onboarding, ingresar 140 kg / 160 cm / 60 años / actividad ligera, objetivo déficit, avanzar al paso 2 y comprobar que kcal mostrado = P·4 + C·4 + F·9.
- Script de barrido sobre `calculateMacroTargets` que verifique la invariante en todo el dominio válido.

## REQ-78 - Dominio nutricional puro y contratos estrictos

**Estado: implementado.**

### Origen

Análisis de arquitectura nutricional del 28 jun 2026 (`ANALISIS_ARQUITECTURA_NUTRICION_FITIA_v2.md`). El diagnóstico central es que Fitbros ya tiene catálogo, recetas y macros calculables, pero la autoridad nutricional real sigue dispersa entre prompts, overrides de `day_log` y validaciones parciales dentro de `index.html`. Antes de mover planes a un solver o a `plan_versions`, hace falta una base pura y testeable equivalente a lo que ya existe en entrenamiento con `training-plan.js` y `workout-player.js`.

### Problema

Las reglas nutricionales críticas no viven en un módulo de dominio único:

- `calculateMacroTargets()` calcula metas pero la consistencia estricta se está abordando aparte en REQ-77.
- `validateGeneratedDay()` valida respuestas generadas desde el script principal y mezcla reglas de slots, restricciones, tolerancias y forma del JSON.
- El matcher por palabra ya existe para restricciones duras del coach (REQ-66), pero todavía quedan comparaciones free-text dispersas para alergias/gustos.
- Los macros de recetas se calculan en varios lugares por convención, no por un contrato central que todas las rutas deban usar.
- `domain-contracts.js#validateMacroTargets` todavía permite una diferencia amplia y no modela tolerancias por nivel: meta diaria, slot, plato, reemplazo.

Esto hace que cada mejora nutricional termine agregando lógica nueva al script principal en vez de fortalecer una frontera determinista compartida.

### Objetivo

Crear un módulo puro de dominio nutricional que sea la autoridad local para targets, recetas, restricciones, slots y tolerancias, sin cambiar todavía la experiencia visible ni la persistencia. El módulo debe poder ejecutarse en navegador y en Node, y quedar cubierto por validadores integrados al release gate.

### Dependencias

- Debe ejecutarse después o junto con REQ-77, porque el contrato de targets estrictos depende de metas internamente consistentes.
- Complementa REQ-72, pero este REQ es específico de nutrición y no persigue una modularización general de `index.html`.

### Alcance

1. Crear un módulo sin DOM ni dependencias runtime nuevas, por ejemplo `nutrition-domain.js`, cargable desde `index.html` y desde scripts Node.
2. Mover o duplicar de forma controlada funciones puras existentes, manteniendo compatibilidad global mientras el HTML inline siga dependiendo de funciones globales:
   - normalización de texto alimentario;
   - tokenización por palabra para restricciones;
   - cálculo de kcal derivadas por macros;
   - cálculo de macros de receta desde ingredientes y gramos;
   - validación de targets diarios;
   - validación de target por slot;
   - validación de plato/comida aplicable;
   - definición de slots renderizables para 2-6 comidas.
3. Definir tolerancias explícitas por nivel:
   - target de usuario: `|kcal - (p*4+c*4+f*9)| <= 10` tras REQ-77;
   - slot de comida: tolerancia flexible documentada;
   - día completo: tolerancia estricta por suma de comidas;
   - reemplazo: tolerancia dependiente de si se puede rebalancear el resto del día.
4. Reemplazar comparaciones `includes()` dispersas de alergias/gustos por el matcher común cuando sea seguro hacerlo.
5. Exponer el módulo como global solo si el script principal lo necesita, siguiendo el patrón de `DOMAIN_CONTRACTS`.
6. Agregar script de validación, por ejemplo `scripts/validate-nutrition-domain.mjs`, con casos de:
   - target consistente e inconsistente;
   - ingredientes con kcal declaradas que no igualan exactamente `4/4/9`;
   - restricción `pollo` que no bloquea `repollo`;
   - alergia free-text con tokenización;
   - slots válidos para 2, 4, 5 y 6 comidas.
7. Integrar el validador al `scripts/release-gate.mjs`.
8. Actualizar `CONTEXT.md` solo si se crea un archivo nuevo de dominio.

### Fuera de alcance

- No cambiar todavía cómo se genera un día o una semana.
- No mover el plan nutricional a `plan_versions`.
- No cambiar SQL ni catálogo.
- No reescribir la UI de Nutrición.

### Riesgos

- Duplicar lógica puede crear divergencia si no se reemplazan los puntos de uso principales.
- Endurecer validaciones como bloqueo en runtime podría romper flujos existentes; en este REQ las nuevas reglas deben empezar como contratos/test y warnings donde corresponda, salvo casos obvios de datos inválidos.
- Las kcal declaradas por ingrediente no siempre coinciden con `P*4+C*4+F*9`; el módulo debe tratar kcal como dimensión independiente, no asumir equivalencia perfecta.

### Criterios de aceptación

- Existe un módulo nutricional puro, importable en Node y cargable por la app sin build step.
- El módulo calcula macros de recetas desde ingredientes y gramos usando `ingredient.kcal` como fuente de kcal, no solo `4/4/9`.
- El matcher común evita falsos positivos como `pollo` vs `repollo` y cubre restricciones free-text donde aplica.
- Las tolerancias de target, slot, día y reemplazo están documentadas en código y cubiertas por tests.
- `node scripts/validate-nutrition-domain.mjs` pasa.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- `node scripts/validate-nutrition-domain.mjs`.
- `node scripts/release-gate.mjs`.
- Revisar manualmente que Home y Nutrición siguen cargando sin errores tras cargar el módulo nuevo.

---

## REQ-79 - Catálogo nutricional semántico, claves estables y cobertura de 2-6 comidas

**Estado: implementado.**

Implementación: migración idempotente `supabase/nutrition_catalog_semantics.sql` con `slug` estable para ingredientes/platos, `compatible_slots`, `diet_tags`, metadata operativa de platos (`prep_minutes`, `budget_tier`, `needs_kitchen`, `eat_out_ok`, `protein_density`) y límites de escalado por ingrediente (`scalable`, `min_g`, `max_g`, `step_g`). `schema.sql` refleja las columnas para instalaciones frescas. El cliente lee esos campos cuando existen y degrada al `slot` clásico cuando producción aún no aplicó la migración; reemplazos, coach, regeneración de comida y editor de dietas usan `compatible_slots`. El editor de platos preserva/edita metadata solo si Supabase devuelve esas columnas. `scripts/validate-nutrition-catalog.mjs` valida slugs únicos, vocabulario, cobertura de `desayuno`, `media_manana`, `almuerzo`, `merienda`, `snack`, `cena`, `recena`, y shape de la migración; queda integrado en `release-gate`. `service-worker.js` sube a `fitbud-pwa-v51` e incluye `js/nutrition-domain.js` en el shell.

Acción manual pendiente: aplicar `supabase/nutrition_catalog_semantics.sql` en Supabase. No se ejecutó ninguna migración de producción automáticamente.

### Origen

El análisis nutricional detectó que la UI soporta 2-6 comidas, pero el catálogo actual no cubre todos los slots renderizables: `media_manana`, `merienda` y `recena` no tienen platos propios. También se detectó un riesgo de identidad: `supabase/seed.sql` hace `truncate ... restart identity cascade`, por lo que los IDs numéricos no son suficientes como identidad histórica para planes nutricionales futuros.

### Problema

El catálogo está modelado como platos con un `slot` literal único y con IDs autoincrementales. Eso bloquea tres necesidades nuevas:

- Un mismo plato útil no puede declararse compatible con varios momentos del día sin duplicarlo.
- Las restricciones dietarias dependen demasiado de nombres/ingredientes en texto, aunque parte del matcher ya se endureció en REQ-66.
- Un snapshot histórico que guarde solo `dishId`/`ingredientId` puede perder auditabilidad si el catálogo se re-seedea y los IDs cambian.

### Objetivo

Convertir el catálogo nutricional en una base semántica para planificación determinista: platos con claves estables, slots compatibles múltiples, tags dietarios y metadata suficiente para filtrar y escalar porciones. La app debe poder cubrir todos los slots posibles para perfiles de 2-6 comidas sin depender de prompts.

### Dependencias

- Requiere REQ-78 para usar contratos comunes de slots/restricciones.
- Debe preceder a cualquier REQ que guarde `nutritionPlan` histórico en `plan_versions`.

### Alcance

1. Crear migración SQL idempotente, por ejemplo `supabase/nutrition_catalog_semantics.sql`, que agregue de forma compatible:
   - `ingredients.slug text`;
   - `dishes.slug text`;
   - `dishes.compatible_slots text[]`;
   - `dishes.diet_tags text[]`;
   - `dishes.prep_minutes integer`;
   - `dishes.budget_tier text`;
   - `dishes.needs_kitchen boolean`;
   - `dishes.eat_out_ok boolean`;
   - `dishes.protein_density text` o métrica derivable;
   - `dish_ingredients.scalable boolean`;
   - opcionalmente `dish_ingredients.min_g`, `max_g`, `step_g` para límites de porción por ingrediente.
2. Backfillar `slug` con claves estables derivadas de nombres actuales y documentar que futuras recetas deben mantener slug estable.
3. Backfillar `compatible_slots`:
   - si no hay metadata específica, iniciar con `[slot]`;
   - declarar explícitamente snacks, shakes y platos simples compatibles con `media_manana`, `merienda` y `recena` cuando nutricionalmente aplique.
4. Añadir metadata dietaria mínima en seed/migración:
   - `vegetariano`, `vegano` cuando aplique;
   - flags/tags para lácteos, huevo, carne/pescado o alérgenos comunes si el esquema elegido lo soporta.
5. Actualizar `dbLoad()` y el editor admin de alimentos/dietas para leer y conservar los campos nuevos sin romper instalaciones donde la migración aún no fue aplicada.
6. Actualizar validadores del catálogo:
   - todo plato tiene `slug` estable;
   - todo slot que la UI puede renderizar tiene al menos N candidatos compatibles después de aplicar restricciones básicas;
   - no hay `compatible_slots` fuera del vocabulario permitido;
   - los slugs son únicos;
   - no se rompe `supabase/validate.mjs`.
7. Documentar en `CONTEXT.md` la acción manual pendiente: aplicar la migración en Supabase; no ejecutar migraciones de producción automáticamente.

### Fuera de alcance

- No cambiar todavía `buildDay()` para leer un plan activo.
- No construir el solver de porciones.
- No re-seedear producción automáticamente.
- No eliminar el campo `dishes.slot`; debe quedar como compatibilidad o slot principal hasta completar la migración.

### Riesgos

- El seed reinicia IDs; cualquier cambio debe evitar que un plan futuro dependa solo de IDs numéricos.
- Si se agregan constraints demasiado estrictos antes de backfill, se puede romper una base existente.
- El editor admin puede perder campos nuevos si actualiza filas sin preservarlos.

### Criterios de aceptación

- La migración SQL es idempotente y no requiere ejecutar producción automáticamente.
- Todos los ingredientes y platos del seed tienen `slug` estable y único.
- Todos los slots renderizables por la app (`desayuno`, `media_manana`, `almuerzo`, `merienda`, `snack`, `cena`, `recena`) tienen candidatos compatibles en el catálogo.
- `dbLoad()` funciona tanto con la migración aplicada como sin ella.
- El editor admin no borra metadata semántica al editar platos existentes.
- `node supabase/validate.mjs` pasa.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- `node supabase/validate.mjs`.
- Script nuevo o extendido: `node scripts/validate-nutrition-catalog.mjs`.
- Probar en local un perfil de 6 comidas y confirmar que cada slot tiene candidatos compatibles sin depender de generación con coach.

---

## REQ-80 - Solver determinista de porciones para preparar un día nutricional

**Estado: pendiente.**

### Origen

Los bugs REQ-64, REQ-75 y REQ-76 muestran el mismo patrón: el sistema le pide al modelo que ajuste gramos y macros, luego intenta corregir con prompt engineering o con más platos. El análisis recomienda mover esa aritmética a un solver determinista que trabaje sobre ingredientes, gramos y metadata del catálogo.

### Problema

`deterministicDayPayload()` existe como fallback, pero usa constantes y divisiones aproximadas. No calcula porciones desde la composición real de cada receta ni puede explicar cuándo un plato no alcanza las metas dentro de límites palatables. En cambio, el camino principal de `generateOneDay()` sigue dependiendo de una respuesta textual con macros declarados.

### Objetivo

Crear un solver determinista que, dado un perfil, target diario, slots del día y catálogo compatible, produzca un día nutricional completo con platos, ingredientes en gramos y macros recalculados. Debe funcionar sin llamadas externas y convertirse en el fallback principal de "Preparar mi día".

### Dependencias

- Requiere REQ-77 para targets consistentes.
- Requiere REQ-78 para contratos de dominio nutricional.
- Requiere idealmente REQ-79 para `compatible_slots` y límites de escalado; si REQ-79 no está aplicado en producción, debe degradar usando `slot` y defaults seguros.

### Alcance

1. Implementar en el módulo nutricional puro funciones como:
   - `mealSlotTargets(dayTarget, prefs, workoutContext)`;
   - `compatibleDishesForSlot(slot, prefs, catalog)`;
   - `solveDishPortion(dish, mealTarget, options)`;
   - `planDeterministicNutritionDay(ctx)`.
2. El solver debe optimizar `kcal`, proteína, carbohidratos y grasa como dimensiones independientes:
   - no asumir que cuadrar P/C/F cuadra kcal;
   - recalcular kcal desde `ingredients.kcal`;
   - devolver residual y score por dimensión.
3. Definir límites:
   - gramos mínimos, máximos y step por ingrediente cuando existan;
   - defaults conservadores cuando no existan;
   - topes palatables para evitar porciones absurdas.
4. Manejar `no_solution` de forma explícita:
   - plato incompatible;
   - proteína insuficiente;
   - kcal fuera de tolerancia;
   - ingrediente sin macros;
   - slot sin candidatos.
5. Integrar el solver como fallback principal en:
   - `homePrepareDay()` cuando no hay coach disponible;
   - `prepareFirstCycleDay()` ante fallo del servicio;
   - `deterministicDayPayload()` o reemplazo equivalente.
6. Mantener la UI sin lenguaje técnico: si no hay solución perfecta, mostrar una opción viable y un mensaje neutral, no detalles del solver.
7. Agregar tests:
   - metas normales y altas de proteína;
   - perfil vegano/vegetariano/omnívoro;
   - 2, 4 y 6 comidas;
   - slot sin candidatos devuelve `no_solution` medible;
   - kcal se valida con `ingredients.kcal`.

### Fuera de alcance

- No guardar todavía el día en `plan_versions.snapshot.nutritionPlan`.
- No reemplazar por completo la generación semanal con coach.
- No crear recetas nuevas.
- No ejecutar migraciones de producción.

### Riesgos

- El catálogo puede no tener suficientes platos para metas extremas; eso debe producir una causa medible, no una tolerancia escondida.
- El solver puede elegir porciones matemáticamente correctas pero poco apetecibles; los límites de porción son parte crítica del alcance.
- Cambiar el fallback puede alterar expectativas de usuarios sin coach; debe verificarse en Home y Nutrición móvil.

### Criterios de aceptación

- "Preparar mi día" puede llenar un día válido sin llamar a `/api/claude`.
- El día generado contiene platos, ingredientes con gramos y macros calculados por el motor.
- Para metas altas de proteína, el solver combina opciones compatibles o devuelve una causa `no_solution` sin dejar el día vacío.
- Los totales del día quedan dentro de la tolerancia documentada.
- No se muestran palabras prohibidas por REQ-31.
- `node scripts/validate-nutrition-solver.mjs` pasa.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Servir local y desactivar disponibilidad del coach; usar "Preparar mi día" en Home.
- Probar perfiles de 2, 4 y 6 comidas.
- Revisar red: cero llamadas a `/api/claude` durante el fallback determinista.
- `node scripts/validate-nutrition-solver.mjs`.

---

## REQ-81 - Planner semanal nutricional determinista y lista de compras derivada

**Estado: pendiente.**

### Origen

Fitbros ya muestra borradores semanales y lista de compras cuando genera una semana, pero esa lista depende del resultado generado y no de un plan nutricional determinista estable. El análisis propone que la lista de compras sea una derivación del plan semanal estructurado, no un artefacto textual del coach.

### Problema

El usuario puede preparar una semana, pero la coherencia depende de respuestas externas y de overrides. Además, si luego se necesita operar sin coach o controlar costo, no existe un planner semanal determinista equivalente al generador de entrenamiento validado.

### Objetivo

Crear un planner semanal que use el solver diario para producir 7 días estructurados, controle repetición, respete restricciones y genere lista de compras agregada desde ingredientes y gramos aplicados.

### Dependencias

- Requiere REQ-80.
- Aprovecha REQ-79 para variedad por slots y metadata.

### Alcance

1. Implementar funciones puras:
   - `planNutritionWeek(ctx)`;
   - `scoreWeeklyVariety(days, prefs)`;
   - `buildShoppingListFromNutritionPlan(days)`.
2. Generar exactamente 7 días desde fecha de inicio seleccionada.
3. Controlar repetición:
   - evitar repetir plato igual en días consecutivos si hay alternativa compatible;
   - respetar `repeatPreference` cuando exista;
   - permitir repetición pragmática si el catálogo no ofrece alternativas.
4. Generar lista de compras por ingrediente:
   - agrupar por `ingredientSlug` o fallback estable;
   - sumar gramos;
   - conservar nombre visible y categoría;
   - redondear cantidades a unidades razonables cuando aplique.
5. Integrar como fallback o modo determinista en el flujo actual de "Preparar mi semana", manteniendo revisión antes de aplicar.
6. El borrador semanal debe mostrar:
   - resumen de kcal/proteína promedio;
   - advertencias de slots sin variedad;
   - lista de compras derivada;
   - botón para aplicar como hoy.
7. Agregar tests de semana:
   - suma diaria en tolerancia;
   - lista de compras coincide con ingredientes de los 7 días;
   - no duplica ingredientes por nombre distinto si comparten slug;
   - respeta restricciones duras.

### Fuera de alcance

- No mover todavía el plan semanal activo a `plan_versions`.
- No construir rebalanceo de reemplazos.
- No crear panel nuevo de inventario o despensa.

### Riesgos

- El catálogo puede ser insuficiente para variedad real en 5-6 comidas; debe avisarse como limitación de catálogo, no fallar silenciosamente.
- Si no existen slugs, la agregación de compras debe usar fallback seguro hasta REQ-79.

### Criterios de aceptación

- "Preparar mi semana" tiene una ruta determinista sin llamada externa cuando el coach no está disponible.
- El borrador semanal contiene 7 días con comidas estructuradas y lista de compras derivada de ingredientes reales.
- La lista de compras suma exactamente lo aplicado en los días del borrador, dentro de redondeos documentados.
- Restricciones duras se respetan en todos los días.
- `node scripts/validate-nutrition-week-planner.mjs` pasa.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Desactivar coach y preparar una semana.
- Probar perfil vegetariano, vegano y omnívoro.
- Comparar manualmente un ingrediente repetido en varios días contra su total en compras.
- `node scripts/validate-nutrition-week-planner.mjs`.

---

## REQ-82 - Plan nutricional activo versionado en `plan_versions`

**Estado: pendiente.**

### Origen

El análisis identificó la falla arquitectónica más importante: la prescripción nutricional vive como overrides de `day_log.state.meals`, mientras `day_log` debería representar ejecución. Fitbros ya tiene `plan_versions` para entrenamiento y snapshots de plan; nutrición debe usar el mismo patrón.

### Problema

Actualmente:

- `buildDay(ds)` puede construir slots vacíos.
- `applyDayComidas()` guarda comidas generadas como overrides en `day_log`.
- `day_log` mezcla prescripción, cambios y ejecución.
- Auditar qué plan vio el usuario en una fecha futura o pasada depende de reconstruir estado mutable y overrides.

Esto debilita historial inmutable, sync, reemplazos y compras.

### Objetivo

Guardar el plan nutricional prescrito como entidad de primera clase dentro de `plan_versions.snapshot.nutritionPlan`, con snapshots materializados y auditables. `day_log` debe quedar para registrar lo ejecutado, cambios aplicados, extras y estado offline, no como fuente principal de prescripción.

### Dependencias

- Requiere REQ-79 antes de guardar referencias estables.
- Requiere REQ-80 o REQ-81 para producir planes estructurados.
- Debe respetar REQ-13: versiones futuras no reescriben historial.

### Alcance

1. Definir schema de `nutritionPlan` dentro de `plan_versions.snapshot`:
   - `version`;
   - `catalogVersion` o fecha de catálogo si existe;
   - `days[]`;
   - `day.date`;
   - `day.target`;
   - `day.meals[]`;
   - `meal.id` estable dentro del plan;
   - `meal.slot`;
   - `meal.dishSlug`, `dishName` y opcional `dishId` operativo;
   - `meal.ingredients[]` con `ingredientSlug`, `name`, `grams`, macros por línea opcionales;
   - `meal.macros` calculados al activar;
   - `shoppingList`.
2. Guardar snapshots materializados: aunque el catálogo cambie después, el snapshot conserva nombre, gramos y macros usados en ese momento.
3. Adaptar `buildDay(ds)` para leer primero la prescripción de `nutritionPlan` activa para la fecha:
   - si existe, renderiza comidas desde snapshot;
   - si no existe, usa el fallback actual.
4. Adaptar `mealValue()` para resolver:
   - ejecución/override de `day_log` cuando exista;
   - prescripción de `nutritionPlan`;
   - catálogo DB/fallback solo como compatibilidad.
5. Adaptar `applyDayComidas()` y flujos de aplicar semana:
   - crear o actualizar borrador de `plan_versions` con `nutritionPlan`;
   - activar solo después de confirmación;
   - no escribir prescripción como override del día salvo compatibilidad temporal necesaria.
6. Mantener `day_log.state.meals` para:
   - `done`;
   - replacement aplicado;
   - edición manual real del día;
   - notas/contingencias;
   - estado de sync/conflicto.
7. Migración/backfill:
   - no intentar reconstruir todo el pasado;
   - para perfiles sin `nutritionPlan`, seguir usando compatibilidad hasta que preparen día/semana;
   - no borrar overrides existentes.
8. Agregar validador de snapshot:
   - every meal has slug/materialized name/macros;
   - day targets sum within tolerance;
   - shopping list matches days if present.

### Fuera de alcance

- No cambiar tablas SQL si `plan_versions.snapshot` JSONB es suficiente.
- No reescribir historial existente.
- No resolver reemplazos con rebalanceo; eso es REQ-83.

### Riesgos

- Mezclar snapshots nuevos con overrides antiguos puede duplicar comidas si no se define prioridad clara.
- Los service workers viejos pueden servir una versión de `index.html` incompatible; subir `CACHE_NAME` si se toca el shell PWA.
- El sync offline debe seguir considerando `day_log` como ejecución, no plan.

### Criterios de aceptación

- Un plan nutricional nuevo queda guardado en `plan_versions.snapshot.nutritionPlan`.
- `buildDay()` renderiza comidas prescritas desde `nutritionPlan` sin depender de overrides en `day_log`.
- Marcar una comida como hecha escribe ejecución en `day_log` sin modificar el snapshot prescrito.
- Cambiar un plan futuro no reescribe días ya ejecutados.
- Snapshots siguen auditables aunque cambie el catálogo, porque guardan slugs, nombres, gramos y macros materializados.
- `node scripts/validate-nutrition-plan-snapshot.mjs` pasa.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Preparar una semana, activar, recargar y confirmar que `plan_versions.snapshot.nutritionPlan` contiene días y compras.
- Marcar una comida, recargar y confirmar que el snapshot no cambia pero `day_log` sí.
- Cambiar catálogo localmente y confirmar que el día histórico sigue mostrando lo materializado en el snapshot.

---

## REQ-83 - Reemplazos equivalentes con rebalanceo de comidas futuras

**Estado: pendiente.**

### Origen

REQ-36 unificó acciones de comida y REQ-19 agregó contingencias, pero el reemplazo actual sigue siendo principalmente una lista de platos con delta de kcal. El análisis nutricional propone el comportamiento tipo Fitia: cambiar una comida sin romper el día ni reescribir lo ya ejecutado.

### Problema

Hoy cambiar una comida:

- muestra impacto, pero no siempre conserva coherencia de macros diarios;
- no rebalancea el resto del día;
- puede dejar déficit/exceso que el usuario debe resolver manualmente;
- no usa todavía un solver de porciones ni una prescripción nutricional activa.

### Objetivo

Convertir "Cambiar" en un reemplazo equivalente: elegir alternativas compatibles, ajustar porciones y, cuando sea necesario, rebalancear comidas futuras no registradas para conservar los objetivos diarios. El usuario debe ver el impacto antes de confirmar.

### Dependencias

- Requiere REQ-80 para solver.
- Requiere REQ-82 para distinguir prescripción de ejecución de forma robusta.

### Alcance

1. Implementar motor puro de reemplazo:
   - `rankReplacementCandidates(meal, candidates, target, prefs)`;
   - `solveReplacement(meal, candidate, dayPlan, dayLog)`;
   - `rebalanceFutureMeals(dayPlan, changedMeal, dayLog)`.
2. En el modal/hoja de "Cambiar":
   - listar candidatos por cercanía a kcal/proteína y restricciones;
   - mostrar delta de kcal, proteína, carbohidratos y grasa;
   - indicar si requiere rebalancear otra comida futura;
   - conservar motivo opcional y alcance.
3. Rebalancear solo comidas del mismo día que:
   - no estén marcadas como hechas;
   - no tengan edición manual explícita;
   - no pertenezcan a días completados.
4. Si no se puede rebalancear:
   - permitir aplicar con advertencia neutral si queda dentro de tolerancia aceptable;
   - o bloquear si rompe restricciones/targets de forma severa.
5. Guardar en `day_log.state.contingencyLog`:
   - comida original;
   - comida nueva;
   - gramos/macros;
   - comidas rebalanceadas;
   - motivo;
   - timestamp.
6. Mantener "Volver al plan":
   - revierte reemplazo y rebalanceos asociados cuando sea seguro;
   - nunca borra registros ejecutados.
7. Agregar tests:
   - reemplazo dentro de tolerancia sin rebalanceo;
   - reemplazo que rebalancea cena futura;
   - comida ya registrada no se toca;
   - día completado no se reescribe;
   - restricciones duras bloquean candidato.

### Fuera de alcance

- No resolver rebalanceo semanal completo; este REQ opera por día.
- No crear recetas nuevas.
- No cambiar el flujo de entrenamiento.

### Riesgos

- Rebalancear silenciosamente puede erosionar confianza; cada cambio debe mostrarse antes de confirmar.
- Revertir debe ser cuidadoso para no borrar acciones hechas después del reemplazo.
- Los conflictos offline pueden involucrar cambios rebalanceados; el log debe ser claro.

### Criterios de aceptación

- Cambiar una comida propone alternativas compatibles rankeadas por cercanía a la meta.
- Si el reemplazo desbalancea el día, el sistema propone ajustes en comidas futuras no registradas antes de aplicar.
- Ninguna comida ya marcada como hecha se modifica por rebalanceo.
- "Volver al plan" revierte el cambio sin borrar ejecución real.
- El resumen del día muestra la adaptación y cualquier rebalanceo aplicado.
- `node scripts/validate-nutrition-replacements.mjs` pasa.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Día con desayuno hecho y almuerzo pendiente: cambiar almuerzo y confirmar que desayuno no cambia.
- Día con comida futura disponible: aplicar reemplazo alto en kcal y confirmar rebalanceo propuesto.
- Forzar offline, aplicar cambio, reconectar y confirmar que sync mantiene log y estado.

---

## REQ-84 - Coach nutricional como generador auxiliar validado, no autoridad de macros

**Estado: pendiente.**

### Origen

El análisis concluye que los parches de prompt no deben seguir siendo la forma principal de corregir aritmética nutricional. La IA debe aportar variedad, explicación y traducción de preferencias, pero el sistema debe mapear ingredientes, calcular macros, ajustar porciones y validar antes de aplicar.

### Problema

`generateOneDay()` y flujos similares todavía dependen de respuestas que declaran macros y gramos. Aunque hay validaciones, el modelo sigue siendo la fuente inicial de un cálculo que debería ser determinista. Esto genera fallos recurrentes con metas altas, restricciones, porciones y catálogo incompleto.

### Objetivo

Reubicar al coach nutricional como capa auxiliar: propone recetas o alternativas, pero Fitbros solo aplica resultados que el motor nutricional pueda normalizar, recalcular y validar. La experiencia visible sigue siendo la misma: "tu coach" prepara opciones; internamente, el motor decide si son aplicables.

### Dependencias

- Requiere REQ-78 y REQ-80.
- Idealmente requiere REQ-79 para mapear recetas a slugs/metadata.
- Debe respetar REQ-31, REQ-32 y REQ-25.

### Alcance

1. Cambiar el contrato de generación nutricional:
   - el coach puede proponer nombre, slot, ingredientes y preparación;
   - macros declarados por la respuesta son informativos o ignorados;
   - el motor calcula macros reales desde ingredientes mapeados.
2. Implementar normalización de ingredientes:
   - match por `ingredientSlug` si existe;
   - match por nombre normalizado;
   - si el ingrediente no existe, marcar `needs_catalog_review` o usar sustituto aprobado;
   - no aplicar recetas con ingredientes desconocidos como plan activo.
3. Pasar toda propuesta por:
   - restricciones duras;
   - solver de porciones;
   - tolerancias del día/slot;
   - validación de ingredientes conocidos;
   - entitlement/cuota existente.
4. Mantener fallback determinista:
   - si el coach falla o propone algo inválido, usar solver determinista;
   - no dejar el día vacío.
5. Guardar resultados válidos en un pool privado solo si son recalculables y compatibles con el perfil actual.
6. Opcional en este REQ si el alcance alcanza: crear una cola/admin de "recetas candidatas" para que recetas nuevas se revisen antes de entrar al catálogo global.
7. Actualizar tests de `api/claude.js`/quota:
   - respuesta con macros falsos pero ingredientes conocidos se recalcula;
   - ingrediente desconocido no se aplica;
   - restricción dura bloquea;
   - quota agotada usa fallback sin llamada externa.

### Fuera de alcance

- No crear automáticamente recetas globales sin revisión.
- No ampliar catálogo masivo.
- No mostrar detalles técnicos al usuario.
- No consumir servicios pagados fuera de las llamadas ya controladas por cuota.

### Riesgos

- Mapear ingredientes por nombre puede producir falsos positivos; debe preferirse slug o selección de catálogo.
- Rechazar demasiadas propuestas puede reducir variedad; el fallback determinista debe cubrir la experiencia.
- Si se guarda pool privado, debe revalidarse ante cambios de perfil.

### Criterios de aceptación

- Ninguna comida generada por el coach se aplica usando macros declarados como autoridad.
- Las macros visibles salen del motor sobre ingredientes conocidos y gramos finales.
- Una propuesta con ingrediente desconocido queda bloqueada o marcada para revisión, sin aplicarse como plan activo.
- Al fallar una propuesta, el usuario recibe una opción determinista válida.
- Se mantiene el techo de cuota y el vocabulario invisible.
- `node scripts/test-coach-quota.mjs` pasa.
- `node scripts/validate-nutrition-coach-contract.mjs` pasa.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Mockear respuesta con macros inflados y confirmar que la app recalcula.
- Mockear ingrediente inexistente y confirmar bloqueo/fallback.
- Agotar cuota y confirmar que no hay llamada externa adicional.
- Recorrer "Preparar mi día" y "Preparar mi semana" como usuario normal, sin textos técnicos.

## REQ-101 - UX: Entreno sin CTAs duplicados — tarjeta instructiva solo como empty state

**Estado: implementado.**
`renderWorkout()`: `emptyWkHtml` ahora depende de `contentIssues.length`, no de ausencia de plan IA; se quitaron sus CTAs duplicados de "Iniciar sesión guiada"/"Preparar mi plan".

### Origen

Auditoría UI del 1 jul 2026 (hallazgo P1-7).

### Problema

En `renderWorkout()`, "Iniciar sesión guiada" aparece dos veces (tarjeta instructiva + tarjeta del workout) y "Preparar mi plan" otras dos. Cuatro botones para dos acciones; la tarjeta instructiva ocupa el primer lugar de forma permanente.

### Objetivo

Una sola tarjeta de sesión con una acción primaria clara; la explicación solo cuando no hay nada que ejecutar.

### Alcance

1. La tarjeta "Guía tu sesión de hoy" solo se muestra como empty state (sin plan/sesión disponible).
2. Con sesión disponible: una sola tarjeta con "Iniciar sesión guiada" primario y "Cambiar/Adaptar hoy" secundarios.
3. Conservar tal cual los chips de contingencia (Solo 20 min / En casa / Sin equipo / Me perdí la sesión).

### Fuera de alcance

- No tocar el reproductor (`workout-player.js`) ni la generación del plan de entrenamiento.

### Riesgos

- Estados intermedios (descanso, safety hold, ejecución en curso) deben conservar sus tarjetas actuales; revisar cada rama de `renderWorkout()`.

### Criterios de aceptación

- Cada acción aparece exactamente una vez en la vista.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Capturar Entreno en estados: sin plan, con sesión pendiente, día de descanso, safety hold, ejecución en curso.

## REQ-87 - Fix: "Preparar mi semana" sobrescribía días pasados y con datos registrados

**Estado: implementado.** `weekPendingDays` filtra días anteriores a hoy y días con comidas consumidas (`doneMeals > 0`) antes de iterar. El progreso ("día X de Y") refleja solo los días pendientes. 4 asserts en `scripts/validate-week-skip-past.mjs`.

### Problema

Al usar "Preparar mi semana" (ej. semana 3, inicio 27 de junio), el sistema generaba los 7 días de la semana sin importar que los días 27 y 28 ya hubieran pasado y tuvieran comidas registradas manualmente por el usuario. El sistema intentaba sobrescribirlos con comidas generadas por IA.

### Causa raíz (verificada contra código)

`aiGenerateWeek` (línea ~7212) obtiene los días con `weekDays(w)` que devuelve **todos** los días de la semana (start..end). El bucle `for(let i=0;i<days.length;i++)` iteraba sobre todos sin ningún filtro de:
- Fecha anterior a hoy
- Días con comidas ya consumidas por el usuario (`dayTotals(ds).doneMeals > 0`)

El mismo problema existía en el flujo determinista (`generateDeterministicWeek`) que recibía `days` sin filtrar.

### Solución

Nueva función `weekPendingDays(allDays)` que filtra:
1. Días con fecha anterior a `todayStr()` → se saltan
2. Días con `dayTotals(ds).doneMeals > 0` (comidas ya consumidas) → se saltan

`aiGenerateWeek` ahora:
- Llama `weekPendingDays(allDays)` para obtener solo días pendientes
- Muestra cuántos días se saltaron en el modal de progreso ("5 días a tu medida (2 días ya registrados)")
- El contador de progreso dice "día X de Y" donde Y = días pendientes, no los 7 totales
- Si todos los días están registrados, muestra toast informativo y no genera nada
- Pasa `days` filtrados a `generateDeterministicWeek`

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `index.html` | Función `weekPendingDays`, filtrado en `aiGenerateWeek`, progreso ajustado |
| `scripts/validate-week-skip-past.mjs` | Validador estructural (4 asserts) |
| `scripts/release-gate.mjs` | Agrega validador al gate |

### Invariantes que se mantienen

- "Preparar mi día" (flujo individual) no se ve afectado — el usuario puede regenerar el día de hoy explícitamente
- La estructura del draft (`window._genWeek`) no cambia, solo contiene menos días
- `applyWeekPlan` aplica solo los días que están en `daysData` (ya filtrados)

### Criterios de aceptación

- Si la semana tiene días pasados con comidas consumidas, "Preparar mi semana" solo genera los días pendientes (hoy en adelante, sin consumo).
- El progreso muestra "día X de Y" donde Y = días pendientes.
- Si todos los días de la semana ya pasaron/están registrados, muestra toast y no genera nada.
- `node scripts/validate-week-skip-past.mjs` pasa.
- `node scripts/release-gate.mjs` pasa.

## REQ-88 - Fix: contextKey de generación diaria no incluía la fecha, causando reuso cruzado entre días

**Estado: implementado.** `generateOneDay` ahora pasa `ds` como `scope` a `coachQuota`, y `COACH_PROMPT_VERSION` sube a 3 para invalidar entradas de pool anteriores. 5 asserts en `scripts/validate-day-scope-in-context.mjs`.

### Problema

Al generar una semana completa ("Preparar mi semana"), todos los días recibían el mismo resultado de la IA en vez de planes individualizados. Ejemplo concreto: miércoles y viernes ambos mostraban exactamente 1798 kcal con las mismas comidas — evidencia de que un resultado cached se reutilizaba para todos los días.

### Causa raíz (verificada contra código)

`generateOneDay` llamaba a `coachQuota` con solo 5 argumentos, sin pasar el 6to parámetro `scope`:

```js
const quota=coachQuota(
    coachRequest.action,
    coachRequest.requestId,
    coachRequest.partKey,
    fallback,
    dietQuotaValidation(ds)
    // ← falta ds como scope
);
```

En `coachQuota(action,requestId,partKey,fallbackText,validation,scope)`, cuando `scope` es `undefined`, se convierte en `scope||null` → `null`. El `contextKey` resultante (hash del JSON serializado del contexto) era **idéntico para todos los días** de la semana, porque la fecha no formaba parte del hash.

El sistema de reuso (`select_reusable_coach_part` en Supabase) buscaba por `context_key` y encontraba el resultado del primer día generado, sirviéndolo para todos los demás.

Comparación con `regenerateGenMeal` (que SÍ funcionaba bien):
```js
const quota=coachQuota("diet_day",requestId,"slot-"+slotId,fallback,validation,slotId+":"+draft.ds);
//                                                                               ↑ scope incluye fecha
```

### Solución

1. **`generateOneDay`**: Se agrega `ds` (la fecha del día, ej. `"2026-06-30"`) como 7mo argumento a `coachQuota`:
```js
const quota=coachQuota(
    coachRequest.action,
    coachRequest.requestId,
    coachRequest.partKey,
    fallback,
    dietQuotaValidation(ds),
    ds  // ← fecha como scope → contextKey único por día
);
```

2. **`COACH_PROMPT_VERSION`**: Bump de 2 → 3. Esto invalida todas las entradas existentes en `coach_option_pool` que se generaron sin scope en el contextKey. Sin este bump, las entradas viejas (con scope=null) seguirían matcheando si alguien no hubiera regenerado aún.

### Por qué este fix es definitivo

El contextKey ahora incluye:
- `version: COACH_PROMPT_VERSION` (3) — invalida resultados de prompts anteriores
- `scope: ds` (ej. "2026-06-30") — hace cada día único
- `nutrition.target` — metas del usuario
- `catalog` hash — catálogo de platos disponible
- `diet`, `mealCount`, etc. — preferencias

Un resultado solo se puede reutilizar si: (a) es del mismo usuario, (b) mismo día, (c) misma versión de prompt, (d) mismas metas, (e) mismo catálogo, (f) mismas preferencias. Cualquier cambio en cualquiera de estos factores genera un contextKey diferente y fuerza una nueva llamada a la IA.

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `index.html` | `generateOneDay` pasa `ds` como scope; `COACH_PROMPT_VERSION` = 3 |
| `scripts/validate-day-scope-in-context.mjs` | Validador estructural (5 asserts) |
| `scripts/release-gate.mjs` | Agrega validador al gate |

### Criterios de aceptación

- Cada día de "Preparar mi semana" genera un resultado diferente (contextKey único por fecha).
- `COACH_PROMPT_VERSION >= 3`.
- Entradas antiguas del pool (version 2, scope null) no se reutilizan.
- `node scripts/validate-day-scope-in-context.mjs` pasa.
- `node scripts/release-gate.mjs` pasa.

## REQ-89 - Feature: sugerir snack del catálogo para cerrar déficit de kcal/proteína en día generado

**Estado: implementado.** `findGapSnack` busca el mejor snack/shake del catálogo para completar el día. `genReviewHtml` muestra el botón de sugerencia. `addGapSnackToDay` agrega y re-valida. `applyGeneratedDay` separa extras. 6 asserts en `scripts/validate-gap-snack.mjs`.

### Problema

Cuando un día generado por IA no alcanzaba la meta de kcal o proteína (validación ±15% kcal, ≥85% proteína), el usuario solo podía descartar las 3-4 comidas completas y volver a generar. Esto era frustrante porque las comidas individuales podían estar bien — solo faltaba un poco para llegar a la meta.

### Solución

#### 1. `findGapSnack(totals, target)` (nueva función)

Busca en el catálogo (`DB.dishes`) el mejor snack/shake para cerrar el hueco:

- **Filtra candidatos**: solo platos con slots `snack`, `batido`, `media_manana`, `merienda`
- **Respeta restricciones**: excluye platos bloqueados por `coachDishBlockedByProfile` (alergias, dieta vegana, etc.)
- **Escala ingredientes**: ajusta gramos proporcionalmente (factor 0.5x–2.5x) para acercarse al hueco
  - Si el déficit es dominantemente de proteína (`protGap*4 > kcalGap`), escala por proteína
  - Si no, escala por kcal
- **Scoring**: selecciona el candidato que minimice la desviación de macros al agregarlo
- **Rechaza gaps irrazonables**: si faltan >700 kcal, no sugiere (el problema es estructural, no resoluble con un snack)
- **Rechaza gaps triviales**: si faltan <80 kcal y <8g proteína, no sugiere

Prioriza naturalmente los shakes de proteína (REQ-76) cuando el déficit es de proteína, porque tienen la mejor ratio proteína/kcal del catálogo.

#### 2. `genReviewHtml` (modificada)

Cuando `res.ok === false`:
- Detecta si los issues son **solo** de déficit (kcal bajo o proteína baja, no errores estructurales como alergias o nombres ficticios)
- Si `findGapSnack` encuentra un candidato, muestra un box con:
  - Nombre del snack, macros, y el total proyectado
  - Ingredientes con gramos
  - Botón "Agregar [nombre del snack]"

#### 3. `addGapSnackToDay()` (nueva función)

- Agrega el snack sugerido a `window._genDay.comidas` con `slot_id: "snack_extra"`
- Re-valida con `validateGeneratedDay` (el snack suma a los totales del día)
- Re-renderiza el review — si ahora pasa la validación, "Aplicar al día" se habilita

#### 4. `applyGeneratedDay()` (modificada)

- Separa comidas que mapean a slots existentes del día de las extras (`snack_extra`)
- Las comidas con slot existente se aplican vía `applyDayComidas` (overrides en meal slots)
- Las extras se agregan a `dayState(ds).extras` con `done:true` — `dayTotals` ya las cuenta

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `index.html` | `findGapSnack`, `addGapSnackToDay`, mod `genReviewHtml`, mod `applyGeneratedDay` |
| `scripts/validate-gap-snack.mjs` | Validador estructural (6 asserts) |
| `scripts/release-gate.mjs` | Agrega validador al gate |

### Criterios de aceptación

- Si un día generado falla solo por déficit de kcal/proteína y el gap es razonable (80–700 kcal), se muestra sugerencia de snack.
- El snack sugerido respeta restricciones del perfil (alergias, dieta).
- Al agregar el snack, se re-valida y si pasa, "Aplicar al día" se habilita.
- Al aplicar, el snack se guarda en `extras` (no sobreescribe un slot de comida).
- Si hay errores no-déficit (nombres ficticios, alergias), no se muestra sugerencia.
- Si el gap es >700 kcal, no se muestra sugerencia.
- `node scripts/validate-gap-snack.mjs` pasa.
- `node scripts/release-gate.mjs` pasa.

## REQ-90 - Feature: editar gramos/porciones de ingredientes en comidas generadas antes de aplicar

**Estado: implementado.** Inputs numéricos inline en cada ingrediente de `genReviewHtml` y `genWeekReviewHtml`. `updateGenMealGrams` y `updateGenWeekMealGrams` recalculan macros vía `recalcCoachMealMacros` y re-validan. 7 asserts en `scripts/validate-portion-editing.mjs`.

### Problema

Cuando un día generado no llegaba a la meta de kcal/proteína, la única opción era descartar todo y regenerar, o agregar un snack automático (REQ-89). El usuario quiere poder ajustar los gramajes de los ingredientes existentes (ej. subir arroz de 80g a 120g, o pechuga de 100g a 150g) para cerrar el déficit él mismo, manteniendo las comidas que ya le gustan.

### Investigación previa

1. **No existía edición de gramos por ingrediente** — `editorSheet` (editor genérico) solo permite editar macros totales planos (kcal/P/C/G), no ingredientes individuales. El modal de revisión (`genReviewHtml`) mostraba los ingredientes como texto estático.

2. **Patrón UI**: la app usa `<input type="number">` con `inputmode="numeric"` en todos los formularios (peso, edad, RPE, macros). No hay componente stepper. Los inputs se estilizan con las CSS vars del tema (`var(--surf3)`, `var(--border-2)`, `var(--txt)`).

3. **Fórmula de macros**: `DB.ingredients` almacena macros por 100g (`kcal`, `protein_g`, `carbs_g`, `fat_g`). La fórmula es `macro = macro_per_100g × gramos / 100`. `recalcCoachMealMacros` (nutrition-domain.js) ya implementa esto: resuelve ingredientes por nombre, aplica la fórmula, y devuelve macros recalculados.

4. **Dos flujos de revisión separados**: `genReviewHtml` sirve el día individual; `genWeekReviewHtml` sirve la semana. Ambos necesitan los inputs.

5. **Guardado**: `applyDayComidas` graba `c.ingredientes` tal cual viene del draft. Al editar gramos en el draft antes de aplicar, los valores editados se persisten correctamente.

### Solución

#### Inputs inline en ingredientes

En `genReviewHtml` y `genWeekReviewHtml`, cada ingrediente pasa de texto estático (`"Avena 50g"`) a un input editable:

```html
Avena <input type="number" min="5" step="5" value="50"
  onchange="updateGenMealGrams(cIdx, gIdx, +this.value)">g
```

Estilo compacto (52px ancho, font 13px) con las CSS vars del tema para integrarse con el diseño oscuro.

#### `updateGenMealGrams(mealIdx, ingIdx, grams)` — día individual

1. Actualiza `window._genDay.comidas[mealIdx].ingredientes[ingIdx].gramos`
2. Recalcula macros de la comida con `recalcCoachMealMacros` (match por nombre → fórmula per-100g × gramos)
3. Actualiza `comida.kcal`, `.proteina_g`, `.carbohidratos_g`, `.grasa_g`
4. Re-valida con `validateGeneratedDay` (que re-suma totales y checa ±15% kcal, ≥85% prot)
5. Re-renderiza `genReviewHtml` → los macros por comida, totales del día, issues y botón "Aplicar" se actualizan

#### `updateGenWeekMealGrams(dayIdx, mealIdx, ingIdx, grams)` — semana

Igual que el anterior pero opera sobre `window._genWeek.daysData[dayIdx]`. Además recalcula la lista de compras con `buildShoppingListFromNutritionPlan`.

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `index.html` | Inputs inline en `genReviewHtml` y `genWeekReviewHtml`; funciones `updateGenMealGrams` y `updateGenWeekMealGrams` |
| `scripts/validate-portion-editing.mjs` | Validador estructural (7 asserts) |
| `scripts/release-gate.mjs` | Agrega validador al gate |

### Criterios de aceptación

- Cada ingrediente en el modal de revisión muestra un input numérico editable para gramos.
- Al cambiar gramos, los macros de la comida se recalculan desde `DB.ingredients` (per-100g × gramos).
- Los totales del día se actualizan y la validación se re-ejecuta (±15% kcal, ≥85% prot).
- Si los totales editados pasan la validación, "Aplicar al día" se habilita.
- Funciona tanto en "Preparar mi día" como en "Preparar mi semana".
- Al aplicar, los gramos editados se guardan (no los originales).
- La lista de compras de la semana se actualiza al editar gramos.
- `node scripts/validate-portion-editing.mjs` pasa.
- `node scripts/release-gate.mjs` pasa.

## REQ-91 - Fix: snack sugerido (REQ-89) aparecía como ya consumido al aplicar el día

**Estado: implementado.** `applyGeneratedDay` pone `done:false` en extras generados. 3 asserts en `scripts/validate-gap-snack-pending.mjs`.

### Problema

Al aplicar un día generado que incluía un snack sugerido por REQ-89 para cerrar déficit, el snack aparecía con el checkbox marcado (✓ en morado) en la sección "Comidas extra", como si el usuario ya lo hubiera consumido. Las comidas regulares del plan (Desayuno, Almuerzo, Cena) aparecían correctamente sin marcar.

### Causa raíz

En `applyGeneratedDay`, los extras se creaban con `done:true` hardcodeado:

```js
st.extras.push({..., done:true, gen:true});
```

El flag `done:true` hace que `dayTotals` cuente sus macros como "ya consumidos" y que el checkbox aparezca marcado. Las comidas de slot (`applyDayComidas`) no tocan `done` — usan solo `ms.ovr`, dejando el flag en su estado inicial (`false`).

### Solución

Cambiar `done:true` → `done:false` en la línea de `applyGeneratedDay` que crea extras. El snack aparece como pendiente y el usuario lo marca cuando lo consume.

El flujo manual "Agregar comida/snack" (`saveEditor`, línea 6434) y "Sugerir comida" (`addSuggestion`, línea 7048) mantienen `done:true` intencionalmente — en esos flujos el usuario está registrando algo que ya comió o va a comer de inmediato.

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `index.html` | `applyGeneratedDay`: `done:true` → `done:false` en extras |
| `scripts/validate-gap-snack-pending.mjs` | Validador (3 asserts) |
| `scripts/release-gate.mjs` | Agrega validador al gate |

### Criterios de aceptación

- El snack sugerido aparece sin marcar (pendiente) al aplicar el día.
- El usuario lo marca manualmente cuando lo consume.
- Las comidas de slot siguen apareciendo sin marcar (no regresión).
- `dayTotals` no cuenta el snack como consumido hasta que el usuario lo marque.
- `node scripts/validate-gap-snack-pending.mjs` pasa.
- `node scripts/release-gate.mjs` pasa.

---

# Archivo historico agregado el 2026-07-03

## REQ-92 - Fix: sesión de entrenamiento generada mostraba solo Calentamiento + Vuelta a la calma sin bloques de ejercicios

**Estado: implementado.** Fixes en `deterministicTrainingWeekPayload` (causa raíz), `workout-player.js`, `training-plan.js` y `workoutPrescription`.

### Problema

Al iniciar una sesión de gimnasio generada (ej. "Gimnasio - Pull A"), la sesión mostraba solo 2 bloques: **Bloque 1 de 2 (Calentamiento)** y **Bloque 2 de 2 (Vuelta a la calma)**, sin ningún bloque de ejercicios reales entre ellos.

### Causa raíz

En `deterministicTrainingWeekPayload` (el fallback determinístico que se usa cuando la IA falla o genera datos inválidos), los ejercicios del template estático se filtran por `spec.allowedExerciseIds`:

```js
const exerciseIds = exerciseArray(workout.exerciseIds).filter(id => spec.allowedExerciseIds.includes(id));
```

Los ejercicios del template Pull A de gimnasio son `["lat-pulldown","seated-cable-row","face-pull","biceps-curl","hammer-curl"]`, todos requieren cable (machines) o mancuernas. Si el usuario no tiene `machines` ni `dumbbells` en su equipamiento seleccionado (ej: solo barra y dominadas), **ninguno pasa el filtro** → `exerciseIds = []` → el fallback genera una sesión con `exercises: []`.

Cuando el usuario inicia esa sesión, `WORKOUT_PLAYER.buildPrescription` detecta `generatedPrescription.exercises` como array vacío, entra al path "generado" (la condición original solo verificaba `Array.isArray` sin verificar longitud), y `generatedStrengthSteps` itera 0 veces → solo warmup + cooldown = **2 bloques**.

La misma condición de guarda (`!session.allowedExerciseIds.length`) no protege este caso porque `allowedExerciseIds` del usuario incluye otros ejercicios (back-squat, pull-up, etc.), así que la generación del plan procede, pero los ejercicios del template nunca coinciden.

### Solución (4 fixes)

**Fix 1 — Causa raíz (`index.html` `deterministicTrainingWeekPayload`):** Si el filtro de template produce < 2 ejercicios, suplementar con ejercicios de `spec.allowedExerciseIds` hasta 6:

```js
let exerciseIds = exerciseArray(workout?.exerciseIds).filter(id => allowedExerciseIds.includes(id));
if (strength && exerciseIds.length < 2) {
  const extra = allowedExerciseIds.filter(id => !exerciseIds.includes(id));
  exerciseIds = [...exerciseIds, ...extra].slice(0, 6);
}
```

**Fix 2 — Defensivo (`workout-player.js` `buildPrescription`):** No entrar al path generado cuando `exercises` está vacío; agregar `&& exercises.length > 0`:

```js
if (workout.generatedPrescription && Array.isArray(workout.generatedPrescription.exercises) && workout.generatedPrescription.exercises.length > 0)
```

**Fix 3 — Data (`training-plan.js` `workoutFromSession`):** Incluir `role: session.role` en el workout generado para que el fallback de sesión pueda buscarlo.

**Fix 4 — Fallback de sesión (`index.html` `workoutPrescription`):** Cuando el workout generado tiene `exerciseIds: []` (plan almacenado con bug), usar el template estático del rol como respaldo para que el usuario pueda iniciar la sesión sin regenerar el plan:

```js
if (workout.generated && !prescribedIds.length && workout.role) {
  const template = workoutById(ds, workout.role, planPrefsForDate(ds));
  if (template?.exerciseIds?.length) prescribedIds = exerciseArray(template.exerciseIds);
}
```

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `index.html` | `deterministicTrainingWeekPayload`: suplementar ejercicios cuando filtro < 2 |
| `index.html` | `workoutPrescription`: fallback a template estático cuando `exerciseIds` vacío |
| `workout-player.js` | `buildPrescription`: condición `exercises.length > 0` antes de path generado |
| `training-plan.js` | `workoutFromSession`: expone `role: session.role` en el workout |

### Criterios de aceptación

- Una sesión Pull A de gimnasio generada muestra calentamiento + ejercicios reales + vuelta a la calma (≥ 3 bloques).
- Para usuario con equipamiento limitado (sin machines/dumbbells), el fallback usa ejercicios alternativos de `allowedExerciseIds`.
- Para planes ya almacenados con `exercises: []`, la sesión usa el template estático del rol (el usuario ve ejercicios aunque no sean los generados por IA).
- No hay regresión en sesiones Pull A ya generadas correctamente con ejercicios.
- `node scripts/release-gate.mjs` pasa.

---

---

## REQ-94 - Fix: demostración de ejercicio aparecía como imagen estática con "Reducir Movimiento" activo

**Estado: implementado.** Dos cambios en `index.html`: (1) se eliminó `demo-frame-1` del bloque CSS `prefers-reduced-motion`, (2) se reemplazó el botón disabled "Movimiento reducido" por el botón habilitado "Reproducir/Pausar".

### Descripción del bug

En la pantalla de detalle de ejercicio (ej. Face Pull), la demostración aparecía como imagen estática sin movimiento en dispositivos con "Reducir Movimiento" activo (iOS: Configuración → Accesibilidad → Movimiento → Reducir Movimiento, o preferencia equivalente del sistema operativo que activa `prefers-reduced-motion: reduce` en el navegador).

### Contexto del sistema de demos

Los ejercicios de Supabase usan `media_type: "image_sequence"` con 2 fotogramas JPEG (posición inicio y posición final, provenientes de Free Exercise DB). La "animación" es CSS puro: `.demo-frame-1` alterna su `opacity` vía `@keyframes demoFrame` (`1.6s steps(1,end) infinite`), creando el efecto de flip entre los dos fotogramas.

### Causa raíz (dos fallos compuestos)

**Fallo 1 — CSS aplasta la animación con `!important`:**

```css
/* Antes — en @media(prefers-reduced-motion:reduce) */
.demo-frame.demo-frame-1 { animation: none !important; opacity: 0 !important; }
```

`opacity:0!important` ocultaba `demo-frame-1` permanentemente bajo `prefers-reduced-motion`. Como la regla `.exercise-card.paused .demo-frame-1 { animation-play-state: paused }` ya maneja el estado "pausado" (animación detenida en `opacity: 0` al inicio del ciclo), esta regla era redundante y además dañina al bloquear que el usuario pudiera ver frame-1 incluso si activa la animación.

**Fallo 2 — Botón de control deshabilitado:**

```js
// Antes
${reduced ? '<button class="btn btn-sm" disabled>Movimiento reducido</button>' : `...Reproducir/Pausar...`}
```

Con `reduced === true`, el botón de play/pause se reemplazaba por un botón deshabilitado, impidiendo que el usuario activara manualmente la animación.

### Fix (`index.html`)

**CSS** — eliminar `demo-frame-1` del bloque `prefers-reduced-motion`:

```css
/* Antes */
@media(prefers-reduced-motion:reduce){
    .demo-athlete,.demo-crank{animation:none!important}
    .demo-frame.demo-frame-1{animation:none!important;opacity:0!important}
}

/* Después (REQ-94) */
@media(prefers-reduced-motion:reduce){
    .demo-athlete,.demo-crank{animation:none!important}
}
```

**JS** — siempre mostrar el botón habilitado:

```js
// Antes
${reduced ? '<button class="btn btn-sm" disabled>Movimiento reducido</button>' : `<button ... >${pausedByDefault?"Reproducir":"Pausar"}</button>`}

// Después (REQ-94)
<button class="btn btn-sm" onclick="toggleExerciseMotion(this)" aria-pressed="${pausedByDefault}">${pausedByDefault?"Reproducir":"Pausar"}</button>
```

### Comportamiento resultante

- Con `prefers-reduced-motion: reduce` activo: la tarjeta arranca con clase `paused` → `demo-frame-1` tiene `animation-play-state: paused` → se ve solo frame-0 (posición inicial). El botón muestra **"Reproducir"** (habilitado).
- Al pulsar "Reproducir": se elimina clase `paused` → `demoFrame` corre → flip entre frame-0 y frame-1 cada 0.8s. El botón cambia a **"Pausar"**.
- Sin `prefers-reduced-motion`: comportamiento sin cambios (animación automática al cargar).
- Las SVGs animadas (`.demo-athlete`, `.demo-crank`) siguen bloqueadas bajo `prefers-reduced-motion` correctamente.

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `index.html` | CSS: eliminar `demo-frame-1` de `@media(prefers-reduced-motion:reduce)` |
| `index.html` | JS `exerciseCard`: siempre renderizar botón Reproducir/Pausar habilitado |

### Criterios de aceptación

- Con `prefers-reduced-motion: reduce` simulado, `exerciseCard` con `media_type: "image_sequence"` rinde HTML sin `disabled` y con texto "Reproducir".
- La tarjeta tiene clase `paused` al renderizarse → `demo-frame-1.animationPlayState === "paused"`.
- Al hacer click en "Reproducir", la clase `paused` se elimina → `demo-frame-1.animationPlayState === "running"`.
- El bloque CSS `@media(prefers-reduced-motion:reduce)` ya no contiene regla para `.demo-frame-1`.
- `node scripts/release-gate.mjs` pasa.

---

---

## REQ-93 - Fix: exerciseCatalog devolvía catálogo vacío cuando tabla exercises de Supabase está vacía

**Estado: implementado.** Fix en `exerciseCatalog` (`index.html`) para usar `LOCAL_EXERCISES` como fallback cuando `DB.exercises` está vacío, consistente con `activeTrainingCatalog`.

### Descripción del bug

Cuando la tabla `exercises` de Supabase existe pero está vacía (i.e. `exercises.sql` no se ejecutó o los seeds no se aplicaron), `dbLoad` almacenaba `DB.exercises = []` con `DB.exerciseReady = true`. Esto provocaba que `exerciseCatalog()` devolviera un array vacío, haciendo que `exerciseBySlug()` retornara `null` para todos los slugs.

### Causa raíz

`exerciseCatalog()` y `activeTrainingCatalog()` usaban condiciones de fallback inconsistentes:

```js
// exerciseCatalog — NO verificaba length: retornaba [] cuando DB.exercises=[]
const source = DB.exerciseReady ? DB.exercises : LOCAL_EXERCISES;

// activeTrainingCatalog — SÍ verificaba length: fallback correcto a LOCAL
const source = DB.loaded && Array.isArray(DB.exercises) && DB.exercises.length
  ? DB.exercises : LOCAL_EXERCISES;
```

Resultado: `allowedExerciseIds` se calculaba correctamente (vía `activeTrainingCatalog` con LOCAL), el plan se generaba, pero todos los `exerciseBySlug()` en `deterministicTrainingWeekPayload` y `workoutPrescription` retornaban `null` → `exercises = []` → 2 bloques solamente.

### Fix (`index.html` `exerciseCatalog`)

Alinear `exerciseCatalog` con la condición de fallback de `activeTrainingCatalog`:

```js
// Antes
const source = DB.exerciseReady ? DB.exercises : LOCAL_EXERCISES;

// Después (REQ-93)
const source = (DB.exerciseReady && Array.isArray(DB.exercises) && DB.exercises.length)
  ? DB.exercises : LOCAL_EXERCISES;
```

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `index.html` | `exerciseCatalog`: fallback a `LOCAL_EXERCISES` cuando `DB.exercises` está vacío |

### Criterios de aceptación

- Con Supabase configurado pero tabla `exercises` vacía, `exerciseBySlug("lat-pulldown", true)` retorna el ejercicio de `LOCAL_EXERCISES`.
- Con Supabase configurado y tabla `exercises` con datos, `exerciseBySlug` sigue usando los datos de Supabase (sin regresión).
- Combinado con REQ-92, una sesión Pull A de gimnasio muestra ejercicios reales independientemente del estado de la tabla `exercises` en Supabase.
- `node scripts/release-gate.mjs` pasa.

---

---

## REQ-95 - Nav bar del footer no ancla al fondo en iOS

**Estado: implementado.**

### Problema

En iOS, la barra de navegación inferior (`.tabs` con `position:fixed;bottom:0`) no se anclaba al fondo de la pantalla. En la vista principal aparecía en medio del contenido con la sección del coach visible debajo de ella. Causa probable: quirk de iOS Safari con `position:fixed` cuando el contenido desborda la altura del viewport.

### Solución

Cambio de arquitectura: de `position:fixed` para el nav bar a un layout flexbox en `body`.

- `html/body`: `height:100dvh; display:flex; flex-direction:column; overflow:hidden`
- `#app`: `flex:1; min-height:0; overflow-y:auto` (el contenido scrollea dentro del `#app`, no en el `window`)
- `.tabs`: `flex-shrink:0` (queda anclado al fondo de body como hijo flex natural, sin `position:fixed`)
- `padding-bottom` de `#app`: de `calc(88px + safe-bottom)` a `calc(20px + safe-bottom)` (ya no es necesario reservar espacio para el nav flotante)

Se agregaron helpers `scrollAppTop()` y `scrollAppBottom()` para reemplazar los 14 llamados a `window.scrollTo()` que ya no funcionan cuando el scroll container es `#app` en vez de `window`.

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `index.html` | Layout flexbox en body/app/tabs + helpers scroll + sustitución de window.scrollTo |

### Criterios de aceptación

- La barra de navegación (Hoy/Nutrición/Entreno/Progreso/Perfil) siempre queda en el borde inferior de la pantalla.
- El contenido de la vista Hoy (incluyendo la sección del coach) scrollea por encima del nav bar.
- Las hojas modales (`.overlay`, `.sheet`), toasts y otros elementos `position:fixed` siguen funcionando correctamente.
- `node scripts/release-gate.mjs` pasa.

---

## REQ-96 - Crear suite E2E Playwright de journeys críticos e integrarla al release-gate

**Estado: implementado.**

### Solución (2026-07-02)

Suite en `tests/e2e/` con `@playwright/test` (devDependency) + Chromium headless, corriendo la app real servida por `python3 -m http.server 8923` con **toda la red interceptada** (`tests/e2e/helpers.js`): Supabase (PostgREST stateful: lo upserteado se devuelve en GETs), `/api/*`, CDN de supabase-js vendorizado (`tests/e2e/vendor/`) y fuentes. El "coach" (`/api/claude`) se mockea leyendo metas y slots del propio prompt y construyendo comidas del catálogo fixture que cumplen las metas — 0 llamadas pagadas, 100 % offline y determinista.

5 specs / 7 tests: `onboarding.spec.js` (onboarding completo, Mifflin-St Jeor verificado aparte, macros mostrados = guardados en el upsert de profiles), `nutricion.spec.js` (objetivos del día + preparar mi día + aplicar), `entreno.spec.js` (sesión guiada completa, adaptativa al nº de bloques, regresión REQ-92), `progreso.spec.js` (peso mostrado = guardado = sincronizado a weight_log), `navegacion.spec.js` (5 tabs + landing sin sesión + REQ-31, consola limpia en todos). Helpers exportados (`installMocks`, `seedLoggedInUser`, `completePrefs`) reutilizables por el loop auditor. Integrada a `release-gate.mjs` como check bloqueante con timeout de 5 min. Verificado: romper `completeWorkoutStep` hace fallar la suite.

Comandos: `npm run test:e2e` o `npx playwright test`. Primera vez: `npm install && npx playwright install chromium`.

### Origen

Decisión de producto (2026-07-01): el loop auditor ahora hace verificación funcional obligatoria en navegador por corrida, pero los commits diarios del desarrollador solo pasan por `release-gate.mjs` (sintaxis, validadores, SQL, seguridad) — nadie verifica automáticamente que un fix funcione *en pantalla* antes del push. Se necesita una capa de regresión E2E determinista.

### Problema

Un fix puede pasar el release-gate en verde y aun así romper un journey completo en la UI (ejemplos recientes: REQ-92 sesión Pull A solo mostraba calentamiento, REQ-95 nav bar desanclada en iOS). No existe ninguna prueba automatizada que abra la app en un navegador y recorra los flujos críticos.

### Causa raíz

No aplica un bug puntual: es una brecha de infraestructura de QA. El release-gate (`scripts/release-gate.mjs`) no incluye ningún check que ejecute la app renderizada.

### Objetivo

Que ningún commit pueda publicarse si rompe uno de los journeys críticos: la suite E2E recorre la app como usuario real y falla el gate si un flujo se rompe.

### Alcance

1. Añadir Playwright como dependencia de desarrollo (`@playwright/test`, navegador chromium) — patrón aprobado explícitamente para este REQ pese al invariante "sin dependencias nuevas"; es tooling de test, no dependencia runtime de la app.
2. Crear `tests/e2e/` con specs para los journeys críticos: (a) onboarding/perfil y cálculo de macros mostrado, (b) ver objetivos del día en Nutrición y aplicar una comida, (c) iniciar y completar una sesión de entreno con el reproductor, (d) registrar peso en Progreso, (e) navegación entre tabs y estados vacíos sin errores de consola.
3. Fixtures/mocks deterministas para toda llamada a IA y a Supabase (interceptar red con `page.route`); las pruebas corren 100% offline y sin llamadas pagadas.
4. Helpers reutilizables (login/seed de estado local) exportados para que el loop auditor los reuse en su verificación funcional.
5. Integrar la suite al `release-gate.mjs` como check bloqueante, con timeout razonable.

### Fuera de alcance

- No cambiar comportamiento de la app para hacerla "testeable" (si algo no se puede testear sin tocar la app, documentarlo como REQ aparte).
- No testear Stripe real ni Supabase real.
- No cubrir los 12 journeys en esta primera iteración: solo los 5 críticos listados.

### Riesgos

- Flakiness de E2E puede bloquear el loop desarrollador; mitigar con mocks deterministas, `retries: 1` y timeouts generosos.
- El tamaño de `index.html` (~600 KB) puede hacer lentos los arranques; servir con el mismo `http.server` local.
- Instalación de chromium requiere red la primera vez (`npx playwright install chromium`).

### Criterios de aceptación

- `npx playwright test` corre en local, offline, y pasa en verde sobre `HEAD`.
- Romper deliberadamente un journey (p. ej. comentar el render del reproductor) hace fallar la suite.
- Las pruebas no hacen ninguna llamada de red externa (IA, Supabase, Stripe) — todo interceptado.
- `node scripts/release-gate.mjs` ejecuta la suite y queda en verde.

### Verificación sugerida

- `npx playwright test --reporter=list` y revisar que los 5 journeys pasan.
- `node scripts/release-gate.mjs` incluye y pasa el check E2E.

---

## REQ-97 - UX: reordenar Home — la agenda primero, hero compacto, un banner a la vez

**Estado: implementado.**
`renderHoy()` en `index.html` ahora ordena header → agenda → hero → banners → coach. `heroDash(ds,opts)` acepta `opts.compact` (solo Home lo usa) y colapsa a una línea ("kcal/meta kcal · comidas/total") mientras `doneMeals===0`; Nutrición sigue usando la versión completa sin pasar `opts`. Los banners de check-in y "Afina tu plan" comparten cola de prioridad (checkin > afinar plan, máximo uno); "Afina tu plan" es ahora un chip discreto (`.coach-chip`) en vez de un alert de ancho completo. `planEnded`/`planNotStarted`/`trainingSafetyHold` quedan fuera de esa cola por ser estados críticos/bloqueantes, no promocionales.

### Origen

Auditoría UI del 1 jul 2026 (`estrategia/08-Analisis-UI-Exhaustivo-2026-07-01.md`, hallazgo P0-3).

### Problema

En `renderHoy()` el orden actual es: header → alert "Afina tu plan" → banner check-in → `heroDash` (~230 px) → agenda → coach. Para un usuario nuevo, "lo que te toca ahora" (el núcleo de la propuesta de valor) queda al borde o debajo del fold en móvil, detrás de dos avisos y un dashboard en cero.

### Objetivo

Que la próxima acción del día sea lo primero que ve el usuario al abrir la app, en cualquier estado de su cuenta.

### Alcance

1. Reordenar `renderHoy()`: header → agenda (próxima acción) → hero → banners → coach.
2. Hero en modo compacto (una línea: "0/1900 kcal · 0/4 comidas") mientras el día no tenga registros; versión completa cuando hay actividad.
3. Cola de prioridad de banners: mostrar máximo uno a la vez (check-in > afinar plan); "Afina tu plan" como chip discreto, no como primer elemento.

### Fuera de alcance

- No tocar la lógica de `homeAgendaData` ni el contenido de la agenda.
- No rediseñar el chat del coach en Home.

### Riesgos

- El tour contextual ancla su primer coachmark a la agenda; verificar que los selectores (`data-tab`, contenedores) sigan válidos tras el reorden.
- `heroDash` se reusa en Nutrición: el modo compacto debe ser opt-in para no alterar esa vista (o coordinarse con REQ-100).

### Criterios de aceptación

- Con viewport móvil (390×844), la tarjeta de agenda es visible completa en el primer viewport para un usuario nuevo.
- Nunca se muestran dos banners apilados en Home.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Servir local, simular usuario nuevo (sin día preparado) y usuario con actividad; capturar Home en 390×844 y verificar orden y fold.
- Forzar check-in pendiente + perfil sin afinar a la vez y verificar que solo se muestra un banner.

---

## REQ-98 - Fix UX: banner de check-in con fechas rotas, duplicado y sin tono de arranque

**Estado: implementado.**
`weeklyCheckinRangeLabel(startDs,endDs)` (nuevo, en `index.html`) reemplaza `prettyDate(...).split(",")[0]` (que descartaba la fecha y dejaba solo el nombre del día) por un rango compacto real ("13–19 jun" o "29 jun – 5 jul" si cruza de mes); se usa en `weeklyCheckinBanner()`, la nueva `weeklyCheckinChip()` y en `weeklyCheckinHistory()`, que tenía el mismo bug. `weeklyCheckinDue()` ahora calcula `active` con `weekDays(dueWeek).some(dayActive)`; `weeklyCheckinBanner()` usa ese flag para cambiar el copy a un tono no punitivo cuando la semana no tuvo actividad registrada ("No registraste actividad esa semana. Aun así puedes ajustar tu plan para la que sigue."), sin omitir el check-in automáticamente (se deja el botón "Omitir esta semana" como acción explícita del usuario, evitando tocar el conteo de check-ins de ciclos). `renderProgress()` ya no llama `weeklyCheckinBanner()` completo — usa `weeklyCheckinChip()`, un botón discreto estilo `.coach-chip` que abre `openWeeklyCheckin()` directamente, eliminando el banner duplicado entre Hoy y Progreso.

### Origen

Auditoría UI del 1 jul 2026 (hallazgo P1-4). Bug de copy verificado en producción.

### Problema

En `weeklyCheckinBanner()`, `prettyDate(due.start).split(",")[0]` produce "Martes – Lunes" (solo nombres de día, sin fechas). El banner aparece en Hoy y en Progreso a la vez, y se muestra aunque la semana a revisar no tenga ningún dato registrado ("Revisa cómo fue tu semana" sin nada que revisar).

### Objetivo

Que el check-in comunique fechas concretas, aparezca una sola vez y no exija revisar semanas vacías.

### Alcance

1. Copy con fechas reales: "Semana 1 · 23–29 jun".
2. Banner completo solo en Hoy; en Progreso, acceso discreto (link/chip).
3. Si la semana a revisar no tiene actividad registrada (`dayActive` en 0 días), cambiar el tono a arranque no punitivo u omitir automáticamente sin registro de "skip" culposo.

### Fuera de alcance

- No cambiar el flujo interno de `openWeeklyCheckin` ni sus ajustes propuestos.
- No cambiar la lógica de `weeklyCheckinDue` salvo el caso "semana sin actividad".

### Riesgos

- `skipWeeklyCheckin` persiste claves por semana; la omisión automática no debe romper el conteo de check-ins de ciclos.

### Criterios de aceptación

- El banner muestra fechas concretas, no solo nombres de día.
- No aparece duplicado en dos vistas a la vez.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Simular plan iniciado hace 8+ días sin actividad y verificar tono/omisión; con actividad, verificar fechas correctas en el banner.

---

## REQ-99 - UX: Perfil por secciones reales con guardado por sección y labels accesibles

**Estado: implementado (dividido en REQ-105, REQ-106, REQ-107, REQ-108).**
Marcado como el REQ más grande del backlog (~4.850 px, 91 elementos interactivos, guardado global + 2 guardados locales inconsistentes). Siguiendo el protocolo de la fase de product manager (dividir en vez de implementar a medias), se partió en cuatro requerimientos atómicos, cada uno completable en una ejecución: REQ-105 (acordeón real), REQ-106 (aria-label), REQ-107 (reagrupar Suscripción/Recordatorios/Avisos bajo Cuenta) y REQ-108 (guardado por sección, el de mayor riesgo, al final y dependiente de REQ-105). No se tocó código de `index.html` en este commit.

### Origen

Auditoría UI del 1 jul 2026 (hallazgo P1-5); retoma los pendientes #6/#7 del plan del 24 jun.

### Problema

`renderProfile()` renderiza una sola página de ~4.850 px con 8 secciones, 91 elementos interactivos y 64 inputs sin label programático. Los chips de navegación solo hacen `scrollIntoView` y el guardado es un botón global al fondo más dos guardados locales inconsistentes — riesgo de perder cambios y parálisis de decisión.

### Objetivo

Que Perfil deje de abrumar: el usuario encuentra la sección que busca, guarda con confianza y ningún cambio se pierde en silencio.

### Alcance

1. Convertir los chips (Objetivo · Comidas · Entreno · Privacidad · Cuenta) en subvistas reales o acordeones colapsados por defecto (solo la sección activa abierta).
2. Guardado sticky por sección, visible solo cuando hay cambios pendientes; cuidado con `saveProfilePrefs` y esquemas versionados.
3. Agrupar Suscripción/Recordatorios/Avisos del dispositivo bajo Cuenta.
4. `aria-label` en todos los inputs al migrar.

### Fuera de alcance

- No cambiar el esquema de `profiles.prefs` ni `profileSchemaVersion`.
- No tocar los flujos de privacidad/consentimientos más allá de su ubicación visual.

### Riesgos

- El guardado por sección cambia el modelo actual "todo al final": riesgo de guardados parciales inconsistentes; definir qué campos viajan juntos.
- Los flujos de push/recordatorios tienen guardados propios; unificar sin romper sus validaciones.

### Criterios de aceptación

- Ninguna sección de Perfil supera ~1.500 px de alto renderizado.
- Cambiar un campo y salir de la sección sin guardar muestra aviso o autoguarda; no se pierden cambios en silencio.
- 0 inputs visibles sin label programático en Perfil.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Medir `#app.scrollHeight` por sección; editar un campo, navegar a otra sección y verificar el aviso/autoguardado; auditar labels con querySelector.

---

## REQ-100 - UX: Nutrición sin duplicación — un CTA contextual y hero compacto

**Estado: implementado.**
`renderNutrition()` en `index.html` ahora muestra un solo CTA prominente: la tarjeta "Prepara tus comidas de hoy" (llama `homePrepareDay(ds)`, ruta determinista sin paywall) cuando el día no está preparado; cuando ya está preparado, no hay CTA prominente. Las 3-4 acciones sueltas ("Preparar otra semana"/"Preparar semana", "Ver otra opción de comida", "Revisar mis macros", y "Volver a preparar este día" cuando ya hay plan) se movieron a un menú "Más opciones" (`openNutritionMoreMenu()`) abierto vía `modal()`, con iconos del set existente (`miniIcon()`, nuevo, reutiliza `TAB_ICONS`; se agregaron `more` y `refresh`) en vez de emojis. El hero de macros usa `heroDash(ds,{compact:"always"})` — se extendió `heroDash(ds,opts)` (REQ-97) para aceptar `opts.compact==="always"` y así no repetir nunca el bloque completo que Home puede mostrar. Fix de bug encontrado en el camino: el botón "Preparar este día" de Nutrición llamaba `aiGenerateDay()` directo, lo que mostraba el paywall a usuarios sin entitlement; ahora la regeneración pasa por `homePrepareDay()` como en Home, respetando la ruta determinista del 1 jul.

### Origen

Auditoría UI del 1 jul 2026 (hallazgo P1-6).

### Problema

`renderNutrition()` repite el `heroDash` completo de Home y ofrece 4 acciones sin jerarquía ("Preparar otra semana", "Preparar este día", "Ver otra opción de comida", "Revisar mis macros") con solapamiento semántico y emojis en botones.

### Objetivo

Que en Nutrición siempre quede claro cuál es LA acción siguiente, sin repetir información que Home ya muestra.

### Alcance

1. Un CTA primario contextual: día sin preparar → "Preparar este día"; día preparado → sin CTA prominente.
2. Acciones restantes a menú "···" o dentro de cada comida.
3. Hero de macros en versión compacta (no repetir el bloque completo de Home).
4. Iconos del set existente en lugar de emojis en botones.

### Fuera de alcance

- No cambiar la lógica de generación (día/semana) ni los flujos de "Cambiar" comida.

### Riesgos

- Los CTAs actuales gatean por entitlement (coach); el CTA contextual debe respetar la ruta determinista sin paywall implementada el 1 jul.

### Criterios de aceptación

- Máximo un CTA primario visible en la parte superior de Nutrición.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Capturar Nutrición con día vacío y con día preparado; verificar jerarquía y ausencia del hero duplicado completo.

---

## REQ-102 - UX: Progreso con estado cero guiado y tabla de peso en tarjetas mobile

**Estado: implementado.**
`progressIsEmpty()` detecta usuario sin peso, sin entrenos y sin racha. En ese estado, `renderProgress()` muestra primero la tarjeta "Registra tu peso de la semana" (con copy sobre qué se desbloquea) y arranca "Tus números" y "Rachas e hitos" colapsadas (`section()` acepta ahora un default de colapso vía `isCollapsed(key,def)`). `progressStats()` usa labels autoexplicativos ("Peso actual (kg)", "Entrenos completados", "Racha (días)", "Adherencia a comidas"); la primera tarjeta muestra el peso actual en vez de un delta críptico. `weightChart()` ya no duplica el mensaje de peso vacío. La tabla de peso a tarjetas full-width en mobile con inputs de 44px ya estaba resuelta por REQ-56.

### Origen

Auditoría UI del 1 jul 2026 (hallazgo P1-8); retoma el pendiente #8 del plan del 24 jun.

### Problema

Un usuario nuevo abre Progreso y ve 4 stat-cards en cero con labels crípticos ("completos", "kg"), rachas en cero y una tabla de peso con inputs pequeños. Los ceros en la fuente display parecen píldoras, no números. Hay un box redundante que repite lo que ya dice la tarjeta "Registra tu peso de la semana".

### Objetivo

Que Progreso sin datos invite a la primera acción en lugar de mostrar estadísticas vacías, y que registrar peso sea cómodo en móvil.

### Alcance

1. Con cero datos: colapsar stats/rachas y abrir con la tarjeta de registro de peso + qué se desbloquea al registrar.
2. Labels autoexplicativos: "Peso actual", "Entrenos completados", "Racha", "Adherencia a comidas".
3. `weightRows()`: tabla → tarjetas por semana full-width en mobile con inputs grandes o stepper (los aria-labels ya existen).
4. Eliminar el box redundante "Ingresa tu peso semanal para ver el gráfico".

### Fuera de alcance

- No cambiar el modelo de datos de `weight_log` ni la lógica de rangos (`buildWeightRanges`).

### Riesgos

- `scrollToWeightInput()` asume la tabla `.wt input`; actualizar el selector al migrar a tarjetas.

### Criterios de aceptación

- Usuario sin datos ve primero una acción clara, no estadísticas en cero.
- Inputs de peso con hit area ≥44 px en táctil.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Capturar Progreso sin datos y con 2 semanas de datos, en viewport móvil; probar registro de peso con teclado numérico.

---

## REQ-103 - UX: onboarding sin jerga — macros como resumen y lugar de entrenamiento único por defecto

**Estado: implementado.**
Paso 2: macros bajo `<details>` "Ajustar valores"; arriba, resumen "Tu referencia: N kcal · N g proteína" y botón "¿Cómo lo calculamos?" con modal (antes texto fijo "Fórmula: ..."). Paso 3: checkboxes de día + un único select "Lugar de entrenamiento" aplicado a todos; personalización por día colapsada. `readOnboardingStep()` sigue completando `d.trainingLocations` por día, sin pérdida de datos. Perfil (prefix "pf") no cambió.

### Origen

Auditoría UI del 1 jul 2026 (hallazgo P1-9).

### Problema

El paso 2 del onboarding expone 4 inputs crudos de macros más el texto "Fórmula: Katch-McArdle" (jerga técnica, contra el tono coach del principio 9). El paso 3 pide checkbox por día y lugar por día (7 selects): configuración avanzada a destiempo.

### Objetivo

Bajar el tiempo-a-plan del onboarding sin perder ningún dato esencial: el principiante no debería decidir macros ni logística por día para empezar.

### Alcance

1. Paso 2: resultado como resumen amable ("Tu referencia: 2.262 kcal · 137 g proteína") con "Ajustar valores" colapsado; la fórmula a un tooltip "¿cómo lo calculamos?".
2. Paso 3: días + un solo lugar por defecto; "personalizar por día" colapsado.
3. No perder ningún dato del esquema de prefs; solo cambia la presentación.

### Fuera de alcance

- No cambiar `calculateMacroTargets` ni las fórmulas.
- No cambiar el número de pasos del onboarding.

### Riesgos

- `hasCompleteOnboarding()` y `migrateProfilePrefs()` esperan campos concretos; el colapsado no debe impedir setearlos con defaults válidos.

### Criterios de aceptación

- El onboarding no muestra nombres de fórmulas ni inputs de macros abiertos por defecto.
- `hasCompleteOnboarding()` sigue cumpliéndose con el flujo nuevo.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Completar onboarding sin abrir ningún colapsable y verificar perfil válido con plan preparable; abrir "Ajustar valores" y verificar edición de macros.

---

## REQ-104 - Copy y paywall coherentes: sin "cancela cuando quieras", paywall degradado sin checkout activo

**Estado: implementado.**
Señal de checkout activo agregada a `/api/config` (`checkout.enabled`); `showPaywall` la usa para ocultar los botones de compra y mostrar "Disponible pronto" + canje de código cuando `STRIPE_SECRET_KEY` no está configurada.

### Origen

Auditoría UI del 1 jul 2026 (hallazgos P2-10 y cadena P0-1 con REQ-26).

### Problema

(a) "Cancela cuando quieras" aparece 3 veces pero los planes son pago único sin renovación — no hay nada que cancelar. (b) Mientras el checkout de Stripe no esté activo (REQ-26), el paywall muestra botones de compra que terminan en error 503. (c) Empty state de Home con copy pasivo y largo.

### Objetivo

Que ninguna promesa visible contradiga el modelo de cobro real y que ningún botón lleve a un error por configuración faltante.

### Alcance

1. Reemplazar "Cancela cuando quieras" por "Sin renovación automática — pagas solo el período".
2. `showPaywall`: si el checkout no está configurado, no mostrar botones de compra; mostrar mensaje "disponible pronto" + mantener la alternativa determinista.
3. Empty state de Home: "Tu coach arma comidas y entreno para hoy en segundos."

### Fuera de alcance

- No activar el checkout de Stripe (eso es REQ-26).
- No cambiar precios ni estructura de planes.

### Riesgos

- Detectar "checkout no configurado" desde el cliente requiere una señal del servidor (p. ej. respuesta de `/api/checkout` o flag en config); no exponer detalles técnicos al usuario (principio 9).

### Criterios de aceptación

- Ningún botón visible lleva a un endpoint que responde 503 por configuración faltante.
- El copy de planes no promete cancelación de una renovación que no existe.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Sin `STRIPE_SECRET_KEY` en entorno local, abrir el paywall y verificar el estado degradado; grep de "Cancela cuando quieras" devuelve 0.

---

## REQ-105 - UX: Perfil en acordeón real (una sección a la vez)

**Estado: implementado.**
Perfil ya no usa `.pf-nav` ni `pfScrollTo`; `renderProfile()` renderiza secciones nativas `<details class="pf-accordion">` para Objetivo, Comidas, Entrenamiento, Mi suscripción, Privacidad, Recordatorios, Avisos del dispositivo, Administración y Cuenta. `profileAccordionToggle()` mantiene como máximo una sección abierta. Los campos permanecen montados en el DOM al cerrar secciones, `#pfEditableBody` sigue delegando cambios solo de Objetivo/Comidas/Entreno y el botón flotante `#profileSaveFloat` conserva el flujo de guardado global existente. Prueba E2E: `tests/e2e/perfil.spec.js`.

### Origen

División de REQ-99 (2 jul 2026) por tamaño; auditoría UI del 1 jul 2026 (hallazgo P1-5).

### Problema

En `renderProfile()`, `.pf-nav` son chips que solo hacen `scrollIntoView`; las ocho secciones (Objetivo, Comidas, Entreno, Suscripción, Privacidad, Recordatorios, Avisos del dispositivo, Cuenta) están expandidas simultáneamente en una sola página de ~4.850 px.

### Objetivo

Que el usuario vea y navegue una sección a la vez, sin perder el modelo de guardado actual.

### Alcance

1. Reemplazar `.pf-nav` + `pfScrollTo` por un acordeón real (`<details>` o equivalente JS): cada sección colapsada por defecto; abrir una puede cerrar las demás.
2. Conservar sin cambios `saveProfile()`, `profileMarkDirty`/`profileClearDirty`, `#profileSaveFloat`, `saveOptionalConsents()`, `saveNotifPrefs()`, `renderPushSection()` — este REQ es solo estructura/visual.
3. Conservar los ids existentes (`pfSecObjetivo`, `pfSecComidas`, `pfSecEntreno`, `pfSecPrivacidad`, `pfSecCuenta`) para no romper referencias externas.
4. Colapsar/ocultar con CSS (no desmontar del DOM) para no perder valores de inputs no guardados al cambiar de sección.

### Fuera de alcance

- Guardado por sección (REQ-108).
- Reagrupar Suscripción/Recordatorios/Avisos del dispositivo bajo Cuenta (REQ-107).
- `aria-label` (REQ-106).

### Riesgos

- Si el toggle desmonta/remonta el HTML de una sección (en vez de solo ocultar), se pierden valores no guardados al cambiar de sección; usar ocultamiento CSS, no re-render parcial.

### Criterios de aceptación

- Cada sección abierta individualmente mide ~1.500 px o menos de alto renderizado.
- Editar un campo en una sección, abrir otra y volver conserva el valor editado (no se pierde por el toggle).
- El botón flotante "Guardar cambios" sigue apareciendo y funcionando igual que hoy.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Medir `scrollHeight` de cada sección abierta individualmente; editar un campo, alternar entre dos secciones y confirmar que el valor persiste en el DOM antes de guardar.

---

## REQ-106 - Accesibilidad: aria-label en todos los inputs de Perfil

**Estado: implementado.**
Auditados todos los `<input>`/`<select>`/`<textarea>` de `renderProfile()` y sus helpers (`mealTimesHtml`, `trainingAvailabilityHtml`, `checkChips`). La mayoría de los campos usaban un `<label>` visual sin `for`/`id`; en vez de agregar `aria-label` duplicando el texto ya visible, se asoció cada `<label>` con su control vía `for="<id>"` (23 campos en `index.html`: Nombre, Comidas al día, Comida principal, Minutos para cocinar, Presupuesto, Inicio/Fin de ventana, Repetición aceptable, Ingredientes que disfrutas, Otras preferencias, Alergias, Ingredientes que no te gustan, Deporte cardio, Trabajo de fuerza, Prioridad, Experiencia, Split de fuerza, Minutos por sesión, Horario preferido, Duración del plan, Lesiones, Limitaciones, Movimientos a evitar, Hora del recordatorio) y en `mealTimesHtml()` cada input de hora ("Comida N") ganó su `for` correspondiente. `trainingAvailabilityHtml()` ya tenía `aria-label="Lugar para {día}"` en los selects de lugar y checkboxes envueltos por `<label>` (de REQ-103); no requirió cambios. Los grupos de `checkChips` (chips de dieta, cocinas, preparaciones, equipo, días de recordatorio) y las etiquetas de sección ("Cocinas preferidas", "Días disponibles y lugar real", etc.) quedaron sin `for` a propósito: son rótulos de grupo, no de un único control, y cada checkbox ya es accesible por asociación implícita al estar envuelto en su propio `<label class="chip-check">`.
Prueba E2E nueva: `tests/e2e/perfil.spec.js` ("REQ-106: todos los inputs/selects/textareas tienen nombre accesible") audita el DOM real renderizado de Perfil (sin abrir cada `<details>`, ya que REQ-105 mantiene los campos montados) y falla si algún control queda sin `aria-label`/`aria-labelledby`/`label[for]`/`label` envolvente; verificado que detecta una regresión (quitando un `for` a mano) antes de confirmar que el fix la deja en 0.

### Origen

División de REQ-99 (2 jul 2026) por tamaño; auditoría UI del 1 jul 2026 (hallazgo P1-5).

### Problema

Varios inputs/selects de `renderProfile()` y sus helpers (`mealTimesHtml`, `trainingAvailabilityHtml`, `checkChips`) dependen de un `<label>` visual sin asociación programática (`for`/`id`) o de un label genérico compartido (p. ej. horarios por día de la semana bajo un único label "Horarios aproximados") — un lector de pantalla no anuncia el propósito real del campo.

### Objetivo

Que cualquier input interactivo de Perfil tenga un nombre accesible correcto.

### Alcance

1. Auditar cada `<input>`/`<select>`/`<textarea>` dentro de `renderProfile()` y los helpers que usa (`mealTimesHtml`, `trainingAvailabilityHtml`, `checkChips`).
2. Agregar `aria-label` donde el nombre accesible actual sea ambiguo o inexistente (los `label.chip-check` que envuelven el input ya son accesibles por asociación implícita — no agregar `aria-label` redundante ahí; enfocar en inputs de hora/número por día y campos con label compartido).
3. No cambiar estructura visual, ids usados por JS, ni lógica de guardado.

### Fuera de alcance

- Orden de tabulación, foco programático, overhaul de accesibilidad fuera de Perfil.

### Riesgos

- Bajo: cambio aditivo de atributos; riesgo principal es duplicar anuncios si se agrega `aria-label` a un input que ya tiene nombre accesible claro por `<label for>`.

### Criterios de aceptación

- 0 inputs/selects/textareas visibles en Perfil sin nombre accesible (por `for`/`id`, `aria-label`, o `<label>` envolvente), verificado con un script de auditoría del DOM renderizado.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Script en `scripts/` (jsdom o parseo del HTML renderizado) que liste inputs de Perfil sin nombre accesible; debe reportar 0.

---

## REQ-107 - UX: reagrupar Suscripción, Recordatorios y Avisos del dispositivo bajo Cuenta

**Estado: implementado.**
En `renderProfile()` (`index.html`) se movió el bloque `<details id="pfSecSuscripcion">` para que quede inmediatamente después de `<details id="pfSecPrivacidad">` (antes iba antes de Privacidad). El nuevo orden de `<details class="pf-accordion">` es: Objetivo, Comidas, Entreno, Privacidad, Suscripción, Recordatorios, Avisos del dispositivo, [Administración si aplica], Cuenta — Recordatorios y Avisos ya seguían a Privacidad antes del cambio, así que mover solo Suscripción bastó para agrupar las cuatro secciones justo antes de Cuenta. No se tocaron ids (`#notif_*`, `#pushSection`), lógica de `loadNotifPrefs`/`populateNotifPrefsForm`/`renderPushSection`/`saveNotifPrefs`, ni el contenido de ninguna sección — cambio puramente de orden en el HTML generado.
Prueba E2E nueva: `tests/e2e/perfil.spec.js` ("REQ-107: Privacidad, Suscripción, Recordatorios y Avisos quedan agrupados junto a Cuenta") verifica el orden exacto de ids de `details.pf-accordion`, confirma que activar el opt-in de Recordatorios sigue revelando `#notifOptions`, y que `#pushSection` sigue pintando contenido (wiring de `renderPushSection()` intacto) sin errores de consola.

### Origen

División de REQ-99 (2 jul 2026) por tamaño; auditoría UI del 1 jul 2026 (hallazgo P1-5).

### Problema

"Mi suscripción", "Recordatorios" y "Avisos del dispositivo" son secciones sueltas entre Entreno y Cuenta, sin agrupación visual con la sección "Cuenta" a la que pertenecen conceptualmente.

### Objetivo

Que toda la información de cuenta (identidad, suscripción, notificaciones) viva en un solo lugar coherente.

### Alcance

1. Mover los bloques "Mi suscripción" (`subscriptionStatusHtml()`), "Recordatorios" y "Avisos del dispositivo" (`renderPushSection`) para que queden agrupados junto a `pfSecCuenta`, después de Privacidad.
2. Implementar sobre la estructura vigente al momento de ejecutarse (acordeón de REQ-105 si ya está implementado; bloques secuenciales si no).
3. No cambiar ids usados por `loadNotifPrefs`/`populateNotifPrefsForm`/`renderPushSection` (`#notif_*`, `#pushSection`) ni su lógica.

### Fuera de alcance

- Cambiar lógica o copy de guardado de recordatorios/push.

### Riesgos

- `renderPushSection()` y `loadNotifPrefs().then(...)` corren después de escribir `innerHTML`; confirmar que las referencias por `id` (`$("#pushSection")`, `$("#notif_*")`) se siguen resolviendo igual tras mover los bloques de contenedor padre (los ids son globales al documento, no deberían romperse).

### Criterios de aceptación

- Privacidad, Suscripción, Recordatorios y Avisos del dispositivo aparecen agrupados junto a "Cuenta", en ese orden.
- Activar/guardar recordatorios y el estado de notificaciones push siguen funcionando igual que antes del cambio.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Inspeccionar el DOM renderizado y confirmar el nuevo orden de secciones; probar activar recordatorios y confirmar que `renderPushSection()` sigue pintando el estado de push correctamente.

---

## REQ-108 - UX: guardado por sección en Perfil con aviso de cambios sin guardar

**Estado: implementado.**
En `index.html`, `profileAccordionGuard(ev,summaryEl)` se conectó al `onclick` de los 9 `<summary>` de nivel superior de Perfil (Objetivo, Comidas, Entreno, Privacidad, Suscripción, Recordatorios, Avisos, Administración, Cuenta). Antes de abrir una sección distinta, revisa si la sección actualmente abierta pertenece a un grupo con cambios sin guardar (`pfSectionGroup`/`pfGroupDirty`) y, si es así, hace `preventDefault()` y muestra `confirm(...)`; si el usuario cancela, la sección editada permanece abierta con el valor intacto (REQ-105 nunca desmonta los campos); si acepta, continúa la navegación. Se agregaron dos pares de dirty-tracking nuevos, independientes del flotante global existente (que ya cubre Objetivo+Comidas+Entreno vía `saveProfile()`, sin partir su validación cruzada — alcance fuera de este REQ): `pfPrivacyMarkDirty/pfPrivacyClearDirty` (wireado con `oninput`/`onchange` en el panel de Privacidad, limpiado en `saveOptionalConsents()`) y `pfNotifMarkDirty/pfNotifClearDirty` (wireado en el panel de Recordatorios, limpiado en `saveNotifPrefs()`). Cada uno pinta un indicador de texto "Cambios sin guardar" (`#pfPrivacyDirtyHint`, `#pfNotifDirtyHint`) junto a su propio botón de guardado, consistente con el patrón del botón flotante. `populateNotifPrefsForm()` sigue poblando por asignación directa de `.checked`/`.value`, que no dispara `input`/`change`, así que la carga inicial no marca la sección como sucia.
Bug preexistente descubierto al escribir la prueba: `.toast` (`index.html`, notificación fija en la esquina inferior) no tenía `pointer-events:none`, así que aun invisible (`opacity:0`) bloqueaba clics reales sobre el botón flotante "Guardar cambios" cuando ambos se superponían cerca del borde inferior — se corrigió agregando `pointer-events:none` a la regla base `.toast` (no tiene contenido interactivo propio, así que no hay downside). Sin este fix, `tests/e2e/helpers.js`'s `completePrefs()` fixture tampoco encajaba con `validateFoodSchedule` (sin `eatingWindowStart`/`eatingWindowEnd` explícitos, el rango por defecto no encerraba `mealTimes[2]="20:00"`) — se agregaron esos dos campos al fixture compartido (no afecta otras specs, ninguna los usaba) para que `saveProfile()` sea verificable end-to-end.
Prueba E2E nueva: `tests/e2e/perfil.spec.js` ("REQ-108: aviso de cambios sin guardar al cambiar de sección, por vía de guardado") cubre: editar Entreno y cancelar el aviso al intentar abrir Comidas (el valor permanece); reintentar y aceptar (navega, el valor persiste al volver); guardar con el botón flotante (limpia el indicador global); Privacidad y Recordatorios muestran/ocultan su propio indicador y confirman el POST correspondiente (`user_consents`, `notification_preferences`) vía el array `calls` de `installMocks`. Las pruebas REQ-105 y REQ-107 existentes se actualizaron para aceptar el `confirm()` que ahora aparece al navegar con cambios pendientes (comportamiento nuevo esperado, no una regresión). Suite completa (`npx playwright test`): 11/11 passing, sin ripple en otras specs por el cambio de fixture. `node scripts/release-gate.mjs`: 46/48 (los 2 bloqueantes son preexistentes y no relacionados — ver commit).

### Origen

División de REQ-99 (2 jul 2026) por tamaño; auditoría UI del 1 jul 2026 (hallazgo P1-5). Depende de REQ-105 (estructura de acordeón).

### Problema

Todo Perfil comparte un único guardado global (`saveProfile()` + botón flotante), salvo Recordatorios y el permiso de fotos que tienen guardados propios independientes — modelo inconsistente con riesgo de pérdida silenciosa de cambios al navegar entre secciones.

### Objetivo

Que cada sección tenga una vía de guardado clara, visible solo cuando hay cambios pendientes, sin perder cambios de otras secciones.

### Alcance

1. Sobre la estructura de acordeón de REQ-105, mostrar el indicador de "cambios sin guardar" de forma consistente en las tres vías de guardado existentes (Objetivo+Comidas+Entreno vía `saveProfile()`; Privacidad/fotos vía `saveOptionalConsents()`; Recordatorios vía `saveNotifPrefs()`).
2. Mantener a Objetivo+Comidas+Entreno bajo un único guardado (`saveProfile()`) porque `validateTrainingProfile`/`validateFoodSchedule`/`validateFoodPreferences` validan esos campos en conjunto — no partir esa validación cruzada en guardados independientes.
3. Al cambiar de sección con cambios pendientes sin guardar, mostrar aviso (confirm o banner inline); no perder el valor en el DOM (la sección solo se oculta, no se destruye — ya garantizado por REQ-105).

### Fuera de alcance

- Cambiar `profileSchemaVersion` ni el esquema de `profiles.prefs`.
- Separar la validación cruzada de Objetivo/Comidas/Entreno en guardados independientes.

### Riesgos

- Guardar solo una parte de Objetivo/Comidas/Entreno dejaría `profiles.prefs` en un estado que no pasa `validateTrainingProfile`/`validateFoodSchedule`/`validateFoodPreferences`; ese trío debe seguir viajando en un solo `saveProfilePrefs`.

### Criterios de aceptación

- Cambiar un campo y navegar a otra sección sin guardar muestra aviso, o el cambio permanece recuperable al volver (no se pierde en silencio).
- Ningún guardado deja `profiles.prefs` en un estado que falle las validaciones existentes.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Editar un campo de Entreno, navegar a Comidas sin guardar, confirmar aviso; guardar y confirmar que el cambio persiste; repetir sin guardar y confirmar que se avisó antes de perder el cambio.

---

## REQ-109 - Fix Home: el badge "N pendientes" cuenta la fila de Descanso

**Estado: implementado.**

### Origen

Auditoría del journey **home** (2 jul 2026), verificado en navegador (E2E): día de descanso con comidas pendientes.

### Problema

El badge muestra "2 pendientes" en un día de descanso, pero solo hay una acción real: la 2.ª fila ("Descanso planificado") es informativa, sin botón. Contar el descanso infla el número y contradice el texto "pendiente(s)".

### Causa raíz

`homeAgendaHtml` deriva el conteo de `data.items.length` (`index.html:3481`) sin excluir la fila de descanso que `homeAgendaData` inserta con `actions:""` (`index.html:3409`).

### Objetivo

Que el badge cuente solo acciones pendientes; una fila informativa no suma.

### Alcance

1. En `homeAgendaHtml`, contar `items.filter(i=>i.actions)`, no `items.length`; mantener visible la fila de descanso.

### Fuera de alcance

- No cambiar orden ni contenido de la agenda (REQ-97).

### Riesgos

- No romper el conteo cuando todas las filas son accionables.

### Criterios de aceptación

- Descanso con comidas pendientes: badge "1 pendiente"; entreno con comida+entreno pendientes: "2 pendientes".
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- E2E: `completePrefs({trainingDays:[díasSinHoy]})`, preparar día, afirmar `.agenda-count`="1 pendiente".

### Implementación

`homeAgendaData` ahora calcula `pendingCount=items.filter(i=>i.actions).length` (excluye la fila de descanso, que se inserta con `actions:""`) y lo devuelve junto con `items`. `homeAgendaHtml` usa `data.pendingCount` en vez de `data.items.length` para el badge; la fila de descanso se sigue renderizando igual (sin cambios en `homeAgendaItemHtml` ni en el orden/contenido de la agenda). `node scripts/release-gate.mjs`: 46/48 (los 2 bloqueantes — "Sin modificaciones no intencionadas" por el propio diff sin commitear y `validate-docs-index.mjs` por tamaño de este archivo — son preexistentes y no relacionados, mismo patrón que REQ-108).

---

## REQ-110 - Fix UX: catch de aiGenerateWeek sin salida — sumar opción práctica y reintento

**Estado: implementado.** Catch externo de `aiGenerateWeek` (`index.html`) conserva `daysData`/`problems` parciales en `window._genWeek` y muestra "Usar una semana práctica ahora" (nueva función `deterministicWeekFromModal()`, completa solo los días faltantes con `generateDeterministicWeek` y re-renderiza `genWeekReviewHtml()`) y "Reintentar" (`aiGenerateWeek()`), mismo patrón de copy/clases que `deterministicFromModal`.

### Origen

Sesión del 1 jul 2026: el fix de P0-2 (auditoría `estrategia/08-Analisis-UI-Exhaustivo-2026-07-01.md`) se aplicó a `aiGenerateDay` pero no al flujo semanal.

### Problema

`aiGenerateWeek` ya entra por ruta determinista sin coach o sin entitlement, pero si el coach falla a mitad de la generación, el catch externo muestra solo `⚠️ <mensaje>` en el modal, sin reintento ni alternativa. Mismo callejón sin salida que tenía el día.

### Objetivo

Ningún fallo del coach durante "Preparar mi semana" deja al usuario sin salida accionable.

### Alcance

1. Catch externo de `aiGenerateWeek`: botones "Usar una semana práctica ahora" (aplica `generateDeterministicWeek` + `genWeekReviewHtml`) y "Reintentar".
2. Conservar los días ya generados (`daysData` parcial) y completar solo los faltantes por ruta determinista.
3. Reusar el patrón de `deterministicFromModal` (mismo copy y clases).

### Fuera de alcance

- Lógica de cuota y `beginCoachAction`/`endCoachAction`.
- El flujo determinista semanal existente.

### Riesgos

- `window._genWeek` debe quedar consistente al mezclar días del coach con deterministas.

### Criterios de aceptación

- Con fallo del coach en el día N, el modal ofrece continuar determinista o reintentar; ninguna ruta termina en modal muerto.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Forzar error en `generateOneDay` en local y recorrer ambos botones; la semana aplicada respeta slots y restricciones.

---

## REQ-111 - Fix API: /api/checkout valida configuración de Stripe antes que la sesión (503 en vez de 401/403)

**Estado: implementado.**
Ya resuelto por REQ-59 (`fix(checkout): REQ-59 validar sesión antes de Stripe`, commit `a7409ea`): `api/checkout.js` valida método → `verifyUser` (401) → `stripeKey` (503) → resto del flujo, verificado leyendo el archivo línea por línea el 2 jul 2026. Esta entrada reapareció por re-derivar el backlog desde una auditoría vieja (23 jun) sin verificar contra el código actual; se deja como registro para no reabrirla.

---

## REQ-112 - Accesibilidad: toasts anunciados a lectores de pantalla y contraste de texto muted

**Estado: implementado.** `#toast` (`index.html`) gana `role="status"` `aria-live="polite"` `aria-atomic="true"`; `toast()` solo hace `textContent`/`classList`, así que el anuncio no roba foco. `--muted` sube de `#8880aa` a `#9992b6` (≥4.5:1 sobre `--surf1`..`--surf4`, verificado por fórmula WCAG), lo que corrige de una sola vez todo el texto de cuerpo real que ya usaba ese token (p. ej. `.exercise-copy`, `.workout .detail`, `.onboarding-copy`, `.agenda-note`, `.prio-detail`, `.field-note`) sin tocar paleta ni tipografía. `--muted2` (`#52516e`, 1.9–2.6:1) se mantiene sin cambios para los usos decorativos o de cifra/etiqueta corta de una sola línea que excluye el alcance (`.mm-num`, `.mini-macro-*`, `.streak-best`, `.chat-meta`, `.agenda-label`, `.tour-dots`, `.ci-scale-lbl`, iconos SVG); se auditaron sus ~16 usos uno por uno y se migraron a `--muted` los 4 que sí son texto real legible: `.l-hero-note`, `.l-footer-legal` (antes con menos contraste que sus propios enlaces internos, que ya usaban `--muted`), el botón "Limpiar conversación" del coach y `.tour-skip` ("Saltar"/"Cerrar"). `node scripts/release-gate.mjs`: 46/48 (los 2 bloqueantes —"Sin modificaciones no intencionadas" por el propio diff sin commitear y `validate-docs-index.mjs` por tamaño de este archivo— son preexistentes y no relacionados, mismo patrón que REQ-108/REQ-109).

### Origen

Auditoría UI del 1 jul 2026 (hallazgo P2-11); complementa los aria-labels de Perfil (REQ-106). Alcance recortado el 2 jul 2026: el ítem de trap de foco en modales ya estaba resuelto por REQ-37 (`_modalKeyHandler` en `index.html`: Escape cierra, Tab queda atrapado en `.sheet`, el foco vuelve al disparador al cerrar) — verificado contra el código, no repetir.

### Problema

(a) Los toasts (`#toast`) no se anuncian a lectores de pantalla: no tienen `role`/`aria-live`. (b) `--muted` (`#8880aa`) da ~4.0:1 sobre `--surf4` y ~4.5:1 sobre `--surf3` (roza o incumple AA para texto de cuerpo); `--muted2` (`#52516e`) da 1.9–2.6:1 sobre todas las superficies del tema — muy por debajo de AA donde se usa como texto legible, no solo decorativo.

### Objetivo

Avisos y textos secundarios usables con lector de pantalla y legibles con baja visión, sin rediseñar la estética.

### Alcance

1. `#toast` con `role="status"` y `aria-live="polite"`.
2. Auditar cada uso de `--muted`/`--muted2` como color de texto: subir el token o mover a `--txt`/un tono intermedio donde el contenido sea texto de cuerpo real (no decorativo tipo punto de estado o cifra secundaria de una sola línea corta).

### Fuera de alcance

- Foco atrapado en modales (ya resuelto por REQ-37). Aria-labels de inputs de Perfil (REQ-106). Paleta de marca y tipografías.

### Riesgos

- Subir el contraste de `--muted`/`--muted2` afecta toda la app: revisar jerarquía visual en las vistas principales para no aplanar la UI.

### Criterios de aceptación

- Un toast se anuncia con VoiceOver/NVDA sin robar el foco.
- Texto de cuerpo que hoy usa `--muted`/`--muted2` cumple ≥4.5:1 contra su superficie real.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Recorrido con VoiceOver en Safari iOS; medir contraste de los tokens finales sobre `--surf1`..`--surf4`.

---

## REQ-113 - UX Auth: mostrar/ocultar contraseña en todos los campos de password

**Estado: implementado.**
`passwordField()` en `index.html` renderiza los campos de contraseña de login/registro, recuperación/invitación, preparación de usuario QA y cambio de contraseña admin con botón de ojo accesible (`aria-label`, `aria-controls`, `aria-pressed`, `type="button"`). `togglePasswordVisibility()` alterna `password`/`text`, conserva el valor y no dispara submit. Los ids, `autocomplete` y `minlength` existentes se mantienen; las llaves técnicas locales (`au_key`, `set_key`, `set_supakey`) siguen enmascaradas sin toggle por estar fuera del alcance de secretos técnicos. Validación estructural en `scripts/validate-password-toggle.mjs` y cobertura funcional en `tests/e2e/navegacion.spec.js`.

### Origen

Feedback de producto de Jonathan (3 jul 2026): en el textbox de password debe haber un icono que permita ver lo escrito.

### Problema

Los campos `type="password"` de login, registro, recuperación/invitación y modales administrativos no ofrecen control de visibilidad. En móvil esto aumenta errores de tipeo y fricción de activación, especialmente en el primer registro.

### Causa raíz

`index.html` renderiza inputs de contraseña directamente (`au_pwd`, `recovery_pwd`, `recovery_confirm`, `adminTestPwd`, `adminTestPwdConfirm`, `adminPwd`, `adminPwdConfirm`, y campos técnicos locales) sin componente/helper compartido ni botón de toggle.

### Objetivo

Que cualquier usuario pueda alternar entre contraseña oculta y visible de forma accesible, sin afectar autocomplete ni validaciones.

### Alcance

1. Crear un helper visual reutilizable para campos password con botón iconográfico de ojo/ojo tachado.
2. Aplicarlo a login/registro, recuperación/invitación, preparación de usuario QA y cambio de contraseña admin.
3. Mantener `autocomplete`, `minlength`, ids y validaciones existentes.
4. El botón debe tener `aria-label` dinámico ("Mostrar contraseña" / "Ocultar contraseña") y no enviar formularios ni mover foco innecesariamente.

### Fuera de alcance

- Cambiar políticas de contraseña, login social, passkeys o recuperación por correo.
- Mostrar secretos técnicos permanentes; para llaves/API locales aplicar el mismo patrón solo si no debilita el masking actual.

### Riesgos

- Un toggle mal implementado puede romper `autocomplete` o leer valores incorrectos en `doAuth`, `finishPasswordRecovery` y flujos admin.

### Criterios de aceptación

- Cada input de contraseña visible para usuario/admin tiene un botón de mostrar/ocultar.
- Alternar visibilidad conserva el valor escrito y no dispara acciones de submit.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- E2E o prueba manual mobile: registro, login, recuperación y cambio admin de contraseña alternando dos veces antes de enviar.

---

## REQ-114 - UX Onboarding: copy sin jerga en objetivo, grasa, ciclo y patrón de comida

**Estado: implementado.**
Onboarding y Perfil conservan valores internos (`mantenimiento`, `omnivoro`, duracion 4/10) pero muestran copy cotidiano: "Mantener mi peso y mejorar mi cuerpo", "Como de todo", grasa corporal opcional con nota, y "Ciclo de seguimiento" con 10 semanas como proceso recomendado. Validador: `scripts/validate-onboarding-copy.mjs`.

### Origen

Feedback de producto de Jonathan (3 jul 2026): "Mantener y recomponer", "Omnívoro", "% grasa" y "Duration" no son autoexplicativos para una persona normal.

### Problema

El onboarding todavía usa lenguaje técnico o poco cotidiano:

- "Mantener peso y recomponer" no comunica claramente el objetivo.
- "Omnívoro" no es como se identifica una persona que come de todo.
- "% grasa" puede sentirse obligatorio o intimidante aunque sea opcional.
- "Duración del plan" no explica que el usuario elige un ciclo de seguimiento, con 10 semanas como opción recomendada.

### Causa raíz

REQ-103 redujo jerga de macros y lugar, pero no cambió todos los labels de dominio ni sus ayudas contextuales. Las etiquetas visibles salen de `index.html` y de constantes compartidas en `js/nutrition-pure.js`.

### Objetivo

Que el onboarding sea entendible para principiantes sin cambiar los valores internos ni romper planes existentes.

### Alcance

1. Cambiar el copy visible de `mantenimiento` a una frase corta que conserve significado: mantener peso mientras mejora composición. Si no hay copy más corto y claro, usar "Mantener mi peso y mejorar mi cuerpo".
2. Cambiar el label visible de `omnivoro` a "Como de todo"; conservar el valor interno `omnivoro`.
3. Aclarar que el porcentaje de grasa corporal es opcional y se puede completar después, con tooltip o nota compacta según encaje en mobile.
4. Cambiar "Duración del plan" por una decisión de ciclo: 4 semanas como ciclo corto para empezar, 10 semanas como proceso completo/recomendado por defecto.
5. Replicar el copy consistente en Perfil donde aparezcan los mismos controles.

### Fuera de alcance

- Cambiar fórmulas de macros, `profileSchemaVersion`, valores guardados o historial.
- Rediseñar el entrenamiento completo; eso queda en REQ-115 y REQ-116.

### Riesgos

- Cambiar labels sin conservar valores internos puede romper validaciones, tests y compatibilidad con perfiles existentes.

### Criterios de aceptación

- El onboarding no muestra "Omnívoro" ni "Mantener peso y recomponer" como labels principales.
- El campo de grasa corporal queda claramente opcional.
- 10 semanas sigue siendo el default.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Completar onboarding sin ingresar grasa corporal y confirmar que el perfil queda válido y el plan se puede preparar.

---

## REQ-115 - UX Onboarding: entrenamiento en dos decisiones claras sin duplicar lugar y fuerza

**Estado: implementado.**
Onboarding y Perfil usan dos decisiones visibles: actividad física principal (`walking`, `running`, `cycling`, `swimming`, `other`, `strength_only`) y dónde entrenar fuerza (`gym`, `home`, `outdoor`, `none`). `strengthPlace` conserva casa/aire libre/gimnasio/no fuerza y se mapea de forma compatible a `strengthMode`, `trainingLocations` y `equipment`. Caminata tiene catálogo/roles propios y `strengthMode:"none"` permite plan solo de actividad sin exigir equipo. Validador: `scripts/validate-training-onboarding-decisions.mjs`.

### Origen

Feedback de producto de Jonathan (3 jul 2026): "Deporte cardio" no se entiende; el lugar de entrenamiento se cruza con gimnasio/peso corporal; la persona debería elegir dónde entrenar fuerza y con qué equipamiento si entrena en casa o al aire libre.

### Problema

El onboarding mezcla tres conceptos en controles separados: deporte cardio, trabajo de fuerza y lugar por día. Eso obliga al usuario a reconciliar "Gimnasio/Peso corporal" con "Lugar de entrenamiento", generando duplicidad y decisiones raras en mobile.

### Causa raíz

El modelo actual mantiene `primarySport`, `strengthMode`, `trainingLocations` y `equipment`, pero la UI los presenta como selectores paralelos en vez de una secuencia de intención:

1. actividad física/deporte que quiere practicar;
2. si quiere fuerza;
3. dónde y con qué recursos quiere hacer esa fuerza.

### Objetivo

Que el flujo de entrenamiento sea autoexplicativo y capture la intención real sin duplicar decisiones.

### Alcance

1. Reemplazar "¿Tienes un deporte cardio...?" y "Deporte cardio" por "¿Practicas alguna actividad física?" sin usar la palabra cardiovascular.
2. Ofrecer opciones explícitas: caminar, correr, bicicleta, natación, otro, ninguna.
3. Reemplazar "Trabajo de fuerza" por una pregunta única: dónde quiere entrenar fuerza: gimnasio, casa con peso corporal/equipo, aire libre con peso corporal/equipo, o "No quiero fuerza por ahora".
4. Si elige casa o aire libre, preguntar si tiene o quiere considerar equipamiento; permitir seleccionar ninguno, bandas/elásticos, mancuernas, barra/discos y barra de dominadas.
5. Mantener compatibilidad interna con `primarySport`, `strengthMode`, `trainingLocations` y `equipment` mediante mapeo/migración.
6. Actualizar Perfil con el mismo modelo para editarlo después.

### Fuera de alcance

- Cambiar el contenido de rutinas suaves por edad/restricción (REQ-116).
- Crear ejercicios nuevos si el catálogo actual cubre las combinaciones básicas.
- Permitir menores de edad.

### Riesgos

- `validateTrainingProfile`, `defaultTrainingLocations`, `trainingExpectedWeeks` y el generador de entrenamiento dependen de valores existentes. El cambio debe ser de presentación/mapeo antes de tocar contratos.

### Criterios de aceptación

- El usuario puede elegir caminar como actividad principal.
- El usuario puede elegir no hacer fuerza por ahora sin caer en validaciones contradictorias.
- Casa/aire libre muestran recursos disponibles sin repetir "Lugar de entrenamiento" como decisión duplicada.
- Perfiles antiguos siguen migrando a una selección válida.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- E2E onboarding con: caminata + no fuerza; ninguna actividad + fuerza en casa sin equipo; running + fuerza en gimnasio.

---

## REQ-116 - Entrenamiento seguro: modo suave recomendado por edad o restricciones

**Estado: implementado.**
Onboarding y Perfil agregan `trainingSafetyMode` (`auto/gentle/full`) con recomendación visible por edad 18-21, 50+, 55+ o limitaciones declaradas. El modo recomendado baja volumen/intensidad, puede usar caminata como actividad efectiva de bajo impacto, filtra ejercicios complejos/invertidos/dominadas/pike push-ups antes de generar semanas y valida `gentleMode` en `training-plan.js`. Red flags del safety screening siguen pausando entrenamiento. Validador: `scripts/validate-training-safety-mode.mjs`.

### Origen

Feedback de producto de Jonathan (3 jul 2026) + revisión de guías oficiales WHO/CDC/HHS: caminar cuenta como actividad aeróbica válida; en adultos mayores conviene ajustar intensidad, sumar balance/fuerza cuando sea apropiado y adaptar a condiciones reales.

### Problema

El flujo actual puede sugerir rutinas estándar a usuarios de 18-21, mayores de 50, mayores de 55 o personas con restricciones, sin una recomendación visible de bajar intensidad, priorizar caminatas/cardio ligero o evitar movimientos complejos.

### Causa raíz

La app tiene safety screening y nivel de experiencia, pero no traduce edad/restricciones a una recomendación de plan más suave que el usuario pueda aceptar o rechazar. Además, "solo caminatas/cardio ligero" no está modelado como opción válida y explícita para mayores.

### Objetivo

Ofrecer planes más seguros y sostenibles sin imponerlos: sugerencia suave desde 50, recomendación más fuerte desde 55, y libertad para elegir plan completo si el usuario lo decide y no hay red flags médicos.

### Alcance

1. Si edad 18-21: sugerir empezar conservador, con técnica y progresión gradual, sin bloquear plan completo.
2. Si edad >=50: sugerir modo suave/bajo impacto o fuerza ligera.
3. Si edad >=55: sugerir caminar/cardio ligero como plan válido, con opción de fuerza mínima o plan completo.
4. Si hay restricciones/limitaciones declaradas: recomendar modo suave y excluir movimientos complejos o invertidos cuando aplique.
5. El modo suave debe reducir intensidad/volumen, favorecer caminatas, movilidad, ejercicios estables y alternativas de bajo impacto.
6. La UI debe explicar la sugerencia con tono de cuidado, no de incapacidad.
7. Si el safety screening tiene red flags, mantener la pausa de seguridad vigente y no permitir saltarla.

### Fuera de alcance

- Diagnóstico médico, rehabilitación clínica o planes para menores de 18.
- Reescribir todo el catálogo de ejercicios; usar sustituciones y filtros disponibles donde sea posible.

### Riesgos

- Mensajes sobre edad y salud deben evitar promesas médicas o tono discriminatorio.
- Permitir "solo cardio" requiere revisar validaciones que hoy esperan fuerza/equipment.

### Criterios de aceptación

- Usuario de 50-54 ve sugerencia de plan suave, pero puede elegir plan completo.
- Usuario de 55+ puede elegir caminatas/cardio ligero como plan válido.
- Usuario con red flag médico sigue bloqueado por safety hold.
- Rutinas suaves no incluyen ejercicios complejos como pike push-ups, dominadas o movimientos invertidos salvo que el usuario elija plan completo y tenga perfil compatible.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- E2E con edades 20, 52 y 58; validar copy, opciones y plan resultante. Revisar manualmente un plan suave de 55+ en mobile.

---

## REQ-117 - Trial premium: primera semana con plan personalizado y cuotas limitadas

**Estado: implementado.** Trial server-side en `coach_trials` (una fila por usuario, 7 días desde `onboardingCompletedAt` o primer uso premium), políticas `trial` en `coach_quota_policies`, y `reserve_coach_action` selecciona `entitlement_code='trial'` cuando aplica. `/api/claude` permite el trial sin plan pago, bloquea nuevas acciones costosas al agotar cambios incluidos con copy comercial sin términos internos y no llama al proveedor en ese caso; los usuarios con plan pago siguen por el camino premium normal. `/api/entitlement` expone `trial` para la UI, Perfil muestra "Semana gratis" y los gates del cliente aceptan trial activo. En entrenamiento, el trial usa coach premium solo para la semana 1 y completa semanas posteriores con alternativa validada sin llamada externa; personalizarlas abre conversión. Verificado con `scripts/test-coach-quota.mjs` (trial permitido, agotado bloqueado, pago permitido), `scripts/validate-coach-quota.mjs` y `scripts/validate-training-plan-wiring.mjs`.

### Origen

Feedback de producto de Jonathan (3 jul 2026): antes del paywall debe generarse la primera semana gratis de dieta y entrenamiento con experiencia premium, limitando llamadas para controlar gasto y sin mencionar IA al usuario.

### Problema

La estrategia pide entregar valor antes del paywall, pero la experiencia premium real está ligada a entitlement. Un usuario nuevo debe probar el producto completo, pero sin abrir consumo ilimitado de coach.

### Causa raíz

El modelo actual distingue `hasEntitlement()` y cuotas de coach por acción, pero no existe un estado de trial premium de primera semana con límites propios, mensajes de conversión y expiración clara.

### Objetivo

Dar a cada usuario nuevo una primera semana personalizada gratis, con acceso premium limitado y mensajes comerciales claros cuando se agoten los cambios/rearmados.

### Alcance

1. Crear estado de trial por usuario: inicio, fin, uso y expiración; duración inicial 7 días desde completar onboarding o primer plan generado.
2. Durante trial, permitir generar la primera semana de nutrición y entrenamiento con el coach premium.
3. Limitar acciones costosas de trial: rearmar semana/día, "otra opción", cambios de plato y regeneraciones; los límites deben ser configurables en políticas server-side o constantes claras.
4. Al agotar límites de trial, mostrar copy visible: está en su semana gratis, ya usó sus cambios incluidos, puede activar un plan para seguir personalizando.
5. Respetar REQ-31: no usar "IA", modelos, tokens, cuotas internas ni proveedor en UI normal; usar "coach", "plan personalizado", "cambios incluidos".
6. Mantener fallback determinista gratuito si el servicio premium falla.

### Fuera de alcance

- Activar Stripe o cambiar precios.
- Implementar métodos de pago locales.
- Cambiar la frontera premium completa más allá del trial.

### Riesgos

- El gasto puede crecer si los límites no se aplican server-side.
- El trial no debe convertirse en entitlement indefinido ni poder reiniciarse con refresh/localStorage.

### Criterios de aceptación

- Usuario nuevo sin plan pago puede generar su primera semana personalizada dentro del trial.
- Agotar límites de trial bloquea nuevas llamadas costosas con mensaje comercial no técnico.
- Un usuario con plan pago no queda limitado por límites de trial.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Tests de `api/claude.js`/cuotas con usuario trial: primera acción permitida, límite agotado bloqueado, usuario pago permitido.

---

## REQ-118 - Activación: generar automáticamente la primera semana al terminar onboarding

**Estado: implementado.**
`saveOnboarding()` ahora prepara la primera semana automaticamente al cerrar onboarding inicial o nuevo ciclo. El flujo muestra progreso de comidas, entrenamiento y validacion; refresca entitlement/trial antes de generar; usa el coach cuando hay acceso vigente y completa faltantes con rutas deterministas. La activacion inicial se guarda como snapshot activo combinado `nutritionPlan + trainingPlan` en `plan_versions`, aplica comidas a `day_log` para compatibilidad local/offline y muestra reintento si una parte falla sin dejar la pantalla muerta. Validador: `scripts/validate-onboarding-first-week.mjs`.

### Origen

Feedback de producto de Jonathan (3 jul 2026): al terminar onboarding el usuario debe recibir automáticamente su primera semana completa, personalizada a sus gustos y objetivos.

### Problema

Hoy el onboarding termina y la preparación del día/semana depende de acciones posteriores. Para activación, el usuario debería salir del onboarding con "qué comer y entrenar esta semana" ya listo.

### Causa raíz

`saveOnboarding()` guarda preferencias y prepara estados iniciales, pero no orquesta una generación semanal premium automática de nutrición + entrenamiento ni una pantalla de progreso/revisión post-onboarding.

### Objetivo

Reducir time-to-first-value: registro -> onboarding -> primera semana personalizada lista, sin que el usuario tenga que buscar "Preparar semana".

### Alcance

1. Al guardar onboarding, iniciar generación de la primera semana de nutrición y entrenamiento usando el trial premium de REQ-117 cuando corresponda.
2. Mostrar estado de progreso comprensible: preparando comidas, preparando entrenamiento, validando plan.
3. Guardar nutrición en `plan_versions`/snapshot y entrenamiento como plan activo o borrador activado, sin reescribir historial.
4. Si falla una parte, usar fallback determinista y avisar con opción de reintento sin dejar pantalla muerta.
5. Al finalizar, llevar a Home con el anillo de macros, siguiente comida y sesión/descanso de hoy ya visibles.

### Fuera de alcance

- Rediseñar el paywall completo.
- Regenerar semanas futuras después de la primera; eso sigue siendo acción premium normal.

### Riesgos

- Generar nutrición + entrenamiento puede tardar; la UX debe manejar espera, errores parciales y navegación.
- No debe aplicar planes si falta consentimiento o safety screening vigente.

### Criterios de aceptación

- Un usuario nuevo completa onboarding y termina con primera semana aplicada o con fallback aplicado y reintento disponible.
- La generación usa preferencias guardadas antes de llamar al coach.
- Home no queda en estado "Aún falta preparar este día" después de onboarding exitoso.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- E2E onboarding completo con mocks de coach exitoso y con fallo parcial; verificar Home y `plan_versions`.

---

## REQ-128 - Contrato estricto único de dieta (`DIET_CONTRACT`) + canario de factibilidad

**Estado: implementado.** `js/nutrition-domain.js` exporta `DIET_CONTRACT`, `dietContractTolerance()` y `validateDietContractTotals()` como contrato estricto separado del runtime; `scripts/validate-diet-contract.mjs` corre el canario offline sobre `supabase/seed.sql` + semántica REQ-79 y queda incluido en `node scripts/release-gate.mjs`. El contrato sigue con `runtimeActive:false`; activarlo y cerrar días queda para REQ-129.

### Origen

Decisión de Jonathan (4 jul 2026) sobre la propuesta fusionada de dos análisis independientes convergentes: Codex (`docs/nutrition-generation-architecture-diagnostic-2026-07-04.md`) y la sesión de arquitectura de Claude del mismo día. Números elegidos: kcal ±3% o ±50 kcal (lo que sea mayor), proteína ±5 g bilateral, carbohidratos y grasa ±8 g — **sujetos a calibración por canario antes de activarse**.

### Problema

"Exacto a los macros" no tiene hoy una definición única. Conviven al menos 7 contratos contradictorios:

1. El prompt de `generateOneDay()` exige kcal ±10%.
2. `validateGeneratedDay()` (cliente) acepta ±15% kcal y proteína ≥85% (unilateral: no detecta pasarse).
3. `validateDietDay()` del servidor (`api/claude.js`) no valida macros en absoluto, aunque `dietQuotaValidation()` ya le envía `target` (lo ignora a propósito).
4. `validateDayTotals()` en `js/nutrition-domain.js` usa `DAY_KCAL_PCT:0.15` y `DAY_PROTEIN_MIN_PCT:0.85`.
5. El snapshot en `domain-contracts.js` tolera 20% de kcal.
6. `supabase/validate.mjs` tolera hasta ±30-60% contra metas legadas.
7. Los tests validan las tolerancias laxas, no exactitud.

### Causa raíz

Nunca se definió el contrato de aplicabilidad como objeto único de dominio; cada superficie fijó su número por conveniencia local.

### Objetivo

Un solo objeto `DIET_CONTRACT` como fuente de verdad de "día aplicable", con números calibrados contra el catálogo real antes de activarse en runtime.

### Alcance

1. Definir y exportar `DIET_CONTRACT` en `js/nutrition-domain.js`: kcal ±3% o ±50 kcal (lo mayor); proteína ±5 g bilateral; carbohidratos ±8 g; grasa ±8 g; kcal autoritativa = suma de `ingredients.kcal` del catálogo (nunca la declarada por el modelo, y sin asumir `kcal = 4P+4C+9F`, que el catálogo no cumple fila a fila).
2. Crear `scripts/validate-diet-contract.mjs` (canario): matriz de perfiles (2/4/6 comidas × omnívoro/vegetariano/vegano × meta normal y alta de proteína × disgustos comunes) × 7 días, resuelta con el solver determinista actual; reporta % de días factibles dentro del contrato por dimensión y las causas de fallo.
3. Si la factibilidad es <98% en alguna dimensión, documentar en este REQ el mínimo factible medido y el ajuste propuesto (nunca aflojar en silencio).
4. NO activar todavía el contrato en los validadores de runtime (eso es REQ-129): este REQ solo entrega el objeto, el canario y tests unitarios del objeto.

### Calibración del canario (2026-07-04)

Comando ejecutado: `node scripts/validate-diet-contract.mjs`.

Resultado contra el solver determinista actual y el catálogo base enriquecido localmente:

- Catálogo medido: 61 ingredientes, 50 platos, 180 líneas de receta.
- Matriz: 54 dimensiones × 7 días = 378 días.
- Factibilidad total dentro de `DIET_CONTRACT`: 0/378 (0%).
- Mínimo por dimensión: 0/7 (0%); las 54 dimensiones quedan bajo el gate futuro de 98%.
- Causas principales: `protein_contract` 332, `carbs_contract` 319, `kcal_contract` 273, `fat_contract` 170, `kcal_out_of_tolerance` 86, `slot_without_candidates` 42, `protein_insufficient` 21.

Ajuste propuesto: no relajar el contrato ni activarlo en silencio. Mantener los números elegidos como objetivo de aplicabilidad y exigir que REQ-129 implemente `finalizeNutritionDay()` con cierre global de macros antes de activar runtime. REQ-132/135 deben cerrar las brechas de slots/catálogo; después de esas piezas se re-corre el canario. Si tras solver global + metadata/catálogo el gate sigue bajo 98%, la recalibración debe quedar documentada como decisión explícita de producto.

### Fuera de alcance

- Cambiar `validateGeneratedDay`, el servidor, el snapshot o el prompt (REQ-129).
- Ampliar catálogo (REQ-134..136).

### Riesgos

- Fijar números infactibles con el catálogo actual (61 ingredientes / 50 platos) provocaría cascada de rechazos al activarse; por eso el canario decide antes que el contrato entre en vigor.

### Criterios de aceptación

- `DIET_CONTRACT` exportado, documentado y con tests unitarios.
- El canario corre offline, produce reporte de factibilidad por dimensión y causa.
- Ningún comportamiento de runtime cambia todavía.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- `node scripts/validate-diet-contract.mjs` y revisión del reporte de factibilidad.

## REQ-137 - `finalizeNutritionDay()` etapa 2: cierre global y complemento dentro de contrato

### Origen

Subdivisión de REQ-129 original. Depende de REQ-129 etapa 1: la puerta pura debe existir antes de agregar optimización global.

### Problema

Aunque cada slot se pueda resolver con `solveDishPortion()`, los residuos acumulados del día completo siguen dejando macros fuera de `DIET_CONTRACT`. El canario de REQ-128 midió 0/378 días dentro de contrato con el solver actual.

### Causa raíz

El solver optimiza por comida, no por día. No existe una pasada global que use ingredientes escalables de las comidas no registradas ni un complemento controlado del catálogo para cerrar residual.

### Objetivo

Que `finalizeNutritionDay()` pueda devolver días aplicables dentro de `DIET_CONTRACT` cuando el catálogo lo permita, o `no_solution` con causa medible cuando no.

### Alcance

1. Agregar una pasada global de cierre sobre comidas no bloqueadas: ajustar líneas escalables respetando `min_g`/`max_g`/`step_g` y límites palatables.
2. Clasificar palancas por macro usando categoría/nombre del ingrediente: proteína magra, carbohidrato base, grasa densa y ajuste calórico neutro.
3. Formalizar complemento del catálogo dentro del dominio puro: seleccionar snack/shake compatible solo si reduce residual sin romper restricciones.
4. Hacer que `validate-diet-contract.mjs` reporte cuántos días quedan `contract.ok` y cuántos son `no_solution` legítimo por cobertura de catálogo.
5. Mantener dormida la activación runtime: cliente/servidor/snapshots siguen laxos hasta REQ-139.

### Fuera de alcance

- Conectar flujos de UI (REQ-138).
- Activar contrato estricto en runtime o bump de pool (REQ-139).
- Crear metadata nueva o platos nuevos (REQ-132/135).

### Riesgos

- Porciones absurdas si no se respetan límites; todo ajuste debe pasar por `lineLimits()`/`clampStep()`.
- El catálogo actual puede no alcanzar 98%; si ocurre, el canario debe distinguir `catalog_gap` de bug del solver.

### Criterios de aceptación

- Un caso unitario con residuos acumulados queda dentro de `DIET_CONTRACT` tras la pasada global.
- Un caso imposible devuelve `no_solution` con causa, no un día aplicable fuera de contrato.
- El canario mejora el baseline de REQ-128 o explica dimensiones bloqueadas por catálogo.
- `node scripts/validate-diet-contract.mjs` y `node scripts/release-gate.mjs` pasan.

### Verificación sugerida

- Caso sintético de 4 comidas con déficit de proteína/carbohidratos; confirmar ajuste global y residual final.

### Evidencia de implementación (4 jul 2026)

`globalClosePass()` e `ingredientLeverCategory()` en `js/nutrition-domain.js` implementan la pasada global; `attemptContractComplement()` implementa el complemento de catálogo. Tests dedicados en `scripts/validate-finalize-nutrition-day.mjs` cubren el cierre exacto de residuo acumulado y el caso imposible (`no_solution` con causa `protein_contract`). `validate-diet-contract.mjs` sube de 39/378 (10.3%) a 122/378 (32.3%) y agrega `failureBreakdown.catalogGapDays`/`otherIssueDays`, que hoy reporta 100% de los días que no cierran como `catalog_gap` (solo residuo de macro, sin causa estructural).

## REQ-129 - `finalizeNutritionDay()` etapa 1: puerta pura dormida y normalización de propuestas

**Estado: implementado.** `finalizeNutritionDay(ctx)` vive en `js/nutrition-domain.js`, se exporta en namespace/global y queda dormida: normaliza propuestas contra catálogo, descarta ingredientes desconocidos, completa slots faltantes con fallback determinista, conserva `lockedMeals`, calcula `totals`/`residual` y reporta `contract = validateDietContractTotals(...)` sin activar `DIET_CONTRACT.runtimeActive`. El canario `scripts/validate-diet-contract.mjs` ahora mide con `engine:"finalizeNutritionDay"` y el nuevo `scripts/validate-finalize-nutrition-day.mjs` cubre unknown ingredient, fallback, kcal desde catálogo, contract.ok y locked meal intacta.

### Origen

Subdivisión autónoma del REQ-129 original (4 jul 2026). El alcance original mezclaba solver global, conexión de todos los flujos, validadores cliente/servidor, snapshots, prompt y pool; el propio REQ advertía dividir si no cabía en una corrida. Esta etapa crea la puerta pura dormida sin activar runtime.

### Problema

REQ-128 definió `DIET_CONTRACT`, pero no existe una función única que reciba propuestas, las normalice contra catálogo y devuelva un resultado aplicable o `no_solution` medible. Sin esa puerta, cualquier activación estricta obligaría a cambiar cliente, servidor y snapshots de una vez.

### Causa raíz

La lógica actual está dividida entre `planDeterministicNutritionDay()`, `validateGeneratedDay()`, `recalcCoachMealMacros()`, `findGapSnack()` y validadores externos. Falta un contrato puro de dominio que pueda probarse antes de conectarlo al shell.

### Objetivo

Crear `finalizeNutritionDay(ctx)` como API pura y dormida: normaliza propuestas y fallback determinista, recalcula macros desde catálogo y reporta `DIET_CONTRACT` sin cambiar aún qué días se aplican en runtime.

### Dependencias

- REQ-128 aplicado (el contrato y el canario deben existir).

### Alcance

1. Implementar `finalizeNutritionDay(ctx)` en `js/nutrition-domain.js` y exportarla en namespace/global.
2. Entradas mínimas: `{ prefs, dayTarget/target, catalog, slots?, proposal?, date?, workoutContext?, lockedMeals? }`.
3. Si `proposal.comidas` existe, normalizar cada comida:
   - mapear ingredientes con `normalizeCoachIngredient()`;
   - descartar comida con ingrediente no mapeable (`unknown_ingredient`);
   - resolver/recalcular macros desde catálogo o líneas normalizadas; no aceptar macros declarados;
   - respetar restricciones y `compatibleDishesForSlot()` cuando el plato matchee catálogo.
4. Para slots faltantes o propuestas descartadas, completar con `planDeterministicNutritionDay()`/`solveDishPortion()` por catálogo, conservando fecha/variedad cuando existan.
5. Calcular `totals`, `residual`, `contract = validateDietContractTotals(...)`, `status:"ok"|"no_solution"`, `no_solution` con causas medibles, y `comidas` normalizadas en el mismo formato vigente.
6. Respetar `lockedMeals`/comidas registradas: nunca modificar ni descartar una comida bloqueada; si impide cerrar contrato, reportar `locked_meal_contract_miss`.
7. Actualizar `scripts/validate-diet-contract.mjs` para usar `finalizeNutritionDay()` cuando exista, manteniendo reporte por dimensión.
8. Agregar tests unitarios que prueben: ingrediente desconocido no se acepta con warning; fallback completa slots faltantes; kcal viene de ingredientes del catálogo; `contract.ok` se reporta; locked meal no cambia.

### Fuera de alcance

- Pasada global de cierre macro estricto y complemento inteligente (REQ-137).
- Conectar el cliente (`generateOneDay`, semana, reemplazos, onboarding) a la función nueva (REQ-138).
- Activar `DIET_CONTRACT` en runtime, servidor, snapshots o prompt/pool versions (REQ-139).
- Metadata nueva de catálogo (REQ-132), platos nuevos (REQ-135/136) o cambios de modelo/API (REQ-133).

### Riesgos

- Si esta etapa cambia runtime por accidente, puede causar rechazos masivos: mantenerla dormida y probar por script.
- El canario seguirá bajo el gate de 98% hasta REQ-137/132/135; eso es esperado si se reporta claramente.

### Criterios de aceptación

- `finalizeNutritionDay()` existe, es pura y se exporta.
- Una propuesta con ingrediente desconocido devuelve `no_solution` o reemplazo por catálogo; no pasa como warning aplicable.
- El canario usa `finalizeNutritionDay()` y sigue produciendo reporte de factibilidad/causas.
- Ningún comportamiento visible cambia todavía; `DIET_CONTRACT.runtimeActive` sigue `false`.
- `node scripts/validate-diet-contract.mjs`, `node scripts/validate-nutrition-domain.mjs` y `node scripts/release-gate.mjs` pasan.

### Verificación sugerida

- Unit test en `scripts/validate-nutrition-solver.mjs` o script dedicado `scripts/validate-finalize-nutrition-day.mjs`.
- `node scripts/validate-diet-contract.mjs --json` para confirmar que el reporte incluye `contract` y causas.


## REQ-130 - Coherencia de preferencias duras y patrón omnívoro activo

**Estado: implementado.** `dislikedIngredients` ya se trata como exclusión obligatoria por defecto en dominio, cliente y proxy; el system prompt dejó de llamarlo preferencia blanda; `highProtLine` usa fuentes proteicas dinámicas filtradas por restricciones/disgustos y sin ejemplos de gramajes; el patrón omnívoro agrega señal verificable de proteína animal con warning/reintento dirigido (sin 422 duro) y relajación automática si el usuario excluye carnes/pescado. `COACH_PROMPT_VERSION` sube a 7 para invalidar pool previo. Se corrigieron las referencias erróneas `REQ-127` en código/tests. Validadores actualizados: `validate-nutrition-domain`, `validate-first-day-preferences`, `validate-high-protein-prompt`, `test-coach-quota`.

### Origen

Verificación de código del 4 jul 2026 (sesión Claude) que confirmó los hallazgos del diagnóstico de Codex §"Prompt y contexto": el fix d6e86cb dejó contradicciones vivas.

### Problema

1. `buildSysPrompt()` dice literalmente "los ingredientes no preferidos son preferencias blandas" — y ese system prompt va en TODAS las llamadas, contradiciendo la restricción dura que el prompt de usuario declara desde d6e86cb. El modelo recibe órdenes opuestas en la misma petición.
2. La línea de proteína alta (`highProtLine`) sugiere ejemplos estáticos: "tofu + legumbre", "300g de tofu en vez de 200g" — aunque el usuario tenga tofu en `dislikedIngredients`. El prompt puede prohibir y recomendar tofu a la vez.
3. El copy de Perfil promete "Se evitan cuando existe una alternativa viable", que ya no describe el comportamiento (bloqueo duro).
4. El patrón omnívoro existe solo como línea de prompt (d6e86cb); no hay regla verificable, así que un plan sin proteína animal pasa validación.
5. Colisión de numeración: los comentarios del código de d6e86cb citan "REQ-127", que en este backlog es el branding de correos de Supabase.

### Causa raíz

El fix d6e86cb endureció prompt de usuario, validación y solver, pero no auditó el system prompt, los ejemplos embebidos ni el copy; y el patrón omnívoro quedó como instrucción sin verificación.

### Objetivo

Cero contradicciones sobre preferencias en el contexto que ve el modelo, y patrón omnívoro como regla activa verificable.

### Alcance

1. `buildSysPrompt()`: tratar `disliked_ingredients` con el mismo lenguaje obligatorio que `hard_restrictions`.
2. `highProtLine` dinámica: construir los ejemplos de fuentes proteicas filtrando las restricciones y disgustos del usuario (nunca sugerir un ingrediente bloqueado); eliminar gramajes de ejemplo — tras REQ-129 los gramos son del solver.
3. Alinear copy de Perfil y onboarding con el bloqueo real.
4. Regla omnívora activa con relajación: para `diet` omnívoro sin disgustos que lo impidan, exigir ≥1 comida al día con proteína animal; si falla, warning + reintento dirigido (nunca 422 duro); si los disgustos del usuario excluyen carnes/pescado, la regla se relaja automáticamente.
5. Auditar que los disgustos bloquean también en `compatibleDishesForSlot`, fallback determinista, pool (context key, REQ-121), servidor y tests.
6. Corregir los comentarios "REQ-127" del código de d6e86cb para que citen este REQ.

### Fuera de alcance

- Scoring avanzado de gustos aprendidos (`learnedPatterns` sigue como está).

### Riesgos

- Usuarios con muchos disgustos reducen candidatos; la relajación de la regla omnívora y el `no_solution` medible de REQ-129 lo absorben.

### Criterios de aceptación

- Con "tofu" en `dislikedIngredients`: cero apariciones de tofu en system prompt, prompt de usuario (incluidos ejemplos), generación, validación y fallback, en día/semana/otra opción/reemplazos.
- Usuario omnívoro sin disgustos contrarios recibe ≥1 comida con proteína animal al día.
- El texto del prompt no contiene instrucciones contradictorias sobre preferencias (test de construcción de prompt).
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- `node scripts/validate-first-day-preferences.mjs` extendido con el caso tofu-en-ejemplos y el caso omnívoro-activo.

## REQ-133 - API del coach: structured outputs, límites y modelo por acción con gate de telemetría para Sonnet 5

### Origen

Decisión de Jonathan (4 jul 2026): migrar a Sonnet 5 solo detrás de un gate de telemetría; propuesta Claude §API + diagnóstico Codex §8.

### Problema

- La respuesta del modelo se parsea con regex (`parseJsonText`); JSON truncado o con texto extra es un vector real de fallos.
- El proxy capea `max_tokens` a 2048 (default 512); un día de 6 comidas roza el truncado.
- `ALLOWED_MODELS` no incluye `claude-sonnet-5`; hay un solo modelo para todas las acciones; no existe criterio medible para decidir la migración.

### Causa raíz

La integración se construyó mínima (texto plano, un modelo) y nunca se endureció la forma de la llamada.

### Objetivo

Llamadas con salida estructurada garantizada, límites correctos, modelo configurable por acción, y decisión de migración a Sonnet 5 basada en datos.

### Alcance

1. Structured outputs en el proxy para `diet_day`, `diet_week` y `meal_option`: `output_config: {format: {type: "json_schema", schema}}` (soportado por Haiku 4.5 y Sonnet 5); mantener el parseo actual como fallback de compatibilidad si la API rechaza el parámetro.
2. Subir el cap de `maxTokens` del proxy de 2048 a 4096; el cliente pide lo necesario por acción.
3. `ALLOWED_MODELS` += `claude-sonnet-5`; actualizar `MODEL_COSTS` (Sonnet 5: $3/$15 por MTok; intro $2/$10 hasta 2026-08-31); permitir modelo por acción vía env (p. ej. `ANTHROPIC_MODEL_DIET`) con default actual (Haiku 4.5) — cambiar de modelo debe ser un cambio de configuración, no de código.
4. Telemetría del gate: consulta/vista admin sobre `coach_generation_parts` con tasa de `invalid_provider_output`, tasa de degradación a ruta determinista, costo y latencia por acción/modelo.
5. Documentar el gate en este REQ: si tras REQ-129..131 la tasa de degradación de `diet_*` con Haiku supera 10% sostenido durante 1-2 semanas, se cambia `ANTHROPIC_MODEL_DIET` a `claude-sonnet-5` (decisión de Jonathan con el dato en mano). `meal_estimate` y `coach_conversation` permanecen en Haiku.

### Fuera de alcance

- Cambiar el default global de modelo sin pasar por el gate.
- Streaming, thinking u otras features de API no necesarias para este flujo.

### Riesgos

- Los resultados del pool anteriores no tienen schema garantizado: la validación de reuse ya cubre estructura; no re-validar formato con supuestos nuevos sin bump (coordinar con el bump de REQ-129 si los REQ aterrizan en otro orden).
- Costo: Sonnet 5 en dieta ≈ $0.10-0.15/semana/usuario con precio intro; registrado ya por `estimateCostUsd`.

### Criterios de aceptación

- En un canario de N generaciones con structured outputs: 0 fallos de parseo/JSON inválido.
- Cambiar el modelo de `diet_*` no requiere tocar código cliente.
- El panel/consulta admin muestra tasa de degradación y costo por acción/modelo.
- `node scripts/test-coach-quota.mjs` y `node scripts/release-gate.mjs` pasan.

### Verificación sugerida

- Llamada real de `diet_day` con schema y verificación de que la respuesta valida sin limpieza regex.

## REQ-134 - Pipeline de crecimiento del catálogo validado por el motor

### Origen

Decisión de Jonathan (4 jul 2026): "necesitamos ampliar drásticamente el catálogo de ingredientes y platos para todo tipo de gustos y preferencias". Diseño: análisis v2 §M9/Fase 6 (la IA propone offline; el sistema mapea, recalcula, valida y guarda).

### Problema

El catálogo tiene ~61 ingredientes / ~50 platos. La variedad percibida, la factibilidad del contrato estricto (REQ-128) y la cobertura de gustos dependen del tamaño del catálogo. Crecerlo a mano no escala; crecerlo con IA sin validación reintroduce el bug original (macros inventados no verificables).

### Causa raíz

No existe un camino de expansión validado: la IA runtime no debe crear platos, y no hay tooling offline que proponga candidatos verificados.

### Objetivo

Tooling offline repetible: la IA propone lotes de recetas/ingredientes; el motor los valida; un humano aprueba; la salida es SQL listo para aplicar manualmente.

### Alcance

1. Script offline `scripts/grow-catalog.mjs` (usa `ANTHROPIC_API_KEY` local/CI, nunca la app): pide a la IA lotes de recetas con composición por ingrediente y metadata completa, orientables por brief (slot, patrón dietético, cocina, presupuesto, tiempo).
2. Validación determinista de cada candidato antes de aceptarlo al lote:
   - consistencia `kcal` vs `4P+4C+9F` dentro de tolerancia documentada y rangos plausibles por 100 g;
   - slug estable y dedupe contra catálogo existente (regla de REQ-79; los IDs autoincrementales no son referencia);
   - metadata semántica obligatoria: `compatible_slots`, `diet_tags`, `meal_weight`, `meal_form`, `prep_minutes`, `budget_tier`, `needs_kitchen`, `eat_out_ok`, `scalable`/`min_g`/`max_g`/`step_g`;
   - fit de prueba con `solveDishPortion` contra presupuestos típicos de su slot (un plato que no escala dentro de límites palatables se rechaza).
3. Salida: archivo SQL de seed/patch para revisión y aplicación manual + reporte de aceptados/rechazados con causa. Nunca escribe a producción.
4. Ingredientes nuevos exigen fuente nutricional anotada (etiqueta/tabla de referencia) para la aprobación humana.

### Fuera de alcance

- Aplicar los lotes (REQ-135/136 y acción manual en Supabase).
- Cualquier generación de platos en runtime de usuario.

### Riesgos

- Datos nutricionales inventados por la IA: mitigado por validación de consistencia + fuente anotada + aprobación humana.
- `seed.sql` usa `truncate ... restart identity`: el pipeline debe referenciar por slug, nunca por ID (riesgo ya documentado en v2 §8).

### Criterios de aceptación

- Correr el script con un brief produce un lote SQL válido y un reporte con causas de rechazo.
- Un candidato con macros inconsistentes o sin metadata completa se rechaza automáticamente.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Brief de prueba "10 desayunos ligeros omnívoros" → lote válido; inyectar un candidato con kcal falsas → rechazado con causa.

## REQ-131 - Momento del día, etapa 1: presupuestos por slot y filtro heurístico sin migración

**Estado: implementado.** `generateOneDay()` ahora calcula `mealSlotTargets` y envía presupuesto kcal/proteína por slot, arquetipos por momento del día y referencia de platos filtrada por `compatibleDishesForSlot` para cada slot. `validateGeneratedDay()` matchea comidas contra el catálogo con `findDishForMeal`, rechaza `compatible_slots` incompatibles y aplica un techo interino de contundencia (`slotKcalCeiling`, presupuesto ×1.15) en slots no principales. `regenerateGenMeal()` recibe el arquetipo del slot. Validador nuevo: `scripts/validate-slot-budget-prompt.mjs`, agregado al release gate.

### Origen

Bug reportado por Jonathan (4 jul 2026): platos demasiado contundentes para el desayuno. Diagnóstico Codex §7 + propuesta Claude (etapa interina sin migración).

### Problema

El prompt lista los slots con id/hora pero no reparte el presupuesto calórico por comida ni exige adecuación del plato al momento del día; la lista de referencia manda ~60 platos de cualquier slot mezclados; la validación no comprueba slot-plato aunque el catálogo ya tiene `compatible_slots` (REQ-79). El modelo puede poner un guiso de almuerzo al desayuno y pasar validación.

### Causa raíz

La meta se comunica solo como total diario y la adecuación por slot nunca se validó.

### Objetivo

Que cada comida respete su presupuesto y su momento del día, con lo que ya existe (sin migración de schema).

### Alcance

1. Prompt: incluir presupuesto kcal/proteína por slot (desde `mealSlotTargets`), respetando `mainMealIndex`.
2. Prompt: lista de platos de referencia filtrada por slot (los candidatos de desayuno para desayuno, etc.).
3. Prompt: línea de arquetipos por slot (desayuno: avena, huevos, yogur, tostadas, batidos; no guisos ni platos de almuerzo; merienda/recena: ligero).
4. Validación: si el plato propuesto matchea el catálogo, verificar `compatible_slots`; incompatible → issue → política de reparación de REQ-129.
5. Heurística interina de contundencia: techo kcal por slot (p. ej. desayuno ≤ presupuesto del slot × 1.15 salvo comida principal) validado con los macros recalculados.

### Fuera de alcance

- Metadata nueva (`meal_weight`, `meal_form`) y backfill (REQ-132).

### Riesgos

- La heurística por kcal puede marcar falsos positivos en desayunos legítimamente grandes (comida principal en desayuno); el techo debe respetar `mainMealIndex`.

### Criterios de aceptación

- E2E: un perfil estándar nunca recibe en desayuno un plato del catálogo marcado solo como almuerzo/cena.
- El prompt contiene presupuestos por slot y la referencia va filtrada por slot.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Generar 10 días de prueba y verificar distribución kcal por slot contra `mealSlotTargets`.

## REQ-132 - Momento del día, etapa 2: metadata de contundencia y cobertura de slots vacíos

**Estado: implementado.** `supabase/nutrition_catalog_semantics.sql` agrega/backfillea `dishes.meal_weight` (`light/medium/heavy`) y `dishes.meal_form` (`bowl/sandwich/shake/plated/soup/snack`), con constraints idempotentes; `supabase/schema.sql` queda alineado para instalaciones nuevas. Los snacks, batidos y platos ligeros de yogur/caseína cubren `media_manana`, `merienda`, `snack` y `recena` sin crear platos nuevos. `compatibleDishesForSlot()` ahora rechaza `heavy` en desayuno no-principal y cualquier no-`light` en `media_manana`/`merienda`/`recena`; `validateGeneratedDay()` aplica la misma regla cuando matchea catálogo. `supabase/validate.mjs` y `validate-diet-contract.mjs` reportan cobertura por slot; baseline local: desayuno=6, media_manana>=7, almuerzo>=29, merienda>=7, snack>=7, cena>=5, recena>=7. `COACH_PROMPT_VERSION` sube a 8 y el `contextKey` incluye `compatible_slots`, `meal_weight` y `meal_form`. Acción manual externa: aplicar/re-ejecutar `supabase/nutrition_catalog_semantics.sql` en Supabase.

### Origen

Diagnóstico Codex §"Catalogo" + hallazgo verificado del análisis v2 (2026-06-28): cobertura por slot rota.

### Problema

- Sin metadata de contundencia, un plato puede ser compatible en macros pero mala experiencia para desayuno; la heurística de REQ-131 es aproximada.
- Cobertura del catálogo por slot: `media_manana`, `merienda` y `recena` = 0 platos. Los perfiles de 5-6 comidas no tienen candidatos y degradan siempre.

### Causa raíz

La metadata semántica de REQ-79 no incluyó contundencia/forma, y `compatible_slots` se pobló conservadoramente.

### Objetivo

Que el motor pueda decidir adecuación por momento del día con datos, y que los 7 slots renderizables tengan candidatos.

### Alcance

1. Migración SQL (aplicación manual documentada, como todas): columnas `meal_weight` (light/medium/heavy) y `meal_form` (bowl/sandwich/shake/plated/soup/snack) en `dishes` (extensión de `supabase/nutrition_catalog_semantics.sql` o archivo nuevo).
2. Backfill de los ~50 platos existentes con `meal_weight`/`meal_form` y revisión de `compatible_slots` multi-slot: shakes/snacks/yogures existentes deben cubrir `media_manana`, `merienda` y `recena` (>0 candidatos por slot sin crear platos nuevos).
3. Reglas de slot en dominio y validación: desayuno acepta light/medium (heavy solo si es comida principal); merienda/media mañana/recena solo light; almuerzo/cena sin restricción.
4. `compatibleDishesForSlot` y el prompt (REQ-131) consumen la metadata nueva; la heurística de kcal de REQ-131 queda como respaldo cuando falte metadata.
5. Actualizar `supabase/validate.mjs` y el canario para reportar cobertura por slot.

### Fuera de alcance

- Platos nuevos (REQ-135/136).

### Riesgos

- Migración manual en producción: dejar constancia como acción manual pendiente en el commit.
- Backfill subjetivo: usar criterios documentados (kcal por porción base, forma) para que sea auditable.

### Criterios de aceptación

- Todos los slots renderizables tienen ≥1 candidato compatible (reportado por el canario).
- Ningún plato heavy se aplica a desayuno no-principal ni a merienda/recena.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Canario con perfiles de 5 y 6 comidas: factibilidad por slot > 0 en los 7 slots.

## REQ-135 - Catálogo lote 1: slots vacíos, desayunos y snacks

**Estado: implementado.** `supabase/seed.sql` crece a 121 ingredientes, 100 platos y 359 lineas de receta: +60 ingredientes con fuente de revision humana documentada en `docs/catalog-lote-1-sources.md` y +50 platos orientados a desayunos, snacks/batidos, almuerzos y cenas ligeras. `supabase/nutrition_catalog_semantics.sql` ahora etiqueta proteinas animales por categoria, no por una lista corta, e infiere `low` budget y `sandwich` para nombres nuevos como avena/pan/arepa/wrap. `scripts/validate-nutrition-catalog.mjs` endurece los minimos de REQ-135: ingredientes>=100, platos>=100, desayuno>=20, snack>=15, media_manana/merienda>=10, recena>=8, vegetariano>=30%, vegano>=15%, prep<=15 y low budget en al menos un tercio. Baseline local post-lote: desayuno=20, media_manana=30, almuerzo=37, merienda=30, snack=30, cena=13, recena=30; el canario ya no reporta `slot_without_candidates` y sube a 27/378 dias (`7.1%`). El objetivo macro >=98% queda pendiente funcional de cierre global en REQ-137, no de cobertura de catalogo.

### Origen

Misma decisión que REQ-134. Prioridad del lote: los huecos que hoy rompen la experiencia (slots sin candidatos y desayunos repetitivos/contundentes).

### Problema

Cobertura actual por slot: almuerzo ~30, cena ~7, desayuno ~6, snack ~5, batido ~2, y `media_manana`/`merienda`/`recena` = 0. Los perfiles de 5-6 comidas no tienen de dónde elegir y el desayuno tiene 6 opciones para todos los gustos.

### Causa raíz

El catálogo se pobló para el plan original de 4 comidas de un usuario; nunca se dimensionó para la matriz real de perfiles.

### Dependencias

- REQ-134 (pipeline) y REQ-132 (metadata definida) aplicados.

### Objetivo

Que ningún slot quede sin candidatos variados y que el desayuno tenga profundidad real.

### Alcance

1. Generar y aprobar vía pipeline REQ-134 un lote con mínimos por slot: desayuno ≥20, media_manana ≥10, merienda ≥10, recena ≥8, snack/batido ≥15; total de platos del catálogo ≥100 (desde ~50).
2. Ingredientes nuevos según lo exijan las recetas (~61 → ~120), cada uno con fuente anotada.
3. Distribución del lote: ≥30% apto vegetariano, ≥15% apto vegano, cobertura de `budget_tier` bajo y de `prep_minutes` ≤15 en al menos un tercio.
4. Aplicar SQL en Supabase (acción manual documentada) y actualizar `CONTEXT.md`/validadores con los conteos nuevos.
5. Re-correr el canario de REQ-128: la factibilidad del contrato para perfiles de 5-6 comidas debe quedar ≥98%.

### Fuera de alcance

- Profundidad por cocinas/gustos específicos (REQ-136).

### Riesgos

- Volumen de revisión humana: el lote llega pre-validado por el pipeline, la aprobación es sobre plausibilidad nutricional y nombres.

### Criterios de aceptación

- Todos los slots con los mínimos definidos y metadata completa.
- Canario ≥98% de factibilidad en la matriz completa de perfiles.
- `node supabase/validate.mjs` (o equivalente vigente) y `node scripts/release-gate.mjs` pasan.

### Verificación sugerida

- Generar semana E2E para un perfil de 6 comidas: cero slots degradados por falta de candidatos.

## REQ-136 - Catálogo lote 2A: metadata de cocina y scoring de preferencias

**Estado: implementado.** `supabase/schema.sql` y `supabase/nutrition_catalog_semantics.sql` agregan `dishes.cuisine_tags text[]` con constraint idempotente (`criolla`, `mediterranea`, `mexicana`, `asiatica`) y backfill por menu/nombre. `js/nutrition-domain.js` exporta `cuisineTagsForDish()` y `preferredCuisineTags()`; `preferenceScoreAdjustment()` aplica un bonus suave cuando `prefs.preferredCuisines` coincide con tags del plato. `index.html` preserva la metadata en el editor admin, incluye `cuisine_tags` en el hash de catálogo y sube `COACH_PROMPT_VERSION` a 9. El pipeline `scripts/grow-catalog.mjs` ahora exige y emite `cuisine_tags`, y `scripts/validate-cuisine-preferences.mjs` prueba que perfiles criollo/mediterráneo/mexicano rankean candidatos distintos con los mismos hard filters. Acción manual externa: re-ejecutar `supabase/nutrition_catalog_semantics.sql` en Supabase para crear/backfillear `cuisine_tags` antes de usar los lotes REQ-140/141.

### Origen

Subdivisión del REQ-136 original. Evidencia al 4 jul 2026: `preferredCuisines` se captura en onboarding/perfil, pero el dominio solo prioriza `preferredIngredients`/`preferredDishes`; `dishes` no tiene metadata de cocina. El lote de datos no puede cumplir la aceptación de "semanas alineadas a cocina" sin este contrato previo.

### Problema

Las preferencias de cocina existen en `prefs.preferredCuisines`, pero el catálogo no declara cocina y `preferenceScoreAdjustment()` no las usa. Agregar 80 platos sin tags no garantiza que un perfil criollo, mediterráneo, mexicano o asiático reciba platos alineados.

### Causa raíz

Falta un contrato de metadata (`cuisine_tags`) y una regla determinista que convierta `preferredCuisines` en score de selección.

### Dependencias

- REQ-134 y REQ-135 aplicados.

### Objetivo

Preparar el catálogo para crecer por gustos: cada plato puede declarar cocina y el solver prioriza las cocinas preferidas sin bloquear restricciones, variedad ni contrato.

### Alcance

1. Agregar `dishes.cuisine_tags text[]` a `supabase/schema.sql` y `supabase/nutrition_catalog_semantics.sql` con vocabulario inicial alineado a `CUISINE_LABELS` (`criolla`, `mediterranea`, `mexicana`, `asiatica`) y backfill por nombre/menu.
2. Actualizar parsers/validadores de catálogo para exigir tags válidos y cobertura mínima por cocina antes de los lotes 2B/2C.
3. Actualizar `js/nutrition-domain.js`: `likedTermsForProfile` o `preferenceScoreAdjustment` debe considerar `prefs.preferredCuisines` contra `dish.cuisine_tags`; el ajuste es suave, no bloqueante.
4. Añadir test dedicado que demuestre que dos perfiles con cocinas opuestas rankean candidatos distintos cuando ambos cumplen slot/dieta.
5. Documentar que el gate macro 98% sigue siendo responsabilidad de REQ-137; este REQ solo habilita alineación por gustos.

### Fuera de alcance

- Agregar los 80 platos restantes (REQ-140/REQ-141).
- Personalización por usuario individual; el catálogo es común y la personalización la hacen filtros/scoring existentes.

### Riesgos

- Tags mal inferidos pueden sesgar demasiado el plan: mitigación con vocabulario chico, validadores y score suave.

### Criterios de aceptación

- `supabase/schema.sql` y `supabase/nutrition_catalog_semantics.sql` exponen `cuisine_tags` idempotente con constraint de vocabulario.
- `scripts/validate-nutrition-catalog.mjs` valida cobertura por cocina en el catálogo actual.
- Test puro: mismo slot/candidatos, `preferredCuisines=["criolla"]` favorece platos criollos y `["mediterranea"]` favorece mediterráneos sin tocar hard filters.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- `node scripts/validate-nutrition-catalog.mjs` y test nuevo de preference scoring.

## REQ-138 - Conectar `finalizeNutritionDay()` en cliente sin activar contrato global

**Estado: implementado.**
`generateOneDay()`, `deterministicDayPayload()` (usado por `applyDeterministicDay()` y como fallback de cuota), `generateDeterministicWeek()`, `regenerateDayInWeekDraft()` y `regenerateGenMeal()` ahora pasan su composición por el helper `finalizeDayWithGate()` → `finalizeNutritionDay()`; `prepareFirstWeekNutrition()`/`prepareFirstCycleWeek()` heredan la conexión porque delegan en esos dos primeros. El "ok" visible de cada flujo sigue dependiendo de que cada slot quede cubierto (`finalizedDayIsComplete()`) y de validación estructural, no de `DIET_CONTRACT` (sigue `runtimeActive:false`, REQ-139 lo activará). `lockedMealsForDay()` protege comidas `done=true` pasándolas como `lockedMeals`. El prompt de `generateOneDay()` quitó la exigencia "OBLIGATORIO — el día DEBE cumplir AMBAS metas... suma y verifica los totales"; ahora pide solo composición realista y dice explícitamente que el sistema ajusta las porciones finales. `validateGeneratedDay()` degradó sus dos chequeos de tolerancia de macros del día (kcal ±15%, proteína ≥85%) de `issues` (bloqueante) a `warns` (informativo), porque el cierre real ya no depende de que el modelo acierte los totales. Validador estructural nuevo: `scripts/validate-nutrition-finalize-wiring.mjs` (agregado a `release-gate.mjs`) confirma por fuente que los 5 flujos invocan la puerta única y que el prompt/validador ya no tratan los totales del modelo como autoridad final.
Alcance recortado a propósito: el reemplazo de una comida vía "Cambiar comida" (`applyChangeMeal`/`rebalanceFutureMeals`, REQ-83) NO se conectó a `finalizeNutritionDay()` en este REQ — es un mecanismo puro y ya probado (9 tests en `validate-nutrition-replacements.mjs`) con una lógica de rebalanceo proporcional distinta al hill-climbing de `globalClosePass()`; conectarlo requiere su propio análisis de riesgo. Se extrajo como REQ-142 para no bloquear ni diluir la entrega de los 5 flujos de generación/regeneración, que sí cubren el criterio de aceptación "los flujos principales del cliente invocan finalizeNutritionDay()".

### Origen

Subdivisión de REQ-129 original. Depende de REQ-129 y REQ-137.

### Problema

Aunque el dominio tenga una puerta final, los flujos visibles seguirán usando rutas fragmentadas (`validateGeneratedDay`, semana, determinista, regenerar comida, onboarding, reemplazos) hasta conectarla.

### Causa raíz

`index.html` contiene la orquestación histórica de nutrición y cada flujo acepta/rehace comidas con lógica local.

### Objetivo

Que todos los caminos del cliente pasen por `finalizeNutritionDay()` para obtener comidas normalizadas, pero sin activar aún el rechazo estricto global ni cambiar servidor/snapshots.

### Alcance

1. Cambiar `generateOneDay()` para pedir solo composición/semillas y finalizar con `finalizeNutritionDay()`.
2. Usar `finalizeNutritionDay()` en `generateDeterministicWeek`, `applyDeterministicDay`, primera semana de onboarding, `regenerateDayInWeekDraft`, `regenerateGenMeal` y reemplazos cuando recalculen el día.
3. Mantener protección de comidas `done=true` vía `lockedMeals`.
4. Mantener copy de usuario sin términos técnicos prohibidos.
5. Agregar/actualizar validadores estructurales para confirmar que los flujos llaman la puerta única.

### Fuera de alcance

- Activación del contrato en servidor/snapshot/pool (REQ-139).
- Structured outputs o modelo por acción (REQ-133).

### Riesgos

- Cambios en `index.html` son amplios; verificar día, semana, regeneración y onboarding con mocks.
- No reescribir historial ni comidas registradas.

### Criterios de aceptación

- Los flujos principales del cliente invocan `finalizeNutritionDay()`.
- Regenerar una comida no cambia comidas registradas.
- El prompt ya no le exige al modelo verificar totales como autoridad final.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- E2E mockeado de preparar día, semana y onboarding inicial; inspeccionar que las comidas aplicadas vienen finalizadas.

## REQ-140 - Catálogo lote 2B: profundidad por cocina, presupuesto y fuera de casa

**Estado: implementado.**
`supabase/seed.sql` agrega lote 2B: 41 ingredientes y 45 platos nuevos (162 ingredientes, 145 platos, 522 líneas de receta en total; fuentes en `docs/catalog-lote-2b-sources.md`). Cada cocina (`criolla`, `mediterranea`, `mexicana`, `asiatica`) ahora cubre desayuno, snack y al menos un slot principal (almuerzo/cena), no solo almuerzo como en REQ-136. `inferCuisineTags` en `supabase/nutrition_catalog_semantics.sql` y su espejo de test en `scripts/validate-nutrition-catalog.mjs` reconocen además `criolla`/`criollo` en el nombre del plato. El lote también suma opciones `needs_kitchen=false`, `eat_out_ok` (bowl/tacos/pasta/pollo) y `budget_tier='low'`, más proteína alta con fuentes naturales (pollo, pescado, huevo, lácteos) sin depender de proteína en polvo. `node scripts/validate-nutrition-catalog.mjs`, `node supabase/validate.mjs` y el canario `node scripts/validate-diet-contract.mjs` pasan; el gate macro estricto sigue en calibración hasta REQ-137 (fuera de alcance de este REQ). Acción manual externa: re-ejecutar `supabase/seed.sql` y `supabase/nutrition_catalog_semantics.sql` en Supabase para reemplazar/backfillear el catálogo antes de usar el lote 2C (REQ-141).

### Origen

Subdivisión del REQ-136 original. Depende de REQ-136 para que los platos nuevos tengan `cuisine_tags` útiles.

### Problema

El lote 1 resuelve cobertura por slot, pero la profundidad por cocina y por escenarios prácticos (`needs_kitchen=false`, `eat_out_ok=true`, bajo presupuesto) sigue siendo superficial.

### Causa raíz

El seed histórico fue creado por menú semanal, no por matriz de preferencias de onboarding.

### Objetivo

Primer lote de profundidad por cocina y escenarios: aumentar variedad real sin perder validación determinista.

### Alcance

1. Agregar lote validado por el pipeline o fixture offline con foco en criolla/peruana, mediterránea, mexicana y asiática.
2. Subir el catálogo al menos a 140 platos y 160 ingredientes, manteniendo los mínimos de REQ-135 y cobertura por `cuisine_tags`.
3. Aumentar opciones `needs_kitchen=false`, `eat_out_ok=true`, `budget_tier='low'` y alta proteína sin depender de proteína en polvo.
4. Documentar fuentes de ingredientes nuevos y actualizar conteos en `CONTEXT.md`, README y validadores.
5. Re-correr canario y confirmar que no reaparece `slot_without_candidates`; no exigir 98% macro hasta REQ-137.

### Fuera de alcance

- Alcanzar 180/200 finales (REQ-141).
- Activar contrato macro runtime.

### Riesgos

- Aumentar platos sin suficientes tags de cocina puede diluir el scoring: mitigado por depender de REQ-136 y validar cobertura por cocina.
- Reintroducir ingredientes no revisados: mitigado por fuentes documentadas y fixture/pipeline offline sin llamadas pagadas.

### Criterios de aceptación

- Conteos locales >=140 platos y >=160 ingredientes.
- Cada cocina principal tiene cobertura en desayuno/snack y al menos un slot principal.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- `node scripts/validate-nutrition-catalog.mjs`, `node supabase/validate.mjs` y canario `node scripts/validate-diet-contract.mjs`.

## REQ-141 - Catálogo lote 2C: meta 180/200 y validadores de gustos

**Estado: implementado.**
`supabase/seed.sql` agrega lote 2C: 38 ingredientes y 35 platos nuevos (200 ingredientes, 180 platos, 654 líneas de receta en total; fuentes en `docs/catalog-lote-2c-sources.md`), cerrando la meta final de profundidad del REQ-136 original. El lote suma proteínas nuevas (chuleta de cerdo, costilla, mejillones, calamar, anchoas, jamón serrano, chorizo, pollo molido), alternativas sin lácteos explícitas (leche/yogur de almendra y coco, queso vegano, levadura nutricional) y sin gluten explícitas (harinas de almendra/arroz/garbanzo, trigo sarraceno, amaranto, pan sin gluten multigrano, pasta de maíz), más condimentos regionales (ají panca, rocoto, huacatay, tomatillo, chipotle) para profundizar las 4 cocinas. `scripts/validate-nutrition-catalog.mjs` ahora exige explícitamente `REQ141_MIN_DISHES=180`/`REQ141_MIN_INGREDIENTS=200` y cobertura mínima de `needs_kitchen=false` (>=40), `eat_out_ok` (>=25), y estima cobertura de "sin lácteos"/"sin gluten" por categoría de ingrediente y una lista explícita de ingredientes con gluten conocido; estas dos últimas son heurísticas de composición de catálogo para dimensionar REQ-137, no una certificación de alérgenos ni reemplazan el filtrado real de restricciones del usuario (`js/nutrition-domain.js`). El canario `node scripts/validate-diet-contract.mjs` sube de 27/378 (7.1%) a 39/378 (10.3%) con `engine:"finalizeNutritionDay"`; el gate del 98% macro sigue siendo responsabilidad de REQ-137 (fuera de alcance). `node scripts/release-gate.mjs` pasa. Acción manual externa: re-ejecutar `supabase/seed.sql` en Supabase de producción para reemplazar el catálogo antes de que REQ-137 use el volumen completo.

### Origen

Subdivisión final del REQ-136 original.

### Problema

Después del lote 2B todavía faltará volumen para variedad semanal sostenida y preferencias específicas sin repetición.

### Causa raíz

Los gustos del onboarding necesitan más candidatos por cocina, presupuesto, sin lácteos, sin gluten, sin cocina y comer fuera.

### Objetivo

Cerrar la meta de profundidad del REQ-136 original sin mezclarla con el cierre macro de REQ-137.

### Alcance

1. Subir el catálogo a >=180 platos y >=200 ingredientes con fuentes documentadas.
2. Mantener mínimos REQ-135, cobertura por cocina REQ-136 y escenarios REQ-140.
3. Endurecer validadores para platos/ingredientes finales, cobertura por `cuisine_tags`, no cocina, comer fuera, sin lácteos y sin gluten cuando la metadata disponible lo permita.
4. Re-correr canario: debe mantenerse sin `slot_without_candidates`; reportar porcentaje macro como input de REQ-137.

### Fuera de alcance

- Resolver el 98% macro con optimización global; eso es REQ-137.

### Riesgos

- Volumen alto de datos puede esconder duplicados o platos demasiado similares: mitigado por slugs únicos, validadores de cobertura y revisión de fuentes.
- Canario macro puede seguir bajo aunque el catálogo cumpla volumen: mitigado documentando causas para REQ-137 en vez de relajar el contrato.

### Criterios de aceptación

- Conteos locales >=180 platos y >=200 ingredientes.
- Perfiles con `preferredCuisines=["criolla"]` y `["mediterranea"]` tienen candidatos suficientes para semanas variadas.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- `node scripts/validate-nutrition-catalog.mjs`, `node scripts/validate-diet-contract.mjs --json` y release gate completo.

## REQ-143 - Catálogo lote 3: crecimiento drástico dirigido por el canario del contrato

**Estado: pendiente. Requiere acción humana (decisión de producto en REQ-147) antes de intentar otro lote; no implementable por el agente autónomo hasta esa decisión.**

### Origen

Decisión de Jonathan (2026-07-05) tras el bloqueo de REQ-139: antes de subir el rigor de cualquier validación de macros, el catálogo debe crecer drásticamente. Este REQ es exclusivamente sobre contenido de catálogo — ningún cambio de validación, prompt, modelo ni UI.

### Problema

`node scripts/validate-diet-contract.mjs` mide 32.3% (122/378), 100% `catalog_gap` (residuo de macro, no bug del solver). Causas: `carbs_contract` (133), `protein_contract` (111), `fat_contract` (47), `kcal_contract` (16). Dimensiones más débiles: "alta_proteina" con 2 o 6 comidas, vegano en general, vegetariano/vegano con "sin_tofu" (0% en casi todos los conteos).

### Causa raíz

REQ-135/136/140/141 ampliaron el catálogo a 200 ingredientes/180 platos, suficiente para eliminar `slot_without_candidates`, pero no suficiente densidad de platos con perfiles de macro específicos (altos en proteína con pocos carbohidratos, opciones veganas sin tofu/yogur) para que el solver + `globalClosePass()` puedan cerrar dentro de ±3%/±50 kcal, ±5 g proteína, ±8 g carbohidratos/grasa en esas combinaciones.

**Actualización (2026-07-05, intento sin commit):** agregar contenido no garantiza subir el canario. `planDeterministicNutritionDay()` elige el plato de cada slot por score local (ajuste de macro a ese slot + desempate de variedad), sin optimizar el día completo; además `almuerzo/media_manana/merienda/snack/recena` ya superan el corte de 48 candidatos por slot (solo los 48 más cercanos en kcal reciben solver completo), así que sumar platos ahí puede desplazar sin aviso al plato que hoy cierra un día. Se probaron 5 lotes (4 a 22 platos, en `desayuno`/`cena` para evitar ese corte): el mejor subió "2 comidas" de 39/54 a 50/54 (`vegano/alta_proteina/sin_tofu` de 0% a 85.7%) pero bajó "4 comidas" de 66/162 a 53/162; el agregado quedó siempre bajo 32.3% (27.8%-31.2%). Un lote de solo 4 platos de desayuno, sin relación con ninguna dimensión débil, regresó el agregado igual de fuerte, confirmando que el efecto es del mecanismo de selección, no del contenido. Ningún lote se comiteó. Ver REQ-144: hace falta medir el impacto real de un candidato contra el canario de 378 días, no solo contra el ajuste genérico de `scripts/grow-catalog.mjs`.

**Actualización (2026-07-08, agente autónomo, sin commit de catálogo):** con `scripts/diff-diet-contract.mjs` (REQ-144) ya disponible, se repitió el experimento con una hipótesis más precisa. Una sonda de solo lectura sobre `finalizeNutritionDay()` (script descartable, no comiteado) mide el signo de cada residuo fuera de contrato en los 378 días: `carbs residual stats: {n:133, pos:133, neg:0}` — **el 100% de los fallos de `carbs_contract` son por exceso de carbohidratos, nunca por déficit**, un sesgo sistemático medible, no ruido. Causa técnica: `scoreMacros()` (`js/nutrition-domain.js:542-550`) pondera kcal ×1.4 y proteína hasta ×1.45 (si falta) pero carbohidratos solo ×0.55, así que el solver privilegia cerrar kcal/proteína a costa de carbohidratos cuando un plato no tiene ya, de fábrica, una proporción proteína:carbohidrato parecida al target.

Se probó un lote de 13 platos nuevos (6 desayuno + 7 cena), usando **solo ingredientes ya verificados en catálogo** (sin ingredientes nuevos, sin riesgo de fuente de macros nueva) con proporción proteína:carbohidrato alta, priorizando `carbs_contract`/`protein_contract` como pide el alcance de este REQ. Medición con el diff de REQ-144, cada plato probado también de forma aislada para aislar el efecto:

- 6 platos de desayuno (omnívoro/vegetariano/vegano bajos en carbohidratos) y 5 platos de cena omnívoros (pollo/salmón/camarones/merluza/lomo, todos con perfil bajo en carbohidratos verificado a mano): **0/378 de cambio neto cada uno**, probados individualmente. Nunca ganaron la selección local frente al catálogo existente en ningún día de la matriz.
- 1 plato de cena vegano, "Tempeh a la plancha con espárragos y limón" (probado solo): **+1/378** (32.3% → 32.5%), sin regresiones en ninguna dimensión.
- 1 plato de cena vegano, "Seitán salteado con pimientos y champiñones" (probado solo, misma intención y perfil de macros casi idéntico al del tempeh): **-1/378** (32.3% → 32.0%). Mejoró `2 comidas/vegano/alta_proteina/sin_tofu` en +6 días pero regresionó tres dimensiones `sin_tofu` vegetarianas/veganas de 4 y 6 comidas (-1 a -3 días cada una) — misma firma que el hallazgo de 2026-07-05: un plato nuevo puede ganar la selección local en un slot y desplazar, sin que el sistema lo sepa, un plato que hoy sí cerraba el día completo.
- Lote completo sin el plato de seitán (12 platos, solo aporta el tempeh): **+1/378 neto** (32.3% → 32.5%), no negativo pero muy por debajo de "sustancial". No se comiteó: no cumple el criterio de aceptación de este REQ.

**Conclusión:** dos sesiones independientes (2026-07-05 y 2026-07-08), con estrategias de contenido distintas (relleno general de slots vs. lote dirigido por el sesgo de carbohidratos medido), coinciden en que el catálogo bajo la selección local actual de `planDeterministicNutritionDay()`/`globalClosePass()` tiene un techo cercano a 32%-33%, y que el efecto plato-a-plato (+1 a -1 día por plato, sin relación clara con qué tan bien calibrado está el plato) domina sobre la señal de contenido. Subir el canario "de forma sustancial" — el objetivo explícito de este REQ — no parece alcanzable solo con lotes de catálogo sin tocar la selección, que está fuera de alcance aquí por decisión previa de Jonathan. Ver REQ-147 (nuevo): documenta esta tensión y pide una decisión de producto antes de invertir más tiempo de agente en lotes de catálogo o en tocar la selección.

### Objetivo

Subir la factibilidad del canario de forma sustancial (no un lote incremental menor) priorizando las causas y dimensiones más débiles listadas arriba, acercándose lo más posible al gate ≥98% de REQ-128; si no alcanza el gate completo, dejar documentado el remanente para un REQ de continuación (siguiendo el patrón REQ-136→140→141). REQ-144 ya provee el diff obligatorio: sin medir el impacto por lote antes de comitear, no se puede garantizar que un lote nuevo suba el canario en vez de regresarlo.

### Alcance

1. Con la herramienta de REQ-144, generar candidatos (`scripts/grow-catalog.mjs` o curaduría manual) priorizando `carbs_contract`/`protein_contract` y las dimensiones en 0%-14%.
2. Medir cada candidato/lote contra el canario de 378 días antes de sumarlo a `supabase/seed.sql`; descartar lo que tenga impacto neto negativo o empeore una dimensión hoy sana.
3. Documentar fuentes en `docs/catalog-lote-3-sources.md` (formato de lotes previos) solo para los platos aceptados.
4. Actualizar `scripts/validate-nutrition-catalog.mjs` si cambian mínimos de cobertura (sin bajar los ya exigidos).
5. Documentar el nuevo % y `failureBreakdown`, y la acción manual pendiente de re-ejecutar `seed.sql` en producción.

### Fuera de alcance

- Cambio de validación/gating de `DIET_CONTRACT` (REQ-139) o de la selección de `planDeterministicNutritionDay()` (rediseño de día completo, no cabe en un lote de catálogo).
- Cambios de modelo/prompt (REQ-133, cerrado). Reemplazo puntual de comida (REQ-142).

### Riesgos

- Platos sin fuente de macros verificable rompen la confianza en `ingredients.kcal` (REQ-128); mantener el estándar de lotes previos.
- Optimizar solo el % agregado puede ocultar que se rompió una dimensión sana (visto en el intento de 2026-07-05); revisar el reporte por dimensión, no solo el neto.

### Criterios de aceptación

- El canario sube de forma sustancial desde 32.3% **sin bajar el total agregado respecto a la medición previa** (documentar el nuevo % y `failureBreakdown`, y el delta por dimensión de REQ-144).
- Las dimensiones hoy en 0% (ej. `vegano/alta_proteina/sin_tofu`, `vegetariano/normal/sin_tofu`) mejoran o quedan documentadas con causa explícita si no.
- `node scripts/validate-nutrition-catalog.mjs` y `node supabase/validate.mjs` pasan.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Reporte de REQ-144 antes/después del lote completo (no solo el % agregado de `validate-diet-contract.mjs`).
- `node supabase/validate.mjs` para integridad de recetas/macros del catálogo ampliado.

## REQ-139 - Activar `DIET_CONTRACT` en runtime con aviso suave no bloqueante

**Estado: implementado (2026-07-12).**

### Decisión de producto (2026-07-05, Jonathan)

El alcance original (rechazo duro en cliente/servidor/snapshot) habría roto `aiGenerateDay()` para la mayoría de perfiles: canario en 32.3%, debajo del gate ≥98% de REQ-128, y `validateGeneratedDay()` valida la propuesta cruda del modelo antes del cierre determinista.

Jonathan decidió: (1) el contrato se evalúa sobre el **día ya cerrado** por `finalizeNutritionDay()`, nunca sobre la propuesta cruda; `validateGeneratedDay()` no sube sus checks de macro a `issues`; (2) si el día cerrado no cumple `DIET_CONTRACT`, la UI muestra un **aviso suave** y el usuario aplica/guarda igual — ningún flujo bloquea; (3) el crecimiento de catálogo (REQ-143) ya no es prerrequisito duro, porque el aviso no depende de la factibilidad.

### Origen

Subdivisión final de REQ-129. Redefinido 2026-07-05 (ver decisión arriba).

### Problema

El "ok" visible de un día generado dependía solo de `finalizedDayIsComplete()` (cobertura de slots); el usuario nunca veía si su día quedó cerca o lejos de sus metas, aunque `finalizeNutritionDay()` ya calculaba `contract`/`residual`.

### Causa raíz (verificada contra código antes de implementar)

`finalizeDayWithGate()` ya calculaba `finalized.contract` en cada flujo (día, semana, regenerado de comida), pero ningún call-site de `index.html` leía ese campo: `deterministicDayPayload()` sobrescribía `ok`/`status` con `finalizedDayIsComplete()` (descartando el contrato para gating, correcto y sin cambios), y el resto de flujos (`generateOneDay`, `generateDeterministicWeek`, `regenerateDayInWeekDraft`, `regenerateGenMeal`) simplemente tomaban `finalized.comidas` sin propagar `contract` a la UI. El dato ya existía; faltaba mostrarlo.

### Solución implementada

- `js/nutrition-domain.js`: `DIET_CONTRACT.runtimeActive=true`. Ninguna otra función del dominio leía ese flag (se confirmó por grep antes de tocarlo), así que el cambio es puramente semántico/documental a nivel de dominio — el gating real vive en el cliente.
- `index.html`: dos helpers nuevos junto a `finalizeDayWithGate()`/`finalizedDayIsComplete()`:
  - `comidasMacroTotals(comidas)`: suma kcal/proteína/carbohidratos/grasa de un arreglo de comidas ya cerradas.
  - `dietContractNoticeText(totals,target)`: delega en `nd.validateDietContractTotals()` (dominio puro, ya existía desde REQ-128) y devuelve `""` si el contrato cumple, o `"Tu día quedó cerca de tu meta, no exacto."` si no — copy sin vocabulario técnico (REQ-31).
  - Se optó por recalcular el contrato desde `totals`/`target` en cada punto de renderizado (en vez de propagar el objeto `contract` de `finalizeNutritionDay()` por cada call-site) porque es una función pura y evita tener que enhebrar el campo por 5 flujos distintos con formas de retorno diferentes (`res`, `daysData[i]`, `det`).
  - Se muestra en: `genReviewHtml()` (revisión de un día, solo cuando `res.ok` para no duplicar con el bloqueo de `issues`), `genWeekReviewHtml()` (una nota por día del borrador de semana), y en los toasts de `applyGeneratedDay()`, `applyWeekPlan()` (cuenta agregada de días no exactos) y `applyDeterministicDay()` (solo cuando el día quedó completo).
  - `finalizedDayIsComplete()` no cambió: sigue siendo el único criterio de "aplicable" (cobertura de slots), documentado explícitamente en su comentario para evitar que una futura sesión lo acople al contrato.
- `api/claude.js::validateDietDay()` y `domain-contracts.js::validateNutritionPlanSnapshot()`: sin cambios — no se agregó rechazo nuevo por macros (alcance opcional del REQ, no ejercido para minimizar riesgo).

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `js/nutrition-domain.js` | `DIET_CONTRACT.runtimeActive=true` |
| `index.html` | `comidasMacroTotals()`, `dietContractNoticeText()`; wiring en `genReviewHtml`, `genWeekReviewHtml`, `applyGeneratedDay`, `applyWeekPlan`, `applyDeterministicDay` |
| `scripts/validate-diet-contract-runtime-notice.mjs` | Validador estructural nuevo (sin ejecutar la app): runtimeActive=true, aviso presente en las 5 pantallas, ningún flujo de aplicar bloquea por contrato, sin vocabulario prohibido |
| `scripts/validate-diet-contract.mjs`, `scripts/validate-finalize-nutrition-day.mjs`, `scripts/validate-nutrition-domain.mjs` | Aserciones de `runtimeActive` actualizadas de `false` a `true` |
| `scripts/release-gate.mjs` | Agrega el validador nuevo al gate |
| `service-worker.js` | `CACHE_NAME` v67 → v68 (shell `index.html` cambió) |

### Criterios de aceptación

- `DIET_CONTRACT.runtimeActive` queda `true`. ✓
- Cuando el día cerrado no cumple el contrato, la UI muestra un aviso suave y no bloqueante, sin vocabulario técnico prohibido. ✓ (verificado en navegador con datos sintéticos: día 600 kcal sobre meta → aviso visible, botón "Aplicar al día" sigue habilitado)
- Ningún flujo (cliente, servidor, snapshot) rechaza ni impide aplicar/guardar un día por no cumplir `DIET_CONTRACT`. ✓
- `node scripts/release-gate.mjs` pasa. ✓ (69/71; los 2 no bloqueantes son el propio diff de git sin commitear y la suite E2E de `entreno.spec.js`, falla preexistente de REQ-145 no relacionada — hoy 2026-07-12 es domingo)

### Verificación

- `node scripts/validate-diet-contract-runtime-notice.mjs`, `node scripts/validate-nutrition-domain.mjs`, `node scripts/validate-finalize-nutrition-day.mjs`, `node scripts/validate-diet-contract.mjs`: todos pasan.
- `node scripts/release-gate.mjs`: 69/71 (ver criterios arriba).
- Navegador (servidor local 8923, sin llamadas pagadas): `dietContractNoticeText()` devuelve el aviso solo cuando el contrato falla y `""` cuando cumple exacto; `comidasMacroTotals()` suma correctamente; `genReviewHtml()` con un día 600 kcal fuera de meta muestra el aviso y mantiene "Aplicar al día" habilitado (nunca `disabled`); `genWeekReviewHtml()` con un borrador de 2 días (uno exacto, uno lejos) muestra exactamente 1 aviso, en el día correcto.

## REQ-142 - Conectar reemplazos ("Cambiar comida") a `finalizeNutritionDay()`

**Estado: implementado (2026-07-14).**

### Origen

Extraído de REQ-138 (4 jul 2026) al acotar su alcance: los 5 flujos de generación/regeneración de día ya quedaron conectados a `finalizeNutritionDay()`, pero el flujo de reemplazo puntual de una comida (`openChangeMeal`/`applyChangeMeal`) usaba su propio mecanismo (REQ-83: `rankReplacementCandidates` + `solveReplacement` + `rebalanceFutureMeals`), distinto y ya probado, que no se tocó en su momento para no arriesgar una regresión sin análisis dedicado.

### Problema

Cuando el usuario cambiaba una comida y el reemplazo disparaba rebalanceo de comidas futuras (`rebalanceNeeded`), ese rebalanceo repartía `-deltaKcal/n` proporcionalmente entre las comidas futuras (REQ-83), sin pasar por el cierre global de macros (`globalClosePass`) ni por la normalización de `finalizeNutritionDay()`. El día resultante no se beneficiaba del mismo cierre que sí aplican `generateOneDay`, `deterministicDayPayload`, `generateDeterministicWeek`, `regenerateDayInWeekDraft` y `regenerateGenMeal`.

### Causa raíz (verificada contra código antes de implementar)

El REQ-83 se construyó antes que `finalizeNutritionDay()` (REQ-129/137) y resuelve el mismo problema (cerrar macros del día tras un cambio) con un algoritmo propio de rebalanceo proporcional en vez del hill-climbing de `globalClosePass()`. `finalizeDayWithGate()` ya existía y ya construye el `ctx` correcto (`lockedMeals`, `proposal`, `slots`) para cualquier flujo de día completo; solo faltaba que `applyChangeMeal()` lo usara en vez de `rebalanceFutureMeals()`.

### Decisión de producto

Se conservó `rebalanceFutureMeals()` (y `rankReplacementCandidates()`/`solveReplacement()`) sin tocar como capa de compatibilidad — siguen exportadas y con sus 9 tests originales intactos — y se usan solo si `finalizeNutritionDay()` no está disponible (nd o catálogo no cargado). En el camino normal (nd + `DB.loaded`, que es el único caso en que `rebalanceNeeded` puede activarse porque `ranked_item` solo existe con ambos cargados), `applyChangeMeal()` ahora arma el `ctx` de `finalizeNutritionDay()` y usa su resultado. No se activó `DIET_CONTRACT` en runtime para esta pantalla (fuera de alcance, ver REQ-139) ni se cambió el ranking de candidatos ni el scope "solo hoy/esta semana".

### Solución implementada

- `index.html`: nuevo helper `mealEntryForFinalize(m,ms)` (extraído del cuerpo de `lockedMealsForDay()`, que ahora lo reutiliza sin cambiar su comportamiento) construye el formato de comida `{slot_id,nombre,ingredientes,kcal,proteina_g,carbohidratos_g,grasa_g,dishSlug}` que espera `finalizeNutritionDay()`, a partir del valor efectivo actual (`mealValue()`, que ya resuelve override > nutritionPlan > plan base).
- `applyChangeMeal()`: en la rama `ranked_item.rebalanceNeeded` con comidas futuras:
  - `lockedMeals` = todas las comidas del día salvo la cambiada y las futuras candidatas (`ranked_item.futureMeals`), más la comida recién elegida (con sus macros/ingredientes ya resueltos por `rankReplacementCandidates`). Esto reproduce exactamente el comportamiento previo de "solo se tocan las futuras candidatas": comidas ya hechas, editadas manualmente o anteriores al slot cambiado quedan congeladas igual que antes (antes ni se tocaban; ahora se marcan `locked` explícitamente, mismo resultado).
  - `proposal` = valor actual de cada comida futura candidata (mismo helper). Si trae `ingredientes`, `normalizeProposalMeal()` recalcula macros desde esos gramos (punto de partida realista); si no trae ingredientes, resuelve una porción nueva del mismo plato al target del slot. En ambos casos el plato (`dishSlug`) se conserva como punto de partida — "conservar plato" del alcance original.
  - `finalizeDayWithGate(ds,day,target,prefs,proposal,{lockedMeals})` ejecuta `globalClosePass()` sobre las líneas escalables de las comidas futuras (no bloqueadas) para cerrar el día completo por hill-climbing, en vez del reparto proporcional `-deltaKcal/n`.
  - El resultado (`finalized.comidas`) se mapea de vuelta a `ovr` por slot (`gen:true,nutritionPlan:true`, mismo shape que antes) y se registra en `contingencyLog` con `prevOvr`/`applied`, igual que la implementación anterior — el copy ("· N ajustada(s)") y el mecanismo de deshacer (`revertMeal`) no cambiaron.
  - Si `finalizeNutritionDay()` no devuelve `comidas` (defensivo; en la práctica no ocurre porque `ranked_item` implica `nd` y `DB.loaded`), cae al camino anterior con `rebalanceFutureMeals()` sin cambios — capa de compatibilidad pedida en el alcance.
- `js/nutrition-domain.js`: sin cambios. `rankReplacementCandidates`, `solveReplacement` y `rebalanceFutureMeals` siguen intactas y exportadas.

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `index.html` | `mealEntryForFinalize()` nuevo (compartido con `lockedMealsForDay()`); `applyChangeMeal()` conecta el rebalanceo a `finalizeDayWithGate()`/`finalizeNutritionDay()` con `rebalanceFutureMeals()` como capa de compatibilidad |
| `scripts/validate-nutrition-replacements.mjs` | Test 10 nuevo: arma el mismo `ctx` (lockedMeals = comida hecha + comida recién elegida; proposal = futuras) y verifica que `finalizeNutritionDay()` cierra los 4 slots, no toca las comidas locked y conserva plato en la comida futura cuando el cierre lo permite |

### Criterios de aceptación

- El reemplazo de una comida con rebalanceo pasa por `finalizeNutritionDay()`. ✓
- Los 9 casos originales de `scripts/validate-nutrition-replacements.mjs` siguen pasando sin modificar las funciones puras que prueban (`rankReplacementCandidates`/`solveReplacement`/`rebalanceFutureMeals` no cambiaron). ✓ (10/10 con el test nuevo)
- `node scripts/release-gate.mjs` pasa. ✓ (70/71; el único no bloqueante es "Sin modificaciones no intencionadas", esperado por el diff sin commitear de esta misma sesión)

### Verificación

- `node scripts/validate-nutrition-replacements.mjs`: 10/10 tests (9 originales + el nuevo de `finalizeNutritionDay()`).
- `node scripts/validate-nutrition-domain.mjs`, `node scripts/validate-finalize-nutrition-day.mjs`, `node scripts/validate-nutrition-finalize-wiring.mjs`, `node scripts/validate-diet-contract-runtime-notice.mjs`, `node scripts/validate-nutrition-coach-contract.mjs`: todos pasan sin cambios.
- `node scripts/release-gate.mjs`: 70/71 (ver criterios arriba).
- JS embebido: se extrajo el último bloque `<script>` de `index.html` y se validó con `new Function(...)` (parsea sin errores de sintaxis).
- No hay migraciones SQL ni cambios de shell PWA (no aplica subir `CACHE_NAME`).

## REQ-145 - Fix E2E: el fixture de entreno deja "hoy" sin sesión de fuerza los domingos y pone el release-gate en rojo

**Estado: implementado (2026-07-30).**

### Origen

Auditoría del journey **entrenamiento** (2026-07-05, domingo). `node scripts/release-gate.mjs` cerraba en rojo porque `tests/e2e/entreno.spec.js` esperaba una sesión de fuerza en gimnasio para hoy, pero el fixture podía dejar el domingo como descanso planificado.

### Problema

El test declaraba que "hoy es día de entreno con sesión de fuerza en gimnasio". En domingo, la app renderizaba `Descanso total` para el usuario E2E `strength_only` y el test hacía timeout esperando `Gimnasio ·`. Como la suite E2E forma parte del release gate, ambos loops autónomos quedaban bloqueados en domingos aunque no hubiese regresión del reproductor.

### Causa raíz

El bug era del fixture, no del runtime. `trainingDaysIncludingToday()` incluía hoy y tres días siguientes en orden cíclico Lunes..Domingo, pero la app vuelve a normalizar `trainingDays` con `WEEKDAY_OPTIONS` (`Lun..Dom`). Si hoy es domingo, queda último en el arreglo normalizado `[1,2,3,0]`. Con prioridad `composition`, el template upper/lower de 4 días es `["torsoA","piernaA","torsoB","facil"]`; para `strength_only` sin actividad ligera, `workoutSchedule()` convierte `facil` en `descanso`. Resultado: domingo = descanso.

### Decisión de producto

No se toca el comportamiento de producción: el descanso del cuarto slot para `strength_only` + `composition` sigue siendo intencional. El fixture E2E debe expresar mejor el invariante del test: si la spec quiere probar el reproductor de fuerza, el perfil de prueba debe pedir prioridad de fuerza.

### Solución implementada

- `tests/e2e/helpers.js`: `completePrefs()` usa `trainingPriority:"strength"`, cuyo template de 4 días es fuerza pura (`torsoA/piernaA/torsoB/piernaB`) para el split intermedio. Así, incluso si domingo queda último tras la normalización de la app, hoy no cae en `facil` ni `descanso`.
- `tests/e2e/helpers.js`: `trainingDaysIncludingToday(referenceDate = new Date())` acepta fecha inyectada para verificar los 7 días sin manipular el reloj global. El helper sigue devolviendo 4 días únicos e incluyendo hoy.
- `scripts/validate-e2e-training-fixture.mjs`: validador nuevo que importa las plantillas puras de `js/nutrition-pure.js`, reproduce la asignación relevante de `workoutSchedule()` y afirma que cada `getDay()` cae en un `STRENGTH_SESSION_IDS`.
- `scripts/release-gate.mjs`: agrega el validador nuevo al gate.
- `REQUIREMENTS.md`: la nota antigua de REQ-124 se corrigió para no afirmar que el caso domingo ya estaba cerrado; REQ-145 queda compactado en el hot path.

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `tests/e2e/helpers.js` | Perfil fixture con prioridad de fuerza; helper parametrizable por fecha |
| `scripts/validate-e2e-training-fixture.mjs` | Validador de los 7 días de semana |
| `scripts/release-gate.mjs` | Incluye el validador nuevo |
| `REQUIREMENTS.md` | REQ-145 implementado y compactado; nota de REQ-124 ajustada |
| `docs/requirements-history.md` | Detalle histórico de REQ-145 |

### Criterios de aceptación

- `npx playwright test tests/e2e/entreno.spec.js` pasa con el fixture actual. ✓
- El validador cubre los 7 posibles `getDay()` y confirma que hoy siempre cae en fuerza, incluido domingo. ✓
- No se modifica runtime de la app (`index.html`, `js/*.js`) para este arreglo. ✓
- `node scripts/release-gate.mjs` pasa. ✓

### Verificación

- `node scripts/validate-e2e-training-fixture.mjs`.
- `npx playwright test tests/e2e/entreno.spec.js --reporter=list`.
- `npx playwright test --reporter=list`.
- `node scripts/validate-docs-index.mjs`.
- `node scripts/release-gate.mjs`.

## REQ-155 - Fix reproductor de entreno: "duración real" cuenta el tiempo con la app cerrada

**Estado: implementado.**
`freezeInProgressWorkouts()` (`index.html`) trata el cierre/segundo plano como pausa implícita: en `visibilitychange` (oculto) y `pagehide`, congela `elapsedSeconds` y limpia `resumedAt` (misma `captureWorkoutElapsed()` que ya usa la pausa manual) para cualquier `workoutExecution` `in_progress`, y persiste con `commitDay`. Al volver, `WORKOUT_PLAYER.normalizeExecution()` ya resetea `resumedAt` a "ahora" porque queda en `null` (lógica preexistente de pausa/reanudación), así que el cronómetro retoma sin sumar el hueco. Detalle completo en el commit; compactado por el tope de `validate-docs-index.mjs`. Verificado con `tests/e2e/entreno.spec.js` (confirmado que el test falla exactamente como describe el REQ contra el código sin el fix).

### Origen

Auditoría del journey **entrenamiento** (2026-07-18). Verificación funcional del reproductor recuperable (REQ-16/92) con Playwright + fixtures E2E (0 llamadas pagadas).

### Problema

El usuario inicia una sesión guiada y la deja "En curso" sin tocar "Pausar sesión" (típico en móvil: la pantalla se bloquea, se cierra o se cambia de app, hay una interrupción). Al reabrir la app horas después y tocar "Finalizar y guardar sesión", el cronómetro y la tarjeta "duración real" cuentan todo el tiempo transcurrido —incluidas las horas con la app cerrada— como tiempo de entrenamiento. Reproducción: sesión iniciada, 0 actividad extra, `resumedAt` a 2 h atrás → el `.player-clock` muestra `02:00:00` y el registro guardado queda con `elapsedSeconds=7200` ("duración real: 2h 00m") para una sesión de minutos reales.

### Causa raíz

`WORKOUT_PLAYER.elapsedSeconds` (`workout-player.js:366-373`) suma `(now - resumedAt)` mientras el estado es `in_progress`. `resumedAt` solo avanza al reanudar (`index.html:4554,4746`) y el acumulado solo se congela al pausar (`captureWorkoutElapsed`, `index.html:4520-4522`). Nada congela el tiempo cuando la app se cierra o pasa a segundo plano con la sesión en curso; al reabrir, `normalizeExecution` (`workout-player.js:337`) conserva el `resumedAt` guardado para sesiones `in_progress`. `finishWorkoutExecution` (`index.html:4731`) persiste ese valor inflado como "duración real" en el resumen inmutable (`renderWorkoutExecution`, `index.html:4854`).

### Objetivo

Que "duración real" refleje el tiempo realmente ejercitado, no el reloj de pared con la app cerrada.

### Alcance

1. Tratar el cierre/segundo plano como pausa implícita del cronómetro: congelar `elapsedSeconds` y limpiar `resumedAt` en `visibilitychange`/`beforeunload`, o acotar el salto de `resumedAt` al reabrir antes de acumular.
2. Aplicar el mismo tope al valor que `captureWorkoutElapsed` persiste en el cierre.

### Fuera de alcance

- El diseño del reproductor recuperable y la pausa manual (siguen igual).
- Rachas/cumplimiento (no dependen de `elapsedSeconds`).

### Riesgos

- Un tope por inactividad puede subestimar sesiones largas legítimas; elegir umbral y evento de congelado con cuidado (`visibilitychange` vs. `beforeunload` en PWA/iOS).

### Criterios de aceptación

- Iniciar sesión, cerrar/segundo plano sin pausar y reabrir: cronómetro y "duración real" no incluyen el tiempo con la app cerrada.
- Pausar manualmente sigue congelando el tiempo como hoy.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Repro Playwright (0 llamadas pagadas): iniciar sesión, fijar `resumedAt` a 2 h atrás con la app "cerrada" y finalizar → `elapsedSeconds` acotado, no 7200; `.player-clock` no salta a `02:00:00`.

## REQ-156 - Fix aislamiento: el cierre de sesión por evento (token expirado / logout remoto / otra pestaña) no purga la cola offline del usuario anterior

**Estado: implementado.**
El handler `onAuthStateChange` (`index.html`) captura `prevUid=uid()` **antes** de reasignar `session=sess||null`, y lo pasa a `clearSignedOutState(prevUid)` en el evento `SIGNED_OUT`; sin ese cambio, `session` ya quedaba en `null` cuando `clearSignedOutState()` calculaba su propio `uid()`, y la purga de la cola offline del usuario saliente se saltaba. `clearSignedOutState(prevUid)` ahora acepta el uid como parámetro opcional (fallback a `uid()` si no se pasa), así que el botón "Cerrar sesión" y el borrado de cuenta —que llaman sin argumento mientras la sesión sigue seteada— quedan sin cambios. Detalle completo en el commit; compactado por el tope de `validate-docs-index.mjs`. Verificado con `tests/e2e/sync-isolation.spec.js` (dispara `supa.auth.signOut()` directo, el mismo evento que un token vencido o logout remoto; confirmado que el test falla exactamente como describe el REQ contra el código sin el fix).

### Origen

Auditoría del journey **auth-roles** (rotación del loop auditor tras REQ-155). Verificación funcional en navegador (preview `fitbud`, servidor local 8923, 0 llamadas pagadas), ejercitando las funciones reales de sesión de la app. El invariante bajo prueba es el aislamiento entre usuarios en un dispositivo compartido, declarado explícitamente en el código (`index.html:1824` "Descarta toda la cola del usuario al cerrar sesión (aislamiento entre usuarios en el dispositivo)." y `index.html:9622` "aislar cola: no exponer datos al próximo usuario") y en `docs/requirements-history.md:1539` ("La cola se aísla por usuario en `clearSyncQueueForUser()` al detectar cierre de sesión.").

### Problema

La purga de la cola offline (`fitbud_syncq_v1`, que contiene payloads de `day_log`/`weight_log` con datos de salud del usuario: peso, comidas, ejecución de entreno) **solo ocurre cuando el usuario pulsa "Cerrar sesión"**. Cualquier cierre de sesión que llegue por el evento `onAuthStateChange('SIGNED_OUT')` — token/refresh vencido al reabrir la app, revocación remota de la sesión, "cerrar sesión en todos los dispositivos", o logout propagado desde otra pestaña — **deja intactas en el `localStorage` del dispositivo las mutaciones encoladas del usuario anterior**, contradiciendo el invariante de aislamiento.

Reproducción funcional (ejecutada contra las funciones vivas de la app servida en 8923, sin sesión real ni mutación de producción):

1. Sembrar la cola con una mutación `day_log` del `userA` con datos de salud (`state.weights["2026-07-28"]=81.4`, `state.meals.m1={done:true,kcal:640}`) y `session={user:{id:"userA"}}`.
2. **Ruta A — botón "Cerrar sesión"** (orden real de `signOutUser`→`clearSignedOutState` con `session` aún seteada): entradas de `userA` en la cola pasan de `1 → 0` (purgada correctamente). ✔
3. **Ruta B — evento `SIGNED_OUT`** (orden real del handler: `session=sess||null` y luego `clearSignedOutState()`): entradas de `userA` pasan de `1 → 1`. **La cola con datos de salud de `userA` persiste.** ✘

Impacto: en un dispositivo compartido (familia, kiosco de gimnasio), tras un cierre de sesión no iniciado por el botón, los payloads de salud del usuario anterior quedan en el `localStorage` del dispositivo de forma indefinida y la cola crece sin acotar entre sesiones. No es una fuga visible en la UI del siguiente usuario —`drainSyncQueue` (`index.html:1933`) y `_updateSyncBadge` (`index.html:1862`) filtran por `x.uid===uid()`, así que `userB` no drena ni ve la cola de `userA`—, pero sí es una violación directa del invariante de aislamiento declarado y una retención de datos de salud personales en el dispositivo que el diseño promete borrar.

### Causa raíz

Dependencia de orden entre el handler del evento y `clearSignedOutState()`. El handler `onAuthStateChange` (`index.html:11385-11394`) hace primero `session=sess||null` (`index.html:11386`) y **después** `clearSignedOutState()` (`index.html:11388`). Pero `clearSignedOutState()` calcula el usuario a purgar leyendo la sesión: `const prevUid=uid();` (`index.html:9610`), y `uid()` devuelve `session&&session.user?session.user.id:null` (`index.html:9321`). Como el handler ya puso `session=null`, `prevUid` es `null`, y la purga `if(prevUid)clearSyncQueueForUser(prevUid)` (`index.html:9622`) se salta por completo; aunque no se saltara, `clearSyncQueueForUser(null)` filtra `x.uid!==null` (`index.html:1825-1826`), que **no** elimina las entradas del usuario real. La ruta del botón funciona solo por accidente de orden: `signOutUser` (`index.html:9637`) invoca `clearSignedOutState()` (`index.html:9644`) mientras `session` sigue seteada, por lo que ahí `prevUid` sí es correcto. La ruta de borrado de cuenta (`deleteMyAccount`→`clearSignedOutState`, `index.html:6512`) también conserva `session`, así que igualmente purga; el único camino defectuoso es el evento `SIGNED_OUT`.

### Objetivo

Que la cola offline del usuario que cierra sesión se purgue **en todos los caminos** de cierre (botón, borrado de cuenta y evento `SIGNED_OUT` por expiración/revocación/otra pestaña), cumpliendo el aislamiento entre usuarios que el código ya promete.

### Alcance

1. Purgar la cola con el `uid` correcto también en la ruta por evento. Opción mínima: en el handler `SIGNED_OUT` (`index.html:11388`), capturar `prevUid=uid()` **antes** de reasignar `session` (o pasar el `uid` a `clearSignedOutState`), y no nullificar `session` en `index.html:11386` hasta después de la purga.
2. Alternativa robusta: que `clearSignedOutState()` acepte un `prevUid` explícito (con fallback al `uid()` actual) para no depender del orden de asignación de `session`.

### Fuera de alcance

- El motor de sincronización, el filtrado por `uid` de `drainSyncQueue`/`_updateSyncBadge` (que ya evita la fuga en UI) y la lógica de conflictos.
- La limpieza de otras cachés por usuario (chat `fitbud_chat_v1_*`, etc.), que se resuelve por clave distinta de `uid` y no está en el alcance de este REQ atómico.
- El comportamiento del botón "Cerrar sesión" y de `deleteMyAccount`, que ya purgan correctamente.

### Riesgos

- Retrasar la nullificación de `session` en el handler podría afectar a código que corre entre medias; acotar el cambio a capturar `prevUid` primero y purgar, manteniendo el resto del orden.
- `drainSyncQueue` corre en `onAuth` del siguiente usuario; confirmar que la purga ocurre antes de que otro usuario inicie sesión (el handler es síncrono hasta `clearSignedOutState`, así que basta con el orden correcto).

### Criterios de aceptación

- Tras un evento `SIGNED_OUT` (token vencido / logout remoto / otra pestaña) con mutaciones encoladas del usuario saliente, `_getSyncQ().filter(x=>x.uid===prevUid).length === 0`.
- El botón "Cerrar sesión" y `deleteMyAccount` siguen purgando la cola como hoy.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Repro en consola contra las funciones vivas (0 llamadas pagadas): sembrar `_setSyncQ([{uid:"userA",entity:"day_log",…,status:"pending"}])`, fijar `session={user:{id:"userA"}}`, luego `session=null; clearSignedOutState();` y confirmar que la cola de `userA` queda vacía tras el fix (hoy queda en 1).
- Añadir un test de aislamiento (patrón `scripts/test-sync-conflicts.mjs`) que afirme la purga en el camino por evento.

## REQ-157 - Fix billing: renovar antes de vencer no acumula los días ya pagados

**Estado: implementado.**
`handleCheckoutCompleted()` (`api/webhook.js`) busca el entitlement vigente del usuario (`status in (active,courtesy)`, `expires_at>now`, el de vencimiento más lejano) antes de crear la fila nueva; usa `max(now, ese vencimiento)` como base tanto de `starts_at` como de `expires_at` (suma la duración del plan comprado desde ahí), en vez de contar siempre desde "ahora". Sin entitlement vigente el comportamiento es idéntico a hoy. Detalle completo en el commit; compactado por el tope de `validate-docs-index.mjs`. Verificado con `scripts/test-webhook-renewal.mjs` (3 casos: sin entitlement, 20 días vivos + mensual → ~50 días, trimestral vivo + mensual → ~120 días; confirmado que el caso de renovación falla exactamente como describe el REQ contra el código sin el fix).

### Origen

Journey `facturacion`: al recorrer compra→webhook→entitlement, una segunda compra ignora el entitlement activo del usuario.

### Problema

Con plan activo, volver a pagar (botón "Renovar plan", visible a ≤14 días; `index.html:6752`) crea un entitlement `starts_at=now, expires_at=now+duración` sin sumar el tiempo restante. Con 20 días vivos + mensual nuevo pasa de `now+20` a `now+30` (debería `now+50`): se pierden 20 días ya pagados. Peor: si el plan activo vence después que el nuevo (trimestral vivo + compra mensual), el GET (`order=expires_at.desc&limit=1`, `api/entitlement.js:248`) conserva la fila más larga y la compra suma 0 días de acceso.

### Causa raíz

`handleCheckoutCompleted` (`api/webhook.js:113-114`) calcula `expiresAt = now + PLAN_DURATION_DAYS[planId]` incondicionalmente; nunca consulta el entitlement activo del usuario para extender desde su `expires_at`.

### Objetivo

Recomprar/renovar suma la nueva duración al vencimiento vigente, sin perder días ni pagos.

### Alcance

1. En `handleCheckoutCompleted`, buscar el entitlement activo del usuario y usar `max(now, expires_at vigente)` como base de `starts_at`/`expires_at`.

### Fuera de alcance

- Reembolsos (REQ-148); prorrateo entre planes distintos.

### Riesgos

- Conservar el guard de idempotencia por `payment_ref` para no duplicar en reintentos de webhook.

### Criterios de aceptación

- Comprar con plan activo extiende desde el vencimiento vigente; ninguna compra resta días.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Arnés con `fetch` mockeado que envía un segundo `checkout.session.completed` mientras existe un entitlement activo y afirma `expires_at = vencimiento vigente + duración`.

## REQ-158 - Panel admin: "Cambiar contraseña" no protege a otros administradores (toma de cuenta entre admins)

**Estado: implementado.**
`setPassword` (`api/admin.js`) ahora resuelve `targetProfile` y rechaza con 409 cuando `userId!==caller&&targetProfile.is_admin` — mismo invariante que ya protegía `setActive`/`resetUserToOnboarding`; sobre uno mismo o un usuario normal sigue funcionando igual. `adminUsersHtml()` (`index.html`) deshabilita el botón "Cambiar contraseña" con el patrón `u.is_admin&&!me` (no `me||u.is_admin`, para no bloquear el cambio de la propia contraseña). Detalle completo en el commit; compactado por el tope de `validate-docs-index.mjs`. Verificado con `scripts/test-admin-api.mjs` (3 casos: otro admin rechazado, uno mismo y usuario normal aceptados; confirmado que el rechazo falla exactamente como describe el REQ contra el código sin el fix) y verificación visual manual de `adminUsersHtml()` con filas admin-propio/admin-ajeno/usuario normal.

### Origen

Auditoría del journey **administración** (panel "Usuarios"). Commit previo leído: `57a15b5` (REQ-145). Se revisó el guardado de acciones admin sobre otros administradores en `api/admin.js` y `index.html`.

### Problema

Un administrador puede fijar la contraseña de **otro** administrador (y luego iniciar sesión como él) sin ninguna barrera. REQ-126 dejó establecido el invariante de que las acciones sensibles del panel están "deshabilitadas para la propia cuenta y para otros administradores" (ver ledger de REQ-126). Ese invariante se cumple para "Desactivar" (bloquea al último admin y a uno mismo), "Regenerar plan" y "Reiniciar usuario" (deshabilitados para `me||u.is_admin`), pero **no** para "Cambiar contraseña", que es la acción más poderosa: cambia la credencial y habilita impersonación. Reproducción: como admin, abrir el panel de usuarios → en la fila de otro administrador, el botón "Cambiar contraseña" está activo → fijar una contraseña nueva → esa cuenta admin queda tomada. El servidor la acepta sin verificar que el objetivo sea admin ni distinto del que llama.

### Causa raíz

- API: la acción `setPassword` (`api/admin.js:730-744`) solo valida formato de UUID, longitud de contraseña y existencia del usuario; **no** comprueba `targetProfile.is_admin` ni `userId===caller`. Contrasta con `setActive` (`api/admin.js:702-705` self, `715-718` último admin), `resetUserToOnboarding` (`api/admin.js:431-435` self, `442-446` admin) y `prepareTestUser` (`api/admin.js:756-768`), que sí bloquean objetivos admin/self.
- UI: `adminUsersHtml` (`index.html:10231`) renderiza `Cambiar contraseña` sin el atributo `disabled` que sí aplica a Desactivar (`index.html:10230`, `me`) y a Regenerar/Reiniciar (`index.html:10235-10236`, `me||u.is_admin`).

### Objetivo

Un administrador no puede tomar la cuenta de otro administrador cambiándole la contraseña desde el panel; la protección de cuentas admin es consistente entre todas las acciones sensibles.

### Alcance

1. En `setPassword` (`api/admin.js`), rechazar (409) cuando el `userId` objetivo es admin y distinto del que llama; permitir que el admin cambie su propia contraseña.
2. En `adminUsersHtml` (`index.html`), deshabilitar el botón "Cambiar contraseña" para otras cuentas admin (patrón `u.is_admin&&!me`), conservándolo habilitado para la propia cuenta.

### Fuera de alcance

- "Enviar reset" (recuperación por correo que controla el propio usuario) y el resto de acciones ya guardadas.
- Rediseñar el modelo de roles o añadir niveles de admin.

### Riesgos

- No romper el caso legítimo de que un admin cambie su propia contraseña.
- Mantener alineadas la barrera de UI y la de servidor (el servidor es la que realmente protege).

### Criterios de aceptación

- `setPassword` sobre otro admin devuelve error y no altera la credencial; sobre uno mismo o sobre un usuario normal sigue funcionando.
- En el panel, "Cambiar contraseña" aparece deshabilitado en filas de otros administradores.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Extender `scripts/test-admin-api.mjs` con un caso: `setPassword` con `userId` de otro admin → rechazado; con el propio o con un usuario normal → aceptado.
- Evidencia funcional (esta auditoría): render de `adminUsersHtml` con `uid()` = admin-A y filas [admin-A, admin-B, usuario normal] → en la fila de admin-B, `Regenerar plan`/`Reiniciar usuario` salen `disabled` pero `Cambiar contraseña` y `Desactivar` quedan habilitados (screenshot del panel mock, 0 errores de consola).

## REQ-159 - El service worker cachea respuestas de error (404/500) y envenena el cache

**Estado: implementado.**
`service-worker.js` agrega `isCacheableResponse(response)` (ok, o `type==="opaque"` para no romper respuestas cross-origin sin CORS como el CDN) y la usa antes de todo `cache.put` en `cacheFirst`/`networkFirst`/`staleWhileRevalidate`; `networkFirst` además, si la red responde no-OK, prefiere la copia cacheada válida en vez de servir/guardar el error. `CACHE_NAME` subido a `v70`. Detalle completo en el commit; compactado por el tope de `validate-docs-index.mjs`. Verificado con `scripts/test-service-worker-cache.mjs` (2 casos nuevos: un 404 nunca queda cacheado y el servidor se autorepara al recuperarse; un 500 no sobrescribe un shell bueno ya cacheado; confirmado que ambos fallan exactamente como describe el REQ contra el código sin el fix).

### Origen

Journey `pwa`: verificación en navegador (SW `fitbud-pwa-v68` activo, servidor 8923). Distinto de REQ-150 (mezcla de versiones): aquí una respuesta **no-OK** se guarda y se sirve como buena.

### Problema

Ante un error transitorio (deploy en curso, hiccup del edge, URL de Storage vencida), el SW guarda la respuesta de error y la re-sirve hasta que cambie `CACHE_NAME`. En `cacheFirst` (assets, `.js` del shell, media de ejercicios), un 404/500 queda cacheado y se re-sirve aunque el servidor ya se recuperó: el asset/demo queda roto sin autorreparación. En `networkFirst` (navegación y `config.js`), un 500 de la red **sobrescribe** el último shell bueno; al recargar offline se sirve el 500 cacheado.

### Causa raíz

`service-worker.js`: `cacheFirst` (69-76), `networkFirst` (78-87) y `staleWhileRevalidate` (124-133) hacen `cache.put(request, response.clone())` **sin verificar `response.ok`**. `fetch` solo rechaza ante fallo de red, no ante 4xx/5xx, así que los errores entran al cache como válidos. No hay ningún check de `.ok`/`status` en el archivo.

### Objetivo

Que una respuesta de error nunca reemplace ni contamine una entrada de cache; el usuario nunca queda con un asset/shell roto de forma persistente por un error transitorio.

### Alcance

1. En los tres helpers, `cache.put` solo cuando `response && response.ok`.
2. En `networkFirst`, si la red responde no-OK, no sobrescribir el cache y preferir la copia cacheada válida.

### Fuera de alcance

- Mezcla de versiones HTML/JS (REQ-150), bump de `CACHE_NAME` y estrategia de `/api/*`.

### Riesgos

- No romper el precache del install (`addAll` ya falla atómico ante no-OK).
- Cuidar respuestas opacas (`type:"opaque"`, status 0) de CDN.

### Criterios de aceptación

- Un 404/500 no queda cacheado ni se re-sirve tras la recuperación.
- Un 500 en navegación no sobrescribe el shell bueno; offline sirve el válido.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Arnés que carga `service-worker.js` real con `fetch` mockeado 503/500: hoy `cacheFirst` re-sirve el 503 tras recuperación y `networkFirst` sobrescribe el shell bueno.
- Navegador: `fetch` a un asset mismo-origen inexistente → hoy `caches.match` en `fitbud-pwa-v68` devuelve un 404 cacheado.

## REQ-160 - Fix check-in semanal: el ajuste de calorías ignora las metas "volumen" y "mantenimiento"

**Estado: implementado.**
`analyzeCheckinAnswers()` (`index.html`) ramificaba por `goal==="surplus"`/`"maintain"`, vocabulario que el perfil nunca guarda (usa `deficit`/`mantenimiento`/`volumen`); ambas metas caían siempre en la rama de déficit. Cambiadas las dos comparaciones a `goal==="volumen"`/`"mantenimiento"`, sin tocar los umbrales/ajustes ya existentes (0.15–0.6 kg/sem sin ajuste en volumen, |Δ|>0.4 kg/sem corrige en mantenimiento) ni `CHECKIN_MAX_KCAL_ADJUST`/`CHECKIN_MIN_KCAL`. Detalle completo en el commit; compactado por el tope de `validate-docs-index.mjs`. Verificado con `scripts/test-checkin-goal-mapping.mjs` (ejecuta la función real extraída de `index.html` en `node:vm`, cubriendo las 3 metas; confirmado que volumen/mantenimiento fallan exactamente como describe el REQ contra el código sin el fix).

### Origen

Auditoría del journey de onboarding, siguiendo el valor `goal` (`#ob_goal`, index.html:2955-2957) hasta sus consumidores.

### Problema

El check-in semanal (REQ-20) ramifica por `goal==="surplus"`/`"maintain"`, pero el perfil solo guarda `deficit`/`mantenimiento`/`volumen`: ambas caen en el `else` (déficit). `volumen` ganando +0.4 kg/sem RECORTA 100 kcal/día ("El peso subió esta semana"), saboteando la masa; `mantenimiento` bajando -0.5 kg/sem no recibe ajuste (déficit tolera hasta -0.8). Solo `deficit` funciona.

### Causa raíz

`analyzeCheckinAnswers`, index.html:11187/:11191 ramifica por `surplus`/`maintain`; el vocabulario real es `deficit`/`mantenimiento`/`volumen` (`#ob_goal` :2955-2957; `buildWeightRanges` :1459 sí usa `volumen`).

### Objetivo

En volumen la ganancia esperada no recorta calorías; en mantenimiento la deriva se corrige en cualquier dirección.

### Alcance

1. Mapear las ramas al vocabulario real (o normalizar `goal`) en `analyzeCheckinAnswers`.
2. Cobertura determinista de las 3 metas.

### Fuera de alcance

- Umbrales kcal/kg y demás señales (hambre, energía, seguridad).

### Riesgos

- Cambia el ajuste para usuarios en curso; conservar `CHECKIN_MAX_KCAL_ADJUST`/`CHECKIN_MIN_KCAL`.

### Criterios de aceptación

- `volumen` ganando 0.15–0.6 kg/sem: `calorieAdjust===0`; <0.15: +kcal.
- `mantenimiento` con |Δ|>0.4 kg/sem: corrección en el signo esperado.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- `analyzeCheckinAnswers` con las 3 metas y pesos límite (arnés determinista, 0 llamadas).

## REQ-161 - Fix Home: marcar comidas "Sin asignar" (0 kcal) como hechas infla el contador y la racha

**Estado: implementado.**
`mealHasContent(v)` (`index.html`) centraliza el criterio de "contenido real" (nombre o algún macro), igual que ya exigía `homeDayHasPreparedMeals`. `toggleMeal()` ignora el intento de marcar como hecha una comida sin contenido (toast explicativo); el botón `.chk` en `mealCard()` sale `disabled` en ese caso. `dayTotals()` y `nutritionDayDone()` solo cuentan como cumplida la comida `done` que además tenga contenido real, como defensa adicional si `done:true` llegara por otra vía. Detalle completo en el commit; compactado por el tope de `validate-docs-index.mjs`. Verificado con `tests/e2e/home.spec.js` (confirmado que el test falla exactamente como describe el REQ contra el código sin el fix); ajustado el fixture de `tests/e2e/racha.spec.js` (REQ-146) para que sus días "cumplidos" simulen comidas con contenido real, ya que antes se apoyaba en el comportamiento que este REQ corrige.

### Origen

Journey `home` (Hoy), logueado con la suite E2E (REQ-96): día sin preparar → marcar los slots vacíos en Nutrición → volver a Home.

### Problema

En un día sin preparar cada slot se muestra "Sin asignar — … 0 kcal" pero con su check activo. Al tocar los tres checks (clics reales), Home se contradice en la misma pantalla: el anillo dice "0/2200 kcal · 3/3 comidas" y el header "🔥 1", mientras la agenda dice "Aún falta preparar este día". `nutritionDayDone`/`combinedDayDone` dan `true` con 0 kcal, así que la racha (métrica de retención) y los hitos se acreditan por días sin nutrición real.

### Causa raíz

`mealCard` (`index.html:4993`) pinta el botón `.chk` sin `disabled` aunque la comida esté vacía (`v.name` vacío, `v.kcal===0`) y `toggleMeal` (`index.html:5054`) alterna `ms.done` sin mirar contenido. Aguas abajo `dayTotals` (`index.html:2251`) la suma a `doneMeals`/`totMeals` y `nutritionDayDone` (`index.html:9346`) usa `done>=ceil(meals/2)` sobre el estado, no el contenido, así que `streak()`/`combinedDayDone` (`index.html:9416,9488`) suben. En cambio `homeDayHasPreparedMeals` (`index.html:3916`) sí exige contenido: por eso la agenda queda en "setup" y contradice al anillo.

### Objetivo

Una comida sin contenido no debe contar como cumplida (ni en "N/N comidas" ni en `nutritionDayDone`/racha/hitos), y Home no debe afirmar a la vez "N/N comidas + racha" y "aún falta preparar este día".

### Alcance

1. Impedir registrar una comida vacía: deshabilitar el check en `mealCard` cuando `mealValue` no tiene nombre ni macros, o que `toggleMeal` la ignore.
2. Que `dayTotals` y `nutritionDayDone` cuenten como cumplida solo la comida con contenido real.

### Fuera de alcance

- Divergencia `streak()` vs `streakStats().combCur` del día en curso (REQ-146); empty states (REQ-57); umbrales de hito.

### Riesgos

- No romper el registro de comidas ya preparadas, de extras (que sí tienen contenido) ni de días pasados ya marcados.

### Criterios de aceptación

- Con día sin preparar, marcar slots vacíos no acredita "N/N comidas" ni racha, y agenda y anillo coinciden.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Repetir el flujo del Origen: tras marcar los slots vacíos, Home no debe mostrar "3/3 comidas" ni "🔥 1", y la agenda no debe contradecir al anillo.


### Detalle preservado del ledger al preparar el backlog MFP (24 oct 2026)

**Estado: implementado.**

`mealHasContent(v)` (`index.html`) centraliza el criterio de "contenido real" (nombre o algún macro), igual que ya exigía `homeDayHasPreparedMeals`. `toggleMeal()` ignora el intento de marcar como hecha una comida sin contenido (toast explicativo); el botón `.chk` en `mealCard()` sale `disabled` en ese caso. `dayTotals()` y `nutritionDayDone()` solo cuentan como cumplida la comida `done` que además tenga contenido real, como defensa adicional si `done:true` llegara por otra vía. Detalle completo en el commit; compactado por el tope de `validate-docs-index.mjs`. Verificado con `tests/e2e/home.spec.js` (confirmado que el test falla exactamente como describe el REQ contra el código sin el fix); ajustado el fixture de `tests/e2e/racha.spec.js` (REQ-146) para que sus días "cumplidos" simulen comidas con contenido real, ya que antes se apoyaba en el comportamiento que este REQ corrige.

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-161`).

## REQ-162 - Fix Nutrición: la tarjeta y la suma del día muestran la receta base del catálogo, no los macros materializados del plan

**Estado: implementado.**
`mealValue()` y `mealRecipe()` (`index.html`) ahora priorizan `base.src==="nutritionPlan"` (con `base.kcal>0`/`base.ingredientes`) sobre la resolución por `dishName` en el catálogo, siempre que no haya un override que cambie de plato (`!o||o.dishName==null`) — si el usuario reemplazó la comida (REQ-154), esa ruta sigue ganando. Sin snapshot materializado, la resolución por catálogo sigue funcionando igual que antes (compatibilidad). Detalle completo en el commit; compactado por el tope de `validate-docs-index.mjs`. Verificado con `scripts/test-nutritionplan-priority.mjs` (4 casos: snapshot gana al catálogo en macros e ingredientes, un reemplazo explícito sigue ganando al snapshot, y sin snapshot la compatibilidad con catálogo no se rompe; confirmado que el caso principal falla exactamente como describe el REQ —165 vs 495 kcal— contra el código sin el fix).

### Origen

Auditoría del journey Nutrición. Tras "Preparar mi día" → "Aplicar al día", cada comida del snapshot `nutritionPlan` (REQ-82) se rinde con `mealValue()`/`mealRecipe()`. El planner escala las porciones al objetivo, pero la tarjeta muestra la receta base.

### Problema

Reproducción (catálogo cargado, `DB.loaded`): el plan materializa el Almuerzo en 495 kcal / P93 (300 g de pollo) y el usuario aprueba ese total en la revisión. En Nutrición la tarjeta muestra 165 kcal / P31 (100 g, receta base) y `dayTotals()` suma 165, no 495: anillo, "Consumo de hoy", % de meta y racha de adherencia cuentan la porción sin escalar (con platos mayores al objetivo, sobrecuenta). Afecta a todo plan cuyo `dishName` exista en el catálogo con macros distintos a los guardados. Además, editar la receta del catálogo luego muta días ya ejecutados que leen del snapshot (rompe historial inmutable).

### Causa raíz

`mealValue()` resuelve el plato por nombre ANTES que el snapshot: `if(dn&&DB.loaded){const d=dishByName(dn);…return dishMacros(d.id)}` (`index.html:2237`) devuelve la receta base y deja inalcanzable la rama materializada `if(base.src==="nutritionPlan"&&base.kcal>0)` (`index.html:2239`). Invierte el orden que fija REQ-82 (`nutritionPlan` primero, catálogo solo como compatibilidad). `mealRecipe()` (`index.html:4957-4962`) hace lo mismo con los gramos base en vez de `base.ingredientes`.

### Objetivo

Que una comida del plan muestre y sume los macros y gramos que el plan materializó, aunque el catálogo esté cargado.

### Alcance

1. En `mealValue()`, priorizar la rama `base.src==="nutritionPlan"` (con `base.kcal>0`) sobre la resolución por `dishName` en catálogo.
2. Igual en `mealRecipe()`: usar `base.ingredientes` del snapshot antes que la receta base de `DB.dishIng`.

### Fuera de alcance

- Overrides (`ms.ovr`) de "Cambiar comida" (REQ-154) y ediciones manuales, que ya tienen su ruta.
- El motor de escalado y el planner: el número materializado es correcto; falla la lectura.

### Riesgos

- Comidas de plan sin `base.kcal>0` deben seguir cayendo al catálogo como compatibilidad.
- No romper la resolución por nombre para comidas sin snapshot.

### Criterios de aceptación

- Tras aplicar el plan, tarjeta, receta desplegada y `dayTotals()` muestran los macros/gramos materializados del snapshot (± redondeo), no la receta base.
- Editar el catálogo no cambia días pasados renderizados desde snapshot.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Repro de runtime (0 pagadas): con `DB.loaded` y un plato cuya receta base ≠ macros del snapshot, `mealValue({src:"nutritionPlan",dishName,kcal:495},{})` debe devolver 495 (`src:"nutritionPlan"`), no `{kcal:165,src:"db"}`.


### Detalle preservado del ledger al preparar el backlog MFP (24 oct 2026)

**Estado: implementado.**

`mealValue()` y `mealRecipe()` (`index.html`) ahora priorizan `base.src==="nutritionPlan"` (con `base.kcal>0`/`base.ingredientes`) sobre la resolución por `dishName` en el catálogo, siempre que no haya un override que cambie de plato (`!o||o.dishName==null`) — si el usuario reemplazó la comida (REQ-154), esa ruta sigue ganando. Sin snapshot materializado, la resolución por catálogo sigue funcionando igual que antes (compatibilidad). Detalle completo en el commit; compactado por el tope de `validate-docs-index.mjs`. Verificado con `scripts/test-nutritionplan-priority.mjs` (4 casos: snapshot gana al catálogo en macros e ingredientes, un reemplazo explícito sigue ganando al snapshot, y sin snapshot la compatibilidad con catálogo no se rompe; confirmado que el caso principal falla exactamente como describe el REQ —165 vs 495 kcal— contra el código sin el fix).

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-162`).

## REQ-163 - Fix Entreno: una sesión abandonada en curso cuenta como entreno "hecho" e infla la racha

**Estado: implementado.**
`trainingDayResult()` (`index.html`) ya no cuenta "done" por `workoutHasRecordedActivity()` (cualquier bloque omitido o serie marcada, sin exigir cierre); ahora exige un resultado TERMINAL vía `workoutOutcomeForState(st)` (`completed`/`partial`) o el legado `st.workoutDone`. `workoutHasRecordedActivity()` no se tocó (otros usos, p. ej. protección de días en REQ-126, siguen queriendo detectar cualquier actividad). Detalle completo en el commit; compactado por el tope de `validate-docs-index.mjs`. Verificado con `tests/e2e/entreno.spec.js` (inicia sesión, omite un bloque y abandona sin finalizar; confirmado que el test falla exactamente como describe el REQ —"done" en vez de "missed"— contra el código sin el fix).

### Origen

Auditoría del journey Entreno. Al iniciar el reproductor y omitir un bloque (o marcar una sola serie) sin finalizar la sesión, el día ya cuenta como entreno cumplido para la racha, aunque el propio "Resumen" del día muestre "En curso".

### Problema

Reproducción funcional (Playwright + fixtures REQ-96, 0 llamadas pagadas): día de entreno de fuerza. Antes de tocar nada `trainingDayResult(hoy)="missed"` y `streakStats().trainCur=0`. El usuario pulsa "Iniciar sesión guiada", pulsa "Omitir bloque" una vez y abandona (nunca "Finalizar" ni "Terminar parcialmente"). Después: la sesión sigue `in_progress` (`workoutOutcomeForDay="in_progress"`, la tarjeta muestra "En curso · 0/6 bloques"), pero `trainingDayResult="done"` y `trainCur` sube a 1. Como `combinedDayDone` exige `trainingDayResult==="done"||"rest"`, en un día con la nutrición cumplida esa sesión abandonada completa la racha combinada y Home enciende 🔥 (y `checkAndSaveMilestones` puede otorgar hitos). La app se autocontradice: el día está "En curso"/pendiente pero la racha ya lo acreditó. Contradice REQ-23 (racha combinada = "entrenamiento hecho o descanso planificado"). Basta un bloque omitido o una serie marcada por día para sostener una racha sin entrenar de verdad.

### Causa raíz

`trainingDayResult(ds)` decide "done" con `workoutHasRecordedActivity(st)||!!st.workoutDone` (`index.html:9411`). `workoutHasRecordedActivity` (`index.html:4471-4477`) devuelve `true` ante cualquier `step.status==="done"||"skipped"` o cualquier `set.done`, **sin exigir un estado terminal** (`completed`/`partial`). Así una ejecución `in_progress`/`paused` con un solo bloque omitido ya se cuenta como día hecho en `streakStats()` (`:9431`), `combinedDayDone` (`:9419`) y `streak()` (`:9488`). El "Resumen" del día usa `workoutOutcomeForState` (`:5038`), que sí muestra "En curso" → divergencia visible.

### Objetivo

Que un día de entreno solo cuente como "hecho" para la racha cuando la sesión llegó a un cierre real (completa o parcial guardada), no por una sesión en curso o abandonada con bloques omitidos.

### Alcance

1. En `trainingDayResult()`, contar "done" solo si el resultado del día es terminal: `workoutOutcomeForState(st)` es `completed` o `partial` (o el legado `st.workoutDone`), no por mera actividad registrada de una sesión `in_progress`/`paused`.

### Fuera de alcance

- La divergencia `streak()` vs `streakStats().combCur` del día en curso (REQ-146) y las comidas vacías/nutrición (REQ-161): son otros caminos.
- Cambiar qué cuenta como "parcial" en el cierre (`finishWorkoutExecution`), ni la duración (REQ-155).

### Riesgos

- No romper el caso legítimo: una sesión finalizada como "parcial" debe seguir contando; un descanso planificado sigue siendo "rest".
- `workoutHasRecordedActivity` se usa además en otros lugares (p. ej. protección de días en REQ-126); acotar el cambio a `trainingDayResult` para no alterar esa protección.

### Criterios de aceptación

- Una sesión `in_progress`/`paused` (aunque tenga bloques omitidos o series sueltas) da `trainingDayResult="missed"` y no incrementa `trainCur` ni la racha combinada.
- Una sesión finalizada (`completed`/`partial`) sí cuenta como día de entreno.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- E2E: iniciar sesión, "Omitir bloque", no finalizar; comprobar `trainingDayResult(hoy)==="missed"` y `streakStats().trainCur` sin cambio, mientras la tarjeta sigue mostrando "En curso".


### Detalle preservado del ledger al preparar el backlog MFP (24 oct 2026)

**Estado: implementado.**

`trainingDayResult()` (`index.html`) ya no cuenta "done" por `workoutHasRecordedActivity()` (cualquier bloque omitido o serie marcada, sin exigir cierre); ahora exige un resultado TERMINAL vía `workoutOutcomeForState(st)` (`completed`/`partial`) o el legado `st.workoutDone`. `workoutHasRecordedActivity()` no se tocó (otros usos, p. ej. protección de días en REQ-126, siguen queriendo detectar cualquier actividad). Detalle completo en el commit; compactado por el tope de `validate-docs-index.mjs`. Verificado con `tests/e2e/entreno.spec.js` (inicia sesión, omite un bloque y abandona sin finalizar; confirmado que el test falla exactamente como describe el REQ —"done" en vez de "missed"— contra el código sin el fix).

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-163`).

## REQ-165 - Fix check-in semanal: las escalas sin responder se leen como el peor valor y disparan ajustes falsos

**Estado: implementado.**
`analyzeCheckinAnswers()` (`index.html`) neutraliza `answers.energy`/`answers.sleep` con `||3` (punto medio) en la rama de hambre/energía, igual que ya hacían nutrición/dificultad/recuperación — antes, `null<=2` evaluaba `true` y una escala nunca respondida se leía como "energía/sueño bajos", disparando mensajes y ajustes de calorías sobre datos inexistentes (incluso con `keep:true`). `hunger` no se tocó (su comparación `>=4` ya era segura ante `null`). Detalle completo en el commit; compactado por el tope de `validate-docs-index.mjs`. Verificado con `scripts/test-checkin-goal-mapping.mjs` (3 casos nuevos: check-in vacío → sin razón fantasma; hambre alta + energía/sueño sin responder = mismo ajuste que con energía/sueño altos; energía/sueño realmente bajos siguen generando el aviso; confirmado que fallan exactamente como describe el REQ contra el código sin el fix).

### Origen

Auditoría del journey retención → check-in semanal (REQ-20). Las 7 escalas 1–5 son opcionales; al enviar sin marcarlas, el motor de ajuste devuelve mensajes negativos y cambia calorías sobre respuestas que el usuario nunca dio.

### Problema

`readCiScale` devuelve `null` para una escala sin marcar, y en las comparaciones `null<=2` es `true` (0≤2) mientras `null>=4` es `false`. Repro determinista (meta déficit, 2000 kcal): (A) enviar el check-in sin marcar nada → propuesta `keep:true` ("Tu plan está bien calibrado") pero con razón "Energía y sueño bajos: prioriza el descanso…", contradicción visible en la misma tarjeta sobre campos jamás respondidos. (B) marcar solo hambre=5 y dejar energía y sueño en blanco → `+100 kcal/día` con "Hambre alta y energía baja: añadir calorías". Control (C) idéntico pero energía=5, sueño=5 → solo `+50 kcal`. Mismo hambre: el delta extra sale enteramente de tratar energía sin responder como baja, subiendo el objetivo calórico contra una meta de déficit por un dato inexistente.

### Causa raíz

`analyzeCheckinAnswers` (`index.html:11201`,`:11204`,`:11207`) compara `answers.energy`/`answers.sleep` crudos (null→0 en `<=`), mientras las ramas de fatiga/adherencia sí neutralizan con `||3` (`:11212`,`:11218`,`:11221`). `readCiScale` produce el `null` (`index.html:11166`). Manejo de "sin responder" inconsistente entre ramas.

### Objetivo

Una escala sin responder no debe contar como valor extremo ni generar mensajes/ajustes: se trata como neutral o se ignora esa rama.

### Alcance

1. En `analyzeCheckinAnswers`, normalizar las escalas ausentes (p. ej. `||3` o guarda de `!=null`) en las ramas de energía y sueño, igual que hambre/dificultad/recuperación/adherencia.
2. Que una razón negativa no coexista con `keep:true`.

### Fuera de alcance

- El mapeo de metas volumen/mantenimiento (REQ-160) y el coloreo de deltas (REQ-164): misma función/journey, otra causa.
- Hacer obligatorias las escalas del formulario.

### Riesgos

- Cambia el ajuste de usuarios en curso; conservar `CHECKIN_MAX_KCAL_ADJUST`/`CHECKIN_MIN_KCAL` y las demás ramas.

### Criterios de aceptación

- Enviar el check-in con energía/sueño sin marcar no produce "Energía y sueño bajos" ni suma calorías por esa vía; caso B iguala al control C.
- Ninguna propuesta con `keep:true` muestra una razón de déficit/molestia.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Arnés determinista (0 llamadas): `analyzeCheckinAnswers` con escalas en `null` vs marcadas altas; assertar mismos `calorieAdjust`/`details` salvo por lo realmente respondido.


### Detalle preservado del ledger al preparar el backlog MFP (24 oct 2026)

**Estado: implementado.**

`analyzeCheckinAnswers()` (`index.html`) neutraliza `answers.energy`/`answers.sleep` con `||3` (punto medio) en la rama de hambre/energía, igual que ya hacían nutrición/dificultad/recuperación — antes, `null<=2` evaluaba `true` y una escala nunca respondida se leía como "energía/sueño bajos", disparando mensajes y ajustes de calorías sobre datos inexistentes (incluso con `keep:true`). `hunger` no se tocó (su comparación `>=4` ya era segura ante `null`). Detalle completo en el commit; compactado por el tope de `validate-docs-index.mjs`. Verificado con `scripts/test-checkin-goal-mapping.mjs` (3 casos nuevos: check-in vacío → sin razón fantasma; hambre alta + energía/sueño sin responder = mismo ajuste que con energía/sueño altos; energía/sueño realmente bajos siguen generando el aviso; confirmado que fallan exactamente como describe el REQ contra el código sin el fix).

Detalle historico: `docs/requirements-history.md` (buscar `## REQ-165`).

## REQ-166 - La pasada global de cierre optimiza el contrato, no `scoreMacros()`

**Estado: implementado.**
`scoreDayAgainstContract()` (`js/nutrition-domain.js`) reemplaza a `scoreMacros()` como objetivo del hill-climbing de `globalClosePass()`: mide cada métrica en múltiplos de su propia tolerancia de `DIET_CONTRACT` y la eleva al cuadrado, así que las 4 pesan igual en unidades de contrato. No cambia qué plato se elige en ningún slot — `scoreMacros()` sigue siendo el score por comida de `solveDishPortion()`/`optimizeLines()`. Canario `validate-diet-contract.mjs`: 122/378 (32.3%) → 289/378 (76.5%), 34 dimensiones mejoran, **0 regresionan**, dimensiones al 100% de 5/54 a 38/54. Validador: `scripts/validate-global-close-objective.mjs`.

### Origen

Decisión de producto de Jonathan (2026-08-30) registrada en REQ-147, tras medir que el "techo de catálogo" de REQ-143 no era del catálogo.

### Problema

`globalClosePass()` (REQ-137) cierra el día repartiendo gramos entre las líneas escalables por hill-climbing, pero puntuaba con `scoreMacros()`, que pondera kcal ×1.4 y proteína hasta ×1.45 y deja carbohidratos y grasa en ×0.55. `DIET_CONTRACT` valida con tolerancias duras y simétricas (±3%/50 kcal, ±5 g proteína, ±8 g carbohidratos, ±8 g grasa). El cierre optimizaba una métrica que no era la que después lo evaluaba, y compraba precisión en kcal/proteína pagando con carbohidratos.

### Causa raíz

Objetivo desalineado, no falta de catálogo. Evidencia previa que quedaba sin explicación y ahora encaja: el 100% de los fallos de `carbs_contract` eran por exceso (`{n:133, pos:133, neg:0}`, sonda del 2026-07-08), nunca por déficit — el sesgo exacto que produce un peso ×0.55 en carbohidratos frente a ×1.4 en kcal.

### Objetivo

Que el cierre del día optimice la misma definición de "día correcto" que el contrato usa para juzgarlo, sin tocar la selección de platos.

### Alcance

1. `scoreDayAgainstContract(macros,target)` en `js/nutrition-domain.js`: suma de `(desvío / tolerancia_de_contrato)²` sobre kcal/proteína/carbohidratos/grasa, reutilizando `dietContractTolerance()`.
2. `globalClosePass()` puntúa con esa función en sus dos usos (score inicial y evaluación de cada paso).
3. `scoreMacros()` no se modifica ni cambia de rol: sigue eligiendo plato y resolviendo porción por comida.
4. Validador estructural y numérico `scripts/validate-global-close-objective.mjs` en el release gate.

### Fuera de alcance

- Selección de platos (`planDeterministicNutritionDay()`), pre-rankeo de candidatos y variedad semanal: sin cambios.
- Reinicios múltiples del hill-climbing: medidos (+0 días sobre el objetivo continuo) y descartados por no aportar.
- Catálogo (REQ-143), activación de contrato en runtime (REQ-139, ya activo como aviso suave), prompts y modelo.

### Riesgos

- **Continuidad del objetivo.** Un objetivo escalonado (plano dentro de tolerancia, salto al salir) deja al hill-climbing sin gradiente y lo clava en el punto de partida: medido 205/378 contra 289/378 del continuo. El validador cubre esta propiedad con asserts de monotonía estricta.
- Cambian los gramajes mostrados al usuario. Verificado en un día de muestra: mismos platos, límites de receta respetados, gramaje máximo incluso menor (335 g contra 360 g) y totales más cerca de la meta.

### Criterios de aceptación

- El canario sube sin regresionar ninguna dimensión sana. ✓ (34 mejoran, 0 empeoran, +167 días)
- La selección de plato por slot no cambia. ✓ (`scoreMacros()` intacto en `optimizeLines()`, verificado por el validador)
- `node scripts/release-gate.mjs` pasa. ✓

### Verificación

- `node scripts/validate-global-close-objective.mjs`, `node scripts/validate-diet-contract.mjs`, `node scripts/release-gate.mjs`.
- Diff por dimensión baseline contra implementación, con la matriz completa de 54 dimensiones.

## REQ-164 - Fix Progreso: la variación de peso on-target se pinta como advertencia en metas de volumen/mantenimiento

**Estado: implementado.**
`goalAwareDeltaColor(delta,goal)` (`index.html`) centraliza el color de `Δ peso (sem)`/`Δ grasa %` en `bodyComposition()` según `prefs.goal`: volumen (subir=bueno), mantenimiento (tolera hasta ±0.4, mismo umbral que el check-in de REQ-160), deficit/fallback (bajar=bueno, sin cambio de sentido). `composition()` no se tocó. Detalle completo en el commit; compactado por el tope de `validate-docs-index.mjs`. Verificado con `tests/e2e/progreso.spec.js` (meta volumen + 2 semanas de peso ascendente; confirmado que el test falla exactamente como describe el REQ —`var(--warn)` en vez de `var(--good)`— contra el código sin el fix).

### Origen

Journey `progreso`, sección "Peso corporal" → "Composición". Recorrido con meta `volumen` y ganancia de peso deliberada.

### Problema

En volumen, subir de peso es el objetivo del ciclo y `buildWeightRanges` prescribe un rango creciente, pero la tarjeta "Δ peso (sem)" pinta la ganancia como advertencia (ámbar) en vez de logro (verde), y "Δ grasa %" hace lo mismo. La pantalla se contradice: la tabla "Rango kg" sube semana a semana mientras el delta que la cumple sale en rojo/ámbar. En mantenimiento cualquier variación tiene el mismo sesgo "bajar=bueno". Solo `deficit` está bien coloreado.

### Causa raíz

`bodyComposition()` (index.html:5235-5236) fija el color sin mirar `prefs.goal`: `dKg<=0?var(--good):var(--warn)` y `dBf<=0?var(--good):var(--warn)`. `buildWeightRanges` (index.html:1459) sí es goal-aware (`deficit -.004`, `volumen +.002`, mantenimiento `0`).

### Objetivo

El color del delta refleja si el cambio va en la dirección del objetivo del usuario, coherente con el rango prescrito.

### Alcance

1. En `bodyComposition()`, derivar el color de `dKg`/`dBf` de la dirección esperada según `prefs.goal` (volumen: subir=bueno; déficit: bajar=bueno; mantenimiento: estabilidad, sin alarmar variaciones pequeñas).

### Fuera de alcance

- Umbrales del check-in (REQ-160) y el cálculo de racha (REQ-146).
- `recapDelta`/tarjetas neutras que ya muestran +/- sin juicio de color.

### Riesgos

- No invertir el sentido para `deficit` (regresión); mantener `composition()` intacto.

### Criterios de aceptación

- Meta `volumen` con Δ peso >0 on-target: la tarjeta usa `var(--good)`, no `var(--warn)`.
- Meta `deficit` con Δ peso <0: sigue en `var(--good)`.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- E2E: sembrar meta `volumen` + dos semanas de peso ascendente, abrir Progreso y assertar `color:var(--good)` en "Δ peso (sem)".

## REQ-167 - Fix activación de cuenta: "Auth session missing!" crudo al crear la contraseña desde una invitación

**Estado: implementado.**
`finishPasswordRecovery()` revalida la sesión del enlace con `getSession()` antes de `updateUser()`, bloquea el botón mientras trabaja y traduce el error a español; si la sesión ya no existe, muestra la pantalla "No pudimos abrir el enlace" con el siguiente paso.

### Origen

Reporte de Jonathan (2026-10-12) al dar de alta a una usuaria nueva por invitación: el formulario "Crea tu contraseña" se pintó, pero al pulsar "Activar cuenta" apareció `⚠️ Auth session missing!` y la contraseña no se guardó (login posterior: "invalid login credentials").

### Problema

El formulario se renderiza con la sesión del enlace, pero al enviar la sesión ya no estaba. La usuaria vio un error en inglés sin salida clara y podía pulsar varias veces.

### Causa raíz

`finishPasswordRecovery()` (`index.html`) llamaba `supa.auth.updateUser()` sin comprobar que la sesión siguiera viva ni proteger el doble envío, y mostraba `result.error.message` tal cual. La pérdida de sesión en sí (enlace de un solo uso consumido, vista previa del correo o doble toque) no se pudo reproducir sin un token real.

### Alcance

1. Guardia `_recoveryBusy` + botón deshabilitado durante el envío.
2. `getSession()` antes de `updateUser()`; sin sesión → pantalla de enlace inválido con mensaje accionable.
3. Mensaje en español para "session missing".

### Fuera de alcance

- Causa de la pérdida de sesión del enlace y configuración de SMTP/Redirect URLs de Supabase (el SMTP por defecto limitó los reintentos: "email rate limit exceeded").

### Criterios de aceptación

- Un enlace consumido o vencido nunca muestra texto en inglés y siempre indica el siguiente paso. ✓
- Un segundo toque mientras se guarda no dispara otra petición. ✓
- `node scripts/release-gate.mjs` pasa. ✓

## REQ-169 - Fix nutrición: lo descartado en el borrador del día vuelve al regenerar

**Estado: implementado.**

### Origen

Bug A reportado por Jonathan (2026-10-12): tras "no me gusta" en una comida, al regenerar el día el coach vuelve a sugerir lo mismo.

### Problema

1. "Otra opción" reemplazaba la comida, pero no la recordaba: el prompt solo decía "No repitas" con el borrador *actual*, así que la opción descartada podía volver en la siguiente ("A → B → A") o al regenerar el día.
2. "🚫 No me gusta" en el borrador la bloqueaba a futuro (`prefs.blockedDishes`), pero el plato seguía en el borrador y se podía aplicar igual.
3. Si el coach repetía un nombre bloqueado que no está en el catálogo, nada lo filtraba: el bloqueo solo actuaba sobre platos del catálogo y como texto en el prompt.

### Causa raíz

- `regenerateGenMeal()` y `generateOneDay()` (`index.html`) no tenían memoria de descartes de la sesión; `recentMealNames()` solo mira días anteriores.
- `blockGenDraftMeal()` no tocaba `window._genDay`.
- `normalizeProposalMeal()` (`js/nutrition-domain.js`) solo aplicaba `isDishBlockedByProfile()` cuando la propuesta coincidía con un plato del catálogo.

### Alcance

1. `SESSION_REJECTED_MEALS` (por día, en memoria) alimentado por "Otra opción", "No me gusta" del borrador y "No me gusta" de una comida aplicada.
2. `prefsWithSessionRejections()` suma los descartes a `blockedDishes` en la referencia de platos, el fallback determinista y `finalizeNutritionDay()`; `coachRejectedMealsLine()` los lista en el prompt del día y de "Otra opción"; `rejectionScope()` evita que la reutilización de respuestas sirva una guardada antes del descarte.
3. `mealNameBlockedByProfile()` en el dominio: una propuesta fuera de catálogo con nombre bloqueado/descartado se reemplaza (`dish_blocked_by_user`).
4. "No me gusta" en el borrador reemplaza el plato al instante con el catálogo, sin consumir opciones del coach.

### Fuera de alcance

- Persistir descartes "suaves" entre sesiones (los permanentes ya viven en `prefs.blockedDishes`).

### Criterios de aceptación

- Con un plato descartado, el siguiente prompt lo lista y el borrador no lo contiene aunque el coach lo repita. ✓ (`tests/e2e/descartes.spec.js`)
- Un descarte bloquea tanto propuestas inventadas como platos del catálogo y el fallback. ✓ (`scripts/validate-session-rejections.mjs`)

## REQ-170 - Fix nutrición: platos de almuerzo propuestos para el desayuno

**Estado: implementado.**

### Origen

Bug B reportado por Jonathan (2026-10-12): el coach sugiere platos contundentes (arroz con pollo, lomo, guisos) en el desayuno.

### Problema

REQ-131/132 filtran por `compatible_slots`/`meal_weight`, pero solo cuando la comida propuesta coincide por nombre exacto con un plato del catálogo. Las propuestas del coach casi nunca coinciden, así que pasaban sin ningún chequeo de momento del día.

### Causa raíz

- `normalizeProposalMeal()` y `validateGeneratedDay()` solo validan slot/peso dentro de `if(dish)` / `if(matchedDish)`.
- En producción, además, `dishes` no tiene `compatible_slots`, `meal_weight`, `meal_form`, `cuisine_tags` ni `slug` (la migración `supabase/nutrition_catalog_semantics.sql` no está aplicada) y tiene 50 platos, no los lotes de REQ-135/140 del seed.
- El mock E2E del coach proponía "Bowl de pollo con arroz" como desayuno y la suite lo aceptaba.

### Alcance

1. `slotMomentTextConflict()` en el dominio: compara el **nombre** (por tokens) contra platos de almuerzo/cena (`arroz con`, `con arroz`, `lomo`, `saltado`, `guiso`, `chaufa`, `menestra`…) para desayuno (salvo que sea la comida principal), media mañana, merienda y recena. No mira ingredientes: "galletas de arroz" o huevos rancheros con frijoles son válidos.
2. `normalizeProposalMeal()` reemplaza esas propuestas por el fallback del catálogo (`slot_moment_heuristic`); `regenerateGenMeal()` cae al plato de catálogo más cercano; el borrador explica el cambio.
3. Arquetipo de desayuno del prompt reforzado: "huevos, avena, yogur, frutas, tostadas o batidos… NUNCA platos contundentes como arroz con pollo, lomo, guisos".
4. Mock E2E del coach con un desayuno real.

### Fuera de alcance

- Aplicar `supabase/nutrition_catalog_semantics.sql` y los lotes de catálogo en producción (acción manual del usuario; sin eso los platos del catálogo siguen filtrándose solo por `slot`).

### Criterios de aceptación

- "Arroz con pollo casero" propuesto como desayuno no llega al borrador. ✓ (E2E)
- Ningún plato del catálogo apto para un momento ligero queda marcado como contundente. ✓ (`validate-session-rejections.mjs`)

## REQ-180 - Rebranding Fitbros → Evolv (dirección "Escala")

**Estado: implementado.**

### Origen

Decisión de Jonathan (2026-10-14): renombrar la marca a Evolv y adoptar la dirección C "Escala" de la exploración de marca (casi negro + lima eléctrica, Unbounded + Manrope, ícono de tres escalones). Modo oscuro por defecto.

### Alcance

1. Tokens (`index.html :root`): lima `#D6FF3A` como acento con `--on-accent:#101010` (texto oscuro sobre lima), azul señal `#3A7BFF` como secundario, superficies carbón/grafito, texto `#F2F2EE`/`#A8A8A0`. Se conservan los nombres `--purple-*`/`--terra-*` (ahora escala lima/azul) para no reescribir reglas. Fondos de acento con texto blanco pasan a `--on-accent`; avatar y botón del tour corregidos por contraste.
2. Tipografías: Unbounded (display) y Manrope (texto) vía Google Fonts.
3. Logo: `brandMark()` (escalones) + `brandWordmark()` ("evol" + "v" lima) en portada y pantallas de acceso; íconos PWA 180/192/512 regenerados dentro de la zona segura maskable.
4. Textos visibles "Fitbros" → "Evolv" (app, manifiesto, notificaciones push, beta, PRIVACY.md, README); tagline "Tu mejor versión, un día a la vez."; atribución de ejercicios propios "Evolv Studio" (catálogo local y 9 filas en producción).
5. Portada: hero con el tagline como titular y logo en la barra.
   Unbounded solo en titulares grandes (`h1,h2`, hero, secciones de la portada), marca y números grandes (kcal, racha, precios); nombres de comidas/ejercicios, botones, `h3` y títulos de tarjeta usan Manrope en peso fuerte para no partir textos largos.
6. Se conservan identificadores internos (`fitbros_tour_v1`, `startFitbrosTour`, `fitbros_test_user`, lock de los loops) para no resetear estado de usuarios ni romper herramientas.

### Fuera de alcance (pendiente)

- Dominio `evolv.vercel.app` (renombrar proyecto o agregar dominio en Vercel) y URLs de Supabase Auth/correos.
- Remitente y plantillas de correo con la marca Evolv.

### Criterios de aceptación

- Release gate y E2E en verde; capturas a 390 px de portada, login, Hoy y Entreno revisadas. ✓

## REQ-181 - Admin: el modal "Consumo" no precarga la cortesía vigente y la sobrescribe al guardar

**Estado: implementado.**
`openAdminUserQuota`/`fillAdminQuotaFields` precargan límite, bonus, disponibilidad y expiración desde `adminQuotaCache.overrides` (cambia también al cambiar de acción); `saveAdminUserQuota` ahora envía `expiresAt`. `loadAdminQuotaOverview` lista las cortesías activas. Detalle en el commit.

### Origen

Auditoría journey administración (commit previo 45bb2ce). Panel admin → tarjeta de usuario → "Consumo".

### Problema

`quotaOverview` devuelve `overrides` (cortesías por usuario), pero el cliente nunca los muestra ni los precarga. Al abrir "Consumo" de un usuario con override vigente (p. ej. límite 5, 50 unidades extra, activa, expira 2026-12-01), el formulario aparece vacío (límite "Heredar", bonus 0, "Heredar política"). Si el admin solo quería ajustar un campo y pulsa "Guardar cortesía", se envía `dailyLimit:""`, `bonusUnits:0`, `enabled:null` → el upsert `on_conflict=user_id,action` (merge-duplicates) reescribe `daily_limit=null, bonus_units=0, enabled=null, expires_at=null`, borrando la cortesía en silencio.

### Causa raíz

`openAdminUserQuota()` (`index.html:~10831`) arma el modal solo desde `policies`; ignora `adminQuotaCache.overrides`. `adminQuotaCache.overrides` está poblado pero no se consume en ninguna parte (`index.html`). El upsert full-row vive en `setQuotaOverride` (`api/admin.js:590`).

### Objetivo

El admin ve la cortesía vigente y editarla no destruye valores no tocados.

### Alcance

1. Precargar en el modal el override existente (`overrides.find(user_id,action)`): límite, bonus, disponibilidad y expiración.
2. Mostrar las cortesías activas en el panel (`loadAdminQuotaOverview`) usando `overrides`.

### Fuera de alcance

- Políticas generales, reset de consumo, otras acciones admin.

### Riesgos

- Reescribir la ruta de guardado sin romper la creación de overrides nuevos.

### Criterios de aceptación

- Reabrir "Consumo" muestra los valores vigentes; guardar sin cambios los conserva.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Seed de override (bonus 50, expira 2026-12-01), abrir "Consumo", guardar; confirmar que el override no cambia.

## REQ-184 - Seguridad: el sitio público no publica los archivos internos del repositorio

**Estado: implementado.**

### Origen

Auditoría de la web pública (2026-10-16). Con `outputDirectory: "."` y sin build, Vercel servía como estáticos todos los archivos del repo: `https://evolvapp.club/NEGOCIO.md`, `/REQUIREMENTS.md`, `/CONTEXT.md`, `/STRIPE_SETUP.md`, `/agent-loop.json`, `/docs/architecture-reference.md`, `/estrategia/*.md`, `/supabase/admin.sql`, `/scripts/*.mjs` y `/tests/e2e/*` respondían 200. No había secretos (solo placeholders), pero sí estrategia de negocio, esquema SQL con políticas RLS y las reglas de los agentes.

### Alcance

1. `.vercelignore` en modo allowlist: ignora todo (`/*`) y reincluye solo lo que el runtime carga: `index.html`, `beta-reclutamiento.html`, `config.js`, `service-worker.js`, `manifest.webmanifest`, los módulos JS de la raíz, `js/`, `assets/` (de `assets/ux-audit-2026-06-23/` solo `04-home-mobile.png`, que usa la página de beta), `api/`, `package.json`, `package-lock.json` (dependencias de las funciones) y `vercel.json`.
2. `scripts/validate-deploy-allowlist.mjs` (en el release gate) evalúa el `.vercelignore` con semántica gitignore sobre `git ls-files` y falla si: falta algún archivo que el runtime carga (`<script src>`/`href` locales de las páginas, `APP_SHELL` del service worker, `api/*.js`), o se despliega un archivo no declarado como público. Un archivo nuevo obliga a decidir explícitamente si se publica.

### Fuera de alcance

- Las capturas de `assets/ux-audit-2026-06-23/` siguen versionadas; solo dejan de publicarse.
- Los demás hallazgos de la auditoría (avisos legales preliminares, accesibilidad de formularios, etc.) van en REQ propios.

### Criterios de aceptación

- `curl -I https://evolvapp.club/NEGOCIO.md` (y `/REQUIREMENTS.md`, `/supabase/admin.sql`, `/scripts/release-gate.mjs`) devuelve 404 tras el deploy.
- La landing, la app, `/beta-reclutamiento.html`, `/service-worker.js` y `/api/catalog` siguen respondiendo 200.
- `node scripts/validate-deploy-allowlist.mjs` pasa y está en `release-gate.mjs`.

## REQ-185 - Fix Entreno: una serie sin marcar deja la sesión "parcial" sin forma de corregirla

**Estado: implementado.**

`pendingPrescribedSets()` y `markWorkoutSetDone()` (`index.html`) centralizan qué falta; "Siguiente ejercicio" abre `openPendingSetsPrompt()`; el cierre lista lo pendiente con "Marcarla(s) como hecha(s)" (`fillPendingWorkoutSets()`, conserva lo respondido); `reviewPendingWorkoutSets()` reabre una sesión parcial de hoy en el ejercicio pendiente; `strengthTotals()` (`workout-player.js`) cuenta las extra solo si se hicieron. `CACHE_NAME` → `fitbud-pwa-v80`. Además, `gotoApp()` (`tests/e2e/helpers.js`) espera a que termine `onAuth()`: su `view="hoy"` final pisaba la navegación y hacía fallar de forma intermitente los E2E de Entreno.

### Origen

Feedback de Claudia (beta, 2026-10-16, día Pull): "Cuando le voy a guardar la sesión, no sé por qué se me guarda parcialmente, pero no me deja terminar de cerrarla como completada". Captura del resultado: 7/7 bloques completados, 16/17 series registradas, 0 bloques omitidos → "Sesión parcial". En otra captura, la Serie 2 del último ejercicio (curl martillo, 2 series) sigue en "Marcar hecha".

### Problema

1. "Siguiente ejercicio" avanza con series prescritas sin marcar y sin avisar.
2. Al finalizar, una sola serie sin marcar convierte la sesión en parcial (el modal se titula "Cerrar sesión parcial" sin decir por qué).
3. Una vez guardada, no hay cómo corregirla: "Continuar sesión" no aparece porque no quedan bloques pendientes.

### Causa raíz

- `completeWorkoutStep()` (`index.html`, ~l. 4683) solo exige `completed>=1` serie.
- `workoutFullyCompleted()` (~l. 4770) exige `step.sets.every(set=>set.done)`, incluidas las series extra añadidas y no hechas (REQ-168).
- `renderWorkoutExecution()` (~l. 4993) muestra "Continuar sesión" solo si `progress.remaining>0`; `resumePartialWorkout()` salta al primer bloque `pending`, que no existe.

### Objetivo

Que quien hizo todo pueda cerrar la sesión como completada, y que la app diga qué falta cuando no.

### Alcance

1. "Siguiente ejercicio" con series prescritas sin marcar: hoja con "Marcar las N restantes como hechas" (usa reps/RPE objetivo como hace `toggleWorkoutSet`) o "Avanzar sin registrarlas".
2. Modal de cierre: si faltan series, listar cuáles ("Curl martillo · Serie 2") con botón "Marcarlas como hechas" antes de guardar.
3. Las series extra (`setIndex>=prescribedSets`) sin hacer no cuentan para `workoutFullyCompleted()` ni en "series registradas".
4. En una sesión parcial sin `needsReview` con series pendientes, ofrecer "Revisar series" aunque `progress.remaining===0`, llevando al ejercicio con la serie pendiente.

### Fuera de alcance

- Cambiar la regla de seguridad: dolor o malestar sigue guardando parcial con `needsReview`.
- Editar sesiones de días anteriores (historial inmutable).

### Riesgos

- La racha usa `completed`/`partial` como terminal (REQ-163); no debe cambiar qué días cuentan.

### Criterios de aceptación

- Escenario de Claudia (7/7 bloques, 1 serie prescrita sin marcar): desde el modal de cierre se marca y se guarda "Sesión completada". ✓
- Una serie extra sin hacer no impide "completada". ✓
- Una sesión ya guardada parcial con series pendientes se puede reabrir y cerrar completada el mismo día. ✓
- `tests/e2e/entreno.spec.js` cubre los tres casos (fallan contra el código previo); `node scripts/release-gate.mjs` pasa. ✓

### Verificación sugerida

- Playwright con fixtures: iniciar, marcar todas menos una, "Siguiente ejercicio" hasta el final, finalizar → aparece la lista de series pendientes.

## REQ-186 - Fix Entreno: el cronómetro de descanso se queda congelado

**Estado: implementado.**

Causa real (reproducida en `tests/e2e/entreno.spec.js`): `pushDay()` reemplazaba `S.days[ds]` con la copia enviada al recibir la respuesta. Marcar una serie dispara dos guardados (serie hecha → descanso); si el primero responde último, el estado vuelve a "sin descanso" mientras la pantalla sigue en "01:59 · Pausar" y el tick, Pausar y Omitir dejan de actuar. Fix: `pushDay()` ya no reemplaza el día; `pullDay()`/`pullAllDays()` descartan una lectura si el día cambió mientras viajaba (`_dayCommitSeq`); el tick re-renderiza si la pantalla muestra un descanso que el estado no tiene y ya no depende de `session`; al volver a primer plano (`visibilitychange`, `pageshow`) se re-sincroniza el reproductor. `CACHE_NAME` → `fitbud-pwa-v81`.

### Origen

Feedback de Claudia (2026-10-16): "el cronómetro de descanso hay veces que no sé por qué se queda pegado". Captura: "Descanso 01:00" con el botón "Pausar" visible (corriendo) tras marcar la Serie 1.

### Problema

A veces el descanso no baja de su valor inicial aunque figura en marcha. No se ha reproducido todavía.

### Causa raíz

Por confirmar. Fragilidades verificadas en el código:

1. La cuenta atrás solo avanza con `setInterval(workoutTimerTick,1000)` (`index.html` ~l. 12163), y `workoutTimerTick()` (~l. 4824) sale sin hacer nada si `view!=="entreno"`, si `session` es `null` (p. ej. durante un refresco de token) o si `normalizedWorkoutExecution(current)` devuelve `null`.
2. Al ocultar la app se congela el tiempo (`visibilitychange`/`pagehide`, ~l. 12185), pero al volver no se reconcilia ni se re-renderiza; en la PWA de iOS los intervalos pueden quedar suspendidos tras bloquear la pantalla.
3. `pullDay()` (~l. 10483) reemplaza `S.days[ds]` entero con el estado remoto si no hay push pendiente; un `syncDay()` al volver puede pisar el temporizador local con uno más viejo.

### Objetivo

Que el descanso siempre muestre el tiempo real restante y termine solo, aunque la app se bloquee, pase a segundo plano o sincronice.

### Alcance

1. Reproducir primero (Playwright con reloj simulado + eventos de visibilidad + `pullDay` concurrente) y documentar la causa real en este REQ.
2. Corregir la causa encontrada. Mínimo: el tick no depende de `session`; al volver a primer plano (`visibilitychange`, `pageshow`, `focus`) se recalcula y re-renderiza el temporizador; un descanso vencido en segundo plano se cierra al volver.
3. Un `pullDay()` no pisa una ejecución `in_progress` local con un `updatedAt` remoto más viejo.

### Fuera de alcance

- Sonido, vibración o notificación al terminar el descanso (otro REQ).

### Riesgos

- Tocar `pullDay()` afecta la sincronización de todo el día: limitar el cambio a `workoutExecution` y cubrirlo con `scripts/test-sync-*`/`sync-conflicts.js`.

### Criterios de aceptación

- Test que reproduce el congelamiento antes del fix y pasa después. ✓
- Simular el descanso + 30 s oculto con los intervalos suspendidos: al volver, el descanso está terminado. ✓
- `node scripts/release-gate.mjs` pasa. ✓

### Verificación sugerida

- Prueba manual en iPhone (PWA instalada): marcar serie, bloquear 30 s, desbloquear → el contador sigue bajando con el tiempo real.

## REQ-187 - Entreno: descanso cronometrado entre ejercicios (2:00 por defecto, configurable)

**Estado: implementado.**

Decisión de Jonathan (2026-10-16): 2:00 por defecto y configurable por usuario. `profile.prefs.betweenExerciseRestSeconds` (60–300 s, normalizado en `migrateProfilePrefs()`), editable en Perfil → Entreno. `toggleWorkoutSet()` arranca el descanso `{kind:"rest",transition:true}` al completar todas las series si sigue otro ejercicio de fuerza; `completeWorkoutStep()` lo conserva (o lo arranca si se avanzó por otra vía) y lo anula si sigue la vuelta a la calma. `CACHE_NAME` → `fitbud-pwa-v82`.

### Origen

Feedback de Claudia (2026-10-16): "Echo de menos que entre ejercicio y ejercicio aparezca un contador de dos minutos de descanso… solo hay entre serie".

### Problema

El descanso cronometrado solo aparece entre series del mismo ejercicio. Tras la última serie, y al pasar al siguiente ejercicio, no hay contador.

### Causa raíz

`toggleWorkoutSet()` (`index.html` ~l. 4717) arranca el descanso solo si `setIndex<step.sets.length-1`, y `completeWorkoutStep()` (~l. 4688) pone `execution.timer=null` al avanzar.

### Objetivo

Que al terminar un ejercicio de fuerza empiece un descanso cronometrado que acompaña al siguiente ejercicio.

### Alcance

1. Al marcar la última serie de un ejercicio de fuerza seguido de otro de fuerza, arrancar un descanso de transición (`kind:"rest"`) con la duración elegida por el usuario (2:00 por defecto).
2. `completeWorkoutStep()` conserva un descanso en curso; el siguiente ejercicio lo muestra como "Descanso entre ejercicios" con Pausar/+15 s/Omitir.
3. Marcar la primera serie del siguiente ejercicio cierra el descanso de transición y arranca el normal.
4. Tras el último ejercicio de fuerza (sigue la vuelta a la calma) no se arranca descanso.
5. Mostrar el descanso entre ejercicios en el resumen previo (REQ-174) y subir `CACHE_NAME`.

### Fuera de alcance

- Cambiar los descansos que prescribe el plan.

### Riesgos

- Depende de que el temporizador sea fiable: implementar después de REQ-186.
- No alargar la "duración real": el descanso no altera `elapsedSeconds`.

### Criterios de aceptación

- Al marcar la última serie del ejercicio 1 aparece "Descanso entre ejercicios 02:00"; tras "Siguiente ejercicio" sigue visible y bajando en el ejercicio 2. ✓
- "Omitir" lo quita; marcar una serie del ejercicio 2 lo reemplaza por el descanso entre series. ✓
- Tras el último ejercicio de fuerza no aparece descanso entre ejercicios. ✓
- Elegir 1:30 en Perfil se guarda en `prefs` y Entreno lo muestra. ✓
- `node scripts/release-gate.mjs` pasa. ✓

### Verificación sugerida

- Playwright en `tests/e2e/entreno.spec.js` con reloj simulado; captura a 375px.

## REQ-188 - Nutrición: reutilizar comidas recientes y favoritas, y registrar alimentos sueltos por gramos

**Estado: implementado.**

Decisión de Jonathan (2026-10-16): favoritas en el perfil, sin migración. `editorSheet()` (`index.html`) abre con pestañas Recientes (`recentCustomMeals()`: lo escrito por el usuario en `ms.ovr` sin `dishName`/`gen` y `extras`, últimas 20 distintas) · Favoritas (`profile.prefs.savedMeals`, `normalizedSavedMeals()`, máx. 50, guardado con `saveProfilePrefs(...,{skipPlanVersion:true})`; fuera de `planSnapshotFields()`, no crea versiones de plan) · Alimento (`DB.ingredients` por 100 g, búsqueda sin tildes, suma varios alimentos). Porción ×0,5/×1/×1,5/×2 y "Guardar en favoritas" al guardar. `CACHE_NAME` → `fitbud-pwa-v83`.

### Origen

Feedback de Claudia (2026-10-16): come muchas veces lo mismo y quiere no volver a meter esa comida, con "un histórico de cosas que he metido o que quiero guardar en favoritos"; seleccionar y que se pongan los macros. También alimentos sueltos, no solo platos enteros.

### Problema

Cada comida personalizada o extra se escribe desde cero (descripción + macros o estimación). No hay recientes, favoritos ni forma de sumar un alimento del catálogo por gramos.

### Causa raíz

`editorSheet()`/`saveEditor()` (`index.html` ~l. 7880–7910) guardan el valor solo en el día (`ms.ovr` o `dayState(ds).extras`); nada lo indexa para reutilizarlo. El catálogo `ingredients` (macros por 100 g, `supabase/schema.sql`) solo se usa dentro de recetas.

### Objetivo

Registrar una comida repetida en dos toques y un alimento suelto sin calcular macros a mano.

### Alcance

1. Fase A — recientes y favoritas (sin migración):
   - "Recientes": últimas 20 comidas distintas (por nombre normalizado) de `ms.ovr` y `extras` en `S.days`, con buscador.
   - Estrella "Guardar en favoritas" al guardar y en la lista; persistir en `profile.prefs.savedMeals` (máx. 50, `{name,kcal,p,c,f}`) vía `saveProfilePrefs()`.
   - En `editorSheet()`, arriba: pestañas "Recientes · Favoritas"; tocar una precarga nombre y macros, con porción ×0.5/×1/×1.5/×2.
2. Fase B — alimento suelto: pestaña "Alimento" que busca en `DB.ingredients`, pide gramos y calcula kcal/macros (`valor×g/100`); se guarda como extra o como override igual que hoy.
3. Cada fase en su propio commit si el implementador lo prefiere (mismo REQ).

### Fuera de alcance

- Escáner de código de barras o bases externas de alimentos.
- Que los favoritos cambien el plan generado.

### Riesgos

- Privacidad: favoritos y recientes son datos del usuario; nada a analytics.
- `profile.prefs` crece: limitar a 50 y validar tipos.
- REQ-31: la UI no menciona IA.

### Criterios de aceptación

- Una comida registrada ayer aparece en "Recientes" y al tocarla se guarda con sus macros sin escribir nada. ✓
- Una favorita sobrevive a cerrar sesión e iniciar en otro dispositivo (vive en `profiles.prefs`). ✓
- "Avena 60 g" calcula los macros desde el catálogo. ✓
- `node scripts/release-gate.mjs` pasa. ✓ (`tests/e2e/comidas-guardadas.spec.js`)

### Verificación sugerida

- Playwright en `tests/e2e/nutricion*.spec.js` con fixtures (0 llamadas pagadas); captura a 375px del selector.

## REQ-189 - Marca: ícono de la app con chevrons ascendentes (PWA, favicon y Open Graph)

**Estado: implementado.**

### Origen

Jonathan (2026-10-16): no le gusta el logo de la PWA; pide actualizar también el favicon de la web y la imagen Open Graph. Las tres barras ascendentes de REQ-180 se leen como el indicador de señal del celular en la pantalla de inicio. Entre cinco opciones dentro de la misma marca (casi negro + lima), eligió "chevrons ascendentes".

### Alcance

1. `assets/icon-180.png`, `icon-192.png` e `icon-512.png` regenerados: tres chevrons lima con opacidad creciente (35% → 65% → 100%) sobre `#101010`, centrados dentro de la zona segura maskable (círculo r=205 sobre 512).
2. `brandMark()` (`index.html`) usa el mismo dibujo en la portada y las pantallas de acceso.
3. Favicon de la web: `/favicon.ico` (16/32/48 px, en la raíz, donde lo piden navegadores y buscadores) y `assets/favicon.svg`, enlazados desde `index.html` y `beta-reclutamiento.html` (antes usaban el PNG de 192 px; beta no tenía).
4. Open Graph/Twitter: `assets/og-image.png` 1200×630 (marca, tagline y dominio) con URL absoluta `https://evolvapp.club/...` en `og:image`/`twitter:image`, más `og:image:width/height/alt`, `og:locale` y `twitter:card=summary_large_image`. Antes `og:image` era la ruta relativa `assets/icon-512.png` (cuadrada), que WhatsApp, Facebook y LinkedIn no resuelven. `beta-reclutamiento.html` recibe la misma imagen, `og:url` y `og:site_name`.
5. `.vercelignore` publica `/favicon.ico`; `validate-deploy-allowlist.mjs` declara `assets/og-image.png` en `EXTRA_PUBLIC` (se referencia con URL absoluta).
6. `CACHE_NAME` → `fitbud-pwa-v84`: al activarse el service worker nuevo se borra la caché vieja y se vuelven a pedir los íconos.

### Fuera de alcance

- Wordmark "evol·v", colores y tipografías (sin cambios).
- Añadir `icon-180.png` a `APP_SHELL` (REQ-182).
- iOS guarda el ícono de la pantalla de inicio al instalar: quien ya tiene la PWA instalada en iPhone verá el ícono nuevo solo al reinstalarla.

### Criterios de aceptación

- Los tres PNG tienen el tamaño declarado y el dibujo no se corta con la máscara circular de Android. ✓
- Ambas páginas enlazan `favicon.ico` + `favicon.svg`; `og:image` es absoluta y apunta a una imagen 1200×630. ✓
- Tras el deploy, el depurador de compartir de Facebook o una vista previa de WhatsApp muestran la imagen nueva (verificación manual: esas plataformas guardan la vista previa vieja en caché).
- Portada y login muestran el nuevo `brandMark()`. ✓
- `node scripts/release-gate.mjs` pasa. ✓

## REQ-168 - Reproductor de entreno usable en móvil: dosis sin desborde, RPE explicado, series añadibles y "serie hecha" explícita

**Estado: implementado.**

### Origen

Feedback de Jonathan (2026-10-12) probando el plan Push/Legs/Pull cargado a una usuaria, con capturas de iPhone y escritorio.

### Problema

1. En móvil se cortaban las tarjetas de la dosis (descanso, RIR) y en escritorio se salían del borde de la tarjeta.
2. "RPE" y "RIR" no se explican en ninguna parte.
3. No se pueden registrar más series que las prescritas.
4. Marcar una serie como hecha dependía de tocar un círculo con el número de serie; no se entendía que era un control.

### Causa raíz

1. `.scard .n` (24px) se declara después de `.player-dose .n` (16px) con igual especificidad y gana; además la grilla usaba `repeat(3,1fr)`, que no baja del ancho mínimo del contenido ("Controlado").
2. Sin ayuda contextual.
3. `normalizeStep()` (`workout-player.js`) recorta `sets` a `prescribedSets` en cada normalización.
4. `renderStrengthSet()` reutilizaba el `.chk` circular de comidas con el número de serie como contenido.

### Alcance

1. `.player-dose` con `minmax(0,1fr)` y `.player-dose .scard .n` con mayor especificidad; 2 columnas bajo 380px.
2. Tarjetas de esfuerzo `N/10 · esfuerzo (RPE) ⓘ` y `en reserva (RIR) ⓘ` tocables → `explainWorkoutEffort()`; la columna del set dice "Esfuerzo (RPE)".
3. `step.extraSets` persistido (0–10) en `normalizeStep()`; botón "+ Añadir serie" y "Quitar" en la última serie extra sin completar.
4. Fila de serie con título "Serie N" y botón explícito "Marcar hecha" → "✓ Hecha" (`aria-pressed`).

### Fuera de alcance

- Cambiar la prescripción del plan o el cálculo de carga sugerida.

### Criterios de aceptación

- A 375px ninguna tarjeta de dosis ni fila de serie se sale de la tarjeta del ejercicio y no hay scroll horizontal. ✓ (verificado con Playwright)
- Añadir serie suma una fila que sobrevive a la normalización; quitarla solo es posible si es extra y no está hecha. ✓
- El E2E de Entreno completa la sesión con el nuevo control. ✓
- `node scripts/release-gate.mjs` pasa. ✓

## REQ-171 - Fix nutrición: las calorías del día no convergen con comidas propuestas por el coach

**Estado: implementado.**

### Origen

Bug C reportado por Jonathan (2026-10-12): tras varios intentos el día sigue sin alcanzar la meta de kcal.

### Problema

Con propuestas del coach solo el 66% de los días quedaba dentro de la tolerancia de kcal de `DIET_CONTRACT` (±max(50 kcal, 3%)); el 10% peor se desviaba más de 250 kcal.

### Causa raíz

`collectGlobalLines()` (`js/nutrition-domain.js`) solo tomaba como palancas las líneas de comidas que coinciden con un plato del catálogo; las propuestas del coach quedaban fijas. A la vez, el prompt le decía al coach que no ajustara gramos porque "el sistema ajusta las porciones". Nadie ajustaba.

### Alcance

1. `collectGlobalLines()` escala las líneas de propuestas sin plato (`proposal_recalculated`) entre 0.5× y 1.75× de lo propuesto, con los topes por categoría existentes.
2. El prompt del día pide gramos cerca del presupuesto de cada slot y la suma a ±50 kcal de la meta.
3. `scripts/validate-proposal-close.mjs` (gate): propuestas simuladas con nombre inventado y gramos ±30%; exige ≥90% de días en tolerancia de kcal sin reemplazar comidas propuestas. `scripts/seed-catalog.mjs` comparte el parser del seed con el canario.

### Criterios de aceptación

- Días en tolerancia de kcal con propuestas: 66.0% → 93.1%; |Δkcal| mediana 35 → 18, p90 253 → 47; 100% de propuestas conservadas. ✓
- El canario determinista no cambia (289/378, 76.5%). ✓
- `node scripts/release-gate.mjs` pasa. ✓

## REQ-172 - Estimar macros de una comida con una foto, con preguntas de aclaración

**Estado: implementado.**

### Origen

Pedido de Jonathan (2026-10-12): al agregar o editar una comida, tomar una foto, enviarla al coach para estimar los macros y que pregunte lo que necesite aclarar.

### Alcance

1. Editor de comidas (agregar y editar, `editorSheet()`): botón "📷 Estimar con foto" con `capture="environment"`; la foto se reduce en el teléfono a 1024 px JPEG (`mealPhotoToJpeg()`) y se muestra como vista previa.
2. `photoEstimateRound()`: acción existente `meal_estimate` (sin migración ni cuota nueva; cada ronda consume una unidad) con la foto, la descripción y las respuestas previas. La respuesta trae siempre la mejor estimación y hasta 2 `preguntas` sobre lo que no se ve y cambia las kcal (porción, aceite, salsas, bebida). Máximo 3 rondas; las preguntas ya respondidas no se repiten. "Así está bien" acepta la estimación actual.
3. El nombre se completa si está vacío o si lo puso una ronda anterior; lo que escribió el usuario se respeta.
4. Proxy (`api/claude.js`): `imageInput()` acepta imagen solo en `meal_estimate`, tipos JPEG/PNG/WebP y ≤3 MB en base64, y la valida antes de reservar cuota; `userContent()` envía el bloque `image` antes del texto; `meal_estimate` pasa a structured outputs con `mealEstimateOutputSchema()`.
5. La clave de reutilización incluye el hash de la foto y de las respuestas: una respuesta guardada nunca se sirve para otra foto.
6. Privacidad: la foto no se guarda ni se registra; solo viaja en la consulta (`PRIVACY.md`).

### Fuera de alcance

- Guardar la foto junto a la comida o en el historial.
- Estimar con foto desde el reemplazo de comidas del plan ("Cambiar comida").

### Criterios de aceptación

- Foto → estimación con pregunta → respuesta → estimación final que se guarda. ✓ (`tests/e2e/foto-comida.spec.js`)
- Otras acciones rechazan imágenes; tipos y tamaño validados; validación antes de la cuota. ✓ (`scripts/validate-meal-photo-estimate.mjs`)
- `node scripts/release-gate.mjs` pasa. ✓

## REQ-173 - Fix PWA: los deploys no llegan a la app instalada si no cambia `CACHE_NAME`

**Estado: implementado.**

### Origen

Jonathan (2026-10-12) no encontraba "Estimar con foto" tras el deploy de REQ-172.

### Causa raíz

El service worker sirve HTML y JS cache-first (REQ-150) y el navegador solo instala uno nuevo cuando cambia `service-worker.js`. Los deploys de REQ-167 a REQ-172 cambiaron `index.html`, `workout-player.js` y `js/nutrition-domain.js` sin subir `CACHE_NAME` (seguía en `fitbud-pwa-v71`), así que la PWA instalada siguió mostrando la versión anterior.

### Alcance

1. `CACHE_NAME` → `fitbud-pwa-v72`.
2. `scripts/validate-sw-cache-bump.mjs` en el release gate: si cambió un archivo del `APP_SHELL` contra `origin/main` (o `--base <ref>`), `CACHE_NAME` debe ser distinto.

### Criterios de aceptación

- Con `--base 24e2607` y sin subir la versión, el validador falla nombrando los archivos; con `v72` pasa. ✓
- `node scripts/release-gate.mjs` pasa. ✓

## REQ-174 - Entreno: antes de empezar se ve qué se va a hacer (series × repeticiones)

**Estado: implementado.**

### Origen

Jonathan (2026-10-12): antes de iniciar el entreno el resumen no dice qué se va a hacer ni cuántas series o repeticiones.

### Problema

La tarjeta de la sesión solo mostraba el nombre y un texto general; la "Vista previa de ejercicios" muestra técnica pero no la dosis. La dosis solo aparecía ejercicio por ejercicio dentro del reproductor.

### Alcance

1. `workoutPlanSummaryHtml(prescription)` en la tarjeta del entreno (sin sesión en curso): total de ejercicios, series y minutos; por ejercicio, series × repeticiones, descanso y RPE; calentamiento y vuelta a la calma con su duración; enlace "¿Qué es RPE?".
2. `CACHE_NAME` → `fitbud-pwa-v73` (REQ-173).

### Criterios de aceptación

- El E2E de Entreno ve "Qué vas a hacer hoy · N ejercicios · N series" y la dosis "N × reps" antes de iniciar. ✓
- `node scripts/release-gate.mjs` pasa. ✓

## REQ-175 - Capa de espera que bloquea la app mientras el coach responde

**Estado: implementado.**

### Origen

Jonathan (2026-10-12): mientras el coach genera (por ejemplo, el plan de entrenamiento), se puede cerrar el modal con la X; la generación sigue corriendo detrás y al volver a pedirla la pantalla no se actualiza ("Esta acción ya está en proceso"). Pidió un spinner que bloquee toda la pantalla hasta que responda.

### Alcance

1. `showCoachBusy()`/`hideCoachBusy()`: capa a pantalla completa (`#coach-busy`, z-index sobre el modal) con spinner y mensaje por acción (`coachBusyLabel()`: "Preparando tu plan…", "Estimando tu comida…"…).
2. Ligada a la acción completa: `beginCoachAction()` la muestra y `endCoachAction()` la oculta solo si la acción estaba en curso; `callClaude()` también la sostiene. Cubre generaciones con varias consultas seguidas sin huecos.
3. Escape no cierra el modal mientras el coach responde.
4. Salvaguardas: tope de 90 s por intento en `coachProxyFetch()` (AbortController) y cierre automático de la capa a los 4 min con aviso, para que la app nunca quede bloqueada.

### Criterios de aceptación

- Durante "Preparar mi plan" la X del modal queda tapada, Escape no cierra y al responder el resultado sigue en el modal. ✓ (`tests/e2e/alta-y-espera.spec.js`)
- Durante "Estimar macros" el botón Guardar queda tapado hasta la respuesta. ✓

## REQ-176 - Alta de usuarios sin depender del correo

**Estado: implementado.**

### Origen

Alta fallida de una usuaria (2026-10-12): enlace de invitación consumido, "Auth session missing!" (REQ-167) y "email rate limit exceeded" del SMTP por defecto de Supabase.

### Alcance

1. `api/admin.js` acción `createUser`: crea la cuenta confirmada con contraseña temporal `xxxx-xxxx-xxxx` (aleatoria criptográfica, sin caracteres ambiguos), `user_metadata.must_change_password=true` y perfil activo; nunca pisa una cuenta existente (409).
2. Panel admin "Crear cuenta": muestra la contraseña una sola vez y un mensaje listo para copiar o enviar por WhatsApp.
3. Primer ingreso: `onAuth()` detecta `must_change_password` y muestra "Crea tu propia contraseña"; `updateUser` guarda la contraseña y limpia la marca con la misma sesión (sin enlaces de correo) y la app continúa.
4. "Invitar por correo" se mantiene como alternativa.

### Fuera de alcance (acción manual)

- SMTP propio en Supabase (Auth → SMTP) y Redirect URLs de producción (REQ-60): necesitan credenciales del proveedor y el dashboard.

### Criterios de aceptación

- Una cuenta con `must_change_password` ve la pantalla de contraseña, la guarda y entra a la app. ✓ (E2E)
- `scripts/validate-admin-create-user.mjs`: formato, aleatoriedad y cableado. ✓

## REQ-177 - Planes de un coach conservan sus textos: calentamiento por día, duración y descanso

**Estado: implementado.**

### Origen

Jonathan (2026-10-12): la rutina cargada a una usuaria debe ser ejercicio por ejercicio igual a la del coach (LeoFitnessCoach).

### Problema

El plan guardaba duración y descanso como números (55 min, 105 s) y usaba un calentamiento genérico, así que no podía mostrar los rangos ("45–60 min", "90–120 s") ni el calentamiento específico de cada día.

### Alcance

1. Campos opcionales en `snapshot.trainingPlan`: `session.durationLabel`, `session.warmup`, `exercise.restLabel`.
2. `workoutFromSession()` (`training-plan.js`) usa `durationLabel` en el detalle y los pasa a `generatedPrescription`; `generatedStrengthSteps()` (`workout-player.js`) usa `warmup` como objetivo del calentamiento y copia `restLabel` al paso; el temporizador sigue usando `restSeconds` (mínimo del rango).
3. El reproductor y el resumen previo (REQ-174) muestran `restLabel` y `durationLabel` cuando existen.
4. `scripts/validate-coach-plan-labels.mjs` en el release gate. `CACHE_NAME` v75.

### Criterios de aceptación

- Una sesión con textos del coach llega al reproductor con el mismo calentamiento, duración y descanso. ✓
- `node scripts/release-gate.mjs` pasa. ✓

## REQ-178 - Fix facturación: el historial de pagos muestra el cargo original en lugar del monto reembolsado en reembolsos parciales

**Estado: implementado.**
`moneyFromPayload` ahora recibe `event_type`; para `charge.refunded` prioriza `amount_refunded` sobre `amount` (el resto de tipos conserva el orden anterior). Test en `scripts/test-billing-history-api.mjs` cubre reembolso parcial, total y pago normal.

### Origen

Auditoría del journey `facturacion` (Perfil → Suscripción → "Historial de pagos"). Commit previo leído: `903acd2` (REQ-177). Partiendo de REQ-148 (un reembolso parcial de Stripe ya NO revoca el entitlement y queda auditado como evento `charge.refunded` visible al usuario), se revisó cómo se proyecta el monto de cada evento hacia la UI.

### Problema

Un reembolso parcial (p. ej. $7 sobre un cargo de $14) aparece en el historial del usuario como **"Reembolso registrado · USD 14.00"**: se muestra el cargo original completo, no los $7 realmente devueltos. Un reembolso total coincide por casualidad (el monto original y el reembolsado son iguales), así que el bug solo se manifiesta en reembolsos parciales — justo el caso que REQ-148 hizo visible al dejarlos como evento sin revocar acceso. El usuario ve un monto de reembolso inflado respecto a lo que se le devolvió.

### Causa raíz

`moneyFromPayload(payload)` en `api/entitlement.js:62-67`:

```js
const amount = firstFinite(obj.amount_total, obj.amount_paid, obj.amount, obj.amount_refunded);
```

`billing_events.payload` guarda el `event` completo de Stripe (`api/webhook.js:226`), así que para `charge.refunded` el `payload.data.object` es un **charge**: tiene `amount` (cargo original) y `amount_refunded` (lo reembolsado), pero NO `amount_total` ni `amount_paid` (esos viven en `checkout.session`). Como `amount` precede a `amount_refunded` en `firstFinite`, la proyección devuelve el cargo original (1400) antes de llegar al monto reembolsado (700). El orden de precedencia es fijo para todos los tipos de evento; `charge.refunded` necesita priorizar `amount_refunded`.

### Objetivo

En el historial de pagos, un evento de reembolso muestra el monto efectivamente reembolsado, de modo que un reembolso parcial de $7 se lea "USD 7.00" y no "USD 14.00".

### Alcance

1. En `moneyFromPayload`/`projectEvent` (`api/entitlement.js`), para `event_type === "charge.refunded"` resolver el monto priorizando `obj.amount_refunded` (cae a `amount` solo si falta). El resto de tipos (`checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed`, `charge.dispute.created`) conservan su orden actual.
2. Cubrir el caso con un test del proyector (reembolso parcial → monto reembolsado; reembolso total → sigue correcto; pago normal → sin cambios).

### Fuera de alcance

- La lógica de revocación de `handleRefund` (REQ-148) no se toca: parcial sigue sin revocar.
- El formateo de moneda del cliente (`billingAmountText`, `index.html`) ya es correcto; el defecto está en el valor proyectado por el servidor.
- `billingEventLabel`/`billingStatusLabel` (etiquetas) no cambian.

### Riesgos

- Regresión en el monto de otros tipos de evento si el cambio no se acota a `charge.refunded`.
- Reembolsos antiguos ya registrados conservan su payload; la corrección aplica al proyectar, así que el historial se corrige al releerse sin migrar datos.

### Criterios de aceptación

- Un `charge.refunded` con `amount:1400, amount_refunded:700` se proyecta con `amount_cents:700` (UI: "USD 7.00").
- Un reembolso total (`amount==amount_refunded`) y un `checkout.session.completed` siguen mostrando el monto correcto.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Test del proyector de `billing-history` con los tres payloads (parcial, total, pago normal).
- Manual: inyectar en `billingHistory` un evento `charge.refunded` con `amount_cents` derivado del reembolso real y confirmar en Perfil → Suscripción → "Historial de pagos" que el renglón muestra el monto reembolsado.

## REQ-179 - Supabase no se pausa por inactividad: keep-alive en el cron diario

**Estado: implementado.**

### Origen

2026-10-12: el proyecto de Supabase (plan gratuito) estaba pausado; login, sync y catálogo caídos en producción ("Load failed") hasta restaurarlo a mano.

### Causa raíz

El plan gratuito pausa el proyecto tras ~7 días sin actividad. El cron diario `/api/notify` sí consulta la base, pero corta antes en la autenticación: espera `x-vercel-cron: 1` o `Authorization: Bearer CRON_SECRET`, y Vercel identifica sus crons por `user-agent: vercel-cron/1.0` y solo envía `Authorization` si `CRON_SECRET` existe. Sin esa variable, el job devolvía 401 sin tocar la base.

### Alcance

1. `keepSupabaseAwake()` en `api/notify.js`: lectura mínima (`profiles?select=id&limit=1`, service role, no devuelve datos) al inicio de cada invocación, antes de autenticar; un fallo no rompe el handler.
2. `scripts/validate-supabase-keepalive.mjs` en el release gate.

### Fuera de alcance

- Configurar `CRON_SECRET` en Vercel para que los recordatorios por correo/push (REQ-24/38) también corran; el keep-alive no depende de eso.

### Criterios de aceptación

- Una invocación de cron sin secreto responde 401 pero ejecuta la lectura mínima. ✓
- `node scripts/release-gate.mjs` pasa. ✓

## REQ-182 - Fix PWA: el gate de bump de caché no cubre `assets/icon-180.png` (apple-touch-icon cache-first fuera de `APP_SHELL`)

**Estado: implementado.**
`assets/icon-180.png` entró a `APP_SHELL` (`service-worker.js`); `CACHE_NAME` subió a `fitbud-pwa-v87`. El validador deriva su pathspec de `APP_SHELL`, así que ya vigila el ícono.

### Origen

Auditoría del journey `pwa` (rotación del auditor) sobre HEAD `1a93967`. Revisados `service-worker.js`, `scripts/validate-sw-cache-bump.mjs`, `index.html` (`<head>` PWA) y `manifest.webmanifest`. El rebrand REQ-180 regeneró los tres íconos (`icon-180/192/512`) el 2026-10-14.

### Problema

El service worker cachea cache-first **cualquier** recurso estático del mismo origen (`service-worker.js:49-60`), pero el gate que obliga a subir `CACHE_NAME` cuando cambia un recurso cache-first (REQ-173) solo vigila la lista `APP_SHELL`. `assets/icon-180.png` —el `apple-touch-icon` que `index.html:16` referencia en cada vista— es cache-first pero no está en `APP_SHELL` ni en la lista que vigila el validador. Si un deploy cambia solo ese ícono (p. ej. un retoque de marca posterior a REQ-180), `node scripts/validate-sw-cache-bump.mjs` reporta "sin cambios en el shell", el gate pasa sin exigir bump, y cada cliente que ya cacheó el ícono viejo lo sigue sirviendo indefinidamente (cacheFirst nunca revalida) hasta que un cambio no relacionado del `APP_SHELL` suba `CACHE_NAME`. En el rebrand REQ-180 el ícono se refrescó solo por casualidad —`index.html`/`service-worker.js` cambiaron en el mismo commit y forzaron el bump—; un cambio de ícono aislado se escaparía.

### Causa raíz

`APP_SHELL` (`service-worker.js:2-15`) incluye `icon-192`/`icon-512` pero omite `assets/icon-180.png`, aunque `index.html:16` lo carga como `apple-touch-icon`. El validador deriva su lista vigilada de `APP_SHELL` + `index.html` (`scripts/validate-sw-cache-bump.mjs:18-19`), así que un diff de `icon-180.png` nunca entra en su pathspec: es el único recurso estático de mismo origen que `index.html` referencia fuera del `APP_SHELL` (`config.js` es network-first y queda fuera a propósito).

### Objetivo

Que cambiar el ícono de la app obligue a subir `CACHE_NAME`, para que ningún cliente instalado quede con un `apple-touch-icon` obsoleto, y que el ícono quede disponible offline como el resto del shell.

### Alcance

1. Agregar `"./assets/icon-180.png"` a `APP_SHELL` en `service-worker.js` (lo precachea y, de paso, lo mete en la lista que el validador vigila).
2. Subir `CACHE_NAME` por el cambio del shell.

### Fuera de alcance

- Rediseñar el ícono o la estrategia de caché; `config.js` (network-first) sigue fuera del `APP_SHELL` a propósito.
- Separar `purpose: "any"` vs `maskable` en el manifest (discusión aparte).

### Riesgos

- Mínimos: una entrada más en el precache del SW. El propio `validate-sw-cache-bump.mjs` exigirá el bump de `CACHE_NAME` (ya incluido en el Alcance), así que no hay riesgo de olvidarlo.

### Criterios de aceptación

- `assets/icon-180.png` figura en `APP_SHELL`; un cambio aislado de ese ícono hace fallar `node scripts/validate-sw-cache-bump.mjs` mientras no se suba `CACHE_NAME`.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Reproducir el diff que corre el validador: `git diff --name-only <base> HEAD -- <lista APP_SHELL>`. Tras el fix el ícono aparece en el pathspec; antes no. Demostrado en la auditoría contra `06cd60f..9c2997b`: `icon-180.png` cambió en ese rango pero el pathspec del shell no lo veía (solo `icon-192`/`icon-512`).

## REQ-183 - Dominio propio: Evolv en evolvapp.club

**Estado: implementado.**

### Origen

Jonathan compró `evolvapp.club` en Porkbun (2026-10-16) para la marca Evolv (REQ-180).

### Alcance

1. Porkbun DNS: `A @ → 216.198.79.1` y `CNAME www → *.vercel-dns-017.com`, sin los registros de parking.
2. Vercel: `evolvapp.club` en Production y `www.evolvapp.club` con 308 al dominio raíz; `NOTIFY_APP_URL=https://evolvapp.club` (correos y retorno de checkout).
3. Supabase Auth: Site URL `https://evolvapp.club` y `https://evolvapp.club/**` permitida (las URLs viejas siguen permitidas durante la transición).
4. Código: URLs por defecto de `api/notify.js`, `api/checkout.js`, `og:url`, smoke test y documentación.
5. Dominios viejos (`fitbros.vercel.app`, `fitbud-green.vercel.app`): no se redirigen por HTTP (la PWA instalada quedaría atascada en su caché, porque el service worker no puede actualizarse con un redirect). `legacyHostMigration()` manda a los visitantes sin sesión al dominio nuevo y, con sesión, muestra el aviso "Evolv se mudó a evolvapp.club".

### Fuera de alcance

- Webhook de Stripe (checkout deshabilitado); al activarlo, registrar `https://evolvapp.club/api/webhook`.
- Dominio autenticado en Brevo (remitente `@evolvapp.club`).

## REQ-190 - Registro: pantalla "Revisa tu correo" en lugar del formulario con un aviso

**Estado: implementado.**

### Origen

Jonathan (2026-10-17): tras registrarse, el formulario quedaba visible con "Cuenta creada. Confirma tu correo…" en letra pequeña; confuso.

### Alcance

1. `doAuth()`: si `signUp` no devuelve sesión, guarda el correo y cambia a `_authMode="check"`.
2. `renderConfirmEmail()`: pantalla sin inputs con el correo, consejos (spam, abrir en el mismo dispositivo, cuenta existente), "Ya confirmé, iniciar sesión" (precarga el correo), "Reenviar correo" (`supa.auth.resend`, espera de 60 s) y "Usar otro correo".
3. E2E `tests/e2e/registro.spec.js`.

## REQ-191 - Fix Perfil: el aviso de actividad ligera reaparece en cada visita

**Estado: implementado.**

### Origen

Auditoría impeccable de UI (2026-10-16). Para un usuario "solo fuerza", `renderProfile()` llama a `showCardioNudge("profile")` y solo el botón "Continuar" marcaba `UI.cardioNudgeDismissed`; cerrar con ✕, Esc o tocando fuera pasaba por `closeModal()` sin marcarlo, así que el sheet tapaba Perfil en cada visita.

### Alcance

1. `modal(html, {onClose})`: `closeModal()` ejecuta el callback una vez, por cualquier vía de cierre.
2. `showCardioNudge()` usa `onClose` para marcar el aviso como visto; "Continuar" sigue guardando la elección del checkbox.

### Criterios de aceptación

- Cerrar el aviso con ✕ o Esc y volver a Perfil (también tras recargar) no lo muestra de nuevo. ✓ (`tests/e2e/perfil.spec.js`)

## REQ-192 - Accesibilidad: campos con nombre, landmarks, FAQ, contraste de `--muted2` y movimiento reducido

**Estado: implementado.**

### Origen

Auditoría impeccable de UI (2026-10-16): axe marcaba `select-name` (crítico) en el onboarding y `aria-prohibited-attr` en `.steps`; ninguna vista tenía `<main>` ni `h1`; la FAQ no exponía su estado; `--muted2` (`#5f5f58`, 2.6–3.0:1) seguía en texto real (etiquetas de macros, "/2200 kcal"), fuera del alcance de REQ-112.

### Alcance

1. 97 `<label>` seguidos de su control pasan a `for="id"`; los campos de serie de Entreno (sin id) reciben `aria-label` con el número de serie; `#coachInput` recibe `aria-label`.
2. `.steps` del onboarding: `role="progressbar"` con `aria-valuenow`/`aria-valuemax`.
3. `#app` es el único `<main>` (los `<main>` internos de onboarding/recap pasan a `div`); Hoy, Progreso, Perfil y las vistas con navegación de día (`dayHeaderNav`) tienen `h1`.
4. FAQ de la portada: `aria-expanded` se actualiza al abrir/cerrar.
5. `--muted2` → `#8f8f87` (≥4.5:1 sobre `--bg`, `--surf1` y `--surf2`).
6. `prefers-reduced-motion`: `pulse` del micrófono, `bounce` del "escribiendo" y `a2hsIn` se sustituyen por estados estáticos.
7. Orden de títulos sin saltos (`.agenda-title` y el nombre de cada ejercicio pasan a `h2`) y `#sync-badge` como `<aside aria-live>` dentro de un landmark: axe (WCAG 2.2 AA + best-practice) queda en 0 en Hoy, Nutrición, Entreno, Progreso, Perfil y onboarding.

### Criterios de aceptación

- `tests/e2e/accesibilidad.spec.js`: un `<main>` y un `h1` por tab, campos del onboarding asociados a su etiqueta, progreso anunciado y FAQ con `aria-expanded`. ✓

## REQ-193 - Táctil: todos los controles miden 44 px en pantallas táctiles

**Estado: implementado.**

### Origen

Auditoría impeccable de UI (2026-10-16), medida con emulación táctil (`pointer:coarse`): la regla de 44 px de la auditoría de junio cubría `.btn-sm`, `.chip-check` y `.csec-h`, pero no `.btn` (35–39 px), los chips del coach (32), el check de comida (32), "Ver técnica" (34), "¿Qué es RPE?" (20), el botón de ayuda (40), el de enviar (42), los selects de disponibilidad de Perfil (40) ni el cierre de los sheets (36). En escritorio el badge de sincronización flotaba fuera de la columna de 560 px.

### Alcance

1. Bloque `@media(pointer:coarse)` al final del `<style>` (gana la cascada): `min-height:44px` en `.btn`, `.coach-chip`, campos y selects; `::after` con `inset:-7px` en `.chk`, `.demo-expand` y `.a2hs-x` para ampliar el área sin cambiar el tamaño visual; checkboxes de 20 px.
2. Botón de enviar del coach: 44 px, `aria-label` e ícono SVG en lugar de "➤".
3. `.sync-badge` se alinea al borde de la columna.

### Criterios de aceptación

- `tests/e2e/tactil.spec.js`: ningún control visible de las 5 tabs mide menos de 44×44 px en táctil (falla con el código anterior). ✓

## REQ-194 - Textos: sin vocabulario interno, fechas consistentes y beta con ortografía completa

**Estado: implementado.**

### Origen

Auditoría impeccable de UI (2026-10-16): Nutrición decía "llena los **slots**", "Macros calculados desde **tu base de datos**" y "prepara una opción con tu coach **o elige**" (frase cortada); `text-transform:capitalize` convertía "16 oct" en "16 Oct" en Nutrición/Entreno/Progreso mientras Hoy decía "16 oct"; el chip de check-in usaba el emoji 📋; `beta-reclutamiento.html` no tenía tildes ni "¿" ("Que te describe mejor?", "Pais", "despues").

### Alcance

1. Copy de Nutrición y `dbStatusNote()` en lenguaje del usuario; error de carga con recuperación ("Revisa tu conexión y vuelve a intentarlo").
2. Sin `text-transform:capitalize` en `.dtitle .date` y `.wk-left .d`.
3. Chip de check-in sin emoji.
4. Beta: ortografía en textos visibles y placeholders; los `value` que se envían al API no cambian (no altera el scoring ni datos históricos).

### Criterios de aceptación

- `tests/e2e/textos.spec.js`: Nutrición sin "slots"/"base de datos"/"o elige", fecha "Viernes, 16 oct", y la beta con "¿Qué te describe mejor?". ✓

## REQ-195 - Progreso y Nutrición: menos campos vacíos para el usuario nuevo

**Estado: implementado.**

### Origen

Auditoría impeccable de UI (2026-10-16): Progreso mostraba S1–S10 con dos campos cada una (20 inputs vacíos) y "Ingresar mi peso" enfocaba siempre la semana 1; cada comida sin asignar de Nutrición mostraba "0 kcal · P 0 · C 0 · G 0 g" y su check no tenía nombre accesible.

### Alcance

1. `weightTableHtml()`: se ven las semanas hasta la actual (`currentWeightWeek()`) o la última con datos; las siguientes van en `<details class="wt-later">`. "Ingresar mi peso" enfoca la semana actual.
2. Comida sin contenido: "Sin asignar" + una línea de ayuda, sin macros en cero.
3. El check de cada comida tiene `aria-label`/`aria-pressed`.

### Criterios de aceptación

- `tests/e2e/progreso.spec.js`: semana siguiente oculta hasta abrir el plegable; el foco cae en la semana actual; comida vacía sin `.nums`. ✓

## REQ-196 - Marca: restos de color de Fitbros y tokens CSS sin definir

**Estado: implementado.**

### Origen

Auditoría impeccable de UI (2026-10-16): los chips del coach usaban `var(--accent-text,#c4b5fd)` con la variable sin definir, así que se veían lila (marca anterior); `.alert.violet` tenía texto `#d8ccff`; también caían a su fallback o a nada `--white`, `--ok`, `--r` y `--accent-rgb` (violeta 139,92,246). El tour conservaba fondos violeta como fallback.

### Alcance

1. Chips, alertas "violet", `.chat-type.educativo`, `.setup-step` y flechas de día pasan a tokens Evolv definidos (`--purple-200`, `--accent-dim`, `--good`, `--txt`, `--r-md`).
2. Tour: sin fallbacks violeta; botones de 44 px.
3. `scripts/validate-css-tokens.mjs` (en el release gate) falla si `index.html` o `beta-reclutamiento.html` usan una `var(--x)` sin definir.
4. Detector de impeccable (`impeccable detect index.html`): `.btn-accent` sin halo lima (`dark-glow`); el badge "Actualizar app" pasa de `div` lila de 10 px a `<button>` de 12 px con tokens azul señal y dentro de la columna.

### Criterios de aceptación

- `node scripts/validate-css-tokens.mjs` pasa ahora y falla con el `index.html` anterior (5 variables). ✓

## REQ-197 - Rendimiento: la portada no espera a la config ni a Supabase, y supabase-js va fijado con SRI

**Estado: implementado.**

### Origen

Auditoría impeccable (2026-10-16), medido en producción: LCP móvil de 3.4 s en frío. Para un visitante sin sesión, `boot()` esperaba `/api/config` → `supabase.auth.getSession()` antes de pintar la portada, y supabase-js se cargaba de forma bloqueante desde `@supabase/supabase-js@2` (versión flotante: hoy 2.118.0, publicada el día anterior; sin SRI).

### Alcance

1. `boot()`: sin sesión guardada (`hasStoredAuthSession()`) ni enlace de recuperación, pinta la portada antes de pedir la config; al confirmar "sin sesión" solo se actualizan los planes (`refreshLandingPlans()`), sin repintar ni perder la FAQ abierta. El catálogo se pide en paralelo desde el inicio.
2. supabase-js `2.117.2` exacta, con `integrity` + `crossorigin` y `defer`; `supabaseLibReady()` la espera antes de `supaInit()`.
3. `scripts/validate-cdn-pins.mjs` (release gate): scripts de CDN con versión exacta y SRI, y la copia de `tests/e2e/vendor/` igual al hash.

### Fuera de alcance

- Separar la portada de la app (el HTML de 207 KB brotli/750 KB sigue siendo el costo principal): requiere decidir rutas, PWA y service worker.

### Criterios de aceptación

- `navegacion.spec.js`: con `/api/config` colgada la portada se ve y la FAQ abierta sobrevive; con sesión guardada no se muestra la portada. ✓
- 4G emulado + CPU ×4, local: 5.6 s → 5.1 s hasta el titular. ✓

## REQ-198 - Portada: rediseño "Escalera de días" dentro de la marca Escala

**Estado: implementado.**

### Origen

Jonathan (2026-10-16), tras la auditoría impeccable: rediseñar la web pública para que refleje la marca y no parezca una landing genérica. La portada anterior era la plantilla de la categoría: etiqueta en mayúsculas sobre cada sección, grilla de tarjetas iguales con emoji (🥗🏋️🔄📈⚡) y un hueco en escritorio, brillos de acento y FAQ sin estado. Eligió la dirección "Escalera de días" y, como prueba, solo demostración del producto (sin testimonios ni cifras inventadas).

### Alcance

1. Misma marca (REQ-180/189): carbón + lima sólida, Unbounded + Manrope, chevrons. Sin brillos, degradados de acento ni emoji.
2. Hero: titular de marca a gran tamaño + demo del día (marcada "Ejemplo") con tres imprevistos reales de la app ("Como fuera", "Solo tengo 20 min", "Entreno en casa") que cambian almuerzo o entreno.
3. Cinco escalones en orden temporal (Hoy, En el entreno, Si el día se tuerce, Cada semana, Al cerrar el ciclo), cada uno con un fragmento de la UI real. En escritorio, una escalera fija que sube y se enciende peldaño a peldaño al bajar (`initLandingStair()`); en móvil, una escalera mini por escalón.
4. Planes del catálogo con el destacado en campo lima; FAQ con `<details>`; cierre en campo lima a sangre completa. Copy existente y verdadero: no se añaden afirmaciones comerciales.

### Criterios de aceptación

- `tests/e2e/portada.spec.js`: la demo cambia y se revierte; sin emoji ni vocabulario de IA; la escalera se enciende y sigue a la vista. ✓
- axe (WCAG 2.2 AA + best-practice) sin violaciones a 390 y 1440 px; sin scroll horizontal; controles ≥44 px. ✓

## REQ-199 - Beta: la página de reclutamiento pasa a la marca Escala

**Estado: implementado.**

### Origen

Jonathan (2026-10-17), tras REQ-198: `beta-reclutamiento.html` seguía con el sistema anterior (fondo crema, Inter, morado/terracota) y una captura de junio con la marca Fitbros. El detector de impeccable marcaba `cream-palette`, `overused-font` y `tight-leading`.

### Alcance

1. Tokens, tipografías (Unbounded + Manrope) y logo de chevrons de `index.html`; opciones marcadas en lima, foco visible, controles ≥44 px. Estructura, textos, campos, `value` enviados al API y script sin cambios (salvo la tilde de "médica").
2. La captura vieja se reemplaza por la tarjeta "Hoy" de la portada (HTML, marcada "Ejemplo"); `.vercelignore` deja de publicar `assets/ux-audit-2026-06-23/04-home-mobile.png`.
3. `validate-deploy-allowlist.mjs` trata `href="/"` como `index.html`.

### Criterios de aceptación

- `impeccable detect beta-reclutamiento.html` sin hallazgos; axe sin violaciones a 390 y 1440 px; envío con API simulada muestra el resultado y manda los mismos `value`. ✓

## REQ-200 - Fix beta: la postulación falla con "Ganar músculo" o "Comer más sano y crear hábitos"

**Estado: implementado.**

### Origen

Revisión previa al setup de beta testers (2026-10-18). Las opciones de "Objetivo principal" no tenían `value`, así que enviaban su texto visible; REQ-194 les puso tildes y `api/beta-recruitment.js` (`ALLOWED_GOALS`, sin tildes) empezó a responder "Objetivo invalido" para dos de los cinco objetivos. Regresión en producción desde el merge de REQ-191..198.

### Alcance

1. Cada opción de objetivo lleva `value` con el texto que acepta la API; el texto visible conserva las tildes.
2. `scripts/validate-beta-form-values.mjs` (release gate): todo valor de `stage`, `goal`, `recentAttempt`, `tools`, `pains`, `investment`, `availability` y `health` del formulario está en la lista de la API.

### Criterios de aceptación

- El validador falla con el formulario anterior (2 objetivos) y pasa ahora. ✓

## REQ-201 - Beta: la postulación pasa a "Programa de fundadores" y el SW deja de tapar la página

**Estado: implementado.**

### Origen

Jonathan (2026-10-18): antes de vender, abrir una beta de 2-3 meses en Perú, Chile y México con early adopters que den feedback. `beta-reclutamiento.html` seguía planteada como investigación ("entrevistas + beta de 1-2 semanas", "No es una oferta comercial") y al enviar mostraba al postulante su segmento y "Prioridad Baja". Además, `service-worker.js` respondía toda navegación con `index.html` cacheado: quien ya tenía la PWA nunca veía el formulario (reproducido con Playwright y SW activo).

### Alcance

1. La página explica el trato (tres meses gratis sin tarjeta, línea directa, precio de fundador; a cambio uso real, una llamada inicial y check-ins cortos), los cuatro pasos y una FAQ. Campos, `value` y API sin cambios; solo cambian los textos de disponibilidad ("beta de 3 meses").
2. La confirmación dice "Recibida" y el siguiente paso; segmento y prioridad quedan solo para el equipo.
3. `service-worker.js` (v88): solo `/` e `/index.html` salen del cache; las demás navegaciones van a la red y, sin red, a la app.
4. `vercel.json`: `/beta` sirve la página de postulación.

### Criterios de aceptación

- `tests/e2e/beta.spec.js`: postulación completa con API simulada, envía `goal:"Ganar musculo"`, `availability:"interview_beta"` y `source`, y no muestra prioridad ni segmento. ✓
- Con SW activo, `/beta-reclutamiento.html` muestra la página de postulación (antes la portada). ✓
- impeccable sin hallazgos; axe sin violaciones a 390 y 1440 px; sin scroll horizontal. ✓

## REQ-202 - Portada: los CTA llevan a postular a la beta de fundadores

**Estado: implementado.**

### Origen

Jonathan (2026-10-18): la beta de fundadores (REQ-201) necesita tráfico, pero la portada empujaba a "Crear mi cuenta gratis" y no mencionaba la beta.

### Alcance

1. Nav ("Postular"), hero ("Postular a la beta") y CTA final ("Sé de los primeros.") enlazan a `beta-reclutamiento.html` con `source=portada`, `portada-nav` o `portada-final` para saber qué botón convierte.
2. "Ya tengo cuenta" e "Iniciar sesión" siguen abriendo el acceso; los botones de los planes siguen abriendo el registro. Los precios siguen visibles y avisan del precio de fundador.
3. `.l-btn` sin subrayado para servir también como enlace.

### Criterios de aceptación

- `tests/e2e/portada.spec.js`: dos enlaces "Postular a la beta" con `source`, llevan a la página de postulación; "Ya tengo cuenta" abre el acceso. `registro.spec.js` entra por "Empezar ahora". ✓
- impeccable sin hallazgos; axe sin violaciones a 390 y 1440 px. ✓

## REQ-203 - Beta: enlace de invitación que activa el acceso solo y script para invitar

**Estado: implementado.**

### Origen

Jonathan (2026-10-18): setup de la beta de fundadores. Los códigos de canje (REQ-50) existían, pero invitar era manual (generar código desde la API como admin, copiarlo, explicar dónde pegarlo) y el invitado tenía que encontrar "¿Tienes un código?" en Perfil después de registrarse.

### Alcance

1. `index.html`: `/?codigo=FIT-XXXX-XXXX` guarda el código en `localStorage`, lo quita de la URL y abre el registro con el aviso "Tu invitación a la beta está lista". Al iniciar sesión se canjea solo (`redeemPendingInvite`) y se borra; si el código no sirve se avisa y se borra; sesión vencida o servicio caído lo deja para el próximo inicio.
2. `scripts/invite-beta-tester.mjs <id>`: crea un código (90 días, plan `quarterly`, activable 30 días), marca la postulación `beta_invited` con nota y fecha, e imprime el mensaje y un enlace `wa.me`. `--self-test` en el release gate.
3. `BETA_PROGRAM.md`: runbook (preparación, difusión, revisión, invitación, check-ins, cierre).

### Criterios de aceptación

- `tests/e2e/invitacion.spec.js`: el enlace abre el registro y limpia la URL; con sesión el código se canjea una vez y se borra; un código usado avisa y no se reintenta. ✓
- El script contra un Supabase simulado hace GET de la postulación, POST del código y PATCH a `beta_invited`. ✓

## REQ-204 - Beta: la cabecera de la postulación deja de decir "Beta cerrada"

**Estado: implementado.**

### Origen

Jonathan (2026-10-18): quitar el distintivo "Beta cerrada · Perú, Chile y México" de la cabecera de `beta-reclutamiento.html`.

### Alcance

1. Se quita el distintivo y su CSS (`.badge`, `.badge-where`). Los países siguen en la nota bajo los botones del hero.

### Criterios de aceptación

- La cabecera muestra solo el logo; `tests/e2e/beta.spec.js` y `textos.spec.js` pasan. ✓

## REQ-205 - Beta cerrada: crear cuenta solo con código de invitación

**Estado: implementado.**

### Origen

Jonathan (2026-10-18): "hazlo realidad". Con REQ-203 cualquiera podía crear cuenta y recibir la semana de prueba; la beta solo regalaba los tres meses.

### Alcance

1. `api/entitlement.js`, acción `invite-signup` (sin sesión): valida código (existe, sin usar, vigente), correo y contraseña (≥8); crea el usuario con service role (`/auth/v1/admin/users`, correo confirmado) y canjea el código. Si el canje falla, borra la cuenta recién creada. Correo ya registrado → 409 con instrucción de canjear en Perfil.
2. `/api/config` expone `signup.mode`: `invite` por defecto, `open` con `SIGNUP_MODE=open`.
3. `index.html`: en modo `invite` el registro pide "Código de invitación" (prellenado desde `/?codigo=`) y enlaza a postular; tras crear la cuenta entra directo. Los botones de los planes llevan a postular y el subtítulo de precios lo explica. SW v89.
4. `BETA_PROGRAM.md`: desactivar "Allow new users to sign up" en Supabase (paso manual) y cómo reabrir.

### Criterios de aceptación

- `scripts/test-invite-signup-api.mjs` (gate): código válido crea y canjea; inexistente, usado, vencido, contraseña corta o correo inválido no crean cuenta; correo repetido → 409; canje perdido en carrera borra la cuenta; las demás acciones exigen sesión. ✓
- `tests/e2e/invitacion.spec.js`: registro con código manda `invite-signup` y entra; sin código no llama a la API. `registro.spec.js` cubre el modo `open`. ✓

## REQ-208 - Beta: quien entra a la beta no ve precios ni cobro durante sus 90 días

**Estado: implementado.**

### Origen

Feedback de Jonathan sobre el flujo de invitación beta (2026-10-18): se registró como usuario nuevo desde ese flujo y, al hablar con el coach, la app le pidió pagar. Un usuario beta no debe ver precios hasta cumplir tres meses.

### Problema

Hay al menos un camino por el que una cuenta beta acaba en el paywall con su tarjeta de precios (USD 14 / USD 36). Con REQ-203/205, el código de invitación (`scripts/invite-beta-tester.mjs`, 90 días, plan `quarterly`) crea un entitlement `origin:'coupon'` que ya evita el paywall, pero no todos los caminos de alta pasan por ese código, y las pantallas no distinguen "beta" de "cualquier acceso".

### Causa raíz

- `api/admin.js:864` (`createUser`) y `api/admin.js:885` (`inviteUser`) crean la cuenta sin acceso: esa persona cae en la semana gratis de REQ-117 y, al reutilizar un cambio, `api/claude.js:893` responde 402 `trialLimit`, que el cliente convierte en `showPaywall()` (`index.html:7103`, precios en `index.html:7127`).
- `redeemPendingInvite()` (`index.html:7252`) deja el código para el próximo inicio de sesión si el canje falla con 401/404/5xx. Mientras tanto, la cuenta queda en trial y puede ver el paywall.
- Aun con acceso beta activo, nada impide que una ruta futura muestre precios: `showPaywall()` no sabe si el usuario es beta.
- Hay que confirmar cuál de estos caminos vio Jonathan (ver Fuera de alcance, paso manual 1).

### Objetivo

Toda cuenta beta (alta con código de invitación, o creada por el admin como beta) tiene acceso completo durante 90 días. Mientras dure, ninguna pantalla menciona precios, planes de pago ni "activa un plan".

### Alcance

1. Marca beta explícita: el código que emite `invite-beta-tester.mjs` y la cortesía beta producen un entitlement distinguible (p. ej. `notes`/`origin` = beta, sin romper el `check` de `supabase/coupon_codes.sql`; si requiere migración, idempotente y documentada como acción manual).
2. Admin "Crear cuenta" e "Invitar por correo": casilla "Usuario beta (90 días sin cobro)", marcada por defecto. Si está marcada, el servidor da en la misma acción el acceso beta de 90 días (reusar la lógica de `grant`/`redeem` de `api/entitlement.js`, no duplicarla).
3. Cliente: con acceso beta, Perfil → Mi suscripción muestra "Acceso beta · hasta <fecha>" sin botones de planes ni precios, y `showPaywall()` no se abre. Si alguna ruta lo pide, aviso neutro sin precios.
4. Canje pendiente: si `redeemPendingInvite()` no pudo canjear, Perfil avisa "Tu invitación se activará al reconectar" en vez de ofrecer planes, y el canje se reintenta al volver la conexión, no solo en el próximo inicio de sesión.
5. Últimos 7 días del acceso beta: aviso suave en Perfil ("Tu acceso beta termina el <fecha>"). Los precios solo aparecen tras el vencimiento (alineado con el cierre de `BETA_PROGRAM.md` §5).
6. Invariante nueva en `AGENTS.md` y `CONTEXT.md` (Pagos): **el cobro siempre ocurre en la web** (`evolvapp.club`), también con app nativa. Una app nativa no ofrece compras dentro de la app: abre la web para pagar y lee el entitlement del servidor.

### Fuera de alcance

- Acciones manuales: (1) revisar en Supabase `user_entitlements` de la cuenta de prueba de Jonathan para confirmar si tenía acceso y con qué `origin`; (2) si no lo tenía, darle cortesía de 90 días desde Admin.
- Cambiar las cuotas diarias del coach para cuentas con acceso.

### Riesgos

- Abuso: el acceso beta solo nace de un código o del admin; el registro abierto (`SIGNUP_MODE=open`) sigue con el trial.
- Verificar que `trialFirstWeekOnly` (`index.html:9210`) no limite a una cuenta beta.

### Criterios de aceptación

- E2E: cuenta con acceso beta habla con el coach, rehace opciones y prepara las semanas 2..10 sin paywall; en las 5 tabs y en Perfil abierto no aparece "USD", "Ver planes", "Activa tu plan" ni "Renovar".
- E2E: canje pendiente por error 5xx → Perfil muestra el aviso de invitación pendiente, no planes.
- Admin crea una cuenta con la casilla beta → la cuenta nace con acceso de 90 días.
- Sin acceso beta, el comportamiento actual (trial REQ-117) no cambia.
- `AGENTS.md` y `CONTEXT.md` contienen la invariante de cobro en la web.

### Verificación sugerida

- `tests/e2e/invitacion.spec.js` + `tests/e2e/beta.spec.js` + `scripts/test-invite-signup-api.mjs` + `node scripts/release-gate.mjs`.

### Implementación (2026-10-19)

1. `api/admin.js`: `grantBetaAccess()`/`betaAccessFor()`; `createUser` e `inviteUser` con `beta:true` crean cortesía `quarterly` de 90 días (`origin:admin_courtesy`, nota "Beta de fundadores"). Si el acceso falla, la cuenta queda creada y la respuesta trae `betaError`. Prueba: `scripts/test-admin-beta-signup.mjs` (gate).
2. `index.html`: `freeAccessActive()`/`noPricesMode()`; `showPaywall()` → `showAccessNotice()` sin precios; `coachErrorMessage()` neutro; Perfil → Mi suscripción "Acceso beta · acceso completo hasta…", aviso suave en los últimos 7 días, sin historial de pagos; invitación pendiente con "Activar mi invitación" y reintento en `online`; casilla "Usuario beta (90 días sin cobro)" en Crear cuenta e Invitar. SW v94.
3. `AGENTS.md` y `CONTEXT.md`: invariante de cobro siempre en la web.
4. E2E `tests/e2e/beta-acceso.spec.js`.

## REQ-210 - Progreso: la semana 1 usa el peso y la grasa del onboarding

**Estado: implementado.**

### Origen

Feedback beta de Jonathan (2026-10-18): al crear la cuenta ya se pide peso y % de grasa, pero luego Progreso los vuelve a pedir para la semana 1.

### Problema

Un usuario nuevo escribe su peso y grasa en el alta y, al abrir Progreso, la tarjeta "Registra tu peso de la semana" y la fila S1 vacía le piden lo mismo otra vez.

### Causa raíz

- `saveOnboarding()` guarda `weightKg`, `bodyFatPct`, `cycleStartWeight` y `cycleStartBodyFat` en `profiles.prefs` (`index.html:3670`), pero no escribe la semana 1 de `S.weights`/`weight_log`.
- `weightSetupCard()` (`index.html:5600`) se muestra mientras `lastWeighedWeek()===null`, y `weightTableHtml()` (`index.html:5725`) deja S1 vacía con "Ingresar mi peso".

### Objetivo

El dato del alta es el registro de la semana 1. Progreso lo muestra ya cargado y explica que la próxima medición es la de la semana 2.

### Alcance

1. Al terminar el onboarding inicial o un ciclo nuevo, si la semana 1 está vacía, escribirla con `setWeightEntry(1,{kg,bf})`, por la misma ruta que sincroniza `weight_log`. Nunca pisar un valor existente.
2. Usuarios que ya tienen S1 vacía y `cycleStartWeight`: rellenar S1 al cargar Progreso, una vez, con la misma regla.
3. Copy: con S1 cargada desde el alta, la tarjeta de configuración dice "Tu punto de partida: 75 kg (semana 1). Vuelve a pesarte el <día> para la semana 2", en vez de pedir el dato otra vez.

### Fuera de alcance

- Cambiar `WEIGHT_RANGES` o el check-in semanal.

### Riesgos

- Historial inmutable: solo se rellena un hueco y nunca se sobrescribe. Un usuario que borra S1 a propósito no debe verla reaparecer: la marca "rellenado una vez" vive en prefs.

### Criterios de aceptación

- E2E: onboarding con 75 kg / 18% → Progreso muestra S1 = 75 / 18 y no muestra "Registra tu peso de la semana" para S1.
- Una S1 ya registrada con otro valor no cambia.

### Verificación sugerida

- `tests/e2e/progreso.spec.js` + `tests/e2e/onboarding.spec.js`.

### Implementación

1. `saveOnboarding()`: en ciclo nuevo o primer ciclo guarda `startWeightSeededCycle` y llama `seedStartWeight()` (escribe S1 en `S.weights` + `weight_log` vía `pushWeight`; nunca pisa un valor).
2. `backfillStartWeightOnce()` tras `pullWeights()` al iniciar sesión: cuentas previas con `cycleStartWeight` y sin marca del ciclo; guarda la marca para que una S1 borrada no reaparezca.
3. `startWeightNoteCard()` en Progreso con solo S1: "Tu punto de partida: 80 kg · 20% de grasa" y la fecha de la semana 2. SW v95.
4. E2E `tests/e2e/peso-inicial.spec.js` (3) + asserts en `onboarding.spec.js`.

## REQ-211 - Onboarding: el objetivo y el "ritmo del plan" se entienden a la primera

**Estado: implementado.**

### Origen

Feedback beta de Jonathan (2026-10-18), sobre la configuración de la cuenta: "Mantener mi peso y mejorar mi cuerpo" no tiene lógica a primera vista, y "Ritmo del plan" con la opción "Plan completo" no se explica solo; hace falta una ayuda.

### Problema

En el paso 2 del onboarding, la opción del medio no dice que es recomposición. En el paso de entrenamiento, "Plan completo" frente a "Suave" no explica qué cambia, así que el usuario elige a ciegas.

### Causa raíz

- `index.html:3169`: el objetivo `mantenimiento` (que en realidad es recomposición: mismo peso, más músculo y menos grasa) se presenta como "Mantener mi peso y mejorar mi cuerpo", sin descripción. El copy viene de REQ-114 y lo fija `scripts/validate-onboarding-copy.mjs`.
- `index.html:1072-1076` y `index.html:3036-3038`: "Ritmo del plan" ofrece "Según mi perfil (recomendado) / Suave / bajo impacto / Plan completo". La nota habla de "evaluación de seguridad en verde", sin decir qué cambia en la práctica (intensidad, series, tipo de ejercicios).

### Objetivo

Cada opción dice qué consigue y qué implica, en una línea, sin jerga.

### Alcance

1. Objetivo: tarjetas seleccionables (o `select` + descripción viva) con un título y una línea:
   - "Bajar grasa": comes un poco menos de lo que gastas; bajas de peso de forma gradual.
   - "Recomponer mi cuerpo": tu peso casi no cambia, pero ganas músculo y pierdes grasa.
   - "Ganar músculo": comes un poco más de lo que gastas; subes de peso poco a poco.
   Mismo copy en Perfil → Objetivo. Los valores internos (`deficit/mantenimiento/volumen`) no cambian.
2. Ritmo del plan → "Intensidad del entreno", con descripción por opción:
   - "Recomendado para ti": la elegimos según tu edad, experiencia y respuestas de salud.
   - "Suave": menos series, esfuerzo moderado y ejercicios sencillos o de bajo impacto.
   - "Completa": series y esfuerzo normales para tu nivel; disponible si tus respuestas de salud no muestran alertas.
   Botón ⓘ (patrón de `explainWorkoutEffort()`) con el detalle; misma ayuda en Perfil (`trainingSafetyModeHtml("pf")`).
3. Actualizar `scripts/validate-onboarding-copy.mjs` y `CONTEXT.md` (línea de REQ-114).

### Fuera de alcance

- Cambiar la lógica de `trainingSafetyRecommendation()` o los cálculos de macros.

### Riesgos

- REQ-31: el copy no menciona IA. Táctil: las tarjetas miden ≥44 px (REQ-193).

### Criterios de aceptación

- El onboarding muestra la descripción de la opción elegida en objetivo e intensidad; el ⓘ abre la explicación.
- `validate-onboarding-copy.mjs` y `tests/e2e/onboarding.spec.js` en verde con el copy nuevo.

### Verificación sugerida

- Recorrer onboarding a 390 px; axe sin violaciones en el paso 2 y en el de entrenamiento.

### Implementación

1. `GOAL_OPTIONS` (label + ayuda) en el paso 2 del onboarding (`#obGoalHelp`) y en el resumen de Perfil; valores internos intactos.
2. `TRAINING_SAFETY_MODE_LABELS`/`TRAINING_SAFETY_MODE_HELP`: "Intensidad del entreno" con ayuda que cambia al elegir (`updateSafetyModeHelp()`) y modal `explainTrainingIntensity()`; avisos de edad sin "plan completo". SW v96.
3. `validate-onboarding-copy.mjs`, `onboarding.spec.js` y `CONTEXT.md` actualizados.

## REQ-212 - Entreno: calentamiento y vuelta a la calma con movimientos concretos y cronómetro opcional

**Estado: implementado.**

### Origen

Feedback beta de Jonathan (2026-10-18): alguien ajeno al entrenamiento no sabe cómo calentar. El calentamiento y la vuelta a la calma deben decir exactamente qué hacer, y el cronómetro debería ser opcional: que la persona elija cómo hacerlo.

### Problema

Una persona sin experiencia ve "Calentamiento · Movilidad dinámica y series de aproximación" y una cuenta atrás de 5 a 10 minutos, pero no sabe qué movimientos hacer. La cuenta atrás se presenta como el camino principal.

### Causa raíz

- `workout-player.js:159-162` y `workout-player.js:240-245`: el calentamiento de fuerza es un único bloque con el texto "Movilidad dinámica y series de aproximación de los primeros movimientos" (o el `warmup` libre del coach, REQ-177). `workout-player.js:189-191` y `workout-player.js:259-261` hacen lo mismo con "Respiración tranquila y movilidad suave de las zonas trabajadas". No hay movimientos, repeticiones ni demostración.
- `index.html:5254-5264` + `index.html:5200`: el bloque cronometrado muestra solo "Objetivo / Intensidad", y su botón principal es "Iniciar bloque" (cuenta atrás). "Marcar completado" queda como secundario, así que parece obligatorio usar el cronómetro.

### Objetivo

El usuario ve una lista corta de movimientos con dosis ("Círculos de cadera · 10 por lado") y demostración. Elige entre hacerlo guiado (con tiempo por movimiento) o marcarlo hecho.

### Alcance

1. Catálogo de movimientos de calentamiento y vuelta a la calma (en `exercise-catalog.js`, rol `warmup`/`cooldown`, con media si existe), elegidos por los grupos musculares y el patrón de la sesión (tren inferior, superior, cuerpo completo, cardio). De 4 a 6 movimientos, con dosis en reps o segundos.
2. `generatedStrengthSteps()` y el cardio: el paso `warmup`/`cooldown` lleva `movements:[{slug,name,dose}]`. Si el coach trae `warmup` propio (REQ-177), se muestra como nota y se mantienen los movimientos concretos.
3. Reproductor: dos acciones del mismo peso, "Guíame" (avanza movimiento a movimiento, con cuenta atrás opcional) y "Ya calenté" (marca hecho). Sin cuenta atrás automática.
4. Resumen previo (REQ-174): el calentamiento lista sus movimientos.

### Fuera de alcance

- Grabar videos nuevos (reusar media del catálogo o la Free Exercise DB).

### Riesgos

- Modo suave (REQ-116): sin movimientos de impacto ni invertidos. Historial: las sesiones ya ejecutadas conservan su paso antiguo.

### Criterios de aceptación

- Una sesión de piernas muestra de 4 a 6 movimientos de calentamiento de tren inferior con dosis; una de tren superior, otros distintos.
- Se puede completar el calentamiento sin iniciar ningún cronómetro.
- `validate-training-plan.mjs` y `tests/e2e/entreno.spec.js` en verde.

### Verificación sugerida

- E2E nuevo: "Ya calenté" avanza sin timer; "Guíame" recorre los movimientos.

### Implementación

1. `workout-player.js`: `MOVES`, `sessionFocus()` (inferior/superior/completo por patrón y músculos), `strengthMovements()` y `cardioMovements()`; los pasos `warmup`/`cooldown` (plantilla, plan del coach y cardio) llevan `movements:[{name,dose,seconds?}]`. El calentamiento propio del coach (REQ-177) queda como `coachNote`. Sin movimientos de impacto ni invertidos.
2. `index.html`: `renderMovementStep()` (lista, "Guíame"/"Ya calenté"/"Omitir bloque"; guía con Anterior/Siguiente y cronómetro opcional `kind:"move"` que no cierra el bloque); el resumen previo nombra los movimientos. SW v97.
3. Pruebas: `validate-workout-player.mjs` (movimientos por zona) y `entreno.spec.js` ("Calentamiento guiado").

## REQ-213 - Actualizaciones de la app sin botón "Actualizar app" que estorbe

**Estado: implementado.**

### Origen

Feedback beta de Jonathan (2026-10-18): el botón "Actualizar app" a veces tapa otros controles y no se entiende para qué sirve. La app debe actualizarse sin interferir con el uso diario.

### Problema

Tras un deploy aparece un botón flotante "Actualizar app" que tapa controles y no explica para qué sirve; tocarlo recarga la app en ese momento.

### Causa raíz

- `index.html:927` + `index.html:867`: `#update-badge` es un `position:fixed` a `bottom:70px`, a la izquierda de la columna, encima del contenido. Tapa controles del reproductor ("+ Añadir serie", "Omitir bloque") y de las tarjetas.
- `index.html:12589-12595`: aparece en cuanto se instala un service worker nuevo, y `applyPendingAppUpdate()` hace `location.reload()` en ese momento, con el usuario a mitad de una tarea.

### Objetivo

Con una versión nueva instalada, la app se actualiza sola en un momento seguro, sin botón flotante.

### Alcance

1. Sin `#update-badge`. Con una actualización pendiente, recargar automáticamente cuando la app vuelve de segundo plano (`visibilitychange` → `visible`, tras más de 30 s oculta) o en la siguiente apertura, y solo si no hay un momento "ocupado": entreno `in_progress`, modal abierto, formulario de Perfil con cambios sin guardar (`pfGroupDirty`), coach respondiendo o cola de sync con pendientes.
2. Si no hubo momento seguro en 24 h: línea discreta en Perfil → Cuenta ("Hay una versión nueva · Actualizar"), nunca flotante.
3. Tras recargar por actualización: toast breve "App actualizada", una vez.

### Fuera de alcance

- Cambiar la estrategia de caché del service worker (REQ-173/182).

### Riesgos

- Perder estado: la recarga solo ocurre con la cola de sync vacía y sin entreno en curso.

### Criterios de aceptación

- E2E: con una actualización simulada y un entreno en curso no se recarga; al terminarlo y volver de segundo plano, sí.
- No queda ningún elemento fijo nuevo sobre el contenido (`tactil.spec.js` y `accesibilidad.spec.js` en verde).

### Verificación sugerida

- Simular `notifyAppUpdateAvailable()` en E2E y despachar `visibilitychange`.

### Implementación

1. `index.html`: se quita `#update-badge` y su CSS. `notifyAppUpdateAvailable()` marca la actualización (`evolv_update_pending_since`); `visibilitychange` recarga si la app estuvo ≥30 s oculta y `appBusyForUpdate()` es falso (modal abierto, coach respondiendo, Perfil con cambios sin guardar, cola de sync pendiente o entreno `in_progress`).
2. `appUpdateOfferedInProfile()`: tras 24 h, línea "Hay una versión nueva de la app · Actualizar" en Perfil → Cuenta. Tras recargar, toast "App actualizada" una vez (`announceAppUpdated()`). SW v98.
3. E2E `tests/e2e/actualizacion.spec.js` (3).

## REQ-214 - Plan: empezar de nuevo (4 o 10 semanas) en cualquier momento

**Estado: implementado.**

### Origen

Feedback beta de Jonathan (2026-10-18): tiene que haber una forma de reiniciar el plan de 10 semanas sin tocar la suscripción. Si pasan muchos días sin entrenar, la app debería sugerirlo, y si el usuario decide volver a empezar de cero, debe poder rehacer el plan de 4 o 10 semanas.

### Problema

Quien se atrasa o abandona unas semanas no puede volver a empezar: el plan sigue contando desde la fecha original hasta el recap final, y solo un admin puede reiniciar (borrando datos).

### Causa raíz

- El único camino a un ciclo nuevo es el recap de fin de ciclo: `startNextChallenge()` (`index.html:2658`) archiva el ciclo (`archiveCompletedCycle`, `index.html:10864`) y marca `onboardingPending:true`. Antes del final no hay acción de usuario. El reinicio de REQ-126 es solo de admin y borra datos.
- Nada detecta la inactividad prolongada para ofrecer reiniciar.

### Objetivo

Perfil → Objetivo ofrece "Empezar de nuevo mi plan": el usuario elige 4 o 10 semanas, revisa sus datos precargados y arranca un ciclo nuevo desde hoy. El historial y la suscripción se conservan.

### Alcance

1. Acción "Empezar de nuevo" con confirmación que explica el impacto: "Tu historial se conserva; tu plan arranca hoy desde la semana 1".
2. Reusar la ruta del recap: archivar el ciclo actual como **interrumpido** (sin exigir el resumen completo ni la foto), `onboardingPending:true` y onboarding con los datos actuales precargados y la duración elegible. `saveOnboarding()` ya prepara la primera semana (REQ-118).
3. Sugerencia: con 14 días o más sin entreno registrado (y sin descanso planificado), tarjeta en Hoy: "Hace 2 semanas que no entrenas. ¿Retomamos donde ibas o empiezas de nuevo?", con "Retomar" (sigue el plan) y "Empezar de nuevo" (paso 1). Se puede descartar y no reaparece en 7 días.
4. No toca entitlement, cortesía, beta ni trial: el trial no se renueva por empezar de nuevo.

### Fuera de alcance

- Borrar historial (sigue siendo acción de admin, REQ-126).

### Riesgos

- Historial inmutable: los `day_log` y `plan_versions` pasados quedan intactos; las versiones activas futuras pasan a `superseded`.
- `trialStartedAt()` (`api/claude.js:197`) lee `onboardingCompletedAt`: un ciclo nuevo no debe reabrir el trial. Verificar que `get_or_create_coach_trial` es idempotente por usuario.

### Criterios de aceptación

- E2E: en la semana 5, "Empezar de nuevo" → 4 semanas → Hoy muestra la semana 1 desde hoy; Progreso conserva los pesos anteriores en el ciclo archivado.
- Con 14 días sin entreno aparece la sugerencia y "Retomar" la oculta.

### Verificación sugerida

- `tests/e2e/ciclo-nuevo.spec.js` (nuevo) + `validate-training-plan.mjs`.

### Implementación

1. `openRestartPlan()`/`confirmRestartPlan()`: `cycleSummary(until)` hasta ayer, `archiveCompletedCycle(..., endDate)` con `summary.interrupted` (sin migración: `plan_cycles.status` sigue en `completed`), prefs `onboardingPending` + `restartCycle` y onboarding precargado con la duración elegida. `saveOnboarding()` arranca hoy cuando `restartCycle`; la versión activa anterior se cierra en ayer por la ruta existente de `plan_versions`.
2. `restartNudgeCard()` en Hoy: ≥14 días desde el último entreno completado/parcial (o desde el inicio), "Retomar" la pospone 7 días (`restartNudgeDismissedAt`).
3. Progreso → recorrido marca "Interrumpido". Evento `plan_restart` en la allowlist de analytics. No toca entitlement, cortesía, beta ni trial (`onboardingCompletedAt` se conserva). SW v99.
4. E2E `tests/e2e/ciclo-nuevo.spec.js` (2).

## REQ-215 - Nutrición: lista de compra semanal con "ya lo tengo" y "por comprar"

**Estado: implementado.**

### Origen

Feedback beta de Jonathan (2026-10-18): hace falta una lista de compra que separe lo que ya tienes en casa de lo que tienes que comprar, con la cantidad necesaria para la semana.

### Problema

El usuario no tiene dónde ver qué comprar para la semana después de aplicar el plan, ni puede descontar lo que ya tiene en casa.

### Causa raíz

- La lista existe solo dentro del modal de revisión de "Preparar semana" (`index.html:9992-9997`): un `<details>` de solo lectura que desaparece al aplicar. Se guarda en `snapshot.shoppingList` (`index.html:1795`), pero ninguna pantalla la vuelve a mostrar.
- Se calcula sobre el plan propuesto: si después el usuario cambia una comida (override en `day_log`), la lista queda vieja.

### Objetivo

Una pantalla "Lista de compra" en Nutrición, siempre disponible para la semana activa, con cantidades para lo que queda de semana y dos estados por ingrediente.

### Alcance

1. Entrada en Nutrición ("Lista de compra · semana N") que abre una vista o sheet.
2. Cantidades calculadas con `buildShoppingListFromNutritionPlan()` sobre las comidas **efectivas** de cada día (`mealValue()`: override > plan), por defecto de hoy al final de la semana, con opción "semana completa". Agrupar por categoría y redondear a unidades prácticas cuando el catálogo lo permita ("3 huevos", "1 kg de pollo"), conservando los gramos.
3. Cada ingrediente se marca "Ya lo tengo" o "Por comprar" (por defecto). Dos secciones con contador ("Por comprar · 12"). Marcar no cambia el plan.
4. Las marcas se guardan por usuario y semana (clave `version_key` del plan) en `profiles.prefs.shoppingChecks`, sincronizadas como el resto de prefs, sin migración. Se limpian las de semanas pasadas.
5. Copiar/compartir la lista "Por comprar" como texto (Web Share API, o portapapeles como respaldo).

### Fuera de alcance

- Precios, tiendas o pedidos en línea. Despensa persistente entre semanas (candidato futuro).

### Riesgos

- Privacidad: la lista es dato personal; no va a analytics (solo el evento `shopping_list_opened` sin contenido).

### Criterios de aceptación

- E2E: cambiar una comida actualiza la cantidad del ingrediente afectado; marcar "Ya lo tengo" lo mueve de sección y sobrevive a recargar.
- La vista funciona sin conexión con el último plan cacheado.

### Verificación sugerida

- `tests/e2e/lista-compra.spec.js` (nuevo) + `validate-nutrition-domain.mjs`.

### Implementación

1. `shoppingList(scope)` suma `mealRecipe()` de cada comida efectiva (cambios incluidos, sin las saltadas) de hoy (o del inicio) al fin de la semana del plan; categoría desde `DB.ingredients`; `shoppingQty()` redondea (g/kg, huevos en unidades).
2. Hoja `openShoppingList()` con `#shopSheet` (se actualiza sin recrearse para conservar scroll y foco): "Por comprar · N" y "Ya lo tengo · N", selector "Lo que queda de semana"/"Semana completa", "Compartir lo que falta" (Web Share o portapapeles).
3. Marcas en `profiles.prefs.shoppingChecks={key:"ciclo:inicioSemana",have:[...]}`: solo la semana actual, sin migración. Evento `shopping_list_opened` sin contenido. SW v100.
4. E2E `tests/e2e/lista-compra.spec.js` (2).

## REQ-219 - Portada: los CTA del hero, la navegación y el subtítulo no respetan `SIGNUP_MODE=open`

**Estado: implementado.**

### Origen

Auditoría del journey `adquisicion` (2026-10-19, commit previo `5fc9b10`). REQ-205 hizo que las tarjetas de planes de la portada cambien su CTA según el modo de registro (`inviteOnlySignup()`): "Postular a la beta" en beta cerrada, "Empezar ahora" en registro abierto. Pero los otros CTA de conversión de la portada quedaron fijos a la postulación de beta (REQ-202), sin enterarse del modo.

### Problema

Cuando el servidor pase a `SIGNUP_MODE=open` (fin de la beta), la portada queda contradictoria: las tarjetas de planes dicen "Empezar ahora" (registro directo), pero el CTA principal del hero, el de la navegación y el final siguen diciendo "Postular a la beta" y enlazan a `beta-reclutamiento.html` (una postulación a una beta ya cerrada), y el subtítulo de precios sigue con el texto de beta. El botón más visible manda a un callejón sin salida justo cuando se abre el registro al público — funnel de adquisición roto.

Además, aunque el subtítulo (`.l-sec-sub`) sí depende de `inviteOnlySignup()`, está fuera de la caja `.l-plans`, y `boot()` solo refresca esa caja al resolver la config: tras el pintado optimista queda congelado con el texto del primer render.

Reproducción: portada sin sesión; `boot()` pinta con `inviteOnlySignup()`=true (REMOTE.signup aún sin cargar); `/api/config` resuelve `signup.mode:"open"`; se ejecuta `refreshLandingPlans()`. Resultado: tarjetas → "Empezar ahora"; hero → "Postular a la beta" (`?source=portada`); nav → "Postular" (`?source=portada-nav`); subtítulo → "Precios al abrir los planes. Quienes entren a la beta tendrán precio de fundador.".

### Causa raíz

`index.html`: CTA de hero (`:7592`), navegación (`:7582`) y final (`:7627`) tienen el texto y el `href="beta-reclutamiento.html…"` hardcodeados, sin consultar `inviteOnlySignup()` — a diferencia del CTA de las tarjetas (`:7558-7560`). El subtítulo (`:7614`) sí lo consulta pero vive fuera de `.l-plans`; `refreshLandingPlans()` (`:7411-7415`) solo reescribe `.l-plans`, y `boot()` (`:12787-12788`) solo llama a `refreshLandingPlans()` (no repinta la portada) cuando ya estaba pintada. `inviteOnlySignup()` (`:988`) devuelve true por defecto mientras `REMOTE.signup` no esté cargado (`:978`).

### Objetivo

Con `SIGNUP_MODE=open`, toda la portada ofrece registro directo (hero, nav y CTA final = "Empezar ahora" hacia el registro, subtítulo sin texto de beta); con `invite`, todo sigue llevando a postular. El cambio de modo al resolver `/api/config` se refleja en todos esos elementos, no solo en las tarjetas.

### Alcance

1. Hacer que los CTA de hero, nav y final elijan texto y destino según `inviteOnlySignup()` (postular vs. abrir registro), igual que la tarjeta de planes.
2. Al resolver la config en `boot()`, actualizar también hero/nav/CTA final/subtítulo cuando el modo cambie respecto al pintado optimista (p. ej. repintar la portada si `inviteOnlySignup()` cambió, o extender `refreshLandingPlans` para cubrir esos nodos), conservando scroll y FAQ abierta como hoy.

### Fuera de alcance

- Cualquier cambio en `beta-reclutamiento.html` o en el flujo de postulación.
- El texto/estética de los botones de registro abierto (ya existe "Empezar ahora").

### Riesgos

- Repintar la portada al resolver la config podría perder el scroll o una FAQ abierta (REQ-151/197): preferir actualización in situ de los nodos afectados.

### Criterios de aceptación

- Con `signup.mode:"open"`, la portada no muestra ningún CTA "Postular…" ni enlace a `beta-reclutamiento.html`; hero, nav y CTA final llevan al registro directo y el subtítulo no menciona la beta.
- Con `signup.mode:"invite"`, la portada mantiene el comportamiento actual (todos los CTA a postular).
- El cambio de modo tras el pintado optimista se refleja en hero/nav/subtítulo, no solo en las tarjetas.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- `tests/e2e/portada.spec.js`: con la config en modo `open`, afirmar que no hay enlaces a `beta-reclutamiento.html` y que el hero lleva al registro; con `invite`, que sí llevan a postular.
- Manual: cargar la portada, forzar `REMOTE.signup={mode:"open"}` y reejecutar el flujo de `boot()`; comprobar que hero, nav, CTA final y subtítulo dejan de hablar de beta.

### Implementación

1. `landingModeHtml(slot)` (`nav`, `hero`, `heroNote`, `sub`, `final`): beta cerrada → postular; registro abierto → "Empezar"/"Empezar ahora" (`showAuthFromLanding('up')`) y textos sin beta.
2. Nodos marcados con `data-lmode`; `refreshLandingPlans()` los reescribe junto a `.l-plans` cuando cambia `landingRenderKey()` (que ya incluía el modo), sin repintar: se conservan el scroll y la FAQ abierta. SW v102.
3. `tests/e2e/portada.spec.js`: con la config en `open` resuelta después del pintado, no queda ningún enlace a `beta-reclutamiento.html` ni la palabra beta, la FAQ sigue abierta y el CTA final abre el registro.

## REQ-216 - Modo conversacional (beta oculta): usar la app desde el chat

**Estado: implementado.**

### Origen

Feedback de Jonathan (2026-10-18): llevar la interfaz a algo predominantemente agéntico. En el futuro no harían falta tantos controles: el uso es conversacional (qué entreno hoy y la rutina paso a paso; qué como; "estoy comiendo otra cosa" con una foto) y la conversación muestra controles y botones dentro del propio chat. El usuario debe poder elegir entre la interfaz normal y la conversacional, y la conversacional debe probarse bien primero, oculta o en beta, sin afectar lo que ya funciona.

### Punto de partida en el código

- REQ-21/REQ-42: el coach vive en Hoy (`renderHoy()`, `index.html:4419`) con contexto de macros, entreno y semana (`buildCoachContextText()`, `index.html:5859`).
- `sendCoachMessage()` (`index.html:6244`) ya devuelve `propuesta` con acciones validadas (`COACH_ACTION_TYPES`, `index.html:5820`: descanso, registrar comida, cambiar plato, adaptar entreno, registrar peso).
- REQ-172: estimar una comida con foto. REQ-41: ejecutor de acciones con guardrails.

### Objetivo

Un modo "Conversación" que se activa desde Perfil (solo para cuentas con la marca `labs.conversational`, que pone el admin). Usa los mismos datos y validaciones que la interfaz normal y permite volver a ella en un toque.

### Alcance propuesto por fases (a aprobar)

1. **Fase 1, shell y tarjetas:** marca por usuario; el modo reemplaza las tabs por un hilo con barra de entrada (texto, foto, voz). Al abrir, el coach saluda con el estado del día **sin llamada pagada** (agenda determinista de REQ-40) y tarjetas interactivas dentro del hilo: "Entreno de hoy" (abre el reproductor existente en línea), "Comidas de hoy" (marcar hecha / cambiar), "Registrar peso". Las acciones del coach se confirman con botones en la tarjeta, nunca en silencio.
2. **Fase 2, intención libre:** "estoy comiendo otra cosa" + foto → `meal_estimate` → tarjeta con macros y "Registrar"; "solo tengo 20 min" → adaptar entreno con vista previa.
3. **Fase 3, medir:** eventos de uso por modo (sin contenido) para comparar adherencia antes de abrirlo a más usuarios.

### Fuera de alcance

- Quitar la interfaz normal. Nuevas dependencias o framework.

### Riesgos

- Costo: cada mensaje libre es una llamada pagada; reusar las cuotas de `coach_conversation` y priorizar tarjetas deterministas.
- REQ-31: el modo no menciona IA. Confirmación antes de modificar (principio 4). La degradación sin conexión vuelve a las tarjetas deterministas.

### Criterios de aceptación (fase 1)

- Sin la marca, nada cambia (E2E existentes en verde).
- Con la marca: se puede completar el día (entreno + comidas + peso) solo desde el hilo, sin llamadas pagadas, con E2E y mocks.

### Verificación sugerida

- Prototipo navegable antes de implementar (`impeccable shape`), revisado por Jonathan.

### Implementación

Decisión (Jonathan, 2026-10-19: "sigue todo tú"): fase 1 oculta por enlace, sin admin.
1. `applyLabsParam()` tras el inicio de sesión: `?labs=conversacion` guarda `prefs.labs.conversational`; `?labs=off` lo quita y vuelve a la vista normal; el parámetro se borra de la URL.
2. Perfil → Cuenta muestra "Modo de la app (en prueba)" Normal/Conversación solo con la marca; `setUiMode()` guarda `prefs.uiMode`.
3. `render()` → `renderChatMode()` sin tabs: saludo determinista (entreno de hoy + kcal/proteína), chips que responden con tarjetas (`chatAsk()`: entreno con `renderWorkoutExecution()`, comidas con `mealCard()`, peso con `chatSaveWeight()`), turnos locales del día en `sessionStorage` e hilo del coach (`loadCoachChat()`) intercalado; "Vista normal" siempre visible. SW v103.
4. E2E `tests/e2e/conversacion.spec.js`: con la marca se hace el día desde el hilo sin llamadas al coach en las tarjetas; sin la marca no aparece.

## REQ-209 - Fix: la app no ocupa todo el ancho y siempre hay una barra de scroll

**Estado: implementado.**

### Origen

Feedback beta de Jonathan (2026-10-18): "hay que arreglar el scroll horizontal; no coge todo el ancho de la pantalla y siempre hay una barra de scroll".

### Problema

No se pudo reproducir en Chromium móvil emulado (2026-10-18): Hoy, Nutrición, Entreno (también con el reproductor abierto), Progreso, Perfil con todos sus acordeones, los 4 pasos del onboarding, la portada y `beta-reclutamiento.html` (versión anterior al rediseño de REQ-199), a 360, 375 y 390 px, tienen `scrollWidth == clientWidth`, ningún elemento sobresale de `#app` y ningún contenedor tiene scroll horizontal propio.

### Causa raíz (hipótesis a confirmar)

- `index.html:76-77`: `body` es `height:100dvh; overflow:hidden` y el scroll vive en `#app` (`index.html:84-85`, `overflow-y:auto; max-width:560px`), no en el documento. En escritorio, y en navegadores con barras clásicas (Windows, o macOS con "mostrar barras siempre"), la app es una columna de 560 px con su propia barra vertical en medio de la pantalla. Eso encaja con "no coge todo el ancho" y "siempre hay una barra".
- En iOS, `overflow-x:hidden` solo está en `body`/`#app` y no en `html`. Si algún contenido real (nombres largos de platos o ejercicios del coach, que los mocks no tienen) desborda, Safari permite arrastrar la página de lado.

### Objetivo

En cualquier dispositivo, la app ocupa el ancho disponible de forma intencional y no muestra barras de scroll que no aporten.

### Alcance (una vez reproducido)

1. Según la evidencia: o la barra de `#app` se estiliza/oculta (`scrollbar-gutter`, `scrollbar-width:thin`), o el scroll pasa al documento manteniendo la barra de tabs fija; en móvil, `overflow-x:clip` en `html` y corte de palabras largas (`overflow-wrap:anywhere`) en títulos de platos y ejercicios.
2. E2E que falle con el código actual en el caso reproducido.

### Criterios de aceptación

- El caso de la captura deja de verse; sin regresión en `tactil.spec.js`, `accesibilidad.spec.js` y `portada.spec.js`.

### Verificación sugerida

- Jonathan: captura + modelo de teléfono/navegador (o "escritorio, Chrome en Windows").

### Implementación

Sin cambios propios. Descartado por decisión de Jonathan (2026-10-19); mitigación de causas plausibles en REQ-221.

## REQ-206 - Entreno: registrar a mano lo entrenado (también en días de descanso) con estimación de calorías

**Estado: implementado.**

### Origen

Feedback de Claudia (beta, 2026-10-18): aunque tenga día de descanso, si no le apetece descansar quiere añadir que hoy entrenó, qué hizo y que la app le estime cuánto gastó según el deporte.

### Problema

Un día de descanso solo mostraba "Descanso planificado" sin acciones, y un día de entreno solo admitía la sesión guiada del plan. No había forma de registrar otra actividad ni de saber su gasto.

### Alcance

1. `dayState(ds).manualActivities` (`{id,sport,minutes,intensity,notes,kcal,weightKg,loggedAt}`), sincronizado con el resto de `day_log.state` sin migración (el merge de `sync-conflicts.js` ya conserva campos nuevos); `validateDayLogState()` exige que sea array si existe.
2. Estimación determinista, sin llamadas externas: `kcal = MET × kg × horas`, redondeada a 5, con 16 deportes y tres intensidades (MET aproximados del Compendio de Actividades Físicas). Peso: el último registrado, el del perfil o 70 kg de referencia (la app lo avisa).
3. Entreno: sección "Actividad registrada" con "Hoy entrené igual: registrar actividad" (descanso) o "＋ Registrar otra actividad" (día de entreno); editar y quitar. Modal con deporte, minutos, intensidad, detalle opcional y estimación en vivo.
4. Hoy: la fila de descanso de la agenda ofrece "Entrené igual" sin contar como pendiente, y la tarjeta de descanso de la acción del día "Hoy entrené igual"; con actividad registrada ambas lo resumen.
5. Una actividad registrada cuenta como día entrenado: `workoutOutcomeForState()` la trata como completada y `trainingDayResult()` devuelve `done` también en descanso. Solo hoy o días pasados; no con la pausa por seguridad activa.
6. `CACHE_NAME` → `fitbud-pwa-v90`.

### Fuera de alcance

- Sumar las calorías gastadas al objetivo de comida del día.
- Importar actividades de relojes o apps de salud.

### Riesgos

- La estimación MET es aproximada (±20-30%); la UI la presenta como "≈ … kcal gastadas" y estimación.

### Criterios de aceptación

- En un día de descanso se registra "Pádel 60 min moderada" y la app estima ≈ 450 kcal con 75 kg; el día pasa a contar como entrenado y al quitarla vuelve a descanso. ✓
- En un día de entreno se registra otro deporte y el día cuenta como entrenado. ✓
- La fila de descanso no infla el contador de pendientes de Hoy. ✓
- `node scripts/release-gate.mjs` pasa. ✓ (`tests/e2e/actividad-manual.spec.js`)

## REQ-207 - Fix: "Estimar con foto" no deja elegir una foto de la galería

**Estado: implementado.**

### Origen

Jonathan (2026-10-19): al estimar una comida con foto, el móvil solo abre la cámara; no se puede elegir una foto ya hecha.

### Causa raíz

Los dos selectores de foto (`#f_photo` en el editor de comidas, REQ-172, y el de la foto del resumen de progreso) declaraban `capture="environment"`, que en iOS y Android abre directamente la cámara trasera y omite la fototeca. El resumen incluso dice "Tomar o elegir foto".

### Alcance

1. Quitar `capture` de ambos inputs (`accept="image/*"` se mantiene): el sistema muestra su menú nativo con fototeca, cámara y archivos.
2. `tests/e2e/foto-comida.spec.js` y `scripts/validate-meal-photo-estimate.mjs` (que exigía `capture`) comprueban ahora que el input no fuerza la cámara.
3. `CACHE_NAME` → `fitbud-pwa-v91`.

### Fuera de alcance

- Elegir varias fotos a la vez.

### Riesgos

- Ninguno: la cámara sigue disponible desde el mismo menú del sistema.

### Criterios de aceptación

- Ningún `<input type="file">` de la app declara `capture`. ✓
- En iPhone, "Estimar con foto" ofrece "Fototeca" y "Tomar foto" (verificación manual tras el deploy).
- `node scripts/release-gate.mjs` pasa. ✓

## REQ-217 - Beta: la postulación cierra con una confirmación amable y sin callejones sin salida

**Estado: implementado.**

### Origen

Jonathan (2026-10-19): quien postula tiene que saber, de forma amable, que sus datos llegaron, que se revisarán y que se le escribirá si queda. La crítica de impeccable (19/36) encontró además: tras enviar, el formulario seguía visible y se podía volver a enviar; la API rechazaba "Dónde se rompe" vacío y casos de menos de 20 caracteres que el navegador dejaba pasar, con mensajes sin tildes ("WhatsApp invalido.") y un "intenta más tarde" engañoso; "Limpiar" borraba todo junto al botón de enviar; recargar perdía lo escrito; elegir una cuarta fricción desmarcaba otra.

### Alcance

1. Al enviar, el formulario se reemplaza por un panel "¡Gracias, {nombre}! Ya tenemos tu postulación." con el número de WhatsApp al que se le escribirá y tres pasos (recibida → la revisamos → te escribimos). Recibe el foco. Ya no muestra el número de postulación.
2. Validación igual a la API: al menos una fricción (contador "n de 3"), historia de 20 a 1400 caracteres, WhatsApp de 8 a 15 dígitos con código de país, `maxlength` en nombre y ciudad. La cuarta fricción no se marca y se avisa.
3. `api/beta-recruitment.js`: mensajes en español claro con tildes; los 500 no exponen texto interno. Si el error nombra un campo, la página lleva el foco ahí.
4. Borrador en `localStorage` (con try/catch) que se borra al enviar; sin botón "Limpiar"; el aviso de salud pasa arriba de la historia.

### Criterios de aceptación

- `tests/e2e/beta.spec.js`: envío completo muestra el panel y oculta el formulario; sin fricción no se envía; la cuarta fricción no desmarca otra; el borrador sobrevive a recargar; un 400 de WhatsApp se explica y enfoca el campo. ✓
- impeccable sin hallazgos; axe sin violaciones en el panel. ✓

## REQ-218 - Admin: pantalla "Postulantes beta" para revisar, aceptar con 90 días y avisar por WhatsApp

**Estado: implementado.**

### Origen

Jonathan (2026-10-19): necesita ver a los postulantes y aceptarlos de forma clara, y que al aceptarlos se les asignen por defecto los 3 meses gratis con las cuotas del coach. Hasta ahora solo existían scripts de terminal (REQ-203).

### Alcance

1. `api/admin.js` (solo admin activo): `betaApplicants` (filtros por revisar / aceptados / descartados / todos, con conteos), `betaAccept` (código de 90 días del plan `quarterly`, activable 30 días, auditado con el admin; postulación en `beta_invited` con nota; devuelve mensaje, enlace `/?codigo=` y `wa.me`) y `betaSetStatus` (`new`, `shortlisted`, `rejected`, `archived`; `beta_invited` solo se pone aceptando).
2. `index.html`: Perfil → Administración → "Postulantes beta" (vista `adminBeta`, solo admin). Tarjetas con datos legibles, historia plegable, aviso de lesión, "Aceptar (90 días)", "Descartar", "Volver a revisar", "Generar enlace nuevo" y "Abrir WhatsApp". Al aceptar, modal con el mensaje, "Enviar por WhatsApp" y "Copiar mensaje". SW v92.
3. `BETA_PROGRAM.md`: revisar y aceptar desde la app; la terminal queda como alternativa.

### Criterios de aceptación

- `scripts/test-admin-beta-api.mjs` (gate): conteos, código de 90 días `quarterly` auditado, `beta_invited` con nota, mensaje y `wa.me` correctos, ids inválidos, estados no permitidos y 403 para no admin. ✓
- `tests/e2e/admin-beta.spec.js`: el admin acepta y ve el mensaje con el enlace; un usuario normal no entra a la vista. ✓

## REQ-221 - Mitigación de REQ-209: nada desborda la columna y la barra de escritorio es discreta

**Estado: implementado.**

### Origen

REQ-209 (feedback beta 2026-10-18: "no coge todo el ancho y siempre hay una barra de scroll") no se reprodujo en Chromium móvil (360-414 px) ni en producción (`evolvapp.club/beta` a 375 px). Mientras llega la captura, se cierran las causas plausibles. Una prueba encontró una real: con un nombre de plato sin espacios, la tarjeta "Próxima comida" de Hoy (`.agenda-name`) se estiraba a 936 px dentro de la columna.

### Alcance

1. `html{overflow-x:clip}`: iOS no deja arrastrar la página de lado.
2. `#app` con barra fina (`scrollbar-width:thin`), para escritorio con barras clásicas.
3. `overflow-wrap:break-word` en `#app` y `anywhere` en títulos, nombres de comida/agenda/ejercicio, lista de compra y chat. SW v101.

### Criterios de aceptación

- `tests/e2e/ancho.spec.js`: a 360 px, un nombre de 120 caracteres no desborda Hoy ni Nutrición (antes: 658 px de desborde). ✓

## REQ-224 - Fix Entreno: un borrador de plan archivado le gana al plan activo en los días nuevos

**Estado: implementado.**

### Origen

Feedback de una usuaria (2026-10-19): la rutina que le cargó su coach no aparecía; el lunes mostraba la rutina genérica.

### Causa raíz

`planVersionForDate()` (`index.html`) ordenaba las versiones que cubren el día primero por `valid_from` y recién después por estado. Dos borradores generados el 13 y luego archivados (`superseded`, `valid_to` sin recortar) empezaban un día después que el plan activo, así que cada día nuevo sin ancla quedaba asignado a un borrador archivado.

### Alcance

1. `planVersionForDate()`: si alguna versión no reemplazada cubre el día, las reemplazadas quedan fuera; un día ya anclado (`planVersionId`) conserva su versión (historial inmutable).
2. Datos: recorte de `valid_to` de los borradores archivados y re-anclaje de los días futuros sin actividad al plan activo.
3. `scripts/validate-plan-version-for-date.mjs` en el release gate. `CACHE_NAME` v106.

### Criterios de aceptación

- El plan activo gana a un borrador archivado posterior; un día anclado conserva su versión; un día cubierto solo por una versión reemplazada la sigue usando. ✓

## REQ-225 - Beta: la aprobación es web y por correo, sin WhatsApp en el flujo

**Estado: implementado.**

### Origen

Jonathan (2026-10-19): la inscripción debe ser automática; las postulaciones tienen que llegarle en la web y aprobarlas o rechazarlas sin pasar por WhatsApp, que queda para el feedback.

### Alcance

1. La postulación pide **Correo** (obligatorio; se guarda en `raw_payload.email`, sin migración). La confirmación y "Cómo funciona" dicen que la invitación llega por correo; la nota final de la portada dice "Te respondemos por correo".
2. `api/admin.js` `betaAccept`: con correo, invitación de Supabase (`/auth/v1/invite`) y 90 días de acceso beta en la misma acción; si ya tenía cuenta, solo el acceso; si el envío falla o no hay correo, enlace con código de respaldo (REQ-218) con el motivo. `channel:"link"` fuerza el enlace ("Generar enlace nuevo").
3. Admin: el correo en cada tarjeta, modal "Le enviamos la invitación a …" (WhatsApp opcional) y aviso en Hoy y en Perfil de las postulaciones por revisar. SW v107.
4. `BETA_PROGRAM.md`: plantilla "Invite user" en español y SMTP propio para no chocar con el límite de envíos de Supabase (manual).

### Criterios de aceptación

- `scripts/test-admin-beta-api.mjs`: con correo invita y da 90 días sin código; cuenta existente solo recibe acceso; envío fallido cae al enlace. `test-beta-recruitment-api.mjs`: guarda el correo. ✓
- `tests/e2e/admin-beta.spec.js`: Hoy avisa de 1 postulación, Aceptar envía la invitación por correo. `beta.spec.js`: la confirmación muestra el correo. ✓

## REQ-226 - Beta: aviso por correo al admin con cada postulación nueva

**Estado: implementado.**

### Origen

Jonathan (2026-10-20): "me envías a mí también el mail cuando alguien se postula", con lo que la app ya tenga conectado.

### Alcance

1. `api/beta-recruitment.js`: tras guardar una postulación nueva, correo vía Resend con la conexión de los recordatorios (`RESEND_API_KEY`, `NOTIFY_FROM_EMAIL`, `NOTIFY_APP_URL`). Destinatarios: `BETA_NOTIFY_EMAIL` o los admins activos. Asunto con el nombre, datos clave, historia, aviso de salud, `reply_to` del postulante y botón a `/?ver=postulantes`. Escapa lo escrito por el postulante; tope de 4 s; un fallo nunca bloquea la postulación; una re-postulación con el mismo WhatsApp no avisa otra vez.
2. `index.html`: `/?ver=postulantes` abre Postulantes beta al admin y limpia la URL. SW v108.
3. `BETA_PROGRAM.md`: variables y comportamiento.

### Criterios de aceptación

- `scripts/test-beta-recruitment-api.mjs`: nueva → 1 correo a admins con escape, enlace y aviso de salud; repetida → ninguno; Resend caído → la postulación responde 200; `BETA_NOTIFY_EMAIL` define destinatarios. ✓
- `tests/e2e/admin-beta.spec.js`: `/?ver=postulantes` abre la pantalla al admin. ✓

## REQ-228 - Fix: "Estimar con foto" falla con un mensaje genérico y sin forma de reintentar

**Estado: implementado.**

### Origen

Jonathan (2026-10-20), con captura: tras elegir una foto de la galería (REQ-207), el análisis responde "Tu coach no pudo completar esta acción. Intenta de nuevo." y no hay forma de saber por qué ni de reintentar sin volver a elegir la foto.

### Problema

`photoEstimateRound()` mostraba `coachErrorMessage(e)`, que para usuarios no admin reduce cualquier fallo (proveedor saturado, tiempo agotado, foto ilegible, error del servidor) al mismo texto genérico, y el `status` HTTP se perdía en `coachProxyFetch()`. El handler del servidor se verificó en local con Supabase y el proveedor simulados (200 con la foto de la captura), así que la causa está en producción y no se podía diagnosticar desde la UI.

### Alcance

1. `coachProxyFetch()` conserva `err.status`.
2. `photoEstimateErrorMessage()`: mensajes concretos sin mencionar tecnología (tardó demasiado, no pudimos leer la foto, mucha demanda, no pudimos estimarla, sin conexión); un motivo no reconocido muestra "(código N)".
3. Botón "Reintentar" con la misma foto; reintentar no consume una ronda de preguntas.
4. `CACHE_NAME` → `fitbud-pwa-v110`.

### Fuera de alcance

- Corregir la causa de producción: queda pendiente de leer el código/mensaje que ahora se muestra o los logs de `/api/claude` en Vercel.

### Riesgos

- Ninguno sobre datos: solo cambia el texto del error y añade el reintento.

### Criterios de aceptación

- Un 503 muestra "mucha demanda" con "Reintentar"; un 500 desconocido muestra "(código 500)"; reintentar con la misma foto estima y usa la misma ronda (`photo-1`). ✓ (`tests/e2e/foto-comida.spec.js`)
- `node scripts/release-gate.mjs` pasa. ✓

## REQ-229 - Fix: "Estimar con foto" estima el plato planeado en vez del que se ve

**Estado: implementado.**

### Origen

Jonathan (2026-10-20), con captura: al editar el almuerzo del plan ("Tacos de frijol negro y queso fresco") y estimar con una foto de espagueti Alfredo, la app responde "Estimado como 3 tacos de tortilla de maíz…", pregunta por los frijoles y deja el nombre de los tacos.

### Causa raíz

`openEditor('meal')` precarga el nombre del plato planeado en "Descripción". `photoEstimateRound()` enviaba ese texto como "El usuario la describe así", y el modelo lo priorizó sobre la imagen. `renderPhotoEstimate()` solo reemplazaba el nombre si estaba vacío o lo había puesto una ronda anterior, así que el nombre planeado quedaba. Además, la clave de reutilización no incluía la descripción, así que la respuesta errónea podía volver a servirse para la misma foto.

### Alcance

1. `window._editor.planName` guarda el nombre precargado de una comida del plan; mientras no se toque, no se envía como descripción (el prompt pide identificar el plato por la foto) y se reemplaza por el nombre estimado.
2. Si el usuario escribe una descripción, se envía con la instrucción de que, si no coincide con la foto, manda la foto.
3. La descripción entra en la clave de reutilización (`photo:<foto>:<respuestas>:<descripción>`); `validate-meal-photo-estimate.mjs` lo exige.
4. `CACHE_NAME` → `fitbud-pwa-v111`.

### Fuera de alcance

- Detectar con la imagen si la foto corresponde a la comida planeada.

### Riesgos

- Ninguno sobre datos: cambia solo qué texto acompaña a la foto y cuándo se reemplaza el nombre.

### Criterios de aceptación

- Editar una comida del plan y estimar con foto de otro plato no envía el nombre planeado y deja el nombre y los macros de la foto; lo escrito por el usuario sí se envía. ✓ (`tests/e2e/foto-comida.spec.js`; falla contra el código previo)
- `node scripts/release-gate.mjs` pasa. ✓

## REQ-230 - Estimar macros: se ve qué valores se aplicaron

**Estado: implementado.**

### Origen

Jonathan (2026-10-20), con captura: "No cambia con los valores estimados". La estimación había escrito 520 / 18 / 58 / 22 sobre 520 / 18 / 62 / 20 del plan: los valores sí cambiaron, pero tan poco que parecía que no.

### Problema

`renderPhotoEstimate()` y `aiEstimate()` escribían los macros en los campos sin ninguna señal; la caja de resultado solo mostraba la nota. Si la estimación se parece a lo que ya había (en este caso porque el modelo se anclaba al nombre del plan, corregido en REQ-229), no hay forma de saber que se aplicó.

### Alcance

1. `applyEstimatedMacros()` (foto y texto): escribe los cuatro valores, los resalta un momento (`.field-updated`, estático con `prefers-reduced-motion`) y añade "Aplicado: N kcal · P g · C g · G g" a la caja de resultado.
2. `CACHE_NAME` → `fitbud-pwa-v112`.

### Fuera de alcance

- Mostrar la diferencia con los valores anteriores.

### Riesgos

- Ninguno: solo presentación.

### Criterios de aceptación

- Tras estimar, la caja muestra "Aplicado: 780 kcal · P 24 g · C 90 g · G 34 g" y los campos llevan `.field-updated`. ✓ (`tests/e2e/foto-comida.spec.js`)
- `node scripts/release-gate.mjs` pasa. ✓

## REQ-231 - Nutrición: la lista de compra va con las herramientas, no como una acción del día

**Estado: implementado.**

### Origen

Jonathan (2026-10-20), con captura: el botón "Lista de compra · semana 1" no tiene sentido en ese lugar ni con esa forma.

### Problema

REQ-215 puso la lista de compra como botón de ancho completo justo debajo de "+ Agregar comida / snack", con la misma forma: parecía una acción más de las comidas del día, cuando es una herramienta de la semana. Además, "semana N" no aporta nada y no se ve cuánto queda por comprar.

### Alcance

1. La lista de compra pasa a la fila de herramientas de Nutrición (`.nut-tools`, separada de las comidas), junto a "Más opciones", como botón compacto con icono de carrito y el número de ingredientes por comprar de lo que queda de semana (`shoppingPendingCount()`).
2. El número se actualiza al marcar "ya lo tengo" sin reabrir (`refreshShoppingTool()`); sin semana activa no se muestra.
3. `CACHE_NAME` → `fitbud-pwa-v113`.

### Fuera de alcance

- Cambiar el contenido de la hoja de la lista (REQ-215).

### Riesgos

- Ninguno sobre datos: solo cambia dónde y cómo se abre.

### Criterios de aceptación

- El botón vive en `.nut-tools`, muestra lo que queda por comprar y baja en 1 al marcar un ingrediente. ✓ (`tests/e2e/lista-compra.spec.js`)
- `node scripts/release-gate.mjs` pasa. ✓

## REQ-227 - Fix onboarding: editar un macro en "Ajustar valores" y continuar guarda una meta donde kcal ≠ suma de macros

**Estado: implementado.**
`reconcileOnboardingMacros()` (index.html) reconcilia en `readOnboardingStep()` paso 2: si el usuario editó un macro, kcal se recalcula como p·4+c·4+f·9; si editó solo kcal, proteína queda fija y carbos/grasa escalan proporcionalmente (mismo patrón que `applyWeeklyCheckinProposal`), con piso de 50g carbos/45g grasa. Toast avisa cuál lado se ajustó. Test: `scripts/validate-onboarding-macro-reconcile.mjs`.

### Origen

Auditoría del journey **onboarding** (commit previo leído: `7619516` Merge REQ-226). Recorrido funcional del paso 2 "Define tu objetivo y tus macros" sirviendo la app en local (`python3 -m http.server 8923`) y accionando el flujo real en el navegador. Archivos revisados: `index.html` (onboarding, `readOnboardingStep`, `validateOnboardingStep`, `effectiveDayTarget`, `profileMacroTargetsFromPrefs`), `js/nutrition-pure.js` (`calculateMacroTargets`).

### Problema

En el paso 2, el bloque colapsable "Ajustar valores (opcional)" expone cuatro inputs independientes (Calorías, Proteína, Carbohidratos, Grasas). El botón "Recalcular valores" vuelve a derivar los cuatro desde la fórmula (y pisa cualquier edición), por lo que un usuario que solo quiere **ajustar un valor** (p. ej. subir proteína de 120 a 180 g, o bajar sus calorías) edita ese campo y pulsa **"Continuar"**, no "Recalcular". Al hacerlo, la meta queda con `kcal ≠ proteína·4 + carbos·4 + grasa·9`, y así se persiste en el perfil y se muestra.

Reproducción concreta (verificada en navegador):
1. Paso 1 con datos válidos (mujer, 30, 165 cm, 60 kg, actividad moderada) → la fórmula calcula **1740 kcal · P 120 · C 207 · G 48** (coherente: 120·4+207·4+48·9 = 1740).
2. Paso 2 → abrir "Ajustar valores", cambiar **solo** Calorías a `1200` (dejando P/C/G), pulsar "Continuar".
3. Paso 4 "Casi listo" → el resumen "Tu referencia diaria" muestra **"1200 kcal · P 120 g · C 207 g · G 48 g"**, cuando esos macros suman 1740 kcal. La meta guardada queda `calorieTarget:1200` con macros de 1740.

Impacto en el usuario: la meta del día (`effectiveDayTarget`) toma `calorieTarget` como presupuesto de kcal del anillo, pero los macros objetivo (y el día generado que los persigue) suman otra cosa. El usuario ve un anillo de calorías con una meta (1200) que **nunca** cuadra con sus metas de macros (1740): o sobrepasa las kcal cumpliendo macros, o se queda corto en macros cumpliendo kcal, de forma permanente, y la adherencia en Progreso queda sesgada. Rompe el invariante "kcal = suma de macros" que REQ-77 fijó para las metas calculadas y que el check-in semanal (`applyWeeklyCheckinProposal`) preserva deliberadamente escalando carbos/grasa.

### Causa raíz

- `readOnboardingStep()` paso 2 (`index.html:3340`) lee los cuatro campos como valores independientes: `d.calorieTarget=+$("#ob_kcal").value; d.proteinTarget=+$("#ob_protein").value; ...` sin reconciliar.
- `validateOnboardingStep()` paso 2 (`index.html:3384`) solo exige que los cuatro sean finitos y `>0`; no verifica coherencia `kcal ≈ Σ macros`.
- `onboardingNext()` (`index.html:3401`) solo recalcula al salir del **paso 1** (`if(onboardingStep===1)applyCalculatedMacros()`); una edición manual en el paso 2 pasa sin tocar.
- `effectiveDayTarget()` / `profileMacroTargetsFromPrefs()` (`index.html:1673,1678`) construyen la meta como `{kcal:+calorieTarget, p,c,f}` directo desde prefs, así que la incoherencia se propaga a la meta del día.
- `calculateMacroTargets()` (`js/nutrition-pure.js:286`) sí garantiza `kcal = p·4+c·4+f·9`, pero solo se invoca al calcular/recalcular, no al editar un campo suelto.

### Objetivo

Que después del onboarding la meta nutricional guardada siempre cumpla `kcal = proteína·4 + carbos·4 + grasa·9` (dentro de la tolerancia `TARGET_KCAL_DELTA`), sin importar si el usuario ajustó un valor a mano, y que lo mostrado coincida con lo que se persigue.

### Alcance

1. Al leer/validar el paso 2 (o al guardar en `saveOnboarding`), reconciliar la meta para que `kcal = Σ macros`. Opción recomendada (coherente con el check-in semanal `applyWeeklyCheckinProposal`): si el usuario editó **kcal**, mantener proteína y re-escalar carbos/grasa al nuevo presupuesto; si editó un **macro**, recomputar `calorieTarget` como `p·4+c·4+f·9`. Elegir una sola regla clara y aplicarla de forma determinista.
2. Dar feedback visible cuando los cuatro campos no cuadran (p. ej. recalcular el campo dependiente en vivo, o un aviso "ajustamos tus calorías para que cuadren con tus macros").

### Fuera de alcance

- La fórmula de cálculo (`calculateMacroTargets`) y la lógica de `goal`/`activity` — no se tocan.
- La edición de macros en Perfil y el check-in semanal — ya preservan el invariante; este REQ es solo el paso 2 del onboarding.
- Cambiar el diseño del colapsable "Ajustar valores" o quitar la edición manual.

### Riesgos

- Elegir una regla de reconciliación que sorprenda al usuario (p. ej. que al subir proteína le bajen los carbos sin avisar). Mitigar con el feedback del punto 2.
- Regresión en `hasCompleteOnboarding()` / generación de la primera semana si la reconciliación deja algún macro en 0; respetar pisos `cFloor`/`fFloor` como hace `calculateMacroTargets`.

### Criterios de aceptación

- Tras editar solo las calorías (o solo un macro) y pulsar "Continuar", la meta guardada cumple `|calorieTarget − (p·4+c·4+f·9)| ≤ TARGET_KCAL_DELTA` y el resumen "Tu referencia diaria" muestra valores coherentes.
- El usuario puede seguir ajustando un valor a mano; el sistema reconcilia los demás de forma determinista y, si corresponde, lo avisa.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Reproducir los pasos de arriba y confirmar que "Tu referencia diaria" ya no muestra `1200 kcal` con macros que suman 1740.
- Prueba unitaria/vm sobre el helper de reconciliación: entradas `{kcal:1200,p:120,c:207,f:48}` → salida con `kcal = Σ macros`.
- Evidencia funcional de esta auditoría: captura `scratchpad/req227-onboarding-kcal-mismatch.jpg` ("Tu referencia diaria: 1200 kcal · P 120 g · C 207 g · G 48 g").

## REQ-232 - Entreno: cada ejercicio muestra con qué carga lo hiciste la última vez

**Estado: implementado.**

### Origen

Claudia (usuaria beta, 2026-10-19), con captura del reproductor: "para planes de x semanas, que te indique aquí debajo de la carga sugerida el histórico de cuántos kg de carga hiciste la última semana en ese ejercicio, para tener el peso identificado en la app. O que te dé ese dato cuando presionas Usar progresión".

### Problema

El reproductor guarda la carga de cada serie (`set.load`) en `day_log.state.workoutExecution`, pero nunca la vuelve a mostrar: bajo "Carga sugerida" solo aparece el texto genérico "Carga controlable que deje N repeticiones en reserva". Para progresar semana a semana hay que recordar de memoria (o en otra app) con cuánto se hizo el ejercicio.

### Alcance

1. `FITBUD_WORKOUT_PLAYER.lastPerformance(days, exerciseSlug, beforeDs)` (puro): la sesión anterior más reciente con series hechas de ese ejercicio — fecha, variación y series (reps, carga tal como se anotó, RPE).
2. En el reproductor, bajo "Carga sugerida": "Última vez · mar 13 oct" con las series ("3 × 8 · 40 kg" si todas iguales, "40 kg × 8, 42.5 kg × 7" si no) y el rango de RPE; indica si aquella vez fue en progresión o versión más fácil, y "Sin carga anotada" si no se registró peso. Sin historial (y no es de peso corporal), una línea invita a anotar la carga para verla la próxima vez.
3. En "Qué vas a hacer hoy" (antes de empezar), cada ejercicio con historial muestra "Última vez N kg" (la carga de la última serie).
4. `CACHE_NAME` → `fitbud-pwa-v114`.

### Fuera de alcance

- Autocompletar la carga de hoy con la de la última vez (al marcar una serie sin carga, sigue quedando vacía).
- Historial de ciclos anteriores: se busca en los días cargados (`pullAllDays()` baja el ciclo activo).
- Proponer un incremento de carga concreto en kg.

### Riesgos

- Ninguno sobre datos: solo lectura de lo ya registrado, privado del usuario y fuera de analytics.

### Criterios de aceptación

- `lastPerformance` toma la sesión anterior más reciente con series hechas, ignora hoy y sesiones sin series. ✓ (`scripts/validate-workout-player.mjs`)
- Con 40 kg × 8 y 42.5 kg × 7 hace una semana, el reproductor muestra "40 kg × 8, 42.5 kg × 7 · RPE 8-9" y el resumen previo "Última vez 42.5 kg"; un ejercicio sin historial muestra la invitación a anotar. ✓ (`tests/e2e/entreno.spec.js`, captura 375px revisada)
- `node scripts/release-gate.mjs` pasa. ✓

## REQ-242 - Fix: lo registrado ayer desaparece al abrir la app hoy si su subida había fallado

**Estado: implementado.**

### Origen

Feedback de Sathya (beta, 2026-10-21, iPhone): "Ayer no me gustaron las comidas que me sugirió la aplicación, entonces puse lo que de verdad comí (seis huevos con pan con queso y un café) y sí me apareció esa comida editada y me permitía hacerle check, igual con el almuerzo. Hoy quise ver la información de ayer porque me quedó pendiente poner la cena y no se guardaron los datos que había ingresado."

### Problema

Si la subida de un día falla (token vencido al volver la PWA del fondo, red débil), el cambio queda en la cola offline. Al abrir la app al día siguiente ese día aparece "Sin asignar", y si el usuario lo completa (la cena), esa copia vacía reemplaza al cambio pendiente y sube: desayuno y almuerzo se pierden. Reproducido en Chromium móvil con fixtures (0 llamadas pagadas).

### Causa raíz

- `onAuth()` (`index.html`) vacía `S.days`/`S.weights` en cada arranque ("la DB manda"), y `pullAllDays()`/`pullDay()` omiten a propósito los días con cambios pendientes en la cola. Resultado: lo pendiente solo vivía en la cola y la pantalla quedaba vacía hasta que `drainSyncQueue()` lograra subirlo.
- `enqueueMutation()` deduplica por día y reemplaza el payload pendiente con el nuevo, armado sobre el día vacío.
- `drainSyncQueue()` solo reintentaba `pending`: un cambio que agotó sus 3 intentos (`failed`) no volvía a subir nunca, aunque el aviso dice "vuelve a conectarte para reintentarlo".

### Alcance

1. `restorePendingFromQueue()`: tras vaciar la caché en `onAuth()`, repone desde la cola del usuario actual (pending, failed o conflicto) el estado de esos días y pesos. La cola de otros usuarios no se toca (REQ-156).
2. `drainSyncQueue()` reintenta también los cambios `failed` al abrir la app o reconectar.
3. `CACHE_NAME` → `fitbud-pwa-v124`.

### Fuera de alcance

- Por qué falló la subida en el caso de Sathya (no hay telemetría de errores de sync). Los datos del 20 oct que nunca llegaron al servidor solo existen en la cola de su iPhone: al abrir la versión nueva se reponen y suben solos, salvo que ya haya completado ese día (en ese caso la copia vacía ya pisó la cola y no se pueden recuperar).
- El texto "CONSUMO DE HOY" que se ve al mirar un día pasado.

### Riesgos

- Un día en conflicto muestra la versión de este dispositivo hasta que el usuario elija en "Revisar"; antes se veía vacío.

### Criterios de aceptación

- Con la subida de ayer fallida y el primer reintento de hoy también fallando, ayer muestra desayuno y almuerzo registrados y marcados; al completar la cena, lo que sube conserva los tres y la cola queda vacía. ✓ (`tests/e2e/dia-sin-subir.spec.js`; falla sin el arreglo)
- Un cambio `failed` en la cola se sube al abrir la app y el día se ve. ✓ (`tests/e2e/dia-sin-subir.spec.js`)
- `node scripts/release-gate.mjs` pasa.

## REQ-235 - Entreno: la sesión empieza con una cuenta atrás de 3 segundos

**Estado: implementado.**

### Origen

Jonathan (2026-10-20), con captura del reproductor recién iniciado: "Cuando inicias el entrenamiento comienza en seco de frente; debería haber una cuenta atrás que te avise con 3 segundos de anticipación que ya va a comenzar".

### Problema

`startWorkoutExecution()` creaba la ejecución y empezaba a correr el reloj de la sesión en el mismo toque de "Iniciar sesión guiada", sin margen para dejar el teléfono y ponerse en posición.

### Alcance

1. "Iniciar sesión guiada" (y "Empezar" en el modo conversacional) abre una cuenta atrás a pantalla completa: "Prepárate", 3 · 2 · 1 con un pitido corto y vibración (si el dispositivo la soporta) en cada número, y "Empiezas con: <primer bloque>". Al llegar a 0 suena un pitido más largo, se crea la sesión y arranca el reloj (`beginWorkoutExecution()`).
2. "Cancelar" (o Escape) cierra sin crear nada; "Empezar ya" la salta.
3. Con `prefers-reduced-motion` el número cambia sin animación.
4. `tests/e2e/helpers.js`: `startGuidedSession()` inicia saltando la cuenta atrás para las pruebas que no la ejercitan.
5. `CACHE_NAME` → `fitbud-pwa-v117`.

### Fuera de alcance

- Cuenta atrás al terminar descansos o antes de bloques con cronómetro.
- Preferencia para desactivar el sonido.

### Riesgos

- iOS no implementa `navigator.vibrate`; el pitido depende de que el teléfono no esté en silencio. El aviso visual siempre está.

### Criterios de aceptación

- Tras tocar "Iniciar sesión guiada" no hay sesión durante ~3 s y se ven 3, 2, 1; al terminar el reloj marca 00:00; "Cancelar" no crea sesión; "Empezar ya" la crea al instante. ✓ (`tests/e2e/entreno.spec.js`, captura 375px revisada)
- `node scripts/release-gate.mjs` pasa. ✓

## REQ-236 - Entreno: calentamiento y vuelta a la calma son opcionales y se preguntan

**Estado: implementado.**

### Origen

Jonathan (2026-10-20), con captura del calentamiento en el reproductor: "No debe asignarte el bloque de calentamiento ni enfriamiento por defecto; debería preguntarte si quieres hacer ese bloque y solo mostrarlo si lo eliges, diciéndote que es opcional".

### Problema

Calentamiento (REQ-212) y vuelta a la calma eran obligatorios: omitirlos contaba como bloque omitido y dejaba la sesión parcial.

### Alcance

1. `workout-player.js`: bloques `warmup`/`cooldown` con `optional:true`, `optIn` si se eligen y estado `declined` ("Ahora no"), que `progress()` no cuenta en el total ni como omitido.
2. Reproductor: un bloque opcional no elegido muestra solo la pregunta ("¿Quieres calentar antes de empezar?" / "¿Quieres cerrar con unos minutos suaves?"), duración y "Es opcional", con "Sí, calentar"/"Sí, hacerlo" y "Ahora no"; los movimientos aparecen solo si se elige.
3. Una sesión con todo hecho salvo bloques rechazados se cierra **completada** (`workoutFullyCompleted`).
4. "Qué vas a hacer hoy" marca Calentamiento y Vuelta a la calma como "opcional"; la cuenta atrás (REQ-235) ya no anuncia el calentamiento.
5. Aplica a fuerza y cardio. `CACHE_NAME` → `fitbud-pwa-v118`.

### Fuera de alcance

- Recordar la elección entre sesiones o una preferencia en Perfil.
- Volver a ofrecer un bloque después de "Ahora no".

### Riesgos

- Ninguno sobre datos: las sesiones guardadas no cambian.

### Criterios de aceptación

- `optional`/`declined`/`progress` cubiertos en `scripts/validate-workout-player.mjs`. ✓
- "Ahora no" en ambos bloques: el total baja, no hay bloques omitidos y la sesión se guarda completada; "Sí, calentar" muestra la lista de REQ-212. ✓ (`tests/e2e/entreno.spec.js`, `conversacion.spec.js`, capturas 375px revisadas)
- `node scripts/release-gate.mjs` pasa. ✓

## REQ-220 - Fix táctil: "¿Qué es RPE?" medía 42 px y dejaba el release gate en rojo

**Estado: implementado.**

### Origen

`tests/e2e/tactil.spec.js` (REQ-193) fallaba en `main` desde 2026-10-18: el enlace "¿Qué es RPE?" del resumen de Entreno (`.link-btn.small`) medía 100×42 px en táctil. El gate quedaba en rojo para todos los loops.

### Alcance

1. `@media(pointer:coarse)`: `.link-btn` con `min-height:44px` y `box-sizing:border-box`, sin cambiar su aspecto. SW v93.

### Criterios de aceptación

- `tactil.spec.js` pasa y el release gate queda en verde. ✓

## REQ-222 - Fix admin: la cortesía de consumo rechazaba 3000 sin decir por qué

**Estado: implementado.**

### Origen

Jonathan (2026-10-19, captura): en "Consumo y cortesía" de un beta tester, límite 3000 y unidades extra 3000 en `coach_conversation` → "Usuario, acción y valores de cortesía válidos requeridos." y no guardaba. `api/admin.js` (`setQuotaOverride`) aceptaba como máximo 1000 en ambos campos con un único mensaje genérico; el selector mostraba la clave interna `coach_conversation`.

### Alcance

1. Tope por día y por acción a 10.000 (`QUOTA_OVERRIDE_MAX`, solo contra errores de tipeo); cada error dice qué campo y qué rango.
2. Modal: ayuda "Por día y por acción, de 0 a 10.000", validación antes de enviar con foco en el campo, y "Conversación con el coach" en el selector. SW v104.

### Criterios de aceptación

- `scripts/test-coach-quota.mjs`: 3000/3000 en `coach_conversation` se guarda; 20000 responde 400 nombrando el campo y el rango. ✓

## REQ-223 - Textos: la beta no se limita a países

**Estado: implementado.**

### Origen

Jonathan (2026-10-19, captura de la portada): "no debe limitar países en ningún texto". La portada decía "Beta de fundadores en Perú, Chile y México" y la postulación repetía los países en la nota del hero, las meta descripciones, la ayuda de WhatsApp (+51, +56, +52) y los ejemplos ("Lima, Perú", "+51 999 999 999").

### Alcance

1. `index.html` (nota del hero en modo invitación) y `beta-reclutamiento.html` (meta, nota del hero, ayuda y ejemplos de WhatsApp y ciudad) sin países; los ejemplos pasan a "+ código de país y número" y "Ciudad, país".
2. `api/beta-recruitment.js`: el error de WhatsApp pide el código del país sin ejemplo de un país. SW v105.

### Criterios de aceptación

- `tests/e2e/portada.spec.js` y `tests/e2e/beta.spec.js`: ni la portada ni la postulación (incluida la meta descripción) mencionan Perú, Chile o México. ✓

## REQ-238 - Fix: "Estimar macros" falla sin decir por qué y se ve una caja rota "Foto de la comida"

**Estado: implementado.**

### Origen

Jonathan (2026-10-21), con captura del editor de comida: "No funciona". "Estimar macros" de "Sopa ramen vegetariana" muestra "Tu coach no pudo completar esta acción. Intenta de nuevo." y bajo los botones se ve una caja vacía con el texto "Foto de la comida".

### Problema

1. `.meal-photo-preview{display:block}` anula el atributo `hidden` del `<img>` de la vista previa: sin foto se ve una imagen rota con su texto alternativo.
2. `aiEstimate()` (texto) reduce cualquier fallo al mensaje genérico y no ofrece reintentar; REQ-228 solo lo resolvió para la foto. El handler de `/api/claude`, ejecutado en local con Supabase y el proveedor simulados, responde 200 para el texto: la causa está en producción y no se ve desde la UI.

### Alcance

1. `.meal-photo-preview[hidden]{display:none}`.
2. `estimateErrorMessage(e, photo)` (antes `photoEstimateErrorMessage`) sirve a foto y texto: demora, mucha demanda, no se pudo estimar (con consejo para el texto), sin conexión, y "(código N)" si el motivo no se reconoce.
3. "Estimar macros" muestra ese mensaje y "Reintentar" (no con el aviso de plan).
4. `CACHE_NAME` → `fitbud-pwa-v120`.

### Fuera de alcance

- La causa de producción: leer el código que ahora se muestra (o el mensaje completo, con una cuenta admin) o los logs de `/api/claude` en Vercel.

### Riesgos

- Ninguno sobre datos: solo presentación y reintento.

### Criterios de aceptación

- Sin foto, la vista previa no se ve; un 500 muestra "(código 500)", un 422 pide describir mejor y "Reintentar" estima. ✓ (`tests/e2e/foto-comida.spec.js`)
- `node scripts/release-gate.mjs` pasa. ✓

## REQ-237 - Entreno: la tarjeta del tempo dice qué es y lo explica

**Estado: implementado.**

### Origen

Jonathan (2026-10-20), con captura de la tarjeta "3-1-1 · tempo" del reproductor: "No se entiende qué es esto".

### Problema

La dosis mostraba el tempo como "3-1-1" con la etiqueta "tempo", sin explicar que son segundos por fase ni en qué orden. RPE y RIR ya tenían ⓘ con explicación; el tempo no.

### Alcance

1. La tarjeta pasa a ser botón (`.scard-info`, como RPE/RIR): con formato numérico la etiqueta dice "baja · pausa · sube ⓘ"; con texto ("Controlado") dice "ritmo ⓘ".
2. `explainWorkoutTempo()` abre "Ritmo de cada repetición": segundos bajando (o soltando, en remos y jalones), pausa y subida, más la pausa arriba si hay un cuarto número; para "Controlado", sin rebotes y con la bajada más lenta. `tempoPhases()` lee el formato.
3. `CACHE_NAME` → `fitbud-pwa-v119`.

### Fuera de alcance

- Cambiar los tempos que prescribe el plan.

### Riesgos

- Ninguno: solo presentación.

### Criterios de aceptación

- La tarjeta muestra "baja · pausa · sube ⓘ" y al tocarla explica "3 s bajando el peso" y "1 s subiendo"; `tempoPhases("Controlado")` es `null`. ✓ (`tests/e2e/entreno.spec.js`, capturas 375px revisadas)
- `node scripts/release-gate.mjs` pasa. ✓

## REQ-233 - Nutrición: tocar la tarjeta de una comida abre su menú de opciones

**Estado: implementado.**

### Origen

Jonathan (2026-10-20), con captura de Nutrición: "Cuando le das click dentro del card se debería abrir el menú de 3 puntos".

### Problema

La tarjeta de comida (`mealCard()`) solo reacciona a sus botones: tocar el nombre, los macros o el fondo no hace nada, y lo que el usuario espera al tocar una comida (ver la receta, editarla, saltarla, bloquear el plato) vive escondido en un "···" pequeño sin nombre accesible.

### Alcance

1. Tocar la tarjeta fuera de sus controles (`mealCardTap()`) abre `openMealMore()`, el mismo menú que "···". Los botones (marcar hecha, "Otra opción", "Volver al plan", "···", subir/bajar) y la receta siguen haciendo lo suyo.
2. "···" lleva `aria-label="Más opciones de <momento>"`; la tarjeta muestra cursor de puntero.
3. `CACHE_NAME` → `fitbud-pwa-v115`.

### Fuera de alcance

- Tarjetas de extras y comidas saltadas (no tienen menú "···").

### Riesgos

- Ninguno sobre datos: solo abre un menú existente.

### Criterios de aceptación

- Tocar el nombre de una comida abre su menú; marcarla como hecha no lo abre; "···" sigue abriéndolo. ✓ (`tests/e2e/nutricion.spec.js`)
- `node scripts/release-gate.mjs` pasa. ✓

## REQ-239 - Entreno: con la sesión en curso, el plan y los avisos van en un desplegable

**Estado: implementado.**

### Origen

Jonathan (2026-10-21), con captura de Entreno con la sesión en curso: el aviso "Señales para detenerte", la tarjeta del plan ("Correr + Gimnasio · Preparar mi plan · Configurar") y la del entrenamiento ("Push B · cambiado · Cambiar entrenamiento") "no tienen sentido una vez iniciado: solo ocupan espacio y confunden; deberían estar colapsados o juntos en un botón".

### Problema

`renderWorkout()` pintaba siempre esas tres piezas antes del reproductor, aunque con la sesión en curso sus acciones están deshabilitadas o no aplican, y el reproductor quedaba abajo.

### Alcance

1. Con la ejecución `in_progress` o `paused`, el reproductor va justo después de la cabecera del día y el aviso, el plan y la tarjeta del entrenamiento quedan en `<details class="wk-context">` "Plan y detalles de hoy" (con el nombre de la sesión), cerrado por defecto; si se abre, sigue abierto entre acciones del reproductor.
2. La pausa por seguridad (`trainingSafetyHold()`) sigue siempre a la vista. Antes de empezar y con la sesión cerrada (completada o parcial) no cambia nada.
3. `CACHE_NAME` → `fitbud-pwa-v121`.

### Fuera de alcance

- "Actividad registrada" y "Resumen", que siguen debajo.

### Riesgos

- Ninguno sobre datos: solo cambia el orden y la visibilidad.

### Criterios de aceptación

- Con la sesión en curso, el desplegable existe cerrado después del reproductor, oculta el aviso, "Preparar mi plan" y "Cambiar entrenamiento", sigue abierto tras "Ahora no" y desaparece al descartar. ✓ (`tests/e2e/entreno.spec.js`, capturas 375px revisadas)
- `node scripts/release-gate.mjs` pasa. ✓

## REQ-240 - Entreno: la demostración y los pasos se abren desde junto al nombre del ejercicio

**Estado: implementado.**

### Origen

Jonathan (2026-10-21), con captura del reproductor: la demostración del ejercicio y su paso a paso aparecen al final, después de las series y de "Usar versión más fácil / progresión / Sustituir", "y solo lo esconde para el usuario; debería haber arriba, junto al nombre, un botón que abra el pop-up".

### Problema

`renderActiveWorkoutStep()` incrustaba `exerciseCard()` (vídeo/animación + "Ver técnica" + "Pausar") al final del bloque: para verla había que bajar más allá de todas las series.

### Alcance

1. Junto al nombre (`.player-title`), un botón "▶ Cómo se hace" abre `openExerciseGuide()`: demostración, inicio, pasos, respiración, errores comunes, versión más fácil/difícil y señales para detenerse.
2. Se quita la tarjeta incrustada del reproductor; la "Vista previa de ejercicios" antes de empezar no cambia.
3. `CACHE_NAME` → `fitbud-pwa-v122`.

### Fuera de alcance

- Cambiar el contenido del pop-up de técnica.

### Riesgos

- Ninguno sobre datos: solo presentación.

### Criterios de aceptación

- El reproductor no incrusta `.exercise-card`; el botón junto al nombre abre el pop-up con el mismo nombre, la demostración y los pasos. ✓ (`tests/e2e/entreno.spec.js`, capturas 375px revisadas)
- `node scripts/release-gate.mjs` pasa. ✓

## REQ-241 - Entreno: "Usar progresión" cambia de verdad el ejercicio (o dice que solo toca subir la carga)

**Estado: implementado.**

### Origen

Jonathan (2026-10-21), con captura de "Fondos asistidos": "Usar progresión" no cambia el ejercicio; debería cambiar el título y la imagen. Pide revisar que las progresiones de todos los ejercicios tengan sentido, inventariar los que no la tengan y evaluar si la progresión es únicamente subir el peso.

### Problema

`setWorkoutVariation()` solo guardaba `step.variation` y mostraba el texto libre del catálogo ("Progresión: Fondos con menor asistencia"); el ejercicio, el título y la imagen seguían igual. Las progresiones eran texto, sin distinguir otro ejercicio, variante o solo carga, y algunas eran solo carga o duración aunque el catálogo tiene un ejercicio más difícil del mismo patrón.

### Alcance

1. `FITBUD_EXERCISE_VARIANTS` (`exercise-catalog.js`, por slug, vale con catálogo local o de Supabase): versión más fácil y progresión de los 42 ejercicios de fuerza, de tipo `exercise` (otro ejercicio del mismo patrón), `variant` (mismo ejercicio, otra ejecución) o `load`.
2. Reproductor: `exercise` cambia `exerciseSlug` (título, imagen, "Cómo se hace" y última carga del nuevo) si encaja con el lugar y las limitaciones; `variant` cambia el título; "Volver a …" deshace. `load` muestra "Subir la carga"/"Bajar la carga" con la pauta y la carga de la última vez, sin cambiar nada. El pop-up de técnica usa los mismos nombres.
3. Progresiones que eran solo carga o duración y pasan a otro ejercicio: Zancada → Sentadilla búlgara, Flexión → Flexión con pies elevados, Plancha frontal → Plancha con toque de hombro, Flexión con pies elevados → Flexión arquero.
4. Inventario en `docs/exercise-progressions.md`: 10 progresiones a otro ejercicio, 28 variantes, 4 solo carga (Sentadilla búlgara, Peso muerto a una pierna, Subida al banco, Dominada con lastre); resistencia progresa por volumen. `validate-exercises.mjs` exige la entrada completa, destinos existentes del mismo patrón y en el sentido de nivel correcto; corrige `hammer-curl` (`substitute_slugs` era texto).
5. `CACHE_NAME` → `fitbud-pwa-v123`.

### Fuera de alcance

- Imágenes propias para las variantes (usan la del ejercicio base).
- Cambiar el texto de `regression`/`progression` en la tabla `exercises`.

### Riesgos

- Ninguno sobre datos: las sesiones guardadas conservan su `variation`; las nuevas guardan además el ejercicio de origen.

### Criterios de aceptación

- Remo sentado → "Usar versión más fácil" pasa a Remo con banda (slug, título) y "Volver a…" lo deshace; Press de banca → "Usar progresión" titula "Press de banca con pausa en el pecho"; Sentadilla búlgara muestra "Subir la carga" y no cambia el ejercicio. ✓ (`tests/e2e/entreno.spec.js`, capturas 375px revisadas)
- `node scripts/validate-exercises.mjs` y `node scripts/release-gate.mjs` pasan. ✓

## REQ-243 - Fix: registrar una reciente con porción ×2 deja sus macros duplicados en Recientes

**Estado: implementado.**

### Origen

Feedback de Jonathan (2026-10-21, iPhone): "Acabo de agregar un shake de proteína y cuando seleccioné la porción le puse ×2; cuando volví a agregar otra comida el shake de proteína tiene sus valores de macros duplicados. Eso no debe pasar." Captura: Recientes muestra "Shake proteina 600 kcal · P 48 · C 72 · G 6".

### Problema

Al elegir una reciente o favorita con porción ×0,5/×1,5/×2 y guardar, lo registrado conserva el mismo nombre con los macros ya escalados. Recientes muestra la última vez que se registró cada nombre, así que la "porción" pasa a ser la ×2; volver a elegirla con ×2 da ×4. "Guardar en favoritas" en ese momento también guardaba la porción escalada.

### Causa raíz

- `saveEditor()` (`index.html`) guardaba `{name,kcal,p,c,f}` ya multiplicados por `qp.portion` sin registrar la porción.
- `recentCustomMeals()` deduplica por nombre quedándose con el registro más reciente, sea cual sea su porción.

### Alcance

1. `saveEditor()` guarda `portion` (≠1) en el extra o en `ms.ovr` cuando se eligió una porción sobre una reciente/favorita del mismo nombre; editar algo ya registrado sin tocar la porción la conserva, y renombrarlo o volver a ×1 la quita. Los macros del día siguen siendo los consumidos.
2. `perPortion()`: Recientes y "Guardar en favoritas" usan los macros divididos por `portion` (una porción).
3. `CACHE_NAME` → `fitbud-pwa-v125`.

### Fuera de alcance

- Corregir lo ya registrado antes del arreglo: no guardó la porción, así que esa reciente seguirá mostrando los macros escalados hasta que se registre de nuevo con ×1 (o desde Favoritas).

### Riesgos

- Ninguno sobre datos: `portion` es un campo nuevo opcional en `day_log.state`; los registros sin él se leen igual que antes.

### Criterios de aceptación

- Registrar "Shake proteina" 300 kcal y luego desde Recientes ×2: el día suma 300 + 600 y Recientes sigue mostrando 300 kcal · P 24 · C 36 · G 3. ✓ (`tests/e2e/comidas-guardadas.spec.js`; falla sin el arreglo con 600 · P 48 · C 72 · G 6)
- Guardar en favoritas con ×1,5 guarda la porción base. ✓ (`tests/e2e/comidas-guardadas.spec.js`)
- `node scripts/release-gate.mjs` pasa.

## REQ-244 - Entreno: la duración cuenta de inicio a fin, también con la app en segundo plano

**Estado: implementado.**

### Origen

Claudia (usuaria beta, 2026-10-21), con captura del resumen "Sesión parcial · 34:54 duración real": "la duración del entrenamiento no se actualiza en segundo plano. Cuando sales de la app y vuelves a entrar no contabiliza ese tiempo. Debería aparecer tiempo de duración total del entrenamiento (incluyendo descansos etc). Se me ocurre que en realidad calcule el tiempo desde que inicias el entrenamiento hasta que finalizas la sesión completa".

### Problema

REQ-155 congeló el cronómetro al pasar la app a segundo plano para que una sesión olvidada no sumara horas. El efecto en el uso normal es el contrario: en el gimnasio se bloquea la pantalla o se cambia de app en cada descanso, y todo ese tiempo desaparece de la duración. Una sesión de una hora puede mostrar 35 minutos.

### Causa raíz

`freezeInProgressWorkouts()` (`index.html`, listeners `visibilitychange`/`pagehide`) ejecutaba `captureWorkoutElapsed()` y dejaba `resumedAt` en `null` cada vez que la app se ocultaba; al volver, `normalizeExecution()` reanudaba desde "ahora", así que el hueco nunca se sumaba.

### Alcance

1. Al ocultarse la app ya no se congela el cronómetro: se anota `workoutExecution.awayAt` y la duración sigue corriendo desde `resumedAt`.
2. `FITBUD_WORKOUT_PLAYER.returnFromAway(execution, now)` (puro), invocado al volver (`visibilitychange`, `pageshow`) y al reabrir la app tras cargar los días: si la ausencia fue de hasta `AWAY_LIMIT_SECONDS` (1 h), cuenta entera; si fue mayor (sesión olvidada), la sesión queda en pausa con la duración y el descanso congelados en `awayAt`, y un aviso lo explica.
3. La pausa manual sigue congelando el tiempo como hoy.
4. El resumen dice "duración total" en vez de "duración real".
5. `CACHE_NAME` → `fitbud-pwa-v126`.

### Fuera de alcance

- Editar a mano la duración de una sesión ya guardada.
- Sesiones guardadas antes de este cambio: conservan la duración con la que se guardaron (historial inmutable).

### Riesgos

- Si el sistema mata la app sin emitir `visibilitychange`/`pagehide`, no hay `awayAt` y el tiempo cuenta entero hasta volver. Es el mismo evento del que dependía REQ-155.
- Una ausencia legítima de más de una hora (por ejemplo, una clase sin mirar el móvil) se pierde; reanudar sigue sumando desde ese momento.

### Criterios de aceptación

- 15 min fuera de la app sin pausar: el cronómetro y la duración los incluyen. ✓ (`tests/e2e/entreno.spec.js`, `scripts/validate-workout-player.mjs`)
- 3 h fuera: la sesión queda en pausa con la duración que tenía al salir y el botón "Reanudar sesión" visible. ✓ (mismas pruebas)
- `node scripts/release-gate.mjs` pasa. ✓

## REQ-245 - Entreno: volver al ejercicio anterior para revisarlo, sin perder Siguiente ni Omitir

**Estado: implementado.**

### Origen

Jonathan (2026-10-21, iPhone), con captura del reproductor en "Curl de bíceps": "Así como tienes el siguiente ejercicio, deberías poder tener algo que te lleve al ejercicio anterior para ver si simplemente quiero revisar, pero deberíamos mantener la funcionalidad de siguiente ejercicio y omitir".

### Problema

El reproductor solo avanza: "Omitir ejercicio" y "Siguiente ejercicio". Una vez pasado un ejercicio no hay forma de ver qué se registró ni de retomar uno omitido.

### Causa raíz

`normalizeExecution()` (`workout-player.js`) recoloca `currentStep` en el primer bloque pendiente en cada acción, así que el reproductor no tiene noción de "ver otro bloque" que no sea el pendiente.

### Alcance

1. `workoutExecution.reviewStep`: índice del bloque que se revisa, aparte de `currentStep`. Solo apunta a bloques hechos u omitidos; mirar no cambia el estado de ningún bloque ni el avance.
2. "← Ejercicio anterior" bajo el bloque en curso (y en el cierre, con todo registrado) cuando hay un bloque anterior registrado.
3. Vista de revisión: título, "Registraste N series" con carga × reps · RPE de cada una, o "Lo omitiste."; "← Anterior" / "Siguiente →" entre los ya registrados y "Volver al ejercicio en curso" (o "al cierre de la sesión"). Sin Omitir ni Siguiente ejercicio, que modifican el registro.
4. Un ejercicio omitido se puede retomar con "Hacerlo ahora".
5. "Siguiente ejercicio" y "Omitir ejercicio" no cambian. `CACHE_NAME` → `fitbud-pwa-v127`.

### Fuera de alcance

- Corregir series de un ejercicio ya completado desde la revisión.

### Riesgos

- Ninguno sobre datos: la revisión es de solo lectura; "Hacerlo ahora" solo devuelve a pendiente un bloque omitido.

### Criterios de aceptación

- Tras el primer ejercicio, "← Ejercicio anterior" muestra lo registrado (40 kg), sin Omitir ni Siguiente ejercicio, y el avance no cambia; "Volver al ejercicio en curso" vuelve al segundo con sus botones. Omitido → "Lo omitiste." y "Hacerlo ahora" lo retoma; el registro del primero queda intacto. ✓ (`tests/e2e/entreno.spec.js`, captura 390 px revisada)
- `node scripts/release-gate.mjs` pasa.

## REQ-246 - Fix: "Estimar macros" (texto) falla en producción cuando el coach trae más de 3 preguntas

**Estado: implementado.**

### Origen

Causa de producción que REQ-228 y REQ-238 dejaron fuera de alcance. Jonathan (2026-10-21): "Estimar macros" de "Sopa ramen vegetariana" responde "Tu coach no pudo completar esta acción. Intenta de nuevo."; antes (2026-10-20) lo mismo en el editor tras usar la foto.

### Problema

En `coach_usage` (Supabase de producción) los 12 fallos de `meal_estimate` desde el 2026-10-12 son `refunded` con `error_code = invalid_provider_output`, parte `estimate` (la estimación por texto: ~1045 tokens de entrada, sin imagen). Entre ellos los del reporte: 2026-10-21 01:20:14 y 01:30:43 UTC (20:20 y 20:30 del 20 en Perú) y 2026-10-20 18:46:20 UTC. Ninguna estimación con foto falló y no hay ningún `provider_<status>`: la clave, el saldo, el modelo y structured outputs funcionan. El servidor responde 422 y, antes de REQ-238, el cliente lo mostraba como el mensaje genérico. Son 12 de 49 estimaciones por texto desde el 2026-10-12 (~24 %); las 9 con foto pasaron.

### Causa raíz

- `mealEstimateOutputSchema()` (`api/claude.js`) exige `preguntas` sin tope (structured outputs no limita el largo de una lista) y el prompt de `aiEstimate()` (`index.html`) ni siquiera las pedía: el modelo las inventa. Todas las estimaciones por texto que pasaron traen exactamente 3 (o 0).
- `validateCoachOutput()` rechazaba `preguntas.length > 3`: cuando el modelo trae 4 o más, una estimación con macros válidos se descarta, se devuelve la cuota y el usuario ve el error. Las respuestas fallidas tienen más tokens de salida (165-318) que las que pasan.

### Alcance

1. `validateCoachOutput()` para `meal_estimate` ya no limita cuántas preguntas trae; sigue exigiendo macros numéricos y preguntas de texto (el cliente muestra como mucho 2 y solo en la foto).
2. El prompt de "Estimar macros" pide la forma del schema con `"preguntas":[]` y dice que no haga preguntas.
3. `CACHE_NAME` → `fitbud-pwa-v128`.

### Fuera de alcance

- `training_plan`: sus 8 llamadas en producción (2026-06-24 a 2026-10-20) terminaron en `invalid_provider_output` con exactamente 2048 tokens de salida, el tope que pide el cliente: el JSON llega cortado y la ruta determinista lo tapa. Va en un REQ propio.
- Registrar en los logs de `/api/claude` el motivo de cada `invalid_provider_output`.

### Riesgos

- Ninguno sobre datos: solo se aceptan respuestas que antes se descartaban con macros válidos.

### Criterios de aceptación

- Una estimación con 4 u 8 preguntas se acepta; kcal no numérica, preguntas que no son lista o que no son texto, y texto que no es JSON se siguen rechazando. ✓ (`scripts/validate-meal-estimate-output.mjs`; falla sin el arreglo)
- El prompt de texto pide `"preguntas":[]`. ✓ (`scripts/validate-meal-estimate-output.mjs`)
- `node scripts/release-gate.mjs` pasa. ✓ (validadores; E2E 100/101 con 1 flaky de `dia-sin-subir.spec.js` que pasa al reintento)

## REQ-247 - Entreno: "Sustituir" solo propone ejercicios del mismo músculo principal

**Estado: implementado.**

### Origen

Jonathan (2026-10-21), con captura del modal "Sustituir ejercicio" sobre un jalón que proponía Dominada, Dominada asistida y Remo con banda: "Tienes que asegurarte que todos los ejercicios de sustitución de verdad sustituyen el músculo principal [...] ya me ha pasado otras veces en otro tipo de músculos y ejercicios".

### Problema

El modal mezclaba ejercicios que cargan músculos distintos: para un face pull (deltoides posterior) proponía dominadas y remos; para un remo, jalón y dominada asistida; para un curl de bíceps, remo con banda; para la extensión de tríceps, fondos y flexiones; para el peso muerto rumano, hip thrust. Además mostraba el patrón en inglés ("mismo patrón: pull") y la versión más fácil del candidato como si fuera su descripción.

### Causa raíz

`openExerciseSubstitution()` (`index.html`) juntaba `substitute_slugs` con todo el catálogo del mismo `movement_pattern`. El patrón agrupa por mecánica (todo "pull" junto: jalón, remo, face pull), no por músculo, y los `substitute_slugs` del catálogo incluían cruces entre músculos.

### Alcance

1. `exercise-catalog.js`: músculo principal por slug para los 42 ejercicios de fuerza (`FITBUD_EXERCISE_SUBSTITUTION.primaryMuscles`) y `candidates(actual, catálogo)`, puro: sustitutos directos primero y luego el resto del catálogo, siempre con el mismo músculo principal. Un ejercicio sin entrada (creado desde admin) usa el primero de su lista de músculos. Vale igual con el catálogo local y con el de Supabase.
2. Espalda se separa en dorsal ancho (jalón, dominadas) y espalda media (remos); hombro en hombros (press), deltoides lateral (elevación lateral) y deltoides posterior (face pull).
3. El modal dice qué músculo se conserva, cada opción muestra "Músculo principal: …" y, si no hay ninguna compatible con el lugar y las limitaciones del día, lo dice con el músculo.
4. `scripts/validate-exercises.mjs` exige músculo principal en cada ejercicio de fuerza, que ningún sustituto ni versión más fácil/progresión cambie de músculo, y fija casos concretos (face pull, remo, jalón, curl, tríceps, rumano, elevación lateral).
5. `CACHE_NAME` → `fitbud-pwa-v129`.

### Fuera de alcance

- Añadir ejercicios nuevos para los músculos que hoy no tienen sustituto en el catálogo (face pull, elevación lateral, gemelos): el modal lo dice en vez de proponer otro músculo.
- Limpiar los `substitute_slugs` cruzados en `supabase/exercises.sql`: el filtro los descarta en la app.
- Sustituciones ya guardadas en el historial (historial inmutable).

### Riesgos

- Jalón y dominadas comparten músculo principal (dorsal ancho) y siguen proponiéndose entre sí; el remo deja de aparecer para el jalón.
- Menos opciones en ejercicios aislados: preferible a cambiar el músculo de la sesión.

### Criterios de aceptación

- Remo sentado en polea → solo Remo con banda; Face pull → sin opciones y el aviso nombra el deltoides posterior. ✓ (`tests/e2e/entreno.spec.js`)
- Ningún sustituto ni versión más fácil/progresión del catálogo cambia de músculo principal. ✓ (`scripts/validate-exercises.mjs`)
- `node scripts/release-gate.mjs` pasa.

## REQ-249 - Fix: en "Lo que sigue hoy" los botones quedan pegados al borde de su tarjeta

**Estado: implementado.**

### Origen

Jonathan (2026-10-21), con captura de Hoy en iPhone: "Los botones se ven muy apretados". En "Próxima comida" y "Entrenamiento pendiente", "Ver detalle" y "Adaptar" llegan al borde derecho de su tarjeta.

### Causa raíz

`homeAgendaItemHtml()` (`index.html`) ponía el tipo de la fila como clase suelta (`agenda-item meal`, `agenda-item workout`). `.meal` y `.workout` son las tarjetas globales de comida y entreno (fondo, borde, radio), así que cada fila se volvía una tarjeta dentro de la tarjeta de la agenda; pero `.agenda-item{padding:13px 0}` les quita el relleno lateral y los botones (`flex:1 1 128px`) llenan el ancho hasta el borde. Medido a 390 px: "Ver detalle" termina a 0 px del borde.

### Alcance

1. La clase del tipo va con prefijo (`kind-meal`, `kind-workout`, `kind-resume`, `kind-rest`) y los selectores de icono se ajustan: la agenda vuelve a ser la lista con separadores que define su CSS, con los botones a 16 px del borde de la tarjeta.
2. `CACHE_NAME` → `fitbud-pwa-v131`.

### Fuera de alcance

- Cambiar el diseño de la agenda.

### Riesgos

- Las filas ya no tienen fondo propio (el entreno pierde su degradado azul); el icono conserva su color por tipo.

### Criterios de aceptación

- A 390 px, cada botón de la agenda queda a ≥ 12 px del borde de su contenedor. ✓ (`tests/e2e/home.spec.js`; falla sin el arreglo con "Ver detalle" a 0 px)
- `node scripts/release-gate.mjs` pasa.

## REQ-253 - Entreno: "Actividad física principal" se entiende y cambiar el gimnasio por otro deporte un día es evidente

**Estado: implementado.**

### Origen

Diego (beta, 2026-10-21, iPhone), sobre Perfil → Entrenamiento: "No entiendo eso de actividad física principal", "Eso de elegir qué hacer en cada día también siento que te limita mucho a elegir" y "¿Qué pasa si un lunes no voy al gym y juego pádel?".

### Problema

- "Actividad física principal" no dice qué es ni qué cambia: Diego juega pádel, que no está en la lista, y eligió "Otra actividad" sin saber qué haría el plan con eso.
- "Días disponibles y lugar real" se lee como una agenda fija: nada dice que cualquier día se puede cambiar.
- Registrar otro deporte en un día de fuerza ya era posible (REQ-206, "＋ Registrar otra actividad" al final de Entreno), pero no aparece entre las opciones de "Adaptar hoy" ni explica qué pasa con la sesión que tocaba.

### Causa raíz

- Copy de `index.html`: label `pf_sport` "Actividad física principal" y `ob_sport` "¿Practicas alguna actividad física?", opción "Otra actividad", sin nota de ayuda; label "Días disponibles y lugar real".
- "Adaptar hoy" en `renderWorkout()` solo ofrece Solo 20 min / En casa / Sin equipo / Me perdí la sesión.

### Alcance

1. Onboarding y Perfil preguntan lo mismo: "¿Haces otro deporte además de la fuerza?", con opciones Caminar, Correr, Bicicleta, Natación, "Otro deporte" y "Ninguno, solo fuerza". `SPORT_LABELS.other` → "Otro deporte".
2. Nota bajo la pregunta que cambia con la opción (`primarySportHelp()`): qué suma a la semana (sesiones guiadas, días de tu deporte para pádel o fútbol, o solo fuerza).
3. Perfil: "Tu semana tipo: días y lugar" con la nota "Es tu semana de referencia, no una obligación: cualquier día puedes cambiar la sesión desde Entreno o registrar otro deporte en su lugar (por ejemplo, pádel en vez de gimnasio)."
4. Entreno → "Adaptar hoy": botón "Hice otro deporte" que abre el registro de actividad. En un día con sesión, el modal dice "Cuenta como día entrenado en lugar de <sesión>. Tu plan sigue igual desde la próxima sesión." y propone el último deporte registrado (o "Otra actividad"), no "Fuerza / gimnasio".
5. `CACHE_NAME` → `fitbud-pwa-v133` (junto con REQ-252).

### Fuera de alcance

- Elegir qué se hace cada día (fuerza o deporte) en vez del lugar, o mover la sesión de fuerza perdida a otro día: el lugar sigue orientando la plantilla (exterior/piscina → deporte) y "Me perdí la sesión" ya ofrece recuperarla.
- Añadir pádel, fútbol u otros deportes con plan guiado propio.

### Riesgos

- Ninguno sobre datos: solo copy y un acceso nuevo a un flujo existente; los valores guardados (`primarySport`) no cambian.

### Criterios de aceptación

- Perfil muestra la nueva pregunta y la nota cambia al elegir otra opción; la semana tipo explica que no es una obligación. ✓ (`tests/e2e/actividad-manual.spec.js`)
- En un día de fuerza, "Hice otro deporte" → Pádel marca el día como entrenado y el modal explica que reemplaza la sesión. ✓ (`tests/e2e/actividad-manual.spec.js`, capturas 390 px revisadas)
- `node scripts/release-gate.mjs` pasa.

## REQ-257 - Fix: el plan de entrenamiento del coach nunca se usa porque la semana llega cortada

**Estado: implementado.**

### Origen

Revisión de producción de REQ-246 (2026-10-21). En `coach_usage` las 8 llamadas `training_plan` (2026-06-24 a 2026-10-20) son `refunded` / `invalid_provider_output` con **exactamente 2048 tokens de salida**; ninguna se completó. La app usa entonces la alternativa validada para todas las semanas ("Se usó la alternativa validada en: semana 1, …") y nadie lo nota.

### Causa raíz

`generateTrainingWeek()` (`index.html`) pide la semana con `maxTokens` 2048 y el prompt no pide JSON compacto: el modelo lo escribe con sangría. Una semana de 4 sesiones de fuerza ocupa ~5.400 caracteres con sangría (~3.250 compacta); una de 6 con carrera, ~7.800. No cabe: el JSON llega cortado, `validateCoachOutput()` lo rechaza (422) y, desde ese fallo, `generateTrainingPlan()` usa la alternativa para el resto de semanas.

### Alcance

1. `TRAINING_WEEK_MAX_TOKENS` = 4096 (el tope del proxy) para cada semana.
2. El prompt pide el JSON en una sola línea, sin sangría ni saltos de línea.
3. `CACHE_NAME` → `fitbud-pwa-v134`.

### Fuera de alcance

- Structured outputs para `training_plan` y registrar `stop_reason` del proveedor.
- Si, ya completa, la semana pasa las demás reglas de `validateTrainingPlanWeek()`: no se puede comprobar sin llamar al proveedor; se verá en `coach_usage`.

### Riesgos

- Una semana completa tarda más en generarse (antes ~18 s hasta el corte); el cliente espera hasta 90 s por intento.

### Criterios de aceptación

- Para semanas de 4 y 6 sesiones (fuerza y carrera), `maxTokens` ≥ caracteres del JSON con sangría / 2,5, y el prompt pide una sola línea. ✓ (`tests/e2e/entreno.spec.js`; falla sin el arreglo: 2048 < 2170)
- `node scripts/release-gate.mjs` pasa.

## REQ-258 - Home: con el día cerrado, Hoy resume el día y muestra lo que toca mañana

**Estado: implementado.**

### Origen

Jonathan (2026-10-22), con captura de Hoy con 5/5 comidas y el entreno hecho, "MAÑANA" escrito sobre "Consumo de hoy": "Si ya terminé de entrenar y mis comidas, lo lógico sería que me diga que ya está todo listo y qué toca mañana, en resumen, no a detalle, o que pueda ir al próximo día".

### Causa raíz

Con el día cerrado (`homeAgendaData()` → `state:"done"`), `renderHoy()` (`index.html`) seguía mostrando el consumo detallado de hoy (`miniMacroDash`) y la tarjeta "Día cerrado" repetía las comidas y el entreno en dos casillas, con "Ver progreso" como única salida. Nada decía qué toca mañana ni llevaba a ese día.

### Alcance

1. Con el día cerrado, Hoy oculta "Consumo de hoy".
2. La tarjeta pasa a "Todo listo por hoy" con hoy en una línea (`5/5 comidas · 1495 kcal · entreno completado`) y un bloque "Mañana · <fecha>" con dos filas: el entreno que toca (o "Descanso planificado") y si las comidas están listas ("5 comidas listas" / "Aún por preparar").
3. "Ver mañana" abre Nutrición en el día siguiente (`goDay`); se mantiene "Ver progreso". Si mañana queda fuera del plan, no hay bloque ni botón.
4. `CACHE_NAME` → `fitbud-pwa-v135`.

### Fuera de alcance

- Preparar mañana desde Hoy: se hace desde el día siguiente, como hasta ahora.
- Los chips del coach con el día cerrado.

### Criterios de aceptación

- Con todas las comidas y el entreno hechos, Hoy no muestra "Consumo de hoy", resume el día en una línea y muestra el entreno y las comidas de mañana; "Ver mañana" deja `current` en mañana. ✓ (`tests/e2e/home.spec.js`)
- `node scripts/release-gate.mjs` pasa (E2E: 111/111).

## REQ-259 - Entreno: caminata, running, bici y natación con foto real en vez del dibujo

**Estado: implementado.**

### Origen

Jonathan (2026-10-22): "las imágenes de los otros deportes nunca se hicieron, se dejaron unas cosas horribles como placeholders".

### Causa raíz

REQ-15 subió fotos de Free Exercise DB solo para los 42 ejercicios de fuerza (`supabase/exercise-media.sql`). Los 12 de resistencia (`walk-*`, `run-*`, `cycle-*`, `swim-*`) quedaron con `media_type` `inline_svg` y caían a `exerciseDemoSvg()`: un monigote de palitos; caminata y running ni siquiera tenían figura propia (`run` cae a la figura genérica de pie).

### Alcance

1. Una foto por disciplina en `assets/exercise-media/` (850 px, como las de fuerza):
   - `walking.jpg`, `running.jpg`, `cycling.jpg`: Free Exercise DB (`Walking_Treadmill/0`, `Trail_Running_Walking/1`, `Bicycling_Stationary/0`), dominio público (Unlicense). Una sola foto: en cardio los dos cuadros del dataset cambian el ángulo de cámara, no la fase del movimiento.
   - `swimming.jpg`: Free Exercise DB no tiene natación. `DoD_Warrior_Games_2016_160611-A-OF234-296.jpg` (U.S. Army, Wikimedia Commons), dominio público.
2. `exercise-catalog.js`: los ejercicios de resistencia llevan `media_type: "image"`, `media_url`/`poster_url` y fuente/licencia.
3. `exerciseMediaSources()` (`index.html`): si el registro no trae `media_url`, `poster_url` ni `frames` (filas de Supabase de resistencia), usa la media del catálogo local por `slug`. Así se ve sin tocar producción.
4. `supabase/exercise-media-endurance.sql` (opcional, idempotente): deja la tabla y la admin al día.
5. `validate-deploy-allowlist.mjs` cuenta como runtime los `assets/` que referencia `exercise-catalog.js`.
6. `CACHE_NAME` → `fitbud-pwa-v136`.

### Fuera de alcance

- Fotos de fuerza en modo local (sin Supabase): siguen con el dibujo, como antes.
- Actividades manuales (`MANUAL_ACTIVITY_SPORTS`): no muestran imagen.

### Criterios de aceptación

- Caminata, running, bici y natación muestran foto en la tarjeta y en "Ver técnica", con catálogo local y con filas de Supabase sin media. ✓ (verificado con capturas)
- `node scripts/release-gate.mjs` pasa; suite E2E 111/111.

## REQ-234 - El check-in semanal re-puntúa días ya ejecutados y contradice su copy "para la próxima semana"

**Estado: implementado.**

### Origen

Auditoría del journey **home** (commit previo leído: `16fb94c` REQ-227). Verificación funcional en navegador real (Playwright + fixtures E2E, 0 llamadas pagadas): preparar hoy, registrar sus comidas, y aceptar el check-in semanal que la portada ofrece.

### Problema

Con el banner "Check-in · Semana N" visible en Home, aceptar un ajuste (p. ej. −200 kcal) cambia **de inmediato** la meta del día en curso. Captura `home-before`: "CONSUMO DE HOY 2184/2200 kcal · 16 restantes, Carb 219/220, Grasa 66/65" (en objetivo). Tras aceptar → `home-after`: mismo consumo 2184 pero "2184/**2000** kcal · **meta alcanzada**, Carb 219/**204**, Grasa 66/**60**" (ahora excedido), con el toast "Ajuste aplicado **para la próxima semana**". El usuario comió exactamente el plan que la app le preparó y Home lo reporta como pasado/excedido. Peor: también re-puntúa días YA ejecutados — `buildDay("2026-10-20").target` pasó de `{2200,160,220,65}` a `{2000,160,204,60}` tras el check-in, reescribiendo cómo se muestra la adherencia de ayer. Viola el invariante "ajustar el futuro no reescribe lo ya ejecutado".

### Causa raíz

`applyWeeklyCheckinProposal()` escribía `prefs.calorieTarget/carbTarget/fatTarget` con `saveProfilePrefs` de inmediato y anunciaba "para la próxima semana". Pero `buildDay(ds)` fija `target:effectiveDayTarget()` **sin pasar `ds`**, y `effectiveDayTarget()` siempre lee `profile.prefs` vigente (así quedó fijado a propósito por REQ-69, con test de regresión `validate-macro-target-wiring.mjs`: el objetivo del día SIEMPRE debe venir del perfil actual, nunca de un snapshot por fecha). Así la meta de TODO día (pasado, hoy, futuro) sigue a las prefs vivas apenas cambian, mientras las comidas quedan congeladas (snapshot/override) a la meta anterior.

### Objetivo

Que un ajuste de check-in, comunicado como futuro, no altere retroactivamente la meta ni la adherencia mostrada de días ya ejecutados ni del día en curso ya prescrito; y que el copy coincida con cuándo surte efecto.

### Fix (sin tocar el wiring de REQ-69)

Dado que `buildDay`/`effectiveDayTarget()` deben seguir leyendo siempre `profile.prefs` vigente (invariante de REQ-69, intocable), la única forma de que el ajuste no reescriba el pasado es no mutar `calorieTarget/carbTarget/fatTarget` al momento de aceptar:

1. `applyWeeklyCheckinProposal()` guarda `prefs.pendingCheckinAdjustment={kcal,carb,fat,wk,effectiveFrom}` en vez de escribir los targets directo. `effectiveFrom` viene de `nextCheckinEffectiveDate()`: el día siguiente al fin de la semana del calendario del plan que está en curso (la próxima semana que todavía no empezó).
2. `applyDueCheckinAdjustment()` (nueva), llamada en cada `renderHoy()`, mezcla `pendingCheckinAdjustment` en las prefs vivas y lo borra, pero solo si `todayStr()>=effectiveFrom`. Antes de esa fecha, los targets no cambian, así que ningún día (hoy incluido) re-puntúa.
3. Copy alineado: modal → "Empieza con tu próxima semana; no cambia la meta de esta semana ni de lo ya registrado."; toast → "Ajuste guardado: se aplicará cuando empiece tu próxima semana."
4. `CACHE_NAME` → `fitbud-pwa-v137`.

### Fuera de alcance

- No cambiar el comportamiento de REQ-69 (editar macros en Perfil sí refleja en el día, en cualquier fecha): este REQ es solo el flujo de check-in y su promesa temporal.
- El motor de análisis (REQ-160/165) y los límites `CHECKIN_MAX_KCAL_ADJUST`/`MIN`.
- Dos check-ins aceptados antes de que el primero llegue a su `effectiveFrom`: el segundo sobrescribe el `pendingCheckinAdjustment` pendiente (no se encolan). Edge case raro dado el cadence semanal; no cubierto.

### Riesgos

- Tocar la fecha efectiva del ajuste puede interactuar con `plan_versions`/snapshot nutricional: no se tocó — `pendingCheckinAdjustment` vive solo en `profile.prefs`, sin relación con `plan_versions`.

### Criterios de aceptación

- Aceptar un check-in no cambia `buildDay(ds).target` de ningún `ds` antes del `effectiveFrom`; el día en curso ya prescrito no pasa a "meta alcanzada"/excedido por el solo hecho de aceptar. ✓ (verificado por inspección: `calorieTarget` no se toca hasta que `applyDueCheckinAdjustment()` lo aplique)
- El copy refleja el momento real de aplicación. ✓
- `node scripts/release-gate.mjs` pasa. ✓ (111 E2E; 1 flake preexistente y no relacionado en `entreno.spec.js`, pasa al reintentar)

### Verificación

- `node scripts/validate-macro-target-wiring.mjs`: sigue en verde (el wiring de REQ-69 no se tocó).
- `node --check` sobre el `<script>` final de `index.html`: sintaxis OK.
- `node scripts/audit-secrets.mjs`, `node scripts/audit-html.mjs`: OK.
- `node scripts/release-gate.mjs`: 97/99 (+ E2E) en verde; el resto del gate (97 checks no-E2E) en verde desde el primer intento.
- No se agregó prueba E2E dedicada (la suite no tenía ninguna de check-in); queda como deuda de cobertura si se reporta otra regresión en este flujo.

## REQ-260 - Entreno: hacer antes un ejercicio posterior y volver al pendiente

**Estado: implementado.**

### Origen

Sathya (beta, 2026-10-23): "Permitir que te deje hacer un ejercicio que esté más adelante, sin que tengas que completar el ejercicio actual, después puedes terminar el ejercicio pendiente."

### Problema

En el gimnasio la máquina o el banco del ejercicio actual puede estar ocupado. El reproductor solo ofrecía "Siguiente ejercicio" (exige al menos una serie) u "Omitir ejercicio", que lo marca como omitido: para retomarlo había que encontrarlo con "← Ejercicio anterior" → "Hacerlo ahora", y si no, la sesión quedaba parcial.

### Causa raíz

- `normalizeExecution()` (`workout-player.js`) devolvía `currentStep` al primer bloque pendiente en cada render: no se podía estar en un ejercicio posterior con uno anterior pendiente.
- `nextWorkoutStepIndex()` (`index.html`) buscaba desde el bloque siguiente al actual y solo al final volvía a los anteriores.

### Alcance

1. Botón "Hacer otro ejercicio primero" en un ejercicio de fuerza con otros pendientes: abre la lista de ejercicios de fuerza pendientes (posición, series × reps y series ya marcadas). Al elegir uno (`jumpToWorkoutStep`), el actual queda pendiente con sus series; un descanso en curso sigue corriendo.
2. `normalizeExecution()` conserva `currentStep` mientras ese bloque siga pendiente.
3. `nextWorkoutStepIndex(execution, except)` devuelve el primer pendiente en orden: al terminar el elegido se vuelve al que quedó pendiente. Sin saltos, el orden es el mismo de antes.
4. Aviso "Te queda pendiente X. Vuelves al terminar este." en el ejercicio elegido.
5. La revisión ("← Ejercicio anterior", "Siguiente →") recorre todos los bloques registrados, también los hechos después del bloque en curso.
6. `CACHE_NAME` → `fitbud-pwa-v138` (`main` ya usaba v137 por REQ-234).

### Fuera de alcance

- Reordenar el plan guardado o el resumen previo: el orden del plan no cambia.
- Saltar bloques de cardio por intervalos o el calentamiento/vuelta a la calma opcionales.

### Criterios de aceptación

- Con una serie marcada en el primer ejercicio, "Hacer otro ejercicio primero" → elegir uno posterior: se muestra ese, el progreso no cambia y se avisa del pendiente. Al terminarlo vuelve al primero con su serie marcada; el hecho fuera de orden se puede revisar. ✓ `tests/e2e/entreno.spec.js` ("Hacer otro ejercicio primero").
- `normalizeExecution()` mantiene el ejercicio elegido mientras está pendiente y, hecho, vuelve al primero pendiente. ✓ `scripts/validate-workout-player.mjs`.

## REQ-261 - Entreno: sustituir un ejercicio por uno buscado en el catálogo

**Estado: implementado.**

### Origen

Sathya (beta, 2026-10-23): "debe permitirte cambiar un ejercicio por uno específico que tú estés buscando dentro de la base o de un listado".

### Problema

"Sustituir" solo ofrecía ejercicios con el mismo músculo principal (REQ-247) y compatibles con el lugar del día. Quien quería un ejercicio concreto (otra máquina, el que conoce) no podía elegirlo; con algunos músculos (deltoides posterior) la lista salía vacía.

### Alcance

1. `searchExercises(query, catalog)` en `exercise-catalog.js` (exportado como `FITBUD_EXERCISE_SUBSTITUTION.search`): busca en nombre, alias y músculos, sin tildes ni mayúsculas, solo ejercicios de fuerza (`gym`, `strength`, `bodyweight`). Orden: nombre que empieza por lo buscado, músculo principal, nombre que lo contiene, alias, resto.
2. El modal "Sustituir" abre con el buscador arriba; con texto, las sugerencias del mismo músculo se ocultan y se ven los resultados (nombre, músculo principal y dónde se hace).
3. `exerciseSafeForLimits()` separa de `exerciseCompatibleForWorkout()` el filtro de lesiones, limitaciones y movimientos a evitar. El buscador aplica solo ese filtro: un ejercicio de otro lugar se puede elegir (se indica el lugar). Si todo lo que coincide choca con el perfil, se dice.
4. Si el nuevo ejercicio cuenta en otra unidad (segundos ↔ repeticiones), toma reps, ritmo y unidad de su dosis de catálogo (`WORKOUT_PLAYER.exerciseDose`); series y esfuerzo se conservan.

### Fuera de alcance

- Buscar por equipamiento (el catálogo lo guarda en inglés).
- Cambiar el ejercicio en el plan de semanas futuras.

### Criterios de aceptación

- "press banca" encuentra Press de banca desde Remo sentado en polea y lo sustituye; "zzz" dice que no hay resultados; con el campo vacío vuelven las sugerencias. Plancha frontal en lugar de Press de banca pasa a "30-45 s". ✓ `tests/e2e/entreno.spec.js`.
- El buscador no devuelve ejercicios de resistencia y encuentra sin tildes. ✓ `scripts/validate-exercises.mjs`.

## REQ-262 - Entreno: añadir un ejercicio a la sesión desde un buscador

**Estado: implementado.**

### Origen

Sathya (beta, 2026-10-23): "E incluso añadir un ejercicio al entrenamiento dejándote buscar en una base con algún tipo de buscador."

### Problema

La sesión solo tenía los ejercicios del plan: se podía sustituir, omitir o añadir series, pero no sumar un ejercicio. `normalizeExecution()` reconstruía los pasos desde la prescripción y descartaba cualquier otro.

### Alcance

1. Botón "+ Añadir ejercicio" en la sesión de fuerza en curso. Abre el buscador de REQ-261 en modo "add": sin texto lista todo el catálogo de fuerza (sin los que ya están en la sesión ni los que chocan con lesiones o limitaciones).
2. `WORKOUT_PLAYER.addedStrengthStep(exercise, context, id)`: paso de fuerza con `added: true`, etiqueta "Añadido por ti" y la dosis de catálogo de la fase actual (`exerciseDose`).
3. `normalizeExecution()` conserva los pasos añadidos (solo de fuerza y con `exerciseSlug`; series entre 1 y 10) antes de la vuelta a la calma. El respaldo por índice ya no confunde un añadido con un paso del plan.
4. Si quedaban ejercicios, el usuario sigue en el actual y el añadido queda en la cola (puede ir a él con "Hacer otro ejercicio primero", REQ-260). Si no quedaba ninguno, el añadido pasa a ser el actual.
5. Un añadido sin series hechas muestra "Quitar ejercicio" en vez de "Omitir ejercicio" y se borra de la sesión (no cuenta como omitido). Con una serie hecha ya es parte de la sesión y cuenta para completarla.

### Fuera de alcance

- Añadirlo al plan de semanas futuras o al resumen previo "Qué vas a hacer hoy".
- Añadir bloques de cardio o en sesiones de cardio.

### Criterios de aceptación

- "+ Añadir ejercicio" → "curl martillo" → se suma un bloque, el usuario sigue en el ejercicio en curso y el añadido queda antes de la vuelta a la calma. Sin series se quita y vuelve el total; con una serie hecha solo se puede omitir. ✓ `tests/e2e/entreno.spec.js` ("Añadir ejercicio").
- El añadido se conserva al normalizar, con sus series, y cuenta en el progreso; un paso añadido que no es de fuerza se descarta. ✓ `scripts/validate-workout-player.mjs`.

## REQ-256 - Fix Nutrición: "Volver a preparar este día" pisa comidas personalizadas sin marcar como hechas

**Estado: implementado.**

### Origen

Auditoría del journey `nutrición` (commit previo `4e31c77`).

### Problema

Con el día preparado, el usuario edita un slot ("Personalizada / editar valores") o lo cambia ("Otra opción") sin marcarlo hecho. "Más opciones → Volver a preparar este día" lo devuelve a la comida generada y el dato se pierde en silencio. El toast "Lo que ya registraste hoy no cambia" solo aparecía si había una comida marcada hecha.

### Causa raíz

`applyDayComidas` (`index.html`) conservaba solo `ms.done` (`if(ms.done){preserved++;return;} ms.ovr={…}`); cualquier otro `ms.ovr` se pisaba. Entra por `openNutritionMoreMenu` → `homePrepareDay` → `applyGeneratedDay`/`applyDeterministicDay` → `applyDayComidas`. La preservación de REQ-119 (solo `done=true`) quedó incompleta.

### Objetivo

Re-preparar no descarta una comida elegida o editada a mano, aunque no esté marcada como hecha.

### Alcance implementado

1. Nueva marca `ovr.userSet:true` en los cuatro puntos donde el usuario elige o edita una comida a mano: `saveEditor` (editar valores/personalizada), `applyChangeMeal` (botón "Otra opción", solo en el slot elegido — las comidas futuras que el motor rebalancea automáticamente NO llevan `userSet`, son una propuesta del motor), `applyReplace` (menú "Adaptar": sin cocina / comer fuera / falta un ingrediente) y la acción del coach conversacional `cambiar_plato`.
2. `applyDayComidas` preserva el slot cuando `ms.done` **o** `ms.ovr.userSet` es verdadero, no solo `done`. El comentario de la función se actualizó para documentar ambos casos.
3. El toast de preservación ("Lo que ya registraste o personalizaste {hoy} no cambia") pasa a decir también "personalizaste", ya que ahora preserva ediciones manuales además de lo ya registrado — antes el texto solo describía el caso `done`.

### Fuera de alcance

- Días pasados y extras (ya no se pisaban).
- Las comidas futuras rebalanceadas automáticamente por el motor tras un "Otra opción" (`nutritionPlan:true`, sin `userSet`): siguen sin marca de usuario a propósito, son una propuesta del motor y pueden seguir ajustándose con normalidad.

### Riesgos

- "Otra opción" (`applyChangeMeal`) ya usaba `gen:true` para el slot elegido; se le agregó `userSet:true` además, sin quitar `gen` (algunos lectores de `ovr.gen` como `homeDayHasPreparedMeals`/`weekHasGeneratedPlan` siguen funcionando igual).

### Criterios de aceptación

- Editar un slot sin marcarlo hecho y "Volver a preparar" conserva el valor; una comida marcada hecha se sigue conservando. ✓ `tests/e2e/nutricion.spec.js` ("editar una comida sin marcarla hecha se conserva al volver a preparar el día").
- `node scripts/release-gate.mjs` pasa.

### Verificación

E2E nuevo en `tests/e2e/nutricion.spec.js`: preparar día (mock del coach aplica "Bowl proteico de la mañana" en desayuno) → editar desayuno a "Dos huevos con pan" / 777 kcal sin marcarlo hecho → "Más opciones de nutrición" → "Volver a preparar este día" → "Aplicar al día" (el mock vuelve a proponer "Bowl proteico de la mañana" en el borrador, como antes del fix) → el desayuno aplicado sigue siendo "Dos huevos con pan" / 777 kcal, "Bowl proteico de la mañana" no aparece en ninguna tarjeta. Pasa junto con las otras 3 pruebas de `nutricion.spec.js`. `node --check` sobre el `<script>` final de `index.html` OK. `git diff --check` limpio.

## REQ-263 - Fix Progreso: la "Adherencia a comidas" del ciclo activo se diluye con los días futuros

**Estado: implementado.**

### Origen

Auditoría del journey **progreso** (commit previo leído: `ef55f45` REQ-256). Al recorrer Progreso con un ciclo en curso, la tarjeta "Adherencia a comidas" (sección "Tus números") muestra un porcentaje mucho menor que la adherencia real del usuario.

### Problema

Un usuario que marcó **todas** las comidas de **todos** los días transcurridos del ciclo (adherencia real 100% hasta hoy) ve "14%" en la tarjeta. El número contradice lo que el usuario hizo y es desmotivante justo donde Progreso busca reforzar el hábito. Además contradice el propio criterio de REQ-44 ("10 días registrados + 2 fallidos → ~83%", es decir adherencia acumulada sobre días transcurridos, no sobre el ciclo completo).

### Causa raíz

`cycleSummary(untilDs)` (`index.html:2636`): sin argumento, `last=END` (`index.html:2638`), así que el bucle `while(ds<=last)` (`index.html:2640`) recorre **todo** el ciclo —incluidos los días futuros— y acumula `plannedMeals+=day.meals.length` (`index.html:2648`) de cada día futuro (`buildDay` siempre devuelve slots, con kcal:0, incluso para días sin registrar). `progressStats()` (`index.html:6516`) llamaba `cycleSummary()` sin argumento y mostraba `cs.mealAdherence` como la tarjeta del ciclo en curso. El recap de cierre llama `cycleSummary()` cuando `today>=END`, así que ahí el conteo completo ya era correcto; el bug era solo en la vista en curso.

### Fix

`progressStats()` ahora llama `cycleSummary(todayStr())`, que ya soportaba acotar `last` a un `untilDs<END` (REQ-214). El recap de cierre (`renderPlanRecap`, `startNextChallenge`, `confirmRestartPlan`) sigue llamando `cycleSummary()`/`cycleSummary(until)` sin cambios: su conteo full-cycle (o hasta el día de interrupción) es correcto y no se tocó.

### Verificación

Nuevo test E2E en `tests/e2e/progreso.spec.js` ("REQ-263"): con `completePrefs()` (ciclo 10 semanas, START hoy−9), siembra `ovr`+`done:true` en todas las comidas de START..hoy (contenido custom para pasar `mealHasContent()`) y confirma que la tarjeta "Adherencia a comidas" muestra "100%". Revertir el fix (volver a `cycleSummary()` sin argumento) reproduce exactamente el "14%" que documentó la auditoría, confirmando que el test cubre la regresión. `node --check` sobre el `<script>` final de `index.html` OK. `git diff --check` limpio. `node scripts/release-gate.mjs`: 98/99 antes del commit (el único rojo es "Sin modificaciones no intencionadas", que solo detecta cambios sin commitear — se resuelve al commitear). `CACHE_NAME` v139→v140 (index.html es parte de `APP_SHELL`).

### Operación manual pendiente

Ninguna.


## REQ-264 - Entreno: revisar todos los niveles y corregir demos de variantes distintas

**Estado: implementado.**

### Origen y problema

Jonathan, 2026-10-24: captura de Pike push-up con la etiqueta Principiante y una demostración de flexión en parada de manos. Pide revisar todos los ejercicios.

### Causa raíz

El constructor del catálogo asignaba beginner a toda fila sin nivel. 31 fichas originales de fuerza y los 12 bloques de resistencia heredaban ese valor. Supabase reemplazaba el catálogo empaquetado, así que corregir el archivo local no corregía las filas remotas. Además, el mapeo de demos usaba otros ejercicios del mismo músculo como proxies: pike → handstand, remo con banda → invertido, toques de hombro → escaladores y arquero → pliométricas. Las plantillas estáticas no filtraban experiencia.

### Alcance implementado

- Revisión individual de las 54 fichas empaquetadas y de las 16 fichas adicionales encontradas por lectura del catálogo real de producción (67 filas remotas, 51 compartidas): unión de 70 ejercicios, 34 principiantes, 32 intermedios y 4 avanzados. `docs/exercise-levels.md` fija criterio, variante exacta, razón individual y fuentes primarias; la carga y la dosis son distintas del nivel técnico.
- Nivel explícito obligatorio para cada ficha local; registro revisado adicional para los 16 slugs remotos. Normalización sin mutaciones en los catálogos de visualización y generación: niveles conocidos prevalecen sobre datos antiguos; los ejercicios propios conservan sus datos. Un nivel ausente o inválido se muestra como Nivel por revisar y queda fuera de generación automática.
- Diez SVG propios con posiciones exactas reemplazan demos distintas o cargadas de ejercicios sin carga. Pike muestra pies en el suelo y cadera elevada, con técnica específica; no una parada de manos. Se retiran proxies del mapa de ingestión y SQL de media. No se consumen llamadas pagadas.
- Plantillas y planes guardados de hoy/futuro todavía sin ejecución usan ejercicios compatibles con la experiencia; se conservan ejercicios iniciados, sesiones registradas y fechas pasadas. Los snapshots no se escriben ni se migran. Cardio principiante usa el bloque fácil cuando el intervalo supera su nivel. Las búsquedas manuales siguen disponibles e informan el nivel.
- Al sustituir un ejercicio pendiente, repeticiones, tempo y descanso corresponden al destino; se conservan series y objetivos de esfuerzo.
- Al iniciar una sesión nueva se guarda una copia de su prescripción efectiva en `workoutExecution.contentPrescription`: las adaptaciones conservan ejercicios y bloques al continuar o recargar. Las ejecuciones anteriores sin esa copia mantienen su recuperación previa.
- El hash de compatibilidad incluye niveles para evitar reutilizar planes con clasificaciones obsoletas. Cache PWA v141. SQL base actualizado; parche incremental opcional `supabase/exercise-levels.sql`, idempotente y sin cambios de permisos ni tablas. No se ejecutó SQL de producción.

### Criterios y verificación

- Cobertura de los 70 slugs revisados, enum válido, paridad de SQL e inventario, filas antiguas corregidas sin mutación y media propia existente: `scripts/validate-exercises.mjs`.
- E2E: Supabase antiguo muestra Pike intermedio con la demo correcta; variante remota asistida también intermedia; Full Body principiante conserva al menos tres ejercicios; generación y cardio respetan nivel; planes pendientes se adaptan sin modificar snapshots ni registros; búsqueda manual informa nivel y el hash cambia si cambia nivel. Inicio real por cuenta atrás y recarga desde `day_log` conservan la sesión de fuerza adaptada (cuatro ejercicios y una sola vuelta a la calma) y el cardio fácil.
- Validadores de splits, planes, reproductor, migraciones, documentación y release gate.

### Operación

La corrección cliente funciona al desplegar sin una migración de producción. El SQL incremental es opcional para alinear las filas del servidor. Historial, registros, cargas utilizadas y resultados anteriores se conservan.
## REQ-253 - Entreno: "Actividad física principal" se entiende y cambiar el gimnasio por otro deporte un día es evidente

**Estado: implementado.**

### Origen

Diego (beta, 2026-10-21, iPhone), sobre Perfil → Entrenamiento: "No entiendo eso de actividad física principal", "Eso de elegir qué hacer en cada día también siento que te limita mucho a elegir" y "¿Qué pasa si un lunes no voy al gym y juego pádel?".

### Problema

- "Actividad física principal" no dice qué es ni qué cambia: Diego juega pádel, que no está en la lista, y eligió "Otra actividad" sin saber qué haría el plan con eso.
- "Días disponibles y lugar real" se lee como una agenda fija: nada dice que cualquier día se puede cambiar.
- Registrar otro deporte en un día de fuerza ya era posible (REQ-206, "＋ Registrar otra actividad" al final de Entreno), pero no aparece entre las opciones de "Adaptar hoy" ni explica qué pasa con la sesión que tocaba.

### Causa raíz

- Copy de `index.html`: label `pf_sport` "Actividad física principal" y `ob_sport` "¿Practicas alguna actividad física?", opción "Otra actividad", sin nota de ayuda; label "Días disponibles y lugar real".
- "Adaptar hoy" en `renderWorkout()` solo ofrece Solo 20 min / En casa / Sin equipo / Me perdí la sesión.

### Alcance

1. Onboarding y Perfil preguntan lo mismo: "¿Haces otro deporte además de la fuerza?", con opciones Caminar, Correr, Bicicleta, Natación, "Otro deporte" y "Ninguno, solo fuerza". `SPORT_LABELS.other` → "Otro deporte".
2. Nota bajo la pregunta que cambia con la opción (`primarySportHelp()`): qué suma a la semana (sesiones guiadas, días de tu deporte para pádel o fútbol, o solo fuerza).
3. Perfil: "Tu semana tipo: días y lugar" con la nota "Es tu semana de referencia, no una obligación: cualquier día puedes cambiar la sesión desde Entreno o registrar otro deporte en su lugar (por ejemplo, pádel en vez de gimnasio)."
4. Entreno → "Adaptar hoy": botón "Hice otro deporte" que abre el registro de actividad. En un día con sesión, el modal dice "Cuenta como día entrenado en lugar de <sesión>. Tu plan sigue igual desde la próxima sesión." y propone el último deporte registrado (o "Otra actividad"), no "Fuerza / gimnasio".
5. `CACHE_NAME` → `fitbud-pwa-v133` (junto con REQ-252).

### Fuera de alcance

- Elegir qué se hace cada día (fuerza o deporte) en vez del lugar, o mover la sesión de fuerza perdida a otro día: el lugar sigue orientando la plantilla (exterior/piscina → deporte) y "Me perdí la sesión" ya ofrece recuperarla.
- Añadir pádel, fútbol u otros deportes con plan guiado propio.

### Riesgos

- Ninguno sobre datos: solo copy y un acceso nuevo a un flujo existente; los valores guardados (`primarySport`) no cambian.

### Criterios de aceptación

- Perfil muestra la nueva pregunta y la nota cambia al elegir otra opción; la semana tipo explica que no es una obligación. ✓ (`tests/e2e/actividad-manual.spec.js`)
- En un día de fuerza, "Hice otro deporte" → Pádel marca el día como entrenado y el modal explica que reemplaza la sesión. ✓ (`tests/e2e/actividad-manual.spec.js`, capturas 390 px revisadas)
- `node scripts/release-gate.mjs` pasa.

## REQ-252 - Fix Entreno: con "Otra actividad" los días de tu deporte salían como "Descanso total"

**Estado: implementado.**

### Origen

Diego (beta, 2026-10-21, iPhone), con capturas de Perfil → Entrenamiento ("Otra actividad" + "Fuerza en gimnasio", lunes a jueves, el jueves en "Exterior"): "Eso de elegir qué hacer en cada día te limita mucho a elegir" y "¿qué pasa si un lunes no voy al gym y juego pádel?".

### Problema

Con "Otra actividad" (pádel, fútbol…) y fuerza, la plantilla de la semana reserva días para el deporte, pero la app los mostraba como "Descanso total": Diego elige 4 días y solo ve 2 sesiones de gimnasio; el día que dejó en "Exterior" para su deporte aparece como descanso. Lo que elige por día no se refleja en el plan. En producción, 3 de 13 perfiles tienen "Otra actividad" y ninguno tiene plan generado, así que todos usan esta semana tipo.

### Causa raíz

- `workoutSchedule()` (`index.html`) sustituía por `"descanso"` todos los slots de deporte cuando `primary==="other"`, porque `sportSessions()` no tenía una sesión real para "other" (un placeholder sin nombre que `workoutOptions()` descarta).

### Alcance

1. `sportSessions()`: "other" tiene una sesión real, `facil` → "Día de tu deporte" ("Juega tu deporte (pádel, fútbol…) o haz 30-45 min de actividad a tu elección, y regístralo para que cuente."), sin ejercicios y marcada `freeActivity`. "Actividad ligera libre" (solo fuerza con actividad ligera) también queda marcada `freeActivity`.
2. `workoutSchedule()`: con "other", los slots de deporte pasan a `facil` en vez de `descanso`. "strength_only" no cambia.
3. Entreno, en un día `freeActivity`: en vez de "Iniciar sesión guiada" (no hay ejercicios) o del texto de descanso, "Registrar mi actividad" abre el registro manual de REQ-206 y avisa "Si hoy no la haces, no cuenta como sesión perdida."; sin los atajos "Adaptar hoy" (Solo 20 min, En casa…), que no aplican. Hoy ofrece "Registrar mi actividad" en vez de "Iniciar"/"Adaptar".
4. `trainingDayResult()`: un día `freeActivity` sin registrar cuenta como descanso para la racha (no la rompe); registrado, como entrenado.
5. El registro en un día de tu deporte propone el último deporte que registraste (p. ej. pádel) o "Otra actividad".
6. `CACHE_NAME` → `fitbud-pwa-v133`.

### Fuera de alcance

- Cómo se explica la pregunta del deporte y cómo se cambia un día por otro deporte: REQ-253.
- El plan personalizado ("Preparar mi plan") no admite el tipo de sesión "other" (`training-plan.js`, `SESSION_TYPES`); estos usuarios siguen con la semana tipo.

### Riesgos

- Usuarios con "Otra actividad" ven cambiar sus días de deporte de "Descanso total" a "Día de tu deporte". El historial no cambia: los días ya registrados conservan lo ejecutado, y un día de deporte sin registrar no penaliza la racha, igual que el descanso.

### Criterios de aceptación

- "Otra actividad" + gimnasio, 4 días: la semana muestra 2 sesiones de gimnasio y 2 "Día de tu deporte", ninguna "Descanso total"; sin registrar, el día cuenta como descanso; "Registrar mi actividad" → Pádel lo marca como entrenado y la próxima vez propone Pádel. ✓ (`tests/e2e/actividad-manual.spec.js`)
- `node scripts/release-gate.mjs` pasa.

## REQ-250 - Fix Entreno: omitir el calentamiento ya elegido dejaba la sesión "parcial"

**Estado: implementado.**

### Origen

Jonathan (2026-10-21), con captura del resultado "Sesión parcial · 6/7 bloques completados · 16/16 series registradas · 1 bloque omitido": "Hice toda la sesión y lo único que pasé si no me equivoco son los calentamientos; no debería decir parcial, debería ser completada".

### Causa raíz

REQ-236 hizo opcionales el calentamiento y la vuelta a la calma, pero solo "Ahora no" los deja `declined`. Si el usuario elegía hacerlos y luego tocaba "Omitir bloque" (o "Omitir" en su cronómetro), `skipWorkoutStep()`/`finishTimedWorkoutStep()` (`index.html`) los marcaban `skipped`, que cuenta como bloque omitido y hace que `workoutFullyCompleted()` guarde la sesión como parcial.

### Alcance

1. Omitir un bloque opcional lo deja `declined`, igual que "Ahora no".
2. `normalizeStep()` (`workout-player.js`) convierte en `declined` un opcional `skipped`, así las sesiones en curso o guardadas antes del arreglo dejan de contarlo como omitido.
3. Una sesión guardada parcial a la que no le falta nada (sin bloques omitidos, sin series sin marcar, sin dolor) muestra "Marcar como completada", que la cierra completada sin reabrirla.
4. `CACHE_NAME` → `fitbud-pwa-v132`.

### Fuera de alcance

- Omitir un ejercicio o un bloque de cardio sigue dejando la sesión parcial.
- No se reclasifica sola ninguna sesión guardada: el cambio a completada lo decide el usuario.

### Criterios de aceptación

- Elegir el calentamiento y la vuelta a la calma y omitirlos, con todas las series hechas, guarda "Sesión completada" con 0 bloques omitidos. ✓ (`tests/e2e/entreno.spec.js`)
- Una sesión guardada parcial con el calentamiento `skipped` muestra 0 omitidos y "Marcar como completada"; al tocarlo queda completada y cuenta como entreno hecho. ✓ (misma prueba, `scripts/validate-workout-player.mjs`)
- `node scripts/release-gate.mjs` pasa.

## REQ-248 - Beta: los postulantes aceptados usan el coach sin tope durante sus 90 días

**Estado: implementado.**

### Origen

Pedido del dueño (2026-10-21): los postulantes aprobados deben tener consumo ilimitado y acceso completo por 90 días.

### Problema y causa raíz

`grantBetaAccess()` (`api/admin.js`) daba el `user_entitlements` de 90 días pero no tocaba `coach_quota_overrides`: la beta quedaba con las cuotas `default` (p. ej. 1 dieta semanal y 20 conversaciones al día). El canje del código (`api/entitlement.js`) tampoco.

### Alcance

1. `grantBetaAccess()` crea un override por acción del coach con `daily_limit = QUOTA_OVERRIDE_MAX` (10.000) que vence con el acceso. Cubre aceptar por correo, cuenta existente y crear/invitar cuenta beta.
2. `invite-signup` y `redeem`: si el código está en el `review_notes` de una postulación `beta_invited`, crea los mismos overrides; un cupón cualquiera no.
3. Si fallan, el acceso queda y el admin ve `betaError`; el canje nunca se bloquea. Sin migración SQL.
4. Textos del admin y `BETA_PROGRAM.md` actualizados; `CACHE_NAME` → `fitbud-pwa-v130`.
5. Datos: el único aceptado en producción ya tiene los overrides hasta 2027-01-19.

### Riesgos

Costo del proveedor sin tope por usuario beta; el panel de consumo sigue mostrando el uso por persona.

### Criterios de aceptación

- Aceptar o crear cuenta beta: 8 overrides de 10.000/día que vencen con el acceso. ✓ (`scripts/test-admin-beta-api.mjs`, `scripts/test-admin-beta-signup.mjs`)
- Canjear el código de una postulación aceptada crea los overrides; un cupón normal no. ✓ (`scripts/test-invite-signup-api.mjs`, `scripts/test-coupon-api.mjs`)
- `node scripts/release-gate.mjs` pasa.

## REQ-149 - Fix admin: "Regenerar plan · Solo nutrición" archiva también el entrenamiento futuro

**Estado: implementado.**
`fetchActivePlanVersion()` (`api/admin.js`) ahora trae `snapshot`; `applyResetPlan(scope="nutrition")` sigue archivando (`superseded`) la fila activa combinada, pero si `snapshot.trainingPlan` tiene contenido real (`planVersionHasTrainingContent()`), `insertTrainingOnlyVersion()` inserta una nueva fila activa (mismo `cycle_number`, próximo `version_number`) que conserva `trainingPlan` intacto con `nutritionPlan:null` desde `fromDate` — el entrenamiento futuro no pierde su prescripción y la nutrición sí cae a generación fresca, que es el efecto deseado. La fila vieja se supersede ANTES del insert, así nunca hay dos filas activas a la vez para `plan_versions_one_active_idx`. `previewResetPlan()` expone `willPreserveTraining` (sin filtrar el `snapshot` completo hacia el cliente) y el copy del modal admin distingue "se conserva el entrenamiento" de "se archiva el plan de nutrición". `scope="training"`/`"both"` sin cambios. Detalle completo (Origen/Problema/Causa raíz/Alcance/Criterios) en el commit que lo implementó; compactado a su resumen de Estado para respetar el tope de `validate-docs-index.mjs`. Verificado con `scripts/test-admin-reset.mjs` (2 casos nuevos: preview y apply sobre fila combinada).

## REQ-150 - PWA sirve HTML nuevo con JS del cache viejo tras un deploy (versión mezclada)

**Estado: implementado.**
`service-worker.js`: la navegación ahora usa `cacheFirst(request,"./index.html")` en vez de `networkFirst` — se sirve desde la MISMA `CACHE_NAME` que los `.js` (`cacheFirst` sin cambios), así que HTML y JS siempre son de la misma generación; la versión nueva llega completa recién cuando el SW nuevo instala y activa (atómico vía `cache.addAll`). `CACHE_NAME` subido a `v69`. `registerServiceWorker()` (`index.html`) escucha `updatefound`/`statechange` y, cuando detecta una instalación real (no la primera) vía `navigator.serviceWorker.controller` ya presente, muestra un badge discreto ("↻ Actualizar", sin vocabulario técnico) en vez de recargar sola — recargar automáticamente podía interrumpir una acción en curso. Detalle completo (Origen/Problema/Causa raíz/Alcance/Criterios) en el commit que lo implementó; compactado a su resumen de Estado para respetar el tope de `validate-docs-index.mjs`. Verificado con `scripts/test-service-worker-cache.mjs` (ejecuta el SW real en `node:vm` con `caches`/`fetch` simulados).

## REQ-126 - Admin: resetear futuro y regenerar nutrición/entrenamiento para cualquier usuario

**Estado: implementado.** `api/admin.js` agrega `previewResetPlan`/`applyResetPlan` (alcance nutrition/training/both) y `resetUserToOnboarding`; los días con comida registrada o entreno hecho quedan protegidos, aplicar solo reescribe `day_log.state` de días no protegidos y archiva la versión de plan activa. Panel admin con "Regenerar plan" (vista previa obligatoria) y "Reiniciar usuario" (doble confirmación), bloqueados para la propia cuenta y otros admins. Detalle en el commit. **Infra pendiente:** `supabase/admin_reset.sql` (tabla `admin_actions_log`) requiere aplicarse manualmente en Supabase. Verificado con `scripts/test-admin-reset.mjs`.

Pendiente de infraestructura (no ejecutable por el agente): aplicar `supabase/admin_reset.sql` en el proyecto de Supabase de producción para que `admin_actions_log` exista antes de usar estas acciones (la auditoría falla en silencio — no bloquea la operación principal — si la tabla no existe todavía). Detalle histórico: commit de implementación de REQ-126.

## REQ-147 - Decidir si vale la pena tocar la selección de `planDeterministicNutritionDay()`/`globalClosePass()` para superar el techo de catálogo del canario `DIET_CONTRACT`

**Estado: implementado.** Cerrado con decisión de producto (Jonathan, 2026-08-30): no había techo de catálogo; el ~32-33% del canario `DIET_CONTRACT` venía de que `globalClosePass()` optimizaba `scoreMacros()` (asimétrico) mientras el contrato exige tolerancias duras y simétricas (100% de los fallos de carbohidratos eran por exceso). Se autorizó una cuarta opción —corregir la función objetivo del cierre sin tocar la selección de platos (REQ-143 intacto)— implementada en REQ-166 (canario 32.3%→76.5%, 38/54 dimensiones, sin regresiones). Aprendizajes para futuras corridas: ampliar el pre-rankeo 48→200 no mueve el canario (medido y descartado, no reintentar); la etiqueta `catalog_gap` era un diagnóstico incorrecto y costó dos sesiones de lotes de catálogo. Detalle completo en git (commit de REQ-166) y en REQ-143.

## REQ-153 - Fix Home: las sugerencias del coach ignoran comidas saltadas (y la pausa por seguridad) y contradicen la agenda

**Estado: implementado.**
`buildContextualChips(ds)` (`index.html`) ahora excluye comidas `.skipped` de `pendingMeals` (igual que `homeAgendaData`, REQ-125) y agrega `!trainingSafetyHold()` a `workoutPending`, así los chips nunca sugieren una comida recién saltada ni el entrenamiento mientras hay una pausa por seguridad activa — mismo criterio que ya usa la agenda, sin tocar `COACH_SUGGESTIONS`/`nextDailyAction` (fuera de alcance). Detalle completo (Origen/Problema/Causa raíz/Alcance/Criterios) en el commit que lo implementó; compactado a su resumen de Estado para respetar el tope de `validate-docs-index.mjs`. Verificado con `tests/e2e/home.spec.js` (nuevo; confirmado que ambos casos fallan exactamente como describe el REQ contra el código sin el fix y pasan con él).

## REQ-120 - Nutrición: "No me gusta este plato" bloquea futuras sugerencias hasta editar Perfil

**Estado: implementado.** `profile.prefs.blockedDishes` guarda `{key,name}` por plato bloqueado; el planificador determinista y todas las rutas de IA (`dishDietAllowed`, `coachDishBlockedByProfile`, reemplazos y validación de acciones del coach) los excluyen, con refuerzo por prompt. Acción "🚫 No me gusta este plato" desde la comida aplicada y el borrador generado; Perfil > Comidas permite "Volver a sugerir". Días ejecutados no se tocan. Detalle en el commit. Verificado con `scripts/validate-blocked-dishes.mjs` y la suite E2E.

_Origen: feedback de Jonathan (3 jul 2026). Detalle completo (Origen/Problema/Causa raíz/Alcance/Criterios) en el commit que lo implementó; compactado a su resumen de Estado para respetar el tope de `validate-docs-index.mjs`._

## REQ-152 - Fix onboarding: "Mantenerlo por ahora" en el aviso de revisión de 4 semanas lanza ReferenceError y no cierra ni guarda

**Estado: implementado.**
`keepCurrentProfile()` (`index.html`) ya no referencia `calendarChanged`/`planEndDate` (variables locales de `saveOnboarding()`/`saveProfile()`, fuera de su ámbito, causaban `ReferenceError` bajo `"use strict"` antes del `await`): usa `reason:"Preferencias guardadas"` fijo (este flujo nunca cambia el calendario) y `validTo` de `prefs.planEndDate` ya guardado, o `planEndFor(prefs.planStartDate,resolvedPlanDuration(prefs))` si faltara. Detalle completo (Origen/Problema/Causa raíz/Alcance/Criterios) en el commit que lo implementó; compactado a su resumen de Estado para respetar el tope de `validate-docs-index.mjs`. Verificado con `tests/e2e/onboarding.spec.js` (confirmado que el test falla exactamente como describe el REQ contra el código sin el fix y pasa con él).

## REQ-266 - Fix: los recordatorios por correo y push nunca se enviaban

**Estado: implementado — requiere acción humana:** crear el secreto `CRON_SECRET` en GitHub (Settings → Secrets and variables → Actions) con el mismo valor que la variable `CRON_SECRET` de Vercel.

### Origen

Jonathan (2026-10-24): "Creo que las notificaciones no están funcionando".

### Evidencia

- `notification_log` en producción está vacía: nunca se intentó un envío, ni de correo ni de push.
- `notification_preferences`: 2 usuarios con avisos activos (1 correo, 2 push), ambos `America/Lima`, hora 20.
- `GET https://evolvapp.club/api/notify` sin secreto responde `401` con `keepAlive: true`: el endpoint y Supabase funcionan.

### Causa raíz

`vercel.json` dispara `/api/notify` una vez al día a las 08:00 UTC (límite del plan Hobby: un cron diario). `runJob()` (`api/notify.js`) solo enviaba si `currentHourInTz(tz) === notify_hour`. En Lima eso es a las 03:00, y Perfil → Recordatorios solo ofrece de 17:00 a 23:00 (`NOTIF_HOURS`): la condición no se cumplía nunca. Lo mismo para el push de racha.

### Alcance

1. `.github/workflows/notify-hourly.yml`: cada hora (minuto 7) llama a `/api/notify` con `Authorization: Bearer CRON_SECRET`. URL configurable con la variable de repo `NOTIFY_URL` (por defecto `https://evolvapp.club/api/notify`). El log del job muestra solo conteos, nunca usuarios ni correos. Falla visible si falta el secreto o el endpoint no responde 200.
2. `isNotifyTime()`: se envía en el primer disparo a la hora elegida o después, dentro del mismo día local. Un disparo que llega tarde no pierde el aviso; la idempotencia por día (`notification_log`) evita repetirlo. Aplica a correo y push.
3. El cron diario de Vercel se mantiene: sigue haciendo el keep-alive de Supabase (REQ-178/179) y, a las 03:00 de Lima, no envía nada.

### Fuera de alcance

- WhatsApp (REQ-255).
- Verificar en Vercel `RESEND_API_KEY`, `NOTIFY_FROM_EMAIL` y las claves VAPID: sin acceso desde el agente. Si faltan, el job registra el error en `notification_log` (correo) o no intenta el push (`vapidReady` falso).

### Criterios de aceptación

- Con la hora elegida ya pasada hoy, el disparo envía; justo a la hora, envía; antes, no; ya enviado hoy, no repite. ✓ `scripts/validate-notify-schedule.mjs` (falla con el código anterior), en el release gate.
- Tras crear el secreto, "Run workflow" del workflow responde 200 y, a la hora elegida, `notification_log` registra el envío.

## REQ-267 - Fix: los avisos push no tenían clave privada VAPID

**Estado: implementado — requiere acción humana:** crear en Vercel (Production) `VAPID_PRIVATE_KEY` (generada para este cambio y entregada fuera del repo) y `VAPID_SUBJECT` (`mailto:` del responsable), y volver a desplegar.

### Origen

Jonathan (2026-10-24), al revisar las variables de Vercel para REQ-266: "Las de vapid no existen".

### Causa raíz

REQ-38 embebió la clave pública `BG6yy…` en `index.html` y como respaldo en `api/notify.js`, pero `VAPID_PRIVATE_KEY` nunca se configuró en Vercel y la privada correspondiente no está en ningún lado. Sin ella, `vapidReady` es falso y el job nunca intenta el push; tampoco se puede firmar para las 2 suscripciones existentes, hechas con esa clave.

### Alcance

1. Par VAPID nuevo: la pública reemplaza a la anterior en `index.html` y `api/notify.js`. La privada no entra al repo.
2. `refreshPushSubscriptionKey()` (no-await en `onAuth()`): con permiso concedido y `push_opt_in` activo, si la suscripción del dispositivo usa otra clave (`pushKeyOf()`), la anula y se suscribe de nuevo con la actual (`subscribePush(true)`, sin toast). Lee las preferencias frescas del usuario que entra.
3. `scripts/validate-vapid-key.mjs` en el release gate: misma clave en cliente y servidor, punto P-256 de 65 bytes y no la anterior.
4. `CACHE_NAME` → `fitbud-pwa-v142` (`main` ya usaba v141 por REQ-264).

### Fuera de alcance

- Borrar las filas viejas de `push_subscriptions`: el job registra `push_error` en ellas hasta que el usuario vuelva a entrar (entonces se agrega la nueva y la vieja deja de importar). Limpieza opcional a mano en Supabase.

### Criterios de aceptación

- Cliente y servidor usan la misma clave nueva, válida. ✓ `scripts/validate-vapid-key.mjs`.
- Con las variables en Vercel, un usuario con avisos activos que vuelve a entrar queda suscrito con la clave nueva y recibe el aviso a su hora (REQ-266).

## REQ-265 - Fix recordatorios: el cron marca "entrenamiento pendiente" en días de descanso

**Estado: implementado.**

### Origen

Auditoría del journey de retención (recordatorios REQ-24 y push de racha REQ-38). El criterio de "descanso" de `checkPending()` en `api/notify.js` no coincide con la forma del dato que escribe `index.html`.

### Problema

El recordatorio diario de entrenamiento se dispara también en días de **descanso planificado** del split y en días marcados como descanso ("Día marcado como descanso planificado"). Como `notify_training` está activo por defecto (`index.html:8028`), un usuario que entrena 3 días/semana recibe hasta 4 avisos falsos de "Tienes entrenamiento pendiente para hoy" por semana. Contradice el criterio propio de REQ-38 ("solo cuando hay algo pendiente… sin castigar descansos planificados", `docs/requirements-history.md:2030`) y empuja a desactivar notificaciones — daño directo a retención.

### Causa raíz

`checkPending()` (`api/notify.js:134-137`) decide el descanso solo con `override.type === "rest" || override.type === "missed_converted_rest"`, esperando un objeto. Pero el cliente escribe `workoutOverride` siempre como **string**: `st.workoutOverride="descanso"` (`index.html:7295` y `:9548`) o un id de entreno (`:6524`, `:9530`). `"descanso".type` es `undefined`, así que `isRestDay` es siempre `false` y `trainingPending = !workoutDone`. Además `"missed_converted_rest"` no existe en ningún otro archivo: es una forma que nadie produce. El cron tampoco consulta el plan/split (no lee `plan_versions` ni `plannedWorkoutId`), así que no detecta un descanso planificado sin override.

### Objetivo

Que el recordatorio de entrenamiento NO se envíe en días de descanso (planificados o marcados por el usuario); solo cuando hay una sesión realmente prescrita y sin cerrar.

### Alcance

1. En `checkPending()`, reconocer el descanso con la forma real del dato: `workoutOverride === "descanso"` (string).
2. Detectar el descanso planificado del split cuando no hay override (replicar `plannedWorkoutId`/schedule con las prefs del usuario, o persistir el tipo de día en `day_log` para que el cron lo lea).

### Fuera de alcance

- Rediseñar `workoutOverride` a objeto; el cliente lo usa como string en todos los flujos.
- Recordatorio de nutrición (su criterio `mealIds` no depende de esto).

### Riesgos

- Si solo se arregla el string pero no el descanso planificado sin override, persiste el falso positivo mayoritario.
- Cambiar la firma de `workoutOverride` rompería lectura del cliente; mantener compatibilidad con string.

### Criterios de aceptación

- En día de descanso (planificado o `workoutOverride==="descanso"`) sin sesión cerrada, `checkPending().training === false`.
- En día con sesión prescrita y sin cerrar, sigue siendo `true`.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Fixture de `checkPending()` con cuatro estados: descanso planificado sin override, `workoutOverride:"descanso"`, entreno sin cerrar, entreno cerrado.
- Repro de esta auditoría: la lógica de `:134-137` sobre `{workoutOverride:"descanso"}` da `pending=true` hoy (debe ser `false`).

### Implementación

1. `commitDay()` (`index.html`) guarda `restDay` en el estado del día: `true` si `effectiveWorkout(ds).id` es `descanso` (plan o marcado por el usuario) o `safety_hold` (pausa por seguridad). Envuelto en try/catch: un error al leer el plan nunca impide guardar el día.
2. `checkPending()` (`api/notify.js`): el entreno no está pendiente si `restDay === true` o `workoutOverride === "descanso"` (string, la forma real). Se quitó la forma de objeto que nadie produce.
3. `CACHE_NAME` → `fitbud-pwa-v152` (`main` ya usaba v151).

Límite conocido: `restDay` se calcula al guardar el día. Si el usuario cambia sus días de entreno en Perfil, un día ya guardado conserva el valor anterior hasta que se vuelva a guardar. Un día sin fila en `day_log` no recibe ningún recordatorio (como antes).

### Verificación

- `scripts/validate-notify-schedule.mjs`: descanso por `restDay`, por `workoutOverride:"descanso"`, sesión pendiente y sesión cerrada (falla con el código anterior).
- `tests/e2e/recordatorios.spec.js`: con sesión prescrita `restDay` es `false`; tras "Me perdí la sesión" → "Convertir en descanso" es `true`.

## REQ-254 - (propuesta original) Nutrición: el plan respeta cuánto cocinas (quien no cocina no recibe tacos con frijoles)

**Estado: pendiente — requiere acción humana:** aprobar la ampliación del catálogo y curar el nivel de cocina de cada plato antes de que un agente pueda implementar el filtro.

### Origen

Diego (beta, 2026-10-21, audio): "Justo ahora ya terminé todo y me sale como próxima comida tacos de no sé qué con frijol, pero yo no sé hacer ni tacos ni el frijol. Estaría bueno que afines eso para la gente que no sabe cocinar o que no cocina."

### Problema

Quien no cocina recibe platos que piden cocinar de verdad (tacos con frijoles, seco con frijoles, enchiladas). El perfil solo pregunta "Minutos para cocinar" y ese dato no cambia lo que propone el plan.

### Causa raíz

- `planDeterministicNutritionDay()` y `compatibleDishesForSlot()` (`js/nutrition-domain.js`) no leen `prefs.cookingMinutes` ni `dishes.prep_minutes`/`dishes.needs_kitchen`; solo el texto del coach (`index.html`, "Tiempo por comida: ≤N min") lo menciona.
- Los datos del catálogo no sirven para filtrar: `prep_minutes` es un valor por franja, no por plato (consulta a producción 2026-10-21, 180 platos: todo almuerzo = 30, toda cena = 20, todo desayuno = 15), y `needs_kitchen` es `true` en todos los almuerzos y cenas. Filtrar hoy por "≤15 min" dejaría sin almuerzo ni cena.
- No existe una preferencia de "nivel en la cocina": "Minutos para cocinar" mezcla tiempo y habilidad.

### Objetivo

Una persona que marca "No cocino" o "Lo básico" recibe platos que puede armar sin saber cocinar (comprar listo + ensamblar, microondas, una sartén), y sigue cuadrando macros.

### Alcance propuesto

1. Preferencia nueva en onboarding y Perfil → Comidas: "¿Cuánto cocinas?" — "No cocino (armo o caliento)" / "Lo básico (una sartén, hervir)" / "Me gusta cocinar". Por defecto "Lo básico" para perfiles existentes.
2. Catálogo: columna `cooking_level` (`none`/`basic`/`cook`) en `dishes`, migración idempotente; curar los 180 platos a mano (y corregir `prep_minutes` por plato). Acción manual: ejecutar la migración en producción.
3. Ampliar almuerzos y cenas de nivel `none`/`basic` (hoy no hay ninguno): pollo rostizado + arroz listo + ensalada, wraps de atún o pavo, bowls con legumbre en lata, tortilla francesa con pan, etc.
4. `compatibleDishesForSlot()` excluye platos por encima del nivel elegido; si una franja queda sin candidatos, cae al nivel siguiente y lo dice ("Hoy no encontramos algo más simple para la cena").
5. En "Cambiar comida", un filtro rápido "Más fácil de preparar".

### Fuera de alcance

- Videos de recetas.
- Reescribir los platos ya planificados de días pasados (historial inmutable).

### Riesgos

- Menos candidatos por franja empeora el cuadre de macros (canario `DIET_CONTRACT`, ver REQ-143/REQ-147): medir antes y después.
- El paso 2 es trabajo de contenido, no automatizable sin revisión humana del etiquetado.

### Criterios de aceptación

- Con "No cocino", una semana generada no incluye platos `cook`; con "Me gusta cocinar", no cambia nada.
- Con "No cocino", ninguna franja queda vacía; si se relaja el nivel, se avisa.
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Canario `DIET_CONTRACT` antes y después con perfiles "No cocino" / "Lo básico" / "Me gusta cocinar".
- E2E: perfil "No cocino", preparar la semana y comprobar que ningún plato es `cook`.

### Decisión pendiente (Jonathan)

- ¿Se aprueba ampliar el catálogo con almuerzos/cenas "sin cocinar" (choca con la pausa de REQ-143)?
## REQ-271 - Registro: editar ingredientes y gramos decimales sin perder el cálculo

**Estado: implementado.** Prioridad P1. Dependencias: REQ-270. Detalle y casos: `docs/competitive/2026-10-22-myfitnesspal/BACKLOG.md`.

### Origen
Probe `ingredient-snapshot`; `addFoodToEditor()` redondea gramos y concatena texto.

### Problema
33,5 g se guarda como 34 g y las líneas no se pueden corregir después.

### Objetivo
Componer una comida editable con totales derivados de cantidades reales.

### Alcance
Componentes con base nutricional capturada; añadir/editar/quitar, gramos decimales y redondeo solo visible; integrarlos en ficha y compras actuales cuando existen.

### Fuera de alcance
Extraer ingredientes de texto antiguo o alterar catálogo global.

### Riesgos
Doble suma, pérdida de precisión, crudo/cocido ambiguo y componentes obsoletos.

### Criterios de aceptación
33,5+0,5 g mantiene precisión interna; editar/quitar recalcula. Recarga conserva líneas y snapshot; compras refleja componentes reales. Legado sin líneas sigue editable manualmente.

### Verificación sugerida
Cálculo puro, E2E de composición/reapertura/corrección, compras, offline y cancelación.

### Implementación
- `js/meal-log.js`: líneas `{name, unit 100g|100ml|portion, amount, base, ref}` con base propia (snapshot), máx. 30 líneas y 2000 g/ml o 20 porciones; `componentsTotals` suma con precisión completa; nombre automático `componentsName`; origen `componentsSource`.
- Editor: «Alimento» añade una línea (gramos con coma), cada línea se edita o se quita y recalcula; lo ya elegido/escrito pasa a ser la primera línea por porción. Guardar persiste `components` y totales a una décima; cambiar totales a mano marca `corrected`. Comidas del plan con receta del catálogo: «Ajustar ingredientes de la receta». `mealRecipe()` usa las líneas (tarjeta, detalle y lista de compra). Reabrir no depende del catálogo; entradas antiguas sin líneas siguen manuales. Nada se escribe en el catálogo global.
- Verificación: `scripts/test-meal-log.mjs`, `tests/e2e/composicion.spec.js`.

## REQ-276 - Nutrición: productos propios por código y escaneo progresivo

**Estado: implementado.** Prioridad P2. Dependencias: REQ-274. Detalle y casos: `docs/competitive/2026-10-22-myfitnesspal/BACKLOG.md`.

### Origen
Fuentes S09/S10; no hay código de producto en el registro actual.

### Problema
Identificar de nuevo un producto ya creado exige buscar por nombre.

### Objetivo
Resolver producto propio por GTIN, sin inventar nutrientes ni depender de un proveedor.

### Alcance
GTIN-8/12/13/14 válido, búsqueda escrita y captura si cámara/BarcodeDetector soportados; corrección privada y confirmación de etiqueta/cantidad.

### Fuera de alcance
Proveedor externo, lector universal, librería runtime y garantía de escaneo en iOS.

### Riesgos
Perder ceros, confundir presentación, permiso denegado o contaminar catálogo compartido.

### Criterios de aceptación
Código propio válido abre ficha; desconocido ofrece alta manual. Sin cámara/API sigue disponible entrada escrita. No registra automáticamente ni modifica coincidencias de otras cuentas.

### Verificación sugerida
Checksum/normalización, capacidades/permiso simulados, E2E escrito/válido/desconocido/offline y confirmación.

### Implementación
- `parseGtin`/`sameGtin`: GTIN-8/12/13/14 con dígito de control GS1; se guarda tal como se leyó (ceros incluidos) y se compara rellenado a 14 dígitos. Alimento propio con «Código de barras (opcional)»; un código no se repite entre presentaciones.
- En «Alimento», un número de 8+ dígitos busca por código entre tus alimentos: si coincide pide confirmar etiqueta y cantidad; si es desconocido ofrece «Crear alimento con este código» (nunca registra solo); si es inválido lo explica. «Escanear» solo aparece con `BarcodeDetector`, cámara y contexto seguro; si no (p. ej. iOS), se escribe el código. Varios códigos se eligen; cancelar o cerrar apaga la cámara. Sin red externa ni librerías.
- Verificación: `scripts/test-meal-log.mjs`, `tests/e2e/codigo-barras.spec.js` (detector simulado; no es una prueba física en iPhone).

## REQ-274 - Nutrición: biblioteca privada de alimentos desde etiqueta

**Estado: implementado.** Prioridad P1. Dependencias: REQ-269, REQ-270 y REQ-271. Detalle y casos: `docs/competitive/2026-10-22-myfitnesspal/BACKLOG.md`.

### Origen
Fuentes S02/S09/S12; `renderQuickPicks()` solo busca DB.ingredients y favoritas no tienen unidad base.

### Problema
Un producto local no catalogado debe registrarse por totales cada vez que cambia la cantidad.

### Objetivo
Crear producto propio reutilizable por su base y porción declaradas.

### Alcance
Hasta 100 fichas privadas en profiles.prefs: nombre/marca, base 100 g/100 ml/porción, nutrientes y equivalencia conocida; integración en buscador existente.

### Fuera de alcance
Proveedor, OCR, catálogo público y certificación de alérgenos.

### Riesgos
Confundir ml/g, variantes o editar historia consumida; preservar otras preferencias y privacidad.

### Criterios de aceptación
Ficha por 125 g escala correctamente; unidad sin masa no convierte a gramos. Editar no cambia consumos previos; búsqueda incluye marca; otra cuenta no accede y recarga conserva.

### Verificación sugerida
Cálculo por base/unidad, límites, E2E alta/búsqueda/registro/corrección, conflicto y dos cuentas.

### Implementación
- `prefs.customFoods` (máx. 100; nombre ≤160, marca ≤80): valores por 100 g, 100 ml o porción declarada sin peso (se registra por porciones, nunca en gramos) y equivalencia opcional «1 pote = 125 g». `validateCustomFoodInput` exige los cuatro valores con límites plausibles; `mergeCustomFoods` fusiona por id/versión con lápidas (`customFoodsDeleted`).
- La pestaña «Alimento» muestra «Tus alimentos» (etiqueta «Tuyo») antes del catálogo, «＋ Crear alimento propio» (precarga la búsqueda), editar (versión +1) y eliminar. Registrar crea una línea `ref:{kind:"food",id,version}` con snapshot. Guardar relee el perfil y aplica la operación; sin conexión, error sin cambios. Sin OCR ni proveedor; el catálogo global no cambia.
- Verificación: `scripts/test-meal-log.mjs`, `tests/e2e/alimentos-propios.spec.js`.

## REQ-273 - Nutrición: copiar comida o selección del día a otra fecha

**Estado: implementado.** Prioridad P1. Dependencias: REQ-270 y REQ-272. Detalle y casos: `docs/competitive/2026-10-22-myfitnesspal/BACKLOG.md`.

### Origen
Fuentes oficiales S05/S06; búsqueda de código distingue recientes/propagación de un flujo general de copia.

### Problema
No hay preview de copia de entradas/selección a otro día con control de consumo y destino.

### Objetivo
Repetir comidas sin reescribir números ni modificar la fuente.

### Alcance
Selección de comida/día, una fecha destino del ciclo, preview y modo adicional/sustitución; nuevas identidades y snapshot; preservar fuente.

### Fuera de alcance
Copia masiva a siete días, cambio de ciclo y prescripción automática.

### Riesgos
Heredar done, duplicar al reintentar o sobreescribir destino.

### Criterios de aceptación
Futuro queda pendiente; hoy/pasado exige decisión de consumo. Destino con datos no se pisa silenciosamente; cancelar no escribe. Copia/edición no altera origen ni racha antes de consumir.

### Verificación sugerida
E2E de destino ocupado/vacío, futuro, misma fecha, cancelación, receta versionada e idempotencia.

### Implementación
- «⧉ Copiar a otro día» (menú «···» de la comida) y «Copiar comidas a otro día» (Más opciones): elegir entradas, día del ciclo y modo adicional o «en lugar de la misma comida»; vista previa con destino, reemplazos y kcal. Hoy/pasado exige elegir si se comió; el futuro queda planificado. Misma fecha, origen vacío o sin selección no copian.
- `copyEntrySnapshot` copia valores, líneas y origen con `copiedFrom`, sin ids de sync, estado ni deshacer del origen; extras con `oid` nuevo; los reemplazos usan `applyMealSubstitution` (deshacibles). Un solo `commitDay` por copia. Lote de varios días queda fuera.
- Verificación: `scripts/test-meal-log.mjs`, `tests/e2e/copiar-comidas.spec.js`.

## REQ-268 - Estimación: no aplicar plantillas genéricas como macros de una comida

**Estado: implementado.** Prioridad P0. Dependencias: ninguna nueva. Detalle y casos: `docs/competitive/2026-10-22-myfitnesspal/BACKLOG.md`.

### Origen
Solicitud directa; contraste MFP sin entrevistas. Probe `fallback-template` y `aiEstimate()`/rama reuse de `api/claude.js`.

### Problema
La plantilla 500/25/55/20 puede aplicarse a cualquier descripción como resultado específico.

### Objetivo
Reutilizar solo resultados compatibles o explicar el fallo conservando los campos.

### Alcance
Cliente, contrato de respuesta y fallback de meal_estimate; conservar reutilización válida y límites existentes.

### Fuera de alcance
Pricing, nuevas cuotas y otras acciones del coach.

### Riesgos
Confundir fallo con cero o romper reutilización válida; no reutilizar entre usuarios o contextos distintos.

### Criterios de aceptación
Sin resultado compatible no cambia macros ni anuncia estimación aplicada. Reutilización exacta funciona. Error conserva formulario; foto distinta no usa otro resultado.

### Verificación sugerida
Fixtures de generation/reuse/template/ausencia/error, dos contextos y usuarios; E2E de conservación de valores.

### Implementación
- Cliente: `aiEstimate()` y `photoEstimateRound()` envían `fallbackText` vacío; `validEstimate()` exige cuatro valores finitos no negativos y rechaza respuestas `origin:"template"`. Sin resultado válido, `estimateErrorMessage` dice que no se pudo estimar y que los valores no cambiaron; no se muestra «Aplicado» ni ✓.
- Servidor: `NO_TEMPLATE_ACTIONS` (`meal_estimate`) descarta cualquier fallback, también el de un cliente antiguo; si `select_reusable_coach_part` no tiene una generación del mismo usuario y `contextKey`, responde 422 `no_compatible_result` y marca la parte fallida (devuelve la reserva). La respuesta reutilizada informa `origin`. `validateCoachOutput` rechaza macros negativos. Sin cambios SQL.
- Verificación: `scripts/test-meal-estimate-no-template.mjs` (sin pool, cliente antiguo con plantilla, reutilización exacta, origen template) y `tests/e2e/estimacion.spec.js` (422, plantilla reutilizada, negativos, reutilización compatible, foto).

## REQ-281 - Recordatorios: el job dice si el push está listo y tolera espacios en las claves

**Estado: implementado.**

### Origen

Jonathan (2026-10-26), tras cargar las variables VAPID en Vercel y redesplegar: la respuesta del job (`notify-hourly.yml`) seguía sin la sección `push`. No había forma de saber si faltaba una variable o si su valor era inválido.

### Causa raíz

`api/notify.js` solo activaba el push si ambas variables existían y `webpush.setVapidDetails()` no fallaba. El error se tragaba (`catch (_) {}`) y la respuesta omitía `push`. Un espacio o salto de línea al pegar la clave privada en Vercel basta para que `web-push` la rechace ("should be 32 bytes long when decoded").

### Alcance

1. Se recortan (`trim`) `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` y la pública antes de configurar `web-push`.
2. La respuesta del job siempre incluye `push`: `{ready: true, sent, skipped, errors}` o `{ready: false, issue}`. `issue` es "falta VAPID_PRIVATE_KEY", "falta VAPID_SUBJECT" o "VAPID inválida: <mensaje de web-push>". Los mensajes de `web-push` no incluyen la clave privada. El endpoint solo responde con `CRON_SECRET` y el workflow imprime solo conteos y `push`.

### Criterios de aceptación

- Sin clave privada, sin subject o con clave inválida, `push.ready` es `false` con el motivo, y el motivo no contiene la clave. Con espacios o saltos de línea pegados, `push.ready` es `true`. ✓ `scripts/validate-notify-push-ready.mjs`, en el release gate.

## REQ-282 - Recordatorios: avisar a quien todavía no empezó el día

**Estado: implementado.**

### Origen

Primer envío real (2026-10-25, 20:00 Lima): el job corrió con el usuario de correo activo (`processed: 1`) pero envió 0. Ninguno de los dos usuarios con avisos tenía fila en `day_log` ese día: no habían abierto ni preparado el día.

### Problema

`checkPending()` (`api/notify.js`) devolvía "nada pendiente" cuando no existía el día. Quien no abrió la app, que es quien más necesita el recordatorio, nunca lo recibía. Tampoco quien abrió el día sin prepararlo (sin comidas en el estado).

### Alcance

1. Sin fila en `day_log`, o con fila sin comidas, extras, actividades manuales ni entreno hecho (`notStarted`), cuenta como comidas pendientes.
2. El correo de ese caso usa el asunto "Tu plan de hoy te espera" y el texto "Aún no has empezado tu plan de hoy". Reutiliza el tipo `nutrition` de `notification_log` (la restricción `CHECK` solo admite `nutrition`, `training` y `push_streak`): un aviso por día, sin migración.
3. El push de racha también sale en ese caso, porque usa `checkPending()`.
4. El recordatorio de entreno no sale sin el día: sin el estado no se sabe si toca descanso (REQ-265).

### Fuera de alcance

- Saber si toca entrenar un día que nunca se abrió (requeriría guardar el calendario del plan en el servidor).

### Criterios de aceptación

- Sin el día, o con el día sin nada registrado, y aviso de comidas activo: sale "Tu plan de hoy te espera". Con solo el aviso de entreno: no sale nada. Con algo registrado (comidas hechas, un extra): no sale el aviso de no empezado. ✓ `scripts/validate-notify-schedule.mjs` (falla con el código anterior).

## REQ-283 - Racha: animación al registrar algo que la hace avanzar

**Estado: implementado.** Prioridad P1. Diseño: `docs/reminders-journey.md`.

### Origen
Jonathan (2026-10-26): "cuando entras y haces algo se debe ver una animación de la actualización de racha".

### Problema
Marcar comidas o cerrar el entreno no da ninguna respuesta sobre la racha: cambia en silencio y solo los hitos 3/7/14/30 muestran un toast.

### Objetivo
Cada registro que acerca el día a la racha muestra cuánto falta; al cumplir el día, el número sube con una animación, también al recuperar ayer.

### Alcance
Píldora fija arriba, desde cualquier pestaña: avance del día (comidas necesarias + entreno), día sumado, primer día, hito y racha recuperada. Solo ante cambios locales que suman; con `prefers-reduced-motion`, fundido sin desplazamiento.

### Fuera de alcance
Cambiar la definición de racha (REQ-23) o los hitos guardados.

### Riesgos
Animar cambios remotos o programáticos; tapar controles; costo de calcular la racha en cada render.

### Criterios de aceptación
Marcar una comida muestra lo que falta; cumplir el día sube el número (N → N+1) y lo anuncia por `aria-live`; desmarcar no anima; tocar la píldora la cierra.

### Verificación sugerida
E2E con racha sembrada: comida → avance; descanso → día sumado; desmarcar sin animación; capturas móvil.

### Implementación
- `streakDayProgress(ds)`: piezas del día que cuentan para la racha (REQ-23): `ceil(comidas/2)` comidas con contenido marcadas + el entreno salvo descanso. `streakEndingAt(ds)` cuenta días cumplidos seguidos que terminan en `ds`; `streak()` la usa.
- `_streakSeen` guarda las piezas de hoy y de ayer y la racha. `render()` llama `primeStreakSeen()` (solo recalcula la racha si cambió la firma), así que lo que llega de otro dispositivo o del arranque se absorbe sin animación. `commitDay()` llama `streakFeedbackAfterCommit(ds)` (en `try`, nunca bloquea el guardado) para hoy y ayer.
- Casos: avance de hoy ("Faltan 1 comida y el entreno / para sumar el día N+1 de tu racha"), día sumado ("Día N sumado", "Día 1. Empezó tu racha.", hitos "7 días seguidos"), ayer a medias ("para recuperar tu racha de N días") y ayer completado ("Racha recuperada"). Desmarcar o un cambio sin avance no anima.
- `#streakPop` es un contenedor permanente `role=status aria-live=polite`; la píldora es un botón que se cierra al tocarlo y se va sola (2,8 s avance, 3,6 s día, 4,4 s hito). Llama SVG con relleno recortado (`clipPath` escalado por `--sp-from/--sp-to`), número que sube con desenfoque breve y llama que se enciende. Con `prefers-reduced-motion`, solo fundidos.
- `checkAndSaveMilestones()` no repite el toast del hito si la píldora ya lo está mostrando.
- Verificación: `tests/e2e/racha-animacion.spec.js` (avance, día sumado con 3 → 4, cerrar al tocar, desmarcar sin animación, día 1 tras racha rota, racha recuperada) y capturas móvil con y sin movimiento reducido.

## REQ-284 - Hoy: tarjeta de regreso y rescate de ayer

**Estado: implementado.** Prioridad P1. Diseño: `docs/reminders-journey.md`.

### Origen
Jonathan (2026-10-26): el journey debe cubrir a quien volvió tras días o semanas, recordando progreso, objetivos o racha.

### Problema
Al volver tras 2-13 días, Hoy no reconoce la ausencia ni muestra lo logrado; quien olvidó registrar ayer pierde la racha sin saber que puede corregirlo (ventana de REQ-23).

### Objetivo
Hoy muestra una tarjeta según la ausencia: rescate de ayer o bienvenida con progreso, objetivo y semana del plan.

### Alcance
Rescate: ayer sin cumplir con racha de 2+ días hasta anteayer, "Registrar ayer" abre ese día. Bienvenida: 2+ días sin registrar, sin la tarjeta de reinicio de REQ-214; se oculta al registrar hoy o al descartarla.

### Fuera de alcance
Cambiar la tarjeta de reinicio de REQ-214 o el resumen de ciclo.

### Riesgos
Duplicar tarjetas; mostrar progreso de otro ciclo; lenguaje de culpa.

### Criterios de aceptación
Cada condición muestra su tarjeta y ninguna otra; registrar ayer desde la tarjeta recupera la racha; descartar persiste en el dispositivo.

### Verificación sugerida
E2E: ayer vacío con racha previa → rescate; 4 días fuera → bienvenida con días/entrenos; registrar hoy la oculta.

### Implementación
- `returnCardData()` decide la tarjeta: rescate (ayer ≥ inicio del plan, `!combinedDayDone(ayer)` y `streakEndingAt(anteayer) >= 2`) o bienvenida (hoy sin actividad, sin `restartNudgeDue()` y `lastActiveDayBefore(hoy)` —o el inicio del plan si nunca hubo registro— a 2+ días). Fuera del rango del plan no hay tarjeta.
- `returnCardHtml()` se pinta en `renderHoy()` después de `restartNudgeCard()`: rescate con "Registrar ayer" (`goDay(ayer)`) y "Empezar hoy"; bienvenida con frase de progreso de `cycleSummary(hoy)` (días registrados, entrenos completos y parciales, mejor racha si es 2+), `returnGoalLine()` (objetivo de `GOAL_OPTIONS` y semana del plan) y "Empezar hoy", que la descarta y lleva a la agenda. Sin registros: "Tu plan te espera".
- El descarte vive en `localStorage` (`evolv_return_card_v1:<uid>`) con la clave de la ausencia (`rescue:<ayer>` / `welcome:<último día activo>`): una ausencia nueva vuelve a mostrarla. Acciones registradas con `home_agenda_action` (`return_rescue`, `return_restart`, `return_start`), sin datos personales.
- Sin kicker sobre el título (skill de diseño); llama SVG en contorno, la misma de la píldora de REQ-283.
- Verificación: `tests/e2e/regreso.spec.js` (rescate y recuperación con la píldora, descarte persistente tras recargar, bienvenida con progreso/objetivo que se oculta al registrar, sin registros, racha viva sin tarjeta) y capturas 390/1280 px.

## REQ-285 - Recordatorios según cuánto tiempo lleva fuera (día, rescate, última llamada, regreso)

**Estado: implementado.** Migración aplicada en Supabase el 2026-10-26. Prioridad P1. Diseño: `docs/reminders-journey.md`.

### Origen
Jonathan (2026-10-26): recordatorios para usuarios del día, para quien dejó unos días y para quien dejó semanas.

### Problema
`api/notify.js` solo mira la fila de hoy: quien no abrió la app no recibe nada aunque su racha esté en riesgo; quien se fue con la semana preparada recibe el mismo correo cada día; nadie recibe progreso u objetivo; los enlaces `?date=` no se leen.

### Objetivo
Un journey con una decisión pura por usuario y día: día en juego, rescate de ayer, última llamada (push) y regreso a los 2/5/7/14/30 días, con silencio después.

### Alcance
`planReminder()` puro en `api/notify.js`; actividad desde `day_log` (60 días); racha y progreso desde `profiles.prefs.engagement`, escrito por la app; un correo diario; idempotencia por ausencia; no enviar sin registrar el intento; migración del `CHECK`; `?date=`/`r=` y `reminder_opened`; copy de Perfil.

### Fuera de alcance
WhatsApp (REQ-255), nuevas horas o preferencias por etapa.

### Riesgos
Spam por reintentos; datos sensibles en pantalla bloqueada; romper el aviso actual antes de la migración.

### Criterios de aceptación
Cada etapa sale una vez en su ventana; tras 45 días no sale nada; sin migración el aviso del día sigue; ningún mensaje lleva peso ni objetivo en push/asunto.

### Verificación sugerida
Validador Node con matriz de ausencias, zonas, idempotencia y fallo de registro; E2E de `?date=` y del snapshot.

### Implementación
- `api/notify.js`: un solo recorrido por usuario con correo o push activo (`notification_preferences?or=(email_opt_in,push_opt_in)&select=*`). Tras la hora y el día habilitado, `loadUserContext()` lee perfil (activo, `goal`, `planStartDate`, `planEndDate`, `planDurationWeeks`) y `day_log` de 60 días con solo los campos de estado necesarios.
- `planReminder(ctx)` (puro, exportado): `dayHasActivity()` (mismo criterio que `dayActive()`), `gap` desde el último día activo o el inicio del plan. Rescate si `engagement.rescueDate` es ayer o la racha llega a anteayer (2+ días). `gap` ≤ 1: aviso del día salvo racha de hoy asegurada; sin fila de hoy = "registrar tu día"; respeta `notify_nutrition/notify_training` y REQ-265; `lastCall` a `max(21, hora+2)` si ≤ 22 y racha 3+. `gap` 2-3/5-6/7-13/14-29/30-45 → `comeback_*` con `ref` = último día activo; después, nada. Plan terminado: sin aviso del día y regreso sin semanas. Nunca registró: variantes de activación.
- `reminderMessage()`: textos por etapa; push y asunto sin objetivo ni datos corporales; el correo nombra el objetivo en el cuerpo. Enlaces `/?date=…&r=<etapa>` o `/?r=<etapa>`. Correo con colores de marca.
- `deliver()`: lee la clave idempotente (y la clave hermana del aviso diario, para no duplicar el día del despliegue); si no puede leer o registrar el intento, no envía (falla cerrado). Tipos: aviso del día/rescate con `nutrition`/`training` y `push_streak` (de REQ-24/38, sin migración); `comeback`, `push_comeback`, `push_last_call` (con migración). Última llamada solo si el aviso del día ya salió en un disparo anterior. Push solo con suscripciones.
- App: `engagementSnapshot()` (racha, `streakThrough`, rescate de ayer, mejor racha, días registrados, entrenos) se guarda en `notification_preferences.engagement` (columna propia, no reescribe `profiles.prefs`) 3 s después de cada registro y al iniciar, solo si cambió; sin la columna deja de intentar. `openReminderLink()` abre `?date=` (día del plan) y registra `reminder_opened` con `step`. Perfil explica el journey. `api/analytics.js` permite `reminder_opened`.
- Integración con REQ-281/282 (#49, en `main` antes del merge): se conserva el recorte de claves VAPID y `push: {ready, issue}`; el día sin abrir o abierto sin nada registrado (`notStarted`) es el caso `missing:"day"` del aviso del día ("Aún no has empezado tu plan de hoy"), y con solo el aviso de entreno no sale sin la fila de hoy. Este trabajo se numeró primero REQ-281..283 y se renumeró a REQ-283..285.
- Migración `supabase/notifications_journey.sql` (idempotente, con rollback): columna `engagement` y `CHECK` ampliado. Aplicada en producción el 2026-10-26 a pedido de Jonathan, vía la API de gestión de Supabase; verificado después: `CHECK` con los 6 tipos, `engagement jsonb` nulo, RLS y `notif_prefs_self` intactos.
- Verificación: `scripts/validate-reminder-journey.mjs` (actividad, día en juego, rescate, última llamada, matriz de ausencias 2-59, activación, plan terminado, privacidad de 13 variantes, handler con push, falla cerrado y registro ilegible), `scripts/validate-notify-schedule.mjs` (REQ-265/266 sobre el journey) y `tests/e2e/recordatorios.spec.js` (resumen guardado en su columna, enlace del aviso).

## REQ-286 - Modo conversación: el hilo del día no se aísla entre cuentas en el mismo dispositivo

**Estado: implementado.**

`chatTurns()`/`saveChatTurns()` namespaced por `uid()` además de fecha; `clearSignedOutState()` purga `evolv_chat_turns_v1` al cerrar sesión. ✓ `tests/e2e/sync-isolation.spec.js`.

### Origen

Auditoría del journey **auth-roles** (aislamiento entre usuarios en un dispositivo compartido) sobre `62aef73`. Revisando qué estado local sobrevive a `signOutUser()`/`clearSignedOutState()` cuando una cuenta cierra sesión y otra entra en la misma pestaña, el hilo del "modo conversación" (REQ-216) persiste en `sessionStorage` sin identificar al usuario.

### Problema

En modo conversación (labs: `labs.conversational` + `uiMode:"chat"`), el hilo del día se guarda en `sessionStorage` bajo la clave fija `evolv_chat_turns_v1`, etiquetado **solo por fecha** (`{ds, turns}`), sin `user_id`. Si en el mismo dispositivo/pestaña y el mismo día el usuario A usa el modo conversación (incluido el texto libre que escribe, p. ej. datos de salud) y luego cierra sesión y entra el usuario B —también con el modo activo—, el hilo de B muestra los mensajes de A.

Reproducción (contra la app en `http://127.0.0.1:8923`, 0 llamadas pagadas): (1) A escribe `saveChatTurns([{role:"user",text:"Tengo 95 kg…"},{role:"assistant",text:"Claro…"}])`; (2) A cierra sesión con `clearSignedOutState("user-A-uuid")` (el helper real del botón y del evento `SIGNED_OUT`), **sin recargar** (SPA); (3) entra B; (4) `chatTurns()` devuelve para B los mismos turnos de A, y `renderChatMode()` los pinta como burbujas de B.

### Causa raíz

El hilo no lleva el `uid` en su clave ni en su payload, y el logout no lo purga:

- `index.html:7488` `const CHAT_TURNS_KEY="evolv_chat_turns_v1"` — clave fija sin `uid`.
- `index.html:7512-7513` `chatTurns()` solo filtra por fecha: `all.ds===todayStr()&&Array.isArray(all.turns)?all.turns:[]`; nunca compara el dueño.
- `index.html:7515` `saveChatTurns()` guarda `{ds,turns}` sin `uid`.
- `index.html:13125-13142` `clearSignedOutState()` limpia `S.days`/`S.weights`/cola de sync (REQ-156)/coach/entitlement pero **no toca** `sessionStorage["evolv_chat_turns_v1"]`.
- Lo materializa en UI `index.html:7576` `renderChatMode()` (tramo `local:true` desde `chatTurns()`).

Contrasta con el resto del journey, ya aislado por `uid`: `RETURN_CARD_KEY+":"+uid()` (`index.html:13441`), `mealOptionRerollBucket()` (`index.html:9371`), `coachChatKey()` con `session.user.id` (`index.html:6932`) y la purga de REQ-156. Evidencia funcional (`javascript_tool` sobre funciones reales): tras `clearSignedOutState("user-A-uuid")`, `sessionStorage` sigue con el hilo de A y `chatTurns()` desde B devuelve ese mismo contenido.

### Objetivo

Que el hilo del modo conversación de un usuario nunca sea visible para otra cuenta que inicie sesión en el mismo dispositivo/pestaña, coherente con "privacidad por defecto" y con el aislamiento del resto de claves locales y la cola de sync.

### Alcance

1. Namespacing por usuario: incluir `uid()` en la clave o el payload de `evolv_chat_turns_v1`; `chatTurns()` solo devuelve turnos cuando el `uid` coincide con el usuario actual (además del filtro por fecha).
2. Purga en logout: `clearSignedOutState()` elimina el hilo local del modo conversación del usuario saliente.

### Fuera de alcance

- La funcionalidad del modo conversación (REQ-216) y el `coachChatMemory` del coach normal (ya namespaced por `uid`+ciclo).
- La cola de sync (REQ-156) y las claves ya aisladas; persistir el hilo entre recargas (es efímero por diseño).

### Riesgos

- No romper `tests/e2e/conversacion.spec.js` (flujo de un solo usuario).
- Lectura tolerante al formato viejo del payload si se cambia su forma.

### Criterios de aceptación

- Tras A escribe → A cierra sesión (`clearSignedOutState`/`SIGNED_OUT`, sin reload) → B entra en la misma pestaña, `chatTurns()` y el hilo de `renderChatMode()` para B **no** contienen los turnos de A.
- Un solo usuario conserva su hilo del día en la misma sesión de pestaña (sin regresión de REQ-216).
- `node scripts/release-gate.mjs` pasa.

### Verificación sugerida

- Caso nuevo en `tests/e2e/conversacion.spec.js` o `sync-isolation.spec.js`: sembrar hilo con A, disparar `SIGNED_OUT`, re-seedear como B con `labs.conversational`+`uiMode:"chat"`, afirmar que el modo conversación de B no muestra las burbujas de A.

## REQ-287 - Entreno: el plan en una línea y las señales para detenerse junto al inicio

**Estado: implementado.**

### Origen
Jonathan (2026-10-27), con captura de Entreno ("Martes 27 oct · Semana 2", día "Descanso total · cambiado"), marcando el aviso "Señales para detenerte" y la tarjeta "Plan combinado · 6 días/semana · 10 semanas · Exterior / Correr + Gimnasio / Preparar mi plan / Configurar": "esta parte no tiene tanto sentido".

### Problema
Antes de la sesión, `renderWorkout()` pintaba siempre, encima del entrenamiento de hoy:
- el aviso violeta de señales para detenerse, también en descanso, donde no aplica, y fijo todos los días (se deja de leer);
- una tarjeta con datos del plan completo ("Plan combinado" repite "Correr + Gimnasio"; "10 semanas" separado de la "Semana 2" de la cabecera; "Exterior", que es el lugar de hoy, en la tarjeta del plan) y dos botones: "Preparar mi plan" (el usuario ya tiene plan; en realidad genera una versión personalizada) y "Configurar" (no dice qué y saca a Perfil sin abrir nada).

### Objetivo
Que lo primero bajo la fecha sea la sesión de hoy; el plan queda como contexto con una sola entrada clara, y las señales de seguridad aparecen cuando sirven.

### Alcance
1. Línea del plan (`.wk-planline`): título (`trainingPlanTitle()`: deporte + fuerza, sin "Ninguna actividad" ni "Sin fuerza") y `trainingPlanMeta()` ("Semana N de M · D días/semana", "Arranque" o "M semanas" fuera del calendario). Abre `openTrainingPlanSheet()`: resumen (personalizado desde X o plan base), "Personalizar mi plan"/"Preparar otra versión" con una frase de qué hace, "Cambiar días, deporte o lugar" (`openTrainingSettings()`: Perfil con `#pfSecEntreno` abierto) y las señales completas. Con la pausa por seguridad el botón de personalizar queda deshabilitado y no se muestran las señales.
2. `dayHeaderNav(ds,{hideWeek:true})` en Entreno: la semana va en la línea del plan (Nutrición no cambia).
3. Sugerencia única (`personalizeHintHtml()`) si no hay versión personalizada: "Personalizar" o ✕ la ocultan (`evolv_wk_personalize_hint:<uid>` en `localStorage`); no sale con la sesión en curso ni con la pausa por seguridad.
4. Señales: línea corta bajo "Iniciar sesión guiada" (`WORKOUT_STOP_SIGNS_SHORT`) y texto completo en la cuenta atrás de REQ-235. Sin señales en descanso ni actividad libre. La pausa por seguridad (`trainingSafetyHold()`) sigue arriba siempre.
5. "Lugar: …" en la tarjeta del entrenamiento solo con sesión (no en descanso ni actividad libre).
6. Con la sesión en curso (REQ-239) el desplegable contiene la línea del plan y la tarjeta del entrenamiento.
7. `CACHE_NAME` → `fitbud-pwa-v157`.

### Fuera de alcance
- El generador del plan (`openTrainingPlanGenerator()`) y la sección Entrenamiento de Perfil.
- "Actividad registrada" y "Resumen".

### Riesgos
- Solo cambian orden y visibilidad; no toca datos. La sugerencia se guarda por usuario y dispositivo; sin almacenamiento vuelve a mostrarse.

### Criterios de aceptación
- Antes de la sesión no hay aviso violeta, "Preparar mi plan" ni "Configurar"; la línea dice "Semana 2 de 10" y la cabecera no repite la semana; hay "Lugar: Gimnasio" y la línea de señales bajo "Iniciar sesión guiada". ✓
- La sugerencia se oculta con ✕ y no vuelve al recargar. ✓
- La cuenta atrás muestra las señales completas. ✓
- La hoja tiene "Personalizar mi plan", las señales y "Cambiar días, deporte o lugar", que abre Perfil con Entrenamiento desplegado. ✓
- En descanso no hay señales ni lugar. ✓
- Con la sesión en curso, la línea del plan va en el desplegable cerrado (REQ-239). ✓
- `node scripts/release-gate.mjs` pasa.

### Verificación
`tests/e2e/entreno.spec.js` ("Plan compacto" ×2, "Sesión en curso" actualizado), `tests/e2e/alta-y-espera.spec.js` (el generador se abre desde la hoja); capturas a 375px de día de entreno, hoja y descanso revisadas; detector de impeccable sin hallazgos.

## REQ-288 - Push: par VAPID nuevo (la privada de REQ-267 no estaba en ningún lado)

**Estado: implementado.** Jonathan cargó las variables en Vercel; tras desplegar `ec3ccc8`, "Recordatorios cada hora" respondió `push: {"ready": true}` (2026-10-27 19:10 UTC).

### Origen

Jonathan (2026-10-27), al revisar qué faltaba tras REQ-283..285: el job `notify-hourly.yml` respondía `push: {"ready": false, "issue": "falta VAPID_PRIVATE_KEY"}` (diagnóstico de REQ-281). La privada generada en REQ-267 se entregó fuera del repo y no se encontró.

### Hecho

- Par VAPID nuevo (`web-push.generateVAPIDKeys()`): la pública `BCLTdYHp…` reemplaza a `BHWBAWEp…` en `index.html` y en el respaldo de `api/notify.js`. La privada se entregó a Jonathan en un archivo fuera del repo; se verificó que corresponde a la pública.
- `scripts/validate-vapid-key.mjs` rechaza también la clave anterior (`BHWBAWEp…`), además de la de REQ-38.
- `refreshPushSubscriptionKey()` (REQ-267) renueva sola, al entrar, la suscripción de quien tenía avisos activos con otra clave.
- `CACHE_NAME` → `fitbud-pwa-v158`.

### Operación pendiente

1. Vercel → `fitbud` → Environment Variables (Production): `VAPID_PRIVATE_KEY` (la nueva) y `VAPID_SUBJECT` (`mailto:` del responsable). Si existe `VAPID_PUBLIC_KEY`, actualizarla a la nueva o borrarla.
2. Volver a desplegar y correr "Recordatorios cada hora" a mano: `push.ready` debe ser `true`.
3. Quien tenga avisos del dispositivo activos debe abrir la app una vez para quedar suscrito con la clave nueva.

## REQ-289 - Onboarding: instalar la app y activar avisos; Hoy lo recuerda cada día

**Estado: implementado.**

### Origen

Jonathan (2026-10-27): "como parte del onboarding debemos pedirle a la gente que se instale el app en el home y además que active las notificaciones; a las personas que no han activado las notificaciones hay que recordarles que lo hagan siempre". Antes, activar avisos solo era posible en Perfil → Avisos del dispositivo y la sugerencia de instalar era un banner flotante que salía una sola vez.

### Hecho

- `devicePushState()`: `on` (permiso concedido y `push_opt_in`), `off`, `denied`, `needs_install` (iPhone fuera de la app instalada: ahí no existe el push) o `unsupported`. `remindersCovered()`: `on`, o correo activo donde el push no es posible (bloqueado o sin soporte).
- Al cerrar el onboarding (primer ciclo o ciclo nuevo) y con la semana lista sin errores, `saveOnboarding()` carga las preferencias y, si falta instalar (móvil) o los avisos, abre `renderNotifySetup()` antes de Hoy (`notifySetupActive`, compuerta en `render()`): "Tu semana está lista. Que no se te pase." con dos pasos: instalar (iPhone: Compartir → Añadir a pantalla de inicio e iniciar sesión desde el ícono; Android: botón "Instalar Evolv" si el navegador lo ofrece, si no el menú) y activar avisos (`enableDevicePush()`: permiso → `subscribePush()` con tope de 15 s → `push_opt_in`; bloqueado: cómo permitirlos y "Recibir por correo"; sin soporte: correo, `enableEmailReminders()`). "Ahora no, ir a mi plan" o "Ir a mi plan" lleva a Hoy (y a la guía).
- Hoy (`notifyNudgeHtml()`, después de la agenda): mientras no esté cubierto, cada día, con la acción de su estado y "Ahora no" (`evolv_notify_nudge_v1:<uid>` = hoy en este dispositivo: vuelve mañana). Sin parpadeo: no se muestra hasta cargar las preferencias (`loadNotifPrefs()` en `onAuth`).
- El banner flotante de instalar ya no sale en iPhone (lo cubren la pantalla y la tarjeta), ni sobre la pantalla de avisos, ni en Hoy mientras la tarjeta está visible.
- Al cerrar sesión se limpian `notifPrefsCache` y `notifySetupActive` (antes las preferencias de una cuenta quedaban en memoria para la siguiente).
- Analytics `notifications_prompt` con `source` (onboarding/home) y `action` (shown, enable, enabled, denied, dismissed, email, install, dismiss, skip, done); sin datos personales.
- E2E: `autoDismissNudges()` salta la pantalla como lo haría un usuario. `CACHE_NAME` → `fitbud-pwa-v159`.
- Verificación: `tests/e2e/avisos.spec.js` (tarjeta y "Ahora no" hasta mañana, activar con permiso concedido, bloqueado → correo, avisos activos sin tarjeta, iPhone sin banner duplicado, pantalla real tras guardar el plan); capturas 390 px Android/iPhone.

## REQ-291 - Entreno: un día en otro lugar sin tocar el perfil

**Estado: implementado.**

### Origen

Jonathan (2026-10-28): "Mañana voy a entrenar con mi sesión, pero en casa, y mi perfil está configurado para el gimnasio. Normalmente me debería dar mi rutina de gimnasio, pero si un día quiero hacer otra cosa me debería dejar."

### Problema

Con perfil de gimnasio, Entreno → "Adaptar hoy" → "En casa" (y "Sin equipo") solo ofrecía **"Descanso total"**: no había ninguna forma de hacer la sesión del día en casa sin cambiar el perfil entero. La portada promete "Mismos grupos musculares, sin pisar el gimnasio".

### Causa raíz

`openWorkoutContingency()` filtraba `workoutOptions(ds)` por ejercicios sin equipo, pero esas opciones salen de `strengthSessions(training.strength)` con el modo del perfil: un usuario de gimnasio solo tiene sesiones de gimnasio, ninguna pasa el filtro y queda solo el descanso. El lugar vivía solo en el perfil (`strengthPlace`/`trainingLocations`), sin forma de cambiarlo para un día.

### Alcance

1. `day_log.state.trainingPlace` (`gym/home/outdoor`), solo cuando difiere del lugar del plan para ese día. `trainingPrefsForDate(ds)` aplica su modo de fuerza (`strengthModeFromChoice`) y equipo por defecto; lo usan `effectiveWorkout`, `workoutOptions`, `generatedWorkoutForDate`, la plantilla de respaldo de `workoutPrescription` y el filtro de lugar de alternativas. Las sesiones siguen en los mismos días (`trainingLocations` no cambia): Pierna A en el gimnasio pasa a "Peso corporal · Pierna A"; en un plan del coach, cada ejercicio se cambia por uno del mismo músculo principal.
2. Entreno: "Adaptar hoy/mañana/este día" con un botón "En casa" (o "En el gimnasio" si el plan es fuera del gimnasio) en días de fuerza, que abre "¿Dónde entrenas …?" con Gimnasio / Casa / Aire libre. "Lugar: Casa · solo este día" y "Volver al gimnasio". "Sin equipo" se retira: casa y aire libre ya son sin máquinas. Las razones `casa`/`equipo` de la acción `adaptar_entreno` del coach abren la misma hoja.
3. Registro de adaptación `place_change` ("lugar cambiado"). `validateDayLogState` acepta solo `gym/home/outdoor`. `CACHE_NAME` → `fitbud-pwa-v162`.

### Fuera de alcance

- Elegir recursos de casa para ese día (mancuernas, bandas): fuera del gimnasio se usa peso corporal, igual que hoy en perfiles de casa/aire libre.
- Filtrar las plantillas de aire libre por ejercicios de suelo (pre-existente en perfiles de aire libre).

### Riesgos

- Historial inmutable: solo se puede cambiar con la sesión sin iniciar ni registrar; la sesión iniciada conserva su prescripción.

### Criterios de aceptación

- Perfil de gimnasio: mañana → "En casa" → Casa muestra "Peso corporal · <misma sesión>", todos los ejercicios se pueden hacer en casa, pasado mañana y el perfil siguen en gimnasio, el día se sincroniza con `trainingPlace:"home"` y "Volver al gimnasio" lo deshace. ✓ (`tests/e2e/lugar-del-dia.spec.js`, capturas 390 px revisadas)
- Hoy en casa: la sesión guiada prescribe esos ejercicios y el cambio sobrevive a recargar; `adaptar_entreno` con `equipo` abre la hoja. ✓ (`tests/e2e/lugar-del-dia.spec.js`)
- `node scripts/release-gate.mjs` pasa.

### Seguimiento (2026-10-28)

Jonathan, captura de un día de carrera ("Correr · fondo fácil"): el botón de lugar solo sale en sesiones de fuerza. Si eliges una de gimnasio con "Cambiar entrenamiento" en un día de deporte, el lugar se toma del perfil (`plannedStrengthPlace()`) y no del exterior del día: dice "Lugar: Gimnasio" y ofrece "En casa". "Cambiar entrenamiento" agrupa la fuerza por tipo de sesión, así que con perfil o día en casa ya lista las sesiones de peso corporal (antes el grupo "Casa o aire libre" quedaba vacío). `CACHE_NAME` → `fitbud-pwa-v163`. ✓ `tests/e2e/lugar-del-dia.spec.js`.

Segunda captura de Jonathan (2026-10-28): el camino "Cambiar entrenamiento → sesión de gimnasio → En casa" no se descubre. "En casa" sale también en días de deporte: abre "¿Dónde entrenas hoy?" con Casa / Gimnasio / mantener la sesión del plan, y Casa o Gimnasio ponen la próxima sesión de fuerza del plan (`strengthSessionForSportDay()`) adaptada al lugar. "Volver al plan" recupera el deporte y quita el lugar del día. `CACHE_NAME` → `fitbud-pwa-v164`. ✓ `tests/e2e/lugar-del-dia.spec.js`.

## REQ-292 - Nutrición: la tarjeta "Prepara tus comidas de hoy" se puede colapsar

**Estado: implementado.**

### Origen

Jonathan (2026-10-28), con captura de Nutrición: "Esta parte de preparar mi día debe poder esconderse o colapsarse".

### Problema

Con el día sin preparar, la tarjeta de arranque de Nutrición (REQ-100) ocupa casi media pantalla en móvil y empuja macros y comidas hacia abajo. No había forma de ocultarla aunque el usuario prefiera llenar cada comida con "Otra opción".

### Alcance

1. Botón chevron (44px, `aria-expanded`, "Ocultar tarjeta") en la cabecera de la tarjeta; colapsada queda una línea "Comidas sin preparar" con el mismo CTA "Preparar mi día" en pequeño. Tocar la línea la expande.
2. El estado se guarda en `UI.collapsed["nut.setup"]` (mismo mecanismo que las secciones de `section()`), por dispositivo; sigue aplicando a cualquier día sin preparar. Con el día preparado la tarjeta no aparece, como antes.
3. `CACHE_NAME` → `fitbud-pwa-v165`.

### Fuera de alcance

- La tarjeta "Aún falta preparar este día" de Hoy (es la agenda principal y su único CTA).

### Criterios de aceptación

- Colapsar oculta título y explicación y deja visible "Preparar mi día".
- El estado colapsado sobrevive a una recarga y se puede volver a expandir.
- En 340px la cabecera no se apila (el chevron queda a la derecha del título).

### Verificación

`tests/e2e/nutricion-colapsar.spec.js`; `tests/e2e/nutricion.spec.js` sin cambios en verde.

## REQ-293 - Entreno en casa: nada que pida material no declarado y siempre hay con qué sustituir

**Estado: implementado.**

### Origen

Jonathan (2026-10-28), con capturas de un día en casa: "me salió este ejercicio que tenía un dibujito con palitos… y luego cuando trataba de sustituir el ejercicio no había con qué sustituirlo".

### Problema

- En casa salió **Remo con banda** aunque el día en casa no declara bandas (`defaultEquipmentForStrengthChoice("home")` = solo peso corporal). La ficha mostraba la clave interna `resistance_band`.
- "Sustituir ejercicio" respondía "No hay otro ejercicio para espalda media…": las dos únicas fichas de espalda media eran el remo con banda y el remo en polea (solo gimnasio).

### Causa raíz

- `compatibleStrengthExerciseSelection()` filtraba por disciplina, nivel, limitaciones y modo suave, pero no por el material ni el lugar: solo la generación con el coach (`allowedExercisesForSession`) miraba `prefs.equipment`. Las plantillas de peso corporal llevaban `band-row` en Full body, Superior y Pull.
- El catálogo no tenía un remo de espalda sin material.
- `openExerciseGuide()`/`exerciseCard()` pintaban `equipment.join(", ")` sin traducir.

### Alcance

1. Ficha nueva `inverted-row` "Remo invertido" (bajo una mesa firme o barra baja; principiante, espalda media), con las dos fotos reales de Free Exercise DB (`Inverted_Row`, dominio público) copiadas en `assets/exercise-media/inverted-row-{0,1}.jpg`. Sustituye a `band-row` en las plantillas de peso corporal; la progresión del remo con banda pasa a ser este ejercicio.
2. En modo peso corporal (perfil de casa/aire libre o día en otro lugar, REQ-291) la selección solo usa ejercicios de ese lugar con el material declarado (`exerciseFitsHomeSetup`). Gimnasio sin cambios.
3. "Sustituir ejercicio" sigue ofreciendo lo que pide material no declarado, al final y con "Necesita: banda elástica" (`exerciseMissingEquipment`).
4. El material se muestra en español (`EXERCISE_EQUIPMENT_LABELS`).
5. `exerciseCatalog()` añade las fichas empaquetadas que aún no están en la tabla `exercises`, así el remo invertido funciona sin aplicar SQL. Las filas de la tabla siguen mandando.
6. SQL: fila nueva en `supabase/exercises.sql` y nivel en `supabase/exercise-levels.sql` (aplicación manual opcional, no se ejecutó en producción). `docs/exercise-levels.md` justifica el nivel. `CACHE_NAME` → `fitbud-pwa-v166`.

### Fuera de alcance

- Fotos reales para el resto de ejercicios de casa que siguen con dibujo propio (REQ-264): la librería libre no tiene su variante exacta.

### Criterios de aceptación

- Día en casa sin bandas: ninguna sesión de peso corporal pide material no declarado ni ejercicios de otro lugar; Full body A, Superior A y Pull A incluyen el remo invertido.
- Sustituir el remo invertido ofrece el remo con banda con "Necesita: banda elástica" y sin el aviso de "no hay otro ejercicio".
- La ficha del remo invertido muestra la foto y "mesa firme o barra baja", sin claves con guion bajo.

### Verificación

`tests/e2e/entreno-casa.spec.js`; `tests/e2e/entreno.spec.js` (en gimnasio, el remo en polea ahora ofrece también el remo invertido) y `lugar-del-dia.spec.js` en verde; `scripts/validate-exercises.mjs`.

## REQ-294 - Entreno: la zancada muestra su foto real en vez del dibujo

**Estado: implementado.**

### Origen

Jonathan (2026-10-28), mismo día en casa que REQ-293: el dibujo de palitos "jamás debería pasar".

### Problema y causa raíz

REQ-264 cambió 10 demos de casa por SVG propios porque las fotos anteriores mostraban otra variante. Para `walking-lunge` sí existe la variante exacta en Free Exercise DB (`Bodyweight_Walking_Lunge`: zancada caminando sin carga, manos en la cadera), pero el mapa la marcó `id:null`.

### Alcance

- `walking-lunge` usa las dos fotos (`assets/exercise-media/walking-lunge-{0,1}.jpg`, dominio público) por `PHOTO_DEMOS`; la revisión de contenido también corrige filas remotas con el SVG antiguo. Se retira `walking-lunge.svg`.
- `scripts/free-exercise-db-map.mjs` apunta a `Bodyweight_Walking_Lunge`; `supabase/exercise-media.sql` actualiza la fila (manual, no aplicado). `CACHE_NAME` → `fitbud-pwa-v167`.

### Fuera de alcance

Siguen con dibujo `band-row`, `bulgarian-split-squat`, `pike-push-up`, `single-leg-rdl`, `standing-calf-raise`, `shoulder-tap-plank`, `step-up`, `slider-leg-curl` y `archer-push-up`: la librería libre no tiene su variante exacta. Necesitan fotos o vídeos propios o una librería con licencia (decisión de Jonathan).

### Verificación

`tests/e2e/entreno-casa.spec.js` (la ficha de la zancada muestra la foto y ningún SVG); `scripts/validate-exercises.mjs`.

## REQ-295 - Recordatorios: volver a entrenar

**Estado: implementado.**

### Origen

Jonathan (2026-10-28): "¿y los avisos proactivos, si aún no has usado la app nunca o si hace días no entrenas?". El journey (REQ-285) solo mira la ausencia total (`gap`): quien sigue registrando comidas pero dejó de entrenar no recibía nada sobre el entreno. En producción, 4 de 14 usuarios activos llevaban 4+ días sin entrenar.

### Alcance

1. `trainingLapse(rows, today, planStart)` (`api/notify.js`): días desde el último entreno (o desde el inicio del plan si nunca entrenó). Avisa si hoy toca entrenar (fila de hoy sin descanso ni entreno), si la pausa entra en una ventana (4–10: `training_lapse_4`; 11–30: `training_lapse_11`) y si en la pausa hubo al menos 2 días que tocaba entrenar (`restDay`/`workoutOverride` de REQ-265). Sin la fila de hoy no se sabe si toca: no avisa.
2. En `planReminder()` va con `gap` ≤ 1, después del rescate y **en lugar** del aviso del día (un correo por día), aunque la racha de hoy esté a salvo. Respeta `notify_training`.
3. Texto sin culpa ni datos corporales: "¿Retomamos el entreno?" / "Tu entreno te espera", con la versión de 20 minutos como salida.
4. Reutiliza los tipos `comeback`/`push_comeback` (sin migración), con clave `<usuario>:training_lapse_N:<último entreno>`: una vez por pausa y ventana.
5. `docs/reminders-journey.md`: nueva etapa en la tabla.

### Criterios de aceptación

- 5 días sin entrenar → `training_lapse_4`; 12 → `training_lapse_11`; 3 → aviso del día. Pausa de descansos, hoy descanso, sin fila de hoy o con el aviso de entreno apagado → no sale. ✓ `scripts/validate-reminder-journey.mjs` (falla con el código anterior).
- El handler envía un correo y un push con tipo `comeback`/`push_comeback` y la clave por pausa. ✓ mismo script.

## REQ-296 - Recordatorios: seguimiento por correo para quien nunca eligió sus avisos

**Estado: implementado.**

### Origen

Jonathan (2026-10-28), sobre los avisos proactivos para quien nunca usó la app o dejó de entrenar. En producción, 12 de 14 usuarios activos no tenían fila en `notification_preferences`: el journey (REQ-285) solo corre para `email_opt_in` o `push_opt_in`, así que no recibían nada. 5 nunca registraron un día y ninguno de ellos tenía `planStartDate` (no terminaron el perfil), con lo que el journey tampoco tenía referencia para escribirles. Decisión del usuario: aplicar la opción recomendada, a todos con baja fácil.

### Alcance

1. `runFollowups()` (`api/notify.js`), al final del job: perfiles activos con correo y **sin fila** de preferencias reciben, solo por correo, las etapas de regreso (`comeback_*`) y volver a entrenar (REQ-295) a las 20:00 de su zona (`prefs.timeZone`; por defecto `America/Lima`). Nunca el aviso del día, el rescate ni la última llamada (`planReminder({followupOnly: true})`), ni push.
2. Sin plan ni registros: la referencia es `profiles.created_at` (`accountCreated`) y solo salen `comeback_2`, `comeback_7` y `comeback_30`, con textos propios ("Tu plan está a dos minutos", CTA "Terminar mi perfil").
3. Baja: el correo de seguimiento lleva `?unsubscribe=u-<id>-<HMAC con CRON_SECRET>` y su pie explica por qué llega. La baja crea la fila con `email_opt_in=false` (upsert). Un token alterado no da de baja a nadie. Sin `CRON_SECRET` no se envía seguimiento.
4. Perfil → Recordatorios avisa que, mientras no se guarde la sección, llegan esos correos, y que guardarla con el correo desactivado los apaga.
5. Tipo `comeback` (sin migración), clave `<usuario>:<etapa>:<referencia>`: una vez por etapa. `CACHE_NAME` → `fitbud-pwa-v168`.

### Fuera de alcance

- Guardar la zona horaria en el perfil (hoy se asume `America/Lima` para quien no tiene preferencias).
- Paginar la lista de perfiles (hoy son pocos).

### Criterios de aceptación

- Sin plan: correo a los 2, 7 y 30 días del alta, nada a los 1 o 5. Sin preferencias: sin aviso del día ni rescate, con regreso y volver a entrenar. ✓ `scripts/validate-reminder-journey.mjs` (falla con el código anterior).
- Handler: un correo sin push, con la baja firmada; no repite la etapa; quien tiene fila no recibe seguimiento. La baja firmada crea la fila con el correo apagado y un token alterado no hace nada. ✓ mismo script.

## REQ-297 - Recordatorios: invitar a activar el push a la semana

**Estado: implementado.**

### Origen

Jonathan (2026-10-28): "se debe incluir en el journey un aviso para que activen las push en el onboarding y luego al día 7 si es que no activaron nunca". El onboarding ya lo pide (REQ-289: pantalla "Tu semana está lista" y tarjeta en Hoy). Faltaba el recordatorio fuera de la app a la semana.

### Alcance

1. `pushInvite(today, planStart)` (`api/notify.js`): ventana de 7 a 13 días desde el inicio del plan (onboarding terminado). Sin plan no aplica (para eso están los correos de REQ-296).
2. Se evalúa solo cuando el journey no tiene otro mensaje ese día (un correo por día), para quien tiene el correo activado sin `push_opt_in` (`runJob`) y para quien nunca eligió (`runFollowups`, con su baja firmada). No se envía si hay alguna fila en `push_subscriptions`, ni si no se pudo consultar.
3. Correo "Activa los avisos en tu teléfono", con los pasos de iPhone (Safari → Añadir a pantalla de inicio) y Android, y CTA a `/?r=push_invite_7` (Hoy muestra la tarjeta de avisos de REQ-289).
4. Tipo `comeback` (sin migración), clave `<usuario>:push_invite_7:<inicio del plan>`: una vez por plan. `docs/reminders-journey.md`: nueva fila.

### Criterios de aceptación

- Ventana de 7 a 13 días; sin plan, no. Con suscripción, con `push_opt_in`, con el correo apagado o ya enviada: no. Si hoy toca otro correo, espera. También llega a quien nunca eligió. ✓ `scripts/validate-reminder-journey.mjs` (falla con el código anterior).

## REQ-298 - Recordatorios: elegir la hora del aviso y resumen de la mañana

**Estado: implementado.** Migración `supabase/notifications_morning.sql` aplicada en producción el 2026-10-28.

### Origen

Jonathan (2026-10-28) pidió implementar el selector de hora (06:00 a 23:00) y el aviso por la mañana con el plan del día. Antes, Perfil → Recordatorios solo ofrecía de 17:00 a 23:00, y el selector estaba oculto tras el correo: quien solo usaba push quedaba a las 20:00.

### Alcance

1. Perfil → Recordatorios: hora del aviso del día de 06:00 a 23:00, días y tipos siempre visibles (valen para correo y push). Casilla "Resumen de la mañana con tu plan del día", con su hora de 05:00 a 11:00 (07:00 por defecto). Sin la migración, guarda el resto y lo dice.
2. La app agrega a `notification_preferences.engagement` el plan de hoy y de los 7 días siguientes (`engagementPlanDays()`): nombre de la sesión o descanso, cuántas comidas y el plato con que empieza el día. Es el plan, no datos de salud.
3. `morningPlan()` (`api/notify.js`, puro): a la hora elegida o hasta dos horas después, siempre antes del aviso del día. Solo con el plan en curso, el plan del día del ciclo actual y como mucho 2 días sin registrar (después manda el journey de regreso). No sale si el día ya está cumplido. Respeta los días activos y los tipos de recordatorio.
4. Uno por día y un solo canal: push si hay suscripción; si no, correo. "Tu plan de hoy · Entreno: Torso A · 4 comidas, empiezas con Avena. Hoy sumas el día 6 de tu racha." Abre `/?date=<hoy>&r=morning`.
5. Tipos `morning` y `push_morning`, y columnas `morning_opt_in` y `morning_hour` (`supabase/notifications_morning.sql`, idempotente). Sin la migración no se envía (falla cerrado).
6. El correo escapa todo su texto, porque los nombres los escribe la app.

### Criterios de aceptación

- Ventana horaria, ciclo, plan terminado o sin empezar, ausencia de 3 días, día cumplido, preferencias de tipo, push antes que correo, uno por día y falla cerrado sin migración. ✓ `scripts/validate-reminder-journey.mjs` (falla con el código anterior).
- Perfil guarda `notify_hour`, `morning_opt_in` y `morning_hour`, y la app guarda el plan de 8 días. ✓ `tests/e2e/recordatorios.spec.js`.

## REQ-301 - Estimar macros: productos de marca sin inventar

**Estado: implementado.**

### Origen

Jonathan (2026-10-29), con captura: "La estimación está mal". Al reestimar un registro "Shake proteina gloria pro", la nota dijo "Glory Pro es una proteína en polvo común en Perú", con un vaso preparado con agua (220 kcal · P 25 · C 8 · G 5). Gloria Pro es una bebida láctea lista para tomar, en botella de unos 320 ml. Además, la línea "Origen" seguía mostrando "favorita … · porción ×2" después de aplicar la estimación.

### Causa raíz

- `aiEstimate()` (`index.html`) pedía "Estima kcal y macros de esta comida" sin ninguna regla para productos envasados. El modelo por defecto (`claude-haiku-4-5-20251001`, `api/claude.js`) eligió un formato y afirmó datos de una marca que no conocía.
- `photoEstimateRound()` solo hablaba de platos: una foto de la etiqueta no tenía instrucciones.
- `applyEstimatedMacros()` cambiaba `_editor.meta` sin volver a pintar `#f_origin`.

### Alcance

1. Pedido de texto:
   - el usuario vive en Perú (marcas y porciones locales);
   - con un producto envasado o de marca, decide primero el formato. "Shake", "batido" o "bebida" con marca, sin "scoop" ni "polvo", se toma como listo para tomar;
   - usa la etiqueta solo si conoce el producto exacto. Si no, estima un producto típico de esa categoría y formato, lo dice en la nota y orienta a la foto de la etiqueta;
   - nunca afirma datos de una marca que no conoce ni cambia el nombre que escribió el usuario;
   - respeta la cantidad descrita.
2. Pedido de foto: si muestra una etiqueta o tabla nutricional, usa sus valores tal cual (por porción, o por envase si se consume entero).
3. Al reestimar un registro existente, `#f_origin` pasa a "Estimado por tu coach … — <nota>".

### Fuera de alcance

Una base de productos de marca o la búsqueda del código de barras en una base externa (hoy solo busca en el catálogo propio, REQ-276). Cambiar el modelo de `meal_estimate`, que se configura con `ANTHROPIC_MODEL_MEAL_ESTIMATE` en Vercel.

### Criterios de aceptación

- Los pedidos de texto y foto llevan las reglas. ✓ `scripts/validate-meal-estimate-output.mjs`.
- Reestimar un registro de una favorita ×2 actualiza el origen. ✓ `tests/e2e/origen-registro.spec.js` (falla con el código anterior).

## REQ-302 - Rachas con amigos: explicar cómo se suma a un amigo

**Estado: implementado.**

### Origen

Jonathan (2026-10-29), con una captura de Progreso → Rachas con amigos: "¿Cómo se supone que vea mi alias y sepa el de mis amigos? Debería ser por mail o usuario". Antes de activar, la pantalla solo mostraba un campo vacío "Tu alias para amigos" y el botón "Activar comparación". No explicaba que a un amigo se le suma con un enlace privado (REQ-300).

### Decisión

Se mantiene el enlace privado de un uso (7 días). Jonathan descartó invitar por correo y el nombre de usuario con buscador: un buscador permite ver quién usa Evolv y obliga a moderar nombres.

### Alcance

1. Antes de activar (`js/streak-friends.js`), tres pasos:
   - elige tu alias, que es el nombre con el que te ven;
   - crea una invitación y envía el enlace por WhatsApp o donde quieras;
   - tu amigo la acepta y los dos aparecen en la lista con su alias.

   Debajo, "Nadie puede buscarte: solo entra quien recibe tu enlace". Con una invitación recibida no se muestran los pasos.
2. El alias se propone con el primer nombre del perfil (`prefs.name`) y se puede editar. No se comparte hasta que la persona activa la comparación y acepta una amistad.
3. Activada, se muestra "Tus amigos te ven como <alias>".
4. Seguimiento del mismo día: Jonathan señaló que sin alias no veía el botón para invitar. Si no hay una invitación recibida, el botón del formulario dice "Crear invitación": activa la comparación con el alias y deja el enlace listo para compartir en un solo paso. Con una invitación recibida sigue diciendo "Activar comparación", porque hay que activar antes de aceptar. Con un enlace a la vista, la acción principal es "Compartir invitación" y el otro botón pasa a "Crear otro enlace", que cancela el anterior.

### Criterios de aceptación

- Antes de activar se ven los pasos, el aviso de privacidad y el alias propuesto. "Crear invitación" activa y muestra el enlace; al activar desaparecen los pasos y se muestra el alias propio. Con una invitación recibida, "Activar comparación" deja aceptar. ✓ `tests/e2e/rachas-amigos.spec.js`.
