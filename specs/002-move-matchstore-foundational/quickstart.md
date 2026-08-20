# Quickstart - Move MatchStore Foundational

## 1. Preconditions
- Rama activa: 002-trivia-galatea-app.
- Feature directory activo en .specify/feature.json apuntando a specs/002-move-matchstore-foundational.
- Backlog base existente en specs/001-trivia-galatea-app/tasks.md.

## 2. Apply Planning Change
1. Abrir tasks de la feature base.
2. Identificar tareas relacionadas con MatchStore (creación + registro DI + dependencias de US1).
3. Reubicar esas tareas a Foundational conservando IDs cuando no cambie semántica.
4. Actualizar sección Dependencies & Execution Order para que US1 dependa solo de Setup + Foundational.
5. Ajustar checkpoints para reflejar que Foundational habilita disponibilidad de estado compartido.

## 3. Contract-First Validation
1. Validar que consumidores de US1 se acoplan al contrato MatchStorePort y no a campos privados de implementación.
2. Verificar que el contrato cubre operaciones mínimas para alias/tema, carga de preguntas y transición de tarjetas.
3. Confirmar que no se agregaron capacidades fuera del alcance documental.

## 4. Quality Gates
- Re-ejecutar análisis de consistencia (speckit.analyze) y validar cierre del issue de dependencia US1/US2.
- Confirmar que SC-002 y SC-003 siguen cubiertos en tasks base (sin pérdida por la migración).
- Confirmar que no hay cambios de requisitos funcionales de producto.

## 5. Done Criteria
- MatchStore definido como fundacional compartido.
- US1 independiente de US2 para ejecución y prueba.
- Dependencias/checkpoints/coherencia documental alineadas.

## 6. Validacion Ejecutada (T030)

### Resultado
- Validacion documental de migracion: PASS.
- Prerrequisitos SpecKit: PASS.
- Cobertura automatizada para cambios de codigo: BLOCKED en este repo por ausencia de `package.json` en la raiz actual de la feature.

### Discrepancias registradas
1. El repositorio de especificacion activo (`trivia-galatea`) no contiene pipeline npm ejecutable para correr cobertura local de los archivos `src/` agregados durante esta migracion.
2. Se deja evidencia del intento y del bloqueo en `checklists/migration-acceptance.md` para cierre transparente.
