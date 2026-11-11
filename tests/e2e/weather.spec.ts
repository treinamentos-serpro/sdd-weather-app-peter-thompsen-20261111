import { expect, test } from '@playwright/test';
import { forecastResponse, mockWeatherApi } from './weatherMock';

test('busca uma cidade e converte a temperatura para Fahrenheit', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-11T12:00:00Z'));
  await mockWeatherApi(page);
  await page.goto('/');

  await page.getByLabel('Cidade').fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar' }).click();

  const current = page.getByRole('region', { name: 'Clima atual' });
  const forecast = page.getByRole('region', { name: 'Previsão para cinco dias' });
  await expect(current.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
  await expect(current.getByText('22,4 °C', { exact: true })).toBeVisible();
  await expect(forecast).toBeVisible();
  await expect(forecast.getByRole('listitem')).toHaveCount(5);
  await expect(forecast.getByText('25 °C', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: '°F' }).click();
  await expect(page.getByRole('button', { name: '°F' })).toHaveAttribute('aria-pressed', 'true');
  await expect(current.getByText('72 °F', { exact: true })).toBeVisible();
  await expect(forecast.getByText('77 °F', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: '°C' }).click();
  await expect(current.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
  await expect(current.getByText('22,4 °C', { exact: true })).toBeVisible();
  await expect(forecast.getByText('25 °C', { exact: true })).toBeVisible();
  await expect(forecast.locator('time[datetime="2026-11-11"]')).toBeVisible();
});

test('mantém cinco datas e distingue dados parciais de zero', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-11T12:00:00Z'));
  await mockWeatherApi(page);
  await page.route('https://api.open-meteo.com/v1/forecast?*', (route) =>
    route.fulfill({
      json: {
        ...forecastResponse,
        current: { ...forecastResponse.current, precipitation: null },
        daily: {
          time: ['2026-11-11', '2026-11-13', '2026-11-14', '2026-11-15'],
          weather_code: [2, 61, 1, 0],
          temperature_2m_min: [17.1, 17.4, 16.8, 17.2],
          temperature_2m_max: [25, 24.7, 25.3, 26],
          precipitation_probability_max: [30, null, 20, 0],
        },
      },
    }),
  );
  await page.goto('/');
  await page.getByLabel('Cidade').fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar' }).click();

  const current = page.getByRole('region', { name: 'Clima atual' });
  const forecast = page.getByRole('region', { name: 'Previsão para cinco dias' });
  await expect(current.getByText('22,4 °C', { exact: true })).toBeVisible();
  await expect(current.getByText('Indisponível', { exact: true })).toBeVisible();
  await expect(forecast.getByText('Previsão incompleta')).toBeVisible();
  const cards = forecast.getByRole('listitem');
  await expect(cards).toHaveCount(5);
  await expect(cards.nth(1).locator('time[datetime="2026-11-12"]')).toBeVisible();
  await expect(cards.nth(1).getByText('Condição indisponível')).toBeVisible();
  await expect(cards.nth(1).getByText('Indisponível', { exact: true })).toHaveCount(3);
  await expect(cards.nth(2).getByText('Chuva fraca', { exact: true })).toBeVisible();
  await expect(cards.nth(2).getByText('Indisponível', { exact: true })).toBeVisible();
  await expect(cards.nth(4).getByText('0%', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '°F' }).click();
  await expect(cards.nth(1).getByText('Indisponível', { exact: true })).toHaveCount(3);
  await expect(cards.nth(2).getByText('76 °F', { exact: true })).toBeVisible();
});

test('exibe fallbacks para campos atuais e colunas diárias ausentes', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-11T12:00:00Z'));
  await mockWeatherApi(page);
  await page.route('https://api.open-meteo.com/v1/forecast?*', (route) =>
    route.fulfill({
      json: {
        timezone: 'America/Sao_Paulo',
        current: { weather_code: 0, time: null, precipitation: null },
        daily: { time: forecastResponse.daily.time },
      },
    }),
  );
  await page.goto('/');
  await page.getByLabel('Cidade').fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar' }).click();

  const current = page.getByRole('region', { name: 'Clima atual' });
  const forecast = page.getByRole('region', { name: 'Previsão para cinco dias' });
  await expect(current.getByText('Céu limpo')).toBeVisible();
  await expect(current.getByText('Indisponível', { exact: true })).toHaveCount(5);
  await expect(current.getByText('Referência:')).toHaveCount(0);
  await expect(forecast.getByText('Previsão incompleta')).toBeVisible();
  await expect(forecast.getByRole('listitem')).toHaveCount(5);
  await expect(forecast.getByText('Condição indisponível')).toHaveCount(5);
  await expect(forecast.getByText('Indisponível', { exact: true })).toHaveCount(15);
  await page.getByRole('button', { name: '°F' }).click();
  await expect(current.getByText('Indisponível', { exact: true })).toHaveCount(5);
  await expect(forecast.getByText('Indisponível', { exact: true })).toHaveCount(15);
  await expect(page.locator('main')).not.toContainText(/NaN|undefined|Infinity|∞/);
});

test('converte temperaturas negativas e retorna aos valores Celsius originais', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-11-11T12:00:00Z'));
  await mockWeatherApi(page);
  await page.route('https://api.open-meteo.com/v1/forecast?*', (route) =>
    route.fulfill({
      json: {
        ...forecastResponse,
        current: { ...forecastResponse.current, temperature_2m: -22.5 },
        daily: {
          ...forecastResponse.daily,
          temperature_2m_min: [10, ...forecastResponse.daily.temperature_2m_min.slice(1)],
          temperature_2m_max: [20, ...forecastResponse.daily.temperature_2m_max.slice(1)],
        },
      },
    }),
  );
  await page.goto('/');
  await page.getByLabel('Cidade').fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar' }).click();

  const current = page.getByRole('region', { name: 'Clima atual' });
  const firstDay = page
    .getByRole('region', { name: 'Previsão para cinco dias' })
    .getByRole('listitem')
    .first();
  await expect(current.getByText('-22,5 °C', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '°F' }).click();
  await expect(current.getByText('-9 °F', { exact: true })).toBeVisible();
  await expect(firstDay.getByText('68 °F', { exact: true })).toBeVisible();
  await expect(firstDay.getByText('50 °F', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '°C' }).click();
  await expect(current.getByText('-22,5 °C', { exact: true })).toBeVisible();
  await expect(firstDay.getByText('20 °C', { exact: true })).toBeVisible();
  await expect(firstDay.getByText('10 °C', { exact: true })).toBeVisible();
});

test('não mostra dados antigos após falha HTTP e recupera na nova tentativa', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-11T12:00:00Z'));
  await mockWeatherApi(page);
  await page.route('https://geocoding-api.open-meteo.com/v1/search?*', (route) => {
    if (new URL(route.request().url()).searchParams.get('name') !== 'Recife') {
      return route.fallback();
    }
    return route.fulfill({
      json: { results: [{ id: 2, name: 'Recife', latitude: -8.05, longitude: -34.9 }] },
    });
  });
  let forecastRequests = 0;
  await page.route('https://api.open-meteo.com/v1/forecast?*', (route) => {
    forecastRequests += 1;
    return forecastRequests === 2
      ? route.fulfill({ status: 429, body: 'Limite temporário' })
      : route.fulfill({ json: forecastResponse });
  });
  await page.goto('/');

  const input = page.getByLabel('Cidade');
  await input.fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page.getByRole('region', { name: 'Clima atual' })).toBeVisible();

  await input.fill('Recife');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page.getByRole('alert')).toHaveText('Não foi possível consultar a previsão.');
  await expect(page.getByRole('region', { name: 'Clima atual' })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Previsão para cinco dias' })).toHaveCount(0);
  await expect(page.getByText('Cidade não encontrada.')).toHaveCount(0);
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  const current = page.getByRole('region', { name: 'Clima atual' });
  await expect(current.getByRole('heading', { name: 'Recife' })).toBeVisible();
  await expect(current.getByText('22,4 °C')).toBeVisible();
  expect(forecastRequests).toBe(3);
});

test('recupera a busca após falha de conexão no geocoding', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-11T12:00:00Z'));
  await mockWeatherApi(page);
  let geocodingRequests = 0;
  let forecastRequests = 0;
  await page.route('https://geocoding-api.open-meteo.com/v1/search?*', (route) => {
    geocodingRequests += 1;
    return geocodingRequests === 1 ? route.abort('internetdisconnected') : route.fallback();
  });
  await page.route('https://api.open-meteo.com/v1/forecast?*', (route) => {
    forecastRequests += 1;
    return route.fallback();
  });
  await page.goto('/');
  await page.getByLabel('Cidade').fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(page.getByRole('alert')).toHaveText('Falha de rede.');
  await expect(page.getByText('Cidade não encontrada.')).toHaveCount(0);
  expect(geocodingRequests).toBe(1);
  expect(forecastRequests).toBe(0);

  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(
    page.getByRole('region', { name: 'Clima atual' }).getByText('22,4 °C'),
  ).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(geocodingRequests).toBe(2);
  expect(forecastRequests).toBe(1);
});

test('recupera apenas a previsão após falha de conexão no forecast', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-11T12:00:00Z'));
  await mockWeatherApi(page);
  let geocodingRequests = 0;
  let forecastRequests = 0;
  await page.route('https://geocoding-api.open-meteo.com/v1/search?*', (route) => {
    geocodingRequests += 1;
    return route.fallback();
  });
  await page.route('https://api.open-meteo.com/v1/forecast?*', (route) => {
    forecastRequests += 1;
    return forecastRequests === 1 ? route.abort('internetdisconnected') : route.fallback();
  });
  await page.goto('/');
  await page.getByLabel('Cidade').fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(page.getByRole('alert')).toHaveText('Falha de rede.');
  await expect(page.getByRole('region', { name: 'Clima atual' })).toHaveCount(0);
  await expect(page.getByText('Cidade não encontrada.')).toHaveCount(0);
  expect(geocodingRequests).toBe(1);
  expect(forecastRequests).toBe(1);

  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(
    page.getByRole('region', { name: 'Clima atual' }).getByText('22,4 °C'),
  ).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(geocodingRequests).toBe(1);
  expect(forecastRequests).toBe(2);
});

for (const inputValue of ['', '   ']) {
  test(`não consulta a rede com entrada ${inputValue ? 'só de espaços' : 'vazia'}`, async ({
    page,
  }) => {
    let apiRequests = 0;
    await page.route('https://geocoding-api.open-meteo.com/**', (route) => {
      apiRequests += 1;
      return route.abort();
    });
    await page.route('https://api.open-meteo.com/**', (route) => {
      apiRequests += 1;
      return route.abort();
    });
    await page.goto('/');

    const input = page.getByLabel('Cidade');
    await input.fill(inputValue);
    await page.getByRole('button', { name: 'Buscar' }).click();
    await expect(page.getByRole('alert')).toHaveText('Informe uma cidade.');
    await expect(input).toBeEditable();
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(apiRequests).toBe(0);
  });
}

test('preserva caracteres especiais na consulta enviada ao geocoding', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-11T12:00:00Z'));
  await mockWeatherApi(page);
  const geocodingRequest = page.waitForRequest(
    (request) => new URL(request.url()).origin === 'https://geocoding-api.open-meteo.com',
  );
  await page.goto('/');
  await page.getByLabel('Cidade').fill(" São Tomé-d'Ávila ");
  await page.getByRole('button', { name: 'Buscar' }).click();

  const request = await geocodingRequest;
  expect(new URL(request.url()).searchParams.get('name')).toBe("São Tomé-d'Ávila");
  await expect(page.getByRole('region', { name: 'Clima atual' })).toBeVisible();
});

test('mostra estado vazio quando o geocoding não retorna results e permite nova busca', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-11-11T12:00:00Z'));
  await mockWeatherApi(page);
  let forecastRequests = 0;
  await page.route('https://geocoding-api.open-meteo.com/v1/search?*', (route) => {
    if (new URL(route.request().url()).searchParams.get('name') === 'Cidade inexistente') {
      return route.fulfill({ json: {} });
    }
    return route.fallback();
  });
  await page.route('https://api.open-meteo.com/v1/forecast?*', (route) => {
    forecastRequests += 1;
    return route.fallback();
  });
  await page.goto('/');

  const input = page.getByLabel('Cidade');
  await input.fill('Cidade inexistente');
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(page.getByRole('status')).toContainText('Cidade não encontrada.');
  await expect(input).toBeEditable();
  await expect(input).toHaveValue('Cidade inexistente');
  await expect(page.getByRole('region', { name: 'Clima atual' })).toHaveCount(0);
  expect(forecastRequests).toBe(0);
  await input.fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(
    page.getByRole('region', { name: 'Clima atual' }).getByText('22,4 °C'),
  ).toBeVisible();
  await expect(page.getByText('Cidade não encontrada.')).toHaveCount(0);
  expect(forecastRequests).toBe(1);
});

test('exibe o clima e a previsão após busca no viewport mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.clock.setFixedTime(new Date('2026-11-11T12:00:00Z'));
  await mockWeatherApi(page);
  await page.goto('/');

  await page.getByLabel('Cidade').fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar' }).click();

  const current = page.getByRole('region', { name: 'Clima atual' });
  const forecast = page.getByRole('region', { name: 'Previsão para cinco dias' });
  await expect(current.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
  await expect(current.getByText('22,4 °C', { exact: true })).toBeVisible();
  await expect(current.getByText('Parcialmente nublado', { exact: true })).toBeVisible();
  await expect(forecast).toBeVisible();
  await expect(forecast.getByRole('listitem')).toHaveCount(5);

  await page.getByRole('button', { name: '°F' }).click();
  await expect(current.getByText('72 °F', { exact: true })).toBeVisible();
  await expect(forecast.getByText('77 °F', { exact: true })).toBeVisible();
});
