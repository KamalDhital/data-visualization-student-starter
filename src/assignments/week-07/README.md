# Week 07: Amazon Finance Index Line Chart

## Selected Visualization

Reference visualization: [Index chart | D3 | Observable](https://observablehq.com/@d3/index-chart/2)

The goal of this assignment was to recreate the main idea of an Observable D3 index chart using a React and D3 workflow. The chart focuses on Amazon stock data from the Finance dataset in `public/data/Finance/AMZN.csv`.

An index chart is useful because it does not only show the raw stock price. Instead, it compares each value against a selected baseline date. This makes it easier to see relative change over time.

## Data

The visualization uses the Amazon CSV file from the local Finance dataset:

`public/data/Finance/AMZN.csv`

The dataset includes daily stock market fields such as:

- `Date`
- `Open`
- `High`
- `Low`
- `Close`
- `Adj Close`
- `Volume`

This chart uses `Date`, `Adj Close`, and `Volume`. The adjusted close value is used because it better represents stock value over time after accounting for changes such as splits and dividends.

## Analysis of the Original Visualization

Before writing the React version, I examined the Observable reference and identified its main visualization components:

- A time-based x-axis
- A quantitative y-axis based on indexed price change
- A line path showing stock performance over time
- A baseline date used to normalize values
- Hover interaction for inspecting a date
- Click interaction for changing the baseline date
- A reference line where the indexed value equals `1`, or `0%` change

The important idea from the reference is the index calculation:

```ts
indexedValue = currentAdjustedClose / baselineAdjustedClose
```

If the indexed value is `1`, the stock is unchanged from the baseline date. If the value is above `1`, the stock increased. If it is below `1`, the stock decreased.

## Recreation Approach

Rather than copying the Observable implementation directly, I rebuilt the visualization inside the project using React state and D3 utilities.

The implementation involved:

1. Loading `AMZN.csv` from the Finance dataset.
2. Parsing dates and numeric stock values from the CSV file.
3. Creating a D3 time scale for the x-axis.
4. Creating a D3 log scale for the indexed y-axis.
5. Calculating Amazon's adjusted close value relative to a selected baseline date.
6. Rendering the Amazon line path in SVG.
7. Drawing grid lines, date labels, percentage labels, and a `0%` reference line.
8. Adding pointer interaction so the user can hover across the chart.
9. Allowing the user to click the plot area to set a new baseline date.

React manages the loaded data and interaction state, while D3 is used for data loading, scales, extents, ticks, and coordinate calculations.

## Differences from the Original

Some parts of the Observable reference were adapted for this assignment:

- The chart shows only Amazon instead of multiple companies.
- The data comes from the local Finance dataset instead of the Observable source data.
- The chart is implemented as a React component rather than an Observable notebook cell.
- SVG elements are rendered with JSX.
- The styling was adjusted to match the course project layout.
- The chart keeps the index-chart interaction idea but simplifies the surrounding controls.

## What I Learned

This exercise helped me understand how to:

- Deconstruct an existing D3 visualization into its core parts.
- Translate an Observable notebook example into a React application.
- Use D3 scales for time and indexed quantitative values.
- Normalize financial data around a baseline date.
- Render an SVG line chart using React and D3 together.
- Add interaction through React state while still relying on D3 for chart math.

This reverse-engineering process improved my ability to learn from an existing visualization and adapt its most useful ideas into my own project.
