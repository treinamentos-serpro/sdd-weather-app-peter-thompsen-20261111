interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-white shadow-glass backdrop-blur-md">
      <p role="alert">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 min-h-11 rounded-lg bg-white px-4 py-2 font-medium text-night-900 hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
      >
        Tentar novamente
      </button>
    </div>
  );
}
