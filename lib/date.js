// All "today"/"now" logic in this app uses IST (Asia/Kolkata) regardless of
// the device or browser's local timezone. The business runs on IST; a
// browser-local "today" would silently shift the day boundary for anyone
// accessing the app from a different timezone (including a phone with the
// wrong timezone setting).

const IST_TIME_ZONE = "Asia/Kolkata";

function istPartsNow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return { year: Number(map.year), month: Number(map.month), day: Number(map.day) };
}

// "YYYY-MM-DD" for the current date in IST.
export function todayStr() {
  const { year, month, day } = istPartsNow();
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// "YYYY-MM-DD" for yesterday, computed from IST's current date.
export function yesterdayStr() {
  const { year, month, day } = istPartsNow();
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// "YYYY-MM-DD" for the first of the current month, IST.
export function firstOfMonthStr() {
  const { year, month } = istPartsNow();
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

// Current time as "HH:MM" in IST, 24hr. Used for default time-field values.
export function nowTimeIST() {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: IST_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
}

// Converts a stored "YYYY-MM-DD" string to "DD/MM/YYYY" for display.
// This is a pure string reformat, not a timezone conversion, since the
// stored date string has no time component to begin with. Used everywhere
// a date is shown as text; <input type="date"> elements keep the native
// ISO value since the browser handles their on-screen formatting itself.
export function formatDMY(isoDateStr) {
  if (!isoDateStr) return "";
  const [y, m, d] = isoDateStr.split("-");
  if (!y || !m || !d) return isoDateStr;
  return `${d}/${m}/${y}`;
}

// Shorter "DD/MM" form for chart axis ticks, where full years would crowd
// the axis.
export function formatDM(isoDateStr) {
  if (!isoDateStr) return "";
  const [, m, d] = isoDateStr.split("-");
  if (!m || !d) return isoDateStr;
  return `${d}/${m}`;
}
