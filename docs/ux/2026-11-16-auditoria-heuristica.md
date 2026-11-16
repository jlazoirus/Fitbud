# Auditoría heurística de UX — 2026-11-16

Pedida por Jonathan. Método: heurísticas de Nielsen, leyes de Krug y escala de severidad 0–4 (skill `ux-heuristics`). Recorrido real en navegador con los mocks de la suite E2E (`installMocks` + `seedLoggedInUser`, 0 llamadas pagadas) a 390 y 1280 px: sitio público (`/`, `/planes`, `/pago`, `/unete`, contacto y legales), login, onboarding de 3 pasos, las 5 tabs y los modales de Nutrición y Entreno. Se revalidó contra `21104cd` (después de REQ-392..395, que ya resolvieron la sobrecarga de Hoy).

**Puntaje: 5/10.** Sin problemas catastróficos; fallan tres filas del diagnóstico rápido: acción principal (−2), términos que hacen pensar (−2) y mensajes de error (−1).

Medido sin hallazgos: sin scroll horizontal en 390/1280, contraste AA en todas las pantallas, objetivos táctiles de 44 px con `pointer:coarse`, 0 errores de consola, precios transparentes (pago único, reembolso visible), «Descartar» un entreno pide confirmación.

## Hallazgos convertidos en REQ

| REQ | Sev. | Heurística | Resumen |
|-----|------|------------|---------|
| REQ-396 | 3 | Correspondencia con el mundo real · Estética minimalista | «Iniciar sesión guiada» se lee como entrar a la cuenta; en Entreno «Registrar otra actividad» pesa más que el entreno del día. |
| REQ-397 | 3 | No me hagas pensar · Consistencia | Comida vacía «Sin asignar» con botón «Otra opción»; dos botones distintos abren el mismo registro extra. |
| REQ-398 | 3 | Prevención y recuperación de errores | Onboarding valida un error a la vez, solo en toast, sin marcar el campo; el toast sobrevive al cambio de paso. |
| REQ-399 | 2 | Recuperación de errores | Login: «Pon correo y contraseña» en gris, sin campo; placeholder `••••••••` parece contraseña guardada. |
| REQ-400 | 2 | Correspondencia con el mundo real | Jerga visible: RPE, repeticiones en reserva, bloques, P/C/G, «sesión de calidad», rango S1 sin rótulo, «Pausar» en demos. |
| REQ-401 | 2 | Trunk test / navegación | Tienda (`/planes`, `/contacto`, `/pago`) sin enlace para entrar a la app. |
| REQ-402 | 2 | Control y libertad | Abrir Perfil (usuario solo fuerza) dispara el modal «Actividad ligera para tu salud». |

## Evidencia por REQ

- **REQ-396.** `app/index.html:8142` (botón lima «Iniciar sesión guiada»), `:5826` (texto del coach), `:7465`/`:7467` («Pausar sesión», «Terminar parcialmente»), `:8153` («Me perdí la sesión»), `:6370` (`btn-accent` de ancho completo en «Registrar otra actividad» cuando no hay actividades). Hoy ya dice «Iniciar entreno» (`:5518`, REQ-394) y la portada usa «Iniciar sesión» para el login: la misma palabra significa dos cosas.
- **REQ-397.** `app/index.html:8261` («Sin asignar»), `:8267` («Otra opción» aunque no hay primera opción), `:5939` («＋ Agregar comida / snack» → `openEditor('extra')`, igual que «Registrar algo que comí» de REQ-330), `:12906` («Otra comida o snack» / «Una comida del día» sin explicar la diferencia).
- **REQ-398.** `validateOnboardingStep()` (`app/index.html:4147`) devuelve el primer string y se muestra con `toast()` (`:3152`). Al guardar el paso 3 vacío salen, uno por intento: «Elige cómo comes» (`:4158`), «Acepta el uso esencial» (`:4161`), «cuatro preguntas de seguridad» (`:4162`). Captura: «Escribe tu nombre» sigue visible en el paso 2 tras corregirlo.
- **REQ-399.** `app/index.html:11275` (mensaje genérico en `#au_out`, sin `aria-invalid` ni foco), `:11162` (placeholder `••••••••`). Con «malo» como correo no se valida el formato.
- **REQ-400.** RPE y RIR: `app/index.html:2006-2070`, `:7411`; «bloques»: `:7163`, `:7459` (además «0/6 bloques registrados» y «En curso · 0/6 bloques» en la misma tarjeta); P/C/G: `:4119`; «sesión de calidad»: `:1990-1993`; rango sin rótulo: `:8563` (`S1 74.7–75.3`); «Pausar» de la animación: `:6209`.
- **REQ-401.** `tienda/layout.js:11-14` (`NAV` solo con Planes y Contacto). La portada sí tiene «Iniciar sesión».
- **REQ-402.** `app/index.html:9790` (`showCardioNudge("profile")` al renderizar Perfil).

## Candidatos no priorizados (severidad 1)

- Insignia de sincronización «✓» (`app/index.html:1202`, z-index 150) sin rótulo visible y encima del contenido de modales (p. ej., «Guardar en favoritas»).
- Toasts sobre acciones: «Sesión iniciada» tapa «Registrar otra actividad».
- Placeholders «kg»/«%» de Progreso y macros del menú semanal en fuente monoespaciada.
- Onboarding paso 2: «Atrás» duplicado arriba y abajo; el select «Fuerza en gimnasio» se corta a 390 px; la barra de pasos no dice «Paso 2 de 3».
- Hoy conserva dos entradas al coach («Vamos paso a paso» y «Pregúntale a tu coach») y dos «Ahora no» con destinos distintos.
- «✨ Estimar macros»: el destello es una convención de IA; revisar frente a REQ-31.
- Progreso: los puntos lima de cada día de la semana no tienen leyenda.

## Falsos positivos descartados

- Consentimiento premarcado en el onboarding: venía de `consentsFixture()`; un usuario nuevo lo ve desmarcado.
- Botones de 32 px: con puntero táctil miden 44 px (`app/index.html:111-116`, `:1233-1238`).
