# Research: Trivia Galatea — Juego de Preguntas con IA

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

Este documento resuelve las decisiones técnicas necesarias antes del diseño (Fase 1). No quedan `NEEDS CLARIFICATION` pendientes en el Technical Context del plan.

---

## 1. Anonimización del prompt hacia Gemini

**Decision**: Se usa un **diccionario de anonimización bidireccional** (`BRAND_PLACEHOLDER_MAP`) en la capa de infraestructura. Antes de construir el prompt de preguntas de Galatea (o cualquier contexto que mencione a Bancolombia/Galatea), se sustituyen los nombres reales por placeholders neutrales:

| Nombre real | Placeholder enviado a Gemini |
|---|---|
| Bancolombia | `Empresa X` |
| Galatea | `Proyecto Y` |
| (otros términos internos sensibles que se agreguen) | `Concepto Z`, `Equipo W`, etc. |

El prompt enviado a Gemini para el tema libre **nunca** incluye estos nombres — sólo contiene el string del tema que el jugador escribió (FR-018, A-010). El diccionario de anonimización se usa exclusivamente para el flujo de generación de preguntas de Galatea vía IA (fallback cuando el banco JSON no alcanza, ver FR-004), donde si es necesario dar contexto de qué es "Galatea" a la IA, ese contexto ya viene anonimizado.

Después de recibir la respuesta de Gemini (JSON de preguntas), el **mapper de infraestructura** (`GeminiQuestionMapper`) reemplaza los placeholders de vuelta por los nombres reales (`Empresa X` → `Bancolombia`, `Proyecto Y` → `Galatea`) antes de construir el `QuestionModel` del dominio. El dominio nunca ve ni el placeholder ni sabe que existió una anonimización — sólo recibe el texto final ya resuelto.

**Rationale**: Cumple FR-018/A-010 (ningún dato de marca sale hacia servicios externos) sin requerir un proxy corporativo (descartado en Clarifications Q2, opción A elegida). Es la solución más simple: un mapa de sustitución de texto en la capa de infraestructura, integrado en el cliente Vertex AI sobre Firebase App, sin nueva infraestructura de red.

**Alternatives considered**:
- Proxy corporativo que filtre contenido — rechazado por complejidad innecesaria para un evento interno controlado (viola Principio IV, YAGNI).
- No anonimizar y confiar en que Gemini no persiste el prompt — rechazado porque no cumple con la gobernanza de datos esperada en un contexto Bancolombia.

---

## 2. Formato del banco de preguntas Galatea (JSON)

**Decision**: Archivo estático `public/assets/galatea-questions.json`, con esta forma:

```json
{
  "version": 1,
  "questions": [
    {
      "id": "gal-001",
      "text": "¿Qué representa el logo del Proyecto Y dentro de Empresa X?",
      "options": [
        "Un ecosistema de innovación interna",
        "Un producto financiero externo",
        "Una alianza con un tercero",
        "Un evento anual de la compañía"
      ],
      "correctOptionIndex": 0
    }
  ]
}
```

- **Ya anonimizado en disco**: el archivo JSON versionado en el repositorio usa los placeholders (`Empresa X`, `Proyecto Y`) igual que el prompt de IA, de modo que el mismo pipeline de "resolución de placeholders" (mapper) se reutiliza tanto para preguntas generadas por IA como para preguntas del banco curado. Esto es intencional: **un solo punto de traducción placeholder → nombre real**, ubicado en infraestructura.
- Mínimo 12 preguntas (Clarifications Q3) para permitir selección aleatoria de 6 sin repetición entre partidas consecutivas.
- `correctOptionIndex` es 0-based, consistente con el modelo de dominio (`Question.correctOptionIndex`).

**Rationale**: Un solo formato y un solo mapper para ambas fuentes (banco curado + IA) reduce duplicación (Principio IV). Anonimizar también el archivo estático evita mantener dos convenciones de nombres distintas.

**Alternatives considered**:
- Banco de preguntas ya con nombres reales (sin anonimizar) + anonimizar sólo el prompt de IA — rechazado porque duplica la lógica de resolución de nombres y complica el mapper (dos formatos de entrada distintos).

---

## 3. Selección de arquitectura de estado (Signals Store)

**Decision**: Un único `MatchStore` basado en signals (patrón "Layered Derivation" de `signal-patterns.instructions.md`) que mantiene:

```
_playerAlias      (signal)
_chosenTopic      (signal)
_cards            (signal<Card[]>)           # 12 tarjetas generadas
_answeredCount    (computed)                 # cuántas de las 6 ya se respondieron
_liveScore        (computed)                 # puntaje parcial en tiempo real (FR-011)
_isMatchComplete  (computed)                 # answeredCount === 6
_finalScore       (computed)                 # sólo cuando isMatchComplete
_level            (computed)                 # deriva de finalScore vía AssignLevelUsecase
```

**Rationale**: Sigue el patrón ya documentado en `frontend-implementation.instructions.md` (`QuizStore`), adaptado a la mecánica real de esta especificación (12 tarjetas, 6 elegidas, multiplicador). Evita `NgRx` u otras librerías de estado — innecesarias para el alcance de una SPA sin backend (Principio IV).

**Alternatives considered**: NgRx/Akita — rechazados por sobre-ingeniería para un estado que cabe en un solo store de signals.

---

## 4. Cálculo de puntuación y niveles

**Decision**: Dos casos de uso puros de dominio, sin dependencias externas:

- `CalculateMatchScoreUsecase.calculate(answers: Answer[]): Score` — implementa la fórmula confirmada en Clarifications Q1: `(galateaCorrectCount × 10) × galateaCorrectCount + topicCorrectCount × 10`.
- `AssignLevelUsecase.assign(totalScore: number): Level` — mapea el puntaje a uno de los 7 niveles (tabla de FR-014) mediante rangos ordenados.

Ambos son funciones puras testeables sin `TestBed`, apuntando a 100% de cobertura de branches (Principio V, casos de uso críticos ≥ 95%).

**Rationale**: Lógica de negocio pura, sin efectos secundarios; se puede probar exhaustivamente con tabla de casos (0, 60, 119, 120, 360, etc.) sin mocks.

---

## 5. Efectos de celebración por nivel

**Decision**: Componente `tg-celebration` recibe el `Level` (vía `input()`) y renderiza una configuración declarativa por nivel (`LEVEL_CELEBRATION_CONFIG`: paleta de color Caribe, intensidad de confetti, si aplica `prefers-reduced-motion` fallback estático). La intensidad crece progresivamente:

| Nivel | Intensidad visual |
|---|---|
| Visitante | Sobria — sin confetti, tokens de color neutros de Caribe |
| Explorador → Estratega | Confetti creciente + color de acento Caribe por nivel |
| Maestro Galatea | Confetti denso + animación de brillo |
| Unicornio Galatea 🦄 | Máxima intensidad — confetti + emoji + animación especial, respetando `prefers-reduced-motion` (Principio VIII) |

**Rationale**: Cumple SC-006 (diferencia visible entre ≥3 niveles) y Principio VIII (respeta `prefers-reduced-motion`). Toda animación usa tokens `--cb-sys-*` de Caribe, nunca colores hardcodeados (Principio VII).

**Alternatives considered**: Librería externa de confetti (`canvas-confetti`) — aceptable como dependencia ligera si Caribe no ofrece un componente de celebración; se evalúa en fase de tareas si el bundle size lo permite (Principio IX, presupuesto 250 KB).

---

## 6. Accesibilidad del tablero de tarjetas

**Decision**:
- Cada tarjeta es un `<button>` nativo (nunca `<div>` con click handler) con `aria-label` dinámico: `"Tarjeta {n}, categoría {categoría}, {estado}"` (ej. "Tarjeta 3, categoría Galatea, sin responder").
- Tarjetas respondidas usan `aria-disabled="true"` y `tabindex="-1"` para excluirlas de la navegación por Tab una vez respondidas (US2, escenario 5).
- El modal de pregunta (`tg-question-modal`) atrapa el foco (focus trap) mientras está abierto y devuelve el foco a la tarjeta de origen al cerrarse.
- El puntaje en vivo y el mensaje de correcto/incorrecto se anuncian con `aria-live="polite"` (FR-011, FR-016, Principio VI).

**Rationale**: Cumple Principio VI (WCAG 2.1 AA) y los criterios de accesibilidad de la especificación (navegación completa por teclado, `aria-live` en cambios dinámicos).

---

## 7. Estrategia de mocks para `ng serve` sin backend

**Decision**: Dos Composition Roots:
- `app.config.ts` (default / producción del evento): `QuestionGateway` implementado por `QuestionService`, que combina banco JSON local + llamada real a Gemini vía Vertex AI for Firebase (`firebase` + `@angular/fire/vertexai`).
- `app.config.local.ts` (desarrollo sin API key): `QuestionGateway` implementado por `QuestionMockService`, que retorna preguntas hardcodeadas para ambas fuentes.

**Rationale**: Refleja el patrón ya usado en el proyecto (`golden-rules.instructions.md`, regla 3: "el frontend funciona sin backend"). Permite desarrollar la UI sin consumir cuota de la API de Gemini.

---

## 8. Logging sin `console.log`

**Decision**: `LoggerService` inyectable (`providedIn: 'root'`) con métodos `info`, `warn`, `error`, que en desarrollo escribe a la consola del navegador y en producción es un no-op (o se conecta a un colector si se agrega en el futuro).

**Rationale**: Cumple Principio X (sin `console.log` directo en código de producción).

---

## 9. Phase 7 (Polish) — evidencia de validación

### 9.1 Bundle inicial (T071)

Medido con `ng build --configuration production` (ver [checklists/security.md](./checklists/security.md) y Principio IX, "ningún bundle inicial supera 250 KB gzipped"):

| Chunk inicial | Raw | Estimado de transferencia |
|---|---|---|
| chunk-VBQPINIU.js | 247.33 kB | 67.96 kB |
| chunk-NRVSROWL.js | 66.34 kB | 18.37 kB |
| polyfills | 34.59 kB | 11.33 kB |
| main | 7.12 kB | 2.54 kB |
| resto | ~2 kB | ~1.3 kB |
| **Total inicial** | **357.37 kB** | **101.50 kB** |

**Conclusión**: 101.50 kB estimados de transferencia inicial, muy por debajo del límite de 250 KB gzipped. Las 3 rutas (`welcome`, `board`, `results`) están lazy-loaded como chunks separados (27.78 kB, 3.21 kB, 2.16 kB de transferencia estimada respectivamente), cumpliendo el requisito de lazy loading por ruta.

Los presupuestos de `angular.json` (`maximumWarning: 500kB` / `maximumError: 1MB`, en tamaño raw) son intencionalmente más laxos que el límite constitucional (que es sobre tamaño gzipped del bundle inicial, no sobre el total raw de todos los chunks); se documenta aquí la evidencia real medida en vez de ajustar esos presupuestos, ya que ambas métricas no son directamente comparables.

### 9.2 Core Web Vitals (T071)

**Limitación del entorno**: Lighthouse CLI no pudo instalarse en este entorno de desarrollo (`npx lighthouse` falla con `ECONNRESET` contra el registro npm privado corporativo, que no expone paquetes públicos de npmjs.org). Por lo tanto, el audit formal de Lighthouse (FCP/LCP/TBT vía su metodología exacta) **queda pendiente de ejecución manual** en un entorno con acceso de red completo, antes o durante el evento.

Como evidencia aproximada y reproducible, se agregó [e2e/performance-metrics.spec.ts](../../e2e/performance-metrics.spec.ts), que mide FCP/LCP reales vía la Performance API del navegador (a través de Playwright/CDP) y aproxima Total Blocking Time sumando la duración de `longtask` entries por encima de 50ms. Resultado medido (modo `local`, página `welcome`):

- FCP: 844 ms (umbral: ≤ 1500 ms) ✅
- LCP: no reportado en este escenario (página basada en formulario, sin bloque de contenido "largest" claro en el viewport inicial) — no bloqueante.
- TBT: 0 ms (umbral: ≤ 200 ms) ✅

### 9.3 SC-001 — tiempo de partida completa (T087)

Automatizado en [e2e/full-flow.spec.ts](../../e2e/full-flow.spec.ts) (usa el helper `playFullMatch` de [e2e/helpers.ts](../../e2e/helpers.ts)). Ejecuciones observadas del flujo completo (alias → tema → tablero → 6 respuestas → resultados): 11.7–13.5 s por corrida, muy por debajo del umbral de 5 minutos (300 s) de SC-001. No se requiere instrumentación adicional: el propio test e2e mide el tiempo de ejecución de principio a fin en cada corrida de CI.

### 9.4 T077/T078 — validación de relevancia y latencia de IA en producción real

Ambas tareas dependen de invocar el modelo Gemini real (no el modo `local`/mock), lo cual requiere credenciales de Firebase/Vertex AI válidas y acceso de red sin restricciones — no disponibles en este entorno de desarrollo. Se documentan aquí como **protocolo pendiente de ejecución manual antes del evento**:

- **T077 (relevancia de preguntas de IA)**: ejecutar manualmente ≥10 temas libres variados contra el modo producción real, revisar que las preguntas generadas sean relevantes y no contengan contenido inapropiado (ver `checklists/ai-topic-questions.md`).
- **T078 (latencia p90)**: registrar el tiempo de respuesta de `GeminiClientService.generateJson` en ≥20 llamadas reales (por ejemplo, agregando logging temporal con `LoggerService` o usando las DevTools de red), calcular el percentil 90 y confirmar que está dentro de un rango aceptable para UX (idealmente bajo el timeout de 30s definido en `GEMINI_TIMEOUT_MS`, con margen cómodo).

### 9.5 T089 — cierre operativo

El evento presencial aún no ha ocurrido al momento de este cierre de Phase 7; por lo tanto, la rotación de la API key de Gemini/Vertex AI post-evento (y cualquier limpieza de datos de sesión) **no aplica todavía** y queda como acción operativa a ejecutar después de finalizado el evento real.

### 9.6 T070 — auditoría de componentes exclusivos de Caribe

Revisado el árbol completo de templates (`src/app/**/*.html`): las únicas 3 páginas (`welcome.page.html`, `board.page.html`, `results.page.html`) sólo usan componentes Caribe (`cb-input-field`, `cb-button`, `cb-loader`) y exactamente 4 componentes propios (`tg-score-board`, `tg-question-card`, `tg-question-modal`, `tg-celebration`), todos ellos construidos sobre elementos HTML nativos (sin ningún otro componente custom anidado) y estilizados vía tokens `--cb-sys-*` de Caribe (incluyendo los 7 tokens `--cb-sys-status-*-fill` usados para diferenciar cada nivel de celebración). No se encontró ningún componente de UI personalizado fuera de estos 4, cumpliendo Principio VII.

### 9.7 T073 — auditoría XSS/sanitización

Búsqueda exhaustiva en `src/app/**` confirma que el proyecto **no usa** `[innerHTML]`, `DomSanitizer.bypassSecurityTrust*` ni ninguna otra API de inserción de HTML crudo. Todo el contenido dinámico (alias, tema elegido, texto de preguntas generado por Gemini) se renderiza vía interpolación `{{ }}` de Angular, que escapa HTML automáticamente; los pocos usos de atributos `aria-*` interpolados (donde Angular no escapa por defecto) ya pasan por `AriaEscapePipe` (T091). Se agregó una prueba de regresión explícita en `results.page.spec.ts` que confirma que un alias/tema con marcado malicioso (`<script>`, `<img onerror=...>`) se renderiza como texto plano, sin crear ningún nodo `<script>`/`<img>` real en el DOM.

### 9.8 T088 — auditoría de no-envío del alias a Gemini

La firma de `QuestionGateway.getChosenTopicQuestions(topic, count)` no acepta el alias del jugador en ningún punto de la cadena de llamada (`QuestionService` → `buildChosenTopicPrompt(topic, count)` → `GeminiClientService.generateJson(prompt)`), por lo que es estructuralmente imposible que el alias llegue al prompt. Se agregó una prueba explícita en `question.service.spec.ts` que espía el prompt real enviado a `generateJson` y confirma que no contiene un alias de prueba, sólo el tema y las instrucciones del prompt.

### 9.9 Resumen consolidado de acciones manuales pendientes (T077, T078, T089)

Estas 3 tareas tienen su **protocolo/mecanismo ya definido y documentado** (§9.4, §9.5), pero su **ejecución en vivo NO se ha realizado** — quedan marcadas `[~]` (no `[X]`) en [tasks.md](./tasks.md) hasta que alguien las corra manualmente:

| Tarea | Cuándo | Qué hacer | Dónde registrar evidencia |
|---|---|---|---|
| T077 | Antes del evento | Ejecutar ≥10 temas libres variados contra el modo producción real (Gemini real, no mock) y completar la rúbrica de relevancia en `checklists/ai-topic-questions.md` | `checklists/ai-topic-questions.md` + nota en este research.md |
| T078 | Antes del evento | Registrar ≥20 llamadas reales a `GeminiClientService.generateJson`, calcular el percentil p90 de latencia y confirmar que está dentro de un margen cómodo bajo `GEMINI_TIMEOUT_MS` (30s) | Este research.md (§9.4) |
| T089 | Dentro de las 24h posteriores al cierre del evento | Rotar o deshabilitar la API key de Gemini/Vertex AI en Google Cloud Console; confirmar que la restricción de HTTP Referer estuvo activa todo el período | Captura de pantalla archivada junto a este research.md |

