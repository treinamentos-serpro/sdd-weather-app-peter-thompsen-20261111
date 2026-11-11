import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SearchBar from '../../src/components/SearchBar';

describe('SearchBar', () => {
  it('associa o campo à label e envia uma busca normalizada pelo teclado', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const search = screen.getByRole('search');
    expect(search).toContainElement(screen.getByLabelText('Cidade'));
    await user.tab();
    await user.keyboard(" São Tomé-d'Ávila {Enter}");

    expect(onSearch).toHaveBeenCalledOnce();
    expect(onSearch).toHaveBeenCalledWith("São Tomé-d'Ávila");
  });

  it.each([
    '',
    '   ',
  ])('informa entrada vazia %j sem buscar e permite corrigir a cidade', async (value) => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByLabelText('Cidade');
    if (value) await user.type(input, value);
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(onSearch).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Informe uma cidade.');
    expect(input).toHaveAccessibleDescription('Informe uma cidade.');
    expect(input).toHaveAttribute('aria-invalid', 'true');

    await user.clear(input);
    await user.type(input, 'Recife{Enter}');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(onSearch).toHaveBeenCalledOnce();
    expect(onSearch).toHaveBeenCalledWith('Recife');
  });

  it('desabilita os controles e não envia busca enquanto desabilitado', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const { rerender } = render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByLabelText('Cidade'), 'Recife');
    rerender(<SearchBar onSearch={onSearch} disabled />);

    expect(screen.getByLabelText('Cidade')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('mantém a descrição existente ao exibir erro de validação', async () => {
    const user = userEvent.setup();
    render(
      <>
        <p id="search-help">Digite o nome da cidade.</p>
        <SearchBar onSearch={vi.fn()} descriptionId="search-help" />
      </>,
    );

    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(screen.getByLabelText('Cidade')).toHaveAccessibleDescription(
      'Digite o nome da cidade. Informe uma cidade.',
    );
  });

  it('permite digitar sem enviar enquanto apenas o envio está desabilitado', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} submitDisabled />);

    const input = screen.getByLabelText('Cidade');
    await user.type(input, 'Recife{Enter}');
    expect(input).toHaveValue('Recife');
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
    expect(onSearch).not.toHaveBeenCalled();
  });
});
