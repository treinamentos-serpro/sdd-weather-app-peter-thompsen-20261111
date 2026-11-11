import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchCities, WeatherServiceError } from '../../src/services/weatherService';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('searchCities', () => {
  it.each(['', '   ', '\n\t'])('retorna lista vazia sem rede para %j', async (name) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(searchCities(name)).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('codifica o nome aparado e mapeia todas as cidades e campos opcionais', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              id: 123,
              name: "São Tomé-d'Ávila",
              latitude: -23.5,
              longitude: -46.6,
              admin1: 'São Paulo',
              country: 'Brasil',
              country_code: 'BR',
            },
            { name: 'Outra cidade', latitude: 0, longitude: 0 },
          ],
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCities(" São Tomé-d'Ávila & mais ")).resolves.toEqual([
      {
        id: 123,
        name: "São Tomé-d'Ávila",
        latitude: -23.5,
        longitude: -46.6,
        admin1: 'São Paulo',
        country: 'Brasil',
        countryCode: 'BR',
      },
      {
        id: null,
        name: 'Outra cidade',
        latitude: 0,
        longitude: 0,
        admin1: null,
        country: null,
        countryCode: null,
      },
    ]);

    expect(fetchMock).toHaveBeenCalledOnce();
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain(`name=${encodeURIComponent("São Tomé-d'Ávila & mais")}`);
    expect(new URL(url).searchParams.get('name')).toBe("São Tomé-d'Ávila & mais");
    expect(new URL(url).searchParams.get('count')).toBe('10');
    expect(new URL(url).searchParams.get('language')).toBe('pt');
    expect(new URL(url).searchParams.get('format')).toBe('json');
  });

  it.each([
    {},
    { results: null },
    { results: [] },
  ])('retorna lista vazia quando não há correspondências: %j', async (body) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body))));
    await expect(searchCities('Inexistente')).resolves.toEqual([]);
  });

  it.each([
    { name: null, latitude: -8, longitude: -34 },
    { latitude: -8, longitude: -34 },
    { name: 'Recife', latitude: null, longitude: -34 },
    { name: 'Recife', longitude: -34 },
    { name: 'Recife', latitude: -8, longitude: null },
    { name: 'Recife', latitude: -8 },
  ])('rejeita cidade sem nome ou coordenadas obrigatórias %#', async (city) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ results: [city] }))),
    );
    await expect(searchCities('Recife')).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it('lança WeatherServiceError com status para erro HTTP', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('erro', { status: 503 })));
    const request = searchCities('Recife');
    await expect(request).rejects.toBeInstanceOf(WeatherServiceError);
    await expect(request).rejects.toMatchObject({
      name: 'WeatherServiceError',
      status: 503,
    });
  });

  it.each([
    'invalid json',
    'null',
    '{"results":{}}',
    '{"results":[{"name":"Recife","latitude":-8}]}',
    '{"results":[{"name":"Recife","latitude":-8,"longitude":181}]}',
    '{"results":[{"name":"Recife","latitude":-8,"longitude":-34,"admin1":42}]}',
  ])('lança WeatherServiceError para resposta inválida %s', async (body) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body)));
    await expect(searchCities('Recife')).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it('normaliza falhas de transporte sem tratá-las como ausência de resultados', async () => {
    const error = new TypeError('Falha de rede');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));
    await expect(searchCities('Recife')).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message: 'Falha de rede.',
    });
  });
});
