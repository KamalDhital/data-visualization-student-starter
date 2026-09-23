import { useEffect, useMemo, useState } from 'react';
import { csv } from 'd3-fetch';
import { Axes } from './Axes';
import { ColorLegend } from './ColorLegend';
import { chart, DATASET_FILE, statusOptions } from './config';
import { useAgeGroupCounts } from './data';
import { Marks } from './Marks';
import { TitleBlock } from './TitleBlock';
import { Tooltip } from './Tooltip';
import type { DatasetRow, DiabetesStatus, TooltipState } from './types';
import { useScales } from './useScales';

const DATASET_URL = `${import.meta.env.BASE_URL}${DATASET_FILE}`;

// Top-level component: loads data, stores interaction state, and composes the chart pieces.
export function CdcDiabetesAgeInteractiveChart() {
  const [rows, setRows] = useState<DatasetRow[]>([]);
  const [visibleStatuses, setVisibleStatuses] = useState<DiabetesStatus[]>([0, 1]);
  const [hoveredStatus, setHoveredStatus] = useState<DiabetesStatus | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Load only the two CSV columns this chart needs.
  useEffect(() => {
    void csv(DATASET_URL, (row) => ({
      Age: Number(row.Age),
      Diabetes_binary: Number(row.Diabetes_binary),
    })).then(setRows);
  }, []);

  const data = useAgeGroupCounts(rows);
  const visibleStatusSet = useMemo(() => new Set(visibleStatuses), [visibleStatuses]);
  const totalRecords = useMemo(() => data.reduce((sum, datum) => sum + datum.total, 0), [data]);
  const { innerWidth, innerHeight, statusScale, xScale, yScale, yTicks } = useScales(
    data,
    visibleStatuses,
  );

  // Clicking a legend item hides/shows that status; clicking the last visible item resets both.
  const toggleStatus = (status: DiabetesStatus) => {
    setTooltip(null);
    setVisibleStatuses((current) => {
      if (current.includes(status) && current.length === 1) return [0, 1];
      if (current.includes(status)) return current.filter((value) => value !== status);
      return statusOptions
        .map((option) => option.value)
        .filter((value) => value === status || current.includes(value));
    });
  };

  return (
    <main className="flex h-full min-h-0 w-full items-center justify-center overflow-hidden bg-slate-50 p-3 sm:p-4">
      <svg
        className="block h-full w-full"
        viewBox={`0 0 ${chart.width} ${chart.height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-labelledby="week05-chart-title week05-chart-description"
      >
        <title id="week05-chart-title">CDC diabetes records by age group and diabetes status</title>
        <desc id="week05-chart-description">
          A grouped bar chart with hover tooltips and a clickable color legend for diabetes status.
        </desc>

        <rect width={chart.width} height={chart.height} rx="8" fill="#f8fafc" />
        <TitleBlock totalRecords={totalRecords} />
        <ColorLegend
          visibleStatuses={visibleStatusSet}
          hoveredStatus={hoveredStatus}
          onToggleStatus={toggleStatus}
          onHoverStatus={setHoveredStatus}
        />
        <Axes
          data={data}
          innerWidth={innerWidth}
          innerHeight={innerHeight}
          xScale={xScale}
          yScale={yScale}
          yTicks={yTicks}
        />
        <Marks
          data={data}
          hoveredStatus={hoveredStatus}
          innerHeight={innerHeight}
          setTooltip={setTooltip}
          statusScale={statusScale}
          tooltip={tooltip}
          visibleStatuses={visibleStatusSet}
          xScale={xScale}
          yScale={yScale}
        />
        <Tooltip tooltip={tooltip} />
      </svg>
    </main>
  );
}
