# 📖 Guía de Instrucciones — Trivia Galatea

Este directorio contiene la documentación de arquitectura, estándares y convenciones del proyecto **Trivia Galatea**. Cada archivo `.instructions.md` define reglas y patrones para un aspecto específico del desarrollo.

---

## 🎯 Propósito del Proyecto

**Trivia Galatea** es una aplicación web de trivia con IA donde:

1. El participante elige un **tema libre** de su gusto (ej: Harry Potter, fútbol, Star Wars, historia).
2. La IA (**Gemini**) genera una ronda de preguntas mezclando dos categorías:
   - **~3–4 preguntas sobre Galatea**: obtenidas de una fuente de datos interna (FAQs, documentación, conceptos del ecosistema Galatea de Bancolombia).
   - **~3–4 preguntas sobre el tema elegido**: generadas completamente por Gemini en tiempo real (el tema puede ser cualquier cosa).
3. El participante responde las preguntas y acumula un **puntaje**.
4. Al finalizar, según su puntuación, puede ganar un **premio**.

---

## 🏛️ Modelo de Dominio (resumen)

| Concepto | Descripción |
|----------|-------------|
| `Participant` | Persona que juega. Tiene un nombre y un tema libre elegido. |
| `Topic` | Tema libre elegido por el participante (texto libre). |
| `Question` | Pregunta de trivia con enunciado, opciones y respuesta correcta. Tiene una `QuestionSource`. |
| `QuestionSource` | Origen de la pregunta: `'galatea'` (fuente interna) o `'free-topic'` (generada por Gemini). |
| `Quiz` | Ronda de juego: lista de preguntas mezcladas (Galatea + tema libre). |
| `Answer` | Respuesta dada por el participante a una pregunta. |
| `Score` | Puntaje acumulado de la ronda. |
| `Prize` | Premio asociado a un rango de puntuación. |

---

## 🗺️ Mapa de Documentos

### 📚 **Dominio de Negocio**

#### [`business-domain.instructions.md`](business-domain.instructions.md) — Entender el "QUÉ" y el "POR QUÉ"
**Aplica a:** `src/app/{domain,infrastructure}/**/*.ts`

Lee esto si necesitas:
- ✅ Entender las reglas de la trivia (ronda, puntuación, premios)
- ✅ Conocer los dos tipos de preguntas (`galatea` vs `free-topic`)
- ✅ Entender qué es responsabilidad del dominio vs la infraestructura
- ✅ Verificar invariantes antes de modelar nuevas entidades

---

### 🏗️ **Implementación Técnica del Frontend**

#### [`frontend-implementation.instructions.md`](frontend-implementation.instructions.md) — Entender el "CÓMO"
**Aplica a:** `src/app/**/*.ts`

Lee esto si necesitas:
- ✅ Navegar la estructura de carpetas Angular
- ✅ Entender el flujo de datos (Store → Usecase → Gateway → Service)
- ✅ Implementar nuevas páginas o componentes
- ✅ Configurar rutas y lazy loading
- ✅ Usar el sistema de diseño Caribe
- ✅ Escribir tests con Jest + TestBed
- ✅ Entender DI, signals, composables

---

### 🎨 **Arquitectura Limpia**

#### [`clean-architecture.instructions.md`](clean-architecture.instructions.md) — Reglas de diseño
**Aplica a:** `src/app/{domain,infrastructure,ui}/**/*.ts`

Define:
- Dirección de dependencias (UI → Dominio ← Infraestructura)
- Contrato de gateways
- Estructura de modelos de dominio
- Evitar violaciones arquitectónicas

---

### ⚡ **Signal Patterns**

#### [`signal-patterns.instructions.md`](signal-patterns.instructions.md) — Uso de Signals
**Aplica a:** `src/**/*.ts`

Define:
- Cuándo usar `signal()`, `computed()`, `effect()`, `input()`, `output()`
- Patrón Layered Derivation en stores
- Cómo componer signals sin efectos secundarios
- Testing de componentes con signals

---

### 🏗️ **Componentes Angular**

#### [`angular-component.instructions.md`](angular-component.instructions.md) — Estándares de componentes
**Aplica a:** `src/app/ui/components/**/*.ts`

Define:
- Estructura de componentes standalone
- Change detection strategy (OnPush)
- Uso de inputs/outputs signals
- Testeo de componentes
- Integración con Caribe Design System

---

### ✅ **Buenas Prácticas Angular**

#### [`angular-best-practices.instructions.md`](angular-best-practices.instructions.md) — Estándares generales
**Aplica a:** `**/*.{ts,html,scss}`

Define:
- Naming conventions
- Estructura de archivos
- Organización de imports
- Patrones comunes (pipes, directivas, etc.)

---

### ✨ **Reglas No Negociables**

#### [`golden-rules.instructions.md`](golden-rules.instructions.md) — Validación rápida
**Aplica a:** `**`

7 reglas críticas que **nunca** se pueden violar:
1. Arquitectura limpia — Dirección de dependencias
2. Construcción dominio-first
3. Frontend sin backend (offline-first)
4. Cobertura ≥ 90%
5. Dominio sin documentación técnica
6. Dominio primero — Validar antes de construir
7. Checklist rápido de validación

---

### 🎨 **Sistema de Diseño**

#### [`caribe-design-system.instructions.md`](caribe-design-system.instructions.md) — Caribe DS
**Aplica a:** `src/**/*.{ts,html,scss}`

Define:
- Uso correcto de componentes Caribe (`cb-*`)
- Tokens CSS del sistema de diseño
- Setup global de estilos

---

## 🎯 Cómo Usar Este Directorio

### 👤 Si eres **nuevo en el proyecto**
1. Lee esta guía — Entiende el propósito y modelo de dominio
2. Lee [`business-domain.instructions.md`](business-domain.instructions.md) — Entiende las reglas del juego
3. Lee [`golden-rules.instructions.md`](golden-rules.instructions.md) — Conoce las reglas críticas
4. Lee [`frontend-implementation.instructions.md`](frontend-implementation.instructions.md) — Domina la estructura técnica
5. Consulta archivos específicos según tu tarea

### 💻 Si estás **desarrollando una feature**
1. Consulta [`frontend-implementation.instructions.md`](frontend-implementation.instructions.md) — ¿Dónde va el código?
2. Consulta [`signal-patterns.instructions.md`](signal-patterns.instructions.md) — ¿Cómo hago el estado?
3. Consulta [`angular-component.instructions.md`](angular-component.instructions.md) — ¿Cómo escribo componentes?
4. Consulta [`clean-architecture.instructions.md`](clean-architecture.instructions.md) — ¿Respeto la arquitectura?

### 🐛 Si encuentras un **bug o anomalía**
1. Debuggea con [`frontend-implementation.instructions.md`](frontend-implementation.instructions.md)
2. Revisa [`golden-rules.instructions.md`](golden-rules.instructions.md) — ¿Hay violación de reglas?

### 🧪 Si estás **escribiendo tests**
1. Consulta [`angular-best-practices.instructions.md`](angular-best-practices.instructions.md) — Convenciones
2. Consulta [`signal-patterns.instructions.md`](signal-patterns.instructions.md) — Testing de signals

---

## ⚠️ Validación Rápida

Antes de hacer **cualquier commit**, verifica que NO violes:

| Regla | Pregunta | Documento |
|-------|----------|-----------|
| 1️⃣ | ¿El dominio sigue sin importar de UI o infra? | `clean-architecture.instructions.md` |
| 2️⃣ | ¿Los nombres del dominio son de negocio, no técnicos? | `clean-architecture.instructions.md` |
| 3️⃣ | ¿El frontend funciona sin backend (`ng serve`)? | `frontend-implementation.instructions.md` |
| 4️⃣ | ¿Cobertura de tests ≥ 90%? | `golden-rules.instructions.md` |
| 5️⃣ | ¿Los docs del dominio evitan jerga de infra? | `clean-architecture.instructions.md` |
| 6️⃣ | ¿El dominio resuelve la necesidad antes de tocar UI? | `golden-rules.instructions.md` |
| 7️⃣ | ¿Se respetan signals, OnPush y gateways? | `signal-patterns.instructions.md` + `angular-component.instructions.md` |

Ver detalles completos en [`golden-rules.instructions.md`](golden-rules.instructions.md).

---

## 📌 Recordatorios Clave

- **Las preguntas de Galatea** vienen de una fuente de datos interna — la infraestructura las consulta, el dominio no sabe cómo.
- **Las preguntas del tema libre** son generadas 100% por Gemini en tiempo real — el dominio solo conoce el resultado (`Question[]`), no cómo se generaron.
- **Cada archivo `.instructions.md` tiene un `applyTo`** — Define a qué archivos se aplica.
- **Las violaciones de Golden Rules detienen el PR** — No son sugerencias, son requisitos.

---

## 🔗 Enlaces Rápidos

| Necesidad | Documento |
|-----------|-----------|
| Entender las reglas del juego | [`business-domain.instructions.md`](business-domain.instructions.md) |
| Entender el flujo técnico de la trivia | [`frontend-implementation.instructions.md`](frontend-implementation.instructions.md#flujo-de-datos) |
| Crear un nuevo componente | [`angular-component.instructions.md`](angular-component.instructions.md) + [`signal-patterns.instructions.md`](signal-patterns.instructions.md) |
| Escribir un test | [`angular-best-practices.instructions.md`](angular-best-practices.instructions.md) |
| Validar que mi código cumple | [`golden-rules.instructions.md`](golden-rules.instructions.md) |
| Usar componentes Caribe | [`caribe-design-system.instructions.md`](caribe-design-system.instructions.md) |

---

**Última actualización:** Agosto 2026
**Versión:** 1.0
**Maintainers:** Equipo Trivia Galatea
