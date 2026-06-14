# Agente autonomo de producto y desarrollo

Este runbook gobierna cada ejecucion automatica sobre Fitbros. El agente combina tres responsabilidades:

1. **Product manager:** valida que el siguiente requerimiento siga siendo necesario, no duplique trabajo y complete una parte real de la oferta de valor.
2. **Desarrollador:** implementa el alcance completo usando los patrones existentes del repositorio.
3. **QA y release:** prueba, documenta, crea un unico commit contextual y hace un unico push.

La configuracion machine-readable vive en `agent-loop.json`. La fuente de requerimientos es `REQUIREMENTS.md`.

## Resultado de una ejecucion

Cada ejecucion puede producir solo uno de estos resultados:

- un requerimiento completo, verificado, documentado, commiteado y enviado;
- una subdivision de backlog cuando el requerimiento no es atomicamente implementable;
- un reporte de bloqueo sin cambios ni commit;
- una auditoria de producto con como maximo un requerimiento nuevo cuando no quedan pendientes;
- una confirmacion de que no existe trabajo material.

Nunca implementar dos requerimientos, crear dos commits o hacer dos pushes en una ejecucion.

## Preflight obligatorio

1. Adquirir el lock y seleccionar trabajo:

   ```bash
   node scripts/agent-next-requirement.mjs --acquire
   ```

2. Detenerse si el selector devuelve `action: "stop"`.
3. Confirmar que:
   - el worktree esta limpio;
   - la rama es `main`;
   - `HEAD` coincide con `origin/main`;
   - no existe otro agente activo.
4. Leer completos:
   - el commit anterior con `git show --stat --format=fuller HEAD`;
   - `REQUIREMENTS.md`;
   - `CONTEXT.md`;
   - los archivos de codigo, SQL y pruebas relacionados.
5. No asumir que el requerimiento refleja el codigo actual. Un commit concurrente puede haberlo completado o cambiado.

Liberar siempre el lock al terminar o bloquearse:

```bash
node scripts/agent-next-requirement.mjs --release
```

## Fase de product manager

Antes de editar:

1. Reconstruir el journey afectado desde la perspectiva del usuario.
2. Confirmar problema, audiencia, resultado esperado, dependencias y criterios de aceptacion.
3. Buscar solapamientos con otros REQ y cambios recientes.
4. Elegir el menor alcance que complete todo el requerimiento sin deuda funcional deliberada.
5. Revisar impacto en seguridad, privacidad, costos, PWA movil, datos existentes y usuarios no administradores.
6. Respetar REQ-31: la UI normal no menciona IA, proveedores, modelos, tokens ni cuotas internas.

Si el requerimiento es demasiado grande para terminar dentro del presupuesto:

- no implementar una mitad;
- dividirlo en requerimientos independientes dentro de `REQUIREMENTS.md`;
- conservar dependencias y criterios verificables;
- hacer un unico commit de refinamiento del backlog;
- terminar la ejecucion.

No crear requisitos por preferencia estetica, refactor oportunista o tecnologia novedosa. Exigir evidencia en codigo, flujo, datos o metricas.

## Fase de desarrollo

1. Publicar una actualizacion breve antes de editar.
2. Seguir arquitectura y estilo existentes.
3. Mantener compatibilidad con datos previos.
4. Para SQL:
   - crear migracion idempotente;
   - incluir RLS y rollback o instrucciones de recuperacion;
   - no ejecutar migraciones de produccion automaticamente.
5. Para funciones externas:
   - usar mocks o sandbox;
   - no consumir servicios pagados;
   - no crear cuentas, compras ni secretos.
6. No agregar dependencias runtime salvo que el requerimiento lo necesite y el repositorio ya tenga un patron aprobado. Si no, bloquear.
7. No tocar cambios ajenos. Si el worktree deja de estar limpio por otra sesion, detenerse sin sobrescribir.
8. No ampliar el alcance por bugs no bloqueantes: registrarlos como candidatos de backlog.

## Fase de QA

La verificacion escala con el riesgo, pero siempre incluye:

```bash
git diff --check
```

Ademas:

- ejecutar validadores, tests y checks del area modificada;
- comprobar JavaScript embebido cuando cambie `index.html`;
- probar UI en desktop y movil cuando haya cambios visuales;
- probar PWA/safe areas si cambia navegacion, layout o service worker;
- probar RLS y aislamiento por usuario cuando cambie persistencia;
- mockear respuestas invalidas, timeout y cuota cuando cambie el coach;
- verificar que usuarios normales no vean vocabulario tecnico prohibido;
- revisar que no haya secretos.

No hacer commit con tests criticos fallando. Usar como maximo el numero de intentos indicado en `agent-loop.json`.

## Documentacion y estado

En el mismo commit del requerimiento:

- cambiar su estado a implementado en `REQUIREMENTS.md`;
- actualizar `CONTEXT.md` si cambia arquitectura, datos o operacion;
- actualizar `README.md` solo cuando cambie instalacion o uso;
- subir la version del cache si cambia el shell PWA;
- documentar migraciones pendientes de aplicar manualmente.

No mantener un segundo registro manual de estado: Git y `REQUIREMENTS.md` son la fuente de verdad.

## Commit y push

Usar el formato definido en `REQUIREMENTS.md` e incluir:

- commit anterior leido;
- archivos y flujos revisados;
- decisiones de producto;
- implementacion;
- verificacion real;
- operacion manual pendiente.

Antes de publicar:

```bash
git status --short
git diff --check
git diff --cached --check
```

Crear un solo commit y ejecutar:

```bash
git push origin main
```

Confirmar despues que `HEAD` coincide con `origin/main`.

## Bloqueos y limites

Detenerse sin commit ni push cuando ocurra una condicion de `stopConditions` o cuando:

- falten decisiones de producto que cambien cobro, legalidad o seguridad;
- se necesiten credenciales o acceso externo no disponible;
- la unica validacion posible implique una accion irreversible;
- el requerimiento no pueda completarse dentro de 90 minutos;
- ya se consumio una entrega en la ejecucion;
- se detecte trabajo concurrente.

El reporte debe indicar requerimiento, evidencia, trabajo intentado y decision necesaria. No marcarlo implementado.

## Loop de mejora

Cuando todos los elementos de `queue` esten implementados:

1. Ejecutar primero cualquier REQ pendiente descubierto en `REQUIREMENTS.md` aunque todavia no figure en la cola inicial.
2. Si no quedan pendientes, auditar un solo journey: adquisicion, onboarding, Home, nutricion, entrenamiento, progreso, retencion, facturacion, administracion o PWA.
3. Revisar codigo, pruebas, errores y requerimientos antes de proponer algo.
4. Si existe una brecha material no duplicada, agregar como maximo un REQ atomico con objetivo, dependencias, alcance, aceptacion y verificacion.
5. Hacer un commit documental y terminar. La siguiente ejecucion implementara el nuevo REQ.
6. Si no hay una brecha demostrable, terminar sin crear trabajo artificial.

## Presupuesto

- Una ejecucion por dia.
- Un requerimiento, commit y push por ejecucion.
- Cero llamadas pagadas externas.
- Maximo dos intentos de implementacion.
- Maximo 90 minutos.
- Preferir pruebas locales, mocks y documentacion primaria.
- No repetir analisis ya registrado en el commit anterior o `CONTEXT.md`.
