// Merchant name normalisation, used to match category rules against
// transaction descriptions regardless of trailing store numbers, dates,
// card-reference suffixes, and casing/whitespace differences.
// e.g. "TESCO STORES 2841", "Tesco Stores", and "TESCO" all normalise to
// the same "tesco" key.

const NOISE_SUFFIXES = new Set([
  "stores", "store", "superstore", "supermarket", "express", "metro",
  "local", "extra", "ltd", "plc", "inc", "incorporated", "limited",
  "corp", "corporation", "llc", "co", "company", "group",
  "uk", "gb", "gbr", "us", "usa", "ie", "irl", "eng",
]);

const REFERENCE_NUMBER_RE = /^#?\d{2,}[a-z]?$/i;
const SLASH_DATE_RE = /^\d{1,2}[/-]\d{1,2}([/-]\d{2,4})?$/;
const MONTH_DAY_RE = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\d{0,2}$/i;

function isNoiseToken(token) {
  const bare = token.replace(/[^a-z0-9]/gi, "");
  if (!bare) return true;
  if (REFERENCE_NUMBER_RE.test(token) || REFERENCE_NUMBER_RE.test(bare)) return true;
  if (SLASH_DATE_RE.test(token)) return true;
  if (MONTH_DAY_RE.test(bare)) return true;
  if (NOISE_SUFFIXES.has(bare.toLowerCase())) return true;
  return false;
}

/**
 * Strip trailing reference numbers, dates, card/branch suffixes, and
 * generic corporate suffix words from a transaction description, then
 * lowercase and collapse whitespace, to get a stable "merchant key".
 */
export function normalizeMerchant(description) {
  const tokens = (description || "").trim().split(/\s+/).filter(Boolean);

  while (tokens.length > 1 && isNoiseToken(tokens[tokens.length - 1])) {
    tokens.pop();
  }

  return tokens
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Title-cased version of a normalised merchant key, for display in the UI. */
export function displayMerchant(merchantKey) {
  return merchantKey.replace(/\b\w/g, (c) => c.toUpperCase());
}
