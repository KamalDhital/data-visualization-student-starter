import type { DiabetesStatus } from './types';

// Shared constants live here so the chart pieces use the same labels, colors, and layout.
export const DATASET_FILE =
  'data/cdc-diabetes-health-indicators/diabetes_binary_5050split_health_indicators_BRFSS2015.csv';

// The CSV stores age as category numbers; these labels make the axis readable.
export const ageLabels: Record<number, string> = {
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

// These two values become both the bar colors and the interactive legend choices.
export const statusOptions = [
  {
    value: 0,
    label: 'No diabetes',
    color: '#2563eb',
  },
  {
    value: 1,
    label: 'Diabetes',
    color: '#dc2626',
  },
] as const satisfies ReadonlyArray<{
  value: DiabetesStatus;
  label: string;
  color: string;
}>;

// Fixed SVG dimensions make the chart predictable inside the assignment viewer.
export const chart = {
  width: 960,
  height: 640,
  margin: {
    top: 132,
    right: 56,
    bottom: 112,
    left: 112,
  },
};

// Central color choices keep text, axes, and gridlines visually consistent.
export const colors = {
  title: '#0f172a',
  subtitle: '#475569',
  axis: '#334155',
  tick: '#64748b',
  grid: '#e2e8f0',
  label: '#1e293b',
};
