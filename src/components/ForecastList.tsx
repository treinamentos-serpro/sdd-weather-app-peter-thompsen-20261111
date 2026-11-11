import { useId } from 'react';
import { formatForecastDate, formatPrecipitationProbability } from '../lib/format';
import type { ForecastDay, Unit } from '../types/weather';
import ForecastCard from './ForecastCard';

interface ForecastListProps {
  forecast: ForecastDay[];
  unit: Unit;
  isPartial?: boolean;
}

export default function ForecastList({ forecast, unit, isPartial = false }: ForecastListProps) {
  const headingId = useId();
  const incomplete =
    isPartial ||
    forecast.length !== 5 ||
    forecast.some((day) => {
      return (
        formatForecastDate(day.date) === null ||
        day.weatherCode === null ||
        !Number.isFinite(day.weatherCode) ||
        day.minimumC === null ||
        !Number.isFinite(day.minimumC) ||
        day.maximumC === null ||
        !Number.isFinite(day.maximumC) ||
        formatPrecipitationProbability(day.precipitationProbabilityMaxPercent) === null
      );
    });

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="text-xl font-semibold text-white">
        Previsão para cinco dias
      </h2>
      {incomplete && <p className="mt-2 text-sm text-slate-300">Previsão incompleta</p>}
      {forecast.length === 0 ? (
        <p className="mt-4 text-white">Previsão indisponível.</p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {forecast.map((day) => (
            <li key={day.date} className="min-w-0">
              <ForecastCard day={day} unit={unit} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
