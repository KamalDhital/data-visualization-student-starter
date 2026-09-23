import { colors, statusOptions } from './config';
import type { DiabetesStatus } from './types';

interface ColorLegendProps {
  visibleStatuses: Set<DiabetesStatus>;
  hoveredStatus: DiabetesStatus | null;
  onToggleStatus: (status: DiabetesStatus) => void;
  onHoverStatus: (status: DiabetesStatus | null) => void;
}

export function ColorLegend({
  visibleStatuses,
  hoveredStatus,
  onToggleStatus,
  onHoverStatus,
}: ColorLegendProps) {
  return (
    <g transform="translate(650, 38)" aria-label="Interactive diabetes status color legend">
      {statusOptions.map((option, index) => {
        const isVisible = visibleStatuses.has(option.value);
        const isHovered = hoveredStatus === option.value;

        // Each legend row is keyboard and pointer interactive so it can filter the bars.
        return (
          <g
            key={option.value}
            role="button"
            tabIndex={0}
            transform={`translate(0, ${index * 34})`}
            className="cursor-pointer outline-none"
            opacity={isVisible ? 1 : 0.36}
            onClick={() => onToggleStatus(option.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onToggleStatus(option.value);
              }
            }}
            onPointerEnter={() => onHoverStatus(option.value)}
            onPointerLeave={() => onHoverStatus(null)}
          >
            <rect
              x={0}
              y={-15}
              width={190}
              height={28}
              rx={6}
              fill={isHovered ? '#e2e8f0' : 'transparent'}
            />
            <rect x={10} y={-7} width={14} height={14} rx={3} fill={option.color} />
            <text x={34} y={5} fill={colors.label} className="text-[13px] font-semibold">
              {option.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}
