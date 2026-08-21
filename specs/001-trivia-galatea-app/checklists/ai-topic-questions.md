# AI-Generated Topic Questions Requirements Checklist: Trivia Galatea

**Purpose**: Validar que los requisitos de la lógica de generación de preguntas sobre el tema de interés elegido por el jugador (vía Gemini) sean completos, claros y consistentes.
**Created**: 2026-08-20
**Feature**: [spec.md](../spec.md) · [contracts/gemini-prompt-contract.md](../contracts/gemini-prompt-contract.md)

**Depth**: Exhaustivo · **Audience**: Autor (antes de `/speckit.tasks`)

## Entrada del tema libre

- [x] CHK001 - ¿Está acotado el requisito de que el tema elegido es un campo de "texto libre" (FR-002) por alguna restricción de contenido/formato (longitud, idioma, conjunto de caracteres) necesaria para generar de forma confiable las 6 preguntas? [Gap, Spec §FR-002]
- [x] CHK002 - ¿Están definidos requisitos de normalización del tema (recorte de espacios, sensibilidad a mayúsculas) antes de usarlo en el prompt de IA y antes de mostrarlo como etiqueta de categoría de la tarjeta (FR-006)? [Gap]
- [x] CHK003 - ¿Es consistente FR-002 (tema libre/sin restricción) con el edge case de seguridad de contenido ("¿tema... es ofensivo?") — existe una resolución declarada, o permanece como un vacío abierto sin abordar? [Gap, Spec §Edge Cases]
- [x] CHK004 - ¿Está especificado en qué idioma(s) deben estar las preguntas de tema generadas por IA (consistente con el resto de la UI, presumiblemente español) si el jugador ingresa un tema en otro idioma? [Gap]

## Generación y validación de resultado

- [x] CHK005 - ¿Es claro si el requisito "generar exactamente 6 preguntas sobre el tema elegido" (FR-003) trata el éxito parcial (p. ej. 4 válidas + 2 malformadas) como fallo total o como aceptación parcial? [Ambiguity, Spec §FR-003]
- [x] CHK006 - ¿Es el objetivo de tiempo de generación de 8 segundos (SC-003, "90% de las partidas") un requisito estricto o una meta de mejor esfuerzo? ¿Están definidas las consecuencias si se incumple en una partida dada? [Clarity, Spec §SC-003]
- [x] CHK007 - ¿Es medible en tiempo de ejecución el criterio de relevancia al tema (SC-002, "95% de los casos, validación manual"), o existe algún mecanismo de re-prompt/confianza mínima si las preguntas generadas parecen fuera de tema? [Gap, Spec §SC-002]

## Separación de flujos (tema vs. Galatea-IA-fallback)

- [x] CHK008 - ¿Está claramente separada en los requisitos la distinción entre "preguntas de tema" (fuente: tema elegido) y "preguntas Galatea generadas por IA como fallback" (fuente: galatea, generada con contexto), de modo que no se confundan los dos flujos de prompt? [Clarity, Consistency, Spec §FR-003, §FR-004]

## Seguridad del prompt (específico a esta lógica)

- [x] CHK009 - ¿Existen requisitos que impidan que el campo de tema se use para extraer indirectamente información sobre Bancolombia/Galatea de la IA (inyección de prompt que intente evadir la anonimización)? [Gap, Edge Case]

## Escala y reutilización

- [x] CHK010 - ¿Están definidos requisitos sobre caché o reutilización de preguntas de tema previamente generadas si el mismo tema se ingresa de nuevo en una partida posterior (p. ej. temas repetidos durante el evento)? [Gap]
- [x] CHK011 - ¿Está definido cuántos temas distintos debe soportar el sistema de forma concurrente/secuencial durante una misma sesión de evento (múltiples jugadores secuenciales, cada uno con su propio tema)? [Gap, Spec §Scale/Scope]

## Notes

- Ver [security.md](./security.md) CHK008 para el ítem de inyección de prompt desde la perspectiva de seguridad general; este checklist lo enmarca específicamente en la lógica de generación de preguntas de tema.
