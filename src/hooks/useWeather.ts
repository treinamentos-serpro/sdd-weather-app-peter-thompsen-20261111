import { useCallback, useEffect, useRef, useState } from 'react';
import { getWeather, searchCities, WeatherServiceError } from '../services/weatherService';
import type { City, WeatherData } from '../types/weather';

type WeatherStatus = 'idle' | 'loading' | 'success' | 'error' | 'empty';
type Operation = { type: 'search'; query: string } | { type: 'weather'; city: City };

interface WeatherHookState {
  status: WeatherStatus;
  data: WeatherData | null;
  cities: City[];
  error: string | null;
  query: string;
}

const initialState: WeatherHookState = {
  status: 'idle',
  data: null,
  cities: [],
  error: null,
  query: '',
};

function errorMessage(error: unknown): string {
  if (error instanceof WeatherServiceError) return error.message;
  console.error('Erro inesperado ao consultar o clima:', error);
  return 'Não foi possível concluir a consulta.';
}

export function useWeather() {
  const [state, setState] = useState<WeatherHookState>(initialState);
  const requestId = useRef(0);
  const lastOperation = useRef<Operation | null>(null);

  useEffect(() => {
    return () => {
      requestId.current += 1;
    };
  }, []);

  const loadCity = useCallback(async (city: City, id: number) => {
    lastOperation.current = { type: 'weather', city };
    try {
      const data = await getWeather(city);
      if (requestId.current !== id) return;
      setState((previous) => ({ ...previous, status: 'success', data, error: null }));
    } catch (error) {
      if (requestId.current !== id) return;
      const message = errorMessage(error);
      setState((previous) => ({ ...previous, status: 'error', data: null, error: message }));
    }
  }, []);

  const search = useCallback(
    async (name: string) => {
      const id = ++requestId.current;
      const query = name.trim();
      lastOperation.current = query ? { type: 'search', query } : null;
      if (!query) {
        setState({ ...initialState, status: 'error', error: 'Informe uma cidade.' });
        return;
      }

      setState({ status: 'loading', data: null, cities: [], error: null, query });
      try {
        const cities = await searchCities(query);
        if (requestId.current !== id) return;
        if (cities.length === 0) {
          setState({ status: 'empty', data: null, cities: [], error: null, query });
          return;
        }
        setState({ status: 'loading', data: null, cities, error: null, query });
        await loadCity(cities[0], id);
      } catch (error) {
        if (requestId.current !== id) return;
        const message = errorMessage(error);
        setState({ status: 'error', data: null, cities: [], error: message, query });
      }
    },
    [loadCity],
  );

  const selectCity = useCallback(
    async (city: City) => {
      const id = ++requestId.current;
      setState((previous) => ({ ...previous, status: 'loading', data: null, error: null }));
      await loadCity(city, id);
    },
    [loadCity],
  );

  const retry = useCallback(async () => {
    const operation = lastOperation.current;
    if (!operation) return;
    if (operation.type === 'search') {
      await search(operation.query);
    } else {
      await selectCity(operation.city);
    }
  }, [search, selectCity]);

  return { ...state, search, selectCity, retry };
}
