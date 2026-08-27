import { categoryById } from "./categories.js";

function formatDate(iso) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
}

function formatMoney(value) {
  return value.toLocaleString("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function renderRecurringPanel(container, recurring, { onDismiss }) {
  container.innerHTML = "";

  if (recurring.length === 0) {
    container.innerHTML =
      '<p class="chart-empty">No recurring payments detected yet — need at least 3 matching transactions from the same merchant at a regular cadence (monthly, every 4 weeks, quarterly, or annual) with a roughly consistent amount.</p>';
    return;
  }

  const table = document.createElement("table");
  table.className = "tx-table recurring-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>Merchant</th>
      <th>Category</th>
      <th class="col-amount">Typical amount</th>
      <th>Cadence</th>
      <th>Last seen</th>
      <th>Next expected</th>
      <th></th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (const item of recurring) {
    const tr = document.createElement("tr");
    const category = categoryById(item.categoryId);

    const merchantTd = document.createElement("td");
    merchantTd.textContent = item.displayName;
    tr.appendChild(merchantTd);

    const categoryTd = document.createElement("td");
    categoryTd.className = "col-category";
    const chip = document.createElement("span");
    chip.className = "recurring-category-chip";
    chip.style.setProperty("--chip-color", `var(--cat-${category.id})`);
    chip.textContent = category.label;
    categoryTd.appendChild(chip);
    tr.appendChild(categoryTd);

    const amountTd = document.createElement("td");
    amountTd.className = "col-amount amount-negative";
    amountTd.textContent = `-${formatMoney(item.typicalAmount)}`;
    tr.appendChild(amountTd);

    const cadenceTd = document.createElement("td");
    cadenceTd.textContent = item.cadenceLabel;
    tr.appendChild(cadenceTd);

    const lastSeenTd = document.createElement("td");
    lastSeenTd.className = "col-date";
    lastSeenTd.textContent = formatDate(item.lastSeenDate);
    tr.appendChild(lastSeenTd);

    const nextTd = document.createElement("td");
    nextTd.className = "col-date";
    nextTd.textContent = formatDate(item.nextExpectedDate);
    tr.appendChild(nextTd);

    const dismissTd = document.createElement("td");
    const dismissBtn = document.createElement("button");
    dismissBtn.type = "button";
    dismissBtn.className = "recurring-dismiss";
    dismissBtn.setAttribute("aria-label", `Dismiss ${item.displayName} as recurring`);
    dismissBtn.title = "Not actually recurring";
    dismissBtn.textContent = "×";
    dismissBtn.addEventListener("click", () => onDismiss(item.merchant));
    dismissTd.appendChild(dismissBtn);
    tr.appendChild(dismissTd);

    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  container.appendChild(table);
}
