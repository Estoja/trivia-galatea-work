import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { QuestionGateway } from '../../question/gateway/question.gateway';
import { QuestionModel } from '../../question/question.model';
import { PlayerModel } from '../../player/player.model';
import { CardModel, MatchModel } from '../match.model';

const GALATEA_QUESTION_COUNT = 6;
const TOPIC_QUESTION_COUNT = 6;
const TOTAL_CARDS = GALATEA_QUESTION_COUNT + TOPIC_QUESTION_COUNT;

export const GALATEA_ONLY_NOTICE =
  'Te tocó dificultad máxima: en esta partida jugarás solo con preguntas de Galatea.';

/**
 * Error de negocio: la IA (o el banco Galatea + fallback IA) no logró
 * completar la cantidad requerida de preguntas válidas para iniciar la partida (FR-003, FR-004).
 */
export class InsufficientQuestionsError extends Error {
  constructor(message = 'No se pudieron generar suficientes preguntas para iniciar la partida.') {
    super(message);
    this.name = 'InsufficientQuestionsError';
  }
}

function buildFaceDownCards(questions: readonly QuestionModel[]): CardModel[] {
  return questions.map((question, index) => ({
    id: `card-${index}-${question.id}`,
    question,
    state: 'face-down' as const,
    result: 'pending' as const,
    selectedOptionIndex: null,
  }));
}

function shuffle<T>(items: readonly T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

@Injectable()
export class BuildMatchUsecase {
  constructor(private readonly questionGateway: QuestionGateway) {}

  build(player: PlayerModel): Observable<MatchModel> {
    return this.questionGateway.getChosenTopicQuestions(player.chosenTopic, TOPIC_QUESTION_COUNT).pipe(
      map((questions) => ({ questions: questions.slice(0, TOPIC_QUESTION_COUNT), geminiFailed: false })),
      catchError(() => of({ questions: [] as QuestionModel[], geminiFailed: true })),
      switchMap(({ questions: chosenTopicQuestions, geminiFailed }) => {
        if (geminiFailed) {
          return this.questionGateway.getGalateaQuestions(TOTAL_CARDS).pipe(
            map((galateaQuestions) => this.buildMatchOrThrow(player, galateaQuestions, [], GALATEA_ONLY_NOTICE, TOTAL_CARDS)),
          );
        }

        const requiredGalateaCount = TOTAL_CARDS - chosenTopicQuestions.length;
        return this.questionGateway.getGalateaQuestions(requiredGalateaCount).pipe(
          map((galateaQuestions) => this.buildMatchOrThrow(player, galateaQuestions, chosenTopicQuestions, null, requiredGalateaCount)),
        );
      }),
    );
  }

  private buildMatchOrThrow(
    player: PlayerModel,
    galateaQuestions: readonly QuestionModel[],
    chosenTopicQuestions: readonly QuestionModel[],
    generationNotice: string | null,
    requiredGalateaCount: number,
  ): MatchModel {
    if (galateaQuestions.length < requiredGalateaCount) {
      throw new InsufficientQuestionsError();
    }

    const cards = shuffle(buildFaceDownCards([...galateaQuestions, ...chosenTopicQuestions]));
    if (cards.length < TOTAL_CARDS) {
      throw new InsufficientQuestionsError();
    }

    return {
      player,
      cards,
      maxAnswerableCards: 6,
      status: 'in-progress',
      generationNotice,
    };
  }
}
