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
      options: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
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
      options: ['Empresa X', 'Proyecto Y', 'Otra opción', 'Última opción'],
      correctOptionIndex: 0,
    };

    const result = mapper.fromMap(raw);

    expect(result.text).toBe('Bancolombia impulsa Galatea con innovación.');
    expect(result.options).toEqual(['Bancolombia', 'Galatea', 'Otra opción', 'Última opción']);
  });

  it('debe asignar ids únicos a llamadas sucesivas', () => {
    const raw = { text: 'Pregunta', options: ['A', 'B', 'C', 'D'], correctOptionIndex: 0 };

    const first = mapper.fromMap(raw);
    const second = mapper.fromMap(raw);

    expect(first.id).not.toBe(second.id);
  });

  it('debe permitir asignar source Galatea (fallback de IA, FR-004)', () => {
    const galateaMapper = new GeminiQuestionMapper(QuestionSource.Galatea);
    const raw = { text: 'Pregunta de Galatea', options: ['A', 'B', 'C', 'D'], correctOptionIndex: 0 };

    const result = galateaMapper.fromMap(raw);

    expect(result.source).toBe(QuestionSource.Galatea);
  });

  it.each([
    ['objeto no válido', 'no soy un objeto'],
    ['sin text', { options: ['A', 'B', 'C', 'D'], correctOptionIndex: 0 }],
    ['con menos de 4 opciones', { text: 'texto', options: ['A', 'B', 'C'], correctOptionIndex: 0 }],
    [
      'correctOptionIndex fuera de rango',
      { text: 'texto', options: ['A', 'B', 'C', 'D'], correctOptionIndex: 5 },
    ],
    [
      'correctOptionIndex no entero',
      { text: 'texto', options: ['A', 'B', 'C', 'D'], correctOptionIndex: 1.5 },
    ],
  ])('debe lanzar InvalidGeminiResponseError cuando el elemento es inválido: %s', (_desc, raw) => {
    expect(() => mapper.fromMap(raw)).toThrow(InvalidGeminiResponseError);
  });
});
