// Small built-in dataset so the dashboard is meaningful before any PDF is
// uploaded. Spans three months so the month-on-month trend chart has shape.
// Merchants are UK-based to match the dashboard's GBP (£) currency.

const RAW_SAMPLE = [
  // --- month -2 ---
  { date: "2026-06-02", description: "Tesco Superstore", amount: -78.5 },
  { date: "2026-06-03", description: "Shell Petrol Station", amount: -42.0 },
  { date: "2026-06-04", description: "Netflix.com", amount: -15.99 },
  { date: "2026-06-05", description: "Costa Coffee", amount: -6.2 },
  { date: "2026-06-07", description: "Salary - Employer Ltd", amount: 3200.0 },
  { date: "2026-06-08", description: "Pret A Manger", amount: -11.8 },
  { date: "2026-06-10", description: "BT Broadband", amount: -42.99 },
  { date: "2026-06-12", description: "Amazon.co.uk", amount: -58.4 },
  { date: "2026-06-14", description: "TfL Travel Charge", amount: -19.2 },
  { date: "2026-06-15", description: "Boots Pharmacy", amount: -21.5 },
  { date: "2026-06-18", description: "Spotify Premium", amount: -10.99 },
  { date: "2026-06-20", description: "Sainsbury's", amount: -68.3 },
  { date: "2026-06-22", description: "Odeon Cinema", amount: -26.0 },
  { date: "2026-06-25", description: "British Gas", amount: -110.0 },
  { date: "2026-06-27", description: "Amazon Prime", amount: -8.99 },

  // --- month -1 ---
  { date: "2026-07-01", description: "Waitrose", amount: -71.2 },
  { date: "2026-07-02", description: "Shell Petrol Station", amount: -39.8 },
  { date: "2026-07-03", description: "Netflix.com", amount: -15.99 },
  { date: "2026-07-05", description: "Deliveroo", amount: -28.9 },
  { date: "2026-07-07", description: "Salary - Employer Ltd", amount: 3200.0 },
  { date: "2026-07-09", description: "John Lewis", amount: -95.0 },
  { date: "2026-07-10", description: "BT Broadband", amount: -42.99 },
  { date: "2026-07-11", description: "Trainline", amount: -34.5 },
  { date: "2026-07-13", description: "Costa Coffee", amount: -5.4 },
  { date: "2026-07-15", description: "Superdrug", amount: -16.75 },
  { date: "2026-07-17", description: "Spotify Premium", amount: -10.99 },
  { date: "2026-07-19", description: "Argos", amount: -179.99 },
  { date: "2026-07-21", description: "Tesco Superstore", amount: -84.6 },
  { date: "2026-07-23", description: "Ticketmaster - Concert", amount: -75.0 },
  { date: "2026-07-25", description: "British Gas", amount: -110.0 },
  { date: "2026-07-28", description: "Trainline", amount: -190.0 },

  // --- current month ---
  { date: "2026-08-01", description: "Sainsbury's", amount: -76.4 },
  { date: "2026-08-02", description: "Shell Petrol Station", amount: -45.0 },
  { date: "2026-08-03", description: "Netflix.com", amount: -15.99 },
  { date: "2026-08-04", description: "Pret A Manger", amount: -13.2 },
  { date: "2026-08-07", description: "Salary - Employer Ltd", amount: 3200.0 },
  { date: "2026-08-08", description: "Amazon.co.uk", amount: -62.1 },
  { date: "2026-08-10", description: "BT Broadband", amount: -42.99 },
  { date: "2026-08-11", description: "Uber Trip", amount: -18.4 },
  { date: "2026-08-12", description: "Costa Coffee", amount: -6.8 },
  { date: "2026-08-14", description: "Boots Pharmacy", amount: -30.25 },
  { date: "2026-08-16", description: "Spotify Premium", amount: -10.99 },
  { date: "2026-08-17", description: "Waitrose", amount: -55.6 },
  { date: "2026-08-19", description: "PlayStation Store", amount: -29.99 },
  { date: "2026-08-21", description: "British Gas", amount: -110.0 },
  { date: "2026-08-23", description: "HMRC Tax Refund", amount: 280.0 },
  { date: "2026-08-25", description: "TfL Travel Charge", amount: -21.0 },
];

export function generateSampleTransactions() {
  return RAW_SAMPLE.map((t, i) => ({ ...t, sourceFile: "Sample data", rawId: `sample-${i}` }));
}
