import type { ScaleBand, ScaleLinear } from 'd3-scale';
import { chart, colors } from './config';
import { formatCount } from './format';
import type { AgeDatum } from './types';

interface AxesProps {
  data: AgeDatum[];
  innerWidth: number;
  innerHeight: number;
  xScale: ScaleBand<string>;
  yScale: ScaleLinear<number, number>;
  yTicks: number[];
}

export function Axes({ data, innerWidth, innerHeight, xScale, yScale, yTicks }: AxesProps) {
  return (
    <>
      <g transform={`translate(${chart.margin.left}, ${chart.margin.top})`}>
        {/* Horizontal gridlines and y-axis labels. */}
        {yTicks.map((tick) => (
          <g key={tick} transform={`translate(0, ${yScale(tick)})`}>
            <line x1={0} x2={innerWidth} stroke={colors.grid} strokeWidth={1} />
            <text x={-14} y={5} textAnchor="end" fill={colors.tick} className="text-[13px]">
              {formatCount(tick)}
            </text>
          </g>
        ))}

        <line y1={innerHeight} y2={innerHeight} x2={innerWidth} stroke={colors.axis} strokeWidth={2} />
        <line y2={innerHeight} stroke={colors.axis} strokeWidth={2} />

        {/* Age group labels sit under the grouped bars. */}
        {data.map((datum) => {
          const x = (xScale(datum.ageGroup) ?? 0) + xScale.bandwidth() / 2;

          return (
            <text
              key={datum.ageGroup}
              x={x}
              y={innerHeight + 28}
              textAnchor="middle"
              fill={colors.tick}
              className="text-[13px] font-medium"
            >
              {datum.ageGroup}
            </text>
          );
        })}
      </g>

      <text
        x={chart.width / 2}
        y={chart.height - 34}
        textAnchor="middle"
        fill="#020617"
        className="text-[17px] font-bold"
      >
        Age group of survey respondent
      </text>
      <text
        x={-(chart.height / 2)}
        y={32}
        textAnchor="middle"
        transform="rotate(-90)"
        fill="#020617"
        className="text-[17px] font-bold"
      >
        Number of records in the dataset
      </text>
    </>
  );
}
