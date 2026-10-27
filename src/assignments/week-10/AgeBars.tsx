import { useEffect, useMemo, useRef } from 'react';
import { brushX, type D3BrushEvent } from 'd3-brush';
import { pointer, select } from 'd3-selection';
import { scaleBand, scaleLinear } from 'd3-scale';
import { statusOptions } from '../week-05/config';
import { useAgeGroupCounts } from '../week-05/data';
import { number, type Focus, type HealthRow } from './model';

// The parent owns filters and selection; this component draws them and reports gestures.
interface Props {
  // All responses remaining after the dropdown and legend filters.
  rows: HealthRow[];
  // Responses in brushed age groups; these form the solid foreground bars.
  selected: HealthRow[];
  percent: boolean;
  focus: Focus | null;
  onFocus: (focus: Focus | null) => void;
  onBrush: (ages: number[] | null) => void;
}
export function AgeBars({ rows, selected, percent, focus, onFocus, onBrush }: Props) {
  // React renders this SVG group; D3 inserts its brush rectangle and resize handles.
  const overlay = useRef<SVGGElement>(null);
  // Reuse Week 05's memoized counts. Both arrays always contain the same 13 age groups.
  const all = useAgeGroupCounts(rows);
  const subset = useAgeGroupCounts(selected);
  // SVG viewBox dimensions and margins; CSS scales the chart to the available width.
  const width = 1100,
    height = 560,
    left = 62,
    top = 20,
    bottom = 65,
    right = 16;
  const iw = width - left - right,
    ih = height - top - bottom;
  // Each age gets a band split into two adjacent status bars. Lower padding widens bars.
  const x = useMemo(
    () =>
      scaleBand<string>()
        .domain(all.map((d) => d.ageGroup))
        .range([0, iw])
        .padding(0.16),
    [all, iw],
  );
  // Use the full filtered counts for a stable axis while brushing. SVG y increases downward.
  // Percent mode uses each age group's own total after filtering, with a 0-100 scale.
  const y = useMemo(
    () =>
      scaleLinear()
        .domain([0, percent ? 100 : Math.max(1, ...all.flatMap((d) => Object.values(d.counts)))])
        .nice()
        .range([ih, 0]),
    [all, percent, ih],
  );
  // D3 owns the overlay; stable scales keep brushing intact during hover updates.
  useEffect(() => {
    const group = select(overlay.current!);
    let dragging = false;
    const behavior = brushX<unknown>()
      .extent([
        [0, 0],
        [iw, ih],
      ])
      .on('start', () => {
        // Suppress hover highlighting while the pointer is dragging the brush.
        dragging = true;
        onFocus(null);
      })
      .on('brush end', (event: D3BrushEvent<unknown>) => {
        const selection = event.selection as [number, number] | null;
        // Convert the brush's horizontal pixel interval into age codes, including any
        // age band it overlaps. null clears the brush; [] represents an empty selection.
        onBrush(
          selection
            ? all
                .filter((datum) => {
                  const start = x(datum.ageGroup)!;
                  return start + x.bandwidth() >= selection[0] && start <= selection[1];
                })
                .map((datum) => datum.ageCode)
            : null,
        );
        if (event.type === 'end') dragging = false;
      });
    group.call(behavior);
    // The brush overlay receives pointer events above the bars, so use its local x
    // coordinate to identify the age band and its left (0) or right (1) status bar.
    group
      .on('pointermove.hover', (event) => {
        if (dragging) return;
        const [px] = pointer(event, overlay.current);
        const datum = all.find((d) => px >= x(d.ageGroup)! && px <= x(d.ageGroup)! + x.bandwidth());
        if (!datum) {
          onFocus(null);
          return;
        }
        const status = px - x(datum.ageGroup)! < x.bandwidth() / 2 ? 0 : 1;
        if (datum.counts[status]) onFocus({ age: datum.ageCode, status });
        else onFocus(null);
      })
      .on('pointerleave.hover', () => onFocus(null));
    return () => {
      // Remove D3 handlers and generated elements before remounting or rebuilding.
      group.on('.brush', null).on('.hover', null);
      group.selectAll('*').remove();
    };
  }, [all, x, iw, ih, onBrush, onFocus]);
  // Legend hover supplies only a status; bar hover also supplies an age for the tooltip.
  const active = focus?.age === undefined ? null : subset.find((d) => d.ageCode === focus.age);
  const activeCount = active && focus ? active.counts[focus.status] : 0;
  return (
    <div className="w10-bar-wrapper">
      <svg
        className="w10-bars"
        viewBox={`0 0 ${width} ${height}`}
        role="group"
        aria-label="Age distribution of selected responses. Focus a bar for details."
      >
        <g transform={`translate(${left},${top})`}>
          {/* Horizontal gridlines and tick labels share the same y scale as the bars. */}
          {y.ticks(5).map((t) => (
            <g key={t} transform={`translate(0,${y(t)})`}>
              <line x2={iw} stroke="#e2e8f0" />
              <text x={-9} dy=".35em" textAnchor="end">
                {percent ? `${t}%` : number.format(t)}
              </text>
            </g>
          ))}
          {all.map((datum, i) => (
            <g key={datum.ageCode} transform={`translate(${x(datum.ageGroup)},0)`}>
              {statusOptions.map(({ value, color, label }, j) => {
                // Background = all filtered responses; foreground = brushed responses.
                // Guard empty totals so percentage mode never divides by zero.
                const base = percent
                  ? datum.total
                    ? (datum.counts[value] / datum.total) * 100
                    : 0
                  : datum.counts[value];
                const current = subset[i];
                const amount = percent
                  ? current.total
                    ? (current.counts[value] / current.total) * 100
                    : 0
                  : current.counts[value];
                // Shared focus links bar highlighting with the interactive legend.
                const dim =
                  focus &&
                  (focus.status !== value ||
                    (focus.age !== undefined && focus.age !== datum.ageCode));
                const description = `${datum.ageGroup}, ${label}: ${number.format(current.counts[value])} selected responses${percent ? ` (${amount.toFixed(1)}% of selected age group)` : ''}; ${number.format(datum.counts[value])} in full filtered group`;
                return (
                  <g key={value} opacity={dim ? 0.2 : 1}>
                    {/* Faded context bar, followed by the solid selected bar. */}
                    <rect
                      x={(j * x.bandwidth()) / 2}
                      y={y(base)}
                      width={x.bandwidth() / 2}
                      height={ih - y(base)}
                      fill={color}
                      opacity={0.13}
                    />
                    <rect
                      x={(j * x.bandwidth()) / 2}
                      y={y(amount)}
                      width={x.bandwidth() / 2}
                      height={ih - y(amount)}
                      fill={color}
                    />
                    {/* A full-height focus target makes small bars reachable by keyboard. */}
                    <rect
                      className="w10-bar-target"
                      x={(j * x.bandwidth()) / 2}
                      y={0}
                      width={x.bandwidth() / 2}
                      height={ih}
                      fill="transparent"
                      tabIndex={0}
                      role="img"
                      aria-label={description}
                      onMouseEnter={() => onFocus({ status: value, age: datum.ageCode })}
                      onMouseLeave={() => onFocus(null)}
                      onFocus={() => onFocus({ status: value, age: datum.ageCode })}
                      onBlur={() => onFocus(null)}
                    >
                      <title>{description}</title>
                    </rect>
                  </g>
                );
              })}
              <text
                transform={`translate(${x.bandwidth() / 2},${ih + 14}) rotate(-45)`}
                textAnchor="end"
              >
                {datum.ageGroup}
              </text>
            </g>
          ))}
          {/* Render last so D3 can capture drags across the complete plotting area. */}
          <g ref={overlay} className="w10-bar-brush" />
        </g>
        <text x={left + iw / 2} y={height - 8} textAnchor="middle">
          Age group (years)
        </text>
        <text transform={`translate(16,${top + ih / 2}) rotate(-90)`} textAnchor="middle">
          {percent ? 'Share within each age group' : 'Survey responses'}
        </text>
      </svg>
      {active && focus && (
        <div className="w10-tooltip" role="status">
          <strong>
            {active.ageGroup} years � {statusOptions[focus.status].label}
          </strong>
          <br />
          {number.format(activeCount)} selected responses
          <br />
          {active.total ? ((activeCount / active.total) * 100).toFixed(1) : '0.0'}% within this
          selected age group
        </div>
      )}
    </div>
  );
}
