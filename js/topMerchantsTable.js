function formatMoney(value) {
  return value.toLocaleString("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function renderTopMerchants(container, merchants) {
  container.innerHTML = "";

  if (merchants.length === 0) {
    container.innerHTML = '<p class="chart-empty">No spending in this period yet.</p>';
    return;
  }

  const table = document.createElement("table");
  table.className = "tx-table top-merchants-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th class="col-rank">#</th>
      <th>Merchant</th>
      <th class="col-amount">Total spent</th>
      <th class="col-amount">Transactions</th>
      <th class="col-amount">Average</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  merchants.forEach((item, i) => {
    const tr = document.createElement("tr");

    const rankTd = document.createElement("td");
    rankTd.className = "col-rank";
    rankTd.textContent = i + 1;
    tr.appendChild(rankTd);

    const merchantTd = document.createElement("td");
    merchantTd.textContent = item.displayName;
    tr.appendChild(merchantTd);

    const totalTd = document.createElement("td");
    totalTd.className = "col-amount";
    totalTd.textContent = formatMoney(item.total);
    tr.appendChild(totalTd);

    const countTd = document.createElement("td");
    countTd.className = "col-amount";
    countTd.textContent = item.count.toLocaleString();
    tr.appendChild(countTd);

    const averageTd = document.createElement("td");
    averageTd.className = "col-amount";
    averageTd.textContent = formatMoney(item.average);
    tr.appendChild(averageTd);

    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  container.appendChild(table);
}
