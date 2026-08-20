# Implementation Plan: Move MatchStore Foundational

**Branch**: `002-trivia-galatea-app` | **Date**: 2026-08-20 | **Spec**: [specs/002-move-matchstore-foundational/spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-move-matchstore-foundational/spec.md`

## Summary

Esta feature corrige la inconsistencia de planificación donde US1 dependía de US2 por la ubicación de `MatchStore`. La solución técnica extrae `MatchStore` como capacidad fundacional compartida (shared/foundational layer), implementada como servicio Angular con TypeScript y estado encapsulado, y expuesta mediante una interfaz clara (`MatchStorePort`) consumible por US1 y demás historias sin acoplamiento a detalles internos.

## Technical Context

**Language/Version**: TypeScript 5.9 + Angular 20 standalone/zoneless/signals  
**Primary Dependencies**: Angular DI, Signals (`signal`, `computed`), arquitectura existente Clean Architecture + DDD  
**Storage**: N/A (estado en memoria del navegador)  
**Testing**: Jest + Angular Testing Library + pruebas de contrato para puerto interno  
**Target Platform**: SPA web de escritorio ejecutada en navegador
**Project Type**: Frontend-only web application (documental/arquitectura interna)  
**Performance Goals**: Sin degradación de métricas actuales; costo de acceso a estado compartido O(1) por lectura de señales; cero impacto en bundle inicial significativo  
**Constraints**: Mantener independencia US1 respecto a US2; no introducir nuevos requisitos de producto; preservar reglas FR/SC existentes (incl. SC-002 y SC-003); evitar acoplamiento a implementación concreta de store  
**Scale/Scope**: Reorganización de dependencias y contratos internos para una aplicación y 4 historias de usuario existentes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Arquitectura Limpia**: `MatchStorePort` define frontera de consumo; implementación concreta queda en capa shared/foundational sin saltos de capa.
- [x] **II. DDD**: El store mantiene semántica de dominio (partida, tarjeta activa, respuestas, puntaje) con lenguaje ubicuo consistente.
- [x] **III. Nomenclatura semántica**: interfaz y comandos propuestos autoexplicativos (`initializeSession`, `confirmAnswer`, `resetSession`).
- [x] **IV. Simplicidad**: no se añade framework externo de estado; se reutiliza Angular Signals y DI nativos.
- [x] **V. Cobertura ≥ 80 %**: la planificación incluye validación de contrato y no-regresión de dependencias; usecases críticos permanecen bajo su umbral original.
- [x] **VI. Accesibilidad**: no se introducen componentes UI nuevos; los criterios existentes se preservan sin reducción de cobertura.
- [x] **VII. Design System Caribe**: no hay cambios visuales ni de componentes de diseño.
- [x] **VIII. UX Consistente**: la disponibilidad temprana del estado compartido evita flujos inconsistentes entre pantallas.
- [x] **IX. Rendimiento**: estado compartido reactivo en memoria sin llamadas remotas adicionales ni cargas nuevas.
- [x] **X. Calidad de código**: se mantiene TypeScript strict, DI explícita y encapsulación de estado sin `any` ni `console.log`.

**Post-Design Re-check (tras Fase 1)**: Confirmado. `research.md`, `data-model.md`, `contracts/` y `quickstart.md` no introducen violaciones constitucionales. La extracción a capa fundacional reduce acoplamiento y mejora trazabilidad sin ampliar alcance funcional.

## Project Structure

### Documentation (this feature)

```text
specs/002-move-matchstore-foundational/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── matchstore-port.md
│   └── task-dependency-migration.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
└── app/
    ├── shared/
    │   └── foundational/
    │       └── state/
    │           ├── match-store.port.ts      # interfaz estable para consumidores
    │           └── match-store.service.ts   # implementación concreta encapsulada
    ├── ui/
    │   ├── pages/
    │   │   ├── welcome/
    │   │   ├── board/
    │   │   └── results/
    │   └── components/
    └── app.config.ts / app.config.local.ts  # registro DI fundacional
```

**Structure Decision**: Se mantiene un único proyecto Angular. Se introduce explícitamente una subcapa `shared/foundational/state` para alojar el contrato e implementación de `MatchStore`, habilitando a US1 y demás historias mediante dependencia al puerto.

## Phase 0: Research Output

Resultado consolidado en [research.md](./research.md):
- Se adopta extracción de `MatchStore` a Foundational.
- Se define `MatchStorePort` como contrato interno estable.
- Se mantiene implementación con servicio Angular + Signals encapsulados.
- Se establece migración de tareas preservando IDs siempre que no cambie semántica.

## Phase 1: Design & Contracts Output

Artefactos generados:
- [data-model.md](./data-model.md)
- [contracts/matchstore-port.md](./contracts/matchstore-port.md)
- [contracts/task-dependency-migration.md](./contracts/task-dependency-migration.md)
- [quickstart.md](./quickstart.md)

## Complexity Tracking

> No hay violaciones de la Constitución que requieran justificación. Tabla vacía intencionalmente.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
