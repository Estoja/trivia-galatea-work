# Implementation Plan: Trivia Galatea — Juego de Preguntas con IA

**Branch**: `001-trivia-galatea-app` | **Date**: 2026-08-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-trivia-galatea-app/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Aplicación Angular 20 standalone, sin backend propio, que corre localmente en un computador y se expone al público durante un evento presencial. El jugador ingresa un alias y un tema libre; el sistema arma un tablero de 12 tarjetas boca abajo (6 "Galatea" + 6 del tema elegido), el jugador voltea y responde 6 de ellas, y al final recibe un título de nivel (0–360 pts) con una pantalla de celebración. Las preguntas de Galatea provienen de un banco JSON curado (≥ 12 preguntas, ya **anonimizado**: sin mencionar "Bancolombia" ni "Galatea" explícitamente, usando placeholders neutrales que el frontend traduce a los nombres reales). Las preguntas del tema libre se generan en tiempo real vía Vertex AI for Firebase (Gemini) inicializado desde Firebase App en el frontend, enviando únicamente el string del tema (sin datos de marca ni de sesión). La arquitectura sigue Clean Architecture + DDD (dominio puro sin Angular/HTTP, gateways abstractos, casos de uso, infraestructura con mappers), Signals para el estado, y el Design System Caribe de Bancolombia para toda la UI.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode) sobre Angular 20
**Primary Dependencies**: Angular 20 (standalone components, Signals, zoneless), `@bancolombia/caribe-design-system`, `@bancolombia/caribe-brand-bancolombia`, `firebase`, `@angular/fire` (Firebase App + Vertex AI/Gemini)
**Storage**: N/A — sin backend ni base de datos. Banco de preguntas Galatea como archivo JSON estático empaquetado en el frontend (`assets/galatea-questions.json`). Sin persistencia de datos de usuario (ver A-001, A-008).
**Testing**: Jest + Angular Testing Library (TestBed, zoneless), `@axe-core/angular` para accesibilidad, Cypress/Playwright para e2e de los flujos críticos
**Target Platform**: Navegador web de escritorio, servido localmente (`ng serve` / build estático) en el computador del evento y expuesto a los participantes en red local — sin backend
**Project Type**: Aplicación web single-page (frontend-only)
**Performance Goals**: FCP ≤ 1.5 s, LCP ≤ 2.5 s, TBT ≤ 200 ms (Principio IX); generación de preguntas del tema ≤ 8 s en el 90% de las partidas (SC-003)
**Constraints**: Sin backend — todo el estado vive en el navegador (signals); integración a Gemini obligatoriamente por Firebase App + Vertex AI en cliente (`firebase` + `@angular/fire`), sin canal HTTP directo custom a Gemini; anonimización obligatoria del prompt hacia IA (FR-018/FR-019, sin mencionar Bancolombia/Galatea en payload no curado)
**Scale/Scope**: Un solo evento presencial concurrente, decenas de jugadores secuenciales, 4 pantallas (inicio, tablero, pregunta, resultados), banco de preguntas Galatea ≥ 12 registros

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Arquitectura Limpia**: capas Dominio → Aplicación → Infraestructura → Presentación respetadas; sin saltar capas. → Ver estructura de carpetas abajo; gateways abstractos (`QuestionGateway`) desacoplan Gemini/JSON del dominio.
- [x] **II. DDD**: conceptos de negocio modelados como entidades de dominio; lenguaje ubicuo presente en nombres. → `Player`, `Match`, `Card`, `Question`, `Score`, `Level` como modelos de dominio (ver data-model.md).
- [x] **III. Nomenclatura semántica**: nombres de variables/funciones/clases son autoexplicados; sin abreviaturas crípticas. → Se aplican convenciones de instructions_2 (`calculateMatchScore`, `isCardFlipped`, `hasReachedMaxAnswers`).
- [x] **IV. Simplicidad**: no se crean abstracciones sin caso de uso real presente; complejidad justificada en tabla inferior. → Un solo gateway por fuente externa (Gemini, banco JSON); sin capas adicionales especulativas.
- [x] **V. Cobertura ≥ 80 %**: plan incluye tareas de pruebas para cada caso de uso; casos de uso críticos apuntan ≥ 95 %. → `CalculateMatchScoreUsecase` y `AssignLevelUsecase` (lógica crítica de puntuación) apuntan a 100% de branches.
- [x] **VI. Accesibilidad**: componentes nuevos incluyen tarea de revisión con axe-core; roles ARIA contemplados en diseño. → Tarjetas con `aria-label` dinámico, `aria-live` para puntaje y retroalimentación (ver research.md).
- [x] **VII. Design System Caribe**: no se proponen componentes visuales propios cuando Caribe ofrece equivalente. → `cb-button`, `cb-loader`, `cb-status`, `cb-icon` reutilizados; sólo `tg-question-card`, `tg-score-board`, `tg-celebration` son componentes propios porque no tienen equivalente en Caribe.
- [x] **VIII. UX Consistente**: estados de carga, error y vacío están planificados para cada flujo asíncrono. → Loading durante generación IA, error con reintento si Gemini falla, estado vacío no aplica (banco Galatea siempre disponible localmente).
- [x] **IX. Rendimiento**: estimación de impacto en bundle size y LCP; lazy loading contemplado para módulos nuevos. → Rutas lazy-loaded por página (`welcome`, `board`, `results`); banco JSON de Galatea es un asset estático pequeño (< 20 KB).
- [x] **X. Calidad de código**: ESLint + Prettier + TypeScript strict; sin `any`; sin `console.log` en producción. → Se usa `LoggerService` inyectable en vez de `console.log` (ver research.md).

**Post-Design Re-check (tras Fase 1)**: Confirmado — `research.md`, `data-model.md` y `contracts/` no introdujeron ninguna dependencia, capa o componente adicional no contemplado en este gate. Los gateways abstractos, el diccionario de anonimización, y los usecases puros (`CalculateMatchScoreUsecase`, `AssignLevelUsecase`) mantienen las 10 puertas en `[x]` sin excepciones. Tabla de Complexity Tracking permanece vacía.

## Project Structure

### Documentation (this feature)

```text
specs/001-trivia-galatea-app/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── gemini-prompt-contract.md
│   ├── galatea-question-bank.schema.json
│   └── internal-gateways.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── index.html
├── main.ts
├── styles.scss
└── app/
    ├── app.ts                      # Root component (tg-root)
    ├── app.config.ts               # Composition Root — toda la DI real
    ├── app.config.local.ts         # Composition Root — mocks (ng serve sin Gemini)
    ├── app.routes.ts               # Rutas lazy-loaded
    ├── domain/
    │   ├── models/
    │   │   ├── player/
    │   │   │   └── player.model.ts
    │   │   ├── question/
    │   │   │   ├── question.model.ts       # Question, QuestionSource
    │   │   │   └── gateway/
    │   │   │       └── question.gateway.ts
    │   │   ├── match/
    │   │   │   ├── match.model.ts          # Match, Card, Answer
    │   │   │   └── usecase/
    │   │   │       ├── build-match.usecase.ts
    │   │   │       ├── answer-card.usecase.ts
    │   │   │       └── calculate-match-score.usecase.ts
    │   │   └── level/
    │   │       ├── level.model.ts          # Level, LevelTier
    │   │       └── usecase/
    │   │           └── assign-level.usecase.ts
    │   └── enums/
    │       └── question-source.enum.ts
    ├── infrastructure/
    │   ├── question/
    │   │   ├── question.service.ts         # Gemini (tema) + banco JSON (Galatea)
    │   │   └── question-mock.service.ts    # Mock local para ng serve
    │   ├── gemini/
    │   │   ├── gemini-client.service.ts    # Cliente Vertex AI (Gemini) sobre Firebase App
    │   │   └── gemini-topic-anonymizer.ts  # Anonimiza el prompt antes de enviarlo
    │   └── helpers/
    │       └── maps/
    │           ├── common/
    │           │   └── mapper.ts
    │           ├── gemini-question.mapper.ts
    │           └── galatea-question.mapper.ts
    ├── shared/
    │   └── foundational/
    │       └── state/
    │           ├── match-store.port.ts      # Contrato de estado compartido
    │           └── match-store.service.ts   # Implementación signal-based fundacional
    ├── ui/
    │   ├── pages/
    │   │   ├── welcome/                    # Alias + tema
    │   │   ├── board/                      # Tablero de 12 tarjetas
    │   │   └── results/                    # Nivel + celebración
    │   ├── components/
    │   │   ├── question-card/              # tg-question-card
    │   │   ├── question-modal/             # tg-question-modal (pregunta + opciones)
    │   │   ├── score-board/                # tg-score-board (puntaje en vivo)
    │   │   ├── celebration/                # tg-celebration (efectos por nivel)
    │   │   └── shared/
    │   │       └── match.constants.ts      # Constantes numéricas (10 pts, 6 cartas, etc.)
    │   └── state/
    │       └── (consumo de MatchStorePort desde páginas/componentes)
    └── environments/
        ├── environment.ts                  # Local — mocks + bloque firebase con valores vacíos
        └── environment.development.ts      # Firebase App + Vertex AI (Gemini) para modo real

public/
└── assets/
    └── galatea-questions.json      # Banco curado y anonimizado (≥ 12 preguntas)

# tests conviven junto a cada archivo como *.spec.ts (convención Angular/Jest de instructions_2)
```

**Structure Decision**: Proyecto Angular único (frontend-only), sin `backend/`. Se sigue la estructura de capas de `.github/instructions_2/clean-architecture.instructions.md`: `domain/` (modelos + gateways + casos de uso, cero dependencias externas), `infrastructure/` (Gemini + banco JSON + mappers), `shared/foundational` (capacidades transversales como `MatchStorePort` y `MatchStoreService`), `ui` (páginas smart + componentes dumb que consumen el puerto del store, sin poseer la implementación). Dos Composition Roots (`app.config.ts` real, `app.config.local.ts` mock) permiten que `ng serve` funcione sin conexión a Gemini, cumpliendo el principio de "frontend sin backend" reflejado en las instrucciones del proyecto.

## Complexity Tracking

> No hay violaciones de la Constitución que requieran justificación. Tabla vacía intencionalmente.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
