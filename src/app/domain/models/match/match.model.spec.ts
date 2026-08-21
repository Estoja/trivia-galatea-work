import { QuestionSource } from '../../enums/question-source.enum';
import { QuestionModel } from '../question/question.model';
import { CardModel, MatchModel } from './match.model';
import { PlayerModel } from '../player/player.model';

function buildQuestion(id: string, source: QuestionSource): QuestionModel {
  return {
    id,
    text: `Pregunta ${id}`,
    options: ['A', 'B', 'C', 'D'],
    correctOptionIndex: 0,
    source,
  };
}

function buildCard(id: string, source: QuestionSource): CardModel {
  return {
    id,
    question: buildQuestion(id, source),
    state: 'face-down',
    result: 'pending',
    selectedOptionIndex: null,
  };
}

function buildMatch(player: PlayerModel, cards: CardModel[]): MatchModel {
  return {
    player,
    cards,
    maxAnswerableCards: 6,
    status: 'in-progress',
  };
}

describe('MatchModel invariants', () => {
  const player: PlayerModel = { alias: 'Jugador1', chosenTopic: 'Ajedrez' };
  const galateaCards = Array.from({ length: 6 }, (_, i) => buildCard(`gal-${i}`, QuestionSource.Galatea));
  const topicCards = Array.from({ length: 6 }, (_, i) => buildCard(`topic-${i}`, QuestionSource.ChosenTopic));
  const match = buildMatch(player, [...galateaCards, ...topicCards]);

  it('tiene exactamente 12 tarjetas', () => {
    expect(match.cards.length).toBe(12);
  });

  it('tiene 6 tarjetas de Galatea y 6 del tema elegido', () => {
    expect(match.cards.filter((c) => c.question.source === QuestionSource.Galatea).length).toBe(6);
    expect(match.cards.filter((c) => c.question.source === QuestionSource.ChosenTopic).length).toBe(6);
  });

  it('define maxAnswerableCards en 6', () => {
    expect(match.maxAnswerableCards).toBe(6);
  });

  it('nunca excede maxAnswerableCards tarjetas respondidas', () => {
    const answered = match.cards.map((c, i) => (i < 6 ? { ...c, state: 'answered' as const } : c));
    const answeredCount = answered.filter((c) => c.state === 'answered').length;
    expect(answeredCount).toBeLessThanOrEqual(match.maxAnswerableCards);
  });

  it('inicia en estado in-progress', () => {
    expect(match.status).toBe('in-progress');
  });

  it('cada tarjeta inicia boca abajo y sin selección', () => {
    for (const card of match.cards) {
      expect(card.state).toBe('face-down');
      expect(card.selectedOptionIndex).toBeNull();
      expect(card.result).toBe('pending');
    }
  });
});
