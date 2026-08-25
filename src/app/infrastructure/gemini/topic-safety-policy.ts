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
  'sexo',
  'kamasutra',
  'kamazutra',
  'nopor',
  'porno',
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

const LEETSPEAK_MAP: Readonly<Record<string, string>> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
};

function normalizeLeetspeak(text: string): string {
  return text.replace(/[013457]/g, (char) => LEETSPEAK_MAP[char] ?? char);
}

function normalizeForComparison(text: string): string {
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  return normalizeLeetspeak(normalized).replace(/\s+/g, ' ').trim();
}

function tokenize(text: string): string[] {
  return text.split(/[^a-z0-9]+/).filter((token) => token.length > 0);
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
  const tokens = new Set(tokenize(normalized));
  const containsBlockedTerm = BLOCKED_TERMS.some((term) => tokens.has(normalizeForComparison(term)));

  if (containsBlockedTerm) {
    return {
      ok: false,
      reason: 'offensive',
      message: 'Ese tema no es apto para el juego. Por favor, escribe otro tema e inténtalo de nuevo.',
    };
  }

  return { ok: true };
}
