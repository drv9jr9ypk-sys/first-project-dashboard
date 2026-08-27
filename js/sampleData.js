// Small built-in dataset so the dashboard is meaningful before any PDF is
// uploaded. Spans three months so the month-on-month trend chart has shape.

const RAW_SAMPLE = [
  // --- month -2 ---
  { date: "2026-06-02", description: "Whole Foods Market", amount: -86.42 },
  { date: "2026-06-03", description: "Shell Gas Station", amount: -41.15 },
  { date: "2026-06-04", description: "Netflix.com", amount: -15.49 },
  { date: "2026-06-05", description: "Starbucks Coffee", amount: -6.75 },
  { date: "2026-06-07", description: "Direct Deposit - Employer Payroll", amount: 3200.0 },
  { date: "2026-06-08", description: "Chipotle Mexican Grill", amount: -12.4 },
  { date: "2026-06-10", description: "Comcast Xfinity Internet", amount: -79.99 },
  { date: "2026-06-12", description: "Amazon.com", amount: -54.23 },
  { date: "2026-06-14", description: "Uber Trip", amount: -18.6 },
  { date: "2026-06-15", description: "CVS Pharmacy", amount: -22.1 },
  { date: "2026-06-18", description: "Spotify Premium", amount: -11.99 },
  { date: "2026-06-20", description: "Trader Joe's", amount: -63.87 },
  { date: "2026-06-22", description: "AMC Theatres", amount: -28.0 },
  { date: "2026-06-25", description: "Geico Insurance", amount: -132.5 },
  { date: "2026-06-27", description: "Planet Fitness Membership", amount: -24.99 },

  // --- month -1 ---
  { date: "2026-07-01", description: "Kroger", amount: -74.1 },
  { date: "2026-07-02", description: "Shell Gas Station", amount: -38.9 },
  { date: "2026-07-03", description: "Netflix.com", amount: -15.49 },
  { date: "2026-07-05", description: "Doordash - Pizza Place", amount: -31.2 },
  { date: "2026-07-07", description: "Direct Deposit - Employer Payroll", amount: 3200.0 },
  { date: "2026-07-09", description: "Target", amount: -102.34 },
  { date: "2026-07-10", description: "Comcast Xfinity Internet", amount: -79.99 },
  { date: "2026-07-11", description: "Uber Trip", amount: -14.3 },
  { date: "2026-07-13", description: "Starbucks Coffee", amount: -5.6 },
  { date: "2026-07-15", description: "Walgreens", amount: -18.75 },
  { date: "2026-07-17", description: "Spotify Premium", amount: -11.99 },
  { date: "2026-07-19", description: "Best Buy", amount: -219.99 },
  { date: "2026-07-21", description: "Whole Foods Market", amount: -91.05 },
  { date: "2026-07-23", description: "Ticketmaster - Concert", amount: -85.0 },
  { date: "2026-07-25", description: "Geico Insurance", amount: -132.5 },
  { date: "2026-07-28", description: "Southwest Airlines", amount: -210.4 },

  // --- current month ---
  { date: "2026-08-01", description: "Whole Foods Market", amount: -78.66 },
  { date: "2026-08-02", description: "Shell Gas Station", amount: -44.2 },
  { date: "2026-08-03", description: "Netflix.com", amount: -15.49 },
  { date: "2026-08-04", description: "Chipotle Mexican Grill", amount: -14.85 },
  { date: "2026-08-07", description: "Direct Deposit - Employer Payroll", amount: 3200.0 },
  { date: "2026-08-08", description: "Amazon.com", amount: -67.4 },
  { date: "2026-08-10", description: "Comcast Xfinity Internet", amount: -79.99 },
  { date: "2026-08-11", description: "Uber Trip", amount: -21.75 },
  { date: "2026-08-12", description: "Starbucks Coffee", amount: -7.2 },
  { date: "2026-08-14", description: "CVS Pharmacy", amount: -34.6 },
  { date: "2026-08-16", description: "Spotify Premium", amount: -11.99 },
  { date: "2026-08-17", description: "Trader Joe's", amount: -58.32 },
  { date: "2026-08-19", description: "Steam Games", amount: -29.99 },
  { date: "2026-08-21", description: "Geico Insurance", amount: -132.5 },
  { date: "2026-08-23", description: "Tax Refund", amount: 340.0 },
  { date: "2026-08-25", description: "Planet Fitness Membership", amount: -24.99 },
];

export function generateSampleTransactions() {
  return RAW_SAMPLE.map((t, i) => ({ ...t, sourceFile: "Sample data", rawId: `sample-${i}` }));
}
