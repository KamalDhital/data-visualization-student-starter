import { useMemo } from 'react';
import { max } from 'd3-array';
import { scaleBand, scaleLinear } from 'd3-scale';
import { chart, statusOptions } from './config';
import type { AgeDatum, DiabetesStatus } from './types';

export function useScales(data: AgeDatum[], visibleStatuses: DiabetesStatus[]) {
  const innerWidth = chart.width - chart.margin.left - chart.margin.right;
  const innerHeight = chart.height - chart.margin.top - chart.margin.bottom;

  // Grouped bars use the largest individual category count, not a stacked total.
  const maxVisibleCount =
    max(data, (datum) => max(visibleStatuses, (status) => datum.counts[status]) ?? 0) ?? 0;

  // Outer scale: one slot per age group.
  const xScale = useMemo(
    () =>
      scaleBand()
        .domain(data.map((datum) => datum.ageGroup))
        .range([0, innerWidth])
        .padding(0.03),
    [data, innerWidth],
  );

  const yScale = useMemo(
    () => scaleLinear().domain([0, maxVisibleCount]).nice().range([innerHeight, 0]),
    [innerHeight, maxVisibleCount],
  );

  // Inner scale: positions the diabetes-status bars side by side inside each age slot.
  const statusScale = useMemo(
    () =>
      scaleBand<DiabetesStatus>()
        .domain(statusOptions.map((option) => option.value))
        .range([0, xScale.bandwidth()])
        .paddingInner(0)
        .paddingOuter(0),
    [xScale],
  );

  return {
    innerWidth,
    innerHeight,
    statusScale,
    xScale,
    yScale,
    yTicks: yScale.ticks(6),
  };
}
