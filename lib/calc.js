// Total sale amount: sum of the four payment-method amounts.
// onlineSalesCount / offlineSalesCount are ORDER COUNTS, not money, so they're
// deliberately excluded from this sum.
export function totalSales(entry) {
  if (!entry) return 0;
  return (
    (entry.cashSales || 0) +
    (entry.upiSales || 0) +
    (entry.cardSales || 0) +
    (entry.creditSales || 0)
  );
}

export function totalOrderCount(entry) {
  if (!entry) return 0;
  return (entry.onlineSalesCount || 0) + (entry.offlineSalesCount || 0);
}

// Formats a number as currency with exactly two decimal places and
// thousands separators, e.g. formatMoney(1234.5) -> "₹1,234.50".
export function formatMoney(amount) {
  const n = Number(amount) || 0;
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Opening status: "on-time" | "late" | "closed" | "not-logged" | "unset"
// - "closed": explicitly marked closed for the day (storeClosedToday).
// - "not-logged": nothing recorded yet, distinct from a deliberate closure,
//   this is the one that should trigger the "not opened yet" notification.
// - "unset": store has no expected opening time configured, so lateness
//   can't be evaluated at all.
export function openingStatus(store, entry) {
  if (entry?.storeClosedToday) return "closed";
  if (!store?.expectedOpeningTime) return "unset";
  if (!entry?.openingTime) return "not-logged";
  // Compare "HH:MM" strings lexicographically, which works correctly for 24hr zero-padded times.
  return entry.openingTime <= store.expectedOpeningTime ? "on-time" : "late";
}

export const OPENING_STATUS_LABEL = {
  "on-time": "On time",
  late: "Late",
  closed: "Closed",
  "not-logged": "Not logged",
  unset: "No expected time set",
};

export const OPENING_STATUS_COLOR = {
  "on-time": "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800",
  late: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  closed: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600",
  "not-logged": "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800",
  unset: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
};

export const OPENING_STATUS_DOT = {
  "on-time": "bg-green-500",
  late: "bg-amber-500",
  closed: "bg-slate-400",
  "not-logged": "bg-red-500",
  unset: "bg-slate-400",
};

// Categorize an expense for the PNL breakdown. Salary is a real field
// (category === "salary", set explicitly when logging the expense).
// Petrol/Food/Profit/Rent are inferred from the free-text description via
// exact keyword matching only (case-insensitive substring match, no
// synonyms). Anything that doesn't match falls into "general".
export function categorizeExpense(expense) {
  if (!expense) return "general";
  if (expense.category === "salary") return "salary";
  const desc = (expense.description || "").toLowerCase();
  if (desc.includes("petrol")) return "petrol";
  if (desc.includes("food")) return "food";
  if (desc.includes("profit")) return "profit";
  if (desc.includes("rent")) return "rent";
  return "general";
}

export const EXPENSE_CATEGORY_LABEL = {
  salary: "Salary",
  petrol: "Petrol Allowance",
  food: "Food Expense",
  profit: "Profit Advance",
  rent: "Rent",
  general: "General",
};

export const EXPENSE_CATEGORY_COLOR = {
  salary: "#8b5cf6",
  petrol: "#f59e0b",
  food: "#22c55e",
  profit: "#ec4899",
  rent: "#0ea5e9",
  general: "#64748b",
};

// WhatsApp click-to-chat link, strict validation.
// Only builds a link for a genuine 10-digit Indian mobile number (starts
// with 6-9), optionally given with a leading 0, +91, or 91. Anything else
// (landlines, wrong length, non-Indian numbers) returns null so the UI can
// simply not render the button rather than link somewhere wrong.
export function whatsappLink(rawNumber) {
  if (!rawNumber) return null;
  let digits = rawNumber.replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  const isValidIndianMobile = /^[6-9]\d{9}$/.test(digits);
  if (!isValidIndianMobile) return null;

  return `https://wa.me/91${digits}`;
}

// Telecalling campaign stats from an AdCampaign entry.
export function telecallingStats(campaign) {
  if (!campaign) return null;
  const received = campaign.contactsReceived || 0;
  const accepted = campaign.contactsAccepted || 0;
  const leftToCall = campaign.contactsLeftToCall || 0;
  const converted = campaign.contactsConverted || 0;
  return {
    received,
    accepted,
    leftToCall,
    converted,
    receivedVsLeftPct: received > 0 ? Math.round(((received - leftToCall) / received) * 100) : 0,
    acceptedVsConvertedPct: accepted > 0 ? Math.round((converted / accepted) * 100) : 0,
  };
}
