import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { QuestionSource } from '../../domain/enums/question-source.enum';
import { GeminiClientService } from '../gemini/gemini-client.service';
import { InsufficientGeneratedQuestionsError, QuestionService } from './question.service';

function bankQuestion(id: string, text = `Pregunta ${id}`) {
  return {
    id,
    text,
    options: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
    correctOptionIndex: 0,
  };
}

function geminiRawQuestion(text: string) {
  return {
    text,
    options: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
    correctOptionIndex: 1,
  };
}

describe('QuestionService', () => {
  let service: QuestionService;
  let httpMock: HttpTestingController;
  let generateJsonMock: jest.Mock;

  beforeEach(() => {
    generateJsonMock = jest.fn();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [QuestionService, { provide: GeminiClientService, useValue: { generateJson: generateJsonMock } }],
    });

    service = TestBed.inject(QuestionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getGalateaQuestions', () => {
    it('selecciona 6 preguntas al azar del banco sin llamar a Gemini cuando hay suficientes (FR-004)', (done) => {
      const bank = {
        version: 1,
        questions: Array.from({ length: 12 }, (_, i) => bankQuestion(`gal-${i}`)),
      };

      service.getGalateaQuestions(6).subscribe((questions) => {
        expect(questions.length).toBe(6);
        expect(questions.every((q) => q.source === QuestionSource.Galatea)).toBe(true);
        expect(generateJsonMock).not.toHaveBeenCalled();
        done();
      });

      const req = httpMock.expectOne('assets/galatea-questions.json');
      req.flush(bank);
    });

    it('completa con IA (fallback) si el banco tiene menos de 6 preguntas válidas (FR-004)', (done) => {
      const bank = { version: 1, questions: [bankQuestion('gal-0'), bankQuestion('gal-1')] };
      generateJsonMock.mockReturnValue(
        of(
          JSON.stringify({
            questions: [
              geminiRawQuestion('Pregunta IA 1'),
              geminiRawQuestion('Pregunta IA 2'),
              geminiRawQuestion('Pregunta IA 3'),
              geminiRawQuestion('Pregunta IA 4'),
            ],
          }),
        ),
      );

      service.getGalateaQuestions(6).subscribe((questions) => {
        expect(questions.length).toBe(6);
        expect(questions.every((q) => q.source === QuestionSource.Galatea)).toBe(true);
        expect(generateJsonMock).toHaveBeenCalledTimes(1);
        done();
      });

      const req = httpMock.expectOne('assets/galatea-questions.json');
      req.flush(bank);
    });

    it('deduplica por texto entre preguntas del banco y del fallback de IA (FR-021)', (done) => {
      const bank = { version: 1, questions: [bankQuestion('gal-0', 'Texto duplicado')] };
      generateJsonMock.mockReturnValue(
        of(
          JSON.stringify({
            questions: [geminiRawQuestion('Texto duplicado'), geminiRawQuestion('Texto único')],
          }),
        ),
      );

      service.getGalateaQuestions(6).subscribe((questions) => {
        const texts = questions.map((q) => q.text);
        expect(new Set(texts).size).toBe(texts.length);
        done();
      });

      const req = httpMock.expectOne('assets/galatea-questions.json');
      req.flush(bank);
    });
  });

  describe('getChosenTopicQuestions', () => {
    it('mapea 6 preguntas válidas generadas por Gemini con source ChosenTopic (FR-003)', (done) => {
      generateJsonMock.mockReturnValue(
        of(
          JSON.stringify({
            questions: Array.from({ length: 6 }, (_, i) => geminiRawQuestion(`Pregunta tema ${i}`)),
          }),
        ),
      );

      service.getChosenTopicQuestions('Fútbol', 6).subscribe((questions) => {
        expect(questions.length).toBe(6);
        expect(questions.every((q) => q.source === QuestionSource.ChosenTopic)).toBe(true);
        done();
      });
    });

    it('lanza InsufficientGeneratedQuestionsError si Gemini retorna menos de 6 preguntas válidas', (done) => {
      generateJsonMock.mockReturnValue(
        of(JSON.stringify({ questions: [geminiRawQuestion('Solo una pregunta')] })),
      );

      service.getChosenTopicQuestions('Fútbol', 6).subscribe({
        error: (err) => {
          expect(err).toBeInstanceOf(InsufficientGeneratedQuestionsError);
          done();
        },
      });
    });

    it('trata un JSON malformado como 0 preguntas válidas y lanza el error de insuficiencia', (done) => {
      generateJsonMock.mockReturnValue(of('esto no es JSON'));

      service.getChosenTopicQuestions('Fútbol', 6).subscribe({
        error: (err) => {
          expect(err).toBeInstanceOf(InsufficientGeneratedQuestionsError);
          done();
        },
      });
    });
  });
});
