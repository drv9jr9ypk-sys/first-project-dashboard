import { autoCategorize } from "./categories.js";
import { generateSampleTransactions } from "./sampleData.js";

const STORAGE_KEY = "finance-dashboard-v1";

/**
 * Everything lives in memory + localStorage on this device. Nothing here
 * ever performs a network request - that is the whole point of the app.
 */
class Store {
  constructor() {
    this.transactions = [];
    this.sources = []; // { name, count, addedAt }
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
      this.transactions = saved.transactions;
      this.sources = saved.sources || [];
      this.usingSampleData = false;
    } else {
      this.transactions = generateSampleTransactions().map((t) => this._toTransaction(t));
      this.sources = [];
      this.usingSampleData = true;
    }
  }

  _persist() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ transactions: this.transactions, sources: this.sources })
      );
    } catch (err) {
      console.warn("Could not save dashboard data:", err);
    }
  }

  _toTransaction(raw) {
    const category = autoCategorize(raw.description, raw.amount);
    return {
      id: raw.id || `${raw.sourceFile}-${raw.rawId}-${crypto.randomUUID()}`,
      date: raw.date,
      description: raw.description,
      amount: raw.amount,
      category,
      autoCategory: category,
      manual: false,
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

  setCategory(transactionId, categoryId) {
    const tx = this.transactions.find((t) => t.id === transactionId);
    if (!tx) return;
    tx.category = categoryId;
    tx.manual = categoryId !== tx.autoCategory;
    this._persist();
    this._notify();
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
