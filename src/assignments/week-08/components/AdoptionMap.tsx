import { useMemo, useState } from 'react';
import { max } from 'd3-array';
import { geoGraticule, geoNaturalEarth1, geoPath } from 'd3-geo';
import { scaleSqrt } from 'd3-scale';
import { countryCoordinates, worldCountries } from '../config';
import { formatCurrency, formatPercent } from '../format';
import type { CountryDatum } from '../types';
import { Card } from './Card';

type AdoptionBand = {
  color: string;
  id: string;
  label: string;
  max: number;
  min: number;
};

const adoptionBands: AdoptionBand[] = [
  { color: '#93c5fd', id: 'emerging', label: '< 35%', min: 0, max: 35 },
  { color: '#14b8a6', id: 'growing', label: '35-50%', min: 35, max: 50 },
  { color: '#1d4ed8', id: 'leading', label: '50%+', min: 50, max: Infinity },
];

const landColors = ['#e7d9b8', '#d8c49d', '#c7d8bd', '#d5c6aa'];
const companyCountLegend = [
  { color: adoptionBands[0].color, label: 25, stroke: '#60a5fa' },
  { color: adoptionBands[1].color, label: 75, stroke: '#0f766e' },
  { color: adoptionBands[2].color, label: 150, stroke: '#1e40af' },
];

function getAdoptionBand(adoption: number) {
  return adoptionBands.find((band) => adoption >= band.min && adoption < band.max) ?? adoptionBands[0];
}

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
  const width = 1180;
  const height = 700;
  const [hoveredCountry, setHoveredCountry] = useState<CountryDatum | null>(null);
  const [activeBandId, setActiveBandId] = useState<string | null>(null);

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
      [42, 70],
      [width - 42, height - 164],
    ],
    worldCountries,
  );
  const pathGenerator = geoPath(projection);
  const graticulePath = pathGenerator(geoGraticule().step([30, 30])());
  const spherePath = pathGenerator({ type: 'Sphere' });
  const activeBand = adoptionBands.find((band) => band.id === activeBandId);

  // Color encodes adoption band; radius encodes how many companies are represented.
  const radiusScale = scaleSqrt()
    .domain([0, max(countriesWithCoordinates, (country) => country.companies) ?? 1])
    .range([5, 20]);
  const activeOrHoveredCountry = hoveredCountry ?? countries.find((country) => country.country === selectedCountry) ?? null;

  return (
    <Card className="min-w-0" title="Global AI Adoption Map">
      <svg
        className="aspect-[1180/700] h-auto min-h-[620px] w-full"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
      >
        <title>Country-level AI adoption on a world map</title>
        <defs>
          <linearGradient id="week06-ocean" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#eff6ff" />
            <stop offset="58%" stopColor="#dbeafe" />
            <stop offset="100%" stopColor="#bfdbfe" />
          </linearGradient>
          <filter id="week06-map-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#0f172a" floodOpacity="0.14" />
          </filter>
        </defs>
        <rect width={width} height={height} fill="#ffffff" />
        {spherePath ? <path d={spherePath} fill="url(#week06-ocean)" filter="url(#week06-map-shadow)" /> : null}
        <rect x={24} y={594} width={width - 48} height={82} rx={8} fill="#f8fafc" stroke="#e2e8f0" />
        <text x={34} y={42} className="fill-slate-600 text-[16px] font-medium">
          Hover for details, click a country to link the dashboard, or click a legend range to spotlight adoption.
        </text>
        {/* Draw latitude/longitude guide lines first, then the country shapes above them. */}
        {graticulePath ? <path d={graticulePath} fill="none" stroke="#93c5fd" strokeOpacity={0.7} strokeWidth={0.6} /> : null}
        {worldCountries.features.map((country, index) => {
          const path = pathGenerator(country);

          return path ? (
            <path
              key={index}
              d={path}
              fill={landColors[index % landColors.length]}
              stroke="#f8fafc"
              strokeLinejoin="round"
              strokeWidth={0.5}
            />
          ) : null;
        })}
        {/* The sphere outline gives the projected map a clean boundary. */}
        <path d={spherePath ?? undefined} fill="none" stroke="#64748b" strokeOpacity={0.65} strokeWidth={0.9} />
        {/* Dataset markers sit on top of the map and drive linked country selection. */}
        {countriesWithCoordinates.map((country, index) => {
          const projectedPoint = projection([country.coordinates.lon, country.coordinates.lat]);
          if (!projectedPoint) return null;

          const [x, y] = projectedPoint;
          const isSelected = selectedCountry === country.country;
          const isHovered = hoveredCountry?.country === country.country;
          const adoptionBand = getAdoptionBand(country.adoption);
          const isInActiveBand = activeBand ? adoptionBand.id === activeBand.id : true;
          const isDimmed = Boolean((selectedCountry && !isSelected) || !isInActiveBand);
          const radius = radiusScale(country.companies);

          return (
            <g key={`${country.country}-${index}`}>
              <circle
                cx={x}
                cy={y}
                r={radius + 4}
                fill="transparent"
                className="cursor-pointer"
                onClick={() => onSelectCountry(isSelected ? null : country.country)}
                onMouseEnter={() => setHoveredCountry(country)}
                onMouseLeave={() => setHoveredCountry(null)}
              />
              <circle
                cx={x}
                cy={y}
                r={radius}
                fill={adoptionBand.color}
                fillOpacity={isDimmed ? 0.18 : 0.88}
                stroke={isSelected || isHovered ? '#0f172a' : '#ffffff'}
                strokeWidth={isSelected || isHovered ? 3 : 1.5}
                className="cursor-pointer transition-all"
                onClick={() => onSelectCountry(isSelected ? null : country.country)}
                onFocus={() => setHoveredCountry(country)}
                onBlur={() => setHoveredCountry(null)}
                onMouseEnter={() => setHoveredCountry(country)}
                onMouseLeave={() => setHoveredCountry(null)}
                tabIndex={0}
              />
              {isSelected || isHovered ? (
                <text
                  x={x}
                  y={y - radius - 8}
                  textAnchor="middle"
                  className="fill-slate-900 text-[13px] font-semibold"
                >
                  {country.country} {formatPercent(country.adoption)}
                </text>
              ) : null}
            </g>
          );
        })}
        {activeOrHoveredCountry ? (
          <g transform="translate(866 72)">
            <rect width={274} height={118} rx={8} fill="#ffffff" stroke="#cbd5e1" />
            <text x={16} y={30} className="fill-slate-950 text-[18px] font-bold">
              {activeOrHoveredCountry.country}
            </text>
            <text x={16} y={56} className="fill-slate-600 text-[14px]">
              Adoption {formatPercent(activeOrHoveredCountry.adoption)}
            </text>
            <text x={16} y={80} className="fill-slate-600 text-[14px]">
              Companies {activeOrHoveredCountry.companies} | Maturity {activeOrHoveredCountry.maturity.toFixed(1)}
            </text>
            <text x={16} y={104} className="fill-slate-600 text-[14px]">
              Investment {formatCurrency(activeOrHoveredCountry.investment)} per employee
            </text>
          </g>
        ) : null}
        <g transform="translate(50 642)" aria-label="Interactive adoption color legend">
          <text x={0} y={-24} className="fill-slate-700 text-[14px] font-bold">
            Adoption range
          </text>
          {adoptionBands.map((band, index) => {
            const isActive = activeBandId === band.id;

            return (
              <g
                key={band.id}
                transform={`translate(${index * 112} 0)`}
                className="cursor-pointer"
                onClick={() => setActiveBandId(isActive ? null : band.id)}
                tabIndex={0}
                role="button"
                aria-label={`Highlight countries with ${band.label} AI adoption`}
              >
                <rect
                  x={0}
                  y={-14}
                  width={98}
                  height={36}
                  rx={6}
                  fill={isActive ? '#eff6ff' : '#ffffff'}
                  stroke={isActive ? '#1d4ed8' : '#cbd5e1'}
                  strokeWidth={isActive ? 1.8 : 1}
                />
                <circle cx={18} cy={4} r={8} fill={band.color} stroke="#ffffff" />
                <text x={34} y={9} className="fill-slate-700 text-[13px] font-semibold">
                  {band.label}
                </text>
              </g>
            );
          })}
        </g>
        <g transform="translate(742 642)" aria-label="Bubble size legend">
          <text x={0} y={-24} className="fill-slate-700 text-[14px] font-bold">
            Company count
          </text>
          {companyCountLegend.map((item, index) => (
            <g key={item.label} transform={`translate(${index * 92} 0)`}>
              <circle
                cx={12}
                cy={4}
                r={radiusScale(item.label)}
                fill={item.color}
                fillOpacity={0.72}
                stroke={item.stroke}
                strokeWidth={1.5}
              />
              <text x={40} y={9} className="fill-slate-600 text-[13px]">
                {item.label}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </Card>
  );
}
