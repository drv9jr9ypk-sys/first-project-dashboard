import { INCOME_CATEGORY, categoryById } from "./categories.js";

export const PERIODS = [
  { id: "1m", label: "1M", title: "Last month" },
  { id: "3m", label: "3M", title: "Last 3 months" },
  { id: "6m", label: "6M", title: "Last 6 months" },
  { id: "1y", label: "1Y", title: "Last year" },
  { id: "all", label: "All", title: "All time" },
];

/**
 * Keep only transactions within the selected trailing window. The window is
 * anchored to the most recent transaction date in the full set (not today's
 * real-world date), since statements are historical data.
 */
export function filterByPeriod(transactions, period) {
  if (period === "all" || transactions.length === 0) return transactions;

  const maxDate = transactions.reduce((max, t) => (t.date > max ? t.date : max), transactions[0].date);
  const cutoff = new Date(`${maxDate}T00:00:00`);
  if (period === "1m") cutoff.setMonth(cutoff.getMonth() - 1);
  else if (period === "3m") cutoff.setMonth(cutoff.getMonth() - 3);
  else if (period === "6m") cutoff.setMonth(cutoff.getMonth() - 6);
  else if (period === "1y") cutoff.setFullYear(cutoff.getFullYear() - 1);
  const cutoffIso = cutoff.toISOString().slice(0, 10);

  return transactions.filter((t) => t.date > cutoffIso);
}

export function computeStats(transactions) {
  let spend = 0;
  let income = 0;
  for (const tx of transactions) {
    if (tx.amount < 0) spend += -tx.amount;
    else income += tx.amount;
  }
  return { spend, income, net: income - spend, count: transactions.length };
}

export function computeCategoryTotals(transactions) {
  const totals = new Map();
  for (const tx of transactions) {
    if (tx.category === INCOME_CATEGORY.id) continue;
    if (tx.amount >= 0) continue;
    totals.set(tx.category, (totals.get(tx.category) || 0) + -tx.amount);
  }
  return [...totals.entries()]
    .map(([id, total]) => ({ id, total, label: categoryById(id).label, color: categoryById(id).color }))
    .sort((a, b) => b.total - a.total);
}

const MONTH_LABEL = new Intl.DateTimeFormat(undefined, { month: "short" });
const MONTH_YEAR_LABEL = new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" });

/**
 * Monthly totals for the trend chart. With no theme selected this is the
 * overall spend trend (income excluded); with a specific theme selected it's
 * that theme's own monthly total (income themes counted as money in, spend
 * themes as money out) so the trend adapts to whichever theme is isolated.
 */
export function computeMonthlyTotals(transactions, categoryFilter = "all") {
  const totals = new Map();
  for (const tx of transactions) {
    if (categoryFilter === "all") {
      if (tx.category === INCOME_CATEGORY.id || tx.amount >= 0) continue;
      const month = tx.date.slice(0, 7);
      totals.set(month, (totals.get(month) || 0) + -tx.amount);
    } else {
      if (tx.category !== categoryFilter) continue;
      const month = tx.date.slice(0, 7);
      totals.set(month, (totals.get(month) || 0) + Math.abs(tx.amount));
    }
  }
  const months = [...totals.keys()].sort();
  const years = new Set(months.map((m) => m.slice(0, 4)));
  return months.map((month) => {
    const d = new Date(`${month}-01T00:00:00`);
    return {
      month,
      total: totals.get(month),
      label: years.size > 1 ? MONTH_YEAR_LABEL.format(d) : MONTH_LABEL.format(d),
    };
  });
}
