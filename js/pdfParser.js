// Client-side PDF text extraction + heuristic transaction parsing.
// Everything here runs in-browser via pdf.js; the file bytes are read with
// FileReader and never sent anywhere.

const MONTHS =
  "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";

const DATE_PATTERNS = [
  // 2026-08-27 / 2026/08/27
  { re: /\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/, parse: (m) => isoDate(+m[1], +m[2], +m[3]) },
  // 08/27/2026 or 08/27/26 or 8-27-2026 (US month/day/year)
  {
    re: /\b(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})\b/,
    parse: (m) => isoDate(normalizeYear(+m[3]), +m[1], +m[2]),
  },
  // Aug 27, 2026 / August 27 2026
  {
    re: new RegExp(`\\b(${MONTHS})\\s+(\\d{1,2}),?\\s*(\\d{4})?\\b`, "i"),
    parse: (m) => isoDate(m[3] ? +m[3] : new Date().getFullYear(), monthIndex(m[1]), +m[2]),
  },
  // 27 Aug 2026 / 27 August
  {
    re: new RegExp(`\\b(\\d{1,2})\\s+(${MONTHS})\\s*(\\d{4})?\\b`, "i"),
    parse: (m) => isoDate(m[3] ? +m[3] : new Date().getFullYear(), monthIndex(m[2]), +m[1]),
  },
];

const AMOUNT_RE = /\(?-?\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})\)?\s*(?:CR|DR)?/gi;

const EXCLUDE_LINE = [
  "beginning balance", "ending balance", "previous balance", "new balance",
  "total fees", "page ", "account number", "statement period", "account summary",
  "minimum payment due", "available credit", "opening balance", "closing balance",
  "total payments", "total purchases", "credit limit", "statement date",
];

function isoDate(year, month, day) {
  if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const y = String(year).padStart(4, "0");
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function normalizeYear(y) {
  if (y >= 100) return y;
  return y >= 70 ? 1900 + y : 2000 + y;
}

function monthIndex(name) {
  const key = name.slice(0, 3).toLowerCase();
  const idx = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(key);
  return idx + 1;
}

function findDate(line) {
  for (const { re, parse } of DATE_PATTERNS) {
    const m = line.match(re);
    if (m) {
      const iso = parse(m);
      if (iso) return { iso, match: m[0], index: m.index };
    }
  }
  return null;
}

function parseAmountToken(token) {
  const negative = /^\(|-|DR\s*$/i.test(token) && !/CR\s*$/i.test(token);
  const positive = /CR\s*$/i.test(token);
  const numeric = token.replace(/[^\d.]/g, "");
  if (!numeric) return null;
  let value = parseFloat(numeric);
  if (Number.isNaN(value)) return null;
  if (positive) return value;
  if (negative) return -value;
  return -value; // default: an unsigned amount on a statement line is spend
}

function parseLine(rawLine) {
  const line = rawLine.replace(/\s+/g, " ").trim();
  if (line.length < 6) return null;

  const lower = line.toLowerCase();
  if (EXCLUDE_LINE.some((kw) => lower.includes(kw))) return null;

  const dateInfo = findDate(line);
  if (!dateInfo) return null;

  const remainder = (line.slice(0, dateInfo.index) + " " + line.slice(dateInfo.index + dateInfo.match.length)).trim();

  const amountMatches = [...remainder.matchAll(AMOUNT_RE)].filter((m) => m[0].trim().length > 0);
  if (amountMatches.length === 0) return null;

  const amountMatch = amountMatches.length >= 2 ? amountMatches[amountMatches.length - 2] : amountMatches[0];
  const amount = parseAmountToken(amountMatch[0]);
  if (amount === null) return null;

  let description = remainder;
  const cutFrom = amountMatches[amountMatches.length >= 2 ? amountMatches.length - 2 : 0].index;
  description = remainder.slice(0, cutFrom);
  description = description.replace(/[-–—\s]+$/, "").replace(/^[-–—\s]+/, "").trim();
  if (!description || /^\d+$/.test(description)) return null;

  return { date: dateInfo.iso, description, amount };
}

function groupItemsIntoLines(items) {
  const sorted = [...items].sort((a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4]);
  const lines = [];
  let current = null;
  const Y_TOLERANCE = 2.5;

  for (const item of sorted) {
    const y = item.transform[5];
    if (!current || Math.abs(current.y - y) > Y_TOLERANCE) {
      current = { y, parts: [] };
      lines.push(current);
    }
    current.parts.push(item.str);
  }

  return lines.map((l) => l.parts.join(" "));
}

/**
 * Parse a File (PDF) into an array of { date, description, amount }.
 * Requires window.pdfjsLib to already be loaded (see index.html).
 */
export async function parsePdfFile(file) {
  if (!window.pdfjsLib) {
    throw new Error("PDF engine failed to load. Check your connection and reload the page.");
  }

  const buffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;

  const transactions = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const lines = groupItemsIntoLines(textContent.items);
    for (const line of lines) {
      const parsed = parseLine(line);
      if (parsed) transactions.push(parsed);
    }
  }

  return transactions;
}
