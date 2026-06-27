# Agente autónomo de auditoría y QA

Este runbook gobierna cada ejecución del **loop auditor** sobre Fitbros. Es el espejo de `AUTONOMOUS_AGENT.md`, pero con un rol distinto y deliberadamente separado:

- El **desarrollador** (`AUTONOMOUS_AGENT.md` + `agent-loop.json`) **vacía** la cola: implementa REQ, uno por corrida.
- El **auditor** (este runbook + `agent-audit-loop.json`) **llena** la cola: recorre journeys, encuentra bugs y deuda, y los documenta como REQ nuevos.

La configuración machine-readable vive en `agent-audit-loop.json`. Las reglas de comportamiento detalladas viven en el subagente `.claude/agents/qa-auditor.md`; este runbook solo añade la mecánica del loop (lock, preflight, commit, push).

## Regla absoluta

El auditor **NO modifica código de la app**. El único archivo que puede cambiar es `REQUIREMENTS.md`. Si encuentra un fix obvio, lo documenta como REQ con causa raíz; no lo aplica. Cualquier intento de tocar `index.html`, `*.js`, `api/`, `supabase/` o `scripts/` es una condición de parada (`app_code_modification_attempted`).

## Resultado de una ejecución

Cada corrida produce exactamente uno de estos resultados:

- un commit documental que agrega **como máximo `newRequirementsPerRun`** REQ nuevos (estado `pendiente`) y hace un único push;
- añadir evidencia a un REQ pendiente existente en lugar de duplicarlo (un commit documental);
- terminar sin cambios cuando no hay brecha material demostrable;
- un reporte de bloqueo sin commit.

Nunca implementar un REQ, nunca crear dos commits, nunca hacer dos pushes.

## Preflight obligatorio

1. Adquirir el lock (compartido con el desarrollador) y elegir journey:

   ```bash
   node scripts/agent-next-audit.mjs --acquire
   ```

2. Detenerse si devuelve `action: "stop"`. En particular `another_agent_active` significa que el desarrollador está corriendo: no auditar.
3. Confirmar worktree limpio, rama `main`, y `HEAD == origin/main` (el selector ya lo valida).
4. Tomar el `journey` y el `nextRequirementId` que devolvió el selector.
5. Leer el contexto obligatorio que indica el subagente: último commit, `CONTEXT.md`, `REQUIREMENTS.md` y el código real del journey.

Liberar siempre el lock al terminar o bloquearse:

```bash
node scripts/agent-next-audit.mjs --release
```

## Fase de auditoría

Seguir al pie de la letra `.claude/agents/qa-auditor.md`:

1. Reconstruir el journey asignado desde la perspectiva del usuario.
2. Buscar bugs, inconsistencias macros↔objetivo, fugas de privacidad, fugas de vocabulario de IA (REQ-31), errores de cálculo, estados vacíos rotos, conflictos de sync.
3. Ejecutar validadores de solo lectura como evidencia:
   ```bash
   node scripts/release-gate.mjs
   node scripts/smoke-test.mjs
   ```
4. Confirmar que el hallazgo no esté ya documentado en `REQUIREMENTS.md`. Si lo está, añadir evidencia al REQ existente en vez de crear otro.
5. Exigir evidencia real: reproducción + causa raíz con archivo:línea. Sin evidencia, no hay REQ.

Si no existe brecha material demostrable en el journey, terminar sin crear trabajo artificial.

## Escribir el REQ

1. Usar el `nextRequirementId` del selector (= máximo existente + 1).
2. Añadir al final de `REQUIREMENTS.md` el bloque con el formato estándar del subagente (Origen / Problema / Causa raíz / Objetivo / Alcance / Fuera de alcance / Riesgos / Criterios de aceptación / Verificación sugerida), estado `**Estado: pendiente.**`.
3. Si la brecha excede un REQ atómico, partirla en varios REQ; el límite `newRequirementsPerRun` controla cuántos se documentan por corrida.

## Commit y push

Un solo commit documental. Formato:

```text
audit(<journey>): REQ-NN — <título corto del hallazgo>

Origen:
- Commit previo leído: <hash> <subject>
- Journey auditado: <journey>
- Archivos revisados: <lista corta>

Hallazgo:
- <síntoma + causa raíz con archivo:línea>

Evidencia:
- <comando/validador ejecutado y resultado>
```

Antes de publicar:

```bash
git status --short
git diff --check
node scripts/agent-next-audit.mjs --check-publish
```

Solo si devuelve `action: "ready_to_push"`:

```bash
git push origin main
```

Reusar la política de "push rechazado" de `AUTONOMOUS_AGENT.md` (rebase una vez, sin force-push).

## Relación con el loop de desarrollo

- **Lock compartido**: ambos selectores usan `.git/fitbros-agent-loop.lock`. Solo uno corre a la vez. El lock del auditor lleva `role: "auditor"`; `--release` no pisa un lock del desarrollador.
- **Auditoría embebida del desarrollador desactivada**: en `agent-loop.json`, `continuousImprovement.auditWhenQueueIsComplete` está en `false`. Cuando la cola se vacía, el desarrollador termina con `action: "complete"` y es este loop el responsable de descubrir trabajo nuevo. Si alguna vez quieres volver al comportamiento anterior (un solo loop que implementa y audita), vuelve a ponerlo en `true` y no uses este loop.

## Presupuesto

- Una ejecución por día (independiente del desarrollador).
- A lo sumo `newRequirementsPerRun` REQ, un commit y un push por ejecución.
- Cero llamadas pagadas externas.
- Máximo 60 minutos.
- Preferir lectura de código, validadores locales y prueba manual en `python3 -m http.server 8923`.
