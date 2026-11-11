import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWeather } from '../../src/hooks/useWeather';
import { mockWeatherData } from '../../src/mocks/weatherData';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';
import type { City, WeatherData } from '../../src/types/weather';

vi.mock('../../src/services/weatherService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/weatherService')>();
  return { ...actual, searchCities: vi.fn(), getWeather: vi.fn() };
});

const firstCity = mockWeatherData.city;
const secondCity: City = { ...firstCity, id: 2, name: 'Recife' };
const secondWeather: WeatherData = { ...mockWeatherData, city: secondCity };
const searchMock = vi.mocked(searchCities);
const weatherMock = vi.mocked(getWeather);

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('useWeather', () => {
  it('inicia em idle e retry inicial não faz chamadas', async () => {
    const { result } = renderHook(() => useWeather());
    expect(result.current).toMatchObject({
      status: 'idle',
      data: null,
      cities: [],
      error: null,
      query: '',
    });
    await act(() => result.current.retry());
    expect(searchMock).not.toHaveBeenCalled();
    expect(weatherMock).not.toHaveBeenCalled();
  });

  it('busca e carrega o clima da primeira cidade preservando as opções', async () => {
    const searchPending = deferred<City[]>();
    const weatherPending = deferred<WeatherData>();
    searchMock.mockReturnValue(searchPending.promise);
    weatherMock.mockReturnValue(weatherPending.promise);
    const { result } = renderHook(() => useWeather());
    let task: Promise<void> = Promise.resolve();
    act(() => {
      task = result.current.search(' São Paulo ');
    });
    expect(result.current.status).toBe('loading');
    expect(result.current.query).toBe('São Paulo');
    await act(async () => searchPending.resolve([firstCity, secondCity]));
    expect(result.current.cities).toEqual([firstCity, secondCity]);
    expect(result.current.status).toBe('loading');
    expect(weatherMock).toHaveBeenCalledWith(firstCity);
    await act(async () => {
      weatherPending.resolve(mockWeatherData);
      await task;
    });
    expect(result.current).toMatchObject({
      status: 'success',
      data: mockWeatherData,
      cities: [firstCity, secondCity],
      error: null,
    });
  });

  it('trata consulta vazia e resultado vazio sem solicitar clima', async () => {
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('  '));
    expect(result.current).toMatchObject({ status: 'error', error: 'Informe uma cidade.' });
    expect(searchMock).not.toHaveBeenCalled();
    searchMock.mockResolvedValue([]);
    await act(() => result.current.search('inexistente'));
    expect(result.current).toMatchObject({ status: 'empty', data: null, cities: [], error: null });
    expect(weatherMock).not.toHaveBeenCalled();
  });

  it('repete a busca após erro de geocoding e depois carrega clima', async () => {
    searchMock
      .mockRejectedValueOnce(new WeatherServiceError('Falha de rede.'))
      .mockResolvedValueOnce([firstCity]);
    weatherMock.mockResolvedValue(mockWeatherData);
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search(' São Paulo '));
    expect(result.current).toMatchObject({ status: 'error', error: 'Falha de rede.' });
    await act(() => result.current.retry());
    expect(searchMock).toHaveBeenCalledTimes(2);
    expect(searchMock).toHaveBeenLastCalledWith('São Paulo');
    expect(weatherMock).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('success');
  });

  it('repete apenas o forecast após erro e permite selecionar outra cidade', async () => {
    searchMock.mockResolvedValue([firstCity, secondCity]);
    weatherMock
      .mockRejectedValueOnce(new WeatherServiceError('A requisição demorou demais.'))
      .mockResolvedValueOnce(mockWeatherData)
      .mockResolvedValueOnce(secondWeather);
    const { result } = renderHook(() => useWeather());
    await act(() => result.current.search('São Paulo'));
    expect(result.current).toMatchObject({
      status: 'error',
      data: null,
      cities: [firstCity, secondCity],
      error: 'A requisição demorou demais.',
    });
    await act(() => result.current.retry());
    expect(searchMock).toHaveBeenCalledTimes(1);
    expect(weatherMock).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual(mockWeatherData);
    await act(() => result.current.selectCity(secondCity));
    expect(result.current).toMatchObject({ status: 'success', data: secondWeather });
  });

  it('aceita previsão parcial e remove dados antigos se a nova cidade falhar', async () => {
    const partial: WeatherData = { ...mockWeatherData, isPartial: true };
    weatherMock
      .mockResolvedValueOnce(partial)
      .mockRejectedValueOnce(new WeatherServiceError('Falha de rede.'));
    const { result } = renderHook(() => useWeather());

    await act(() => result.current.selectCity(firstCity));
    expect(result.current).toMatchObject({ status: 'success', data: { isPartial: true } });
    await act(() => result.current.selectCity(secondCity));
    expect(result.current).toMatchObject({ status: 'error', data: null, error: 'Falha de rede.' });
  });

  it('ignora respostas de busca anteriores e não inicia forecast obsoleto', async () => {
    const old = deferred<City[]>();
    searchMock.mockReturnValueOnce(old.promise).mockResolvedValueOnce([secondCity]);
    weatherMock.mockResolvedValue(secondWeather);
    const { result } = renderHook(() => useWeather());
    let firstTask: Promise<void> = Promise.resolve();
    act(() => {
      firstTask = result.current.search('antiga');
    });
    await act(() => result.current.search('nova'));
    await act(async () => {
      old.resolve([firstCity]);
      await firstTask;
    });
    expect(result.current).toMatchObject({ status: 'success', query: 'nova', data: secondWeather });
    expect(weatherMock).toHaveBeenCalledTimes(1);
    expect(weatherMock).toHaveBeenCalledWith(secondCity);
  });

  it('ignora falha tardia do clima anterior após selecionar outra cidade', async () => {
    const old = deferred<WeatherData>();
    weatherMock.mockReturnValueOnce(old.promise).mockResolvedValueOnce(secondWeather);
    const { result } = renderHook(() => useWeather());
    let firstTask: Promise<void> = Promise.resolve();
    act(() => {
      firstTask = result.current.selectCity(firstCity);
    });
    await act(() => result.current.selectCity(secondCity));
    await act(async () => {
      old.reject(new WeatherServiceError('Falha de rede.'));
      await firstTask;
    });
    expect(result.current).toMatchObject({ status: 'success', data: secondWeather, error: null });
  });

  it('ignora sucesso tardio do clima anterior após selecionar outra cidade', async () => {
    const old = deferred<WeatherData>();
    weatherMock.mockReturnValueOnce(old.promise).mockResolvedValueOnce(secondWeather);
    const { result } = renderHook(() => useWeather());
    let firstTask: Promise<void> = Promise.resolve();
    act(() => {
      firstTask = result.current.selectCity(firstCity);
    });
    await act(() => result.current.selectCity(secondCity));
    await act(async () => {
      old.resolve(mockWeatherData);
      await firstTask;
    });
    expect(result.current).toMatchObject({ status: 'success', data: secondWeather, error: null });
  });

  it('descarta respostas após desmontagem', async () => {
    const pending = deferred<City[]>();
    searchMock.mockReturnValue(pending.promise);
    const { result, unmount } = renderHook(() => useWeather());
    let task: Promise<void> = Promise.resolve();
    act(() => {
      task = result.current.search('Recife');
    });
    unmount();
    await act(async () => {
      pending.resolve([firstCity]);
      await task;
    });
    expect(weatherMock).not.toHaveBeenCalled();
  });

  it('não expõe detalhes inesperados de erros à interface', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      searchMock.mockRejectedValue(new Error('detalhe interno'));
      const { result } = renderHook(() => useWeather());
      await act(() => result.current.search('Recife'));
      await waitFor(() => expect(result.current.status).toBe('error'));
      expect(result.current.error).toBe('Não foi possível concluir a consulta.');
      expect(log).toHaveBeenCalledOnce();
    } finally {
      log.mockRestore();
    }
  });
});
