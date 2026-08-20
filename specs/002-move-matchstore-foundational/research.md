# Research - Move MatchStore Foundational

## Decision 1: MatchStore se mueve a capa shared/foundational
- Decision: Reubicar MatchStore desde tareas de US2 hacia Foundational como servicio de estado compartido reutilizable.
- Rationale: Elimina la inconsistencia de dependencia US1 -> US2, preserva historias independientes y mantiene Clean Architecture porque la UI depende de un contrato estable, no de una implementación tardía.
- Alternatives considered:
  - Mantener MatchStore en US2 y crear un adapter temporal para US1: descartado por duplicación y deuda técnica.
  - Mover toda la lógica de estado a componentes de página: descartado por acoplamiento alto y pérdida de reutilización.

## Decision 2: Exponer puerto explícito MatchStorePort
- Decision: Definir una interfaz de consumo (MatchStorePort) en la capa de aplicación/shared para que US1 y demás historias usen operaciones estables.
- Rationale: Reduce acoplamiento a Signals internos y facilita test doubles en unit/e2e.
- Alternatives considered:
  - Inyectar clase concreta MatchStore en todas las páginas: descartado por acoplamiento fuerte.
  - Exponer state mutable pública: descartado por riesgo de violar invariantes.

## Decision 3: Implementación con Angular service + Signals encapsulados
- Decision: Implementar MatchStore como servicio singleton con estado privado Signal y API pública mínima (read models computados + comandos).
- Rationale: Compatible con Angular 20 zoneless, mantiene reactividad y encapsula transiciones de estado.
- Alternatives considered:
  - RxJS Subject-only store: viable, pero añade complejidad accidental frente al stack actual de Signals.
  - Librería externa de state management: descartado por alcance y simplicidad (YAGNI).

## Decision 4: Contrato de inicialización temprana en Composition Root
- Decision: Registrar MatchStore y su puerto en Foundational (app.config.ts y app.config.local.ts) antes de historias de usuario.
- Rationale: US1 necesita disponibilidad inmediata para persistir alias/tema sin depender de implementación de tablero.
- Alternatives considered:
  - Registro lazy por ruta board: descartado porque rompe independencia de US1.

## Decision 5: Estrategia de migración de tareas sin ruptura de IDs
- Decision: Mantener IDs existentes cuando sea posible y documentar mapeo antes/después para tareas relocalizadas.
- Rationale: Preserva trazabilidad histórica y facilita re-analyze.
- Alternatives considered:
  - Renumerar toda la fase: descartado por ruido y pérdida de historial de discusión.

## Decision 6: Validación de no regresión
- Decision: Añadir chequeos explícitos de dependencia (US1 sin dependencia de US2) y compatibilidad de contrato MatchStorePort en pruebas.
- Rationale: Cierra I1 y previene recurrencia del hallazgo.
- Alternatives considered:
  - Solo revisión manual de texto: insuficiente para evitar regresiones futuras.

## Open Clarifications Resolved
- Alcance técnico confirmado: Angular + TypeScript, estado compartido en servicio, interfaz desacoplada.
- Alcance funcional confirmado: cambio de planeación/arquitectura interna, sin nuevos requerimientos de producto.
