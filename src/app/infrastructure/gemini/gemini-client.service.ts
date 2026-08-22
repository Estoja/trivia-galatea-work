import { Injectable, inject } from '@angular/core';
import { GenerativeModel, VertexAI, getGenerativeModel } from '@angular/fire/vertexai';
import { Observable, defer, from, retry, throwError, timeout, timer } from 'rxjs';
import { map } from 'rxjs/operators';

/** Timeout máximo por llamada a Gemini antes de cancelar (FR-024). */
export const GEMINI_TIMEOUT_MS = 30_000;
/** Reintentos automáticos tras timeout/fallo, con backoff corto (FR-024). */
export const GEMINI_MAX_RETRIES = 2;
export const GEMINI_RETRY_DELAYS_MS = [2_000, 4_000] as const;
/** Máximo de solicitudes de IA permitidas por sesión de navegador (FR-032). */
export const GEMINI_MAX_REQUESTS_PER_SESSION = 3;

const GEMINI_MODEL_NAME = 'gemini-2.5-flash';
const SESSION_REQUEST_COUNT_KEY = 'tg-gemini-request-count';

/**
 * Error de negocio: se alcanzó el límite de solicitudes de IA permitidas para
 * la sesión de navegador actual (FR-032). El llamador debe mostrar un mensaje
 * de agotamiento sugiriendo refrescar la página para iniciar una nueva sesión.
 */
export class GeminiRequestLimitExceededError extends Error {
  constructor(
    message = 'Has alcanzado el límite de solicitudes de IA para esta sesión. Refresca la página para intentar de nuevo.',
  ) {
    super(message);
    this.name = 'GeminiRequestLimitExceededError';
  }
}

/**
 * Cliente de infraestructura sobre Gemini vía Vertex AI for Firebase
 * (`@angular/fire/vertexai`). Responsable únicamente de la comunicación con el
 * modelo (timeout, cancelación, reintentos, límite de solicitudes por sesión)
 * — el parseo/validación del JSON de respuesta es responsabilidad de los
 * mappers de infraestructura.
 */
@Injectable({ providedIn: 'root' })
export class GeminiClientService {
  private readonly vertexAI = inject(VertexAI);
  private model: GenerativeModel | null = null;

  private getModel(): GenerativeModel {
    this.model ??= getGenerativeModel(this.vertexAI, {
      model: GEMINI_MODEL_NAME,
      generationConfig: { responseMimeType: 'application/json' },
    });
    return this.model;
  }

  /**
   * Envía `prompt` a Gemini y retorna el texto crudo de la respuesta (JSON como string).
   * Aplica timeout de 30s (FR-024) y hasta 2 reintentos automáticos con backoff
   * corto (2s, 4s) antes de propagar el error al usecase consumidor.
   *
   * Antes de invocar al modelo, verifica el límite de 3 solicitudes por sesión
   * de navegador (FR-032, `sessionStorage`); si ya se alcanzó, retorna
   * `GeminiRequestLimitExceededError` sin realizar ninguna llamada de red.
   * Cada invocación de este método (independientemente de sus reintentos
   * internos) cuenta como UNA solicitud.
   */
  generateJson(prompt: string): Observable<string> {
    if (this.hasReachedSessionRequestLimit()) {
      return throwError(() => new GeminiRequestLimitExceededError());
    }

    this.incrementSessionRequestCount();

    return defer(() => from(this.getModel().generateContent(prompt))).pipe(
      map((result) => result.response.text()),
      timeout(GEMINI_TIMEOUT_MS),
      retry({
        count: GEMINI_MAX_RETRIES,
        delay: (_error, retryCount) => timer(GEMINI_RETRY_DELAYS_MS[retryCount - 1] ?? GEMINI_RETRY_DELAYS_MS.at(-1)),
      }),
    );
  }

  private getSessionRequestCount(): number {
    const raw = sessionStorage.getItem(SESSION_REQUEST_COUNT_KEY);
    const parsed = raw === null ? 0 : Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }

  private hasReachedSessionRequestLimit(): boolean {
    return this.getSessionRequestCount() >= GEMINI_MAX_REQUESTS_PER_SESSION;
  }

  private incrementSessionRequestCount(): void {
    sessionStorage.setItem(SESSION_REQUEST_COUNT_KEY, String(this.getSessionRequestCount() + 1));
  }
}
