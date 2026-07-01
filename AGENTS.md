# AGENTS.md — Cómo opera un agente autónomo en Fitbros

Este archivo es el punto de entrada para **cualquier** agente autónomo (Codex, Claude Code u otro) que trabaje sobre este repositorio. Es neutral respecto a la herramienta: define los comandos y las reglas; no depende de funciones propias de un asistente en particular.

Regla base del repositorio:

> **Un requerimiento = una implementación aislada = un commit propio = un push propio.**

La fuente de requerimientos es `REQUIREMENTS.md`. El contexto funcional vive en `CONTEXT.md` (pero la verdad es el código en `HEAD`). Ambos son documentos compactos para lectura obligatoria; el detalle largo vive en `docs/requirements-history.md` y `docs/architecture-reference.md`, que se leen solo bajo demanda.

## Dos loops, dos roles, un solo lock

El repositorio tiene **dos** agentes autónomos. Comparten el lock `.git/fitbros-agent-loop.lock`, así que **solo uno corre a la vez**:

| Loop | Rol | Config | Runbook | Selector / entrypoint |
|------|-----|--------|---------|-----------------------|
| **Desarrollador** | Vacía la cola: implementa REQ (uno por corrida) | `agent-loop.json` | `AUTONOMOUS_AGENT.md` | `node scripts/agent-next-requirement.mjs` |
| **Auditor / QA** | Llena la cola: audita journeys, documenta bugs como REQ nuevos | `agent-audit-loop.json` | `AUDIT_AGENT.md` | `node scripts/agent-next-audit.mjs` |

El auditor **NO modifica código de la app**: su único archivo escribible es `REQUIREMENTS.md`. Las reglas de comportamiento del auditor están en `.claude/agents/qa-auditor.md` — es un archivo de texto plano que cualquier agente debe **leer como spec**; el bloque YAML de cabecera (`name`, `tools`, `model`) es metadato para Claude Code y puede ignorarse cuando lo lee otra herramienta como Codex.

## Memoria operativa entre corridas (continuidad, no fuente de verdad)

Cada corrida autónoma arranca en frío: no hereda el historial conversacional de la anterior. Para preservar continuidad operativa entre corridas existe una **bitácora compartida fuera del repo**:

`/Users/jonathan/.fitbros/agent-run-memory.md`

Reglas para **cualquier** agente (Codex o Claude):

- **Leer al inicio** (en el preflight) esa ruta **absoluta**. Codex además mantiene memoria per-automation en `/Users/jonathan/.codex/automations/<id>/memory.md`. Usa siempre rutas absolutas: **nunca** la variable `CODEX_HOME` ni rutas relativas para leer memoria, y **no** afirmes "no hay memoria previa" sin haber leído la ruta absoluta y confirmado que está ausente.
- **Anexar al cierre** una entrada breve (timestamp ISO, loop, herramienta, acción del selector, lock, REQ, commit/push o bloqueo, acción manual pendiente, aprendizaje), **incluso en corridas detenidas** que no generan commit.
- Vive **fuera del worktree** a propósito: así registra también las corridas detenidas sin ensuciar el worktree ni romper "un commit por corrida", y el **auditor puede anexarla sin violar** que su único archivo escribible del repo es `REQUIREMENTS.md` (la bitácora no es un archivo del repo). **No** la commitees ni la cuentes como cambio del repo.
- **No es fuente de verdad.** Si contradice a Git/HEAD, `REQUIREMENTS.md`, `CONTEXT.md`, `docs/requirements-history.md`, `docs/architecture-reference.md` o el código real, la bitácora está equivocada. No decide estado de REQ, orden de la cola ni si el trabajo está hecho.

## Cómo ejecutar el loop DESARROLLADOR

```bash
# 1. Adquirir lock y seleccionar el siguiente REQ
node scripts/agent-next-requirement.mjs --acquire
#    -> action:"implement" da el REQ; action:"stop" => detenerse; action:"complete" => no hay trabajo
```

2. Seguir `AUTONOMOUS_AGENT.md` al pie de la letra (product manager → desarrollo → QA → un commit → push). Leer los archivos historicos solo si el REQ activo o el codigo lo exige.
3. Verificar con `node scripts/release-gate.mjs` (debe quedar en verde).
4. Publicar solo si procede:

```bash
node scripts/agent-next-requirement.mjs --check-publish   # debe devolver action:"ready_to_push"
git push origin main
node scripts/agent-next-requirement.mjs --release          # liberar el lock SIEMPRE al terminar
```

## Cómo ejecutar el loop AUDITOR / QA

```bash
# 1. Adquirir lock (compartido) y obtener el journey a auditar + el siguiente REQ libre
node scripts/agent-next-audit.mjs --acquire
#    -> action:"audit" con { journey, nextRequirementId }; action:"stop" => detenerse
#    -> reason:"another_agent_active" => el desarrollador está corriendo; NO auditar
```

2. Leer `AUDIT_AGENT.md` y `.claude/agents/qa-auditor.md`, y auditar el `journey` asignado.
3. **Verificación funcional obligatoria**: servir la app en local (`python3 -m http.server 8923` o preview de Claude Code) y recorrer el journey en un navegador real como usuario, verificando funcionalidad e interfaz. Flujos de IA con fixtures por defecto; presupuesto mínimo de llamadas pagadas (máx. 3/corrida) solo si el journey exige el flujo real.
4. Encontrar un bug/gap **con evidencia** (reproducción + causa raíz con `archivo:línea` + evidencia funcional si es visible en UI). Sin evidencia, no hay REQ.
5. No duplicar: si el problema ya está en `REQUIREMENTS.md`, añadir evidencia al REQ existente en vez de crear otro. Si hay duda historica, consultar `docs/requirements-history.md` por seccion.
6. Escribir el REQ nuevo (estado `**Estado: pendiente.**`) **al final** de `REQUIREMENTS.md`, usando `nextRequirementId` y el formato estándar (Origen / Problema / Causa raíz / Objetivo / Alcance / Fuera de alcance / Riesgos / Criterios de aceptación / Verificación sugerida).
7. Verificar que **solo** cambió `REQUIREMENTS.md` y que `node scripts/release-gate.mjs` queda en verde tras commitear.
8. Un solo commit documental con el formato `audit(<journey>): REQ-NN — <título>` y publicar:

```bash
node scripts/agent-next-audit.mjs --check-publish          # action:"ready_to_push"
git push origin main
node scripts/agent-next-audit.mjs --release                # liberar el lock SIEMPRE
```

El selector del auditor rota el journey automáticamente (estado en `.git/fitbros-audit-state.json`) para dar cobertura pareja: adquisición → onboarding → home → nutrición → entrenamiento → progreso → retención → sync → auth-roles → facturación → administración → pwa.

## Invariantes que ningún agente debe romper

- **REQ-31:** la UI de usuario normal no menciona IA, modelos, prompts, tokens ni cuotas internas.
- **Privacidad por defecto:** fotos, salud, progreso y conversaciones son privados por usuario; nada de eso va a analytics.
- **Historial inmutable:** ajustar el futuro no reescribe lo ya ejecutado.
- **Sin build step ni framework ni dependencias runtime nuevas** salvo que el REQ lo exija y exista patrón aprobado.
- **No ejecutar migraciones de producción** automáticamente; las migraciones SQL son idempotentes y con RLS.
- **Un commit y un push por corrida.** Si el worktree deja de estar limpio por otra sesión, detenerse sin sobrescribir.

## Autocomprobación de los selectores

```bash
node scripts/agent-next-requirement.mjs --self-test
node scripts/agent-next-audit.mjs --self-test
```
