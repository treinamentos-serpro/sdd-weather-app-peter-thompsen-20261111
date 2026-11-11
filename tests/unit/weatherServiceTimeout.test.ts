import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockWeatherData } from '../../src/mocks/weatherData';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe.each([
  ['busca', () => searchCities('Recife')],
  ['previsão', () => getWeather(mockWeatherData.city)],
])('timeout de %s', (_name, request) => {
  it('aborta após exatamente 10 segundos e libera o timer', async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, options: RequestInit) => {
        signal = options.signal ?? undefined;
        return new Promise((_resolve, reject) => {
          signal?.addEventListener('abort', () =>
            reject(new DOMException('abortado', 'AbortError')),
          );
        });
      }),
    );

    const pending = request();
    const result = expect(pending).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message: 'A requisição demorou demais.',
    });
    await vi.advanceTimersByTimeAsync(9_999);
    expect(signal?.aborted).toBe(false);
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    await result;
    expect(signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('limpa o timer e normaliza falhas de rede', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('conexão interrompida')));
    await expect(request()).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message: 'Falha de rede.',
    });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('limpa o timer ao receber HTTP não-ok', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));
    await expect(request()).rejects.toMatchObject({ name: 'WeatherServiceError', status: 503 });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('mantém o timeout ativo durante a leitura do corpo', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, options: RequestInit) => {
        const body = new ReadableStream({
          start(stream) {
            options.signal?.addEventListener('abort', () =>
              stream.error(new DOMException('abortado', 'AbortError')),
            );
          },
        });
        return Promise.resolve(new Response(body));
      }),
    );
    const pending = request();
    const result = expect(pending).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message: 'A requisição demorou demais.',
    });
    await vi.advanceTimersByTimeAsync(10_000);
    await result;
    expect(vi.getTimerCount()).toBe(0);
  });
});

it('limpa o timer depois de uma resposta bem-sucedida', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"results":[]}')));
  await expect(searchCities('Recife')).resolves.toEqual([]);
  expect(vi.getTimerCount()).toBe(0);
});

it('propaga erros não relacionados à rede sem mascará-los', async () => {
  vi.useFakeTimers();
  const error = new Error('erro inesperado');
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));
  await expect(searchCities('Recife')).rejects.toBe(error);
  expect(vi.getTimerCount()).toBe(0);
});

it('converte AbortError em WeatherServiceError mesmo antes do prazo', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('abortado', 'AbortError')));
  await expect(searchCities('Recife')).rejects.toBeInstanceOf(WeatherServiceError);
  expect(vi.getTimerCount()).toBe(0);
});
