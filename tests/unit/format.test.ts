import { describe, expect, it } from 'vitest';
import {
  formatForecastDate,
  formatPrecipitationProbability,
  getDayLabel,
  getShortDate,
} from '../../src/lib/format';

describe('getDayLabel', () => {
  it('identifica os dois primeiros dias da previsão', () => {
    expect(getDayLabel('2026-11-11', 0)).toBe('Hoje');
    expect(getDayLabel('2026-11-12', 1)).toBe('Amanhã');
  });

  it.each([
    ['2026-11-13', 2, 'sexta-feira'],
    ['2026-11-14', 3, 'sábado'],
    ['2026-11-15', 4, 'domingo'],
    ['2026-01-01', 5, 'quinta-feira'],
  ])('formata %s no índice %i como %s', (date, index, expected) => {
    expect(getDayLabel(date, index)).toBe(expected);
  });

  it.each([0, 1, 2])('retorna null para uma data inválida no índice %i', (index) => {
    expect(getDayLabel('2025-02-29', index)).toBeNull();
  });
});

describe('getShortDate', () => {
  it.each([
    ['2026-11-11', '11/11'],
    ['2024-02-29', '29/02'],
    ['2026-01-01', '01/01'],
    ['2026-12-31', '31/12'],
  ])('formata %s como %s', (date, expected) => {
    expect(getShortDate(date)).toBe(expected);
  });

  it.each(['2025-02-29', '2026-13-01', '2026-1-01', ''])(
    'retorna null para data inválida %s',
    (date) => {
      expect(getShortDate(date)).toBeNull();
    },
  );
});

describe('formatForecastDate', () => {
  it('formata a data local sem alterar o dia pelo fuso do processo', () => {
    expect(formatForecastDate('2026-11-11')).toBe('quarta-feira, 11/11');
    expect(formatForecastDate('2024-02-29')).toBe('quinta-feira, 29/02');
    expect(formatForecastDate('2026-01-01')).toBe('quinta-feira, 01/01');
  });

  it.each([
    '2025-02-29',
    '2026-13-01',
    '2026-00-01',
    '0000-01-01',
    '2026-1-01',
    '',
  ])('retorna null para data inválida %s', (date) => {
    expect(formatForecastDate(date)).toBeNull();
  });
});

describe('formatPrecipitationProbability', () => {
  it('preserva zero e formata o percentual em pt-BR', () => {
    expect(formatPrecipitationProbability(0)).toBe('0%');
    expect(formatPrecipitationProbability(25.5)).toBe('25,5%');
    expect(formatPrecipitationProbability(100)).toBe('100%');
  });

  it.each([
    null,
    -1,
    101,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ])('recusa probabilidade inválida %s', (value) => {
    expect(formatPrecipitationProbability(value)).toBeNull();
  });
});
