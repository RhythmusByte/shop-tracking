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

// Opening status: "on-time" | "late" | "not-logged" | "unset" (store has no expected time configured)
export function openingStatus(store, entry) {
  if (!store?.expectedOpeningTime) return "unset";
  if (!entry?.openingTime) return "not-logged";
  // Compare "HH:MM" strings lexicographically, which works correctly for 24hr zero-padded times.
  return entry.openingTime <= store.expectedOpeningTime ? "on-time" : "late";
}

export const OPENING_STATUS_LABEL = {
  "on-time": "On time",
  late: "Late",
  "not-logged": "Closed / not logged",
  unset: "No expected time set",
};

export const OPENING_STATUS_COLOR = {
  "on-time": "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  late: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "not-logged": "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  unset: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
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
