import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, input, output, signal, viewChild } from '@angular/core';
import { QuestionModel } from '../../../domain/models/question/question.model';

export type QuestionModalFeedback = 'correct' | 'incorrect' | null;

/**
 * Modal accesible que muestra la pregunta y sus opciones de una tarjeta volteada (US2).
 * Implementa foco atrapado dentro del panel mientras está abierto y retorna el foco
 * al elemento que lo abrió (la tarjeta) al cerrarse.
 *
 * Nota (FR-030/T091): la interpolación de `question().text`/`options` no requiere
 * `AriaEscapePipe` porque son bindings de texto/atributo estándar de Angular (ya
 * sanitizados por el motor de plantillas); `AriaEscapePipe` queda para T091 cuando
 * se interpole el alias del jugador en atributos `aria-*` de este componente.
 */
@Component({
  selector: 'tg-question-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './question-modal.html',
  styleUrl: './question-modal.scss',
  host: {
    '(keydown)': 'onKeyDown($event)',
  },
})
export class QuestionModal {
  readonly isOpen = input.required<boolean>();
  readonly question = input.required<QuestionModel>();
  readonly feedback = input<QuestionModalFeedback>(null);

  /** Emite el índice de la opción seleccionada al confirmar con "Aceptar". */
  readonly confirmed = output<number>();

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private previouslyFocusedElement: HTMLElement | null = null;

  readonly selectedOptionIndex = signal<number | null>(null);
  readonly canConfirm = computed(() => this.selectedOptionIndex() !== null && this.feedback() === null);

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.previouslyFocusedElement = document.activeElement as HTMLElement | null;
        this.selectedOptionIndex.set(null);
        Promise.resolve().then(() => this.focusFirstElement());
      } else {
        this.previouslyFocusedElement?.focus();
        this.previouslyFocusedElement = null;
      }
    });
  }

  selectOption(index: number): void {
    if (this.feedback() !== null) {
      return;
    }
    this.selectedOptionIndex.set(index);
  }

  confirm(): void {
    const index = this.selectedOptionIndex();
    if (index === null || this.feedback() !== null) {
      return;
    }
    this.confirmed.emit(index);
  }

  onKeyDown(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key !== 'Tab' || !this.isOpen()) {
      return;
    }

    const focusable = this.getFocusableElements();
    if (focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (keyboardEvent.shiftKey && active === first) {
      keyboardEvent.preventDefault();
      last.focus();
    } else if (!keyboardEvent.shiftKey && active === last) {
      keyboardEvent.preventDefault();
      first.focus();
    }
  }

  private focusFirstElement(): void {
    this.getFocusableElements()[0]?.focus();
  }

  private getFocusableElements(): HTMLElement[] {
    const root = this.panel()?.nativeElement;
    if (!root) {
      return [];
    }
    return Array.from(root.querySelectorAll<HTMLElement>('button:not([disabled])'));
  }
}
