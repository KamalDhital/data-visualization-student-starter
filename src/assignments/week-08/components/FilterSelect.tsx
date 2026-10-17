// Reusable dropdown used by the Year, Industry, and Region controls.
export function FilterSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="flex min-w-36 flex-1 flex-col gap-1.5 text-xs font-bold uppercase text-slate-500">
      {label}
      <select
        className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold normal-case text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
