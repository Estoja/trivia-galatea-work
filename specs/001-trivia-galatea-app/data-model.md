# Data Model: Trivia Galatea — Juego de Preguntas con IA

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Research**: [research.md](./research.md)

Todos los modelos son interfaces TypeScript puras en `domain/models/`, sin dependencias de Angular ni de infraestructura (Principio I, Regla de Oro 1).

---

## Player

Representa al jugador durante la partida activa. No se persiste entre sesiones (A-001, A-008).

```typescript
export interface PlayerModel {
  /** Alias público con el que el jugador es identificado en pantalla (2–30 caracteres) */
  alias: string;
  /** Tema libre elegido por el jugador para personalizar sus preguntas */
  chosenTopic: string;
}
```

**Validaciones** (aplicadas en el caso de uso / formulario, no en el modelo):
- `alias.length` entre 2 y 30 (FR-001).
- `chosenTopic` no vacío ni sólo espacios (Edge Case).

---

## Question

Unidad de contenido de una tarjeta.

```typescript
export type QuestionSource = 'galatea' | 'chosen-topic';

export interface QuestionModel {
  id: string;
  /** Enunciado de la pregunta */
  text: string;
  /** Exactamente 4 opciones de respuesta (FR-005) */
  options: [string, string, string, string];
  /** Índice 0-based de la opción correcta dentro de `options` */
  correctOptionIndex: number;
  /** Origen de la pregunta: Galatea o el tema elegido por el jugador */
  source: QuestionSource;
}
```

✅ Nombres semánticos (`correctOptionIndex`, no `ans_idx`).
❌ No refleja la estructura de la respuesta de Gemini ni del JSON externo — eso lo traduce el mapper de infraestructura (ver [contracts/gemini-prompt-contract.md](./contracts/gemini-prompt-contract.md)).

---

## Card

Unidad visual del tablero — envuelve una `Question` con su estado de interacción.

```typescript
export type CardState = 'face-down' | 'flipped' | 'answered';
export type AnswerResult = 'pending' | 'correct' | 'incorrect';

export interface CardModel {
  id: string;
  question: QuestionModel;
  state: CardState;
  result: AnswerResult;
  /** Índice de la opción que el jugador seleccionó, o null si aún no respondió */
  selectedOptionIndex: number | null;
}
```

**Transiciones de estado válidas** (invariante de dominio):
`face-down` → `flipped` (al voltear) → `answered` (al confirmar con "Aceptar", FR-008). Nunca regresa a un estado anterior (US2, escenario 5).

---

## Match

La sesión de juego completa de un jugador (una partida = un `Match`).

```typescript
export type MatchStatus = 'in-progress' | 'completed';

export interface MatchModel {
  player: PlayerModel;
  /** Las 12 tarjetas generadas al inicio: 6 Galatea + 6 del tema elegido (A-009) */
  cards: CardModel[];
  /** Máximo de tarjetas que el jugador puede responder por partida */
  maxAnswerableCards: 6;
  status: MatchStatus;
}
```

**Invariantes**:
- `cards.length === 12`.
- `cards.filter(c => c.question.source === 'galatea').length === 6`.
- `cards.filter(c => c.question.source === 'chosen-topic').length === 6`.
- `cards.filter(c => c.state === 'answered').length <= maxAnswerableCards` (FR-009).
- `status` pasa a `'completed'` únicamente cuando se alcanzan las 6 respuestas (FR-012).

---

## Score

Resultado calculado de una partida completada.

```typescript
export interface ScoreModel {
  /** Cantidad de preguntas Galatea respondidas correctamente (0–6) */
  galateaCorrectCount: number;
  /** Cantidad de preguntas del tema elegido respondidas correctamente (0–6) */
  topicCorrectCount: number;
  /** Puntos aportados por Galatea: (galateaCorrectCount × 10) × galateaCorrectCount */
  galateaPoints: number;
  /** Puntos aportados por el tema elegido: topicCorrectCount × 10 */
  topicPoints: number;
  /** galateaPoints + topicPoints — rango 0 a 360 */
  totalScore: number;
}
```

Calculado por `CalculateMatchScoreUsecase` (dominio puro, ver [research.md §4](./research.md)). Fórmula confirmada en Clarifications Q1.

---

## Level

Nivel/título otorgado según el `totalScore`.

```typescript
export enum LevelTier {
  Visitante = 'visitante',
  Explorador = 'explorador',
  Aprendiz = 'aprendiz',
  Constructor = 'constructor',
  Estratega = 'estratega',
  MaestroGalatea = 'maestro-galatea',
  UnicornioGalatea = 'unicornio-galatea',
}

export interface LevelModel {
  tier: LevelTier;
  /** Título visible en pantalla, ej. "Unicornio Galatea 🦄" */
  title: string;
  minScore: number;
  maxScore: number;
}
```

**Tabla de rangos** (FR-014, fuente única de verdad — no duplicar en código):

| `tier` | `title` | `minScore` | `maxScore` |
|---|---|---|---|
| `visitante` | Visitante | 0 | 59 |
| `explorador` | Explorador | 60 | 119 |
| `aprendiz` | Aprendiz | 120 | 179 |
| `constructor` | Constructor | 180 | 239 |
| `estratega` | Estratega | 240 | 299 |
| `maestro-galatea` | Maestro Galatea | 300 | 359 |
| `unicornio-galatea` | Unicornio Galatea 🦄 | 360 | 360 |

Calculado por `AssignLevelUsecase` (dominio puro).

---

## Gateways (contratos del dominio)

### `QuestionGateway`

```typescript
export abstract class QuestionGateway {
  /** Selecciona 6 preguntas de Galatea: banco curado, con fallback a IA si faltan (FR-004) */
  abstract getGalateaQuestions(count: number): Observable<QuestionModel[]>;
  /** Genera 6 preguntas del tema elegido vía Gemini (FR-003) */
  abstract getChosenTopicQuestions(topic: string, count: number): Observable<QuestionModel[]>;
}
```

Ver contrato de implementación en [contracts/internal-gateways.md](./contracts/internal-gateways.md).

---

## Relaciones (resumen)

```
PlayerModel ─── 1:1 ──── MatchModel
MatchModel  ─── 1:12 ──── CardModel
CardModel   ─── 1:1 ──── QuestionModel
MatchModel  ─── 1:1 (al completar) ──── ScoreModel
ScoreModel  ─── 1:1 ──── LevelModel  (vía AssignLevelUsecase)
```
