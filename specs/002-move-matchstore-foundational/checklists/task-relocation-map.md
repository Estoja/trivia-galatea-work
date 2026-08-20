# Task Relocation Map (T002/T016)

## Before -> After

| Task ID | Before Phase | After Phase | Semantics Changed | Notes |
|---|---|---|---|---|
| T046 | Phase 4 (US2) | Phase 2 (Foundational) | No | Se mantiene el ID; cambia ubicación para habilitar US1 sin dependencia de US2. |
| T051 | Phase 4 (US2) | Phase 2 (Foundational) | No | Se mantiene el ID; DI de MatchStore pasa a fundacional. |
| T038 | Phase 3 (US1) | Phase 3 (US1) | Yes (dependencies only) | Actualiza dependencias para apuntar a T046/T051 fundacionales. |

## Integrity Checks

- Renumeración global: No aplicada.
- IDs preservados: Sí.
- Dependencias US1 -> US2 por MatchStore: Eliminadas.
