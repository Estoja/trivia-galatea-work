import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { QuestionSource } from '../../../domain/enums/question-source.enum';
import { MatchModel } from '../../../domain/models/match/match.model';
import { AnswerCardUsecase } from '../../../domain/models/match/usecase/answer-card.usecase';
import { CurrentMatchStore } from '../../../shared/foundational/state/current-match.store';
import { MatchStoreService } from '../../../shared/foundational/state/match-store.service';
import { ANSWER_FEEDBACK_DISPLAY_MS, BoardPage } from './board.page';

function buildMatch(overrides: Partial<MatchModel> = {}): MatchModel {
  return {
    player: { alias: 'Jugador1', chosenTopic: 'Fútbol' },
    cards: Array.from({ length: 12 }, (_, i) => ({
      id: `card-${i}`,
      question: {
        id: `q-${i}`,
        text: `Pregunta ${i} con suficiente longitud para pasar validaciones`,
        options: ['A', 'B', 'C', 'D'],
        correctOptionIndex: 0,
        source: i < 6 ? QuestionSource.Galatea : QuestionSource.ChosenTopic,
      },
      state: 'face-down',
      result: 'pending',
      selectedOptionIndex: null,
    })),
    maxAnswerableCards: 6,
    status: 'in-progress',
    ...overrides,
  };
}

describe('BoardPage', () => {
  let navigateByUrlMock: jest.Mock;
  let openCardMock: jest.Mock;
  let confirmAnswerMock: jest.Mock;
  let currentMatchSignal: ReturnType<typeof signal<MatchModel | null>>;
  let setMatchMock: jest.Mock;

  function createComponent(initialMatch: MatchModel | null) {
    navigateByUrlMock = jest.fn();
    openCardMock = jest.fn().mockReturnValue({ ok: true });
    confirmAnswerMock = jest.fn().mockReturnValue({ ok: true });
    currentMatchSignal = signal(initialMatch);
    setMatchMock = jest.fn((match: MatchModel) => currentMatchSignal.set(match));

    TestBed.configureTestingModule({
      imports: [BoardPage],
      providers: [
        { provide: Router, useValue: { navigateByUrl: navigateByUrlMock } },
        {
          provide: CurrentMatchStore,
          useValue: { match: currentMatchSignal, setMatch: setMatchMock },
        },
        {
          provide: MatchStoreService,
          useValue: {
            openCard: openCardMock,
            confirmAnswer: confirmAnswerMock,
            liveScore: signal(0),
          },
        },
        { provide: AnswerCardUsecase, useClass: AnswerCardUsecase },
      ],
    });

    const fixture = TestBed.createComponent(BoardPage);
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => {
    jest.useRealTimers();
  });

  it('redirige a /welcome si no hay partida cargada', () => {
    createComponent(null);

    expect(navigateByUrlMock).toHaveBeenCalledWith('/welcome');
  });

  it('no redirige cuando ya existe una partida en curso', () => {
    createComponent(buildMatch());

    expect(navigateByUrlMock).not.toHaveBeenCalled();
  });

  it('voltea la tarjeta y notifica al store fundacional al abrir una tarjeta boca abajo', () => {
    const fixture = createComponent(buildMatch());
    const component = fixture.componentInstance;

    component.openCard('card-0');
    fixture.detectChanges();

    expect(openCardMock).toHaveBeenCalledWith('card-0');
    expect(component.match()?.cards.find((c) => c.id === 'card-0')?.state).toBe('flipped');
    expect(component.activeCard()?.id).toBe('card-0');
  });

  it('no abre una segunda tarjeta mientras hay una activa', () => {
    const fixture = createComponent(buildMatch());
    const component = fixture.componentInstance;

    component.openCard('card-0');
    component.openCard('card-1');
    fixture.detectChanges();

    expect(openCardMock).toHaveBeenCalledTimes(1);
  });

  it('aplica la respuesta, muestra feedback y cierra el modal tras el temporizador', () => {
    jest.useFakeTimers();
    const fixture = createComponent(buildMatch());
    const component = fixture.componentInstance;

    component.openCard('card-0');
    component.confirmAnswer(0);
    fixture.detectChanges();

    expect(confirmAnswerMock).toHaveBeenCalledWith('card-0', '0', true);
    expect(component.feedback()).toBe('correct');
    expect(component.match()?.cards.find((c) => c.id === 'card-0')?.state).toBe('answered');

    jest.advanceTimersByTime(ANSWER_FEEDBACK_DISPLAY_MS);
    fixture.detectChanges();

    expect(component.activeCard()).toBeNull();
    expect(component.feedback()).toBeNull();
  });

  it('navega a /results cuando la partida queda completa tras responder', () => {
    jest.useFakeTimers();
    const answeredCards = buildMatch().cards.map((card, i) =>
      i < 5 ? { ...card, state: 'answered' as const, result: 'correct' as const, selectedOptionIndex: 0 } : card,
    );
    const fixture = createComponent(buildMatch({ cards: answeredCards }));
    const component = fixture.componentInstance;

    component.openCard('card-5');
    component.confirmAnswer(0);
    fixture.detectChanges();

    jest.advanceTimersByTime(ANSWER_FEEDBACK_DISPLAY_MS);
    fixture.detectChanges();

    expect(navigateByUrlMock).toHaveBeenCalledWith('/results');
  });
});
