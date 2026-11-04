// Raw row shape from ai_company_adoption.csv after parsing numeric fields.
export interface CompanyRow {
  responseId: string;
  companyId: string;
  surveyYear: number;
  quarter: string;
  country: string;
  region: string;
  industry: string;
  companySize: string;
  numEmployees: number;
  aiAdoptionRate: number;
  aiInvestmentPerEmployee: number;
  productivityChangePercent: number;
  jobsDisplaced: number;
  jobsCreated: number;
  aiMaturityScore: number;
  customerSatisfaction: number;
}

// Raw row shape from country_ai_index.csv after parsing numeric fields.
export interface CountryRow {
  country: string;
  region: string;
  digitalMaturityIndex: number;
  aiPatentFilings2024: number;
  aiResearchersPerMillion: number;
}

// Raw row shape from ai_industry_summary.csv after parsing numeric fields.
export interface IndustrySummaryRow {
  industry: string;
  avgAiAdoptionRate: number;
  avgProductivityChangePercent: number;
  avgJobsDisplaced: number;
  avgJobsCreated: number;
}

// Aggregated country values used by the map panel.
export interface CountryDatum {
  country: string;
  region: string;
  adoption: number;
  investment: number;
  companies: number;
  maturity: number;
  patents: number;
  researchers: number;
}

// Aggregated quarterly values used by the timeline panel.
export interface TimelineDatum {
  period: string;
  year: number;
  quarter: string;
  adoption: number;
}

// Aggregated industry values used by the comparison and employment panels.
export interface IndustryDatum {
  industry: string;
  adoption: number;
  productivity: number;
  jobsCreated: number;
  jobsDisplaced: number;
}

// Values shown in the four dashboard KPI cards.
export interface KpiSummary {
  adoption: number;
  growth: number;
  investment: number;
  startups: number;
  users: number;
}
