# Question Model Requirements Checklist: Trivia Galatea

**Purpose**: Validar que los requisitos del modelo de preguntas (estructura, fuentes, validación, unicidad) sean completos, claros y consistentes entre el banco curado y la generación por IA.
**Created**: 2026-08-20
**Feature**: [spec.md](../spec.md) · [data-model.md](../data-model.md) · [contracts/galatea-question-bank.schema.json](../contracts/galatea-question-bank.schema.json)

**Depth**: Exhaustivo · **Audience**: Autor (antes de `/speckit.tasks`)

## Completitud de la estructura de la entidad Pregunta

- [x] CHK001 - ¿Están completos los requisitos sobre qué constituye un objeto de pregunta válido (campos y tipos exactos) más allá de "enunciado, 4 opciones, respuesta correcta"? [Completeness, Spec §Key Entities]
- [x] CHK002 - ¿Están definidos límites de longitud (mínima/máxima) para el texto de la pregunta que garanticen consistencia del layout de la tarjeta? [Gap]
- [x] CHK003 - ¿Está completamente enumerado el atributo "fuente" de una Pregunta (banco curado | base conocimiento | generada por IA), o existen estados ambiguos (p. ej. una pregunta Galatea generada por IA con contexto)? [Ambiguity, Spec §Key Entities]

## Consistencia entre fuentes (banco curado vs. IA)

- [x] CHK004 - ¿Se aplica de forma consistente el requisito de "exactamente 4 opciones" (FR-005, A-003) tanto para preguntas generadas por IA como para las del banco curado? [Consistency, Spec §FR-005, §A-003]
- [x] CHK005 - ¿Existen requisitos sobre qué ocurre si una pregunta generada tiene menos o más de 4 opciones por un error de formato de la IA (validación antes de mostrarla)? [Gap, Coverage]

## Unicidad y aleatoriedad

- [x] CHK006 - ¿Existen requisitos para detectar/prevenir preguntas duplicadas o muy similares dentro del conjunto de 12 tarjetas de una misma partida (edge case abierto)? [Gap, Spec §Edge Cases]
- [x] CHK007 - ¿Es explícito el requisito de selección sin repetición del banco Galatea entre partidas consecutivas, o sólo se infiere de que el banco tenga ≥12 preguntas para elegir 6? [Ambiguity, Spec §FR-004]
- [x] CHK008 - ¿Existe un requisito que asegure que la posición de la opción correcta no sea siempre la misma entre preguntas (evitar un patrón predecible)? [Gap, Edge Case]
- [x] CHK009 - ¿Están definidos requisitos sobre el orden/mezcla de las opciones de respuesta (deben aleatorizarse en cada render)? [Gap]

## Orden y presentación en el tablero

- [x] CHK010 - ¿Están definidos requisitos sobre cómo se mezclan/ordenan las 6 preguntas Galatea + 6 del tema en el tablero (aleatorización implícita solamente)? [Gap, Spec §FR-006]

## Validación de contenido y relevancia

- [x] CHK011 - ¿Es medible en tiempo de ejecución el criterio de relevancia de SC-002 ("pertinentes... en el 95% de los casos, validación manual"), o es un proceso de QA completamente fuera de la app en ejecución? [Clarity, Spec §SC-002]
- [x] CHK012 - ¿Está abordada en algún lugar la definición de "pregunta ofensiva o inapropiada" para preguntas de tema generadas por IA (moderación de contenido), o queda completamente sin resolver? [Gap, Edge Case]

## Notes

- Ver [ai-topic-questions.md](./ai-topic-questions.md) para los requisitos específicos de la lógica de generación por IA del tema elegido (más allá de la estructura del modelo de Pregunta).
