import { ApplicationConfig, makeEnvironmentProviders, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideStrokeConfig } from '@bancolombia/caribe-design-system/stroke';
import { FirebaseApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { ReCaptchaV3Provider, initializeAppCheck, provideAppCheck } from '@angular/fire/app-check';
import { VertexAIBackend, getAI, provideVertexAI } from '@angular/fire/vertexai';
import { environment } from '../environments/environment';
import { AnswerCardUsecase } from './domain/models/match/usecase/answer-card.usecase';
import { BuildMatchUsecase } from './domain/models/match/usecase/build-match.usecase';
import { CalculateMatchScoreUsecase } from './domain/models/match/usecase/calculate-match-score.usecase';
import { AssignLevelUsecase } from './domain/models/level/usecase/assign-level.usecase';
import { QuestionGateway } from './domain/models/question/gateway/question.gateway';
import { QuestionService } from './infrastructure/question/question.service';
import { MatchStoreService } from './shared/foundational/state/match-store.service';
import { routes } from './app.routes';

const recaptchaV3SiteKey = environment.appCheck?.recaptchaV3SiteKey?.trim() ?? '';

export const provideFoundationalMatchStore = () =>
  makeEnvironmentProviders([{ provide: MatchStoreService, useClass: MatchStoreService }]);

/**
 * Providers de los casos de uso/gateways reales de US1: banco de preguntas +
 * IA (Vertex AI/Gemini) y el usecase que ensambla la partida.
 */
export const provideQuestionFeature = () =>
  makeEnvironmentProviders([
    provideHttpClient(),
    { provide: QuestionGateway, useClass: QuestionService },
    BuildMatchUsecase,
    AnswerCardUsecase,
    CalculateMatchScoreUsecase,
    AssignLevelUsecase,
  ]);

/**
 * Composition Root real: inicializa Firebase App, App Check (FR-026, ReCaptchaV3
 * en producción / token de depuración en local vía la lógica interna de AngularFire)
 * y Vertex AI (Gemini). Registra los providers reales de casos de uso de US1
 * (QuestionService + BuildMatchUsecase).
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideStrokeConfig({ path: 'https://library-sdb.apps.bancolombia.com/assets/1.19.0' }),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    ...(recaptchaV3SiteKey
      ? [
          provideAppCheck((injector) => {
            const app = injector.get(FirebaseApp);
            return initializeAppCheck(app, {
              provider: new ReCaptchaV3Provider(recaptchaV3SiteKey),
              isTokenAutoRefreshEnabled: true,
            });
          }),
        ]
      : []),
    provideVertexAI((injector) => {
      const app = injector.get(FirebaseApp);
      return getAI(app, { backend: new VertexAIBackend() });
    }),
    provideFoundationalMatchStore(),
    provideQuestionFeature(),
  ],
};
