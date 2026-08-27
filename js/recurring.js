// Detects recurring payments/subscriptions: the same merchant appearing at
// a regular cadence with a roughly consistent amount. Detection only looks
// at whatever transactions are currently loaded - no external assumptions
// about billing dates or amounts.

import { normalizeMerchant, displayMerchant } from "./merchant.js";

const MIN_OCCURRENCES = 3;
const AMOUNT_TOLERANCE = 0.1; // ±10%
const MIN_MATCHING_SHARE = 0.7; // at least 70% of occurrences must agree on the typical amount

// Checked in order; a cadence matches only when EVERY gap between
// consecutive occurrences falls within its tolerance. "Every 4 weeks" is
// checked first with a narrow tolerance so it only wins on near-exact
// 28-day billing - anything with the natural 28-31 day drift of a calendar
// month falls through to "Monthly" instead.
const CADENCES = [
  { id: "every4weeks", label: "Every 4 weeks", targetDays: 28, tolerance: 1.5, monthlyFactor: 13 / 12 },
  { id: "monthly", label: "Monthly", targetDays: 30.4, tolerance: 6, monthlyFactor: 1 },
  { id: "quarterly", label: "Quarterly", targetDays: 91.3, tolerance: 10, monthlyFactor: 1 / 3 },
  { id: "annual", label: "Annual", targetDays: 365, tolerance: 25, monthlyFactor: 1 / 12 },
];

function median(nums) {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function daysBetween(isoA, isoB) {
  return (new Date(`${isoB}T00:00:00`) - new Date(`${isoA}T00:00:00`)) / 86400000;
}

function addDays(iso, days) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + Math.round(days));
  return d.toISOString().slice(0, 10);
}

function classifyCadence(gaps) {
  for (const cadence of CADENCES) {
    if (gaps.every((g) => Math.abs(g - cadence.targetDays) <= cadence.tolerance)) return cadence;
  }
  return null;
}

/**
 * transactions: the full currently-loaded set (not period/theme-filtered -
 * a short window can't establish a quarterly or annual cadence).
 * dismissedMerchants: normalised merchant keys to exclude.
 */
export function detectRecurring(transactions, dismissedMerchants = []) {
  const dismissed = new Set(dismissedMerchants);
  const groups = new Map();

  for (const tx of transactions) {
    if (tx.amount >= 0) continue; // recurring spend only, not income
    const key = normalizeMerchant(tx.description);
    if (dismissed.has(key)) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(tx);
  }

  const results = [];
  for (const [key, txs] of groups.entries()) {
    if (txs.length < MIN_OCCURRENCES) continue;

    const sorted = [...txs].sort((a, b) => a.date.localeCompare(b.date));
    const gaps = [];
    for (let i = 1; i < sorted.length; i++) gaps.push(daysBetween(sorted[i - 1].date, sorted[i].date));

    const cadence = classifyCadence(gaps);
    if (!cadence) continue;

    const amounts = sorted.map((t) => Math.abs(t.amount));
    const medianAmount = median(amounts);
    const matching = amounts.filter((a) => Math.abs(a - medianAmount) / medianAmount <= AMOUNT_TOLERANCE);
    if (matching.length / amounts.length < MIN_MATCHING_SHARE) continue;

    const typicalAmount = median(matching);
    const last = sorted[sorted.length - 1];
    const categoryCounts = new Map();
    for (const t of sorted) categoryCounts.set(t.category, (categoryCounts.get(t.category) || 0) + 1);
    const categoryId = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const medianGap = median(gaps);

    results.push({
      merchant: key,
      displayName: displayMerchant(key),
      categoryId,
      typicalAmount,
      cadenceId: cadence.id,
      cadenceLabel: cadence.label,
      occurrenceCount: sorted.length,
      lastSeenDate: last.date,
      nextExpectedDate: addDays(last.date, medianGap),
      monthlyEquivalent: typicalAmount * cadence.monthlyFactor,
    });
  }

  return results.sort((a, b) => b.monthlyEquivalent - a.monthlyEquivalent);
}

export function computeCommittedMonthlySpend(recurring) {
  return recurring.reduce((sum, r) => sum + r.monthlyEquivalent, 0);
}
