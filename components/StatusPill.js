import { OPENING_STATUS_LABEL, OPENING_STATUS_COLOR, OPENING_STATUS_DOT } from "@/lib/calc";

export default function StatusPill({ status }) {
  if (status === "unset") return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border transition-transform duration-150 hover:scale-105 ${OPENING_STATUS_COLOR[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${OPENING_STATUS_DOT[status]}`} />
      {OPENING_STATUS_LABEL[status]}
    </span>
  );
}
