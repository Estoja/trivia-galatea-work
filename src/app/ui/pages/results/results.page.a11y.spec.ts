import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { axe, toHaveNoViolations } from 'jest-axe';
import { QuestionSource } from '../../../domain/enums/question-source.enum';
import { MatchModel } from '../../../domain/models/match/match.model';
import { AssignLevelUsecase } from '../../../domain/models/level/usecase/assign-level.usecase';
import { CalculateMatchScoreUsecase } from '../../../domain/models/match/usecase/calculate-match-score.usecase';
import { CurrentMatchStore } from '../../../shared/foundational/state/current-match.store';
import { MatchStoreService } from '../../../shared/foundational/state/match-store.service';
import { ResultsPage } from './results.page';

expect.extend(toHaveNoViolations);

function buildCard(id: string, source: QuestionSource, result: 'correct' | 'incorrect') {
  return {
    id,
    question: {
      id: `q-${id}`,
      text: `Pregunta ${id} con suficiente longitud para pasar validaciones`,
      options: ['A', 'B', 'C', 'D'] as [string, string, string, string],
      correctOptionIndex: 0,
      source,
    },
    state: 'answered' as const,
    result,
    selectedOptionIndex: 0,
  };
}

function buildMatch(): MatchModel {
  return {
    player: { alias: 'Jugador1', chosenTopic: 'Fútbol' },
    cards: [
      buildCard('g1', QuestionSource.Galatea, 'correct'),
      buildCard('g2', QuestionSource.Galatea, 'incorrect'),
      buildCard('t1', QuestionSource.ChosenTopic, 'correct'),
      buildCard('t2', QuestionSource.ChosenTopic, 'correct'),
    ],
    maxAnswerableCards: 6,
    status: 'completed',
  };
}

describe('ResultsPage accessibility', () => {
  function createFixture(match: MatchModel) {
    TestBed.configureTestingModule({
      imports: [ResultsPage],
      providers: [
        { provide: Router, useValue: { navigateByUrl: jest.fn(), navigate: jest.fn() } },
        { provide: CurrentMatchStore, useValue: { match: signal(match), clear: jest.fn() } },
        {
          provide: MatchStoreService,
          useValue: { playerAlias: signal('Jugador1'), resetSession: jest.fn() },
        },
        { provide: CalculateMatchScoreUsecase, useClass: CalculateMatchScoreUsecase },
        { provide: AssignLevelUsecase, useClass: AssignLevelUsecase },
      ],
    });

    const fixture = TestBed.createComponent(ResultsPage);
    fixture.detectChanges();
    return fixture;
  }

  it('no tiene violaciones de accesibilidad detectables por axe-core', async () => {
    const fixture = createFixture(buildMatch());

    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
