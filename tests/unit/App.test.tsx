import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { mockWeatherData } from '../../src/mocks/weatherData';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';

vi.mock('../../src/services/weatherService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/weatherService')>();
  return { ...actual, searchCities: vi.fn(), getWeather: vi.fn() };
});

const searchMock = vi.mocked(searchCities);
const weatherMock = vi.mocked(getWeather);

beforeEach(() => {
  vi.resetAllMocks();
});

describe('App', () => {
  it('inicia em idle e exibe loading e dados ao pesquisar; unidade não gera requisição', async () => {
    const user = userEvent.setup();
    let resolveSearch!: (cities: (typeof mockWeatherData.city)[]) => void;
    searchMock.mockReturnValue(
      new Promise((resolve) => {
        resolveSearch = resolve;
      }),
    );
    weatherMock.mockResolvedValue(mockWeatherData);
    render(<App />);

    expect(screen.getByText('Busque uma cidade.')).toBeInTheDocument();
    const results = screen.getByRole('region', { name: 'Resultado da consulta' });
    expect(results).toHaveAttribute('aria-busy', 'false');
    expect(screen.queryByRole('region', { name: 'Clima atual' })).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('Cidade'), ' São Paulo {Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('Carregando...');
    expect(results).toHaveAttribute('aria-busy', 'true');
    expect(results).not.toContainElement(screen.getByRole('status'));
    expect(screen.getByLabelText('Cidade')).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeEnabled();
    expect(searchMock).toHaveBeenCalledWith('São Paulo');
    resolveSearch([mockWeatherData.city]);
    const current = await screen.findByRole('region', { name: 'Clima atual' });
    expect(results).toHaveAttribute('aria-busy', 'false');
    const forecast = screen.getByRole('region', { name: 'Previsão para cinco dias' });
    expect(within(current).getByText('São Paulo')).toBeInTheDocument();
    expect(within(current).getByText('22,4 °C')).toBeInTheDocument();
    expect(within(forecast).getAllByRole('listitem')).toHaveLength(5);
    expect(within(forecast).getByText('25 °C')).toBeInTheDocument();
    expect(screen.getByLabelText('Cidade')).toHaveFocus();

    await user.click(screen.getByRole('button', { name: '°F' }));
    expect(within(current).getByText('72 °F')).toBeInTheDocument();
    expect(within(forecast).getByText('77 °F')).toBeInTheDocument();
    expect(searchMock).toHaveBeenCalledTimes(1);
    expect(weatherMock).toHaveBeenCalledTimes(1);
  });

  it('informa que a cidade não foi encontrada sem buscar clima', async () => {
    const user = userEvent.setup();
    searchMock.mockResolvedValue([]);
    render(<App />);
    await user.type(screen.getByLabelText('Cidade'), 'Inexistente{Enter}');
    expect(await screen.findByText('Cidade não encontrada.')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Resultado da consulta' })).toHaveAttribute(
      'aria-busy',
      'false',
    );
    expect(weatherMock).not.toHaveBeenCalled();
  });

  it('exibe erro e repete a última operação pelo botão', async () => {
    const user = userEvent.setup();
    searchMock.mockResolvedValue([mockWeatherData.city]);
    weatherMock
      .mockRejectedValueOnce(new WeatherServiceError('Falha de rede.'))
      .mockResolvedValueOnce(mockWeatherData);
    render(<App />);
    await user.type(screen.getByLabelText('Cidade'), 'São Paulo{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent('Falha de rede.');
    expect(screen.getByRole('region', { name: 'Resultado da consulta' })).toHaveAttribute(
      'aria-busy',
      'false',
    );
    expect(screen.queryByRole('region', { name: 'Clima atual' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('region', { name: 'Clima atual' })).toBeInTheDocument();
    expect(searchMock).toHaveBeenCalledTimes(1);
    expect(weatherMock).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('não envia uma busca vazia', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Informe uma cidade.');
    expect(searchMock).not.toHaveBeenCalled();
  });
});
