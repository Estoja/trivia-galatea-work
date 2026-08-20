<!-- SPECKIT START -->
## Spec-Driven Development Context

This repository uses [GitHub Spec Kit](https://github.com/github/spec-kit) for spec-driven development.

**Active feature plan**: [specs/002-move-matchstore-foundational/plan.md](../specs/002-move-matchstore-foundational/plan.md)

Related artifacts for the active feature:
- Spec: [specs/002-move-matchstore-foundational/spec.md](../specs/002-move-matchstore-foundational/spec.md)
- Research: [specs/002-move-matchstore-foundational/research.md](../specs/002-move-matchstore-foundational/research.md)
- Data Model: [specs/002-move-matchstore-foundational/data-model.md](../specs/002-move-matchstore-foundational/data-model.md)
- Contracts: [specs/002-move-matchstore-foundational/contracts/](../specs/002-move-matchstore-foundational/contracts/)
- Quickstart: [specs/002-move-matchstore-foundational/quickstart.md](../specs/002-move-matchstore-foundational/quickstart.md)
- Constitution: [.specify/memory/constitution.md](../.specify/memory/constitution.md)
<!-- SPECKIT END -->

## Project Overview

Trivia Galatea es una SPA en Angular 20 (standalone, zoneless, Signals) sin backend, usada durante un evento presencial de Bancolombia. Los jugadores ingresan un alias, eligen un tema libre, y juegan un tablero de 12 tarjetas (6 preguntas sobre Galatea + 6 sobre el tema elegido), respondiendo 6 de ellas para obtener un puntaje y un nivel/título.

## Architecture Reference

Este proyecto sigue **Clean Architecture + DDD**. Las convenciones detalladas de patrones de código, nomenclatura y estructura de carpetas están documentadas en `.github/instructions_2/`:

- [golden-rules.instructions.md](./instructions_2/golden-rules.instructions.md) — reglas de oro no negociables
- [clean-architecture.instructions.md](./instructions_2/clean-architecture.instructions.md) — capas, gateways abstractos, composition roots
- [business-domain.instructions.md](./instructions_2/business-domain.instructions.md) — lenguaje de dominio (DDD)
- [angular-best-practices.instructions.md](./instructions_2/angular-best-practices.instructions.md) — Angular 20 standalone/zoneless/Signals
- [angular-component.instructions.md](./instructions_2/angular-component.instructions.md) — convenciones de componentes
- [signal-patterns.instructions.md](./instructions_2/signal-patterns.instructions.md) — patrones de stores basados en Signals
- [caribe-design-system.instructions.md](./instructions_2/caribe-design-system.instructions.md) — uso del sistema de diseño Caribe
- [frontend-implementation.instructions.md](./instructions_2/frontend-implementation.instructions.md) — ejemplos de implementación de referencia

> **Nota importante**: los ejemplos de mecánica de juego en `instructions_2/` (8 preguntas, puntaje por porcentaje) describen un modelo de juego más simple que **no** corresponde a las reglas de negocio reales de esta feature. Para las reglas de negocio (12 tarjetas, 6 respondidas, fórmula de multiplicador, 7 niveles), la fuente de verdad es [specs/001-trivia-galatea-app/spec.md](../specs/001-trivia-galatea-app/spec.md) y [data-model.md](../specs/001-trivia-galatea-app/data-model.md). Usar `instructions_2/` únicamente para patrones de arquitectura/código, no para reglas de negocio.

## Governance

Toda contribución debe cumplir la [constitución del proyecto](../.specify/memory/constitution.md): Clean Architecture (no negociable), DDD, cobertura de tests ≥80% (usecases ≥95%, no negociable), accesibilidad WCAG 2.1 AA (no negociable), Sistema de Diseño Caribe (no negociable).
