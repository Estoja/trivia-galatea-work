import { ApplicationConfig, makeEnvironmentProviders, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { FirebaseApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { ReCaptchaV3Provider, initializeAppCheck, provideAppCheck } from '@angular/fire/app-check';
import { VertexAIBackend, getAI, provideVertexAI } from '@angular/fire/vertexai';
import { environment } from '../environments/environment';
import { MatchStoreService } from './shared/foundational/state/match-store.service';
import { routes } from './app.routes';

export const provideFoundationalMatchStore = () =>
  makeEnvironmentProviders([{ provide: MatchStoreService, useClass: MatchStoreService }]);

/**
 * Composition Root real: inicializa Firebase App, App Check (FR-026, ReCaptchaV3
 * en producción / token de depuración en local vía la lógica interna de AngularFire)
 * y Vertex AI (Gemini). Los providers de casos de uso (BuildMatchUsecase,
 * QuestionService, etc.) se registran en fases posteriores por historia de usuario.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAppCheck((injector) => {
      const app = injector.get(FirebaseApp);
      return initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(environment.appCheck.recaptchaV3SiteKey),
        isTokenAutoRefreshEnabled: true,
      });
    }),
    provideVertexAI((injector) => {
      const app = injector.get(FirebaseApp);
      return getAI(app, { backend: new VertexAIBackend() });
    }),
    provideFoundationalMatchStore(),
  ],
};
