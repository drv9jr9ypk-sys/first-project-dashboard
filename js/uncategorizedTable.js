import { ALL_CATEGORIES } from "./categories.js";

function formatMoney(value) {
  return value.toLocaleString("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function renderUncategorizedPanel(container, groups, { onAssign }) {
  container.innerHTML = "";

  if (groups.length === 0) {
    container.innerHTML = '<p class="chart-empty">Nothing uncategorised — every spend transaction has a theme.</p>';
    return;
  }

  const table = document.createElement("table");
  table.className = "tx-table uncategorized-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>Merchant</th>
      <th class="col-amount">Total spent</th>
      <th class="col-amount">Transactions</th>
      <th>Assign category</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (const group of groups) {
    const tr = document.createElement("tr");

    const merchantTd = document.createElement("td");
    merchantTd.textContent = group.displayName;
    merchantTd.title = group.sampleDescription;
    tr.appendChild(merchantTd);

    const totalTd = document.createElement("td");
    totalTd.className = "col-amount";
    totalTd.textContent = formatMoney(group.total);
    tr.appendChild(totalTd);

    const countTd = document.createElement("td");
    countTd.className = "col-amount";
    countTd.textContent = group.count.toLocaleString();
    tr.appendChild(countTd);

    const assignTd = document.createElement("td");
    const select = document.createElement("select");
    select.className = "category-select";
    select.setAttribute("aria-label", `Assign a category to ${group.displayName}`);
    for (const cat of ALL_CATEGORIES) {
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.label;
      if (cat.id === "other") opt.selected = true;
      select.appendChild(opt);
    }
    select.addEventListener("change", () => onAssign(group.sampleId, select.value));
    assignTd.appendChild(select);
    tr.appendChild(assignTd);

    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  container.appendChild(table);
}
