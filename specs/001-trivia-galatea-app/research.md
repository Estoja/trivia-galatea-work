# Research: Trivia Galatea — Juego de Preguntas con IA

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

Este documento resuelve las decisiones técnicas necesarias antes del diseño (Fase 1). No quedan `NEEDS CLARIFICATION` pendientes en el Technical Context del plan.

---

## 1. Anonimización del prompt hacia Gemini

**Decision**: Se usa un **diccionario de anonimización bidireccional** (`BRAND_PLACEHOLDER_MAP`) en la capa de infraestructura. Antes de construir el prompt de preguntas de Galatea (o cualquier contexto que mencione a Bancolombia/Galatea), se sustituyen los nombres reales por placeholders neutrales:

| Nombre real | Placeholder enviado a Gemini |
|---|---|
| Bancolombia | `Empresa X` |
| Galatea | `Proyecto Y` |
| (otros términos internos sensibles que se agreguen) | `Concepto Z`, `Equipo W`, etc. |

El prompt enviado a Gemini para el tema libre **nunca** incluye estos nombres — sólo contiene el string del tema que el jugador escribió (FR-018, A-010). El diccionario de anonimización se usa exclusivamente para el flujo de generación de preguntas de Galatea vía IA (fallback cuando el banco JSON no alcanza, ver FR-004), donde si es necesario dar contexto de qué es "Galatea" a la IA, ese contexto ya viene anonimizado.

Después de recibir la respuesta de Gemini (JSON de preguntas), el **mapper de infraestructura** (`GeminiQuestionMapper`) reemplaza los placeholders de vuelta por los nombres reales (`Empresa X` → `Bancolombia`, `Proyecto Y` → `Galatea`) antes de construir el `QuestionModel` del dominio. El dominio nunca ve ni el placeholder ni sabe que existió una anonimización — sólo recibe el texto final ya resuelto.

**Rationale**: Cumple FR-018/A-010 (ningún dato de marca sale hacia servicios externos) sin requerir un proxy corporativo (descartado en Clarifications Q2, opción A elegida). Es la solución más simple: un mapa de sustitución de texto en la capa de infraestructura, sin nueva infraestructura de red.

**Alternatives considered**:
- Proxy corporativo que filtre contenido — rechazado por complejidad innecesaria para un evento interno controlado (viola Principio IV, YAGNI).
- No anonimizar y confiar en que Gemini no persiste el prompt — rechazado porque no cumple con la gobernanza de datos esperada en un contexto Bancolombia.

---

## 2. Formato del banco de preguntas Galatea (JSON)

**Decision**: Archivo estático `public/assets/galatea-questions.json`, con esta forma:

```json
{
  "version": 1,
  "questions": [
    {
      "id": "gal-001",
      "text": "¿Qué representa el logo del Proyecto Y dentro de Empresa X?",
      "options": [
        "Un ecosistema de innovación interna",
        "Un producto financiero externo",
        "Una alianza con un tercero",
        "Un evento anual de la compañía"
      ],
      "correctOptionIndex": 0
    }
  ]
}
```

- **Ya anonimizado en disco**: el archivo JSON versionado en el repositorio usa los placeholders (`Empresa X`, `Proyecto Y`) igual que el prompt de IA, de modo que el mismo pipeline de "resolución de placeholders" (mapper) se reutiliza tanto para preguntas generadas por IA como para preguntas del banco curado. Esto es intencional: **un solo punto de traducción placeholder → nombre real**, ubicado en infraestructura.
- Mínimo 12 preguntas (Clarifications Q3) para permitir selección aleatoria de 6 sin repetición entre partidas consecutivas.
- `correctOptionIndex` es 0-based, consistente con el modelo de dominio (`Question.correctOptionIndex`).

**Rationale**: Un solo formato y un solo mapper para ambas fuentes (banco curado + IA) reduce duplicación (Principio IV). Anonimizar también el archivo estático evita mantener dos convenciones de nombres distintas.

**Alternatives considered**:
- Banco de preguntas ya con nombres reales (sin anonimizar) + anonimizar sólo el prompt de IA — rechazado porque duplica la lógica de resolución de nombres y complica el mapper (dos formatos de entrada distintos).

---

## 3. Selección de arquitectura de estado (Signals Store)

**Decision**: Un único `MatchStore` basado en signals (patrón "Layered Derivation" de `signal-patterns.instructions.md`) que mantiene:

```
_playerAlias      (signal)
_chosenTopic      (signal)
_cards            (signal<Card[]>)           # 12 tarjetas generadas
_answeredCount    (computed)                 # cuántas de las 6 ya se respondieron
_liveScore        (computed)                 # puntaje parcial en tiempo real (FR-011)
_isMatchComplete  (computed)                 # answeredCount === 6
_finalScore       (computed)                 # sólo cuando isMatchComplete
_level            (computed)                 # deriva de finalScore vía AssignLevelUsecase
```

**Rationale**: Sigue el patrón ya documentado en `frontend-implementation.instructions.md` (`QuizStore`), adaptado a la mecánica real de esta especificación (12 tarjetas, 6 elegidas, multiplicador). Evita `NgRx` u otras librerías de estado — innecesarias para el alcance de una SPA sin backend (Principio IV).

**Alternatives considered**: NgRx/Akita — rechazados por sobre-ingeniería para un estado que cabe en un solo store de signals.

---

## 4. Cálculo de puntuación y niveles

**Decision**: Dos casos de uso puros de dominio, sin dependencias externas:

- `CalculateMatchScoreUsecase.calculate(answers: Answer[]): Score` — implementa la fórmula confirmada en Clarifications Q1: `(galateaCorrectCount × 10) × galateaCorrectCount + topicCorrectCount × 10`.
- `AssignLevelUsecase.assign(totalScore: number): Level` — mapea el puntaje a uno de los 7 niveles (tabla de FR-014) mediante rangos ordenados.

Ambos son funciones puras testeables sin `TestBed`, apuntando a 100% de cobertura de branches (Principio V, casos de uso críticos ≥ 95%).

**Rationale**: Lógica de negocio pura, sin efectos secundarios; se puede probar exhaustivamente con tabla de casos (0, 60, 119, 120, 360, etc.) sin mocks.

---

## 5. Efectos de celebración por nivel

**Decision**: Componente `tg-celebration` recibe el `Level` (vía `input()`) y renderiza una configuración declarativa por nivel (`LEVEL_CELEBRATION_CONFIG`: paleta de color Caribe, intensidad de confetti, si aplica `prefers-reduced-motion` fallback estático). La intensidad crece progresivamente:

| Nivel | Intensidad visual |
|---|---|
| Visitante | Sobria — sin confetti, tokens de color neutros de Caribe |
| Explorador → Estratega | Confetti creciente + color de acento Caribe por nivel |
| Maestro Galatea | Confetti denso + animación de brillo |
| Unicornio Galatea 🦄 | Máxima intensidad — confetti + emoji + animación especial, respetando `prefers-reduced-motion` (Principio VIII) |

**Rationale**: Cumple SC-006 (diferencia visible entre ≥3 niveles) y Principio VIII (respeta `prefers-reduced-motion`). Toda animación usa tokens `--cb-sys-*` de Caribe, nunca colores hardcodeados (Principio VII).

**Alternatives considered**: Librería externa de confetti (`canvas-confetti`) — aceptable como dependencia ligera si Caribe no ofrece un componente de celebración; se evalúa en fase de tareas si el bundle size lo permite (Principio IX, presupuesto 250 KB).

---

## 6. Accesibilidad del tablero de tarjetas

**Decision**:
- Cada tarjeta es un `<button>` nativo (nunca `<div>` con click handler) con `aria-label` dinámico: `"Tarjeta {n}, categoría {categoría}, {estado}"` (ej. "Tarjeta 3, categoría Galatea, sin responder").
- Tarjetas respondidas usan `aria-disabled="true"` y `tabindex="-1"` para excluirlas de la navegación por Tab una vez respondidas (US2, escenario 5).
- El modal de pregunta (`tg-question-modal`) atrapa el foco (focus trap) mientras está abierto y devuelve el foco a la tarjeta de origen al cerrarse.
- El puntaje en vivo y el mensaje de correcto/incorrecto se anuncian con `aria-live="polite"` (FR-011, FR-016, Principio VI).

**Rationale**: Cumple Principio VI (WCAG 2.1 AA) y los criterios de accesibilidad de la especificación (navegación completa por teclado, `aria-live` en cambios dinámicos).

---

## 7. Estrategia de mocks para `ng serve` sin backend

**Decision**: Dos Composition Roots:
- `app.config.ts` (default / producción del evento): `QuestionGateway` implementado por `QuestionService`, que combina banco JSON local + llamada real a Gemini.
- `app.config.local.ts` (desarrollo sin API key): `QuestionGateway` implementado por `QuestionMockService`, que retorna preguntas hardcodeadas para ambas fuentes.

**Rationale**: Refleja el patrón ya usado en el proyecto (`golden-rules.instructions.md`, regla 3: "el frontend funciona sin backend"). Permite desarrollar la UI sin consumir cuota de la API de Gemini.

---

## 8. Logging sin `console.log`

**Decision**: `LoggerService` inyectable (`providedIn: 'root'`) con métodos `info`, `warn`, `error`, que en desarrollo escribe a la consola del navegador y en producción es un no-op (o se conecta a un colector si se agrega en el futuro).

**Rationale**: Cumple Principio X (sin `console.log` directo en código de producción).
