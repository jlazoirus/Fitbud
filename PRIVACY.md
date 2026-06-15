# Privacidad, consentimiento y seguridad de Fitbros

**Version operativa:** 2026-06-15
**Estado legal:** texto preliminar. Requiere revision profesional antes de un lanzamiento comercial.

## Alcance

Fitbros es una herramienta de bienestar. No diagnostica enfermedades, no prescribe tratamientos y no reemplaza a un medico, nutricionista, fisioterapeuta u otro profesional de salud.

La edad minima operativa es **18 anos**. No se habilitan cuentas de menores hasta definir el tratamiento legal y los consentimientos correspondientes.

## Consentimientos separados

Fitbros registra por usuario, tipo y version:

- tratamiento de datos corporales y de progreso;
- recomendaciones automatizadas del coach;
- almacenamiento de fotos privadas;
- correos de seguimiento;
- correos de marketing.

Los dos primeros son necesarios para crear y adaptar un plan. Fotos y correos son opcionales. Retirar correos o fotos no cancela la cuenta. Una nueva version de esta politica exige una nueva aceptacion de los consentimientos obligatorios.

## Aptitud y senales de alerta

Antes de habilitar entrenamiento se pregunta por dolor de pecho, mareo o desmayo, indicacion profesional de limitar ejercicio y lesion o dolor agudo actual. Cualquier respuesta positiva bloquea las rutinas y pide una evaluacion profesional. Durante el ejercicio se indica detenerse ante dolor, mareo, falta de aire inusual, desmayo u otro sintoma preocupante.

## Datos, fotos y acceso

Los datos personales se aislan por usuario mediante RLS. Las fotos se guardan en un bucket privado bajo la carpeta del usuario y se muestran mediante URLs firmadas de una hora. Las claves privilegiadas solo existen en funciones server-side.

La exportacion genera un JSON legible con perfil, progreso, planes, ciclos, consentimientos y evaluaciones. Las fotos se enumeran como metadatos privados; no se publican enlaces permanentes.

## Retencion y borrado

- Mientras la cuenta exista, se conserva el historial para que el usuario pueda consultar y exportar su progreso, incluso si deja de tener un plan activo.
- Al borrar la cuenta, Fitbros elimina primero las fotos del almacenamiento activo y luego la cuenta de Auth; las tablas personales se eliminan por cascada.
- Los logs de aplicacion no deben contener fotos, alergias, notas de salud ni prompts completos.
- Los respaldos gestionados por proveedores deben configurarse para expirar en un maximo operativo de 30 dias. Este plazo y los contratos de los proveedores deben verificarse legalmente antes del lanzamiento comercial.
- Datos anonimizados solo pueden conservarse si ya no permiten identificar ni reconstruir a la persona.

## Procesamiento automatizado

El coach usa procesamiento automatizado para proponer opciones. Las restricciones duras se validan antes de guardar, los cambios del plan requieren confirmacion y las respuestas no deben diagnosticar ni recomendar entrenar ante senales de alerta.
