// Groups spending transactions (income excluded) by normalised merchant
// name and ranks them by total spent.

import { normalizeMerchant, displayMerchant } from "./merchant.js";

export function computeTopMerchants(transactions, limit = 10) {
  const groups = new Map();

  for (const tx of transactions) {
    if (tx.amount >= 0) continue; // spend only
    const key = normalizeMerchant(tx.description);
    if (!groups.has(key)) groups.set(key, { total: 0, count: 0 });
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
      average: group.total / group.count,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}
