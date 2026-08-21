# Tasks: Trivia Galatea — Juego de Preguntas con IA

**Input**: Design documents from `/specs/001-trivia-galatea-app/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Incluidos. La [constitución del proyecto](../../.specify/memory/constitution.md) exige cobertura ≥80% (usecases ≥95%, NO NEGOCIABLE) — por lo tanto se incluyen tareas de prueba para cada caso de uso y componente crítico, aunque spec.md no las solicita explícitamente historia por historia.

**Organization**: Tareas agrupadas por historia de usuario (US1–US4 de spec.md) para permitir implementación y prueba independientes de cada una.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias)
- **[Story]**: Historia de usuario a la que pertenece (US1, US2, US3, US4)
- Rutas de archivo exactas según la estructura de [plan.md](./plan.md)

## Path Conventions

Proyecto único Angular 20 (frontend-only, sin backend): `src/app/` con capas `domain/`, `infrastructure/`, `ui/`. Ver árbol completo en [plan.md — Project Structure](./plan.md).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicialización del proyecto Angular y configuración base

- [ ] T000 Gate obligatorio de Setup (C1): ejecutar `npm test --code-coverage` y validar `src/app/shared/foundational/state/match-store.port.spec.ts` + `src/app/shared/foundational/state/match-store.service.spec.ts`; este paso se ejecuta al cierre de Setup (después de T001-T008) y es gate de salida obligatorio antes de continuar con cualquier tarea de historias de usuario (US1-US4)
- [ ] T001 Crear proyecto Angular 20 standalone/zoneless (`ng new trivia-galatea --standalone --style=scss --routing`) y verificar estructura contra [plan.md — Project Structure](./plan.md)
- [ ] T002 Configurar `.npmrc` para el registro Artifactory de Bancolombia e instalar `@bancolombia/caribe-design-system` + `@bancolombia/caribe-brand-bancolombia` + dependencias de integración Gemini/Firebase (`firebase`, `@angular/fire`) siguiendo el patrón de `agentic-angular-vertex/example` (ver [quickstart.md §1](./quickstart.md))
- [ ] T003 [P] Configurar ESLint + Prettier + TypeScript strict mode (`tsconfig.json` sin `any`, Principio X de la constitución)
- [ ] T004 [P] Configurar Jest + Angular Testing Library en modo zoneless (`jest.config.js`, `setup-jest.ts`) reemplazando Karma/Jasmine por defecto
- [ ] T005 [P] Instalar y configurar `@axe-core/angular` para pruebas de accesibilidad automatizadas
- [ ] T006 [P] Instalar y configurar Cypress o Playwright para e2e de los flujos críticos
- [ ] T007 Crear `src/environments/environment.ts` y `src/environments/environment.development.ts` incluyendo el bloque `firebase` (`apiKey`, `appId`, `messagingSenderId`, `projectId`, `authDomain`, `storageBucket`, `measurementId`) con valores vacíos por defecto y carga segura desde `.env` local no versionado
- [ ] T008 [P] Crear placeholder `public/assets/galatea-questions.json` cumpliendo [contracts/galatea-question-bank.schema.json](./contracts/galatea-question-bank.schema.json) con ≥12 preguntas de ejemplo anonimizadas

**Checkpoint**: Proyecto Angular corre con `ng serve`, lint y test runner configurados, y el gate C1 de cobertura para MatchStorePort/MatchStoreService está validado antes de arrancar historias de usuario.

**A1 (orden de ejecución)**: T000 se ejecuta al final de Setup y bloquea el paso a US1-US4 hasta que la validación de cobertura C1 quede en PASS.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Modelos de dominio, gateways abstractos, mappers base y Composition Roots — bloquean el trabajo de cualquier historia de usuario

**⚠️ CRITICAL**: Ninguna historia de usuario puede iniciar hasta completar esta fase

- [ ] T009 [P] Crear `PlayerModel` en `src/app/domain/models/player/player.model.ts` (ver [data-model.md — Player](./data-model.md))
- [ ] T010 [P] Crear `QuestionModel` y `QuestionSource` en `src/app/domain/models/question/question.model.ts` + enum en `src/app/domain/enums/question-source.enum.ts` (ver [data-model.md — Question](./data-model.md))
- [ ] T011 [P] Crear `CardModel`, `CardState`, `AnswerResult` en `src/app/domain/models/match/match.model.ts` (ver [data-model.md — Card](./data-model.md))
- [ ] T012 [P] Crear `MatchModel`, `MatchStatus` en `src/app/domain/models/match/match.model.ts` (ver [data-model.md — Match](./data-model.md))
- [ ] T013 [P] Crear `ScoreModel` en `src/app/domain/models/match/match.model.ts` (ver [data-model.md — Score](./data-model.md))
- [ ] T014 [P] Crear `LevelModel`, `LevelTier` en `src/app/domain/models/level/level.model.ts` (ver [data-model.md — Level](./data-model.md))
- [ ] T015 Crear `QuestionGateway` (clase abstracta) en `src/app/domain/models/question/gateway/question.gateway.ts` (depende de T010; ver [contracts/internal-gateways.md](./contracts/internal-gateways.md))
- [ ] T016 [P] Crear `Mapper<T>` (clase abstracta base) en `src/app/infrastructure/helpers/maps/common/mapper.ts`
- [ ] T017 [P] Crear `LoggerService` inyectable (`providedIn: 'root'`) en `src/app/infrastructure/logger/logger.service.ts` (Principio X — reemplaza `console.log`)
- [ ] T018 Crear `app.routes.ts` con rutas lazy-loaded para `welcome`, `board`, `results` en `src/app/app.routes.ts`
- [ ] T019 Crear Composition Root real `src/app/app.config.ts` con inicialización obligatoria de Firebase App + providers de Vertex AI (`@angular/fire/vertexai`) y dejar los providers de casos de uso para fases por historia
- [ ] T020 Crear Composition Root mock `src/app/app.config.local.ts` (depende de T019)
- [ ] T021 [P] Escribir tests unitarios de los modelos de dominio (invariantes de `MatchModel`: 12 cards, 6+6, máximo 6 respondidas) en sus respectivos `*.spec.ts`
- [ ] T046 Implementar `MatchStore` basado en signals (`_playerAlias`, `_chosenTopic`, `_cards`, `answeredCount`, `liveScore`, `isMatchComplete` computed) en `src/app/shared/foundational/state/match-store.service.ts` (depende de T012, [research.md §3](./research.md))
- [ ] T051 Registrar `MatchStore` en `app.config.ts` y `app.config.local.ts` vía `MatchStorePort` (depende de T046, T019, T020)

**Checkpoint**: Modelos de dominio, gateway abstracto, mapper base, logger, `MatchStore` fundacional y ambos Composition Roots existen y compilan — las historias de usuario pueden comenzar.

---

## Phase 3: User Story 1 - Registro de jugador y elección de tema (Priority: P1) 🎯 MVP

**Goal**: El jugador ingresa alias (2–30 caracteres) y tema libre; el sistema genera 12 preguntas (6 Galatea + 6 tema) y avanza al tablero, con manejo de carga y error (spec.md US1).

**Independent Test**: Ingresar un alias y un tema válidos y verificar que la app avanza al tablero con 12 tarjetas generadas; verificar validaciones de alias y manejo de error de IA.

### Tests for User Story 1 ⚠️

- [ ] T022 [P] [US1] Test unitario de `GeminiTopicAnonymizer` (sustitución/reversión de placeholders `Empresa X`/`Proyecto Y`) en `src/app/infrastructure/gemini/gemini-topic-anonymizer.spec.ts`
- [ ] T023 [P] [US1] Test unitario de `GeminiQuestionMapper` (parseo de respuesta Gemini → `QuestionModel`, validación de esquema FR-005) en `src/app/infrastructure/helpers/maps/gemini-question.mapper.spec.ts`
- [ ] T024 [P] [US1] Test unitario de `GalateaQuestionMapper` (resolución de placeholders del banco JSON) en `src/app/infrastructure/helpers/maps/galatea-question.mapper.spec.ts`
- [ ] T025 [P] [US1] Test unitario de `BuildMatchUsecase` con `QuestionGateway` mockeado (éxito, fallo de IA con <6 preguntas → error) en `src/app/domain/models/match/usecase/build-match.usecase.spec.ts`
- [ ] T026 [P] [US1] Test de componente para la página `welcome` (validación de alias 2–30 caracteres, tema no vacío, estados de carga/error) con Angular Testing Library en `src/app/ui/pages/welcome/welcome.page.spec.ts`
- [ ] T079 [P] [US1] Test unitario de deduplicación de preguntas Galatea + fallback (FR-021) en `src/app/infrastructure/question/question.service.spec.ts`
- [ ] T080 [P] [US1] Test unitario de política de rechazo de tema ofensivo/no apto (FR-020) en `src/app/infrastructure/gemini/topic-safety-policy.spec.ts`
- [ ] T081 [P] [US1] Test unitario de timeout/cancelación/reintento en Gemini client (30s, FR-024) en `src/app/infrastructure/gemini/gemini-client.service.spec.ts`

### Implementation for User Story 1

- [ ] T027 [P] [US1] Implementar `GeminiClientService` exclusivamente sobre Vertex AI para Firebase (`@angular/fire/vertexai` + Firebase App), con prompt de [contracts/gemini-prompt-contract.md §2](./contracts/gemini-prompt-contract.md), en `src/app/infrastructure/gemini/gemini-client.service.ts`
- [ ] T028 [US1] Implementar `GeminiTopicAnonymizer` (`BRAND_PLACEHOLDER_MAP`) en `src/app/infrastructure/gemini/gemini-topic-anonymizer.ts` (depende de T027)
- [ ] T029 [US1] Implementar `GeminiQuestionMapper extends Mapper<QuestionModel>` en `src/app/infrastructure/helpers/maps/gemini-question.mapper.ts` (depende de T016, T010)
- [ ] T030 [US1] Implementar `GalateaQuestionMapper extends Mapper<QuestionModel>` en `src/app/infrastructure/helpers/maps/galatea-question.mapper.ts` (depende de T016, T010)
- [ ] T031 [US1] Implementar `QuestionService implements QuestionGateway` (banco JSON + fallback IA para Galatea, Gemini para tema; [contracts/internal-gateways.md](./contracts/internal-gateways.md)) en `src/app/infrastructure/question/question.service.ts` (depende de T015, T028, T029, T030)
- [ ] T032 [P] [US1] Implementar `QuestionMockService implements QuestionGateway` (datos hardcodeados) en `src/app/infrastructure/question/question-mock.service.ts` (depende de T015)
- [ ] T033 [US1] Implementar `BuildMatchUsecase` (arma `MatchModel` con 12 cards boca abajo, maneja error si Gemini no retorna 6 preguntas válidas → FR-003) en `src/app/domain/models/match/usecase/build-match.usecase.ts` (depende de T015, T011, T012)
- [ ] T034 [US1] Registrar `QuestionService` y `BuildMatchUsecase` en `app.config.ts`, `QuestionMockService` en `app.config.local.ts`, y enlazar `GeminiClientService` a los providers de Firebase App + Vertex AI definidos en T019 (depende de T031, T032, T033, T019, T020)
- [ ] T035 [US1] Implementar página `welcome` (formulario de alias + tema, validación en línea FR-001/FR-002, componentes `cb-input`/`cb-button` de Caribe) en `src/app/ui/pages/welcome/welcome.page.ts`
- [ ] T036 [US1] Implementar estado de carga con `cb-loader` durante generación de preguntas (FR-017, mensaje informativo tras 2s) en la página `welcome`
- [ ] T037 [US1] Implementar manejo de error amigable + reintento cuando la IA no genera 6 preguntas (FR-003, US1 Escenario 5), conservando el alias ingresado
- [ ] T038 [US1] Conectar `welcome` → `MatchStore`/navegación a `board` al completar la generación (depende de T035, T036, T037, T046, T051)
- [ ] T082 [US1] Implementar deduplicación de preguntas Galatea por partida (FR-021) y completar faltantes vía fallback FR-019 en `src/app/infrastructure/question/question.service.ts` (depende de T031, T079)
- [ ] T083 [US1] Implementar política de validación de tema con rechazo de contenido ofensivo/no apto (FR-020) en `src/app/infrastructure/gemini/topic-safety-policy.ts` e integración en `src/app/ui/pages/welcome/welcome.page.ts` (depende de T080, T035)
- [ ] T084 [US1] Implementar timeout de 30s con cancelación y reintento en cliente Gemini (FR-024) en `src/app/infrastructure/gemini/gemini-client.service.ts` (depende de T027, T081)

**Checkpoint**: US1 funciona de forma independiente — alias + tema → 12 preguntas generadas → navegación al tablero, con estados de carga y error.

---

## Phase 4: User Story 2 - Exploración del tablero y elección de tarjetas (Priority: P1)

**Goal**: Tablero de 12 tarjetas boca abajo; el jugador voltea, responde y confirma hasta completar 6 preguntas (spec.md US2).

**Independent Test**: Mostrar el tablero con preguntas mock, verificar selección de tarjeta, respuesta, confirmación con "Aceptar", bloqueo tras 6 respuestas y bloqueo de tarjetas ya respondidas.

### Tests for User Story 2 ⚠️

- [ ] T039 [P] [US2] Test unitario de `AnswerCardUsecase` (transiciones de estado válidas, bloqueo tras 6 respuestas, rechazo de re-respuesta) en `src/app/domain/models/match/usecase/answer-card.usecase.spec.ts`
- [ ] T040 [P] [US2] Test unitario de `MatchStore` (signals derivados: `answeredCount`, `isMatchComplete`, `liveScore`) en `src/app/shared/foundational/state/match-store.service.spec.ts`
- [ ] T041 [P] [US2] Test de componente `tg-question-card` (estados face-down/flipped/answered, `aria-label` dinámico) en `src/app/ui/components/question-card/question-card.spec.ts`
- [ ] T042 [P] [US2] Test de componente `tg-question-modal` (focus trap, selección de opción habilita "Aceptar", retorno de foco al cerrar) en `src/app/ui/components/question-modal/question-modal.spec.ts`
- [ ] T043 [P] [US2] Test de accesibilidad axe-core de la página `board` en `src/app/ui/pages/board/board.page.a11y.spec.ts`

### Implementation for User Story 2

- [ ] T044 [US2] Implementar `AnswerCardUsecase` (valida transición `flipped`→`answered`, límite `maxAnswerableCards`, marca `AnswerResult`) en `src/app/domain/models/match/usecase/answer-card.usecase.ts` (depende de T011, T012)
- [ ] T045 [US2] Implementar `match.constants.ts` (constantes: 6 respuestas máx., 10 pts por acierto, 12 tarjetas) en `src/app/ui/components/shared/match.constants.ts`
- [ ] T047 [P] [US2] Implementar componente `tg-question-card` (botón nativo, `aria-label` "Tarjeta N, categoría X, estado Y", `aria-disabled` si respondida) en `src/app/ui/components/question-card/question-card.ts`
- [ ] T048 [US2] Implementar componente `tg-question-modal` (4 opciones seleccionables, botón "Aceptar" deshabilitado hasta selección, focus trap, retorno de foco) en `src/app/ui/components/question-modal/question-modal.ts`
- [ ] T049 [US2] Implementar página `board` (tablero de 12 `tg-question-card`, apertura de `tg-question-modal`, navegación automática a `results` tras 6ª respuesta FR-012) en `src/app/ui/pages/board/board.page.ts` (depende de T046, T047, T048)
- [ ] T050 [US2] Implementar retroalimentación visual inmediata correcto/incorrecto con `aria-live="polite"` (FR-016) en `tg-question-modal`

**Checkpoint**: US1 + US2 funcionan juntas — flujo completo desde alias hasta las 6 respuestas, con navegación automática a resultados (aún sin puntaje/nivel calculado).

---

## Phase 5: User Story 3 - Cálculo de puntuación con multiplicador Galatea (Priority: P2)

**Goal**: Calcular el puntaje según la fórmula `(N_galatea×10)×N_galatea + N_tema×10` y mostrarlo en tiempo real (spec.md US3).

**Independent Test**: Pruebas unitarias con distintas combinaciones de aciertos Galatea/tema, incluyendo casos límite (0 aciertos, 6 Galatea correctas = 360 pts).

### Tests for User Story 3 ⚠️

- [ ] T052 [P] [US3] Test unitario exhaustivo de `CalculateMatchScoreUsecase` cubriendo los 5 escenarios de aceptación de spec.md US3 (2+3→70, 6 Galatea→360, 0 aciertos→0, 0 Galatea+6 tema→60) más casos límite adicionales, apuntando a 100% de branches en `src/app/domain/models/match/usecase/calculate-match-score.usecase.spec.ts`

### Implementation for User Story 3

- [ ] T053 [US3] Implementar `CalculateMatchScoreUsecase` (función pura, fórmula FR-010/A-006) en `src/app/domain/models/match/usecase/calculate-match-score.usecase.ts` (depende de T013)
- [ ] T054 [US3] Registrar `CalculateMatchScoreUsecase` en `app.config.ts` y `app.config.local.ts`
- [ ] T055 [US3] Implementar computed `liveScore` en `MatchStore` usando `CalculateMatchScoreUsecase` sobre las respuestas ya registradas (FR-011) en `src/app/shared/foundational/state/match-store.service.ts` (depende de T053, T046)
- [ ] T056 [US3] Implementar componente `tg-score-board` (puntaje parcial visible con `aria-live`) en `src/app/ui/components/score-board/score-board.ts`
- [ ] T057 [US3] Integrar `tg-score-board` en la página `board` (depende de T056, T049)

**Checkpoint**: US1 + US2 + US3 — el jugador ve su puntaje parcial actualizarse en tiempo real mientras juega.

---

## Phase 6: User Story 4 - Pantalla de resultados y celebración (Priority: P2)

**Goal**: Al completar 6 preguntas, mostrar alias, puntaje, título de nivel y efectos de celebración acordes; permitir reiniciar y ver desglose de respuestas (spec.md US4).

**Independent Test**: Cargar la pantalla de resultados con distintos puntajes de entrada (0–360) y verificar que el título y los efectos visuales correspondan al nivel correcto (FR-014).

### Tests for User Story 4 ⚠️

- [ ] T058 [P] [US4] Test unitario exhaustivo de `AssignLevelUsecase` cubriendo los 7 niveles y sus límites exactos (59/60, 119/120, ... 359/360) en `src/app/domain/models/level/usecase/assign-level.usecase.spec.ts`
- [ ] T059 [P] [US4] Test de componente `tg-celebration` (config visual por nivel, `prefers-reduced-motion`) en `src/app/ui/components/celebration/celebration.spec.ts`
- [ ] T060 [P] [US4] Test de componente de la página `results` (muestra alias/puntaje/nivel, desglose de respuestas, botón "Jugar de nuevo") en `src/app/ui/pages/results/results.page.spec.ts`
- [ ] T061 [P] [US4] Test de accesibilidad axe-core de la página `results` en `src/app/ui/pages/results/results.page.a11y.spec.ts`

### Implementation for User Story 4

- [ ] T062 [US4] Implementar `AssignLevelUsecase` (mapeo de rangos FR-014) en `src/app/domain/models/level/usecase/assign-level.usecase.ts` (depende de T014)
- [ ] T063 [US4] Registrar `AssignLevelUsecase` en `app.config.ts` y `app.config.local.ts`
- [ ] T064 [P] [US4] Definir `LEVEL_CELEBRATION_CONFIG` (paleta Caribe, intensidad de confetti, fallback estático para `prefers-reduced-motion`, [research.md §5](./research.md)) en `src/app/ui/components/celebration/level-celebration.config.ts`
- [ ] T065 [US4] Implementar componente `tg-celebration` (recibe `Level` vía `input()`, renderiza config declarativa) en `src/app/ui/components/celebration/celebration.ts` (depende de T064)
- [ ] T066 [US4] Implementar página `results` (alias, puntaje total, título de nivel centrado, `tg-celebration`, desglose de respuestas por categoría FR-013/US4 Escenario 5) en `src/app/ui/pages/results/results.page.ts` (depende de T062, T065, T046)
- [ ] T067 [US4] Implementar botón "Jugar de nuevo" (reinicia `MatchStore`, navega a `welcome`, FR-015) en la página `results`

**Checkpoint**: Las 4 historias de usuario funcionan de punta a punta — flujo completo alias → tablero → puntaje → resultados/celebración → reinicio.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Mejoras que afectan a todas las historias de usuario

- [ ] T068 [P] Ejecutar y corregir hallazgos de axe-core en las 3 páginas (`welcome`, `board`, `results`) — Lighthouse Accessibility ≥95 (spec.md Accessibility Criteria)
- [ ] T069 [P] Verificar navegación completa por teclado del flujo end-to-end (inicio → tablero → pregunta → resultados)
- [ ] T070 [P] Auditar uso exclusivo de componentes Caribe (`cb-*`) y tokens `--cb-sys-*`; confirmar que sólo `tg-question-card`, `tg-question-modal`, `tg-score-board`, `tg-celebration` son componentes propios (Principio VII)
- [ ] T071 [P] Medir bundle size (presupuesto ≤250 KB) y Core Web Vitals (FCP≤1.5s, LCP≤2.5s, TBT≤200ms, Principio IX)
- [ ] T072 [P] Escribir tests e2e (Cypress/Playwright) del flujo completo US1→US4 incluyendo el caso de error de IA (FR-003)
- [ ] T073 [P] Sanitizar/escapar alias y tema libre antes de renderizarlos en pantalla (prevención XSS, ver checklists/security.md)
- [ ] T074 Verificar cobertura de tests ≥80% global y ≥95% en todos los usecases (Principio V, NO NEGOCIABLE) — ajustar tests faltantes
- [ ] T075 Ejecutar [quickstart.md](./quickstart.md) completo (modo mock y modo real con Gemini) y corregir discrepancias
- [ ] T076 [P] [DOC] Revisar y actualizar `README.md` del proyecto con instrucciones de instalación y ejecución (tarea documental/operativa; no mapea FR/SC funcional)
- [ ] T077 [P] Definir y ejecutar protocolo de validación manual de pertinencia para preguntas generadas por IA (muestra representativa de partidas, rúbrica de relevancia por tema, y criterio de aprobación) para demostrar SC-002 (95%) en `specs/001-trivia-galatea-app/checklists/ai-topic-questions.md` y evidencia en `specs/001-trivia-galatea-app/research.md`
- [ ] T078 [P] Instrumentar y medir latencia de generación de preguntas IA (percentil p90) en entorno de pruebas controlado, documentando resultados y umbral de aceptación para demostrar SC-003 (<=8s en 90% de partidas) en `src/app/infrastructure/gemini/gemini-client.service.ts` y evidencia en `specs/001-trivia-galatea-app/research.md`
- [ ] T085 [P] Test e2e + unit de reinicio de partida ante recarga/cierre (FR-023): verificar retorno a `welcome` sin restaurar progreso en `e2e/match-reload-reset.spec.ts` y `src/app/app.spec.ts`
- [ ] T086 Implementar manejo explícito de recarga/cierre para iniciar partida nueva en `src/app/app.ts` y `src/app/shared/foundational/state/match-store.service.ts` (depende de T085)
- [ ] T087 [P] Medir y registrar evidencia de SC-001 (partida completa <5 min): ejecutar al menos 10 corridas E2E controladas del flujo alias→tema→tablero→6 respuestas→resultados, documentar tiempo por corrida y porcentaje de cumplimiento en `specs/001-trivia-galatea-app/research.md`
- [ ] T088 [P] Verificación auditable de A-010/FR-018/FR-019: interceptar todas las peticiones salientes a Gemini en tests e2e y unitarios (usando spy/mock del HttpClient o del SDK de VertexAI) y afirmar que ningún payload contiene el alias del jugador ni campos de sesión distintos del string del tema o del contexto Galatea provisto; documentar evidencia en `specs/001-trivia-galatea-app/research.md` (depende de T027, T031)
- [ ] T089 [DOC] [OPS] Nota operativa de cierre de evento: al finalizar la ventana del evento (~1 mes), rotar o deshabilitar la API key en Google Cloud Console en menos de 24h post-evento, y verificar que la restricción de HTTP Referer haya estado activa durante todo el período (FR-027, A-011). Evidencia: captura de pantalla de la consola con la key deshabilitada archivada en `specs/001-trivia-galatea-app/research.md`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias — puede iniciar de inmediato. T000 se ejecuta al cierre de Setup y actúa como gate de salida hacia US1-US4
- **Foundational (Phase 2)**: Depende de Setup — BLOQUEA todas las historias de usuario
- **US1 (Phase 3)**: Depende de Foundational. Sin dependencia de otras historias
- **US2 (Phase 4)**: Depende de Foundational. Usa `MatchModel`/`CardModel` de Fase 2; se integra con la navegación de US1 (T038) pero su lógica de tarjetas/respuestas es independiente
- **US3 (Phase 5)**: Depende de Foundational y de `MatchStore` fundacional (T046) para exponer `liveScore`
- **US4 (Phase 6)**: Depende de Foundational y de `MatchStore` fundacional (T046) para leer el estado final de la partida
- **Polish (Phase 7)**: Depende de que todas las historias deseadas estén completas

### User Story Dependencies

- **US1 (P1)**: Puede iniciar tras Foundational — sin dependencia de otras historias
- **US2 (P1)**: Puede iniciar tras Foundational — integra con la navegación de US1 (T038) pero es testeable de forma independiente con datos mock
- **US3 (P2)**: Requiere `MatchStore` fundacional (T046) para el puntaje en vivo; el cálculo puro (`CalculateMatchScoreUsecase`) es independiente y testeable sin UI
- **US4 (P2)**: Requiere `MatchStore` fundacional (T046) para leer el estado final; el cálculo puro (`AssignLevelUsecase`) es independiente y testeable sin UI

### Within Each User Story

- Tests escritos y fallando ANTES de implementar (T022-T026, T039-T043, T052, T058-T061)
- Modelos/mappers antes de servicios
- Servicios antes de usecases que los consumen
- Usecases antes de componentes de UI
- Historia completa antes de pasar a la siguiente en orden de prioridad

### Parallel Opportunities

- Todas las tareas [P] de Setup (T003-T006, T008) en paralelo
- T000 se ejecuta secuencialmente al final de Setup (A1), después de completar T001-T008
- Todas las tareas [P] de Foundational (T009-T014, T016-T017, T021) en paralelo; `MatchStore` fundacional (T046/T051) se completa secuencialmente tras modelos base
- Todos los tests [P] de una historia en paralelo entre sí
- Mappers/modelos [P] dentro de una historia en paralelo
- US1 y US2 pueden trabajarse en paralelo por desarrolladores distintos tras Foundational (con integración final en T038)

---

## Parallel Example: User Story 1

```bash
# Lanzar todos los tests de US1 en paralelo:
Task: "Test unitario de GeminiTopicAnonymizer en gemini-topic-anonymizer.spec.ts"
Task: "Test unitario de GeminiQuestionMapper en gemini-question.mapper.spec.ts"
Task: "Test unitario de GalateaQuestionMapper en galatea-question.mapper.spec.ts"
Task: "Test unitario de BuildMatchUsecase en build-match.usecase.spec.ts"
Task: "Test de componente welcome.page.spec.ts"

# Lanzar mappers de US1 en paralelo (tras GeminiClientService):
Task: "Implementar GeminiQuestionMapper en gemini-question.mapper.ts"
Task: "Implementar GalateaQuestionMapper en galatea-question.mapper.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2)

1. Completar Fase 1: Setup
2. Completar Fase 2: Foundational (CRÍTICO — bloquea todas las historias)
3. Completar Fase 3: US1 (registro + generación de preguntas)
4. Completar Fase 4: US2 (tablero jugable)
5. **DETENER y VALIDAR**: US1+US2 permiten jugar una partida completa sin puntaje visible aún
6. Nota: US3/US4 dependen técnicamente del `MatchStore` fundacional (T046), por lo que el MVP real de "juego jugable de principio a fin" requiere US1+US2+US3+US4

### Incremental Delivery

1. Setup + Foundational → Fundación lista
2. US1 → Probar de forma independiente (con `QuestionMockService`) → Demo (registro + generación)
3. US2 → Probar de forma independiente → Demo (tablero jugable, sin puntaje)
4. US3 → Probar de forma independiente (usecase puro sin UI) → Integrar puntaje en vivo → Demo
5. US4 → Probar de forma independiente (usecase puro sin UI) → Integrar resultados/celebración → Demo (juego completo)

### Parallel Team Strategy

Con múltiples desarrolladores:

1. El equipo completa Setup + Foundational en conjunto
2. Tras Foundational:
   - Desarrollador A: US1 (welcome + Gemini + banco JSON)
   - Desarrollador B: US2 (board + MatchStore + tarjetas)
   - Desarrollador C: adelanta los usecases puros de US3/US4 (`CalculateMatchScoreUsecase`, `AssignLevelUsecase`) que no dependen de `MatchStore`
3. Al converger, C integra su lógica sobre el `MatchStore` que B completó

---

## Notes

- [P] = archivos distintos, sin dependencias entre sí
- [Story] mapea cada tarea a su historia de usuario para trazabilidad
- Verificar que los tests fallen antes de implementar
- Commit tras cada tarea o grupo lógico
- Detenerse en cada checkpoint para validar la historia de forma independiente
- Evitar: tareas vagas, conflictos de mismo archivo, dependencias cruzadas entre historias que rompan la independencia
- Ver [checklists/](./checklists/) para gaps de requisitos detectados que pueden requerir aclaración de spec.md antes o durante la implementación
