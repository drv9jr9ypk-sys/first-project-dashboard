// Client-side PDF text extraction + heuristic transaction parsing.
// Everything here runs in-browser via pdf.js; the file bytes are read with
// FileReader and never sent anywhere.
//
// Real statement layouts vary a lot, so this is a best-effort heuristic
// pipeline rather than a precise parser for any one bank:
//  - dates may be DD/MM/YYYY or MM/DD/YYYY - the whole document is scanned
//    once to infer which, since a single line is often ambiguous
//  - amounts may live in one signed "Amount" column, or be split across
//    "Paid In" / "Withdrawn" (or "Debit" / "Credit") columns - when a
//    matching table header is found, numbers are classified by which
//    column they sit under (x-position); otherwise we fall back to
//    reading the last one or two numbers on the line
//  - many statements wrap a transaction's description onto the line
//    before or omit the date on every row (printing it once per day) -
//    both are handled with simple carry-forward heuristics

const MONTHS =
  "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";

const SLASH_DATE_RE = /\b(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})\b/;
const ISO_DATE_RE = /\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/;
const MONTH_DAY_RE = new RegExp(`\\b(${MONTHS})\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s*(\\d{4})?\\b`, "i");
const DAY_MONTH_RE = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTHS})\\s*(\\d{4})?\\b`, "i");
const YEAR_RE = /\b(19|20)\d{2}\b/;

const EXCLUDE_LINE = [
  "beginning balance", "ending balance", "previous balance", "new balance",
  "total fees", "page ", "account number", "statement period", "account summary",
  "minimum payment", "available credit", "opening balance", "closing balance",
  "total payments", "total purchases", "credit limit", "statement date",
  "brought forward", "sub-total", "subtotal", "balance from previous statement",
  "summary of balances", "interest rate", "please do not write", "cardholder",
  "mastercard number", "transaction code", "sorting code", "total balance",
  "total outgoings", "total deposits", "cashback balance", "balance in pots",
];

// Lines that mark the end of the transaction table - once one of these is
// seen, stop treating subsequent lines as transactions (a trailing rates/fees
// summary shouldn't get swept in via date/description carry-forward) until a
// fresh table header is found.
const TABLE_END_LINE = [
  "new balance", "summary of balances", "closing balance", "ending balance",
  "debit interest details", "interest (variable)", "overdraft arrangements",
  "statement abbreviations", "important information about compensation",
  "making a complaint", "how to contact us", "ways to bank with",
];

// Header keywords used to (a) confirm we've reached the transaction table,
// so front-matter/summary numbers are never mistaken for transactions, and
// (b) record the x-position of Paid In / Withdrawn / Debit / Credit / Amount
// / Balance columns when a split-column ledger format is used.
const COLUMN_KEYWORDS = [
  { key: "paidIn", re: /^paid\b/i, direction: 1 },
  { key: "credit", re: /^credit\b(?!.*limit)/i, direction: 1 },
  { key: "deposit", re: /^deposit/i, direction: 1 },
  { key: "withdrawn", re: /^withdrawn\b/i, direction: -1 },
  { key: "debit", re: /^debit\b/i, direction: -1 },
  { key: "amount", re: /^amount\b/i, direction: 0 },
  { key: "balance", re: /^balance\b/i, direction: null },
];

const STANDALONE_AMOUNT_RE = /^\(?-?£?\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})\)?\s*-?$/;
const AMOUNT_RE = /\(?-?£?\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})\)?\s*(?:CR|DR|-(?!\d))?/gi;

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

/** Scan the whole document once to work out whether ambiguous d/m/y dates are day-first or month-first. */
function detectDateOrder(lines) {
  let dayFirstEvidence = false;
  let monthFirstEvidence = false;
  for (const line of lines) {
    const re = new RegExp(SLASH_DATE_RE, "g");
    let m;
    while ((m = re.exec(line))) {
      const a = +m[1];
      const b = +m[2];
      if (a > 12) dayFirstEvidence = true;
      if (b > 12) monthFirstEvidence = true;
    }
  }
  if (dayFirstEvidence && !monthFirstEvidence) return "DMY";
  if (monthFirstEvidence && !dayFirstEvidence) return "MDY";
  return "DMY"; // ambiguous: day-first is the more common convention worldwide
}

/** Look for a 4-digit year near the top of the document to use as a default for dates printed without one. */
function detectDefaultYear(lines) {
  for (const line of lines.slice(0, 60)) {
    const m = line.match(YEAR_RE);
    if (m) return +m[0];
  }
  return new Date().getFullYear();
}

// Two-date-per-line layouts (e.g. a credit card's "Trans Date"/"Post Date"
// columns) can make a later pattern match earlier in the string than the
// pattern that's actually correct for the leading date (e.g. "30 JUN 01 JUL"
// - a day-month match at index 0 vs. a month-day match at index 3). Collect
// every pattern's match and always take the leftmost one.
function findDate(text, { dateOrder, defaultYear }) {
  const candidates = [];

  let m = text.match(ISO_DATE_RE);
  if (m) {
    const iso = isoDate(+m[1], +m[2], +m[3]);
    if (iso) candidates.push({ iso, match: m[0], index: m.index });
  }

  m = text.match(SLASH_DATE_RE);
  if (m) {
    const a = +m[1];
    const b = +m[2];
    const year = normalizeYear(+m[3]);
    const iso = dateOrder === "MDY" ? isoDate(year, a, b) : isoDate(year, b, a);
    if (iso) candidates.push({ iso, match: m[0], index: m.index });
  }

  m = text.match(MONTH_DAY_RE);
  if (m) {
    const iso = isoDate(m[3] ? +m[3] : defaultYear, monthIndex(m[1]), +m[2]);
    if (iso) candidates.push({ iso, match: m[0], index: m.index });
  }

  m = text.match(DAY_MONTH_RE);
  if (m) {
    const iso = isoDate(m[3] ? +m[3] : defaultYear, monthIndex(m[2]), +m[1]);
    if (iso) candidates.push({ iso, match: m[0], index: m.index });
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.index - b.index);
  return candidates[0];
}

/** Strip a leading date token from text, if the text starts with one (allowing for a little leading punctuation). */
function stripLeadingDate(text, ctx) {
  const trimmed = text.trim();
  const found = findDate(trimmed, ctx);
  if (found && found.index <= 2) {
    return trimmed.slice(found.index + found.match.length).replace(/^[\s,.-]+/, "");
  }
  return text;
}

function isWeakDescription(text) {
  const t = text.trim();
  if (t.length < 3) return true;
  const letterCount = (t.match(/[a-zA-Z]/g) || []).length;
  if (letterCount < 4) return true;
  // A description that's mostly digits (a reference/tracking number) rather than
  // words isn't useful, even if it has a couple of letters mixed in.
  return letterCount / t.length < 0.4;
}

function cleanDescription(text) {
  return text
    .replace(/\s+/g, " ")
    .replace(/^[-–—\s,.]+/, "")
    .replace(/[-–—\s,.]+$/, "")
    .replace(/^\d{5,}\s+/, "") // a leading standalone reference/transaction number, not part of the merchant name
    .trim();
}

/** Parse a bare numeric token (no surrounding text) into a value + explicit sign, if any. */
function readAmountValue(token) {
  const numeric = token.replace(/[^\d.]/g, "");
  if (!numeric) return null;
  const value = parseFloat(numeric);
  return Number.isNaN(value) ? null : value;
}

function explicitSign(token) {
  if (/CR\s*$/i.test(token)) return 1;
  if (/DR\s*$/i.test(token)) return -1;
  if (/^\(/.test(token.trim())) return -1;
  if (/^-/.test(token.trim())) return -1;
  if (/\s-\s*$/.test(token) || /[^\d-]-\s*$/.test(token)) return 1; // trailing " -" - common credit-card "credit" marker
  return 0;
}

function groupItemsIntoLines(items) {
  const sorted = [...items].sort((a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4]);
  const lines = [];
  let current = null;
  const Y_TOLERANCE = 2.5;

  for (const item of sorted) {
    const y = item.transform[5];
    if (!current || Math.abs(current.y - y) > Y_TOLERANCE) {
      current = { y, items: [] };
      lines.push(current);
    }
    current.items.push({ text: item.str, x: item.transform[4] });
  }

  return lines;
}

function lineText(line) {
  return line.items
    .map((i) => i.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

// Whole-line text test to decide we've reached the transaction table - lenient,
// since some PDF generators merge a whole header row into one text run.
function isHeaderLine(text) {
  const lower = text.toLowerCase();
  const hasDate = /\bdate\b/.test(lower);
  const hasDescription = /\bdescription\b/.test(lower);
  const hasAmountish = /\bpaid\s*in\b|\bwithdrawn\b|\bdebit\b|\bcredit\b(?!.*limit)|\bamount\b|\bdeposit/.test(lower);
  return hasDate && hasDescription && hasAmountish;
}

// Per-item column x-positions - only meaningful when the PDF renders each
// header cell as its own text run. Returns null when nothing usable is found,
// in which case callers fall back to whole-line-text amount classification.
function extractColumns(line) {
  const columns = {};
  for (const item of line.items) {
    const text = item.text.trim();
    for (const { key, re, direction } of COLUMN_KEYWORDS) {
      if (re.test(text) && !(key in columns)) {
        columns[key] = { x: item.x, direction };
      }
    }
  }
  const usableKeys = Object.keys(columns).filter((k) => k !== "balance");
  return usableKeys.length === 0 ? null : columns;
}

/** Classify each standalone numeric item on a data line against known column x-positions. */
function classifyByColumns(line, columns) {
  const items = line.items;
  let best = null;

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    if (!STANDALONE_AMOUNT_RE.test(item.text.trim())) continue;

    let nearestKey = null;
    let nearestDist = Infinity;
    for (const [key, col] of Object.entries(columns)) {
      const dist = Math.abs(item.x - col.x);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestKey = key;
      }
    }
    if (!nearestKey) continue;
    const col = columns[nearestKey];
    if (col.direction === null) continue; // balance column - not the transaction amount
    const value = readAmountValue(item.text);
    if (value === null) continue;

    let sign = col.direction;
    if (col.direction === 0) {
      let signToken = item.text;
      const next = items[idx + 1];
      if (next && /^(-|CR|DR)$/i.test(next.text.trim())) signToken += ` ${next.text}`;
      sign = explicitSign(signToken) || -1;
    }
    best = { amount: sign * value, matchedText: item.text };
  }
  return best;
}

/** Fallback: scan the joined line text for amount-like substrings when no column layout is known. */
function classifyByText(remainderText) {
  const matches = [...remainderText.matchAll(AMOUNT_RE)].filter((m) => m[0].trim().length > 0);
  if (matches.length === 0) return null;
  const amountMatch = matches.length >= 2 ? matches[matches.length - 2] : matches[0];
  const value = readAmountValue(amountMatch[0]);
  if (value === null) return null;
  const sign = explicitSign(amountMatch[0]) || -1;
  return { amount: sign * value, matchIndex: amountMatch.index, matchLength: amountMatch[0].length };
}

function parseDataLine(line, ctx) {
  const text = lineText(line);
  if (text.length < 4) return { kind: "empty" };

  const lower = text.toLowerCase();
  if (TABLE_END_LINE.some((kw) => lower.includes(kw))) return { kind: "table-end" };
  if (EXCLUDE_LINE.some((kw) => lower.includes(kw))) return { kind: "noise" };

  const dateInfo = findDate(text, ctx);
  const dateStr = dateInfo ? dateInfo.iso : ctx.lastDate;
  if (!dateStr) return { kind: "text", text };

  let remainder = dateInfo ? text.slice(0, dateInfo.index) + " " + text.slice(dateInfo.index + dateInfo.match.length) : text;
  remainder = stripLeadingDate(remainder, ctx); // drop a second "post date" column, if present

  const columnResult = ctx.columns ? classifyByColumns(line, ctx.columns) : null;

  let amount;
  let description;
  if (columnResult) {
    amount = columnResult.amount;
    const idx = remainder.indexOf(columnResult.matchedText.trim());
    description = idx >= 0 ? remainder.slice(0, idx) : remainder.replace(columnResult.matchedText, "");
  } else {
    const textResult = classifyByText(remainder);
    if (!textResult) return { kind: "text", text };
    amount = textResult.amount;
    description = remainder.slice(0, textResult.matchIndex);
  }

  description = cleanDescription(description);
  if (isWeakDescription(description) && ctx.previousLineText) {
    const prevDescription = cleanDescription(stripLeadingDate(ctx.previousLineText, ctx));
    if (!isWeakDescription(prevDescription)) description = prevDescription;
  }
  if (isWeakDescription(description)) return { kind: "text", text };

  return { kind: "transaction", date: dateStr, description, amount };
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

  const pages = [];
  const allLineTexts = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const lines = groupItemsIntoLines(textContent.items);
    pages.push(lines);
    allLineTexts.push(...lines.map(lineText));
  }

  const baseCtx = {
    dateOrder: detectDateOrder(allLineTexts),
    defaultYear: detectDefaultYear(allLineTexts),
  };

  // Most statements print a recognisable "Date / Description / Amount" (or
  // Paid In / Withdrawn) header before the transaction table, which we use to
  // avoid mistaking front-matter numbers for transactions. Some simpler
  // layouts never print one, though - if requiring a header found nothing,
  // fall back to treating the whole document as the table.
  const withHeader = extractTransactions(pages, baseCtx, { requireHeader: true });
  return withHeader.length > 0 ? withHeader : extractTransactions(pages, baseCtx, { requireHeader: false });
}

function extractTransactions(pages, baseCtx, { requireHeader }) {
  const ctx = {
    ...baseCtx,
    columns: null,
    lastDate: null,
    previousLineText: "",
    insideTable: !requireHeader,
  };

  const transactions = [];
  for (const lines of pages) {
    for (const line of lines) {
      const text = lineText(line);
      if (isHeaderLine(text)) {
        const cols = extractColumns(line);
        if (cols) ctx.columns = cols;
        ctx.insideTable = true;
        ctx.previousLineText = "";
        continue;
      }

      if (!ctx.insideTable) {
        ctx.previousLineText = text;
        continue;
      }

      const result = parseDataLine(line, ctx);
      if (result.kind === "transaction") {
        transactions.push({ date: result.date, description: result.description, amount: result.amount });
        ctx.lastDate = result.date;
        ctx.previousLineText = text;
      } else if (result.kind === "text") {
        ctx.previousLineText = text;
      } else if (result.kind === "table-end") {
        ctx.insideTable = !requireHeader;
        ctx.columns = null;
        ctx.lastDate = null;
        ctx.previousLineText = "";
      } else if (result.kind === "empty" || result.kind === "noise") {
        // don't let a blank/noise line overwrite a usable pending description
      }
    }
  }

  return transactions;
}
