import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { axe, toHaveNoViolations } from 'jest-axe';
import { QuestionSource } from '../../../domain/enums/question-source.enum';
import { MatchModel } from '../../../domain/models/match/match.model';
import { AnswerCardUsecase } from '../../../domain/models/match/usecase/answer-card.usecase';
import { CurrentMatchStore } from '../../../shared/foundational/state/current-match.store';
import { MatchStoreService } from '../../../shared/foundational/state/match-store.service';
import { BoardPage } from './board.page';

expect.extend(toHaveNoViolations);

function buildMatch(): MatchModel {
  return {
    player: { alias: 'Jugador1', chosenTopic: 'Fútbol' },
    cards: Array.from({ length: 12 }, (_, i) => ({
      id: `card-${i}`,
      question: {
        id: `q-${i}`,
        text: `Pregunta ${i} con suficiente longitud para pasar validaciones`,
        options: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
        correctOptionIndex: 0,
        source: i < 6 ? QuestionSource.Galatea : QuestionSource.ChosenTopic,
      },
      state: 'face-down',
      result: 'pending',
      selectedOptionIndex: null,
    })),
    maxAnswerableCards: 6,
    status: 'in-progress',
  };
}

describe('BoardPage accessibility', () => {
  function createFixture(match: MatchModel) {
    TestBed.configureTestingModule({
      imports: [BoardPage],
      providers: [
        { provide: Router, useValue: { navigateByUrl: jest.fn() } },
        { provide: CurrentMatchStore, useValue: { match: signal(match), setMatch: jest.fn() } },
        {
          provide: MatchStoreService,
          useValue: {
            openCard: jest.fn().mockReturnValue({ ok: true }),
            confirmAnswer: jest.fn().mockReturnValue({ ok: true }),
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

  it('no tiene violaciones de accesibilidad detectables por axe-core con el tablero cerrado', async () => {
    const fixture = createFixture(buildMatch());

    const results = await axe(fixture.nativeElement);

    expect(results).toHaveNoViolations();
  });

  it('no tiene violaciones de accesibilidad con el modal de pregunta abierto', async () => {
    const fixture = createFixture(buildMatch());
    fixture.componentInstance.openCard('card-0');
    fixture.detectChanges();

    const results = await axe(fixture.nativeElement);

    expect(results).toHaveNoViolations();
  });
});
