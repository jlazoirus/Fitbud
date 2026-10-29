# REQ-300 — Compartir la racha y compararla con amigos

Jonathan eligió comparar la **racha actual**, sin retos semanales. En Hoy, el botón «Racha N» lleva a Progreso → Rachas con amigos. También se puede compartir desde Rachas e hitos.

## Recorrido

«Compartir mi racha» abre el selector del dispositivo con el número real calculado por `streak()`. Sin selector, copia el texto; si el portapapeles está bloqueado, ofrece un campo seleccionable. Cancelar no anuncia éxito. Compartir este texto no activa la comparación.

Para comparar, cada participante elige un alias (2–24 caracteres) y activa voluntariamente la función. Antes de activar, la pantalla explica los tres pasos (alias → enlace → tu amigo acepta) y propone el primer nombre del perfil como alias. Una vez activada, dice con qué alias te ven (REQ-302). No hay buscador de usuarios ni invitación por correo. «Crear invitación» prepara un enlace para un solo amigo, válido por 7 días. Un nuevo enlace cancela el anterior. El usuario decide dónde compartirlo; la app no envía mensajes automáticamente.

El destinatario inicia sesión o se registra, completa el onboarding/privacidad habitual y acepta expresamente. Antes de aceptar solo puede ver el alias del invitante, nunca sus días ni su progreso. La invitación se conserva durante la autenticación y el correo de confirmación. Una invitación de amistad no concede acceso beta ni cambia los requisitos de registro o de pago existentes.

La clasificación muestra a la persona y sus amistades aceptadas, por racha combinada actual descendente. Usa `rank()`: dos rachas iguales comparten posición y la siguiente posición salta, por ejemplo 1, 1, 3. Los descansos, rescates y ciclos mantienen las reglas actuales. Se puede quitar una amistad o desactivar la función; la baja elimina amistades e invitaciones, sin reactivarlas al volver.

## Datos y límites

`js/streak-friends.js` integra el shell sin framework nuevo. Sincroniza el resumen mínimo `{count, through, timezone}` con el cálculo existente al iniciar, registrar, recuperar conexión y volver a primer plano. Espera a que no haya `day_log` pendiente/fallido/en conflicto en la cola. Si faltan datos por subir, muestra la clasificación guardada con un aviso; cada fila incluye su última actualización. El ranking no se persiste en almacenamiento del navegador. Cerrar sesión elimina invitaciones y estado social; respuestas tardías se descartan por identidad y secuencia de petición.

`supabase/streak_friends.sql` crea tres tablas con RLS y sin permisos REST directos: perfiles sociales, amistades canónicas y enlaces de invitación. La única RPC `streak_social` usa `auth.uid()`, exige cuenta activa, tiene `search_path` fijo y solo concede EXECUTE al rol authenticated. No abre políticas de `profiles`, `day_log` ni `notification_preferences`. No se envían rachas/amistades a analytics.

La proyección devuelve UUID interno para poder quitar la amistad, alias, días, posición, si es la propia cuenta y fecha de actualización. No devuelve salud, correo, nombre del perfil, planes ni contenido de registros. La fecha de vigencia se evalúa en el servidor con la zona de cada dueño: hoy pendiente conserva ayer; con un día vencido sin cumplir muestra cero incluso si el dueño nunca vuelve a abrir la app.

El resumen se calcula con los registros de la app, como la racha personal; el servidor valida rango, fecha y zona, pero no vuelve a ejecutar las reglas completas del plan para detectar manipulación del cliente. Esta comparación amistosa no ofrece premios ni un ranking público con garantías contra trampas.

## Activación en producción (manual)

1. Revisar y ejecutar `supabase/streak_friends.sql` en el SQL Editor de Supabase del proyecto de Evolv, después de `supabase/auth.sql`. Es transaccional e idempotente; no borra tablas existentes.
2. Verificar con dos cuentas activas: activar con alias, crear enlace, aceptar, actualizar, quitar y desactivar. Una tercera cuenta solo debe verse a sí misma.
3. Si PostgREST aún no descubre la RPC, recargar su esquema con `notify pgrst, 'reload schema';` y reintentar «Actualizar rachas».

Sin esta migración, compartir texto funciona y la comparación muestra «estará disponible pronto». No se ejecutó SQL de producción durante la implementación.

Recuperación: revocar `execute on function public.streak_social(text,jsonb) from authenticated`, deshabilitar los controles en el cliente y conservar las tablas. Restaurar el permiso tras corregir/reaplicar la función. Evitar borrar tablas para conservar datos; nunca reejecutar el `schema.sql` de instalación fresca como rollback.

## Verificación

- `node scripts/test-streak-friends.mjs`: PostgreSQL real en WASM con PGlite (dependencia solo de desarrollo), migración dos veces, roles/permisos, privacidad por defecto, aceptación, tercera cuenta, caducidad, empates, zonas horarias, revocación y cuentas inactivas. Sin red ni Supabase real.
- `tests/e2e/rachas-amigos.spec.js`: navegador real con transporte de la RPC conectado a la misma migración PostgreSQL local. Compartir, copiar, cancelar, activar, invitar, aceptar, sincronizar, eliminar, desactivar, error/reintento y logout con respuesta tardía.
- Regresiones de racha, Progreso y suite completa mediante `node scripts/release-gate.mjs`. El gate incluye el test PostgreSQL y sintaxis del nuevo módulo.
