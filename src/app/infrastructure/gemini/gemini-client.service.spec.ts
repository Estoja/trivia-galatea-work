import { TestBed } from '@angular/core/testing';
import { VertexAI, getGenerativeModel } from '@angular/fire/vertexai';
import {
  GEMINI_MAX_REQUESTS_PER_SESSION,
  GEMINI_MAX_RETRIES,
  GEMINI_TIMEOUT_MS,
  GeminiClientService,
  GeminiRequestLimitExceededError,
} from './gemini-client.service';

jest.mock('@angular/fire/vertexai', () => ({
  VertexAI: class {},
  getGenerativeModel: jest.fn(),
}));

describe('GeminiClientService', () => {
  let service: GeminiClientService;
  let generateContentMock: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    sessionStorage.clear();
    generateContentMock = jest.fn();
    (getGenerativeModel as jest.Mock).mockReturnValue({ generateContent: generateContentMock });

    TestBed.configureTestingModule({
      providers: [GeminiClientService, { provide: VertexAI, useValue: {} }],
    });
    service = TestBed.inject(GeminiClientService);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('retorna el texto crudo de la respuesta cuando Gemini responde exitosamente', async () => {
    generateContentMock.mockResolvedValue({ response: { text: () => '{"questions":[]}' } });

    let result: string | undefined;
    service.generateJson('prompt').subscribe((text) => (result = text));

    await jest.advanceTimersByTimeAsync(0);

    expect(result).toBe('{"questions":[]}');
    expect(generateContentMock).toHaveBeenCalledTimes(1);
  });

  it('reintenta hasta 2 veces con backoff 2s/4s antes de tener éxito (FR-024)', async () => {
    generateContentMock
      .mockRejectedValueOnce(new Error('fail-1'))
      .mockRejectedValueOnce(new Error('fail-2'))
      .mockResolvedValueOnce({ response: { text: () => '{"questions":[]}' } });

    let result: string | undefined;
    service.generateJson('prompt').subscribe((text) => (result = text));

    await jest.advanceTimersByTimeAsync(0);
    await jest.advanceTimersByTimeAsync(2_000);
    await jest.advanceTimersByTimeAsync(4_000);

    expect(generateContentMock).toHaveBeenCalledTimes(1 + GEMINI_MAX_RETRIES);
    expect(result).toBe('{"questions":[]}');
  });

  it('propaga el error final si Gemini sigue fallando tras 2 reintentos (FR-024)', async () => {
    generateContentMock.mockRejectedValue(new Error('persistent-failure'));

    let error: unknown;
    service.generateJson('prompt').subscribe({ error: (err) => (error = err) });

    await jest.advanceTimersByTimeAsync(0);
    await jest.advanceTimersByTimeAsync(2_000);
    await jest.advanceTimersByTimeAsync(4_000);

    expect(generateContentMock).toHaveBeenCalledTimes(1 + GEMINI_MAX_RETRIES);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe('persistent-failure');
  });

  it('cancela la operación por timeout tras 30s si Gemini no responde (FR-024)', async () => {
    generateContentMock.mockReturnValue(new Promise(() => {})); // never resolves

    let error: unknown;
    service.generateJson('prompt').subscribe({ error: (err) => (error = err) });

    await jest.advanceTimersByTimeAsync(GEMINI_TIMEOUT_MS);
    await jest.advanceTimersByTimeAsync(2_000);
    await jest.advanceTimersByTimeAsync(GEMINI_TIMEOUT_MS);
    await jest.advanceTimersByTimeAsync(4_000);
    await jest.advanceTimersByTimeAsync(GEMINI_TIMEOUT_MS);

    expect(generateContentMock).toHaveBeenCalledTimes(1 + GEMINI_MAX_RETRIES);
    expect(error).toBeDefined();
  });

  describe('límite de solicitudes por sesión (FR-032)', () => {
    beforeEach(() => {
      generateContentMock.mockResolvedValue({ response: { text: () => '{"questions":[]}' } });
    });

    it(`permite hasta ${GEMINI_MAX_REQUESTS_PER_SESSION} solicitudes por sesión`, async () => {
      for (let i = 0; i < GEMINI_MAX_REQUESTS_PER_SESSION; i++) {
        let result: string | undefined;
        service.generateJson('prompt').subscribe((text) => (result = text));
        await jest.advanceTimersByTimeAsync(0);
        expect(result).toBe('{"questions":[]}');
      }

      expect(generateContentMock).toHaveBeenCalledTimes(GEMINI_MAX_REQUESTS_PER_SESSION);
    });

    it('bloquea la solicitud número 4 sin llamar a Gemini y lanza GeminiRequestLimitExceededError', async () => {
      for (let i = 0; i < GEMINI_MAX_REQUESTS_PER_SESSION; i++) {
        service.generateJson('prompt').subscribe();
        await jest.advanceTimersByTimeAsync(0);
      }
      generateContentMock.mockClear();

      let error: unknown;
      service.generateJson('prompt').subscribe({ error: (err) => (error = err) });
      await jest.advanceTimersByTimeAsync(0);

      expect(error).toBeInstanceOf(GeminiRequestLimitExceededError);
      expect(generateContentMock).not.toHaveBeenCalled();
    });

    it('cuenta una solicitud fallida (con reintentos) como una única solicitud de la sesión', async () => {
      generateContentMock.mockRejectedValue(new Error('fail'));

      service.generateJson('prompt').subscribe({ error: () => undefined });
      await jest.advanceTimersByTimeAsync(0);
      await jest.advanceTimersByTimeAsync(2_000);
      await jest.advanceTimersByTimeAsync(4_000);

      expect(generateContentMock).toHaveBeenCalledTimes(1 + GEMINI_MAX_RETRIES);

      generateContentMock.mockClear();
      generateContentMock.mockResolvedValue({ response: { text: () => '{"questions":[]}' } });
      service.generateJson('prompt').subscribe();
      await jest.advanceTimersByTimeAsync(0);

      expect(generateContentMock).toHaveBeenCalledTimes(1);
    });
  });
});
