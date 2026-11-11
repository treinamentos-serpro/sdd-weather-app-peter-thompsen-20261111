import type { WeatherData } from '../types/weather';

export const mockWeatherData = {
  city: {
    id: 3448439,
    name: 'São Paulo',
    admin1: 'São Paulo',
    country: 'Brasil',
    countryCode: 'BR',
    latitude: -23.5505,
    longitude: -46.6333,
  },
  timezone: 'America/Sao_Paulo',
  fetchedAt: '2026-11-11T12:00:00.000Z',
  current: {
    temperatureC: 22.4,
    weatherCode: 2,
    time: '2026-11-11T09:00',
    humidityPercent: 68,
    windSpeedKmh: 12.5,
    precipitationMm: 0,
    surfacePressureHpa: 1013.2,
  },
  forecast: [
    {
      date: '2026-11-11',
      weatherCode: 2,
      minimumC: 17.1,
      maximumC: 25,
      precipitationProbabilityMaxPercent: 30,
    },
    {
      date: '2026-11-12',
      weatherCode: 3,
      minimumC: 18,
      maximumC: 26.1,
      precipitationProbabilityMaxPercent: 45,
    },
    {
      date: '2026-11-13',
      weatherCode: 61,
      minimumC: 17.4,
      maximumC: 24.7,
      precipitationProbabilityMaxPercent: 80,
    },
    {
      date: '2026-11-14',
      weatherCode: 1,
      minimumC: 16.8,
      maximumC: 25.3,
      precipitationProbabilityMaxPercent: 20,
    },
    {
      date: '2026-11-15',
      weatherCode: 0,
      minimumC: 17.2,
      maximumC: 26,
      precipitationProbabilityMaxPercent: 0,
    },
  ],
  isPartial: false,
} satisfies WeatherData;
