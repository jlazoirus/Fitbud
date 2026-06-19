# 00 · Estrategia y Producto — Fitbros

> Documento fundacional. Llena los vacíos que el propio repo marca como pendientes en `NEGOCIO.md §12` (ICP, mercado, competencia, pricing, métricas).
> Fecha: 19 jun 2026 · Estado del producto: **desplegado en producción, sin uso real todavía.**
> Compañeros: `01-Plan-de-Validacion.md` (lo siguiente que ejecutas), `02-Adquisicion.md`, `03-Redes-Sociales.md`.

---

## 1. La tesis (en un párrafo)

Fitbros apuesta a que existe un hueco entre dos mundos: las **apps de tracking** (MyFitnessPal, MacroFactor, Yazio, Fitia) que te dan herramientas pero te dejan a ti el trabajo de decidir *qué comer y qué entrenar hoy y cómo ejecutarlo*, y los **coaches humanos** (Future, entrenador personal) que sí deciden por ti pero cuestan US$100–200/mes y no escalan. Fitbros quiere ser **el coach que decide y te guía, al precio de un software**. La promesa no es "IA que genera texto", es *"siempre tengo una opción viable para comer y entrenar hoy, sé cómo ejecutarla, y mi plan se adapta a mi vida y mi progreso."*

**La verdad incómoda de hoy:** el producto está construido y desplegado, pero **nadie lo usa en serio**, así que la necesidad **aún no está validada con nadie más que tú**. Tenemos producto sin evidencia de demanda. Por eso la prioridad #1 no es conseguir usuarios ni redes: es **probar que el problema duele de verdad y que esta solución lo resuelve mejor que la alternativa que ya usan**. Todo lo demás (adquisición, redes, cobro) se activa *después* de esa evidencia.

---

## 2. El problema y el "job to be done"

La gente no quiere "una app de dieta". Contrata una solución para un trabajo. Los dos trabajos que Fitbros puede hacer:

- **"Dime qué hacer hoy para no tener que pensarlo"** — la fatiga de decisión es real: qué cocino, cuánto, qué entreno, cómo. Las apps de tracking trasladan ese trabajo al usuario (tú registras, tú decides). El coach lo quita.
- **"Que mi plan no se rompa cuando la vida se mete"** — falta un ingrediente, hay que comer fuera, se perdió la sesión, no hay tiempo. Los planes rígidos (PDF del entrenador, plantilla genérica) se rompen al primer imprevisto y ahí muere la adherencia.

El dolor central, entonces, no es "falta de información" (hay infinita y gratis). Es **falta de una próxima acción clara, viable y adaptada**. Ese es el job. Si Fitbros lo hace bien, gana; si solo "genera planes bonitos", es uno más.

> **Lo que NO sabemos aún (y vamos a validar):** ¿este dolor es lo bastante fuerte como para que alguien lo use cada día y pague por él? ¿O es un "estaría bueno" que no mueve a la acción? Esta es la hipótesis madre.

---

## 3. ICP — los dos segmentos a explorar

Elegiste validar dos perfiles. Tienen **el mismo motor pero necesidades muy distintas**. Conviene tenerlos separados desde el día uno.

### Segmento A — "El Comprometido" (dieta seria + gym) · *tu perfil, Cliente 0*
- **Quién:** entrena hace rato, conoce macros, ya hace o intentó dietas estructuradas (déficit, recomposición, voluminado). 25–40 años.
- **Job dominante:** *automatización y adaptación.* No necesita que le expliquen qué es la proteína; necesita que el plan se arme solo, se adapte a su semana y no se rompa.
- **Qué usa hoy:** MacroFactor / MyFitnessPal para trackear + un Excel o el plan del coach + YouTube. Mezcla 2–3 herramientas.
- **Por qué pagaría:** ahorro de tiempo y carga mental; un sistema integrado en vez de 3 apps.
- **Riesgo:** es el más sofisticado y exigente; ya tiene herramientas gratis buenas; compara con MacroFactor y nota cada defecto. **Difícil de impresionar.**

### Segmento B — "El que quiere empezar" (principiante) · *el mercado más grande*
- **Quién:** quiere ponerse en forma / bajar grasa / empezar el gym, pero está **abrumado y no sabe por dónde**. No distingue una sentadilla buena de una que lo lesiona. 20–45 años.
- **Job dominante:** *que le digan exactamente qué hacer y cómo, sin juzgarlo.* Aquí brilla el pilar "**explicación antes que prescripción**": técnica, respiración, errores, señales de seguridad, demos animadas, reproductor guiado paso a paso.
- **Qué usa hoy:** nada sostenido, o un tracker que abandona en 2 semanas porque le pide trabajo que no sabe hacer; o paga un entrenador caro.
- **Por qué pagaría:** miedo a hacerlo mal/lesionarse + querer resultados sin contratar a alguien; el acompañamiento vale.
- **Riesgo:** mayor churn (motivación frágil), menor disposición a pagar de entrada, requiere más onboarding emocional.

### Comparación

| Dimensión | A — Comprometido | B — Principiante |
|---|---|---|
| Tamaño del mercado | Menor, saturado | Mayor, peor servido |
| Dolor que resolvemos | Carga mental / fragmentación | Parálisis / miedo a hacerlo mal |
| Diferenciación más fuerte | Adaptación + integración | **Ejecución guiada** (el wedge real) |
| Disposición a pagar | Alta pero exigente | Media, sensible al precio |
| Competencia directa | MacroFactor, Fitia | Entrenador, YouTube, nada |
| Riesgo principal | "Ya tengo algo gratis mejor" | Churn por motivación |

### Recomendación (a confirmar con evidencia)
Úsate a ti (**A**) como **Cliente 0** para pulir el motor —eres el QA más duro—, **pero la cabeza de playa comercial probablemente sea B (principiantes/intermedios inseguros)**, porque ahí la diferenciación de Fitbros (guiar la ejecución, explicar, no romperse) es más fuerte y los trackers gratuitos *no compiten* por ese job. Contra un principiante, MacroFactor no es rival; contra ti, sí.

No lo decidas por intuición: el plan de validación está diseñado para **probar ambos con amigos y comprometerte a UNA cabeza de playa según los datos**. Servir a los dos a la vez al inicio diluye el foco, el mensaje y el producto.

---

## 4. Propuesta de valor y diferenciación

**La promesa:** *"Siempre tengo una opción viable para comer y entrenar hoy, sé cómo ejecutarla, y mi plan se adapta a mi vida y mi progreso."*

Cuatro cuñas (wedges) defendibles, en orden de fuerza:

1. **Decide + guía la ejecución, no solo trackea.** El usuario no llega a una pantalla en blanco a registrar: llega a "esto te toca hoy" + cómo hacerlo. Es la diferencia entre una hoja de cálculo y un coach.
2. **Flexibilidad con estructura.** Cambiar comida / ejercicio / día / lugar sin romper metas ni progresión ("Cambiar" y "Adaptar hoy"). Los planes rígidos mueren aquí; Fitbros sobrevive al imprevisto.
3. **Explicación antes que prescripción.** Para principiantes, el reproductor con técnica/respiración/errores/seguridad es un foso que los trackers no tienen.
4. **Tecnología invisible + IA validada.** El usuario habla de "su coach", nunca ve IA/prompts; y el sistema **valida con reglas deterministas** (macros, alergias, progresión) antes de guardar, así no inventa números ni rompe restricciones. Confianza por diseño.

**Lo que NO somos (y está bien):** no somos un tracker de calorías ultrarrápido (MFP gana ahí), ni un coach humano real (Future gana en accountability emocional). Somos el punto medio que no existía bien resuelto en español.

---

## 5. Panorama competitivo + benchmark de precios (2026)

| Competidor | Qué job hace | Precio 2026 | Relación con Fitbros |
|---|---|---|---|
| **Fitia** 🇵🇪 | Tracking nutricional + "coach" IA; DB revisada por nutricionistas, menús de restaurantes; +10M usuarios, 4.9★ | Freemium; premium accesible en LatAm; trial 3 días | **Competidor local #1.** Domina nutrición en español. *No hace entrenamiento guiado.* |
| **MacroFactor** | Tracking de macros + coach algorítmico de calorías | $11.99/mes · ~$5.99/mes anual ($71.99/año) | El más sofisticado en nutrición; ahora suma Workouts. Benchmark de calidad para Segmento A. |
| **MyFitnessPal** | Tracking de calorías (líder histórico) | Premium $19.99/mes ($79.99/año); Premium+ $24.99/mes | Masivo pero "te deja el trabajo". |
| **Yazio** | Tracking + ayuno intermitente | €6.99/mes (€83.88/año) | Fuerte en Europa/LatAm, español. |
| **Lifesum** | Hábitos y balance | Freemium premium | Más "wellness" que rendimiento. |
| **Fitbod** | Genera rutinas de fuerza | $9.99/mes ($79.99/año) | Solo entrenamiento, no nutrición. |
| **Future** | Coach humano 1:1 real | **$149–199/mes** | El "techo" de precio del coaching; no escala, en inglés. |
| Entrenador personal | Coaching presencial | $30–80/sesión en Perú | La alternativa offline de B. |

**Mapa de posicionamiento (mental):**
- Eje horizontal: *solo herramienta* → *decide y guía por ti.*
- Eje vertical: *solo nutrición* → *nutrición + entrenamiento integrados.*
- Los trackers viven abajo-izquierda. Future vive arriba-derecha pero a precio humano. **Fitbros apunta a arriba-derecha a precio de software** — esquina poco poblada en español. Fitia está fuerte en nutrición pero **no cubre el entrenamiento guiado**: ahí está tu aire.

**Implicación estratégica:** no compitas de frente con Fitia/MacroFactor en "tracking". Compite en **"coach integrado que decide y te enseña a ejecutar"**. Esa frase es tu posicionamiento.

---

## 6. Pricing y modelo de negocio

**Estado actual (del repo):** Plan mensual **US$14**, paquete 3 meses **US$36** (~15% ahorro), pago único por período (no auto-renovable), entitlement server-side + paywall contextual listos, **checkout de Stripe pendiente de activar** (REQ-26).

**Problema #1 — el precio es alto para tu mercado inicial.** US$14/mes te pone *por encima* de MacroFactor anual (~$6), Yazio (€7) y Fitbod ($10), y muy por encima de la expectativa LatAm. La investigación de mercado es clara: en LatAm el poder adquisitivo es menor, **el freemium generoso funciona mejor que el paywall agresivo**, y hay que ofrecer **precio en moneda local + métodos locales** (Yape/Plin/Mercado Pago en Perú). Cobrar US$14 con tarjeta internacional es doble fricción.

**Problema #2 — no auto-renovable.** El pago único por período mata el LTV y la previsibilidad. Para un coach (uso diario, relación larga) la suscripción auto-renovable es el modelo natural; el pago único es más de "producto de campaña".

**Recomendaciones (a validar, no a asumir):**
- **Probar disposición a pagar antes de fijar precio.** El plan de validación incluye el test de willingness-to-pay (no preguntar "¿pagarías?", sino métodos que revelan el precio real).
- **Anclar al valor del coach humano, no al del tracker.** El mensaje: "tu coach por menos de lo que cuesta *una* sesión con un entrenador". Eso justifica el precio frente a B.
- **Considerar precio local diferenciado:** p. ej. un punto en soles + Yape, además del USD para el resto de LatAm.
- **Freemium con muro de valor, no de tiempo:** el "home agéntico" determinista (qué te toca hoy) es gratis y cuesta cero tokens; el coach que *genera/adapta* es lo premium. Eso ya está alineado con la dirección del repo (REQ-40/41/42) y protege tu costo de IA.
- **Migrar a auto-renovable** cuando actives checkout, con cancelación de un clic (refuerza el "sin permanencia").

> Decisión abierta clave (el repo la marca): **cuándo se entrega el primer valor.** Recomendado: registro → onboarding → **primer plan/día gratis (trial de valor real)** → paywall para seguir generando/adaptando. Confírmalo con la evidencia de validación.

---

## 7. Tamaño de mercado (aproximado)

Cifras de referencia (estimaciones de terceros, varían por metodología — úsalas como orden de magnitud, no como verdad):

- **TAM global apps fitness 2026:** ~US$9–14.6 mil millones según la firma (Statista ~$9.2B; otros $13.5–14.6B). El segmento **nutrición/dieta es el de más rápido crecimiento**, y la IA es la tendencia que reordena la categoría.
- **SAM (lo alcanzable para Fitbros):** apps de coaching de nutrición+fitness **en español**, principalmente LatAm + España, con uso de smartphone y disposición a una suscripción de bajo costo. Mercado hispanohablante grande y con menos producto de calidad que el anglosajón.
- **SOM realista (cabeza de playa, primeros 12–18 meses):** Perú + tu red extendida + LatAm hispanohablante por orgánico/referidos. No pienses en millones: piensa en **los primeros 100 usuarios que pagan y retienen**. Si consigues 100–300 suscriptores que renuevan, tienes un negocio real y señal de PMF; de ahí se escala.

> Ojo con Fitia: que una peruana llegue a +10M usuarios **prueba que el mercado existe y paga**. Es validación de categoría a tu favor. Tu trabajo es ganar el sub-nicho que ella no cubre (entrenamiento guiado integrado).

---

## 8. Supuestos críticos (lo que puede matar el negocio)

Ordenados por riesgo. El plan de validación ataca los de arriba primero.

1. **Demanda real:** el dolor "no sé qué hacer hoy / mi plan se rompe" es lo bastante fuerte como para uso diario. *(Hoy: 0 evidencia externa.)*
2. **Diferenciación percibida:** la gente nota y valora la diferencia vs. un tracker gratis o vs. Fitia. *(Hoy: no probado.)*
3. **Activación:** un usuario nuevo llega a su primer "qué hacer hoy" útil **sin frustrarse** en el onboarding. *(Riesgo alto: el repo mismo advierte que llevar tráfico a un "primer día vacío" rompe la promesa.)*
4. **Retención:** la gente vuelve día tras día y semana tras semana (north star: adherencia).
5. **Disposición a pagar al precio correcto** y en moneda/método local.
6. **Costo de IA sostenible** por usuario activo (ya hay guardarraíles; validar con uso real).
7. **Confianza:** que el coach no diga una tontería que rompa la credibilidad (las reglas deterministas mitigan, pero hay que verlo en vivo).

---

## 9. Métricas que importan

- **North Star — Adherencia:** % de comidas registradas y entrenos completados por semana por usuario activo. Es la métrica que predice retención y valor entregado (y ya está en la dirección del repo).
- **Activación (la puerta):** % de nuevos que completan onboarding **y** llegan a su primer plan/día útil **y** registran su primera acción. El repo ya puede medir embudo (`product_events`, vista `v_activation_funnel`).
- **Retención:** D1 / D7 / D30 y retención semanal de cohortes. Para un coach, la W4 (siguen a las 4 semanas) es la señal de oro.
- **Económicas (post-cobro):** conversión trial→pago, churn mensual, LTV, CAC, y **costo de IA por usuario activo** como guardarraíl (no debe subir; el home determinista cuesta 0 tokens).
- **Cualitativa:** "¿qué tan decepcionado estarías si Fitbros desapareciera?" (test de Sean Ellis: **>40% "muy decepcionado" = señal de PMF**). Es la métrica estrella del plan de validación.

---

### Siguiente paso
Esto es el "norte". Lo accionable ahora es **`01-Plan-de-Validacion.md`**: cómo convertir estos supuestos en pruebas concretas contigo (Cliente 0) y con tus amigos, antes de invertir un peso en adquisición.
