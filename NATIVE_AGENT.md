# Runbook — agentes de la migración nativa

Este runbook gobierna a los agentes (Codex, Claude Code u otro) que trabajan en la migración de Evolv a apps nativas. A diferencia de los loops desarrollador y auditor (`AGENTS.md`), **varios agentes de migración pueden trabajar a la vez**: se coordinan por el estado de `native-migration.json` en `origin/main`, no por el lock local `.git/fitbros-agent-loop.lock`.

Lectura obligatoria al empezar: `docs/native-migration/PLAN.md`, la sección de tu tarea en `docs/native-migration/BACKLOG.md`, `CONTEXT.md` y el código real que vas a tocar. `ADR-001-stack.md` si tocas `native/`.

Regla base, igual que el resto del repo:

> **Una tarea NAT = una implementación aislada = un PR/commit propio.**

## 1. Elegir y reclamar una tarea

```bash
git fetch origin main
node scripts/native-next-task.mjs --next          # sugiere la tarea que más desbloquea
node scripts/native-next-task.mjs --list          # todas las disponibles
node scripts/native-next-task.mjs --status        # panorama, quién está en qué, decisiones humanas abiertas
```

Una tarea está disponible si está `pendiente`, no es humana (`NAT-Hx`), todas sus dependencias están `hecho` y ninguna otra tarea de su `exclusiveGroup` está `en_curso`.

Reclamar es un commit que pasa la tarea a `en_curso` con tu id de agente. Gana quien llega primero a `origin/main`:

```bash
git checkout main && git pull --ff-only origin main
node scripts/native-next-task.mjs --claim NAT-xx --agent <tu-id>
git push origin HEAD:main
```

- Si el push es **rechazado**, otro agente publicó antes. Ejecuta `git reset --hard origin/main` (solo descarta tu commit de reclamo, que es lo único local) y vuelve a `--next`. No hagas force-push nunca.
- Si tu entorno **no puede empujar a `main`** (sesiones restringidas a una rama propia): antes de reclamar revisa que no exista un PR abierto cuyo título empiece con `[NAT-xx]`; luego ejecuta `--claim NAT-xx --agent <tu-id>` en tu rama, abre de inmediato un PR **borrador** titulado `[NAT-xx] <título>` con ese commit y trabaja ahí. El reclamo es efectivo cuando ese PR existe; si al abrirlo ya hay otro PR `[NAT-xx]`, cierra el tuyo y elige otra tarea.
- `--agent` identifica a la sesión (p. ej. `codex-mac-1`, `claude-cloud-<id corto>`); también puede venir de `NATIVE_AGENT_ID`.

## 2. Trabajar

- Rama de trabajo: `native/NAT-xx-<slug>` (o la rama que imponga tu entorno). Basada en `origin/main` con tu reclamo incluido.
- **Escribe solo dentro de los `paths` de tu tarea.** Si necesitas tocar algo fuera, detente: o es otra tarea (créala, ver §5) o el alcance está mal definido (corrígelo en un PR documental aparte).
- `exclusiveGroup`:
  - `index-html`: tocan `index.html`/`service-worker.js` (extracciones de Fase 1). Solo una a la vez para evitar conflictos con el loop desarrollador y entre agentes.
  - `native-config`: tocan `native/package.json` o `native/app.config.ts` (dependencias, plugins, permisos). Solo una a la vez.
- No dupliques lógica de dominio en `native/` (ver `PLAN.md` §4). Si falta, crea una tarea `core`.
- Respeta los invariantes de `AGENTS.md`: REQ-31, privacidad, historial inmutable, sin dependencias runtime nuevas en la web, migraciones SQL idempotentes con RLS y nunca aplicadas a producción.
- No hagas llamadas pagadas: usa fixtures y APIs simuladas. Nada de secretos en el repo.

## 3. Verificar

Según lo que toque la tarea (detalle en `BACKLOG.md`):

```bash
git diff --check
node scripts/release-gate.mjs                     # si tocaste la raíz (index.html, js/, api/, supabase/, scripts/)
(cd native && npm run typecheck && npm run lint && npm test)   # si tocaste native/
node scripts/native-next-task.mjs --validate
```

`release-gate.mjs` exige estar en `main`; en una rama de trabajo, el check "Rama activa es main" puede fallar y es el único fallo aceptable. Todo lo demás debe quedar en verde. Las tareas de UI adjuntan capturas iOS y Android al PR y marcan sus filas en `docs/native-migration/PARITY.md`.

## 4. Cerrar

En el **mismo** PR/commit de la implementación:

```bash
node scripts/native-next-task.mjs --done NAT-xx
```

y, si aplica, actualiza `PARITY.md`, `ADR-001-stack.md` (dependencias nuevas o versiones fijadas) y `CONTEXT.md` (solo si cambia la arquitectura de la web; respeta su límite de palabras).

Mensaje de commit: `feat(native): NAT-xx — <título>` (o `refactor(core):` para extracciones, `chore(native):` para infraestructura), con: tarea, archivos y flujos revisados, decisiones, verificación real y acciones manuales pendientes.

Publica por PR hacia `main` (o push directo a `main` si así opera tu entorno, tras `git fetch` y rebase limpio). Si al integrar `native-migration.json` tiene conflicto, conserva los estados de `origin/main` para todas las tareas excepto la tuya.

## 5. Bloqueos, abandono y tareas nuevas

- **Bloqueado** por algo externo o una decisión: `node scripts/native-next-task.mjs --block NAT-xx --reason "<qué falta y quién decide>"`, commit y push. No marques `hecho` trabajo parcial.
- **Abandonar**: `--release NAT-xx`, commit y push; deja el trabajo útil en una rama con un comentario en el PR.
- **Reclamos vencidos**: `--stale` lista tareas `en_curso` con más de `claimStaleDays` días. Solo una persona decide liberarlas.
- **Tarea nueva o división**: agrega la entrada en `native-migration.json` (siguiente id libre de su fase, `paths` y `deps` explícitos) y su sección `## NAT-xx — <título>` en `BACKLOG.md`, en un commit documental `docs(native): ...`. `--validate` debe quedar en verde.
- **Decisiones humanas** (`NAT-Hx`): un agente puede preparar material (borradores, comparativas) pero nunca las marca `hecho`.

## 6. Relación con los otros loops

- El loop **desarrollador** (`AUTONOMOUS_AGENT.md`) sigue tomando REQ de `REQUIREMENTS.md`; no toma tareas NAT. Si un REQ y una tarea NAT del grupo `index-html` chocan, gana el REQ (producción) y la tarea NAT se rebasa.
- El loop **auditor** puede reportar bugs de la app nativa como REQ nuevos cuando exista una beta; mientras tanto, los hallazgos de la migración se registran como tareas NAT.
- Bitácora compartida: anexar una entrada breve a `/Users/jonathan/.fitbros/agent-run-memory.md` al terminar, si existe en tu entorno (no es fuente de verdad ni se commitea).
