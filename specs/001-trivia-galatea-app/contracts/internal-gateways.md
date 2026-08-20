# Contrato: Gateways Internos (Dominio ↔ Infraestructura)

**Feature**: [../spec.md](../spec.md) | **Data Model**: [../data-model.md](../data-model.md)

Contratos TypeScript que la infraestructura DEBE implementar. Son clases abstractas (Regla de Oro / Principio I — Angular no inyecta interfaces en runtime).

---

## `QuestionGateway`

```typescript
import { Observable } from 'rxjs';
import { QuestionModel } from '../../domain/models/question/question.model';

export abstract class QuestionGateway {
  /**
   * Obtiene `count` preguntas sobre Galatea.
   * Prioridad de fuente (FR-004): banco JSON curado → fallback a IA si faltan.
   * Nunca lanza si hay al menos 1 pregunta disponible entre ambas fuentes;
   * el usecase consumidor decide si `count` insuficiente es un error de negocio.
   */
  abstract getGalateaQuestions(count: number): Observable<QuestionModel[]>;

  /**
   * Genera `count` preguntas sobre el tema libre del jugador vía IA (FR-003).
   * Emite error si Gemini no puede generar `count` preguntas válidas
   * (ver contracts/gemini-prompt-contract.md §5 para el árbol de manejo de errores).
   */
  abstract getChosenTopicQuestions(topic: string, count: number): Observable<QuestionModel[]>;
}
```

### Implementaciones

| Clase | Ubicación | Uso |
|---|---|---|
| `QuestionService` | `infrastructure/question/question.service.ts` | Real: banco JSON + Gemini vía Vertex AI (Firebase App) |
| `QuestionMockService` | `infrastructure/question/question-mock.service.ts` | Mock: datos hardcodeados, usado en `app.config.local.ts` |

### Reglas de implementación (`QuestionService`)

1. `getGalateaQuestions(6)`:
   - Carga `public/assets/galatea-questions.json` (vía `HttpClient.get`).
   - Selecciona 6 al azar (sin reemplazo) si `questions.length >= 6`.
  - Si `questions.length < 6`, completa el faltante llamando a Gemini vía `GeminiClientService` (Vertex AI sobre Firebase App) con el prompt de fallback (ver contrato Gemini §3), usando la base de conocimiento de Galatea como contexto.
   - Cada pregunta pasa por `GalateaQuestionMapper.fromMap()`, que resuelve los placeholders (`Empresa X` → `Bancolombia`, `Proyecto Y` → `Galatea`) y asigna `source: 'galatea'`.
2. `getChosenTopicQuestions(topic, 6)`:
  - Llama a Gemini vía `GeminiClientService` (Vertex AI sobre Firebase App) con el prompt de tema libre (contrato Gemini §2).
   - Cada pregunta pasa por `GeminiQuestionMapper.fromMap()`, que asigna `source: 'chosen-topic'`.
   - Si Gemini no retorna 6 preguntas válidas, el `Observable` emite error — el usecase consumidor (`BuildMatchUsecase`) lo propaga a la UI para mostrar el mensaje amigable (Clarifications Q4).

---

## Casos de uso que consumen `QuestionGateway`

### `BuildMatchUsecase`

```typescript
@Injectable()
export class BuildMatchUsecase {
  constructor(private readonly questionGateway: QuestionGateway) {}

  build(player: PlayerModel): Observable<MatchModel> {
    return forkJoin({
      galateaQuestions: this.questionGateway.getGalateaQuestions(6),
      chosenTopicQuestions: this.questionGateway.getChosenTopicQuestions(player.chosenTopic, 6),
    }).pipe(
      map(({ galateaQuestions, chosenTopicQuestions }) => ({
        player,
        cards: shuffleCards(buildFaceDownCards([...galateaQuestions, ...chosenTopicQuestions])),
        maxAnswerableCards: 6,
        status: 'in-progress' as const,
      }))
    );
  }
}
```

### `AnswerCardUsecase`

```typescript
@Injectable()
export class AnswerCardUsecase {
  answer(match: MatchModel, cardId: string, selectedOptionIndex: number): MatchModel {
    // Regla de negocio: no permite responder una tarjeta ya respondida (US2, escenario 5)
    // ni exceder maxAnswerableCards (FR-009). Devuelve un nuevo MatchModel inmutable.
  }
}
```

  ---

  ## `MatchStorePort` (shared/foundational)

  La disponibilidad del estado compartido de partida se define en la capa fundacional (`src/app/shared/foundational/state`) y se consume desde US1+ sin acoplarse a la implementación concreta:

  - Contrato: `match-store.port.ts`
  - Implementación: `match-store.service.ts`
  - Registro DI: `app.config.ts` y `app.config.local.ts`

  Reglas:

  1. El contrato expone señales de solo lectura (`playerAlias`, `chosenTopic`, `answeredCount`, `isMatchComplete`, `liveScore`) y comandos explícitos (`initializeSession`, `setQuestions`, `openCard`, `confirmAnswer`, `resetSession`).
  2. Consumidores de UI y orquestación de casos de uso dependen del puerto y no de campos privados de `MatchStoreService`.
  3. El store fundacional debe estar disponible antes de US1 para evitar dependencia técnica de US2.

### `CalculateMatchScoreUsecase` / `AssignLevelUsecase`

Ver [../data-model.md §Score](../data-model.md#score) y [§Level](../data-model.md#level) — funciones puras sin dependencias de gateway.

---

## Reglas de testing de estos contratos

- Los specs de `BuildMatchUsecase` y `AnswerCardUsecase` usan `QuestionGateway` mockeado (`jest.Mocked<QuestionGateway>`), sin `TestBed` (Principio V, `clean-architecture.instructions.md` §Testing).
- Los specs de `QuestionService` (infraestructura) usan `HttpTestingController` para el banco JSON y un mock del cliente Gemini para validar el mapeo de placeholders.
