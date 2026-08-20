# Contract - Task Dependency Migration

## Goal
Formalizar la migración de dependencias para que US1 dependa solo de Setup + Foundational, incluyendo MatchStore como capacidad fundacional.

## Baseline
- MatchStore creation task estaba en US2.
- US1 tenía al menos una dependencia directa o implícita hacia tarea de US2.

## Required Migration Rules
1. Mover creación de MatchStore a Foundational.
2. Mover registro DI de MatchStore a Foundational.
3. Eliminar dependencias US1 -> US2 relacionadas con disponibilidad de store.
4. Actualizar checkpoints de Foundational y US1 para reflejar el nuevo orden.

## Allowed Transformations
- Reubicación de tareas manteniendo ID original.
- Split de tarea solo si mejora atomicidad; en ese caso, registrar mapeo antes/después.
- Ajuste de texto en dependencias de fase y notas de checkpoint.

## Prohibited Transformations
- Introducir nuevas funcionalidades de producto no solicitadas.
- Renumeración global de tasks sin necesidad.
- Mover capacidades de dominio fuera de Clean Architecture.

## Verification Matrix
- FR-001/FR-002: validado si tareas de creación y registro DI de MatchStore están en Foundational.
- FR-003/FR-004: validado si ninguna tarea US1 depende de US2.
- FR-005/FR-006: validado si checkpoints y referencias cruzadas están actualizados.
- FR-010: validado si re-analyze no reporta inconsistencia US1-US2 por MatchStore.

## Execution Evidence

| Rule | Evidence | Status |
|---|---|---|
| FR-001/FR-002 | `specs/001-trivia-galatea-app/tasks.md`: `T046` y `T051` movidas a Foundational | PASS |
| FR-003/FR-004 | `T038` actualizado para depender de `T046`/`T051`; secciones de dependencias sin vínculo US1 -> US2 por store | PASS |
| FR-005/FR-006 | Checkpoint de Foundational actualizado con disponibilidad de estado compartido; trazabilidad documentada en checklists de `specs/002...` | PASS |
| FR-010 | Resultado de analyze más reciente sin findings HIGH/CRITICAL sobre inconsistencia US1-US2 por MatchStore (registrado en `migration-acceptance.md`) | PASS |
