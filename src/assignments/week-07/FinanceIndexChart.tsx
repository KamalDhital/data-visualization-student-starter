import { extent, max, min } from 'd3-array';
import { scaleLog, scaleUtc } from 'd3-scale';
import { useEffect, useMemo, useState } from 'react';
import { findNearestDatum, loadFinanceData } from './data';
import type { FinanceSeries, IndexedPoint } from './types';

// Fixed SVG dimensions keep the chart proportions stable while CSS scales it responsively.
const chart = {
  height: 700,
  marginBottom: 70,
  marginLeft: 96,
  marginRight: 128,
  marginTop: 82,
  width: 1280,
};

const amazonColor = '#2563eb';
// Formatters are kept outside the component so they are created only once.
const formatDate = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });
const formatTooltipDate = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

// Convert a ratio such as 1.25 into a percent label such as +25%.
function formatPercentChange(ratio: number) {
  const change = (ratio - 1) * 100;
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(Math.abs(change) >= 10 ? 0 : 1)}%`;
}

// Build the SVG path string for the line using scaled x and y coordinates.
function makeLinePath(points: IndexedPoint[], xScale: (date: Date) => number, yScale: (ratio: number) => number) {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${xScale(point.date).toFixed(2)},${yScale(point.ratio).toFixed(2)}`)
    .join('');
}

// Recalculate every point as a ratio of the selected baseline date.
function getIndexedSeries(series: FinanceSeries[], indexDate: Date) {
  return series.map((item) => {
    const baseline = findNearestDatum(item.values, indexDate);

    return {
      ...item,
      baseline,
      values: item.values.map((value) => ({
        ...value,
        ratio: value.close / baseline.close,
      })),
    };
  });
}

export function FinanceIndexChart() {
  const [series, setSeries] = useState<FinanceSeries[]>([]);
  const [indexDate, setIndexDate] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  // Load Amazon finance data once when the Week 07 page opens.
  useEffect(() => {
    void loadFinanceData().then((loadedSeries) => {
      setSeries(loadedSeries);

      // Start the index chart from the first available date in the dataset.
      const firstDate = min(loadedSeries.flatMap((item) => item.values), (value) => value.date);
      setIndexDate(firstDate ?? null);
    });
  }, []);

  // Recompute indexed values whenever the baseline date changes.
  const indexedSeries = useMemo(
    () => (indexDate ? getIndexedSeries(series, indexDate) : []),
    [indexDate, series],
  );

  // Flattened arrays make it easier to calculate domains for D3 scales.
  const allValues = useMemo(() => series.flatMap((item) => item.values), [series]);
  const allIndexedValues = useMemo(() => indexedSeries.flatMap((item) => item.values), [indexedSeries]);
  const dateDomain = extent(allValues, (value) => value.date);
  const ratioMin = Math.max(0.05, min(allIndexedValues, (value) => value.ratio) ?? 0.5);
  const ratioMax = max(allIndexedValues, (value) => value.ratio) ?? 2;
  const lowerRatio = Math.min(0.95, ratioMin);
  const upperRatio = Math.max(1.05, ratioMax);

  // The x-axis is calendar time; the y-axis is a log scale for relative change.
  const xScale = scaleUtc()
    .domain(dateDomain[0] && dateDomain[1] ? [dateDomain[0], dateDomain[1]] : [new Date(), new Date()])
    .range([chart.marginLeft, chart.width - chart.marginRight]);
  const yScale = scaleLog()
    .domain([lowerRatio, upperRatio])
    .range([chart.height - chart.marginBottom, chart.marginTop])
    .nice();

  const activeDate = hoverDate ?? indexDate;
  const activeX = activeDate ? xScale(activeDate) : chart.marginLeft;
  // The active row powers the hover marker on the Amazon line.
  const activeRows = useMemo(
    () =>
      activeDate
        ? indexedSeries
            .map((item) => {
              const point = findNearestDatum(item.values, activeDate) as IndexedPoint;
              return { point, symbol: item.symbol };
            })
            .sort((a, b) => b.point.ratio - a.point.ratio)
        : [],
    [activeDate, indexedSeries],
  );

  // Translate pointer position from browser pixels back into the SVG date scale.
  const handlePointerMove = (event: React.PointerEvent<SVGRectElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * chart.width;
    setHoverDate(xScale.invert(Math.max(chart.marginLeft, Math.min(chart.width - chart.marginRight, x))));
  };

  // Return to the first date baseline and clear any hover state.
  const resetIndexDate = () => {
    const firstDate = min(allValues, (value) => value.date);
    setIndexDate(firstDate ?? null);
    setHoverDate(null);
  };

  const chartReady = series.length > 0 && indexDate;
  const xTicks = xScale.ticks(8);
  const yTicks = yScale.ticks(7).filter((tick) => tick >= lowerRatio && tick <= upperRatio);

  return (
    <main className="h-full min-w-0 w-full overflow-auto bg-[#f6f7fb] text-slate-950">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-3 py-4 sm:px-5 lg:px-6">
        <header className="grid gap-4 border-b border-slate-300 pb-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">Week 07</p>
            <h1 className="mt-1 text-2xl font-black leading-tight text-slate-950 sm:text-4xl">
              Amazon Finance Index Chart
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
              Track Amazon adjusted closing prices as relative performance from a selected baseline date.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-full border border-blue-700 bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:border-blue-800 hover:bg-blue-700"
              onClick={resetIndexDate}
            >
              Reset Baseline
            </button>
          </div>
        </header>

        <section className="grid gap-3">
          <div className="min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <div>
                <div className="text-xs font-black uppercase text-slate-500">Baseline date</div>
                <div className="text-lg font-black text-slate-950">
                  {indexDate ? formatTooltipDate.format(indexDate) : 'Loading...'}
                </div>
              </div>
              <div className="text-sm font-semibold text-slate-500">
                Hover to inspect. Click the plot to set the baseline.
              </div>
            </div>

            <svg
              className="block aspect-[1280/700] h-auto min-h-[560px] w-full"
              viewBox={`0 0 ${chart.width} ${chart.height}`}
              role="img"
              aria-labelledby="week07-title week07-description"
            >
              <title id="week07-title">Finance index line chart</title>
              <desc id="week07-description">
                A line chart showing Amazon stock price change relative to the selected baseline date.
              </desc>
              <rect width={chart.width} height={chart.height} fill="#ffffff" />

              {chartReady ? (
                <>
                  {/* Horizontal gridlines show the percent change from the selected baseline. */}
                  {yTicks.map((tick) => (
                    <g key={tick}>
                      <line
                        x1={chart.marginLeft}
                        x2={chart.width - chart.marginRight}
                        y1={yScale(tick)}
                        y2={yScale(tick)}
                        stroke={tick === 1 ? '#94a3b8' : '#e2e8f0'}
                        strokeDasharray={tick === 1 ? undefined : '4 5'}
                      />
                      <text
                        x={chart.marginLeft - 14}
                        y={yScale(tick) + 4}
                        textAnchor="end"
                        className="fill-slate-500 text-[16px] font-semibold"
                      >
                        {formatPercentChange(tick)}
                      </text>
                    </g>
                  ))}

                  {/* Vertical gridlines and labels show time along the x-axis. */}
                  {xTicks.map((tick) => (
                    <g key={tick.toISOString()}>
                      <line
                        x1={xScale(tick)}
                        x2={xScale(tick)}
                        y1={chart.marginTop}
                        y2={chart.height - chart.marginBottom}
                        stroke="#f1f5f9"
                      />
                      <text
                        x={xScale(tick)}
                        y={chart.height - 22}
                        textAnchor="middle"
                        className="fill-slate-500 text-[16px] font-semibold"
                      >
                        {formatDate.format(tick)}
                      </text>
                    </g>
                  ))}

                  <text
                    x={chart.marginLeft}
                    y={42}
                    className="fill-slate-500 text-[16px] font-bold uppercase"
                  >
                    Relative change from baseline
                  </text>

                  {indexedSeries.map((item) => {
                    const lastPoint = item.values[item.values.length - 1];

                    return (
                      <g key={item.symbol}>
                        {/* Amazon's indexed price path. */}
                        <path
                          d={makeLinePath(item.values, xScale, yScale)}
                          fill="none"
                          stroke={amazonColor}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3.2}
                        />
                        <text
                          x={chart.width - chart.marginRight + 12}
                          y={yScale(lastPoint.ratio) + 4}
                          className="text-[15px] font-black"
                          fill={amazonColor}
                        >
                          {item.symbol}
                        </text>
                      </g>
                    );
                  })}

                  {/* The vertical guide follows the hovered date or the current baseline date. */}
                  <line
                    x1={activeX}
                    x2={activeX}
                    y1={chart.marginTop}
                    y2={chart.height - chart.marginBottom}
                    stroke="#0f172a"
                    strokeDasharray="3 5"
                    strokeWidth={1.4}
                  />

                  {/* Marker for Amazon's value on the active date. */}
                  {activeRows.map(({ point, symbol }) => (
                    <circle
                      key={symbol}
                      cx={xScale(point.date)}
                      cy={yScale(point.ratio)}
                      r={5.5}
                      fill={amazonColor}
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  ))}

                  {/* Transparent interaction layer keeps pointer events easy to capture. */}
                  <rect
                    x={chart.marginLeft}
                    y={chart.marginTop}
                    width={chart.width - chart.marginLeft - chart.marginRight}
                    height={chart.height - chart.marginTop - chart.marginBottom}
                    fill="transparent"
                    onClick={() => {
                      if (hoverDate) setIndexDate(hoverDate);
                    }}
                    onPointerLeave={() => setHoverDate(null)}
                    onPointerMove={handlePointerMove}
                  />
                </>
              ) : (
                <text
                  x={chart.width / 2}
                  y={chart.height / 2}
                  textAnchor="middle"
                  className="fill-slate-500 text-[18px] font-bold"
                >
                  Loading finance data...
                </text>
              )}
            </svg>
          </div>
        </section>
      </div>
    </main>
  );
}
