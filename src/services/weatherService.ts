import { formatForecastDate } from '../lib/format';
import { convertTemperature } from '../lib/temperature';
import type { City, CurrentWeather, ForecastDay, WeatherData } from '../types/weather';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const TIMEOUT_MS = 10_000;

export class WeatherServiceError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'WeatherServiceError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function fetchWithTimeout(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const receivedAt = new Date();
    const body = response.ok ? await response.text() : null;
    return { response, body, receivedAt };
  } catch (error) {
    if (isRecord(error) && error.name === 'AbortError') {
      throw new WeatherServiceError('A requisição demorou demais.');
    }
    if (error instanceof TypeError) {
      throw new WeatherServiceError('Falha de rede.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function optionalString(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || typeof value === 'string';
}

function mapCity(value: unknown): City {
  if (
    !isRecord(value) ||
    typeof value.name !== 'string' ||
    !value.name.trim() ||
    typeof value.latitude !== 'number' ||
    !Number.isFinite(value.latitude) ||
    value.latitude < -90 ||
    value.latitude > 90 ||
    typeof value.longitude !== 'number' ||
    !Number.isFinite(value.longitude) ||
    value.longitude < -180 ||
    value.longitude > 180 ||
    (value.id !== undefined && value.id !== null && !Number.isSafeInteger(value.id)) ||
    !optionalString(value.admin1) ||
    !optionalString(value.country) ||
    !optionalString(value.country_code)
  ) {
    throw new WeatherServiceError('Resposta de geocodificação inválida.');
  }

  return {
    id: typeof value.id === 'number' ? value.id : null,
    name: value.name,
    admin1: value.admin1 ?? null,
    country: value.country ?? null,
    countryCode: value.country_code ?? null,
    latitude: value.latitude,
    longitude: value.longitude,
  };
}

export async function searchCities(name: string): Promise<City[]> {
  const query = name.trim();
  if (!query) return [];

  const { response, body } = await fetchWithTimeout(
    `${GEOCODING_URL}?name=${encodeURIComponent(query)}&count=10&language=pt&format=json`,
  );
  if (!response.ok) {
    throw new WeatherServiceError('Não foi possível buscar cidades.', response.status);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body ?? '');
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new WeatherServiceError('Resposta de geocodificação inválida.');
    }
    throw error;
  }

  if (!isRecord(payload)) {
    throw new WeatherServiceError('Resposta de geocodificação inválida.');
  }
  if (payload.results === undefined || payload.results === null) return [];
  if (!Array.isArray(payload.results)) {
    throw new WeatherServiceError('Resposta de geocodificação inválida.');
  }

  return payload.results.map(mapCity);
}

function invalidForecast(): never {
  throw new WeatherServiceError('Resposta de previsão inválida ou incompleta.');
}

function nullableNumber(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) return invalidForecast();
  return value;
}

function nullableTemperature(value: unknown): number | null {
  const temperature = nullableNumber(value);
  if (temperature !== null && !Number.isFinite(convertTemperature(temperature, 'fahrenheit'))) {
    return invalidForecast();
  }
  return temperature;
}

function localDate(instant: Date, timezone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(instant);
    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;
    if (!year || !month || !day) return invalidForecast();
    return `${year}-${month}-${day}`;
  } catch (error) {
    if (error instanceof RangeError) return invalidForecast();
    throw error;
  }
}

function mapForecast(payload: unknown, city: City, receivedAt: Date): WeatherData {
  if (
    !isRecord(payload) ||
    !isRecord(payload.current) ||
    !isRecord(payload.daily) ||
    typeof payload.timezone !== 'string' ||
    !payload.timezone.trim()
  ) {
    return invalidForecast();
  }

  const source = payload.current;
  if (
    source.time != null &&
    (typeof source.time !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(source.time) ||
      formatForecastDate(source.time.slice(0, 10)) === null)
  ) {
    return invalidForecast();
  }
  const current: CurrentWeather = {
    temperatureC: nullableTemperature(source.temperature_2m),
    weatherCode: nullableNumber(source.weather_code),
    time: typeof source.time === 'string' ? source.time : null,
    humidityPercent: nullableNumber(source.relative_humidity_2m),
    windSpeedKmh: nullableNumber(source.wind_speed_10m),
    precipitationMm: nullableNumber(source.precipitation),
    surfacePressureHpa: nullableNumber(source.surface_pressure),
  };
  const daily = payload.daily;
  if (!Array.isArray(daily.time)) return invalidForecast();

  const columns = [
    daily.weather_code,
    daily.temperature_2m_min,
    daily.temperature_2m_max,
    daily.precipitation_probability_max,
  ];
  if (columns.some((column) => column != null && !Array.isArray(column))) {
    return invalidForecast();
  }
  const rows = new Map<string, number>();
  for (const [index, date] of daily.time.entries()) {
    if (typeof date !== 'string' || formatForecastDate(date) === null || rows.has(date)) {
      return invalidForecast();
    }
    rows.set(date, index);
  }
  const firstDate = localDate(receivedAt, payload.timezone);
  const start = Date.parse(`${firstDate}T00:00:00Z`);
  const forecast: ForecastDay[] = Array.from({ length: 5 }, (_, offset) => {
    const date = new Date(start + offset * 86_400_000).toISOString().slice(0, 10);
    const index = rows.get(date);
    const values = columns.map((column, columnIndex) => {
      const value = index !== undefined && Array.isArray(column) ? column[index] : null;
      return columnIndex === 1 || columnIndex === 2
        ? nullableTemperature(value)
        : nullableNumber(value);
    });
    return {
      date,
      weatherCode: values[0],
      minimumC: values[1],
      maximumC: values[2],
      precipitationProbabilityMaxPercent: values[3],
    };
  });
  const isPartial =
    Object.values(current).some((value) => value === null) ||
    forecast.some((day) => Object.values(day).some((value) => value === null));
  if (
    Object.values(current).every((value) => value === null) &&
    forecast.every(
      (day) =>
        day.weatherCode === null &&
        day.minimumC === null &&
        day.maximumC === null &&
        day.precipitationProbabilityMaxPercent === null,
    )
  ) {
    return invalidForecast();
  }
  return {
    city,
    timezone: payload.timezone,
    fetchedAt: receivedAt.toISOString(),
    current,
    forecast,
    isPartial,
  };
}

export async function getWeather(city: City): Promise<WeatherData> {
  if (
    !Number.isFinite(city.latitude) ||
    city.latitude < -90 ||
    city.latitude > 90 ||
    !Number.isFinite(city.longitude) ||
    city.longitude < -180 ||
    city.longitude > 180
  ) {
    throw new WeatherServiceError('Coordenadas da cidade inválidas.');
  }
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current:
      'temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,precipitation,surface_pressure',
    daily: 'weather_code,temperature_2m_min,temperature_2m_max,precipitation_probability_max',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    precipitation_unit: 'mm',
    timezone: 'auto',
    forecast_days: '5',
  });
  const { response, body, receivedAt } = await fetchWithTimeout(`${FORECAST_URL}?${params}`);
  if (!response.ok)
    throw new WeatherServiceError('Não foi possível consultar a previsão.', response.status);
  let payload: unknown;
  try {
    payload = JSON.parse(body ?? '');
  } catch (error) {
    if (error instanceof SyntaxError) return invalidForecast();
    throw error;
  }
  return mapForecast(payload, city, receivedAt);
}
