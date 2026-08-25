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
          map((generated) => this.deduplicateByText([...selected, ...generated])),
        );
      }),
    );
  }

  getChosenTopicQuestions(topic: string, count: number): Observable<QuestionModel[]> {
    const prompt = buildChosenTopicPrompt(topic, count);
    return this.geminiClient.generateJson(prompt).pipe(
      map((raw) => this.parseAndMapGeminiResponse(raw, this.chosenTopicMapper)),
      map((questions) => {
        if (questions.length < count) {
          throw new InsufficientGeneratedQuestionsError();
        }
        return questions.slice(0, count);
      }),
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
    const prompt = buildGalateaFallbackPrompt(count, anonymizedContext);

    return this.geminiClient.generateJson(prompt).pipe(
      map((raw) => this.parseAndMapGeminiResponse(raw, this.galateaFallbackMapper)),
    );
  }

  private parseAndMapGeminiResponse(raw: string, mapper: GeminiQuestionMapper): QuestionModel[] {
    let parsed: GeminiQuestionsResponse;
    try {
      parsed = JSON.parse(raw) as GeminiQuestionsResponse;
    } catch {
      return [];
    }

    if (!parsed || !Array.isArray(parsed.questions)) {
      return [];
    }

    return parsed.questions.reduce<QuestionModel[]>((acc, item) => {
      try {
        acc.push(mapper.fromMap(item));
      } catch {
        // Elemento inválido de la respuesta de Gemini: no cuenta como pregunta válida.
      }
      return acc;
    }, []);
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
