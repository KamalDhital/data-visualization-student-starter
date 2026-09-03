import { useEffect, useMemo, useRef, useState } from 'react';
import { csvParse } from 'd3-dsv';
import { select } from 'd3-selection';
import { useDimensions } from '../week-01/useDimensions';

type AttributeKind = 'Categorical (Binary)' | 'Categorical' | 'Ordinal' | 'Quantitative';
type BinaryFilter = 'all' | '0' | '1';

interface AttributeMetadata {
  name: keyof DatasetRow;
  kind: AttributeKind;
  description: string;
}

interface DatasetRow {
  Diabetes_binary: number;
  HighBP: number;
  HighChol: number;
  CholCheck: number;
  BMI: number;
  Smoker: number;
  Stroke: number;
  HeartDiseaseorAttack: number;
  PhysActivity: number;
  Fruits: number;
  Veggies: number;
  HvyAlcoholConsump: number;
  AnyHealthcare: number;
  NoDocbcCost: number;
  GenHlth: number;
  MentHlth: number;
  PhysHlth: number;
  DiffWalk: number;
  Sex: number;
  Age: number;
  Education: number;
  Income: number;
}

interface ParsedDataset {
  columns: Array<keyof DatasetRow>;
  rows: DatasetRow[];
}

interface ColumnSummary {
  attribute: AttributeMetadata;
  uniqueCount: number;
  min: number;
  max: number;
  mean: number;
  previewValues: number[];
}

const DATASET_FILE =
  'data/cdc-diabetes-health-indicators/diabetes_binary_5050split_health_indicators_BRFSS2015.csv';
const DATASET_URL = `${import.meta.env.BASE_URL}${DATASET_FILE}`;
const SUMMARY_FONT_SIZE = 24;
const SUMMARY_LINE_HEIGHT = SUMMARY_FONT_SIZE * 1.25;

const healthFactors = [
  'Diabetes status',
  'Blood pressure',
  'Cholesterol',
  'BMI',
  'Smoking habits',
  'Physical activity',
  'Age',
  'Education',
  'Income',
];

const attributes: AttributeMetadata[] = [
  {
    name: 'Diabetes_binary',
    kind: 'Categorical (Binary)',
    description: 'Binary target: 0 = no diabetes, 1 = prediabetes or diabetes.',
  },
  { name: 'HighBP', kind: 'Categorical (Binary)', description: 'High blood pressure indicator.' },
  { name: 'HighChol', kind: 'Categorical (Binary)', description: 'High cholesterol indicator.' },
  {
    name: 'CholCheck',
    kind: 'Categorical (Binary)',
    description: 'Cholesterol check within the past 5 years.',
  },
  { name: 'BMI', kind: 'Quantitative', description: 'Body Mass Index.' },
  {
    name: 'Smoker',
    kind: 'Categorical (Binary)',
    description: 'Smoked at least 100 cigarettes in lifetime.',
  },
  { name: 'Stroke', kind: 'Categorical (Binary)', description: 'Ever told they had a stroke.' },
  {
    name: 'HeartDiseaseorAttack',
    kind: 'Categorical (Binary)',
    description: 'Coronary heart disease or myocardial infarction history.',
  },
  {
    name: 'PhysActivity',
    kind: 'Categorical (Binary)',
    description: 'Physical activity in the past 30 days.',
  },
  {
    name: 'Fruits',
    kind: 'Categorical (Binary)',
    description: 'Consumes fruit one or more times per day.',
  },
  {
    name: 'Veggies',
    kind: 'Categorical (Binary)',
    description: 'Consumes vegetables one or more times per day.',
  },
  {
    name: 'HvyAlcoholConsump',
    kind: 'Categorical (Binary)',
    description: 'Heavy alcohol consumption indicator.',
  },
  {
    name: 'AnyHealthcare',
    kind: 'Categorical (Binary)',
    description: 'Has any kind of health care coverage.',
  },
  {
    name: 'NoDocbcCost',
    kind: 'Categorical (Binary)',
    description: 'Could not see a doctor because of cost.',
  },
  {
    name: 'GenHlth',
    kind: 'Ordinal',
    description: 'General health rating from 1 = excellent to 5 = poor.',
  },
  {
    name: 'MentHlth',
    kind: 'Quantitative',
    description: 'Number of days in the past 30 when mental health was not good.',
  },
  {
    name: 'PhysHlth',
    kind: 'Quantitative',
    description: 'Number of days in the past 30 when physical health was not good.',
  },
  {
    name: 'DiffWalk',
    kind: 'Categorical (Binary)',
    description: 'Difficulty walking or climbing stairs.',
  },
  {
    name: 'Sex',
    kind: 'Categorical',
    description: 'Demographic category: 0 = female, 1 = male.',
  },
  {
    name: 'Age',
    kind: 'Ordinal',
    description: 'Thirteen ordered age groups from 18-24 to 80 or older.',
  },
  { name: 'Education', kind: 'Ordinal', description: 'Six ordered education levels.' },
  { name: 'Income', kind: 'Ordinal', description: 'Eight ordered income bands.' },
];

const binaryTargetLabels: Record<number, string> = {
  0: 'No diabetes',
  1: 'Prediabetes or diabetes',
};

const sexLabels: Record<number, string> = {
  0: 'Female',
  1: 'Male',
};

const yesNoLabels: Record<number, string> = {
  0: 'No',
  1: 'Yes',
};

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

const incomeLabels: Record<number, string> = {
  1: '< $10k',
  2: '$10k-$15k',
  3: '$15k-$20k',
  4: '$20k-$25k',
  5: '$25k-$35k',
  6: '$35k-$50k',
  7: '$50k-$75k',
  8: '$75k+',
};

function parseCsv(csvText: string): ParsedDataset {
  const parsedRows = csvParse(csvText);
  const columns = parsedRows.columns as Array<keyof DatasetRow>;
  const rows = parsedRows.map((row) =>
    columns.reduce<Partial<DatasetRow>>((datasetRow, column) => {
      datasetRow[column] = Number(row[column]);
      return datasetRow;
    }, {}) as DatasetRow,
  );

  return { columns, rows };
}

function summarizeColumn(rows: DatasetRow[], attribute: AttributeMetadata): ColumnSummary {
  const values = rows.map((row) => row[attribute.name]).filter(Number.isFinite);
  const uniqueValues = Array.from(new Set(values)).sort((a, b) => a - b);
  const total = values.reduce((sum, value) => sum + value, 0);

  return {
    attribute,
    uniqueCount: uniqueValues.length,
    min: values.length ? Math.min(...values) : 0,
    max: values.length ? Math.max(...values) : 0,
    mean: values.length ? total / values.length : 0,
    previewValues: uniqueValues.slice(0, 8),
  };
}

function filterByBinaryValue(value: number, filter: BinaryFilter) {
  return filter === 'all' || value === Number(filter);
}

function average(rows: DatasetRow[], column: keyof DatasetRow) {
  if (rows.length === 0) return 0;

  return rows.reduce((sum, row) => sum + row[column], 0) / rows.length;
}

function rateOfOne(rows: DatasetRow[], column: keyof DatasetRow) {
  if (rows.length === 0) return 0;

  const matches = rows.filter((row) => row[column] === 1).length;
  return matches / rows.length;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatDecimal(value: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(value);
}

function formatPercent(value: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
    style: 'percent',
  }).format(value);
}

function formatValueList(summary: ColumnSummary) {
  const values = summary.previewValues.map((value) => formatDecimal(value)).join(', ');
  const suffix = summary.uniqueCount > summary.previewValues.length ? ', ...' : '';

  return `${values}${suffix}`;
}

function MetricCard({
  label,
  value,
  context,
  accentClass,
}: {
  label: string;
  value: string;
  context: string;
  accentClass: string;
}) {
  return (
    <div className="rounded border border-zinc-200 bg-white p-4 shadow-sm">
      <div className={`h-1 w-12 rounded ${accentClass}`} />
      <p className="mt-4 text-sm font-medium text-zinc-600">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-zinc-950">{value}</p>
      <p className="mt-2 text-sm text-zinc-600">{context}</p>
    </div>
  );
}

function FilterSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex min-w-[150px] flex-1 flex-col gap-2 text-sm font-medium text-zinc-700">
      {label}
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-10 rounded border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 shadow-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DatasetSummarySvg({ rows, columns, format }: { rows: number; columns: number; format: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { ref: divRef, dimensions } = useDimensions();

  useEffect(() => {
    const svg = svgRef.current;
    const { width, height } = dimensions;

    if (!svg || width === 0 || height === 0) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const summaryLines = [`Rows: ${formatNumber(rows)}`, `Columns: ${formatNumber(columns)}`, `Format: ${format}`];

    const root = select(svg).attr('viewBox', `0 0 ${width} ${height}`);

    root
      .selectAll('rect')
      .data([null])
      .join('rect')
      .attr('x', 1)
      .attr('y', 1)
      .attr('width', Math.max(width - 2, 0))
      .attr('height', Math.max(height - 2, 0))
      .attr('rx', 4)
      .attr('fill', '#f8fafc')
      .attr('stroke', '#d4d4d8');

    root
      .selectAll('text')
      .data([null])
      .join('text')
      .attr('x', centerX)
      .attr('y', centerY - SUMMARY_LINE_HEIGHT)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', SUMMARY_FONT_SIZE)
      .attr('font-weight', 650)
      .attr('fill', '#18181b')
      .selectAll('tspan')
      .data(summaryLines)
      .join('tspan')
      .attr('x', centerX)
      .attr('dy', (_line, index) => (index === 0 ? 0 : SUMMARY_LINE_HEIGHT))
      .text((line) => line);
  }, [columns, dimensions, format, rows]);

  return (
    <div ref={divRef} className="mt-4 h-36 w-full">
      <svg
        ref={svgRef}
        className="h-full w-full"
        role="img"
        aria-label={`Dataset summary: ${formatNumber(rows)} rows and ${formatNumber(columns)} columns`}
      />
    </div>
  );
}

export function CdcDiabetesSummary() {
  const [dataset, setDataset] = useState<ParsedDataset | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [diabetesFilter, setDiabetesFilter] = useState<BinaryFilter>('all');
  const [sexFilter, setSexFilter] = useState<BinaryFilter>('all');
  const [highBpFilter, setHighBpFilter] = useState<BinaryFilter>('all');
  const [highCholFilter, setHighCholFilter] = useState<BinaryFilter>('all');

  useEffect(() => {
    const abortController = new AbortController();

    async function loadDataset() {
      try {
        const response = await fetch(DATASET_URL, { signal: abortController.signal });

        if (!response.ok) {
          throw new Error(`CSV request failed with status ${response.status}`);
        }

        const csvText = await response.text();
        setDataset(parseCsv(csvText));
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setLoadError(error instanceof Error ? error.message : 'Unable to load the dataset.');
      }
    }

    loadDataset();

    return () => abortController.abort();
  }, []);

  const filteredRows = useMemo(() => {
    if (!dataset) return [];

    return dataset.rows.filter(
      (row) =>
        filterByBinaryValue(row.Diabetes_binary, diabetesFilter) &&
        filterByBinaryValue(row.Sex, sexFilter) &&
        filterByBinaryValue(row.HighBP, highBpFilter) &&
        filterByBinaryValue(row.HighChol, highCholFilter),
    );
  }, [dataset, diabetesFilter, highBpFilter, highCholFilter, sexFilter]);

  const columnSummaries = useMemo(() => {
    if (!dataset) return [];

    return attributes.map((attribute) => summarizeColumn(dataset.rows, attribute));
  }, [dataset]);

  const previewRows = filteredRows.slice(0, 8);
  const totalRows = dataset?.rows.length ?? 0;
  const totalColumns = dataset?.columns.length ?? 0;
  const filteredPercent = totalRows ? filteredRows.length / totalRows : 0;
  const diabetesRate = rateOfOne(filteredRows, 'Diabetes_binary');
  const averageBmi = average(filteredRows, 'BMI');
  const highBpRate = rateOfOne(filteredRows, 'HighBP');
  const averagePoorHealthDays = average(filteredRows, 'PhysHlth') + average(filteredRows, 'MentHlth');

  const resetFilters = () => {
    setDiabetesFilter('all');
    setSexFilter('all');
    setHighBpFilter('all');
    setHighCholFilter('all');
  };

  return (
    <main className="h-full w-full overflow-y-auto bg-zinc-50 text-zinc-950">
      <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col gap-6 px-5 py-6 lg:px-8">
        <section className="grid gap-6 border-b border-zinc-200 pb-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase text-emerald-700">Week 2</p>
            <h1 className="mt-2 text-3xl font-semibold text-zinc-950">CDC Diabetes Health Indicators Dataset</h1>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-zinc-700">
              Data abstraction for the CDC BRFSS health indicators dataset, including source, description, summary,
              attribute types, purpose, and an interactive exploration of the bundled CSV.
            </p>
          </div>
          <a
            className="inline-flex min-h-10 w-fit items-center rounded border border-emerald-700 px-3 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
            href="https://archive.ics.uci.edu/dataset/891/cdc+diabetes+health+indicators"
            rel="noreferrer"
            target="_blank"
          >
            UCI dataset source
          </a>
        </section>

        <section className="rounded border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Dataset Source</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-700">
            Downloaded from:{' '}
            <a
              className="font-medium text-emerald-800 underline decoration-emerald-200 underline-offset-2 hover:text-emerald-900"
              href="https://archive.ics.uci.edu/dataset/891/cdc+diabetes+health+indicators"
              rel="noreferrer"
              target="_blank"
            >
              https://archive.ics.uci.edu/dataset/891/cdc+diabetes+health+indicators
            </a>
          </p>
        </section>

        <section className="rounded border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Description</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-700">
            The CDC Diabetes Health Indicators Dataset contains healthcare statistics and lifestyle survey information
            collected through the Behavioral Risk Factor Surveillance System (BRFSS).
          </p>
          <p className="mt-3 text-sm leading-6 text-zinc-700">
            Each row represents an individual and includes health factors such as:
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-zinc-700">
            {healthFactors.map((factor) => (
              <li key={factor}>{factor}</li>
            ))}
          </ul>
        </section>

        <section className="rounded border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Dataset Summary</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-zinc-700">
            <li>Rows: {dataset ? formatNumber(totalRows) : 'Loading...'}</li>
            <li>Columns: {dataset ? formatNumber(totalColumns) : 'Loading...'}</li>
            <li>Format: CSV</li>
          </ul>
          {dataset && <DatasetSummarySvg rows={totalRows} columns={totalColumns} format="CSV" />}
        </section>

        <section className="rounded border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 p-5">
            <h2 className="text-xl font-semibold">Attribute Analysis</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Each attribute is classified as categorical (including binary), ordinal, or quantitative.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-left text-sm">
              <thead className="bg-zinc-100 text-xs uppercase text-zinc-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Attribute</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                </tr>
              </thead>
              <tbody>
                {attributes.map((attribute) => (
                  <tr key={attribute.name} className="border-t border-zinc-200">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-zinc-900">{attribute.name}</td>
                    <td className="px-4 py-3">{attribute.kind}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Purpose</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-700">
            This dataset can be used to study relationships between lifestyle factors and diabetes risk.
          </p>
        </section>

        {loadError && (
          <section className="rounded border border-red-200 bg-red-50 p-5 text-sm text-red-900" role="alert">
            Dataset failed to load: {loadError}
          </section>
        )}

        {!dataset && !loadError && (
          <section className="rounded border border-zinc-200 bg-white p-5 text-sm text-zinc-700 shadow-sm">
            Loading CSV from <code>{DATASET_FILE}</code>...
          </section>
        )}

        {dataset && (
          <>
            <section className="rounded border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Explore the Dataset</h2>
                    <p className="mt-1 text-sm text-zinc-600" aria-live="polite">
                      Showing {formatNumber(filteredRows.length)} of {formatNumber(dataset.rows.length)} rows (
                      {formatPercent(filteredPercent)}).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="min-h-10 w-fit rounded border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
                  >
                    Reset filters
                  </button>
                </div>

                <div className="flex flex-wrap gap-3">
                  <FilterSelect
                    id="diabetes-filter"
                    label="Diabetes status"
                    value={diabetesFilter}
                    onChange={(value) => setDiabetesFilter(value as BinaryFilter)}
                    options={[
                      { value: 'all', label: 'All statuses' },
                      { value: '0', label: 'No diabetes' },
                      { value: '1', label: 'Prediabetes or diabetes' },
                    ]}
                  />
                  <FilterSelect
                    id="sex-filter"
                    label="Sex"
                    value={sexFilter}
                    onChange={(value) => setSexFilter(value as BinaryFilter)}
                    options={[
                      { value: 'all', label: 'All respondents' },
                      { value: '0', label: 'Female' },
                      { value: '1', label: 'Male' },
                    ]}
                  />
                  <FilterSelect
                    id="high-bp-filter"
                    label="High blood pressure"
                    value={highBpFilter}
                    onChange={(value) => setHighBpFilter(value as BinaryFilter)}
                    options={[
                      { value: 'all', label: 'All BP values' },
                      { value: '0', label: 'No high BP' },
                      { value: '1', label: 'High BP' },
                    ]}
                  />
                  <FilterSelect
                    id="high-chol-filter"
                    label="High cholesterol"
                    value={highCholFilter}
                    onChange={(value) => setHighCholFilter(value as BinaryFilter)}
                    options={[
                      { value: 'all', label: 'All cholesterol values' },
                      { value: '0', label: 'No high cholesterol' },
                      { value: '1', label: 'High cholesterol' },
                    ]}
                  />
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Filtered rows"
                value={formatNumber(filteredRows.length)}
                context={`${formatPercent(filteredPercent)} of ${formatNumber(dataset.rows.length)} total rows`}
                accentClass="bg-emerald-700"
              />
              <MetricCard
                label="Diabetes rate"
                value={formatPercent(diabetesRate)}
                context="Share reporting prediabetes or diabetes"
                accentClass="bg-amber-500"
              />
              <MetricCard
                label="Mean BMI"
                value={formatDecimal(averageBmi)}
                context="Average body mass index in current view"
                accentClass="bg-sky-500"
              />
              <MetricCard
                label="High BP rate"
                value={formatPercent(highBpRate)}
                context={`${formatDecimal(averagePoorHealthDays)} combined unhealthy days on average`}
                accentClass="bg-rose-500"
              />
            </section>

            {filteredRows.length === 0 ? (
              <section className="rounded border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
                No rows match the current filters. Reset the filters or broaden one of the selections.
              </section>
            ) : (
              <>
                <section className="rounded border border-zinc-200 bg-white p-5 shadow-sm">
                  <h2 className="text-xl font-semibold">Quick Read</h2>
                  <div className="mt-4 space-y-4 text-sm leading-6 text-zinc-700">
                    <p>
                      The attribute analysis above matches the dataset README: binary health flags are categorical, BMI
                      and unhealthy-day counts are quantitative, and general health, age, education, and income are
                      ordinal.
                    </p>
                    <p>
                      BMI, blood pressure, and cholesterol filters usually change the diabetes rate, mean BMI, and the
                      row-level data shown in the preview table.
                    </p>
                    <p>
                      Use this view to explore relationships between lifestyle factors and diabetes risk across age,
                      income, and education groups.
                    </p>
                  </div>
                </section>

                <section className="rounded border border-zinc-200 bg-white shadow-sm">
                  <div className="border-b border-zinc-200 p-5">
                    <h2 className="text-xl font-semibold">Filtered Data Preview</h2>
                    <p className="mt-1 text-sm text-zinc-600">
                      First eight matching rows with labels for the most readable categorical fields.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                      <thead className="bg-zinc-100 text-xs uppercase text-zinc-600">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Diabetes</th>
                          <th className="px-4 py-3 font-semibold">Sex</th>
                          <th className="px-4 py-3 font-semibold">Age</th>
                          <th className="px-4 py-3 font-semibold">BMI</th>
                          <th className="px-4 py-3 font-semibold">High BP</th>
                          <th className="px-4 py-3 font-semibold">High Chol</th>
                          <th className="px-4 py-3 font-semibold">General health</th>
                          <th className="px-4 py-3 font-semibold">Income</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, index) => (
                          <tr key={`${row.BMI}-${row.Age}-${row.Income}-${index}`} className="border-t border-zinc-200">
                            <td className="px-4 py-3">{binaryTargetLabels[row.Diabetes_binary]}</td>
                            <td className="px-4 py-3">{sexLabels[row.Sex]}</td>
                            <td className="px-4 py-3">{ageLabels[row.Age]}</td>
                            <td className="px-4 py-3">{formatDecimal(row.BMI)}</td>
                            <td className="px-4 py-3">{yesNoLabels[row.HighBP]}</td>
                            <td className="px-4 py-3">{yesNoLabels[row.HighChol]}</td>
                            <td className="px-4 py-3">{formatDecimal(row.GenHlth)}</td>
                            <td className="px-4 py-3">{incomeLabels[row.Income]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}

            <section className="rounded border border-zinc-200 bg-white shadow-sm">
              <div className="border-b border-zinc-200 p-5">
                <h2 className="text-xl font-semibold">Attribute Summary</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Attribute types from the data abstraction, plus range and uniqueness checks from the loaded CSV.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                  <thead className="bg-zinc-100 text-xs uppercase text-zinc-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Attribute</th>
                      <th className="px-4 py-3 font-semibold">Type</th>
                      <th className="px-4 py-3 font-semibold">Values or range</th>
                      <th className="px-4 py-3 font-semibold">Mean</th>
                      <th className="px-4 py-3 font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {columnSummaries.map((summary) => (
                      <tr key={summary.attribute.name} className="border-t border-zinc-200">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-zinc-900">
                          {summary.attribute.name}
                        </td>
                        <td className="px-4 py-3">{summary.attribute.kind}</td>
                        <td className="px-4 py-3">
                          {summary.uniqueCount <= 14
                            ? formatValueList(summary)
                            : `${formatDecimal(summary.min)} to ${formatDecimal(summary.max)}`}
                        </td>
                        <td className="px-4 py-3">{formatDecimal(summary.mean)}</td>
                        <td className="px-4 py-3 text-zinc-700">{summary.attribute.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
