import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import EmptyState from '../../src/components/states/EmptyState';
import ErrorState from '../../src/components/states/ErrorState';
import LoadingState from '../../src/components/states/LoadingState';

describe('estados de consulta', () => {
  it('anuncia o carregamento', () => {
    render(<LoadingState />);
    expect(screen.getByRole('status')).toHaveTextContent('Carregando...');
  });

  it('anuncia a mensagem de erro e permite tentar novamente pelo teclado', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState message="Não foi possível concluir a consulta." onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível concluir a consulta.');
    await user.tab();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('apresenta uma mensagem específica de timeout', () => {
    render(<ErrorState message="A consulta excedeu o tempo limite." onRetry={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('A consulta excedeu o tempo limite.');
  });

  it('anuncia o título e a dica do estado vazio', () => {
    render(<EmptyState title="Cidade não encontrada." hint="Tente buscar por outro nome." />);

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Cidade não encontrada.');
    expect(status).toHaveTextContent('Tente buscar por outro nome.');
  });
});
