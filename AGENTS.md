# AGENTS.md — Cómo opera un agente autónomo en Fitbros

Este archivo es el punto de entrada para **cualquier** agente autónomo (Codex, Claude Code u otro) que trabaje sobre este repositorio. Es neutral respecto a la herramienta: define los comandos y las reglas; no depende de funciones propias de un asistente en particular.

Regla base del repositorio:

> **Un requerimiento = una implementación aislada = un commit propio = un push propio.**

La fuente de requerimientos es `REQUIREMENTS.md`. El contexto funcional vive en `CONTEXT.md` (pero la verdad es el código en `HEAD`).

## Dos loops, dos roles, un solo lock

El repositorio tiene **dos** agentes autónomos. Comparten el lock `.git/fitbros-agent-loop.lock`, así que **solo uno corre a la vez**:

| Loop | Rol | Config | Runbook | Selector / entrypoint |
|------|-----|--------|---------|-----------------------|
| **Desarrollador** | Vacía la cola: implementa REQ (uno por corrida) | `agent-loop.json` | `AUTONOMOUS_AGENT.md` | `node scripts/agent-next-requirement.mjs` |
| **Auditor / QA** | Llena la cola: audita journeys, documenta bugs como REQ nuevos | `agent-audit-loop.json` | `AUDIT_AGENT.md` | `node scripts/agent-next-audit.mjs` |

El auditor **NO modifica código de la app**: su único archivo escribible es `REQUIREMENTS.md`. Las reglas de comportamiento del auditor están en `.claude/agents/qa-auditor.md` — es un archivo de texto plano que cualquier agente debe **leer como spec**; el bloque YAML de cabecera (`name`, `tools`, `model`) es metadato para Claude Code y puede ignorarse cuando lo lee otra herramienta como Codex.

## Cómo ejecutar el loop DESARROLLADOR

```bash
# 1. Adquirir lock y seleccionar el siguiente REQ
node scripts/agent-next-requirement.mjs --acquire
#    -> action:"implement" da el REQ; action:"stop" => detenerse; action:"complete" => no hay trabajo
```

2. Seguir `AUTONOMOUS_AGENT.md` al pie de la letra (product manager → desarrollo → QA → un commit → push).
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
3. Encontrar un bug/gap **con evidencia** (reproducción + causa raíz con `archivo:línea`). Sin evidencia, no hay REQ.
4. No duplicar: si el problema ya está en `REQUIREMENTS.md`, añadir evidencia al REQ existente en vez de crear otro.
5. Escribir el REQ nuevo (estado `**Estado: pendiente.**`) **al final** de `REQUIREMENTS.md`, usando `nextRequirementId` y el formato estándar (Origen / Problema / Causa raíz / Objetivo / Alcance / Fuera de alcance / Riesgos / Criterios de aceptación / Verificación sugerida).
6. Verificar que **solo** cambió `REQUIREMENTS.md` y que `node scripts/release-gate.mjs` queda en verde tras commitear.
7. Un solo commit documental con el formato `audit(<journey>): REQ-NN — <título>` y publicar:

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
