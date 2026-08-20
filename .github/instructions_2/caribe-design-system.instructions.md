---
applyTo: "src/**/*.{ts,html,scss}"
---

# Caribe Design System — Implementación desde Cero

> Reglas para integrar el sistema de diseño **Caribe** (`@bancolombia/caribe-design-system`) en un proyecto Angular nuevo. Basado en la implementación de referencia de este repositorio (Angular 20, standalone, zoneless, signals).

---

## 1. Identidad del sistema

- **Paquete principal**: `@bancolombia/caribe-design-system`
- **Paquete de marca**: `@bancolombia/caribe-brand-bancolombia`
- **Prefijo de componentes**: `cb-` (ej: `cb-loader`, `cb-icon`, `cb-status`).
- **Tecnología**: cada componente es un **Web Component standalone** renderizado con `ViewEncapsulation.ShadowDom`.
- **Importación granular**: siempre por subpath, nunca desde la raíz del paquete.
- **Tokens de diseño**: variables CSS con prefijo `--cb-sys-*` (colores, tipografía, espaciado, radios).
- **Assets** (íconos, logos, fuentes): se sirven desde el CDN `https://library-sdb.apps.bancolombia.com`.

---

## 2. Instalación

### 2.1 Registro de paquetes (Artifactory)

Los paquetes `@bancolombia/*` viven en el Artifactory interno, no en el npm público. Configurar `.npmrc` en la raíz:

```ini
@bancolombia:registry=https://artifactory.apps.bancolombia.com/artifactory/api/npm/npm-bancolombia/
```

### 2.2 Dependencias en `package.json`

```jsonc
"dependencies": {
  "@bancolombia/caribe-design-system": "^1.0.0-alpha.65",
  "@bancolombia/caribe-brand-bancolombia": "^1.0.0-alpha.2"
}
```

> Mantener **alineada** la versión del CDN de assets (`index.html`) con la versión instalada del paquete. Desalinearlas produce íconos o logos faltantes.

---

## 3. Configuración global obligatoria

### 3.1 `angular.json`

```jsonc
"inlineStyleLanguage": "scss",
"styles": ["src/styles.scss"]
```

### 3.2 `src/styles.scss` — Tema y clases del sistema

```scss
@use '@bancolombia/caribe-design-system' as cb;
@use '@bancolombia/caribe-brand-bancolombia' as cb-brand;

// Habilita las clases utilitarias del sistema (cb-icon-*, tipografía, etc.)
@include cb.system-classes();

html {
  height: 100%;
  // Aplica el tema de la marca + overrides
  @include cb.theme(cb-brand.$config, cb-brand.$overrides);
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  color-scheme: light;
  background-color: var(--cb-sys-background-secondary-01);
  color: var(--cb-sys-text-default);
  font: var(--cb-sys-plain-font-style-4-regular);
  margin: 0;
  height: 100%;
}
```

**Reglas:**
1. `@include cb.system-classes()` es obligatorio para que funcionen las clases utilitarias (`cb-icon-*`, tipografías).
2. El tema se aplica con `cb.theme(cb-brand.$config, cb-brand.$overrides)` sobre `html`.
3. Usar **siempre** tokens `--cb-sys-*` para colores, tipografía y fondos. Nunca hardcodear valores de color de marca.

### 3.3 `src/index.html` — Assets del CDN

```html
<link rel="preconnect" href="https://library-sdb.apps.bancolombia.com" crossorigin />
<link href="https://library-sdb.apps.bancolombia.com/assets/1.22.0/icons/functionals/icon.css" rel="stylesheet" />
<link href="https://library-sdb.apps.bancolombia.com/assets/1.22.0/logos/functionals/logo.css" rel="stylesheet" />
<link href="https://library-sdb.apps.bancolombia.com/assets/1.22.0/fonts/Open_Sans/Open_Sans.css" rel="stylesheet" />
<link href="https://library-sdb.apps.bancolombia.com/assets/1.22.0/fonts/CIBFont/CIBFont.css" rel="stylesheet" />
```

**Reglas:**
1. Incluir `preconnect` al CDN para mejorar el tiempo de carga.
2. Cargar `icon.css`, `logo.css` y ambas fuentes (`Open_Sans`, `CIBFont`).
3. Versionar la URL del CDN (`/assets/X.Y.Z/`) de forma consistente en todos los `<link>`.

### 3.4 `app.config.ts` — Provider del logo

El componente `cb-logo` requiere un provider que apunte a la ruta de assets:

```typescript
import { provideLogoConfig } from '@bancolombia/caribe-design-system/logo';

export const appConfig: ApplicationConfig = {
  providers: [
    // ...otros providers
    provideLogoConfig({
      path: 'https://library-sdb.apps.bancolombia.com/assets/1.20.0',
    }),
  ],
};
```

> Replicar este provider en **todas** las variantes de configuración de la app (ej: `app.config.local.ts`), de lo contrario el logo no carga en esos modos.

---

## 4. Uso de componentes en código

### 4.1 Importación granular por subpath

Siempre importar desde el subpath del componente, nunca desde la raíz:

```typescript
// ✅ Correcto
import { CbLoader } from '@bancolombia/caribe-design-system/loader';
import { CbStatus } from '@bancolombia/caribe-design-system/status';
import { CbIcon } from '@bancolombia/caribe-design-system/icon';

// ❌ Incorrecto — no importar desde la raíz
import { CbLoader } from '@bancolombia/caribe-design-system';
```

### 4.2 Declaración en componentes standalone

Agregar cada componente Caribe al array `imports` del componente que lo usa:

```typescript
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CbLogo } from '@bancolombia/caribe-design-system/logo';
import { CbIcon } from '@bancolombia/caribe-design-system/icon';

@Component({
  selector: 'bcw-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CbLogo, CbIcon],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {}
```

### 4.3 Uso en plantilla

```html
<cb-loader sizeLoader="5xl" ariaLabel="Cargando" speedLoader="2"></cb-loader>

<cb-status
  type="only"
  color="status-success-3"
  radius="radius-16"
  [text]="(value | number:'1.0-0') + 'H'"
></cb-status>

<cb-logo [size]="'250px'" [name]="'bancolombia-horizontal-no-spacing'"></cb-logo>
```

---

## 5. Catálogo de componentes utilizados en este proyecto

| Componente | Subpath de import | Clase | Uso típico |
|---|---|---|---|
| Loader | `/loader` | `CbLoader` | Estados de carga (`sizeLoader`, `ariaLabel`, `speedLoader`) |
| Status | `/status` | `CbStatus` | Badges/etiquetas de estado (`type`, `color`, `radius`, `text`) |
| Icon | `/icon` | `CbIcon` | Íconos (`fontIcon`, `size`, `tooltipId`) |
| Icon Button | `/icon-button` | `CbIconButton` | Botón de solo ícono |
| Link | `/link` | `CbLink` | Enlaces (`href`, `iconRight`, `sizeLink`) |
| Tag Button | `/tag-button` | `CbTagButton` | Botón tipo tag (`typeTag`, `textLabel`, `variation`, `(onClickButton)`) |
| Tooltip | `/tooltip` | `CbTooltip` | Tooltips (`text`, `position`, `referenceId`, `showArrow`, `showClose`) |
| Logo | `/logo` | `CbLogo` | Logo de marca — requiere `provideLogoConfig` |

> Para componentes nuevos, importar siempre desde su subpath correspondiente (`@bancolombia/caribe-design-system/<nombre>`).

---

## 6. Íconos — dos formas válidas

1. **Componente `cb-icon`** (preferido cuando se necesita interacción o tooltip):

```html
<cb-icon fontIcon="information" size="sm" tabindex="0" tooltipId="tooltip-kpi"></cb-icon>
```

2. **Clase utilitaria CSS** (cuando solo es decorativo dentro de otro elemento):

```html
<span class="cb-icon-chevron-right" aria-hidden="true"></span>
```

> Las clases `cb-icon-*` solo funcionan si `cb.system-classes()` está incluido en `styles.scss` (sección 3.2) y `icon.css` está cargado (sección 3.3).

---

## 7. Reglas no negociables

1. **No aplicar estilos externos a los internos de los componentes Caribe.** Son Shadow DOM: los estilos del host no penetran. Para personalizar, usar únicamente las `@Input()` / atributos expuestos por el componente o tokens `--cb-sys-*`.
2. **Configuraciones complejas vía objetos tipados.** Componentes con muchas opciones reciben un objeto `@Input()` tipado en lugar de múltiples atributos sueltos.
3. **Componentes propios** (no-Caribe) usan prefijo de proyecto (`bcw-`), nunca `cb-`.
4. **Tokens, no valores hardcodeados.** Colores, tipografías y radios provienen de `--cb-sys-*`.
5. **Versión de assets alineada** entre `package.json`, `index.html` y `provideLogoConfig`.
6. **Importación granular** siempre por subpath; nunca desde la raíz del paquete.
7. **Accesibilidad**: proveer `ariaLabel` / `textAriaLabel` en componentes interactivos (loaders, botones, tags).

---

## 8. Checklist de implementación desde cero

- [ ] `.npmrc` apunta al Artifactory de Bancolombia.
- [ ] `package.json` incluye `caribe-design-system` + `caribe-brand-bancolombia`.
- [ ] `angular.json`: `inlineStyleLanguage: "scss"` y `styles: ["src/styles.scss"]`.
- [ ] `styles.scss`: `@use` de ambos paquetes + `cb.system-classes()` + `cb.theme(...)`.
- [ ] `body` usa tokens `--cb-sys-*`.
- [ ] `index.html`: `preconnect` + `icon.css` + `logo.css` + fuentes `Open_Sans` y `CIBFont`.
- [ ] `app.config.ts` (y variantes) registran `provideLogoConfig`.
- [ ] Versión del CDN alineada con la versión del paquete instalado.
- [ ] Primer componente Caribe importado por subpath y declarado en `imports`.
