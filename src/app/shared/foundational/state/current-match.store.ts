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
 */
@Injectable({ providedIn: 'root' })
export class CurrentMatchStore {
  private readonly _match = signal<MatchModel | null>(null);

  readonly match: Signal<MatchModel | null> = this._match.asReadonly();

  setMatch(match: MatchModel): void {
    this._match.set(match);
  }

  clear(): void {
    this._match.set(null);
  }
}
