import { LevelTier } from '../level.model';
import { AssignLevelUsecase } from './assign-level.usecase';

describe('AssignLevelUsecase', () => {
  let usecase: AssignLevelUsecase;

  beforeEach(() => {
    usecase = new AssignLevelUsecase();
  });

  it('asigna Visitante en el límite inferior (0)', () => {
    expect(usecase.assign(0).tier).toBe(LevelTier.Visitante);
  });

  it('asigna Visitante en su límite superior (59) y Explorador justo en 60', () => {
    expect(usecase.assign(59).tier).toBe(LevelTier.Visitante);
    expect(usecase.assign(60).tier).toBe(LevelTier.Explorador);
  });

  it('asigna Explorador en su límite superior (99) y Aprendiz justo en 100', () => {
    expect(usecase.assign(99).tier).toBe(LevelTier.Explorador);
    expect(usecase.assign(100).tier).toBe(LevelTier.Aprendiz);
  });

  it('asigna Aprendiz en su límite superior (129) y Constructor justo en 130', () => {
    expect(usecase.assign(129).tier).toBe(LevelTier.Aprendiz);
    expect(usecase.assign(130).tier).toBe(LevelTier.Constructor);
  });

  it('asigna Constructor en su límite superior (179) y Estratega justo en 180', () => {
    expect(usecase.assign(179).tier).toBe(LevelTier.Constructor);
    expect(usecase.assign(180).tier).toBe(LevelTier.Estratega);
  });

  it('asigna Estratega en su límite superior (239) y Maestro Galatea justo en 240', () => {
    expect(usecase.assign(239).tier).toBe(LevelTier.Estratega);
    expect(usecase.assign(240).tier).toBe(LevelTier.MaestroGalatea);
  });

  it('asigna Maestro Galatea en su límite superior (359) y Unicornio Galatea justo en 360', () => {
    expect(usecase.assign(359).tier).toBe(LevelTier.MaestroGalatea);

    const unicornio = usecase.assign(360);
    expect(unicornio.tier).toBe(LevelTier.UnicornioGalatea);
    expect(unicornio.title).toBe('Unicornio Galatea 🦄');
  });

  it('retorna el objeto LevelModel completo con minScore/maxScore/title correctos', () => {
    expect(usecase.assign(70)).toEqual({
      tier: LevelTier.Explorador,
      title: 'Explorador',
      minScore: 60,
      maxScore: 99,
    });
  });

  it('usa el nivel máximo como fallback defensivo para puntajes fuera de rango por encima de 360', () => {
    expect(usecase.assign(500).tier).toBe(LevelTier.UnicornioGalatea);
  });

  it('usa el nivel mínimo como fallback defensivo para puntajes negativos', () => {
    expect(usecase.assign(-10).tier).toBe(LevelTier.Visitante);
  });
});
