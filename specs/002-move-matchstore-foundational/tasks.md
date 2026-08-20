# Tasks: Move MatchStore Foundational

**Input**: Design documents from `/specs/002-move-matchstore-foundational/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Se incluyen tareas de validacion documental y de contrato tecnico donde aportan evidencia directa para FR-003, FR-004, FR-010 y cumplimiento del principio V de cobertura.

**Organization**: Tareas agrupadas por historia para validacion independiente por historia; el orden de ejecucion puede ser secuencial cuando una historia produce evidencia documental requerida por la siguiente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias)
- **[Story]**: Historia de usuario a la que pertenece la tarea (US1, US2, US3)
- Todas las tareas incluyen ruta de archivo exacta

## Path Conventions

Proyecto unico Angular/frontend con artefactos de especificacion en `specs/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar inventario y base de migracion para mover MatchStore sin perder trazabilidad

- [X] T001 Crear inventario base de dependencias de MatchStore en `specs/002-move-matchstore-foundational/checklists/dependency-audit.md` usando como fuente `specs/001-trivia-galatea-app/tasks.md`
- [X] T002 [P] Crear mapeo antes/despues de tareas relocalizadas en `specs/002-move-matchstore-foundational/checklists/task-relocation-map.md` (ID, fase origen, fase destino, impacto)
- [X] T003 [P] Documentar criterios de aceptacion de migracion (FR-001..FR-010) en `specs/002-move-matchstore-foundational/checklists/migration-acceptance.md`

**Checkpoint**: Existe baseline verificable para ejecutar la migracion de dependencias y validar que no haya regresiones documentales.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Definir capacidad fundacional compartida y preparar artefactos bloqueantes para todas las historias

**CRITICAL**: Ninguna historia puede comenzar hasta terminar esta fase

- [X] T004 Crear contrato `MatchStorePort` en `src/app/shared/foundational/state/match-store.port.ts` alineado con `specs/002-move-matchstore-foundational/contracts/matchstore-port.md`
- [X] T005 Crear implementacion `MatchStoreService` encapsulada en `src/app/shared/foundational/state/match-store.service.ts` con Signals privados y API publica del puerto
- [X] T006 Registrar providers fundacionales de MatchStore en `src/app/app.config.ts` y `src/app/app.config.local.ts` sin acoplar consumidores a clase concreta
- [X] T007 [P] Actualizar estructura objetivo del plan para capa shared/foundational en `specs/001-trivia-galatea-app/plan.md`
- [X] T008 Actualizar contrato de gateway interno para referenciar consumo via puerto de store en `specs/001-trivia-galatea-app/contracts/internal-gateways.md`
- [X] T031 [P] [US1] Crear pruebas de contrato de MatchStorePort en `src/app/shared/foundational/state/match-store.port.spec.ts` validando surface publica y razones de error de comandos
- [X] T032 [P] [US1] Crear pruebas unitarias de MatchStoreService en `src/app/shared/foundational/state/match-store.service.spec.ts` validando invariantes: una tarjeta activa, maximo 6 respuestas y transiciones validas
- [X] T033 [US1] Ejecutar cobertura de pruebas para cambios de la feature y registrar evidencia en `specs/002-move-matchstore-foundational/checklists/migration-acceptance.md` con umbral minimo 80%

**Checkpoint**: MatchStore existe como capacidad fundacional reusable (contrato + servicio + DI) antes de tareas de historias.

---

## Phase 3: User Story 1 - Reordenar Dependencias Base (Priority: P1) 🎯 MVP

**Goal**: Mover MatchStore a Foundational y eliminar dependencia US1 -> US2 en el backlog operativo.

**Independent Test**: Revisar `specs/001-trivia-galatea-app/tasks.md` y confirmar que tareas de MatchStore y DI estan en Foundational, y que US1 no depende de tareas etiquetadas US2.

### Implementation for User Story 1

- [X] T009 [US1] Reubicar tarea de creacion de MatchStore desde fase US2 a fase Foundational en `specs/001-trivia-galatea-app/tasks.md` preservando ID original
- [X] T010 [US1] Reubicar tarea de registro DI de MatchStore desde fase US2 a fase Foundational en `specs/001-trivia-galatea-app/tasks.md` preservando ID original
- [X] T011 [US1] Actualizar dependencias explicitas de tarea US1 de navegacion/store para que dependa solo de tareas Foundational en `specs/001-trivia-galatea-app/tasks.md`
- [X] T012 [US1] Ajustar checkpoint de Foundational para declarar disponibilidad de estado compartido antes de US1 en `specs/001-trivia-galatea-app/tasks.md`
- [X] T013 [US1] Ajustar checkpoint de US1 para remover referencias a prerequisitos de US2 en `specs/001-trivia-galatea-app/tasks.md`
- [X] T014 [US1] Actualizar seccion `Phase Dependencies` para declarar que US1 depende solo de Setup + Foundational en `specs/001-trivia-galatea-app/tasks.md`
- [X] T015 [US1] Actualizar seccion `User Story Dependencies` para eliminar toda referencia US1 -> US2 por MatchStore en `specs/001-trivia-galatea-app/tasks.md`

**Checkpoint**: US1 queda formalmente independiente de US2 y MatchStore queda habilitado desde Foundational.

---

## Phase 4: User Story 2 - Preservar Trazabilidad de Reglas (Priority: P2)

**Goal**: Mantener trazabilidad clara de reglas, IDs y cobertura tras la migracion.

**Independent Test**: Verificar que exista mapeo antes/despues, que no se pierdan IDs y que la cobertura SC-002/SC-003 del backlog base siga intacta.

### Implementation for User Story 2

- [X] T016 [US2] Registrar mapeo final de tareas movidas (sin renumeracion global) en `specs/002-move-matchstore-foundational/checklists/task-relocation-map.md`
- [X] T017 [P] [US2] Documentar justificacion de cada dependencia cambiada con referencia a FR-003 y FR-004 en `specs/002-move-matchstore-foundational/checklists/dependency-audit.md`
- [X] T018 [US2] Validar y documentar preservacion de cobertura de SC-002 y SC-003 del backlog base en `specs/002-move-matchstore-foundational/checklists/migration-acceptance.md`
- [X] T019 [US2] Actualizar `Verification Matrix` con evidencia de cumplimiento FR-001..FR-010 en `specs/002-move-matchstore-foundational/contracts/task-dependency-migration.md`
- [X] T020 [US2] Actualizar quickstart de migracion con pasos finales de verificacion trazable en `specs/002-move-matchstore-foundational/quickstart.md`
- [X] T021 [US2] Actualizar narrativa de decisiones y no-regresion tras ejecución real en `specs/002-move-matchstore-foundational/research.md`
- [X] T034 [US2] Ejecutar control de alcance FR-009 en `specs/002-move-matchstore-foundational/checklists/migration-acceptance.md` confirmando que no se agregaron requisitos funcionales de producto fuera de la migracion de dependencias

**Checkpoint**: La migracion conserva trazabilidad completa (IDs, reglas, dependencias y criterios de exito).

---

## Phase 5: User Story 3 - Evitar Regresiones Documentales (Priority: P3)

**Goal**: Asegurar consistencia total entre artefactos y dejar la feature lista para re-analisis sin hallazgos del tipo I1.

**Independent Test**: Revisión estatica cruzada entre `spec.md`, `plan.md`, `tasks.md`, contratos y checklist sin referencias rotas ni contradicciones.

### Implementation for User Story 3

- [X] T022 [US3] Revisar y corregir referencias cruzadas de feature activa en `.github/copilot-instructions.md` para mantener contexto 002 consistente
- [X] T023 [P] [US3] Ejecutar validacion de prerequisitos de tasks y registrar evidencia en `specs/002-move-matchstore-foundational/checklists/migration-acceptance.md`
- [X] T024 [US3] Ejecutar analisis de consistencia de la feature y documentar resultados en `specs/002-move-matchstore-foundational/checklists/migration-acceptance.md` con criterio de aceptacion: 0 findings HIGH/CRITICAL sobre dependencia US1-US2 por MatchStore
- [X] T025 [US3] Incorporar acciones correctivas del analisis en `specs/001-trivia-galatea-app/tasks.md` cuando el reporte de analyze incluya al menos un finding HIGH o CRITICAL
- [X] T026 [US3] Actualizar estado final de readiness para implementacion en `specs/002-move-matchstore-foundational/plan.md`

**Checkpoint**: No quedan contradicciones documentales y la feature queda preparada para implementacion/ejecucion posterior.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cierre transversal, calidad final y estrategia de entrega incremental

- [X] T027 [P] Ejecutar revision final de formato checklist estricto (`- [ ] T### [P?] [US?] ...`) en `specs/002-move-matchstore-foundational/tasks.md`
- [X] T028 [P] Verificar que no existan dependencias circulares entre fases en `specs/001-trivia-galatea-app/tasks.md`
- [X] T029 Consolidar resumen ejecutivo de cambios de migracion para PR en `specs/002-move-matchstore-foundational/checklists/migration-acceptance.md`
- [X] T030 Ejecutar validacion completa de quickstart de la feature 002 y registrar discrepancias en `specs/002-move-matchstore-foundational/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias
- **Foundational (Phase 2)**: Depende de Setup y bloquea todas las historias
- **US1 (Phase 3)**: Depende de Foundational
- **US2 (Phase 4)**: Puede iniciar tras Foundational; su validacion final usa la salida de US1 para auditoria trazable
- **US3 (Phase 5)**: Puede preparar validaciones en paralelo tras Foundational; el cierre de consistencia usa evidencia consolidada de US1 y US2
- **Polish (Phase 6)**: Depende de completar historias requeridas

### User Story Dependencies

- **US1 (P1)**: No depende de US2 ni US3
- **US2 (P2)**: Puede iniciar tras Foundational; su cierre requiere la evidencia de reubicacion producida por US1 para auditar trazabilidad real
- **US3 (P3)**: Requiere evidencia consolidada de US1 y US2 para cerrar consistencia

### Within Each User Story

- Primero ajustes estructurales de tareas/dependencias
- Luego evidencia trazable y matrices de verificacion
- Finalmente analisis y cierre de consistencia

### Parallel Opportunities

- Tareas [P] de Setup: T002, T003
- Tareas [P] de Foundational: T007, T031, T032
- Tareas [P] de US2: T017
- Tareas [P] de US3: T023
- Tareas [P] de Polish: T027, T028

---

## Parallel Example: User Story 1

```bash
Task: "Reubicar tarea de creacion de MatchStore en specs/001-trivia-galatea-app/tasks.md"
Task: "Reubicar tarea de registro DI de MatchStore en specs/001-trivia-galatea-app/tasks.md"
Task: "Actualizar dependencias y checkpoints de US1 en specs/001-trivia-galatea-app/tasks.md"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1
2. Completar Phase 2
3. Completar Phase 3 (US1)
4. Validar independencia US1 sin dependencia de US2
5. Detener y revisar

### Incremental Delivery

1. Setup + Foundational
2. US1 (migracion de dependencia)
3. US2 (trazabilidad)
4. US3 (no-regresion documental)
5. Polish final

### Parallel Team Strategy

Con multiples desarrolladores:

1. Persona A: Setup + Foundational tecnico
2. Persona B: Ajustes de backlog base en `specs/001-trivia-galatea-app/tasks.md`
3. Persona C: Evidencia/checklists y cierre de consistencia

---

## Notes

- [P] indica tareas en archivos distintos y sin bloqueo directo
- Mantener IDs existentes del backlog base cuando no cambie semantica
- Evitar introducir requerimientos funcionales de producto fuera del alcance de migracion
