import {
  AnonymizationFailedError,
  BRAND_PLACEHOLDER_MAP,
  anonymizeContext,
  deanonymizeResponse,
} from './gemini-topic-anonymizer';

describe('gemini-topic-anonymizer', () => {
  describe('anonymizeContext', () => {
    it('debe sustituir Bancolombia por Empresa X y Galatea por Proyecto Y', () => {
      const result = anonymizeContext('Bancolombia impulsa Galatea como ecosistema de innovación.');

      expect(result).toBe('Empresa X impulsa Proyecto Y como ecosistema de innovación.');
      expect(result).not.toContain('Bancolombia');
      expect(result).not.toContain('Galatea');
    });

    it('debe dejar intacto un texto que no menciona marcas', () => {
      expect(anonymizeContext('Preguntas generales sin marcas.')).toBe('Preguntas generales sin marcas.');
    });

    it('fail-closed: debe lanzar AnonymizationFailedError sin llamar a Gemini si la sustitución queda incompleta (FR-028)', () => {
      const misconfiguredMap = [{ real: 'Bancolombia', placeholder: 'Bancolombia' }];

      expect(() => anonymizeContext('Bancolombia es una empresa.', misconfiguredMap)).toThrow(
        AnonymizationFailedError,
      );
    });
  });

  describe('deanonymizeResponse', () => {
    it('debe revertir los placeholders a los nombres reales', () => {
      const result = deanonymizeResponse('Empresa X impulsa Proyecto Y.');

      expect(result).toBe('Bancolombia impulsa Galatea.');
    });
  });

  it('BRAND_PLACEHOLDER_MAP debe contener exactamente los pares documentados en el contrato', () => {
    expect(BRAND_PLACEHOLDER_MAP).toEqual([
      { real: 'Bancolombia', placeholder: 'Empresa X' },
      { real: 'Galatea', placeholder: 'Proyecto Y' },
    ]);
  });
});
