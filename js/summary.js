import { INCOME_CATEGORY, categoryById } from "./categories.js";

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

export function computeMonthlyTotals(transactions) {
  const totals = new Map();
  for (const tx of transactions) {
    if (tx.category === INCOME_CATEGORY.id || tx.amount >= 0) continue;
    const month = tx.date.slice(0, 7);
    totals.set(month, (totals.get(month) || 0) + -tx.amount);
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
