import { Injectable } from '@angular/core';
import { CardModel, MatchModel } from '../match.model';

/** Error de negocio: no existe una tarjeta con el id solicitado en la partida. */
export class CardNotFoundError extends Error {
  constructor(cardId: string) {
    super(`No existe una tarjeta con id "${cardId}" en la partida actual.`);
    this.name = 'CardNotFoundError';
  }
}

/** Error de negocio: la tarjeta aún no fue volteada (US2, transición inválida `face-down` → `answered`). */
export class CardNotFlippedError extends Error {
  constructor() {
    super('Debes voltear la tarjeta antes de poder responderla.');
    this.name = 'CardNotFlippedError';
  }
}

/** Error de negocio: la tarjeta ya fue respondida y no admite una segunda respuesta (US2, escenario 5). */
export class CardAlreadyAnsweredError extends Error {
  constructor() {
    super('Esta tarjeta ya fue respondida y no puede responderse nuevamente.');
    this.name = 'CardAlreadyAnsweredError';
  }
}

/** Error de negocio: se alcanzó el máximo de tarjetas respondidas permitido por partida (FR-009). */
export class MaxAnswerableCardsReachedError extends Error {
  constructor() {
    super('Ya alcanzaste el máximo de preguntas respondidas para esta partida.');
    this.name = 'MaxAnswerableCardsReachedError';
  }
}

/**
 * Caso de uso de dominio puro que valida y aplica la transición `flipped` → `answered`
 * de una tarjeta dentro de una partida, retornando un nuevo `MatchModel` inmutable
 * (contracts/internal-gateways.md § AnswerCardUsecase).
 */
@Injectable()
export class AnswerCardUsecase {
  answer(match: MatchModel, cardId: string, selectedOptionIndex: number): MatchModel {
    const card = match.cards.find((item) => item.id === cardId);
    if (!card) {
      throw new CardNotFoundError(cardId);
    }

    if (card.state === 'answered') {
      throw new CardAlreadyAnsweredError();
    }

    if (card.state !== 'flipped') {
      throw new CardNotFlippedError();
    }

    const answeredCount = match.cards.filter((item) => item.state === 'answered').length;
    if (answeredCount >= match.maxAnswerableCards) {
      throw new MaxAnswerableCardsReachedError();
    }

    const isCorrect = selectedOptionIndex === card.question.correctOptionIndex;
    const updatedCard: CardModel = {
      ...card,
      state: 'answered',
      result: isCorrect ? 'correct' : 'incorrect',
      selectedOptionIndex,
    };

    const cards = match.cards.map((item) => (item.id === cardId ? updatedCard : item));
    const newAnsweredCount = answeredCount + 1;

    return {
      ...match,
      cards,
      status: newAnsweredCount >= match.maxAnswerableCards ? 'completed' : match.status,
    };
  }
}
