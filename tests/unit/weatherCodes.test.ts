import { describe, expect, it } from 'vitest';
import { getWeatherCondition } from '../../src/lib/weatherCodes';

describe('getWeatherCondition', () => {
  it('retorna descrição e ícone para códigos WMO conhecidos', () => {
    expect(getWeatherCondition(0)).toEqual({ label: 'Céu limpo', icon: '☀️' });
    expect(getWeatherCondition(61)).toEqual({ label: 'Chuva fraca', icon: '🌧️' });
  });

  it.each([null, 999])('indica condição indisponível para código %s', (code) => {
    expect(getWeatherCondition(code)).toEqual({ label: 'Condição indisponível', icon: '❔' });
  });
});
