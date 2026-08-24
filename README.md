# Trivia Galatea

SPA en Angular 20 (standalone, zoneless, Signals) sin backend, usada durante un evento presencial de Bancolombia. Los jugadores ingresan un alias, eligen un tema libre, y juegan un tablero de 12 tarjetas (6 preguntas sobre Galatea + 6 sobre el tema elegido), respondiendo 6 de ellas para obtener un puntaje y un nivel/título.

Ver la especificación completa en [specs/001-trivia-galatea-app/spec.md](specs/001-trivia-galatea-app/spec.md) y la guía técnica detallada en [specs/001-trivia-galatea-app/quickstart.md](specs/001-trivia-galatea-app/quickstart.md).

## Requisitos previos

- Node.js LTS + Angular CLI 20.
- Acceso al registro Artifactory de Bancolombia para los paquetes `@bancolombia/caribe-*` (`.npmrc` con token).
- (Opcional, sólo para el modo real con IA) Configuración de Firebase App para Vertex AI (Gemini).

## Instalación

```bash
npm install
```

## Ejecución

### Modo mock (sin API key, recomendado para desarrollo de UI)

```bash
npm run start -- --configuration=local
```

### Modo real (con IA de Gemini)

Requiere un `.env` con las variables `FIREBASE_*` (ver [quickstart.md §3.2](specs/001-trivia-galatea-app/quickstart.md#32-modo-real-con-ia-de-gemini)):

```bash
npm start
```

### Exposición local durante el evento presencial

No hay backend ni despliegue en la nube. Para exponer el juego a los asistentes desde el mismo computador:

```bash
ng serve --host 0.0.0.0 --port 4200
```

Los asistentes se conectan a `http://<ip-local-del-computador>:4200` desde la misma red Wi-Fi del evento.

## Comandos de calidad

```bash
npm test              # Jest + Angular Testing Library — cobertura ≥80% (usecases ≥95%)
npm run test:a11y     # axe-core (accesibilidad, Principio VI)
npm run start:e2e     # sirve la app en modo local, puerto 4300 (requerido por npm run e2e)
npm run e2e           # Playwright — flujo completo US1→US4, navegación por teclado, reinicio por recarga
npm run lint          # ESLint + reglas de Clean Architecture
npm run build         # build de producción (Angular CLI)
```

## Arquitectura

Clean Architecture + DDD. Ver [specs/001-trivia-galatea-app/plan.md](specs/001-trivia-galatea-app/plan.md) para la estructura completa de carpetas y decisiones técnicas, y [specs/001-trivia-galatea-app/research.md](specs/001-trivia-galatea-app/research.md) para el detalle de decisiones (anonimización del prompt hacia Gemini, formato del banco de preguntas, evidencia de validación de Phase 7, etc.).

```
src/app/
  domain/           # Modelos, enums, gateways abstractos, usecases puros
  infrastructure/   # QuestionService, GeminiClient, mappers, QuestionMockService
  ui/               # Páginas (welcome, board, results), componentes, MatchStore
```

## Gobernanza

Toda contribución debe cumplir la [constitución del proyecto](.specify/memory/constitution.md): Clean Architecture (no negociable), DDD, cobertura de tests ≥80% (usecases ≥95%, no negociable), accesibilidad WCAG 2.1 AA (no negociable), Sistema de Diseño Caribe (no negociable).
