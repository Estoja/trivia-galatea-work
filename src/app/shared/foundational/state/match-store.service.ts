import { Injectable, Signal, computed, signal } from '@angular/core';
import { AnswerRecord, CardState, MatchStorePort } from './match-store.port';

const MAX_ANSWERS = 6;

@Injectable({ providedIn: 'root' })
export class MatchStoreService implements MatchStorePort {
  private readonly _playerAlias = signal('');
  private readonly _chosenTopic = signal('');
  private readonly _cards = signal<ReadonlyArray<CardState>>([]);
  private readonly _activeCardId = signal<string | null>(null);
  private readonly _answers = signal<ReadonlyArray<AnswerRecord>>([]);

  readonly playerAlias: Signal<string> = this._playerAlias.asReadonly();
  readonly chosenTopic: Signal<string> = this._chosenTopic.asReadonly();
  readonly answeredCount: Signal<number> = computed(() => this._answers().length);
  readonly isMatchComplete: Signal<boolean> = computed(() => this.answeredCount() >= MAX_ANSWERS);
  readonly liveScore: Signal<number> = computed(() => this._answers().filter((a) => a.isCorrect).length * 10);

  initializeSession(alias: string, topic: string): void {
    this._playerAlias.set(alias.trim());
    this._chosenTopic.set(topic.trim());
    this._cards.set([]);
    this._activeCardId.set(null);
    this._answers.set([]);
  }

  setQuestions(cards: ReadonlyArray<CardState>): void {
    this._cards.set(cards.map((card) => ({ ...card, state: 'faceDown' })));
    this._activeCardId.set(null);
    this._answers.set([]);
  }

  openCard(cardId: string): { ok: boolean; reason?: 'already-active' | 'invalid-card' } {
    if (this._activeCardId()) {
      return { ok: false, reason: 'already-active' };
    }

    const card = this._cards().find((item) => item.id === cardId);
    if (!card || card.state === 'answered') {
      return { ok: false, reason: 'invalid-card' };
    }

    this._activeCardId.set(cardId);
    this._cards.set(
      this._cards().map((item) =>
        item.id === cardId ? { ...item, state: 'flipped' } : item,
      ),
    );

    return { ok: true };
  }

  confirmAnswer(
    cardId: string,
    optionId: string,
    isCorrect = false,
  ): {
    ok: boolean;
    reason?: 'no-active-card' | 'invalid-card' | 'max-answers-reached' | 'already-answered';
  } {
    if (!this._activeCardId()) {
      return { ok: false, reason: 'no-active-card' };
    }

    if (this._activeCardId() !== cardId) {
      return { ok: false, reason: 'invalid-card' };
    }

    if (this.answeredCount() >= MAX_ANSWERS) {
      return { ok: false, reason: 'max-answers-reached' };
    }

    if (this._answers().some((answer) => answer.cardId === cardId)) {
      return { ok: false, reason: 'already-answered' };
    }

    this._answers.set([...this._answers(), { cardId, optionId, isCorrect }]);
    this._cards.set(
      this._cards().map((item) =>
        item.id === cardId ? { ...item, state: 'answered', isCorrect } : item,
      ),
    );
    this._activeCardId.set(null);

    return { ok: true };
  }

  resetSession(): void {
    this._playerAlias.set('');
    this._chosenTopic.set('');
    this._cards.set([]);
    this._activeCardId.set(null);
    this._answers.set([]);
  }
}
