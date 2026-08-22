import { Pipe, PipeTransform } from '@angular/core';

/**
 * Escapa entidades HTML (`"`, `'`, `<`, `>`) en texto libre de usuario antes
 * de interpolarlo en atributos `aria-*`, para evitar inyección de contenido
 * accesible no esperado (FR-030).
 */
@Pipe({ name: 'ariaEscape' })
export class AriaEscapePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    return value
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
