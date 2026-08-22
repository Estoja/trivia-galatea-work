import { TestBed } from '@angular/core/testing';
import { ScoreBoard } from './score-board';

describe('ScoreBoard', () => {
  function createComponent(score: number) {
    const fixture = TestBed.createComponent(ScoreBoard);
    fixture.componentRef.setInput('score', score);
    fixture.detectChanges();
    return fixture;
  }

  it('muestra el puntaje recibido', () => {
    const fixture = createComponent(70);

    expect(fixture.nativeElement.textContent).toContain('70');
  });

  it('anuncia el puntaje mediante aria-live="polite" (FR-011)', () => {
    const fixture = createComponent(0);
    const element: HTMLElement = fixture.nativeElement.querySelector('[aria-live]');

    expect(element.getAttribute('aria-live')).toBe('polite');
  });

  it('actualiza el texto cuando el puntaje cambia', () => {
    const fixture = createComponent(0);
    fixture.componentRef.setInput('score', 360);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('360');
  });
});
