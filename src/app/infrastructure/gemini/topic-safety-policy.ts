/**
 * Política de validación de contenido del tema libre elegido por el jugador
 * (FR-020). Se ejecuta en el cliente, ANTES de invocar IA, para:
 *  - Rechazar temas vacíos o compuestos únicamente por espacios.
 *  - Rechazar temas que contengan términos ofensivos/no aptos conocidos,
 *    con un mensaje accionable que invite a reformular.
 *
 * Nota de alcance: esta es una validación heurística basada en una lista de
 * términos bloqueados: es una primera línea de defensa en cliente, no reemplaza
 * eventuales políticas de seguridad de contenido del propio modelo de IA.
 */

export type TopicSafetyResult = { ok: true } | { ok: false; reason: 'empty' | 'offensive'; message: string };

const BLOCKED_TERMS: readonly string[] = [
  'mierda',
  'puta',
  'puto',
  'idiota',
  'estúpido',
  'estupido',
  'imbécil',
  'imbecil',
  'maldito',
  'maldita',
  'nazi',
  'terrorista',
  'fuck',
  'shit',
  'bitch',
  'asshole',
];

function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Valida el tema libre ingresado por el jugador. Debe invocarse sobre el
 * texto YA normalizado (trim + colapso de espacios internos) según FR-002.
 */
export function validateTopicSafety(topic: string): TopicSafetyResult {
  if (topic.trim().length === 0) {
    return {
      ok: false,
      reason: 'empty',
      message: 'Escribe un tema para poder generar tus preguntas.',
    };
  }

  const normalized = normalizeForComparison(topic);
  const containsBlockedTerm = BLOCKED_TERMS.some((term) => normalized.includes(normalizeForComparison(term)));

  if (containsBlockedTerm) {
    return {
      ok: false,
      reason: 'offensive',
      message: 'Ese tema no es apto para el juego. Por favor, escribe otro tema e inténtalo de nuevo.',
    };
  }

  return { ok: true };
}
