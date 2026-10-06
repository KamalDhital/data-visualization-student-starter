import { csv } from 'd3-fetch';
import type { FinanceDatum, FinanceSeries } from './types';

// This focuses on the Amazon finance line.
const financeSymbols = ['AMZN'];
const financeDirectory = `${import.meta.env.BASE_URL}data/Finance`;

// CSV fields arrive as strings, so this helper prevents invalid numbers from reaching the chart.
function parseNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

// Invalid dates are returned as null so they can be filtered out during loading.
function parseDate(value: unknown) {
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// Load and clean the finance CSV files into sorted time series for the chart.
export function loadFinanceData() {
  return Promise.all(
    financeSymbols.map((symbol) =>
      csv(`${financeDirectory}/${symbol}.csv`, (row) => {
        const date = parseDate(row.Date);
        // Prefer adjusted close because it accounts for events such as splits and dividends.
        const close = parseNumber(row['Adj Close'] || row.Close);

        if (!date || close <= 0) return null;

        return {
          close,
          date,
          symbol,
          volume: parseNumber(row.Volume),
        };
      }).then((rows) => ({
        symbol,
        values: rows
          .filter((row): row is FinanceDatum => row !== null)
          .sort((a, b) => a.date.getTime() - b.date.getTime()),
      })),
    ),
  ).then((series) => series.filter((item): item is FinanceSeries => item.values.length > 0));
}

// Finds the data point closest to a hovered or clicked date.
export function findNearestDatum(values: FinanceDatum[], date: Date) {
  let nearest = values[0];
  let smallestDistance = Math.abs(nearest.date.getTime() - date.getTime());

  for (const value of values) {
    const distance = Math.abs(value.date.getTime() - date.getTime());
    if (distance < smallestDistance) {
      nearest = value;
      smallestDistance = distance;
    }
  }

  return nearest;
}
