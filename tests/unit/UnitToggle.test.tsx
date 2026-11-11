import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import UnitToggle from '../../src/components/UnitToggle';
import type { Unit } from '../../src/types/weather';

describe('UnitToggle', () => {
  it('expõe o grupo e reflete a unidade recebida nas props', () => {
    const onChange = vi.fn();
    const { rerender } = render(<UnitToggle unit="celsius" onChange={onChange} />);
    const group = screen.getByRole('group', { name: 'Unidade de temperatura' });
    const celsius = within(group).getByRole('button', { name: '°C', pressed: true });
    const fahrenheit = within(group).getByRole('button', { name: '°F', pressed: false });

    rerender(<UnitToggle unit="fahrenheit" onChange={onChange} />);
    expect(celsius).toHaveAttribute('aria-pressed', 'false');
    expect(fahrenheit).toHaveAttribute('aria-pressed', 'true');
  });

  it('alterna as duas unidades usando Tab, Enter e Espaço', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    function ControlledToggle() {
      const [unit, setUnit] = useState<Unit>('celsius');
      return (
        <UnitToggle
          unit={unit}
          onChange={(nextUnit) => {
            onChange(nextUnit);
            setUnit(nextUnit);
          }}
        />
      );
    }

    render(<ControlledToggle />);
    const celsius = screen.getByRole('button', { name: '°C' });
    const fahrenheit = screen.getByRole('button', { name: '°F' });

    await user.tab();
    expect(celsius).toHaveFocus();
    await user.tab();
    expect(fahrenheit).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(fahrenheit).toHaveAttribute('aria-pressed', 'true');
    expect(onChange).toHaveBeenNthCalledWith(1, 'fahrenheit');

    await user.tab({ shift: true });
    expect(celsius).toHaveFocus();
    await user.keyboard(' ');
    expect(celsius).toHaveAttribute('aria-pressed', 'true');
    expect(onChange).toHaveBeenNthCalledWith(2, 'celsius');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('não notifica mudança ao selecionar novamente a unidade ativa', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<UnitToggle unit="celsius" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: '°C' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
