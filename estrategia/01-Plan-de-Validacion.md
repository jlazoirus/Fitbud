# 01 · Plan de Validación — Fitbros

> El documento más importante ahora mismo. Convierte los supuestos de `00-Estrategia-y-Producto.md` en pruebas concretas, contigo como **Cliente 0** y con tus amigos, **antes** de gastar en adquisición o redes.
> Filosofía: *primero probamos que el problema duele y que esta solución lo resuelve; recién después empujamos.*
> Horizonte: sin prisa, hacerlo bien. ~6–8 semanas de validación estructurada.

---

## 0. Las 3 reglas de oro (para no engañarte a ti mismo)

La validación con amigos falla casi siempre por lo mismo: **te dicen lo que quieres oír**. Tres reglas para que los datos sean reales:

1. **Pregunta por el pasado, no por el futuro.** "¿Pagarías por esto?" / "¿Te gusta la idea?" no valen nada (todos dicen que sí por cariño). Pregunta: *"¿Qué hiciste la última vez que intentaste ponerte en forma? ¿Qué app usaste? ¿Cuánto duraste? ¿Por qué la dejaste?"* El comportamiento real predice; las opiniones no.
2. **Separa "validar el problema" de "mostrar el producto".** Si enseñas Fitbros primero, contaminas todo: ya no sabrás si el problema existía o si solo les pareció linda tu app. **Primero entrevista el problema. Después, en otra sesión, das acceso.**
3. **Busca el dolor, no el halago.** Una validación exitosa puede terminar en "esto no le importa a nadie" — y eso es un **éxito** (te ahorró meses). El objetivo es *aprender la verdad*, no confirmar que tienes razón.

> Lectura de 1 hora que vale por todo esto: *The Mom Test* (Rob Fitzgerald). El principio: haz preguntas que ni tu mamá podría responder con una mentira piadosa.

---

## 1. Hipótesis críticas y criterios de éxito

Validamos en orden. No pasas a la siguiente hasta tener señal en la anterior.

| # | Hipótesis | Cómo se prueba | Señal de ÉXITO (umbral) |
|---|---|---|---|
| H1 · **Problema** | "No saber qué comer/entrenar hoy y que el plan se rompa" es un dolor real y frecuente | Entrevistas de problema (Fase B1) | ≥ 60% de entrevistados describe el dolor **sin que tú lo sugieras** y cuenta un intento fallido reciente |
| H2 · **Solución/Activación** | Un usuario nuevo llega a su primer "qué hacer hoy" útil sin frustrarse | Prueba de usabilidad observada (Fase B2) | ≥ 70% completa el onboarding y llega al primer plan **sin ayuda**; tiempo < 10 min |
| H3 · **Valor percibido** | La gente nota y valora la diferencia vs. lo que ya usa | Encuesta post-uso + Sean Ellis (Fase B3) | ≥ 40% responde "**muy decepcionado**" si Fitbros desapareciera |
| H4 · **Retención** | La gente vuelve sola, día tras día | Uso real medido 2 semanas | ≥ 40% sigue activo en D7; ≥ 25% en D14 (cohorte beta) |
| H5 · **Disposición a pagar** | Pagarían, y a qué precio/método | Test de precio (Fase B4) | ≥ 30% da un paso de compromiso real (deja tarjeta / paga simbólico / "sí, a X soles") |
| H6 · **Segmento ganador** | A (comprometidos) vs. B (principiantes): ¿dónde pega más fuerte? | Comparar H1–H5 por segmento | Un segmento supera claramente los umbrales → cabeza de playa |

---

## 2. FASE A — Cliente 0 (tú, Jona) · semanas 1–8 en paralelo

Eres el dogfooding más honesto que tienes. Objetivo: **usar Fitbros como tu único sistema** durante todo tu ciclo (tu plan de 10 semanas ya está cargado) y cazar cada fricción.

### Protocolo
- **Compromiso:** durante ≥ 4 semanas, Fitbros es tu **única** herramienta. Nada de Excel paralelo ni notas aparte. Si te dan ganas de salir de la app para resolver algo, **eso es un hallazgo** (anótalo).
- **Registro diario (2 min al final del día):** abre el diario (`Diario-Cliente0.md`) y anota:
  - ¿Registré todas mis comidas y mi entreno **dentro** de la app? (sí/parcial/no + por qué)
  - ¿En qué momento quise salirme de la app o me frustré? (fricción)
  - ¿Qué me hizo sentir "esto sí me sirve"? (momento de valor)
  - ¿La adaptación/contingencia funcionó cuando la vida se metió? (comí fuera, falté, etc.)
- **Revisión semanal (15 min):** relee la semana, marca los 3 problemas más graves y los 3 mejores momentos. ¿Harías el check-in semanal? ¿El plan se sintió "vivo" o rígido?

### Qué estás cazando
- **Bugs y callejones sin salida** que romperían a un usuario menos paciente (tú perdonas; un extraño no).
- **El "primer día vacío"**: ¿tu home te dice qué hacer apenas entras, o te deja en blanco?
- **Momentos de abandono**: ¿dónde *tú* —que lo construiste— sentirías ganas de no abrir la app?
- **El costo real de la fricción de registro**: si a ti te da pereza registrar, a otros más.

> Si **tú mismo** te sales de la app para resolver tu dieta/entreno, **detente y arregla eso antes de meter amigos.** Es la señal más barata y más valiosa que tendrás.

---

## 3. FASE B — Validación con amigos

### B0 · Reclutamiento (semana 1–2)

- **A cuántos:** 10–15 personas. Mínimo 5 por segmento (5 "comprometidos" + 5 "principiantes") para poder comparar.
- **A quiénes:** amigos/conocidos que **de verdad** encajen en A o B y tengan el dolor — no los que solo quieren apoyarte. Pide que cada uno te pase 1 contacto que NO te conozca (oro puro: feedback sin sesgo de cariño).
- **Cómo invitar (WhatsApp, sin vender):**

  > *"Oye, estoy armando algo para gente que quiere [bajar grasa / entrenar mejor / comer bien sin volverse loca]. Antes de mostrarte nada, ¿te puedo hacer 15 min de preguntas sobre cómo lo manejas hoy? No te voy a vender nada, necesito entender el problema de verdad. ¿Te late?"*

- **Clasifica a cada uno** como A o B al invitar (lo confirmas en la entrevista). Lleva una lista simple: nombre, segmento, fecha entrevista, fecha acceso, estado.

### B1 · Entrevista de PROBLEMA (15–20 min, **antes** de mostrar la app)

Objetivo: probar **H1** sin contaminar. Graba (con permiso) o toma notas. **Habla 20%, escucha 80%.** No menciones Fitbros hasta el final.

**Guion:**
1. *Cuéntame, ¿cómo manejas hoy tu alimentación y entrenamiento?* (deja que divague)
2. *¿Cuándo fue la última vez que intentaste ponerte en forma o hacer una dieta en serio? ¿Qué hiciste exactamente?*
3. *¿Qué apps o métodos usaste? ¿Cuánto duraste con cada uno? ¿Por qué lo dejaste?* (busca el patrón de abandono)
4. *Cuando estás en eso, ¿qué es lo más frustrante? Cuéntame la última vez que te pasó.* (busca el dolor concreto, no genérico)
5. *¿Qué haces cuando se te complica la vida — comes fuera, falta un ingrediente, te pierdes el gym? ¿Qué pasa con tu plan ahí?*
6. *¿Cuánto tiempo/plata/energía has invertido en resolver esto? (entrenadores, apps, suplementos, planes)*
7. *Si una varita mágica te resolviera UNA cosa de todo esto, ¿cuál sería?*
8. *(Recién al final)* *Estoy construyendo algo para esto. ¿Te puedo dar acceso y que lo pruebes una semana? Te escribo.*

**Qué anotar:** ¿describió el dolor solo? ¿tiene intentos fallidos reales? ¿ya gasta dinero/tiempo en esto (= problema caro = bueno)? ¿o todo es tibio ("sí, estaría bueno")?

🚩 **Bandera roja:** si la mayoría responde tibio, sin intentos reales y sin frustración concreta → el problema no duele lo suficiente para *ese* segmento. Es un hallazgo enorme. Pivota de segmento o de problema antes de seguir.

### B2 · Prueba de usabilidad observada (20–30 min, 1:1)

Objetivo: probar **H2 (activación)**. Dale acceso **delante de ti** (presencial o videollamada con pantalla compartida) y **observa en silencio**. No ayudes salvo que se bloquee del todo.

**Tareas a pedir (sin explicar cómo):**
1. "Crea tu cuenta y configura tu perfil." → ¿completa el onboarding? ¿dónde duda?
2. "Muéstrame qué tienes que comer y entrenar hoy." → ¿llega al primer valor? ¿lo entiende?
3. "Registra que comiste algo." → ¿encuentra cómo? ¿fricción?
4. "Hoy no puedes ir al gym / no tienes un ingrediente. Resuélvelo en la app." → ¿descubre 'Adaptar hoy' / 'Cambiar'?
5. "¿Qué crees que hace esta app? ¿Para quién es?" → ¿entiende la propuesta?

**Métrica clave:** *Time-to-first-value* (cuánto tarda en llegar a "esto me sirve") y **tasa de finalización sin ayuda**. Anota cada punto donde casi abandona — esos son tus bugs de activación prioritarios.

### B3 · Uso real (1–2 semanas) + encuesta

Déjalos usar Fitbros solos 1–2 semanas. Mide el uso real (Fase 4 abajo). Al final, encuesta corta (Google Forms / Tally). **Preguntas que importan:**

- **Sean Ellis (la estrella):** *¿Cómo te sentirías si ya no pudieras usar Fitbros?* → (a) Muy decepcionado / (b) Algo decepcionado / (c) No me importaría / (d) Ya no lo uso. → **≥40% "muy decepcionado" = señal de PMF.**
- *¿Qué es lo que más te gustó? ¿Y lo que más te frustró?* (abierta)
- *¿A quién se lo recomendarías y por qué?* (revela el segmento y el caso de uso real)
- *¿Qué usabas antes para esto? ¿Fitbros lo reemplaza?*
- *Del 0 al 10, ¿qué tan probable es que lo recomiendes?* (NPS)
- *¿Qué le falta para que sea un "sí, esto lo uso siempre"?*

### B4 · Test de disposición a pagar (H5) — sin preguntar "¿pagarías?"

Las palabras mienten; los compromisos no. Opciones, de menor a mayor señal:

- **Precio anclado:** *"Va a costar [X] al mes, menos que una sola sesión con un entrenador. ¿Te parece caro, justo o barato?"* (técnica Van Westendorp: pregunta a qué precio sería "demasiado caro" y a qué precio "tan barato que dudarías de la calidad").
- **Pre-venta simbólica:** *"Si reservas hoy con S/ X (o US$ X) tienes 3 meses con descuento de fundador."* — que pongan plata (aunque sea poca) es la validación más fuerte.
- **Lista de espera con tarjeta:** dejar método de pago para "acceso founder" sin cobro inmediato.
- **Mide el método:** ¿prefieren Yape/Plin, Mercado Pago, tarjeta? (define cómo cobrarás luego).

🚩 Si todos dicen "buenísimo" pero **nadie** da un paso de compromiso → tienes un *vitamina*, no un *analgésico*. Reabre H1.

---

## 4. Tablero de métricas (qué medir y dónde)

El repo **ya instrumenta el embudo** (`product_events`, vistas `v_activation_funnel` y `v_ai_cost_summary`, endpoint `/api/analytics`). Úsalo en vez de adivinar. Tablero mínimo de la beta:

| Métrica | Definición | Meta beta | Fuente |
|---|---|---|---|
| Activación | % que termina onboarding **y** llega al primer plan **y** registra 1 acción | ≥ 70% | `v_activation_funnel` |
| Time-to-value | minutos de registro → primer "qué hacer hoy" | < 10 min | observación B2 + eventos |
| Adherencia (north star) | % comidas+entrenos registrados / semana | ≥ 50% | `day_log` |
| Retención D7 / D14 | % activos a los 7 / 14 días | 40% / 25% | eventos |
| PMF (Sean Ellis) | % "muy decepcionado" | ≥ 40% | encuesta |
| Costo IA / usuario activo | guardarraíl, no debe dispararse | estable | `v_ai_cost_summary` |
| Disposición a pagar | % con paso de compromiso real | ≥ 30% | test B4 |

> Si no quieres mirar SQL, dime y te armo un **tablero (artifact) en vivo** que lea estas métricas y lo revisas cada mañana.

---

## 5. Criterios de decisión — GO / ITERAR / PIVOT

Al cerrar la beta (≈ semana 8), junta los resultados por segmento y decide **con datos, no con ganas**:

- **GO (construir hacia el lanzamiento):** H1≥60%, H2≥70%, H3≥40% "muy decepcionado", retención D14≥25%, y ≥1 segmento con disposición a pagar ≥30%. → Activa checkout, define cabeza de playa, pasa a `02-Adquisicion.md`.
- **ITERAR (la base existe, falta pulir):** problema validado (H1 ok) pero activación o retención flojas. → Arregla las fricciones top-3, vuelve a correr B2/B3 con un grupo nuevo. *(Lo más probable para una v1.)*
- **PIVOT (replantear):** H1 no se sostiene en ningún segmento, o nadie da paso de compromiso. → El problema no duele como creías o el segmento es el equivocado. Cambia segmento o reenfoca el job antes de invertir más.

Decide además: **¿A o B como cabeza de playa?** El que supere los umbrales con más holgura gana el foco, el mensaje y el roadmap. El otro queda para después.

---

## 6. Calendario sugerido (sin prisa, ~8 semanas)

| Semana | Cliente 0 (tú) | Amigos |
|---|---|---|
| 1 | Empiezas dogfooding + diario | Reclutas (10–15), agendas entrevistas |
| 2 | Sigues; 1ª revisión semanal | **B1: entrevistas de problema** (H1) |
| 3 | Sigues; arreglas tu fricción #1 | Analizas H1 → ¿seguimos? Arreglas bugs de activación |
| 4 | Revisión; ¿harías el check-in? | **B2: pruebas de usabilidad** (H2) |
| 5 | — | Das acceso para uso real (inicia ventana de 2 sem) |
| 6 | Cierras tu ciclo de dogfooding | Uso real (mides retención/adherencia) |
| 7 | Sintetizas tus hallazgos | **B3: encuesta** (H3) + **B4: test de precio** (H5) |
| 8 | — | Consolidas tablero, decides GO/ITERAR/PIVOT y cabeza de playa |

---

## 7. Errores a evitar

- **Validar con puro amigo complaciente.** Mete al menos 3–4 personas que no te quieran tanto.
- **Mostrar el producto antes de entender el problema.** Mata la objetividad.
- **Confundir cumplidos con tracción.** "Qué buena idea" no es un dato; "tomé mi tarjeta" sí.
- **Construir features nuevas durante la beta.** Estás *aprendiendo*, no *agregando*. Solo arregla lo que impide validar.
- **Promediar A y B.** Sepáralos siempre; las conclusiones cambian por segmento.
- **Saltar a redes/ads sin GO.** Llevar tráfico a un producto no validado quema dinero y reputación.

---

### Siguiente paso
Cuando tengas **GO**, recién ahí abres `02-Adquisicion.md` y `03-Redes-Sociales.md`. Hasta entonces, esos dos documentos son para *leer y preparar*, no para ejecutar.
