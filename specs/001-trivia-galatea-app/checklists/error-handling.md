# Error Handling Requirements Checklist: Trivia Galatea

**Purpose**: Validar que los requisitos de manejo de errores (fallas de IA, red, validación de entrada) sean completos, claros y consistentes.
**Created**: 2026-08-20
**Feature**: [spec.md](../spec.md) · [plan.md](../plan.md)

**Depth**: Exhaustivo · **Audience**: Autor (antes de `/speckit.tasks`)

## Fallas del servicio de IA

- [x] CHK001 - ¿Están definidos requisitos de manejo de error para cada modo de falla de la llamada de generación de preguntas a Gemini (timeout, JSON malformado, resultados parciales)? [Coverage, Spec §FR-003]
- [ ] CHK002 - ¿Está definido el texto exacto del mensaje de error requerido, o sólo se da un ejemplo ("ej.")? ¿Esto deja la redacción inconsistente entre implementaciones? [Clarity, Spec §FR-003]
- [x] CHK003 - ¿Existen requisitos sobre qué ocurre si tanto el banco JSON de Galatea como el fallback de IA fallan en producir las 6 preguntas Galatea? [Gap, Edge Case]
- [x] CHK004 - ¿Está definido un umbral máximo de espera antes de tratar la llamada a la IA como fallida? (el edge case menciona "más de 30 segundos" sin resolución formal) [Ambiguity, Spec §Edge Cases]
- [x] CHK005 - ¿Están definidos los requisitos de reintento cuando el servicio de IA no está disponible (US1 escenario 5 menciona "opción de reintentar") — cuántos reintentos, con qué espera? [Gap, Spec §US1 Scenario 5]
- [x] CHK006 - ¿Son consistentes FR-003 (falla de preguntas de tema → regreso a selección de tema) y US1 Escenario 5 (IA no disponible → error con reintento) — representan la misma ruta de falla o rutas distintas? [Consistency, Spec §FR-003, §US1]

## Errores de red y sesión

- [x] CHK007 - ¿Existen requisitos de estado de error para desconexión de red a mitad de partida (no sólo en el momento de generación)? [Gap, Edge Case]
- [x] CHK008 - ¿Está definido explícitamente el comportamiento al refrescar/cerrar el navegador a mitad de partida, más allá de "no persiste" (A-001)? ¿El jugador ve un error o simplemente reinicia en silencio? [Clarity, Spec §Edge Cases, §A-001]
- [x] CHK009 - ¿Existe un requisito sobre qué ocurre si el jugador dispara múltiples solicitudes de generación concurrentes (p. ej. doble clic en "iniciar")? [Gap, Edge Case]

## Validación de entrada

- [x] CHK010 - ¿Están definidos requisitos para validar/rechazar un tema libre vacío, de solo espacios, u ofensivo antes de intentar la generación por IA? [Gap, Spec §Edge Cases]
- [ ] CHK011 - ¿Está definido en términos medibles/verificables qué significa un "mensaje amigable" (tono, idioma, accionabilidad)? [Measurability, Spec §FR-003]

## Contenido del banco curado

- [x] CHK012 - ¿Existen requisitos de manejo de error para preguntas duplicadas o muy similares en el banco Galatea (edge case abierto)? [Gap, Spec §Edge Cases]

## Estado de UI durante errores

- [x] CHK013 - ¿Están definidos los requisitos del estado de la UI mientras se muestra un mensaje de error — el botón de continuar queda deshabilitado, el campo de alias queda prellenado? [Completeness, Spec §FR-003]
- [x] CHK014 - ¿Están definidos requisitos de accesibilidad para los mensajes de error (p. ej. anuncio `aria-live` del texto de error amigable)? [Gap, Coverage]

## Notes

- Ítems relacionados con seguridad de la entrada de datos (XSS, inyección) están en [security.md](./security.md); este checklist se enfoca en la calidad de los requisitos de manejo de fallas, no en su explotación.
