// Shared TypeScript types for the Week 5 interactive chart.
export type DiabetesStatus = 0 | 1;

export interface DatasetRow {
  Age: number;
  Diabetes_binary: number;
}

export interface AgeDatum {
  ageCode: number;
  ageGroup: string;
  counts: Record<DiabetesStatus, number>;
  total: number;
}

export interface TooltipState {
  x: number;
  y: number;
  ageGroup: string;
  status: DiabetesStatus;
  count: number;
  total: number;
}
