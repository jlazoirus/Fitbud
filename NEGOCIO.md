# Fitbros — Contexto de negocio y propuesta de valor

> Documento **de negocio** (no técnico), pensado para Cowork y para trabajo de producto, marketing, growth y operaciones.
> El contexto de ingeniería vive en `CONTEXT.md`; el backlog operativo en `REQUIREMENTS.md`; la privacidad en `PRIVACY.md`.
> Última actualización: 2026-06-18.

---

## 1. Qué es (en una frase)

Fitbros es un **coach personal de nutrición y entrenamiento** que arma, explica y **adapta** ciclos de 4 o 10 semanas, para que el usuario siempre sepa **qué comer y qué entrenar hoy** y cómo ejecutarlo. Es una app web / PWA mobile-first, instalable como app de celular.

- **En vivo:** https://fitbud-green.vercel.app/
- **Repo:** https://github.com/jlazoirus/Fitbud (público)
- **Marca de cara al usuario:** **Fitbros** (y "tu coach"). *Fitbud* es el nombre interno/repositorio.

---

## 2. El problema que resuelve

Las personas que quieren recomponer o cuidar su cuerpo enfrentan, en el día a día:

- **No saber qué comer hoy** dentro de sus calorías y macros.
- **Pérdida de adherencia** cuando la vida se interpone: sin tiempo, comer fuera, falta un ingrediente, se perdió la sesión.
- **Planes rígidos que se rompen** al primer imprevisto.
- **Apps genéricas** que entregan un plan pero **no explican cómo ejecutarlo** ni se adaptan al progreso real.

---

## 3. Propuesta de valor — la promesa

> **"Siempre tengo una opción viable para comer y entrenar hoy, sé cómo ejecutarla, y mi plan se adapta a mi vida y mi progreso."**

La promesa **no** es "la IA genera texto". Es **viabilidad + ejecución + adaptación**. La inteligencia es un medio invisible; el valor percibido es tener siempre una próxima acción clara y factible.

### Pilares de valor

1. **Plan personalizado** — macros calculados por fórmula (Katch-McArdle / Mifflin-St Jeor), dieta y entrenamiento de 4 o 10 semanas.
2. **Flexibilidad con estructura** — cambiar comida, ejercicio, día o lugar sin romper metas ni la progresión.
3. **Explicación antes que prescripción** — cómo y por qué hacer cada cosa, con guía para principiantes (técnica, respiración, errores, señales de seguridad).
4. **Adaptación continua** — check-ins semanales, contingencias y progreso alimentan el ajuste del siguiente paso.
5. **Constancia no punitiva** — rachas, hitos y recordatorios útiles; los descansos y días incompletos no castigan.
6. **Privacidad y seguridad por defecto** — datos corporales, fotos y conversaciones privadas por usuario.

---

## 4. Para quién (usuario)

- **Caso semilla (conocido):** persona vegetariana sin huevo, ~180 g de proteína/día, déficit agresivo, objetivo de recomposición corporal.
- **El perfil flexible ya soporta** un público más amplio: omnívoros y vegetarianos; disciplinas Running / Cycling / Natación combinadas con fuerza en gimnasio o con peso corporal; 3–6 días por semana; distintos niveles de experiencia, equipo, horarios, presupuesto y limitaciones físicas.
- **Por definir (no está en el repo):** ICP formal, segmentos prioritarios y tamaño de mercado.

---

## 5. Qué entrega hoy (lo que sostiene el valor)

- **Vista HOY** según la fecha real: comidas del plan, entrenamiento y metas del día, con calorías y macros en vivo.
- **Plan nutricional flexible**: genera días y semanas completas respetando número de comidas, horarios, tiempo de cocina, presupuesto y alergias; muestra borrador con lista de compras antes de aplicar; permite cambiar una comida sin afectar las demás.
- **Plan de entrenamiento personalizado** + **reproductor guiado**: prepara/valida/activa 4 o 10 semanas; cada ejercicio con instrucciones, demostraciones animadas, series/RPE, descansos temporizados y sustituciones.
- **Contingencias y reemplazos**: "Cambiar" comida (sin cocina / comer fuera / sin ingrediente) y "Adaptar hoy" el entreno (20 min / en casa / sin equipo / sesión perdida).
- **Check-in semanal adaptativo**: ajusta calorías o intensidad según señales subjetivas, peso y adherencia, siempre con confirmación.
- **Cierre de ciclo**: recap de logros, adherencia, cambio de peso/grasa, mejor racha, foto de progreso privada y elección del siguiente desafío.
- **Coach conversacional**: responde dudas sobre el plan, los ejercicios y cómo adaptarse.
- **Multiusuario** con cuentas, roles (usuario/admin) y catálogo de alimentos compartido.
- **PWA instalable** con caché offline del shell.

---

## 6. Monetización

Modelo: **acceso por suscripción / paquete** gestionado con *entitlements* server-side y un **paywall contextual** que aparece al usar funciones del coach.

| Plan | Precio | Duración | Nota |
|------|--------|----------|------|
| **Plan mensual** | **USD 14** | 30 días | "Acceso completo. Sin permanencia. Cancela cuando quieras." |
| **Paquete 3 meses** | **USD 36** | 90 días | Badge "Mejor valor" · ahorro ~15 % vs. mensual · ideal para un ciclo completo |

- Hoy los planes son **pago único por período** (no auto-renovables).
- **Checkout vía Stripe**: la infraestructura de facturación está lista (`billing_events` aplicada), pero el checkout **está pendiente de activar** (REQ-26 — ver `STRIPE_SETUP.md`).
- **Cortesía**: un administrador puede otorgar acceso temporal a un usuario (con auditoría).
- El **acceso a la IA está controlado por el entitlement**; sin acceso, la experiencia degrada a alternativas deterministas. El costo de IA se controla con límites por acción y fallback sin proveedor.
- **Por definir (no está en el repo):** conversión, churn, LTV, CAC, retención y cualquier unit economics real.

---

## 7. Posicionamiento y diferenciación

- **Tecnología invisible.** El usuario habla de "su coach", "su plan" y "otra opción" — **nunca** ve IA, modelos, prompts, tokens ni configuración. Esto diferencia a Fitbros de la ola de apps "powered by AI" y centra la propuesta en el resultado, no en la herramienta.
- **La IA propone, el sistema valida.** Macros, restricciones (p. ej. alergias), progresión, ejercicios y permisos se validan con reglas deterministas antes de guardar. Esto protege la confianza: no inventa números ni rompe restricciones.
- **Historial inmutable + confirmación antes de cambiar.** Ajustar el futuro nunca reescribe lo ya ejecutado; ningún cambio se aplica sin mostrar el impacto.
- **Foco en adherencia y ejecución**, no solo en generar un plan bonito.
- **Por definir (no está en el repo):** análisis de competencia y benchmark de precios.

---

## 8. Marca y experiencia

- **Nombre de producto:** Fitbros. **Tono:** coach cercano, claro, no técnico y no punitivo.
- **Diseño:** estética oscura púrpura + terracota; tipografías Syne (display) y DM Sans (texto); mobile-first; PWA instalable.

---

## 9. Dirección estratégica — próximo gran paso

**"Home agéntico".** El inicio se reorganiza alrededor de una **agenda determinista** ("lo que te toca ahora": próxima comida + entreno pendiente), que es **gratis y no usa IA**, con el coach capaz de **ejecutar acciones** a demanda (registrar comida, cambiar plato, adaptar entreno, registrar peso) y la conversación como punto de entrada.

- **North star:** adherencia (% de comidas registradas y entrenos completados por semana).
- **Guardarraíl:** el costo de IA por usuario activo no debe subir; cargar el inicio cuesta cero tokens.
- **Secuenciado y medible:** REQ-40 (agenda determinista) → REQ-41 (coach ejecutor con guardrails de confianza) → REQ-42 (conversación como entry point). Detalle en `REQUIREMENTS.md`.

---

## 10. Restricciones y principios no negociables

- **Privacidad:** edad mínima 18 años; consentimientos versionados; un permiso esencial + fotos opcionales; **no** se pide email ni marketing; exportación y borrado de cuenta disponibles.
- **Seguridad:** evaluación de aptitud; ante señales de alerta el entreno se reemplaza por una pausa segura; **no** diagnostica enfermedades ni prescribe tratamientos.
- **Costo de IA controlado:** límites, trazabilidad y alternativa determinista cuando se alcanza el tope.
- **Tecnología invisible** para usuarios no administradores.

---

## 11. Estado actual del negocio

- **En producción** sobre Vercel (hosting + funciones serverless) y Supabase (base de datos).
- **Suscripciones:** infraestructura de entitlement, catálogo y paywall lista; **checkout de Stripe pendiente de activar** (REQ-26).
- **Desarrollo** guiado por un backlog (`REQUIREMENTS.md`) que ejecuta un agente autónomo, un requerimiento por corrida.

---

## 12. Vacíos a completar con Cowork (no definidos en el repo)

Estos puntos **no existen** en la base de código y conviene definirlos como trabajo de negocio:

- ICP formal, segmentos prioritarios y tamaño de mercado (TAM/SAM/SOM).
- Estrategia go-to-market: canales de adquisición, mensajes, embudo.
- Competencia directa/indirecta y benchmark de precios.
- Métricas de negocio: conversión a pago, churn, retención, LTV, CAC.
- Experimentos de pricing y de packaging (mensual vs. trimestral vs. anual, auto-renovación).
- Identidad de marca formal (logo, brand book, guía de voz).
- Plan de retención y re-engagement (notificaciones, ciclo de vida del usuario).
