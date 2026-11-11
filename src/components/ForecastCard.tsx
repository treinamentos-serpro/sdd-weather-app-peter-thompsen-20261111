import { formatForecastDate, formatPrecipitationProbability } from '../lib/format';
import { displayTemperature } from '../lib/temperature';
import { getWeatherCondition } from '../lib/weatherCodes';
import type { ForecastDay, Unit } from '../types/weather';

interface ForecastCardProps {
  day: ForecastDay;
  unit: Unit;
}

export default function ForecastCard({ day, unit }: ForecastCardProps) {
  const dateLabel = formatForecastDate(day.date);
  const condition = getWeatherCondition(day.weatherCode);
  const probability = formatPrecipitationProbability(day.precipitationProbabilityMaxPercent);

  return (
    <article className="h-full break-words rounded-xl border border-white/10 bg-white/5 p-4 text-white shadow-glass backdrop-blur-md">
      <h3 className="font-semibold">
        {dateLabel ? <time dateTime={day.date}>{dateLabel}</time> : 'Data indisponível'}
      </h3>
      <div className="mt-4 flex items-center gap-2">
        <span aria-hidden="true" className="text-3xl">
          {condition.icon}
        </span>
        <span className="min-w-0 text-sm">{condition.label}</span>
      </div>
      <dl className="mt-4 space-y-2 text-sm">
        <div>
          <dt className="text-slate-300">Máxima</dt>
          <dd className="font-medium">{displayTemperature(day.maximumC, unit)}</dd>
        </div>
        <div>
          <dt className="text-slate-300">Mínima</dt>
          <dd className="font-medium">{displayTemperature(day.minimumC, unit)}</dd>
        </div>
        <div>
          <dt className="text-slate-300">Probabilidade máxima de precipitação</dt>
          <dd className="font-medium">{probability ?? 'Indisponível'}</dd>
        </div>
      </dl>
    </article>
  );
}
