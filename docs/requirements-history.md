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
