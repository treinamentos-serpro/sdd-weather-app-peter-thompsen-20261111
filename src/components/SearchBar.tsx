import type { FormEvent } from 'react';
import { useId, useState } from 'react';

interface SearchBarProps {
  onSearch: (city: string) => void;
  disabled?: boolean;
  submitDisabled?: boolean;
  descriptionId?: string;
}

export default function SearchBar({
  onSearch,
  disabled = false,
  submitDisabled = false,
  descriptionId,
}: SearchBarProps) {
  const [city, setCity] = useState('');
  const [hasError, setHasError] = useState(false);
  const inputId = useId();
  const errorId = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || submitDisabled) return;

    const query = city.trim();
    if (!query) {
      setHasError(true);
      return;
    }

    setHasError(false);
    onSearch(query);
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white shadow-glass backdrop-blur-md"
    >
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium">
        Cidade
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id={inputId}
          type="text"
          value={city}
          onChange={(event) => {
            setCity(event.target.value);
            setHasError(false);
          }}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={
            [descriptionId, hasError ? errorId : undefined].filter(Boolean).join(' ') || undefined
          }
          placeholder="Digite o nome da cidade"
          className="min-h-11 min-w-0 flex-1 rounded-lg border border-white/20 bg-night-900/70 px-4 py-2 text-white placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || submitDisabled}
          className="min-h-11 rounded-lg bg-accent-600 px-5 py-2 font-medium text-white enabled:hover:bg-night-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Buscar
        </button>
      </div>
      {hasError && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-red-200">
          Informe uma cidade.
        </p>
      )}
    </form>
  );
}
