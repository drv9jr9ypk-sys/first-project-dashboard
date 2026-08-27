// Small dependency-free SVG chart renderers following the mark specs: thin
// bars/lines, rounded data-ends square at the baseline, hairline gridlines,
// direct end labels, and hover tooltips. Colors are read from CSS custom
// properties so light/dark switch automatically with the page theme.

const SVG_NS = "http://www.w3.org/2000/svg";

function el(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

function formatMoney(value) {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function niceMax(value) {
  if (value <= 0) return 100;
  const exp = Math.floor(Math.log10(value));
  const base = value / 10 ** exp;
  const niceBase = base <= 1 ? 1 : base <= 2 ? 2 : base <= 5 ? 5 : 10;
  return niceBase * 10 ** exp;
}

function ensureTooltip(container) {
  let tip = container.querySelector(".chart-tooltip");
  if (!tip) {
    tip = document.createElement("div");
    tip.className = "chart-tooltip";
    tip.setAttribute("role", "tooltip");
    container.appendChild(tip);
  }
  return tip;
}

function wireTooltip(target, container, tip, text) {
  const show = (evt) => {
    tip.textContent = text;
    tip.classList.add("visible");
    const rect = container.getBoundingClientRect();
    tip.style.left = `${evt.clientX - rect.left + 12}px`;
    tip.style.top = `${evt.clientY - rect.top - 8}px`;
  };
  target.addEventListener("mousemove", show);
  target.addEventListener("mouseenter", show);
  target.addEventListener("mouseleave", () => tip.classList.remove("visible"));
}

// Perceived luminance, for choosing white vs ink text on a colored fill.
function relativeLuminance(hex) {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Horizontal bar chart: one bar per category, sorted descending.
 * data: [{ id, label, total, color }]
 */
export function renderCategoryChart(container, data) {
  container.innerHTML = "";

  if (data.length === 0) {
    container.innerHTML = '<p class="chart-empty">No spending yet — upload a statement to see the breakdown.</p>';
    return;
  }

  const rowHeight = 36;
  const labelWidth = 132;
  const width = 600;
  const rightPad = 64;
  const height = data.length * rowHeight + 12;
  const trackWidth = width - labelWidth - rightPad;
  const maxVal = Math.max(...data.map((d) => d.total));

  const svg = el("svg", {
    viewBox: `0 0 ${width} ${height}`,
    class: "chart-svg category-chart",
    role: "img",
    "aria-label": "Spend by category",
  });

  const tip = ensureTooltip(container);

  data.forEach((d, i) => {
    const y = i * rowHeight + 6;
    const barH = 20;
    const barW = Math.max((d.total / maxVal) * trackWidth, 2);
    const x = labelWidth;
    const r = 4;

    const label = el("text", {
      x: 0,
      y: y + barH / 2 + 4,
      class: "chart-label-primary",
    });
    label.textContent = d.label;
    svg.appendChild(label);

    const barGroup = el("g", { class: "chart-hit" });
    const path = el("path", {
      d: `M ${x} ${y} H ${x + barW - r} A ${r} ${r} 0 0 1 ${x + barW} ${y + r} V ${y + barH - r} A ${r} ${r} 0 0 1 ${x + barW - r} ${y + barH} H ${x} Z`,
      fill: `var(--cat-${d.id})`,
    });
    barGroup.appendChild(path);

    const fitsOutside = trackWidth - barW > 46;
    const valueText = formatMoney(d.total);
    const value = el("text", {
      y: y + barH / 2 + 4,
      class: fitsOutside ? "chart-label-secondary" : "chart-label-on-fill",
    });
    if (fitsOutside) {
      value.setAttribute("x", x + barW + 8);
      value.setAttribute("text-anchor", "start");
    } else {
      value.setAttribute("x", x + barW - 8);
      value.setAttribute("text-anchor", "end");
      value.setAttribute("fill", relativeLuminance(d.color) > 0.55 ? "#0b0b0b" : "#ffffff");
    }
    value.textContent = valueText;

    svg.appendChild(barGroup);
    svg.appendChild(value);

    wireTooltip(barGroup, container, tip, `${d.label}: ${valueText}`);
  });

  container.appendChild(svg);
}

/**
 * Monthly trend line chart (single series: total spend per month).
 * data: [{ month: 'YYYY-MM', label: 'Aug 2026', total }] ascending by month.
 */
export function renderTrendChart(container, data) {
  container.innerHTML = "";

  if (data.length === 0) {
    container.innerHTML = '<p class="chart-empty">Nothing to trend yet — upload statements from more than one month.</p>';
    return;
  }

  const width = 600;
  const height = 220;
  const padL = 56;
  const padR = 20;
  const padT = 16;
  const padB = 28;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const maxVal = niceMax(Math.max(...data.map((d) => d.total)) * 1.15);
  const stepCount = 4;

  const xFor = (i) => padL + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const yFor = (v) => padT + plotH - (v / maxVal) * plotH;

  const svg = el("svg", {
    viewBox: `0 0 ${width} ${height}`,
    class: "chart-svg trend-chart",
    role: "img",
    "aria-label": "Monthly spend trend",
  });

  // Gridlines + y-axis labels
  for (let s = 0; s <= stepCount; s++) {
    const val = (maxVal / stepCount) * s;
    const y = yFor(val);
    svg.appendChild(el("line", { x1: padL, x2: width - padR, y1: y, y2: y, class: "chart-gridline" }));
    const label = el("text", { x: padL - 8, y: y + 3, class: "chart-axis-label", "text-anchor": "end" });
    label.textContent = val >= 1000 ? `$${Math.round(val / 1000)}k` : `$${Math.round(val)}`;
    svg.appendChild(label);
  }

  // Area fill
  const linePoints = data.map((d, i) => [xFor(i), yFor(d.total)]);
  const areaD =
    `M ${linePoints[0][0]} ${yFor(0)} ` +
    linePoints.map(([x, y]) => `L ${x} ${y}`).join(" ") +
    ` L ${linePoints[linePoints.length - 1][0]} ${yFor(0)} Z`;
  svg.appendChild(el("path", { d: areaD, class: "chart-area" }));

  // Line
  const lineD = linePoints.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
  svg.appendChild(el("path", { d: lineD, class: "chart-line" }));

  const tip = ensureTooltip(container);

  data.forEach((d, i) => {
    const [x, y] = linePoints[i];
    svg.appendChild(el("text", { x, y: height - 6, class: "chart-axis-label", "text-anchor": "middle" })).textContent =
      d.label;

    const ring = el("circle", { cx: x, cy: y, r: 7, class: "chart-marker-ring" });
    const marker = el("circle", { cx: x, cy: y, r: 5, class: "chart-marker" });
    const hit = el("circle", { cx: x, cy: y, r: 14, class: "chart-hit-invisible" });
    svg.appendChild(ring);
    svg.appendChild(marker);
    svg.appendChild(hit);
    wireTooltip(hit, container, tip, `${d.label}: ${formatMoney(d.total)}`);

    if (i === data.length - 1) {
      const endLabel = el("text", {
        x: x,
        y: y - 14,
        class: "chart-label-primary chart-end-label",
        "text-anchor": data.length === 1 ? "middle" : "end",
      });
      endLabel.textContent = formatMoney(d.total);
      svg.appendChild(endLabel);
    }
  });

  container.appendChild(svg);
}
