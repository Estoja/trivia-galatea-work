import { Injectable, Signal, signal } from '@angular/core';
import { MatchModel } from '../../../domain/models/match/match.model';

/**
 * Store fundacional que retiene el `MatchModel` completo (incluyendo el
 * contenido de cada pregunta) generado por `BuildMatchUsecase` para la
 * partida en curso.
 *
 * Complementa a `MatchStorePort`/`MatchStoreService`: ese contrato pre-existente
 * (feature-002) sólo expone `CardState` (id/category/state/isCorrect), sin el
 * texto/opciones de la pregunta — insuficiente para que el tablero (US1/US2)
 * pueda renderizar el contenido real de cada tarjeta. Este store SÍ vive en
 * `shared/foundational/state` (no modifica los archivos protegidos
 * `match-store.port.ts`/`match-store.service.ts`).
 *
 * También retiene `isOffline` (FR-025): bandera de conectividad actualizada
 * por los listeners nativos `online`/`offline` registrados en `App` (app.ts),
 * y leída por `board.page.ts` para mostrar un aviso no bloqueante cuando el
 * tablero ya está activo y se pierde la conexión.
 */
@Injectable({ providedIn: 'root' })
export class CurrentMatchStore {
  private readonly _match = signal<MatchModel | null>(null);
  private readonly _isOffline = signal(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  readonly match: Signal<MatchModel | null> = this._match.asReadonly();
  readonly isOffline: Signal<boolean> = this._isOffline.asReadonly();

  setMatch(match: MatchModel): void {
    this._match.set(match);
  }

  setOffline(isOffline: boolean): void {
    this._isOffline.set(isOffline);
  }

  clear(): void {
    this._match.set(null);
  }
}
