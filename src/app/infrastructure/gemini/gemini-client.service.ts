import { Injectable, inject } from '@angular/core';
import { GenerativeModel, VertexAI, getGenerativeModel } from '@angular/fire/vertexai';
import { Observable, defer, from, retry, timeout, timer } from 'rxjs';
import { map } from 'rxjs/operators';

/** Timeout máximo por llamada a Gemini antes de cancelar (FR-024). */
export const GEMINI_TIMEOUT_MS = 30_000;
/** Reintentos automáticos tras timeout/fallo, con backoff corto (FR-024). */
export const GEMINI_MAX_RETRIES = 2;
export const GEMINI_RETRY_DELAYS_MS = [2_000, 4_000] as const;

const GEMINI_MODEL_NAME = 'gemini-2.5-flash';

/**
 * Cliente de infraestructura sobre Gemini vía Vertex AI for Firebase
 * (`@angular/fire/vertexai`). Responsable únicamente de la comunicación con el
 * modelo (timeout, cancelación, reintentos) — el parseo/validación del JSON
 * de respuesta es responsabilidad de los mappers de infraestructura.
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
   */
  generateJson(prompt: string): Observable<string> {
    return defer(() => from(this.getModel().generateContent(prompt))).pipe(
      map((result) => result.response.text()),
      timeout(GEMINI_TIMEOUT_MS),
      retry({
        count: GEMINI_MAX_RETRIES,
        delay: (_error, retryCount) => timer(GEMINI_RETRY_DELAYS_MS[retryCount - 1] ?? GEMINI_RETRY_DELAYS_MS.at(-1)),
      }),
    );
  }
}
