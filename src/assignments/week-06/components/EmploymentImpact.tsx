import { scaleBand, scaleLinear } from 'd3-scale';
import type { IndustryDatum } from '../types';
import { Card } from './Card';

// Diverging bar chart for net jobs: jobs created minus jobs displaced.
export function EmploymentImpact({ data }: { data: IndustryDatum[] }) {
  const width = 520;
  const height = 260;

  // Positive netJobs means more jobs created than displaced for that industry.
  const sorted = [...data]
    .map((datum) => ({ ...datum, netJobs: datum.jobsCreated - datum.jobsDisplaced }))
    .sort((a, b) => b.netJobs - a.netJobs)
    .slice(0, 8);
  const minNet = Math.min(0, ...sorted.map((datum) => datum.netJobs));
  const maxNet = Math.max(0, ...sorted.map((datum) => datum.netJobs));

  // The x scale includes zero so bars can grow left or right from the baseline.
  const xScale = scaleLinear().domain([minNet, maxNet]).nice().range([132, width - 34]);
  const yScale = scaleBand<string>()
    .domain(sorted.map((datum) => datum.industry))
    .range([24, height - 24])
    .padding(0.28);
  const zeroX = xScale(0);

  return (
    <Card className="min-w-0" title="Employment Impact">
      <svg
        className="aspect-[520/260] h-auto min-h-56 w-full"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
      >
        <title>Net jobs created minus jobs displaced by industry</title>
        {/* Zero line separates negative and positive workforce impact. */}
        <line x1={zeroX} x2={zeroX} y1={18} y2={height - 18} stroke="#94a3b8" />
        {sorted.map((datum) => {
          // Negative bars start left of zero; positive bars start at zero.
          const x = Math.min(zeroX, xScale(datum.netJobs));
          const widthValue = Math.abs(xScale(datum.netJobs) - zeroX);

          return (
            <g key={datum.industry}>
              <text
                x={16}
                y={(yScale(datum.industry) ?? 0) + yScale.bandwidth() / 2 + 4}
                className="fill-slate-600 text-[11px]"
              >
                {datum.industry}
              </text>
              <rect
                x={x}
                y={yScale(datum.industry)}
                width={widthValue}
                height={yScale.bandwidth()}
                rx={4}
                fill={datum.netJobs >= 0 ? '#16a34a' : '#dc2626'}
              />
              <text
                x={datum.netJobs >= 0 ? xScale(datum.netJobs) + 6 : xScale(datum.netJobs) - 6}
                y={(yScale(datum.industry) ?? 0) + yScale.bandwidth() / 2 + 4}
                textAnchor={datum.netJobs >= 0 ? 'start' : 'end'}
                className="fill-slate-500 text-[11px]"
              >
                {datum.netJobs.toFixed(1)}
              </text>
            </g>
          );
        })}
      </svg>
    </Card>
  );
}
