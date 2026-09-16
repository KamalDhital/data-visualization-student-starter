import { useEffect, useMemo, useState } from 'react';
import { max } from 'd3-array';
import { csv } from 'd3-fetch';
import { scaleBand, scaleLinear } from 'd3-scale';

interface DatasetRow {
  Age: number;
}

const DATASET_FILE =
  'data/cdc-diabetes-health-indicators/diabetes_binary_5050split_health_indicators_BRFSS2015.csv';
const DATASET_URL = `${import.meta.env.BASE_URL}${DATASET_FILE}`;

const ageLabels: Record<number, string> = {
  1: '18-24',
  2: '25-29',
  3: '30-34',
  4: '35-39',
  5: '40-44',
  6: '45-49',
  7: '50-54',
  8: '55-59',
  9: '60-64',
  10: '65-69',
  11: '70-74',
  12: '75-79',
  13: '80+',
};

const chart = {
  width: 960,
  height: 620,
  margin: {
    top: 106,
    right: 56,
    bottom: 106,
    left: 112,
  },
};

const colors = {
  title: '#0f172a',
  subtitle: '#475569',
  xAxisLabel: '#020617',
  yAxisLabel: '#020617',
  axis: '#334155',
  tick: '#64748b',
  grid: '#e2e8f0',
  bar: '#2563eb',
  label: '#1e293b',
};

const formatCount = (value: number) => value.toLocaleString();

function useAgeGroupCounts(rows: DatasetRow[]) {
  return useMemo(() => {
    const counts = new Map<number, number>();

    rows.forEach((row) => {
      if (!Number.isFinite(row.Age)) return;
      counts.set(row.Age, (counts.get(row.Age) ?? 0) + 1);
    });

    return Object.entries(ageLabels).map(([ageGroup, label]) => ({
      ageGroup: label,
      count: counts.get(Number(ageGroup)) ?? 0,
    }));
  }, [rows]);
}

export function CdcDiabetesAgeLegibilityChart() {
  const [rows, setRows] = useState<DatasetRow[]>([]);

  useEffect(() => {
    void csv(DATASET_URL, (row) => ({
      Age: Number(row.Age),
    })).then(setRows);
  }, []);

  const data = useAgeGroupCounts(rows);
  const innerWidth = chart.width - chart.margin.left - chart.margin.right;
  const innerHeight = chart.height - chart.margin.top - chart.margin.bottom;
  const maxCount = max(data, (d) => d.count) ?? 0;

  const xScale = useMemo(
    () =>
      scaleBand()
        .domain(data.map((d) => d.ageGroup))
        .range([0, innerWidth])
        .padding(0.2),
    [data, innerWidth],
  );

  const yScale = useMemo(
    () => scaleLinear().domain([0, maxCount]).nice().range([innerHeight, 0]),
    [innerHeight, maxCount],
  );

  const yTicks = useMemo(() => yScale.ticks(6), [yScale]);
  const totalRecords = useMemo(() => data.reduce((sum, d) => sum + d.count, 0), [data]);

  return (
    <main className="flex h-full min-h-0 w-full items-center justify-center overflow-hidden bg-slate-50 p-3 sm:p-4">
      <svg
        className="block h-full w-full"
        viewBox={`0 0 ${chart.width} ${chart.height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-labelledby="week04-chart-title week04-chart-description"
      >
        <title id="week04-chart-title">CDC diabetes records by age group</title>
        <desc id="week04-chart-description">
          A responsive bar chart showing that older age groups make up more rows in the CDC diabetes
          health indicators dataset.
        </desc>

        <rect width={chart.width} height={chart.height} rx="8" fill="#f8fafc" />

        <g transform="translate(48, 34)">
          <text fill={colors.title} className="text-[30px] font-bold">
            CDC Diabetes Records by Age Group
          </text>
          <text y="34" fill={colors.subtitle} className="text-[16px] font-medium">
            Each bar counts survey records in the balanced BRFSS 2015 diabetes dataset.
          </text>
          <text y="60" fill={colors.subtitle} className="text-[14px]">
            Total records shown: {formatCount(totalRecords)}
          </text>
        </g>

        <g transform={`translate(${chart.margin.left}, ${chart.margin.top})`}>
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

          {data.map((datum) => {
            const x = xScale(datum.ageGroup) ?? 0;
            const y = yScale(datum.count);
            const barHeight = innerHeight - y;

            return (
              <g key={datum.ageGroup}>
                <rect
                  x={x}
                  y={y}
                  width={xScale.bandwidth()}
                  height={barHeight}
                  fill={colors.bar}
                />
                <text
                  x={x + xScale.bandwidth() / 2}
                  y={y - 8}
                  textAnchor="middle"
                  fill={colors.label}
                  className="text-[12px] font-semibold"
                >
                  {formatCount(datum.count)}
                </text>
              </g>
            );
          })}

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
          fill={colors.xAxisLabel}
          className="text-[17px] font-bold"
        >
          Age group of survey respondent
        </text>
        <text
          x={-(chart.height / 2)}
          y={32}
          textAnchor="middle"
          transform="rotate(-90)"
          fill={colors.yAxisLabel}
          className="text-[17px] font-bold"
        >
          Number of records in the dataset
        </text>
      </svg>
    </main>
  );
}
