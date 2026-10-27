import { useCallback, useEffect, useMemo, useState } from 'react';
import { csv } from 'd3-fetch';
import { ageLabels, DATASET_FILE, statusOptions } from '../week-05/config';
import { isDiabetesStatus } from '../week-05/data';
import type { DiabetesStatus } from '../week-05/types';
import { AgeBars } from './AgeBars';
import { metrics, number, type Focus, type HealthRow, type Metric } from './model';
import './week10.css';

// Week 10 entry point: load CSV -> apply filters -> apply brush -> render bars and totals.
// Reuses Week 05's dataset path, age labels, status colors, and validation helper.
export function DiabetesBrushExplorer() {
  const [rows, setRows] = useState<HealthRow[]>([]);
  const [error, setError] = useState('');
  // Dropdown and legend state determine which responses are available to the chart.
  const [indicator, setIndicator] = useState<Metric>('BMI');
  const [indicatorValue, setIndicatorValue] = useState('all');
  const [statuses, setStatuses] = useState<DiabetesStatus[]>([0, 1]);
  const [age, setAge] = useState('all');
  const [percent, setPercent] = useState(false);
  // The brush stores age codes, not pixels: null means all filtered ages, [] means none.
  const [range, setRange] = useState<number[] | null>(null);
  // One focus state links legend highlights, bar opacity, and tooltip details.
  const [focus, setFocus] = useState<Focus | null>(null);
  // Changing the chart's React key remounts it to remove D3's visible brush rectangle.
  const [revision, setRevision] = useState(0);
  // Load once per mount. Abort on unmount so an obsolete request does not update the view.
  useEffect(() => {
    const controller = new AbortController();
    void csv(`${import.meta.env.BASE_URL}${DATASET_FILE}`, { signal: controller.signal }, (row) => {
      // CSV values are strings. Convert only the columns used by filters and summaries;
      // treat blanks as invalid rather than silently interpreting them as zero.
      const parsed = Object.fromEntries(
        ['Age', 'Diabetes_binary', 'BMI', 'PhysHlth', 'MentHlth', 'GenHlth'].map((key) => [
          key,
          row[key]?.trim() ? Number(row[key]) : NaN,
        ]),
      );
      if (
        !Object.values(parsed).every(Number.isFinite) ||
        !isDiabetesStatus(parsed.Diabetes_binary) ||
        !ageLabels[parsed.Age]
      )
        return null;
      return parsed as unknown as HealthRow;
    })
      .then(setRows)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setError(reason instanceof Error ? reason.message : 'Unable to load the CSV');
      });
    return () => controller.abort();
  }, []);
  // Memoization avoids scanning the full dataset again for a hover-only render.
  // Indicator value and age filters are combined with the visible legend categories.
  const filtered = useMemo(
    () =>
      rows.filter(
        (row) =>
          statuses.includes(row.Diabetes_binary) &&
          (age === 'all' || row.Age === Number(age)) &&
          (indicatorValue === 'all' || row[indicator] === Number(indicatorValue)),
      ),
    [rows, statuses, age, indicator, indicatorValue],
  );
  // The brush is a second filter over the dropdown/legend results. Context bars use
  // `filtered`; foreground bars and summary cards use `selected`.
  const selected = useMemo(
    () => (!range ? filtered : filtered.filter((row) => range.includes(row.Age))),
    [filtered, range],
  );
  // Build sorted, unique value choices from the selected CSV column.
  const indicatorValues = useMemo(
    () => [...new Set(rows.map((row) => row[indicator]))].sort((a, b) => a - b),
    [rows, indicator],
  );
  // Diabetes status is 0 or 1, so summing it counts responses reporting diabetes.
  // An empty selection shows a dash for mean BMI rather than dividing by zero.
  const summary = useMemo(() => {
    const diabetes = selected.reduce((sum, row) => sum + row.Diabetes_binary, 0);
    const bmi = selected.reduce((sum, row) => sum + row.BMI, 0);
    return { diabetes, bmi: selected.length ? (bmi / selected.length).toFixed(1) : '—' };
  }, [selected]);
  // Filter changes and Reset all clear both the selected ages and D3's visual brush.
  const clearBrush = useCallback(() => {
    setRange(null);
    setFocus(null);
    setRevision((v) => v + 1);
  }, []);
  // Stable callbacks prevent React hover renders from rebuilding an active D3 gesture.
  const handleFocus = useCallback(
    (next: Focus | null) =>
      setFocus((current) =>
        current?.status === next?.status && current?.age === next?.age ? current : next,
      ),
    [],
  );
  // Clicking a legend item toggles it. Clicking the final visible status restores both
  // categories, ensuring the legend cannot leave every category hidden.
  const toggleStatus = (value: DiabetesStatus) => {
    setStatuses((current) =>
      current.includes(value)
        ? current.length === 1
          ? [0, 1]
          : current.filter((s) => s !== value)
        : [...current, value],
    );
    clearBrush();
  };
  return (
    <main className="w10">
      <header className="w10-header">
        <div>
          <p className="w10-eyebrow">WEEK 10-INTERACTIVE BAR CHART</p>
          <h1>CDC Diabetes Records</h1>
          <p>
            Explore diabetes status by age. Brush across the bars to select age groups and update
            the summary above.
          </p>
        </div>
      </header>
      {/* Filter controls share parent state; changing a filter clears the old brush. */}
      <section className="w10-controls" aria-label="Chart controls">
        <label>
          Health indicator
          <select
            value={indicator}
            onChange={(event) => {
              setIndicator(event.target.value as Metric);
              setIndicatorValue('all');
              clearBrush();
            }}
          >
            {metrics.map((metric) => (
              <option key={metric.key} value={metric.key}>
                {metric.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Indicator value
          <select
            value={indicatorValue}
            onChange={(event) => {
              setIndicatorValue(event.target.value);
              clearBrush();
            }}
          >
            <option value="all">All values</option>
            {indicatorValues.map((value) => (
              <option key={value} value={value}>
                {indicator === 'Age' ? ageLabels[value] : value}
              </option>
            ))}
          </select>
        </label>
        <label>
          Age group
          <select
            value={age}
            onChange={(event) => {
              setAge(event.target.value);
              clearBrush();
            }}
          >
            <option value="all">All ages</option>
            {Object.entries(ageLabels).map(([code, label]) => (
              <option key={code} value={code}>
                {label} years
              </option>
            ))}
          </select>
        </label>
        <label>
          Bar measure
          <select
            value={percent ? 'percent' : 'count'}
            onChange={(event) => setPercent(event.target.value === 'percent')}
          >
            <option value="count">Response count</option>
            <option value="percent">Share within age group (%)</option>
          </select>
        </label>
        <button
          className="w10-reset"
          onClick={() => {
            setIndicator('BMI');
            setIndicatorValue('all');
            setAge('all');
            setPercent(false);
            setStatuses([0, 1]);
            clearBrush();
          }}
        >
          Reset all
        </button>
      </section>
      {/* These totals follow the same selected rows used to draw the solid bars. */}
      <section className="w10-stats" aria-label="Selection summary" aria-live="polite">
        <div>
          <span>SELECTED RESPONSES</span>
          <strong>
            {number.format(selected.length)}
            <small> / {number.format(filtered.length)}</small>
          </strong>
        </div>
        <div>
          <span>DIABETES IN SELECTION</span>
          <strong>
            {selected.length ? `${((summary.diabetes / selected.length) * 100).toFixed(1)}%` : '—'}
          </strong>
        </div>
        <div>
          <span>MEAN BMI IN SELECTION</span>
          <strong>{summary.bmi}</strong>
        </div>
      </section>
      {/* Click filters persist; hover/focus highlighting is temporary and shared with bars. */}
      <div className="w10-legend">
        <span>Diabetes status</span>
        {statusOptions.map((option) => (
          <button
            key={option.value}
            aria-pressed={statuses.includes(option.value)}
            className={focus?.status === option.value ? 'w10-legend-focused' : undefined}
            onClick={() => toggleStatus(option.value)}
            onMouseEnter={() => handleFocus({ status: option.value })}
            onMouseLeave={() => handleFocus(null)}
            onFocus={() => handleFocus({ status: option.value })}
            onBlur={() => handleFocus(null)}
          >
            <i style={{ background: option.color }} />
            {option.label}
            {!statuses.includes(option.value) && ' (hidden)'}
          </button>
        ))}
        <small>Click to filter · Hover to highlight</small>
      </div>
      {/* Render a loading or error message until the CSV is available. */}
      {error ? (
        <div role="alert" className="w10-message">
          Could not load the dataset: {error}. Reload the page to retry.
        </div>
      ) : !rows.length ? (
        <div role="status" className="w10-message">
          Loading CDC survey responses…
        </div>
      ) : (
        <section className="w10-card">
          <div className="w10-card-heading">
            <div>
              <span className="w10-step">SELECT / COMPARE</span>
              <h2>Diabetes status by age group</h2>
            </div>
          </div>
          <p>
            Drag across age groups to select them. Move or resize the selection; click outside it to
            clear. Solid bars show selected groups; faded bars provide context.
          </p>
          {/* A new revision resets D3; normal hover and brush updates preserve the chart. */}
          <AgeBars
            key={revision}
            rows={filtered}
            selected={selected}
            percent={percent}
            focus={focus}
            onFocus={handleFocus}
            onBrush={setRange}
          />
          <p className="w10-caption">
            Hover or keyboard-focus a bar for details and linked legend highlighting. Use the age
            dropdown for keyboard selection.{' '}
            {percent &&
              'Percentages use each age group�s total after the dropdown and legend filters.'}
          </p>
        </section>
      )}
      {range && (
        <p className="w10-range" role="status">
          Selected ages: {range.map((code) => ageLabels[code]).join(', ') || 'None'} �{' '}
          {number.format(selected.length)} responses
          {!selected.length && ' � try a wider selection.'}
        </p>
      )}
      <footer className="w10-footer">
        <p>
          Source: CDC BRFSS 2015 · Same balanced diabetes CSV as Week 05 ·{' '}
          {number.format(rows.length)} records.
          <br />
          This balanced sample describes survey responses; percentages are not population prevalence
          estimates.
        </p>
      </footer>
    </main>
  );
}
