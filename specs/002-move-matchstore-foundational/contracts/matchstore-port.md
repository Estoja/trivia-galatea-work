# Contract - MatchStorePort (Internal)

## Purpose
Definir una interfaz interna estable para el estado compartido de partida, consumible por US1 y otras historias sin acoplarse a la implementación concreta del store.

## Location
- Contract owner: shared/foundational layer
- Expected consumer layers: presentation (pages/components), application orchestration
- Forbidden consumers: infraestructura externa, utilidades sin contexto de dominio

## Type Signature (TypeScript)

```ts
export interface MatchStorePort {
  readonly playerAlias: Signal<string>;
  readonly chosenTopic: Signal<string>;
  readonly answeredCount: Signal<number>;
  readonly isMatchComplete: Signal<boolean>;
  readonly liveScore: Signal<number>;

  initializeSession(alias: string, topic: string): void;
  setQuestions(cards: ReadonlyArray<CardState>): void;
  openCard(cardId: string): { ok: boolean; reason?: 'already-active' | 'invalid-card' };
  confirmAnswer(cardId: string, optionId: string): {
    ok: boolean;
    reason?: 'no-active-card' | 'invalid-card' | 'max-answers-reached' | 'already-answered';
  };
  resetSession(): void;
}
```

## Behavioral Guarantees
- Garantiza una sola tarjeta activa a la vez.
- Garantiza límite máximo de 6 respuestas confirmadas.
- No expone mutabilidad directa del estado interno.
- Es determinista para mismos comandos en mismo estado de entrada.

## Compatibility Rules
- Cambios breaking requieren actualización de consumers en US1+ y nueva revisión de dependencia.
- Nuevos métodos deben ser aditivos y documentados con semántica explícita.
- No introducir dependencia de servicios de red en esta interfaz.

## Test Contract
- Test de conformidad debe validar todas las razones de error en openCard/confirmAnswer.
- Test de no-regresión debe validar que US1 compila/ejecuta con el puerto sin depender de APIs internas de MatchStoreService.
