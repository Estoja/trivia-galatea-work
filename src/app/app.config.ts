import { ApplicationConfig, makeEnvironmentProviders, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { MatchStoreService } from './shared/foundational/state/match-store.service';
import { routes } from './app.routes';

export const provideFoundationalMatchStore = () =>
  makeEnvironmentProviders([{ provide: MatchStoreService, useClass: MatchStoreService }]);

export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideRouter(routes), provideFoundationalMatchStore()],
};
