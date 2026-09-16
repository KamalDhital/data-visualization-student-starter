import type { ComponentType } from 'react';
import { ResponsivePseudoScatterPlot } from './week-01/ResponsivePseudoScatterPlot';
import { CdcDiabetesSummary } from './week-02/CdcDiabetesSummary';
import { CdcDiabetesAgeBarChart } from './week-03/CdcDiabetesAgeBarChart';
import { CdcDiabetesAgeLegibilityChart } from './week-04/CdcDiabetesAgeLegibilityChart';

export interface Assignment {
  id: string;
  name: string;
  component: ComponentType;
}

export const assignments: Assignment[] = [
  {
    id: 'week-1',
    name: 'Week 1',
    component: ResponsivePseudoScatterPlot,
  },
  {
    id: '1',
    name: 'Week 2',
    component: CdcDiabetesSummary,
  },
  {
    id: 'week-3',
    name: 'Week 3',
    component: CdcDiabetesAgeBarChart,
  },
  {
    id: 'week-4',
    name: 'Week 4',
    component: CdcDiabetesAgeLegibilityChart,
  },
];

export const assignmentsMap = new Map(assignments.map((ex) => [ex.id, ex]));

export const defaultAssignment = '1';
