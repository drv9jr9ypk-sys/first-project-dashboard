import { store } from "./store.js";
import { parsePdfFile } from "./pdfParser.js";
import { ALL_CATEGORIES } from "./categories.js";
import { computeStats, computeCategoryTotals, computeMonthlyTotals } from "./summary.js";
import { renderCategoryChart, renderTrendChart } from "./charts.js";
import { renderTable } from "./table.js";

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

const categoryChartEl = document.getElementById("category-chart");
const trendChartEl = document.getElementById("trend-chart");

const searchInput = document.getElementById("search-input");
const categoryFilter = document.getElementById("category-filter");
const tableContainer = document.getElementById("table-container");

const money = (v) =>
  v.toLocaleString(undefined, { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });

let sortState = { key: "date", dir: "desc" };
let filters = { search: "", category: "all" };

function populateCategoryFilter() {
  categoryFilter.innerHTML = '<option value="all">All categories</option>';
  for (const cat of ALL_CATEGORIES) {
    const opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = cat.label;
    categoryFilter.appendChild(opt);
  }
}

function applyFilters(transactions) {
  const q = filters.search.trim().toLowerCase();
  return transactions.filter((tx) => {
    if (filters.category !== "all" && tx.category !== filters.category) return false;
    if (q && !tx.description.toLowerCase().includes(q)) return false;
    return true;
  });
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

  const stats = computeStats(transactions);
  statSpend.textContent = money(stats.spend);
  statIncome.textContent = money(stats.income);
  statNet.textContent = money(stats.net);
  statNet.classList.toggle("negative", stats.net < 0);
  statCount.textContent = stats.count.toLocaleString();

  renderCategoryChart(categoryChartEl, computeCategoryTotals(transactions));
  renderTrendChart(trendChartEl, computeMonthlyTotals(transactions));

  const filtered = applyFilters(transactions);
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

searchInput.addEventListener("input", () => {
  filters.search = searchInput.value;
  render(store.getState());
});
categoryFilter.addEventListener("change", () => {
  filters.category = categoryFilter.value;
  render(store.getState());
});

populateCategoryFilter();
store.subscribe(render);
render(store.getState());
