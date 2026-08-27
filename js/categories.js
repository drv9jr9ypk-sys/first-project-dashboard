// Spending category taxonomy, colors (validated categorical palette), and
// keyword-based auto-categorisation. Order matters: more specific keyword
// lists are checked before broader ones so e.g. "netflix" lands in
// Subscriptions rather than Entertainment.

export const CATEGORIES = [
  {
    id: "groceries",
    label: "Groceries",
    color: "#2a78d6",
    darkColor: "#3987e5",
    keywords: [
      "walmart", "wal-mart", "kroger", "safeway", "whole foods", "wholefds",
      "trader joe", "aldi", "publix", "costco", "grocery", "groceries",
      "supermarket", "tesco", "sainsbury", "asda", "lidl", "food lion",
      "harris teeter", "wegmans", "sprouts", "market basket",
    ],
  },
  {
    id: "eating-out",
    label: "Eating Out",
    color: "#eb6834",
    darkColor: "#d95926",
    keywords: [
      "starbucks", "mcdonald", "chipotle", "restaurant", "cafe", "coffee",
      "doordash", "uber eats", "ubereats", "grubhub", "postmates", "pizza",
      "grill", "diner", "deli", "bakery", "taco", "sushi", "burger",
      "wendy's", "chick-fil-a", "dunkin", "panera", "bar & grill",
    ],
  },
  {
    id: "transport",
    label: "Transport",
    color: "#1baf7a",
    darkColor: "#199e70",
    keywords: [
      "uber", "lyft", "shell", "chevron", "exxon", "bp gas", "gas station",
      "parking", "transit", "metro", "mta", "amtrak", "delta air",
      "united air", "southwest air", "airline", "toll", "car rental",
      "hertz", "avis", "enterprise rent",
    ],
  },
  {
    id: "bills-utilities",
    label: "Bills & Utilities",
    color: "#eda100",
    darkColor: "#c98500",
    keywords: [
      "electric", "water bill", "utility", "utilities", "comcast",
      "xfinity", "at&t", "att bill", "verizon", "t-mobile", "internet",
      "insurance", "mortgage", "rent payment", "gas bill", "power co",
      "water & sewer", "waste management",
    ],
  },
  {
    id: "subscriptions",
    label: "Subscriptions",
    color: "#e87ba4",
    darkColor: "#d55181",
    keywords: [
      "netflix", "spotify", "hulu", "disney+", "disney plus", "amazon prime",
      "apple.com/bill", "icloud", "subscription", "youtube premium",
      "hbo max", "audible", "planet fitness", "gym membership", "patreon",
      "adobe", "microsoft 365",
    ],
  },
  {
    id: "shopping",
    label: "Shopping",
    color: "#008300",
    darkColor: "#008300",
    keywords: [
      "amazon", "target", "best buy", "ebay", "etsy", "ikea", "macy's",
      "nordstrom", "old navy", "home depot", "lowe's", "tj maxx",
      "marshalls", "sephora", "online store", "shein", "wayfair",
    ],
  },
  {
    id: "entertainment",
    label: "Entertainment",
    color: "#4a3aa7",
    darkColor: "#9085e9",
    keywords: [
      "movie", "cinema", "amc", "theatre", "theater", "concert",
      "ticketmaster", "steam", "playstation", "xbox", "nintendo",
      "bowling", "museum", "amusement",
    ],
  },
  {
    id: "health",
    label: "Health",
    color: "#e34948",
    darkColor: "#e66767",
    keywords: [
      "pharmacy", "cvs", "walgreens", "doctor", "dental", "dentist",
      "clinic", "hospital", "medical", "urgent care", "optometry",
      "physical therapy", "labcorp",
    ],
  },
];

export const INCOME_CATEGORY = {
  id: "income",
  label: "Income",
  color: "#0ca30c",
  darkColor: "#0ca30c",
};

export const OTHER_CATEGORY = {
  id: "other",
  label: "Other",
  color: "#898781",
  darkColor: "#898781",
};

export const ALL_CATEGORIES = [...CATEGORIES, INCOME_CATEGORY, OTHER_CATEGORY];

const INCOME_KEYWORDS = [
  "payroll", "salary", "direct deposit", "employer", "refund", "interest pmt",
  "interest payment", "dividend", "paycheck", "reimbursement", "cashback redemption",
];

export function categoryById(id) {
  return ALL_CATEGORIES.find((c) => c.id === id) || OTHER_CATEGORY;
}

/**
 * Guess a category id from a transaction description and signed amount
 * (negative = money out, positive = money in).
 */
export function autoCategorize(description, amount) {
  const desc = (description || "").toLowerCase();

  if (amount > 0 && INCOME_KEYWORDS.some((k) => desc.includes(k))) {
    return INCOME_CATEGORY.id;
  }

  for (const category of CATEGORIES) {
    if (category.keywords.some((k) => desc.includes(k))) {
      return category.id;
    }
  }

  if (amount > 0) return INCOME_CATEGORY.id;
  return OTHER_CATEGORY.id;
}
