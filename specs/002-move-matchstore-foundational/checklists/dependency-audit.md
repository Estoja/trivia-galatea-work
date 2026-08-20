# Dependency Audit - MatchStore Migration

## Baseline (T001)
- Source document: `specs/001-trivia-galatea-app/tasks.md`
- MatchStore originally located in US2 (`T046`) with DI registration in US2 (`T051`).
- US1 carried an implicit dependency on US2 because `T038` referenced MatchStore created in Phase 4.

## Dependency Changes (T017)
- Move `T046` to Foundational phase in source backlog.
- Move `T051` to Foundational phase in source backlog.
- Update `T038` dependency list to point to Foundational tasks instead of US2 task IDs.
- Update phase and user-story dependency sections so US1 depends only on Setup + Foundational.

## FR Justification (FR-003, FR-004)
- FR-003: `T038` ahora depende de `T046`/`T051` fundacionales, eliminando el prerequisito técnico desde US2 para iniciar US1.
- FR-004: las secciones `Phase Dependencies` y `User Story Dependencies` del backlog base declaran explícitamente independencia US1 respecto a US2 para disponibilidad de store.

## Validation Rules
- No direct US1 -> US2 dependency remains for MatchStore availability.
- Foundational checkpoint explicitly states shared state availability before US1.
- No circular dependency introduced by migration.
