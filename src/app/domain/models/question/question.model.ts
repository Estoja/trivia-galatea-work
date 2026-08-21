import { QuestionSource } from '../../enums/question-source.enum';

export interface QuestionModel {
  id: string;
  /** Enunciado de la pregunta */
  text: string;
  /** Exactamente 4 opciones de respuesta (FR-005) */
  options: [string, string, string, string];
  /** Índice 0-based de la opción correcta dentro de `options` */
  correctOptionIndex: number;
  /** Origen de la pregunta: Galatea o el tema elegido por el jugador */
  source: QuestionSource;
}
