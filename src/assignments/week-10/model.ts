import type { DatasetRow, DiabetesStatus } from '../week-05/types';

// CSV column names accepted by the health-indicator dropdown.
export type Metric = 'BMI' | 'Age' | 'PhysHlth' | 'MentHlth' | 'GenHlth';
// Extend Week 05's age/status row with the numeric health fields used in Week 10.
// Diabetes_binary is narrowed to 0 | 1 after validation during CSV loading.
export interface HealthRow extends DatasetRow {
  Diabetes_binary: DiabetesStatus;
  BMI: number;
  PhysHlth: number;
  MentHlth: number;
  GenHlth: number;
}
// Keep machine-readable CSV keys separate from labels displayed in the menu.
export const metrics: { key: Metric; label: string }[] = [
  { key: 'BMI', label: 'Body mass index (BMI)' },
  { key: 'Age', label: 'Age group (coded 1–13)' },
  { key: 'PhysHlth', label: 'Poor physical health (days / month)' },
  { key: 'MentHlth', label: 'Poor mental health (days / month)' },
  { key: 'GenHlth', label: 'General health (1 excellent–5 poor)' },
];
// Legend hover focuses a status across all ages; bar hover adds a specific age code.
export interface Focus {
  status: DiabetesStatus;
  age?: number;
}
// Reuse one formatter for consistent comma-separated counts in bars and summaries.
export const number = new Intl.NumberFormat('en-US');
