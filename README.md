# Finance Dashboard

A personal finance dashboard that runs entirely in your browser. Drop in PDF
bank or credit card statements and see your spending summarised, categorised,
and broken out in sortable tables — with **no backend, no server, no
database, and no network calls for your data**. PDF parsing and analysis all
happen client-side; your statements and transactions never leave your
device.

## Features

- Drag-and-drop (or click-to-browse) upload for PDF statements
- Client-side PDF text parsing into transactions (date, description, amount)
- Automatic categorisation (groceries, eating out, transport, bills &
  utilities, subscriptions, shopping, entertainment, health, income)
- Manual re-categorisation via a dropdown on any transaction — remembered
  as a merchant rule (matched on a normalised merchant name, so store
  numbers/dates/branch suffixes don't matter) and applied automatically to
  every matching transaction, including future uploads; view or delete
  rules in the "Category rules" panel
- All amounts shown in GBP (£)
- Summary view: total spend, total income, net, spend by theme, and a
  monthly spend trend
- Time-period filter (last month / 3 / 6 / 12 months / all time) and a theme
  filter that scope the whole dashboard, not just the table
- Spend-by-theme chart is switchable between bar, donut, and pie, with
  customisable arrangement (sort by size or alphabetically, and optionally
  fold small slices into "Other")
- Sortable, searchable transaction table
- "Recurring & subscriptions" panel: detects same-merchant payments at a
  regular cadence (monthly, every 4 weeks, quarterly, or annual) with a
  roughly consistent amount, shows typical amount/last seen/next expected
  per merchant, a total committed monthly spend, and lets you dismiss a
  false positive
- "Month-on-month by category" view: spend in the most recent complete
  month versus the one before it, per category, sorted by largest increase
  first, with the change shown in both £ and %
- Sample data included, so the dashboard is meaningful before you upload
  anything
- Data persists locally (`localStorage`) between visits; "Clear all data"
  wipes it and returns to the sample dataset

## Running it

This is a static site with no build step. Either:

- Open `index.html` directly in a browser, or
- Serve the folder locally, e.g. `python3 -m http.server 8000` and visit
  `http://localhost:8000`

The PDF engine ([pdf.js](https://mozilla.github.io/pdf.js/)) is vendored in
`vendor/pdfjs/` so the app works fully offline — no CDN, no external
requests.

## How parsing works

Statement layouts vary enormously between banks and card issuers, so parsing
is heuristic rather than tuned to one bank. Each page's text is grouped into
lines, then:

- the whole document is scanned once to work out whether dates are
  day-first or month-first, and to find a default year for dates printed
  without one
- if a "Date / Description / Amount" (or "Paid In / Withdrawn / Balance")
  table header is found, its column x-positions are used to classify
  numbers correctly (so a split Paid-In/Withdrawn ledger isn't misread as a
  single signed column); otherwise it falls back to reading the last one or
  two numbers on each line
- a transaction date or description that's only printed once per day/batch
  is carried forward, and a description that wraps onto the previous line
  is picked up from there

This has been tested against real UK current-account and credit-card
statement layouts (single-amount-column, split Paid-In/Withdrawn ledgers,
and two-date credit card rows) and reconstructs totals that match the
statement's own summary. It's still a heuristic, though: a PDF that's a
scanned image with no selectable text, or an unrecognised layout, won't
produce transactions — you'll see a message saying so. Auto-categorisation
is keyword-based and won't always be right, and amount sign can be
ambiguous on some layouts (e.g. incoming transfers with no visible +/- in
the extracted text); use the category dropdown on any row to fix it.

## Project structure

```
index.html          Page layout
styles.css           Design system, layout, theming (incl. dark mode)
js/app.js            Wiring: upload, filters, rendering
js/store.js          In-memory + localStorage state
js/pdfParser.js       PDF text extraction + transaction parsing
js/categories.js      Category taxonomy + keyword auto-categorisation
js/merchant.js        Merchant name normalisation for category rules
js/recurring.js       Recurring-payment detection
js/recurringTable.js  Recurring & subscriptions panel rendering
js/monthOverMonth.js       Month-on-month by category calculations
js/monthOverMonthTable.js  Month-on-month by category table rendering
js/summary.js        Stats / category totals / monthly totals
js/charts.js          Dependency-free SVG charts
js/table.js          Sortable transaction table
js/sampleData.js      Built-in sample dataset
vendor/pdfjs/         Vendored pdf.js (no CDN dependency)
```
