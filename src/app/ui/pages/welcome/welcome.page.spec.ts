import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { QuestionSource } from '../../../domain/enums/question-source.enum';
import { MatchModel } from '../../../domain/models/match/match.model';
import { BuildMatchUsecase } from '../../../domain/models/match/usecase/build-match.usecase';
import { CurrentMatchStore } from '../../../shared/foundational/state/current-match.store';
import { MatchStoreService } from '../../../shared/foundational/state/match-store.service';
import { WelcomePage } from './welcome.page';

function buildMatch(): MatchModel {
  return {
    player: { alias: 'Jugador1', chosenTopic: 'Fútbol' },
    cards: Array.from({ length: 12 }, (_, i) => ({
      id: `card-${i}`,
      question: {
        id: `q-${i}`,
        text: `Pregunta ${i}`,
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
  };
}

describe('WelcomePage', () => {
  let buildMock: jest.Mock;
  let initializeSessionMock: jest.Mock;
  let setQuestionsMock: jest.Mock;
  let setMatchMock: jest.Mock;
  let navigateByUrlMock: jest.Mock;

  function createComponent(queryParams: Record<string, string> = {}) {
    buildMock = jest.fn();
    initializeSessionMock = jest.fn();
    setQuestionsMock = jest.fn();
    setMatchMock = jest.fn();
    navigateByUrlMock = jest.fn();

    TestBed.configureTestingModule({
      imports: [WelcomePage],
      providers: [
        { provide: BuildMatchUsecase, useValue: { build: buildMock } },
        {
          provide: MatchStoreService,
          useValue: { initializeSession: initializeSessionMock, setQuestions: setQuestionsMock },
        },
        { provide: CurrentMatchStore, useValue: { setMatch: setMatchMock } },
        { provide: Router, useValue: { navigateByUrl: navigateByUrlMock } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } },
        },
      ],
    });

    const fixture = TestBed.createComponent(WelcomePage);
    fixture.detectChanges();
    return fixture;
  }

  it('no invoca el usecase si el formulario es inválido', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.submit();

    expect(buildMock).not.toHaveBeenCalled();
    expect(component.form.controls.alias.touched).toBe(true);
  });

  it('precarga el alias recibido por query param (FR-015)', () => {
    const fixture = createComponent({ alias: 'AliasPrevio' });

    expect(fixture.componentInstance.form.controls.alias.value).toBe('AliasPrevio');
  });

  it('rechaza temas inseguros sin invocar el usecase (FR-020)', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    component.form.controls.alias.setValue('Jugador1');
    component.form.controls.topic.setValue('idiota');

    component.submit();

    expect(buildMock).not.toHaveBeenCalled();
    expect(component.errorMessage()).toBeTruthy();
  });

  it('deshabilita el envío inmediatamente al iniciar la construcción de la partida (FR-031)', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    component.form.controls.alias.setValue('Jugador1');
    component.form.controls.topic.setValue('Fútbol');
    buildMock.mockReturnValue(of(buildMatch()));

    component.submit();

    expect(buildMock).toHaveBeenCalledWith({ alias: 'Jugador1', chosenTopic: 'Fútbol' });
  });

  it('al construir la partida exitosamente, guarda el estado y navega a /board', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    component.form.controls.alias.setValue('Jugador1');
    component.form.controls.topic.setValue('Fútbol');
    const match = buildMatch();
    buildMock.mockReturnValue(of(match));

    component.submit();

    expect(setMatchMock).toHaveBeenCalledWith(match);
    expect(initializeSessionMock).toHaveBeenCalledWith('Jugador1', 'Fútbol');
    expect(setQuestionsMock).toHaveBeenCalledWith(
      match.cards.map((card) => ({
        id: card.id,
        category: card.question.source === QuestionSource.Galatea ? 'galatea' : 'chosen-topic',
        state: 'faceDown',
      })),
    );
    expect(navigateByUrlMock).toHaveBeenCalledWith('/board');
    expect(component.isSubmitting()).toBe(false);
  });

  it('ignora un segundo submit mientras la generación de preguntas está en curso (FR-031)', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    component.form.controls.alias.setValue('Jugador1');
    component.form.controls.topic.setValue('Fútbol');
    const pendingBuild$ = new Subject<MatchModel>();
    buildMock.mockReturnValue(pendingBuild$);

    component.submit();
    expect(component.isSubmitting()).toBe(true);

    component.submit();

    expect(buildMock).toHaveBeenCalledTimes(1);
  });

  it('muestra un mensaje de error amigable y conserva el alias si el usecase falla (FR-003)', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    component.form.controls.alias.setValue('Jugador1');
    component.form.controls.topic.setValue('Fútbol');
    buildMock.mockReturnValue(throwError(() => new Error('fallo de IA')));

    component.submit();

    expect(component.errorMessage()).toBeTruthy();
    expect(component.isSubmitting()).toBe(false);
    expect(component.form.controls.alias.value).toBe('Jugador1');
  });

  it('deja el estado limpio (sin partida a medio construir) cuando el usecase falla (FR-025)', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    component.form.controls.alias.setValue('Jugador1');
    component.form.controls.topic.setValue('Fútbol');
    buildMock.mockReturnValue(throwError(() => new Error('fallo de conectividad')));

    component.submit();

    expect(setMatchMock).not.toHaveBeenCalled();
    expect(initializeSessionMock).not.toHaveBeenCalled();
    expect(setQuestionsMock).not.toHaveBeenCalled();
    expect(navigateByUrlMock).not.toHaveBeenCalled();
    expect(component.errorMessage()).toBeTruthy();
  });

  it('muestra un mensaje específico de conectividad cuando falla estando offline (FR-025)', () => {
    const onLineSpy = jest.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
    const fixture = createComponent();
    const component = fixture.componentInstance;
    component.form.controls.alias.setValue('Jugador1');
    component.form.controls.topic.setValue('Fútbol');
    buildMock.mockReturnValue(throwError(() => new Error('fallo de conectividad')));

    component.submit();

    expect(component.errorMessage()).toBe('Perdiste la conexión a internet. Verifica tu red e intenta nuevamente.');

    onLineSpy.mockRestore();
  });

  it('retry() reintenta la construcción de la partida', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    component.form.controls.alias.setValue('Jugador1');
    component.form.controls.topic.setValue('Fútbol');
    buildMock.mockReturnValue(of(buildMatch()));

    component.retry();

    expect(buildMock).toHaveBeenCalled();
  });

  it('muestra el mensaje de carga extendido tras 2 segundos (FR-017)', () => {
    jest.useFakeTimers();
    const fixture = createComponent();
    const component = fixture.componentInstance;
    component.form.controls.alias.setValue('Jugador1');
    component.form.controls.topic.setValue('Fútbol');
    buildMock.mockReturnValue({ subscribe: jest.fn() });

    component.submit();
    expect(component.showLoadingMessage()).toBe(false);

    jest.advanceTimersByTime(2_000);
    expect(component.showLoadingMessage()).toBe(true);

    jest.useRealTimers();
  });
});
