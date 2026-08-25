import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Muestra el puntaje parcial de la partida en curso, actualizado en tiempo
 * real (FR-011). Usa `aria-live="polite"` para anunciar los cambios de
 * puntaje a lectores de pantalla sin interrumpir al usuario.
 */
@Component({
  selector: 'tg-score-board',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './score-board.html',
  styleUrl: './score-board.scss',
})
export class ScoreBoard {
  readonly score = input.required<number>();
}
