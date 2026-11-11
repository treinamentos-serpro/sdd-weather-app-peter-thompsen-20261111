import { expect, test } from '@playwright/test';
import { mockWeatherApi } from './weatherMock';

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
]) {
  test(`layout e teclado em ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.clock.setFixedTime(new Date('2026-11-11T12:00:00Z'));
    await mockWeatherApi(page);
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Weather App' })).toBeVisible();
    const fahrenheit = page.getByRole('button', { name: '°F' });
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(fahrenheit).toBeFocused();
    expect(await fahrenheit.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe(
      'none',
    );
    await page.keyboard.press('Enter');
    await expect(fahrenheit).toHaveAttribute('aria-pressed', 'true');
    const input = page.getByLabel('Cidade');
    await input.fill('São Tomé-d’Ávila');
    await input.press('Enter');
    await expect(input).toHaveValue('São Tomé-d’Ávila');
    await expect(page.getByRole('region', { name: 'Clima atual' })).toContainText('72 °F');

    const city = page.getByRole('heading', { name: 'São Paulo' });
    await city.evaluate((element) => {
      element.textContent = 'LocalidadeComNomeExcepcionalmenteLongoParaTestarResponsividade';
    });
    await expect(
      page.getByRole('heading', {
        name: 'LocalidadeComNomeExcepcionalmenteLongoParaTestarResponsividade',
      }),
    ).toBeVisible();

    const bounds = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(bounds.content).toBeLessThanOrEqual(bounds.viewport);

    const list = page.getByRole('list');
    const gridColumns = await list.evaluate(
      (element) => getComputedStyle(element).gridTemplateColumns.split(' ').length,
    );
    expect(gridColumns).toBe(viewport.width < 640 ? 2 : viewport.width < 1024 ? 3 : 5);
  });
}

test('botão de busca habilitado mantém contraste e alvo adequados', async ({ page }) => {
  await page.goto('/');
  const searchButton = page.getByRole('button', { name: 'Buscar' });
  await expect(searchButton).toBeEnabled();

  const metrics = await searchButton.evaluate((element) => {
    const style = getComputedStyle(element);
    const luminance = (color: string) => {
      const channels = color.match(/\d+/g)?.slice(0, 3).map(Number);
      if (channels?.length !== 3) throw new Error(`Cor inválida: ${color}`);
      const linear = channels.map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    };
    const foreground = luminance(style.color);
    const background = luminance(style.backgroundColor);
    return {
      contrast:
        (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05),
      height: element.getBoundingClientRect().height,
      width: element.getBoundingClientRect().width,
    };
  });

  expect(metrics.contrast).toBeGreaterThanOrEqual(4.5);
  expect(metrics.height).toBeGreaterThanOrEqual(44);
  expect(metrics.width).toBeGreaterThanOrEqual(44);
});
