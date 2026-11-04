import { max } from 'd3-array';
import { scaleBand, scaleLinear } from 'd3-scale';
import { formatPercent } from '../format';
import type { IndustryDatum } from '../types';
import { Card } from './Card';

// Ranked bar chart comparing industries by average AI adoption.
export function IndustryComparison({ data }: { data: IndustryDatum[] }) {
  const width = 520;
  const height = 260;

  // Show the top industries so the chart stays readable in a dashboard card.
  const sorted = [...data].sort((a, b) => b.adoption - a.adoption).slice(0, 8);

  // Horizontal bars use length, the most precise encoding here, for adoption rate.
  const xScale = scaleLinear()
    .domain([0, max(sorted, (datum) => datum.adoption) ?? 100])
    .nice()
    .range([128, width - 28]);
  const yScale = scaleBand<string>()
    .domain(sorted.map((datum) => datum.industry))
    .range([24, height - 24])
    .padding(0.28);

  return (
    <Card className="min-w-0" title="Industry Comparison">
      <svg
        className="aspect-[520/260] h-auto min-h-56 w-full"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
      >
        <title>Ranked industry comparison by AI adoption</title>
        {/* Each group draws one industry label, bar, and value label. */}
        {sorted.map((datum) => (
          <g key={datum.industry}>
            <text
              x={16}
              y={(yScale(datum.industry) ?? 0) + yScale.bandwidth() / 2 + 4}
              className="fill-slate-600 text-[11px]"
            >
              {datum.industry}
            </text>
            <rect
              x={128}
              y={yScale(datum.industry)}
              width={xScale(datum.adoption) - 128}
              height={yScale.bandwidth()}
              rx={4}
              fill="#0f766e"
            />
            <text
              x={xScale(datum.adoption) + 8}
              y={(yScale(datum.industry) ?? 0) + yScale.bandwidth() / 2 + 4}
              className="fill-slate-500 text-[11px]"
            >
              {formatPercent(datum.adoption)}
            </text>
          </g>
        ))}
      </svg>
    </Card>
  );
}
