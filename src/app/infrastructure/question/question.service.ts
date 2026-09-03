import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, of, switchMap } from 'rxjs';
import { QuestionSource } from '../../domain/enums/question-source.enum';
import { QuestionGateway } from '../../domain/models/question/gateway/question.gateway';
import { QuestionModel } from '../../domain/models/question/question.model';
import { GeminiClientService } from '../gemini/gemini-client.service';
import { anonymizeContext } from '../gemini/gemini-topic-anonymizer';
import { GalateaQuestionMapper } from '../helpers/maps/galatea-question.mapper';
import { GeminiQuestionMapper } from '../helpers/maps/gemini-question.mapper';

const GALATEA_BANK_URL = 'assets/galatea-questions.json';

/**
 * Contexto de conocimiento de Galatea usado como respaldo cuando el banco JSON
 * curado no alcanza a cubrir los slots requeridos (FR-004, A-005). Ya anonimizado
 * con los mismos placeholders que usa el resto del flujo de IA.
 */
const GALATEA_KNOWLEDGE_BASE_CONTEXT =
  'Proyecto Y es un ecosistema de innovación interna de Empresa X, enfocado en retos ' +
  'técnicos de desarrollo dinámico, aprendizaje continuo entre equipos de tecnología ' +
  'y mejora de la calidad de las soluciones que construyen.';

interface GalateaQuestionBank {
  version: number;
  questions: unknown[];
}

interface GeminiQuestionsResponse {
  questions?: unknown[];
}

/** Error de negocio: Gemini no generó `count` preguntas válidas (FR-003/FR-004). */
export class InsufficientGeneratedQuestionsError extends Error {
  constructor(message = 'La IA no generó suficientes preguntas válidas.') {
    super(message);
    this.name = 'InsufficientGeneratedQuestionsError';
  }
}

const OPTIONS_PER_QUESTION = 4;
const GENERATION_BUFFER = 2;

function shuffle<T>(items: readonly T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function buildChosenTopicPrompt(topic: string, count: number): string {
  return `Genera exactamente ${count} preguntas de trivia de selección múltiple sobre el tema: "${topic}".

Reglas estrictas:
- Cada pregunta debe tener exactamente 4 opciones de respuesta.
- Solo una opción es correcta.
- Dificultad equilibrada: ni trivial ni oscura para el público general.
- El enunciado debe tener entre 30 y 180 caracteres, y cada opción entre 10 y 100 caracteres.
- Responde ÚNICAMENTE con JSON válido, sin texto adicional, siguiendo este esquema exacto:

{
  "questions": [
    {
      "text": "string",
      "options": ["string", "string", "string", "string"],
      "correctOptionIndex": 0
    }
  ]
}`;
}

function buildGalateaFallbackPrompt(count: number, anonymizedContext: string): string {
  return `Genera exactamente ${count} preguntas de trivia de selección múltiple sobre "Proyecto Y",
un ecosistema de innovación interna de "Empresa X". Usa el siguiente contexto para
formular las preguntas:

${anonymizedContext}

Reglas estrictas:
- Cada pregunta debe tener exactamente 4 opciones de respuesta.
- Solo una opción es correcta.
- No inventes datos que no estén en el contexto proporcionado.
- El enunciado debe tener entre 30 y 180 caracteres, y cada opción entre 10 y 100 caracteres.
- Responde ÚNICAMENTE con JSON válido, sin texto adicional, siguiendo este esquema exacto:

{
  "questions": [
    {
      "text": "string",
      "options": ["string", "string", "string", "string"],
      "correctOptionIndex": 0
    }
  ]
}`;
}

/**
 * Implementación real de `QuestionGateway`: banco JSON curado + fallback/generación
 * vía Gemini (Vertex AI for Firebase). Ver contracts/internal-gateways.md e
 * contracts/gemini-prompt-contract.md para las reglas exactas.
 */
@Injectable()
export class QuestionService extends QuestionGateway {
  private readonly http = inject(HttpClient);
  private readonly geminiClient = inject(GeminiClientService);
  private readonly galateaBankMapper = new GalateaQuestionMapper();
  private readonly chosenTopicMapper = new GeminiQuestionMapper(QuestionSource.ChosenTopic);
  private readonly galateaFallbackMapper = new GeminiQuestionMapper(QuestionSource.Galatea);

  getGalateaQuestions(count: number): Observable<QuestionModel[]> {
    return this.http.get<GalateaQuestionBank>(GALATEA_BANK_URL).pipe(
      map((bank) => this.mapValidBankQuestions(bank?.questions ?? [])),
      map((mapped) => this.selectRandom(mapped, count)),
      switchMap((selected) => {
        if (selected.length >= count) {
          return of(selected);
        }
        const missing = count - selected.length;
        return this.generateGalateaFallback(missing).pipe(
          map((generated) => {
            const merged = this.deduplicateByText([...selected, ...generated]);
            if (merged.length < count) {
              throw new InsufficientGeneratedQuestionsError();
            }
            return merged;
          }),
        );
      }),
    );
  }

  getChosenTopicQuestions(topic: string, count: number): Observable<QuestionModel[]> {
    const prompt = buildChosenTopicPrompt(topic, count + GENERATION_BUFFER);
    return this.geminiClient.generateJson(prompt).pipe(
      map((raw) => this.parseAndMapGeminiResponse(raw, this.chosenTopicMapper)),
      map((questions) => this.debiasCorrectOptionIndexDistribution(questions.slice(0, count))),
    );
  }

  private mapValidBankQuestions(rawQuestions: readonly unknown[]): QuestionModel[] {
    return rawQuestions.reduce<QuestionModel[]>((acc, raw) => {
      try {
        acc.push(this.galateaBankMapper.fromMap(raw));
      } catch {
        // Elemento inválido del banco: se descarta silenciosamente, no bloquea el resto.
      }
      return acc;
    }, []);
  }

  private selectRandom(questions: readonly QuestionModel[], count: number): QuestionModel[] {
    return shuffle(questions).slice(0, count);
  }

  private generateGalateaFallback(count: number): Observable<QuestionModel[]> {
    const anonymizedContext = anonymizeContext(GALATEA_KNOWLEDGE_BASE_CONTEXT);
    const prompt = buildGalateaFallbackPrompt(count + GENERATION_BUFFER, anonymizedContext);

    return this.geminiClient.generateJson(prompt).pipe(
      map((raw) => this.parseAndMapGeminiResponse(raw, this.galateaFallbackMapper)),
      map((questions) => this.debiasCorrectOptionIndexDistribution(questions)),
    );
  }

  /**
   * Corrige el sesgo de posición de la respuesta correcta en un lote de
   * preguntas generadas por IA (FR-033): si un índice de opción (0..3)
   * concentra más de la mitad de las respuestas correctas del lote, reordena
   * las opciones (preservando el texto de la respuesta correcta) hasta
   * distribuir los índices de forma más equilibrada. NO se aplica al banco
   * curado manual de Galatea (contenido humano ya revisado).
   */
  private debiasCorrectOptionIndexDistribution(questions: readonly QuestionModel[]): QuestionModel[] {
    if (questions.length === 0) {
      return [];
    }

    const balanced = questions.map((question) => ({ ...question, options: [...question.options] as [string, string, string, string] }));
    const maxAllowedPerIndex = Math.max(1, Math.floor(balanced.length / 2));
    const countByIndex = new Array(OPTIONS_PER_QUESTION).fill(0);
    for (const question of balanced) {
      countByIndex[question.correctOptionIndex] += 1;
    }

    for (const question of balanced) {
      let guard = 0;
      while (countByIndex[question.correctOptionIndex] > maxAllowedPerIndex && guard < OPTIONS_PER_QUESTION) {
        const targetIndex = countByIndex.reduce(
          (leastIndex, value, index) => (value < countByIndex[leastIndex] ? index : leastIndex),
          0,
        );
        if (targetIndex === question.correctOptionIndex) {
          break;
        }

        const previousIndex = question.correctOptionIndex;
        [question.options[previousIndex], question.options[targetIndex]] = [
          question.options[targetIndex],
          question.options[previousIndex],
        ];
        question.correctOptionIndex = targetIndex;
        countByIndex[previousIndex] -= 1;
        countByIndex[targetIndex] += 1;
        guard += 1;
      }
    }

    return balanced;
  }

  private parseAndMapGeminiResponse(raw: string, mapper: GeminiQuestionMapper): QuestionModel[] {
    const rawQuestions = this.extractGeminiQuestions(raw);
    if (rawQuestions.length === 0) {
      return [];
    }

    return rawQuestions.reduce<QuestionModel[]>((acc, item) => {
      try {
        acc.push(mapper.fromMap(item));
      } catch {
        // Elemento inválido de la respuesta de Gemini: no cuenta como pregunta válida.
      }
      return acc;
    }, []);
  }

  private extractGeminiQuestions(raw: string): unknown[] {
    const candidates = this.buildJsonCandidates(raw);

    for (const candidate of candidates) {
      const parsed = this.tryParseJson(candidate);
      if (parsed === null) {
        continue;
      }

      const questions = this.questionsFromParsedPayload(parsed);
      if (questions.length > 0) {
        return questions;
      }
    }

    return [];
  }

  private buildJsonCandidates(raw: string): string[] {
    const trimmed = raw.trim();
    const withoutFence = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const extracted = this.extractLikelyJson(withoutFence);

    const candidates = [raw, trimmed, withoutFence, extracted ?? ''];
    return Array.from(new Set(candidates.filter((candidate) => candidate.length > 0)));
  }

  private extractLikelyJson(value: string): string | null {
    const startCurly = value.indexOf('{');
    const startBracket = value.indexOf('[');
    const starts = [startCurly, startBracket].filter((index) => index >= 0);
    if (starts.length === 0) {
      return null;
    }

    const start = Math.min(...starts);
    const endCurly = value.lastIndexOf('}');
    const endBracket = value.lastIndexOf(']');
    const end = Math.max(endCurly, endBracket);

    if (end <= start) {
      return null;
    }

    return value.slice(start, end + 1).trim();
  }

  private tryParseJson(value: string): unknown | null {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }

  private questionsFromParsedPayload(parsed: unknown): unknown[] {
    if (Array.isArray(parsed)) {
      return parsed;
    }

    if (typeof parsed === 'string') {
      const nestedQuestions = this.extractGeminiQuestions(parsed);
      return nestedQuestions;
    }

    if (typeof parsed !== 'object' || parsed === null) {
      return [];
    }

    const payload = parsed as GeminiQuestionsResponse;
    if (Array.isArray(payload.questions)) {
      return payload.questions;
    }

    return [];
  }

  /** Deduplicación por texto de pregunta dentro de la misma partida (FR-021). */
  private deduplicateByText(questions: readonly QuestionModel[]): QuestionModel[] {
    const seen = new Set<string>();
    return questions.filter((question) => {
      if (seen.has(question.text)) {
        return false;
      }
      seen.add(question.text);
      return true;
    });
  }
}
