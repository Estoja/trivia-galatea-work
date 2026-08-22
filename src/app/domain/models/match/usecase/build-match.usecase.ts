import { Injectable } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { QuestionGateway } from '../../question/gateway/question.gateway';
import { QuestionModel } from '../../question/question.model';
import { PlayerModel } from '../../player/player.model';
import { CardModel, MatchModel } from '../match.model';

const GALATEA_QUESTION_COUNT = 6;
const TOPIC_QUESTION_COUNT = 6;

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
    return forkJoin({
      galateaQuestions: this.questionGateway.getGalateaQuestions(GALATEA_QUESTION_COUNT),
      chosenTopicQuestions: this.questionGateway.getChosenTopicQuestions(player.chosenTopic, TOPIC_QUESTION_COUNT),
    }).pipe(
      map(({ galateaQuestions, chosenTopicQuestions }) => {
        if (galateaQuestions.length < GALATEA_QUESTION_COUNT || chosenTopicQuestions.length < TOPIC_QUESTION_COUNT) {
          throw new InsufficientQuestionsError();
        }

        const cards = shuffle(buildFaceDownCards([...galateaQuestions, ...chosenTopicQuestions]));

        const match: MatchModel = {
          player,
          cards,
          maxAnswerableCards: 6,
          status: 'in-progress',
        };

        return match;
      }),
    );
  }
}
