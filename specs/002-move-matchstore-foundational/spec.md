# Feature Specification: Move MatchStore Foundational

**Feature Branch**: `002-trivia-galatea-app`  
**Created**: 2026-08-20  
**Status**: Draft  
**Input**: User description: "Corrige la relación de dependencia entre US1 y MatchStore: Mover MatchStore a Foundational"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reordenar Dependencias Base (Priority: P1)

Como responsable técnico del plan, necesito que `MatchStore` pertenezca a la fase Foundational para que US1 no dependa de US2 y conserve su independencia de ejecución y prueba.

**Why this priority**: Si no se corrige este orden, la implementación contradice el principio de historias independientes y bloquea la validación del MVP por fases.

**Independent Test**: Se puede validar revisando `tasks.md` para confirmar que `MatchStore` y su registro de DI están definidos en Foundational, y que las tareas US1 ya no dependen de tareas de US2.

**Acceptance Scenarios**:

1. **Given** un backlog con `MatchStore` en US2, **When** se aplica la corrección de planeación, **Then** `MatchStore` queda definido en Foundational con sus dependencias base.
2. **Given** tareas US1 que referencian `MatchStore`, **When** se reevalúan sus dependencias, **Then** ninguna tarea US1 depende de tareas etiquetadas como US2.

---

### User Story 2 - Preservar Trazabilidad de Reglas (Priority: P2)

Como analista de calidad, necesito que la corrección de dependencias mantenga trazabilidad clara con requerimientos funcionales y checkpoints por fase.

**Why this priority**: La corrección debe resolver la inconsistencia sin perder visibilidad de qué requisito valida cada tarea y en qué orden.

**Independent Test**: Se puede validar verificando que las secciones de dependencias, checkpoints y cobertura por requerimiento sigan consistentes tras mover `MatchStore`.

**Acceptance Scenarios**:

1. **Given** la sección de dependencias por fase, **When** se actualiza el orden, **Then** US1 conserva independencia declarada y ejecutable.
2. **Given** checkpoints por fase, **When** se actualizan tareas afectadas, **Then** los criterios de salida de Foundational y US1 quedan claros y no ambiguos.

---

### User Story 3 - Evitar Regresiones Documentales (Priority: P3)

Como mantenedor de especificaciones, necesito evitar referencias rotas o contradictorias al mover tareas entre fases.

**Why this priority**: El cambio es documental/arquitectónico; su valor depende de mantener coherencia total entre secciones del artefacto.

**Independent Test**: Se puede validar con revisión estática de referencias de tareas, etiquetas de fase y narrativa de dependencias sin ejecutar código de aplicación.

**Acceptance Scenarios**:

1. **Given** IDs de tareas existentes, **When** se reubica `MatchStore`, **Then** no se duplican IDs ni se pierde rastreabilidad histórica.
2. **Given** referencias cruzadas entre tareas y fases, **When** finaliza la actualización, **Then** no quedan referencias a una ubicación anterior inválida.

### Edge Cases

- ¿Qué pasa si mover `MatchStore` a Foundational introduce una dependencia circular con servicios de infraestructura aún no definidos?
- ¿Cómo se maneja el caso en que una tarea US1 referencie implícitamente un checkpoint de US2 por texto heredado?
- ¿Qué sucede si el movimiento obliga a partir una tarea en dos para mantener atomicidad?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El artefacto de tareas DEBE ubicar la creación de `MatchStore` en la fase Foundational.
- **FR-002**: El artefacto de tareas DEBE ubicar el registro de `MatchStore` en composición/DI dentro de Foundational o en una transición explícita previa a US1.
- **FR-003**: Ninguna tarea de US1 DEBE depender de tareas etiquetadas en US2 para poder completar su flujo independiente.
- **FR-004**: La sección de dependencias por fase DEBE declarar US1 como dependiente únicamente de Setup + Foundational.
- **FR-005**: Los checkpoints de fase DEBEN reflejar el nuevo orden de habilitación técnica sin contradicciones.
- **FR-006**: Las referencias cruzadas de tareas afectadas DEBEN actualizarse para evitar vínculos obsoletos.
- **FR-007**: Los IDs de tareas existentes DEBEN preservarse o, si cambian, DEBE documentarse un mapeo explícito de antes/después.
- **FR-008**: La cobertura de requerimientos ya alcanzada (incluyendo SC-002 y SC-003) DEBE mantenerse sin pérdida.
- **FR-009**: El cambio DEBE limitarse al alcance de consistencia de planificación y no introducir nuevos requisitos funcionales de producto.
- **FR-010**: El resultado DEBE quedar listo para reanálisis sin findings de inconsistencia por dependencia US1/US2 respecto a `MatchStore`.

### Key Entities *(include if feature involves data)*

- **Phase**: Bloque de ejecución del plan (Setup, Foundational, US1, US2, ...), con atributos de orden y criterio de entrada/salida.
- **Task**: Unidad trazable de implementación o prueba con ID, fase, dependencias y criterio de terminado.
- **Dependency Rule**: Relación dirigida entre tareas/fases que define qué debe existir antes de ejecutar otra tarea.
- **Checkpoint**: Estado verificable que confirma que una fase habilita correctamente a la siguiente.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de tareas de US1 quedan libres de dependencias directas hacia tareas de US2.
- **SC-002**: El 100% de referencias a `MatchStore` en el plan de tareas apuntan a su nueva ubicación en Foundational o a sus artefactos derivados válidos.
- **SC-003**: La sección de dependencias por fase no presenta contradicciones internas en una revisión estática completa.
- **SC-004**: Un nuevo análisis de especificación no reporta findings de inconsistencia para la relación US1-`MatchStore`.

### Accessibility Criteria *(mandatory — Principio VI)*

- Este cambio no introduce interfaces nuevas, por lo que no agrega riesgos de accesibilidad.
- Toda tarea de UI que dependa de `MatchStore` mantiene los criterios de accesibilidad ya definidos en la feature de producto.

### Design System Criteria *(mandatory — Principio VII)*

- Este cambio no crea ni modifica componentes visuales.
- La reorganización de tareas no altera la obligación de usar Caribe en fases de implementación UI.

## Assumptions

- La corrección se aplica sobre el backlog existente de la feature en curso, no sobre una feature de producto nueva.
- Se conserva la numeración base de tareas salvo que una división sea estrictamente necesaria para mantener claridad.
- El equipo acepta cambios de fase/dependencia como ajuste de calidad documental previo a implementación.
- Los demás artefactos (spec/plan/contracts/research) ya contienen el contexto funcional necesario y solo requieren alineación menor si la trazabilidad lo exige.
