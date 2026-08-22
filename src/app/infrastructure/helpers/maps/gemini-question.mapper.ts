import { Mapper } from './common/mapper';
import { QuestionSource } from '../../../domain/enums/question-source.enum';
import { QuestionModel } from '../../../domain/models/question/question.model';
import { deanonymizeResponse } from '../../gemini/gemini-topic-anonymizer';

/**
 * Error de negocio: un elemento de la respuesta JSON de Gemini no cumple el
 * esquema esperado (contracts/gemini-prompt-contract.md §4) — se trata como
 * pregunta inválida (se descarta / cuenta como fallo, según el llamador).
 */
export class InvalidGeminiResponseError extends Error {
  constructor(message = 'La respuesta de Gemini no cumple el esquema esperado.') {
    super(message);
    this.name = 'InvalidGeminiResponseError';
  }
}

interface RawGeminiQuestion {
  text?: unknown;
  options?: unknown;
  correctOptionIndex?: unknown;
}

interface ValidRawGeminiQuestion {
  text: string;
  options: string[];
  correctOptionIndex: number;
}

function isValidRawQuestion(raw: unknown): raw is ValidRawGeminiQuestion {
  if (typeof raw !== 'object' || raw === null) {
    return false;
  }
  const candidate = raw as RawGeminiQuestion;
  return (
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
 * Traduce un elemento crudo (JSON ya parseado) de una respuesta de Gemini
 * (tema elegido, FR-003, o fallback de Galatea, FR-004) a un único `QuestionModel`.
 * Valida el esquema exacto de contracts/gemini-prompt-contract.md §4; si no se
 * cumple, lanza `InvalidGeminiResponseError` — el llamador decide cómo tratar
 * preguntas inválidas.
 *
 * `source` se recibe por constructor porque Gemini se usa tanto para generar
 * preguntas del tema elegido (`chosen-topic`) como preguntas de Galatea de
 * respaldo (`galatea`) cuando el banco JSON curado no alcanza — ambos casos
 * comparten el mismo esquema de respuesta crudo (sin `id`).
 */
export class GeminiQuestionMapper extends Mapper<QuestionModel> {
  private idCounter = 0;

  constructor(private readonly source: QuestionSource = QuestionSource.ChosenTopic) {
    super();
  }

  fromMap(obj: unknown): QuestionModel {
    if (!isValidRawQuestion(obj)) {
      throw new InvalidGeminiResponseError();
    }

    this.idCounter += 1;

    return {
      id: `${this.source}-ai-${this.idCounter}`,
      text: deanonymizeResponse(obj.text),
      options: obj.options.map((option) => deanonymizeResponse(option)) as [string, string, string, string],
      correctOptionIndex: obj.correctOptionIndex,
      source: this.source,
    };
  }
}
