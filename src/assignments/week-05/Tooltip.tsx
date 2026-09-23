import { chart } from './config';
import { getStatusOption } from './data';
import { formatCount } from './format';
import type { TooltipState } from './types';

interface TooltipProps {
  tooltip: TooltipState | null;
}

export function Tooltip({ tooltip }: TooltipProps) {
  if (!tooltip) return null;

  // Clamp the tooltip horizontally so it stays inside the SVG viewBox.
  return (
    <g transform={`translate(${Math.min(tooltip.x + 16, chart.width - 230)}, ${tooltip.y - 46})`}>
      <rect width={214} height={86} rx={8} fill="#0f172a" opacity={0.96} />
      <text x={14} y={24} fill="#f8fafc" className="text-[14px] font-bold">
        Age {tooltip.ageGroup}
      </text>
      <text x={14} y={48} fill="#e2e8f0" className="text-[13px]">
        {getStatusOption(tooltip.status).label}: {formatCount(tooltip.count)}
      </text>
      <text x={14} y={70} fill="#cbd5e1" className="text-[12px]">
        {((tooltip.count / tooltip.total) * 100).toFixed(1)}% of this age group
      </text>
    </g>
  );
}
