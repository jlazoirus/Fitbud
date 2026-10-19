# Matriz de paridad web → nativo

Checklist para declarar la beta (criterio 2 de `PLAN.md` §10). Cada tarea `feature` marca sus filas en el mismo PR: `⬜` pendiente, `🟡` parcial (explicar en Notas), `✅` hecho y verificado en iOS y Android, `➖` fuera de alcance nativo a propósito.

| Journey | Capacidad web (referencia) | Tarea | iOS | Android | Notas |
|---|---|---|---|---|---|
| Acceso | Login email/contraseña | NAT-23 | ⬜ | ⬜ | |
| Acceso | Registro con confirmación por correo | NAT-23, NAT-12 | ⬜ | ⬜ | |
| Acceso | Recuperar contraseña / crear contraseña desde invitación (REQ-167) | NAT-23, NAT-12 | ⬜ | ⬜ | |
| Acceso | Cerrar sesión con purga de datos locales (REQ-156) | NAT-23 | ⬜ | ⬜ | |
| Onboarding | 4 pasos, macros calculados, selector de cardio, lugar de fuerza | NAT-30 | ⬜ | ⬜ | |
| Onboarding | Consentimiento esencial + fotos opcional, versionados | NAT-30 | ⬜ | ⬜ | Texto sujeto a NAT-H4 |
| Onboarding | Evaluación de seguridad y pausa de rutinas por red flags | NAT-30 | ⬜ | ⬜ | |
| Onboarding | Preparación del primer ciclo con progreso y reintento (REQ-118) | NAT-31 | ⬜ | ⬜ | |
| Hoy | Anillo de macros primero, proteína por ritmo (REQ-124) | NAT-32 | ⬜ | ⬜ | |
| Hoy | Comidas y entreno del día, navegación entre días | NAT-32 | ⬜ | ⬜ | |
| Hoy | Racha, banner "Afina tu plan", revisión de 4 semanas | NAT-32 | ⬜ | ⬜ | |
| Nutrición | Marcar/saltar/reordenar comidas (REQ-125) | NAT-33 | ⬜ | ⬜ | |
| Nutrición | Cambiar comida, rehacer opciones ×4, revertir | NAT-33 | ⬜ | ⬜ | |
| Nutrición | Extras y editor manual de valores/porciones (REQ-90) | NAT-33 | ⬜ | ⬜ | |
| Nutrición | Recientes, favoritas y alimento por gramos (REQ-188) | NAT-33 | ⬜ | ⬜ | |
| Nutrición | Semana: preparar, revisar, lista de compras, aplicar | NAT-34 | ⬜ | ⬜ | |
| Nutrición | Estimar con foto + preguntas (REQ-172) | NAT-35 | ⬜ | ⬜ | |
| Nutrición | Dictado por voz | NAT-36 | ⬜ | ⬜ | |
| Coach | Conversación con el coach, paywall comercial | NAT-46 | ⬜ | ⬜ | |
| Entreno | Plan semanal, detalle series × reps (REQ-174), demostraciones | NAT-37 | ⬜ | ⬜ | |
| Entreno | Cambiar sesión antes de iniciar; modo seguro (REQ-116) | NAT-37 | ⬜ | ⬜ | |
| Entreno | Reproductor: series, RPE, descansos, descanso entre ejercicios (REQ-168/185/186/187) | NAT-38 | ⬜ | ⬜ | |
| Entreno | Recuperar sesión tras cerrar la app; parcial/completo | NAT-38 | ⬜ | ⬜ | |
| Entreno | Preparar/revisar/activar plan 4/10 semanas; rehacer semana o sesión | NAT-39 | ⬜ | ⬜ | |
| Progreso | Peso y % grasa semanal, gráfico | NAT-40 | ⬜ | ⬜ | |
| Progreso | Racha, adherencia, check-in semanal (REQ-160/165) | NAT-40 | ⬜ | ⬜ | |
| Retención | Cierre de ciclo, recap, foto privada, siguiente desafío | NAT-41 | ⬜ | ⬜ | |
| Retención | Recordatorios y push de racha | NAT-44 | ⬜ | ⬜ | Push real requiere NAT-H5 |
| Retención | Tour inicial | NAT-47 | ⬜ | ⬜ | |
| Perfil | Secciones con aviso de cambios sin guardar (REQ-105/107/108) | NAT-42 | ⬜ | ⬜ | |
| Perfil | Recalcular objetivos y preferencias | NAT-42 | ⬜ | ⬜ | |
| Privacidad | Exportar datos, borrar cuenta, retirar consentimientos | NAT-43 | ⬜ | ⬜ | Borrado in-app exigido por tiendas |
| Facturación | Estado del plan / trial | NAT-45 | ⬜ | ⬜ | |
| Facturación | Compra y restaurar compras | NAT-45 | ⬜ | ⬜ | Según NAT-H3 |
| Facturación | Stripe Checkout y canje de cupones | — | ➖ | ➖ | Web; en apps según NAT-H3 |
| Plataforma | Funciona sin conexión y sincroniza al volver | NAT-24 | ⬜ | ⬜ | |
| Plataforma | Versión mínima / actualización | NAT-49 | ⬜ | ⬜ | |
| Plataforma | Accesibilidad | NAT-48 | ⬜ | ⬜ | |
| Administración | Usuarios, catálogos, ejercicios, cupones, consumo, QA | — | ➖ | ➖ | Solo web; enlace desde Perfil para admins |
| Adquisición | Landing pública, reclutamiento beta | — | ➖ | ➖ | Solo web |
