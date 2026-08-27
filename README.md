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
- Manual re-categorisation via a dropdown on any transaction
- Summary view: total spend, total income, net, spend by category, and a
  month-on-month spend trend
- Sortable, searchable, filterable transaction table
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
is heuristic: each page's text is grouped into lines, and lines that look
like `<date> ... <description> ... <amount>` are extracted as transactions.
If a PDF is a scanned image with no selectable text, or uses a layout the
parser doesn't recognise, it won't find transactions — you'll see a message
saying so. Auto-categorisation is keyword-based and won't always be right;
use the category dropdown on any row to fix it.

## Project structure

```
index.html          Page layout
styles.css           Design system, layout, theming (incl. dark mode)
js/app.js            Wiring: upload, filters, rendering
js/store.js          In-memory + localStorage state
js/pdfParser.js       PDF text extraction + transaction parsing
js/categories.js      Category taxonomy + keyword auto-categorisation
js/summary.js        Stats / category totals / monthly totals
js/charts.js          Dependency-free SVG charts
js/table.js          Sortable transaction table
js/sampleData.js      Built-in sample dataset
vendor/pdfjs/         Vendored pdf.js (no CDN dependency)
```
