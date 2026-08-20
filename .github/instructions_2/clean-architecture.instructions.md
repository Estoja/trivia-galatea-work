---
applyTo: "src/app/{domain,infrastructure,ui}/**/*.ts"
---

# Arquitectura Limpia — Trivia Galatea

Guía normativa de Clean Architecture adaptada a Angular para este proyecto.

---

## 📐 Principios Fundamentales

- **La capa de dominio no depende de ninguna otra capa** — ni de Angular, ni de UI, ni de infraestructura.
- **La UI depende del dominio, nunca al revés.**
- **La infraestructura implementa contratos del dominio** (gateways) y se conecta solo a través de inyección de dependencias.
- **La infraestructura mapea datos externos a modelos de dominio.** El dominio nunca refleja la estructura de una API o respuesta de IA.
- **La inversión de dependencias se logra con clases abstractas** (gateways) como puertos e implementaciones concretas como adaptadores.

### 🚨 Dirección de construcción: Dominio → afuera (NUNCA API → modelo → UI)

El dominio se diseña **desde el lenguaje del negocio**, no desde el JSON que devuelve Gemini o un backend.

- Los nombres de campos en modelos de dominio son **semánticos y expresan conceptos de negocio** (ej: `correctOption`, `selectedOption`), nunca copian nombres técnicos de la API (ej: `opt_idx`, `val`).
- La documentación del dominio **jamás menciona endpoints, HTTP, Gemini ni detalles de infraestructura**. El dominio habla solo de negocio.
- Si Gemini devuelve un campo con nombre técnico o estructura diferente, la infraestructura lo traduce en su mapper.
- **Test mental de independencia:** si cambias de Gemini a OpenAI, o de REST a GraphQL, el dominio no debería cambiar ni una línea.

```
┌──────────────────────────────────────────────────┐
│                UI / Presentación                  │  ← Capa más externa
│  ┌────────────────────────────────────────────┐  │
│  │            Infraestructura                  │  │
│  │  ┌──────────────────────────────────────┐  │  │
│  │  │          Dominio (Núcleo)            │  │  │  ← Capa más interna
│  │  │  • Modelos / Entidades               │  │  │
│  │  │  • Gateways (abstracciones)          │  │  │
│  │  │  • Casos de Uso                      │  │  │
│  │  └──────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘

📌 Dirección de dependencia: UI → Dominio ← Infraestructura
```

---

## 🗂️ Estructura de Carpetas

```
src/app/
  app.config.ts             ← Composition Root (toda la DI aquí)
  app.routes.ts             ← Rutas lazy-loaded
  domain/
    models/
      <entidad>/
        <entidad>.model.ts          ← Interfaz pura de dominio
        gateway/
          <entidad>.gateway.ts      ← Clase abstracta (contrato/puerto)
        index.ts                    ← Barrel de exports
    usecases/
      <feature>/
        <action>-<feature>.usecase.ts       ← Caso de uso @Injectable()
        <action>-<feature>.usecase.spec.ts  ← Test unitario
    enums/
      <name>.enum.ts                ← Enumeraciones de dominio
  infrastructure/
    <entidad>/
      <entidad>.service.ts          ← Implementación real (HTTP, Gemini, etc.)
      <entidad>-mock.service.ts     ← Implementación mock (desarrollo local)
    helpers/
      maps/
        common/
          mapper.ts                 ← Clase abstracta genérica Mapper<I>
        <entidad>.mapper.ts         ← Mapper concreto: API response → modelo dominio
  ui/
    components/
      <feature>/
        <feature>.component.ts
        <feature>.component.html
        <feature>.component.scss
        <feature>.component.spec.ts
      shared/
        <feature>.constants.ts      ← Constantes numéricas y de configuración
    pages/
      <page>/
        <page>.component.ts         ← Smart component (orquestador)
    state/
      <feature>.store.ts            ← Store signal-based por feature
```

---

## 🏛️ Capas y Responsabilidades

### 1. Dominio (`domain/`)

**Regla:** cero dependencias de Angular, HTTP, Gemini o UI. Solo TypeScript puro y RxJS.

#### Modelos (`domain/models/<entidad>/<entidad>.model.ts`)

Son **interfaces TypeScript puras** que representan entidades del negocio.

```typescript
export interface QuestionModel {
  /** Identificador único de la pregunta */
  id: string;
  /** Enunciado de la pregunta */
  text: string;
  /** Cuatro opciones de respuesta */
  options: string[];
  /** Índice (0-based) de la opción correcta */
  correctOption: number;
  /** Origen de la pregunta */
  source: QuestionSource;
}
```

✅ Solo propiedades del negocio  
✅ Nombres semánticos, no técnicos ni crípticos  
✅ Campos opcionales con `?` cuando corresponde  
❌ NO decoradores de Angular  
❌ NO dependencias de infraestructura  
❌ NO copiar nombres de campos de la API o respuesta de Gemini  

#### Gateways (`domain/models/<entidad>/gateway/<entidad>.gateway.ts`)

Son **clases abstractas** (no interfaces) que definen el contrato que la infraestructura debe cumplir. Se usan clases abstractas porque Angular no puede inyectar interfaces en tiempo de ejecución.

```typescript
import { Observable } from 'rxjs';
import { QuestionModel } from '../question.model';

export abstract class QuestionGateway {
  abstract getGalateaQuestions(count: number): Observable<QuestionModel[]>;
  abstract getFreeTopicQuestions(topic: string, count: number): Observable<QuestionModel[]>;
}
```

✅ Todos los métodos son `abstract`  
✅ Retornan `Observable<T>` (nunca `Promise`)  
✅ Usan tipos del dominio, nunca `any`  
❌ NO tiene implementación  
❌ NO conoce HttpClient, Gemini SDK, ni ninguna tecnología concreta  

#### Casos de Uso (`domain/usecases/`)

Son clases `@Injectable()` **sin `providedIn`** que encapsulan una operación de negocio. Se registran explícitamente en `app.config.ts`.

```typescript
@Injectable()
export class BuildQuizUsecase {
  constructor(private questionGateway: QuestionGateway) {}

  build(topic: string, countPerSource: number): Observable<QuizModel> {
    return forkJoin({
      galatea: this.questionGateway.getGalateaQuestions(countPerSource),
      freeTopic: this.questionGateway.getFreeTopicQuestions(topic, countPerSource),
    }).pipe(
      map(({ galatea, freeTopic }) => ({
        questions: shuffle([...galatea, ...freeTopic]),
      }))
    );
  }
}
```

✅ Una sola responsabilidad por caso de uso  
✅ Inyecta el gateway abstracto, NUNCA la implementación concreta  
✅ Contiene la lógica de negocio (mezcla, validaciones, transformaciones)  
✅ `@Injectable()` sin `providedIn` — se registra en `app.config.ts`  
❌ NO accede directamente a APIs, Gemini ni servicios externos  
❌ NO conoce la UI  

#### Enumeraciones (`domain/enums/<name>.enum.ts`)

Constantes de dominio tipadas, sin dependencias externas.

```typescript
export type QuestionSource = 'galatea' | 'free-topic';

export enum PrizeTier {
  Gold   = 'gold',
  Silver = 'silver',
  Bronze = 'bronze',
}
```

---

### 2. Infraestructura (`infrastructure/`)

**Regla:** implementa contratos del dominio. Aquí vive todo lo que cambia: HttpClient, Gemini, localStorage, mocks.

#### Adaptadores (`infrastructure/<entidad>/<entidad>.service.ts`)

```typescript
@Injectable()
export class QuestionService extends QuestionGateway {
  constructor(private gemini: GeminiClient, private http: HttpClient) {
    super();
  }

  override getGalateaQuestions(count: number): Observable<QuestionModel[]> {
    return this.http.get<GalateaApiResponse[]>('/api/questions', { params: { count } })
      .pipe(map(items => items.map(item => new QuestionMapper().fromMap(item))));
  }

  override getFreeTopicQuestions(topic: string, count: number): Observable<QuestionModel[]> {
    return this.gemini.generate(`Generate ${count} trivia questions about ${topic}`)
      .pipe(map(response => new GeminiQuestionMapper().fromMap(response)));
  }
}
```

✅ Extiende (`extends`) el gateway abstracto del dominio  
✅ Usa `override` en cada método implementado  
✅ Aquí sí se usa HttpClient, Gemini SDK, localStorage, etc.  
✅ Delega el mapeo a un Mapper (nunca mapea inline)  
❌ NO contiene lógica de negocio  

#### Mappers (`infrastructure/helpers/maps/`)

Transforman datos externos (respuesta de API o Gemini) al formato del modelo de dominio. Evitan que la infraestructura contamine los modelos.

```typescript
// infrastructure/helpers/maps/common/mapper.ts
export abstract class Mapper<I> {
  abstract fromMap(obj: any): I;
}

// infrastructure/helpers/maps/question.mapper.ts
export class QuestionMapper extends Mapper<QuestionModel> {
  fromMap(obj: any): QuestionModel {
    return {
      id: obj.id ?? crypto.randomUUID(),
      text: obj.question_text,       // ← traduce nombre técnico de API
      options: obj.choices,
      correctOption: obj.answer_idx,
      source: 'galatea',
    };
  }
}
```

✅ Un mapper por entidad (o por fuente de datos si el formato difiere)  
✅ La traducción de nombres técnicos de la API ocurre SOLO aquí  
✅ Extiende `Mapper<T>` para consistencia  
❌ NO contiene lógica de negocio  

#### Mocks (`infrastructure/<entidad>/<entidad>-mock.service.ts`)

Implementaciones que retornan datos hardcodeados. Permiten que el frontend funcione sin backend ni Gemini.

```typescript
@Injectable()
export class QuestionMockService extends QuestionGateway {
  override getGalateaQuestions(count: number): Observable<QuestionModel[]> {
    return of(GALATEA_MOCK_QUESTIONS.slice(0, count));
  }

  override getFreeTopicQuestions(topic: string, count: number): Observable<QuestionModel[]> {
    return of(FREE_TOPIC_MOCK_QUESTIONS.slice(0, count));
  }
}
```

---

### 3. UI (`ui/`)

**Regla:** solo depende del dominio (modelos, gateways, enums). Nunca de infraestructura.

#### Páginas (`ui/pages/`) — Smart Components

```typescript
@Component({
  selector: 'tg-welcome-page',
  standalone: true,
  imports: [TgTopicSelectorComponent, CbButton],
  templateUrl: './welcome.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomePage {
  private quizStore = inject(QuizStore);

  onStart(participant: ParticipantModel): void {
    this.quizStore.start(participant);
  }
}
```

✅ Inyecta **stores y use cases** del dominio  
✅ `ChangeDetectionStrategy.OnPush`  
✅ Standalone con imports explícitos  
❌ NO inyecta servicios de infraestructura (`*Service`) directamente  
❌ NO contiene lógica de negocio  

#### Componentes (`ui/components/`) — Dumb Components

✅ Reciben datos vía `input()` signals  
✅ Emiten eventos vía `output()` signals  
✅ `ChangeDetectionStrategy.OnPush`  
❌ NO inyectan stores, gateways ni use cases  

#### Constantes (`ui/components/shared/<feature>.constants.ts`)

Extraer números y strings mágicos a constantes con nombre descriptivo:

```typescript
export const QUIZ_QUESTIONS_PER_SOURCE = 4;
export const QUIZ_OPTION_COUNT = 4;
export const SCORE_PRIZE_GOLD_THRESHOLD = 80;
export const SCORE_PRIZE_SILVER_THRESHOLD = 50;
```

---

### 4. Composition Root (`app.config.ts`)

Único lugar donde se conectan abstracciones con implementaciones. **Nunca** en un NgModule.

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),

    //  Abstracción (token)    →   Implementación concreta
    { provide: QuestionGateway, useClass: QuestionMockService }, // local
    { provide: PrizeGateway,    useClass: PrizeMockService    }, // local

    // Registrar use cases explícitamente (no usan providedIn: 'root')
    BuildQuizUsecase,
    ScoreQuizUsecase,
  ],
};
```

Para cambiar de mock a real, solo se modifica esta línea:
```typescript
{ provide: QuestionGateway, useClass: QuestionService }, // real
```

---

## ✅ Convenciones de Nomenclatura

| Artefacto | Patrón | Ejemplo |
|---|---|---|
| Modelo de dominio | `<Entity>Model` (interfaz) | `QuestionModel`, `PrizeModel` |
| Gateway abstracto | `<Entity>Gateway` (clase abstracta) | `QuestionGateway` |
| Caso de uso | `<Action><Feature>Usecase` | `BuildQuizUsecase`, `ScoreQuizUsecase` |
| Service (infra real) | `<Entity>Service extends <Entity>Gateway` | `QuestionService` |
| Mock (infra local) | `<Entity>MockService extends <Entity>Gateway` | `QuestionMockService` |
| Mapper | `<Entity>Mapper extends Mapper<<Entity>Model>` | `QuestionMapper` |
| Store | `<Feature>Store` | `QuizStore` |
| Token DI | `SCREAMING_SNAKE_CASE` | `GEMINI_API_KEY` |
| Enum / type de dominio | `<Name>` | `QuestionSource`, `PrizeTier` |
| Constante UI | `<FEATURE>_<DESCRIPTION>` | `QUIZ_QUESTIONS_PER_SOURCE` |
| Selector de componente propio | `tg-<feature>` | `tg-question-card` |
| Página (smart) | `<Name>Page` | `WelcomePage`, `QuizPage` |

---

## 🧪 Estrategia de Testing por Capa

### Casos de Uso — sin TestBed

```typescript
describe('BuildQuizUsecase', () => {
  let gatewayMock: jest.Mocked<QuestionGateway>;
  let usecase: BuildQuizUsecase;

  beforeEach(() => {
    gatewayMock = {
      getGalateaQuestions:    jest.fn(),
      getFreeTopicQuestions:  jest.fn(),
    } as unknown as jest.Mocked<QuestionGateway>;
    usecase = new BuildQuizUsecase(gatewayMock);
  });

  it('debe mezclar preguntas de ambas fuentes', (done) => {
    gatewayMock.getGalateaQuestions.mockReturnValue(of(mockGalateaQuestions(4)));
    gatewayMock.getFreeTopicQuestions.mockReturnValue(of(mockFreeTopicQuestions(4)));

    usecase.build('Harry Potter', 4).subscribe(quiz => {
      expect(quiz.questions.length).toBe(8);
      expect(gatewayMock.getGalateaQuestions).toHaveBeenCalledWith(4);
      expect(gatewayMock.getFreeTopicQuestions).toHaveBeenCalledWith('Harry Potter', 4);
      done();
    });
  });
});
```

### Infraestructura — con HttpTestingController / GeminiMock

```typescript
// Probar que el mapper transforma correctamente la respuesta de la API
it('should map API response to QuestionModel', () => {
  const raw = { question_text: '¿Qué es Galatea?', choices: ['A','B','C','D'], answer_idx: 0 };
  const result = new QuestionMapper().fromMap(raw);
  expect(result.text).toBe('¿Qué es Galatea?');
  expect(result.correctOption).toBe(0);
});
```

### Componentes — con TestBed + stubs inline

```typescript
// Proveer stubs inline, nunca MockService
providers: [
  { provide: QuestionGateway, useValue: { getGalateaQuestions: () => of([]) } },
  { provide: BuildQuizUsecase, useValue: { build: () => of(mockQuiz) } },
]
```

---

## 📋 Paso a Paso: Agregar una Nueva Entidad

Ejemplo: agregar `LeaderboardEntry` (tabla de líderes).

**Paso 1 — Modelo**
```typescript
// domain/models/leaderboard/leaderboard.model.ts
export interface LeaderboardEntryModel {
  participantName: string;
  score: number;
  topic: string;
}
```

**Paso 2 — Gateway**
```typescript
// domain/models/leaderboard/gateway/leaderboard.gateway.ts
export abstract class LeaderboardGateway {
  abstract getTop(limit: number): Observable<LeaderboardEntryModel[]>;
  abstract save(entry: LeaderboardEntryModel): Observable<void>;
}
```

**Paso 3 — Caso de Uso**
```typescript
// domain/usecases/leaderboard/save-score.usecase.ts
@Injectable()
export class SaveScoreUsecase {
  constructor(private leaderboardGateway: LeaderboardGateway) {}
  execute(entry: LeaderboardEntryModel): Observable<void> {
    return this.leaderboardGateway.save(entry);
  }
}
```

**Paso 4 — Mapper**
```typescript
// infrastructure/helpers/maps/leaderboard.mapper.ts
export class LeaderboardMapper extends Mapper<LeaderboardEntryModel> {
  fromMap(obj: any): LeaderboardEntryModel {
    return { participantName: obj.name, score: obj.pts, topic: obj.topic };
  }
}
```

**Paso 5 — Adaptador**
```typescript
// infrastructure/leaderboard/leaderboard.service.ts
@Injectable()
export class LeaderboardService extends LeaderboardGateway {
  constructor(private http: HttpClient) { super(); }
  override getTop(limit: number): Observable<LeaderboardEntryModel[]> {
    return this.http.get<any[]>(`/api/leaderboard?limit=${limit}`)
      .pipe(map(items => items.map(i => new LeaderboardMapper().fromMap(i))));
  }
  override save(entry: LeaderboardEntryModel): Observable<void> {
    return this.http.post<void>('/api/leaderboard', entry);
  }
}
```

**Paso 6 — Registrar en app.config.ts**
```typescript
{ provide: LeaderboardGateway, useClass: LeaderboardMockService }, // local
SaveScoreUsecase,
```

**Paso 7 — Usar desde la UI**
```typescript
// ui/pages/results/results.component.ts
export class ResultsPage {
  private saveScore = inject(SaveScoreUsecase);
  // ...inyectar use case, nunca LeaderboardService directamente
}
```

---

## 🚫 Anti-patrones a Evitar

| Anti-patrón | Problema | Solución |
|---|---|---|
| Inyectar `QuestionService` en un componente | Acoplamiento directo a infraestructura | Inyectar `BuildQuizUsecase` o el store |
| Lógica de negocio en componentes (mezcla, score) | Violación de SRP, difícil de testear | Mover al caso de uso correspondiente |
| `HttpClient` o `GeminiClient` en un caso de uso | El dominio conoce infraestructura | Usar el gateway abstracto |
| `interface` en lugar de `abstract class` para gateways | Angular no puede inyectar interfaces | Usar `abstract class` siempre |
| `providedIn: 'root'` en casos de uso | Acoplamiento implícito, difícil de intercambiar en tests | `@Injectable()` sin `providedIn`, registrar en `app.config.ts` |
| Copiar nombres técnicos de la API en modelos (`sum`, `qty`, `opt_idx`) | El dominio habla de la API, no del negocio | Nombres semánticos + mapper en infra |
| Mapeo inline en el adaptador (sin Mapper) | Mezcla responsabilidades | Crear `<Entity>Mapper extends Mapper<T>` |
| Números mágicos inline en componentes (`80`, `50`, `4`) | Sin significado, difícil de mantener | Extraer a constantes en `shared/*.constants.ts` |
| Diseñar modelos desde la respuesta de Gemini/API | La API manda sobre el negocio | Diseñar desde el negocio, la infra adapta |
| NgModules | Patrón obsoleto | Todo standalone |

---

## ✔️ Checklist para Nueva Entidad

- [ ] Modelo como **interfaz pura** con nombres semánticos de negocio
- [ ] Gateway como **clase abstracta** con métodos `abstract` que retornan `Observable<T>`
- [ ] Caso de uso `@Injectable()` sin `providedIn`, con método `execute()` (o nombre descriptivo)
- [ ] Mapper concreto (`extends Mapper<T>`) en `infrastructure/helpers/maps/`
- [ ] Implementación real en `infrastructure/<entidad>/<entidad>.service.ts`
- [ ] Implementación mock en `infrastructure/<entidad>/<entidad>-mock.service.ts`
- [ ] Registrar en `app.config.ts`: `{ provide: <Entity>Gateway, useClass: <Entity>MockService }`
- [ ] Registrar el use case en `app.config.ts`: `<Action>Usecase`
- [ ] Test unitario del use case **sin TestBed** con `jest.fn()`
- [ ] Test del mapper verificando la traducción de nombres técnicos → semánticos

---

## 🔭 Resumen Visual

```
               ┌──────────────────────┐
               │     app.config.ts    │  ← Conecta abstracciones con implementaciones
               │  (Composition Root)  │
               └──────────┬───────────┘
                          │
        ┌─────────────────┼──────────────────┐
        │                 │                   │
 ┌──────▼──────┐   ┌──────▼──────┐   ┌───────▼──────┐
 │   DOMINIO   │   │  INFRA      │   │     UI       │
 │             │   │             │   │              │
 │ • Modelos   │   │ • Services  │   │ • Pages      │
 │ • Gateways  │◄──│  (extends)  │   │ • Components │
 │ • Usecases  │   │ • Mappers   │   │ • Stores     │
 │ • Enums     │   │ • Mocks     │   │ • Constants  │
 └─────────────┘   └─────────────┘   └──────────────┘
       ▲                                     │
       │            inyecta usecase/store     │
       └─────────────────────────────────────┘

📌 Dirección de dependencia: UI → Dominio ← Infraestructura
```
