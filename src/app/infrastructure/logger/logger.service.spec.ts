import { LoggerService } from './logger.service';

describe('LoggerService', () => {
  let service: LoggerService;

  beforeEach(() => {
    service = new LoggerService();
  });

  it('debe delegar debug() en console.debug con el prefijo de la app', () => {
    const spy = jest.spyOn(console, 'debug').mockImplementation(() => undefined);

    service.debug('mensaje de depuración', { extra: 1 });

    expect(spy).toHaveBeenCalledWith('[trivia-galatea] mensaje de depuración', { extra: 1 });
    spy.mockRestore();
  });

  it('debe delegar info() en console.info con el prefijo de la app', () => {
    const spy = jest.spyOn(console, 'info').mockImplementation(() => undefined);

    service.info('mensaje informativo');

    expect(spy).toHaveBeenCalledWith('[trivia-galatea] mensaje informativo');
    spy.mockRestore();
  });

  it('debe delegar warn() en console.warn con el prefijo de la app', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    service.warn('mensaje de advertencia');

    expect(spy).toHaveBeenCalledWith('[trivia-galatea] mensaje de advertencia');
    spy.mockRestore();
  });

  it('debe delegar error() en console.error con el prefijo de la app', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    service.error('mensaje de error', new Error('detalle'));

    expect(spy).toHaveBeenCalledWith('[trivia-galatea] mensaje de error', new Error('detalle'));
    spy.mockRestore();
  });
});
