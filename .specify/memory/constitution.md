<!--
SYNC IMPACT REPORT
==================
Version change: (new) → 1.0.0
Added sections: Core Principles (10), Quality Standards, Development Workflow, Governance
Removed sections: none (initial fill)
Templates requiring updates:
  ✅ constitution.md (this file — filled from template)
  ✅ plan-template.md — Constitution Check gates added below
  ✅ spec-template.md — Accessibility + Design System sections noted
  ✅ tasks-template.md — no structural changes required
Deferred TODOs: none
-->

# Trivia Galatea — Constitución del Proyecto

## Principios Fundamentales

### I. Arquitectura Limpia (NON-NEGOTIABLE)

El código DEBE organizarse en capas con dependencias que apuntan hacia adentro:
- **Dominio**: entidades, value objects, reglas de negocio, interfaces de repositorio — sin dependencias de frameworks.
- **Aplicación**: casos de uso (use cases) que orquestan el dominio — sin lógica de UI ni infraestructura directa.
- **Infraestructura**: implementaciones concretas de repositorios, servicios externos, Angular HttpClient.
- **Presentación**: componentes Angular, formularios, rutas — sólo invoca casos de uso, nunca lógica de dominio directamente.

Cruzar capas en dirección incorrecta NUNCA está permitido. Un componente no instancia ni importa clases del dominio directamente; usa un caso de uso inyectado.

### II. Diseño Orientado al Dominio (DDD)

El lenguaje ubicuo del negocio (Trivia Galatea / Bancolombia) DEBE reflejarse en el código:
- Los conceptos de negocio (Pregunta, Categoría, Partida, Jugador, Puntuación) son entidades de dominio de primera clase.
- Los bounded contexts DEBEN estar separados en módulos Angular distintos.
- Los eventos de dominio son preferibles a efectos secundarios acoplados.
- Toda decisión de diseño DEBE poder explicarse en términos del dominio, no de la tecnología.

### III. Nomenclatura Semántica y Código Autoexplicado

Los nombres de variables, funciones, clases y archivos DEBEN comunicar su intención sin necesidad de comentarios:
- Los nombres de funciones DEBEN describir QUÉ hacen: `calculatePlayerScore()`, no `calc()` ni `process()`.
- Los nombres de variables DEBEN describir QUÉ contienen: `remainingTimeInSeconds`, no `t` ni `time`.
- Los booleanos DEBEN usar prefijos `is`, `has`, `can`, `should`: `isAnswerCorrect`, `hasTimeExpired`.
- Los componentes DEBEN nombrarse por su rol de UI: `QuestionCardComponent`, `ScoreboardComponent`.
- Un comentario explicando QUÉ hace el código es señal de que el nombre debe mejorar.

### IV. Simplicidad Sobre Abstracción Prematura (YAGNI)

La complejidad DEBE justificarse con un caso de uso real y presente:
- No se crean abstracciones, interfaces ni patrones "por si acaso" se necesitan en el futuro.
- Una solución directa con 30 líneas SIEMPRE es preferible a un framework interno de 5 archivos.
- Los patrones de diseño (Factory, Strategy, Observer) se adoptan cuando el problema que resuelven existe HOY.
- La refactorización hacia abstracción ocurre cuando hay duplicación real (≥ 3 ocurrencias), no anticipada.

### V. Cobertura de Pruebas ≥ 80% (NON-NEGOTIABLE)

El código entregado DEBE cumplir:
- Cobertura de líneas y ramas ≥ 80% medida con Istanbul/Jest.
- Los casos de uso del dominio DEBEN tener cobertura ≥ 95% (lógica de negocio crítica).
- Las pruebas DEBEN seguir la nomenclatura `describe('nombreDelSujeto')` / `it('debeHacerAlgo')` en español o inglés consistente por archivo.
- El pipeline CI DEBE fallar si la cobertura desciende del umbral.
- Las pruebas de integración DEBEN cubrir los flujos de usuario completos (happy path + error path).

### VI. Accesibilidad Obligatoria (WCAG 2.1 AA — NON-NEGOTIABLE)

Toda interfaz entregada DEBE cumplir:
- Roles ARIA correctos en todos los elementos interactivos.
- Contraste mínimo de color: 4.5:1 para texto normal, 3:1 para texto grande.
- Navegación completa por teclado (Tab, Enter, Escape, flechas donde corresponda).
- Anuncios de cambios dinámicos con `aria-live` (resultados, temporizador, puntuación).
- Pruebas de accesibilidad automatizadas con `@axe-core/angular` en cada componente nuevo.
- No se acepta un PR que introduzca regresiones de accesibilidad.

### VII. Sistema de Diseño Bancolombia — Caribe (NON-NEGOTIABLE)

Todos los componentes visuales DEBEN usar el Design System Caribe de Bancolombia:
- Los tokens de color, tipografía y espaciado DEBEN venir exclusivamente de Caribe — no se crean valores ad-hoc.
- Los componentes de Caribe (botones, inputs, cards, modales) se usan tal como son; sólo se componen, no se reimplementan.
- Las variaciones visuales no contempladas en Caribe DEBEN aprobarse antes de introducirse.
- La consistencia visual entre pantallas DEBE verificarse en la revisión de PR con capturas o Storybook.

### VIII. Experiencia de Usuario Consistente

La UX DEBE seguir patrones predecibles a lo largo de toda la aplicación:
- Los estados de carga, error y vacío DEBEN existir para cada operación asíncrona.
- Los mensajes de error DEBEN ser accionables y en lenguaje de usuario (nunca mensajes técnicos en UI).
- Las transiciones y animaciones DEBEN respetar `prefers-reduced-motion`.
- Los flujos críticos (inicio de partida, respuesta a pregunta, fin de partida) DEBEN probarse con pruebas e2e.

### IX. Estándares de Rendimiento

La aplicación DEBE cumplir los siguientes umbrales medidos en producción:
- **First Contentful Paint (FCP)**: ≤ 1.5 s en conexión 4G simulada.
- **Largest Contentful Paint (LCP)**: ≤ 2.5 s.
- **Total Blocking Time (TBT)**: ≤ 200 ms.
- Los bundles de JavaScript DEBEN usar lazy loading por módulo/ruta; ningún bundle inicial supera 250 KB gzipped.
- Las imágenes y assets DEBEN estar optimizados antes de incluirse en el repositorio.
- El rendimiento DEBE medirse con Lighthouse en cada release.

### X. Calidad de Código y Deuda Técnica

El código DEBE pasar los siguientes controles antes de fusionarse:
- ESLint con ruleset Angular + strict TypeScript sin errores ni warnings ignorados ad-hoc.
- Prettier sin diferencias (formato uniforme no negociable).
- Sin `any` implícito ni explícito; TypeScript strict mode activado.
- Sin `console.log` en código de producción; usar un servicio de logging inyectable.
- La deuda técnica DEBE documentarse con `// TODO(author): descripción — fecha` y revisarse en cada sprint.
- Complejidad ciclomática por función ≤ 10 (medida por ESLint `complexity` rule).

## Estándares de Calidad

**Stack obligatorio**:
- Angular 17+ con Standalone Components y Signals.
- TypeScript strict mode (`"strict": true` en tsconfig).
- SCSS con variables del Design System Caribe.
- Jest + Angular Testing Library para unit tests.
- Cypress o Playwright para e2e.
- `@axe-core/angular` para pruebas de accesibilidad automatizadas.

**Umbrales de calidad no negociables**:

| Métrica | Umbral mínimo |
|---|---|
| Cobertura de líneas | ≥ 80 % |
| Cobertura de ramas | ≥ 80 % |
| Cobertura casos de uso | ≥ 95 % |
| Complejidad ciclomática | ≤ 10 por función |
| Bundle inicial (gzip) | ≤ 250 KB |
| Lighthouse Performance | ≥ 85 |
| Lighthouse Accessibility | ≥ 95 |

## Flujo de Desarrollo

**Antes de cada PR**:
1. `ng lint` sin errores.
2. `ng test --code-coverage` — cobertura ≥ 80 %.
3. `ng build --configuration production` sin warnings de presupuesto.
4. Revisión de accesibilidad con axe-core en componentes nuevos o modificados.
5. Al menos un revisor aprueba verificando cumplimiento de principios I–X.

**Nomenclatura de ramas**:
- `feat/###-nombre-corto` para funcionalidades.
- `fix/###-descripcion` para correcciones.
- `refactor/###-descripcion` para refactors (sin cambio de comportamiento).

**Commit messages**: Conventional Commits en español o inglés (consistente por PR).
Ejemplo: `feat(pregunta): agregar validación de tiempo de respuesta`.

## Governance

Esta constitución DEBE respetarse en todas las decisiones de diseño e implementación del proyecto. Es la fuente de verdad que resuelve conflictos de criterio entre el equipo.

**Enmiendas**: Cualquier cambio a esta constitución requiere:
1. Propuesta escrita con justificación de negocio o técnica.
2. Aprobación del equipo completo (al menos 2 revisores).
3. Incremento de versión según Semantic Versioning (MAJOR/MINOR/PATCH).
4. Actualización de este archivo y propagación a templates afectados.

**Cumplimiento**: Todo PR DEBE ser rechazado si viola un principio marcado NON-NEGOTIABLE.
Los principios sin esa marca DEBEN seguirse salvo justificación documentada en el PR.

**Versioning policy**:
- MAJOR: eliminación o redefinición de un principio NON-NEGOTIABLE.
- MINOR: adición de principio o sección nueva con impacto en el flujo de trabajo.
- PATCH: clarificaciones, ejemplos, correcciones tipográficas, ajuste de umbrales menores.

**Version**: 1.0.0 | **Ratified**: 2026-08-18 | **Last Amended**: 2026-08-18
