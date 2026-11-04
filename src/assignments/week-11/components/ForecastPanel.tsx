import { average } from '../data';
import { formatPercent } from '../format';
import type { CompanyRow, TimelineDatum } from '../types';
import { Card } from './Card';

// Summary panel that turns the current selection into simple forward-looking signals.
export function ForecastPanel({
  filteredRows,
  timeline,
  selectedCountry,
}: {
  filteredRows: CompanyRow[];
  selectedCountry: string | null;
  timeline: TimelineDatum[];
}) {
  // This is intentionally a simple prototype forecast: continue the average quarterly change.
  const first = timeline[0]?.adoption ?? 0;
  const last = timeline[timeline.length - 1]?.adoption ?? 0;
  const quarterlyChange = timeline.length > 1 ? (last - first) / (timeline.length - 1) : 0;
  const nextQuarter = Math.max(0, Math.min(100, last + quarterlyChange));
  const avgMaturity = average(filteredRows, (row) => row.aiMaturityScore);
  const avgSatisfaction = average(filteredRows, (row) => row.customerSatisfaction);
  const scope = selectedCountry ? selectedCountry : 'current filter set';

  return (
    <Card title="Future Trends & Forecasting Panel">
      <div className="grid gap-4 p-4 md:grid-cols-3">
        <div className="rounded-md border border-slate-200 bg-[#f8fafc] p-4">
          <div className="text-xs font-bold uppercase text-slate-500">Projected next quarter</div>
          <div className="mt-2 text-4xl font-black text-blue-700">{formatPercent(nextQuarter)}</div>
          <p className="mt-2 text-sm text-slate-600">Linear continuation from the filtered quarterly adoption trend.</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-[#f8fafc] p-4">
          <div className="text-xs font-bold uppercase text-slate-500">Maturity signal</div>
          <div className="mt-2 text-4xl font-black text-teal-700">{avgMaturity.toFixed(2)}</div>
          <p className="mt-2 text-sm text-slate-600">Average AI maturity score for the {scope}.</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-[#f8fafc] p-4">
          <div className="text-xs font-bold uppercase text-slate-500">Experience signal</div>
          <div className="mt-2 text-4xl font-black text-green-700">{avgSatisfaction.toFixed(1)}</div>
          <p className="mt-2 text-sm text-slate-600">Customer satisfaction average paired with the adoption trend.</p>
        </div>
      </div>
    </Card>
  );
}
