import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { QuestionSource } from '../../../domain/enums/question-source.enum';
import { MatchModel } from '../../../domain/models/match/match.model';
import { AssignLevelUsecase } from '../../../domain/models/level/usecase/assign-level.usecase';
import { CalculateMatchScoreUsecase } from '../../../domain/models/match/usecase/calculate-match-score.usecase';
import { CurrentMatchStore } from '../../../shared/foundational/state/current-match.store';
import { MatchStoreService } from '../../../shared/foundational/state/match-store.service';
import { ResultsPage } from './results.page';

function buildMatch(): MatchModel {
  return {
    player: { alias: 'Jugador1', chosenTopic: 'Fútbol' },
    cards: [
      // 2 Galatea correctas, 1 Galatea incorrecta
      buildCard('g1', QuestionSource.Galatea, 'correct'),
      buildCard('g2', QuestionSource.Galatea, 'correct'),
      buildCard('g3', QuestionSource.Galatea, 'incorrect'),
      // 3 tema correctas
      buildCard('t1', QuestionSource.ChosenTopic, 'correct'),
      buildCard('t2', QuestionSource.ChosenTopic, 'correct'),
      buildCard('t3', QuestionSource.ChosenTopic, 'correct'),
      // 6 restantes sin responder (boca abajo)
      ...Array.from({ length: 6 }, (_, i) => buildCard(`x${i}`, QuestionSource.Galatea, 'pending')),
    ],
    maxAnswerableCards: 6,
    status: 'completed',
  };
}

function buildCard(id: string, source: QuestionSource, result: 'pending' | 'correct' | 'incorrect') {
  return {
    id,
    question: {
      id: `q-${id}`,
      text: `Pregunta ${id} con suficiente longitud para pasar validaciones`,
      options: ['A', 'B', 'C', 'D'] as [string, string, string, string],
      correctOptionIndex: 0,
      source,
    },
    state: (result === 'pending' ? 'face-down' : 'answered') as 'face-down' | 'answered',
    result,
    selectedOptionIndex: result === 'pending' ? null : 0,
  };
}

describe('ResultsPage', () => {
  let navigateByUrlMock: jest.Mock;
  let navigateMock: jest.Mock;
  let resetSessionMock: jest.Mock;
  let clearMock: jest.Mock;
  let matchSignal: ReturnType<typeof signal<MatchModel | null>>;

  function createComponent(initialMatch: MatchModel | null, playerAlias = 'Jugador1') {
    navigateByUrlMock = jest.fn();
    navigateMock = jest.fn();
    resetSessionMock = jest.fn();
    clearMock = jest.fn();
    matchSignal = signal(initialMatch);

    TestBed.configureTestingModule({
      imports: [ResultsPage],
      providers: [
        { provide: Router, useValue: { navigateByUrl: navigateByUrlMock, navigate: navigateMock } },
        { provide: CurrentMatchStore, useValue: { match: matchSignal, clear: clearMock } },
        {
          provide: MatchStoreService,
          useValue: { playerAlias: signal(playerAlias), resetSession: resetSessionMock },
        },
        { provide: CalculateMatchScoreUsecase, useClass: CalculateMatchScoreUsecase },
        { provide: AssignLevelUsecase, useClass: AssignLevelUsecase },
      ],
    });

    const fixture = TestBed.createComponent(ResultsPage);
    fixture.detectChanges();
    return fixture;
  }

  it('redirige a /welcome si no hay partida cargada', () => {
    createComponent(null);

    expect(navigateByUrlMock).toHaveBeenCalledWith('/welcome');
  });

  it('muestra el alias del jugador', () => {
    const fixture = createComponent(buildMatch());

    expect(fixture.nativeElement.textContent).toContain('Jugador1');
  });

  it('calcula el puntaje total combinando el multiplicador Galatea y los puntos de tema (2 Galatea + 3 tema = 70)', () => {
    const fixture = createComponent(buildMatch());
    const component = fixture.componentInstance;

    expect(component.score().totalScore).toBe(70);
    expect(fixture.nativeElement.textContent).toContain('70');
  });

  it('asigna el nivel Explorador para 70 puntos y lo muestra centrado vía tg-celebration', () => {
    const fixture = createComponent(buildMatch());
    const component = fixture.componentInstance;

    expect(component.level().title).toBe('Explorador');
    expect(fixture.nativeElement.textContent).toContain('Explorador');
  });

  it('muestra el desglose de respuestas por categoría (Escenario 5)', () => {
    const fixture = createComponent(buildMatch());

    expect(fixture.nativeElement.textContent).toContain('2 de 3 correctas');
    expect(fixture.nativeElement.textContent).toContain('3 de 3 correctas');
  });

  it('lista únicamente las tarjetas ya respondidas (no las boca abajo)', () => {
    const fixture = createComponent(buildMatch());
    const component = fixture.componentInstance;

    expect(component.answeredCards().length).toBe(6);
  });

  it('al hacer clic en "Jugar de nuevo" reinicia el store, limpia la partida actual y navega a /welcome con el alias pre-rellenado', () => {
    const fixture = createComponent(buildMatch(), 'Jugador1');
    const component = fixture.componentInstance;

    component.playAgain();

    expect(resetSessionMock).toHaveBeenCalled();
    expect(clearMock).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith(['/welcome'], { queryParams: { alias: 'Jugador1' } });
  });

  it('T073 (XSS): un alias/tema con marcado malicioso se renderiza como texto plano escapado, nunca como HTML/script ejecutable', () => {
    const maliciousAlias = '<script>window.__xss = true;</script>';
    const match = buildMatch();
    const maliciousMatch: MatchModel = { ...match, player: { ...match.player, chosenTopic: '<img src=x onerror=alert(1)>' } };
    const fixture = createComponent(maliciousMatch, maliciousAlias);

    const root = fixture.nativeElement as HTMLElement;
    // Angular interpola `{{ }}` como texto: no debe existir ningún nodo <script>/<img> real en el DOM.
    expect(root.querySelector('script')).toBeNull();
    expect(root.querySelector('img')).toBeNull();
    // El texto literal (escapado) sí debe estar presente como contenido de texto plano.
    expect(root.textContent).toContain(maliciousAlias);
    expect(root.textContent).toContain('<img src=x onerror=alert(1)>');
  });
});
