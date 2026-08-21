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
4. **Given** la pantalla de resultados está visible, **When** el jugador hace clic en "Jugar de nuevo", **Then** regresa a la pantalla de inicio con el campo de alias pre-rellenado con el valor de la partida anterior (editable) y el campo de tema vacío para que el jugador elija un nuevo tema.
5. **Given** la pantalla de resultados está visible, **When** el jugador la revisa, **Then** puede ver el detalle de sus respuestas: qué acertó, qué erró y la puntuación desglosada por categoría.

---

### Edge Cases

- ~~¿Qué sucede si la IA genera menos de 6 preguntas para el tema elegido?~~ **Resuelto (Q4)**: la app muestra mensaje amigable y regresa a selección de tema conservando el alias.
- ~~¿Qué pasa si el tema ingresado por el usuario está vacío, es ofensivo o contiene sólo espacios?~~ **Resuelto**: si está vacío o contiene sólo espacios, la app bloquea continuar y muestra validación accionable; si contiene términos ofensivos/no aptos, muestra mensaje amigable y solicita reformular el tema antes de invocar IA.
- ~~¿Cómo se comporta el tablero si el jugador cierra el navegador a mitad de partida y regresa?~~ **Resuelto**: al regresar, la app inicia una partida nueva desde la pantalla inicial (sin restaurar progreso), consistente con no persistencia de sesión.
- ~~¿Qué ocurre si dos preguntas del banco Galatea son idénticas o muy similares?~~ **Resuelto**: la app evita duplicados dentro de la misma partida; si al deduplicar quedan menos de 6 preguntas válidas de Galatea, completa los cupos faltantes consultando IA con fuentes de información general de Galatea incluidas en el prompt.
- ~~¿Qué sucede si el tiempo de respuesta de la IA supera 30 segundos?~~ **Resuelto**: se considera timeout, se cancela la operación y se muestra mensaje amigable con opción de reintentar sin perder el alias.
- ~~¿Qué ocurre si el jugador intenta voltear una segunda tarjeta mientras hay una pregunta abierta sin responder?~~ **Resuelto**: el sistema permite una sola pregunta activa a la vez; bloquea abrir otra tarjeta hasta confirmar o cerrar la actual.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE solicitar al jugador un alias (2–30 caracteres) antes de iniciar la partida.
- **FR-002**: El sistema DEBE solicitar al jugador un tema libre de su preferencia para personalizar las preguntas. El texto del tema DEBE tener entre 3 y 60 caracteres (tras trim de espacios). Antes de invocar IA el sistema DEBE normalizar el tema (recorte de espacios extremos, colapso de espacios internos) y rechazar temas ofensivos/no aptos según FR-020. Las preguntas generadas DEBEN estar en español independientemente del idioma en que se ingrese el tema.
- **FR-003**: El sistema DEBE generar exactamente 6 preguntas sobre el tema elegido usando un servicio de IA con acceso a internet. Si la IA no puede generar las 6 preguntas requeridas, el sistema DEBE mostrar un mensaje amigable al jugador (ej. "No encontré suficientes preguntas sobre ese tema, intenta con otro") y regresar a la pantalla de selección de tema conservando el alias ya ingresado.
- **FR-004**: El sistema DEBE seleccionar exactamente 6 preguntas sobre Galatea eligiendo aleatoriamente del banco curado (archivo JSON con ≥ 12 preguntas). Si el banco tiene menos de 6 preguntas disponibles, el sistema completa los slots restantes con preguntas generadas por IA usando la base de conocimiento de Galatea como contexto. Si banco curado + fallback IA no logran completar 6 preguntas Galatea válidas, la partida NO inicia: se muestra error amigable, se conserva alias y se regresa a selección de tema con opción de reintento.
- **FR-005**: Cada pregunta DEBE tener exactamente 4 opciones de respuesta de selección múltiple con única respuesta correcta.
- **FR-005A**: El texto del enunciado de cada pregunta DEBE tener entre 30 y 180 caracteres, y cada opción DEBE tener entre 10 y 100 caracteres para garantizar legibilidad y consistencia visual en la tarjeta.
- **FR-006**: El tablero DEBE mostrar 12 tarjetas boca abajo, con etiqueta de categoría visible ("Galatea" o el nombre del tema elegido) y color de fondo diferenciado por categoría usando tokens Caribe, de modo que el jugador identifique visualmente el tipo de tarjeta sin necesidad de leer la etiqueta.
- **FR-007**: El jugador DEBE poder seleccionar libremente qué tarjeta voltear, de a una por vez.
- **FR-008**: El sistema DEBE requerir que el jugador seleccione explícitamente una opción y confirme con "Aceptar" antes de registrar la respuesta.
- **FR-009**: El sistema DEBE limitar a 6 el número total de tarjetas que el jugador puede responder por partida.
- **FR-010**: El sistema DEBE calcular la puntuación usando la fórmula: `(N_galatea_correctas × 10) × N_galatea_correctas + N_tema_correctas × 10`.
- **FR-011**: El sistema DEBE mostrar el puntaje parcial actualizado en tiempo real mientras el jugador responde preguntas.
- **FR-012**: El sistema DEBE mostrar la pantalla de resultados automáticamente al completar la 6ª pregunta.
- **FR-013**: La pantalla de resultados DEBE mostrar: alias del jugador, puntuación total, título del nivel ganado y efectos visuales de celebración acordes al nivel.
- **FR-014**: El sistema DEBE asignar el título según la escala: 0–59=Visitante, 60–119=Explorador, 120–179=Aprendiz, 180–239=Constructor, 240–299=Estratega, 300–359=Maestro Galatea, 360=Unicornio Galatea 🦄.
- **FR-015**: La pantalla de resultados DEBE ofrecer la opción de iniciar una nueva partida. Al activarla, la app navega a la pantalla de inicio con el alias de la partida anterior pre-rellenado (editable) y el campo de tema vacío.
- **FR-016**: El sistema DEBE mostrar retroalimentación inmediata (correcto/incorrecto) al confirmar cada respuesta.
- **FR-017**: El sistema DEBE mostrar un indicador de carga durante la generación de preguntas por IA.
- **FR-018**: En el flujo de generación de preguntas del tema elegido, el sistema DEBE enviar al servicio de IA externo únicamente el texto del tema elegido. El alias del jugador y cualquier otro dato de sesión NO deben incluirse en estas peticiones.
- **FR-019**: En el flujo de fallback de preguntas Galatea (cuando el banco curado tenga menos de 6 preguntas válidas), el sistema DEBE consultar IA enviando exclusivamente fuentes de información general de Galatea provistas para el prompt (sin alias ni datos de sesión), y completar hasta 6 preguntas Galatea para la partida.
- **FR-020**: El sistema DEBE validar el tema antes de invocar IA: no permitir tema vacío o de sólo espacios, y rechazar temas ofensivos/no aptos con mensaje accionable para reformular.
- **FR-021**: El sistema DEBE deduplicar preguntas de Galatea dentro de una misma partida; si tras deduplicar hay menos de 6 preguntas, DEBE completar faltantes vía FR-019.
- **FR-022**: El sistema DEBE mantener como máximo una pregunta activa (tarjeta volteada pendiente de confirmación) a la vez.
- **FR-023**: Si el jugador recarga o cierra y vuelve a abrir la aplicación durante una partida, el sistema DEBE iniciar una partida nueva en pantalla de inicio sin restaurar progreso previo.
- **FR-024**: Si cualquier llamada a IA supera 30 segundos, el sistema DEBE cancelar la operación, informar timeout en lenguaje amigable y ofrecer reintento conservando alias. Los reintentos automáticos DEBEN limitarse a 2 intentos con backoff corto (2s y 4s), y si siguen fallando, la app DEBE mostrar error final con reintento manual.
- **FR-025**: Si la conectividad falla antes de que la partida haya cargado las 12 preguntas y el tablero esté activo, la aplicación DEBE resetear la partida a la pantalla de inicio con mensaje amigable conservando únicamente el alias ya ingresado en la pantalla de error. Si la conectividad falla después de que las 12 preguntas ya están cargadas y el tablero está activo, la aplicación NO DEBE reiniciar la partida ni borrar el progreso; el jugador DEBE seguir jugando localmente sobre el estado ya cargado sin consultar IA.
- **FR-026**: La integración con IA DEBE usar API key restringida por HTTP Referer al dominio de GitHub Pages del evento (p. ej. `https://<org>.github.io/<repo>/*`) configurado en Google Cloud Console, más App Check habilitado en cliente. Esta configuración reduce el riesgo de abuso aunque no lo elimina completamente, dado que la key queda expuesta en el bundle cliente durante la ventana del evento.
- **FR-027**: Al cierre de la ventana del evento (aproximadamente 1 mes), la API key DEBE rotarse o deshabilitarse en Google Cloud Console antes de que transcurran 24 horas desde el fin del evento. Este paso es operativo y NO requiere redespliegue de código.
- **FR-028**: Si la sustitución de placeholders de anonimización falla o produce un resultado incompleto antes de construir el prompt de IA, el sistema DEBE cancelar la llamada a IA, mostrar un error amigable al jugador y no transmitir ningún prompt al servicio externo (fail-closed). Nunca se enviará un prompt con datos de sesión sin anonimizar.
- **FR-029**: Cuando existe una partida activa con al menos 1 tarjeta respondida y el jugador intenta cerrar o recargar la página, el sistema DEBE mostrar la advertencia nativa del navegador (`beforeunload`) indicando que el progreso se perderá. Si el jugador confirma, la partida se reinicia según FR-023.
- **FR-030**: Toda interpolación del alias del jugador en atributos `aria-*` DEBE escapar entidades HTML (`"` → `&quot;`, `'` → `&#x27;`, `<` → `&lt;`, `>` → `&gt;`) mediante un pipe Angular reutilizable, para evitar inyección de contenido accesible no esperado.
- **FR-031**: El botón que dispara la generación de preguntas vía IA DEBE deshabilitarse inmediatamente al primer clic y permanecer deshabilitado hasta que la operación complete o falle, para prevenir solicitudes concurrentes, consumo doble de cuota y estados inconsistentes en `MatchStore`.
- **FR-032**: El cliente DEBE limitar a un máximo de 3 solicitudes de generación de preguntas por sesión de navegador (contabilizando reintentos manuales del jugador), como salvaguarda frente a abuso de cuota durante la exposición pública en GitHub Pages. Al alcanzar el límite, la app DEBE mostrar un mensaje indicando que se agotaron los intentos y sugerir refrescar para iniciar una nueva sesión.

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
- **SC-006**: Los efectos de celebración de la pantalla de resultados difieren visiblemente entre al menos 3 niveles distintos, y cada uno de los 7 niveles de puntaje DEBE tener una variación visual distinta en color, intensidad y animación para distinguirlo claramente del siguiente nivel.

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
- **A-010**: El alias del jugador es un dato de sesión local y nunca se transmite al servicio de IA externo. En generación por tema libre sólo sale el string del tema; en fallback Galatea sólo sale contexto general de Galatea provisto para el prompt. Ninguna petición de IA incluye datos de sesión del jugador.
- **A-011**: La app se despliega en **GitHub Pages** con URL pública durante una ventana acotada de aproximadamente 1 mes (duración del evento). La exposición es pública e intencional; la mitigación principal es la restricción de HTTP Referer en la API key (FR-026), los límites de cuota diaria/por-minuto configurados en Google Cloud Console, y la baja/rotación de la key al cerrar la ventana (FR-027). Red local controlada es un escenario de contingencia, no el principal.

---

## Clarifications

### Session 2026-08-20

- Q: ¿Cuál es la fuente de verdad para la fórmula de puntuación cuando el brief presenta un ejemplo inconsistente (N=3 → "60 pts")? → A: La fórmula matemática explícita `(N_galatea_correctas × 10) × N_galatea_correctas` es la fuente de verdad. N=3 galatea correctas = 90 pts. El valor "60" del brief original es un error de redacción.
- Q: ¿Hay restricciones de privacidad sobre qué datos pueden enviarse al servicio de IA externo? → A: Solo el texto del tema elegido (string público) se envía a la IA. El alias del jugador y cualquier dato de sesión permanecen locales. No se transmiten datos personales.
- Q: ¿Cuántas preguntas contiene el banco curado de Galatea y en qué formato se entrega? → A: Banco JSON con ≥ 12 preguntas curadas; el sistema elige 6 aleatoriamente por partida. Si hay menos de 6 disponibles, la IA completa los slots restantes usando la base de conocimiento de Galatea como contexto.
- Q: Si la IA no puede generar las 6 preguntas del tema elegido, ¿cómo debe comportarse la app? → A: Mostrar mensaje amigable ("No encontré suficientes preguntas sobre ese tema, intenta con otro") y regresar a la pantalla de selección de tema conservando el alias del jugador.

### Session 2026-08-20 (ajustes post-analyze)

- Q: ¿Cómo se resuelve el conflicto I1 entre FR-004 y FR-018? → A: Se separan dos flujos: tema libre (solo string del tema) y fallback Galatea (solo contexto general de Galatea para prompt), en ambos casos sin alias ni datos de sesión.
- Q: ¿Qué hacer si faltan preguntas Galatea (<6) por baja disponibilidad o deduplicación? → A: Completar cupos faltantes consultando IA con fuentes de información general de Galatea incluidas en el prompt hasta llegar a 6 preguntas Galatea válidas.
- Q: ¿Cuál es el comportamiento esperado para U2 (una sola tarjeta activa)? → A: El sistema bloquea abrir una segunda tarjeta mientras exista una pregunta abierta sin confirmación.

### Session 2026-08-20 (security/error clarifications)

- Q: ¿Qué postura de seguridad se adopta para credenciales y operación del evento? → A: Se mantiene arquitectura frontend-only con API key restringida, App Check habilitado, rotación obligatoria post-evento y modelo de amenazas explícito de red interna controlada.
- Q: ¿Qué hacer si fallan banco curado y fallback IA para completar 6 preguntas Galatea? → A: Fallo total controlado: no iniciar partida, mostrar error amigable, conservar alias, volver a selección de tema y habilitar reintento.
- Q: ¿Cuál es la política de reintentos automáticos ante fallos de IA? → A: 2 reintentos automáticos con backoff corto (2s y 4s); si siguen fallando, se muestra error final con reintento manual del jugador.
- Q: ¿Qué pasa si la red se cae mientras el jugador ya tiene cargadas las 12 preguntas y está en la etapa de elegir tarjetas/responder? → A: Si la partida ya tiene el tablero cargado, no se reinicia ni se vuelve a inicio; la sesión sigue localmente sin consultar IA. Si cae antes de abrir el tablero, la app reinicia a inicio con mensaje amigable.

### Session 2026-08-21 (ux/security clarifications)

- Q: Al hacer clic en "Jugar de nuevo" desde resultados, ¿qué datos conserva la pantalla de inicio? → A: Alias pre-rellenado (editable), campo de tema vacío — el jugador elige un nuevo tema.
- Q: Si la sustitucón de placeholders de anonimización falla, ¿fail-open o fail-closed? → A: Fail-closed: cancelar llamada a IA, mostrar error amigable, no transmitir ningún prompt incompleto o sin anonimizar.
- Q: ¿Las tarjetas del tablero deben diferenciarse visualmente más allá de la etiqueta de texto? → A: Sí, color de fondo diferente por categoría (Galatea vs tema elegido) usando tokens Caribe, más etiqueta de texto.
- Q: ¿Debe la app advertir al jugador antes de que cierre/recargue a mitad de partida? → A: Sí, advertencia nativa `beforeunload` únicamente cuando hay ≥1 tarjeta respondida; si no hay progreso, no se muestra advertencia.
- Q: ¿Cómo manejar el alias al interpolarlo en atributos `aria-*`? → A: Escapar entidades HTML (`"`, `'`, `<`, `>`) mediante un pipe Angular reutilizable antes de cualquier interpolación en `aria-label` u otros atributos `aria-*`.
- Q: ¿Qué ocurre si el jugador dispara múltiples solicitudes concurrentes a la IA (p. ej. doble clic en Iniciar)? → A: El botón se deshabilita en el primer clic y solo se re-habilita al completar o fallar la operación; no se lanzan solicitudes concurrentes.
- Q: ¿Cómo se despliega la app y cuál es el modelo de amenazas real? → A: GitHub Pages pública durante ~1 mes (evento). Mitigación: HTTP Referer restriction en API key, cuota Google Cloud Console, límite de 3 solicitudes por sesión en cliente (FR-032), y baja/rotación de key al cerrar ventana (<24h post-evento).
