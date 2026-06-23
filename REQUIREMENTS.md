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
| Nutricion | Recetas, macros, checks, reemplazos, generacion IA diaria/semanal con borrador+lista de compras y regeneracion por comida | Falta contingencia nutricional y reemplazos equivalentes (REQ-19) |
| Entrenamiento | Planes personalizados de 4/10 semanas, biblioteca guiada y reproductor recuperable con series, intervalos, temporizadores y sustituciones | Falta el modo contingencia y la adaptación semanal (REQ-19/REQ-20) |
| Adaptacion | Revision manual cada 4 semanas y nuevo ciclo | Falta check-in semanal y ajustes graduales segun adherencia, hambre, energia, recuperacion y rendimiento |
| Progreso | Peso, grasa, entrenos, adherencia, racha, recap y fotos | Falta comparar tendencias, hitos y explicar que cambio en el plan |
| Motivacion | Racha simple visible | Falta definir rachas justas, descansos, metas semanales, hitos y recuperacion de constancia |
| Recordatorios | No existe | Falta el canal por correo (REQ-24) y el canal push de recordatorios de racha con permiso del dispositivo (REQ-38); ambos exigen programacion por zona horaria, consentimiento, deduplicacion y envio solo si hay acciones pendientes |
| Adquisicion | No existe superficie publica; la primera pantalla es el login | Falta landing/funnel que explique la oferta antes del registro y conecte con el paywall (REQ-33) |
| Suscripcion | Checkout Stripe (REQ-26): sesión alojada, webhooks firmados, entitlement activado por webhook. | Falta conciliación y panel de historial de pagos (REQ-27) |
| Seguridad y privacidad | Auth, RLS y fotos de progreso personal protegidas | Faltan consentimiento de salud/fotos/correos, exportacion, borrado, retencion y guardrails de entrenamiento |
| Operacion | Admin de usuarios, alimentos y ejercicios con fuente/licencia | Faltan prompts/versiones, soporte, metricas de IA y costos |
| Lenguaje (Principio 9) | Implementado: la UI operativa habla de coach, plan y opciones; los detalles técnicos quedan en administración | Mantener el barrido como gate de nuevas superficies |
| Consumo de generacion | Cuota diaria server-side, reserva idempotente y pool privado implementados | Integrar entitlement de REQ-25 y costo por accion de REQ-27 |
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

La implementacion adopta produccion propia Fitbros: 40 ejercicios cubren todas las rutinas actuales de gimnasio, peso corporal, running, cycling y natacion. Cada sesion usa IDs estables del catalogo; Entreno muestra instrucciones, respiracion, errores, senales de seguridad, regresion/progresion y una demostracion SVG animada que puede pausarse y queda estatica con movimiento reducido. `supabase/exercises.sql` crea la fuente compartida con RLS y CRUD admin; `exercise-catalog.js` mantiene un respaldo local generado desde el mismo contenido hasta aplicar la migracion.

### Objetivo

Crear una fuente de verdad de ejercicios que permita explicar cada movimiento a una persona sin experiencia y que la IA solo use contenido soportado.

### Dependencias

- Debe aplicar las reglas de seguridad de REQ-14.

### Decision previa bloqueante (build vs buy)

- **Decision resuelta:** producir demostraciones SVG procedimentales propias, alojadas en la app y registradas como contenido de Fitbros. No se usan hotlinks, APIs pagadas ni media de terceros.
- Conseguir cientos de demostraciones animadas con licencia es un sub-proyecto de contenido y legal por si solo. Antes de codificar este REQ hay que decidir y documentar la fuente: **licenciar** una libreria de ejercicios (p. ej. proveedores con API/licencia comercial), **grabar/producir** propio, o **generar**. La eleccion condiciona costo, esquema de `fuente/licencia` y tiempos. No empezar la carga de media sin esta decision.

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
