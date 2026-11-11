import type { Page } from '@playwright/test';

export const forecastResponse = {
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

export async function mockWeatherApi(page: Page) {
  await page.route('https://geocoding-api.open-meteo.com/v1/search?*', (route) =>
    route.fulfill({
      json: {
        results: [
          {
            id: 3448439,
            name: 'São Paulo',
            latitude: -23.5505,
            longitude: -46.6333,
            admin1: 'São Paulo',
            country: 'Brasil',
            country_code: 'BR',
          },
        ],
      },
    }),
  );
  await page.route('https://api.open-meteo.com/v1/forecast?*', (route) =>
    route.fulfill({ json: forecastResponse }),
  );
}
