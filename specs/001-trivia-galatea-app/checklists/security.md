# Security Requirements Checklist: Trivia Galatea

**Purpose**: Validar que los requisitos de seguridad (exposición de API key, anonimización, inyección de contenido, protección de datos) estén completos, claros y sin ambigüedades antes de generar tareas de implementación.
**Created**: 2026-08-20
**Feature**: [spec.md](../spec.md) · [plan.md](../plan.md) · [research.md](../research.md)

**Depth**: Exhaustivo · **Audience**: Autor (antes de `/speckit.tasks`)

## Protección de credenciales y superficie de exposición

- [x] CHK001 - ¿Están definidos los requisitos sobre cómo se protege la API key de Gemini de quedar expuesta en el bundle del cliente? [Gap]
- [x] CHK002 - ¿Se documenta como requisito (no solo como nota operativa en research.md) la política de rotación/expiración de la API key después de cada evento? [Traceability, Gap]
- [x] CHK003 - ¿Existen requisitos de seguridad para el escenario de exposición en red local (`ng serve --host 0.0.0.0`), p. ej. si se espera algún control de acceso para quién puede alcanzar la app en el Wi-Fi del evento? [Gap]

## Anonimización y privacidad de datos

- [x] CHK004 - ¿Es FR-018 lo suficientemente completo para cubrir todos los campos de datos que podrían enviarse a la IA, no solo el alias? [Completeness, Spec §FR-018]
- [x] CHK005 - ¿Son consistentes FR-018 y A-010 respecto a qué datos pueden enviarse a la IA? [Consistency, Spec §FR-018, §A-010]
- [x] CHK006 - ¿Es verificable/medible el requisito "el alias del jugador... nunca se transmite al servicio de IA externo" (A-010) mediante un contrato explícito, o depende únicamente de la disciplina del desarrollador? [Measurability, Spec §A-010]
- [x] CHK007 - ¿Existen requisitos sobre qué debe ocurrir si la sustitución de placeholders de anonimización falla o es evadida (fail-open vs. fail-closed)? [Gap, Edge Case]

## Validación e inyección de contenido

- [x] CHK008 - ¿Están definidos requisitos para prevenir inyección de prompt a través del campo de tema libre antes de que llegue a Gemini? [Gap, Spec §FR-002]
- [x] CHK009 - ¿Existen requisitos para sanitizar/escapar el alias del jugador antes de renderizarlo en pantalla (XSS)? [Gap]
- [x] CHK010 - ¿Existen requisitos para sanitizar/escapar el texto del tema libre antes de renderizarlo en pantalla (XSS)? [Gap]
- [ ] CHK011 - ¿Existen requisitos sobre qué ocurre si la respuesta de Gemini contiene contenido malicioso/inyectado (p. ej. etiquetas script) que se renderiza como texto de pregunta u opción? [Gap, Edge Case]
- [x] CHK012 - ¿Existen requisitos de validación de longitud/contenido del tema antes de enviarlo a Gemini (p. ej. longitud máxima)? [Gap]

## Abuso y disponibilidad

- [x] CHK013 - ¿Existe un requisito que limite la frecuencia/cantidad de llamadas a la API de Gemini por sesión para prevenir abuso de cuota por un solo jugador? [Gap]
- [x] CHK014 - ¿Existen requisitos sobre protección del archivo JSON del banco curado contra manipulación por usuarios finales (p. ej. servido únicamente como asset estático)? [Gap]

## Modelo de amenazas y trazabilidad

- [x] CHK015 - ¿Se documenta explícitamente el modelo de amenazas asumido para esta feature (evento interno controlado, sin exposición pública a internet)? [Traceability, Gap]
- [x] CHK016 - ¿Existe un requisito que impida que el campo de alias inyecte caracteres que rompan los anuncios de `aria-label` (intersección seguridad + accesibilidad)? [Gap, Edge Case]

## Notes

- Ítems marcados `[Gap]` indican ausencia total de requisito en spec.md/plan.md/research.md — requieren decisión antes de `/speckit.tasks`.
- Revisar en conjunto con [error-handling.md](./error-handling.md) para los casos donde una falla de seguridad se traduce en un mensaje de error al usuario.
