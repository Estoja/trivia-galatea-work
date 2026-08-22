import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { QuestionSource } from '../../../domain/enums/question-source.enum';
import { QuestionModel } from '../../../domain/models/question/question.model';
import { QuestionModal } from './question-modal';

const question: QuestionModel = {
  id: 'q-1',
  text: '¿Cuál es la capital de Colombia?',
  options: ['Medellín', 'Bogotá', 'Cali', 'Barranquilla'],
  correctOptionIndex: 1,
  source: QuestionSource.Galatea,
};

@Component({
  selector: 'tg-host',
  template: `
    <button #trigger type="button">Abrir</button>
    <tg-question-modal [isOpen]="isOpen()" [question]="question" [feedback]="feedback()" (confirmed)="onConfirmed($event)" />
  `,
  imports: [QuestionModal],
})
class HostComponent {
  readonly isOpen = signal(false);
  readonly feedback = signal<'correct' | 'incorrect' | null>(null);
  readonly question = question;
  confirmedIndex: number | null = null;

  onConfirmed(index: number): void {
    this.confirmedIndex = index;
  }
}

describe('QuestionModal', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function openModal(): void {
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).focus();
    host.isOpen.set(true);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
  }

  it('mantiene "Aceptar" deshabilitado hasta que se selecciona una opción', fakeAsync(() => {
    openModal();
    const confirmButton = fixture.nativeElement.querySelector('.tg-question-modal__confirm') as HTMLButtonElement;

    expect(confirmButton.disabled).toBe(true);

    const options = fixture.nativeElement.querySelectorAll('.tg-question-modal__option');
    (options[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(confirmButton.disabled).toBe(false);
  }));

  it('emite "confirmed" con el índice seleccionado al hacer clic en Aceptar', fakeAsync(() => {
    openModal();
    const options = fixture.nativeElement.querySelectorAll('.tg-question-modal__option');
    (options[2] as HTMLButtonElement).click();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.tg-question-modal__confirm') as HTMLButtonElement).click();

    expect(host.confirmedIndex).toBe(2);
  }));

  it('atrapa el foco: Tab en el último elemento vuelve al primero', fakeAsync(() => {
    openModal();
    const focusable: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.tg-question-modal__panel button:not([disabled])'),
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    last.focus();
    const modalHost = fixture.nativeElement.querySelector('tg-question-modal');
    modalHost.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    fixture.detectChanges();

    expect(document.activeElement).toBe(first);
  }));

  it('atrapa el foco: Shift+Tab en el primer elemento vuelve al último', fakeAsync(() => {
    openModal();
    const focusable: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.tg-question-modal__panel button:not([disabled])'),
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    first.focus();
    const modalHost = fixture.nativeElement.querySelector('tg-question-modal');
    modalHost.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
    fixture.detectChanges();

    expect(document.activeElement).toBe(last);
  }));

  it('retorna el foco al elemento disparador al cerrarse', fakeAsync(() => {
    const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    openModal();

    host.isOpen.set(false);
    fixture.detectChanges();
    tick();

    expect(document.activeElement).toBe(trigger);
  }));
});
