# Plan ejecutable de mejoras para Evolv

**Actualizado el 24 de octubre de 2026.** Por instrucción del usuario, las entrevistas y el reclutamiento dejan de ser condiciones para avanzar. Este plan sustituye la propuesta inicial del 22 de octubre. El usuario autoriza identificar mejoras y crear requerimientos; las funcionalidades aún no están implementadas.

## Qué se decidió

Crear **nueve requerimientos pendientes, REQ-268 a REQ-276**, apoyados en documentación oficial de MyFitnessPal y pruebas actuales de Evolv. Primero resolver confianza y calidad del registro; después completar composición, sustitución y copia; finalmente alimentos/recetas propios y código de producto. No se propone rehacer toda la aplicación ni esperar un estudio de mercado.

- [Backlog detallado con alcance y casos por REQ](BACKLOG.md).
- [Fuentes oficiales actuales y verificación](FUENTES-VERIFICADAS.md).
- [Matriz actualizada de 48 dimensiones](matriz-actualizada-2026-10-24.csv).
- Ledger operativo: `REQUIREMENTS.md` en la raíz. Es la fuente de estado de cada REQ.

## Evidencia suficiente para elegir

Se leyeron 14 artículos de la ayuda oficial de MyFitnessPal, se ejecutaron seis E2E existentes de Evolv y tres probes nuevos en Chromium con fixtures. La base contrastada de Evolv es `62c7860`. No se inició sesión en MyFitnessPal ni se probó su app nativa; los recorridos de esa aplicación se reconstruyeron desde la documentación, sin afirmar tiempos de uso medidos.

La ayuda oficial confirma planificación y compras en Premium+, con límites de país/idioma, y creación de alimentos/recetas en Free. Copiar entre días y calcular recetas por rendimiento son referencias concretas. El estado actual de Evolv ya incluye recientes/favoritas/búsqueda de ingredientes, lista de compras persistida, reenvío de confirmación y última carga de fuerza. Se retiran como carencias nuevas.

## Paquetes y secuencia

| Paquete | REQ | Resultado verificable |
|---|---|---|
| A · Registro fiable | 268, 269 | No aplicar valores genéricos como estimación; rechazar datos inválidos y distinguir desconocidos |
| B · Registro explicable y editable | 270, 271 | Guardar procedencia/snapshot y poder corregir cada ingrediente/cantidad |
| C · Menos trabajo repetido | 272, 273 | Registrar como sustitución/adicional y copiar entre fechas sin duplicados ni consumo futuro |
| D · Comida real propia | 274, 275 | Crear alimentos desde etiqueta y recetas privadas con rendimiento/porciones |
| E · Acceso por producto | 276 | Identificar productos propios por GTIN; cámara solo donde haya soporte y alternativa manual completa |

Implementar en ese orden. Las dependencias exactas están en BACKLOG. Las estimaciones del plan anterior de 90 días no son un compromiso: el siguiente trabajo ya está decidido, y cada incremento se cierra por sus criterios de aceptación. El selector descubre REQ pendientes no listados; al integrarse en `main`, REQ-268 será el primero del paquete. Los agentes comparten el lock existente y no deben modificar el mismo editor simultáneamente.

## Decisiones técnicas que permiten empezar

- Reutilizar los datos y cálculos existentes. `profiles.prefs` puede alojar bibliotecas privadas limitadas siguiendo `savedMeals`; `day_log` conserva snapshots de consumo. No hace falta un proveedor nuevo ni una migración de producción para arrancar.
- No introducir framework, build o dependencia runtime nueva. Cámara progresiva usa capacidades existentes del navegador; si no están, código escrito y alta manual resuelven la tarea.
- El producto propio procede de una etiqueta introducida por el usuario, no de números inventados. GTIN identifica la ficha; no prueba calidad nutricional ni seguridad de alérgenos.
- Modificar una receta, alimento o plan no modifica el historial consumido. Copias generan identidades independientes y futuros pendientes.
- El nuevo registro conserva origen y supuestos realmente disponibles; los datos antiguos no se enriquecen por adivinación.
- Fuera de este paquete: catálogo comercial, OCR, lector universal para navegadores incompatibles, wearables/nativo, adaptación clínica automática, comunidad y cambios de precios. No bloquean estos nueve requerimientos.

## Verificación sin entrevistas

Cada entrega debe pasar sus casos deterministas y una tarea real en navegador con fixtures:

1. Cálculo esperado de cantidades/porciones, validación numérica y preservación de snapshots.
2. Abrir, guardar, volver a abrir y corregir desde móvil/escritorio; cantidad de acciones definida por tarea, sin inventar segundos de personas.
3. Dos cuentas, sesión cerrada, recarga, offline/reintento y conflicto de sincronización sin pérdida ni duplicados.
4. Entradas erróneas, cero explícito, desconocidos, fuente ausente y proveedor de estimación no disponible.
5. Compatibilidad de cámara/permiso con fallback manual. El test simulado no se presenta como prueba física de iOS.
6. Validadores afectados, E2E del caso, accesibilidad y coherencia de cache cuando se toque el shell.

El criterio para empezar es la especificación con evidencia, no conseguir participantes. Las pruebas garantizan el comportamiento comprobado; no demuestran demanda, retención o superioridad clínica. Métricas pasivas pueden observarse después si están disponibles, sin convertirse en una nueva dependencia humana ni enviar alimentos/fotos/salud a analytics.

## Primer trabajo concreto

Tomar **REQ-268**: evitar que «Estimar macros» aplique 500 kcal/25P/55C/20G genéricos si no existe una estimación compatible. El caso ya se reproduce con una respuesta de reutilización simulada. Debe conservarse el texto/valores escritos y explicar el fallo, manteniendo la reutilización válida del mismo contexto. Después se continúa con REQ-269.
