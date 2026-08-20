import { Signal } from '@angular/core';

export interface CardState {
  id: string;
  category: 'galatea' | 'chosen-topic';
  state: 'faceDown' | 'flipped' | 'answered';
  isCorrect?: boolean;
}

export interface AnswerRecord {
  cardId: string;
  optionId: string;
  isCorrect: boolean;
}

export interface MatchStorePort {
  readonly playerAlias: Signal<string>;
  readonly chosenTopic: Signal<string>;
  readonly answeredCount: Signal<number>;
  readonly isMatchComplete: Signal<boolean>;
  readonly liveScore: Signal<number>;

  initializeSession(alias: string, topic: string): void;
  setQuestions(cards: ReadonlyArray<CardState>): void;
  openCard(cardId: string): { ok: boolean; reason?: 'already-active' | 'invalid-card' };
  confirmAnswer(
    cardId: string,
    optionId: string,
    isCorrect?: boolean,
  ): {
    ok: boolean;
    reason?: 'no-active-card' | 'invalid-card' | 'max-answers-reached' | 'already-answered';
  };
  resetSession(): void;
}
