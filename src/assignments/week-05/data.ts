import { useMemo } from 'react';
import { ageLabels, statusOptions } from './config';
import type { AgeDatum, DatasetRow, DiabetesStatus } from './types';

// Only 0 and 1 are valid values for the diabetes status column.
export function isDiabetesStatus(value: number): value is DiabetesStatus {
  return value === 0 || value === 1;
}

// Find the readable label and color for a diabetes status value.
export function getStatusOption(status: DiabetesStatus) {
  return statusOptions.find((option) => option.value === status) ?? statusOptions[0];
}

// Used when a total for currently visible legend categories is needed.
export function getVisibleTotal(datum: AgeDatum, visibleStatuses: DiabetesStatus[]) {
  return visibleStatuses.reduce<number>((sum, status) => sum + datum.counts[status], 0);
}

export function useAgeGroupCounts(rows: DatasetRow[]) {
  return useMemo(() => {
    const counts = new Map<number, Record<DiabetesStatus, number>>();

    // Count records for each age group, split into no-diabetes and diabetes buckets.
    rows.forEach((row) => {
      if (!Number.isFinite(row.Age) || !isDiabetesStatus(row.Diabetes_binary)) return;

      const current = counts.get(row.Age) ?? { 0: 0, 1: 0 };
      current[row.Diabetes_binary] += 1;
      counts.set(row.Age, current);
    });

    // Return every age group in order so the axis stays stable while data loads.
    return Object.entries(ageLabels).map(([ageCode, label]) => {
      const ageCounts = counts.get(Number(ageCode)) ?? { 0: 0, 1: 0 };

      return {
        ageCode: Number(ageCode),
        ageGroup: label,
        counts: ageCounts,
        total: ageCounts[0] + ageCounts[1],
      };
    });
  }, [rows]);
}
