import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockWeatherData } from '../../src/mocks/weatherData';
import { getWeather, WeatherServiceError } from '../../src/services/weatherService';

const city = mockWeatherData.city;

function forecastResponse() {
  return {
    timezone: 'America/Sao_Paulo',
    current: {
      time: '2026-11-11T09:00',
      temperature_2m: 22.4,
      weather_code: 2,
      relative_humidity_2m: 68,
      wind_speed_10m: 12.5,
      precipitation: 0,
      surface_pressure: 1013.2,
    },
    daily: {
      time: ['2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15'],
      weather_code: [2, 3, 61, 1, 0],
      temperature_2m_min: [17.1, 18, 17.4, 16.8, 17.2],
      temperature_2m_max: [25, 26.1, 24.7, 25.3, 26],
      precipitation_probability_max: [30, 45, 80, 20, 0],
    },
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function prepare(body: unknown) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-11T12:00:00Z'));
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body)));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('getWeather', () => {
  it('solicita os campos e mapeia cinco dias, unidades e cidade', async () => {
    const fetchMock = prepare(forecastResponse());
    const data = await getWeather(city);
    expect(data).toEqual(mockWeatherData);
    expect(fetchMock).toHaveBeenCalledOnce();
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast');
    expect(url.searchParams.get('latitude')).toBe(String(city.latitude));
    expect(url.searchParams.get('longitude')).toBe(String(city.longitude));
    expect(url.searchParams.get('current')).toBe(
      'temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,precipitation,surface_pressure',
    );
    expect(url.searchParams.get('daily')).toBe(
      'weather_code,temperature_2m_min,temperature_2m_max,precipitation_probability_max',
    );
    expect(url.searchParams.get('forecast_days')).toBe('5');
    expect(url.searchParams.get('timezone')).toBe('auto');
    expect(url.searchParams.get('temperature_unit')).toBe('celsius');
    expect(url.searchParams.get('wind_speed_unit')).toBe('kmh');
    expect(url.searchParams.get('precipitation_unit')).toBe('mm');
  });

  it('preenche datas ausentes sem deslocar valores dos arrays paralelos', async () => {
    const body = forecastResponse();
    body.daily.time.splice(1, 1);
    body.daily.weather_code.splice(1, 1);
    body.daily.temperature_2m_min.splice(1, 1);
    body.daily.temperature_2m_max.splice(1, 1);
    body.daily.precipitation_probability_max.splice(1, 1);
    prepare(body);
    const data = await getWeather(city);
    expect(data.isPartial).toBe(true);
    expect(data.forecast).toHaveLength(5);
    expect(data.forecast[1]).toEqual({
      date: '2026-11-12',
      weatherCode: null,
      minimumC: null,
      maximumC: null,
      precipitationProbabilityMaxPercent: null,
    });
    expect(data.forecast[2].weatherCode).toBe(61);
  });

  it('preserva null e zero em respostas parciais', async () => {
    const body = forecastResponse();
    body.daily.temperature_2m_min.pop();
    prepare(body);
    const data = await getWeather(city);
    expect(data.isPartial).toBe(true);
    expect(data.forecast[4].minimumC).toBeNull();
    expect(data.forecast[4].precipitationProbabilityMaxPercent).toBe(0);
    expect(data.current.precipitationMm).toBe(0);
  });

  it('distingue precipitação atual ausente de zero', async () => {
    const body = forecastResponse();
    prepare({ ...body, current: { ...body.current, precipitation: null } });

    const data = await getWeather(city);
    expect(data.current.precipitationMm).toBeNull();
    expect(data.isPartial).toBe(true);
    expect(data.forecast[4].precipitationProbabilityMaxPercent).toBe(0);
  });

  it('distingue probabilidade diária ausente de zero', async () => {
    const body = forecastResponse();
    prepare({
      ...body,
      daily: { ...body.daily, precipitation_probability_max: [null, 45, 80, 20, 0] },
    });

    const data = await getWeather(city);
    expect(data.forecast[0].precipitationProbabilityMaxPercent).toBeNull();
    expect(data.forecast[4].precipitationProbabilityMaxPercent).toBe(0);
    expect(data.current.precipitationMm).toBe(0);
    expect(data.isPartial).toBe(true);
  });

  it.each([
    ['temperature_2m', 'temperatureC'],
    ['weather_code', 'weatherCode'],
    ['time', 'time'],
    ['relative_humidity_2m', 'humidityPercent'],
    ['wind_speed_10m', 'windSpeedKmh'],
    ['precipitation', 'precipitationMm'],
    ['surface_pressure', 'surfacePressureHpa'],
  ])('normaliza %s atual ausente ou nulo para %s null', async (source, target) => {
    for (const value of [null, undefined]) {
      const body = forecastResponse();
      prepare({ ...body, current: { ...body.current, [source]: value } });
      const data = await getWeather(city);
      expect(data.current).toHaveProperty(target, null);
      expect(data.isPartial).toBe(true);
    }
  });

  it.each([
    ['weather_code', 'weatherCode'],
    ['temperature_2m_min', 'minimumC'],
    ['temperature_2m_max', 'maximumC'],
    ['precipitation_probability_max', 'precipitationProbabilityMaxPercent'],
  ])('normaliza coluna ou valor diário %s ausente para %s null', async (source, target) => {
    for (const value of [null, undefined, [null]]) {
      const body = forecastResponse();
      prepare({ ...body, daily: { ...body.daily, [source]: value } });
      const data = await getWeather(city);
      expect(data.forecast).toHaveLength(5);
      expect(data.forecast[0]).toHaveProperty(target, null);
      expect(data.forecast[4]).toHaveProperty(target, null);
      expect(data.isPartial).toBe(true);
    }
  });

  it.each([
    { current: { temperature_2m: 1e308 } },
    { daily: { temperature_2m_min: [1e308] } },
    { daily: { temperature_2m_max: [-1e308] } },
  ])('rejeita temperatura que não pode ser convertida para Fahrenheit %#', async (partial) => {
    const body = forecastResponse();
    prepare({
      ...body,
      current: { ...body.current, ...partial.current },
      daily: { ...body.daily, ...partial.daily },
    });
    await expect(getWeather(city)).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it.each([
    { timezone: null },
    { timezone: undefined },
    { current: undefined },
    { daily: undefined },
    { daily: { time: null } },
    { daily: { time: undefined } },
  ])('rejeita metadados essenciais ausentes %#', async (partial) => {
    prepare({ ...forecastResponse(), ...partial });
    await expect(getWeather(city)).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it('calcula a data de hoje no fuso da cidade, inclusive na virada UTC', async () => {
    const body = forecastResponse();
    prepare(body);
    vi.setSystemTime(new Date('2026-11-12T01:00:00Z'));
    expect((await getWeather(city)).forecast[0].date).toBe('2026-11-11');
  });

  it.each([
    { timezone: 'America/Sao_Paulo', daily: {} },
    { timezone: 'America/Sao_Paulo', current: {} },
    { ...forecastResponse(), current: null },
    { ...forecastResponse(), daily: null },
    { ...forecastResponse(), timezone: 'invalid' },
    { ...forecastResponse(), daily: { time: ['2026-02-31'] } },
    { ...forecastResponse(), current: { temperature_2m: 'quente' } },
  ])('rejeita estrutura ausente ou inválida %#', async (body) => {
    prepare(body);
    await expect(getWeather(city)).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it('rejeita HTTP não-ok e JSON inválido', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('', { status: 503 })));
    await expect(getWeather(city)).rejects.toMatchObject({
      status: 503,
      name: 'WeatherServiceError',
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('{')));
    await expect(getWeather(city)).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it('não consulta rede para coordenadas inválidas e normaliza falha de transporte', async () => {
    const error = new TypeError('Falha de rede');
    const fetchMock = vi.fn().mockRejectedValue(error);
    vi.stubGlobal('fetch', fetchMock);
    await expect(getWeather({ ...city, latitude: 91 })).rejects.toBeInstanceOf(WeatherServiceError);
    expect(fetchMock).not.toHaveBeenCalled();
    await expect(getWeather(city)).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message: 'Falha de rede.',
    });
  });
});
