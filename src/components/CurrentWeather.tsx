import { displayTemperature } from '../lib/temperature';
import { getWeatherCondition } from '../lib/weatherCodes';
import type { City, CurrentWeather as CurrentWeatherData, Unit } from '../types/weather';

interface CurrentWeatherProps {
  city: City;
  current: CurrentWeatherData;
  unit: Unit;
}

function formatMetric(value: number | null, unit: string): string {
  if (value === null || !Number.isFinite(value)) return 'Indisponível';
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value)} ${unit}`;
}

function formatLocalTime(time: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2}(?::\d{2})?)$/.exec(time);
  return match ? `${match[3]}/${match[2]}/${match[1]} às ${match[4]}` : time;
}

export default function CurrentWeather({ city, current, unit }: CurrentWeatherProps) {
  const condition = getWeatherCondition(current.weatherCode);
  const metrics = [
    { label: 'Umidade', value: formatMetric(current.humidityPercent, '%') },
    { label: 'Vento', value: formatMetric(current.windSpeedKmh, 'km/h') },
    { label: 'Precipitação', value: formatMetric(current.precipitationMm, 'mm') },
    { label: 'Pressão à superfície', value: formatMetric(current.surfacePressureHpa, 'hPa') },
  ];

  return (
    <section
      aria-label="Clima atual"
      className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white shadow-glass backdrop-blur-md"
    >
      <h2 className="break-words text-xl font-semibold">{city.name}</h2>
      <div className="mt-4 flex items-center gap-4">
        <span aria-hidden="true" className="text-5xl">
          {condition.icon}
        </span>
        <div className="min-w-0">
          <p
            className={`break-words font-semibold ${
              current.temperatureC === null || !Number.isFinite(current.temperatureC)
                ? 'text-2xl sm:text-3xl'
                : 'text-4xl sm:text-6xl'
            }`}
          >
            {displayTemperature(current.temperatureC, unit)}
          </p>
          <p className="mt-2 text-lg">{condition.label}</p>
        </div>
      </div>
      {current.time !== null && (
        <p className="mt-4 text-sm text-slate-300">
          Referência: <time dateTime={current.time}>{formatLocalTime(current.time)}</time>
        </p>
      )}
      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="min-w-0 break-words rounded-lg border border-white/10 bg-night-900/50 p-3"
          >
            <dt className="text-sm text-slate-300">{metric.label}</dt>
            <dd className="mt-1 font-medium">{metric.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
