import { max } from 'd3-array';
import { scaleLinear, scalePoint } from 'd3-scale';
import { Card } from './Card';
import type { TimelineDatum } from '../types';

// Line chart showing how average AI adoption changes by quarter.
export function TimelineChart({ data }: { data: TimelineDatum[] }) {
  const width = 760;
  const height = 250;

  // Point scale keeps quarters evenly spaced even though the input is categorical text.
  const xScale = scalePoint<string>()
    .domain(data.map((datum) => datum.period))
    .range([58, width - 26])
    .padding(0.5);
  const yScale = scaleLinear()
    .domain([0, max(data, (datum) => datum.adoption) ?? 100])
    .nice()
    .range([height - 46, 26]);

  // SVG polyline expects one string of "x,y" coordinate pairs.
  const points = data.map((datum) => `${xScale(datum.period)},${yScale(datum.adoption)}`).join(' ');

  return (
    <Card className="min-w-0" title="AI Adoption Timeline">
      <svg
        className="aspect-[760/250] h-auto min-h-48 w-full"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
      >
        <title>AI adoption timeline by quarter</title>
        <rect width={width} height={height} fill="#ffffff" />
        {/* Horizontal gridlines make trend magnitude easier to compare. */}
        {yScale.ticks(4).map((tick) => (
          <g key={tick}>
            <line x1={50} x2={width - 24} y1={yScale(tick)} y2={yScale(tick)} stroke="#e2e8f0" strokeDasharray="4 4" />
            <text x={18} y={yScale(tick) + 4} className="fill-slate-400 text-[10px]">
              {tick}%
            </text>
          </g>
        ))}
        {/* The line connects quarterly averages; circles mark the exact quarters. */}
        <polyline
          fill="none"
          stroke="#0000ff"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
          points={points}
        />
        {data.map((datum) => (
          <g key={datum.period}>
            <circle cx={xScale(datum.period)} cy={yScale(datum.adoption)} r={4.5} fill="#0000ff" stroke="#ffffff" strokeWidth={2} />
            <text
              x={xScale(datum.period)}
              y={height - 18}
              textAnchor="middle"
              className="fill-slate-500 text-[10px]"
            >
              {datum.period.replace('Q', "'Q")}
            </text>
          </g>
        ))}
      </svg>
    </Card>
  );
}
