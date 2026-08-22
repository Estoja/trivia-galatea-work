/**
 * Diccionario de sustitución de nombres de marca reales por placeholders neutrales
 * antes de enviar cualquier contexto a la IA (FR-018, FR-019).
 * El tema libre del jugador NUNCA pasa por este diccionario — solo el contexto
 * de conocimiento de Galatea usado en el flujo de fallback (FR-004).
 */
export const BRAND_PLACEHOLDER_MAP: ReadonlyArray<{ real: string; placeholder: string }> = [
  { real: 'Bancolombia', placeholder: 'Empresa X' },
  { real: 'Galatea', placeholder: 'Proyecto Y' },
];

/**
 * Error de negocio: la anonimización de contexto antes de invocar IA falló o
 * produjo un resultado incompleto. Comportamiento fail-closed obligatorio (FR-028):
 * ningún prompt se transmite al servicio externo si esto ocurre.
 */
export class AnonymizationFailedError extends Error {
  constructor(message = 'No fue posible anonimizar el contexto de forma segura antes de invocar IA.') {
    super(message);
    this.name = 'AnonymizationFailedError';
  }
}

/**
 * Sustituye nombres de marca reales por sus placeholders neutrales.
 * Fail-closed (FR-028): si tras la sustitución el texto resultante todavía
 * contiene alguno de los nombres reales originales, lanza `AnonymizationFailedError`
 * en vez de continuar — nunca se construye ni envía un prompt con datos sin anonimizar.
 *
 * Acepta un `map` opcional (por defecto `BRAND_PLACEHOLDER_MAP`) únicamente para
 * poder simular en pruebas un diccionario mal configurado que produzca una
 * sustitución incompleta.
 */
export function anonymizeContext(
  text: string,
  map: ReadonlyArray<{ real: string; placeholder: string }> = BRAND_PLACEHOLDER_MAP,
): string {
  const anonymized = map.reduce((acc, { real, placeholder }) => acc.split(real).join(placeholder), text);

  const stillContainsRealNames = map.some(({ real }) => anonymized.includes(real));
  if (stillContainsRealNames) {
    throw new AnonymizationFailedError();
  }

  return anonymized;
}

/**
 * Revierte los placeholders neutrales a los nombres de marca reales en la
 * respuesta de la IA, antes de exponerla al dominio (FR-018 §4).
 */
export function deanonymizeResponse(text: string): string {
  return BRAND_PLACEHOLDER_MAP.reduce((acc, { real, placeholder }) => acc.split(placeholder).join(real), text);
}
