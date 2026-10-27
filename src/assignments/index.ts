import type { ComponentType } from 'react';
import { ResponsivePseudoScatterPlot } from './week-01/ResponsivePseudoScatterPlot';
import { CdcDiabetesSummary } from './week-02/CdcDiabetesSummary';
import { CdcDiabetesAgeBarChart } from './week-03/CdcDiabetesAgeBarChart';
import { CdcDiabetesAgeLegibilityChart } from './week-04/CdcDiabetesAgeLegibilityChart';
import { CdcDiabetesAgeInteractiveChart } from './week-05/CdcDiabetesAgeInteractiveChart';
import { AiTechnologyTrendsExplorer } from './week-06/AiTechnologyTrendsExplorer';
import { FinanceIndexChart } from './week-07/FinanceIndexChart';
import { AiTechnologyTrendsExplorer as Week08AiTechnologyTrendsExplorer } from './week-08/AiTechnologyTrendsExplorer';
import { CdcDiabetesExplorer } from './week-10/cdcDiabetesExplorer';

// Each assignment supplies a URL identifier, sidebar label, and React entry component.
export interface Assignment {
  id: string;
  name: string;
  component: ComponentType;
}

// App.tsx uses this order for the sidebar, placing Week 10 immediately below Week 8.
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
  {
    id: 'week-8',
    name: 'Week 8',
    component: Week08AiTechnologyTrendsExplorer,
  },
  {
    id: 'week-10',
    name: 'Week 10',
    component: CdcDiabetesExplorer,
  },
];

// Look up the component using the URL's ?example= value (for example, week-10).
export const assignmentsMap = new Map(assignments.map((ex) => [ex.id, ex]));

// Used when the URL has no example parameter; '1' is the existing Week 2 identifier.
export const defaultAssignment = '1';
