import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ForecastList from '../../src/components/ForecastList';
import { mockWeatherData } from '../../src/mocks/weatherData';

describe('ForecastList', () => {
  it('mostra cinco dias na ordem recebida com condições e probabilidade máxima', () => {
    render(<ForecastList forecast={mockWeatherData.forecast} unit="celsius" />);

    const region = screen.getByRole('region', { name: 'Previsão para cinco dias' });
    const list = within(region).getByRole('list');
    expect(list).toHaveClass('grid', 'grid-cols-2', 'sm:grid-cols-3', 'lg:grid-cols-5');
    const cards = within(list).getAllByRole('listitem');
    expect(cards).toHaveLength(5);
    expect(within(cards[0]).getByText('quarta-feira, 11/11')).toHaveAttribute(
      'datetime',
      '2026-11-11',
    );
    expect(within(cards[0]).getByText('Parcialmente nublado')).toBeInTheDocument();
    expect(within(cards[0]).getByText('25 °C')).toBeInTheDocument();
    expect(within(cards[0]).getByText('17,1 °C')).toBeInTheDocument();
    expect(within(cards[0]).getByText('Probabilidade máxima de precipitação')).toBeInTheDocument();
    expect(within(cards[0]).getByText('30%')).toBeInTheDocument();
    expect(within(cards[4]).getByText('domingo, 15/11')).toBeInTheDocument();
    expect(within(cards[4]).getByText('0%')).toBeInTheDocument();
    expect(screen.queryByText('Previsão incompleta')).not.toBeInTheDocument();
  });

  it('alterna todas as temperaturas sem mudar datas ou probabilidades', () => {
    const { rerender } = render(
      <ForecastList forecast={mockWeatherData.forecast} unit="celsius" />,
    );
    rerender(<ForecastList forecast={mockWeatherData.forecast} unit="fahrenheit" />);

    const cards = screen.getAllByRole('listitem');
    const temperatures = [
      ['77 °F', '63 °F'],
      ['79 °F', '64 °F'],
      ['76 °F', '63 °F'],
      ['78 °F', '62 °F'],
      ['79 °F', '63 °F'],
    ];
    for (const [index, card] of cards.entries()) {
      for (const value of temperatures[index]) {
        expect(within(card).getByText(value)).toBeInTheDocument();
      }
    }
    expect(within(cards[0]).getByText('quarta-feira, 11/11')).toBeInTheDocument();
    expect(within(cards[0]).getByText('30%')).toBeInTheDocument();
  });

  it('informa dados ausentes e condição desconhecida sem inventar valores', () => {
    const day = {
      date: 'inválida',
      weatherCode: 999,
      minimumC: null,
      maximumC: null,
      precipitationProbabilityMaxPercent: null,
    };
    render(<ForecastList forecast={[day]} unit="celsius" />);

    expect(screen.getByText('Previsão incompleta')).toBeInTheDocument();
    expect(screen.getByText('Data indisponível')).toBeInTheDocument();
    expect(screen.getByText('Condição indisponível')).toBeInTheDocument();
    expect(screen.getAllByText('Indisponível')).toHaveLength(3);
  });

  it('mostra o estado parcial informado mesmo com cinco dias completos', () => {
    render(<ForecastList forecast={mockWeatherData.forecast} unit="celsius" isPartial />);
    expect(screen.getByText('Previsão incompleta')).toBeInTheDocument();
  });

  it('sinaliza temperaturas não finitas sem exibi-las', () => {
    const forecast = mockWeatherData.forecast.map((day, index) =>
      index === 0 ? { ...day, minimumC: Number.NaN, maximumC: Number.POSITIVE_INFINITY } : day,
    );
    render(<ForecastList forecast={forecast} unit="fahrenheit" />);

    const region = screen.getByRole('region', { name: 'Previsão para cinco dias' });
    expect(within(region).getByText('Previsão incompleta')).toBeInTheDocument();
    expect(
      within(within(region).getAllByRole('listitem')[0]).getAllByText('Indisponível'),
    ).toHaveLength(2);
    expect(region).not.toHaveTextContent(/NaN|undefined|Infinity|∞/);
  });

  it('sinaliza como incompleta uma probabilidade fora do intervalo', () => {
    const forecast = mockWeatherData.forecast.map((day, index) =>
      index === 0 ? { ...day, precipitationProbabilityMaxPercent: 101 } : day,
    );
    render(<ForecastList forecast={forecast} unit="celsius" />);

    expect(screen.getByText('Previsão incompleta')).toBeInTheDocument();
    expect(
      within(screen.getAllByRole('listitem')[0]).getByText('Indisponível'),
    ).toBeInTheDocument();
    expect(screen.queryByText('101%')).not.toBeInTheDocument();
  });

  it('mostra estado vazio sem inventar dias', () => {
    render(<ForecastList forecast={[]} unit="celsius" />);
    expect(screen.getByText('Previsão indisponível.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
