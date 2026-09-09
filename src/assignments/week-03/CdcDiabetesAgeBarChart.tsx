import { useEffect, useMemo, useState } from 'react';
import { max } from 'd3-array';
import { csv } from 'd3-fetch';
import { scaleBand, scaleLinear } from 'd3-scale';
import { useDimensions } from '../week-01/useDimensions';

interface DatasetRow {
  Age: number;
}

interface BarDatum {
  ageGroup: string;
  count: number;
}

const DATASET_FILE =
  'data/cdc-diabetes-health-indicators/diabetes_binary_5050split_health_indicators_BRFSS2015.csv';
const DATASET_URL = `${import.meta.env.BASE_URL}${DATASET_FILE}`;

// The CDC dataset stores age as category numbers, so this converts those codes
// into readable labels for the x-axis.
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

const margin = {
  top: 64,
  right: 32,
  bottom: 104,
  left: 96,
};

function useScale(data: BarDatum[], width: number, height: number) {
  return useMemo(() => {
    // Keep the drawing area inside the SVG margins so labels and axes have room.
    const chartWidth = Math.max(width - margin.left - margin.right, 0);
    const chartHeight = Math.max(height - margin.top - margin.bottom, 0);
    const maxCount = max(data, (d) => d.count) ?? 0;

    return {
      chartWidth,
      chartHeight,
      xScale: scaleBand()
        .domain(data.map((d) => d.ageGroup))
        .range([0, chartWidth])
        .padding(0.18),
      yScale: scaleLinear().domain([0, maxCount]).nice().range([chartHeight, 0]),
    };
  }, [data, width, height]);
}

export function CdcDiabetesAgeBarChart() {
  const { ref, dimensions } = useDimensions();
  const [rows, setRows] = useState<DatasetRow[]>([]);

  useEffect(() => {
    void csv(DATASET_URL, (row) => ({
      Age: Number(row.Age),
    })).then(setRows);
  }, []);

  const data = useMemo(() => {
    const counts = new Map<number, number>();

    // Count how many records fall into each numeric age category from the CSV.
    rows.forEach((row) => {
      if (!Number.isFinite(row.Age)) return;
      counts.set(row.Age, (counts.get(row.Age) ?? 0) + 1);
    });

    // Return every age group in order, even if a category has zero records.
    return Object.entries(ageLabels).map(([ageGroup, label]) => ({
      ageGroup: label,
      count: counts.get(Number(ageGroup)) ?? 0,
    }));
  }, [rows]);

  const { chartWidth, chartHeight, xScale, yScale } = useScale(
    data,
    dimensions.width,
    dimensions.height,
  );
  const yTicks = useMemo(() => yScale.ticks(5), [yScale]);

  return (
    <div ref={ref} className="w-full h-full">
      <svg
        className="block w-full h-full"
        role="img"
        aria-label="Bar chart showing CDC diabetes dataset record counts by age group"
      >
        <text
          x={dimensions.width / 2}
          y={32}
          textAnchor="middle"
          className="fill-gray-900 text-xl font-semibold"
        >
          CDC Diabetes Dataset Records by Age Group
        </text>
        <text
          x={dimensions.width / 2}
          y={dimensions.height - 20}
          textAnchor="middle"
          className="fill-gray-800 text-sm font-medium"
        >
          Age Group
        </text>
        <text
          x={-(dimensions.height / 2)}
          y={24}
          textAnchor="middle"
          transform="rotate(-90)"
          className="fill-gray-800 text-sm font-medium"
        >
          Number of Records
        </text>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {yTicks.map((tick) => (
            <g key={tick} transform={`translate(0, ${yScale(tick)})`}>
              <line x1={0} x2={chartWidth} stroke="#e5e7eb" />
              <text x={-12} y={4} textAnchor="end" className="fill-gray-600 text-xs">
                {tick.toLocaleString()}
              </text>
            </g>
          ))}

          <line y1={chartHeight} y2={chartHeight} x2={chartWidth} stroke="#374151" />
          <line y2={chartHeight} stroke="#374151" />

          {data.map((datum) => {
            const x = xScale(datum.ageGroup) ?? 0;
            const y = yScale(datum.count);
            const barHeight = chartHeight - y;

            return (
              <rect
                key={datum.ageGroup}
                x={x}
                y={y}
                width={xScale.bandwidth()}
                height={barHeight}
                fill="#2563eb"
              />
            );
          })}

          {data.map((datum) => {
            const x = (xScale(datum.ageGroup) ?? 0) + xScale.bandwidth() / 2;

            return (
              <text
                key={datum.ageGroup}
                x={x}
                y={chartHeight + 22}
                textAnchor="end"
                transform={`rotate(-35 ${x} ${chartHeight + 22})`}
                className="fill-gray-700 text-xs"
              >
                {datum.ageGroup}
              </text>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
