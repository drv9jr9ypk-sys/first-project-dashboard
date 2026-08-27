// Groups every "Other"-categorised spend transaction by normalised
// merchant, so the biggest unrecognised merchants surface first for
// manual review.

import { normalizeMerchant, displayMerchant } from "./merchant.js";
import { OTHER_CATEGORY } from "./categories.js";

export function computeUncategorized(transactions) {
  const groups = new Map();

  for (const tx of transactions) {
    if (tx.category !== OTHER_CATEGORY.id) continue;
    if (tx.amount >= 0) continue; // spend only
    const key = normalizeMerchant(tx.description);
    if (!groups.has(key)) {
      groups.set(key, { total: 0, count: 0, sampleId: tx.id, sampleDescription: tx.description });
    }
    const group = groups.get(key);
    group.total += -tx.amount;
    group.count += 1;
  }

  return [...groups.entries()]
    .map(([merchant, group]) => ({
      merchant,
      displayName: displayMerchant(merchant),
      total: group.total,
      count: group.count,
      sampleId: group.sampleId,
      sampleDescription: group.sampleDescription,
    }))
    .sort((a, b) => b.total - a.total);
}

/** "Other" spend as a share of all spend, so the total is visible and shrinks as merchants get categorised. */
export function computeOtherShare(transactions) {
  let otherTotal = 0;
  let totalSpend = 0;

  for (const tx of transactions) {
    if (tx.amount >= 0) continue;
    totalSpend += -tx.amount;
    if (tx.category === OTHER_CATEGORY.id) otherTotal += -tx.amount;
  }

  return { otherTotal, totalSpend, percentage: totalSpend === 0 ? 0 : (otherTotal / totalSpend) * 100 };
}
