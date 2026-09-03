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

function geminiRawQuestion(text: string, correctOptionIndex = 1) {
  return {
    text,
    options: [
      'Primera opción de respuesta',
      'Segunda opción de respuesta',
      'Tercera opción de respuesta',
      'Cuarta opción de respuesta',
    ],
    correctOptionIndex,
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
      providers: [
        QuestionService,
        {
          provide: GeminiClientService,
          useValue: { generateJson: generateJsonMock },
        },
      ],
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

    it('retorna solo las preguntas disponibles del banco sin intentar generación vía Gemini (FR-004)', (done) => {
      const bank = { version: 1, questions: [bankQuestion('gal-0'), bankQuestion('gal-1')] };

      service.getGalateaQuestions(6).subscribe((questions) => {
        expect(questions.length).toBe(2);
        expect(questions.every((q) => q.source === QuestionSource.Galatea)).toBe(true);
        expect(generateJsonMock).not.toHaveBeenCalled();
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

    it('retorna las preguntas válidas disponibles cuando Gemini entrega menos de 6', (done) => {
      generateJsonMock.mockReturnValue(
        of(
          JSON.stringify({
            questions: [geminiRawQuestion('Esta es la única pregunta válida generada por Gemini en la prueba')],
          }),
        ),
      );

      service.getChosenTopicQuestions('Fútbol', 6).subscribe((questions) => {
        expect(questions).toHaveLength(1);
        done();
      });
    });

    it('filtra preguntas fuera de rango de longitud (FR-005A) y conserva las válidas', (done) => {
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

      service.getChosenTopicQuestions('Fútbol', 6).subscribe((questions) => {
        expect(questions).toHaveLength(5);
        done();
      });
    });

    it('trata un JSON malformado como 0 preguntas válidas', (done) => {
      generateJsonMock.mockReturnValue(of('esto no es JSON'));

      service.getChosenTopicQuestions('Fútbol', 6).subscribe((questions) => {
        expect(questions).toHaveLength(0);
        done();
      });
    });

    it('acepta respuesta JSON envuelta en bloque Markdown y completa la partida', (done) => {
      generateJsonMock.mockReturnValue(
        of(`\`\`\`json\n${JSON.stringify({
          questions: Array.from({ length: 6 }, (_, i) =>
            geminiRawQuestion(`Pregunta número ${i} sobre el tema elegido por el jugador en la partida`),
          ),
        })}\n\`\`\``),
      );

      service.getChosenTopicQuestions('Fútbol', 6).subscribe((questions) => {
        expect(questions.length).toBe(6);
        done();
      });
    });

    it('acepta respuesta doblemente serializada y completa la partida', (done) => {
      generateJsonMock.mockReturnValue(
        of(
          JSON.stringify(
            JSON.stringify({
              questions: Array.from({ length: 6 }, (_, i) =>
                geminiRawQuestion(`Pregunta número ${i} sobre el tema elegido por el jugador en la partida`),
              ),
            }),
          ),
        ),
      );

      service.getChosenTopicQuestions('Fútbol', 6).subscribe((questions) => {
        expect(questions.length).toBe(6);
        done();
      });
    });

    it('trata un JSON válido sin la propiedad "questions" (array) como 0 preguntas válidas', (done) => {
      generateJsonMock.mockReturnValue(of(JSON.stringify({ notQuestions: 'valor inesperado' })));

      service.getChosenTopicQuestions('Fútbol', 6).subscribe((questions) => {
        expect(questions).toHaveLength(0);
        done();
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
        expect(sentPrompt).toContain('Genera exactamente 8 preguntas');
        done();
      });
    });
  });

  describe('corrección de sesgo de índice correcto en IA (FR-033)', () => {
    it('corrige la concentración de correctOptionIndex cuando Gemini devuelve las 6 respuestas correctas en el mismo índice', (done) => {
      generateJsonMock.mockReturnValue(
        of(
          JSON.stringify({
            questions: Array.from({ length: 6 }, (_, i) =>
              geminiRawQuestion(`Pregunta número ${i} sobre el tema elegido por el jugador en la partida`, 1),
            ),
          }),
        ),
      );

      service.getChosenTopicQuestions('Fútbol', 6).subscribe((questions) => {
        expect(questions.length).toBe(6);

        const countByIndex = [0, 0, 0, 0];
        for (const question of questions) {
          countByIndex[question.correctOptionIndex] += 1;
          // La respuesta correcta debe seguir siendo el mismo contenido original,
          // sin importar a qué índice se haya movido tras el rebalanceo.
          expect(question.options[question.correctOptionIndex]).toBe('Segunda opción de respuesta');
        }

        expect(Math.max(...countByIndex)).toBeLessThanOrEqual(3);
        done();
      });
    });


  });
});
