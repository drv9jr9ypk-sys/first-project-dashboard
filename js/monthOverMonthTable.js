import { categoryById } from "./categories.js";

const MONTH_YEAR_LABEL = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" });

function monthLabel(yyyyMM) {
  return MONTH_YEAR_LABEL.format(new Date(`${yyyyMM}-01T00:00:00`));
}

function formatMoney(value) {
  return value.toLocaleString("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatSignedMoney(value) {
  const abs = formatMoney(Math.abs(value));
  return value < 0 ? `-${abs}` : `+${abs}`;
}

export function renderMonthOverMonth(container, { currentMonth, previousMonth, rows }) {
  container.innerHTML = "";

  if (!currentMonth || rows.length === 0) {
    container.innerHTML = '<p class="chart-empty">Not enough history yet — need spending in at least one of the last two months.</p>';
    return;
  }

  const table = document.createElement("table");
  table.className = "tx-table mom-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>Category</th>
      <th class="col-amount">${monthLabel(previousMonth)}</th>
      <th class="col-amount">${monthLabel(currentMonth)}</th>
      <th class="col-amount">Change</th>
      <th class="col-amount">Change %</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (const row of rows) {
    const tr = document.createElement("tr");
    const category = categoryById(row.categoryId);
    const direction = row.change > 0 ? "increase" : row.change < 0 ? "decrease" : "flat";

    const categoryTd = document.createElement("td");
    const chip = document.createElement("span");
    chip.className = "recurring-category-chip";
    chip.style.setProperty("--chip-color", `var(--cat-${category.id})`);
    chip.textContent = category.label;
    categoryTd.appendChild(chip);
    tr.appendChild(categoryTd);

    const previousTd = document.createElement("td");
    previousTd.className = "col-amount";
    previousTd.textContent = formatMoney(row.previous);
    tr.appendChild(previousTd);

    const currentTd = document.createElement("td");
    currentTd.className = "col-amount";
    currentTd.textContent = formatMoney(row.current);
    tr.appendChild(currentTd);

    const changeTd = document.createElement("td");
    changeTd.className = `col-amount mom-${direction}`;
    changeTd.textContent = formatSignedMoney(row.change);
    tr.appendChild(changeTd);

    const percentTd = document.createElement("td");
    percentTd.className = `col-amount mom-${direction}`;
    percentTd.textContent = row.percentChange === null ? "New" : `${row.percentChange > 0 ? "+" : ""}${row.percentChange.toFixed(0)}%`;
    tr.appendChild(percentTd);

    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  container.appendChild(table);
}
