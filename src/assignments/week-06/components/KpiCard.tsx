const accentStyles = {
  amber: 'bg-amber-500',
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  teal: 'bg-teal-600',
};

// Small summary card for one top-level dashboard metric.
export function KpiCard({
  accent = 'blue',
  label,
  value,
  note,
}: {
  accent?: keyof typeof accentStyles;
  label: string;
  note: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-bold uppercase text-slate-500">{label}</div>
        <span className={`h-2.5 w-8 rounded-full ${accentStyles[accent]}`} />
      </div>
      <div className="mt-3 text-3xl font-black text-slate-950">{value}</div>
      <div className="mt-2 text-sm text-slate-500">{note}</div>
    </div>
  );
}
