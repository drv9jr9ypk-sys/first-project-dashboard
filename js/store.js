import { autoCategorize } from "./categories.js";
import { generateSampleTransactions } from "./sampleData.js";
import { normalizeMerchant } from "./merchant.js";

const STORAGE_KEY = "finance-dashboard-v1";

/**
 * Everything lives in memory + localStorage on this device. Nothing here
 * ever performs a network request - that is the whole point of the app.
 */
class Store {
  constructor() {
    this.transactions = [];
    this.sources = []; // { name, count, addedAt }
    this.categoryRules = new Map(); // normalised merchant -> category id
    this.dismissedRecurring = new Set(); // normalised merchants dismissed as false-positive recurring payments
    this.usingSampleData = true;
    this.listeners = new Set();
    this._load();
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  _notify() {
    for (const fn of this.listeners) fn(this.getState());
  }

  getState() {
    return {
      transactions: this.transactions,
      sources: this.sources,
      usingSampleData: this.usingSampleData,
    };
  }

  _load() {
    let saved = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch (err) {
      console.warn("Could not read saved dashboard data:", err);
    }

    if (saved && Array.isArray(saved.transactions) && saved.transactions.length > 0) {
      this.transactions = saved.transactions.map((t) => ({
        ...t,
        categorySource: t.categorySource || (t.manual ? "manual" : "auto"),
      }));
      this.sources = saved.sources || [];
      this.categoryRules = new Map(saved.categoryRules || []);
      this.dismissedRecurring = new Set(saved.dismissedRecurring || []);
      this.usingSampleData = false;
    } else {
      this.categoryRules = new Map();
      this.dismissedRecurring = new Set();
      this.transactions = generateSampleTransactions().map((t) => this._toTransaction(t));
      this.sources = [];
      this.usingSampleData = true;
    }

    // Any manual edits made before category rules existed (or made on a
    // previous device import) become rules retroactively, and are then
    // applied to every other transaction from the same merchant.
    this._backfillRulesFromManualEdits();
  }

  _backfillRulesFromManualEdits() {
    let changed = false;

    for (const tx of this.transactions) {
      if (tx.categorySource !== "manual") continue;
      const key = normalizeMerchant(tx.description);
      if (this.categoryRules.get(key) !== tx.category) {
        this.categoryRules.set(key, tx.category);
        changed = true;
      }
    }

    if (this.categoryRules.size > 0) {
      for (const tx of this.transactions) {
        const key = normalizeMerchant(tx.description);
        const ruleCategory = this.categoryRules.get(key);
        if (ruleCategory !== undefined && tx.category !== ruleCategory) {
          tx.category = ruleCategory;
          tx.categorySource = "rule";
          changed = true;
        }
      }
    }

    if (changed) this._persist();
  }

  _persist() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          transactions: this.transactions,
          sources: this.sources,
          categoryRules: [...this.categoryRules.entries()],
          dismissedRecurring: [...this.dismissedRecurring],
        })
      );
    } catch (err) {
      console.warn("Could not save dashboard data:", err);
    }
  }

  _toTransaction(raw) {
    const autoCategory = autoCategorize(raw.description, raw.amount);
    const ruleCategory = this.categoryRules.get(normalizeMerchant(raw.description));
    const category = ruleCategory !== undefined ? ruleCategory : autoCategory;
    return {
      id: raw.id || `${raw.sourceFile}-${raw.rawId}-${crypto.randomUUID()}`,
      date: raw.date,
      description: raw.description,
      amount: raw.amount,
      category,
      autoCategory,
      categorySource: ruleCategory !== undefined ? "rule" : "auto",
      sourceFile: raw.sourceFile,
    };
  }

  /** Replace sample data with real uploaded transactions, or append to existing uploads. */
  addTransactions(rawTransactions, sourceName) {
    if (this.usingSampleData) {
      this.transactions = [];
      this.usingSampleData = false;
    }
    const withIds = rawTransactions.map((t) => this._toTransaction({ ...t, sourceFile: sourceName }));
    this.transactions = [...this.transactions, ...withIds];
    this.sources = [
      ...this.sources,
      { name: sourceName, count: withIds.length, addedAt: new Date().toISOString() },
    ];
    this._persist();
    this._notify();
    return withIds.length;
  }

  /**
   * Manually re-categorise one transaction, remember the merchant -> category
   * rule, and apply it to every other transaction from the same merchant
   * (now, and automatically on every future upload via _toTransaction).
   */
  setCategory(transactionId, categoryId) {
    const tx = this.transactions.find((t) => t.id === transactionId);
    if (!tx) return;

    const key = normalizeMerchant(tx.description);
    tx.category = categoryId;
    tx.categorySource = "manual";
    this.categoryRules.set(key, categoryId);

    for (const other of this.transactions) {
      if (other.id === tx.id || normalizeMerchant(other.description) !== key) continue;
      if (other.category !== categoryId) {
        other.category = categoryId;
        other.categorySource = "rule";
      }
    }

    this._persist();
    this._notify();
  }

  getCategoryRules() {
    return [...this.categoryRules.entries()]
      .map(([merchant, categoryId]) => ({
        merchant,
        categoryId,
        count: this.transactions.filter((t) => normalizeMerchant(t.description) === merchant).length,
      }))
      .sort((a, b) => a.merchant.localeCompare(b.merchant));
  }

  deleteCategoryRule(merchant) {
    this.categoryRules.delete(merchant);
    this._persist();
    this._notify();
  }

  dismissRecurring(merchant) {
    this.dismissedRecurring.add(merchant);
    this._persist();
    this._notify();
  }

  getDismissedRecurring() {
    return [...this.dismissedRecurring];
  }

  removeSource(sourceName) {
    this.transactions = this.transactions.filter((t) => t.sourceFile !== sourceName);
    this.sources = this.sources.filter((s) => s.name !== sourceName);
    if (this.transactions.length === 0) {
      this._load_sample_only();
    }
    this._persist();
    this._notify();
  }

  _load_sample_only() {
    this.categoryRules = new Map();
    this.dismissedRecurring = new Set();
    this.transactions = generateSampleTransactions().map((t) => this._toTransaction(t));
    this.sources = [];
    this.usingSampleData = true;
  }

  clearAll() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn("Could not clear saved dashboard data:", err);
    }
    this._load_sample_only();
    this._notify();
  }
}

export const store = new Store();
