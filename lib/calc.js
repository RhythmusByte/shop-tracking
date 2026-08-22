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

// WhatsApp click-to-chat link. Strips non-digits; assumes India (+91) if the
// number looks like a 10-digit local number with no country code already.
export function whatsappLink(rawNumber) {
  if (!rawNumber) return null;
  const digits = rawNumber.replace(/\D/g, "");
  if (!digits) return null;
  const withCountryCode = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCountryCode}`;
}
