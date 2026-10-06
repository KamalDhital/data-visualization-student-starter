import type { ComponentType } from 'react';
import { ResponsivePseudoScatterPlot } from './week-01/ResponsivePseudoScatterPlot';
import { CdcDiabetesSummary } from './week-02/CdcDiabetesSummary';
import { CdcDiabetesAgeBarChart } from './week-03/CdcDiabetesAgeBarChart';
import { CdcDiabetesAgeLegibilityChart } from './week-04/CdcDiabetesAgeLegibilityChart';
import { CdcDiabetesAgeInteractiveChart } from './week-05/CdcDiabetesAgeInteractiveChart';
import { AiTechnologyTrendsExplorer } from './week-06/AiTechnologyTrendsExplorer';
import { FinanceIndexChart } from './week-07/FinanceIndexChart';

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
  {
    id: 'week-5',
    name: 'Week 5',
    component: CdcDiabetesAgeInteractiveChart,
  },
  {
    id: 'week-6',
    name: 'Week 6',
    component: AiTechnologyTrendsExplorer,
  },
  {
    id: 'week-7',
    name: 'Week 7',
    component: FinanceIndexChart,
  },
];

export const assignmentsMap = new Map(assignments.map((ex) => [ex.id, ex]));

export const defaultAssignment = '1';
