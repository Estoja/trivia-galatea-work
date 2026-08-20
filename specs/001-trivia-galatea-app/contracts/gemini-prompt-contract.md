# Contrato: Prompt hacia Gemini (anonimizado)

**Feature**: [../spec.md](../spec.md) | **Data Model**: [../data-model.md](../data-model.md)

Este documento es la fuente de verdad de **cómo el frontend debe entregarle contenido a Gemini** y **cómo debe interpretar la respuesta**. Es el contrato que implementa `infrastructure/gemini/gemini-client.service.ts` + `infrastructure/gemini/gemini-topic-anonymizer.ts`.

---

## 1. Reglas de anonimización (obligatorias — FR-018)

Antes de enviar cualquier prompt a la API de Gemini:

1. El **tema libre del jugador** (`chosenTopic`) se envía **tal cual lo escribió el jugador**, sin modificaciones ni mención de la empresa. No requiere anonimización porque no contiene datos internos.
2. Si el prompt necesita dar contexto sobre Galatea/Bancolombia (sólo en el flujo de fallback de preguntas Galatea generadas por IA, ver FR-004), **todo nombre de marca se sustituye** usando el diccionario:

```typescript
export const BRAND_PLACEHOLDER_MAP: ReadonlyArray<{ real: string; placeholder: string }> = [
  { real: 'Bancolombia', placeholder: 'Empresa X' },
  { real: 'Galatea', placeholder: 'Proyecto Y' },
];
```

3. **Nunca** se incluye en el prompt: el alias del jugador, IPs, timestamps de sesión, ni ningún identificador personal (A-010).
4. La respuesta de Gemini se **de-anonimiza** (placeholder → nombre real) en el mapper de infraestructura antes de construir el `QuestionModel`. El dominio jamás ve un placeholder.

---

## 2. Prompt template — Preguntas del tema elegido (`chosen-topic`)

```text
Genera exactamente {count} preguntas de trivia de selección múltiple sobre el tema: "{chosenTopic}".

Reglas estrictas:
- Cada pregunta debe tener exactamente 4 opciones de respuesta.
- Solo una opción es correcta.
- Dificultad equilibrada: ni trivial ni oscura para el público general.
- Responde ÚNICAMENTE con JSON válido, sin texto adicional, siguiendo este esquema exacto:

{
  "questions": [
    {
      "text": "string",
      "options": ["string", "string", "string", "string"],
      "correctOptionIndex": 0
    }
  ]
}
```

- `{count}` = 6 (FR-003).
- `{chosenTopic}` = string ingresado por el jugador, sin transformar.

---

## 3. Prompt template — Preguntas de Galatea vía IA (fallback, FR-004)

Sólo se usa si el banco JSON curado tiene menos de 6 preguntas disponibles.

```text
Genera exactamente {count} preguntas de trivia de selección múltiple sobre "Proyecto Y",
un ecosistema de innovación interna de "Empresa X". Usa el siguiente contexto para
formular las preguntas:

{contextoAnonimizadoDeBaseConocimiento}

Reglas estrictas:
- Cada pregunta debe tener exactamente 4 opciones de respuesta.
- Solo una opción es correcta.
- No inventes datos que no estén en el contexto proporcionado.
- Responde ÚNICAMENTE con JSON válido, sin texto adicional, siguiendo este esquema exacto:

{
  "questions": [
    {
      "text": "string",
      "options": ["string", "string", "string", "string"],
      "correctOptionIndex": 0
    }
  ]
}
```

- `{contextoAnonimizadoDeBaseConocimiento}` proviene de la base de conocimiento de Galatea (A-005), ya anonimizada con el mismo `BRAND_PLACEHOLDER_MAP` antes de incluirla en el prompt.
- La respuesta contendrá "Proyecto Y" / "Empresa X" en el texto de las preguntas — el mapper los traduce de vuelta a "Galatea" / "Bancolombia" antes de exponerlos al dominio.

---

## 4. Esquema de respuesta esperado (Gemini → infraestructura)

```json
{
  "questions": [
    {
      "text": "¿Cuál de estas es una característica del Proyecto Y?",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correctOptionIndex": 2
    }
  ]
}
```

**Validación en infraestructura antes de mapear** (`GeminiQuestionMapper`):
- `questions` es un array con exactamente `count` elementos. Si tiene menos, se activa el comportamiento de FR-003 (mensaje amigable + retorno a selección de tema).
- Cada pregunta tiene `options.length === 4`.
- `correctOptionIndex` está en el rango `[0, 3]`.
- Si el JSON de Gemini no es parseable o no cumple el esquema, se trata como fallo de generación (mismo tratamiento que "menos de 6 preguntas").

---

## 5. Manejo de errores (FR-003, FR-005 edge cases)

| Escenario | Comportamiento |
|---|---|
| Gemini responde con menos de `count` preguntas válidas | Mensaje amigable + regreso a pantalla de selección de tema, conservando el alias (Clarifications Q4) |
| Gemini no responde en tiempo razonable (timeout sugerido: 15s) | Mismo tratamiento que arriba |
| Gemini responde JSON malformado | Mismo tratamiento que arriba (se trata como 0 preguntas válidas) |
| Banco Galatea JSON con < 6 preguntas Y fallback de IA también falla | Mensaje de error indicando que el juego no está disponible temporalmente (caso extremo, no bloquea el tema elegido) |

---

## 6. Dónde vive la API key de Gemini

- Variable de entorno local (`.env` no versionado) inyectada en `environment.development.ts` en tiempo de build.
- **Nunca** se hardcodea la key en el código fuente ni se versiona en Git (Principio X, OWASP A02 — Cryptographic/secrets exposure).
- Al ser un evento presencial sin backend, la key vive en el bundle del cliente: se asume una key de uso restringido/cuota limitada, rotada después de cada evento.
