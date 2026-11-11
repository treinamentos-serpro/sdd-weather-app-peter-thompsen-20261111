import type { Unit } from '../types/weather';

interface UnitToggleProps {
  unit: Unit;
  onChange: (unit: Unit) => void;
}

export default function UnitToggle({ unit, onChange }: UnitToggleProps) {
  const options: { value: Unit; label: string }[] = [
    { value: 'celsius', label: '°C' },
    { value: 'fahrenheit', label: '°F' },
  ];

  return (
    <div
      role="group"
      aria-label="Unidade de temperatura"
      className="inline-flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1 backdrop-blur-md"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={unit === option.value}
          onClick={() => {
            if (unit !== option.value) onChange(option.value);
          }}
          className={`min-h-11 min-w-11 rounded-lg px-3 font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 ${
            unit === option.value ? 'bg-white text-night-900' : 'text-white hover:bg-white/10'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
