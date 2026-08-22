import { ApplicationConfig, makeEnvironmentProviders, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AnswerCardUsecase } from './domain/models/match/usecase/answer-card.usecase';
import { BuildMatchUsecase } from './domain/models/match/usecase/build-match.usecase';
import { CalculateMatchScoreUsecase } from './domain/models/match/usecase/calculate-match-score.usecase';
import { QuestionGateway } from './domain/models/question/gateway/question.gateway';
import { QuestionMockService } from './infrastructure/question/question-mock.service';
import { provideFoundationalMatchStore } from './app.config';
import { routes } from './app.routes';

/**
 * Providers mock de US1: `QuestionMockService` (datos hardcodeados, sin red ni
 * IA) + `BuildMatchUsecase` real (el usecase de dominio no cambia entre modo
 * real/local, sólo su gateway).
 */
export const provideQuestionFeatureLocal = () =>
  makeEnvironmentProviders([
    { provide: QuestionGateway, useClass: QuestionMockService },
    BuildMatchUsecase,
    AnswerCardUsecase,
    CalculateMatchScoreUsecase,
  ]);

/**
 * Composition Root mock: permite `ng serve` sin conexión real a Firebase/Gemini.
 */
export const appConfigLocal: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideFoundationalMatchStore(),
    provideQuestionFeatureLocal(),
  ],
};
