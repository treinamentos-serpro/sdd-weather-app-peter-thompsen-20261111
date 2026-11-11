import { describe, expect, it } from 'vitest';
import {
  convertTemperature,
  displayTemperature,
  formatTemperature,
  unitLabel,
} from '../../src/lib/temperature';

describe('convertTemperature', () => {
  it.each([
    [0, 32],
    [100, 212],
    [-40, -40],
    [20, 68],
    [10, 50],
    [22.5, 72.5],
  ])('converte %s °C para %s °F', (celsius, fahrenheit) => {
    expect(convertTemperature(celsius, 'fahrenheit')).toBe(fahrenheit);
  });

  it('mantém o valor em Celsius e preserva ausência em ambas as unidades', () => {
    expect(convertTemperature(22.4, 'celsius')).toBe(22.4);
    expect(convertTemperature(null, 'celsius')).toBeNull();
    expect(convertTemperature(null, 'fahrenheit')).toBeNull();
  });
});

describe('unitLabel', () => {
  it('retorna o símbolo da unidade selecionada', () => {
    expect(unitLabel('celsius')).toBe('°C');
    expect(unitLabel('fahrenheit')).toBe('°F');
  });
});

describe('formatTemperature', () => {
  it.each([
    [10.5, '11 °F'],
    [-10.5, '-11 °F'],
    [10.49, '10 °F'],
    [-10.49, '-10 °F'],
    [-0.1, '0 °F'],
  ])('arredonda %s °F para %s', (value, expected) => {
    expect(formatTemperature(value, 'fahrenheit')).toBe(expected);
  });

  it('formata Celsius em pt-BR com até duas casas e símbolos', () => {
    expect(formatTemperature(22.456, 'celsius')).toBe('22,46 °C');
    expect(formatTemperature(-2.5, 'celsius')).toBe('-2,5 °C');
    expect(formatTemperature(0, 'celsius')).toBe('0 °C');
  });

  it('apresenta valores ausentes sem unidade', () => {
    expect(formatTemperature(null, 'celsius')).toBe('Indisponível');
    expect(formatTemperature(null, 'fahrenheit')).toBe('Indisponível');
  });

  it.each([
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ])('não apresenta temperatura não finita %s', (value) => {
    expect(formatTemperature(value, 'celsius')).toBe('Indisponível');
    expect(displayTemperature(value, 'fahrenheit')).toBe('Indisponível');
  });
});

describe('displayTemperature', () => {
  it.each([
    [0, '32 °F'],
    [100, '212 °F'],
    [20, '68 °F'],
    [10, '50 °F'],
    [-40, '-40 °F'],
    [-12.5, '10 °F'],
    [-22.5, '-9 °F'],
  ])('converte %s °C para %s', (value, expected) => {
    expect(displayTemperature(value, 'fahrenheit')).toBe(expected);
  });

  it('preserva decimais em Celsius e apresenta null como indisponível', () => {
    expect(displayTemperature(22.4, 'celsius')).toBe('22,4 °C');
    expect(displayTemperature(null, 'celsius')).toBe('Indisponível');
    expect(displayTemperature(null, 'fahrenheit')).toBe('Indisponível');
  });
});
