# Revisión de niveles del catálogo de ejercicios

Revisión: 2026-10-24. Cobertura conjunta: **71 ejercicios únicos**, con **35 principiantes, 32 intermedios y 4 avanzados**. El inventario distingue los **55 ejercicios empaquetados** en `exercise-catalog.js` (27 principiantes, 24 intermedios y 4 avanzados) de **16 ejercicios complementarios presentes en producción** (8 principiantes y 8 intermedios).

La lectura de producción encontró 67 ejercicios: 51 compartidos con el catálogo empaquetado y los 16 complementarios. Las tres caminatas (`walk-brisk`, `walk-easy`, `walk-mobility`) existen en el catálogo empaquetado y no figuraban en esa respuesta remota. Por tanto, 70 es la unión revisada, no el número de filas de producción ni una afirmación de que se hayan creado allí nuevos ejercicios.

## Criterio compartido

El nivel expresa la **habilidad mínima para ejecutar de forma independiente la variante exacta que nombra la ficha**, después de conocer su técnica. Se consideran el control del cuerpo y de las articulaciones, el equilibrio, la coordinación, la preparación del equipo y la fuerza previa necesaria para conservar la postura.

- **Principiante (`beginner`)**: ejecución básica con base estable, apoyo o resistencia fácilmente ajustable; permite aprender el patrón sin dominar primero otra variante exigente.
- **Intermedio (`intermediate`)**: requiere una base previa de fuerza o control, equilibrio unilateral, estabilización con menos apoyos o coordinación de una carga libre en un movimiento compuesto.
- **Avanzado (`advanced`)**: exige dominar la variante anterior y añade una demanda alta de fuerza, estabilidad, movilidad o control excéntrico.

La carga, las repeticiones y la duración se ajustan por separado. Una mancuerna ligera puede volver accesible un curl; reducir el peso no elimina la necesidad de aprender una bisagra o estabilizar una barra. El nivel tampoco es una medida de fatiga: una serie larga de un ejercicio principiante puede resultar muy intensa.

Se evalúa la variante indicada, no su regresión ni una progresión que trabaje el mismo músculo. Por ejemplo, una flexión inclinada es principiante; la flexión completa en el suelo exige una base mayor. En `step-up`, el nivel principiante corresponde a un escalón bajo y estable, sin carga, con apoyo disponible; un banco alto o mancuernas cambian esa demanda.

Estas etiquetas constituyen una **decisión de producto coherente para todo el catálogo**, informada por bibliotecas profesionales, no una equivalencia universal entre proveedores. ACE clasifica la [sentadilla trasera como avanzada](https://www.acefitness.org/resources/everyone/exercise-library/11/back-squat/) y el [peso muerto a una pierna sin equipo como avanzado](https://www.acefitness.org/resources/everyone/exercise-library/329/single-leg-romanian-deadlift/); aquí ambos se ubican en intermedio por sus prerrequisitos de control, reservando avanzado para las variantes de mayor exigencia del catálogo.

## Inventario de fuerza: 43 ejercicios

| Slug | Ejercicio | Nivel revisado | Razón y variante evaluada |
|---|---|---|---|
| `back-squat` | Sentadilla con barra | Intermedio | Requiere dominar la sentadilla, estabilizar la barra y mantener tronco y rodillas alineados durante la salida y el retorno al rack. |
| `bench-press` | Press de banca | Intermedio | La barra libre exige trayectoria, control escapular y una preparación segura del banco y del soporte; no equivale a un press guiado. |
| `seated-cable-row` | Remo sentado en polea | Principiante | Base sentada estable y resistencia ajustable; se aprende a tirar sin balancear el tronco. Coincide con [ACE](https://www.acefitness.org/resources/everyone/exercise-library/48/seated-row/). |
| `romanian-deadlift` | Peso muerto rumano | Intermedio | Exige dominar la bisagra y mantener el tronco estable con la barra cerca del cuerpo. Coincide con [ACE](https://www.acefitness.org/resources/everyone/exercise-library/317/romanian-deadlift/). |
| `barbell-hip-thrust` | Hip thrust | Intermedio | La variante con barra y banco añade preparación del equipo y control de la pelvis frente al puente bilateral en el suelo. ACE también sitúa el [puente con barra en intermedio](https://www.acefitness.org/resources/everyone/exercise-library/318/hip-bridge/). |
| `incline-dumbbell-press` | Press inclinado con mancuernas | Principiante | Banco estable y carga ajustable permiten aprender el empuje con ambas mancuernas a la vez. Coincide con [ACE](https://www.acefitness.org/resources/everyone/exercise-library/25/incline-chest-press/); no se evalúa la progresión alternada. |
| `lat-pulldown` | Jalón al pecho | Principiante | El asiento y la carga ajustable permiten aprender el tirón vertical sin sostener el peso corporal completo. |
| `bulgarian-split-squat` | Sentadilla búlgara | Intermedio | Aun sin carga requiere equilibrio, control unilateral y coordinación con el pie posterior elevado; la zancada con apoyo es su regresión. |
| `overhead-press` | Press militar | Intermedio | Se evalúa el press libre de pie: requiere control del tronco y del hombro durante el empuje por encima de la cabeza. El press sentado ligero es otra variante. |
| `walking-lunge` | Zancada | Intermedio | Se evalúa una zancada sin apoyo, con control de rodilla y pelvis al cambiar la base de sustentación; la zancada con apoyo es más sencilla. |
| `standing-calf-raise` | Elevación de gemelos | Principiante | Elevación bilateral sin carga y con apoyo disponible; el gesto y la resistencia se ajustan fácilmente. La versión a una pierna es una progresión. |
| `assisted-dip` | Fondos asistidos | Intermedio | La asistencia reduce la carga, pero aún se necesita control del hombro, la profundidad y el empuje. La ficha debe mostrar la asistencia real, no un fondo libre. |
| `biceps-curl` | Curl de bíceps | Principiante | Aislamiento del codo con carga ajustable y base estable; no requiere dominar otro levantamiento. |
| `triceps-pushdown` | Extensión de tríceps en polea | Principiante | La polea permite aprender la extensión del codo con resistencia baja y sin sostener el peso corporal. |
| `leg-press` | Prensa de piernas | Principiante | Respaldo y trayectoria guiada reducen la demanda de equilibrio; se ajustan carga y recorrido manteniendo la pelvis apoyada. |
| `leg-curl` | Curl femoral | Principiante | Trabajo guiado y apoyado con resistencia ajustable; no exige sostener simultáneamente la cadera elevada. |
| `tempo-squat` | Sentadilla tempo | Principiante | Sentadilla bilateral sin carga externa, a ritmo controlado y dentro del rango que permita conservar la postura; silla disponible como regresión. |
| `push-up` | Flexión de brazos | Intermedio | La flexión completa en el suelo requiere fuerza de empuje y mantener el cuerpo alineado durante todo el recorrido; no se confunde con la inclinada o con rodillas. |
| `incline-push-up` | Flexión inclinada | Principiante | La pared o un apoyo elevado y estable permiten reducir la carga corporal hasta aprender el empuje y la alineación. |
| `band-row` | Remo con banda | Principiante | Tirón con pies apoyados y banda de tensión ajustable; no se evalúa el remo invertido suspendido bajo una barra. |
| `inverted-row` | Remo invertido | Principiante | REQ-293. Rodillas flexionadas y talones apoyados bajo una mesa firme o barra baja: la inclinación del cuerpo regula la carga, como en [Free Exercise DB](https://github.com/yuhonas/free-exercise-db) (beginner). Con piernas estiradas es su progresión. |
| `glute-bridge` | Puente de glúteo | Principiante | Apoyo bilateral en el suelo y recorrido fácil de ajustar para aprender la extensión de cadera. |
| `single-leg-glute-bridge` | Puente de glúteo a una pierna | Intermedio | Retirar un apoyo aumenta la demanda unilateral y de control de la pelvis respecto al puente bilateral. |
| `front-plank` | Plancha frontal | Principiante | Posición estática con base bilateral amplia; se regula la duración y se usa apoyo elevado o rodillas al aprender. No incluye toques ni retirada de apoyos. |
| `side-plank` | Plancha lateral | Intermedio | Se evalúa la versión con piernas extendidas: sostener el cuerpo sobre un lado exige estabilidad del hombro y de la pelvis. La versión con rodillas es su regresión. |
| `dead-bug` | Dead bug | Principiante | Apoyo del tronco en el suelo y amplitud ajustable; permite aprender a controlar pelvis y costillas con movimientos pequeños. |
| `pike-push-up` | Pike push-up | Intermedio | Se evalúa una flexión en V invertida con los pies en el suelo; requiere fuerza y estabilidad del hombro previas. No es una flexión en parada de manos. |
| `single-leg-rdl` | Peso muerto a una pierna | Intermedio | Se evalúa la bisagra unilateral sin carga: exige equilibrio, pelvis estable y control del tronco; usar apoyo constituye una regresión. |
| `assisted-pull-up` | Dominada asistida | Intermedio | La banda reduce el peso que se eleva, pero exige preparar la asistencia y controlar la suspensión y las escápulas. No equivale a un jalón sentado. |
| `shoulder-tap-plank` | Plancha con toque de hombro | Intermedio | Retirar una mano exige resistir la rotación y mantener la pelvis estable; primero debe dominarse la plancha alta estática. |
| `step-up` | Subida al banco | Principiante | Variante base sin carga, en escalón bajo y estable, con apoyo disponible. La altura y la carga se progresan después de controlar la subida y el descenso. |
| `slider-leg-curl` | Curl femoral deslizante | Intermedio | Combina flexión de rodillas y cadera sostenida, con control del deslizamiento y de la extensión excéntrica; no es un curl guiado. |
| `lateral-raise` | Elevación lateral | Principiante | Aislamiento con carga ligera y recorrido controlado; no requiere un nivel mayor que otros aislamientos básicos. Coincide con [ACE](https://www.acefitness.org/resources/everyone/exercise-library/26/lateral-raise/). |
| `cable-fly` | Apertura en polea | Intermedio | Exige estabilizarse de pie y controlar el hombro con los brazos abiertos y tensión continua. Coincide con [ACE](https://www.acefitness.org/resources/everyone/exercise-library/160/standing-chest-fly/). |
| `face-pull` | Face pull | Intermedio | Requiere coordinar el tirón y el control escapular sin elevar los hombros ni compensar con el tronco. Coincide con [NASM](https://www.nasm.org/resource-center/exercise-library/face-pull). |
| `hammer-curl` | Curl martillo | Principiante | Flexión del codo con agarre neutro y carga ajustable; su complejidad básica es comparable al curl de bíceps. |
| `diamond-push-up` | Flexión diamante | Intermedio | Variante completa en el suelo con manos próximas: añade demanda de tríceps y control del codo a la flexión básica. |
| `pull-up` | Dominada | Intermedio | Exige elevar y descender el peso corporal con control escapular y sin impulso, después de desarrollar fuerza de tirón. |
| `decline-push-up` | Flexión con pies elevados | Intermedio | Requiere dominar la flexión completa y controlar una proporción mayor del peso sobre los brazos. |
| `weighted-pull-up` | Dominada con lastre | Avanzado | Añade carga a una dominada estricta ya dominada; exige fuerza relativa y control de la suspensión. |
| `front-squat` | Sentadilla frontal | Avanzado | La barra en rack frontal añade exigencia de movilidad, control del tronco y mantenimiento de los codos a una sentadilla con carga libre. |
| `archer-push-up` | Flexión arquero | Avanzado | Distribuye gran parte de la carga hacia un brazo y exige controlar el desplazamiento lateral; no es una flexión pliométrica. |
| `nordic-hamstring-curl` | Curl nórdico | Avanzado | Descenso con alta demanda excéntrica de isquiotibiales, cuerpo alineado y anclaje seguro; requiere progresión previa de fuerza y recorrido. |

## Inventario de resistencia: 12 ejercicios

Estos niveles corresponden a los bloques concretos del catálogo. La duración, la velocidad, la resistencia y las pausas deben adecuarse a la persona. Los intervalos se consideran intermedios porque requieren una base de la disciplina y capacidad de regular y recuperar el esfuerzo; no se interpretan como esfuerzos máximos.

| Slug | Ejercicio | Nivel revisado | Razón y variante evaluada |
|---|---|---|---|
| `walk-brisk` | Caminata a paso activo | Principiante | Caminar en terreno manejable con intensidad y duración graduables, manteniendo respiración controlada. |
| `walk-easy` | Caminata aeróbica fácil | Principiante | Paso cómodo, recorrido corto y terreno plano como punto de entrada. |
| `walk-mobility` | Caminata con movilidad | Principiante | Caminar suave y realizar movilidad básica sin maniobras de equilibrio exigentes. |
| `run-intervals` | Intervalos de running | Intermedio | Alternar tramos de carrera de mayor esfuerzo y recuperación exige base de carrera y control del ritmo. |
| `run-easy` | Running aeróbico fácil | Principiante | Incluye alternar caminar y correr, con ritmo conversacional y tiempo ajustable. |
| `run-drills` | Técnica de carrera | Principiante | Marcha técnica y progresivos breves controlados; no incluye saltos complejos ni sprints máximos. |
| `cycle-intervals` | Intervalos de cycling | Intermedio | Requiere controlar la bicicleta, variar el esfuerzo y recuperarse entre bloques sin perder la técnica. |
| `cycle-endurance` | Cycling aeróbico fácil | Principiante | Pedaleo estable de corta duración y baja resistencia; presupone saber manejar la bicicleta o usar una estática. |
| `cycle-cadence` | Técnica y cadencia en bicicleta | Principiante | Cadencia cómoda, resistencia baja y bloques breves para practicar el pedaleo; no implica cadencia máxima. |
| `swim-intervals` | Intervalos de natación | Intermedio | Requiere técnica y respiración acuática consolidadas para alternar esfuerzo y recuperación sin perder alineación. |
| `swim-endurance` | Natación aeróbica fácil | Principiante | Largos suaves con pausas, adecuados para alguien que ya sabe nadar con seguridad. No es una clase inicial de supervivencia acuática. |
| `swim-drills` | Técnica de natación | Principiante | Un ejercicio técnico sencillo por bloque y pausas amplias, para una persona que ya controla flotación, respiración y desplazamiento seguros. |

En natación, **principiante significa principiante del entrenamiento, con capacidad previa para nadar de forma segura**. Si falta esa capacidad, ninguna de estas tres fichas sustituye el aprendizaje supervisado. La contraindicación del catálogo para quien no sabe nadar sigue aplicándose.

## Inventario complementario de producción: 16 ejercicios

Se aplicó el mismo criterio a la posición inicial, los pasos, las regresiones y la identidad del recurso multimedia declarados en cada ficha remota. Un slug que incluya `scaled` o una etiqueta remota antigua de principiante no sustituye la revisión de la ejecución descrita. Este inventario complementa los 55 ejercicios empaquetados sin duplicar en el código sus fichas completas ni alterar su contenido remoto.

| Slug | Ejercicio | Nivel revisado | Razón y variante remota evaluada |
|---|---|---|---|
| `band-alternating-lat-pulldown` | Jalón alternado con liga | Principiante | De pie con ambos pies apoyados y banda ajustable: alternar el tirón no exige sostener el peso corporal. Se presupone un anclaje adecuado, como indican sus pasos. |
| `band-assisted-pull-up` | Dominada asistida con liga | Intermedio | Suspensión con banda, descenso controlado y preparación de la asistencia; mantiene el mismo nivel que `assisted-pull-up`. Su regresión es el jalón con los pies apoyados. |
| `dumbbell-alternating-curl` | Curl alternado de bíceps | Principiante | Alternar los brazos y girar la palma conserva una base estable y permite una carga baja; coherente con `biceps-curl`. |
| `dumbbell-alternating-hammer-curl` | Curl martillo alternado | Principiante | Agarre neutro, flexión del codo y carga ajustable sin una exigencia previa diferente de `hammer-curl`. |
| `dumbbell-bent-over-row` | Remo inclinado con mancuernas | Intermedio | Los pasos exigen sostener la bisagra de pie sin apoyo mientras se rema con ambas manos; no es la regresión con una mano apoyada. |
| `dumbbell-floor-press` | Press de pecho en el suelo | Principiante | Tronco apoyado, rodillas flexionadas, carga ajustable y límite del recorrido al contactar los brazos con el suelo; no equivale al press libre con barra. |
| `dumbbell-glute-bridge` | Puente de glúteos con mancuerna | Principiante | Puente bilateral con espalda en el suelo y una mancuerna ajustable sobre la pelvis. No añade banco ni montaje con barra como `barbell-hip-thrust`. |
| `dumbbell-lateral-raise` | Elevaciones laterales | Principiante | Ejecución de pie con carga ligera y controlada; la misma habilidad base que `lateral-raise`. |
| `dumbbell-overhead-triceps-extension` | Extensión de tríceps sobre la cabeza | Intermedio | La ejecución de pie con una mancuerna detrás de la cabeza exige control del tronco, posición del brazo y recorrido del hombro. Coincide con la [variante de dos manos descrita por ACE](https://www.acefitness.org/resources/everyone/exercise-library/74/triceps-extension/). |
| `dumbbell-reverse-fly` | Pájaros con mancuernas | Intermedio | Apertura de brazos manteniendo una bisagra de pie sin apoyo; la carga ligera no elimina el control simultáneo del tronco y las escápulas. |
| `dumbbell-reverse-lunge` | Zancada hacia atrás con mancuernas | Intermedio | Paso hacia atrás, cambio de apoyo y retorno con control unilateral; empezar sin peso es su regresión, no una eliminación de la demanda de equilibrio. |
| `dumbbell-romanian-deadlift` | Peso muerto rumano con mancuernas | Intermedio | Bisagra con espalda estable y pesas próximas a las piernas; usar mancuernas no elimina el prerrequisito técnico de `romanian-deadlift`. |
| `dumbbell-standing-shoulder-press` | Press de hombros de pie | Intermedio | Empuje vertical libre y bilateral de pie, evitando compensar con el tronco; coherente con la ejecución de pie de `overhead-press`. |
| `goblet-squat` | Sentadilla goblet | Principiante | Una carga ajustable junto al pecho facilita aprender la sentadilla bilateral y evita el montaje de la barra. [NASM la describe como variante accesible para aprender el patrón](https://www.nasm.org/resource-center/exercise-library/goblet-squat). |
| `scaled-push-up` | Flexiones | Intermedio | La posición inicial alinea cabeza, cadera y talones; los pasos llevan el pecho al suelo y la referencia es `Push-Up.gif`. Rodillas y pared son regresiones explícitas: la ejecución base es la flexión completa, como `push-up`. |
| `standing-heel-raise` | Elevación de talones de pie | Principiante | Elevación bilateral sobre suelo plano, con carga ajustable y apoyo de una mano permitido expresamente; coherente con `standing-calf-raise`. |

Los 16 ejercicios figuraban como principiantes en la lectura remota. La revisión conserva ocho y reclasifica ocho como intermedios; no añade ejercicios avanzados. La coherencia se decide por la ejecución: la bisagra, la suspensión o el empuje vertical de pie conservan su nivel aunque el slug, el equipo o la fuente multimedia sean distintos.

## Correspondencia entre nombre, nivel y demostración

El caso que motivó la revisión mostraba una parada de manos bajo el nombre `pike-push-up`. La pike base mantiene los pies en el suelo; la flexión en parada de manos exige sostener el cuerpo invertido y pertenece al nivel avanzado. Cambiar solo la etiqueta a avanzado habría mantenido una instrucción visual incorrecta.

La página de [NASM para la pike base](https://www.nasm.org/workout-exercise-guidance/default?slug=pike-push-up) describe la V invertida con pies apoyados y la clasifica como intermedia. Su [otra ficha de la misma familia](https://www.nasm.org/resource-center/exercise-library/pike-push-up) emplea la etiqueta avanzada. Esta diferencia refuerza que el criterio del producto debe fijar la ejecución evaluada, además de consultar referencias.

Las demostraciones exactas se curan como recursos locales de `assets/exercise-media/`. Compartir músculos principales no hace intercambiables dos demostraciones: remo con banda e invertido, plancha con toque y escaladores, flexión arquero y pliométrica, o curl deslizante y curl sobre balón son ejecuciones distintas. Si falta una demostración exacta, se utiliza una guía propia fiel al movimiento hasta disponer de una; no se enseña una progresión diferente como si fuera la variante base.

## Aplicación y continuidad

Los niveles canónicos revisados del catálogo local y su registro complementario de niveles prevalecen para los **71 slugs conocidos** frente a valores antiguos recuperados de la base de datos. Los demás ejercicios personalizados conservan su clasificación explícita. Esto evita que una respuesta remota desactualizada vuelva a presentar una pike, una búlgara, una bisagra unilateral o las variantes complementarias revisadas con un nivel incorrecto.

Regresiones, progresiones y sustituciones conservan sus identidades: al cambiar de ejercicio se consulta el nivel del destino; una variación de carga no modifica por sí sola el nivel técnico. Una etiqueta compartida no indica que dos ejercicios tengan exactamente la misma dificultad dentro de ese nivel.

La revisión corrige los metadatos y las referencias actuales del catálogo. **No reescribe sesiones ejecutadas, registros históricos, cargas utilizadas ni resultados anteriores.** Tampoco implica que se haya ejecutado una migración de producción ni documenta por sí misma pruebas funcionales de la app.

## Ampliación REQ-302: 28 fichas revisadas

El nivel describe la ejecución base de la demostración local. Los aumentos de repeticiones o resistencia conservan esa ejecución.

| Slug | Nivel | Criterio |
|---|---|---|
| `band-pull-apart` | beginner | De pie, sujeta una banda delante del pecho con los brazos extendidos. Apoyo estable y resistencia o recorrido graduable. |
| `band-lateral-raise` | beginner | Pisa el centro de la banda y sujeta los extremos junto a los muslos. Apoyo estable y resistencia o recorrido graduable. |
| `band-shoulder-press` | intermediate | Pisa la banda con ambos pies y coloca las manos a la altura de los hombros. Control de bisagra, hombro o equilibrio previo. |
| `band-chest-fly` | intermediate | Ancla la banda a un poste firme detrás del cuerpo, a la altura del pecho, y adelanta un pie. Control de bisagra, hombro o equilibrio previo. |
| `band-seated-leg-curl` | beginner | Siéntate en un banco firme frente a una banda anclada cerca del suelo, colocada detrás de los tobillos. Apoyo estable y resistencia o recorrido graduable. |
| `dumbbell-floor-press` | beginner | Túmbate boca arriba con rodillas flexionadas y una mancuerna en cada mano sobre el pecho. Apoyo estable y resistencia o recorrido graduable. |
| `one-arm-dumbbell-row` | beginner | Apoya una mano y una rodilla en un banco firme y sostén una mancuerna con el brazo libre. Apoyo estable y resistencia o recorrido graduable. |
| `dumbbell-squat` | beginner | De pie, pies al ancho de hombros y una mancuerna junto a cada muslo. Apoyo estable y resistencia o recorrido graduable. |
| `dumbbell-reverse-lunge` | intermediate | De pie con una mancuerna a cada lado y espacio libre detrás. Control de bisagra, hombro o equilibrio previo. |
| `dumbbell-stiff-leg-deadlift` | intermediate | De pie con mancuernas delante de los muslos y rodillas ligeramente flexionadas, sin bloquearlas. Control de bisagra, hombro o equilibrio previo. |
| `seated-dumbbell-press` | beginner | Siéntate con la espalda apoyada en un banco con respaldo y las mancuernas a la altura de hombros. Apoyo estable y resistencia o recorrido graduable. |
| `seated-dumbbell-reverse-fly` | intermediate | Siéntate al borde de un banco firme con los pies apoyados, inclina el tronco hacia los muslos y mantén la espalda neutra. Control de bisagra, hombro o equilibrio previo. |
| `concentration-curl` | beginner | Siéntate con las piernas separadas y apoya la parte posterior del brazo contra la cara interna del muslo. Apoyo estable y resistencia o recorrido graduable. |
| `lying-dumbbell-triceps-extension` | intermediate | Túmbate en un banco plano con las mancuernas sobre los hombros y las palmas enfrentadas. Control de bisagra, hombro o equilibrio previo. |
| `seated-dumbbell-calf-raise` | beginner | Siéntate en un banco firme, coloca el antepié sobre un escalón bajo y sujeta una mancuerna encima del muslo de esa pierna. Apoyo estable y resistencia o recorrido graduable. |
| `dumbbell-chest-fly` | intermediate | Túmbate en un banco plano con las mancuernas sobre el pecho y los codos ligeramente flexionados. Control de bisagra, hombro o equilibrio previo. |
| `dumbbell-alternating-curl` | beginner | De pie con una mancuerna a cada lado, brazos junto al tronco y palmas hacia dentro. Apoyo estable y resistencia o recorrido graduable. |
| `machine-chest-press` | beginner | Ajusta el asiento para que las asas queden a la altura del pecho y apoya la espalda. Apoyo estable y resistencia o recorrido graduable. |
| `machine-shoulder-press` | beginner | Ajusta el asiento con las asas a la altura de hombros y la espalda apoyada. Apoyo estable y resistencia o recorrido graduable. |
| `reverse-pec-deck` | beginner | Siéntate mirando al respaldo con el pecho apoyado y las asas a la altura de hombros. Apoyo estable y resistencia o recorrido graduable. |
| `leg-extension` | beginner | Alinea la rodilla con el eje de la máquina, apoya la espalda y coloca el rodillo sobre la parte baja de las espinillas. Apoyo estable y resistencia o recorrido graduable. |
| `seated-leg-curl` | beginner | Ajusta el eje a la altura de las rodillas, el apoyo sobre los muslos y el rodillo detrás de los tobillos. Apoyo estable y resistencia o recorrido graduable. |
| `seated-calf-raise` | beginner | Siéntate con el antepié en la plataforma y las almohadillas sobre los muslos; libera el seguro según la máquina. Apoyo estable y resistencia o recorrido graduable. |
| `machine-biceps-curl` | beginner | Ajusta el asiento, apoya los brazos en la almohadilla y alinea los codos con el eje de giro. Apoyo estable y resistencia o recorrido graduable. |
| `pec-deck` | beginner | Siéntate con la espalda apoyada, ajusta el asiento y coloca los antebrazos en las almohadillas a la altura del pecho. Apoyo estable y resistencia o recorrido graduable. |
| `crunch` | beginner | Túmbate boca arriba con las rodillas flexionadas y los pies apoyados; coloca las manos a los lados de la cabeza sin tirar de ella. Apoyo estable y resistencia o recorrido graduable. |
| `reverse-crunch` | intermediate | Túmbate boca arriba con brazos a los lados, caderas y rodillas flexionadas a unos 90 grados. Control de bisagra, hombro o equilibrio previo. |
| `oblique-crunch` | beginner | Túmbate de lado con las rodillas flexionadas y una mano junto a la cabeza sin tirar del cuello. Apoyo estable y resistencia o recorrido graduable. |
