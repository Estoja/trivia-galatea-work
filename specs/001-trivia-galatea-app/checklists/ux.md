# UX Flow Requirements Checklist: Trivia Galatea

**Purpose**: Validar que los requisitos de flujo de experiencia de usuario (transiciones, estados de carga, consistencia visual entre pantallas) sean completos, claros y consistentes.
**Created**: 2026-08-20
**Feature**: [spec.md](../spec.md) · [plan.md](../plan.md)

**Depth**: Exhaustivo · **Audience**: Autor (antes de `/speckit.tasks`)

## Estados de carga y transición

- [x] CHK001 - ¿Son consistentes los requisitos de estado de carga entre la generación de preguntas de tema (FR-017) y cualquier otra operación asíncrona de la app (p. ej. carga inicial del tablero)? [Consistency, Spec §FR-017]
- [x] CHK002 - ¿Está especificado el comportamiento exacto del indicador de carga (texto del spinner, tiempo mínimo/máximo de despliegue), o queda a interpretación ("mensaje informativo")? [Clarity, Spec §US1 Scenario 4]
- [ ] CHK003 - ¿Están definidos requisitos para la animación/transición al voltear una tarjeta (duración, easing), o esto queda completamente a criterio de implementación? [Gap, Spec §US2]

## Flujo del tablero (US2)

- [x] CHK004 - ¿Está cuantificado el requisito de que la opción seleccionada "queda marcada visualmente" antes de confirmar con "Aceptar" (US2 Escenario 2)? [Clarity, Spec §US2 Scenario 2]
- [x] CHK005 - ¿Es consistente el avance automático a resultados tras la 6ª respuesta (US2 Escenario 4, FR-012) con la posibilidad de que el jugador revise tarjetas respondidas antes de avanzar? [Consistency, Ambiguity, Spec §US2, §FR-012]
- [x] CHK006 - ¿Están definidos requisitos sobre cuántas tarjetas pueden estar "en curso" (volteada pero sin responder) a la vez — puede el jugador voltear una segunda tarjeta mientras la primera sigue abierta? [Gap, Ambiguity, Spec §FR-007]
- [x] CHK007 - ¿Están definidos requisitos sobre cómo el jugador distingue visualmente las tarjetas "Galatea" de las del tema elegido más allá de una etiqueta de texto (FR-006 sólo menciona "etiqueta de categoría visible")? [Completeness, Spec §FR-006]
- [x] CHK008 - ¿Es consistente la visibilidad del puntaje en tiempo real (FR-011) a lo largo del tablero — está siempre visible, o sólo después de responder? [Clarity, Spec §FR-011]

## Flujo de resultados y reinicio (US4)

- [x] CHK009 - ¿Está especificado si el flujo de "Jugar de nuevo" (US4 Escenario 4) requiere reingresar el alias, o si lo conserva? [Ambiguity, Spec §US4 Scenario 4]
- [ ] CHK010 - ¿Está especificada la secuencia de revelación en la pantalla de resultados (p. ej. el puntaje se anima antes de mostrar el nivel, o todo aparece a la vez)? [Gap, Spec §US4]
- [ ] CHK011 - ¿Está definido en términos de layout/interacción el requisito del detalle de respuestas (US4 Escenario 5: "detalle de sus respuestas"), o sólo se exige que el dato esté visible? [Clarity, Spec §US4 Scenario 5]

## Consistencia general y casos límite

- [x] CHK012 - ¿Genera ambigüedad el hecho de que A-007 declare el soporte móvil como "considerado pero no requisito", dejando sin requisito explícito el layout en pantallas pequeñas? [Ambiguity, Spec §A-007]
- [ ] CHK013 - ¿Están definidos requisitos de estado vacío para algún momento de la UX (p. ej. antes de que el jugador voltee alguna tarjeta)? [Gap, Coverage]
- [x] CHK014 - ¿Existe un requisito para confirmar/advertir al jugador antes de que navegue fuera o refresque a mitad de partida, dado que el progreso se pierde (A-001)? [Gap, Edge Case]

## Notes

- Los requisitos de accesibilidad del flujo (navegación por teclado, `aria-live`) ya están cubiertos en la sección "Accessibility Criteria" de spec.md — este checklist valida la calidad de los requisitos de UX general, no repite los de accesibilidad.
