---
applyTo: "src/app/{domain,infrastructure}/**/*.ts"
---

# Trivia Galatea — Dominio de Negocio

> Describe el "QUÉ" y el "POR QUÉ" del proyecto. No menciona tecnologías, endpoints ni frameworks.

---

## 🎯 Propósito

Trivia Galatea es un juego de preguntas y respuestas diseñado para eventos y retos internos. Permite que cualquier participante compita respondiendo preguntas sobre el ecosistema Galatea y sobre un tema de su elección, obteniendo un premio según su desempeño.

---

## 👥 Participante

Un **participante** es quien juega la trivia. Antes de empezar debe:
1. Ingresar su **nombre**.
2. Elegir un **tema libre**: cualquier área de conocimiento de su interés (ej: Harry Potter, fútbol, historia, música, ciencia).

El tema libre es texto libre — no hay lista predefinida.

---

## ❓ Preguntas

Existen dos tipos de preguntas, identificadas por su **origen** (`QuestionSource`):

### `galatea` — Preguntas sobre el ecosistema Galatea
- Contenido: conceptos, arquitectura, componentes, historia y cultura del proyecto Galatea de Bancolombia.
- Origen de los datos: una **fuente interna** (documentación, FAQs, base de conocimiento).
- La infraestructura consulta esta fuente; el dominio solo recibe `Question[]`.

### `free-topic` — Preguntas sobre el tema libre del participante
- Contenido: cualquier tópico elegido (Harry Potter, fútbol, Star Wars, geografía, etc.).
- Origen: generadas completamente por una **IA generativa** en tiempo real.
- La IA puede generar preguntas sobre cualquier tema popular o de cultura general.
- El dominio no sabe cómo se generaron — solo recibe `Question[]`.

### Estructura de una pregunta
Cada pregunta tiene:
- Un **enunciado** claro y sin ambigüedades.
- Exactamente **4 opciones** de respuesta (A, B, C, D).
- Una sola **respuesta correcta**.
- Una dificultad equilibrada — ni trivial ni oscura.

---

## 🎮 Ronda de Juego (Quiz)

Una **ronda** es la sesión completa de juego de un participante. Se compone de:

- **Preguntas de Galatea**: configurables, por defecto **4 preguntas**.
- **Preguntas del tema libre**: configurables, por defecto **4 preguntas**.
- **Total**: 8 preguntas por ronda (modificable según el evento).

### Reglas de la ronda
1. Las preguntas se **mezclan aleatoriamente** antes de mostrarse. El participante no distingue cuáles son de Galatea y cuáles del tema libre.
2. Las preguntas se presentan **de una en una**, sin posibilidad de volver atrás.
3. Cada pregunta tiene **una sola oportunidad** de respuesta.
4. No hay límite de tiempo por pregunta (a menos que el evento lo requiera).

---

## 🏆 Puntuación

La **puntuación** se calcula al finalizar la ronda:

```
porcentaje = (preguntas correctas / total de preguntas) × 100
```

- Cada pregunta correcta vale lo mismo, independientemente del origen (`galatea` o `free-topic`).
- No hay puntos negativos por respuesta incorrecta.

---

## 🎁 Premios

Los **premios** se asignan por rango de porcentaje. El catálogo de premios es configurable para cada evento. Ejemplo orientativo:

| Rango de aciertos | Premio |
|---|---|
| 80% – 100% | Premio A (mejor categoría) |
| 50% – 79% | Premio B |
| 0% – 49% | Premio C (participación) |

Reglas:
- Todo participante recibe al menos el premio de participación.
- El catálogo de premios lo provee la infraestructura (`PrizeGateway`) — el dominio solo aplica la lógica de rango.

---

## 🚫 Lo que el dominio NO sabe (responsabilidad de la infraestructura)

| Concepto | Quién lo resuelve |
|---|---|
| Cómo obtener preguntas de Galatea (endpoint, archivo, DB) | `infrastructure/question/` |
| Qué IA genera las preguntas del tema libre (Gemini, OpenAI, etc.) | `infrastructure/question/` |
| Cómo se formatean las respuestas de la IA para encajar en `Question` | `infrastructure/question/` |
| Dónde se almacenan los premios | `infrastructure/prize/` |
| Autenticación con servicios externos | `infrastructure/` |

---

## ✅ Invariantes del dominio

- Un `Quiz` siempre tiene al menos 1 pregunta de cada origen.
- Un `Answer` siempre referencia un `questionId` válido dentro del `Quiz` activo.
- El `Score` solo se calcula cuando el `Quiz` está completamente respondido.
- El número de preguntas de Galatea y del tema libre debe ser igual (ronda equilibrada).
