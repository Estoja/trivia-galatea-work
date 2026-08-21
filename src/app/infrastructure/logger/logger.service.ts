import { Injectable } from '@angular/core';

/**
 * Servicio de logging centralizado (Principio X — reemplaza `console.log` directo
 * en el resto de la aplicación para permitir sustitución/filtrado centralizado).
 */
@Injectable({ providedIn: 'root' })
export class LoggerService {
  debug(message: string, ...context: unknown[]): void {
    console.debug(`[trivia-galatea] ${message}`, ...context);
  }

  info(message: string, ...context: unknown[]): void {
    console.info(`[trivia-galatea] ${message}`, ...context);
  }

  warn(message: string, ...context: unknown[]): void {
    console.warn(`[trivia-galatea] ${message}`, ...context);
  }

  error(message: string, ...context: unknown[]): void {
    console.error(`[trivia-galatea] ${message}`, ...context);
  }
}
