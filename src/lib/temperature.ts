import type { Unit } from '../types/weather';

export function unitLabel(unit: Unit): string {
  return unit === 'celsius' ? '°C' : '°F';
}

export function convertTemperature(valueC: number | null, unit: Unit): number | null {
  if (valueC === null) return null;
  return unit === 'celsius' ? valueC : (valueC * 9) / 5 + 32;
}

export function formatTemperature(value: number | null, unit: Unit): string {
  if (value === null || !Number.isFinite(value)) return 'Indisponível';

  if (unit === 'celsius') {
    return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value)} ${unitLabel(unit)}`;
  }

  const rounded = Math.sign(value) * Math.round(Math.abs(value));
  return `${Object.is(rounded, -0) ? 0 : rounded} ${unitLabel(unit)}`;
}

export function displayTemperature(valueC: number | null, unit: Unit): string {
  return formatTemperature(convertTemperature(valueC, unit), unit);
}
