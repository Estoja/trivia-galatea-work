import { TestBed } from '@angular/core/testing';
import { QuestionSource } from '../../../domain/enums/question-source.enum';
import { CardModel } from '../../../domain/models/match/match.model';
import { QuestionCard } from './question-card';

function buildCard(overrides: Partial<CardModel> = {}): CardModel {
  return {
    id: 'card-1',
    question: {
      id: 'q-1',
      text: 'Pregunta de prueba con suficiente longitud para pasar validaciones',
      options: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
      correctOptionIndex: 0,
      source: QuestionSource.Galatea,
    },
    state: 'face-down',
    result: 'pending',
    selectedOptionIndex: null,
    ...overrides,
  };
}

describe('QuestionCard', () => {
  function createComponent(card: CardModel, categoryLabel = 'Galatea') {
    const fixture = TestBed.createComponent(QuestionCard);
    fixture.componentRef.setInput('card', card);
    fixture.componentRef.setInput('position', 3);
    fixture.componentRef.setInput('categoryLabel', categoryLabel);
    fixture.detectChanges();
    return fixture;
  }

  it('muestra el aria-label con posición, categoría y estado boca abajo', () => {
    const fixture = createComponent(buildCard({ state: 'face-down' }));
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

    expect(button.getAttribute('aria-label')).toBe('Tarjeta 3, categoría Galatea, estado boca abajo');
    expect(button.disabled).toBe(false);
  });

  it('actualiza el aria-label a "volteada, en curso" cuando el estado es flipped', () => {
    const fixture = createComponent(buildCard({ state: 'flipped' }));
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

    expect(button.getAttribute('aria-label')).toContain('volteada, en curso');
  });

  it('escapa comillas y ángulos del tema libre (chosenTopic) al interpolarlo en el aria-label (FR-030)', () => {
    const fixture = createComponent(buildCard({ state: 'face-down' }), `<b>"Fútbol" & 'Cine'</b>`);
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

    expect(button.getAttribute('aria-label')).toBe(
      'Tarjeta 3, categoría &lt;b&gt;&quot;Fútbol&quot; & &#x27;Cine&#x27;&lt;/b&gt;, estado boca abajo',
    );
  });

  it('deshabilita el botón y refleja aria-disabled cuando la tarjeta ya fue respondida', () => {
    const fixture = createComponent(buildCard({ state: 'answered', result: 'correct' }));
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.getAttribute('aria-label')).toContain('respondida, correcta');
  });

  it('emite "opened" con el id de la tarjeta al hacer clic si no está respondida', () => {
    const fixture = createComponent(buildCard({ id: 'card-42', state: 'face-down' }));
    const emitted: string[] = [];
    fixture.componentInstance.opened.subscribe((id) => emitted.push(id));

    fixture.nativeElement.querySelector('button').click();

    expect(emitted).toEqual(['card-42']);
  });

  it('no emite "opened" al hacer clic sobre una tarjeta ya respondida', () => {
    const fixture = createComponent(buildCard({ state: 'answered', result: 'incorrect' }));
    const emitted: string[] = [];
    fixture.componentInstance.opened.subscribe((id) => emitted.push(id));

    fixture.nativeElement.querySelector('button').click();

    expect(emitted).toEqual([]);
  });
});
