import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { QuestionSource } from '../../domain/enums/question-source.enum';
import { QuestionGateway } from '../../domain/models/question/gateway/question.gateway';
import { QuestionModel } from '../../domain/models/question/question.model';

function buildMockQuestions(count: number, source: QuestionSource, prefix: string): QuestionModel[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-mock-${i}`,
    text: `Pregunta de ejemplo #${i + 1} (${prefix})`,
    options: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
    correctOptionIndex: i % 4,
    source,
  }));
}

/**
 * Implementación mock de `QuestionGateway`: datos hardcodeados, sin llamadas a
 * red ni a IA. Usada en `app.config.local.ts` para permitir `ng serve` sin
 * conexión real a Firebase/Gemini.
 */
@Injectable()
export class QuestionMockService extends QuestionGateway {
  getGalateaQuestions(count: number): Observable<QuestionModel[]> {
    return of(buildMockQuestions(count, QuestionSource.Galatea, 'galatea'));
  }

  getChosenTopicQuestions(_topic: string, count: number): Observable<QuestionModel[]> {
    return of(buildMockQuestions(count, QuestionSource.ChosenTopic, 'chosen-topic'));
  }
}
