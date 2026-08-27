// Month-on-month spend comparison, per category: the most recent *complete*
// month versus the one before it.

import { INCOME_CATEGORY } from "./categories.js";

function shiftMonth(yyyyMM, delta) {
  const [y, m] = yyyyMM.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function spendByCategory(transactions, month) {
  const totals = new Map();
  for (const tx of transactions) {
    if (tx.category === INCOME_CATEGORY.id || tx.amount >= 0) continue;
    if (tx.date.slice(0, 7) !== month) continue;
    totals.set(tx.category, (totals.get(tx.category) || 0) + -tx.amount);
  }
  return totals;
}

/**
 * The latest month present in the data is treated as "complete" only if it
 * isn't the real-world current month (a live, growing dataset likely has a
 * partial month at the end); otherwise the month before it is used.
 */
export function computeMonthOverMonth(transactions) {
  if (transactions.length === 0) return { currentMonth: null, previousMonth: null, rows: [] };

  const maxDate = transactions.reduce((max, t) => (t.date > max ? t.date : max), transactions[0].date);
  const maxMonth = maxDate.slice(0, 7);

  const now = new Date();
  const todayMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const currentMonth = maxMonth === todayMonth ? shiftMonth(maxMonth, -1) : maxMonth;
  const previousMonth = shiftMonth(currentMonth, -1);

  const currentTotals = spendByCategory(transactions, currentMonth);
  const previousTotals = spendByCategory(transactions, previousMonth);

  const categoryIds = new Set([...currentTotals.keys(), ...previousTotals.keys()]);
  const rows = [...categoryIds].map((categoryId) => {
    const current = currentTotals.get(categoryId) || 0;
    const previous = previousTotals.get(categoryId) || 0;
    const change = current - previous;
    const percentChange = previous === 0 ? null : (change / previous) * 100;
    return { categoryId, current, previous, change, percentChange };
  });

  rows.sort((a, b) => b.change - a.change);

  return { currentMonth, previousMonth, rows };
}
