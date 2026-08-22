import { TestBed } from '@angular/core/testing';
import { LevelModel, LevelTier } from '../../../domain/models/level/level.model';
import { Celebration } from './celebration';

const TITLES: Record<LevelTier, string> = {
  [LevelTier.Visitante]: 'Visitante',
  [LevelTier.Explorador]: 'Explorador',
  [LevelTier.Aprendiz]: 'Aprendiz',
  [LevelTier.Constructor]: 'Constructor',
  [LevelTier.Estratega]: 'Estratega',
  [LevelTier.MaestroGalatea]: 'Maestro Galatea',
  [LevelTier.UnicornioGalatea]: 'Unicornio Galatea 🦄',
};

function buildLevel(tier: LevelTier): LevelModel {
  return { tier, title: TITLES[tier], minScore: 0, maxScore: 0 };
}

describe('Celebration', () => {
  function createComponent(tier: LevelTier) {
    const fixture = TestBed.createComponent(Celebration);
    fixture.componentRef.setInput('level', buildLevel(tier));
    fixture.detectChanges();
    return fixture;
  }

  it('muestra el título del nivel recibido', () => {
    const fixture = createComponent(LevelTier.Explorador);

    expect(fixture.nativeElement.textContent).toContain('Explorador');
  });

  it('no muestra emoji para el nivel Visitante (celebración sobria, sin confetti)', () => {
    const fixture = createComponent(LevelTier.Visitante);

    expect(fixture.nativeElement.querySelector('.tg-celebration__emoji')).toBeNull();
  });

  it('muestra el emoji 🦄 y la clase de animación máxima para Unicornio Galatea', () => {
    const fixture = createComponent(LevelTier.UnicornioGalatea);
    const emoji = fixture.nativeElement.querySelector('.tg-celebration__emoji');

    expect(emoji?.textContent).toContain('🦄');
    expect(fixture.nativeElement.querySelector('.tg-celebration--unicornio')).not.toBeNull();
  });

  it('expone un aria-label estático con el nombre del nivel, accesible aunque el usuario prefiera reducir el movimiento', () => {
    const fixture = createComponent(LevelTier.MaestroGalatea);
    const container: HTMLElement = fixture.nativeElement.querySelector('.tg-celebration');

    expect(container.getAttribute('aria-label')).toBe('Nivel Maestro Galatea');
  });

  it('asigna una combinación de clase de animación distinta para cada uno de los 7 niveles (SC-006)', () => {
    const tiers = Object.values(LevelTier);
    const classNames = tiers.map((tier) => {
      const fixture = createComponent(tier);
      const container: HTMLElement = fixture.nativeElement.querySelector('.tg-celebration');
      return container.className;
    });

    expect(new Set(classNames).size).toBe(tiers.length);
  });
});
