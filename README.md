# data-visualization-student-starter

Starter repository for student assignments for the data visualization course [Constructing Visualizations](https://github.com/curran/constructing-visualizations).

How to use, for the first assignment:

 * Fork this repository
 * Modify the content of `src/assignments/week-01` as the first assignment
 * Deploy your project using GitHub Pages (you may need to change `base` in `vite.config.ts`, depending on your repository name)
 * Submit the link to your repo and hosted site

How to use, for subsequent assignments:

 * Add a new directory `src/assignments`, potentially by copying a previous assignment as a starter, or copying files in from `src/examples` in [constructing-visualizations](https://github.com/curran/constructing-visualizations)
 * Update the index at `src/assignments/index.ts` to add the new listing
 * Redeploy to GitHub pages
 * Submit the link to your hosted assignment in GitHub pages

## Week 2 — CDC Diabetes Health Indicators

Week 2 presents a data abstraction for the [CDC Diabetes Health Indicators](https://archive.ics.uci.edu/dataset/891/cdc+diabetes+health+indicators) dataset from UCI, based on BRFSS healthcare and lifestyle survey responses.

Run the app with `npm run dev`, then open **Week 2** in the sidebar or go directly to `?example=1`. The assignment page includes the dataset source, description, summary (253,680 rows, 21 columns, CSV), attribute type analysis, and purpose, plus an interactive view of the bundled CSV.

For GitHub Pages, the Week 2 link will use the same query parameter after the deployed site URL, for example:
`https://<your-github-username>.github.io/data-visualization-student-starter/?example=1`.

Full write-up: `public/data/cdc-diabetes-health-indicators/README.md`.
