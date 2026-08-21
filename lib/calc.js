// Total sales for an entry: sum of all payment-method breakdowns plus online.
export function totalSales(entry) {
  if (!entry) return 0;
  return (
    (entry.onlineSales || 0) +
    (entry.cashSales || 0) +
    (entry.upiSales || 0) +
    (entry.cardSales || 0) +
    (entry.creditSales || 0)
  );
}

export function totalOfflineSales(entry) {
  if (!entry) return 0;
  return (entry.cashSales || 0) + (entry.upiSales || 0) + (entry.cardSales || 0) + (entry.creditSales || 0);
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
  "on-time": "bg-green-100 text-green-700",
  late: "bg-amber-100 text-amber-700",
  "not-logged": "bg-red-100 text-red-700",
  unset: "bg-slate-100 text-slate-500",
};
