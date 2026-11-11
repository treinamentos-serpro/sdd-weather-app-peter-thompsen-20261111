interface EmptyStateProps {
  title: string;
  hint: string;
}

export default function EmptyState({ title, hint }: EmptyStateProps) {
  return (
    <div
      role="status"
      className="rounded-xl border border-white/10 bg-white/5 p-5 text-white shadow-glass backdrop-blur-md"
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-2 text-sm text-slate-300">{hint}</p>
    </div>
  );
}
