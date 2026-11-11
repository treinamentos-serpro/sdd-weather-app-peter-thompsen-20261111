import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import UnitToggle from '../../src/components/UnitToggle';
import { mockWeatherData } from '../../src/mocks/weatherData';
import type { Unit } from '../../src/types/weather';

describe('CurrentWeather', () => {
  it('apresenta cidade, condição, referência e métricas com unidades', () => {
    render(
      <CurrentWeather
        city={mockWeatherData.city}
        current={mockWeatherData.current}
        unit="celsius"
      />,
    );

    const region = screen.getByRole('region', { name: 'Clima atual' });
    expect(within(region).getByRole('heading', { name: 'São Paulo' })).toBeInTheDocument();
    expect(within(region).getByText('22,4 °C')).toBeInTheDocument();
    expect(within(region).getByText('Parcialmente nublado')).toBeInTheDocument();
    expect(within(region).getByText('11/11/2026 às 09:00')).toHaveAttribute(
      'datetime',
      '2026-11-11T09:00',
    );
    expect(within(region).getByText('68 %')).toBeInTheDocument();
    expect(within(region).getByText('12,5 km/h')).toBeInTheDocument();
    expect(within(region).getByText('0 mm')).toBeInTheDocument();
    expect(within(region).getByText('1.013,2 hPa')).toBeInTheDocument();
  });

  it('apresenta o código de céu limpo e 18 °C', () => {
    render(
      <CurrentWeather
        city={mockWeatherData.city}
        current={{ ...mockWeatherData.current, temperatureC: 18, weatherCode: 0 }}
        unit="celsius"
      />,
    );
    expect(screen.getByText('18 °C')).toBeInTheDocument();
    expect(screen.getByText('Céu limpo')).toBeInTheDocument();
  });

  it('atualiza somente a temperatura ao mudar a unidade', () => {
    const { rerender } = render(
      <CurrentWeather
        city={mockWeatherData.city}
        current={mockWeatherData.current}
        unit="celsius"
      />,
    );
    rerender(
      <CurrentWeather
        city={mockWeatherData.city}
        current={mockWeatherData.current}
        unit="fahrenheit"
      />,
    );

    expect(screen.getByText('72 °F')).toBeInTheDocument();
    expect(screen.getByText('12,5 km/h')).toBeInTheDocument();
  });

  it('converte 0 °C em 32 °F ao selecionar Fahrenheit', async () => {
    const user = userEvent.setup();

    function ControlledWeather() {
      const [unit, setUnit] = useState<Unit>('celsius');
      return (
        <>
          <UnitToggle unit={unit} onChange={setUnit} />
          <CurrentWeather
            city={mockWeatherData.city}
            current={{ ...mockWeatherData.current, temperatureC: 0 }}
            unit={unit}
          />
        </>
      );
    }

    render(<ControlledWeather />);
    const current = screen.getByRole('region', { name: 'Clima atual' });
    expect(within(current).getByText('0 °C')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '°C', pressed: true })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '°F', pressed: false }));

    expect(screen.getByRole('button', { name: '°F', pressed: true })).toBeInTheDocument();
    expect(within(current).getByText('32 °F')).toBeInTheDocument();
    expect(within(current).queryByText('0 °C')).not.toBeInTheDocument();
  });

  it('apresenta campos ausentes e código desconhecido sem inventar valores', () => {
    render(
      <CurrentWeather
        city={mockWeatherData.city}
        current={{
          temperatureC: null,
          weatherCode: 999,
          time: null,
          humidityPercent: null,
          windSpeedKmh: null,
          precipitationMm: null,
          surfacePressureHpa: null,
        }}
        unit="celsius"
      />,
    );

    expect(screen.getAllByText('Indisponível')).toHaveLength(5);
    expect(screen.getByText('Condição indisponível')).toBeInTheDocument();
    expect(screen.queryByText(/Referência:/)).not.toBeInTheDocument();
    expect(screen.queryByText('999')).not.toBeInTheDocument();
  });

  it('não exibe números não finitos nas métricas ou na temperatura', () => {
    render(
      <CurrentWeather
        city={mockWeatherData.city}
        current={{
          ...mockWeatherData.current,
          temperatureC: Number.NaN,
          humidityPercent: Number.POSITIVE_INFINITY,
          windSpeedKmh: Number.NaN,
          precipitationMm: Number.NEGATIVE_INFINITY,
          surfacePressureHpa: null,
        }}
        unit="fahrenheit"
      />,
    );
    const region = screen.getByRole('region', { name: 'Clima atual' });
    expect(within(region).getAllByText('Indisponível')).toHaveLength(5);
    expect(region).not.toHaveTextContent(/NaN|undefined|Infinity|∞/);
  });
});
