// Spending category taxonomy, colors (validated categorical palette), and
// keyword-based auto-categorisation. Order matters: more specific keyword
// lists are checked before broader ones so e.g. "netflix" lands in
// Subscriptions rather than Entertainment.
//
// Matching is a case-insensitive substring search against the whole
// transaction description, so keywords match wherever they appear - e.g.
// "tesco" matches inside "CARD PAYMENT TO TESCO STORES 2841 GB" - and don't
// need to account for statement prefixes like "DD", "DIRECT DEBIT", "CARD
// PAYMENT TO", "BACS", or "FASTER PAYMENT" (those are handled separately for
// merchant-name grouping in merchant.js, but never interfere with keyword
// matching itself since it's a substring search regardless of what else is
// in the string).

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
      "morrisons", "waitrose", "marks & spencer", "m&s simply food",
      "m&s food", "co-op", "coop food", "iceland", "spar", "budgens",
      "farmfoods", "ocado", "nisa", "londis", "premier stores", "best-one",
      "food warehouse", "poundland", "b&m", "home bargains", "wilko",
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
      "greggs", "nando's", "nandos", "wagamama", "pret a manger", "pret",
      "costa coffee", "costa", "caffe nero", "cafe nero", "nero",
      "wetherspoon", "kfc", "just eat", "justeat", "deliveroo", "shake shack",
      "burger king", "subway", "pizza hut", "domino's", "dominos",
      "papa johns", "papa john's", "five guys", "itsu", "wasabi", "leon",
      "chopstix", "tgi friday", "harvester", "toby carvery", "pizza express",
      "bella italia", "byron", "honest burgers", "franco manca",
      "yo sushi", "yo!", "gourmet burger", "gbk", "vue cafe",
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
      "trainline", "national rail", "stagecoach", "national express",
      "tfl.gov", "tfl travel", "tfl ", "service station",
      "bolt", "addison lee", "megabus", "bp fuel", "esso", "texaco",
      "gulf ", "applegreen", "moto services", "welcome break", "ncp",
      "ringgo", "justpark", "apcoa", "easyjet", "ryanair", "british airways",
      "eurostar", "gatwick express", "chiltern railways", "greater anglia",
      "avanti west coast", "lner", "southeastern", "southwestern railway",
      "thameslink", "great western railway", "gwr", "merseyrail",
      "transport for london",
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
      "british gas", "octopus energy", "edf energy", "e.on", "eon next",
      "scottish power", "thames water", "yorkshire water", "severn trent",
      "council tax", "nfu mutual", "aviva", "admiral insurance",
      "direct line", "geico", "sky broadband", "sky tv", "virgin media",
      "ee ltd", "vodafone", "o2 ", "three mobile", "honest mobile",
      "giffgaff", "aa membership", "rac ", "personal loan", " mtg ",
      "bt broadband", "bt.com", "bt group",
      "ovo energy", "bulb energy", "shell energy", "utility warehouse",
      "united utilities", "anglian water", "southern water", "wessex water",
      "welsh water", "dwr cymru", "scottish water", "npower",
      "sky mobile", "voxi", "tesco mobile", "lebara", "talktalk", "plusnet",
      "tv licence", "tv licensing", "churchill insurance", "hastings direct",
      "lv= insurance", "saga insurance", "more than insurance", "axa insurance",
      "zurich insurance", "legal & general", "prudential",
      "bank charge", "overdraft fee", "unarranged overdraft",
      "unpaid item fee", "returned item fee", "monthly account fee",
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
      "adobe", "microsoft 365", "now tv", "paramount+", "prime video",
      "apple music", "discovery+", "britbox", "itvx", "dazn",
      "xbox game pass", "playstation plus", "nintendo online",
      "puregym", "the gym group", "virgin active", "david lloyd",
      "fitness first", "nuffield health", "energie fitness", "onlyfans",
    ],
  },
  {
    id: "shopping",
    label: "Shopping",
    color: "#008300",
    darkColor: "#008300",
    keywords: [
      "amazon", "amzn", "target", "best buy", "ebay", "etsy", "ikea", "macy's",
      "nordstrom", "old navy", "home depot", "lowe's", "tj maxx",
      "marshalls", "sephora", "online store", "shein", "wayfair",
      "moonpig", "iherb", "john lewis", "argos",
      "currys", "next retail", "next.co.uk", "primark", "h&m", "zara",
      "uniqlo", "dunelm", "b&q", "screwfix", "homebase", "wickes",
      "toolstation", "very.co.uk", "littlewoods", "asos", "boohoo",
      "missguided", "jd sports", "sports direct", "footlocker", "foot locker",
      "schuh", "apple store", "pc world", "waterstones", "wh smith",
      "smyths toys", "the works", "game digital", "not on the high street",
      "matalan", "tk maxx", "debenhams", "selfridges", "harrods",
      "the range", "dollar general", "dollar tree",
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
      "bowling", "museum", "amusement", "golf",
      "odeon", "cineworld", "vue cinema", "showcase cinema", "everyman",
      "picturehouse", "seetickets", "see tickets", "eventbrite",
      "hollywood bowl", "tenpin", "gravity active", "flip out", "laser quest",
      "national trust", "english heritage", "atg tickets", "leisure centre",
    ],
  },
  {
    id: "health",
    label: "Health",
    color: "#e34948",
    darkColor: "#e66767",
    keywords: [
      "pharmacy", "cvs", "walgreens", "doctor", "dental", "dentist",
      "boots", "superdrug", "denplan", "medexpress",
      "clinic", "hospital", "medical", "urgent care", "optometry",
      "physical therapy", "labcorp",
      "lloyds pharmacy", "well pharmacy", "specsavers", "vision express",
      "bupa", "vitality health", "nuffield hospital", "spire healthcare",
      "physio", "chiropractor",
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
