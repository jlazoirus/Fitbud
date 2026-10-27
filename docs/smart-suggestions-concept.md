# Sugerencias que ajustan tu plan

Fecha: 2026-10-27
Estado: dirección de producto y comunicación, no una especificación de implementación.

## Idea de Jonathan

Aprovechar las sugerencias del coach para ajustar alimentación y entrenamiento: mejores progresiones, ejercicios compatibles con la rutina y comidas que ayuden a llegar a los macros. Convertir esa capacidad en una propuesta de valor clara, con ejemplos de la vida diaria.

## Promesa

**Tu día cambia. Tu plan se adapta a ti.**

Evolv acompaña las decisiones pequeñas: qué ajustar en el entrenamiento, cómo adaptarlo al tiempo y equipo disponibles y qué comer para acercarse al objetivo del día. No prometer resultados garantizados ni una optimización clínica.

## Tres pilares

1. **Progresar con sentido.** Sugerir un siguiente paso adecuado a la experiencia y al desempeño registrado. Puede ser carga, repeticiones o una variante, sin sacrificar técnica ni recuperación.
2. **Entrenar en tu vida real.** Proponer ejercicios y sesiones según tiempo, lugar, equipo y nivel. Ajustar el plan en vez de exigir una semana perfecta.
3. **Comer con dirección.** Proponer platos y porciones compatibles con preferencias, restricciones y macros pendientes. Facilitar la siguiente comida sin convertirla en una regla rígida.

## Base observada en el repo

- `index.html`: `exerciseVariant()` y `setWorkoutVariation()` y helpers de variaciones alrededor de la sección REQ-241; existen variantes más fáciles, progresiones y casos en que progresar consiste en aumentar la carga.
- `index.html`: `coachActionContext()` reúne día, comidas y estado del entrenamiento; `buildSysPrompt()` aporta el perfil y las metas nutricionales al coach.
- `index.html`: `coachHardRestrictions()` y el contexto de seguridad limitan propuestas cuando existen restricciones o señales de alerta.
- `js/nutrition-domain.js`: tolerancias y validación nutricional del día, slots y sustituciones.

Esta base no confirma que todas las ideas de este documento estén implementadas como un flujo integrado. Antes de publicar una afirmación sobre una función concreta, verificar su recorrido real en la app. No crear capturas de funciones que no existan.

## Dirección de experiencia a explorar

- Mostrar qué se propone, por qué y qué cambia en el plan.
- Usar el contexto relevante y pedir el dato que falte; no inventar disponibilidad, carga o alimentos.
- Mantener la elección de la persona. Diferenciar una sugerencia de un ajuste aplicado.
- Conservar intacto el historial: ajustar lo que viene, no lo ya completado.
- Respetar alergias, restricciones, recuperación y señales de alerta. No diagnosticar ni prometer resultados físicos.
- Evitar falsa precisión en macros o progresiones cuando los datos no alcancen.

## Comunicación

Tono de coach cercano, claro y directo. Hablar de sugerencias, contexto y un plan que se adapta a ti. No mencionar IA, algoritmos ni tecnología en contenido público. Sin precios, beta, culpa, antes/después ni promesas de transformación rápida.

Tres territorios de contenido, cada uno en historia 1080x1920 y carrusel 1080x1350:

- **Tu siguiente paso cuenta:** progresión con sentido, no simplemente más peso.
- **Tu rutina no es de piedra:** adaptar ejercicios al día real.
- **Tus macros, en comida real:** platos y porciones que ayuden a completar el día.

Usar negro #101010, lima #D6FF3A, Manrope, Unbounded y assets oficiales. En historias, respetar zonas libres de 250 px arriba y 340 px abajo y reservar espacio para un sticker real. En carruseles, no repetir el logo en cada slide.

## Próximo paso

Revisar los contenidos como propuestas creativas, validar las funciones que se mostrarán y aprobar el copy antes de publicar. Este documento no activa implementaciones, cambios de código ni nuevas tareas automáticas.
