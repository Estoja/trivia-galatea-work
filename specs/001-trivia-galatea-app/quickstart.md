# Quickstart: Trivia Galatea

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

Guía para levantar el proyecto localmente y entender el flujo de entrega de contenido curado.

---

## 1. Requisitos previos

- Node.js LTS + Angular CLI 20.
- Acceso al registro Artifactory de Bancolombia para los paquetes `@bancolombia/caribe-*` (`.npmrc` con token, ver `GETTINGSTARTED.md` del proyecto hermano `agentic-angular-vertex` como referencia de configuración).
- (Opcional, sólo para el modo real con IA) Configuración de Firebase App para Vertex AI (Gemini).

---

## 2. Instalación

```bash
npm install
```

---

## 3. Modos de ejecución

### 3.1 Modo mock (sin API key, recomendado para desarrollo de UI)

Usa `app.config.local.ts`, que provee `QuestionMockService` con preguntas hardcodeadas (ambas fuentes). No requiere variables de entorno ni conexión a Gemini.

```bash
ng serve --configuration=local
```

### 3.2 Modo real (con IA de Gemini)

1. Crear un archivo `.env` (no versionado, ya debe estar en `.gitignore`) en la raíz del proyecto con:

   ```
   FIREBASE_API_KEY=tu-api-key
   FIREBASE_APP_ID=tu-app-id
   FIREBASE_MESSAGING_SENDER_ID=tu-messaging-sender-id
   FIREBASE_PROJECT_ID=tu-project-id
   FIREBASE_AUTH_DOMAIN=tu-auth-domain
   FIREBASE_STORAGE_BUCKET=tu-storage-bucket
   FIREBASE_MEASUREMENT_ID=tu-measurement-id
   ```

2. El script de build inyecta estas variables en `environment.development.ts` / `environment.ts` dentro del bloque `firebase` (nunca hardcodeado en el repo).
3. `app.config.ts` inicializa Firebase App y Vertex AI (`@angular/fire/vertexai`), y `GeminiClientService` consume ese provider.
3. Ejecutar:

   ```bash
   ng serve
   ```

### 3.3 Exposición local durante el evento presencial

No hay backend ni despliegue en la nube (A-001). Para exponer el juego a los asistentes desde el mismo computador:

```bash
ng serve --host 0.0.0.0 --port 4200
```

Los asistentes se conectan a `http://<ip-local-del-computador>:4200` desde la misma red Wi-Fi del evento.

---

## 4. Entregar/actualizar el banco de preguntas curado

El archivo vive en `public/assets/galatea-questions.json` y debe cumplir el esquema en [contracts/galatea-question-bank.schema.json](./contracts/galatea-question-bank.schema.json).

**Pasos para curar contenido nuevo**:

1. Redactar cada pregunta usando **placeholders anonimizados**, nunca los nombres reales:
   - `Bancolombia` → escribir `Empresa X`
   - `Galatea` → escribir `Proyecto Y`
2. Verificar que cada pregunta tenga exactamente 4 opciones y un `correctOptionIndex` válido (0–3).
3. Asegurar un mínimo de 12 preguntas en el archivo.
4. Validar el archivo contra el JSON Schema antes de integrarlo (cualquier validador JSON Schema draft-07 estándar).
5. Colocar el archivo en `public/assets/galatea-questions.json` — el frontend se encarga de traducir los placeholders a los nombres reales en pantalla (nunca se edita el mapper por cada pregunta nueva).

Ver el detalle completo de la estrategia de anonimización en [research.md §1](./research.md) y [contracts/gemini-prompt-contract.md](./contracts/gemini-prompt-contract.md).

---

## 5. Comandos de calidad

```bash
npm test              # Jest + Angular Testing Library, cobertura ≥80% (usecases ≥95%)
npm run test:a11y     # axe-core (Principio VI)
npm run e2e           # Cypress/Playwright — flujo completo US1→US4
npm run lint          # ESLint + reglas de Clean Architecture
```

---

## 6. Estructura rápida de referencia

```
src/app/
  domain/          # Modelos, enums, gateways abstractos, usecases puros
  infrastructure/   # QuestionService, GeminiClient, mappers, QuestionMockService
  ui/               # Páginas (welcome, board, results), componentes, MatchStore
```

Ver el árbol completo en [plan.md — Project Structure](./plan.md).
