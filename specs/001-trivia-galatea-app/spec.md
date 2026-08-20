# Feature Specification: Trivia Galatea — Juego de Preguntas con IA

**Feature Branch**: `001-trivia-galatea-app`  
**Created**: 2026-08-18  
**Status**: Draft  
**Input**: Aplicación de trivia donde el usuario elige un tema, responde preguntas generadas por IA (mitad Galatea, mitad tema elegido) y recibe un título según su puntaje con efectos de celebración.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Registro de jugador y elección de tema (Priority: P1)

Un nuevo jugador llega a la aplicación, ingresa un alias con el que será identificado durante la partida y escribe el tema de su preferencia sobre el que quiere que le hagan preguntas. La aplicación procesa la solicitud y genera las 12 preguntas (6 Galatea + 6 del tema elegido) antes de mostrar el tablero.

**Why this priority**: Es el punto de entrada obligatorio. Sin alias ni tema no existe partida. Define la identidad del jugador y la personalización de la experiencia.

**Independent Test**: Se puede probar de forma completa ingresando un alias y un tema, verificando que la pantalla avanza al tablero con 12 tarjetas generadas.

**Acceptance Scenarios**:

1. **Given** la pantalla de inicio está visible, **When** el jugador ingresa un alias válido (2–30 caracteres) y un tema libre, **Then** la aplicación genera 12 preguntas (6 Galatea + 6 del tema) y muestra el tablero.
2. **Given** la pantalla de inicio está visible, **When** el jugador intenta avanzar con el campo de alias vacío, **Then** se muestra un mensaje de error accionable y el botón de continuar permanece deshabilitado.
3. **Given** la pantalla de inicio está visible, **When** el jugador ingresa un alias con menos de 2 caracteres, **Then** se muestra validación en línea con mensaje claro.
4. **Given** el sistema está generando preguntas vía IA, **When** la operación tarda más de 2 segundos, **Then** se muestra un indicador de carga con mensaje informativo al jugador.
5. **Given** el servicio de IA no está disponible, **When** el jugador intenta iniciar partida, **Then** la aplicación muestra un mensaje de error amigable con opción de reintentar.

---

### User Story 2 — Exploración del tablero y elección de tarjetas (Priority: P1)

El jugador ve un tablero con 12 tarjetas boca abajo, clasificadas visualmente como "Galatea" o por el tema elegido. Puede seleccionar libremente cuál tarjeta voltear. Al voltear una tarjeta aparece la pregunta con sus opciones de respuesta. El jugador elige una opción y confirma con el botón "Aceptar". El proceso se repite hasta completar 6 preguntas elegidas por el jugador.

**Why this priority**: Es el núcleo de la experiencia de juego. Todas las demás historias dependen de este flujo.

**Independent Test**: Se puede probar mostrando el tablero con preguntas mock, verificando la selección de tarjetas, la respuesta y la confirmación del flujo hasta llegar a 6 preguntas respondidas.

**Acceptance Scenarios**:

1. **Given** el tablero está visible con 12 tarjetas, **When** el jugador hace clic en una tarjeta, **Then** la tarjeta se voltea mostrando la pregunta y las opciones de respuesta (mínimo 4 opciones).
2. **Given** una tarjeta está volteada con su pregunta visible, **When** el jugador selecciona una opción de respuesta, **Then** la opción queda marcada visualmente y el botón "Aceptar" se habilita.
3. **Given** el jugador seleccionó una opción, **When** hace clic en "Aceptar", **Then** se muestra retroalimentación visual de respuesta correcta o incorrecta, la tarjeta queda marcada como respondida y el contador de preguntas elegidas se actualiza.
4. **Given** el jugador ya respondió 6 preguntas, **When** intenta voltear una séptima tarjeta, **Then** la acción está bloqueada y el flujo avanza automáticamente a la pantalla de resultados.
5. **Given** una tarjeta ya fue respondida, **When** el jugador intenta interactuar con ella nuevamente, **Then** la tarjeta permanece bloqueada y no permite una segunda respuesta.
6. **Given** una tarjeta está volteada con pregunta visible, **When** el jugador aún no ha seleccionado opción, **Then** el botón "Aceptar" permanece deshabilitado.

---

### User Story 3 — Cálculo de puntuación con multiplicador Galatea (Priority: P2)

A medida que el jugador responde preguntas de Galatea correctamente, acumula un multiplicador que potencia los puntos de TODAS sus respuestas correctas de Galatea. Las preguntas del tema elegido tienen puntuación fija de 10 puntos por acierto. La fórmula es:

`puntuación_total = (preguntas_galatea_correctas × 10) × preguntas_galatea_correctas + preguntas_tema_correctas × 10`

**Why this priority**: Es el diferenciador de diseño del juego. Define la estrategia de selección de tarjetas y el rango total de puntuación (0–360 pts).

**Independent Test**: Se puede probar con casos de prueba unitarios que validen la fórmula con distintas combinaciones de aciertos Galatea/tema, incluyendo los casos límite (0 aciertos y 6 galatea correctas).

**Acceptance Scenarios**:

1. **Given** el jugador responde 2 preguntas Galatea correctas y 3 del tema correctas, **When** se calcula la puntuación, **Then** el resultado es (2×10)×2 + 3×10 = 40+30 = 70 puntos.
2. **Given** el jugador responde 6 preguntas Galatea correctas (máximo posible), **When** se calcula la puntuación, **Then** el resultado es (6×10)×6 = 360 puntos (puntaje máximo).
3. **Given** el jugador no acierta ninguna pregunta, **When** se calcula la puntuación, **Then** el resultado es 0 puntos.
4. **Given** el jugador responde 0 preguntas Galatea y 6 del tema correctas, **When** se calcula la puntuación, **Then** el resultado es 0 + 60 = 60 puntos.
5. **Given** el jugador responde preguntas durante la partida, **When** ve el tablero, **Then** puede ver su puntuación parcial actualizada en tiempo real.

---

### User Story 4 — Pantalla de resultados y celebración (Priority: P2)

Al completar las 6 preguntas, el jugador ve una pantalla de resultados con su puntaje final, el título o nivel ganado centrado en pantalla, y efectos visuales de celebración acordes al nivel obtenido (colores, animaciones, confetti, etc.).

**Why this priority**: Es el cierre emocional de la experiencia. El nivel de celebración varía según el logro, lo cual refuerza el engagement y la recompensa al jugador.

**Independent Test**: Se puede probar mostrando la pantalla de resultados con distintos puntajes de entrada y verificando que el título y los efectos visuales correspondan al nivel correcto.

**Acceptance Scenarios**:

1. **Given** el jugador completó 6 preguntas, **When** se carga la pantalla de resultados, **Then** se muestra el alias del jugador, la puntuación total y el título del nivel ganado, centrado en pantalla.
2. **Given** el jugador obtuvo entre 0 y 59 puntos, **When** se muestra el resultado, **Then** el nivel es "Visitante" con efectos visuales sobrios.
3. **Given** el jugador obtuvo 360 puntos, **When** se muestra el resultado, **Then** el nivel es "Unicornio Galatea 🦄" con la celebración más elaborada (máxima intensidad de efectos).
4. **Given** la pantalla de resultados está visible, **When** el jugador hace clic en "Jugar de nuevo", **Then** regresa a la pantalla de inicio para comenzar una nueva partida.
5. **Given** la pantalla de resultados está visible, **When** el jugador la revisa, **Then** puede ver el detalle de sus respuestas: qué acertó, qué erró y la puntuación desglosada por categoría.

---

### Edge Cases

- ~~¿Qué sucede si la IA genera menos de 6 preguntas para el tema elegido?~~ **Resuelto (Q4)**: la app muestra mensaje amigable y regresa a selección de tema conservando el alias.
- ¿Qué pasa si el tema ingresado por el usuario está vacío, es ofensivo o contiene sólo espacios?
- ¿Cómo se comporta el tablero si el jugador cierra el navegador a mitad de partida y regresa?
- ¿Qué ocurre si dos preguntas del banco Galatea son idénticas o muy similares?
- ¿Qué sucede si el tiempo de respuesta de la IA supera 30 segundos?

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE solicitar al jugador un alias (2–30 caracteres) antes de iniciar la partida.
- **FR-002**: El sistema DEBE solicitar al jugador un tema libre de su preferencia para personalizar las preguntas.
- **FR-003**: El sistema DEBE generar exactamente 6 preguntas sobre el tema elegido usando un servicio de IA con acceso a internet. Si la IA no puede generar las 6 preguntas requeridas, el sistema DEBE mostrar un mensaje amigable al jugador (ej. "No encontré suficientes preguntas sobre ese tema, intenta con otro") y regresar a la pantalla de selección de tema conservando el alias ya ingresado.
- **FR-004**: El sistema DEBE seleccionar exactamente 6 preguntas sobre Galatea eligiendo aleatoriamente del banco curado (archivo JSON con ≥ 12 preguntas). Si el banco tiene menos de 6 preguntas disponibles, el sistema completa los slots restantes con preguntas generadas por IA usando la base de conocimiento de Galatea como contexto.
- **FR-005**: Cada pregunta DEBE tener exactamente 4 opciones de respuesta de selección múltiple con única respuesta correcta.
- **FR-006**: El tablero DEBE mostrar 12 tarjetas boca abajo, con etiqueta de categoría visible ("Galatea" o el nombre del tema elegido) en cada tarjeta.
- **FR-007**: El jugador DEBE poder seleccionar libremente qué tarjeta voltear, de a una por vez.
- **FR-008**: El sistema DEBE requerir que el jugador seleccione explícitamente una opción y confirme con "Aceptar" antes de registrar la respuesta.
- **FR-009**: El sistema DEBE limitar a 6 el número total de tarjetas que el jugador puede responder por partida.
- **FR-010**: El sistema DEBE calcular la puntuación usando la fórmula: `(N_galatea_correctas × 10) × N_galatea_correctas + N_tema_correctas × 10`.
- **FR-011**: El sistema DEBE mostrar el puntaje parcial actualizado en tiempo real mientras el jugador responde preguntas.
- **FR-012**: El sistema DEBE mostrar la pantalla de resultados automáticamente al completar la 6ª pregunta.
- **FR-013**: La pantalla de resultados DEBE mostrar: alias del jugador, puntuación total, título del nivel ganado y efectos visuales de celebración acordes al nivel.
- **FR-014**: El sistema DEBE asignar el título según la escala: 0–59=Visitante, 60–119=Explorador, 120–179=Aprendiz, 180–239=Constructor, 240–299=Estratega, 300–359=Maestro Galatea, 360=Unicornio Galatea 🦄.
- **FR-015**: La pantalla de resultados DEBE ofrecer la opción de iniciar una nueva partida.
- **FR-016**: El sistema DEBE mostrar retroalimentación inmediata (correcto/incorrecto) al confirmar cada respuesta.
- **FR-017**: El sistema DEBE mostrar un indicador de carga durante la generación de preguntas por IA.
- **FR-018**: El sistema DEBE enviar al servicio de IA externo únicamente el texto del tema elegido. El alias del jugador y cualquier otro dato de sesión NO deben incluirse en las peticiones a la IA.

### Key Entities

- **Jugador**: Participante de la partida. Atributos: alias (string), partida activa.
- **Partida**: Sesión de juego de un jugador. Atributos: tema elegido, 12 tarjetas generadas, 6 tarjetas elegidas, puntuación total, estado (en curso / completada).
- **Tarjeta**: Unidad del tablero. Atributos: categoría (Galatea | TemaElegido), pregunta asociada, estado (boca abajo | volteada | respondida), resultado (pendiente | correcta | incorrecta).
- **Pregunta**: Contenido de una tarjeta. Atributos: enunciado, 4 opciones de respuesta, respuesta correcta, categoría, fuente (banco curado | base conocimiento | generada por IA).
- **Puntuación**: Resultado de la partida. Atributos: puntos galatea, puntos tema, total, nivel asignado.
- **Nivel**: Rango de puntos con título y configuración de efectos visuales de celebración.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El jugador puede completar una partida completa (alias → tema → tablero → 6 preguntas → resultados) en menos de 5 minutos.
- **SC-002**: Las preguntas generadas por la IA son pertinentes al tema ingresado en el 95% de los casos (validación manual en pruebas de aceptación).
- **SC-003**: El tiempo de generación de preguntas no supera 8 segundos en el 90% de las partidas bajo condiciones normales de red.
- **SC-004**: El 100% de las partidas calcula y muestra el puntaje correcto según la fórmula especificada.
- **SC-005**: La pantalla de resultados muestra siempre el nivel correcto según el puntaje obtenido, en el 100% de los casos.
- **SC-006**: Los efectos de celebración de la pantalla de resultados difieren visiblemente entre al menos 3 niveles distintos.

### Accessibility Criteria *(mandatory — Principio VI)*

- Todos los componentes nuevos pasan axe-core sin violaciones.
- El flujo completo (inicio → tablero → pregunta → resultados) es navegable íntegramente por teclado.
- Las tarjetas del tablero anuncian su estado y categoría mediante `aria-label` apropiado.
- Las respuestas de preguntas son seleccionables con teclado (flechas/Tab/Enter).
- Los cambios de estado (respuesta correcta/incorrecta, nueva puntuación) se anuncian con `aria-live`.
- Lighthouse Accessibility score ≥ 95 en producción.

### Design System Criteria *(mandatory — Principio VII)*

- Todos los botones, inputs y tarjetas utilizan componentes del Design System Caribe de Bancolombia.
- Los tokens de color de los niveles de celebración se derivan de la paleta Caribe.
- Revisión visual confirmada (capturas de pantalla o Storybook) en el PR de cada pantalla.
- Ningún componente visual propio cuando Caribe ofrece un equivalente funcional.

---

## Assumptions

- **A-001**: La partida no persiste entre sesiones; cada vez que el jugador recarga la página, inicia una nueva partida desde cero. La persistencia de historial o ranking queda fuera del alcance de esta versión.
- **A-002**: El "regalo" mencionado en la descripción original equivale al título/nivel ganado mostrado en la pantalla de celebración. No implica integración con sistema de premios físicos ni digitales externos.
- **A-003**: Cada pregunta tiene exactamente 4 opciones de respuesta (una correcta, tres distractores), siguiendo el estándar de trivia de selección múltiple.
- **A-004**: El sistema de IA disponible tiene acceso a internet para buscar información sobre el tema elegido. La integración usa el servicio de IA existente en el proyecto.
- **A-005**: El banco de preguntas curadas de Galatea se provee como un archivo JSON con un mínimo de 12 preguntas estructuradas (enunciado, 4 opciones, respuesta correcta). La base de conocimiento de Galatea (documentos de texto) se usa como contexto para la generación por IA cuando el banco no alcanza para cubrir los 6 slots. Ninguno de estos archivos es gestionado dinámicamente por usuarios en esta versión.
- **A-006**: ~~(resuelto)~~ La fórmula `(N×10)×N` es la fuente de verdad confirmada. El ejemplo "60 puntos" para N=3 en el brief original es un error de redacción. N=3 galatea correctas = **90 puntos**, no 60. Confirmado en sesión de clarificación 2026-08-20.
- **A-007**: La aplicación es de escritorio/web (responsive). Soporte de dispositivos móviles es considerado pero no es requisito de esta versión.
- **A-008**: El alias del jugador no requiere autenticación ni verificación de unicidad; es sólo un nombre de pantalla para la sesión.
- **A-009**: Las 12 tarjetas del tablero siempre muestran exactamente 6 de Galatea y 6 del tema elegido; no se permite una distribución diferente.
- **A-010**: El alias del jugador es un dato de sesión local y nunca se transmite al servicio de IA externo. Sólo el string del tema elegido (texto público) sale de la aplicación hacia la IA.

---

## Clarifications

### Session 2026-08-20

- Q: ¿Cuál es la fuente de verdad para la fórmula de puntuación cuando el brief presenta un ejemplo inconsistente (N=3 → "60 pts")? → A: La fórmula matemática explícita `(N_galatea_correctas × 10) × N_galatea_correctas` es la fuente de verdad. N=3 galatea correctas = 90 pts. El valor "60" del brief original es un error de redacción.
- Q: ¿Hay restricciones de privacidad sobre qué datos pueden enviarse al servicio de IA externo? → A: Solo el texto del tema elegido (string público) se envía a la IA. El alias del jugador y cualquier dato de sesión permanecen locales. No se transmiten datos personales.
- Q: ¿Cuántas preguntas contiene el banco curado de Galatea y en qué formato se entrega? → A: Banco JSON con ≥ 12 preguntas curadas; el sistema elige 6 aleatoriamente por partida. Si hay menos de 6 disponibles, la IA completa los slots restantes usando la base de conocimiento de Galatea como contexto.
- Q: Si la IA no puede generar las 6 preguntas del tema elegido, ¿cómo debe comportarse la app? → A: Mostrar mensaje amigable ("No encontré suficientes preguntas sobre ese tema, intenta con otro") y regresar a la pantalla de selección de tema conservando el alias del jugador.
