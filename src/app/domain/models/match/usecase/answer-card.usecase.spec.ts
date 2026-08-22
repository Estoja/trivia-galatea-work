import { QuestionSource } from '../../../enums/question-source.enum';
import { QuestionModel } from '../../question/question.model';
import { CardModel, MatchModel } from '../match.model';
import {
  AnswerCardUsecase,
  CardAlreadyAnsweredError,
  CardNotFlippedError,
  CardNotFoundError,
  MaxAnswerableCardsReachedError,
} from './answer-card.usecase';

function buildQuestion(overrides: Partial<QuestionModel> = {}): QuestionModel {
  return {
    id: 'q-1',
    text: 'Pregunta de prueba con suficiente longitud para pasar validaciones',
    options: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
    correctOptionIndex: 1,
    source: QuestionSource.Galatea,
    ...overrides,
  };
}

function buildCard(overrides: Partial<CardModel> = {}): CardModel {
  return {
    id: 'card-1',
    question: buildQuestion(),
    state: 'flipped',
    result: 'pending',
    selectedOptionIndex: null,
    ...overrides,
  };
}

function buildMatch(cards: CardModel[]): MatchModel {
  return {
    player: { alias: 'Jugador1', chosenTopic: 'Fútbol' },
    cards,
    maxAnswerableCards: 6,
    status: 'in-progress',
  };
}

describe('AnswerCardUsecase', () => {
  let usecase: AnswerCardUsecase;

  beforeEach(() => {
    usecase = new AnswerCardUsecase();
  });

  it('marca la tarjeta como respondida con resultado correcto cuando el índice coincide (transición flipped→answered)', () => {
    const match = buildMatch([buildCard({ id: 'card-1', question: buildQuestion({ correctOptionIndex: 1 }) })]);

    const updated = usecase.answer(match, 'card-1', 1);

    const updatedCard = updated.cards[0];
    expect(updatedCard.state).toBe('answered');
    expect(updatedCard.result).toBe('correct');
    expect(updatedCard.selectedOptionIndex).toBe(1);
    expect(match.cards[0].state).toBe('flipped');
  });

  it('marca la tarjeta como respondida con resultado incorrecto cuando el índice no coincide', () => {
    const match = buildMatch([buildCard({ id: 'card-1', question: buildQuestion({ correctOptionIndex: 2 }) })]);

    const updated = usecase.answer(match, 'card-1', 0);

    expect(updated.cards[0].result).toBe('incorrect');
  });

  it('marca la partida como completada al alcanzar maxAnswerableCards', () => {
    const answeredCards = Array.from({ length: 5 }, (_, i) =>
      buildCard({ id: `answered-${i}`, state: 'answered', result: 'correct', selectedOptionIndex: 1 }),
    );
    const match = buildMatch([...answeredCards, buildCard({ id: 'card-last' })]);

    const updated = usecase.answer(match, 'card-last', 1);

    expect(updated.status).toBe('completed');
  });

  it('rechaza responder una tarjeta que ya fue respondida (US2, escenario 5)', () => {
    const match = buildMatch([buildCard({ id: 'card-1', state: 'answered', result: 'correct' })]);

    expect(() => usecase.answer(match, 'card-1', 0)).toThrow(CardAlreadyAnsweredError);
  });

  it('rechaza responder una tarjeta que aún no fue volteada', () => {
    const match = buildMatch([buildCard({ id: 'card-1', state: 'face-down' })]);

    expect(() => usecase.answer(match, 'card-1', 0)).toThrow(CardNotFlippedError);
  });

  it('rechaza responder cuando ya se alcanzó el máximo de tarjetas respondidas (FR-009)', () => {
    const answeredCards = Array.from({ length: 6 }, (_, i) =>
      buildCard({ id: `answered-${i}`, state: 'answered', result: 'correct', selectedOptionIndex: 1 }),
    );
    const match = buildMatch([...answeredCards, buildCard({ id: 'card-extra' })]);

    expect(() => usecase.answer(match, 'card-extra', 0)).toThrow(MaxAnswerableCardsReachedError);
  });

  it('lanza CardNotFoundError si el id de tarjeta no existe en la partida', () => {
    const match = buildMatch([buildCard({ id: 'card-1' })]);

    expect(() => usecase.answer(match, 'card-inexistente', 0)).toThrow(CardNotFoundError);
  });
});
