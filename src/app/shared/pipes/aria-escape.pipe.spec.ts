import { AriaEscapePipe } from './aria-escape.pipe';

describe('AriaEscapePipe', () => {
  const pipe = new AriaEscapePipe();

  it('escapa comillas dobles', () => {
    expect(pipe.transform('Tema "especial"')).toBe('Tema &quot;especial&quot;');
  });

  it('escapa comillas simples', () => {
    expect(pipe.transform("Tema 'especial'")).toBe('Tema &#x27;especial&#x27;');
  });

  it('escapa los signos menor-que y mayor-que', () => {
    expect(pipe.transform('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('escapa múltiples caracteres combinados en una sola cadena', () => {
    expect(pipe.transform(`<a href="x" title='y'>`)).toBe('&lt;a href=&quot;x&quot; title=&#x27;y&#x27;&gt;');
  });

  it('devuelve el texto sin cambios cuando no contiene caracteres a escapar', () => {
    expect(pipe.transform('Fútbol')).toBe('Fútbol');
  });

  it('devuelve cadena vacía para null, undefined o cadena vacía', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });
});
