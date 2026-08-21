# Score & Level ("Premios") Requirements Checklist: Trivia Galatea

**Purpose**: Validar que los requisitos del modelo de puntuación y niveles/títulos (equivalente al "premio" del jugador, per A-002) sean completos, medibles y consistentes.
**Created**: 2026-08-20
**Feature**: [spec.md](../spec.md) · [data-model.md](../data-model.md)

**Depth**: Exhaustivo · **Audience**: Autor (antes de `/speckit.tasks`)

> Nota de alcance: spec.md (A-002) confirma que el "premio" mencionado en el brief original equivale al título/nivel de la pantalla de celebración, no a un sistema de premios físicos/digitales externo. Este checklist valida los requisitos de esa mecánica de puntuación/nivel.

## Fórmula de puntuación

- [x] CHK001 - ¿Es inequívoca la fórmula de puntuación (FR-010) ahora que A-006 resuelve el ejemplo inconsistente del brief, y está esta resolución reflejada de forma consistente en todas las referencias a la fórmula (US3, FR-010, A-006)? [Consistency, Spec §FR-010, §A-006]
- [x] CHK002 - ¿Es explícito si pueden ocurrir puntajes superiores a 360 dados los límites de la fórmula, o está garantizado 360 como máximo absoluto? [Clarity, Spec §FR-010, §US3 Scenario 2]
- [x] CHK003 - ¿Existe un requisito de redondeo/precisión (la fórmula sólo produce enteros dados los inputs, pero está esto garantizado y documentado como invariante)? [Gap, Traceability]
- [x] CHK004 - ¿Es clara la no linealidad del término Galatea de la fórmula frente al término lineal del tema para un lector que no hace el cálculo, en la descripción de la entidad `Puntuación` en Key Entities? [Clarity, Spec §Key Entities, §FR-010]

## Puntaje en tiempo real

- [x] CHK005 - ¿Están definidos los requisitos de cómo se calcula el puntaje parcial/en vivo (FR-011) antes de que se respondan las 6 preguntas — usa la misma fórmula de forma progresiva, o un cálculo interino distinto? [Ambiguity, Gap, Spec §FR-011]

## Rangos de nivel

- [x] CHK006 - ¿Están completamente especificados los límites de rango de cada nivel (0–59, 60–119, ... 360) sin huecos ni solapamientos? ¿Todo entero entre 0 y 360 queda cubierto por exactamente un nivel? [Completeness, Measurability, Spec §FR-014]
- [x] CHK007 - ¿Están definidos requisitos sobre qué puntaje/nivel se muestra si una partida se abandona antes de responder las 6 preguntas (no existe un puntaje "final" formal según A-001)? [Gap, Edge Case]
- [x] CHK008 - ¿Existe un requisito sobre el desempate o tratamiento igualitario cuando dos combinaciones distintas de aciertos galatea/tema producen el mismo puntaje total (¿es intencional y está declarado como tal?)? [Gap, Ambiguity]

## Celebración y diferenciación visual por nivel

- [x] CHK009 - ¿Están definidos requisitos para la diferenciación visual/celebratoria exacta entre cada uno de los 7 niveles, más allá del "al menos 3 niveles distintos" de SC-006? ¿Esto deja sin requisito explícito la distinción de 4 de los 7 niveles? [Gap, Measurability, Spec §SC-006]
- [x] CHK010 - ¿Es suficientemente clara la aclaración de A-002 (el "regalo" equivale al título/nivel) para evitar que se agreguen requisitos de un sistema de premios físico/digital fuera de alcance? [Clarity, Spec §A-002]

## Desglose de resultados

- [x] CHK011 - ¿Es suficientemente específico el requisito de la vista de desglose por categoría (US4 Escenario 5: "puntuación desglosada por categoría") sobre qué debe mostrar (puntos crudos, conteo de aciertos, o ambos)? [Clarity, Spec §US4 Scenario 5]

## Notes

- Ver [question-model.md](./question-model.md) para los requisitos de la entidad Pregunta que alimenta el cálculo de puntuación.
