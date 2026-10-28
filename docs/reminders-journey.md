# Journey de recordatorios y racha

Diseño del 2026-10-26 (pedido de Jonathan). Implementación: REQ-283 (animación de racha), REQ-284 (regreso dentro de la app) y REQ-285 (recordatorios por correo y push). La verdad final es el código: `planReminder()` en `api/notify.js` y las funciones `streakFeedback*`/`returnCard*` de `index.html`.

## Punto de partida (antes de este diseño)

- Un solo mensaje: a la hora elegida (17–23), si **hoy** tenía algo sin marcar, un correo por tipo (comidas y entreno: hasta dos correos) y un push "Tu racha te espera".
- "Pendiente" salía de la fila de hoy en `day_log`. Quien no abrió la app hoy no tiene fila, así que **no recibía nada**: justo el caso en que la racha está en riesgo. REQ-282 lo cubrió con un correo genérico ("Tu plan de hoy te espera"); el journey lo integra con la racha.
- Quien dejó la app con una semana ya preparada recibía el mismo correo de "comidas pendientes" **todos los días**, sin importar si llevaba dos días o tres semanas fuera.
- Nadie que se fue recibía algo sobre su progreso u objetivo; no había un final: o spam diario o silencio.
- Los enlaces `/?date=` de los correos y del push no se leían en la app.
- La racha cambiaba en silencio: cerrar el día no tenía ninguna respuesta visible fuera de un toast en los hitos.

## Principios

1. **Un mensaje por día y canal**, salvo la "última llamada" de racha (solo push). Nunca dos correos el mismo día.
2. **El mensaje depende de cuánto tiempo lleva fuera**, no de una regla fija: el que vino ayer necesita "te falta X"; el que lleva tres semanas necesita "esto ya lo lograste".
3. **Sin culpa.** La racha se reinicia, el progreso no. Los descansos planificados no cuentan como fallo (REQ-23).
4. **Hay un final.** Tras 30 días sin registrar se envía un último mensaje y se guarda silencio hasta que la persona vuelve.
5. **Privacidad (REQ-24/38):** sin peso, grasa, fotos ni datos de salud en ningún mensaje. En el push (visible en la pantalla bloqueada) tampoco va el objetivo; solo "tu objetivo" y la semana del plan. El objetivo con nombre va dentro del correo, nunca en el asunto.
6. **Tecnología invisible (REQ-31):** se habla de plan, racha y coach.
7. **Mismo lenguaje dentro y fuera de la app:** lo que dice el aviso es lo que la persona encuentra al abrir (tarjeta de regreso en Hoy, día correcto abierto, animación al registrar).

## Señales

Todas en la zona horaria del usuario (`notification_preferences.timezone`).

| Señal | Qué es | De dónde sale |
|---|---|---|
| `lastActive` | Último día con algo registrado (comida o extra marcada, entreno con series, sesión cerrada o actividad manual) | `day_log` de los últimos 60 días (servidor) |
| `gap` | Días entre hoy y `lastActive`; sin ningún registro, desde el inicio del plan | Calculado |
| `streak`, `streakThrough`, `rescueDate`/`rescueStreak` | Racha combinada viva, último día que cuenta y racha que se recupera si se completa ayer | `notification_preferences.engagement`, que la app escribe al cambiar (columna propia: no reescribe `profiles.prefs`) |
| `bestStreak`, `activeDays`, `workouts` | Progreso del ciclo para los mensajes de regreso | `notification_preferences.engagement` (o conteo en `day_log` si falta) |
| Objetivo, semana del plan | Mensajes de regreso | `profiles.prefs` (`goal`, `planStartDate`, `planDurationWeeks`); semana = días desde el inicio / 7 + 1 |
| Pendiente de hoy | Comidas sin marcar / entreno sin cerrar (no en descanso) | Fila de hoy en `day_log` |

## Etapas

| Etapa | Cuándo | Canal | Mensaje (push) | Abre |
|---|---|---|---|---|
| **Día en juego** | `gap` ≤ 1, hoy sin cumplir. También si hoy aún no abrió la app | correo + push, a la hora elegida | "Tu racha de 5 días sigue en juego · Falta registrar tus comidas y tu entreno para sumar el día 6." Sin racha: "Tu plan de hoy te espera · … Hoy puede empezar tu racha." | Hoy |
| **Rescate de ayer** | Ayer quedó sin cumplir y hasta anteayer había racha de 2+ días (ventana de corrección de REQ-23: solo ayer) | correo + push, en lugar del anterior | "Ayer quedó sin registrar · Si lo cumpliste, regístralo y tu racha de 5 días sigue." | El día de ayer |
| **Última llamada** | Racha de 3+ días, hoy sin cumplir, ya se envió el aviso del día | solo push, a las 21:00 o dos horas después de la hora elegida (nunca después de las 22:00) | "Quedan pocas horas · Registra lo de hoy y tu racha de 5 días sigue." | Hoy |
| **Regreso, 2–3 días** | `gap` 2–3 | correo + push | "Tu racha se reinició, tu progreso no · Llevas 18 días registrados y 9 entrenos en este plan." | Hoy, con tarjeta de regreso |
| **Regreso, 5–6 días** | `gap` 5–6 | correo + push | "Tu objetivo sigue en pie · Vas en la semana 4 de 10 de tu plan." (el correo nombra el objetivo) | Hoy |
| **Regreso, 1 semana** | `gap` 7–13 | correo + push | "Una semana sin registrar · Retoma donde ibas o empieza de nuevo desde la semana 1. Tu historial se conserva." | Hoy (tarjeta "Retomar / Empezar de nuevo" de REQ-214 desde los 14 días sin entrenar) |
| **Regreso, 2 semanas** | `gap` 14–29 | correo + push | "Mira lo que ya lograste · Mejor racha: 12 días · 9 entrenos · 18 días registrados." | Hoy |
| **Último mensaje** | `gap` 30–45 | correo + push | "Aquí sigue tu plan · Tu progreso está guardado. Es nuestro último recordatorio hasta que vuelvas." | Hoy |
| **Silencio** | `gap` > 45, o tras el último mensaje | — | — | — |
| **Volver a entrenar** (REQ-295) | Registra (`gap` ≤ 1) pero lleva 4–10 o 11–30 días sin entrenar, con al menos 2 días que tocaba entrenar en la pausa (los descansos no cuentan), y hoy toca entrenar | correo + push, a la hora elegida, en lugar del aviso del día | "¿Retomamos el entreno? · Llevas 5 días sin entrenar. Hoy te toca: si vas justo de tiempo, la versión de 20 minutos también cuenta." | Hoy |

Notas:

- Cada etapa de regreso se envía **una vez por ausencia**: la clave de idempotencia lleva `lastActive` (`<usuario>:comeback_7:<lastActive>`). Si la persona vuelve y se va otra vez, empieza una ausencia nueva.
- Las etapas son ventanas: si el día exacto cae en un día deshabilitado, sale el siguiente día habilitado dentro de la ventana. Nunca se envía una etapa ya superada.
- Quien nunca registró nada recibe la variante de activación: "Tu plan está listo · Aún no registras tu primer día. Empieza con una comida: ahí arranca tu racha."
- Con el plan terminado, los mensajes no mencionan semanas y proponen empezar un ciclo nuevo.
- El aviso del día no sale si la racha de hoy ya está asegurada (`streakThrough` = hoy), aunque queden comidas sin marcar.

## Dentro de la app

### Animación de racha (REQ-283)

Cada registro que mueve el día hacia la racha (marcar una comida, cerrar el entreno, convertirlo en descanso, registrar ayer) muestra una píldora arriba de la pantalla, desde cualquier pestaña:

- **Avance:** llama con el número de racha, el contorno se llena en proporción a lo cumplido hoy y la pieza recién hecha se enciende. Texto: "Falta 1 comida y el entreno para sumar el día 6".
- **Día sumado:** la llama termina de llenarse y el número sube (5 → 6). "Día 6 sumado. Tu racha está a salvo hoy." Si es el primer día: "Día 1. Empezó tu racha." En 3, 7, 14 y 30: "7 días seguidos: nuevo hito."
- **Racha recuperada:** al completar ayer dentro de la ventana de corrección, el número sube de 0 a la racha recuperada.
- Desmarcar no anima nada. Los cambios que llegan de otro dispositivo tampoco.
- Con "reducir movimiento" no hay desplazamientos: el número y la llama cambian con un fundido.

### Tarjetas de regreso en Hoy (REQ-284)

- **Rescate de ayer** (la misma condición que el aviso): "Ayer quedó sin registrar. Si lo cumpliste, regístralo y tu racha de 5 días sigue." Botones "Registrar ayer" y "Empezar hoy" (descarta la tarjeta en este dispositivo).
- **Bienvenida** (2+ días sin registrar): resume el progreso del ciclo, el objetivo y la semana del plan. Desaparece al registrar lo primero de hoy o al descartarla. Si corresponde la tarjeta "Retomar / Empezar de nuevo" (14+ días sin entrenar, REQ-214), esa ocupa su lugar.
- Los enlaces de los avisos (`/?date=AAAA-MM-DD&r=<etapa>`) abren ese día y registran `reminder_opened` con la etapa (sin datos personales) para medir qué etapa trae de vuelta.

### Instalar y activar avisos (REQ-289)

- Al terminar el onboarding, con la semana lista: pantalla "Tu semana está lista. Que no se te pase." con dos pasos, instalar Evolv en el inicio (solo móvil) y activar avisos. En iPhone el push solo existe en la app instalada: primero instalar; al abrirla desde el ícono, Hoy pide activarlos. Si el navegador no permite avisos o están bloqueados, se ofrece el correo.
- Mientras los avisos no estén activos, Hoy lo recuerda **cada día** con una tarjeta; "Ahora no" la oculta hasta mañana. Medición: `notifications_prompt` (`source`, `action`).

## Preferencias

En Perfil → Recordatorios y Avisos del dispositivo, el texto explica lo que llega: el aviso del día, la última llamada si la racha es de 3+ días y los mensajes de regreso con su final. La baja de un clic del correo y desactivar el aviso del dispositivo cortan todo el journey de ese canal.

## Medición

- `notification_log`: una fila por envío con su etapa (`notification_type`) y clave idempotente.
- `reminder_opened` (analytics) con `step` = etapa: tasa de apertura por etapa.
- Retorno: `session_start` en las 48 h siguientes a un envío de regreso.

## Operación

- Migración `supabase/notifications_journey.sql` (aplicada en producción el 2026-10-26): agrega `notification_preferences.engagement` y amplía el `CHECK` de `notification_log.notification_type` con `comeback`, `push_comeback` y `push_last_call`. Mientras no se aplique, esas etapas no se envían (el envío exige registrar antes el intento) y el aviso del día sale sin racha ni rescate.
- Cada envío lee y registra su intento antes de enviar; si no puede (registro caído o tipo rechazado), no envía: sin registro, el disparo de la hora siguiente lo repetiría.
- Las variables y el disparo horario son los de REQ-24/38/266/267.
