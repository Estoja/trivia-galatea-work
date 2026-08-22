import { CalculateMatchScoreUsecase } from './calculate-match-score.usecase';

describe('CalculateMatchScoreUsecase', () => {
  let usecase: CalculateMatchScoreUsecase;

  beforeEach(() => {
    usecase = new CalculateMatchScoreUsecase();
  });

  it('Escenario 1: 2 aciertos Galatea + 3 aciertos tema = (2×10)×2 + 3×10 = 70', () => {
    const score = usecase.calculate(2, 3);

    expect(score).toEqual({
      galateaCorrectCount: 2,
      topicCorrectCount: 3,
      galateaPoints: 40,
      topicPoints: 30,
      totalScore: 70,
    });
  });

  it('Escenario 2: 6 aciertos Galatea (máximo) = (6×10)×6 = 360 puntos (puntaje máximo)', () => {
    const score = usecase.calculate(6, 0);

    expect(score.galateaPoints).toBe(360);
    expect(score.topicPoints).toBe(0);
    expect(score.totalScore).toBe(360);
  });

  it('Escenario 3: 0 aciertos = 0 puntos', () => {
    const score = usecase.calculate(0, 0);

    expect(score.totalScore).toBe(0);
  });

  it('Escenario 4: 0 aciertos Galatea + 6 aciertos tema = 0 + 60 = 60 puntos', () => {
    const score = usecase.calculate(0, 6);

    expect(score.galateaPoints).toBe(0);
    expect(score.topicPoints).toBe(60);
    expect(score.totalScore).toBe(60);
  });

  it('calcula correctamente combinaciones intermedias (3 Galatea + 3 tema = 90 + 30 = 120)', () => {
    const score = usecase.calculate(3, 3);

    expect(score.totalScore).toBe(120);
  });

  it('calcula correctamente un único acierto por categoría (1 Galatea + 0 tema = 10)', () => {
    const score = usecase.calculate(1, 0);

    expect(score.totalScore).toBe(10);
  });

  it('calcula correctamente un único acierto de tema (0 Galatea + 1 tema = 10)', () => {
    const score = usecase.calculate(0, 1);

    expect(score.totalScore).toBe(10);
  });

  it('calcula correctamente combinaciones válidas dentro del máximo de 6 respuestas por partida (5 Galatea + 1 tema)', () => {
    const score = usecase.calculate(5, 1);

    // (5×10)×5 + 1×10 = 250 + 10 = 260
    expect(score.totalScore).toBe(260);
  });
});
