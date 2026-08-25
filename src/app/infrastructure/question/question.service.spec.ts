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
    options: [
      'Primera opción de respuesta',
      'Segunda opción de respuesta',
      'Tercera opción de respuesta',
      'Cuarta opción de respuesta',
    ],
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
              geminiRawQuestion('Pregunta generada por IA número uno para el banco de Galatea'),
              geminiRawQuestion('Pregunta generada por IA número dos para el banco de Galatea'),
              geminiRawQuestion('Pregunta generada por IA número tres para el banco de Galatea'),
              geminiRawQuestion('Pregunta generada por IA número cuatro para el banco de Galatea'),
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
      const duplicatedText = 'Este es un texto duplicado de prueba entre el banco y la IA generativa';
      const bank = { version: 1, questions: [bankQuestion('gal-0', duplicatedText)] };
      generateJsonMock.mockReturnValue(
        of(
          JSON.stringify({
            questions: [
              geminiRawQuestion(duplicatedText),
              geminiRawQuestion('Este es un texto completamente único generado por la IA'),
            ],
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

    it('descarta las preguntas de IA fuera del rango de longitud (FR-005A) y no completa el faltante con ellas (FR-004)', (done) => {
      const bank = { version: 1, questions: [bankQuestion('gal-0'), bankQuestion('gal-1')] };
      generateJsonMock.mockReturnValue(
        of(
          JSON.stringify({
            questions: [
              geminiRawQuestion('Muy corta'), // menos de 30 caracteres: se descarta (FR-005A)
              geminiRawQuestion('Pregunta generada por IA número dos para el banco de Galatea'),
              geminiRawQuestion('Pregunta generada por IA número tres para el banco de Galatea'),
              geminiRawQuestion('Pregunta generada por IA número cuatro para el banco de Galatea'),
            ],
          }),
        ),
      );

      service.getGalateaQuestions(6).subscribe((questions) => {
        // El banco aporta 2, la IA aporta sólo 3 válidas (la 4ª se descartó) => 5 en total, no 6.
        expect(questions.length).toBe(5);
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
            questions: Array.from({ length: 6 }, (_, i) =>
              geminiRawQuestion(`Pregunta número ${i} sobre el tema elegido por el jugador en la partida`),
            ),
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
        of(
          JSON.stringify({
            questions: [geminiRawQuestion('Esta es la única pregunta válida generada por Gemini en la prueba')],
          }),
        ),
      );

      service.getChosenTopicQuestions('Fútbol', 6).subscribe({
        error: (err) => {
          expect(err).toBeInstanceOf(InsufficientGeneratedQuestionsError);
          done();
        },
      });
    });

    it('lanza InsufficientGeneratedQuestionsError cuando una pregunta fuera de rango de longitud (FR-005A) deja menos de 6 válidas — no permite un tablero incompleto', (done) => {
      generateJsonMock.mockReturnValue(
        of(
          JSON.stringify({
            questions: [
              ...Array.from({ length: 5 }, (_, i) =>
                geminiRawQuestion(`Pregunta número ${i} sobre el tema elegido por el jugador en la partida`),
              ),
              geminiRawQuestion('Muy corta'), // menos de 30 caracteres: se descarta (FR-005A), quedan sólo 5 válidas
            ],
          }),
        ),
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

    it('trata un JSON válido sin la propiedad "questions" (array) como 0 preguntas válidas y lanza el error de insuficiencia', (done) => {
      generateJsonMock.mockReturnValue(of(JSON.stringify({ notQuestions: 'valor inesperado' })));

      service.getChosenTopicQuestions('Fútbol', 6).subscribe({
        error: (err) => {
          expect(err).toBeInstanceOf(InsufficientGeneratedQuestionsError);
          done();
        },
      });
    });

    it('T088 (A-010/FR-018/FR-019): el prompt enviado a Gemini sólo contiene el tema y el conteo, nunca el alias del jugador ni otros campos de sesión', (done) => {
      // La firma misma de `getChosenTopicQuestions(topic, count)` no recibe alias:
      // esta prueba documenta y audita que el string de prompt resultante tampoco
      // lo contiene por accidente (p. ej. si alguien concatenara sesión completa).
      const playerAlias = 'AliasSecretoDelJugador';
      generateJsonMock.mockReturnValue(
        of(
          JSON.stringify({
            questions: Array.from({ length: 6 }, (_, i) =>
              geminiRawQuestion(`Pregunta número ${i} de prueba con longitud suficiente para pasar la validación`),
            ),
          }),
        ),
      );

      service.getChosenTopicQuestions('Fútbol', 6).subscribe(() => {
        expect(generateJsonMock).toHaveBeenCalledTimes(1);
        const sentPrompt = generateJsonMock.mock.calls[0][0] as string;
        expect(sentPrompt).not.toContain(playerAlias);
        expect(sentPrompt).toContain('Fútbol');
        done();
      });
    });
  });
});
