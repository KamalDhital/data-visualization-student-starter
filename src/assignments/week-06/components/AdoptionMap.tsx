import { useMemo } from 'react';
import { max } from 'd3-array';
import { geoGraticule, geoNaturalEarth1, geoPath } from 'd3-geo';
import { scaleLinear } from 'd3-scale';
import { countryCoordinates, worldCountries } from '../config';
import { formatPercent } from '../format';
import type { CountryDatum } from '../types';
import { Card } from './Card';

// Renders the geographic overview and lets the user select a country.
export function AdoptionMap({
  countries,
  selectedCountry,
  onSelectCountry,
}: {
  countries: CountryDatum[];
  onSelectCountry: (country: string | null) => void;
  selectedCountry: string | null;
}) {
  const width = 760;
  const height = 330;

  // Keep only countries that have a latitude/longitude entry in config.ts.
  const countriesWithCoordinates = useMemo(
    () =>
      countries
        .map((country) => ({
          ...country,
          coordinates: countryCoordinates[country.country],
        }))
        .filter((country) => country.coordinates),
    [countries],
  );

  // Fit a Natural Earth projection into the SVG so real country outlines fill the panel.
  const projection = geoNaturalEarth1().fitExtent(
    [
      [28, 52],
      [width - 28, height - 34],
    ],
    worldCountries,
  );
  const pathGenerator = geoPath(projection);
  const graticulePath = pathGenerator(geoGraticule().step([30, 30])());

  // Color encodes adoption intensity; radius encodes how many companies are represented.
  const adoptionColorScale = scaleLinear<string>()
    .domain([20, 40, 60])
    .range(['#dbeafe', '#14b8a6', '#1d4ed8']);
  const radiusScale = scaleLinear()
    .domain([0, max(countriesWithCoordinates, (country) => country.companies) ?? 1])
    .range([5, 18]);

  return (
    <Card className="min-w-0 xl:col-span-2" title="Global AI Adoption Map">
      <svg
        className="aspect-[760/330] h-auto min-h-56 w-full"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
      >
        <title>Country-level AI adoption on a world map</title>
        <rect width={width} height={height} fill="#ffffff" />
        <rect x={24} y={44} width={width - 48} height={height - 74} rx={8} fill="#f8fafc" />
        <text x={20} y={35} className="fill-slate-600 text-[12px] font-medium">
          Countries are placed geographically; marker size shows company count and color shows adoption.
        </text>
        {/* Draw latitude/longitude guide lines first, then the country shapes above them. */}
        {graticulePath ? <path d={graticulePath} fill="none" stroke="#cbd5e1" strokeWidth={0.6} /> : null}
        {worldCountries.features.map((country, index) => {
          const path = pathGenerator(country);

          return path ? (
            <path
              key={index}
              d={path}
              fill="#dce6d4"
              stroke="#ffffff"
              strokeLinejoin="round"
              strokeWidth={0.55}
            />
          ) : null;
        })}
        {/* The sphere outline gives the projected map a clean boundary. */}
        <path
          d={pathGenerator({ type: 'Sphere' }) ?? undefined}
          fill="none"
          stroke="#94a3b8"
          strokeWidth={0.9}
        />
        {/* Dataset markers sit on top of the map and drive linked country selection. */}
        {countriesWithCoordinates.map((country, index) => {
          const projectedPoint = projection([country.coordinates.lon, country.coordinates.lat]);
          if (!projectedPoint) return null;

          const [x, y] = projectedPoint;
          const isSelected = selectedCountry === country.country;

          return (
            <g key={`${country.country}-${index}`}>
              <circle
                cx={x}
                cy={y}
                r={radiusScale(country.companies)}
                fill={adoptionColorScale(country.adoption)}
                fillOpacity={isSelected || !selectedCountry ? 0.9 : 0.26}
                stroke={isSelected ? '#0f172a' : '#ffffff'}
                strokeWidth={isSelected ? 3 : 1.5}
                className="cursor-pointer transition"
                onClick={() => onSelectCountry(isSelected ? null : country.country)}
              />
              {isSelected ? (
                <text
                  x={x}
                  y={y - radiusScale(country.companies) - 8}
                  textAnchor="middle"
                  className="fill-slate-900 text-[11px] font-semibold"
                >
                  {country.country} {formatPercent(country.adoption)}
                </text>
              ) : null}
            </g>
          );
        })}
        {/* Simple color legend for adoption intensity. */}
        <g transform="translate(24 290)">
          <circle cx={8} cy={0} r={5} fill="#dbeafe" stroke="#ffffff" />
          <circle cx={70} cy={0} r={8} fill="#14b8a6" stroke="#ffffff" />
          <circle cx={138} cy={0} r={11} fill="#1d4ed8" stroke="#ffffff" />
          <text x={158} y={4} className="fill-slate-500 text-[11px]">
            AI adoption intensity
          </text>
        </g>
      </svg>
    </Card>
  );
}
