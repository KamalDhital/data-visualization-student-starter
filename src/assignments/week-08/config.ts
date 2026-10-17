import { feature } from 'topojson-client';
import worldAtlas from 'world-atlas/countries-110m.json';
import type { FeatureCollection, Geometry } from 'geojson';
import type { GeometryCollection, Topology } from 'topojson-specification';

export const COMPANY_DATA_FILE = 'data/global_ai_tool_adoption/ai_company_adoption.csv';
export const COUNTRY_DATA_FILE = 'data/global_ai_tool_adoption/country_ai_index.csv';
export const INDUSTRY_DATA_FILE = 'data/global_ai_tool_adoption/ai_industry_summary.csv';

export const companyDataUrl = `${import.meta.env.BASE_URL}${COMPANY_DATA_FILE}`;
export const countryDataUrl = `${import.meta.env.BASE_URL}${COUNTRY_DATA_FILE}`;
export const industryDataUrl = `${import.meta.env.BASE_URL}${INDUSTRY_DATA_FILE}`;

// world-atlas ships TopoJSON. Convert it once here so the map component can render GeoJSON paths.
const worldTopology = worldAtlas as unknown as Topology<{ countries: GeometryCollection }>;

export const worldCountries = feature(
  worldTopology,
  worldTopology.objects.countries,
) as unknown as FeatureCollection<Geometry>;

// Country centroids for the countries present in the CSV dataset. These position the dashboard markers.
export const countryCoordinates: Record<string, { lat: number; lon: number }> = {
  Argentina: { lat: -38.42, lon: -63.62 },
  Australia: { lat: -25.27, lon: 133.78 },
  Brazil: { lat: -14.24, lon: -51.93 },
  Canada: { lat: 56.13, lon: -106.35 },
  Chile: { lat: -35.68, lon: -71.54 },
  China: { lat: 35.86, lon: 104.2 },
  Colombia: { lat: 4.57, lon: -74.3 },
  Egypt: { lat: 26.82, lon: 30.8 },
  France: { lat: 46.23, lon: 2.21 },
  Germany: { lat: 51.17, lon: 10.45 },
  India: { lat: 20.59, lon: 78.96 },
  Indonesia: { lat: -0.79, lon: 113.92 },
  Italy: { lat: 41.87, lon: 12.57 },
  Japan: { lat: 36.2, lon: 138.25 },
  Kenya: { lat: -0.02, lon: 37.91 },
  Malaysia: { lat: 4.21, lon: 101.98 },
  Netherlands: { lat: 52.13, lon: 5.29 },
  'New Zealand': { lat: -40.9, lon: 174.89 },
  Nigeria: { lat: 9.08, lon: 8.68 },
  Philippines: { lat: 12.88, lon: 121.77 },
  Poland: { lat: 51.92, lon: 19.15 },
  Singapore: { lat: 1.35, lon: 103.82 },
  'South Africa': { lat: -30.56, lon: 22.94 },
  'South Korea': { lat: 35.91, lon: 127.77 },
  Spain: { lat: 40.46, lon: -3.75 },
  Sweden: { lat: 60.13, lon: 18.64 },
  Thailand: { lat: 15.87, lon: 100.99 },
  UK: { lat: 55.38, lon: -3.44 },
  USA: { lat: 37.09, lon: -95.71 },
  Vietnam: { lat: 14.06, lon: 108.28 },
};
