import { Observable } from 'rxjs';
import { QuestionModel } from '../question.model';

export abstract class QuestionGateway {
  /**
   * Obtiene `count` preguntas sobre Galatea.
   * Prioridad de fuente (FR-004): banco JSON curado → fallback a IA si faltan.
   * Nunca lanza si hay al menos 1 pregunta disponible entre ambas fuentes;
   * el usecase consumidor decide si `count` insuficiente es un error de negocio.
   */
  abstract getGalateaQuestions(count: number): Observable<QuestionModel[]>;

  /**
   * Genera `count` preguntas sobre el tema libre del jugador vía IA (FR-003).
   * Emite error si Gemini no puede generar `count` preguntas válidas
   * (ver contracts/gemini-prompt-contract.md §5 para el árbol de manejo de errores).
   */
  abstract getChosenTopicQuestions(topic: string, count: number): Observable<QuestionModel[]>;
}
