import { PlayerModel } from '../player/player.model';
import { QuestionModel } from '../question/question.model';

export type CardState = 'face-down' | 'flipped' | 'answered';
export type AnswerResult = 'pending' | 'correct' | 'incorrect';

export interface CardModel {
  id: string;
  question: QuestionModel;
  state: CardState;
  result: AnswerResult;
  /** Índice de la opción que el jugador seleccionó, o null si aún no respondió */
  selectedOptionIndex: number | null;
}

export type MatchStatus = 'in-progress' | 'completed';

export interface MatchModel {
  player: PlayerModel;
  /** Las 12 tarjetas generadas al inicio; en fallback puede aumentar el cupo Galatea. */
  cards: CardModel[];
  /** Máximo de tarjetas que el jugador puede responder por partida */
  maxAnswerableCards: 6;
  status: MatchStatus;
  /** Aviso opcional para comunicar modos de fallback aplicados a la sesión actual. */
  generationNotice?: string | null;
}

export interface ScoreModel {
  /** Cantidad de preguntas Galatea respondidas correctamente (0–6) */
  galateaCorrectCount: number;
  /** Cantidad de preguntas del tema elegido respondidas correctamente (0–6) */
  topicCorrectCount: number;
  /** Puntos aportados por Galatea: (galateaCorrectCount × 10) × galateaCorrectCount */
  galateaPoints: number;
  /** Puntos aportados por el tema elegido: topicCorrectCount × 10 */
  topicPoints: number;
  /** galateaPoints + topicPoints — rango 0 a 360 */
  totalScore: number;
}
