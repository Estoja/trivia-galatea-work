import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFoundationalMatchStore } from './app.config';
import { routes } from './app.routes';

/**
 * Composition Root mock: permite `ng serve` sin conexión real a Firebase/Gemini.
 * Los providers de casos de uso mockeados (QuestionMockService, etc.) se agregan
 * en fases posteriores por historia de usuario.
 */
export const appConfigLocal: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideRouter(routes), provideFoundationalMatchStore()],
};
