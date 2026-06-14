# Requerimientos pendientes - Fitbud

Este documento es el backlog operativo para Codex y Claude Code. La regla base es:

**Un requerimiento = una implementacion aislada = un commit propio = un push propio.**

No mezclar requerimientos en un mismo commit. Si durante un requerimiento aparece otro problema, anotarlo y dejarlo para otro commit salvo que bloquee directamente el alcance actual.

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

Lee el contexto del app en el archivo con el nombre CONTEXT.md que se encuentra en la carpeta del proyecto

El commit actual leido para preparar esta lista fue:

`11c32ac Migrar a Vercel: proxy serverless para mantener las keys solo en el servidor`

Puntos importantes de ese commit:

- Claude ya debe usarse en produccion via `/api/claude`; la key vive en `ANTHROPIC_API_KEY` en Vercel.
- `/api/config` expone solo configuracion publica de Supabase y modelo.
- `index.html` mantiene fallback local para desarrollo, pero produccion debe preferir Vercel.
- Supabase todavia tiene politicas RLS anonimas permisivas en `supabase/schema.sql`.
- La app sigue usando mucho estado local en `localStorage`.

Cada agente debe volver a leer el commit real que exista en `HEAD` antes de empezar.

## Orden sugerido

1. REQ-01 - Normalizar recetas y cumplimiento de macros.
2. REQ-02 - Usar recetas como fuente visible de cada comida.
3. REQ-03 - Corregir dia inicial, historial de peso y grasa corporal.
4. REQ-04 - Hacer bloques colapsables para movil.
5. REQ-05 - Login simple y modo publico solo lectura para DB e IA.
6. REQ-06 - Persistencia separada por usuario.
7. REQ-07 - Vista admin para usuarios.
8. REQ-08 - Generador de dias de dieta con Claude.
9. REQ-09 - Onboarding de objetivos, macros y preferencias.
10. REQ-10 - Cierre de ciclo, recap y siguiente desafío.
11. REQ-11 - Duración configurable del plan.

REQ-08 debe esperar a REQ-01/REQ-02 y preferiblemente a REQ-05/REQ-06, porque necesita recetas confiables, contexto por usuario y control de acceso a IA.

---

## REQ-01 - Normalizar recetas y cumplimiento de macros

### Objetivo

Asegurar que todas las comidas del plan tengan una receta clara con ingredientes y gramos, y que los macros calculados cumplan el objetivo del slot/dia.

### Alcance

- Revisar `supabase/schema.sql`, `supabase/seed.sql` y la logica actual de `buildDay()` en `index.html`.
- Garantizar que cada comida planificada tenga ingredientes con peso en gramos.
- Eliminar o convertir textos ambiguos como "carbo a la mitad", "+50% carbo", "almuerzo libre" o "arroz/pasta + tofu" cuando afecten macros sin receta real.
- Definir variantes si una misma comida cambia por tipo de dia: `PESAS`, `BAJO`, `REFEED`, `DIETBREAK`.
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
  - tipo de dia;
  - recetas disponibles;
  - historial de comidas ejecutadas;
  - preferencias;
  - restricciones;
  - formato JSON estricto esperado.
- Claude debe devolver dias con:
  - fecha o offset;
  - tipo de dia;
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

### Objetivo

Configurar el perfil completo del usuario al entrar por primera vez y ofrecer una revision cada cuatro semanas.

### Alcance

- Solicitar datos corporales, nivel de actividad y objetivo.
- Calcular calorias, proteina, carbohidratos y grasas con una formula documentada.
- Permitir editar las metas calculadas antes de guardarlas.
- Configurar disciplina, fuerza y entre 3 y 6 dias de entrenamiento.
- Capturar restricciones y preferencias alimenticias.
- Guardar todo por usuario en `profiles.prefs`.
- Personalizar las metas de PESAS, BAJO, REFEED y DIETBREAK.
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

## Notas de implementacion para agentes

- No guardar secrets en Git.
- No exponer `ANTHROPIC_API_KEY` ni service role key en frontend.
- Preferir Supabase RLS para seguridad de datos.
- Cualquier cambio de esquema debe venir con instrucciones de migracion o SQL idempotente.
- Si un requerimiento necesita partirse, crear un nuevo REQ en este archivo y hacer commit/push solo de esa actualizacion de backlog.
- Despues de cada implementacion revisar si es necesario actualizar el archivo CONTEXT.md y hacer push al repositorio con el cambio
