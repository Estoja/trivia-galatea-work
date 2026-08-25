import { validateTopicSafety } from './topic-safety-policy';

describe('validateTopicSafety (FR-020)', () => {
  it('debe rechazar un tema vacío', () => {
    const result = validateTopicSafety('');

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toBe('empty');
  });

  it('debe rechazar un tema compuesto solo por espacios', () => {
    const result = validateTopicSafety('     ');

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toBe('empty');
  });

  it('debe aceptar un tema válido y neutral', () => {
    expect(validateTopicSafety('Fútbol colombiano')).toEqual({ ok: true });
  });

  it('debe rechazar un tema con un término ofensivo conocido, con mensaje accionable', () => {
    const result = validateTopicSafety('Eres un idiota');

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toBe('offensive');
    expect(result.ok === false && result.message).toMatch(/reformula|otro tema|no es apto/i);
  });

  it('debe detectar términos ofensivos sin distinguir mayúsculas/acentos', () => {
    const result = validateTopicSafety('Qué ESTÚPIDO comentario');

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toBe('offensive');
  });

  it('debe bloquear términos sensibles explícitos reportados (sexo, kamasutra, nopor, porno)', () => {
    const blockedTopics = ['sexo', 'kamasutra', 'kamazutra', 'nopor', 'porno'];

    for (const topic of blockedTopics) {
      const result = validateTopicSafety(topic);
      expect(result.ok).toBe(false);
      expect(result.ok === false && result.reason).toBe('offensive');
    }
  });

  it('debe permitir "computación" (regresión de falso positivo por subcadena)', () => {
    expect(validateTopicSafety('computación')).toEqual({ ok: true });
  });

  it('debe evitar falsos positivos por subcadenas dentro de palabras neutras', () => {
    expect(validateTopicSafety('diputados colombianos')).toEqual({ ok: true });
    expect(validateTopicSafety('computador cuántico')).toEqual({ ok: true });
  });

  it('debe detectar variantes leetspeak básicas de términos sensibles', () => {
    const result = validateTopicSafety('s3x0');

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toBe('offensive');
  });
});
