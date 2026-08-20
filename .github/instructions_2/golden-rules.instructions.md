---
applyTo: "**"
---

# Golden Rules — Reglas No Negociables

Estas reglas deben cumplirse **siempre**. Antes de generar, modificar o sugerir código, verificar que no se viole ninguna.

---

## 1. Arquitectura Limpia — Dirección de dependencias

```
UI → Dominio ← Infraestructura
```

- **Dominio**: independiente. No depende de UI, infraestructura, Angular, HTTP ni ninguna librería externa. Solo TypeScript puro y RxJS.
- **UI**: depende **solo** del dominio. Nunca importa de infraestructura.
- **Infraestructura**: depende **solo** del dominio. Nunca importa de UI. Es la responsable de traducir APIs externas a modelos de dominio.

---

## 2. Construcción de adentro hacia afuera (Dominio → afuera)

- El dominio se diseña desde el **lenguaje del negocio**, no desde la estructura de las APIs.
- Los nombres de campos, interfaces y documentación del dominio son **semánticos y de negocio**.
- Si la API devuelve `sum`, `qty`, `val` o cualquier nombre técnico, la infraestructura lo traduce al nombre de dominio (`savedHours`, `quantity`, `value`).
- Pueden necesitarse N llamadas a APIs para resolver un solo caso de uso. Ese es problema de la infraestructura, no del dominio.
- **Test mental**: si cambias de REST a GraphQL, WebSocket o un archivo JSON local, el dominio no cambia ni una línea.

---

## 3. El frontend funciona sin backend (offline-first en local)

- `ng serve` (sin parámetros) debe funcionar **sin conexión a internet**.
- La configuración por defecto en local usa mocks que simulan los gateways.
- El backend solo es necesario para **conectar a datos reales**, no para desarrollar.
- Para apuntar a un backend real se usa una configuración explícita (`--configuration=development`, `--configuration=qa`).

---

## 4. Cobertura de tests ≥ 90%

- Todo código nuevo debe tener tests unitarios.
- La cobertura global del proyecto no puede bajar del **90%**.
- El **código nuevo** (diferencial respecto a `trunk`) debe superar el **90% de cobertura** en SonarQube (Quality Gate: _Coverage on New Code ≥ 90%_).
- Los tests de casos de uso no necesitan `TestBed` (son unitarios puros con mocks).
- Los tests de componentes usan `TestBed` con mocks inline de los gateways.
- **No aplica cobertura** a: archivos de configuración de DI (`app.config.local.ts`, `app.config.ts`), archivos de solo exports (`index.ts`, `environment.*.ts`), ni implementaciones mock/fake de gateways (`*mock*.service.ts`).

---

## 5. El dominio no documenta infraestructura

- Los comentarios y JSDoc del dominio **nunca** mencionan endpoints, URLs, HTTP, bases de datos ni detalles técnicos de implementación.
- La documentación del dominio habla de **qué** hace el negocio, no de **cómo** se obtienen los datos.

---

## 6. Dominio primero — Validar antes de construir

- Antes de crear una nueva pantalla, funcionalidad o integración, **verificar que el dominio ya tenga los modelos, gateways y/o casos de uso necesarios**.
- Si no existen, **definir primero el dominio** (modelo + contrato del gateway) antes de tocar UI o infraestructura.
- Esto garantiza que el modelo de negocio guía el desarrollo, no la API ni el diseño visual.
- Orden obligatorio: **Dominio → UI + Infraestructura** (en paralelo, ambas dependen del dominio).

---

## 7. Resumen de validación rápida

Antes de aceptar cualquier cambio, verificar:

| Pregunta | Si la respuesta es NO → hay violación |
|---|---|
| ¿El dominio sigue sin importar de UI o infra? | Regla 1 |
| ¿La UI sigue sin importar de infra? | Regla 1 |
| ¿Los nombres del dominio son de negocio, no de API? | Regla 2 |
| ¿El mapeo API→dominio está en la infra? | Regla 2 |
| ¿`ng serve` funciona sin backend? | Regla 3 |
| ¿Los tests cubren ≥90%? | Regla 4 |
| ¿Los docs del dominio están libres de jerga de infra? | Regla 5 |
| ¿El dominio ya resuelve la necesidad antes de crear UI o infra? | Regla 6 |
