import { of, throwError } from 'rxjs';
import { QuestionGateway } from '../../question/gateway/question.gateway';
import { QuestionModel } from '../../question/question.model';
import { QuestionSource } from '../../../enums/question-source.enum';
import { PlayerModel } from '../../player/player.model';
import { BuildMatchUsecase, GALATEA_ONLY_NOTICE, InsufficientQuestionsError } from './build-match.usecase';

function buildQuestions(count: number, source: QuestionSource, prefix: string): QuestionModel[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${i}`,
    text: `Pregunta ${prefix} número ${i} con suficiente longitud para pasar validaciones`,
    options: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
    correctOptionIndex: 0,
    source,
  }));
}

describe('BuildMatchUsecase', () => {
  let gatewayMock: jest.Mocked<QuestionGateway>;
  let usecase: BuildMatchUsecase;
  const player: PlayerModel = { alias: 'Jugador1', chosenTopic: 'Fútbol' };

  beforeEach(() => {
    gatewayMock = {
      getGalateaQuestions: jest.fn(),
      getChosenTopicQuestions: jest.fn(),
    } as unknown as jest.Mocked<QuestionGateway>;
    usecase = new BuildMatchUsecase(gatewayMock);
  });

  it('debe construir un MatchModel con 12 cards boca abajo (6 Galatea + 6 tema)', (done) => {
    gatewayMock.getGalateaQuestions.mockReturnValue(of(buildQuestions(6, QuestionSource.Galatea, 'gal')));
    gatewayMock.getChosenTopicQuestions.mockReturnValue(of(buildQuestions(6, QuestionSource.ChosenTopic, 'topic')));

    usecase.build(player).subscribe((match) => {
      expect(match.cards.length).toBe(12);
      expect(match.cards.every((c) => c.state === 'face-down')).toBe(true);
      expect(match.cards.every((c) => c.result === 'pending')).toBe(true);
      expect(match.cards.every((c) => c.selectedOptionIndex === null)).toBe(true);
      expect(match.cards.filter((c) => c.question.source === QuestionSource.Galatea).length).toBe(6);
      expect(match.cards.filter((c) => c.question.source === QuestionSource.ChosenTopic).length).toBe(6);
      expect(match.maxAnswerableCards).toBe(6);
      expect(match.status).toBe('in-progress');
      expect(match.generationNotice).toBeNull();
      expect(match.player).toEqual(player);
      expect(gatewayMock.getGalateaQuestions).toHaveBeenCalledWith(6);
      expect(gatewayMock.getChosenTopicQuestions).toHaveBeenCalledWith(player.chosenTopic, 6);
      done();
    });
  });

  it('si el tema elegido retorna menos de 6, completa el faltante con Galatea hasta 12', (done) => {
    gatewayMock.getGalateaQuestions.mockReturnValue(of(buildQuestions(11, QuestionSource.Galatea, 'gal')));
    gatewayMock.getChosenTopicQuestions.mockReturnValue(of(buildQuestions(1, QuestionSource.ChosenTopic, 'topic')));

    usecase.build(player).subscribe((match) => {
      expect(match.cards).toHaveLength(12);
      expect(match.cards.filter((c) => c.question.source === QuestionSource.Galatea)).toHaveLength(11);
      expect(match.cards.filter((c) => c.question.source === QuestionSource.ChosenTopic)).toHaveLength(1);
      expect(match.generationNotice).toBeNull();
      expect(gatewayMock.getGalateaQuestions).toHaveBeenCalledWith(11);
      done();
    });
  });

  it('si Gemini falla, cambia a modo solo Galatea (12) y deja aviso de dificultad máxima', (done) => {
    gatewayMock.getGalateaQuestions.mockReturnValue(of(buildQuestions(12, QuestionSource.Galatea, 'gal')));
    gatewayMock.getChosenTopicQuestions.mockReturnValue(throwError(() => new Error('gemini-failure')));

    usecase.build(player).subscribe((match) => {
      expect(match.cards).toHaveLength(12);
      expect(match.cards.every((c) => c.question.source === QuestionSource.Galatea)).toBe(true);
      expect(match.generationNotice).toBe(GALATEA_ONLY_NOTICE);
      expect(gatewayMock.getGalateaQuestions).toHaveBeenCalledWith(12);
      done();
    });
  });

  it('debe lanzar InsufficientQuestionsError si Galatea no completa el faltante requerido', (done) => {
    gatewayMock.getGalateaQuestions.mockReturnValue(of(buildQuestions(10, QuestionSource.Galatea, 'gal')));
    gatewayMock.getChosenTopicQuestions.mockReturnValue(of(buildQuestions(1, QuestionSource.ChosenTopic, 'topic')));

    usecase.build(player).subscribe({
      error: (err) => {
        expect(err).toBeInstanceOf(InsufficientQuestionsError);
        done();
      },
    });
  });

  it('debe lanzar InsufficientQuestionsError si Gemini falla y Galatea no logra completar 12', (done) => {
    gatewayMock.getGalateaQuestions.mockReturnValue(of(buildQuestions(8, QuestionSource.Galatea, 'gal')));
    gatewayMock.getChosenTopicQuestions.mockReturnValue(throwError(() => new Error('gemini-failure')));

    usecase.build(player).subscribe({
      error: (err) => {
        expect(err).toBeInstanceOf(InsufficientQuestionsError);
        done();
      },
    });
  });
});
