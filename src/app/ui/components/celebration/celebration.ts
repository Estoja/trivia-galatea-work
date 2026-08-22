import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LevelModel } from '../../../domain/models/level/level.model';
import { LEVEL_CELEBRATION_CONFIG } from './level-celebration.config';

/**
 * Efectos de celebración de la pantalla de resultados (US4), configurados
 * declarativamente por nivel (`LEVEL_CELEBRATION_CONFIG`). La animación
 * decorativa (confetti/brillo) sólo se activa vía CSS cuando el usuario NO
 * ha solicitado `prefers-reduced-motion: reduce` (ver `celebration.scss`,
 * Principio VIII); el título y el `aria-label` son siempre estáticos y
 * accesibles, independientemente de la preferencia de movimiento.
 */
@Component({
  selector: 'tg-celebration',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './celebration.html',
  styleUrl: './celebration.scss',
})
export class Celebration {
  /** Nivel obtenido por el jugador, ya asignado por `AssignLevelUsecase`. */
  readonly level = input.required<LevelModel>();

  readonly config = computed(() => LEVEL_CELEBRATION_CONFIG[this.level().tier]);
  readonly hostClass = computed(() => `tg-celebration ${this.config().animationClass}`);
}
