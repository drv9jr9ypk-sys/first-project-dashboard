import { ALL_CATEGORIES, categoryById } from "./categories.js";

const COLUMNS = [
  { key: "date", label: "Date" },
  { key: "description", label: "Description" },
  { key: "category", label: "Category" },
  { key: "amount", label: "Amount" },
];

function formatDate(iso) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatAmount(amount) {
  const abs = Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return amount < 0 ? `-$${abs}` : `+$${abs}`;
}

export function sortTransactions(transactions, sortState) {
  const { key, dir } = sortState;
  const sign = dir === "asc" ? 1 : -1;
  return [...transactions].sort((a, b) => {
    if (key === "amount") return (a.amount - b.amount) * sign;
    if (key === "category") return categoryById(a.category).label.localeCompare(categoryById(b.category).label) * sign;
    if (key === "date") return a.date.localeCompare(b.date) * sign;
    return a.description.localeCompare(b.description) * sign;
  });
}

export function renderTable(container, transactions, { sortState, onSortChange, onCategoryChange }) {
  container.innerHTML = "";

  if (transactions.length === 0) {
    container.innerHTML = '<p class="chart-empty">No transactions match the current filter.</p>';
    return;
  }

  const table = document.createElement("table");
  table.className = "tx-table";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const col of COLUMNS) {
    const th = document.createElement("th");
    th.className = col.key === "amount" ? "col-amount" : "";
    const active = sortState.key === col.key;
    th.innerHTML = `<button type="button" class="sort-btn${active ? " active" : ""}" data-key="${col.key}">
      ${col.label}<span class="sort-arrow">${active ? (sortState.dir === "asc" ? "↑" : "↓") : ""}</span>
    </button>`;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (const tx of sortTransactions(transactions, sortState)) {
    const tr = document.createElement("tr");

    const dateTd = document.createElement("td");
    dateTd.className = "col-date";
    dateTd.textContent = formatDate(tx.date);
    tr.appendChild(dateTd);

    const descTd = document.createElement("td");
    descTd.className = "col-description";
    descTd.textContent = tx.description;
    if (tx.manual) {
      const badge = document.createElement("span");
      badge.className = "manual-badge";
      badge.title = "Manually re-categorised";
      badge.textContent = "edited";
      descTd.appendChild(badge);
    }
    tr.appendChild(descTd);

    const catTd = document.createElement("td");
    catTd.className = "col-category";
    const select = document.createElement("select");
    select.className = "category-select";
    select.style.setProperty("--select-color", `var(--cat-${tx.category})`);
    for (const cat of ALL_CATEGORIES) {
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.label;
      if (cat.id === tx.category) opt.selected = true;
      select.appendChild(opt);
    }
    select.addEventListener("change", () => onCategoryChange(tx.id, select.value));
    catTd.appendChild(select);
    tr.appendChild(catTd);

    const amountTd = document.createElement("td");
    amountTd.className = `col-amount ${tx.amount < 0 ? "amount-negative" : "amount-positive"}`;
    amountTd.textContent = formatAmount(tx.amount);
    tr.appendChild(amountTd);

    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  container.appendChild(table);

  table.querySelectorAll(".sort-btn").forEach((btn) => {
    btn.addEventListener("click", () => onSortChange(btn.dataset.key));
  });
}
