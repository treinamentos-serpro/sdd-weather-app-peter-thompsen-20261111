import { describe, expect, it } from 'vitest';
import { mockWeatherData } from '../../src/mocks/weatherData';
import type { WeatherData } from '../../src/types/weather';

describe('mockWeatherData', () => {
  it('fornece clima atual e cinco datas consecutivas para a cidade', () => {
    const data: WeatherData = mockWeatherData;

    expect(data.city.name).toBe('São Paulo');
    expect(data.timezone).toBe('America/Sao_Paulo');
    expect(data.current.temperatureC).not.toBeNull();
    expect(data.current.weatherCode).not.toBeNull();
    expect(data.current.humidityPercent).not.toBeNull();
    expect(data.current.windSpeedKmh).not.toBeNull();
    expect(data.current.precipitationMm).not.toBeNull();
    expect(data.current.surfacePressureHpa).not.toBeNull();
    expect(data.current.time?.slice(0, 10)).toBe(data.forecast[0]?.date);
    expect(data.isPartial).toBe(false);
    expect(data.forecast).toHaveLength(5);

    const firstDate = Date.parse(`${data.forecast[0]?.date}T00:00:00Z`);
    expect(Number.isFinite(firstDate)).toBe(true);

    for (const [index, day] of data.forecast.entries()) {
      expect(Date.parse(`${day.date}T00:00:00Z`)).toBe(firstDate + index * 86_400_000);
      expect(day.weatherCode).not.toBeNull();
      expect(day.minimumC).not.toBeNull();
      expect(day.maximumC).not.toBeNull();
      expect(day.precipitationProbabilityMaxPercent).not.toBeNull();
      if (day.minimumC !== null && day.maximumC !== null) {
        expect(day.minimumC).toBeLessThanOrEqual(day.maximumC);
      }
    }
  });
});
