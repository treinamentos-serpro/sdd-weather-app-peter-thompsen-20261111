import { useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import { useWeather } from './hooks/useWeather';
import type { Unit } from './types/weather';

export default function App() {
  const [unit, setUnit] = useState<Unit>('celsius');
  const { status, data, error, search, retry } = useWeather();

  return (
    <div className="min-h-screen bg-night-900 px-4 py-8 font-sans text-white">
      <div className="mx-auto max-w-5xl">
        <header className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold">Weather App</h1>
            <UnitToggle unit={unit} onChange={setUnit} />
          </div>
          <SearchBar onSearch={search} />
        </header>
        <main className="mt-8 space-y-6">
          {status === 'loading' && <LoadingState />}
          <section
            aria-label="Resultado da consulta"
            aria-busy={status === 'loading'}
            className="space-y-6"
          >
            {status === 'idle' && (
              <EmptyState title="Busque uma cidade." hint="Digite o nome da cidade para começar." />
            )}
            {status === 'empty' && (
              <EmptyState
                title="Cidade não encontrada."
                hint="Verifique o nome ou tente buscar outra cidade."
              />
            )}
            {status === 'error' && error && <ErrorState message={error} onRetry={retry} />}
            {status === 'success' && data && (
              <>
                <CurrentWeather city={data.city} current={data.current} unit={unit} />
                <ForecastList forecast={data.forecast} unit={unit} isPartial={data.isPartial} />
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
