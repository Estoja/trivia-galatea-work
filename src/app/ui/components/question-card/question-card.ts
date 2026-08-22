import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { QuestionSource } from '../../../domain/enums/question-source.enum';
import { AnswerResult, CardModel } from '../../../domain/models/match/match.model';
import { AriaEscapePipe } from '../../../shared/pipes/aria-escape.pipe';

/**
 * Tarjeta individual del tablero (US2). Botón nativo que representa una
 * pregunta boca abajo/volteada/respondida, con `aria-label` descriptivo y
 * color de fondo diferenciado por categoría (Galatea vs tema elegido, FR-006).
 */
@Component({
  selector: 'tg-question-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './question-card.html',
  styleUrl: './question-card.scss',
})
export class QuestionCard {
  private readonly ariaEscape = new AriaEscapePipe();

  /** Tarjeta de dominio a representar (contiene la pregunta y su estado). */
  readonly card = input.required<CardModel>();
  /** Posición 1-based de la tarjeta dentro del tablero (para el `aria-label`). */
  readonly position = input.required<number>();
  /** Etiqueta de categoría visible: "Galatea" o el tema libre elegido por el jugador. */
  readonly categoryLabel = input.required<string>();

  /** Emite el id de la tarjeta cuando el jugador la selecciona (solo si no está respondida). */
  readonly opened = output<string>();

  readonly isGalatea = computed(() => this.card().question.source === QuestionSource.Galatea);
  readonly isAnswered = computed(() => this.card().state === 'answered');

  readonly stateLabel = computed(() => {
    const card = this.card();
    if (card.state === 'answered') {
      return this.resultLabel(card.result);
    }
    return card.state === 'flipped' ? 'volteada, en curso' : 'boca abajo';
  });

  readonly ariaLabel = computed(
    () =>
      // `categoryLabel` puede contener el tema libre elegido por el jugador (texto sin
      // restricción de caracteres, solo longitud), por eso se escapa antes de
      // interpolarlo en el `aria-label` (FR-030).
      `Tarjeta ${this.position()}, categoría ${this.ariaEscape.transform(this.categoryLabel())}, estado ${this.stateLabel()}`,
  );

  handleClick(): void {
    if (this.isAnswered()) {
      return;
    }
    this.opened.emit(this.card().id);
  }

  private resultLabel(result: AnswerResult): string {
    if (result === 'correct') {
      return 'respondida, correcta';
    }
    if (result === 'incorrect') {
      return 'respondida, incorrecta';
    }
    return 'respondida';
  }
}
