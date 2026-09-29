import { mean, rollup, sum } from 'd3-array';
import { csv } from 'd3-fetch';
import { companyDataUrl, countryDataUrl, industryDataUrl } from './config';
import type {
  CompanyRow,
  CountryDatum,
  CountryRow,
  IndustryDatum,
  IndustrySummaryRow,
  KpiSummary,
  TimelineDatum,
} from './types';

// CSV values arrive as strings. This helper keeps bad/missing numbers from breaking charts.
function parseNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

// Shared average helper so panels handle empty filters consistently.
export function average(rows: CompanyRow[], accessor: (row: CompanyRow) => number) {
  return mean(rows, accessor) ?? 0;
}

// Applies the three dropdown filters used by the dashboard.
export function filterCompanyRows(
  rows: CompanyRow[],
  selectedYear: string,
  selectedIndustry: string,
  selectedRegion: string,
) {
  return rows.filter((row) => {
    const yearMatches = selectedYear === 'All years' || row.surveyYear === Number(selectedYear);
    const industryMatches = selectedIndustry === 'All industries' || row.industry === selectedIndustry;
    const regionMatches = selectedRegion === 'All regions' || row.region === selectedRegion;

    return yearMatches && industryMatches && regionMatches;
  });
}

// Loads and normalizes the three CSV files used in the Week 06 dashboard.
export function loadAiTrendData() {
  return Promise.all([
    csv(companyDataUrl, (row) => ({
      responseId: String(row.response_id),
      companyId: String(row.company_id),
      surveyYear: parseNumber(row.survey_year),
      quarter: String(row.quarter),
      country: String(row.country),
      region: String(row.region),
      industry: String(row.industry),
      companySize: String(row.company_size),
      numEmployees: parseNumber(row.num_employees),
      aiAdoptionRate: parseNumber(row.ai_adoption_rate),
      aiInvestmentPerEmployee: parseNumber(row.ai_investment_per_employee),
      productivityChangePercent: parseNumber(row.productivity_change_percent),
      jobsDisplaced: parseNumber(row.jobs_displaced),
      jobsCreated: parseNumber(row.jobs_created),
      aiMaturityScore: parseNumber(row.ai_maturity_score),
      customerSatisfaction: parseNumber(row.customer_satisfaction),
    })),
    csv(countryDataUrl, (row) => ({
      country: String(row.country),
      region: String(row.region),
      digitalMaturityIndex: parseNumber(row.digital_maturity_index),
      aiPatentFilings2024: parseNumber(row.ai_patent_filings_2024),
      aiResearchersPerMillion: parseNumber(row.ai_researchers_per_million),
    })),
    csv(industryDataUrl, (row) => ({
      industry: String(row.industry),
      avgAiAdoptionRate: parseNumber(row.avg_ai_adoption_rate),
      avgProductivityChangePercent: parseNumber(row.avg_productivity_change_percent),
      avgJobsDisplaced: parseNumber(row.avg_jobs_displaced),
      avgJobsCreated: parseNumber(row.avg_jobs_created),
    })),
  ]);
}

// Builds dropdown choices directly from the data, so the UI stays in sync with the CSV files.
export function getDashboardOptions(companyRows: CompanyRow[]) {
  const years = [...new Set(companyRows.map((row) => row.surveyYear))]
    .filter(Boolean)
    .sort((a, b) => b - a)
    .map(String);
  const industries = [...new Set(companyRows.map((row) => row.industry))].sort();
  const regions = [...new Set(companyRows.map((row) => row.region))].sort();

  return {
    industries: ['All industries', ...industries],
    regions: ['All regions', ...regions],
    years,
  };
}

// Computes the four top KPI cards for the current filtered dashboard state.
export function getKpis(filteredRows: CompanyRow[]): KpiSummary {
  return {
    adoption: average(filteredRows, (row) => row.aiAdoptionRate),
    growth: average(filteredRows, (row) => row.productivityChangePercent),
    investment: average(filteredRows, (row) => row.aiInvestmentPerEmployee),
    startups: new Set(filteredRows.filter((row) => row.companySize === 'Startup').map((row) => row.companyId)).size,
    users: sum(filteredRows, (row) => row.numEmployees * (row.aiAdoptionRate / 100)),
  };
}

// Aggregates company rows to country-level markers and attaches extra country indicators.
export function getCountryData(baseFilteredRows: CompanyRow[], countryRows: CountryRow[]): CountryDatum[] {
  const countryLookup = new Map(countryRows.map((row) => [row.country, row]));

  return [...rollup(
    baseFilteredRows,
    (rows) => ({
      adoption: average(rows, (row) => row.aiAdoptionRate),
      companies: new Set(rows.map((row) => row.companyId)).size,
      investment: average(rows, (row) => row.aiInvestmentPerEmployee),
      region: rows[0]?.region ?? '',
    }),
    (row) => row.country,
  )].map(([country, values]) => {
    const countryIndicators = countryLookup.get(country);

    return {
      country,
      region: values.region,
      adoption: values.adoption,
      investment: values.investment,
      companies: values.companies,
      maturity: countryIndicators?.digitalMaturityIndex ?? 0,
      patents: countryIndicators?.aiPatentFilings2024 ?? 0,
      researchers: countryIndicators?.aiResearchersPerMillion ?? 0,
    };
  });
}

// Groups quarterly company responses into the line chart data.
export function getTimelineData(timelineRows: CompanyRow[]): TimelineDatum[] {
  const order = ['Q1', 'Q2', 'Q3', 'Q4'];

  return [...rollup(
    timelineRows,
    (rows) => average(rows, (row) => row.aiAdoptionRate),
    (row) => row.surveyYear,
    (row) => row.quarter,
  )]
    .flatMap(([year, quarters]) =>
      [...quarters].map(([quarter, adoption]) => ({
        adoption,
        period: `${year} ${quarter}`,
        quarter,
        year,
      })),
    )
    .filter((datum) => datum.adoption > 0)
    .sort((a, b) => a.year - b.year || order.indexOf(a.quarter) - order.indexOf(b.quarter));
}

// Aggregates company rows by industry and falls back to the industry summary CSV when needed.
export function getIndustryData(
  filteredRows: CompanyRow[],
  industryRows: IndustrySummaryRow[],
): IndustryDatum[] {
  const summaryLookup = new Map(industryRows.map((row) => [row.industry, row]));

  return [...rollup(
    filteredRows,
    (rows) => ({
      adoption: average(rows, (row) => row.aiAdoptionRate),
      jobsCreated: average(rows, (row) => row.jobsCreated),
      jobsDisplaced: average(rows, (row) => row.jobsDisplaced),
      productivity: average(rows, (row) => row.productivityChangePercent),
    }),
    (row) => row.industry,
  )].map(([industry, values]) => {
    const summary = summaryLookup.get(industry);

    return {
      industry,
      adoption: values.adoption || summary?.avgAiAdoptionRate || 0,
      productivity: values.productivity || summary?.avgProductivityChangePercent || 0,
      jobsCreated: values.jobsCreated || summary?.avgJobsCreated || 0,
      jobsDisplaced: values.jobsDisplaced || summary?.avgJobsDisplaced || 0,
    };
  });
}
