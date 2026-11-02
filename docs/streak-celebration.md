# REQ-304 — Celebrar cada día que suma a la racha

## Resultado

Cuando un registro local aumenta la racha real, se muestra una celebración destacada con los colores de Evolv: llama que termina de llenarse, un breve destello de trazos y contador que pasa del número anterior al nuevo. Ocurre también en días ordinarios, no solo en los hitos de 3, 7, 14 y 30 días. El mensaje reconoce la acción sin presión: «Este día lo sumaste tú. Sigue a tu ritmo.» Se conservan los mensajes específicos de primer día, hito y recuperación.

El avance parcial sigue usando el aviso pequeño. Una vez ganado el día, ese avance no sustituye a la celebración. La tarjeta se puede cerrar tocándola o con Enter al enfocarla; no roba el foco ni bloquea la pantalla. Ofrece al menos ocho segundos de lectura, con el temporizador detenido mientras tiene foco, está bajo el puntero o la app está oculta. El movimiento reducido conserva el número y un fundido breve, sin desplazamiento, escalado ni destello.

## Activación y consistencia

- El estado previo se prepara también en el modo conversación. La condición sigue siendo el aumento calculado por `streak()` después de `commitDay()`. No cambia qué registros cuentan para la racha ni el historial.
- Cada evento conserva usuario, inicio del ciclo, fecha y valor alcanzado. La cola muestra los incrementos en orden: recuperar ayer y completar hoy rápidamente produce dos celebraciones, sin que una borre a la otra.
- En segundo plano el evento espera. Al volver se verifica de nuevo que el día siga completo y que la racha alcance ese valor. Si se deshizo antes de verse, se descarta. Deshacer un registro retira el mensaje si invalida el valor que se está celebrando.
- Durante la instancia abierta se recuerda cada evento para evitar repetirlo al desmarcar y volver a marcar el mismo día. Los renders no disparan celebraciones. Recargar carga el estado como punto de partida y no reproduce logros anteriores.
- Salir borra observación, tarjeta, temporizadores, cola y eventos vistos. Los eventos de otra cuenta o ciclo nunca se muestran. La ruta de render sin sesión también limpia el componente.
- La cola y sus claves existen solo en memoria de esa instancia. No se añaden datos personales a analytics, almacenamiento persistente o tablas remotas. No cambia el comportamiento del guardado ni requiere SQL.

## Diseño y verificación

Se conserva el componente existente, la tipografía y la paleta. El estado ganado usa una superficie de acento, contador con números tabulares y espacio de lectura mayor; el parcial conserva su presentación discreta. El SVG y las animaciones CSS son acotados y no añaden dependencias ni sonido.

`tests/e2e/streak-celebration.spec.js` verifica días ordinarios (2, 4 y 8), estado y lectura accesible, orden de dos incrementos, espera al primer plano, cancelación de un evento deshecho, deduplicación y recarga, limpieza al salir, movimiento reducido, teclado y duración. `tests/e2e/racha-animacion.spec.js` conserva los recorridos originales de comidas, descanso, primer día y recuperación.

Revisión visual conjunta en 390 y 1280 px, pantalla de 320 px con contador de cuatro cifras y movimiento reducido: sin desbordamientos y contraste de texto verificado de al menos 4.5:1. La prueba visual temporal no se incorpora a la suite ni al deploy. El cache de PWA se incrementa a v175.
