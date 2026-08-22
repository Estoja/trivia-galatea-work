import { TestBed } from '@angular/core/testing';
import { QuestionSource } from '../../../domain/enums/question-source.enum';
import { MatchModel } from '../../../domain/models/match/match.model';
import { CurrentMatchStore } from './current-match.store';

function buildMatch(): MatchModel {
  return {
    player: { alias: 'Jugador1', chosenTopic: 'Fútbol' },
    cards: [
      {
        id: 'card-0',
        question: {
          id: 'gal-001',
          text: 'Pregunta de ejemplo',
          options: ['A', 'B', 'C', 'D'],
          correctOptionIndex: 0,
          source: QuestionSource.Galatea,
        },
        state: 'face-down',
        result: 'pending',
        selectedOptionIndex: null,
      },
    ],
    maxAnswerableCards: 6,
    status: 'in-progress',
  };
}

describe('CurrentMatchStore', () => {
  let store: CurrentMatchStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(CurrentMatchStore);
  });

  it('debe iniciar sin partida activa', () => {
    expect(store.match()).toBeNull();
  });

  it('debe exponer el MatchModel establecido vía setMatch', () => {
    const match = buildMatch();

    store.setMatch(match);

    expect(store.match()).toEqual(match);
  });

  it('debe limpiar la partida activa vía clear', () => {
    store.setMatch(buildMatch());

    store.clear();

    expect(store.match()).toBeNull();
  });
});
