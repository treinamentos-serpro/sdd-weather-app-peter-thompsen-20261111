function parseForecastDate(date: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year === 0) return null;

  const parsed = new Date(0);
  parsed.setUTCHours(0, 0, 0, 0);
  parsed.setUTCFullYear(year, month - 1, day);
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return parsed;
}

export function getDayLabel(date: string, index: number): string | null {
  const parsed = parseForecastDate(date);
  if (!parsed) return null;
  if (index === 0) return 'Hoje';
  if (index === 1) return 'Amanhã';

  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', timeZone: 'UTC' }).format(parsed);
}

export function getShortDate(date: string): string | null {
  const parsed = parseForecastDate(date);
  if (!parsed) return null;

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  }).format(parsed);
}

export function formatForecastDate(date: string): string | null {
  const parsed = parseForecastDate(date);
  if (!parsed) return null;

  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  }).format(parsed);
}

export function formatPrecipitationProbability(value: number | null): string | null {
  if (value === null || !Number.isFinite(value) || value < 0 || value > 100) return null;
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value)}%`;
}
