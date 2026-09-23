import type { ScaleBand, ScaleLinear } from 'd3-scale';
import { chart, statusOptions } from './config';
import { formatCount } from './format';
import type { AgeDatum, DiabetesStatus, TooltipState } from './types';

interface MarksProps {
  data: AgeDatum[];
  hoveredStatus: DiabetesStatus | null;
  innerHeight: number;
  setTooltip: (tooltip: TooltipState | null) => void;
  statusScale: ScaleBand<DiabetesStatus>;
  tooltip: TooltipState | null;
  visibleStatuses: Set<DiabetesStatus>;
  xScale: ScaleBand<string>;
  yScale: ScaleLinear<number, number>;
}

export function Marks({
  data,
  hoveredStatus,
  innerHeight,
  setTooltip,
  statusScale,
  tooltip,
  visibleStatuses,
  xScale,
  yScale,
}: MarksProps) {
  return (
    <g transform={`translate(${chart.margin.left}, ${chart.margin.top})`}>
      {data.map((datum) => {
        const x = xScale(datum.ageGroup) ?? 0;

        return (
          <g key={datum.ageCode}>
            {statusOptions.map((option) => {
              if (!visibleStatuses.has(option.value)) return null;

              const count = datum.counts[option.value];
              // Combine the age-group position with the inner status position for grouped bars.
              const barX = x + (statusScale(option.value) ?? 0);
              const y = yScale(count);
              const barHeight = Math.max(innerHeight - y, 0);
              const isDimmed =
                (hoveredStatus !== null && hoveredStatus !== option.value) ||
                (tooltip !== null &&
                  (tooltip.status !== option.value || tooltip.ageGroup !== datum.ageGroup));

              return (
                <rect
                  key={option.value}
                  x={barX}
                  y={y}
                  width={statusScale.bandwidth()}
                  height={barHeight}
                  fill={option.color}
                  opacity={isDimmed ? 0.28 : 1}
                  className="cursor-pointer transition-opacity"
                  onPointerEnter={() =>
                    // Store SVG coordinates so the tooltip can appear beside the hovered bar.
                    setTooltip({
                      x: chart.margin.left + barX + statusScale.bandwidth() / 2,
                      y: chart.margin.top + y + Math.max(barHeight / 2, 18),
                      ageGroup: datum.ageGroup,
                      status: option.value,
                      count,
                      total: datum.total,
                    })
                  }
                  onPointerLeave={() => setTooltip(null)}
                >
                  <title>
                    {datum.ageGroup}, {option.label}: {formatCount(count)}
                  </title>
                </rect>
              );
            })}
          </g>
        );
      })}
    </g>
  );
}
