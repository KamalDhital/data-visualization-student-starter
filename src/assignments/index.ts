import type { ComponentType } from 'react';
import { ResponsivePseudoScatterPlot } from './week-01/ResponsivePseudoScatterPlot';
import { CdcDiabetesSummary } from './week-02/CdcDiabetesSummary';

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
];

export const assignmentsMap = new Map(assignments.map((ex) => [ex.id, ex]));

export const defaultAssignment = '1';
