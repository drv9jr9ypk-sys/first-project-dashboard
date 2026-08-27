import { store } from "./store.js";
import { parsePdfFile } from "./pdfParser.js";
import { ALL_CATEGORIES, categoryById } from "./categories.js";
import { displayMerchant } from "./merchant.js";
import {
  PERIODS,
  CHART_TYPES,
  SORT_ORDERS,
  filterByPeriod,
  computeStats,
  computeCategoryTotals,
  computeMonthlyTotals,
  arrangeCategoryData,
} from "./summary.js";
import { renderCategoryChart, renderRadialChart, renderTrendChart } from "./charts.js";
import { renderTable } from "./table.js";
import { detectRecurring, computeCommittedMonthlySpend } from "./recurring.js";
import { renderRecurringPanel } from "./recurringTable.js";
import { computeMonthOverMonth } from "./monthOverMonth.js";
import { renderMonthOverMonth } from "./monthOverMonthTable.js";

const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("file-input");
const browseBtn = document.getElementById("browse-btn");
const uploadStatus = document.getElementById("upload-status");
const sourceList = document.getElementById("source-list");
const clearBtn = document.getElementById("clear-btn");
const sampleBadge = document.getElementById("sample-badge");

const statSpend = document.getElementById("stat-spend");
const statIncome = document.getElementById("stat-income");
const statNet = document.getElementById("stat-net");
const statCount = document.getElementById("stat-count");

const periodTabsEl = document.getElementById("period-tabs");
const themeFilter = document.getElementById("theme-filter");
const categoryChartCard = document.getElementById("category-chart-card");
const categoryChartEl = document.getElementById("category-chart");
const chartTypeTabsEl = document.getElementById("chart-type-tabs");
const categorySortEl = document.getElementById("category-sort");
const groupSmallToggle = document.getElementById("group-small-toggle");
const trendHeading = document.getElementById("trend-heading");
const trendChartEl = document.getElementById("trend-chart");

const searchInput = document.getElementById("search-input");
const tableContainer = document.getElementById("table-container");

const recurringCommitted = document.getElementById("recurring-committed");
const recurringContainer = document.getElementById("recurring-container");
const momContainer = document.getElementById("mom-container");

const rulesToggle = document.getElementById("rules-toggle");
const rulesCount = document.getElementById("rules-count");
const rulesPanel = document.getElementById("rules-panel");
const rulesEmpty = document.getElementById("rules-empty");
const rulesList = document.getElementById("rules-list");

const money = (v) =>
  v.toLocaleString("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2, maximumFractionDigits: 2 });

let sortState = { key: "date", dir: "desc" };
let filters = { search: "", category: "all", period: "all", chartType: "bar", categorySort: "value-desc", groupSmall: false };
let rulesOpen = false;

function populateThemeFilter() {
  themeFilter.innerHTML = '<option value="all">All themes</option>';
  for (const cat of ALL_CATEGORIES) {
    const opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = cat.label;
    themeFilter.appendChild(opt);
  }
}

function renderPeriodTabs() {
  periodTabsEl.innerHTML = "";
  for (const period of PERIODS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `segmented-tab${filters.period === period.id ? " active" : ""}`;
    btn.textContent = period.label;
    btn.title = period.title;
    btn.addEventListener("click", () => {
      if (filters.period === period.id) return;
      filters.period = period.id;
      render(store.getState());
    });
    periodTabsEl.appendChild(btn);
  }
}

function renderChartTypeTabs() {
  chartTypeTabsEl.innerHTML = "";
  for (const type of CHART_TYPES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `segmented-tab${filters.chartType === type.id ? " active" : ""}`;
    btn.textContent = type.label;
    btn.addEventListener("click", () => {
      if (filters.chartType === type.id) return;
      filters.chartType = type.id;
      render(store.getState());
    });
    chartTypeTabsEl.appendChild(btn);
  }
}

function populateSortOptions() {
  categorySortEl.innerHTML = "";
  for (const order of SORT_ORDERS) {
    const opt = document.createElement("option");
    opt.value = order.id;
    opt.textContent = order.label;
    categorySortEl.appendChild(opt);
  }
}

function renderRulesPanel() {
  const rules = store.getCategoryRules();

  rulesCount.hidden = rules.length === 0;
  rulesCount.textContent = rules.length;
  rulesToggle.setAttribute("aria-expanded", String(rulesOpen));
  rulesPanel.hidden = !rulesOpen;
  if (!rulesOpen) return;

  rulesEmpty.hidden = rules.length > 0;
  rulesList.innerHTML = "";
  for (const rule of rules) {
    const li = document.createElement("li");

    const merchant = document.createElement("span");
    merchant.className = "rule-merchant";
    merchant.textContent = displayMerchant(rule.merchant);

    const arrow = document.createElement("span");
    arrow.className = "rule-arrow";
    arrow.textContent = "→";

    const category = document.createElement("span");
    category.className = "rule-category";
    category.textContent = categoryById(rule.categoryId).label;

    const count = document.createElement("span");
    count.className = "rule-count";
    count.textContent = `${rule.count} transaction${rule.count === 1 ? "" : "s"}`;

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "rule-delete";
    deleteBtn.setAttribute("aria-label", `Delete rule for ${displayMerchant(rule.merchant)}`);
    deleteBtn.textContent = "×";
    deleteBtn.addEventListener("click", () => store.deleteCategoryRule(rule.merchant));

    li.appendChild(merchant);
    li.appendChild(arrow);
    li.appendChild(category);
    li.appendChild(count);
    li.appendChild(deleteBtn);
    rulesList.appendChild(li);
  }
}

function renderRecurring(transactions) {
  const recurring = detectRecurring(transactions, store.getDismissedRecurring());
  recurringCommitted.textContent = money(computeCommittedMonthlySpend(recurring));
  renderRecurringPanel(recurringContainer, recurring, {
    onDismiss: (merchant) => store.dismissRecurring(merchant),
  });
}

function renderMonthOverMonthSection(transactions) {
  renderMonthOverMonth(momContainer, computeMonthOverMonth(transactions));
}

function applySearch(transactions) {
  const q = filters.search.trim().toLowerCase();
  if (!q) return transactions;
  return transactions.filter((tx) => tx.description.toLowerCase().includes(q));
}

function render(state) {
  const { transactions, sources, usingSampleData } = state;

  sampleBadge.hidden = !usingSampleData;

  sourceList.innerHTML = "";
  for (const source of sources) {
    const li = document.createElement("li");
    li.innerHTML = `<span>${escapeHtml(source.name)} <span class="source-count">(${source.count} transactions)</span></span>`;
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-source";
    removeBtn.setAttribute("aria-label", `Remove ${source.name}`);
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => store.removeSource(source.name));
    li.appendChild(removeBtn);
    sourceList.appendChild(li);
  }

  renderPeriodTabs();
  renderChartTypeTabs();
  renderRulesPanel();
  renderRecurring(transactions);
  renderMonthOverMonthSection(transactions);
  if (themeFilter.value !== filters.category) themeFilter.value = filters.category;
  if (categorySortEl.value !== filters.categorySort) categorySortEl.value = filters.categorySort;
  if (groupSmallToggle.checked !== filters.groupSmall) groupSmallToggle.checked = filters.groupSmall;

  const periodScoped = filterByPeriod(transactions, filters.period);
  const themeScoped =
    filters.category === "all" ? periodScoped : periodScoped.filter((tx) => tx.category === filters.category);

  const stats = computeStats(themeScoped);
  statSpend.textContent = money(stats.spend);
  statIncome.textContent = money(stats.income);
  statNet.textContent = money(stats.net);
  statNet.classList.toggle("negative", stats.net < 0);
  statCount.textContent = stats.count.toLocaleString();

  const themeSelected = filters.category !== "all";
  categoryChartCard.hidden = themeSelected;
  if (!themeSelected) {
    const arranged = arrangeCategoryData(computeCategoryTotals(themeScoped), {
      sort: filters.categorySort,
      groupSmall: filters.groupSmall,
    });
    if (filters.chartType === "bar") renderCategoryChart(categoryChartEl, arranged);
    else renderRadialChart(categoryChartEl, arranged, { variant: filters.chartType });
  }

  trendHeading.textContent = themeSelected ? `${categoryById(filters.category).label} monthly trend` : "Monthly spend trend";
  renderTrendChart(trendChartEl, computeMonthlyTotals(themeScoped, filters.category));

  const filtered = applySearch(themeScoped);
  renderTable(tableContainer, filtered, {
    sortState,
    onSortChange: (key) => {
      sortState = key === sortState.key ? { key, dir: sortState.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" };
      render(store.getState());
    },
    onCategoryChange: (id, categoryId) => store.setCategory(id, categoryId),
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function setStatus(message, kind = "info") {
  uploadStatus.textContent = message;
  uploadStatus.className = `upload-status ${kind}`;
  uploadStatus.hidden = !message;
}

async function handleFiles(fileList) {
  const files = [...fileList].filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
  if (files.length === 0) {
    setStatus("Please drop a PDF bank or credit card statement.", "error");
    return;
  }

  for (const file of files) {
    setStatus(`Reading ${file.name}…`, "info");
    try {
      const rows = await parsePdfFile(file);
      if (rows.length === 0) {
        setStatus(
          `Couldn't find any transactions in ${file.name}. It may be a scanned image without selectable text, or an unrecognised layout.`,
          "error"
        );
        continue;
      }
      const count = store.addTransactions(rows, file.name);
      setStatus(`Added ${count} transaction${count === 1 ? "" : "s"} from ${file.name}.`, "success");
    } catch (err) {
      console.error(err);
      setStatus(`Something went wrong reading ${file.name}: ${err.message}`, "error");
    }
  }
}

dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.classList.add("dragover");
});
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("dragover");
  handleFiles(e.dataTransfer.files);
});

browseBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  if (fileInput.files.length) handleFiles(fileInput.files);
  fileInput.value = "";
});

clearBtn.addEventListener("click", () => {
  if (window.confirm("Clear all uploaded statements and return to sample data? This can't be undone.")) {
    store.clearAll();
    setStatus("", "info");
  }
});

rulesToggle.addEventListener("click", () => {
  rulesOpen = !rulesOpen;
  renderRulesPanel();
});

searchInput.addEventListener("input", () => {
  filters.search = searchInput.value;
  render(store.getState());
});
themeFilter.addEventListener("change", () => {
  filters.category = themeFilter.value;
  render(store.getState());
});
categorySortEl.addEventListener("change", () => {
  filters.categorySort = categorySortEl.value;
  render(store.getState());
});
groupSmallToggle.addEventListener("change", () => {
  filters.groupSmall = groupSmallToggle.checked;
  render(store.getState());
});

populateThemeFilter();
populateSortOptions();
store.subscribe(render);
render(store.getState());
