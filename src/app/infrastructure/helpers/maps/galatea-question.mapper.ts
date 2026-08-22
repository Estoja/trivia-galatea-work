import { Mapper } from './common/mapper';
import { QuestionSource } from '../../../domain/enums/question-source.enum';
import { QuestionModel } from '../../../domain/models/question/question.model';
import { deanonymizeResponse } from '../../gemini/gemini-topic-anonymizer';

/**
 * Error de negocio: un elemento del banco JSON de preguntas de Galatea no
 * cumple el esquema `contracts/galatea-question-bank.schema.json`.
 */
export class InvalidGalateaQuestionError extends Error {
  constructor(message = 'La pregunta del banco de Galatea no cumple el esquema esperado.') {
    super(message);
    this.name = 'InvalidGalateaQuestionError';
  }
}

interface RawGalateaQuestion {
  id?: unknown;
  text?: unknown;
  options?: unknown;
  correctOptionIndex?: unknown;
}

interface ValidRawGalateaQuestion {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
}

function isValidRawQuestion(raw: unknown): raw is ValidRawGalateaQuestion {
  if (typeof raw !== 'object' || raw === null) {
    return false;
  }
  const candidate = raw as RawGalateaQuestion;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.text === 'string' &&
    Array.isArray(candidate.options) &&
    candidate.options.length === 4 &&
    candidate.options.every((option) => typeof option === 'string') &&
    typeof candidate.correctOptionIndex === 'number' &&
    Number.isInteger(candidate.correctOptionIndex) &&
    candidate.correctOptionIndex >= 0 &&
    candidate.correctOptionIndex <= 3
  );
}

/**
 * Traduce un elemento crudo del banco JSON curado de preguntas de Galatea
 * (ya anonimizado con "Empresa X"/"Proyecto Y") a un `QuestionModel`,
 * resolviendo los placeholders a los nombres reales antes de llegar al
 * dominio (FR-018 §4). `source` siempre es `QuestionSource.Galatea`.
 */
export class GalateaQuestionMapper extends Mapper<QuestionModel> {
  fromMap(obj: unknown): QuestionModel {
    if (!isValidRawQuestion(obj)) {
      throw new InvalidGalateaQuestionError();
    }

    return {
      id: obj.id,
      text: deanonymizeResponse(obj.text),
      options: obj.options.map((option) => deanonymizeResponse(option)) as [string, string, string, string],
      correctOptionIndex: obj.correctOptionIndex,
      source: QuestionSource.Galatea,
    };
  }
}
