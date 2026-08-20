---
applyTo: "src/app/**/*.ts"
---

# Trivia Galatea — Implementación Técnica

> Documentación técnica del frontend. Consulta el README para entender el modelo de negocio.

---

## 🎯 Propósito

**Trivia Galatea** es una app de trivia con IA donde cada participante:
1. Ingresa su nombre y elige un **tema libre** (Harry Potter, fútbol, historia, etc.).
2. Recibe una ronda de **~6–8 preguntas** mezcladas: ~3–4 sobre Galatea (fuente interna) + ~3–4 sobre su tema (generadas por Gemini).
3. Responde las preguntas y acumula un **puntaje**.
4. Al finalizar, obtiene un **premio** según su puntuación.

---

## 🏢 Dominio de Negocio

### Entidades y Modelos

#### `Participant` — El jugador
```typescript
interface Participant {
  name: string         // Nombre del participante
  topic: string        // Tema libre elegido (texto libre, ej: "Harry Potter")
}
```

#### `Question` — Una pregunta de trivia
```typescript
interface Question {
  id: string
  text: string              // Enunciado de la pregunta
  options: string[]         // Opciones de respuesta (A, B, C, D)
  correctOption: number     // Índice de la opción correcta (0-based)
  source: QuestionSource    // Origen de la pregunta
}

type QuestionSource = 'galatea' | 'free-topic'
```

#### `Quiz` — La ronda de juego
```typescript
interface Quiz {
  participant: Participant
  questions: Question[]     // Mezcla de Galatea + tema libre
}
```

#### `Answer` — Respuesta del participante
```typescript
interface Answer {
  questionId: string
  selectedOption: number    // Índice de la opción elegida
  isCorrect: boolean
}
```

#### `Score` — Puntuación final
```typescript
interface Score {
  correct: number           // Preguntas acertadas
  total: number             // Total de preguntas
  percentage: number        // % de aciertos
}
```

#### `Prize` — Premio asociado a la puntuación
```typescript
interface Prize {
  label: string             // Nombre del premio
  minPercentage: number     // % mínimo para obtenerlo
  imageUrl?: string
}
```

### Gateways (contratos del dominio)

#### `QuestionGateway` — Fuente de preguntas
```typescript
abstract class QuestionGateway {
  abstract getGalateaQuestions(count: number): Observable<Question[]>
  abstract getFreeTopicQuestions(topic: string, count: number): Observable<Question[]>
}
```
- `getGalateaQuestions`: consulta la fuente de datos interna de Galatea.
- `getFreeTopicQuestions`: llama a Gemini para generar preguntas sobre el tema libre. El dominio no sabe si es Gemini u otra IA — solo pide preguntas y recibe `Question[]`.

#### `PrizeGateway` — Catálogo de premios
```typescript
abstract class PrizeGateway {
  abstract getPrizes(): Observable<Prize[]>
}
```

### Reglas de Negocio

- La ronda siempre tiene **el mismo número de preguntas de cada categoría** (configurable, por defecto 4 de cada una).
- Las preguntas se **mezclan aleatoriamente** antes de mostrarse (el participante no sabe cuáles son de Galatea y cuáles del tema libre).
- La **puntuación** es el porcentaje de aciertos sobre el total.
- Los **premios** se asignan por rango de porcentaje (ej: ≥80% = premio A, ≥50% = premio B, <50% = premio C).
- Si Gemini no puede generar preguntas para un tema, se muestra un error claro al participante antes de empezar.

---

## 🗂️ Estructura del Proyecto

```
src/
  app/
    app.ts                ← Root component (selector: tg-root)
    app.config.ts         ← Composition Root — toda la DI se configura aquí
    app.routes.ts         ← Rutas lazy-loaded
    app.html
    app.scss
    domain/
      models/
        participant/
          participant.model.ts
        question/
          question.model.ts       ← Question, QuestionSource
          gateway/
            question.gateway.ts   ← QuestionGateway (abstract)
          index.ts
        quiz/
          quiz.model.ts           ← Quiz, Answer, Score
          usecase/
            build-quiz.usecase.ts ← Construye la ronda mezclando preguntas
            score-quiz.usecase.ts ← Calcula Score a partir de Answer[]
          index.ts
        prize/
          prize.model.ts
          gateway/
            prize.gateway.ts      ← PrizeGateway (abstract)
          index.ts
    infrastructure/
      question/
        question.service.ts       ← Implementación real: Gemini + fuente Galatea
        question-mock.service.ts  ← Mock para desarrollo local
      prize/
        prize.service.ts          ← Implementación real
        prize-mock.service.ts     ← Mock para desarrollo local
    ui/
      pages/
        welcome/                  ← Ingreso de nombre y elección de tema
        quiz/                     ← Pantalla de preguntas (una a la vez)
        results/                  ← Resultados, puntuación y premio
      components/
        question-card/            ← tg-question-card: muestra pregunta + opciones
        progress-bar/             ← tg-progress-bar: progreso de la ronda
        score-display/            ← tg-score-display: muestra puntuación final
        prize-card/               ← tg-prize-card: muestra el premio obtenido
      state/
        quiz.store.ts             ← Store signal-based: estado completo de la ronda
```

---

## ⚙️ Configuración de DI (`app.config.ts`)

```typescript
// Local (mocks): ng serve sin backend
{ provide: QuestionGateway, useClass: QuestionMockService },
{ provide: PrizeGateway,    useClass: PrizeMockService },

// Real: apunta a Gemini + backend de Galatea
{ provide: QuestionGateway, useClass: QuestionService },
{ provide: PrizeGateway,    useClass: PrizeService },
```

> `BuildQuizUsecase` y `ScoreQuizUsecase` usan `providedIn: 'root'` — no requieren registro explícito.

---

## 🔄 Flujo de Datos

```
WelcomePage
  └── inject(QuizStore).start(participant)
        └── inject(BuildQuizUsecase).build(topic, count)
              ├── inject(QuestionGateway).getGalateaQuestions(count)
              └── inject(QuestionGateway).getFreeTopicQuestions(topic, count)

QuizPage
  └── inject(QuizStore).answer(selectedOption)
        └── actualiza answers[], avanza a siguiente pregunta

ResultsPage
  ├── inject(QuizStore).score  ← computed del store
  └── inject(PrizeGateway).getPrizes() → determina premio por rango
```

### `QuizStore` — Estado de la ronda

```
_quiz (signal)
  ├── currentQuestion    (computed) ← questions[currentIndex]
  ├── currentIndex       (signal)
  ├── answers            (signal)
  ├── isFinished         (computed) ← answers.length === questions.length
  └── score              (computed) ← calculado desde answers
```

---

## 🛣️ Rutas

| Path | Componente | Descripción |
|------|-----------|-------------|
| `/` | `WelcomePage` | Ingreso de nombre y elección de tema libre |
| `/quiz` | `QuizPage` | Ronda de preguntas (requiere quiz iniciado) |
| `/results` | `ResultsPage` | Puntuación final y premio obtenido |
| `**` | redirect → `/` | Cualquier ruta desconocida vuelve al inicio |

---

## 🌐 Entornos

| Configuración | Uso |
|---|---|
| `environment.ts` (default) | Local — mocks activos, sin Gemini ni backend |
| `environment.development.ts` | Gemini + backend real de desarrollo |
| `environment.production.ts` | Gemini + backend real de producción |

---

## 🎨 Sistema de Diseño — Caribe

- **Paquetes**: `@bancolombia/caribe-design-system` + `@bancolombia/caribe-brand-bancolombia`
- **Prefijo de componentes Caribe**: `cb-` (ej: `cb-loader`, `cb-button`, `cb-card`)
- **Prefijo de componentes propios**: `tg-` (ej: `tg-question-card`, `tg-prize-card`)
- **Todos los `cb-*` son Web Components** (Shadow DOM) — no aplicar estilos externos a sus internos
- **Tokens CSS**: `--cb-sys-*` (colores, tipografía, espaciado)

### Setup global (`styles.scss`)

```scss
@use '@bancolombia/caribe-design-system' as cb;
@use '@bancolombia/caribe-brand-bancolombia' as cb-brand;

html {
  height: 100%;
  @include cb.theme(cb-brand.$config, cb-brand.$overrides);
}

body {
  color-scheme: light;
  background-color: var(--cb-sys-background-secondary-01);
  color: var(--cb-sys-text-default);
  font-family: 'Open Sans', sans-serif;
}
```

---

## 🏛️ Reglas de Arquitectura Limpia

1. **`domain/`** — cero dependencias de Angular, HTTP, Gemini o UI. Solo TypeScript + RxJS.
2. **Los gateways son clases abstractas** con métodos que retornan `Observable<T>`.
3. **`BuildQuizUsecase`** orquesta las dos llamadas al `QuestionGateway` y mezcla los resultados — esta lógica nunca va en la página ni en la infraestructura.
4. **`QuizStore`** es el único punto de acceso al estado de la ronda desde las páginas.
5. **La infraestructura** decide si llamar a Gemini, a un endpoint REST o a un mock — el dominio no sabe ni le importa.
6. **Sin NgModules** — todo es standalone.

---

## 🏷️ Convenciones de Nomenclatura

| Artefacto | Patrón | Ejemplo |
|---|---|---|
| Gateway (puerto) | `<Entity>Gateway` | `QuestionGateway`, `PrizeGateway` |
| Use case | `<Action><Entity>Usecase` | `BuildQuizUsecase`, `ScoreQuizUsecase` |
| Service (infra real) | `<Entity>Service extends <Entity>Gateway` | `QuestionService` |
| Mock (infra local) | `<Entity>MockService extends <Entity>Gateway` | `QuestionMockService` |
| Store | `<Feature>Store` | `QuizStore` |
| Token DI | `SCREAMING_SNAKE_CASE` | `GEMINI_API_KEY` |
| Componente propio | `tg-<feature>` | `tg-question-card` |
| Página (smart) | nombre descriptivo PascalCase | `WelcomePage`, `QuizPage`, `ResultsPage` |

---

## 🧪 Testing

- **Framework**: Jest + `@angular/core/testing` (TestBed)
- **Zoneless**: todos los tests usan `provideZonelessChangeDetection()`
- **Mocks en tests de componentes**: stubs inline con `useValue: { method: () => of(...) }` — nunca usar `MockService` en specs
- **Specs de use cases**: `TestBed` con gateway mockeado como `useValue`
- **Specs de páginas**: proveer gateways con stubs inline + `QuizStore` inicializado
- **No aplica cobertura** a: `app.config.*.ts`, `index.ts` (barrels), `environment.*.ts`, `*mock*.service.ts`

### Ejemplo — Test de `BuildQuizUsecase`
```typescript
it('should merge galatea and free-topic questions', () => {
  const gateway = { 
    getGalateaQuestions: () => of(mockGalateaQuestions(4)),
    getFreeTopicQuestions: () => of(mockFreeTopicQuestions(4)),
  };
  TestBed.configureTestingModule({
    providers: [{ provide: QuestionGateway, useValue: gateway }]
  });
  const usecase = TestBed.inject(BuildQuizUsecase);
  usecase.build('Harry Potter', 4).subscribe(quiz => {
    expect(quiz.questions.length).toBe(8);
  });
});
```
