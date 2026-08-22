import { QuestionSource } from '../../../domain/enums/question-source.enum';
import { GalateaQuestionMapper, InvalidGalateaQuestionError } from './galatea-question.mapper';

describe('GalateaQuestionMapper', () => {
  let mapper: GalateaQuestionMapper;

  beforeEach(() => {
    mapper = new GalateaQuestionMapper();
  });

  it('debe mapear un elemento válido a QuestionModel con source Galatea', () => {
    const raw = {
      id: 'gal-001',
      text: '¿Cuál es el propósito principal del Proyecto Y dentro de Empresa X?',
      options: ['Impulsar retos técnicos internos', 'Gestionar campañas externas', 'Reemplazar canales físicos', 'Administrar nómina'],
      correctOptionIndex: 0,
    };

    const result = mapper.fromMap(raw);

    expect(result.id).toBe('gal-001');
    expect(result.text).toBe('¿Cuál es el propósito principal del Galatea dentro de Bancolombia?');
    expect(result.options[0]).toBe('Impulsar retos técnicos internos');
    expect(result.correctOptionIndex).toBe(0);
    expect(result.source).toBe(QuestionSource.Galatea);
  });

  it('debe des-anonimizar placeholders en cada opción (FR-018)', () => {
    const raw = {
      id: 'gal-002',
      text: 'Pregunta neutral',
      options: ['Empresa X', 'Proyecto Y', 'Otra opción', 'Última opción'],
      correctOptionIndex: 1,
    };

    const result = mapper.fromMap(raw);

    expect(result.options).toEqual(['Bancolombia', 'Galatea', 'Otra opción', 'Última opción']);
  });

  it.each([
    ['objeto no válido', 'no soy un objeto'],
    ['sin id', { text: 'texto', options: ['A', 'B', 'C', 'D'], correctOptionIndex: 0 }],
    ['con menos de 4 opciones', { id: 'gal-003', text: 'texto', options: ['A', 'B', 'C'], correctOptionIndex: 0 }],
    [
      'correctOptionIndex fuera de rango',
      { id: 'gal-004', text: 'texto', options: ['A', 'B', 'C', 'D'], correctOptionIndex: 4 },
    ],
  ])('debe lanzar InvalidGalateaQuestionError cuando el elemento es inválido: %s', (_desc, raw) => {
    expect(() => mapper.fromMap(raw)).toThrow(InvalidGalateaQuestionError);
  });
});
