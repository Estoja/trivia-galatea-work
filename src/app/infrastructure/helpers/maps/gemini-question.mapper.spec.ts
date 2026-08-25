import { QuestionSource } from '../../../domain/enums/question-source.enum';
import { GeminiQuestionMapper, InvalidGeminiResponseError } from './gemini-question.mapper';

describe('GeminiQuestionMapper', () => {
  let mapper: GeminiQuestionMapper;

  beforeEach(() => {
    mapper = new GeminiQuestionMapper();
  });

  it('debe mapear un elemento válido a QuestionModel con source ChosenTopic', () => {
    const raw = {
      text: '¿Cuál es la capital de un país imaginario usado como ejemplo?',
      options: ['Opción A completa', 'Opción B completa', 'Opción C completa', 'Opción D completa'],
      correctOptionIndex: 2,
    };

    const result = mapper.fromMap(raw);

    expect(result.text).toBe(raw.text);
    expect(result.options).toEqual(raw.options);
    expect(result.correctOptionIndex).toBe(2);
    expect(result.source).toBe(QuestionSource.ChosenTopic);
    expect(result.id).toMatch(/^chosen-topic-/);
  });

  it('debe des-anonimizar placeholders de marca en texto y opciones (FR-018)', () => {
    const raw = {
      text: 'Empresa X impulsa Proyecto Y con innovación.',
      options: ['Empresa X y su equipo', 'Proyecto Y innovador', 'Otra opción disponible', 'Última opción posible'],
      correctOptionIndex: 0,
    };

    const result = mapper.fromMap(raw);

    expect(result.text).toBe('Bancolombia impulsa Galatea con innovación.');
    expect(result.options).toEqual([
      'Bancolombia y su equipo',
      'Galatea innovador',
      'Otra opción disponible',
      'Última opción posible',
    ]);
  });

  it('debe asignar ids únicos a llamadas sucesivas', () => {
    const raw = {
      text: 'Pregunta de prueba con longitud suficiente para validar ids únicos',
      options: ['Opción de prueba A', 'Opción de prueba B', 'Opción de prueba C', 'Opción de prueba D'],
      correctOptionIndex: 0,
    };

    const first = mapper.fromMap(raw);
    const second = mapper.fromMap(raw);

    expect(first.id).not.toBe(second.id);
  });

  it('debe permitir asignar source Galatea (fallback de IA, FR-004)', () => {
    const galateaMapper = new GeminiQuestionMapper(QuestionSource.Galatea);
    const raw = {
      text: 'Pregunta de Galatea con longitud suficiente para pasar la validación',
      options: ['Opción de Galatea A', 'Opción de Galatea B', 'Opción de Galatea C', 'Opción de Galatea D'],
      correctOptionIndex: 0,
    };

    const result = galateaMapper.fromMap(raw);

    expect(result.source).toBe(QuestionSource.Galatea);
  });

  it.each([
    ['objeto no válido', 'no soy un objeto'],
    [
      'sin text',
      {
        options: ['Opción de prueba A', 'Opción de prueba B', 'Opción de prueba C', 'Opción de prueba D'],
        correctOptionIndex: 0,
      },
    ],
    [
      'con menos de 4 opciones',
      {
        text: 'Enunciado con longitud suficiente para pasar la validación mínima',
        options: ['Opción de prueba A', 'Opción de prueba B', 'Opción de prueba C'],
        correctOptionIndex: 0,
      },
    ],
    [
      'correctOptionIndex fuera de rango',
      {
        text: 'Enunciado con longitud suficiente para pasar la validación mínima',
        options: ['Opción de prueba A', 'Opción de prueba B', 'Opción de prueba C', 'Opción de prueba D'],
        correctOptionIndex: 5,
      },
    ],
    [
      'correctOptionIndex no entero',
      {
        text: 'Enunciado con longitud suficiente para pasar la validación mínima',
        options: ['Opción de prueba A', 'Opción de prueba B', 'Opción de prueba C', 'Opción de prueba D'],
        correctOptionIndex: 1.5,
      },
    ],
  ])('debe lanzar InvalidGeminiResponseError cuando el elemento es inválido: %s', (_desc, raw) => {
    expect(() => mapper.fromMap(raw)).toThrow(InvalidGeminiResponseError);
  });

  describe('validación de longitud (FR-005A)', () => {
    const validOptions = ['Opción número uno', 'Opción número dos', 'Opción número tres', 'Opción número cuatro'];
    const validText = 'Enunciado válido con longitud suficiente para pasar la validación mínima.';

    it.each([
      ['exactamente 30 caracteres (límite inferior)', 30],
      ['exactamente 180 caracteres (límite superior)', 180],
    ])('acepta un enunciado de %s', (_desc, length) => {
      const raw = { text: 'x'.repeat(length), options: validOptions, correctOptionIndex: 0 };
      expect(() => mapper.fromMap(raw)).not.toThrow();
    });

    it.each([
      ['29 caracteres (por debajo del mínimo)', 29],
      ['181 caracteres (por encima del máximo)', 181],
    ])('rechaza un enunciado de %s', (_desc, length) => {
      const raw = { text: 'x'.repeat(length), options: validOptions, correctOptionIndex: 0 };
      expect(() => mapper.fromMap(raw)).toThrow(InvalidGeminiResponseError);
    });

    it.each([
      ['exactamente 10 caracteres (límite inferior)', 10],
      ['exactamente 100 caracteres (límite superior)', 100],
    ])('acepta opciones de %s', (_desc, length) => {
      const options = ['x'.repeat(length), 'x'.repeat(length), 'x'.repeat(length), 'x'.repeat(length)];
      expect(() => mapper.fromMap({ text: validText, options, correctOptionIndex: 0 })).not.toThrow();
    });

    it.each([
      ['9 caracteres (por debajo del mínimo)', 9],
      ['101 caracteres (por encima del máximo)', 101],
    ])('rechaza opciones de %s', (_desc, length) => {
      const options = ['x'.repeat(length), 'Opción número dos', 'Opción número tres', 'Opción número cuatro'];
      expect(() => mapper.fromMap({ text: validText, options, correctOptionIndex: 0 })).toThrow(
        InvalidGeminiResponseError,
      );
    });
  });
});
