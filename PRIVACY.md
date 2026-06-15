# Privacidad, consentimiento y seguridad de Fitbros

**Version operativa:** 2026-06-15-v2
**Estado legal:** texto preliminar. Requiere revision profesional antes de un lanzamiento comercial.

## Alcance

Fitbros es una herramienta de bienestar. No diagnostica enfermedades, no prescribe tratamientos y no reemplaza a un medico, nutricionista, fisioterapeuta u otro profesional de salud.

La edad minima operativa es **18 anos**. No se habilitan cuentas de menores hasta definir el tratamiento legal y los consentimientos correspondientes.

## Consentimiento simple

La interfaz solicita como maximo dos permisos:

- un permiso necesario para usar datos corporales, preferencias y progreso con el unico fin de crear, adaptar y dar seguimiento al plan;
- un permiso opcional para guardar fotos de progreso personal y comparar el avance.

Para conservar una auditoria precisa, el permiso necesario se registra internamente en los propositos de datos corporales y recomendaciones del coach, aunque el usuario lo acepta mediante un solo check. Los permisos de correo y marketing no se solicitan en este flujo y quedan retirados. Una nueva version de esta politica exige una nueva aceptacion del permiso necesario.

Fitbros no vende los datos personales ni los usa para publicidad. Los datos se procesan para personalizar entrenamientos, alimentacion y seguimiento, o para mostrar el progreso solicitado por el usuario.

## Aptitud y senales de alerta

Antes de habilitar entrenamiento se pregunta por dolor de pecho, mareo o desmayo, indicacion profesional de limitar ejercicio y lesion o dolor agudo actual. Cualquier respuesta positiva bloquea las rutinas y pide una evaluacion profesional. Durante el ejercicio se indica detenerse ante dolor, mareo, falta de aire inusual, desmayo u otro sintoma preocupante.

## Datos, fotos y acceso

Los datos personales se aislan por usuario mediante RLS. Las fotos se guardan en un bucket privado bajo la carpeta del usuario y se muestran mediante URLs firmadas de una hora. Las claves privilegiadas solo existen en funciones server-side.

La exportacion genera un JSON legible con perfil, progreso, planes, ciclos, consentimientos, evaluaciones, historial de uso del coach y opciones personales guardadas. Las fotos se enumeran como metadatos privados; no se publican enlaces permanentes.

## Retencion y borrado

- Mientras la cuenta exista, se conserva el historial para que el usuario pueda consultar y exportar su progreso, incluso si deja de tener un plan activo.
- Al borrar la cuenta, Fitbros elimina primero las fotos del almacenamiento activo y luego la cuenta de Auth; las tablas personales se eliminan por cascada.
- Los logs de aplicacion no deben contener fotos, alergias, notas de salud ni prompts completos.
- Los respaldos gestionados por proveedores deben configurarse para expirar en un maximo operativo de 30 dias. Este plazo y los contratos de los proveedores deben verificarse legalmente antes del lanzamiento comercial.
- Datos anonimizados solo pueden conservarse si ya no permiten identificar ni reconstruir a la persona.

## Procesamiento automatizado

El coach usa procesamiento automatizado para proponer opciones. Cada accion se registra con un identificador idempotente y puede reutilizar una opcion privada compatible para controlar costos. Las restricciones duras se validan antes de guardar, los cambios del plan requieren confirmacion y las respuestas no deben diagnosticar ni recomendar entrenar ante senales de alerta.
