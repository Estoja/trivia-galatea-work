import { ApplicationConfig } from '@angular/core';
import { appConfig } from './app.config';

export const appConfigLocal: ApplicationConfig = {
  providers: [...(appConfig.providers ?? [])],
};
