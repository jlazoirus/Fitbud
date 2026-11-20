# Bitácora de corridas de agentes (en el repo)

Bitácora compartida de todos los agentes (Mac y nube). **Se usa primero esta**; la local `/Users/jonathan/.fitbros/agent-run-memory.md` solo si este archivo no existe. **No es fuente de verdad.** Si contradice a Git/HEAD, `REQUIREMENTS.md`, `CONTEXT.md` o el código, la bitácora está equivocada. Reglas en `AGENTS.md` (sección «Memoria operativa entre corridas»).

Formato: una entrada por corrida, la más reciente al final. Incluye timestamp ISO, loop, herramienta, REQ o tarea, rama/commit/PR o bloqueo, acción manual pendiente y aprendizaje. Breve: es un registro, no un informe.

---

### 2026-11-17 · desarrollador · Claude Code (nube) · REQ-357
- Rama `claude/wonderful-cray-728djr`, commit `9e8b86d`, PR borrador #127 (CI en verde, sin fusionar).
- Manual: aplicar `supabase/notifications_subscription.sql` después de `whatsapp.sql`.

### 2026-11-17T19:34Z · desarrollador · Claude Code (nube) · REQ-396
- Selector: `--acquire` devuelve `branch_mismatch` fuera de `main`; siguiente REQ elegido con la lógica del selector.
- Rama `claude/zen-curie-bca68w`, commit `9b01cdd`, PR borrador #128 (CI en verde). Base `main` `459de2d`; #127 sin fusionar.
- PWA v258 (v257 la usa #127): el segundo PR que se fusione tendrá un conflicto trivial en `service-worker.js`.
- Verificación: E2E 426/426 con `--grep-invert "REQ-328: siguiente real|registro-extra"`; 118 checks node del release gate en verde.
- Aprendizaje: la suite E2E completa tarda ~25 min en el contenedor; lánzala en segundo plano.

### 2026-11-18 · operación · Claude Code (nube) · SQL de REQ-357
- Pedido por Jonathan. Antes: el CHECK de `notification_log` ya incluía `whatsapp` (`whatsapp.sql` aplicado).
- Aplicado `supabase/notifications_subscription.sql` (de la rama de #127) por la Management API, en una transacción. Después: el CHECK incluye `subscription`; `notification_log` conserva sus 142 filas.
- Pendiente detectado: `public.subscriptions` y `public.subscription_charges` no existen. `supabase/suscripciones.sql` (REQ-355) **no está aplicado**: sin él `/api/suscripcion` responde 503 y no hay suscripciones que avisen por correo.
- Aprendizaje: desde la nube, el proxy autentica `api.supabase.com/v1/projects/wtqnvtixvfapdbzcegdw/database/query`, así que el SQL se puede leer y aplicar sin el SQL Editor.

### 2026-11-18T13:35Z · operación · Claude Code (nube) · SQL de REQ-355 y regla de la bitácora
- Pedido por Jonathan. Dependencias verificadas: `subscription_plans`, `user_entitlements`, `billing_events`, `libro_reclamaciones` y `pgcrypto`.
- Aplicado `supabase/suscripciones.sql` en una transacción. Ahora existen `subscriptions` (RLS y una política de lectura propia) y `subscription_charges` (RLS sin políticas: solo service_role), con sus 8 índices.
- Regla nueva (Jonathan): la bitácora del repo va primero y la local solo si el archivo del repo no existe. El auditor puede anexar su entrada. Actualizados `AGENTS.md`, `AUDIT_AGENT.md`, `NATIVE_AGENT.md` y `.claude/agents/qa-auditor.md`.
- Pendiente: si la bitácora local del Mac tiene entradas que el repo no tiene, copiarlas aquí en la próxima corrida local.

### 2026-11-18T14:10Z · operación · Claude Code (nube) · conflicto de #127 (REQ-357) con main
- #128 se fusionó en `main` (`d96de21`, `f4a2642`) sin `6a0666b`, que se trae a esta rama por cherry-pick. Se integró `origin/main` en `claude/wonderful-cray-728djr` con un merge (sin rebase).
- `service-worker.js`: `CACHE_NAME` pasa a **v259**. `main` ya publicó v258 y REQ-357 cambia el shell, así que no puede volver a v257.
- `work/plan-weeks-{390,1280}.png`: capturas generadas por pruebas que se commitearon por error en ambos lados; se conserva la versión de `main`.
- Aprendizaje: `git add -A` tras correr E2E arrastra capturas de `work/`; revisar `git status` antes de commitear.

### 2026-11-18T15:40Z · desarrollador · Claude Code (nube) · REQ-397
- Pedido por Jonathan («Sigue con REQ-397»). Rama `claude/vigilant-franklin-yt13ej`, base `main` `f9e559c`; PR borrador.
- Comida vacía: «Nada registrado» + «Ver opciones»; botón al pie = «Registrar algo que comí» (`openExtraRegistration`); editor: «Extra (se suma al día)» / «En lugar de una comida del plan». PWA v260.
- Sin operación manual pendiente.
- Aprendizaje: en la nube hace falta `npm ci`; `registro-extra-visible.spec.js` escribe en `/Users/jonathan/.fitbros/qa-archive/req-330` (créala con `mkdir -p` para correrlo). El release gate incluye la suite E2E completa: lánzalo en segundo plano.

### 2026-11-19T11:10Z · desarrollador · Claude Code (nube) · REQ-398
- Pedido por Jonathan («implementa el REQ-398»). Rama `claude/loving-volta-meuwnr`, base `main` `d1976bb`; PR borrador.
- Onboarding: `onboardingStepErrors()` devuelve todos los errores del paso con su campo; `showOnboardingErrors()` los pone bajo cada control (`aria-invalid`, `aria-describedby`), enfoca el primero y resume junto al botón (`#obErrorSummary`). Sin toast de validación. PWA v261.
- Sin operación manual pendiente.
- Aprendizaje: `onboarding-essential.spec.js` escribe capturas en `/Users/jonathan/.fitbros/qa-archive/req-389` (créala con `mkdir -p` en la nube).

### 2026-11-19T15:45Z · desarrollador · Claude Code (nube) · REQ-399
- Pedido por Jonathan («implementa el REQ-399»). Rama `claude/blissful-tesla-0w13b8` (sobre REQ-398 `50f510c`); PR borrador.
- Acceso: `authFormErrors()` + `showAuthFieldErrors()` (patrón REQ-398) en entrar, registrarse, «Olvidé mi contraseña», código de invitación y nueva contraseña; formato del correo validado; contraseña sin placeholder. `#auOut` solo para respuestas del servidor. PWA v262.
- Sin operación manual pendiente.
- Aprendizaje: `next-exercise.spec.js` escribe en `/Users/jonathan/.fitbros/qa-archive/req-328` (créala con `mkdir -p` en la nube, como req-330 y req-389). El campo inválido con foco muestra el borde lima del foco, no el rojo; el mensaje rojo debajo basta, pero sería una mejora común a onboarding y acceso.

### 2026-11-20T10:10Z · desarrollador · Claude Code (nube) · REQ-400
- Pedido por Jonathan («Implementan req 400»). Rama `claude/keen-albattani-fov2ft`, base `main` `112d85c`; PR borrador.
- Entreno sin RPE/RIR/«bloques»: `plainEffortText()` traduce al pintar (datos guardados y catálogo en Supabase intactos); «Ejercicios hechos X/Y» una vez (`workoutStatusHtml(...,{count:false})`); macros del onboarding sin abreviar; «Correr · series rápidas»; tabla de peso con «Semana N · Meta: … kg» en móvil; «Pausar animación». PWA v263.
- Sin operación manual pendiente.
- Aprendizaje: `exercise-catalog.js` se replica en `supabase/exercises.sql` (validado por `validate-exercises.mjs`); para cambiar solo el texto visible conviene traducir al pintar en vez de regenerar el seed.
