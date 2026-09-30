import { useEffect, useMemo, useState } from 'react';
import {
  filterCompanyRows,
  getCountryData,
  getDashboardOptions,
  getIndustryData,
  getKpis,
  getTimelineData,
  loadAiTrendData,
} from './data';
import { formatCompact, formatCurrency, formatPercent } from './format';
import type { CompanyRow, CountryRow, IndustrySummaryRow } from './types';
import { AdoptionMap } from './components/AdoptionMap';
import { Card } from './components/Card';
import { EmploymentImpact } from './components/EmploymentImpact';
import { FilterSelect } from './components/FilterSelect';
import { ForecastPanel } from './components/ForecastPanel';
import { IndustryComparison } from './components/IndustryComparison';
import { KpiCard } from './components/KpiCard';
import { TimelineChart } from './components/TimelineChart';

// Main dashboard container: owns shared filter state and passes derived data to each panel.
export function AiTechnologyTrendsExplorer() {
  // Raw CSV data is stored here after loading. The derived chart data is calculated below with useMemo.
  const [companyRows, setCompanyRows] = useState<CompanyRow[]>([]);
  const [countryRows, setCountryRows] = useState<CountryRow[]>([]);
  const [industryRows, setIndustryRows] = useState<IndustrySummaryRow[]>([]);

  // Shared controls. These values coordinate all dashboard panels.
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedIndustry, setSelectedIndustry] = useState('All industries');
  const [selectedRegion, setSelectedRegion] = useState('All regions');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Load all three project datasets once when the Week 06 dashboard opens.
  useEffect(() => {
    void loadAiTrendData().then(([companies, countries, industries]) => {
      setCompanyRows(companies);
      setCountryRows(countries);
      setIndustryRows(industries);
    });
  }, []);

  const options = useMemo(() => getDashboardOptions(companyRows), [companyRows]);

  // Base filter comes from the dropdowns. Country selection is applied separately for linked highlighting.
  const baseFilteredRows = useMemo(
    () => filterCompanyRows(companyRows, selectedYear, selectedIndustry, selectedRegion),
    [companyRows, selectedIndustry, selectedRegion, selectedYear],
  );

  const filteredRows = useMemo(
    () => (selectedCountry ? baseFilteredRows.filter((row) => row.country === selectedCountry) : baseFilteredRows),
    [baseFilteredRows, selectedCountry],
  );

  // The timeline intentionally ignores the year dropdown so users can still see change over time.
  const timelineRows = useMemo(
    () => filterCompanyRows(companyRows, 'All years', selectedIndustry, selectedRegion).filter(
      (row) => !selectedCountry || row.country === selectedCountry,
    ),
    [companyRows, selectedCountry, selectedIndustry, selectedRegion],
  );

  const kpis = useMemo(() => getKpis(filteredRows), [filteredRows]);
  const countryData = useMemo(() => getCountryData(baseFilteredRows, countryRows), [baseFilteredRows, countryRows]);
  const timeline = useMemo(() => getTimelineData(timelineRows), [timelineRows]);
  const industryData = useMemo(() => getIndustryData(filteredRows, industryRows), [filteredRows, industryRows]);

  const activeRegionLabel = selectedRegion === 'All regions' ? 'Global' : selectedRegion;
  const activeIndustryLabel = selectedIndustry === 'All industries' ? 'all industries' : selectedIndustry;

  return (
    <main className="h-full min-w-0 w-full overflow-auto bg-[#eef3f8] text-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 py-4 sm:gap-5 sm:px-5 lg:px-6">
        <header className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-5 px-4 py-5 sm:px-5 sm:py-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
            <div className="min-w-0">
              <h1 className="text-xl font-black leading-tight text-[#0000ff] sm:text-3xl lg:text-3xl xl:text-4xl">
                AI & Technology Trends Explorer
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Track adoption, investment, industry change, employment impact, and short-term trend signals across a coordinated AI market dashboard.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row xl:justify-end">
              <div className="rounded-md border border-slate-200 bg-[#fff7ed] px-3 py-2">
                <div className="text-xs font-black uppercase text-amber-700">Current year</div>
                <div className="text-xl font-black text-slate-950">{selectedYear}</div>
              </div>
              <button
                className="h-12 rounded-md border border-blue-700 bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition hover:border-blue-800 hover:bg-blue-700"
                onClick={() => {
                  setSelectedYear('2026');
                  setSelectedIndustry('All industries');
                  setSelectedRegion('All regions');
                  setSelectedCountry(null);
                }}
              >
                Reset filters
              </button>
            </div>
          </div>
        </header>

        {/* KPI cards summarize the active filter state at a glance. */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard accent="blue" label="AI Investment" value={formatCurrency(kpis.investment)} note="Avg. per employee" />
          <KpiCard accent="teal" label="AI Users" value={formatCompact(kpis.users)} note="Estimated employees reached" />
          <KpiCard accent="amber" label="Startups" value={formatCompact(kpis.startups)} note="Unique startup companies" />
          <KpiCard accent="green" label="Growth Rate" value={formatPercent(kpis.growth)} note="Avg. productivity change" />
        </div>

        {/* Filter strip controls the coordinated views below. */}
        <Card className="border-slate-300">
          <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end">
            <FilterSelect label="Year" value={selectedYear} options={options.years} onChange={setSelectedYear} />
            <FilterSelect
              label="Industry"
              value={selectedIndustry}
              options={options.industries}
              onChange={(value) => {
                setSelectedIndustry(value);
                setSelectedCountry(null);
              }}
            />
            <FilterSelect
              label="Region"
              value={selectedRegion}
              options={options.regions}
              onChange={(value) => {
                setSelectedRegion(value);
                setSelectedCountry(null);
              }}
            />
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600 lg:max-w-md">
              Viewing <span className="font-bold text-slate-950">{activeRegionLabel}</span> across{' '}
              <span className="font-bold text-slate-950">{activeIndustryLabel}</span>
              {selectedCountry ? (
                <>
                  {' '}
                  with <span className="font-bold text-slate-950">{selectedCountry}</span> selected.
                </>
              ) : (
                '.'
              )}
            </div>
          </div>
        </Card>

        {/* Map and context panel provide the geographic overview and current selection summary. */}
        <div className="grid min-w-0 gap-4 xl:grid-cols-3">
          <AdoptionMap countries={countryData} selectedCountry={selectedCountry} onSelectCountry={setSelectedCountry} />
          <Card title="Selected Context">
            <div className="space-y-4 p-4 text-sm leading-6 text-slate-600">
              <p className="text-slate-700">
                Use the dashboard like an executive snapshot: filter the market, select a country, then compare adoption, industry movement, workforce change, and the next-quarter forecast.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-slate-200 bg-[#f8fafc] p-3">
                  <div className="text-xs font-bold uppercase text-slate-500">Responses</div>
                  <div className="mt-1 text-2xl font-black text-slate-950">{formatCompact(filteredRows.length)}</div>
                </div>
                <div className="rounded-md border border-slate-200 bg-[#f8fafc] p-3">
                  <div className="text-xs font-bold uppercase text-slate-500">Countries</div>
                  <div className="mt-1 text-2xl font-black text-slate-950">{countryData.length}</div>
                </div>
              </div>
              <p className="border-l-4 border-[#0f766e] pl-3">
                Click a country bubble to coordinate the timeline, industry comparison, employment impact, and forecasting panels.
              </p>
            </div>
          </Card>
        </div>

        {/* Time, industry, workforce, and forecast panels complete the dashboard workflow. */}
        <TimelineChart data={timeline} />

        <div className="grid min-w-0 gap-4 xl:grid-cols-2">
          <IndustryComparison data={industryData} />
          <EmploymentImpact data={industryData} />
        </div>

        <ForecastPanel filteredRows={filteredRows} timeline={timeline} selectedCountry={selectedCountry} />
      </div>
    </main>
  );
}
