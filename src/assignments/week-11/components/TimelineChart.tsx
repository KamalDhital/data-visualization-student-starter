import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { brushX, type D3BrushEvent } from 'd3-brush';
import { scaleLinear } from 'd3-scale';
import { select } from 'd3-selection';
import { area, curveMonotoneX, line } from 'd3-shape';
import { getTimelineData } from '../data';
import type { CompanyRow, TimelineDatum } from '../types';
import { Card } from './Card';

const W = 1000;
const H = 370;
const LEFT = 62;
const RIGHT = 750;
const TOP = 28;
const BOTTOM = 305;
const colors = [
  '#2563eb',
  '#0f766e',
  '#9333ea',
  '#c2410c',
  '#be185d',
  '#4d7c0f',
  '#0369a1',
  '#a16207',
  '#475569',
];
type Point = { quarter: number; raw: number | null; value: number | null };

// D3 owns the separate overview brush; React owns the chart's selected window.
function TimeBrush({
  data,
  window,
  onChange,
}: {
  data: TimelineDatum[];
  window: [number, number];
  onChange: (window: [number, number] | null) => void;
}) {
  const ref = useRef<SVGGElement>(null);
  const callback = useRef(onChange);
  useEffect(() => {
    callback.current = onChange;
  }, [onChange]);
  const x = useMemo(
    () =>
      scaleLinear()
        .domain([0, Math.max(1, data.length - 1)])
        .range([LEFT, RIGHT]),
    [data.length],
  );
  const [start, end] = window;
  useEffect(() => {
    if (!ref.current || data.length < 2) return;
    const brush = brushX()
      .extent([
        [LEFT, 8],
        [RIGHT, 66],
      ])
      .on('end', (event: D3BrushEvent<unknown>) => {
        if (!event.sourceEvent) return;
        const selection = event.selection as [number, number] | null;
        if (!selection) {
          callback.current(null);
          return;
        }
        let first = Math.max(0, Math.round(x.invert(selection[0])));
        let last = Math.min(data.length - 1, Math.round(x.invert(selection[1])));
        if (last <= first) {
          first = Math.min(first, data.length - 2);
          last = first + 1;
        }
        callback.current([first, last]);
      });
    const group = select(ref.current);
    group.call(brush).call(brush.move, [x(start), x(end)]);
    group
      .selectAll('.selection')
      .attr('fill', '#2563eb')
      .attr('fill-opacity', 0.14)
      .attr('stroke', '#2563eb');
    group.selectAll('.handle').attr('fill', '#2563eb');
    return () => {
      group.on('.brush', null);
      group.selectAll('*').remove();
    };
  }, [data.length, start, end, x]);
  const y = scaleLinear()
    .domain([0, Math.max(1, ...data.map((d) => d.adoption))])
    .range([62, 14]);
  const path = line<TimelineDatum>()
    .x((_, i) => x(i))
    .y((d) => y(d.adoption))
    .curve(curveMonotoneX)(data);
  return (
    <svg
      viewBox={`0 0 ${W} 95`}
      className="w-full min-w-[640px]"
      aria-label="Time overview: drag the blue handles to select quarters; double-click to restore the full range"
      onDoubleClick={() => callback.current(null)}
    >
      <rect x={LEFT} y={8} width={RIGHT - LEFT} height={58} fill="#f1f5f9" rx={4} />
      <path d={path ?? ''} fill="none" stroke="#64748b" strokeWidth={2} />
      <g ref={ref} />
      {data
        .filter(
          (_, i) =>
            i === 0 || i === data.length - 1 || i % Math.max(1, Math.ceil(data.length / 6)) === 0,
        )
        .map((d) => (
          <text
            key={d.period}
            x={x(data.indexOf(d))}
            y={86}
            textAnchor="middle"
            fontSize={11}
            fill="#64748b"
          >
            {d.period}
          </text>
        ))}
      <text x={RIGHT + 18} y={36} fontSize={12} fill="#475569">
        Drag to select time
      </text>
      <text x={RIGHT + 18} y={54} fontSize={11} fill="#64748b">
        Double-click to clear
      </text>
    </svg>
  );
}

export function TimelineChart({
  data,
  rows,
  context,
}: {
  data: TimelineDatum[];
  rows: CompanyRow[];
  context: string;
}) {
  const uid = useId().replace(/:/g, '');
  const [mode, setMode] = useState<'index' | 'adoption'>('index');
  const [window, setWindow] = useState<[number, number] | null>(null);
  const [anchor, setAnchor] = useState<string | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const active = focused ?? pinned;
  const series = useMemo(() => {
    const industries = [...new Set(rows.map((row) => row.industry))].sort();
    return [
      { name: 'Overall adoption', values: data },
      ...industries.map((name) => ({
        name,
        values: getTimelineData(rows.filter((row) => row.industry === name)),
      })),
    ].map((s, i) => ({
      ...s,
      color: colors[i % colors.length],
      lookup: new Map(s.values.map((d) => [d.period, d.adoption])),
    }));
  }, [data, rows]);
  const start = Math.min(window?.[0] ?? 0, Math.max(0, data.length - 1));
  const end = Math.min(window?.[1] ?? data.length - 1, data.length - 1);
  const visible = data.slice(start, end + 1);
  const anchorIndex = data.findIndex((d) => d.period === anchor);
  const baselineIndex = hover ?? (anchorIndex >= start && anchorIndex <= end ? anchorIndex : start);
  const baseline = data[baselineIndex];
  const plotted = series.map((s) => {
    const base = baseline ? s.lookup.get(baseline.period) : undefined;
    const points: Point[] = visible.map((d, i) => {
      const raw = s.lookup.get(d.period) ?? null;
      return {
        quarter: start + i,
        raw,
        value:
          raw === null
            ? null
            : mode === 'adoption'
              ? raw
              : base && base > 0
                ? (raw / base) * 100
                : null,
      };
    });
    return { ...s, points };
  });
  const reference = mode === 'index' ? 100 : (baseline?.adoption ?? 0);
  const values = plotted.flatMap((s) =>
    s.points.flatMap((p) => (p.value === null ? [] : [p.value])),
  );
  const low = mode === 'index' ? Math.min(100, ...values) : 0;
  const high = Math.max(reference, ...values, 1);
  const pad = Math.max((high - low) * 0.12, 3);
  const y = scaleLinear()
    .domain([Math.max(0, low - pad), high + pad])
    .nice()
    .range([BOTTOM, TOP]);
  const x = scaleLinear()
    .domain(start === end ? [start - 0.5, end + 0.5] : [start, end])
    .range([LEFT, RIGHT]);
  const linePath = line<Point>()
    .defined((p) => p.value !== null)
    .x((p) => x(p.quarter))
    .y((p) => y(p.value!))
    .curve(curveMonotoneX);
  const areaPath = area<Point>()
    .defined((p) => p.value !== null)
    .x((p) => x(p.quarter))
    .y0(y(reference))
    .y1((p) => y(p.value!))
    .curve(curveMonotoneX);
  const labels = plotted
    .flatMap((s) => {
      const last = s.points.at(-1);
      return last?.value == null
        ? []
        : [
            {
              name: s.name,
              color: s.color,
              value: last.value,
              actualY: y(last.value),
              labelY: y(last.value),
            },
          ];
    })
    .sort((a, b) => a.actualY - b.actualY);
  labels.forEach((label, i) => {
    label.labelY = Math.max(label.actualY, i === 0 ? TOP : labels[i - 1].labelY + 23);
  });
  if (labels.length && labels.at(-1)!.labelY > BOTTOM) {
    labels[labels.length - 1].labelY = BOTTOM;
    for (let i = labels.length - 2; i >= 0; i--)
      labels[i].labelY = Math.min(labels[i].labelY, labels[i + 1].labelY - 23);
  }
  const display = (value: number) => `${value.toFixed(1)}${mode === 'adoption' ? '%' : ''}`;
  const controlClass =
    'rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700';

  return (
    <Card className="min-w-0" title="AI Adoption Timeline · Interactive Line Index">
      <div className="space-y-4 p-4">
        <p className="text-sm font-semibold text-blue-700" aria-live="polite">
          Viewing {context}
        </p>
        <p className="text-sm leading-6 text-slate-600">
          Compare quarterly adoption across industries. Hover to re-index at a quarter; move away to
          restore the chosen baseline. Drag the overview below to select quarters; double-click it
          to restore the full time range. Hover a series name to isolate it; click to keep it
          selected.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
            Measure
            <select
              className={controlClass}
              value={mode}
              onChange={(e) => setMode(e.target.value as typeof mode)}
            >
              <option value="index">Relative adoption (baseline = 100)</option>
              <option value="adoption">Adoption rate (%)</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
            Baseline quarter
            <select
              className={controlClass}
              value={
                data[anchorIndex >= start && anchorIndex <= end ? anchorIndex : start]?.period ?? ''
              }
              onChange={(e) => {
                setAnchor(e.target.value);
                setHover(null);
              }}
            >
              {visible.map((d) => (
                <option key={d.period}>{d.period}</option>
              ))}
            </select>
          </label>
          <span className="text-xs text-slate-500">
            {visible[0]?.period ?? '—'} – {visible.at(-1)?.period ?? '—'} ·{' '}
            {mode === 'index'
              ? '100 = unchanged; 110 = +10% relative growth'
              : 'Original quarterly averages'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Series isolation">
          {series.map((s) => (
            <button
              key={s.name}
              className="rounded-full border px-3 py-1 text-xs transition-opacity"
              style={{
                borderColor: s.color,
                color: s.color,
                opacity: active && active !== s.name ? 0.4 : 1,
                background: pinned === s.name ? `${s.color}15` : 'white',
              }}
              aria-pressed={pinned === s.name}
              onMouseEnter={() => setFocused(s.name)}
              onMouseLeave={() => setFocused(null)}
              onFocus={() => setFocused(s.name)}
              onBlur={() => setFocused(null)}
              onClick={() => setPinned(pinned === s.name ? null : s.name)}
            >
              {s.name}
            </button>
          ))}
        </div>
        {!data.length ? (
          <p className="py-10 text-center text-sm text-slate-500">
            No timeline data for these filters.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full min-w-[640px]"
                role="img"
                aria-label={`Adoption ${mode === 'index' ? 'index' : 'percentage'} by quarter. Baseline ${baseline?.period}. Use left and right arrow keys to inspect quarters.`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    setHover(
                      Math.max(
                        start,
                        Math.min(end, (hover ?? baselineIndex) + (e.key === 'ArrowRight' ? 1 : -1)),
                      ),
                    );
                  } else if (e.key === 'Escape') setHover(null);
                }}
                onBlur={() => setHover(null)}
              >
                <title>Quarterly AI adoption: industry comparison</title>
                <desc>
                  Monotone curves. Green area is above the reference baseline; rose is below.
                  Missing observations are left as gaps. Use the controls and quarter table for
                  exact values.
                </desc>
                <defs>
                  <linearGradient
                    id={`${uid}-above`}
                    x1="0"
                    y1={TOP}
                    x2="0"
                    y2={y(reference)}
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#0d9488" stopOpacity="0.35" />
                    <stop offset="1" stopColor="#0d9488" stopOpacity="0.02" />
                  </linearGradient>
                  <linearGradient
                    id={`${uid}-below`}
                    x1="0"
                    y1={y(reference)}
                    x2="0"
                    y2={BOTTOM}
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#e11d48" stopOpacity="0.02" />
                    <stop offset="1" stopColor="#e11d48" stopOpacity="0.35" />
                  </linearGradient>
                  <clipPath id={`${uid}-top`}>
                    <rect
                      x={LEFT}
                      y={TOP}
                      width={RIGHT - LEFT}
                      height={Math.max(0, y(reference) - TOP)}
                    />
                  </clipPath>
                  <clipPath id={`${uid}-bottom`}>
                    <rect
                      x={LEFT}
                      y={y(reference)}
                      width={RIGHT - LEFT}
                      height={Math.max(0, BOTTOM - y(reference))}
                    />
                  </clipPath>
                </defs>
                {y.ticks(6).map((tick) => (
                  <g key={tick}>
                    <line
                      x1={LEFT}
                      x2={RIGHT}
                      y1={y(tick)}
                      y2={y(tick)}
                      stroke="#e2e8f0"
                      strokeDasharray="3 4"
                    />
                    <text
                      x={LEFT - 10}
                      y={y(tick) + 4}
                      textAnchor="end"
                      fill="#64748b"
                      fontSize={11}
                    >
                      {tick}
                      {mode === 'adoption' ? '%' : ''}
                    </text>
                  </g>
                ))}
                <text x={LEFT} y={14} fontSize={11} fill="#475569">
                  {mode === 'index' ? 'Adoption index' : 'Adoption rate (%)'}
                </text>
                <line
                  x1={LEFT}
                  x2={RIGHT}
                  y1={y(reference)}
                  y2={y(reference)}
                  stroke="#64748b"
                  strokeDasharray="6 4"
                />
                {plotted.map((s) => (
                  <g
                    key={s.name}
                    opacity={active && active !== s.name ? 0.1 : 1}
                    style={{ transition: 'opacity 150ms' }}
                  >
                    <path
                      d={areaPath(s.points) ?? ''}
                      fill={`url(#${uid}-above)`}
                      clipPath={`url(#${uid}-top)`}
                      opacity={active === s.name ? 1 : 0.3}
                    />
                    <path
                      d={areaPath(s.points) ?? ''}
                      fill={`url(#${uid}-below)`}
                      clipPath={`url(#${uid}-bottom)`}
                      opacity={active === s.name ? 1 : 0.3}
                    />
                    <path
                      d={linePath(s.points) ?? ''}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={s.name === active || s.name === 'Overall adoption' ? 3 : 1.8}
                    />
                    {s.points.map((p) =>
                      p.value === null ? null : (
                        <circle
                          key={p.quarter}
                          cx={x(p.quarter)}
                          cy={y(p.value)}
                          r={hover === p.quarter ? 4 : 2}
                          fill={s.color}
                        />
                      ),
                    )}
                  </g>
                ))}
                <line
                  x1={x(baselineIndex)}
                  x2={x(baselineIndex)}
                  y1={TOP}
                  y2={BOTTOM}
                  stroke="#334155"
                  strokeDasharray="3 3"
                />
                {visible
                  .filter(
                    (_, i) =>
                      i % Math.max(1, Math.ceil(visible.length / 7)) === 0 ||
                      i === visible.length - 1,
                  )
                  .map((d) => (
                    <text
                      key={d.period}
                      x={x(data.indexOf(d))}
                      y={BOTTOM + 23}
                      textAnchor="middle"
                      fontSize={11}
                      fill="#64748b"
                    >
                      {d.period}
                    </text>
                  ))}
                <text x={LEFT} y={H - 8} fill="#64748b" fontSize={11}>
                  Reference: {baseline?.period} ·{' '}
                  {mode === 'index'
                    ? 'each series = 100'
                    : `overall adoption = ${reference.toFixed(1)}%`}{' '}
                  · teal above / rose below
                </text>
                <rect
                  x={LEFT}
                  y={TOP}
                  width={RIGHT - LEFT}
                  height={BOTTOM - TOP}
                  fill="transparent"
                  style={{ cursor: 'crosshair' }}
                  onPointerMove={(event) => {
                    const svg = event.currentTarget.ownerSVGElement!;
                    const point = svg.createSVGPoint();
                    point.x = event.clientX;
                    point.y = event.clientY;
                    const local = point.matrixTransform(svg.getScreenCTM()!.inverse());
                    setHover(Math.max(start, Math.min(end, Math.round(x.invert(local.x)))));
                  }}
                  onPointerLeave={() => setHover(null)}
                />
                {labels.map((label) => (
                  <g
                    key={label.name}
                    opacity={active && active !== label.name ? 0.18 : 1}
                    onMouseEnter={() => setFocused(label.name)}
                    onMouseLeave={() => setFocused(null)}
                    onClick={() => setPinned(pinned === label.name ? null : label.name)}
                    style={{ cursor: 'pointer' }}
                  >
                    <path
                      d={`M${RIGHT + 3},${label.actualY}L${RIGHT + 16},${label.labelY}H${RIGHT + 22}`}
                      fill="none"
                      stroke={label.color}
                    />
                    <text
                      x={RIGHT + 27}
                      y={label.labelY + 4}
                      fill={label.color}
                      fontSize={11}
                      fontWeight={600}
                    >
                      {label.name} · {display(label.value)}
                    </text>
                  </g>
                ))}
              </svg>
              <TimeBrush
                data={data}
                window={[start, end]}
                onChange={(next) => {
                  setWindow(next);
                  setHover(null);
                }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <span className="font-semibold">Time window (keyboard accessible)</span>
              <label>
                From{' '}
                <select
                  className={controlClass}
                  aria-label="Time window start"
                  value={start}
                  onChange={(e) => {
                    setWindow([Number(e.target.value), end]);
                    setHover(null);
                  }}
                >
                  {data.map(
                    (d, i) =>
                      i <= end && (
                        <option key={d.period} value={i}>
                          {d.period}
                        </option>
                      ),
                  )}
                </select>
              </label>
              <label>
                To{' '}
                <select
                  className={controlClass}
                  aria-label="Time window end"
                  value={end}
                  onChange={(e) => {
                    setWindow([start, Number(e.target.value)]);
                    setHover(null);
                  }}
                >
                  {data.map(
                    (d, i) =>
                      i >= start && (
                        <option key={d.period} value={i}>
                          {d.period}
                        </option>
                      ),
                  )}
                </select>
              </label>
            </div>
            <div
              className="rounded-md border border-slate-200 bg-slate-50 p-3"
              aria-label="Quarter tooltip"
            >
              <p className="mb-2 text-xs font-bold text-slate-700">
                {baseline?.period} {hover !== null ? '· hover baseline' : '· selected baseline'} —
                quarterly detail
              </p>
              <div className="grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2 lg:grid-cols-3">
                {plotted.map((s) => {
                  const raw = baseline ? s.lookup.get(baseline.period) : undefined;
                  const last = s.points.at(-1)?.value;
                  return (
                    <div key={s.name} style={{ opacity: active && active !== s.name ? 0.35 : 1 }}>
                      <span style={{ color: s.color }}>●</span>{' '}
                      <span className="font-semibold">{s.name}</span>:{' '}
                      {raw === undefined ? 'No observation' : `${raw.toFixed(1)}% adoption`}
                      <span className="text-slate-500">
                        {' '}
                        · end {last == null ? 'N/A' : display(last)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Index = quarter adoption ÷ baseline adoption × 100. Series with a missing or zero
                baseline cannot be indexed. Year, industry, region, and country filters apply.
              </p>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
