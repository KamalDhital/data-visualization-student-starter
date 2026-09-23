import { colors } from './config';
import { formatCount } from './format';

interface TitleBlockProps {
  totalRecords: number;
}

// Header text for the visualization, kept separate from the plotting code.
export function TitleBlock({ totalRecords }: TitleBlockProps) {
  return (
    <g transform="translate(48, 34)">
      <text fill={colors.title} className="text-[30px] font-bold">
        CDC Diabetes Records by Age Group
      </text>
      <text y="34" fill={colors.subtitle} className="text-[16px] font-medium">
        Hover a bar for exact values. Click a legend swatch to show or hide a status.
      </text>
      <text y="60" fill={colors.subtitle} className="text-[14px]">
        Total records shown: {formatCount(totalRecords)}
      </text>
    </g>
  );
}
