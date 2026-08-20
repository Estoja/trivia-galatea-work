# Data Model - Move MatchStore Foundational

## 1. MatchStorePort
Representa el contrato público consumible por US1 y demás historias, sin exponer detalles de implementación.

### Fields / Surface
- viewState: lectura reactiva de estado agregado de partida (solo lectura).
- playerAlias: lectura reactiva del alias actual (solo lectura).
- chosenTopic: lectura reactiva del tema actual (solo lectura).
- answeredCount: lectura reactiva de respuestas confirmadas.
- isMatchComplete: lectura reactiva del estado de finalización.
- liveScore: lectura reactiva de puntaje parcial.

### Commands
- initializeSession(alias, topic): inicia o reinicia la sesión mínima de juego.
- setQuestions(cards): carga tarjetas iniciales de la partida.
- openCard(cardId): marca una tarjeta como activa si no hay otra abierta.
- confirmAnswer(cardId, optionId): confirma respuesta y actualiza score derivado.
- resetSession(): limpia estado y vuelve a baseline.

### Validation Rules
- No permitir más de una tarjeta activa simultánea.
- No permitir más de 6 respuestas confirmadas.
- Ignorar comandos inválidos sin corromper estado.

## 2. MatchStoreService (Implementación)
Servicio Angular singleton en shared/foundational que implementa MatchStorePort.

### Internal State
- _playerAlias: Signal<string>
- _chosenTopic: Signal<string>
- _cards: Signal<CardState[]>
- _activeCardId: Signal<string | null>
- _answers: Signal<AnswerRecord[]>

### Derived State
- answeredCount: computed(() => _answers().length)
- isMatchComplete: computed(() => answeredCount() >= 6)
- liveScore: computed(() => calculateMatchScore(_answers()))

### Invariants
- activeCardId debe apuntar a una tarjeta existente o null.
- Cada cardId puede tener máximo una respuesta confirmada.
- Las transiciones de estado respetan el orden: faceDown -> flipped -> answered.

## 3. DependencyRule
Modelo lógico para documentar reglas de dependencia en tasks.

### Fields
- sourceTaskId
- targetTaskId
- reason
- phase

### Constraints
- sourceTaskId perteneciente a US1 no puede apuntar a targetTaskId de US2.
- Dependencias técnicas transversales deben ubicarse en Setup o Foundational.

## 4. TaskRelocation
Entidad documental para trazabilidad de tareas movidas.

### Fields
- taskId
- fromPhase
- toPhase
- dependencyDelta
- checkpointImpact

### Rules
- taskId permanece estable cuando no cambia semántica funcional.
- Si una tarea se divide, registrar splitMap explícito.
