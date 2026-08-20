import { ApplicationConfig, makeEnvironmentProviders } from '@angular/core';
import { MatchStoreService } from './shared/foundational/state/match-store.service';

export const provideFoundationalMatchStore = () =>
  makeEnvironmentProviders([{ provide: MatchStoreService, useClass: MatchStoreService }]);

export const appConfig: ApplicationConfig = {
  providers: [provideFoundationalMatchStore()],
};
